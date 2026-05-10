# ARCHITECTURAL_DRIFT_MODEL

> Model of how drift accumulates in AccentOS, where it currently is, and how to detect it
> before it forces a re-foundation.
> Analysis only — no implementation, no governance edit, no runtime change.
> Closes the cartography pack: `REPO_TOPOLOGY_MAP.md`, `FROZEN_FILE_PRESSURE_ANALYSIS.md`,
> `SAFE_MUTATION_ZONES.md`, `DECOMPOSITION_STRATEGY_V1.md`,
> `MODULARITY_ILLUSION_ANALYSIS.md`, `FUTURE_LOADER_BOUNDARIES.md`,
> `INTEGRATION_TOPOLOGY_FORECAST.md`, `COUPLING_REDUCTION_PATTERNS.md`.
> Snapshot date: 2026-05-10.

---

## 0. ONE-PAGE FRAMING

Drift is the silent accumulation of distance between what a system *claims* about itself and what it *is*. Every codebase produces drift. The question is whether the drift is observable while it is small, or only after it has compounded into a crisis.

AccentOS today carries six distinct drift classes, all running concurrently:
1. **Documentation drift** — `MASTER.md` claims a 4-module post-split world; reality is 38 modules.
2. **Architecture drift** — "Module Isolation" is asserted but unenforced.
3. **Orchestration drift** — `index.html` orchestrates more concerns than it can be safely refactored to drop.
4. **Governance drift** — `module_modes.json` ↔ `data-roles` ↔ resolver three-source-of-truth.
5. **Abstraction drift** — `sbFetch` URL strings hard-coded into 22 modules without a schema layer.
6. **Topology drift** — the mental model of "shell + N modules" still describes the system, but the modules now have shell-shape (`internal_meetings.js`).

None of these is yet at crisis level. **The crisis level is reached not when drift is large, but when drift becomes invisible and confident.** An honest current-state estimate (§14) puts AccentOS in early-to-mid drift on most axes — well before re-foundation pressure, but past the point where drift can be ignored.

The single most dangerous property of drift is *false confidence*: an operator (or a future Claude session) consults a stale source of truth and proceeds, and the resulting decision compounds the drift instead of correcting it. AccentOS's auto-execute boot protocol (`.claude/CLAUDE.md`) reads `MASTER.md` every session — meaning every session that follows a drift-day is making decisions on slightly-wrong information. **The drift is most dangerous because it is read.**

---

## 1. THE SIX DRIFT CLASSES

Each drift class has a definition, an *accumulation mechanism* (how drift gets created), an *invisibility mechanism* (why it stops being noticed), and a *failure mode* (what eventually breaks). They are listed in approximate order of how easy they are to detect.

### 1.1 Documentation drift
- **Definition:** A doc claims X about the system; the system is now Y.
- **Accumulation:** Each session edits code; only some sessions edit the doc. The asymmetry is structural.
- **Invisibility:** The doc continues to be readable and confident. Without a check, no one notices the gap.
- **Failure mode:** A new operator (or a future Claude session) trusts the doc and writes code under a wrong assumption.

### 1.2 Architecture drift
- **Definition:** A *structural property* the system is supposed to have is no longer enforced (or never was, but is asserted).
- **Accumulation:** Each new module added to a "modular" system without a loader is one more potential collision. Each new global on `window` is one more place isolation is conceptual rather than structural.
- **Invisibility:** The discipline that holds the property (e.g. the `_<modulePrefix>` convention) keeps the property *true in practice* even after it has stopped being *true in theory*. The gap appears only on a violation that hasn't happened yet.
- **Failure mode:** A silent collision; a `BUILD_INTELLIGENCE.md` entry after the fact.

### 1.3 Orchestration drift
- **Definition:** A coordinator (the shell, a router, a reconciler) absorbs more concerns over time than its shape was sized for.
- **Accumulation:** Every new concern is one surgical patch into the coordinator. Each patch, in isolation, is small. Cumulatively, the coordinator becomes the largest file in the repo.
- **Invisibility:** Each individual patch passes review. The coordinator's growth is a *trend*, not an *event*.
- **Failure mode:** Refactor paralysis (`MODULARITY_ILLUSION §6 mode B`) — the coordinator becomes too big to safely change.

