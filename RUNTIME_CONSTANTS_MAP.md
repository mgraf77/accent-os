# RUNTIME_CONSTANTS_MAP

**Purpose:** single map of every magic value, threshold, table name,
RPC name, and lifecycle state used by the canonical runtime, so they can
be located, reasoned about, and (in a future session) centralized into
`js/signals_constants.js`.

## Lifecycle states

Per `js/signals_runtime.js`:

| State | Meaning | Set by |
|---|---|---|
| `pending` | enqueued, not yet claimed | `sig_enqueue` |
| `claimed` | a worker holds a lease | `sig_claim` |
| `succeeded` | applied without error | `sig_finalize` |
| `failed` | retried but exhausted | `sig_retry` (terminal) |
| `dead` | dead-lettered | `sig_dead_letter`, `sig_dead_letter_unknown` |
| `replayed` (logical) | unique-violation 23505 caught; effect skipped | runtime apply loop, `effects_skipped_replay` counter |

DAG: `pending → claimed → (succeeded | failed | dead | replayed)`.

## Severity taxonomy (currently flat)

Today, severity is implicit (all 3 canonical signals are `normal`). The
escalation sidecar (`harden-runtime-escalation-eYOqF`) proposed a
4-level taxonomy: `low | normal | high | critical`. Not yet adopted.

Recommended forward map:

| Severity | Behavior |
|---|---|
| `low` | best-effort; no retry on producer-side throttle |
| `normal` | default; standard retry |
| `high` | priority claim; alert on dead-letter |
| `critical` | priority claim; alert on any failure |

Adoption requires registry support (see `RUNTIME_REGISTRY_PLAN.md`).

## Replay semantics

| Term | Meaning |
|---|---|
| `idempotency_key` | producer-composed deterministic key per logical op |
| `effect_type` | the *applied* effect name (drops `.requested`) |
| unique index | `UNIQUE (idempotency_key, effect_type)` enforces one-effect-per-(key,type) |
| 23505 path | unique-violation caught in `applyEffect`; effect treated as inert replay |
| `effects_skipped_replay` | counter incremented per replay-skip |

A signal that is re-enqueued with the same `idempotency_key` will be
processed (claim/finalize) but its effect will be a no-op via the
23505 path.

## Magic numbers / thresholds

| Value | Where | Meaning | Override |
|---|---|---|---|
| 60_000 ms | `signals_runtime_health.js` | heartbeat staleness threshold | `window.__SIGNAL_RUNTIME_HEALTH_HEARTBEAT_MS__` |
| (claim batch size) | `signals_runtime.js` | how many signals per claim | none — hard-coded; consider exposing |
| (worker tick interval) | `signals_runtime.js` | poll cadence | none — hard-coded; consider exposing |
| (retry backoff) | `signals_runtime.js` | backoff schedule | server-side via `sig_retry` |

**Action:** future session should hoist the claim batch size, tick
interval, and any hard-coded retry caps into a `RUNTIME_TUNABLES` block
near the top of `signals_runtime.js` or into a new
`js/signals_constants.js`.

## RPC catalog

(See `SIGNAL_NAME_CANON.md` § Canonical RPCs for the authoritative list.
Reproduced here for convenience.)

`sig_enqueue, sig_claim, sig_finalize, sig_retry, sig_dead_letter,
sig_dead_letter_unknown, sig_record_effect_attempt, sig_metrics`.

## Counter catalog

(See `SIGNAL_NAME_CANON.md` § Canonical counters.)

## Table names

| Table | Used by |
|---|---|
| `signal_queue` | all `sig_*` RPCs (queue substrate) |
| `signal_effect_log` | runtime `_claimEffect` / `_markEffect` (PostgREST direct), replay-safety unique index on `(idempotency_key, effect_type)` |
| `signal_dead_letter` (inferred — verify on Supabase) | `sig_dead_letter`, `sig_dead_letter_unknown` |

Schema audit: out of scope this session (Supabase apply not authorized).
Confirm exact table names against the deployed Supabase project before
migrating any constants.

## Centralization plan

Future, additive only:

```js
// js/signals_constants.js (proposed)
window.SIGNAL_CONSTANTS = Object.freeze({
  LIFECYCLE: Object.freeze(['pending','claimed','succeeded','failed','dead']),
  SEVERITY:  Object.freeze(['low','normal','high','critical']),
  DEFAULT_HEARTBEAT_MS: 60_000,
  CLAIM_BATCH_SIZE: 5,        // currently hard-coded inside runtime
  WORKER_TICK_MS: 2000,        // currently hard-coded inside runtime
  RPC: Object.freeze({
    ENQUEUE: 'sig_enqueue',
    CLAIM:   'sig_claim',
    FINALIZE:'sig_finalize',
    RETRY:   'sig_retry',
    DEAD:    'sig_dead_letter',
    DEAD_UNKNOWN: 'sig_dead_letter_unknown',
    RECORD_ATTEMPT: 'sig_record_effect_attempt',
    METRICS: 'sig_metrics'
  })
});
```

Adoption rule: import the constants instead of redefining them, but
**never** remove the inline literals from `signals_runtime.js` until the
constants module has been live for at least 1 session and all verifiers
pass. (Belt-and-suspenders.)
