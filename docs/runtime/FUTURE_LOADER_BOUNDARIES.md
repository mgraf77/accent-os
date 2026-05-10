# FUTURE_LOADER_BOUNDARIES

> Conceptual definition of the smallest possible runtime-boundary system AccentOS could grow into.
> Analysis only — no implementation, no loader created, no runtime mutation, no governance edit.
> Companion to `MODULARITY_ILLUSION_ANALYSIS.md` and `DECOMPOSITION_STRATEGY_V1.md`.
> Snapshot date: 2026-05-10.

---

## 0. ONE-PAGE FRAMING

`MODULARITY_ILLUSION_ANALYSIS` showed that the gap between AccentOS's modular *surface* and its modular *structure* is the orchestration tax. The cheapest way to close that gap is **not** a build step, **not** a framework, **not** ESM, **not** a bundler, **not** a dependency-injection container. It is one function, called by every module, that *names* what each module provides and consumes. That is enough to convert a silent N×N coupling matrix into an observable graph.

This document defines the conceptual shape of that minimum boundary system. It does not propose code, does not propose a name, does not propose a release timeline. It defines the *concepts* — what a future loader boundary needs to express — so that when the codebase is ready to add one, the design can be evaluated against an explicit checklist rather than re-invented from scratch.

The system has six conceptual surfaces:
1. **Module identity** — every module has a name.
2. **Provide/consume declaration** — every module names what it offers and needs.
3. **Lifecycle ownership** — every module has explicit hooks for boot, mount, unmount.
4. **Registration step** — a single call site that the registry observes.
5. **Mutation containment** — declared globals are tracked; undeclared mutation is observable.
6. **Observability** — the registry's state is inspectable at runtime.

None of these requires a build step. All can be implemented in vanilla JS at script-tag-load time. The system is **observation-first**, blocking-second — it warns about violations before it ever throws on them.

---

## 1. WHAT A LOADER BOUNDARY SYSTEM NEEDS TO DO

Listed against the recurring orchestration costs from `MODULARITY_ILLUSION_ANALYSIS §7`:

| Tax (current) | What the boundary must do |
|---|---|
| Read entire shell to find a unique `old_string` | (Out of scope; this is a shell-size problem, addressed by `DECOMPOSITION_STRATEGY_V1`.) |
| Grep `js/*.js` to verify no global is redefined | Detect collisions at registration time and warn. |
| Bump `?v=6.10.x` correctly | Provide a hook for cache-bust generation; ideally consume a build-time hash. (Optional.) |
| Update sidebar + module_modes.json + data-roles | Provide one source of truth for module identity + role gates; sidebar is generated from the registry. |
| Verify a removed global has no consumers | Track consumers of every declared global. Removal becomes a registry query, not a grep. |
| Read `BUILD_INTELLIGENCE.md` at session boot | (Out of scope; that is a discipline log.) |
| Cross-reference 3 sources for module mode | Collapse to one source: the registry. |

So the system has to do four concrete things, in order of importance:
1. **Detect symbol collisions and missing consumers at registration time.**
2. **Be the single source of truth for module identity + role visibility.**
3. **Track lifecycle (boot/mount/unmount) so modules can be activated and deactivated cleanly.**
4. **Expose its state for inspection.**

Everything else (cache-busting, lazy-loading, error boundaries) is optional and can be added later without breaking the core.

---

## 2. CONCEPT: MODULE IDENTITY

Every script under `js/` represents one module. A module needs a single, canonical name.

### Concept properties
- **Name uniqueness** — two modules cannot share a name.
- **Stable across renames** — file rename should not break consumers.
- **Human-readable** — `customers`, not `c12n8`.
- **Matches registry key** — same identifier as in `module_modes.json` and the (future) sidebar generator.

### What this resolves
- The current pattern: a module's identity is implicit in its filename and its `<script src>` tag and its `module_modes.json` key. Three places, one concept, no enforced equality.
- After: one declared name, equality enforceable by the registry.

### What it does *not* resolve
- It does not give modules ESM-style closure scoping. Modules remain `<script>` tags. Identity is a *label*, not a *scope*. Scope is a separate concern (see §3).

---

## 3. CONCEPT: PROVIDE / CONSUME DECLARATION

