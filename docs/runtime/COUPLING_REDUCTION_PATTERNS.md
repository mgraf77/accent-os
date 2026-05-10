# COUPLING_REDUCTION_PATTERNS

> Catalog of coupling patterns observed in or forecast for AccentOS, classified by safety,
> scaling behavior, and propensity to silently compound.
> Analysis only — no implementation, no refactor, no runtime change.
> Continues the cartography pack: `REPO_TOPOLOGY_MAP.md`,
> `FROZEN_FILE_PRESSURE_ANALYSIS.md`, `SAFE_MUTATION_ZONES.md`,
> `DECOMPOSITION_STRATEGY_V1.md`, `MODULARITY_ILLUSION_ANALYSIS.md`,
> `FUTURE_LOADER_BOUNDARIES.md`, `INTEGRATION_TOPOLOGY_FORECAST.md`.
> Snapshot date: 2026-05-10.

---

## 0. ONE-PAGE FRAMING

Coupling is not a single thing. The word covers a family of relationships, each with its own scaling behavior. Some forms of coupling are cheap, observable, and scale linearly — those are safe. Some are silent, compounding, and create future frozen files — those are dangerous.

This catalog enumerates every coupling pattern present in or forecast for AccentOS, classifies each by **safety** (safe / dangerous), **observability** (observed / unobserved), and **scaling shape** (linear / silently compounding / discontinuous), and explicitly identifies the patterns that — if left alone — will produce the next generation of `index.html`-class frozen files.

Three findings up front:
1. **Most coupling in AccentOS today is at the unobserved end of the catalog.** The orchestration tax (`MODULARITY_ILLUSION §7`) is paid because discipline substitutes for observation.
2. **Coupling that scales is coupling that is named.** Naming converts dangerous coupling into safe coupling almost regardless of any other change.
3. **Coupling becomes future-frozen-file when its consumer count crosses a threshold without ever having been declared.** `sbFetch` (1→22) is the canonical case in current code; the future-Phase-4 reconciler is the canonical case in forecast code.

---

## 1. THE COUPLING TAXONOMY

Eight pattern classes, in roughly increasing risk:

1. **Observational coupling** — A reads B's state for diagnostic purposes; A does not depend on B's behavior.
2. **Declared interface coupling** — A reads/calls B through a named, documented surface.
3. **Conventional coupling** — A reads/calls B through a discipline-held convention.
4. **Orchestration coupling** — A and B do not know about each other; an external party coordinates their state.
5. **Runtime coupling** — A and B share live runtime state at use time.
6. **Governance coupling** — A and B agree because a doc says they should.
7. **Hidden temporal coupling** — A relies on B running before/after it, but the relationship is undeclared.
8. **Synchronization coupling** — A and B must converge on the same value across asynchronous channels.

Each pattern is examined below: where it lives in AccentOS today, where it's forecast to appear, what it costs, and what — if anything — converts it from dangerous to safe.

---

## 2. OBSERVATIONAL COUPLING (safe)

### Definition
A reads B's state to *report on* B; A's behavior does not change based on B. Examples: a status panel, a logger, a diagnostic.

### Where it lives in AccentOS today
- `efficiency-monitor` skill reads session-level signals (retry-loops, redundant-reads, etc.) without affecting them.
- `health.js` displays system status without changing it.
- `scripts/status.sh` queries git/file state at session boot.
- `BUILD_INTELLIGENCE.md` — observation of past sessions.

### Why it is safe
A's failure does not affect B. B can be refactored, removed, or renamed without touching A — A just loses its readout.

### Scaling behavior
**Linear.** Adding one more observer is cheap; observers do not interact with each other.

### What converts dangerous coupling into observational
*Adding a registry-like substrate* (see `FUTURE_LOADER_BOUNDARIES`). The `register()` concept is itself an observational-coupling pattern: it watches what modules declare without controlling what they do.

---

## 3. DECLARED INTERFACE COUPLING (safe — the goal state)

### Definition
A reads/calls B through a *named* surface; the name is the contract. Adding a consumer of B is a declared act; removing the surface is a known-blast operation.

### Where it lives in AccentOS today
**Almost nowhere structurally.** Two near-misses:
- The Cloudflare Worker — `worker/anthropic-proxy.js` exposes one HTTP endpoint; the contract is the URL + the request shape.
- `module_modes.json` — names every module; `js/module_modes.js` reads them by name. Closer to declared than the surrounding code.

