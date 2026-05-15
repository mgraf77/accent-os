# FUTURE_MERGE_FRICTION_REDUCTION

**Goal:** identify the highest-leverage, lowest-risk changes that would
reduce future merge cost across the AccentOS runtime, without expanding
scope, without rewriting modules, and without introducing magic.

## Top friction sources today

| # | Friction source | Rough cost / merge | Remediation |
|---|---|---|---|
| 1 | `index.html` `<script>` ordering | ~30% of merge conflicts | runtime-loader file (see §1) |
| 2 | Hard-coded signal-name lists in verifier scripts | ~15% | registry consultation (see §2, RUNTIME_REGISTRY_PLAN) |
| 3 | Two parallel `js/signals.js` paths in old sidecars | blocks 2 sidecars entirely | sidecar registry + naming rule (see §3, SIDECAR_RECONCILIATION_REPORT) |
| 4 | Branch sprawl (118 remote branches, 106 unmerged) | onboarding cost; merge planning churn | OBSOLETE_BRANCH_REGISTRY policy |
| 5 | No single map of runtime constants | every magic-number change touches multiple files | RUNTIME_CONSTANTS_MAP → `signals_constants.js` |

## §1. `index.html` runtime fragility

The current canonical runtime adds 4 `<script>` tags at the bottom of
`index.html` (`signals_runtime.js`, `signals_producers.js`,
`signals_panel.js`, `signals_runtime_health.js`). Every new runtime file
is another `<script>` tag in the same hot zone — the most-conflicted
region of the file.

**Proposed remediation (additive, single-file, NOT performed this session):**

Create `js/runtime_loader.js` that contains the runtime `<script>`
manifest as data, then has a `<script src="js/runtime_loader.js">` near
the bottom of `index.html`. Future runtime additions touch
`runtime_loader.js` only. `index.html` becomes stable in this region.

Constraints:
- Must preserve load order (`runtime → producers → panel → health`).
- Must use synchronous DOM-injected scripts to maintain ordering.
- Must not delay first paint.
- Must keep the explicit `<script src="js/signals_runtime.js">` tag
  available as a fallback in case the loader is disabled.

This is a 50-line change. Estimated friction reduction: ~30%.

## §2. Registry-driven verifiers

`scripts/check-runtime-wiring.sh` and friends contain hard-coded loops:

```
for f in queueCatalogUpsert queueInventorySync queuePricingUpdate; do ...
for f in catalogUpsertFromSignal inventoryLevelSyncFromSignal pricingUpdateFromSignal; do ...
```

Every new signal type requires editing every verifier. Once
`js/signals_registry.js` lands, verifiers should `node`-extract the
producer + hook lists and iterate them dynamically. This decouples
verifier scope from runtime growth.

## §3. Naming rule enforcement

Codify in CI / commit hooks the rules from `SIGNAL_NAME_CANON.md`:
- forbid `js/signals.js` (specific name).
- forbid direct calls to `sig_*` RPCs from any file outside the
  3-canonical set + `signals_runtime.test.js` + `signals_runtime_health.js`.
- forbid `window.signal_queue` or any direct queue mutation from
  non-runtime modules.

`scripts/check-runtime-wiring.sh` already enforces #2 ("[4] No direct
queue misuse outside runtime"). Expand the exempted-list pattern to
match the canonical 3-file split + the new health surface, and lock it.

## §4. Branch sprawl

See `OBSOLETE_BRANCH_REGISTRY.md`. The branch namespace is the biggest
cognitive load on session boot. Recommended: a 2-session quiet rule then
delete OBSOLETE branches; this drops the visible namespace by ~30
branches at the next pass.

## §5. Constants centralization

See `RUNTIME_CONSTANTS_MAP.md` § "Centralization plan". A single
`js/signals_constants.js` lets future tuning (heartbeat, batch size,
tick interval) happen in one file instead of five.

## What this session does NOT do

- Does not implement the runtime loader (#1).
- Does not implement the registry (#2).
- Does not delete any branches (#4).
- Does not implement constants centralization (#5).

It documents the path. The next session can land §1 and §2 in a single
short branch, with `check-runtime-wiring.sh` continuing to pass.

## What this session DOES do

- Adds a non-conflicting `<script>` tag for `signals_runtime_health.js`.
- Adds 3 new verifiers that follow the registry-ready pattern (small,
  composable, no runtime mutation).
- Documents naming rules.
- Documents the obsolete branch set.

## Estimated next-session ROI

| Action | Files | Risk | Friction reduction |
|---|---|---|---|
| Land `js/runtime_loader.js` | 2 | low | ~30% per index.html merge |
| Land `js/signals_registry.js` | 1 | low | ~15% per signal-type addition |
| Sweep OBSOLETE branches (after Michael ack) | 0 (just `git push :branch`) | low | onboarding clarity |