Every module declares the set of `window.*` symbols it adds to the namespace and the set it reads.

### Concept properties
- **`provides`** is a list of names the module *adds* to `window`. (e.g. `customers` provides `_custDeb`, `customersInit`, etc.)
- **`consumes`** is a list of names the module *reads* from `window`. (e.g. `customers` consumes `sbFetch`, `CU`, `toast`, `openModal`.)
- **Declared early** — both lists are passed at registration time, not inferred.
- **Non-exhaustive is acceptable initially** — modules may under-declare in early phases; the registry warns but does not block.

### What it makes possible
- **Collision detection.** Two modules in the same load cycle that both `provides` `_dlDeb` get a single warning at registration. Today this is invisible.
- **Dependency check.** A module that `consumes` `sbFetch` registers; the registry confirms `sbFetch` is provided by some prior module (the shell). If not, the registry warns. Today this is a runtime `undefined` at first call.
- **Removal safety.** A change that removes a `provides` entry can be cross-referenced against every `consumes` entry that names it. *That* is the moment "Module Isolation" becomes structurally checkable.

### What it explicitly is *not*
- **Not** an import/export system. Modules continue to attach to `window`. The declaration is a *map of what they put there*, not a redirection of where it lives.
- **Not** type-checked. Names are strings. Validation is set-based.
- **Not** a package manifest. There is no version, no semver, no resolver.

### Worked example (illustrative, not implementation)
```
// At top of js/customers.js (conceptually):
register({
  name: 'customers',
  provides: ['_custDeb', 'customersInit', 'customersHydrate'],
  consumes: ['sbFetch', 'CU', 'toast', 'openModal', '$', 'qsa']
})
```
The registry now knows: customers depends on six shell-provided symbols and adds three of its own. Any future change to those sets is observable.

### Worked example of value
The current `BUILD_INTELLIGENCE.md` has an entry: *"0.2.B Settings Users panel — legacy reference to removed `USERS{}` global → would have thrown ReferenceError in production if not caught."* Under the registration concept, removing `USERS{}` from any module's `provides` would have produced an immediate registry warning naming every module that still consumed it — *at script load time, in the dev console, before any user clicked a thing.*

---

## 4. CONCEPT: ISOLATION

The point of isolation is to make "a bug in Customers never affects Vendor Intelligence" structurally true rather than aspirationally true.

### Levels of isolation, weakest to strongest

| Level | Mechanism | Available without build step? |
|---|---|---|
| 0 — None (today) | All globals shared; no enforcement | yes |
| 1 — Naming convention | `_<modulePrefix>` for module state | yes (current discipline) |
| 2 — Declared provides/consumes | Registry checks names against declarations | **yes** — the minimum viable shift |
| 3 — Closure scope | Each module wrapped in IIFE; only declared exports leak to `window` | yes (manual IIFE wrapper); requires touching every module |
| 4 — Module-scoped require | Each module receives a sandboxed object instead of `window` | requires loader |
| 5 — ESM / proper modules | `<script type="module">` with `import`/`export` | requires reorganization but no build |
| 6 — Bundled with import-graph enforcement | rollup/esbuild/webpack | requires build step |

**The minimum useful level is Level 2.** Level 3 is the next step *after* Level 2 has earned trust. Levels 4–6 are out of scope for the choices already made (`MASTER.md` §4 — no build step).

### What Level 2 buys
- Declared boundary is checkable.
- Migration to Level 3 (IIFE) is mechanical once Level 2 has surfaced every undeclared dependency.
- Operators stop paying the grep tax for "what does this module read?"

### What Level 2 does *not* buy
- Cannot prevent a module from reaching for an undeclared global. The runtime allows it. The registry warns about it post-hoc.
- Cannot prevent silent data-shape drift in a shared cache (e.g. `_qaItemsCached`). That requires Level 3 closure or runtime schema validation.
- Cannot enforce read-only access to provided symbols.

Level 2 is *visibility*, not *enforcement*. Visibility is enough to break the orchestration tax.

---

## 5. CONCEPT: LIFECYCLE OWNERSHIP

A module currently has no formal lifecycle. Its file loads, its top-level code runs, it sets a few globals, the user later navigates to its page and a function fires. There is no concept of "this module is active" vs "this module is dormant," no `unmount`, no place to clean up Realtime channels.