### Where it is *claimed* but not actually structural
- `sbFetch(path, opts)` is a named function, but the *path* is a free-form URL that names a Supabase table. Half-declared.
- Sidebar `<a data-roles="..."`> is a named attribute, but the role list is free-form.

### Why it scales
Each declared coupling is searchable. "Who calls `register()`?" is one grep; "Who reads `customers` table?" today requires N module reads.

### Scaling behavior
**Linear** — the declared surface is the cost; consumers cost almost nothing.

### What converts to it
The `register()` substrate proposed in `FUTURE_LOADER_BOUNDARIES`. Stage 2 of `DECOMPOSITION_STRATEGY_V1` lays the ground.

---

## 4. CONVENTIONAL COUPLING (dangerous-when-implicit; safe-when-codified)

### Definition
A reads/calls B because a discipline says so. The convention is real, but only enforced by memory + grep.

### Where it lives in AccentOS today (extensive)
- `_<modulePrefix>` global state naming convention.
- `?v=6.10.x` cache-bust convention.
- "Surgical `str_replace` patches only" rule.
- "Inline `onclick` handlers must use `${...}`" rule.
- "Use `VD_RAW` not `VENDORS`" rule.
- "Module Isolation" claim itself.

### Why it is dangerous
Conventions hold until an operator forgets, leaves, or hands off to a fresh session. They scale with the operator, not with the codebase.

### Scaling behavior
**Silently compounding.** Every new module adds a new convention to remember; conventions interact non-linearly (rule about onclick × rule about template literals × rule about `VD_RAW` → triple the cognitive load on one inline handler).

### What converts dangerous to safe
Either (a) machine-checked at edit time (lint, precommit), or (b) replaced by a *named* declared surface (§3). AccentOS today has neither for any of its conventions. `BUILD_INTELLIGENCE.md` is a *post-hoc* convention substitute — operators read it after a violation, not before.

---

## 5. ORCHESTRATION COUPLING (mixed — depends on substrate)

### Definition
A and B do not call each other; a third party coordinates them. A and B can be swapped, replaced, scaled independently — but the coordinator becomes the bottleneck.

### Where it lives in AccentOS today
- `goTo(page)` in the shell coordinates between modules. Modules don't know about each other; `goTo` activates the right one.
- `module_modes.js` `_goToModeWrapped` wraps `goTo` to enforce mode-based gating.
- `applyRoleVisibility` coordinates sidebar items against role state.

### Where it is forecast to appear
- The §5/§8 reconciler in `INTEGRATION_TOPOLOGY_FORECAST` — every Phase 4 inbound integration produces a reconciler that orchestrates between Supabase mirror + external system.
- Edge-function tier (CF Workers or Supabase EFs) — orchestrates webhooks + scheduled syncs + outbound writes.

### Why it can be safe
Orchestration coupling moves complexity *into* the coordinator, where it is observable in one place. A well-named coordinator is a declared interface (§3) that collects the orchestration logic.

### Why it can be dangerous
A poorly-shaped coordinator becomes a future frozen file. **The shell itself is an orchestration coupling that grew past its substrate** — `index.html` orchestrates 38 modules, the design system, auth, the script-tag manifest, and is now one of the highest-pressure files in the repo.

### Scaling behavior
Depends entirely on whether the coordinator is sized correctly. Linear if scoped; silently compounding if it absorbs new orchestration concerns over time.

---

## 6. RUNTIME COUPLING (always present; safe-when-bounded)

### Definition
A and B share live runtime state during execution. They are simultaneously alive.

### Where it lives in AccentOS today (everywhere)
- All 38 modules share `window`.
- The shell maintains `CU` (current user); every module reads it.
- `MODULE_MODES` (loaded at hydrate) is read by sidebar gating + every navigation.
- `aos-sb-key` in sessionStorage is read by every Supabase call.

### Why it is dangerous in current shape
There is no boundary on what runtime state is shared. Any module can mutate any global. The runtime topology is a flat shared object.

### Where it can be tamed
- IIFE per module (Level 3 isolation in `FUTURE_LOADER_BOUNDARIES §4`).
- Per-module `window.AOS.<name>` namespacing.
- Closure-scoped state with explicit declared exports.

