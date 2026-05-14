// ── SIGNAL RULES — Phase 1 ──
// Concrete rule implementations for the Phase 1 signal set.
//
// Categories covered (Phase 1 scope):
//   * inventory risk    — stockout active/imminent, negative on-hand, dead-stock aging
//   * quote stagnation  — stale open quotes, velocity slowdown
//   * vendor health     — score deteriorating, lead-time drift
//   * integration fail  — export missed, integration down
//   * cache staleness   — source cache stale
//   * ecommerce         — conversion drop, checkout error spike, product 404
//
// Rules are pure: they read from globals already hydrated by other modules
// (INVENTORY, QUOTES, VD/vendor data, etc.) plus baselines. They return
// candidate emission records — they do NOT write directly.

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  const SE = global.SignalEngine;
  if(!RT || !SE){ console.warn('[signals] rules: runtime/engine missing'); return; }
  const S = RT.SEVERITY;

  // ─── 1. Registry: declare every Phase 1 signal up-front ───
  const PHASE1_DEFS = [
    // Inventory
    { signal_name:'inv.stockout_active',    category:'inventory',   severity:S.CRIT, owner_role:'purchasing', source_system:'windward',
      entity_type:'sku', recommended_action:'Expedite PO or substitute SKU' },
    { signal_name:'inv.stockout_imminent',  category:'inventory',   severity:S.ELEV, owner_role:'purchasing', source_system:'windward',
      entity_type:'sku', recommended_action:'Issue PO today; cover < lead time' },
    { signal_name:'inv.negative_on_hand',   category:'inventory',   severity:S.CRIT, owner_role:'warehouse',  source_system:'windward',
      entity_type:'sku', recommended_action:'Reconcile immediately; lock from oversell' },
    { signal_name:'inv.dead_stock_aging',   category:'inventory',   severity:S.WARN, owner_role:'owner',      source_system:'derived',
      entity_type:'sku', recommended_action:'Markdown or liquidate; capital tied up' },

    // Quotes
    { signal_name:'quote.stale_open',       category:'quote',       severity:S.WARN, owner_role:'sales',      source_system:'internal',
      entity_type:'quote', recommended_action:'Follow up or close out' },
    { signal_name:'quote.velocity_slowing', category:'quote',       severity:S.ELEV, owner_role:'sales',      source_system:'derived',
      entity_type:'pipeline', recommended_action:'Review pipeline; close-rate slowing' },

    // Vendor
    { signal_name:'vendor.score_deteriorating', category:'vendor_health', severity:S.ELEV, owner_role:'purchasing', source_system:'derived',
      entity_type:'vendor', recommended_action:'Schedule vendor review' },
    { signal_name:'vendor.lead_time_drift',     category:'vendor_health', severity:S.WARN, owner_role:'purchasing', source_system:'derived',
      entity_type:'vendor', recommended_action:'Update planning lead time' },

    // System / integration
    { signal_name:'sys.export_missed',     category:'system_health', severity:S.CRIT, owner_role:'sysops', source_system:'internal',
      entity_type:'integration', recommended_action:'Retry export; check source credentials' },
    { signal_name:'sys.integration_down',  category:'system_health', severity:S.CRIT, owner_role:'sysops', source_system:'internal',
      entity_type:'integration', recommended_action:'Page sysops; check upstream' },
    { signal_name:'sys.cache_stale',       category:'system_health', severity:S.ELEV, owner_role:'sysops', source_system:'internal',
      entity_type:'cache',       recommended_action:'Force refresh; investigate ingestion' },

    // Ecommerce
    { signal_name:'ecom.conversion_drop',     category:'ecommerce', severity:S.ELEV, owner_role:'ecommerce', source_system:'bigcommerce',
      entity_type:'storefront', recommended_action:'Diagnose: site/catalog/marketing changes in last 7d' },
    { signal_name:'ecom.checkout_error_spike',category:'ecommerce', severity:S.CRIT, owner_role:'ecommerce', source_system:'bigcommerce',
      entity_type:'storefront', recommended_action:'Page ecommerce + sysops; investigate checkout flow' },
    { signal_name:'ecom.product_404',         category:'ecommerce', severity:S.WARN, owner_role:'ecommerce', source_system:'derived',
      entity_type:'sku', recommended_action:'Republish or unpublish PDP' },
  ];

  PHASE1_DEFS.forEach(d => RT.registerSignal({ stale_tolerance_ms: 60*60*1000, ...d }));

  // ─── 2. Helpers ───
  function ageDays(iso){
    if(!iso) return null;
    return (Date.now() - new Date(iso).getTime()) / (24*3600*1000);
  }
  function safe(arr){ return Array.isArray(arr) ? arr : []; }

  // ─── 3. Rules (scheduled) ───

  // Inventory rules — read from INVENTORY global hydrated by inventory.js.
  SE.registerRule({
    id: 'rule.inv.stockouts',
    cadence: 'hourly',
    async evaluate(){
      const inv = safe(global.INVENTORY);
      const out = [];
      for(const it of inv){
        const onHand = Number(it.on_hand ?? it.qty_on_hand ?? 0);
        const demand30 = Number(it.demand_30d ?? it.velocity_30d ?? 0);
        const leadTime = Number(it.lead_time_days ?? 14);
        const id = String(it.sku || it.id || '');
        if(!id) continue;

        if(onHand < 0){
          out.push({
            signal_name:'inv.negative_on_hand',
            entity_id:id,
            trigger_snapshot:{ on_hand:onHand, sku:id, item:it.name||null },
          });
          continue;
        }
        if(onHand === 0 && demand30 > 0){
          out.push({
            signal_name:'inv.stockout_active',
            entity_id:id,
            trigger_snapshot:{ on_hand:0, demand_30d:demand30, sku:id },
          });
          continue;
        }
        if(demand30 > 0){
          const dailyDemand = demand30 / 30;
          const daysOfCover = dailyDemand > 0 ? onHand / dailyDemand : Infinity;
          if(Number.isFinite(daysOfCover) && daysOfCover < leadTime){
            out.push({
              signal_name:'inv.stockout_imminent',
              entity_id:id,
              trigger_snapshot:{ on_hand:onHand, days_of_cover:Math.round(daysOfCover*10)/10, lead_time:leadTime, sku:id },
            });
          }
        }
      }
      return out;
    },
  });

  SE.registerRule({
    id: 'rule.inv.dead_stock',
    cadence: 'weekly',
    async evaluate(){
      const inv = safe(global.INVENTORY);
      const out = [];
      const THRESHOLD_DAYS = 180;
      const VALUE_FLOOR = 250;
      for(const it of inv){
        const lastSale = it.last_sale_at || it.last_sold_at;
        const onHand = Number(it.on_hand ?? 0);
        const cost = Number(it.avg_cost ?? it.cost ?? 0);
        const value = onHand * cost;
        const age = ageDays(lastSale);
        if(age != null && age > THRESHOLD_DAYS && value > VALUE_FLOOR){
          out.push({
            signal_name:'inv.dead_stock_aging',
            entity_id:String(it.sku || it.id),
            trigger_snapshot:{ days_since_sale:Math.round(age), value:Math.round(value), on_hand:onHand },
          });
        }
      }
      return out;
    },
  });

  // Quote rules — read QUOTES global hydrated by customers/quotes module.
  SE.registerRule({
    id: 'rule.quote.stale',
    cadence: 'daily',
    async evaluate(){
      const quotes = safe(global.QUOTES);
      const out = [];
      const STALE_DAYS = 14;
      const MIN_VALUE = 500;
      for(const q of quotes){
        const status = (q.status || '').toLowerCase();
        if(status && !['open','sent','pending','draft'].includes(status)) continue;
        const lastTouch = q.updated_at || q.created_at;
        const age = ageDays(lastTouch);
        const total = Number(q.total ?? q.amount ?? 0);
        if(age != null && age > STALE_DAYS && total >= MIN_VALUE){
          out.push({
            signal_name:'quote.stale_open',
            entity_id:String(q.id),
            trigger_snapshot:{ age_days:Math.round(age), total, customer:q.customer_name||null },
          });
        }
      }
      return out;
    },
  });

  SE.registerRule({
    id: 'rule.quote.velocity',
    cadence: 'weekly',
    async evaluate({ baselines } = {}){
      const quotes = safe(global.QUOTES);
      if(quotes.length < 20) return []; // volume gate
      const closedTimes = quotes
        .filter(q => q.closed_at && q.created_at)
        .map(q => (new Date(q.closed_at) - new Date(q.created_at)) / (24*3600*1000))
        .filter(d => d >= 0 && d < 365);

      if(closedTimes.length < 25) return [];
      const recent = closedTimes.slice(-30);
      const baseline = closedTimes.slice(-90);
      const recentMed = RT.delta.median(recent);
      const baseMed   = RT.delta.median(baseline);
      if(recentMed == null || baseMed == null) return [];
      if(RT.delta.velocity(recentMed, baseMed, 1.3)){
        return [{
          signal_name:'quote.velocity_slowing',
          entity_id:'_pipeline_',
          trigger_snapshot:{
            recent_median_days: Math.round(recentMed*10)/10,
            baseline_median_days: Math.round(baseMed*10)/10,
            ratio: Math.round((recentMed/baseMed)*100)/100,
          },
        }];
      }
      return [];
    },
  });

  // Vendor rules — read VD (vendor data) global.
  SE.registerRule({
    id: 'rule.vendor.score_drift',
    cadence: 'weekly',
    async evaluate(){
      const vendors = safe(global.VD);
      const out = [];
      for(const v of vendors){
        const s30 = Number(v.score_30d ?? v.score);
        const s90 = Number(v.score_90d ?? v.score);
        if(!Number.isFinite(s30) || !Number.isFinite(s90)) continue;
        if(s90 - s30 >= 10){
          out.push({
            signal_name:'vendor.score_deteriorating',
            entity_id:String(v.id || v.vendor_id || v.name),
            trigger_snapshot:{ score_30d:s30, score_90d:s90, delta:s30-s90, vendor:v.name||null },
          });
        }
        const lt30 = Number(v.lead_time_30d);
        const ltBase = Number(v.lead_time_baseline);
        if(Number.isFinite(lt30) && Number.isFinite(ltBase) && ltBase > 0 && lt30 > ltBase * 1.25){
          out.push({
            signal_name:'vendor.lead_time_drift',
            entity_id:String(v.id || v.vendor_id || v.name),
            trigger_snapshot:{ lead_time_30d:lt30, baseline:ltBase, ratio:Math.round((lt30/ltBase)*100)/100, vendor:v.name||null },
          });
        }
      }
      return out;
    },
  });

  // System / integration rules — read from global.INTEGRATION_HEARTBEATS if present.
  // Shape expected: { source: 'windward'|'bigcommerce'|..., last_success_at, expected_interval_ms, stale_tolerance_ms }
  SE.registerRule({
    id: 'rule.sys.integrations',
    cadence: 'hourly',
    async evaluate(){
      const hb = safe(global.INTEGRATION_HEARTBEATS);
      const out = [];
      const now = Date.now();
      for(const h of hb){
        const last = h.last_success_at ? new Date(h.last_success_at).getTime() : 0;
        const age = now - last;
        if(h.expected_interval_ms && age > h.expected_interval_ms * 2){
          out.push({
            signal_name:'sys.integration_down',
            entity_id: h.source,
            trigger_snapshot:{ source:h.source, last_success_at:h.last_success_at, age_ms:age },
          });
        }
        if(h.stale_tolerance_ms && age > h.stale_tolerance_ms){
          out.push({
            signal_name:'sys.cache_stale',
            entity_id: h.source,
            trigger_snapshot:{ source:h.source, age_ms:age, tolerance_ms:h.stale_tolerance_ms },
          });
        }
        if(h.export_missed){
          out.push({
            signal_name:'sys.export_missed',
            entity_id: h.source,
            trigger_snapshot:{ source:h.source, missed_at:h.export_missed },
          });
        }
      }
      return out;
    },
  });

  // Ecommerce rules — read from ecommerce_intelligence globals if present.
  // Shape expected: global.ECOM_KPI = { sessions_1h, sessions_24h, conv_7d, conv_30d, checkout_errors_1h, checkout_sessions_1h }
  SE.registerRule({
    id: 'rule.ecom.conversion',
    cadence: 'daily',
    async evaluate(){
      const k = global.ECOM_KPI;
      if(!k) return [];
      const out = [];
      if(Number.isFinite(k.conv_7d) && Number.isFinite(k.conv_30d)
         && k.sessions_7d >= 200
         && RT.delta.deterioration(k.conv_7d, k.conv_30d, 0.8, 0.005)){
        out.push({
          signal_name:'ecom.conversion_drop',
          entity_id:'storefront',
          trigger_snapshot:{ conv_7d:k.conv_7d, conv_30d:k.conv_30d, sessions_7d:k.sessions_7d },
        });
      }
      if(Number.isFinite(k.checkout_errors_1h) && k.checkout_sessions_1h >= 25){
        const rate = k.checkout_errors_1h / k.checkout_sessions_1h;
        if(rate > 0.02){
          out.push({
            signal_name:'ecom.checkout_error_spike',
            entity_id:'storefront',
            trigger_snapshot:{ error_rate:Math.round(rate*1000)/10, errors:k.checkout_errors_1h, sessions:k.checkout_sessions_1h },
          });
        }
      }
      return out;
    },
  });

  SE.registerRule({
    id: 'rule.ecom.product_404',
    cadence: 'hourly',
    async evaluate(){
      const broken = safe(global.ECOM_BROKEN_PDP);
      return broken.map(p => ({
        signal_name:'ecom.product_404',
        entity_id:String(p.sku || p.product_id),
        trigger_snapshot:{ url:p.url||null, sku:p.sku||null, last_checked:p.checked_at||null },
      }));
    },
  });

  // ─── 4. Convenience runner ───
  global.SignalRulesPhase1 = {
    defs: PHASE1_DEFS.map(d => d.signal_name),
    runScheduled: async (cadence) => SE.evaluateAll({ cadence }),
    runAll: async () => SE.evaluateAll({}),
  };
})(typeof window !== 'undefined' ? window : globalThis);
