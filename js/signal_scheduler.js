// ── SIGNAL SCHEDULER — autonomous cadence layer ──
// Lightweight, browser-safe, additive. Drives rule evaluation on cadence
// without polling storms, duplicate runs, or interfering with the existing app.
//
// Doctrine:
//   * No setInterval bombing — one master tick per minute, dispatches by cadence.
//   * Cooldown-aware: each cadence remembers its last successful run; won't
//     re-run inside its own period even across page reloads (uses localStorage).
//   * Heartbeat-driven: every dispatch updates a heartbeat record consumed by
//     SignalTrust to surface "scheduler healthy / stalled" to operators.
//   * Worker-portable: the dispatch core (computeDueCadences, recordHeartbeat)
//     is environment-agnostic. The browser timer is the only thing that has
//     to change for a Cloudflare Worker host.
//
// Public API:
//   SignalScheduler.start({ tickMs?, cadences? })
//   SignalScheduler.stop()
//   SignalScheduler.tickNow()             force one dispatch
//   SignalScheduler.heartbeat()           latest heartbeat snapshot
//   SignalScheduler.lastRun(cadence)      ISO of last successful run for cadence
//   SignalScheduler.dueIn(cadence)        ms until next run (negative = overdue)
//
// Cadences supported out of the box: 'hourly', 'daily', 'weekly'.

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  const SE = global.SignalEngine;
  if(!RT || !SE){ console.warn('[signals] scheduler: runtime/engine missing'); return; }

  const STORE_KEY = 'sigsched_v1';
  const HEARTBEAT_KEY = 'sigsched_heartbeat_v1';

  const DEFAULT_CADENCES = Object.freeze({
    hourly: 60 * 60 * 1000,
    daily:  24 * 60 * 60 * 1000,
    weekly:  7 * 24 * 60 * 60 * 1000,
  });

  let TIMER = null;
  let CONFIG = { tickMs: 60 * 1000, cadences: { ...DEFAULT_CADENCES } };
  let RUNNING = false; // re-entrancy guard
  let LAST_HEARTBEAT = null;

  function readStore(){
    try{
      const raw = (global.localStorage || {}).getItem ? global.localStorage.getItem(STORE_KEY) : null;
      return raw ? JSON.parse(raw) : {};
    }catch(_){ return {}; }
  }
  function writeStore(obj){
    try{
      if(global.localStorage && global.localStorage.setItem){
        global.localStorage.setItem(STORE_KEY, JSON.stringify(obj));
      }
    }catch(_){}
  }
  function readHeartbeat(){
    try{
      const raw = (global.localStorage || {}).getItem ? global.localStorage.getItem(HEARTBEAT_KEY) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed || LAST_HEARTBEAT;
    }catch(_){ return LAST_HEARTBEAT; }
  }
  function writeHeartbeat(hb){
    LAST_HEARTBEAT = hb;
    try{
      if(global.localStorage && global.localStorage.setItem){
        global.localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(hb));
      }
    }catch(_){}
  }

  function lastRun(cadence){
    const s = readStore();
    return s[cadence] ? new Date(s[cadence]).toISOString() : null;
  }

  function dueIn(cadence){
    const interval = CONFIG.cadences[cadence];
    if(!interval) return Infinity;
    const s = readStore();
    const last = s[cadence] ? new Date(s[cadence]).getTime() : 0;
    return interval - (Date.now() - last);
  }

  // Pure: given last-run map + now + intervals, return cadences that are due.
  // Exported on the object for worker reuse.
  function computeDueCadences(lastMap, intervals, now){
    const due = [];
    for(const c of Object.keys(intervals)){
      const last = lastMap[c] ? new Date(lastMap[c]).getTime() : 0;
      if((now - last) >= intervals[c]) due.push(c);
    }
    return due;
  }

  async function tickNow(){
    if(RUNNING) return { ok:false, reason:'busy' };
    RUNNING = true;
    const startedAt = Date.now();
    const store = readStore();
    const due = computeDueCadences(store, CONFIG.cadences, startedAt);
    const results = [];
    try{
      for(const cadence of due){
        try{
          const out = await SE.evaluateAll({ cadence });
          store[cadence] = new Date().toISOString();
          results.push({ cadence, ok:true, rules: out.length,
            emitted: out.reduce((a,r) => a + (r.emitted||0), 0) });
        }catch(e){
          results.push({ cadence, ok:false, error: e.message || String(e) });
        }
      }
      writeStore(store);
      const hb = {
        ticked_at: new Date(startedAt).toISOString(),
        finished_at: new Date().toISOString(),
        cadences_dispatched: due,
        cadences_due_count: due.length,
        results,
        next_due: Object.fromEntries(Object.keys(CONFIG.cadences).map(c => [c, dueIn(c)])),
      };
      writeHeartbeat(hb);
      return { ok:true, dispatched: due, results };
    } finally {
      RUNNING = false;
    }
  }

  function start(opts){
    if(opts && opts.tickMs) CONFIG.tickMs = opts.tickMs;
    if(opts && opts.cadences) CONFIG.cadences = { ...CONFIG.cadences, ...opts.cadences };
    if(TIMER) clearInterval(TIMER);
    // Fire one immediate tick (non-blocking) so first load gets fresh signals.
    Promise.resolve().then(() => tickNow().catch(()=>{}));
    TIMER = setInterval(() => { tickNow().catch(()=>{}); }, CONFIG.tickMs);
    return { ok:true, tickMs: CONFIG.tickMs, cadences: Object.keys(CONFIG.cadences) };
  }

  function stop(){
    if(TIMER){ clearInterval(TIMER); TIMER = null; }
    return { ok:true };
  }

  function heartbeat(){ return readHeartbeat(); }

  global.SignalScheduler = {
    start, stop, tickNow,
    heartbeat, lastRun, dueIn,
    // Exposed for worker reuse / testing.
    _pure: { computeDueCadences },
    _config: () => ({ ...CONFIG }),
  };

  // Auto-start under the main app only (avoid double-starts in standalone pages).
  function autoBoot(){
    if(global.__SIGNAL_SCHEDULER_AUTOSTART__ === false) return;
    // Standalone pages (mobile-ops.html etc.) call SignalRulesPhase1.runAll() once
    // explicitly; they should NOT autostart a tick loop.
    if(global.location && /mobile-ops\.html/.test(String(global.location.pathname))) return;
    start({});
  }
  if(typeof document !== 'undefined'){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', autoBoot);
    } else { autoBoot(); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
