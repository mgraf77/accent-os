// ── SIGNAL TRUST — freshness, health, confidence surface ──
// Tells operators whether to trust what they're seeing:
//   * Are rules running on schedule?
//   * Are baselines fresh?
//   * Are integrations alive?
//   * Are individual signals computed from stale data?
//
// Reads from SignalScheduler, SignalBaselines, SignalEngine.
// Renders a single status pill / detail panel surface.
//
// Public API:
//   SignalTrust.snapshot()                health structure for consumers
//   SignalTrust.renderPill(target)        compact pill: ● Healthy / ● Stale
//   SignalTrust.renderPanel(target)       full detail panel (scheduler/baseline/integration)

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  const SE = global.SignalEngine;
  if(!RT || !SE){ console.warn('[signals] trust: runtime/engine missing'); return; }

  const SCHED_STALE_MS    = 90 * 60 * 1000;       // hourly cadence, +30m slack
  const BASELINE_STALE_MS = 36 * 60 * 60 * 1000;  // daily cadence, +12h slack

  const COLOR = {
    healthy: { bg:'#16a34a', fg:'#fff', soft:'#f0fdf4', text:'#166534' },
    warn:    { bg:'#d97706', fg:'#fff', soft:'#fffbeb', text:'#92400e' },
    bad:     { bg:'#dc2626', fg:'#fff', soft:'#fef2f2', text:'#991b1b' },
    unknown: { bg:'#64748b', fg:'#fff', soft:'#f8fafc', text:'#475569' },
  };

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function ageLabel(ms){
    if(ms == null || !Number.isFinite(ms)) return '—';
    const m = Math.floor(ms/60000);
    if(m < 60) return `${m}m`;
    const h = Math.floor(m/60);
    if(h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  }

  function _schedulerHealth(){
    const hb = global.SignalScheduler && global.SignalScheduler.heartbeat();
    if(!hb) return { state:'unknown', reason:'no heartbeat yet', age_ms:null, last_at:null };
    const age = Date.now() - new Date(hb.ticked_at).getTime();
    const dueVals = Object.values(hb.next_due || {}).map(v => Number(v)).filter(Number.isFinite);
    const overdue = dueVals.length ? Math.min(...dueVals) : 0;
    const state = age > SCHED_STALE_MS || overdue < -SCHED_STALE_MS ? 'bad'
                : age > SCHED_STALE_MS/2 ? 'warn' : 'healthy';
    const errCount = (hb.results||[]).filter(r => r.ok === false).length;
    return {
      state: errCount ? (state === 'healthy' ? 'warn' : state) : state,
      age_ms: age,
      last_at: hb.ticked_at,
      cadences_dispatched: hb.cadences_dispatched || [],
      errors: errCount,
      next_due: hb.next_due || {},
    };
  }

  function _baselineHealth(){
    const SB = global.SignalBaselines;
    if(!SB || !SB.health) return { state:'unknown', reason:'no baselines module', age_ms:null };
    const h = SB.health();
    if(!h.baseline_rows) return { state:'unknown', reason:'no baselines yet', age_ms:null, rows:0 };
    const oldest = h.oldest_age_ms || 0;
    const state = oldest > BASELINE_STALE_MS ? 'bad'
                : oldest > BASELINE_STALE_MS/2 ? 'warn' : 'healthy';
    return {
      state,
      age_ms: oldest,
      last_at: h.last_refresh_at,
      rows: h.baseline_rows,
      stale_count: h.stale_count,
    };
  }

  function _integrationHealth(){
    const hb = Array.isArray(global.INTEGRATION_HEARTBEATS) ? global.INTEGRATION_HEARTBEATS : [];
    if(!hb.length) return { state:'unknown', reason:'no heartbeats', sources:[] };
    const sources = hb.map(h => {
      const age = h.last_success_at ? Date.now() - new Date(h.last_success_at).getTime() : Infinity;
      const tol = h.stale_tolerance_ms || (60*60*1000);
      const state = age > tol*2 ? 'bad' : age > tol ? 'warn' : 'healthy';
      return { source: h.source, state, age_ms: age, tol_ms: tol };
    });
    const worst = sources.some(s => s.state === 'bad') ? 'bad'
                : sources.some(s => s.state === 'warn') ? 'warn'
                : 'healthy';
    return { state: worst, sources };
  }

  function _ruleHealth(){
    // Open signals carry an audit. Without server-side stats, the cheap
    // proxy is: did we get any emissions in the last scheduler tick?
    const hb = global.SignalScheduler && global.SignalScheduler.heartbeat();
    if(!hb) return { state:'unknown', reason:'no heartbeat' };
    const totalEmitted = (hb.results||[]).reduce((a,r) => a + (r.emitted||0), 0);
    return {
      state: 'healthy',
      last_emitted: totalEmitted,
      last_at: hb.finished_at || hb.ticked_at,
      rules: (hb.results||[]).length,
    };
  }

  function snapshot(){
    const sched = _schedulerHealth();
    const base  = _baselineHealth();
    const integ = _integrationHealth();
    const rule  = _ruleHealth();
    const rank = { healthy:0, unknown:1, warn:2, bad:3 };
    const overall = [sched, base, integ, rule]
      .map(x => x.state)
      .reduce((acc, s) => (rank[s] > rank[acc] ? s : acc), 'healthy');
    return { overall, scheduler: sched, baselines: base, integrations: integ, rules: rule };
  }

  function _stateColor(s){ return COLOR[s] || COLOR.unknown; }
  function _label(s){
    return ({ healthy:'Healthy', warn:'Drifting', bad:'Stale', unknown:'Unknown' })[s] || 'Unknown';
  }

  function renderPill(target){
    const mount = typeof target === 'string' ? document.getElementById(target) : target;
    if(!mount) return;
    const s = snapshot();
    const c = _stateColor(s.overall);
    mount.innerHTML = `
      <span title="Signal trust: ${_label(s.overall)}" style="
        display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
        background:${c.soft};color:${c.text};border:1px solid ${c.bg}40;
        border-radius:14px;font-size:11px;font-weight:600;font-family:'Outfit',sans-serif;">
        <span style="width:8px;height:8px;border-radius:50%;background:${c.bg};"></span>
        Signals: ${_label(s.overall)}
      </span>`;
    mount.style.cursor = 'pointer';
    mount.title = 'Click for detail';
    mount.addEventListener('click', () => {
      const panel = document.getElementById('signalTrustPanel');
      if(panel) renderPanel(panel);
    }, { once:false });
  }

  function _row(title, h){
    const c = _stateColor(h.state);
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #f1f5f9;">
        <span style="width:10px;height:10px;border-radius:50%;background:${c.bg};"></span>
        <span style="font-size:12px;font-weight:600;color:#1a1a1a;min-width:110px;">${esc(title)}</span>
        <span style="font-size:11px;color:#64748b;flex:1;">
          ${esc(_label(h.state))}${h.age_ms != null ? ` · last ${ageLabel(h.age_ms)} ago` : ''}
          ${h.rows != null ? ` · ${h.rows} rows` : ''}
          ${h.errors ? ` · ${h.errors} error${h.errors>1?'s':''}` : ''}
        </span>
      </div>`;
  }

  function renderPanel(target){
    const mount = typeof target === 'string' ? document.getElementById(target) : target;
    if(!mount) return;
    const s = snapshot();
    const c = _stateColor(s.overall);
    const sources = (s.integrations.sources||[]);
    mount.innerHTML = `
      <div style="background:#fff;border:1px solid #e8e8e4;border-left:4px solid ${c.bg};
        border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;">SIGNAL TRUST</span>
          <span style="background:${c.bg};color:${c.fg};font-size:10px;font-weight:700;
            padding:2px 6px;border-radius:3px;">${_label(s.overall).toUpperCase()}</span>
          <button id="sigTrustRefresh" style="margin-left:auto;background:#fff;
            border:1px solid #e8e8e4;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;">↻</button>
        </div>
        ${_row('Scheduler',     s.scheduler)}
        ${_row('Baselines',     s.baselines)}
        ${_row('Integrations',  s.integrations)}
        ${_row('Rule emissions',s.rules)}
        ${sources.length ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9;">
            <div style="font-size:10px;font-weight:700;letter-spacing:.5px;color:#94a3b8;margin-bottom:4px;">SOURCE FRESHNESS</div>
            ${sources.map(src => {
              const cc = _stateColor(src.state);
              return `<div style="display:inline-flex;align-items:center;gap:6px;margin:2px 6px 2px 0;
                padding:3px 8px;background:${cc.soft};color:${cc.text};border-radius:10px;font-size:11px;">
                <span style="width:6px;height:6px;border-radius:50%;background:${cc.bg};"></span>
                ${esc(src.source)} · ${ageLabel(src.age_ms)}</div>`;
            }).join('')}
          </div>` : ''}
      </div>`;
    const btn = mount.querySelector('#sigTrustRefresh');
    if(btn) btn.addEventListener('click', async () => {
      if(global.SignalScheduler) await global.SignalScheduler.tickNow();
      if(global.SignalBaselines) await global.SignalBaselines.hydrate();
      renderPanel(mount);
    });
  }

  global.SignalTrust = { snapshot, renderPill, renderPanel };

  function autoBoot(){
    const pill = document.getElementById('signalTrustPill');
    if(pill) renderPill(pill);
    const panel = document.getElementById('signalTrustPanel');
    if(panel) renderPanel(panel);
  }
  if(typeof document !== 'undefined'){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoBoot);
    else autoBoot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
