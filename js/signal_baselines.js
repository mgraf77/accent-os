// ── SIGNAL BASELINES — refresh & access ──
// Pre-computes per-metric rolling statistics consumed by delta-driven rules.
// Backed by sql/M49_signals_schema.sql `signal_baselines` table.
//
// Doctrine:
//   * Pure pre-compute. Rules NEVER recompute baselines at signal-eval time.
//   * Replay-safe: every baseline row carries computed_at; rules can ask
//     "what was the baseline at T?" by selecting the latest row before T.
//   * Incremental where possible: weekly/daily refresh maintains rolling
//     windows; full recompute is rare and explicit.
//   * Worker-portable: the math lives in pure helpers exported on the
//     object so a Cloudflare Worker can run the same refresh on cron.
//
// Phase 1 metrics:
//   quote.time_to_close_days          (entity '_global_')
//   vendor.score                      (per vendor)
//   vendor.lead_time_days             (per vendor)
//   ecom.conversion_rate              (entity 'storefront')
//   inventory.days_of_cover           (per sku, watchlist only)
//
// Windows: 7, 30, 90 days. (180+ for drift will arrive with margin metrics.)
//
// Public API:
//   SignalBaselines.refreshAll()                  refresh every Phase 1 metric
//   SignalBaselines.refreshOne(metric_key)        targeted refresh
//   SignalBaselines.get(metric_key, entity_id?, window_days?)  pre-loaded cache lookup
//   SignalBaselines.hydrate()                     load existing baselines into memory
//   SignalBaselines.health()                      freshness summary

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  if(!RT){ console.warn('[signals] baselines: runtime missing'); return; }

  const WINDOWS = [7, 30, 90];
  const STALE_MS = 36 * 60 * 60 * 1000; // 36h: baselines older than this are flagged

  // In-memory cache: key = `${metric_key}::${entity_id}::${window_days}`
  let CACHE = Object.create(null);
  let LAST_REFRESH_AT = null;

  function _key(m, e, w){ return `${m}::${e || '_global_'}::${w}`; }

  function sbReady(){
    return typeof global.sbConfigured === 'function' && global.sbConfigured();
  }

  async function _upsertBaseline(row){
    if(!sbReady()) return;
    try{
      await global.sbFetch('/signal_baselines?on_conflict=metric_key,entity_id,window_days', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Prefer':'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(row),
      });
    }catch(e){
      console.warn('[baselines] upsert failed', e.message||e);
    }
  }

  // ── Pure math (worker-portable, side-effect-free) ──
  function _stats(values){
    const arr = values.filter(Number.isFinite).slice().sort((a,b)=>a-b);
    if(!arr.length) return null;
    const n = arr.length;
    const median = arr[Math.floor(n/2)];
    const mean = arr.reduce((a,b)=>a+b,0)/n;
    const mad  = (function(){
      const d = arr.map(x => Math.abs(x - median)).sort((a,b)=>a-b);
      return d[Math.floor(d.length/2)] || 0;
    })();
    const variance = arr.reduce((a,b)=>a+(b-mean)*(b-mean),0)/n;
    return { median, mad, mean, stddev: Math.sqrt(variance), sample_count: n };
  }

  function _windowSlice(records, days, valueFn){
    if(!Array.isArray(records)) return [];
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    return records
      .filter(r => r && r.__ts >= cutoff)
      .map(valueFn)
      .filter(Number.isFinite);
  }

  // ── Metric extractors ──
  // Each returns: { perEntityRecords: { entity_id -> [{__ts, value}, ...] } }
  // entity_id '_global_' is used for storefront/pipeline-level metrics.
  function _extractQuoteTimeToClose(){
    const quotes = Array.isArray(global.QUOTES) ? global.QUOTES : [];
    const arr = quotes
      .filter(q => q.created_at && q.closed_at)
      .map(q => ({
        __ts: new Date(q.closed_at).getTime(),
        value: (new Date(q.closed_at) - new Date(q.created_at)) / (24*3600*1000),
      }))
      .filter(r => r.value >= 0 && r.value < 365 && Number.isFinite(r.__ts));
    return { _global_: arr };
  }

  function _extractVendorScore(){
    const vendors = Array.isArray(global.VD) ? global.VD : [];
    const out = {};
    for(const v of vendors){
      const id = String(v.id || v.vendor_id || v.name || '');
      if(!id) continue;
      const hist = v.score_history || [];
      out[id] = hist
        .filter(h => h && h.ts && Number.isFinite(Number(h.score)))
        .map(h => ({ __ts: new Date(h.ts).getTime(), value: Number(h.score) }));
    }
    return out;
  }

  function _extractVendorLeadTime(){
    const vendors = Array.isArray(global.VD) ? global.VD : [];
    const out = {};
    for(const v of vendors){
      const id = String(v.id || v.vendor_id || v.name || '');
      if(!id) continue;
      const hist = v.lead_time_history || [];
      out[id] = hist
        .filter(h => h && h.ts && Number.isFinite(Number(h.lead_time_days)))
        .map(h => ({ __ts: new Date(h.ts).getTime(), value: Number(h.lead_time_days) }));
    }
    return out;
  }

  function _extractEcomConversion(){
    const series = Array.isArray(global.ECOM_DAILY) ? global.ECOM_DAILY : [];
    const arr = series
      .filter(d => d && d.date && Number.isFinite(Number(d.conversion_rate)))
      .map(d => ({ __ts: new Date(d.date).getTime(), value: Number(d.conversion_rate) }));
    return { storefront: arr };
  }

  function _extractInventoryDaysOfCover(){
    // Watchlist only — pulled from a global WATCHLIST_SKUS if present, else
    // top-50 by recent demand. This keeps the table small.
    const inv = Array.isArray(global.INVENTORY) ? global.INVENTORY : [];
    const watch = Array.isArray(global.WATCHLIST_SKUS) ? new Set(global.WATCHLIST_SKUS)
      : new Set(inv
          .filter(it => Number(it.demand_30d ?? it.velocity_30d ?? 0) > 0)
          .sort((a,b) => Number(b.demand_30d||0) - Number(a.demand_30d||0))
          .slice(0, 50)
          .map(it => String(it.sku || it.id)));
    const out = {};
    for(const it of inv){
      const sku = String(it.sku || it.id);
      if(!watch.has(sku)) continue;
      const hist = it.coverage_history || [];
      out[sku] = hist
        .filter(h => h && h.ts && Number.isFinite(Number(h.days_of_cover)))
        .map(h => ({ __ts: new Date(h.ts).getTime(), value: Number(h.days_of_cover) }));
    }
    return out;
  }

  const METRICS = [
    { key:'quote.time_to_close_days', extractor:_extractQuoteTimeToClose },
    { key:'vendor.score',             extractor:_extractVendorScore     },
    { key:'vendor.lead_time_days',    extractor:_extractVendorLeadTime  },
    { key:'ecom.conversion_rate',     extractor:_extractEcomConversion  },
    { key:'inventory.days_of_cover',  extractor:_extractInventoryDaysOfCover },
  ];

  async function refreshOne(metric_key){
    const m = METRICS.find(x => x.key === metric_key);
    if(!m) return { ok:false, reason:'unknown_metric' };
    const data = m.extractor();
    const now = new Date().toISOString();
    let upserts = 0;
    for(const entity_id of Object.keys(data)){
      const records = data[entity_id];
      for(const w of WINDOWS){
        const values = _windowSlice(records, w, r => r.value);
        const stats = _stats(values);
        if(!stats) continue;
        const row = {
          metric_key, entity_id, window_days: w,
          median: stats.median, mad: stats.mad,
          mean: stats.mean, stddev: stats.stddev,
          sample_count: stats.sample_count,
          computed_at: now,
        };
        CACHE[_key(metric_key, entity_id, w)] = row;
        await _upsertBaseline(row);
        upserts++;
      }
    }
    LAST_REFRESH_AT = now;
    return { ok:true, metric_key, upserts };
  }

  async function refreshAll(){
    const results = [];
    for(const m of METRICS){
      try{ results.push(await refreshOne(m.key)); }
      catch(e){ results.push({ ok:false, metric_key: m.key, error: e.message||String(e) }); }
    }
    return results;
  }

  async function hydrate(){
    CACHE = Object.create(null);
    if(!sbReady()) return { ok:false, reason:'no_supabase', loaded:0 };
    try{
      const rows = await global.sbFetch(
        '/signal_baselines?select=metric_key,entity_id,window_days,median,mad,mean,stddev,sample_count,computed_at'
      );
      const arr = Array.isArray(rows) ? rows : [];
      for(const r of arr){ CACHE[_key(r.metric_key, r.entity_id, r.window_days)] = r; }
      if(arr.length){
        LAST_REFRESH_AT = arr.reduce((acc, r) => (r.computed_at > acc ? r.computed_at : acc), '');
      }
      return { ok:true, loaded: arr.length };
    }catch(e){
      return { ok:false, error: e.message };
    }
  }

  function get(metric_key, entity_id, window_days){
    return CACHE[_key(metric_key, entity_id, window_days)] || null;
  }

  function health(){
    const entries = Object.values(CACHE);
    const now = Date.now();
    const ages = entries.map(b => now - new Date(b.computed_at).getTime());
    const oldest = ages.length ? Math.max(...ages) : null;
    const newest = ages.length ? Math.min(...ages) : null;
    const stale = entries.filter(b => (now - new Date(b.computed_at).getTime()) > STALE_MS).length;
    return {
      baseline_rows: entries.length,
      last_refresh_at: LAST_REFRESH_AT,
      oldest_age_ms: oldest,
      newest_age_ms: newest,
      stale_count: stale,
      stale_threshold_ms: STALE_MS,
    };
  }

  global.SignalBaselines = {
    refreshAll, refreshOne, hydrate, get, health,
    metrics: METRICS.map(m => m.key),
    _pure: { _stats, _windowSlice },
  };

  // Auto-hydrate baseline cache when DOM ready; do not auto-refresh
  // (refresh is the scheduler's job, on daily cadence).
  if(typeof document !== 'undefined'){
    const boot = () => { hydrate().catch(()=>{}); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
