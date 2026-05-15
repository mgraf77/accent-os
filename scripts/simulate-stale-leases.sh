#!/usr/bin/env bash
# scripts/simulate-stale-leases.sh
# Injects rows in the 'leased' state with an expired leased_until to prove
# sig_claim's stale-lease reclaim sweep returns them to 'pending'.
#
# This script emits a SQL block to run in the Supabase SQL editor — the
# simulation has to write to signal_queue directly, which only authenticated
# Owner/Admin roles can do under RLS.

set -u
cd "$(dirname "$0")/.."
. scripts/sim/_lib.sh

COUNT="${1:-5}"
hdr "Stale lease simulation — ${COUNT} rows leased with expired leased_until"
note "Goal: prove sig_claim sweeps expired leases back to 'pending' before claiming new work."
note "Expected: first sig_claim() after injection returns up to ${COUNT} reclaimed rows."

emit_sql_header "inject ${COUNT} stale-leased rows"
cat <<SQL
-- 1. Inject rows directly in 'leased' status with leased_until in the past.
INSERT INTO signal_queue (signal_type, payload, idempotency_key, status,
                          leased_until, leased_by, next_visible_at)
SELECT 'pricing.update.requested',
       jsonb_build_object('sku', 'STALE-' || g, 'sim', true),
       'sim.stale.' || extract(epoch from now())::bigint || '.' || g,
       'leased',
       now() - interval '10 minutes',
       'sim-dead-worker',
       now() - interval '10 minutes'
  FROM generate_series(1, ${COUNT}) g;

-- 2. Confirm injected state.
SELECT status, count(*)
  FROM signal_queue
 WHERE idempotency_key LIKE 'sim.stale.%'
 GROUP BY status;
SQL
sep

emit_js_header "trigger reclaim + assert"
cat <<'JS'
(async () => {
  // The sig_claim RPC reclaims expired leases internally before locking new work.
  // Calling claim() with batch_size 0/1 still triggers the reclaim sweep.
  const claimed = await SIGNALS.claim(10, 60);
  console.log('[sim.stale-leases] reclaimed + claimed in one shot:', claimed.length);
  console.assert(claimed.some(r => r.idempotency_key && r.idempotency_key.startsWith('sim.stale.')),
    'FAIL: no stale-leased rows were reclaimed');
  // Now release them by retrying with 0 backoff so the queue is clean.
  for (const r of claimed) {
    try { await SIGNALS.retry(r.id, 'sim cleanup', 0); } catch(_) {}
  }
  console.log('[sim.stale-leases] DONE — clean up sim.stale.* rows via SQL when satisfied');
})();
JS
sep
emit_sql_header "cleanup sim.stale.* rows"
cat <<'SQL'
DELETE FROM signal_queue WHERE idempotency_key LIKE 'sim.stale.%';
SQL
sep
note "If the JS block reclaims 0 rows → sig_claim's expired-lease sweep regressed."
note "Lease reclaim is the difference between an outage that resolves and one that stalls."
