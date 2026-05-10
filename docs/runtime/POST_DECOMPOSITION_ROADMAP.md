# POST_DECOMPOSITION_ROADMAP

> What comes after `index.html` decomposition. The far-track map for AccentOS so that
> the next several sessions of architectural work can run without re-deciding the order.
> Analysis only — no implementation, no governance edit, no runtime change.
> Continues the cartography pack (now ten docs under `docs/runtime/`).
> Snapshot date: 2026-05-10.

---

## 0. ONE-PAGE FRAMING

`DECOMPOSITION_STRATEGY_V1` describes Stages 1–7 (+ A, + H) that drain `index.html` from 7,169 LOC / ~735 KB down to a ~3,000–4,000 LOC shell that holds only the bootstrap, the `sbFetch` surface, and the script-tag manifest. That work is **Phase A** — *un-binding the shell*.

What this document defines is **Phase B** — everything that becomes safe and meaningful only *after* Phase A. Phase B is not "the next thing to do"; it is "the next thing that *can* be done without Phase A actively fighting you." The distinction matters because the temptation under any drain is to start spending the budget the moment it appears. Phase B begins only when Phase A has *stabilized* — not when Phase A has merely landed.

Three load-bearing definitions guide the rest:

- **Module isolation begins** at the moment the first module file declares its provides/consumes via `register()` and the registry reports no warnings against any other already-registered module. Not at Stage 2 ship. Not at the 50 % migration mark. At **the first clean registry run**.
- **Loader boundaries begin** when the `register()` substrate moves from observation-only (`console.warn`) to opt-in strictness (`throw` per environment) for a non-trivial subset of provides/consumes. Strictness is not a software feature; it is a *trust gradient*.
- **The `register()` substrate becomes safe to rely on** at coverage ≥80 % of modules, with the registry exposed under `window.AOS_REGISTRY` and reading-without-throwing for at least one full week of production use.

These thresholds are arbitrary in the sense that any specific number is debatable. They are not arbitrary in the sense that *some* explicit threshold has to be picked before "isolation exists" can move from claim to fact.

---

## 1. PHASE B BEGINS WHEN PHASE A STABILIZES

"Phase A ships" and "Phase A stabilizes" are different events. The gap between them is where most decompositions silently lose the gains they earned.

### Phase A ships when:
- Stages 1–5 of `DECOMPOSITION_STRATEGY_V1` are merged.
- Parallel track Stage A (`internal_meetings.js` sub-split) is merged.
- Housekeeping Stage H(a) (patch_quote.js) is closed.
- `MASTER.md §3 / §4` is updated to reflect the post-Phase-A architecture (governance-only).

### Phase A stabilizes when:
- One full session has passed without any module commit requiring an `index.html` touch beyond a `?v=` bump.
- No `BUILD_INTELLIGENCE.md` entry has been added for a Phase-A-introduced regression for one full session.
- The `MASTER.md §3 / §4` update has *not* been corrected within that same session (i.e., it survived first contact with reality).
- The `register()` function exists in `js/shell_utils.js` and at least three modules have adopted it (`provides` / `consumes` declared) without warnings firing.

Phase B may begin only after both conditions hold. Until then, every "next-track" temptation is a future entropy generator. The remainder of this document presumes both conditions are met.

---

## 2. WHEN MODULE ISOLATION BEGINS

Module isolation in AccentOS today is a discipline (per `MODULARITY_ILLUSION_ANALYSIS §1`). It becomes a structural property at the moment three things are simultaneously true:

1. A `register()` call exists in `js/shell_utils.js` (Phase A Stage 2).
2. At least one module has declared its `provides` and `consumes`.
3. The registry has run without producing a collision or missing-dependency warning for that module across a full hydrate + first-mount cycle.

That is the *birth* of isolation. It is not a complete property; it is one isolated module among 37 unisolated ones. The phrase "module isolation begins" should be read as "isolation begins existing in this codebase at all."

The natural early adopters are the smallest, lowest-coupling modules: `digest.js`, `health.js`, `quick_actions.js`, `saved_filters.js`, `bulk_select.js`. These should be the first five to register. They cost ~3 LOC each. The yield is the observation surface for every subsequent registration.