None of these is in current code.

### Scaling behavior
**Discontinuous.** It is fine until the first silent collision; one collision later, it requires emergency triage. The catastrophic case in §6 of `MODULARITY_ILLUSION` is exactly this.

---

## 7. GOVERNANCE COUPLING (safe-when-living; dangerous-when-stale)

### Definition
A and B agree because a *document* says they should. The document is the contract; drift between document and reality is the bug.

### Where it lives in AccentOS today
- `MASTER.md` — claims architecture, code patterns, module list, schema.
- `BUILD_PLAN_CLAUDE.md` / `BUILD_PLAN_MICHAEL.md` — claims what's done, what's next.
- `MODULE_MODES.md` — claims the resolution order for module visibility.
- `BUILD_INTELLIGENCE.md` — claims past lessons.
- `KPI_CATALOG.md` — claims metric definitions.

### Why it is sometimes safe
A correctly-maintained governance document is a *single source of truth*. Operators consult it; behavior aligns; new contributors onboard fast. AccentOS's `BUILD_INTELLIGENCE.md` is unusually mature for a single-operator project.

### Why it goes dangerous
The moment a doc lags reality, every operator who trusts the doc is wrong. **`MASTER.md` §3 already describes a 4-module post-split world; reality is 38 modules.** Drift is silent — there is no test for "is the architecture section accurate?"

### Scaling behavior
**Silently compounding.** Each new module not reflected in the architecture section is a small lie; lies don't subtract on their own. (See `ARCHITECTURAL_DRIFT_MODEL`.)

### What keeps it safe
A live update protocol. AccentOS has one (per `MASTER.md` §2 — "This file is updated at the end of every working session"), and the rule is regularly applied to §15 (Session Log) but irregularly to §3/§4 (architecture). The drift accumulates in the parts that are easiest to forget because they don't appear in daily session work.

---

## 8. HIDDEN TEMPORAL COUPLING (always dangerous)

### Definition
A relies on B running before A — or vice versa — but the relationship is not declared anywhere. Order matters; order is conventional; order is silent.

### Where it lives in AccentOS today
- The script-tag manifest at `index.html:7131-7167`. Every module's position relative to its dependencies is *the* dependency declaration. No other source.
- The boot sequence: `tryRestoreSession` → `activateApp` → `hydrateFromSupabase` → individual module hydrate functions. The order is correct because the shell is written in that order; no module declares "hydrate me after auth."
- `sbLoadModuleModes` must complete before `applyRoleVisibility` runs; the only guarantee is sequential execution inside the shell's hydrate function.
- `sbFetch` must be defined before any module's top-level code runs, because some modules' top-level code calls it. The protection: shell inline `<script>` is parsed before the `<script src=...>` tags.

### Why it is dangerous
- A reordering of script tags (or a future async `<script>` migration) silently changes runtime semantics.
- A module added at the wrong position can read an undefined value at top-level and silently no-op.
- A future async-load optimization (deferred, type=module, etc.) breaks the implicit guarantees.

### Scaling behavior
**Discontinuous + opaque.** It is fine for as long as nothing changes about load order. Any change at all flips the assumption set.

### What converts to safe
Lifecycle hooks (`onBoot`, `onMount`) declared per module via `register()` (`FUTURE_LOADER_BOUNDARIES §5`). The dispatcher then enforces order; modules don't rely on script-tag position. Until then, every script-tag insertion in `index.html` is a temporal-coupling decision.

---

## 9. SYNCHRONIZATION COUPLING (forecast — catastrophic-when-silent)

### Definition
A and B must converge on the same value, but they update independently across asynchronous channels.

### Where it lives in AccentOS today
- Supabase Realtime channels in `internal_meetings.js` — local in-memory state vs server state vs other-clients' state. **Today's only sync coupling.** The module handles it explicitly with channel state flags (`IM_RT_LIVE_CHAN`, `IM_RT_LIVE_LIST`).
- `localStorage` `accentos_user_overrides` ↔ Supabase `user_module_overrides` table. Already partial-sync (`_syncOverridesFromSupabase` in `js/module_modes.js`). One channel.

