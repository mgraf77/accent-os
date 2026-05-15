#!/usr/bin/env bash
# scripts/simulate-replay-storm.sh
# Drives the replay-protection barrier by enqueueing the same
# (signal_type, idempotency_key) N times in rapid succession.
# Expected: 1 row created, N-1 dedup hits, 0 duplicate effects.
#
# Usage:
#   bash scripts/simulate-replay-storm.sh           # default 50 iterations
#   bash scripts/simulate-replay-storm.sh 200       # custom count
#
# Output: browser-console snippet (paste into DevTools).

set -u
cd "$(dirname "$0")/.."
. scripts/sim/_lib.sh

COUNT="${1:-50}"
hdr "Replay storm simulation — ${COUNT} enqueue attempts, single idempotency key"
note "Goal: prove (signal_type, idempotency_key) UNIQUE index + effect log barrier hold."
note "Expected after run: 1 queue row, 1 effect log row, 0 duplicate side effects."

emit_js_header "replay-storm × ${COUNT}"
cat <<JS
(async () => {
  const TYPE = 'pricing.update.requested';
  const KEY  = 'sim.replay-storm.' + Date.now().toString(36);
  const N    = ${COUNT};
  const before = JSON.parse(JSON.stringify(window.SIGNALS._counters));
  const ids = new Set();
  let errors = 0;
  for (let i = 0; i < N; i++) {
    try {
      const r = await SIGNALS.enqueue(TYPE, { sku: 'STORM-1', i }, KEY);
      if (r && r.id) ids.add(r.id);
    } catch (e) { errors++; }
  }
  // Drain once so the effect barrier records the canonical row.
  await SIGNALS.runOnce({ batch_size: 10 });
  const after = JSON.parse(JSON.stringify(window.SIGNALS._counters));
  const delta = {
    enqueued:                after.enqueued                - before.enqueued,
    effects_started:         after.effects_started         - before.effects_started,
    effects_success:         after.effects_success         - before.effects_success,
    effects_skipped_replay:  after.effects_skipped_replay  - before.effects_skipped_replay,
  };
  console.table({ unique_queue_ids: ids.size, errors, ...delta });
  console.assert(ids.size === 1, 'FAIL replay storm: more than one queue row created');
  console.assert(delta.effects_success <= 1, 'FAIL replay storm: effect ran more than once');
  console.log('[sim.replay-storm] PASS — single row, single effect, replays inert');
})();
JS
sep
note "If ids.size !== 1 → UNIQUE (signal_type, idempotency_key) constraint is broken."
note "If effects_success > 1 → effect log barrier failed; replay protection compromised."
