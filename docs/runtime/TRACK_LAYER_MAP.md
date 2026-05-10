# TRACK_LAYER_MAP

> Layered map of architectural work for AccentOS — what's on the rail right now,
> what's on the rail ahead, what's at the horizon, what's beyond the horizon, and what's off-rail entirely.
> Analysis only — no implementation, no governance edit, no runtime change.
> Continues the cartography pack: `REPO_TOPOLOGY_MAP`, `FROZEN_FILE_PRESSURE_ANALYSIS`,
> `SAFE_MUTATION_ZONES`, `DECOMPOSITION_STRATEGY_V1`, `MODULARITY_ILLUSION_ANALYSIS`,
> `FUTURE_LOADER_BOUNDARIES`, `INTEGRATION_TOPOLOGY_FORECAST`,
> `COUPLING_REDUCTION_PATTERNS`, `ARCHITECTURAL_DRIFT_MODEL`,
> `POST_DECOMPOSITION_ROADMAP`.
> Snapshot date: 2026-05-10.

---

## 0. THE FIVE LAYERS

Architectural work in AccentOS sits on one of five tracks. The track tells you what *can be done* now, what *will be done* soon, what's *being prepared*, what *exists conceptually*, and what is *off-limits regardless of how attractive it looks*.

| Layer | Name | Question it answers | Time horizon |
|---|---|---|---|
| **L1** | **Near track** | What can the very next session execute, safely? | This session / next session |
| **L2** | **Middle track** | What is the next corridor of work, sequenced behind L1? | Phase A — next several sessions |
| **L3** | **Far track** | What becomes reachable once L1 + L2 stabilize? | Phase B — registry rollout / loader boundaries |
| **L4** | **Future track** | What runtime substrate seeds are being prepared for L5 work? | Phase C / Phase 4 — orchestration tier + connectors |
| **L5** | **Forbidden track** | What is structurally available but must not be approached now? | n/a — these are *off-rail* until prerequisites land |

The layers are cumulative, not sequential. L2 is not "L1 finished"; L2 is "what we will do after L1 lands but is already scoped now." Sessions can pull from L1 freely, from L2 with awareness, from L3 only as preparation, from L4 only as definition, and from L5 never (this session class).

---

## 1. L1 — NEAR TRACK (current executable packets)

Items here are *executable today*. They are individually shippable in one session, single-revert rollback, governance-clean, and they advance the architectural map without requiring a new decision.

### L1.1 Governance-only commits (zero code change)
| Packet | What it does | Cost | Yield |
|---|---|---|---|
| **`MASTER.md §3/§4` currency update** | Rewrite to reflect 38-module reality, current 81 % of 900 KB, and the cartography pack location | one commit | Closes the highest-drift artifact in the repo (`ARCHITECTURAL_DRIFT_MODEL §6.1`) |
| **Link the cartography pack from `MASTER.md`** | Add a §-level pointer so future sessions read `docs/runtime/` at boot | one commit | Pack becomes part of operating context, not just artifact |
| **Cache-bust policy decision (Stage H(b))** | Choose hash-injection vs formalized manual rule; record in `MASTER.md §12` | one commit | Closes hidden danger-corridor #4 (`REPO_TOPOLOGY_MAP §8`) |
| **`patch_quote.js` fate decision (Stage H(a))** | Run-once-and-delete OR relocate to `patches/` | one commit | Closes side-channel mutation source |

### L1.2 Decomposition packets (code, single-revert)
| Packet | Stage | Cost | Yield |
|---|---|---|---|
| **Inline `<style>` extract → `css/aos.css`** | Stage 1 | 1 session | ~1,500–2,000 LOC out of shell; zero JS path touched |
| **`internal_meetings.js` sub-split** | Stage A (parallel) | 1 session | Drains shell-class super-module to module-class sub-files; no shell touch |
| **Shell utility helpers extract → `js/shell_utils.js`** | Stage 2 | 1 session | ~150–250 LOC out of shell; creates substrate for `register()` |
| **Quote-print template extract → `js/quote_print.js`** | Stage 3 | 0.5 session | ~30–60 LOC out of shell |

