# TOKEN-TO-OUTPUT EFFICIENCY

> **Companion to:** `EXECUTION_ECONOMICS_MODEL.md` and `PARALLELISM_SAFETY_THRESHOLDS.md`.
> **Scope:** Where token spend converts to shipped value, where it leaks, and which orchestration patterns produce false signals of progress.
> **Frame:** Analysis-only. Does not change runtime behavior or governance.
> **Last updated:** 2026-05-10

---

## 1. The unit

Useful output = **a shipped change that survives ≥ 24h on `main` without being reverted, reconciled, or re-done.**

Every token spent that does not contribute to a surviving shipped change is, by definition, leakage. The goal is not to minimize leakage to zero — some is inherent (boot cost, exploration, debugging). The goal is to know which *categories* of leakage compound and which dissipate.

---

## 2. Where token spend compounds (positive ROI)

Compounding spend = tokens that pay for themselves multiple times.

### 2.1 BUILD_INTELLIGENCE.md entries
Every line in BUILD_INTELLIGENCE is read at the start of every future session. A 200-token entry that prevents a 5,000-token re-investigation pays back ~25× over its lifetime, and the lifetime is months. **Highest-ROI writing in the system.**

### 2.2 Skills with sharp triggers
A well-scoped skill (e.g., `bottleneck-finder`, `supabase-sql-magic`) routes a class of tasks onto a warm path. The cost is the one-time skill authoring + the small registry-read at boot. The benefit is paid every time the skill fires. ROI scales with trigger frequency.

### 2.3 Surgical `str_replace` patches against a known anchor
When the anchor is stable, a 50-line patch costs ~1k tokens to author. Rewriting the surrounding block from scratch costs 10–20×. *The cost gap is the productivity moat of the AccentOS workflow.*

### 2.4 Per-module JS files (`js/feature.js`)
A change confined to one module file pays the lowest possible coordination tax. No `str_replace` anchor risk, no shared-global risk, low BE contribution. **Every feature shipped as a standalone `js/*.js` rather than inlined into `index.html` is a permanent reduction in future entropy.**

### 2.5 WIP doc fidelity at session-pause
A clean WIP write at pause (with commit hash, exact bug, exact next step) costs ~500 tokens and saves the next session 5–15k of re-investigation. ~10–30× payback per relay.

### 2.6 Pre-claiming BUILD_PLAN items
Marking the chosen item as `[~]` in WIP before opening a parallel session costs ~50 tokens and prevents an entire duplicate-ship cycle (which costs ~30k tokens + Captain reconciliation).

---

## 3. Where token spend leaks (negative ROI)

Leakage = tokens that produce no surviving shipped change.

### 3.1 Boot-cost amplification (largest leak)
Per `EXECUTION_ECONOMICS_MODEL.md` §7, every session reads ~22–34k tokens of context before any feature work. Across N parallel sessions, this is *N × that cost* with no marginal benefit beyond N=1 — they all reconstruct the same picture. **Estimated 25–30% of total token spend, system-wide.**

### 3.2 Re-discovery of already-known facts
A session that doesn't read BUILD_INTELLIGENCE re-learns its lessons. A session that doesn't read the skill index brute-forces a task with a skill. Cost: typically 5–15k tokens per incident, recurring.

### 3.3 Tool-output bloat
Verbose `cat` / `ls` / `git log` outputs that fill the context window with mostly-irrelevant text. The actionable signal is usually 5–10% of the bytes. The remainder is paid for in every subsequent inference within that session.

### 3.4 Re-entry into the same investigation across sessions
Symptom: WIP says "debugging X." Three sessions later, WIP still says "debugging X." Each session paid full boot cost + partial investigation cost; net ship was zero. **This is the #1 invisible token drain in long projects.**

### 3.5 Speculative scaffolding
Writing helpers, abstractions, or future-proofing for code paths that aren't yet required by any shipped feature. The CLAUDE.md and global system prompt both warn against this; it still creeps in. Costs are paid at write-time *and* at every later read-time of the unused scaffolding.

### 3.6 Fast-mode for slow tasks
Using a faster Claude variant for tasks that need careful reasoning produces output that has to be redone, doubling the cost. The error mode is invisible until rollback.

