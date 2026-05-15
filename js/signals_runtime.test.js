// js/signals_runtime.test.js — Browser-runnable smoke tests for SIGNALS runtime.
// ─────────────────────────────────────────────────────────────────────────────
// Run from DevTools console after sql/M49_signal_runtime_schema.sql is applied:
//
//     await SIGNALS_TESTS.runAll();
//
// Tests are self-contained, write only to runtime tables, and use unique
// idempotency_keys per run so they can be re-executed without manual cleanup.
// ─────────────────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  const RUN_ID = 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
  const log = (...a) => console.log('[signals.test]', ...a);

  function assert(cond, msg){
    if(!cond) throw new Error('ASSERT FAILED: ' + msg);
  }

  async function withHandler(type, fn, body){
    const prev = window.SIGNALS && window.SIGNALS._counters ? null : null;
    SIGNALS.registerHandler(type, fn);
    try { return await body(); }
    finally { /* leave registered — tests use unique types */ }
  }

  // ── 1. enqueue + dedup ────────────────────────────────────────────────────
  async function testEnqueueDedup(){
    const type = 'pricing.update.requested';
    const idem = `${RUN_ID}_dedup`;
    const r1 = await SIGNALS.enqueue(type, { sku:'X' }, idem);
    const r2 = await SIGNALS.enqueue(type, { sku:'X' }, idem);
    assert(r1.id && r2.id, 'enqueue should return ids');
    assert(r1.id === r2.id, 'dedup: same idempotency_key returns same row');
    log('OK enqueue dedup', r1.id);
  }

  // ── 2. unknown signal → immediate dead-letter ─────────────────────────────
  async function testUnknownSignalDeadLetter(){
    const r = await SIGNALS.enqueue('not.a.real.signal',
      { foo:1 }, `${RUN_ID}_unknown`);
    assert(r.status === 'dead', 'unknown signal must dead-letter immediately');
    log('OK unknown→dead-letter', r.dead_letter_id);
  }

  // ── 3. claim → dispatch → finalize ────────────────────────────────────────
  async function testClaimDispatchFinalize(){
    const TYPE = 'pricing.update.requested';
    const idem = `${RUN_ID}_happy`;
    let appliedCount = 0;

    // Hijack the pricing handler effect for the duration of the test.
    const origFn = window.pricingUpdateFromSignal;
    window.pricingUpdateFromSignal = async (payload) => {
      appliedCount++;
      return { applied: true, sku: payload.sku };
    };

    try{
      await SIGNALS.enqueue(TYPE, { sku:'SKU-1' }, idem);
      const processed = await SIGNALS.runOnce({ batch_size: 5 });
      assert(processed >= 1, 'runOnce should process at least 1 signal');
      assert(appliedCount === 1, 'effect should run exactly once');

      // Re-running with same idempotency_key must NOT re-run effect.
      // (signal is already succeeded; even if re-enqueued, effect log blocks.)
      await SIGNALS.enqueue(TYPE, { sku:'SKU-1' }, idem);
      await SIGNALS.runOnce({ batch_size: 5 });
      assert(appliedCount === 1, 'replay must be inert via effect log barrier');
      log('OK happy path + replay barrier');
    } finally {
      window.pricingUpdateFromSignal = origFn;
    }
  }

  // ── 4. retry on failure with backoff, then dead-letter ────────────────────
  async function testRetryThenDeadLetter(){
    const TYPE = 'inventory.level.sync.requested';
    const idem = `${RUN_ID}_retry`;
    let calls = 0;

    const orig = window.inventoryLevelSyncFromSignal;
    window.inventoryLevelSyncFromSignal = async () => {
      calls++;
      throw new Error('simulated boom');
    };

    try{
      await SIGNALS.enqueue(TYPE, { sku:'BOOM' }, idem, { max_attempts: 2 });
      // First run: claim+attempt=1, fail, retry scheduled in future.
      await SIGNALS.runOnce({ batch_size: 5 });
      assert(calls === 1, 'first attempt happened');

      // Force the row visible immediately so we can drain attempt #2.
      // (We do this by directly resetting next_visible_at.)
      await sbFetch(`/signal_queue?signal_type=eq.${encodeURIComponent(TYPE)}`
        + `&idempotency_key=eq.${encodeURIComponent(idem)}`,
        { method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ next_visible_at: new Date(Date.now()-1000).toISOString() }) });

      await SIGNALS.runOnce({ batch_size: 5 });
      assert(calls === 2, 'second attempt happened');

      // After 2 failed attempts (max_attempts=2), the next failed run must dead-letter.
      // attempts already == 2 after second run; verify status.
      const rows = await sbFetch(`/signal_queue?signal_type=eq.${encodeURIComponent(TYPE)}`
        + `&idempotency_key=eq.${encodeURIComponent(idem)}&select=status,attempts`);
      assert(Array.isArray(rows) && rows.length === 1, 'row exists');
      assert(rows[0].status === 'dead', `expected dead, got ${rows[0].status}`);
      log('OK retry→dead-letter', rows[0]);
    } finally {
      window.inventoryLevelSyncFromSignal = orig;
    }
  }

  // ── 5. metrics surface populated ──────────────────────────────────────────
  async function testMetricsSurface(){
    const m = await SIGNALS.metrics();
    assert(window.__MINIMAL_SIGNAL_RUNTIME__ === m, 'metrics surface installed');
    assert(m.live && typeof m.live.enqueued === 'number', 'live counters present');
    assert(m.snapshot && (m.snapshot.queue_depth_pending != null
                       || m.snapshot.error),
      'snapshot or error present');
    log('OK metrics', m.snapshot);
  }

  // ── Runner ────────────────────────────────────────────────────────────────
  async function runAll(){
    log('starting tests, run_id=', RUN_ID);
    const tests = [
      ['enqueue+dedup',           testEnqueueDedup],
      ['unknown→dead-letter',     testUnknownSignalDeadLetter],
      ['claim+dispatch+finalize', testClaimDispatchFinalize],
      ['retry→dead-letter',       testRetryThenDeadLetter],
      ['metrics surface',         testMetricsSurface],
    ];
    const results = [];
    for(const [name, fn] of tests){
      try { await fn(); results.push({name, ok:true}); }
      catch(e){ results.push({name, ok:false, err: e.message}); console.error(e); }
    }
    console.table(results);
    return results;
  }

  window.SIGNALS_TESTS = { runAll, RUN_ID };
})();