### L1.3 Substrate seed (lands inside Stage 2)
| Packet | What it does | Cost | Yield |
|---|---|---|---|
| **`register()` function in `js/shell_utils.js`** | The non-blocking module-registration substrate (`FUTURE_LOADER_BOUNDARIES §6`) | ~30–50 LOC | Module isolation becomes structural for the first time |
| **First three modules registered** | Pick from `digest.js`, `health.js`, `quick_actions.js`, `saved_filters.js`, `bulk_select.js` | ~3 LOC × 3 | Observation surface for every subsequent registration |

### Near-track ordering (recommended)
The order that minimizes context tokens and maximizes irreversibility:

1. `MASTER.md §3/§4` currency update (governance-only; baseline truth).
2. Stage A — `internal_meetings.js` sub-split (parallel; no shell touch).
3. Stage 1 — CSS extract (biggest LOC drop; zero JS path).
4. Stage 2 — shell utility extract **plus `register()`** function (substrate lands here).
5. First three modules adopt `register()` (closes the "isolation begins existing" milestone).
6. Stage 3 — quote-print extract.
7. Cache-bust policy + `patch_quote.js` fate (governance + housekeeping; close out L1).

Each step is one session. Total: 7 sessions to clear L1.

---

## 2. L2 — MIDDLE TRACK (next decomposition corridors)

L2 items are scoped today; they ship after L1 clears. They are not eligible for execution while L1 is incomplete because they either depend on L1 output or compound the shell pressure they would later have to address.

### L2.1 Continued decomposition
| Corridor | Stage | Depends on | Yield |
|---|---|---|---|
| **Vendor view HTML extract → `js/vendors.js`** | Stage 4 | Stage 1 (CSS already out) | ~1,000 LOC out of shell; honors original 0.1 split intent |
| **Quick-Actions FAB extract** | Stage 5 | Stage 2 (shell_utils.js available) | ~50 LOC out of shell + reconciles with existing module |
| **Cohort 2 module registrations (modules 6–15)** | Phase B start | `register()` battle-tested across cohort 1 | Coverage rises from ~13 % to ~40 % |

### L2.2 Governance gates that must land in this corridor
| Gate | What it ratifies | Prerequisite for |
|---|---|---|
| **Module-mode → role-visibility rule** | "data-roles is derived from mode + role-defaults" | Stage 6 (sidebar generator) |
| **Phase A → Phase B transition criteria recorded in `MASTER.md`** | Coverage thresholds, observation windows, strictness gradients | Anything in L3 |

### L2.3 Pressure-relief follow-ons
| Item | Purpose | Cost |
|---|---|---|
| **`BUILD_INTELLIGENCE.md` consolidation pass** | Collapse old, no-longer-surprising lessons; reduce session-boot token tax | 1 governance session |
| **Skills `_index.md` audit** | Confirm registry matches reality; flag idle skills | 1 governance session |

**No new modules. No new `<script>` tags. No new `data-roles`.** Per `POST_DECOMPOSITION_ROADMAP §6`. The middle track is *pure drain*, not feature work.

---

## 3. L3 — FAR TRACK (module isolation / loader boundaries)

L3 begins when Phase B begins. The substrate exists; the rollout is in progress; this is where it matures into something that *replaces* current discipline rather than supplementing it.

### L3.1 Coverage rollout
| Cohort | Modules | Target after cohort |
|---|---|---|
| Cohort 1 (in L1) | digest, health, quick_actions, saved_filters, bulk_select | ~13 % coverage |
| Cohort 2 (in L2) | mid-size modules (~10 files) | ~40 % coverage |
| Cohort 3 (in L3) | large modules: customers, marketing, jobs, trade_partners, alerts, etc. | ~80 % coverage |
| Cohort 4 (in L3 tail) | super-module sub-files; module_modes.js last | 100 % coverage |

### L3.2 Strictness elevation gradient
| Gradient | Trigger condition | Effect |
|---|---|---|
| **Strict-on-collision** | Coverage ≥60 %, zero collision warnings in 14 days | `register()` throws on duplicate `provides` |
| **Strict-on-missing-consume** | Coverage ≥80 %, zero missing-consume warnings in 7 days | `register()` throws on unsatisfied `consumes` |
| **Strict-on-undeclared-leak** | Coverage = 100 %, opt-in per environment | Mutation-containment diff throws on undeclared `window.*` write |

The first two are L3 work. The third is optional and may never be flipped; observation is sufficient.