### Hooks the boundary should express

| Hook | When it fires | Who owns it |
|---|---|---|
| `onRegister` | At script load, before page interaction | The registry |
| `onBoot` | After auth completes (`activateApp`); module can hydrate state | The shell, calls each registered module once |
| `onMount(page)` | When the user navigates to the module's page | The shell `goTo` wrapper |
| `onUnmount(page)` | When the user navigates away | The shell |
| `onLogout` | When `doLogout` runs | The shell |

### Why this matters
- `js/internal_meetings.js` currently maintains two Realtime channels (`IM_RT_CHANNEL` per-meeting, `IM_RT_LIST`) with manual subscribe/unsubscribe logic spread across page-mount handlers. With explicit `onMount`/`onUnmount`, the channel lifecycle has one declared owner. Today it is reconstructed in every operator's head.
- The current shell-side `_goToModeWrapped` is already the ad-hoc place where mount/unmount could go. Formalizing it costs little.
- Without lifecycle hooks, every module's "I am now active" logic is bespoke. With them, the registry can enumerate which modules are mounted, which are dormant, which haven't booted — useful for both debugging and future `efficiency-monitor` tracking.

### Failure-mode the hooks resolve
*"Customers page leaves a stale `setInterval` alive after navigation."* Today: invisible until performance degrades. Under lifecycle ownership: the `setInterval` is started in `onMount` and cleared in `onUnmount`. If a module forgets `onUnmount`, the registry can warn ("module foo has no unmount handler but provides a long-lived timer").

---

## 6. CONCEPT: REGISTRATION

The single call site that the registry observes is the heart of the system.

### Concept properties
- **Single function**, exposed as a shell global (`aosRegister` or similar).
- **Called once per module**, at the top of that module's file.
- **Synchronous** — registration must complete before the rest of the file runs, so dependencies declared in `consumes` can be checked against the in-flight `provides` set.
- **Idempotent** — calling twice with the same name is a no-op (or a warning); never throws by default.
- **Observation-first** — collisions and missing dependencies generate `console.warn`, never `throw`. The system is non-blocking until trust is earned.

### What `register()` minimally does

1. Verifies `name` is unique against the in-flight registry.
2. Records `provides` and `consumes` against the module name.
3. For each `consumes` entry, checks whether some prior `provides` declared it. If not, warns.
4. For each `provides` entry, checks whether any prior module *also* declared it. If yes, warns.
5. Stores lifecycle hooks (`onBoot`, `onMount`, `onUnmount`, `onLogout`) for the shell to invoke.
6. Updates `window.AOS_REGISTRY` (or similar) for inspection.

That is the whole system. Roughly 30–50 LOC.

### What the shell needs to provide
- **At Stage 2** (`DECOMPOSITION_STRATEGY_V1`): the `register` function itself, in `js/shell_utils.js`.
- **At Stage 7** (or as a post-Stage-2 follow-up): the lifecycle dispatcher (calling `onBoot` after `activateApp`, `onMount`/`onUnmount` from the `goTo` wrapper, `onLogout` from `doLogout`).

The shell-side glue is small. The cost is concentrated in the per-module changes — every module gains one `register({...})` call at the top of its file. **Each such change is a SUPERVISED-tier touch on the module file alone — no shell edit required**, which is why this system can be rolled out incrementally without coordinating with the frozen-shell decomposition.

---

## 7. CONCEPT: MUTATION CONTAINMENT

Once `provides` / `consumes` exist, the registry can observe a stronger property: *did the module mutate `window` in ways it didn't declare?*

### Mechanism (conceptual)
- After registration, the registry can snapshot `window`'s key set.
- After the module's top-level code runs, it can diff. Any new `window.*` key not in the module's `provides` is a *leak*.
- Leaks are warned, not blocked.

### What this catches
- A module that adds `window.tempForDebug = ...` and forgets to remove it.
- A copy-paste from another module that brought along a stray `window._oldDeb`.
- A typo (`window.toats` instead of `window.toast`) that silently created a shadow global.

