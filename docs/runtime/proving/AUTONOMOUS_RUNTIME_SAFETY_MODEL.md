# AUTONOMOUS_RUNTIME_SAFETY_MODEL.md

> The safety contract that lets the M49 signal runtime operate unattended.

## What this runtime is

A SQL-backed signal queue (`signal_queue`), an effect log (`signal_effect_log`),
a dead-letter (`signal_dead_letter`), six RPCs, and a browser worker loop. It is
**not** a distributed system. It is one queue, one worker per browser tab, and
one set of side-effect handlers. The simplicity is the safety.

## Invariants the runtime MUST preserve

| # | Invariant | Enforced by |
|---|-----------|-------------|
| 1 | At most one queue row per `(signal_type, idempotency_key)` | `uq_signal_queue_idem` unique index + `sig_enqueue` ON CONFLICT |
| 2 | At most one **success** side effect per `(idempotency_key, effect_type)` | `signal_effect_log` UNIQUE + `_claimEffect` before `apply()` |
| 3 | A leased row is reclaimable after `leased_until` passes | `sig_claim` sweep before lock |
| 4 | A failed attempt either retries with backoff OR dead-letters | `runOnce` `attempts >= max_attempts` branch |
| 5 | Backoff is bounded (no thundering herd, no integer overflow) | `_backoffSecs` `Math.min(300, ...)` |
| 6 | Unknown signal types never enter the queue | `HANDLERS[type]` check + `sig_dead_letter_unknown` |
| 7 | Producers never throw on absent runtime | `_runtimeAvailable()` + `_enqueueSafe` try/catch |
| 8 | Effect handlers never throw on absent network | `sbConfigured()` guard |
| 9 | Worker loop survives an individual RPC error | `tick` outer try/catch |
| 10 | All degradation is visible | counters + sig_metrics + signals panel |

The check scripts in `scripts/check-*.sh` enforce each invariant statically. CI
should run all four on every change touching `js/signals_*.js` or `sql/M49_*`.

## Boundaries — what the runtime DOES NOT do

- No cross-tab coordination. Two tabs are two workers. The lease + UNIQUE
  indexes make that safe; they do not make it efficient. One operator tab is
  the intended steady state.
- No retries on `sig_dead_letter`. Dead is terminal. Recovery is operator action.
- No automatic schema migration. M49 SQL is idempotent but operator-applied.
- No log rotation. `signal_dead_letter` and `signal_effect_log` grow forever
  unless an operator prunes. Acceptable for current volume; revisit at 1M rows.
- No alerting. Visibility lives in the debug panel and `sig_metrics`. Trust
  hardening (Phase 3, this session) added `replay-skip` and `last-err` rows.

## What "safe autonomous operation" means here

1. **The worker can be left running.** If the browser tab is open and Supabase
   is reachable, the runtime self-heals expired leases and retries with backoff.
2. **The worker can be killed at any moment.** Closing the tab strands at most
   `batch_size` leases, which expire and reclaim within `lease_secs` (default 60s).
3. **Replays are inert.** Re-enqueueing the same `(type, key)` is a no-op.
   Re-running the same effect is blocked by the unique index.
4. **Failures degrade visibly.** Counters move; panel rows change colour; the
   dead-letter table accumulates rows operators can inspect.

## Trust budget

The runtime spends operator trust when:
- Dead-letter count grows without operator awareness → mitigated by panel row.
- Replays happen silently → mitigated by `effects_skipped_replay` counter.
- The worker stops without notice → mitigated by `worker_running` panel row.
- An RPC error halts the tick → mitigated by `last_error` panel row (new).

## Expansion rules

Adding a new signal type:
1. Register a handler in `signals_runtime.js`.
2. Add a producer adapter in `signals_producers.js` (with `_runtimeAvailable` guard).
3. Add the corresponding `*FromSignal` effect implementation (with `sbConfigured` guard).
4. Re-run all `scripts/check-*.sh` — they should still pass.
5. Do **not** add new tables. The runtime is three tables. Three is the budget.
