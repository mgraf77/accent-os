# RUNTIME_REGISTRY_PLAN

**Purpose:** define a single, additive registry pattern for runtime
primitives so future sessions can extend without touching `index.html`,
without renaming globals, and without re-deriving canonical names.

**Doctrine:** additive only. This document does not refactor existing
code; it specifies the destination shape for incremental migrations.

## Why a registry

Today the runtime exposes 4 globals (`SIGNALS`, `SIGNAL_PRODUCERS`,
`SIGNAL_PANEL`, `__SIGNAL_RUNTIME_HEALTH__`) and 7 effect-side hooks
(`catalogUpsertFromSignal`, `inventoryLevelSyncFromSignal`,
`pricingUpdateFromSignal`, plus 4 producer adapters). These are the
"runtime registry" today, but it lives implicitly across files. The cost
is:

- adding any new signal type requires touching `signals_runtime.js`,
  `signals_producers.js`, sometimes `signals_panel.js`, and the effect
  module — 4 files per change.
- there is no single source of truth listing the supported signal types,
  their producers, their effect hooks, or their handler shapes.
- onboarding any future session requires re-deriving this map from grep.

A registry of pure-data declarations collapses this surface.

## Target shape (proposed, NOT YET IMPLEMENTED)

`js/signals_registry.js` (additive, optional):

```js
// declarative — no behavior, only metadata
window.SIGNAL_REGISTRY = Object.freeze({
  version: 1,
  signal_types: Object.freeze([
    {
      name: 'catalog.item.upsert.requested',
      producer: 'queueCatalogUpsert',
      effect_type: 'catalog.item.upsert',
      effect_hook: 'catalogUpsertFromSignal',
      severity: 'normal',
      lifecycle: 'queued -> claimed -> applied | replayed | failed | dead',
      owner_module: 'js/catalog.js'
    },
    {
      name: 'inventory.level.sync.requested',
      producer: 'queueInventorySync',
      effect_type: 'inventory.level.sync',
      effect_hook: 'inventoryLevelSyncFromSignal',
      severity: 'normal',
      lifecycle: 'queued -> claimed -> applied | replayed | failed | dead',
      owner_module: 'js/inventory.js'
    },
    {
      name: 'pricing.update.requested',
      producer: 'queuePricingUpdate',
      effect_type: 'pricing.update',
      effect_hook: 'pricingUpdateFromSignal',
      severity: 'normal',
      lifecycle: 'queued -> claimed -> applied | replayed | failed | dead',
      owner_module: 'js/inventory.js' // M50 list_price path
    }
  ])
});
```

## Migration plan

**No migration is performed in this session.** Forward sessions can:

1. **Land the registry as a pure-data file** loaded immediately after
   `signals_runtime.js`. It must export `window.SIGNAL_REGISTRY` and have
   no side effects.
2. **Make verifiers consult the registry** instead of hard-coded lists in
   `scripts/check-runtime-wiring.sh`, `check-runtime-health.sh`, etc.
   This is the highest-leverage change — it removes hard-coded `for f in
   queueCatalogUpsert ...` loops from every verifier.
3. **Make the panel iterate the registry** for type filters, instead of
   string-matching individual signal names.
4. **Optionally:** allow handler registration to read from the registry
   so adding a signal type means only adding a registry entry + the
   effect hook implementation.

## Constraints

- Registry must be **frozen** (`Object.freeze`) and treat itself as
  append-only across versions. Removing a signal type is a breaking
  change.
- Registry must **not** re-implement runtime behavior. It is
  declarative metadata only.
- Registry must **not** be required by `signals_runtime.js` (the runtime
  must continue to function if the registry is absent).

## Out of scope for this plan

- Workflow / orchestration metadata (forbidden per session doctrine).
- Multi-stage signal pipelines.
- Auto-generated handler code.

See also: `SIGNAL_NAME_CANON.md`, `RUNTIME_CONSTANTS_MAP.md`.