### Rollout shape
- **Cohort 1** (first 5 modules): adopters with low coupling; ship one per session.
- **Cohort 2** (modules 6–15): mid-size modules; one or two per session.
- **Cohort 3** (modules 16–30): large modules including `customers.js`, `marketing.js`, `jobs.js`, etc.
- **Cohort 4** (modules 31–38): super-module sub-files (after Stage A); module_modes.js (last because it consumes the registry).

There is no deadline. Coverage growth is incremental. The substrate works at 1 module and works at 38; it just gets more useful as coverage rises.

---

## 3. WHEN LOADER BOUNDARIES BEGIN

A loader boundary is an *enforced* boundary, not just an observed one. The `register()` substrate as initially shipped (Stage 2 of Phase A) is observation-only — it warns but does not throw. That is intentional and correct: observation-first is what keeps the rollout non-blocking.

Loader boundaries begin when *strictness* is enabled. Strictness has three gradients:

| Level | What changes | Trigger threshold |
|---|---|---|
| **Strict-on-collision** | `register()` throws when two modules `provides` the same name | Coverage ≥60 %; zero collisions seen in console.warn over 14 days |
| **Strict-on-missing-consume** | `register()` throws when a `consumes` name is not yet provided | Coverage ≥80 %; zero missing-consume warnings seen for 7 days |
| **Strict-on-undeclared-leak** | Mutation-containment diff (`FUTURE_LOADER_BOUNDARIES §7`) throws on any undeclared `window.*` write | Coverage = 100 %; opt-in per environment only |

The first two are enable-able from Phase B onward. The third is *post-Phase-B* and may never be flipped — observation is sufficient for many systems.

**Strictness is not the goal.** Observation is. Strictness is a tool used per-environment (e.g. CI / staging / production-with-feature-flag) when an operator wants the harder signal. The default remains `console.warn` indefinitely.

### What enables this
- Stable `register()` substrate (≥1 week production use).
- Coverage threshold met for that gradient.
- A way to opt strict mode on/off without redeploy (e.g., `?strict=1` in URL during testing, environment-var equivalent in CI).

This last requirement does not exist in the current shell. Adding it is itself a small Stage 2 follow-on item, not a Phase B item, but the *use* of strictness is Phase B.

---

## 4. WHEN THE `register()` SUBSTRATE BECOMES SAFE TO RELY ON

"Safe to rely on" means: a downstream feature can be built that *assumes* the substrate exists and that its observations are trustworthy.

Three downstream features want this guarantee:

1. **Auth extraction (Stage 7 of Phase A).** Auth depends on declared `consumes` because that is what makes the extraction a checked move rather than archaeology.
2. **Sidebar generator (Stage 6 of Phase A).** Sidebar wants to enumerate modules from the registry, not from the JSON+HTML pair.
3. **Module-mode resolver overhaul.** Once registered, modules can carry their `mode` (`live`, `building`, etc.) in their own declaration, collapsing the three-source-of-truth.

For features 1–2, the substrate is "safe to rely on" at **coverage ≥80 % + observation-only run for ≥7 days**. For feature 3, **coverage = 100 %**. Until coverage is high, the resolver must remain JSON-driven.

This implies an ordering: **the registry can be consumed by Stage 6 and 7 only after coverage is high.** Stages 6 and 7 of `DECOMPOSITION_STRATEGY_V1` are written assuming the registry is *enabling* them; if registry rollout lags, those stages slip. They cannot be force-shipped without re-introducing the very illusion the registry was meant to remove.

---

## 5. WHAT MUST REMAIN DEFERRED

Things that look like Phase B candidates but are not. Each must wait past the end of Phase B for reasons specific to the substrate or topology gap that gates them.

### 5.1 sbFetch wrapper / abstraction layer
The shell-defined `sbFetch` is 1→22 fan-out (`REPO_TOPOLOGY_MAP §2.1`). Wrapping it requires editing 22 call sites in a single coordinated change — forbidden by `MASTER.md §12.2`. **Deferred until** either (a) call sites have all been migrated to declare table-name consumption via `register()`'s `consumes` list, *or* (b) a session-budget is approved for a non-surgical refactor (which is itself a governance decision).