### L3.3 Decomposition consumes the substrate
Once coverage is high enough, the remaining Phase A stages can land safely:

| Stage | What changes when registry is consumed |
|---|---|
| **Stage 6 — sidebar generator** | Sidebar HTML generated from `module_modes.json` (or from the registry once mode lives there); the three-source-of-truth illusion is closed |
| **Stage 7 — auth extract** | Auth depends on declared `consumes`; extraction is a checked move, not archaeology |

These are **far-track** because they cannot land until L3.1–L3.2 mature.

### L3.4 What L3 explicitly does not do
- Does not start Phase 4 integrations.
- Does not add new modules.
- Does not change `sbFetch`'s public shape.
- Does not introduce a build step.
- Does not adopt ESM.

L3 is *the long quiet stretch* — most sessions are 1–3 module registrations plus a coverage-meter update. Slow, durable progress.

---

## 4. L4 — FUTURE TRACK (runtime substrate seeds E0 / S0 / G0)

L4 is *defined now*, prepared in L3, executed in L5. The three substrate seeds are conceptual zero-state markers that name what each substrate is *before* it has any code. Naming the seed is what makes the substrate possible later — without the seed, the substrate has no fixed point to grow from.

### E0 — Execution substrate seed
**Question it answers:** *Where do reconcilers, webhooks, scheduled syncs, and outbound writers actually run?*

The choice (`INTEGRATION_TOPOLOGY_FORECAST §5.3`): Cloudflare Workers vs Supabase Edge Functions, exclusively. E0 is the governance commit that records the decision and the rationale.

**Contents of the E0 commit (when written):**
- The chosen tier name.
- The deployment unit pattern (one repo? sub-directory per worker? naming convention).
- The secret-management story (who holds external API keys; how they rotate).
- The error/log destination (Supabase table? Cloudflare logs? both?).
- The retry/backoff convention shared by all reconcilers.
- The "one worker per integration" vs "one worker for many integrations" rule.

**Until E0 is written:** no connector code. Even scaffolding. Even a "test" worker. Phase 4 is blocked at E0.

### S0 — State substrate seed
**Question it answers:** *Which system is canonical for each field on each record class?*

A per-field authority table (`INTEGRATION_TOPOLOGY_FORECAST §6`). S0 is the document that lists the rules before any connector writes a row.

**Contents of the S0 commit (when written):**
- Record classes that exist across systems (customer, product, order, segment, inventory, audit).
- For each field on each record class: hard-external / soft-external / hard-internal / soft-internal / unowned.
- The rule: no field is "unowned." Every field appears in the table.
- Conflict resolution rules (last-writer-wins is forbidden; declared authority is mandatory).
- Per-integration rule packets (Windward, BigCommerce, Klaviyo, GA4, GSC, portals).

**Until S0 is written:** no dual-write surface may be introduced. No connector that touches a field whose authority is undeclared.

### G0 — Governance substrate seed
**Question it answers:** *How does the cartography pack stay alive once Phase B and Phase 4 are running?*

A governance commit that records the protocol for keeping the runtime docs (`docs/runtime/*`) current. G0 names *who* (Michael + Claude jointly), *when* (at each phase transition; on substantive architectural changes), and *what evidence* triggers an update (e.g., new frozen file emerging; drift severity rising by one band; a forbidden-track item being approached).

**Contents of the G0 commit (when written):**
- Trigger conditions for each `docs/runtime/` doc.
- Owner per doc.
- Phase-transition checklist that requires touching N specific docs.
- The relationship between `docs/runtime/` (architectural source of truth) and `MASTER.md` (operational source of truth).
- The rule that prevents `docs/runtime/` from becoming the next `BUILD_INTELLIGENCE.md` — i.e., never append-only; consolidation pass per transition.

**Until G0 is written:** the cartography pack risks becoming a one-shot artifact rather than a living substrate.

### L4 packaging
E0, S0, G0 are *three separate governance-only commits*, each producible in one session. They are L4 because they require Phase A to be largely complete (so the questions can be answered against a stable shell) and they unlock Phase 4. None of them is code. All of them are *naming acts* (`ARCHITECTURAL_DRIFT_MODEL §9, §10`).

---

## 5. L5 — FORBIDDEN TRACK (off-rail this session class)

