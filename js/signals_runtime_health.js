// js/signals_runtime_health.js
// Lightweight, additive runtime-side health surface.
//
// Exposes:  window.__SIGNAL_RUNTIME_HEALTH__()
//
// Returns a flat snapshot:
//   {
//     ok: boolean,                       // overall green-ness
//     fetched_at: ISO string,
//     worker_running: boolean,
//     last_run_at: ISO string | null,
//     last_run_age_ms: number | null,    // null if never run
//     queue_depth_pending: number | null,
//     oldest_pending_at: ISO string | null,
//     oldest_pending_age_ms: number | null,
//     dead_letter_count: number | null,
//     replay_skipped: number,
//     errors_recent: string | null,
//     counters: {...}                    // raw COUNTERS reference
//   }
//
// Design constraints (per Session 36 doctrine):
//   - additive, no behavior change to runtime
//   - no dependencies beyond window.SIGNALS
//   - degrades to ok:false + reason on missing surface
//   - never throws; failures land in .errors_recent
//   - cheap: at most one metrics() call per invocation
//
// Heartbeat threshold (last_run_age_ms): 60_000 ms by default.
// Override by setting window.__SIGNAL_RUNTIME_HEALTH_HEARTBEAT_MS__.

(function(){
  'use strict';
  const DEFAULT_HEARTBEAT_MS = 60 * 1000;

  function _ageMs(iso){
    if(!iso) return null;
    const t = Date.parse(iso);
    if(Number.isNaN(t)) return null;
    return Date.now() - t;
  }

  async function snapshot(){
    const out = {
      ok: false,
      fetched_at: new Date().toISOString(),
      worker_running: false,
      last_run_at: null,
      last_run_age_ms: null,
      queue_depth_pending: null,
      oldest_pending_at: null,
      oldest_pending_age_ms: null,
      dead_letter_count: null,
      replay_skipped: 0,
      errors_recent: null,
      counters: null,
      _reason: null
    };

    if(typeof window.SIGNALS !== 'object' || !window.SIGNALS){
      out._reason = 'window.SIGNALS not present';
      return out;
    }
    if(typeof window.SIGNALS.metrics !== 'function'){
      out._reason = 'window.SIGNALS.metrics missing';
      return out;
    }

    let m = null;
    try { m = await window.SIGNALS.metrics(); }
    catch(e){
      out._reason = 'metrics() threw: ' + (e && e.message || e);
      return out;
    }

    const live = (m && m.live) || {};
    const snap = (m && m.snapshot) || {};

    out.counters             = live;
    out.worker_running       = !!live.worker_running;
    out.last_run_at          = live.last_run_at || null;
    out.last_run_age_ms      = _ageMs(out.last_run_at);
    out.replay_skipped       = live.effects_skipped_replay || 0;
    out.errors_recent        = live.last_error || null;

    // Snapshot fields are best-effort; sig_metrics shape may vary.
    out.queue_depth_pending  = (typeof snap.queue_depth_pending === 'number') ? snap.queue_depth_pending : null;
    out.oldest_pending_at    = snap.oldest_pending_at || null;
    out.oldest_pending_age_ms= _ageMs(out.oldest_pending_at);
    out.dead_letter_count    = (typeof snap.dead_letter_count === 'number')
      ? snap.dead_letter_count
      : ((typeof live.dead_lettered === 'number') ? live.dead_lettered : null);

    const heartbeat_ms = (typeof window.__SIGNAL_RUNTIME_HEALTH_HEARTBEAT_MS__ === 'number')
      ? window.__SIGNAL_RUNTIME_HEALTH_HEARTBEAT_MS__
      : DEFAULT_HEARTBEAT_MS;

    // ok ⇔ runtime is exporting metrics, no recent error, AND
    // (no run yet OR last run within heartbeat).
    const heartbeat_ok = (out.last_run_age_ms === null) || (out.last_run_age_ms <= heartbeat_ms);
    out.ok = !out.errors_recent && heartbeat_ok;
    return out;
  }

  // Expose as a callable (async). Also keep last snapshot for cheap reads.
  window.__SIGNAL_RUNTIME_HEALTH__ = snapshot;
  window.__SIGNAL_RUNTIME_HEALTH_LAST__ = null;

  // Convenience: cache last snapshot on each call.
  const _orig = window.__SIGNAL_RUNTIME_HEALTH__;
  window.__SIGNAL_RUNTIME_HEALTH__ = async function(){
    const s = await _orig();
    window.__SIGNAL_RUNTIME_HEALTH_LAST__ = s;
    return s;
  };
})();
