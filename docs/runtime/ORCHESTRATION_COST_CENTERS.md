# ORCHESTRATION COST CENTERS

> **Companion to:** `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `TOKEN_TO_OUTPUT_EFFICIENCY.md`.
> **Scope:** A line-by-line decomposition of every cost center in the AccentOS multi-session orchestration system, with each cost classified by behavior under scale (compound / plateau / existential).
> **Frame:** Analysis-only. Documentation-only. Does not modify governance, runtime, or workers.
> **Last updated:** 2026-05-10

---

## 0. How to read this document

Every cost in this system behaves in one of three ways under scale:

| Class | Definition | Example | Treatment |
|---|---|---|---|
| **Compounding** | Cost grows super-linearly with N (sessions) or t (time) | Branch entropy, frozen-file tax | Must be actively contained or it eats the system |
| **Plateauing** | Cost grows but bounded above by a ceiling | Boot cost per session, governance overhead | Acceptable; budget around it |
| **Existential** | Cost goes vertical past a threshold; system fails | Reconciliation collapse, supervision saturation | Avoid by staying below the threshold |

A cost can be cheap in absolute terms today and still be **existential**, because what matters is the slope, not the level. The fight in any orchestration system is to keep compounding costs flat and existential costs far from their cliff.

---

## 1. Coordination cost

**Definition.** Work that exists only because there is more than one session. Communication, synchronization, hand-off, and contention.

**Components observed in AccentOS.**

- **Inter-session synchronization.** Sessions must agree on which BUILD_PLAN item is being worked, what the live `index.html` line numbers are, what's in WIP. Today this synchronization happens through file artifacts (WIP, BUILD_PLAN, commits) rather than a coordinator — so it's eventually-consistent at best.
- **Implicit locking on shared writes.** The OPERATING RULES allow only one WIP write at a time, but there is no mutex; coordination happens by social convention. With N sessions, contention rises as O(N).
- **BUILD_PLAN claim races.** Two sessions reading the same `[ ]` item without observing each other can both claim it.
- **Skill-routing duplication.** Every session re-derives the same skill-routing decision from the same `skills/_index.md`.
- **Vibe-speak calibration drift.** Each session re-loads `profiles/`, `observation-log`, and `feedback-log` independently — same data, N reads.

**Behavior under scale.** **Compounding.** Per `EXECUTION_ECONOMICS_MODEL.md` §2, coordination grows roughly as `O(N²)` (pairwise) but is empirically closer to `O(N · k)` where k is the number of shared resources. Either way, super-linear.

**Why it's dangerous.** It is *invisible per session*. Each session sees only its own boot + work. The aggregate coordination tax is paid by the *system*, not the session, and shows up as missing throughput at the trunk.

**Approximate cost surface (AccentOS today).** ~12% of total session-time at N=2, ~28% at N=3, ~48% at N=4. (Restated from `EXECUTION_ECONOMICS_MODEL.md` §4.)

**Class: COMPOUNDING.**

---

## 2. Merge cost

**Definition.** Wall-clock + cognitive cost to integrate a branch into trunk while preserving every other live branch's work.

**Components.**

- **Per-branch fixed cost.** Captain reads the diff and decides intent. ~3–8 minutes regardless of branch size up to ~500 LOC.
- **Per-conflict cost.** ~15–30 minutes per `index.html` conflict, because surgical `str_replace` patches assume stable line context.
- **Cross-branch semantic cost.** Branches that compile clean individually but jointly violate an invariant (duplicate global, version-string regression, sidebar registration order). Detection is manual; cost is unbounded.
- **Order-of-merge effects.** Same set of branches merged in different orders produce different outcomes. Captain must choose order, not just merge.

**Behavior under scale.** **Compounding** with respect to N (number of live branches), at roughly `O(N × k)` for k = touched-shared-resources per branch (currently k ≈ 4 in AccentOS).

**Cost amplifiers.**

- Branch age. Each day a branch sits unmerged, its diff drifts further from trunk. Cost ~2× per 72h.
- Touched-files. Branches touching `index.html` cost roughly 5× a branch confined to a `js/<module>.js`.
- Schema migrations. A branch with an SQL migration cannot be cleanly reverted unless paired with a down-migration.

**Class: COMPOUNDING** (becomes near-existential when paired with branch aging).

---

## 3. Branch entropy cost

**Definition.** The probability that a randomly-chosen line in a branch's diff conflicts (textually or semantically) with another live branch's diff. The cost is the expected reconciliation work that flows from that probability.

**Sources of branch entropy in AccentOS.**

- **Shared `index.html`** is the dominant source — most branches touch it.
- **Top-level globals** (`USERS`, `VENDORS`, `INVENTORY`, `goTo` routes, `MODULES`).
- **`module_modes.json`** (every new module adds an entry).
- **MASTER and BUILD_PLAN** — every session writes both at session-end.
- **Sidebar registry** — fixed-position resource where registration order matters.

**Cost equation (rough).**

```
BE ≈ a × Nbranches × Σ (touched_shared_resources)
   × (1 + age_days × 0.5)
   × global_mutation_multiplier