L5 items are *structurally* available — there is nothing physically preventing them — but approaching them now would compound the very pressures the rest of the pack drains. Each item is forbidden *because* of what it would damage, not arbitrarily.

### 5.1 Premature swarms
Running parallel Claude sessions on `index.html` simultaneously. `MASTER.md` describes Session A / Session B at the *human* level, not at the *code* level. Two sessions editing the shell on `main` will conflict. **Forbidden** until the shell has been drained to the point that simultaneous editing has narrow surface (after Stage 7).

### 5.2 Fake runtime
Anything that *simulates* a loader without being one. Examples: a `MODULE_LOADER` global that lists modules but doesn't observe their registration; a fake `import` function that just reads from `window`; a "tree" data structure that documents dependencies but is not connected to any check. **Forbidden** because fake runtime is worse than no runtime — it presents the appearance of structure while being undefined.

### 5.3 Phase B overreach
Connecting Phase 4 work while Phase B is still rolling out. Specifically: writing a Klaviyo segment pusher, a Windward poller, a GA4 daily-rollup script, or any webhook receiver before E0 and S0 are committed. **Forbidden** because every such piece of code locks in an undeclared authority.

### 5.4 Phase C compression
Treating Phase B as "the boring middle" to be skipped or shrunk so Phase 4 can start. Phase B's value comes from *time at coverage* — the observation window during which warnings surface and the substrate earns trust. Compressing it means shipping Phase C onto a substrate that hasn't been proven trustworthy. **Forbidden** because it converts the substrate from an asset into a hazard.

### 5.5 ESM / build-step adoption mid-Phase
Either of these in the middle of any phase means touching every script tag. Every file. Every test of every assumption. **Forbidden** at minimum until Phase B is stable; revisit only if a specific concrete need arises.

### 5.6 New global namespaces
A second `window.AOS_*` namespace; a parallel registry; a `window.connectors` object. Anything that creates a second "where do things live" answer. **Forbidden** until either (a) the first registry is at 100 % coverage and proven, or (b) an explicit governance decision is recorded.

### 5.7 Multi-tenant generalization
Designing AccentOS to support other lighting retailers or non-lighting verticals during Phase A or Phase B. **Forbidden** because tenant-shaped abstractions before single-tenant stability is the canonical path to architectural drift (`ARCHITECTURAL_DRIFT_MODEL §1`).

### 5.8 Test-harness adoption before Phase B end
Adding tests before the substrate is mature means the tests encode the *current* (pre-isolation) topology. Each test that locks in current shape is one more thing to migrate during Phase B. **Forbidden** until Phase B end at minimum.

### 5.9 RLS tightening passes outside an integration unlock
Changing `M01_rls_tightening.sql`-class policies without a Phase 4 connector that requires the change is the highest-blast SQL action available. **Forbidden** unless the change is in service of a specific recorded need.

### 5.10 Skill-runtime experiments
Things that take a `skills/` directory and try to make it executable as code at runtime (rather than as boot-context documents). The current skills system is a *boot-context registry*, not a runtime. **Forbidden** to confuse those layers without a deliberate governance decision.

---

## 6. THE TRACK SWITCHING RULES

How sessions decide which track to pull from. Conservatively phrased — when in doubt, take a step toward L1 rather than L4.

| Rule | Application |
|---|---|
| **R1** | If L1 has executable packets, take from L1 first. |
| **R2** | If L1 is empty, refill from L2 by completing its blocking prerequisites. |
| **R3** | If L2 is blocked on a governance gate, write the gate (a governance-only commit *is* the work). |
| **R4** | Never take from L3 unless the phase-transition criteria for Phase B are met. |
| **R5** | Never take from L4 unless Phase A is fully stable and Phase B has begun. |
| **R6** | Never take from L5. Period. |
| **R7** | If something *feels* like it belongs on L1 but produces an `index.html` shell touch, recheck the classification — it may be on L2 in disguise. |
| **R8** | Phase transitions require a *commit that records the transition*. Without the commit, the system is still in the prior phase. |
| **R9** | If a packet seems easy because "we already know how," take a moment to verify it isn't on L5. Easy is the L5 entry vector. |

---

## 7. THE LAYER DEPENDENCY MAP (visual)