### 5.2 ESM / `<script type="module">` migration
The codebase's "no build step" rule (`MASTER.md §4`) is compatible with ESM in principle (`<script type="module">` works without a bundler). But migration would touch every module file and the script-tag manifest. **Deferred until** module isolation is structurally enforced (level Strict-on-collision at minimum) so the migration doesn't import additional silent failures.

### 5.3 Closure-scoped modules (IIFE wrap)
Level 3 isolation from `FUTURE_LOADER_BOUNDARIES §4`. Higher safety than current; lower cost than ESM. **Deferred until** registry observation has surfaced every undeclared global; closure-scoping a module before its `provides` is complete creates breakage with no diagnostic.

### 5.4 Phase 4 connector work (Windward, BigCommerce, Klaviyo, GA4, GSC, portals)
The orchestration tier (CF Workers vs Supabase Edge Functions) is unmade (`INTEGRATION_TOPOLOGY_FORECAST §5.3`). The per-field authority table does not exist (§6.1 same doc). **Deferred until** both decisions are recorded as governance-only commits. Connector code written before these decisions will need to be rewritten when the decisions land.

### 5.5 AI-orchestration features beyond the current proxy
Things like multi-step agentic flows, RAG retrieval, prompt-template management, per-feature model routing. The current Worker is a 48-line passthrough. **Deferred until** the orchestration tier decision (§5.4 same gate) is made; AI orchestration is a special case of integration orchestration.

### 5.6 Multi-tenant / multi-store generalization
The phrase "AccentOS" is currently single-store (`Accent Lighting Inc.`). Generalizing to other lighting retailers, or to non-lighting verticals, is a marketed long-term vision but is *architecturally undefined*. **Deferred indefinitely**; revisited only after Phase 4 ships and the *current* tenant's needs are stable.

### 5.7 Schema-typed access layer (e.g., a Supabase client wrapper)
Addresses the `sbFetch` abstraction drift (`ARCHITECTURAL_DRIFT_MODEL §6.5`). **Deferred until** §5.1 is reconsidered; both belong to the same eventual conversation.

### 5.8 Test harness
There is no automated test suite. Adding one is a meta-architectural decision (does it run in CI? against a staging Supabase? mocked?). **Deferred until** registry observation has reduced silent breakage frequency to the point where a test harness is for ratchet, not for triage.

### 5.9 Build step / bundler
Repeatedly considered, repeatedly correctly declined (`MASTER.md §4`). **Deferred indefinitely**, possibly permanently. The architectural path described in this pack does not require a build step at any stage.

---

## 6. WHAT MUST NOT BEGIN UNTIL DECOMPOSITION STABILIZES

The strongest "do not start" list. These are not deferred — they are *actively dangerous* to begin before Phase A is stable, because beginning them would re-introduce the very pressures Phase A drains.

### 6.1 New modules in `js/`
Adding a 39th module costs 4 shell touchpoints today (`REPO_TOPOLOGY_MAP §8`). Until the sidebar is generator-driven (Stage 6) and the registry is the visibility source, every new module compounds the orchestration drift. **No new modules during Phase A.** Existing modules can be patched (with `?v=` bumps); new ones wait.

### 6.2 New `<script>` tags in `index.html`
Same reason as 6.1. The script-tag manifest is the implicit dependency graph (`COUPLING_REDUCTION_PATTERNS §8`). Every insertion is a hidden-temporal-coupling decision. **No new script tags during Phase A** except the ones introduced by Phase A stages themselves.

### 6.3 New `data-roles` attributes in the shell sidebar
Adding visibility entries before Stage 6 (sidebar generator) cements the three-source-of-truth. Every addition makes the eventual generator migration costlier. **No new `data-roles` entries during Phase A.**

### 6.4 New rules in `MASTER.md §12`
Each rule is a discipline (`COUPLING_REDUCTION_PATTERNS §4`). Adding more disciplines while reducing the surface they apply to means net rule density rises just as code density falls. **Pause rule-adding during Phase A**; revisit at Phase A end with a consolidation pass.

### 6.5 New Phase 4 integration scaffolding
Any code that begins to mirror an external system's state into Supabase, or that sets up webhook receivers, is dual-write surface in waiting. The hazard is identified in `INTEGRATION_TOPOLOGY_FORECAST §13`. **No connector code during Phase A.**