### Where it is forecast to appear (extensively)
- Every Phase 4 integration is a synchronization-coupling source. Specifically the dual-write hazard from `INTEGRATION_TOPOLOGY_FORECAST §13`.
- Klaviyo segments (push from AccentOS, edit in Klaviyo UI).
- Customer profile fields (Windward × BigCommerce × AccentOS).
- Inventory levels (Windward POS × AccentOS PO receipt × BigCommerce ecommerce sale).
- Audit logs (4 systems, no unified timeline).

### Why it is the worst pattern
- Failure is silent — last writer wins, no log, no error.
- Eventual consistency is the *expected* state during the gap; bugs hide inside expected behavior.
- Every recovery requires a reconciliation step; the reconciler itself is a sync-coupling source.
- Operators stop trusting fields once they've been visibly overwritten; trust loss does not recover.

### Scaling behavior
**Silently compounding into data rot.** Every sync gap that goes wrong leaves bad data in the database; bad data outlives the bug.

### What converts to safe
Per-field declared authority (`INTEGRATION_TOPOLOGY_FORECAST §6`). It does not eliminate sync coupling; it makes its outcome predictable. *That is the only known mitigation.*

---

## 10. SUMMARY TABLE: SAFETY × SCALING × OBSERVABILITY

| Pattern | Today's prevalence | Safety | Scaling | Observability | Where it lives |
|---|---|---|---|---|---|
| Observational | low | safe | linear | observed | `efficiency-monitor`, `health.js`, `status.sh` |
| Declared interface | very low | safe | linear | observed | Worker proxy, `module_modes.json` |
| Conventional (codified) | none yet | safe | linear | observed | (target state for `?v=`, etc.) |
| Conventional (implicit) | very high | dangerous | silently compounding | unobserved | every `MASTER.md` discipline rule |
| Orchestration (well-shaped) | low | safe | linear | observed | (target state for shell) |
| Orchestration (overgrown) | high | dangerous | silently compounding | partial | `index.html` itself |
| Runtime (bounded) | none yet | safe | linear | observed | (target state for module scope) |
| Runtime (unbounded) | very high | dangerous | discontinuous | unobserved | `window.*` shared by 38 modules |
| Governance (live) | medium | safe | linear | observed | `BUILD_INTELLIGENCE`, session log |
| Governance (stale) | medium | dangerous | silently compounding | unobserved | `MASTER.md` §3/§4 |
| Hidden temporal | very high | dangerous | discontinuous | unobserved | script-tag manifest order, hydrate sequence |
| Synchronization (explicit) | low | bounded | linear if scoped | observed | `internal_meetings.js` Realtime |
| Synchronization (implicit) | forecast — high | catastrophic | silently compounding into data rot | unobserved | every Phase 4 integration |

The *safe* rows above and the *dangerous* rows describe the same underlying mechanism — what differs is observability. **Naming a coupling is most of what makes it safe.** The catalog reduces, in practice, to: *which coupling is named, which is not.*

---

## 11. COUPLING THAT SCALES

The patterns that scale linearly with codebase size:
- Observational coupling — adding observers is independent of system size.
- Declared interface coupling — adding consumers of a named surface is one entry per consumer.
- Codified conventional coupling (lint-checked / precommit-checked) — the lint rule is a fixed cost.
- Bounded orchestration coupling — when the coordinator is sized to one concern.
- Bounded runtime coupling — IIFE / closure-scoped modules.
- Live governance coupling — when docs are updated as part of normal flow.

These are the patterns AccentOS should *prefer* whenever a new coupling is introduced. The cheapest way to ensure that happens is to make the alternative more expensive — which is what `register()` does (it makes declared coupling literally one line, beating the implicit alternative).

---

## 12. COUPLING THAT SILENTLY COMPOUNDS

The patterns that look fine for a long time, then suddenly aren't:
- Implicit conventional coupling — looks fine until the convention is violated by an operator who doesn't know.
- Overgrown orchestration coupling — looks fine until the coordinator's size makes it un-refactorable.
- Unbounded runtime coupling — looks fine until two modules collide.
- Stale governance coupling — looks fine until a new operator trusts the doc.
- Hidden temporal coupling — looks fine until the load order changes.
- Implicit synchronization coupling — looks fine until two writers race.