### What it does not catch
- A module that mutates the *value* of an already-declared global (e.g. reassigns `window.toast = someBrokenFn`). Catching this would require closure scope (Level 3) or `Object.freeze` on declared providers, which is a future enhancement.
- A module that reads from a global it did not declare in `consumes`. Catching this would require either closure-scoped fakes (heavy) or proxy-traps on `window` (browser-permission heavy).

The point is to **detect declared-vs-actual drift cheaply**. Stronger containment is a future addition once the cheap version has surfaced the worst offenders.

---

## 8. CONCEPT: OBSERVABILITY

The registry must be inspectable at runtime — both for human debugging and for future automated checks.

### Surfaces

| Surface | What it returns | Use |
|---|---|---|
| `window.AOS_REGISTRY.modules` | Map of `name → {provides, consumes, lifecycle}` | "What does this module declare?" |
| `window.AOS_REGISTRY.providersOf(name)` | Modules providing a given symbol | "Who owns this global?" |
| `window.AOS_REGISTRY.consumersOf(name)` | Modules consuming a given symbol | "If I rename `sbFetch`, what breaks?" |
| `window.AOS_REGISTRY.warnings` | List of registration warnings issued in this load | Quick health check |
| `window.AOS_REGISTRY.mounted` | Set of currently-mounted modules | Lifecycle debugging |

### Why this matters specifically for AccentOS
- The session-boot protocol already includes a `scripts/status.sh` run. A natural extension: surface the `AOS_REGISTRY.warnings` count from the live app into a CLI status check (or ignore it; the warnings are visible in the console regardless).
- The `efficiency-monitor` skill is positioned to consume this — it already tracks "skill-bypass" and "redo" patterns; module registration warnings are a structurally similar signal.

### Observability vs governance
This system observes *structural* drift (provides/consumes mismatches). It does not observe *governance* drift (a module is `mode: live` in JSON but its sidebar `<a>` is missing). That second kind is addressed by Stage 6 of `DECOMPOSITION_STRATEGY_V1`. The two are complementary: observability fixes hidden coupling, governance collapse fixes the three-source-of-truth illusion.

---

## 9. WHAT THE SYSTEM EXPLICITLY IS NOT

To prevent scope creep at design time:

| Not this | Why not |
|---|---|
| A build step | `MASTER.md` §4 forbids it. The registration system runs at script-tag-load time. |
| A framework | The system is one function plus a small dispatcher. No conventions beyond the registration call. |
| A package system | No versions, no resolution, no semver. |
| ESM | Compatible with vanilla `<script>` tags. Migration to ESM is a future option, not a prerequisite. |
| A test harness | Warnings are diagnostic only. Tests are a separate concern. |
| A DI container | No injection. Modules continue to read `window.*` directly; the registry only *records* who reads what. |
| Mandatory at first | Modules can be added or remain unregistered initially. Registration coverage grows incrementally. |
| Strict | Defaults to non-blocking. Strictness (throw on violation) is an opt-in mode the operator can enable per environment. |

Each line above is a concrete way the system has *not* expanded to swallow other problems. The minimum viable architecture shift is one function and a dispatcher; everything else is later.

---

## 10. WHERE THE BOUNDARY LIVES IN THE STAGED PLAN

Cross-referenced to `DECOMPOSITION_STRATEGY_V1`:

| Concept | Lands in stage | Comment |
|---|---|---|
| `register()` function | Stage 2 (shell utils) | Shipped alongside `toast`/`openModal`/etc. ~30 LOC. |
| First module to call `register()` | Stage 2 follow-up | Pick a small, low-risk module first (e.g. `digest`, `health`, `quick_actions`). |
| Sidewalk migration of remaining modules | Continuous after Stage 2 | One module per session is fine. No deadline. |
| Lifecycle dispatcher (`onBoot` etc.) | Stage 6 / Stage 7 | Naturally fits with sidebar generation and auth extraction. |
| Mutation-containment snapshot | Post-Stage 2, opportunistic | Diagnostic-only; can ship behind a `?debug=1` flag. |
| Strict mode (throw on violation) | Never, until coverage is ≥80 % | Opt-in only; operator decides per-deploy. |

The boundary system **is not a separate project**. It is the natural inhabitant of `js/shell_utils.js` Stage 2.

---

## 11. THE SINGLE MOST DANGEROUS FUTURE DECOMPOSITION MISTAKE — RESTATED