### 1.4 Governance drift
- **Definition:** Multiple sources of truth claim to control the same property; they are not enforced to agree.
- **Accumulation:** A property is added to system A; later, a related property is added to system B (because it's natural there); later, a third place needs to know (because it gates UI). Three sources, one concept, no enforced equality.
- **Invisibility:** Each source is internally consistent. Drift between them only appears when one is changed without updating the others.
- **Failure mode:** A module is `mode: live` in JSON but its sidebar `<a>` is missing — it is invisible to users despite being "live."

### 1.5 Abstraction drift
- **Definition:** A layer that should mediate between two layers is missing or incomplete; the higher layer reaches through it directly.
- **Accumulation:** Each new module is faster to write if it just hard-codes the URL string than if it adds a typed accessor. The shortcut is taken every time.
- **Invisibility:** Each shortcut works. The cost is not at write time; it is at *change time*, when the layer below changes shape.
- **Failure mode:** A schema migration silently breaks N modules. (Already on the failure ledger via `BUILD_INTELLIGENCE.md`'s "removed-global → ReferenceError" pattern at the JS layer; the SQL layer has the same hazard.)

### 1.6 Topology drift
- **Definition:** The mental model of "what shape this codebase is" no longer matches the runtime topology.
- **Accumulation:** As modules grow, they begin to take on the shape the shell originally had. As integrations land, the runtime grows new tiers (Edge Functions, webhooks) that are not in the original mental model.
- **Invisibility:** The codebase still *looks* like the original topology from the file tree. Module names match modules. The shell is one file. The runtime fan-out is invisible until a debugger session.
- **Failure mode:** Decisions are made on a shape that doesn't exist; outcomes are surprising; trust in the architecture model erodes.

---

## 2. HOW DRIFT ACCUMULATES (the accumulation rule)

A simple law that fits all six classes:

> **Drift accumulates whenever a system change costs less than the documentation/structure update that would track it.**

If updating the doc / loader / governance entry / abstraction layer / topology diagram is part of the change, drift does not accumulate. If it is a follow-up that "should" be done, it usually isn't, because:
- Operators are paid in shipped features, not in updated docs.
- The asymmetry compounds — every session that ships without updating raises the activation cost of the next person who *would* update.
- "Update the doc later" is the universal admission that drift will accumulate.

AccentOS partially mitigates this with a session-end protocol (`MASTER.md` §2): "This file is updated at the end of every working session." It works for `SESSION_LOG.md` (§15) because session logs are easy to write at session end. It works less well for `MASTER.md §3/§4` (architecture / state) because architectural updates need cross-cutting awareness that session-end fatigue tends to skip.

---

## 3. HOW DRIFT BECOMES INVISIBLE (the invisibility rule)

> **Drift becomes invisible when the operators most able to detect it are also the operators most adapted to working around it.**

Phrased differently: the same operator who could notice that `MASTER.md §3` is stale is also the operator who has internalized the *real* state of the system. They don't notice the doc is wrong because they no longer read it for that information. The doc remains visibly authoritative to *new* operators (or new Claude sessions) precisely because the experienced operator has stopped consulting it for the drifted parts.

This is the most pernicious property of drift: **the people most positioned to fix it are also the least likely to notice it needs fixing.**

For AccentOS the implication is direct: drift in `MASTER.md` is invisible to Michael (who knows the real system) and invisible to Claude *during* a session (who has just read the doc and is acting on it as truth). It is visible only to a *fresh* outside reader — exactly the role this analysis pack is performing.

---

## 4. HOW DRIFT CREATES FALSE CONFIDENCE

> **False confidence is the gap between reading a confident source and the source being correct.**

Stale documentation is more dangerous than missing documentation. A missing source forces operators to investigate. A stale source rewards them for not investigating.

Examples in AccentOS:
- `MASTER.md §3` describes a 4-module file split. A future Claude session that reads this and proceeds to reason about "the 4 module files" is wrong by construction — and confident, because the doc said so.
- `MASTER.md §4` lists "Module Isolation" as a development philosophy. A future operator extracting code on the assumption that modules are isolated will write extraction logic that would be correct under isolation and is wrong under the actual topology.
- The `?v=6.10.x` cache-bust convention. A reader who sees consistent versioning concludes there is a system; the system is hand-bumping.
- The `module_modes.json` registry. A reader who sees a tidy mode list concludes that mode is the source of truth for visibility; the source of truth is actually `data-roles` HTML attributes scattered through the shell.

Each of these examples shares a shape: **a confident-looking artifact masking an underdefined runtime.** The surface is well-presented; the substrate is not.

---

## 5. HOW DRIFT EVENTUALLY FORCES RE-FOUNDATION

When drift accumulates past a threshold, the cost of correcting it surface-by-surface exceeds the cost of starting from a fresh foundation. This is *re-foundation pressure*.

The threshold is not LOC. It is *trust in the existing structure*. Specifically:
- When operators stop trusting the docs (governance drift severe).
- When refactors stop being safe (orchestration + architecture drift severe).
- When integrations regularly produce silent failures (abstraction + synchronization drift severe).
- When the mental model has visibly diverged (topology drift severe).

At that point, the rational move is to *redraw the topology*. Concretely: write a new architecture document, identify the canonical surfaces, build a thin shim from the old to the new, migrate consumers piecewise. Re-foundation does not mean rewrite; it means *re-declare the structure* and migrate inward toward it.

AccentOS is **not** at this threshold. It is at the *early-warning* zone, where the cost of *correcting* drift surface-by-surface is still lower than the cost of re-foundation. That window is what the cartography pack is intended to preserve.

---

## 6. CURRENT HIGHEST-DRIFT ZONES

Honest current-state assessment, ranked.

### 6.1 Highest: `MASTER.md §3 (Current State)` and `§4 (Architecture)`
- Claims `index.html ~651 KB / ~680 KB total HTML, 76% used`. Reality at 2026-05-10: 735 KB / 7,169 LOC, ~81 % of declared cap.
- Claims `index.html (shell) + module-vendor.js + module-pipeline.js + module-knowledge.js + module-marketing.js`. Reality: 38 modules, none of those four exact names present (current modules are page-named: `customers.js`, `jobs.js`, etc.).
- Claims "File Split (Track 0.1) ✅ Live". Operationally true at the time. Misleading because *the file split is partial* — the shell never actually shrank to its claimed shape.
- **Drift severity: HIGH.** Stable for ~6 days at minimum; visible to fresh readers; invisible to operating party.

### 6.2 Architecture drift on "Module Isolation"
- `MASTER.md §5` lists Module Isolation as a development philosophy.
- The runtime has no boundary. 38 modules share `window`.
- No `BUILD_INTELLIGENCE.md` entry contradicts it because no one has triggered the violation yet.
- **Drift severity: HIGH** (statement is structurally false but practically true at current N).

### 6.3 Orchestration drift on `index.html`
- The shell now hosts: design system, login, role visibility, sbFetch, vendor view templates (~1,000 LOC of HTML), modal/toast/CSV utilities, sidebar HTML for 38 modules, the script-tag manifest.
- Each individual element was a small surgical addition.
- **Drift severity: HIGH** (the shape no longer matches "shell").

### 6.4 Governance drift on module visibility
- `module_modes.json` ↔ `js/module_modes.js` ↔ `index.html` sidebar `<a data-roles>`.
- Already tracked as `module_registry_refactor` in `idea_only` state — meaning the drift is *known* but not *closed*.
- **Drift severity: MEDIUM** (known-and-open).

### 6.5 Abstraction drift on Supabase access
- 22 modules call `sbFetch` directly with hard-coded URL strings naming Supabase tables and column projections.
- No schema layer; column rename = silent breakage.
- Out-of-band schema changes (manual paste in Supabase SQL Editor) bypass any cross-reference.
- **Drift severity: MEDIUM-HIGH** (still tractable at current N tables; will become high once Phase 4 integrations mirror more state into Supabase).

### 6.6 Topology drift on `internal_meetings.js`
- The mental model is "module per page." The reality is one super-module that internally has shell topology (six sub-features, shared `IM_*` state, two Realtime channels).
- Documented nowhere; visible only on inspection.
- **Drift severity: MEDIUM** (one module; easily corrected by Stage A of `DECOMPOSITION_STRATEGY_V1`).

### 6.7 Documentation drift on integration plans
- `MASTER.md §5 Track 6 / Phase 4` lists Phase 4 capabilities.
- No drift today (nothing built; nothing to drift from). But the plan is *deliberately* light on architecture: "connect (free API)" is the level of detail. Once any integration ships, this drift will appear immediately unless the plan grows §-level architecture for the orchestration tier first.
- **Drift severity: NONE-YET, but high-velocity-source.** The forecast doc (`INTEGRATION_TOPOLOGY_FORECAST`) addresses this.

### 6.8 Other zones, low drift
- `worker/anthropic-proxy.js` — shape matches plan; minimal drift.
- `sql/M01..M40` — append-only by discipline; drift only at the abstraction layer above (§6.5).
- `skills/` ecosystem — observation-only; drift is naturally diagnostic-class.

---

## 7. HIGHEST FALSE-CONFIDENCE ZONE

Among the drift zones in §6, the one most likely to mislead a reader (and therefore the most dangerous) is **§6.2 — Architecture drift on "Module Isolation."**

Why this one:
- **Most-cited.** The phrase appears in `MASTER.md §5` development philosophies and is frequently referenced in build-protocol thinking.
- **Most-trusted.** The claim aligns with the operator's intent and the codebase's *file-tree* shape; both reinforce it.
- **Most-invisible.** No `BUILD_INTELLIGENCE.md` entry has yet recorded a cross-module collision in production. The absence of evidence is taken as evidence.
- **Worst when violated.** A module-boundary violation is exactly the class of bug `Module Isolation` was meant to prevent — and the bug will be silent (see `COUPLING_REDUCTION_PATTERNS §6` runtime coupling, discontinuous scaling).

`§6.1` (numerical staleness in `MASTER.md §3`) is more *factually* drifted, but a fresh operator reading "76 %" instead of "81 %" makes a slightly-wrong sizing decision; the consequence is small. A fresh operator reading "Module Isolation" and writing code under that assumption produces structurally wrong code that may not surface for weeks. The false-confidence cost of `§6.2` is higher despite the magnitude looking lower.

---

## 8. EARLIEST-WARNING INDICATORS BEFORE COLLAPSE

Drift compounds quietly until a discontinuity. The early-warning indicators — measurable signals that drift is approaching dangerous levels — are:

### 8.1 Refactor velocity drops
- A change that used to take one session now takes two (or three).
- The change is the same size by LOC but the surrounding context-read is much larger.
- **Signal already present** in patches against the shell — the surgical-`old_string` cost is rising.

### 8.2 BUILD_INTELLIGENCE.md entries cluster around one zone
- Multiple lessons in the same week pointing at the same pattern.
- AccentOS's existing entries cluster around `index.html` and around inline-handler patterns. **Signal present at low intensity.**

### 8.3 Doc consultations no longer produce useful answers
- An operator reads `MASTER.md §3` and has to verify each line against the codebase.
- Eventually the doc is consulted for trivia (URLs, account IDs) but not for architecture.
- **Signal latent** — has not yet been observed because the operating party has full mental model coverage.

### 8.4 New operators (or new Claude sessions) ask questions that the docs *should* answer
- "Wait, is this 4 modules or 38?"
- "Where is `sbFetch` defined?" answered by grep, not by doc.
- **Signal latent** — has not been observed because the human operator is single and the Claude sessions inherit a single CLAUDE.md.

### 8.5 Integration choices are made surface-by-surface
- Each new integration's first PR includes its own retry logic, its own auth handling, its own logging.
- No shared substrate emerges; each new integration looks like the previous one with one more bespoke detail.
- **Signal pre-emptive** — visible in the *plan* (`MASTER.md §5 Track 6`) which lists 7+ integrations without naming a shared orchestration tier.

### 8.6 Frozen-file count grows
- One frozen file is a fact (`index.html`).
- Two is a pattern (next: `internal_meetings.js` if not split).
- Three is a property of the codebase, not a coincidence.
- **Signal at threshold** — currently 1, with a visible second candidate.

### 8.7 Operators add disciplines instead of structures
- Every new rule in `MASTER.md §12` instead of every new module loader rule in code.
- `BUILD_INTELLIGENCE.md` grows monotonically.
- **Signal present** at moderate intensity (the lessons log is healthy, which is itself a leading indicator that the substrate isn't catching what disciplines now must).

### 8.8 Cross-system reconciliation logic spreads
- Phase 4 forecast (`INTEGRATION_TOPOLOGY_FORECAST §5/§8`).
- Once two reconcilers exist, they will not look the same; they will need a third surface to coordinate them.
- **Signal pre-emptive.**

If three or more of these indicators move from *latent* to *present* in a single quarter, the system is approaching re-foundation pressure. Currently 2–3 are at low intensity; none is at high intensity.

---

## 9. WHY THIS IS ENCOURAGING (THE FRAME)

The drift model is not a critique. It is a *measurement*. AccentOS is at *early-to-mid drift on most axes, with re-foundation pressure not yet visible*. That is the desirable position to be in for a non-trivial codebase shipped by one part-time builder over months. The pack of decomposition + integration forecast docs exists exactly to **convert drift from invisible to observable while it is still cheap to act on.**

The one thing this analysis is most insistent on: drift is fixed by *naming* (the same thesis that recurs through `MODULARITY_ILLUSION` and `COUPLING_REDUCTION`). Every named coupling is an anti-drift instrument. A `register()` substrate is anti-architecture-drift. A per-field authority table is anti-synchronization-drift. A regularly-updated `MASTER.md §3` is anti-documentation-drift. None of these is a build step, a framework, or a rewrite. **All of them are documentation acts.**

---

## 10. CURRENT ARCHITECTURE-DRIFT SEVERITY (HONEST ESTIMATE)

A scale from 0 (no drift) to 10 (re-foundation forced):

| Drift class | Current severity | Notes |
|---|---|---|
| Documentation | **6 / 10** | `MASTER.md §3/§4` measurably stale; `BUILD_INTELLIGENCE.md` healthy; session log current |
| Architecture | **5 / 10** | "Module Isolation" claim structurally false; in-practice true; one collision from a step-change |
| Orchestration | **6 / 10** | Shell at 81 % of declared cap; orchestrating 38 modules' worth of concerns |
| Governance | **4 / 10** | Three-source-of-truth on module visibility known and tracked |
| Abstraction | **4 / 10** | `sbFetch` URL-string layer is leaky; tractable at current scale |
| Topology | **3 / 10** | One super-module (`internal_meetings.js`) breaking the per-page model |
| Integration topology | **n/a** | nothing built; *high velocity source* once Phase 4 lands |
| **Aggregate** | **5 / 10** | Mid-range — observable, correctable, not yet forcing re-foundation |

Bands:
- **0–2**: Drift is a non-issue.
- **3–5**: Drift is observable; cheapest to act on now; correction is single-session work for several classes.
- **6–8**: Drift is impeding velocity; correction is multi-session; some refactors no longer fit in one PR.
- **9–10**: Re-foundation pressure; surface-by-surface correction costs more than re-declaring the structure.

AccentOS is at **5**. **5 is the cheapest band to be in if you're going to act**, and the most expensive band to ignore — drift compounds discontinuously, and the next move from 5 to 6 is faster than the previous move from 4 to 5 was.

---

## 11. THE SINGLE MOST DANGEROUS DRIFT ARTIFACT TODAY

Of every drift-zone in §6, the single artifact whose drift is most damaging is:

**`MASTER.md §3 — Current State + §4 — Architecture.**

Why:
- Read by every new session at boot (per `.claude/CLAUDE.md`).
- Confidently presents a wrong description (4-module post-split world).
- Drives architectural reasoning — operators acting under §4's claims write code that doesn't fit the system.
- Cannot be detected by reading the doc itself.
- Compounding because every session that doesn't update §3 propagates the staleness one more step.

Updating §3/§4 to reflect the 38-module reality is a **governance-only commit**, single-session work, costs nothing in code. It is the cheapest single drift-correction available in the entire repo, and *it is the prerequisite for every other architectural-narrative claim made in the future.*

---

## 12. THE DRIFT-CORRECTION MENU

(Out of scope to execute. In scope to enumerate.)

| Drift class | Cheapest correction | Cost |
|---|---|---|
| Documentation (`MASTER.md §3/§4`) | Update both sections to current 38-module reality | 1 governance-only commit |
| Architecture ("Module Isolation") | Add `register()` substrate (Stage 2 of `DECOMPOSITION_STRATEGY_V1`) | ~30–50 LOC + per-module migrate |
| Orchestration (`index.html`) | Stages 1–7 of `DECOMPOSITION_STRATEGY_V1` | multi-session staged |
| Governance (3-source-of-truth) | Stage 6 of `DECOMPOSITION_STRATEGY_V1` (sidebar from `module_modes.json`) | 1 staged refactor with parallel render + cutover |
| Abstraction (`sbFetch` layer) | Codify table-name registry in `register()`'s `consumes` list | follow-on to Stage 2 |
| Topology (`internal_meetings.js`) | Stage A of `DECOMPOSITION_STRATEGY_V1` (sub-split) | 1 module-internal refactor |
| Integration topology (forecast) | Per-field authority table doc; Edge-Function tier decision | 1 governance-only commit; 1 architecture decision |

Several of these — notably `MASTER.md §3/§4` correction, the per-field authority table, and the Edge-Function tier decision — are **governance-only documents** producible without touching any code. They are the cheapest drift-correction artifacts available, and they are the prerequisites that make all subsequent code-touching corrections cheap.

---

## 13. SUMMARY

| Question | Answer |
|---|---|
| What is drift | Silent accumulation of distance between system claim and system reality |
| Why drift is dangerous | Because it is *read* — operators consult stale sources confidently |
| Six drift classes | Documentation, architecture, orchestration, governance, abstraction, topology |
| How drift accumulates | Whenever a code change costs less than the corresponding doc/structure update |
| How drift becomes invisible | The operators most able to detect it are the ones least likely to notice it |
| How drift forces re-foundation | When trust in existing structure drops below cost of re-declaring it |
| Current highest-drift zones | `MASTER.md §3/§4` (HIGH); "Module Isolation" claim (HIGH); shell orchestration (HIGH) |
| Current highest false-confidence zone | "Module Isolation" — most-cited, most-trusted, structurally false, latent |
| Earliest-warning indicators | Refactor velocity, lesson-log clustering, doc-consultation utility, fresh-operator questions, integration-by-integration retry logic, frozen-file count, discipline accretion, reconciler proliferation |
| Honest aggregate severity (0–10) | **5/10** — mid-range, observable, correctable; cheapest band to act in |
| Single most dangerous drift artifact | `MASTER.md §3/§4` — read every session, structurally stale, single-session correction |
| Cheapest universal correction | Naming. (Same answer as `MODULARITY_ILLUSION` and `COUPLING_REDUCTION_PATTERNS` — drift is what unnamed coupling looks like over time.) |

---

## 14. CLOSING NOTE — HOW THIS PACK FITS TOGETHER

Each document in the cartography pack approached the same underlying property of AccentOS from a different angle:

- `REPO_TOPOLOGY_MAP` — what the system is.
- `FROZEN_FILE_PRESSURE_ANALYSIS` — where it is binding.
- `SAFE_MUTATION_ZONES` — what is safe to change.
- `DECOMPOSITION_STRATEGY_V1` — how to drain the binding.
- `MODULARITY_ILLUSION_ANALYSIS` — why the binding exists.
- `FUTURE_LOADER_BOUNDARIES` — the smallest substrate that breaks the binding.
- `INTEGRATION_TOPOLOGY_FORECAST` — what binding lies ahead.
- `COUPLING_REDUCTION_PATTERNS` — the catalog the future bindings are made of.
- `ARCHITECTURAL_DRIFT_MODEL` (this doc) — how to detect bindings while still cheap.

The single thread through all nine: **AccentOS is in a regime where naming surfaces — once — is the dominant lever**. Naming is what `register()` does for modules, what a per-field authority table does for integrations, what an updated `MASTER.md §3` does for documentation. None of it is a rewrite, none of it is a framework, none of it is a build step. All of it is a kind of writing-things-down that the codebase has not yet adopted as a discipline.

That is the entire architectural prescription this pack arrives at.

---

*End of cartography pack.*