```

`global_mutation_multiplier` is 1 if no top-level identifiers are added/removed; 2–3 if they are. Removing a global like `USERS{}` is the worst single action a branch can take with respect to BE — it cost a session already (per BUILD_INTELLIGENCE).

**Behavior under scale.** **Compounding.** BE is a product of N, shared-touch count, and age — all three grow under unconstrained scale. Per `PARALLELISM_SAFETY_THRESHOLDS.md` §4, BE > 0.65 triggers reconciliation collapse.

**Class: COMPOUNDING with an existential cliff.** BE itself is bounded ≤ 1, but the *cost* of operating at BE > 0.4 grows non-linearly because Captain time is not infinite.

---

## 4. Context reconstruction cost

**Definition.** Tokens spent by a fresh session to rebuild the picture of the project before any feature work begins.

**Per-cold-start ingest** (from `EXECUTION_ECONOMICS_MODEL.md` §7):

| Layer | Approx tokens |
|---|---|
| Repo geography | 4–6k |
| Active build state | 5–8k |
| Lessons / gotchas | 6–10k |
| Skill registry | ~3k |
| Vibe-speak calibration | 2–4k |
| Open loops / blockers | 2–3k |
| **Total** | **~22–34k** |

**Behavior under scale.** **Plateauing per session, but linear in N.** Each session pays a fixed-ish cost; the total system bill is N × cost.

**Why it doesn't compound.** A single session's cold-start cost doesn't grow with the size of the project beyond a point — the bounded files (BUILD_PLAN, MASTER, BUILD_INTELLIGENCE, skills index) all hover under fixed soft limits. There is no positive feedback loop where reading more makes the next session need to read even more.

**Why it still hurts.** It is paid *every time* a session starts, and there is no warm pool. Sessions that ship < 3 commits are net-negative because reconstruction cost exceeds value.

**Cost amplifiers.**

- Stale WIP — increases re-investigation time.
- BUILD_INTELLIGENCE growth without pruning — reading time grows linearly with project age.
- Skill registry growth without pruning — same.

**Class: PLATEAUING** (per session) but **LINEAR** in N. Aggregate total can still be the largest line item if N is high; today it is.

---

## 5. Supervision tax

**Definition.** Captain attention required per unit of output, expressed as a fraction of Captain time consumed by N sessions.

**Curve from `EXECUTION_ECONOMICS_MODEL.md` §8.**

```
s(1) ≈  5%
s(2) ≈ 12%
s(3) ≈ 25%
s(4) ≈ 45%
s(5) ≈ 70%
s(6+) ≈ saturates Captain
```

**Sub-components.**

- **Ambient acknowledge.** Reading commit summaries; saying "ok." Cheapest.
- **Active review.** Reading diffs end-to-end before approval. Mid-cost.
- **Semantic reconciliation.** Resolving cross-branch conflicts after the fact. Most expensive — and the *probability* of needing it grows with N, so this dominates at high N.
- **Ground-truth correction.** Refreshing WIP, BUILD_PLAN, MASTER when they drift from reality. Recurring.

**Behavior under scale.** **Existential.** Captain is a single 1-wide queue. The supervision tax curve is concave-up, and there is no degree of process that turns Captain into N parallel reviewers. Past Captain saturation, the system either freezes (best case — sessions queue) or merges unread (worst case — orchestration debt accumulates silently).

**Cost amplifiers.**

- Mobile-only orchestration. Phone review is approximately rubber-stamp at any non-trivial diff size. (Detailed in `OPERATOR_BANDWIDTH_LIMITS.md`.)
- Decision fatigue across long sessions — late-day approvals are statistically lower-quality.
- Context-switching across modules. Captain re-orienting between Vendor Ranking and Marketing Hub costs more than reviewing two diffs in the same module.

**Class: EXISTENTIAL.** This is the single hardest-to-scale resource in the entire system.

---

## 6. Frozen-file tax

**Definition.** Cost paid by *every other session* whenever a single file is held open with uncommitted changes by one session. The longer the file is held, the higher the tax.

**Why it exists.** Two sessions cannot both produce surgical `str_replace` patches against `index.html` without one of them planning against stale line context. The session that held the file "wins" by default; the other session must re-plan from the new file state.

**Components in AccentOS.**

- **`index.html` freeze.** Whenever any session has uncommitted edits to `index.html`, every other session is implicitly blocked from making related edits without rebasing. Even if no merge conflict happens, the *plan* of the second session may be invalidated.
- **`MASTER.md` freeze.** Less critical (lower edit frequency), but a held MASTER blocks session-end commits.
- **`BUILD_PLAN_CLAUDE.md` freeze.** Blocks BUILD_PLAN claims and check-offs.
- **`module_modes.json` freeze.** Blocks any new module flip.
- **Schema-migration freeze.** While one session has an open SQL migration, no other session can safely apply schema changes — if both apply, ordering is undefined.

**Behavior under scale.** **Compounding.** Frozen-file tax = (duration of freeze) × (number of other sessions × probability they need that file). With N sessions and a high-traffic file, this is essentially `O(duration × N²)`.

**Cost amplifiers.**

- File size. `index.html` at 651KB has the highest realistic freeze tax.
- Edit complexity. A session debugging an `index.html` issue may hold the file open for hours.
- Lack of pre-claim signals. Without pre-declaring "I'm editing X," other sessions don't know to avoid X.

**Class: COMPOUNDING** with an existential edge — at extreme freeze durations, the system devolves to serial because no other session can safely make progress.

---

## 7. Governance overhead

**Definition.** Cost of the rules, protocols, and meta-documentation that keep the orchestration system coherent. Includes OPERATING RULES, BUILD_PLAN_*.md, MODULE_MODES, MASTER.md, vibe-speak modes, the skill registry itself.

**Components.**

- **Doc maintenance.** Every change to an OPERATING RULE or to the protocol section of MASTER imposes a one-time read tax across all future sessions.
- **Rule conflicts.** When two rules can both be invoked and disagree (e.g., "no narration between steps" vs "explain hard-to-reverse actions"), Captain time is spent resolving precedence.
- **Skill registry curation.** Adding skills cheaply is fine; not pruning them is what compounds — every dormant skill is a permanent registry-read cost across sessions.
- **Mode definitions.** 9 vibe-speak modes is already at the upper end of what a session can model accurately at boot time.
- **Per-user override layers.** `module_modes.json` + `accentos_user_overrides` adds resolution-order cost to every visibility check.

**Behavior under scale.** **Plateauing** in healthy operation; **compounding** if not pruned. Governance has no inherent growth driver — it grows only when something is added. Adding without subtracting is the failure mode.

**Why it usually plateaus.** Governance docs have natural soft limits — Captain wouldn't tolerate a 100-rule OPERATING RULES section. The system self-restrains at the high end via Captain irritation.

**Why it sometimes compounds.** When Claude (not the Captain) adds skills, modes, or rules autonomously, no irritation feedback applies — only structural pruning would catch it.

**Class: PLATEAUING under good hygiene; COMPOUNDING if curation lags.**

---

## 8. Stabilization overhead

**Definition.** Cost of bringing a freshly shipped change to a point where the next session can build on top of it without risk.

**Components.**

- **Smoke-confirm.** Verifying the bundle compiled, the route loads, the page doesn't throw. AccentOS does this manually today (no automated smoke).
- **WIP / BUILD_PLAN / SESSION_LOG closure.** Updating the docs that the *next* session will read. Per OPERATING RULES, batched at session end.
- **Lessons capture.** Adding a BUILD_INTELLIGENCE entry if a non-obvious gotcha was hit. Highest-ROI write but also the easiest to skip.
- **Branch closure.** Either merging the branch or marking it stale. An open branch left around is a future entropy reservoir.
- **Schema reconciliation.** Confirming that any applied migration matches what `migrations/` says it should be.

**Behavior under scale.** **Plateauing per ship**, but **compounding in deferral.** A single skipped stabilization cycle costs little today; ten skipped stabilization cycles produce the morning of debt that consumes the next Captain block.

**Cost amplifiers.**

- Overnight runs. Stabilization deferred across multiple sessions amplifies the morning bill.
- High commit-velocity. Many small ships without stabilization between them produce a backlog of "is this one fine, or did it ride the previous bug?"

**Class: PLATEAUING per cycle; COMPOUNDING when skipped.** The danger is the deferral pattern, not the act itself.

---

## 9. False-parallelism cost

**Definition.** Cost paid when running N sessions that *appear* parallel but in practice serialize on a shared resource. The system pays the N-session cost (boot, supervision, coordination) without getting the N-session throughput.

**Examples in AccentOS.**

- **Two sessions both editing `index.html`.** They are not parallel — one will fight a rebase or get stale.
- **Two sessions both updating BUILD_PLAN markers.** Last write wins; one gets clobbered.
- **Two sessions both operating in the same module file.** They collide on `js/<module>.js` line numbers.
- **Two sessions both opening migrations.** Strict ordering is required; effectively serial.
- **One session waiting on Captain approval while another runs ahead.** Captain bottleneck makes them sequential.

**Cost calculation.**

```
False-parallelism cost = (cost of running N sessions)
                       − (value produced as if N=1)
                       = (N − 1) × (boot + coord + supervise)
                         minus the marginal throughput that didn't happen
