# ARCHITECTURAL PRIORITIZATION MODEL

> **Synthesis of:** `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `TOKEN_TO_OUTPUT_EFFICIENCY.md`, `ORCHESTRATION_COST_CENTERS.md`, `ENTROPY_ACCUMULATION_MODEL.md`, `OPERATOR_BANDWIDTH_LIMITS.md`.
> Plus the implicit topology / substrate / orchestration-maturity facts of the AccentOS repo as observed: monolithic 651KB `index.html` (76% of 900KB hard limit), shared global namespace (`USERS`, `VENDORS`, `INVENTORY`, `MODULES`, `goTo`), per-feature `js/*.js` modules, Cloudflare Pages auto-deploy, Cloudflare Worker proxy, Supabase backend with no down-migrations, single shared `WORK_IN_PROGRESS.md`, `claude/*` branch fan-out, Captain as 1-wide review queue.
> **Scope:** Order-of-operations logic for architectural work. Which moves to make first; which to defer; which look urgent but are not leverage; which compound silently in the operator's favor.
> **Frame:** Analysis-only. No implementation, no runtime mutation, no governance edits, no orchestration execution.
> **Last updated:** 2026-05-10

---

## 0. The prioritization frame

Every architectural move can be scored on four independent axes:

- **Leverage.** How much does it raise the throughput ceiling of the system, holding all else constant?
- **Risk reduction.** How much does it shrink the worst-case failure mode (rollback, reconciliation collapse, supervision saturation)?
- **Future optionality.** Does it open or close downstream architectural moves?
- **Entropy reduction.** Does it slow the rate at which model-vs-reality divergence accumulates?

A high-leverage move with low risk reduction is "fast but fragile." A high-risk-reduction move with low leverage is "stable but capped." The moves worth making first are the ones that score in the top quartile of *all four* axes — they are rare and they dominate everything else.

This document ranks ten candidate architectural moves on these axes and produces an explicit ordering.

---

## 1. The ten candidates

The user-supplied list, lightly defined for this analysis:

1. **Decomposition.** Splitting the monolithic `index.html` into multiple smaller HTML / module-loader entry points, decoupling the bundle from the page.
2. **Runtime substrate.** Foundational layer that lets modules load, communicate, and unload safely — durable session-scoped WIPs, durable migration history with paired downs, runtime smoke verification, deploy verification.
3. **Orchestration tooling.** Mechanisms that make the multi-session workflow legible — branch entropy estimator, queue-state visibility, BE-band display in `status.sh`, per-branch staleness flag, pre-claim mechanism for BUILD_PLAN.
4. **Governance hardening.** Tightening the OPERATING RULES, vibe-speak modes, skill registry curation, MASTER §13 hygiene.
5. **Module isolation.** Architectural enforcement that a feature lives entirely in `js/<feature>.js` with a thin wire-up, no shared global mutation, no cross-module name collisions.
6. **Loader boundaries.** A formal contract for how modules are loaded, what surface they expose, and what they can/can't touch — the architectural enforcement layer that backs module isolation.
7. **Queue durability.** Persistent queue of pending work, pending reviews, pending merges. Survives session boundaries; tracks branch age, BE band, Captain-review status.
8. **Supervision.** Human-side instrumentation — review batching, decision-quality slot scheduling, reconciliation budget, mobile-only safe-task routing.
9. **Codex integration.** Bringing a second model (Codex / ChatGPT Pro / external code reviewer) into the orchestration loop as an additional reviewer, builder, or pair.
10. **Execution scaling.** Raising N (concurrent sessions, overnight ceiling, autonomous chaining frequency).

These ten are not independent — many of them depend on others. The dependency structure is the central finding (§4).

---

## 2. Scoring matrix (qualitative bands)

Each axis scored on a 5-band scale: **Critical / High / Medium / Low / Negative.** "Negative" means the move *removes* value on that axis if done now (typically because it amplifies an unaddressed upstream cost).

| # | Move | Leverage | Risk reduction | Future optionality | Entropy reduction |
|---|---|---|---|---|---|
| 1 | Decomposition | **Critical** | **Critical** | **Critical** | **Critical** |
| 5 | Module isolation | **Critical** | **High** | **Critical** | **High** |
| 6 | Loader boundaries | **High** | **High** | **Critical** | **High** |
| 2 | Runtime substrate | **High** | **Critical** | High | **High** |
| 7 | Queue durability | High | High | Medium | **High** |
| 3 | Orchestration tooling | High | Medium | Medium | High |
| 8 | Supervision | Medium | **Critical** | Medium | Medium |
| 4 | Governance hardening | Low | Medium | Low | Medium |
| 9 | Codex integration | **Negative** (until 1, 5, 6 done) → High after | Medium → High after | High after | Negative → Medium after |
| 10 | Execution scaling | **Negative** (until almost all above done) | **Negative** | Negative | **Negative** |

Three things worth highlighting from this table:

- **Execution scaling (raising N) is the only move that scores Negative on every axis** as the system sits today. It compounds every unaddressed cost in `ORCHESTRATION_COST_CENTERS.md`. *No amount of speed-up justifies it before the prerequisites are in place.*
- **Codex integration** is dual-natured. Done before module isolation, it imports a second worker into the same monolithic file — doubling the BE source. Done after, it parallelizes review without parallelizing collision risk.
- **Decomposition + module isolation + loader boundaries form a tight cluster** at the top of the table. They are the foundation move; everything else compounds from them.

---

## 3. The hidden-compounding-returns analysis

Some moves pay back many times their initial cost over the project's lifetime. These are the moves that operators systematically under-fund, because their per-day benefit is small while their cumulative benefit is enormous.

### 3.1 Decomposition (compound rank: highest)

Every parallel session that touches `index.html` pays the frozen-file tax (`ORCHESTRATION_COST_CENTERS.md` §6). Splitting `index.html` cuts that tax for *every future session*, which means the payback grows with N and t simultaneously. It also opens the door to per-loader caching, lazy module loading, and isolated test surfaces — all downstream moves that are blocked by the monolith.

Compounding properties:
- Linear payback from each future session avoiding the freeze.
- Quadratic payback from BE reduction (fewer pairwise collisions on the shared file).
- Discontinuous payback from clearing the 900KB hard-limit risk before it becomes a forced refactor.

### 3.2 Module isolation (compound rank: very high)

Each feature shipped under strict isolation pays back for the rest of the project's life by *not* generating BE in the shared layer. Already partly in place — most v6.10.x features are `js/<feature>.js` modules — but not architecturally enforced. The compounding return is the *prevention* of fragmentation that would otherwise grow forever.

### 3.3 Idempotent migrations + paired downs

Per BUILD_INTELLIGENCE: idempotent up-migrations already pay back on every re-run. Pairing each up with a down would raise the rollback cost ceiling from "hours of recovery" to "minutes." Highest compounding-return improvement to data-layer safety.

### 3.4 BUILD_INTELLIGENCE entries

A 200-token entry can prevent a 5,000-token re-investigation. ROI ~25× per entry per occurrence. Compounds over project lifetime. Already documented as highest-ROI writing in the system (`TOKEN_TO_OUTPUT_EFFICIENCY.md` §5.6).

### 3.5 Branch-age cap discipline

A "merge or close at 72h" discipline costs a few minutes per branch but prevents the unmergeable-after-2-weeks failure mode that costs hours per incident. Compound payback grows with branch count.

### 3.6 Per-session WIP (file per session, not shared)

Cuts WIP-clobber risk to zero. Per-session WIP costs a few directory-list reads at boot; benefits compound with N (more sessions = more clobbers prevented).

These six are the system's hidden-compounding-returns leaders. **They are also undervalued in the operator's natural attention budget**, because their per-day benefit is small. The whole point of identifying them explicitly is to fund them anyway.

---

## 4. Dependency structure

The ten candidates are not orderable by score alone — there are hard dependencies. A move with high score can be net-negative if attempted before its prerequisites.

### 4.1 The dependency graph

```
[1] Decomposition
        │
        ▼
[5] Module isolation ─────────────┐
        │                          │
        ▼                          │
[6] Loader boundaries ─────────────┤
        │                          │
        ├──────────────────────────┼─────────► [2] Runtime substrate
        │                          │                  │
        ▼                          ▼                  ▼
[3] Orchestration tooling   [7] Queue durability  [8] Supervision
        │                          │                  │
        └─────────┬────────────────┴──────────────────┘
                  ▼
        [4] Governance hardening
                  │
                  ▼
        [9] Codex integration
                  │
                  ▼
        [10] Execution scaling
```

Dependencies (read top-to-bottom):

- **[1] Decomposition** is the foundation. Almost every other move improves once `index.html` is split.
- **[5] Module isolation** depends on having loadable boundaries to enforce; can be partially developed before [1] but lands fully only after [1].
- **[6] Loader boundaries** is the formalization of [5] — the contract that *enforces* what [5] proposes. Naturally co-developed.
- **[2] Runtime substrate** (per-session WIP, paired down-migrations, deploy verification, idempotent everything) layers on top of the now-isolated module structure. Can be partially started in parallel with [1], but full payoff requires the decomposition.
- **[3] Orchestration tooling** (BE estimator, branch-age flags, queue visibility) is most useful once the architecture is decomposed enough that BE actually correlates with shared-file overlap. Premature instrumentation tracks the wrong signals.
- **[7] Queue durability** is also more meaningful post-decomposition — pre-decomposition, the queue is dominated by `index.html` collisions which are an architectural problem masquerading as a queue problem.
- **[8] Supervision** instrumentation is mostly orthogonal but should follow the others, because supervision-cost-per-ship drops sharply once isolation lands; instrumenting before isolation calibrates against the wrong baseline.
- **[4] Governance hardening** is the narrowing of rules and skills *after* the architecture is settled. Doing it earlier locks in rules that won't apply to the post-decomposition system.
- **[9] Codex integration** depends critically on [5] and [6]. Adding a second worker to a monolithic file approximately doubles BE rather than parallelizing safely.
- **[10] Execution scaling** depends on essentially everything above. Done first, it amplifies every unaddressed cost.

### 4.2 The critical-path read

The critical path is **[1] → [5] → [6] → ([2] || [7]) → ([3] || [8]) → [4] → [9] → [10]**. Items in `||` can run in parallel.

The single biggest insight from the dependency graph: **most of the "exciting" moves at the bottom (Codex, scaling) are blocked by the unglamorous foundation moves at the top (decomposition, isolation, loader contract).** The temptation to skip ahead is the central trap analyzed in `SCALING_SEQUENCE_ANALYSIS.md`.

---

## 5. The four-axis ranking with dependencies factored in

Re-ranking the ten candidates as net-positive moves *to attempt now* given the current state:

### Tier 1 — Foundation. Do these first.

| Rank | Move | Why now |
|---|---|---|
| 1 | **Decomposition** ([1]) | Highest score on every axis, no prerequisites, blocking nearly everything else, racing the 900KB hard limit. |
| 2 | **Module isolation** ([5]) | Tightly coupled to [1], partial work possible before [1] lands. |
| 3 | **Loader boundaries** ([6]) | Co-developed with [5]; enforces what [5] proposes. |

### Tier 2 — Substrate. Do these once the foundation is in place.

| Rank | Move | Why next |
|---|---|---|
| 4 | **Runtime substrate** ([2]) | Per-session WIP, paired downs, deploy verification — much cheaper to add over an isolated module structure than over a monolith. |
| 5 | **Queue durability** ([7]) | Tracks the right signal once architecture stops dominating BE. |

### Tier 3 — Operational. Do these once substrate is in place.

| Rank | Move | Why now (in this tier) |
|---|---|---|
| 6 | **Orchestration tooling** ([3]) | BE estimator, age flags, status visibility. Useful at this point because the underlying signal is now meaningful. |
| 7 | **Supervision** ([8]) | Calibrates against the post-decomposition baseline. Early calibration measures the wrong system. |

### Tier 4 — Optional / advanced. Defer.

| Rank | Move | Why defer |
|---|---|---|
| 8 | **Governance hardening** ([4]) | Locks in rules. Locking in pre-decomposition is locking in the wrong rules. |
| 9 | **Codex integration** ([9]) | Net-negative until [5] + [6] are real. Net-positive after — but only after. |
| 10 | **Execution scaling** ([10]) | Net-negative on every axis until everything above is in place. |

---

## 6. What appears urgent but is not leverage

These are the candidate moves whose surface signals make them feel important but whose actual impact is small or negative.

### 6.1 Adding more skills

Each new skill adds a registry-read tax at boot for *every* future session, plus a curation tax to keep its observation log meaningful. New skills feel like infrastructure investment; in practice they are entropy-positive unless they fire frequently enough to offset their cost. Pruning skills is more leverage than adding them.

### 6.2 Adding more vibe-speak modes

9 modes is already at the upper bound of what a session can model accurately at boot. Adding mode #10 trades clarity for variety. Same logic as §6.1.

### 6.3 Refining the OPERATING RULES

Every new rule is read by every future session. The ROI is real for each individual rule but the *aggregate* approaches saturation — additional rules at the margin are paid for forever and act on a low frequency of cases. Pruning > adding.

### 6.4 Extending MODULE_MODES with new states

Eight states is the current count. Each additional state expands the resolution-order logic. Marginal value is low for the typical case and the implementation surface grows fast.

### 6.5 Adding a third device class

Captain currently uses iPhone, work desktop, home laptop. Adding a fourth (e.g., a tablet) increases context-switching cost (`OPERATOR_BANDWIDTH_LIMITS.md` §8) without raising any throughput ceiling. Not leverage.

### 6.6 Premature CI/CD pipelines

The current Cloudflare auto-deploy in ~15s is fast but unverified. Adding a CI pipeline before runtime substrate ([2]) installs verification that has no contract to verify against. Useful eventually, premature now.

### 6.7 Aggressive multi-branch fan-out

Looks like infrastructure for parallelism. In practice: amplifies the very BE problem that the foundation tier is meant to fix. The branch fan-out we already have is at or above the operator-bandwidth ceiling.

### 6.8 Migrating off Cloudflare or Supabase

Big architectural moves that *feel* foundational but are platform substitutions, not architecture corrections. They don't move the leverage axes meaningfully — they trade one set of platform-specific behaviors for another. Out of scope until the genuine foundation work is done.

### 6.9 Authoring new analysis docs (recursive note)

Including this one. Analysis docs have non-zero value, but past a point they substitute for action. The risk is generating a corpus of plans rather than executing the foundation work. Captured here as a self-aware caution: this lane has produced eight docs (six prior + two this pass); the diminishing-return curve in the analysis lane is approaching its knee.

---

## 7. What MUST wait

These moves are not just "deprioritized" — they are *actively harmful* if attempted out of order.

### 7.1 Execution scaling

Raising N before [1]–[6] produces:
- More frozen-file tax on the monolith (compounding).
- More BE on shared globals (compounding).
- More Captain review queue saturation (existential per `ORCHESTRATION_COST_CENTERS.md` §5).
- More overnight rollback exposure (asymmetric per `EXECUTION_ECONOMICS_MODEL.md` §9).
- More fake-progress signals (per `ENTROPY_ACCUMULATION_MODEL.md` §11).

The system already operates at or near the safe N=2-to-3 ceiling. Pushing N higher does not make the system faster; it makes it lossier.

### 7.2 Codex / external-model integration in the shared file

Bringing Codex into the loop on `index.html` doubles the writer count on the most contended file. The fact that Codex is "another model" doesn't change the BE physics — the contention is on the file, not the model. Wait until module isolation is real.

### 7.3 Autonomous chaining of session→session

Without queue durability and per-session WIP, autonomous chaining produces relay decay (`OPERATOR_BANDWIDTH_LIMITS.md` §5) at every chain step. Each step's WIP is rolled into the next, but with degraded fidelity. Multi-step chains accumulate the degradation multiplicatively.

### 7.4 New external integrations (Klaviyo, BigCommerce REST, GA4, etc.)

These are listed in BUILD_PLAN as Track 6 features. They are blocked on Captain credentials (M-tasks), but even when unblocked, each integration adds new entropy reservoirs (out-of-band state per `ENTROPY_ACCUMULATION_MODEL.md` §10.2). Without runtime substrate to verify them, each integration is a future failure-detection blindspot. Not "must wait" in the sense of forbidden, but "must wait" in the sense of: don't accept multiple in a single session pre-substrate.

### 7.5 Generalized agentic scaling (Level 3 → 4 cross-system)

The Alerts module is described in BUILD_PLAN as "Level 3 → 4 cross-system" — and it has shipped. Generalizing that pattern (alerts triggering automated actions, not just notifications) is in the same family as autonomous chaining. Wait for substrate.

### 7.6 Splitting the repo

Moving AccentOS to a multi-repo layout would produce repo-coordination overhead (per-repo CLAUDE.md, per-repo branches, per-repo skills) that compounds with N before any benefit shows up. Decomposition within one repo is the correct first pass; multi-repo is far-future, if ever.

### 7.7 Moving to a microservices substrate

Out of proportion to the problem. AccentOS is a single-page app + worker + database. The frozen-file tax is a code-organization problem, not a deployment-topology problem. Microservices would solve a problem the system doesn't have.

---

## 8. What creates hidden compounding returns

Restated and consolidated from §3 plus the scoring above. These are the moves where the *steady-state* benefit grows over time without further investment.

| # | Hidden compounder | Compounds with | Magnitude |
|---|---|---|---|
| 1 | Decomposition | N × t | Largest known |
| 2 | Module isolation enforcement | N × t | Very large |
| 3 | Idempotent migrations + paired downs | t (every rollback event) | Spiky-large |
| 4 | BUILD_INTELLIGENCE capture discipline | t (every future session) | Steady-large |
| 5 | Branch-age cap (72h) | N (live branches) | Steady-large |
| 6 | Per-session WIP files | N (concurrent sessions) | Steady-medium |
| 7 | `js/<feature>.js` module pattern (already established) | t (each new feature) | Steady-medium |
| 8 | Pruning unused skills / modes / rules | t (every cold start) | Slow-medium |

These are the top-of-the-curve investments. The first three are also the top three architectural moves; the latter five are operational habits with architectural value.

---

## 9. What reduces future entropy fastest

Cross-referencing entropy reservoirs from `ENTROPY_ACCUMULATION_MODEL.md` §5 against actionable architectural levers:

| Entropy reservoir | Architectural lever |
|---|---|
| Stale `claude/*` branches | Branch-age cap (operational) |
| `index.html` size growth | Decomposition ([1]) |
| Shared global namespace | Module isolation ([5]) + loader boundaries ([6]) |
| BUILD_PLAN drift | Per-session WIP + Captain batched closure |
| MASTER §13 staleness | Captain hygiene cadence (operational) |
| Skill registry rot | Quarterly skill prune cadence (operational) |
| Worker / Pages / Supabase out-of-band | Deploy verification + idempotent migrations (substrate) |
| Captain mental-model drift | Cannot be reduced architecturally; only buffered by better doc fidelity |

**Fastest entropy reduction per unit work, ranked:**

1. Branch-age cap discipline — touches 0 code, kills the highest-rate reservoir.
2. Decomposition — once done, eliminates the largest single source of new entropy.
3. Idempotent + paired-down migrations — kills the most expensive *spike* per incident.
4. Per-session WIP — eliminates a whole class of clobber events.
5. Skill / mode / rule pruning — slow but recurring; cheap to do.

---

## 10. Risk-reduction analysis

Same ten candidates, ranked specifically by *worst-case* risk reduction (i.e., how much they shrink the cost of the system's most expensive failure modes).

| Move | Worst-case failure mitigated | Magnitude |
|---|---|---|
| Decomposition | Forced refactor under duress at 900KB hard limit | **Critical** |
| Runtime substrate (esp. paired-down migrations) | Schema rollback going from minutes to hours/days | **Critical** |
| Supervision discipline | iPhone rubber-stamp letting entropy into trunk | **Critical** |
| Module isolation | Cross-branch semantic conflict on shared global | **High** |
| Queue durability | Captain dread → unreviewed merge → orchestration debt | **High** |
| Loader boundaries | Surprise cross-module coupling at runtime | **High** |
| Orchestration tooling | Late detection of BE drift | Medium |
| Governance hardening | Slow rule rot | Medium |
| Codex integration | Single-model dependency | Low (until prerequisites done) |
| Execution scaling | (Increases risk; does not reduce it) | **Negative** |

The "Critical" tier on risk reduction includes one architectural move (decomposition), one substrate move (paired-down migrations), and one purely human move (supervision discipline). **All three are addressable independently** and all three should run as parallel tracks regardless of which is at the top of the leverage ranking.

---

## 11. Future optionality analysis

Optionality = the count of valuable downstream moves that become possible *because* of this move.

| Move | Opens | Closes |
|---|---|---|
| Decomposition | Loader boundaries, Codex integration, lazy load, isolated tests, multi-page output | None |
| Module isolation | Per-module testing, per-module ownership, per-module versioning, per-module lazy load | None |
| Loader boundaries | Plugin model, third-party module loading, rep-portal & trade-portal as independent loadables | None |
| Runtime substrate | Safe migrations, deploy verification, smoke tests, observability hooks | None |
| Queue durability | Long-running coordination, multi-day branch tracking, Codex review pipeline | None |
| Orchestration tooling | Real-time BE band display, smarter session-spawn decisions | Some governance flexibility (locks in instrumentation) |
| Supervision | Batched-review windows, mobile-safe-task routing | None |
| Governance hardening | Cleaner protocol; less ambiguity | Locks in rules — costly to revise |
| Codex integration (after prereqs) | Cross-model review, second-opinion on architectural moves | None |
| Execution scaling (after prereqs) | Higher daily ship count | Locks in higher operating cost |

**The first four moves create wide downstream optionality with no closure cost. Governance and execution scaling have closure costs — they lock in commitments.** Optionality-conscious sequencing: open the wide doors first, walk through the narrow ones last.

---

## 12. The single highest-leverage architectural move

**Decomposition of `index.html`** ([1]).

It is unambiguously the top move on every axis (`§2`). It scores Critical on leverage, risk reduction, future optionality, and entropy reduction *simultaneously*. It is on the critical path of every other valuable move (`§4`). It is racing a hard 900KB ceiling that, if hit before decomposition is planned, will force a refactor under duress. It compounds with both N (parallelism) and t (project age). It currently has no architectural prerequisite — only the decision to do it.

The reason it remains undone is not that it's hard; it's that the per-day pain of the monolith is small compared to the per-week excitement of new features. This is the classic shape of an under-funded foundation move.

Module isolation ([5]) and loader boundaries ([6]) are tightly co-located with decomposition and should be planned together. The single move is "decompose the page into a loader + N module entries with module-isolation enforced at the boundary." Treated together, they are the foundation move; treated separately, decomposition alone is still the highest-leverage piece.

---

## 13. Honest current long-term survivability

"Survivability" = the system's ability to continue producing useful, sustainable output over the next 6–24 months without a forced refactor or operator collapse.

### Trajectory if no foundation moves are made (status-quo continuation)

- **6 months:** survivable. Continued v6.10.x velocity. Increasing iPhone rubber-stamp and branch-age incidents but recoverable.
- **9 months:** under stress. `index.html` likely past 900KB hard limit. Forced split under feature-pressure (worst possible time). Branch-age incidents accumulating; ~1–2 per week need manual reconciliation. Captain bandwidth saturating more often.
- **12 months:** at or near collapse. Forced refactor either underway or postponed past the point of safety. Ship velocity drops sharply. Orchestration debt becomes the dominant cost. Captain dread cycles set in.
- **18 months:** unrecoverable in current shape without a planned rebuild. Likely outcome: a "v7" rewrite consuming 2–4 months of Captain attention, during which feature delivery effectively halts.

### Trajectory if Tier 1 foundation moves are made in next quarter (decomposition + isolation + loader boundaries)

- **6 months:** healthy, expanded ceiling. Foundation work absorbs 1–2 months of attention, but BE drops sharply and N=3 becomes comfortable instead of edge-of-comfortable.
- **12 months:** sustainable indefinitely at current operator bandwidth. Ship velocity higher than status-quo trajectory at this point.
- **18+ months:** survives indefinitely. Substrate work ([2], [7]) layered on top extends ceiling further. Codex integration becomes net-positive and unlocks N=4 in supervised windows.

### Honest summary

**Long-term survivability today, with no foundation moves: ~6–9 months of healthy operation, ~12 months until forced refactor.**

**Long-term survivability with Tier 1 foundation moves in the next quarter: indefinite, with ceiling raised by ~50%.**

The most striking number: the *cost* of the foundation work (1–2 months of Captain-attention spread over a quarter) is roughly the cost of the *forced refactor* that arrives in 9–12 months without it. Done early it's investment; done late it's emergency.

---

## 14. The single most dangerous premature-scaling move

**Raising overnight concurrency past N=3 (or generalizing autonomous chaining) before decomposition + module isolation + loader boundaries are real.**

Why this is the top danger move:

- It compounds every unaddressed cost simultaneously: frozen-file tax, BE, supervision saturation, rollback asymmetry, fake-progress signals.
- It produces the fastest entropy accumulation in the system's history. A single overnight at N=4 with multiple `index.html`-touching sessions can generate ~1 month of entropy debt in 6 hours.
- It is psychologically the most attractive premature move (looks like leverage, feels like infrastructure investment, generates visible activity).
- It creates a "we tried scaling and it worked" narrative that is approximately impossible to walk back even after the morning costs are paid — because the next attempt is always framed as "do it slightly more carefully."
- It is the single move that can shift `long-term survivability` from "12 months" to "3 months" in one night.

Codex integration in the monolith is the second-most-dangerous (same physics, slightly slower compounding). Both should wait.

---

## 15. The architectural prioritization in one paragraph

Decompose `index.html` first; it scores top on every axis, races a hard ceiling, and unlocks every downstream move. Co-develop module isolation and loader boundaries with it as one foundation effort. Add runtime substrate (per-session WIP, paired-down migrations, deploy verification) as the substrate layer once foundation is real. Layer queue durability and orchestration tooling on top, calibrated against the post-decomposition baseline. Bring in Codex integration and execution scaling only after all prior layers are real — and recognize that, today, those two moves are net-negative regardless of how attractive they look. The single move that determines the system's 12-month survivability is decomposition; the single move most likely to *destroy* survivability is overnight concurrency past N=3 before that decomposition is real.

---

## 16. DONE / KNOWN / NEXT

**DONE**
- Defined the four architectural-prioritization axes: leverage, risk reduction, future optionality, entropy reduction.
- Scored ten candidate moves on all four axes (qualitative bands).
- Mapped the dependency graph showing critical path: [1] → [5]/[6] → [2]/[7] → [3]/[8] → [4] → [9] → [10].
- Identified Tier 1 (Foundation), Tier 2 (Substrate), Tier 3 (Operational), Tier 4 (Optional/Advanced).
- Catalogued nine "appears urgent but is not leverage" candidates and seven "must wait" categories.
- Listed eight hidden-compounding-returns leaders.
- **Single highest-leverage architectural move: decomposition of `index.html` (with module isolation and loader boundaries as the natural co-developed foundation cluster).**
- **Single most dangerous premature-scaling move: raising overnight concurrency past N=3 / generalizing autonomous chaining before decomposition + isolation + loader boundaries are real.**
- **Honest long-term survivability:** ~9–12 months at current trajectory before forced refactor; indefinite if Tier 1 foundation moves are made in the next quarter.

**KNOWN**
- All scoring is calibrated qualitative; no measurement.
- The dependency graph reflects the system as it is today; future architectural choices may add nodes or edges.
- "Codex integration" is treated abstractly. The specific Codex skill that exists in `skills/codex-review/` is a narrow, defensible exception when used as a *reviewer* of completed branches — it is not the failure mode under analysis here. The failure mode is Codex (or any second model) as a *concurrent writer* into the monolith.
- `SCALING_SEQUENCE_ANALYSIS.md` complements this doc: this one ranks the moves; that one analyzes the *order* in which they must be made and what goes wrong when they aren't.

**NEXT**
- `SCALING_SEQUENCE_ANALYSIS.md` is the natural companion (sequencing logic, irreversible-ordering mistakes, premature-scaling traps).
- A future, optional companion: a 1-pager mapping each Tier 1 move into specific concrete repository changes (decomposition plan, loader contract spec, isolation enforcement). Out of scope for this analysis-only pass.
- The most operator-actionable item from this analysis: **before any move that scales N or expands autonomy, ask which of the ten candidates have actually moved.** If the answer is "none of [1], [5], [6]," the proposed scaling move is net-negative regardless of how it feels.
