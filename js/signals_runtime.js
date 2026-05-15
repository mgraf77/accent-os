// js/signals_runtime.js — Minimal SQL-Backed Signal Runtime
// ─────────────────────────────────────────────────────────────────────────────
// Additive only. Talks to RPCs defined in sql/M49_signal_runtime_schema.sql.
// Uses sbFetch (defined in index.html) for transport. No frameworks.
//
// Surfaces:
//   window.SIGNALS = { enqueue, claim, finalize, retry, deadLetter, runOnce,
//                       startWorker, stopWorker, registerHandler, metrics }
//   window.__MINIMAL_SIGNAL_RUNTIME__ = live counters + last metrics snapshot
//
// Handler contract:
//   async (signal) => { effects: [{type, detail?, apply: async () => any}] }
// Each effect is wrapped with the (idempotency_key, effect_type) barrier.
// Replays are inert.
// ─────────────────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  const RPC_BASE = '/rpc';
  const WORKER_ID = 'browser-' + Math.random().toString(36).slice(2,10);

  // Static handler map. Unknown signal types are dead-lettered immediately.
  const HANDLERS = Object.create(null);

  // ── Live counters (cheap, in-memory; supplemented by sig_metrics RPC) ──
  const COUNTERS = {
    enqueued: 0,
    claimed: 0,
    succeeded: 0,
    failed: 0,
    dead_lettered: 0,
    effects_started: 0,
    effects_success: 0,
    effects_failure: 0,
    effects_skipped_replay: 0,
    last_error: null,
    last_run_at: null,
    worker_running: false,
  };

  // ── Transport helpers ─────────────────────────────────────────────────────
  function _sbReady(){
    return typeof sbFetch === 'function'
        && typeof sbConfigured === 'function'
        && sbConfigured();
  }

  async function _rpc(name, args){
    if(!_sbReady()) throw new Error('signals: Supabase not configured');
    return sbFetch(`${RPC_BASE}/${name}`, {
      method: 'POST',
      body: JSON.stringify(args || {}),
    });
  }

  // ── Public API: queue ops ─────────────────────────────────────────────────
  async function enqueue(signal_type, payload, idempotency_key, opts){
    if(!signal_type || !idempotency_key){
      throw new Error('signals.enqueue: signal_type + idempotency_key required');
    }
    // Reject unknown types up front — direct dead-letter, no queue noise.
    if(!HANDLERS[signal_type]){
      const ddl = await _rpc('sig_dead_letter_unknown', {
        p_signal_type: signal_type,
        p_payload: payload || {},
        p_idempotency_key: idempotency_key,
        p_reason: 'unknown_signal_type',
      });
      COUNTERS.dead_lettered++;
      return { dead_letter_id: ddl, status: 'dead' };
    }
    const id = await _rpc('sig_enqueue', {
      p_signal_type: signal_type,
      p_payload: payload || {},
      p_idempotency_key: idempotency_key,
      p_max_attempts: (opts && opts.max_attempts) || 5,
    });
    COUNTERS.enqueued++;
    return { id, status: 'pending' };
  }

  async function claim(batch_size, lease_secs){
    const rows = await _rpc('sig_claim', {
      p_worker_id: WORKER_ID,
      p_batch_size: batch_size || 5,
      p_lease_secs: lease_secs || 60,
    });
    const list = Array.isArray(rows) ? rows : [];
    COUNTERS.claimed += list.length;
    return list;
  }

  async function finalize(id){
    await _rpc('sig_finalize', { p_id: id });
    COUNTERS.succeeded++;
  }

  // Exponential backoff in seconds: 2^attempt, capped 5min, with jitter.
  function _backoffSecs(attempt){
    const base = Math.min(300, Math.pow(2, Math.max(1, attempt|0)));
    const jitter = Math.floor(Math.random() * Math.max(1, Math.floor(base/4)));
    return base + jitter;
  }

  async function retry(id, error, backoff_secs){
    const secs = (backoff_secs == null) ? 30 : backoff_secs;
    await _rpc('sig_retry', { p_id: id, p_error: String(error||''), p_backoff_secs: secs });
    COUNTERS.failed++;
  }

  async function deadLetter(id, reason, error){
    await _rpc('sig_dead_letter', {
      p_id: id,
      p_reason: String(reason||'terminal_failure'),
      p_error: String(error||''),
    });
    COUNTERS.dead_lettered++;
  }

  // ── Effect idempotency barrier ────────────────────────────────────────────
  // Returns true if the effect should run; false if it is already recorded
  // (i.e. a replay). The unique index on (idempotency_key, effect_type)
  // makes the start-claim atomic.
  async function _claimEffect(signal, effect_type, detail){
    try{
      await sbFetch('/signal_effect_log', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          signal_id: signal.id,
          idempotency_key: signal.idempotency_key,
          effect_type,
          outcome: 'started',
          detail: detail || {},
        }),
      });
      return true;
    }catch(e){
      // 23505 unique violation => already done. Treat as inert replay.
      if(/23505|duplicate key|already exists/i.test(e.message||'')){
        COUNTERS.effects_skipped_replay++;
        return false;
      }
      throw e;
    }
  }

  async function _markEffect(signal, effect_type, outcome, detail){
    // PATCH by composite key (idempotency_key, effect_type) — unique index.
    const qs = `?idempotency_key=eq.${encodeURIComponent(signal.idempotency_key)}`
             + `&effect_type=eq.${encodeURIComponent(effect_type)}`;
    try{
      await sbFetch('/signal_effect_log' + qs, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ outcome, detail: detail || {} }),
      });
    }catch(e){ /* metrics-only path; never throw from finalize */ }
  }

  // ── Dispatcher ────────────────────────────────────────────────────────────
  function registerHandler(signal_type, fn){
    if(typeof fn !== 'function') throw new Error('handler must be function');
    HANDLERS[signal_type] = fn;
  }

  async function _dispatch(signal){
    const handler = HANDLERS[signal.signal_type];
    if(!handler){
      // Defense in depth — should have been caught at enqueue.
      await deadLetter(signal.id, 'unknown_signal_type', 'no handler registered');
      return;
    }

    // Handler returns { effects: [{type, apply, detail?}] }
    const result = await handler(signal);
    const effects = (result && Array.isArray(result.effects)) ? result.effects : [];

    for(const eff of effects){
      if(!eff || !eff.type || typeof eff.apply !== 'function') continue;
      COUNTERS.effects_started++;
      const should = await _claimEffect(signal, eff.type, eff.detail);
      if(!should) continue; // replay → inert
      try{
        const out = await eff.apply();
        COUNTERS.effects_success++;
        await _markEffect(signal, eff.type, 'success',
          (out && typeof out === 'object') ? out : { ok: true });
      }catch(err){
        COUNTERS.effects_failure++;
        await _markEffect(signal, eff.type, 'failure', { error: String(err && err.message || err) });
        throw err; // bubble so the signal is retried
      }
    }
  }

  // ── Worker loop ───────────────────────────────────────────────────────────
  async function runOnce(opts){
    const batch_size = (opts && opts.batch_size) || 5;
    const lease_secs = (opts && opts.lease_secs) || 60;
    let processed = 0;
    const claimed = await claim(batch_size, lease_secs);
    for(const sig of claimed){
      try{
        await _dispatch(sig);
        await finalize(sig.id);
        processed++;
      }catch(err){
        COUNTERS.last_error = String(err && err.message || err);
        const attempts = sig.attempts || 0;
        const max = sig.max_attempts || 5;
        if(attempts >= max){
          await deadLetter(sig.id, 'max_attempts_exceeded', err && err.message);
        }else{
          await retry(sig.id, err && err.message, _backoffSecs(attempts));
        }
      }
    }
    COUNTERS.last_run_at = new Date().toISOString();
    return processed;
  }

  let _workerTimer = null;
  let _stopRequested = false;
  function startWorker(opts){
    if(_workerTimer) return;
    _stopRequested = false;
    COUNTERS.worker_running = true;
    const intervalMs = (opts && opts.interval_ms) || 5000;
    const tick = async () => {
      if(_stopRequested){ COUNTERS.worker_running = false; return; }
      try { await runOnce(opts); }
      catch(e){ COUNTERS.last_error = String(e && e.message || e); }
      _workerTimer = setTimeout(tick, intervalMs);
    };
    _workerTimer = setTimeout(tick, intervalMs);
  }
  function stopWorker(){
    _stopRequested = true;
    if(_workerTimer){ clearTimeout(_workerTimer); _workerTimer = null; }
    COUNTERS.worker_running = false;
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  async function metrics(){
    let snapshot = null;
    try { snapshot = await _rpc('sig_metrics', {}); }
    catch(e){ snapshot = { error: String(e && e.message || e) }; }
    const live = Object.assign({}, COUNTERS, { worker_id: WORKER_ID });
    const out = { live, snapshot, fetched_at: new Date().toISOString() };
    window.__MINIMAL_SIGNAL_RUNTIME__ = out;
    return out;
  }

  // ── Static handler map (the only 3 known types) ───────────────────────────
  // Handlers are intentionally thin wrappers — real work is delegated to
  // existing modules (catalog/inventory/pricing). They return a *plan* of
  // effects so the runtime owns idempotency.
  registerHandler('catalog.item.upsert.requested', async (sig) => ({
    effects: [{
      type: 'catalog.item.upsert',
      detail: { sku: sig.payload && sig.payload.sku },
      apply: async () => {
        if(typeof window.catalogUpsertFromSignal === 'function'){
          return await window.catalogUpsertFromSignal(sig.payload || {});
        }
        // Default: noop-success so the system is testable end-to-end without
        // the catalog module wired in. Real handler MUST be installed by
        // catalog code; absence is logged.
        console.warn('[signals] catalogUpsertFromSignal not registered — noop');
        return { noop: true };
      }
    }]
  }));

  registerHandler('inventory.level.sync.requested', async (sig) => ({
    effects: [{
      type: 'inventory.level.sync',
      detail: { sku: sig.payload && sig.payload.sku, location: sig.payload && sig.payload.location },
      apply: async () => {
        if(typeof window.inventoryLevelSyncFromSignal === 'function'){
          return await window.inventoryLevelSyncFromSignal(sig.payload || {});
        }
        console.warn('[signals] inventoryLevelSyncFromSignal not registered — noop');
        return { noop: true };
      }
    }]
  }));

  registerHandler('pricing.update.requested', async (sig) => ({
    effects: [{
      type: 'pricing.update',
      detail: { sku: sig.payload && sig.payload.sku },
      apply: async () => {
        if(typeof window.pricingUpdateFromSignal === 'function'){
          return await window.pricingUpdateFromSignal(sig.payload || {});
        }
        console.warn('[signals] pricingUpdateFromSignal not registered — noop');
        return { noop: true };
      }
    }]
  }));

  // ── Export ────────────────────────────────────────────────────────────────
  window.SIGNALS = {
    enqueue, claim, finalize, retry, deadLetter,
    runOnce, startWorker, stopWorker,
    registerHandler, metrics,
    _counters: COUNTERS,
    _workerId: WORKER_ID,
  };
  window.__MINIMAL_SIGNAL_RUNTIME__ = { live: COUNTERS, snapshot: null, fetched_at: null };
})();
