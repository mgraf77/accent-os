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
  // Payload carries `run_id` so this row is filterable from later tests'
  // batch claims (runOnce drains *all* pending rows, not just the test's own).
  async function testEnqueueDedup(){
    const type = 'pricing.update.requested';
    const idem = `${RUN_ID}_dedup`;
    const r1 = await SIGNALS.enqueue(type, { sku:'X', run_id: RUN_ID }, idem);
    const r2 = await SIGNALS.enqueue(type, { sku:'X', run_id: RUN_ID }, idem);
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
  // Override scopes its counter to *this run's* signal (matched on run_id +
  // sku in payload). runOnce's batch claim may also drain test 1's dedup row
  // and any pre-existing pollution; those rows are accepted as inert
  // successes so they don't trip this test's exactly-once invariant.
  async function testClaimDispatchFinalize(){
    const TYPE = 'pricing.update.requested';
    const idem = `${RUN_ID}_happy`;
    const MARK = { run_id: RUN_ID, sku: 'SKU-1' };
    let appliedCount = 0;

    const origFn = window.pricingUpdateFromSignal;
    window.pricingUpdateFromSignal = async (payload) => {
      if(payload && payload.run_id === MARK.run_id && payload.sku === MARK.sku){
        appliedCount++;
        return { applied: true, sku: payload.sku };
      }
      // Foreign row (test 1's dedup, or pollution from prior runs) —
      // succeed quietly so the queue drains.
      return { skipped: true, reason: 'not_our_run' };
    };

    try{
      await SIGNALS.enqueue(TYPE, { sku: MARK.sku, run_id: MARK.run_id }, idem);
      const processed = await SIGNALS.runOnce({ batch_size: 5 });
      assert(processed >= 1, 'runOnce should process at least 1 signal');
      assert(appliedCount === 1, 'effect should run exactly once');

      // Re-running with same idempotency_key must NOT re-run effect.
      // (signal is already succeeded; even if re-enqueued, effect log blocks.)
      await SIGNALS.enqueue(TYPE, { sku: MARK.sku, run_id: MARK.run_id }, idem);
      await SIGNALS.runOnce({ batch_size: 5 });
      assert(appliedCount === 1, 'replay must be inert via effect log barrier');
      log('OK happy path + replay barrier');
    } finally {
      window.pricingUpdateFromSignal = origFn;
    }
  }

  // ── 4. retry on failure with backoff, then dead-letter ────────────────────
  // Override scopes its throw + counter to *this run's* signal (matched on
  // run_id in payload). Foreign rows succeed quietly so unrelated pollution
  // doesn't inflate the call counter or interfere with the dead-letter path.
  async function testRetryThenDeadLetter(){
    const TYPE = 'inventory.level.sync.requested';
    const idem = `${RUN_ID}_retry`;
    const MARK = { run_id: RUN_ID, sku: 'BOOM' };
    let calls = 0;

    const orig = window.inventoryLevelSyncFromSignal;
    window.inventoryLevelSyncFromSignal = async (payload) => {
      if(payload && payload.run_id === MARK.run_id && payload.sku === MARK.sku){
        calls++;
        throw new Error('simulated boom');
      }
      return { skipped: true, reason: 'not_our_run' };
    };

    try{
      await SIGNALS.enqueue(TYPE, { sku: MARK.sku, run_id: MARK.run_id }, idem,
        { max_attempts: 2 });
      // First run: claim+attempt=1, fail, retry scheduled in future.
      await SIGNALS.runOnce({ batch_size: 5 });
      assert(calls === 1, 'first attempt happened');

      // Force the row visible immediately so we can drain attempt #2.
      // We use Unix epoch (1970-01-01) instead of `new Date(Date.now()-1000)`
      // because the browser clock can drift from the Supabase server clock
      // by tens of seconds. sig_claim compares next_visible_at <= now()
      // against the SERVER clock, so a "1 second ago" client timestamp can
      // be tens of seconds in the server's future and silently make the
      // row unclaimable. Epoch zero is always in the past for any sane
      // server clock — clock-skew-immune.
      await sbFetch(`/signal_queue?signal_type=eq.${encodeURIComponent(TYPE)}`
        + `&idempotency_key=eq.${encodeURIComponent(idem)}`,
        { method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ next_visible_at: new Date(0).toISOString() }) });

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