### 6.6 New SQL migrations beyond M40
The migration sequence is at M40. Adding M41+ during Phase A is *not* forbidden — bounded use cases will arise — but the threshold rule is: a new migration is only justified if it unlocks a Phase-A stage. Migrations that unlock Phase B / Phase 4 wait. **Triage every M41+ candidate against "does it unblock decomposition?"**

### 6.7 Re-architecting the auth model
The Roles list (Owner/Admin/Manager/Sales/Warehouse) is documented and live. Adding new roles, splitting roles, or introducing tenancy (per §5.6) is forbidden until Phase 4 connector identity needs are clear. **Auth shape is frozen during Phase A.**

### 6.8 Multi-Claude-session swarms
Running parallel Claude sessions on the same branch (or even on different branches landing on `main` simultaneously) is forbidden until the *single-session* protocol has been generalized to multi-session. `MASTER.md` describes Session A / Session B at the *human* level, not at the *code* level. **Parallel swarms during Phase A guarantee merge conflicts in `index.html`.**

### 6.9 Renaming existing globals
`sbFetch`, `CU`, `toast`, `openModal`, `$`, `qsa`, `esc`, `csvDownload`. These are the implicit public API. Renaming any of them is a 38-module touch. The renaming may eventually be desirable but **must not begin until at least Stage 7 lands** and the renaming is part of an explicit deprecation flow.

---

## 7. THE PHASE B SHAPE (CONCEPTUAL)

What Phase B *is*, expressed in one paragraph:

> Phase B is the migration of every existing module from implicit globals to declared `provides`/`consumes` via `register()`, the gradual elevation of registry strictness from `warn` to `throw` per gradient, and the consumption of the registry by the sidebar generator (replacing the three-source-of-truth) and by the auth extraction (Stage 7). It does not add features. It does not connect external systems. It does not touch the Cloudflare Worker. It is a coverage-driven discipline that converts AccentOS's coordinated modularity into observed modularity, and only after that conversion is mature, *Phase C* (the Phase 4 integration program) becomes architecturally tractable.

Phase B has no fixed length. It is bounded by coverage thresholds, not by calendar dates. A single session can move coverage from 13 % to 16 %; that is progress. There is no failure mode of Phase B other than abandoning it midway.

---

## 8. THE PHASE C SHAPE (PREVIEW, NOT IN SCOPE)

Phase C is **Phase 4 connector work** plus its supporting orchestration tier. It is described in `INTEGRATION_TOPOLOGY_FORECAST` and the answers it requires are governance decisions:

1. Cloudflare Workers vs Supabase Edge Functions tier.
2. Per-field authority table.
3. Shared reconciler pattern.
4. Identity reconciliation strategy across Windward × BigCommerce × AccentOS.
5. Edge-function deployment story (one-monorepo vs split).

Phase C **must not begin** until Phase B is stable. Stability is the same definition as §1: one week without a regression introduced by Phase B work, plus registry coverage ≥80 %, plus the five governance decisions ratified.

This document does not detail Phase C — that is for a future doc once Phase B is on the runway. Naming Phase C here is to establish that *something exists beyond Phase B*, so the temptation to compress Phase B because "we still need integrations" is identified and resisted.

---

## 9. THE PHASE-TRANSITION CRITERIA

A compact table — what each transition requires:

| Transition | Required signals |
|---|---|
| Pre-Phase-A → Phase A | Cartography pack ratified; `DECOMPOSITION_STRATEGY_V1` accepted as plan-of-record; next session ready to ship Stage 1 |
| Phase A → Phase B | Stages 1–5 + A merged; `MASTER.md §3/§4` currency commit landed; `register()` exists in `shell_utils.js`; first three modules registered without warnings; one full session without index.html touch beyond `?v=` |
| Phase B → Phase C | Coverage ≥80 %; one week observation-only without unresolved warnings; orchestration-tier decision recorded; per-field authority table doc exists; shared-reconciler pattern proposed (not implemented) |
| Phase C → steady state | First two Phase 4 connectors shipped; reconciler pattern in use by both; no `BUILD_INTELLIGENCE.md` entry for connector-related dual-write in 30 days |