### 3.7 Narration / status-padding
Output to the user that describes intent rather than reporting facts. Per OPERATING RULES "no narration between steps." Each unnecessary paragraph is a small token tax that scales linearly with session length.

### 3.8 Re-asking the Captain a question already answered in MASTER §13
Sessions that don't read MASTER's "Open Loops & Blockers" will re-surface a blocker the Captain already answered. Captain-time leak ≫ token leak here, but both are real.

---

## 4. Orchestration waste categories

Five named categories. The first three are well-quantified above; the last two are emergent and harder to catch.

| # | Category | Tokens lost / incident | Frequency | Total impact |
|---|---|---|---|---|
| 1 | Boot-cost amplification | ~22–34k × (N − 1) | Every parallel run | **Largest** |
| 2 | Cross-session re-investigation | ~5–15k | ~once per 2 sessions | **Large** |
| 3 | Brute-forcing past a skill | ~5–10k | Variable | Medium |
| 4 | Speculative / over-built abstractions | Hard to bound; lifetime cost | ~1 in 4 features | **Hidden, large lifetime** |
| 5 | Rollback + reconciliation | 5–60k per incident | Rare-but-painful | **Spiky** |

Categories 1, 2, and 3 are *flow* losses — they bleed continuously. Categories 4 and 5 are *event* losses — they spike. Both must be tracked; the spiky losses are usually what people remember, but the flow losses dominate the cumulative bill.

---

## 5. High-ROI execution patterns

These are the patterns that, when habitual, push effective efficiency from ~0.55 toward ~0.80.

### 5.1 Single-file changes via standalone module
Ship a feature as `js/<feature>.js` plus a tiny wire-up edit in `index.html`. The wire-up is 2–5 lines (sidebar entry + route). The module file is independent. This pattern dominates the v6.10.x catalog and is the reason recent BUILD_PLAN items have been low-incident-cost.

### 5.2 Pure-compute layers over existing data
"No new schema" features (Deal Optimizer 5.7, Decision Engine 5.15, Demand Forecast 6.9). They cost zero rollback risk at the data layer and zero migration coordination. **The cheapest possible value-per-token in AccentOS.**

### 5.3 Idempotent migrations (`DROP POLICY IF EXISTS` etc.)
Per BUILD_INTELLIGENCE: idempotent SQL is re-runnable, drastically cutting the cost of debugging schema state. Tiny up-front cost; large recurring savings.

### 5.4 Reading WIP before doing anything
Cheap (~3k tokens). Prevents the entire class of "redo work that already shipped" failures.

### 5.5 Tight skill triggers
Skills whose triggers are concrete phrases the Captain actually says route many tasks for the cost of one registry read. The lower the false-positive rate of the trigger, the higher the ROI.

### 5.6 Writing one-line BUILD_INTELLIGENCE entries when a gotcha is found
Even a single line — 30 tokens — pays back across every future session for as long as the project lives. **Best ROI in the entire system on a per-token basis.**

### 5.7 Captain-batched supervision windows
When Captain reviews 3–5 ships in one window, per-review fixed cost amortizes. Single-ship reviews are inefficient on both sides.

### 5.8 N=2 parallelism in the GREEN zone
The single best concurrency setting for waking-hours work. ROI of the second session is high; ROI of a third is conditional; ROI of a fourth is usually negative.

---

## 6. Low-ROI execution patterns

These should be explicitly de-prioritized.

### 6.1 N ≥ 4 sessions on the same surface
Per `PARALLELISM_SAFETY_THRESHOLDS.md` §2: net useful throughput drops. Tokens spent feel productive per-session but produce less aggregate value than N=3.

### 6.2 Long unfocused exploration without a hypothesis
"Look around the repo for what to build next" without a stated target. Burns 10–20k tokens to surface options that are already in BUILD_PLAN.

### 6.3 Inline `index.html` features instead of `js/feature.js`
Increases shared-file collision surface for every future parallel session. The cost is paid by *every other branch*, not the originating one — which is why it keeps happening.

### 6.4 Re-writing a section instead of patching it
Per BUILD_INTELLIGENCE rule "All edits via surgical str_replace patches — never rewrite from scratch." Wholesale rewrites produce diffs that are nearly impossible to merge against any other live branch.

