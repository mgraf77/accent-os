# SIGNAL_NAME_CANON

**Purpose:** the authoritative list of canonical signal type names,
effect-type names, producer names, and effect-hook names used by the
AccentOS runtime as of `main@d4966c7`.

**Authority:** advisory until promoted into `js/signals_registry.js`
(see `RUNTIME_REGISTRY_PLAN.md`).

## Naming rules

1. **Signal type names** are dot-namespaced, lowercase, end in
   `.requested`, of the form `<domain>.<noun>.<verb>.requested`.
   Example: `pricing.update.requested`.
2. **Effect type names** drop the `.requested` suffix and represent the
   *applied* state. Example: `pricing.update`.
3. **Producer functions** are camelCase, prefixed with `queue`, take a
   payload + optional opts. Example: `queuePricingUpdate(payload, opts)`.
4. **Effect hooks** are camelCase, suffixed with `FromSignal`, installed
   on `window`. Example: `pricingUpdateFromSignal(payload)`.
5. **Counters** in `COUNTERS` are snake_case past-tense. Example:
   `effects_skipped_replay`, `dead_lettered`.
6. **RPCs** are snake_case prefixed with `sig_`. Example: `sig_metrics`,
   `sig_dead_letter_unknown`.

These rules are descriptive of the existing canonical surface; any new
signal type SHOULD obey them.

## Canonical signal types (3)

| Signal type | Effect type | Producer | Effect hook | Owner module |
|---|---|---|---|---|
| `catalog.item.upsert.requested` | `catalog.item.upsert` | `queueCatalogUpsert` | `catalogUpsertFromSignal` | (catalog producer not yet wired in callsite) |
| `inventory.level.sync.requested` | `inventory.level.sync` | `queueInventorySync` | `inventoryLevelSyncFromSignal` | (inventory producer not yet wired in callsite) |
| `pricing.update.requested` | `pricing.update` | `queuePricingUpdate` | `pricingUpdateFromSignal` | `js/inventory.js` (M50 `list_price` path) |

Source: `js/signals_runtime.js` (registerHandler blocks),
`js/signals_producers.js` (window.SIGNAL_PRODUCERS exports).

## Canonical RPCs (8)

| RPC | Caller | Purpose |
|---|---|---|
| `sig_enqueue` | `SIGNALS.enqueue` | append signal to queue |
| `sig_claim` | `SIGNALS.claim` | claim N pending signals as worker |
| `sig_finalize` | `SIGNALS.finalize` | mark signal succeeded |
| `sig_retry` | `SIGNALS.retry` | re-queue with backoff |
| `sig_dead_letter` | `SIGNALS.deadLetter` | terminal failure path |
| `sig_dead_letter_unknown` | `SIGNALS.enqueue` (unknown type) | DLQ for unhandled types |
| `sig_metrics` | `SIGNALS.metrics` | metrics snapshot |

Plus: direct PostgREST writes to table `signal_effect_log` (not an RPC)
from `_claimEffect` / `_markEffect` for the replay barrier.

## Canonical counters (12)

`enqueued, claimed, succeeded, failed, dead_lettered, effects_started,
effects_success, effects_failure, effects_skipped_replay, last_run_at,
last_error, worker_running` plus `worker_id` injected via `metrics()`.

## Canonical globals (4)

| Global | File | Shape |
|---|---|---|
| `window.SIGNALS` | `signals_runtime.js` | `{enqueue, claim, finalize, retry, deadLetter, runOnce, startWorker, stopWorker, registerHandler, metrics, _counters, _workerId}` |
| `window.SIGNAL_PRODUCERS` | `signals_producers.js` | adapter facade |
| `window.SIGNAL_PANEL` | `signals_panel.js` | `{show, hide, toggle, refresh}` |
| `window.__SIGNAL_RUNTIME_HEALTH__` | `signals_runtime_health.js` (Session 36) | callable returning health snapshot |

Plus: `window.__MINIMAL_SIGNAL_RUNTIME__` (live counters + last metrics).

## Forbidden / superseded names

These names appeared in pre-canonical sidecars and should NOT be reused:

- `js/signals.js` (file): superseded by the 3-file split.
- `window.signal_queue` (direct global): forbidden — go through `SIGNALS.enqueue`.
- Any `sig_*` RPC called from outside `js/signals_runtime.js`: forbidden.
- `signal_event` (legacy): superseded by `signal_queue` table semantics.

## Adding a new signal type — checklist

1. Append a row to this document.
2. Implement the `queue<Foo>` producer in `signals_producers.js`.
3. Implement the `<foo>FromSignal` effect hook in the owning module.
4. Add a `registerHandler` block in `signals_runtime.js`.
5. Add a panel filter (optional).
6. Update `RUNTIME_CONSTANTS_MAP.md` if new RPCs are introduced.
7. Once `js/signals_registry.js` lands, append a registry entry instead
   of editing this doc directly.