```

**Why it persists.** The signals look fine per-session. Each session is running, Each is producing tokens. The serialization shows up only at the trunk, where commits arrive as if from one session.

**Behavior under scale.** **Compounding.** Worse with each added pseudo-parallel session, because the *pretense of parallelism* costs N copies of every fixed cost.

**Class: COMPOUNDING** and especially insidious because it doesn't trigger any obvious alarm — the *symptom* is "we ran 4 sessions and shipped 1.5 features," but that's only visible in retrospect.

---

## 10. Reconciliation cost

**Definition.** Cost paid to bring N branches' work into a single coherent trunk after they were produced in parallel. Includes all of: textual conflict resolution, semantic conflict resolution, version-string normalization, sidebar / route ordering, schema sequence, BUILD_PLAN truth-up, MASTER session-log consolidation.

**Components.**

- **Textual conflicts.** Resolved with `git`, but each one is a 5–30 minute Captain task.
- **Semantic conflicts.** Cannot be resolved with `git`. Requires reading and re-reasoning. ~30–120 minutes per case.
- **Truth-up writes.** After merge, BUILD_PLAN / WIP / MASTER must reflect what's actually live. Often skipped → drift.
- **Smoke-test sweep.** Confirming that the merged result still works at runtime. AccentOS manual today.
- **Communication-layer reconciliation.** Two sessions may have drafted Captain-facing messages saying conflicting things; one must be retracted.

**Behavior under scale.** **Existential.** Reconciliation cost scales as `O(N²)` worst-case (pairwise semantic checks) and as `O(N)` best-case. There is a critical zone (`PARALLELISM_SAFETY_THRESHOLDS.md` §5) where reconciliation cost exceeds the value of the work being reconciled — the system goes net-negative until the queue is drained serially.

**Cost amplifiers.**

- Branch age (per §3, BE doubles per 72h).
- Schema migrations without paired down-migrations.
- Captain backlog size (more than 3 unreviewed branches).
- Cross-module changes (e.g., a feature touching 4 module files + index.html + a migration).

**Class: EXISTENTIAL** at the cliff. Below the cliff it's painful but linear; above the cliff it's the failure mode of the entire system.

---

## 11. Cross-cost interactions

The costs above don't operate independently. The most damaging effects in real operation come from **interactions** between cost centers:

- **Frozen-file tax × supervision tax.** A long-held `index.html` plus a Captain on iPhone produces both stalled sessions *and* unreviewed pending merges.
- **Branch entropy × reconciliation cost.** High BE makes reconciliation worse; expensive reconciliation drives Captain to defer it; deferral makes BE worse. Positive feedback loop.
- **False-parallelism × supervision tax.** Pseudo-parallel sessions all demand Captain attention as if independent; Captain saturates without getting the throughput payout.
- **Context reconstruction × governance overhead.** Each new governance doc adds to per-session cold-start. Adding skills/modes/rules without pruning compounds the boot tax.
- **Stabilization × reconciliation.** Every skipped stabilization cycle is a future reconciliation cycle, often at 5–10× the original cost.

These interactions are why the simple per-cost arithmetic understates the total bill. The real system bill is the *sum of products*, not the sum of singletons.

---

## 12. Class summary

| Cost center | Class | Notes |
|---|---|---|
| Coordination cost (§1) | Compounding | O(N²) worst, O(N · k) typical |
| Merge cost (§2) | Compounding | Steep slope on monolith |
| Branch entropy (§3) | Compounding + existential cliff | Cliff at BE > 0.65 |
| Context reconstruction (§4) | Plateauing per session, linear in N | Largest aggregate today |
| Supervision tax (§5) | **Existential** | Captain is 1-wide |
| Frozen-file tax (§6) | Compounding + edge-existential | Worst on `index.html` |
| Governance overhead (§7) | Plateauing if pruned, compounding if not | Self-restraining socially |
| Stabilization overhead (§8) | Plateauing per cycle, compounding if deferred | Deferral is the trap |
| False-parallelism (§9) | Compounding | Insidious, hides as throughput |
| Reconciliation (§10) | **Existential** | The cliff itself |

**Existential costs:** supervision (§5) and reconciliation (§10). These are where the system *fails*, not just where it gets expensive. Everything else compounds, plateaus, or both — but doesn't break the system on its own.

**Highest-leverage compound costs to flatten** (analysis only, not implementation):

1. Frozen-file tax (§6) — bounded by splitting `index.html`.
2. Branch entropy (§3) — bounded by branch-age caps and per-session WIP.
3. Coordination cost (§1) — bounded by reducing shared resources k.

---

## 13. The hidden tax: invisible per-session, expensive in aggregate

Across all ten cost centers, the pattern that dominates is: **costs that are invisible from inside a single session and expensive at the system level.**

Concretely:

- A session looks productive. It boots, plans, edits, commits, pushes.
- It has no view of the *other* sessions paying the same boot cost in parallel (§4).
- It has no view of the contention it's creating on shared files (§6).
- It has no view of the BE it's adding (§3).
- It has no view of the Captain time its merge will require (§5).

Because the cost is paid by the *system* and not by the *session*, no single session gets pricing pressure. The result is a tragedy-of-the-commons dynamic where every session is locally rational and the aggregate is wasteful.

**This is the deepest reason why "more sessions" doesn't scale.** Not because each session is worse, but because no session is asked to pay its share of the system's coordination bill.

---

## 14. DONE / KNOWN / NEXT

**DONE**
- Decomposed the orchestration cost surface into ten named cost centers.
- Classified each as compounding, plateauing, or existential.
- Identified two existential costs: supervision (§5) and reconciliation (§10).
- Identified the three highest-leverage compounding costs to flatten: frozen-file tax (§6), branch entropy (§3), coordination (§1).
- Articulated the system-level "tragedy of the commons" pattern that dominates the hidden tax.

**KNOWN**
- All cost classifications are calibrated against observed AccentOS sessions; no instrumentation provides exact numbers.
- The model assumes Claude-as-primary; ChatGPT-Pro-as-secondary changes interactions but not classifications.
- Several costs (especially §6 frozen-file tax) collapse sharply once `index.html` is split. The classification table will need a refresh at that point.

**NEXT**
- `ENTROPY_ACCUMULATION_MODEL.md` drills the BE concept (§3) and the invisible-entropy categories.
- `OPERATOR_BANDWIDTH_LIMITS.md` drills the supervision tax (§5) and the human-side scaling limits.
- Optional later: a 1-page "cost dashboard" mapping each center to a counter in `efficiency-log.md`. Out of scope here.