From `DECOMPOSITION_STRATEGY_V1 §11`: the most dangerous mistake is **extracting auth first**. Restated through the loader-boundary lens:

Auth is the most coupled block in the codebase. It depends on `sbFetch`, `applyRoleVisibility`, `CU`, `toast`, `openModal`, the sidebar `data-roles` HTML, and the `_module_modes` resolver. Without a registration system, none of those dependencies is *named*. Extracting auth means hand-discovering each dependency and praying you didn't miss one. **Under the boundary system, the same extraction reduces to: declare `js/auth.js`'s `consumes` list, register, watch the warnings.** The mistake is dangerous *because* the boundary system doesn't exist yet.

This re-framing makes the same point sharper: extracting auth before the registration substrate exists multiplies the orchestration tax. Adding the registration substrate first turns auth extraction from "a careful manual archaeology" into "a checked structural move." **The minimum viable architecture shift is the prerequisite that makes the rest of the decomposition cheap.**

---

## 12. THE EARLIEST SAFE ENFORCEMENT BOUNDARY — RESTATED

From `DECOMPOSITION_STRATEGY_V1 §12`: the earliest safe enforcement boundary is the line between the shell and `js/shell_utils.js` after Stage 2.

That same boundary, expressed in registration terms: **`shell_utils.js` provides the canonical set of utility globals (`toast`, `openModal`, `csvDownload`, `csvStringify`, `$`, `qsa`, `esc`, `v`, `register` itself).** Any other file that re-declares any of those names triggers a registration warning. This is the first enforcement boundary that a machine can check without a build step.

It is enforceable in three ways, in increasing strictness:
1. **Console warning** at registration time (default).
2. **CI grep** in `scripts/` (`grep -nE 'function (toast|openModal|...)\b' js/`) (optional).
3. **Throw on violation** in production builds (opt-in, after coverage is high enough).

Today the line exists conceptually. After Stage 2 + registration, the line is checkable.

---

## 13. THE MINIMUM VIABLE ARCHITECTURE SHIFT — RESTATED

The minimum viable architecture shift is:

> **A `register({name, provides, consumes, [onBoot, onMount, onUnmount, onLogout]})` function in `js/shell_utils.js`, called by every module at the top of its file, recorded in `window.AOS_REGISTRY`, with non-blocking warnings on collision and missing-dependency.**

That is the whole shift. It replaces zero existing functionality. It introduces zero new dependencies. It requires zero changes to the build process (because there is no build process). It can be rolled out one module at a time. It costs roughly 30–50 LOC in shell utils and ~3 LOC per module file.

**It is the smallest possible substrate that converts coordinated modularity into observed modularity.** That conversion is the prerequisite for every harder architectural question that comes after — closure scopes, ESM migration, tree-shaking, framework adoption, dependency injection. None of those is on AccentOS's path today, but all of them assume the substrate that this minimal `register()` provides.

---

## 14. SUMMARY

| Question | Answer |
|---|---|
| What is a future loader boundary system? | A non-blocking registration function plus a registry plus optional lifecycle hooks. ~30–50 LOC of shell utility code. |
| Six concepts it must express | identity, provide/consume, isolation, lifecycle, registration, mutation containment, observability |
| Single most dangerous future decomposition mistake | Extracting auth before this substrate exists |
| Earliest safe enforcement boundary | Shell ↔ `js/shell_utils.js` after Stage 2; "shell utilities owned by one file, period" |
| Minimum viable architecture shift | One `register()` call site, observation-only, opt-in strictness, rollout incremental |
| Where it lands in the staged plan | Stage 2 of `DECOMPOSITION_STRATEGY_V1`; modules migrate continuously thereafter |
| What it explicitly is not | Build step, framework, ESM, package system, DI container, test harness, mandatory |
| What it buys | Visibility into the coupling graph; turns silent N×N dependencies into named edges; auth extraction (and every other future split) becomes a *checked* move instead of an archaeological one |

---

*This document is a conceptual definition only. No `register()` function exists in the repository. No module currently registers. The system as described is a target for a later session, not state of the codebase. See `DECOMPOSITION_STRATEGY_V1.md` for the staging that creates the room, and `MODULARITY_ILLUSION_ANALYSIS.md` for the rationale.*