**Each of these is present in AccentOS today.** Several at high concentration. The compound case is the real concern: the shell is *simultaneously* an overgrown orchestrator, an unbounded runtime, a stale governance source, and a hidden-temporal manifest. That is not a coincidence — it is a description of the same phenomenon (lack of named surfaces) viewed from four angles.

---

## 13. COUPLING THAT CREATES FUTURE FROZEN FILES

A *frozen file* (in the sense of `FROZEN_FILE_PRESSURE_ANALYSIS`) is a file that has accreted enough coupling that touching it is risky regardless of the touch's content. The conditions:

1. **Many consumers, none declared.** The file's interface is not named, so the consumer count cannot be enumerated.
2. **Mixed concerns.** The file has absorbed multiple orthogonal responsibilities.
3. **High blast radius per touch.** Any edit can affect any consumer.
4. **No isolation substrate.** Cannot extract concerns because dependencies are unknowable.

The current frozen file (`index.html`) hits all four conditions. The forecast generates more candidates:

| Future candidate | Conditions met today | Conditions met by Phase 4 |
|---|---|---|
| `internal_meetings.js` | (1), (2) | (1)–(4) if it grows another ~1k LOC |
| The (yet-unbuilt) reconciler tier | n/a | (1)–(4) by default unless declared up front |
| The (yet-unbuilt) role-claim surface | n/a | (3), (4) |
| The (yet-unbuilt) customer-identity reconciler | n/a | (1)–(4) — *guaranteed* future frozen file |
| Klaviyo segment manager | n/a | (1)–(4) — dual-write hazard concentration |

The pattern: **future frozen files are forecastable from the integration topology.** Every place where multiple integrations write to the same Supabase table without declared authority will become a frozen file. The customer-identity reconciler will become one regardless of how it is built unless authority is declared.

---

## 14. COUPLING-REDUCTION RULES OF THUMB

A short pragmatic list, derived from the above:

1. **Name every coupling that crosses a file boundary.** A function, a contract, a registry entry — anything that converts the coupling from "discoverable by grep" to "discoverable by registry query."
2. **Prefer adding to a declared surface over inventing a new one.** Each new surface has its own discipline cost; consolidation is cheaper.
3. **Make synchronization explicit before it appears.** The first integration's authority decision is the cheapest one to make; the fifth integration's is forced by accumulated drift.
4. **Treat governance docs as code.** Same review, same update protocol. Stale governance coupling is dangerous coupling.
5. **Never rely on script-tag order without acknowledging it.** Lifecycle hooks are cheaper than an undeclared boot sequence.
6. **When in doubt, observe before enforce.** A non-blocking warning is enough to make a coupling visible; enforcement can come later. (`register()` is exactly this.)
7. **Refuse dual-write into shared state without a declared winner.** The cost of a per-field authority table is one markdown doc; the cost of fixing a year of dual-write rot is unbounded.
8. **Bound the orchestrator before it grows.** Every coordinator is a future frozen file unless its scope is declared and held.

These are not rules AccentOS has formally adopted. They are *the rules implied* by the patterns above.

---

## 15. SUMMARY

| Question | Answer |
|---|---|
| Coupling that scales | Observational, declared interface, codified conventional, bounded orchestration, bounded runtime, live governance |
| Coupling that silently compounds | Implicit conventional, overgrown orchestration, unbounded runtime, stale governance, hidden temporal, implicit synchronization |
| Coupling that creates future frozen files | Many-consumers-none-declared + mixed-concerns + high-blast + no-isolation-substrate |
| Today's most-prevalent dangerous pattern | Unbounded runtime coupling (38 modules sharing `window`) |
| Highest-blast forecast pattern | Implicit synchronization (Phase 4 dual-write without authority) |
| Cheapest universal mitigation | Naming. A coupling that is named (via registry, contract, or doc-with-update-protocol) becomes observable, and observable coupling is most of the way to safe. |
| Earliest place to apply naming | Stage 2 of `DECOMPOSITION_STRATEGY_V1` — `register()` substrate |
| Latest place where naming retrofit costs more than building right | Customer-identity reconciler (forecast); Klaviyo segment authority (forecast) |

---

*See `ARCHITECTURAL_DRIFT_MODEL.md` for how the absence of these named couplings shows up over time as drift, false confidence, and eventual re-foundation pressure.*