Each transition produces a governance-only commit that updates `MASTER.md §3 / §4` to reflect the new state. Without the commit, the system is still in the previous phase.

---

## 10. THE LONG-RANGE INVARIANTS

Things that hold regardless of phase. Listed because they are the few load-bearing decisions that should not be re-litigated session by session:

1. **No build step.** Vanilla JS forever. (`MASTER.md §4`.) The architectural path in this pack is consistent with this; no stage requires a build step.
2. **Surgical patches.** Mutation pattern is `str_replace`, never rewrite. (`MASTER.md §12.2`.) The decomposition stages are themselves surgical; the only "rewrites" are *extractions*, which are surgical at byte level.
3. **Supabase remains the single mirror.** Even when Phase 4 integrations land, every external system writes into Supabase (or has Supabase reflect it). No alternate data store.
4. **One worker tier OR one edge-function tier, not both.** The Phase C choice is *exclusive*. Mixing them is the orchestration-tier overgrowth case.
5. **Naming is the dominant lever.** Every architectural improvement in this pack — `register()`, per-field authority, `MASTER.md §3` update, sidebar generator — is a naming act. The codebase improves by *writing things down*, not by *adding software*.
6. **`MASTER.md` is updated at every phase transition.** Documentation drift is the only drift class that can be repaired by writing.

These six are the invariants. Everything else is staged work against them.

---

## 11. PARKING-LOT ITEMS (TRACKED, NOT IN ANY PHASE)

Architecturally meaningful items that have no current home. Listed so they are not lost:

- **`patch_quote.js` ultimate fate** — currently a root-level Node executable. Run-once-and-delete OR relocate to `patches/`. Trivial; closes a side-channel.
- **Cache-bust automation (`?v=`)** — Stage H(b). Governance-gated. Choose deploy-time hash injection OR formalize the manual rule in `MASTER.md`.
- **`BUILD_INTELLIGENCE.md` curation** — append-only growth is on track to become a session-boot token tax. A *consolidation pass* (collapse old lessons that are no longer surprising) is a Phase B candidate.
- **Skills ecosystem coverage** — 30 skills exist; `_index.md` lists discoverable ones. Coverage of which skills are actually invoked vs idle is an `efficiency-monitor` follow-on.
- **The cartography pack itself** — should it be linked from `MASTER.md` (governance commit) so future Claude sessions pick it up at boot? Decision deferred to whoever is updating §3/§4.
- **Codespace dependency** — `MASTER.md §12.1` requires Codespace-only builds. A single-environment dependency. Out of scope for this pack but on the long list.
- **Test harness shape (when adopted)** — see §5.8.

---

## 12. SUMMARY

| Question | Answer |
|---|---|
| What comes after `index.html` decomposition? | Phase B: registry coverage rollout + strictness elevation + sidebar/auth consumption of registry. |
| When does module isolation begin? | At the first clean `register()` run for one module after Stage 2 ships. |
| When do loader boundaries begin? | When strict-on-collision is enabled (≥60 % coverage, 14 zero-collision days). |
| When does `register()` become safe to rely on? | Coverage ≥80 % + 1 week observation-only without unresolved warnings. |
| What remains deferred past Phase B? | sbFetch wrapper, ESM, IIFE closure, Phase 4 connectors, AI orchestration, multi-tenant, schema-typed access, test harness, build step. |
| What must not begin until Phase A stabilizes? | New modules, new `<script>` tags, new `data-roles`, new `MASTER.md §12` rules, Phase 4 scaffolding, M41+ outside Phase A unlock, auth re-architecture, Claude swarms, renaming existing globals. |
| The Phase B shape | Migration of every module to declared provides/consumes; registry strictness elevation; downstream consumption by sidebar and auth. No features, no integrations, no worker changes. |
| The Phase C shape | Phase 4 connectors + orchestration tier. Begins only when Phase B is stable. |
| Long-range invariants | No build step. Surgical patches. Supabase as single mirror. One orchestration tier. Naming is the dominant lever. `MASTER.md` updated at every transition. |

---

*See `TRACK_LAYER_MAP.md` for the layered track-by-layer view of where each item sits, and `TRAIN_SPEED_LIMITS.md` for the per-action speed/freeze table.*