### 6.5 Unsupervised migrations
A migration applied during an overnight run that the Captain hasn't seen is a rollback time-bomb. The token-cost of writing it looks small; the expected cost including potential rollback is large.

### 6.6 Cross-branch chained planning
Session A "plans for" what Session B will do. The plan is written before B exists, so A is paying token cost for a context B will reconstruct anyway. Almost always a leak.

### 6.7 "Just in case" type safety / validators on internal-only data
Per CLAUDE.md and global system prompt: validate at boundaries (user input, external API), not inside trusted internal flows. Internal validation is leakage.

### 6.8 Verbose narration to the Captain on iPhone
Captain on phone has narrow review bandwidth. Long explanations get skimmed; the actionable bit is buried. Tighter is more likely to be acted on.

---

## 7. When "more sessions" lowers total output quality

Three regimes where adding a session reduces, not increases, useful output:

### 7.1 The shared-surface regime
N ≥ 3 with two or more sessions touching `index.html`. Even if each session ships, the merge will lose work, force rework, or introduce semantic conflicts. *Adding a fourth session here strictly subtracts.*

### 7.2 The Captain-saturated regime
N where Captain's review bandwidth is already 100%. Additional sessions don't get reviewed; their work either stalls (best case) or merges unread (worst case, accumulates orchestration debt). At this point, *extra sessions are debt origination, not work.*

### 7.3 The overnight-without-guardrails regime
N ≥ 3 unsupervised, with any of: `index.html` edits, schema migrations, shared-global mutations. Morning reconciliation cost exceeds night build value. **The expected sign of net output is negative.**

The diagnostic, in all three: ask "if this session ships in the next hour, will Captain be able to read its diff before the *next* session starts on top of it?" If no, the session is being added past the point of usefulness.

---

## 8. False productivity signals

The dangerous category. These look like progress; they aren't. Listing each with the tell-tale and the actual cost.

### 8.1 Commit-velocity inflation
**Tell:** Many commits per hour.
**Reality:** Most are WIP/debug/typo-fix commits, not shipped features. BUILD_PLAN movement is what counts; commit count isn't.
**Cost:** Captain spends review time on noise; real ships hide in the noise.

### 8.2 "Boot complete" as work
**Tell:** Several sessions report "session start complete, plan loaded, ready" without any commits to follow.
**Reality:** Pure boot-cost amplification. Nothing was built.
**Cost:** Tokens equal to N × ~30k, output zero.

### 8.3 Auto-deploy as validation
**Tell:** "Deployed to Cloudflare in 15s."
**Reality:** The bundle compiled. That's all. There are no smoke tests; the feature may be broken at runtime.
**Cost:** Discovered when the Captain or a customer hits the broken path; rollback at that point is asymmetric per `EXECUTION_ECONOMICS_MODEL.md` §9.

### 8.4 Doc updates as feature work
**Tell:** Session "shipped" 4 things, but the diffs are MASTER, BUILD_PLAN, SESSION_LOG only.
**Reality:** Doc churn. Sometimes valuable; rarely a feature.
**Cost:** OPERATING RULES rightly says doc updates should be *batched at session end into one commit*. When they aren't, the session-cost-to-feature-shipped ratio is misleading.

### 8.5 Skill listings without skill firings
**Tell:** A pile of skills exist, but the skill-bypass signal in efficiency-monitor keeps tripping.
**Reality:** Skills aren't being routed to. Their token cost is being paid (registry read every boot) without their benefit being claimed.
**Cost:** Net negative until trigger phrases are tightened or the skill is retired.

### 8.6 "Lots of WIP" as engagement
**Tell:** WIP doc is dense and frequently updated.
**Reality:** Dense WIP often means the work is stuck. Healthy WIP is short and ages out fast.
**Cost:** A long-lived WIP item is a re-investigation magnet — every new session pays full boot cost to re-enter it.

