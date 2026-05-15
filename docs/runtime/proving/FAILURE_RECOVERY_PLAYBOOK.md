# FAILURE_RECOVERY_PLAYBOOK.md

> One page. One row per failure mode. Diagnose → confirm → recover → verify.

| # | Symptom | Diagnose | Confirm | Recover | Verify |
|---|---------|----------|---------|---------|--------|
| 1 | Panel `pending` climbs and never drops | Worker stopped or wedged | Panel `worker: stopped`, or `last_error` set | DevTools: `SIGNALS.stopWorker(); SIGNALS.startWorker({interval_ms:5000})` | Pending should drain at ~`batch_size`/tick |
| 2 | Panel `pending` climbs, worker `running` | RPC failing each tick | `last-err` panel row populated; check Network tab for RPC 4xx/5xx | Fix Supabase auth / re-apply RLS; reload tab | `last-err` clears, pending drains |
| 3 | Panel `dead` jumps | Effect handler throwing terminally | SQL: `SELECT reason, last_error, count(*) FROM signal_dead_letter GROUP BY 1,2 ORDER BY 3 DESC` | Fix handler in `signals_producers.js`; if signal is recoverable, re-enqueue with a fresh idempotency key | Dead count flat, no new rows for that signal_type |
| 4 | Same effect ran twice (operator observation) | Effect log barrier bypassed | SQL: `SELECT idempotency_key, effect_type, count(*) FROM signal_effect_log GROUP BY 1,2 HAVING count(*) > 1` (should always be empty) | If non-empty: the UNIQUE index was dropped — re-apply `sql/M49_signal_runtime_schema.sql` | Query returns 0 rows |
| 5 | `pending` rows older than `lease_secs` × `max_attempts` | `next_visible_at` advanced past now and not advancing | SQL: `SELECT id, attempts, next_visible_at, last_error FROM signal_queue WHERE status='pending' AND next_visible_at > now()` | Reset visibility for a sample: `UPDATE signal_queue SET next_visible_at = now() WHERE id IN (...)` | Worker claims them next tick |
| 6 | Rows stuck in `leased` status | Worker crashed mid-lease (tab closed) | SQL: `SELECT count(*) FROM signal_queue WHERE status='leased' AND leased_until < now()` | Run `bash scripts/simulate-stale-leases.sh` JS block (calls `SIGNALS.claim` → triggers reclaim) | Stale leased count returns to 0 |
| 7 | Producer call returned `{queued:false, reason:'runtime_unavailable'}` | Tab opened before runtime loaded; or SIGNALS undefined | DevTools: `typeof window.SIGNALS` | Reload tab; if persists, check `index.html` script order (must match `check-runtime-wiring.sh`) | Producer returns `{queued:true, id:...}` |
| 8 | Unknown signal_type dead-letters | Producer fired a signal whose handler isn't registered | SQL: `SELECT signal_type, count(*) FROM signal_dead_letter WHERE reason='unknown_signal_type' GROUP BY 1` | Either register the handler in `signals_runtime.js` or stop the producer that's firing it | No new unknown_signal_type dead letters |
| 9 | Replay counter increments unexpectedly | A producer is firing the same key inside the 30s bucket | DevTools: `SIGNALS._counters.effects_skipped_replay` | This is **not a bug** — it's the barrier working. Investigate the producer if the volume is high enough to mask real signals | Counter growth matches expected producer cadence |
| 10 | Dead-letter table growing fast | An upstream system is firing bad payloads | SQL: `SELECT signal_type, reason, count(*) FROM signal_dead_letter WHERE dead_lettered_at > now() - interval '1 hour' GROUP BY 1,2` | Fix upstream OR add a producer-side validation | Hourly growth flat |

## When in doubt

1. Run all four `scripts/check-*.sh`. If any fail, that's the regression.
2. Run `bash scripts/simulate-replay-storm.sh` against the live tab — if it
   passes, the replay barrier is intact regardless of symptom.
3. Read `last_error` on the panel and `signal_dead_letter.last_error` in SQL.
   These are the runtime's own complaint surfaces.

## What NOT to do

- Don't `DELETE FROM signal_queue` to "fix" stuck rows. Use `sig_dead_letter`
  (RPC) or the lease reclaim path. Deleting orphans the effect log.
- Don't drop and recreate the unique indexes. Reapply the M49 SQL file; it is
  idempotent.
- Don't run two browser tabs as a workaround for throughput. The runtime is
  not designed for it. Open one operator tab; if you need more capacity, that
  is a different conversation.