```
                          GOVERNANCE INVARIANTS
                          ───────────────────────
                          no build step
                          surgical patches only
                          Supabase as single mirror
                          one orchestration tier
                          naming is the lever
                          MASTER.md updated at transitions
                                    │
                                    ▼
   L1 NEAR ─────────► L2 MIDDLE ─────────► L3 FAR ─────────► L4 FUTURE
   (this session)     (Phase A finish)     (Phase B)         (Phase C seeds)
        │                   │                   │                  │
        ▼                   ▼                   ▼                  ▼
   MASTER.md §3/§4   Stage 4 vendor      Cohort 2/3/4 modules    E0 — exec tier
   currency          views extract       register() rollout      S0 — authority table
                                                                 G0 — pack stewardship
   Stage A          Stage 5 FAB extract  Strictness gradient
   internal_meetings                     elevation
   split            module-mode rule
                    ratification         Stage 6 sidebar
   Stage 1 CSS                           generator
                    BUILD_INTELLIGENCE
   Stage 2 utils    consolidation        Stage 7 auth
   + register()                          extract
                    Skills _index
   First 3 module   audit
   registrations
                    Phase A → Phase B
   Stage 3 quote    transition commit
   print

   Cache-bust
   policy

   patch_quote.js
                                                  ────────────────────
                                                  ABOVE — ON-RAIL
                                                  BELOW — OFF-RAIL
                                                  ────────────────────

   L5 FORBIDDEN
   premature swarms · fake runtime · Phase B overreach ·
   Phase C compression · ESM mid-phase · second namespaces ·
   multi-tenant · pre-Phase-B tests · RLS tightening · skill-runtime
```

L1 → L2 → L3 → L4 reads left-to-right and **does not skip layers**. Items on L4 wait for L3. Items on L5 do not move.

---

## 8. WHY THIS LAYERING MATTERS

The layering is not bureaucracy. Three concrete failure modes are prevented by it:

1. **Track-jumping** (taking L4 work while L1 is unfinished). This is the canonical "let's get ahead of ourselves" failure. Each L4 item locks in an architecture choice while the surface those choices apply to is still moving. Jumping wastes the work because it has to be re-done.
2. **Track-stalling** (waiting for everything to be perfect before starting L1). Equally damaging. The cure for an unfinished L1 is to do an L1 item, not to plan it further.
3. **Off-rail drift** (drifting toward L5 because it looks like L1 from one angle). The R7 and R9 rules in §6 catch this. Easy is the L5 entry vector.

The track map answers, for any candidate work item: *which layer is this on, and is it currently pull-able?* That question is what keeps the train moving safely without forcing every session to re-derive the plan.

---

## 9. SUMMARY

| Question | Answer |
|---|---|
| Near track (L1) | `MASTER.md §3/§4` update; Stage A; Stage 1; Stage 2 + `register()`; first 3 module registrations; Stage 3; cache-bust policy; `patch_quote.js` fate |
| Middle track (L2) | Stages 4, 5; module-mode→roles rule; cohort 2 registrations; `BUILD_INTELLIGENCE` consolidation; skills audit; Phase A→B transition commit |
| Far track (L3) | Cohort 3/4 registrations; strictness gradient elevation; Stage 6; Stage 7 |
| Future track (L4) | E0 execution substrate seed; S0 state substrate seed; G0 governance substrate seed — three separate governance-only commits |
| Forbidden track (L5) | Premature swarms; fake runtime; Phase B overreach; Phase C compression; ESM mid-phase; second namespaces; multi-tenant; pre-Phase-B tests; RLS tightening; skill-runtime experiments |
| Switching rule | Pull from L1 first; refill from L2 by clearing its prerequisites; never pull from L3 before Phase B begins; never pull from L4 before Phase C is on the horizon; never pull from L5 |
| Phase transitions | Each transition requires its own governance-only commit recording the change |
| The most common track-jump mistake to avoid | Treating L4 items (E0/S0/G0) as "I'll just write the doc real quick" while L1 packets sit unexecuted. The doc is the work, but the L1 work is also the work, and L1 must clear first. |

---

*See `POST_DECOMPOSITION_ROADMAP.md` for the phase shapes that align with L1–L4, and `TRAIN_SPEED_LIMITS.md` for the per-action speed/freeze table.*
