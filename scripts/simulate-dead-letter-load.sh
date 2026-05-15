#!/usr/bin/env bash
# scripts/simulate-dead-letter-load.sh
# Pushes a controlled load of unknown signal types and proves they land in
# signal_dead_letter without polluting signal_queue.
#
# Usage:
#   bash scripts/simulate-dead-letter-load.sh        # default 20 dead letters
#   bash scripts/simulate-dead-letter-load.sh 100

set -u
cd "$(dirname "$0")/.."
. scripts/sim/_lib.sh

COUNT="${1:-20}"
hdr "Dead-letter load simulation — ${COUNT} unknown signals"
note "Goal: prove unknown signal types bypass the queue and land directly in dead_letter."
note "Expected: 0 new queue rows, ${COUNT} new dead_letter rows, dead counter += ${COUNT}."

emit_js_header "dead-letter-load × ${COUNT}"
cat <<JS
(async () => {
  const N = ${COUNT};
  const before = window.SIGNALS._counters.dead_lettered | 0;
  let ddlIds = 0, errors = 0;
  for (let i = 0; i < N; i++) {
    try {
      const r = await SIGNALS.enqueue('sim.unknown.' + i,
        { i, ts: Date.now() }, 'sim.dl.' + Date.now() + '.' + i);
      if (r && r.status === 'dead') ddlIds++;
    } catch(e){ errors++; }
  }
  const after = window.SIGNALS._counters.dead_lettered | 0;
  console.table({ requested: N, dead_returned: ddlIds, counter_delta: after - before, errors });
  console.assert(ddlIds === N, 'FAIL: not all unknown signals were dead-lettered');
  console.assert(after - before === N, 'FAIL: dead_lettered counter did not advance correctly');
  console.log('[sim.dead-letter-load] inspect signal_dead_letter table for the ' + N + ' new rows.');
})();
JS
sep
emit_sql_header "verify dead-letter load"
cat <<'SQL'
SELECT count(*) AS sim_dead_letters
  FROM signal_dead_letter
 WHERE signal_type LIKE 'sim.unknown.%'
   AND dead_lettered_at > now() - interval '10 minutes';

-- Inspect a sample
SELECT signal_type, reason, idempotency_key, dead_lettered_at
  FROM signal_dead_letter
 WHERE signal_type LIKE 'sim.unknown.%'
 ORDER BY dead_lettered_at DESC
 LIMIT 5;

-- Optional cleanup AFTER verification
-- DELETE FROM signal_dead_letter WHERE signal_type LIKE 'sim.unknown.%';
SQL
sep
note "If queue rows appeared for sim.unknown.* types → pre-enqueue handler-presence check is broken."