### 8.7 Branch count as progress
**Tell:** `git branch --list claude/*` shows 5+ live branches.
**Reality:** Branches that don't merge are entropy reservoirs (per `PARALLELISM_SAFETY_THRESHOLDS.md` §4).
**Cost:** Each unmerged branch's BE doubles per day. After 72h they should be merged or closed; after a week they are usually unmergeable without manual reconciliation.

---

## 9. Fake acceleration patterns

Specific anti-patterns that *feel* like the project is going faster but are net-negative.

### 9.1 "Spawn N sessions to attack the backlog"
Looks like 4× speed. In practice, hits Zone RED, produces collisions, and the morning Captain-cost cancels the gain. **Speedup is illusory; cost is real.**

### 9.2 "Fast mode for everything"
Faster output per token is great when the task is straightforward; on tasks that need reasoning, fast mode produces work that has to be redone. *Mean speed* falls when the rework is counted.

### 9.3 "Skip the WIP write, we'll remember"
Skips ~500 tokens. Costs the next session ~10k tokens of re-discovery. The savings is real on this turn; the cost is paid by a future Claude. Classic externality.

### 9.4 "Push without redeploy"
The Worker proxy story (commit `2dca2a6` per `WORK_IN_PROGRESS.md`) is a live example: code was pushed but the Worker wasn't redeployed, leaving live traffic on the old code. Looked like progress; was a bug source.

### 9.5 "Run the autonomous skill all night"
Adds N×6h of session-time. Per §7.3, expected morning reconciliation cost exceeds expected build value above N=3 (and below it without guardrails). Fast feeling, slow result.

### 9.6 "Apply the migration, write the down-migration later"
Looks like one less step. Becomes a critical-path block the moment a bad migration ships. **Expected-value cost is far higher than the few minutes "saved."**

---

## 10. Orchestration debt accumulation

Orchestration debt = future work that *must* be done because of how present work was structured. Different from technical debt: it's about the orchestration shape, not the code shape.

Sources, ranked by accumulation rate observed in AccentOS:

