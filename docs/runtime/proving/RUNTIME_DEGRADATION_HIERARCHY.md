# RUNTIME_DEGRADATION_HIERARCHY.md

> Five degradation tiers. Each tier is observable. Each has a documented
> recovery. Silent degradation is rejected at every tier.

The hierarchy is ordered by **blast radius**, not by likelihood.

## Tier 0 — Healthy

- Worker `running`, `pending` near zero, `dead` flat, `last-err` empty.
- No operator action.
- Visible: panel green; `sig_metrics` queue depth ≤ small ceiling.

## Tier 1 — Backpressure (transient slowdown)

- Symptom: `pending` rises but worker is `running`. `enq/ok/fail` shows `ok`
  advancing.
- Cause: producer burst (e.g. bulk catalog upload) faster than worker drains.
- Recovery: **none required.** Watch panel; expect drain in
  `pending / batch_size × interval_ms` seconds.
- Risk if ignored: high `pending` masks real failures. If duration exceeds
  10 minutes, escalate to Tier 2 diagnosis.
- Visible counter: `enqueued` rising faster than `succeeded`.

## Tier 2 — Transient failure (retried)

- Symptom: `failed` increments, `dead` flat, `last-err` populated. Worker
  still `running`.
- Cause: one handler call raised — network blip, transient Supabase error,
  upstream BigCommerce 5xx.
- Recovery: **runtime self-heals via backoff.** Operator confirms `last-err`
  matches expectation; no manual intervention if `succeeded` resumes.
- Risk if ignored: a handler that *always* fails will burn through
  `max_attempts` and escalate to Tier 3.
- Visible counters: `failed`, `last_error`.

## Tier 3 — Terminal failure (dead-letter)

- Symptom: `dead` counter advances. Panel `dead` row turns amber.
- Cause: a single signal exceeded `max_attempts`, OR an unknown signal_type
  was enqueued (bypasses retries entirely).
- Recovery: **operator action required.**
  1. Query `signal_dead_letter` to identify pattern.
  2. Fix the producer (if unknown type) or handler (if terminal failure).
  3. Re-enqueue recoverable items with a fresh idempotency key.
- Risk if ignored: data drift — a sync that died will not resume on its own.
- Visible counter: `dead_lettered`, `signal_dead_letter` table.

## Tier 4 — Runtime degradation (worker absent)

- Symptom: panel `worker: stopped` (red), `pending` not draining.
- Cause: `stopWorker()` was called, tab is backgrounded with throttled timers,
  or `startWorker` was never invoked.
- Recovery:
  1. DevTools: `SIGNALS.startWorker({interval_ms: 5000})`.
  2. If hostile (tab throttling), the operator-facing tab must be foregrounded.
- Risk if ignored: every producer call falls back to `queued:false` style
  failures upstream — the runtime is doing nothing.
- Visible state: `worker_running: false`, `last_run_at` stale.

## Tier 5 — Substrate degradation (Supabase / network down)

- Symptom: `last-err` row shows `Supabase not configured` / `Failed to fetch`.
  All RPCs failing. Worker still ticking but every `runOnce` raises.
- Cause: auth expired, network partition, Supabase outage, RLS regression.
- Recovery:
  1. Confirm via `bash scripts/health-check.sh` (live external dependencies).
  2. If auth: re-login. If RLS: re-apply M49 policies.
  3. If outage: wait. Worker will resume on its own once RPCs succeed —
     the tick wrapper guarantees this.
- Risk if ignored: producers continue to queue locally only IF runtime is up
  but RPCs are down. In practice, `_rpc` will throw before enqueue succeeds,
  so the producer falls back to `queued:false` and upstream callers see the
  degraded path.
- Visible counter: `last_error` populated continuously; `sig_metrics` returns
  `{error: ...}` snapshot.

## Observability matrix

| Tier | Worker counter | Panel row | SQL surface | Operator-facing? |
|------|----------------|-----------|-------------|------------------|
| 0 | — | all green | `sig_metrics` low | no |
| 1 | `enqueued` ↑ | `pending` ↑ | `queue_depth_pending` ↑ | no |
| 2 | `failed` ↑ | `last-err` populated | `last_error` per row | no (auto) |
| 3 | `dead_lettered` ↑ | `dead` amber | `signal_dead_letter` | **yes** |
| 4 | `worker_running:false` | `worker: stopped` | leased rows stuck | **yes** |
| 5 | `last_error` populated | `last-err` + `rpc` | `sig_metrics.error` | **yes** |

Every tier has at least one counter, one panel row, and one SQL surface. If a
tier ever loses all three, the safety contract is broken; add visibility back
before shipping.

## Anti-pattern: hiding degradation

Do not:
- Catch and swallow errors in producers without incrementing a fallback counter.
- Suppress `last_error` to keep the panel "clean".
- Auto-purge `signal_dead_letter` on a schedule. Aging the table is fine;
  silently deleting evidence is not.
- Auto-restart a stopped worker without surfacing that it stopped.

Visibility is the runtime's most expensive feature. Protect it.