1. **`index.html` growth toward 900KB.** Every feature inlined into `index.html` adds debt that compounds with every parallel session thereafter. (76% utilization today.)
2. **Shared-global proliferation.** Every new top-level `const`/`let`/`window.X` is a future merge-conflict edge.
3. **Schema migrations without down-migrations.** Each unrolled migration is a future Captain-hour-or-more if the migration was wrong.
4. **Stale branches not closed.** Each lingering branch is a future BE incident.
5. **Skills with loose triggers.** Each over-firing skill costs token-attention until the trigger is tightened.
6. **WIP doc rot (entries that don't reflect reality).** Each stale WIP line is a future re-investigation.
7. **Doc-drift (BUILD_PLAN says `[ ]` but the feature is shipped, or vice versa).** Each drift instance is a future "did this ship?" question that costs tokens to answer.

Rule of thumb: if a debt source compounds with N (parallelism) or with t (time), it deserves a line item. The top three above all do.

---

## 11. Dangerous scaling illusions

The single biggest psychological trap in this kind of orchestration is the illusion that "since one Claude shipped a feature in 90 min, four Claudes will ship four features in 90 min." This document, plus the economic model, says clearly: **no.**

The illusions, named:

### 11.1 Linear-scaling illusion
"Output ∝ N." False above N=3; net useful output is sublinear and eventually decreasing. (Per `EXECUTION_ECONOMICS_MODEL.md` §1–§3.)

### 11.2 Ambient-supervision illusion
"Captain doesn't have to actively manage; sessions are autonomous." False above N=2. Above N=2, semantic merge conflicts require active supervision. iPhone-only Captain is *not* active supervision in this sense.

### 11.3 Token-cost illusion
"Tokens are cheap, just spawn more sessions." False at the margin: the costly tokens aren't the cheap inference tokens, they're the **Captain-time tokens** spent reconciling and reviewing. Captain time is the bottleneck resource and does not scale with budget.

### 11.4 Determinism illusion
"If session A built feature X cleanly, session B can build feature Y cleanly in parallel." False whenever X and Y share files or globals — and they almost always do, because `index.html` is monolithic.

### 11.5 Auto-deploy-equals-shipped illusion
Per §8.3. The bundle compiled. That is not the same as shipped. AccentOS has no automated runtime smoke test.

### 11.6 More-skills-equals-better illusion
Each skill is a token cost (registry read) plus a maintenance cost (vetting, observation log). Adding a skill that doesn't fire often is net-negative. Pruning unused skills is as important as adding new ones — there is no automatic decay.

---

## 12. Estimated current effective orchestration efficiency

Restated from `EXECUTION_ECONOMICS_MODEL.md` §12: **~0.55–0.65** of token spend converts to surviving shipped changes. Or: **~35–45% of every token-dollar pays for coordination, not features.**

Decomposition of the loss:

| Source | Approx share of total spend |
|---|---|
| Boot-cost amplification (§3.1) | 12–15% |
| Cross-session re-investigation (§3.4) | 6–10% |
| Tool-output bloat (§3.3) | 4–6% |
| Speculative scaffolding (§3.5) | 3–5% |
| Brute-forcing past a skill (§4.3) | 2–4% |
| Rollback + reconciliation (§4.5) | 5–8% (spiky) |
| Narration / padding (§3.7) | 1–3% |
| **Total inefficiency** | **~33–51%** |

The single largest, single most-tractable item is **§3.1 boot-cost amplification**, because it is paid by every parallel session and is structurally avoidable (warm pool, shared session memory, or simply running fewer sessions).

---

## 13. Estimated safe overnight concurrency ceiling

Restated from `PARALLELISM_SAFETY_THRESHOLDS.md` §6: **N = 2** by default, **N = 3** only with strict guardrails (module isolation, no `index.html` edits, no migrations, per-session WIP, BUILD_PLAN pre-claimed). **Hard cap N = 3 overnight.**

This number is bounded above by the architecture, not by Claude. It will rise after `index.html` is split and shared globals are namespaced — possibly to N = 4 or 5 overnight at that point. Until then, treat 3 as the ceiling.

---

## 14. Single most expensive hidden entropy source

Restated from `EXECUTION_ECONOMICS_MODEL.md` §14: **the monolithic `index.html` plus the global `USERS / VENDORS / INVENTORY / etc.` namespace.**

Why it's the top item by *hidden* cost:

- It looks free at write-time. The cost is paid at merge-time and runtime, by *other* branches and *future* sessions.
- It compounds with both N (parallelism) and t (file growth) simultaneously.
- It is already at 76% of a hard 900KB limit. The forced split, when it comes, will be expensive precisely because it will happen under pressure rather than by design.
- It is the source through which most other entropy categories amplify — WIP contention, BUILD_PLAN race, rollback cost, branch entropy all worsen because of it.

Every other entropy source in this analysis is bounded. This one is not.

---

## 15. DONE / KNOWN / NEXT

**DONE**
- Catalogued where token spend compounds (positive ROI) vs. where it leaks.
- Named five orchestration waste categories with frequency + impact bands.
- Listed eight high-ROI and eight low-ROI execution patterns.
- Identified three regimes where "more sessions" reduces output quality.
- Named seven false productivity signals, six fake acceleration patterns, seven orchestration-debt sources, and six scaling illusions.
- **Estimated effective orchestration efficiency: 0.55–0.65.**
- **Estimated safe overnight concurrency ceiling: N=2 (3 with full guardrails).**
- **Single most expensive hidden entropy source: monolithic `index.html` + shared global namespace.**

**KNOWN**
- All numbers are calibrated estimates against observed AccentOS sessions, not measurements.
- The biggest underestimated cost is consistently the *Captain-time* leg, not the inference-token leg. Inference tokens are cheap; serial Captain attention is not.
- Several patterns flagged as low-ROI here are still in active use because their per-session cost looks small. The cost surfaces only at merge / next-day / rollback. Operational countermeasures would target *visibility* of those costs, not their direct elimination.

**NEXT**
- Companion deliverable could be a `EFFICIENCY_KPIS.md` mapping the categories above to measurable counters in `efficiency-log.md`. Not in scope for this pass.
- Once `index.html` is split, every section above should be re-estimated; the curves bend favorably and several patterns flip from low-ROI to neutral.
- The single highest-leverage operator change implied by this analysis: **default to N=2 unless a deliberate reason exists to escalate, and *never* enter Zone RED unsupervised.**
