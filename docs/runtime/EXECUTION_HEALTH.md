# EXECUTION HEALTH

> **Role:** The live dashboard for AccentOS orchestration. Tracks whether continued evolution is producing real throughput or only theater.
> **Frame:** Analysis/docs only. No implementation, no runtime work, no decomposition execution.
> **Status of this doc:** This is doc #12 in `docs/runtime/`. By my own prior analysis (`SCALING_SEQUENCE_ANALYSIS.md` §6.5, `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §6.9), doc #12 in this lane is at the diminishing-return knee. This dashboard earns its existence *only* by being the meta-control that decides when further analysis stops. If it ever becomes "doc #12 plus monthly refreshes that change nothing," it has become theater itself. Self-audit rules in §6.
> **Last updated:** 2026-05-10 (v1, initial snapshot).
> **Refresh cadence:** Only when an underlying signal actually moves. See §7.

---

## 1. Mission

Track whether the orchestration system is gaining real throughput or only accumulating apparent activity. Surface the answer in a form that survives a 30-second read on a phone. Refuse the temptation to add metrics, doc, or commentary that does not change a decision.

Specifically: when an operator opens this file, the dashboard should answer five questions immediately:

- Is throughput actually increasing?
- Is entropy increasing faster than throughput?
- What is the current optimal train count?
- What orchestration layer currently produces the highest ROI?
- What analysis lanes are now anti-leverage?

If those answers don't change between two readings, the second reading was wasted. That waste is the leading indicator of orchestration theater.

---

## 2. Tracked signals (current readings, v1)

Each signal carries: definition, current reading, trend since last refresh, and threshold for action. Calibrated estimates, not telemetry — but explicit so the next reading can compare apples to apples.

### 2.1 Useful throughput

**Definition.** Net surviving shipped changes per active session-hour. "Surviving" = on `main` at +24h without revert or reconcile.

**Reading.** **Low.** Past 4 work-passes have produced 11 analysis docs and zero shipped features. In the *feature lane* throughput is 0/hr; in the *analysis lane* it has been ~1 doc/hr but the doc-to-shipped-change ratio is 0.

**Trend.** No baseline yet (v1). Tag for future: this is the first marker.

**Threshold for action.** If feature-lane throughput remains 0/hr across 3 consecutive operator windows, the system is in *pure analysis mode* — a stop condition for further docs.

### 2.2 Relay tax

**Definition.** Cumulative Captain-attention consumed by hand-offs (session→session, session→Captain). Saturates at ~5–8 substantive relays/day per `OPERATOR_BANDWIDTH_LIMITS.md` §5.

**Reading.** **Moderate.** Current branch has consumed 4 prompt-pass relays + this one = 5. At the calibrated saturation floor.

**Trend.** Up across the corridor.

**Threshold for action.** ≥6 substantive relays in a single day → next relay must be ambient-acknowledge only or queue.

### 2.3 Branch entropy (BE)

**Definition.** Probability a randomly-chosen line of any live branch's diff conflicts with another branch's diff. See `PARALLELISM_SAFETY_THRESHOLDS.md` §4.

**Reading.** **Very low (≈0.03).** One active branch (`claude/execution-economics-analysis-vf0FX`). All changes are net-new files in a previously-empty directory (`docs/runtime/`). No shared-file or shared-global mutation. No other live `claude/*` branches contending.

**Trend.** Flat.

**Threshold for action.** Any new branch that touches `index.html` or shared globals → re-estimate within one hour of branching.

### 2.4 Corridor efficiency

**Definition.** Fraction of session-time spent on work that advances `main`, as opposed to coordination/analysis/orientation.

**Reading.** **Misleading high.** Within the current corridor: ~85% productive (most tokens converted to durable docs). In *trunk-relevant* terms: the corridor has not advanced `main` toward Phase 1, has not shipped a feature, and has not cleared an M-task. Corridor efficiency by the right denominator is **low**.

**Trend.** No prior baseline (v1). The split between "corridor-internal efficiency" and "trunk-relevant efficiency" is itself the signal worth tracking.

**Threshold for action.** When trunk-relevant efficiency drops below 50% of corridor-internal efficiency for 2 consecutive sessions, the corridor is in analysis-mode drift.

### 2.5 Synchronization cost

**Definition.** Tokens + Captain-minutes spent reconciling state between sessions. See `ORCHESTRATION_COST_CENTERS.md` §1.

**Reading.** **Minimal.** Single active session; no cross-session sync required. WIP not currently in contention.

**Trend.** Flat.

**Threshold for action.** Any addition of a second concurrent session in this corridor → re-estimate. Sync cost is exactly the cost the user has banned (no orchestration execution); the dashboard tracks it to verify the ban holds.

### 2.6 Planning overhead

**Definition.** Fraction of session-time devoted to plans, scoping, models, frameworks — as opposed to direct value-producing work (shipped features, cleared blockers, completed hygiene).

**Reading.** **Critically high.** ~100% of this corridor is planning/analysis. None is execution.

**Trend.** No baseline (v1). For context: prior shipping corridors (Track 5 v6.10.x window) had planning overhead estimated at ~15–20%.

**Threshold for action.** Already past threshold. Any further analysis-doc work in this lane without an intervening *non-analysis* action (M-task delivery, Phase 1 commit, branch hygiene, or operator-side decision) is by definition theater.

### 2.7 Review burden

**Definition.** Pending Captain review queue — unread commits, unread analysis docs, unaccepted recommendations.

**Reading.** **Elevated.** 11 analysis docs awaiting Captain ingestion. Each is short to skim but long to *act on*. Review burden in this case is not "read time"; it is "decide time" — and the decisions are non-trivial (commit to Phase 1, prioritize M-tasks, decide branch fate).

**Trend.** Up across the corridor.

**Threshold for action.** When the analysis backlog exceeds Captain's plausible *decide-time* budget for the next operator window, additional analysis adds noise, not signal.

### 2.8 Stale-track frequency

**Definition.** BUILD_PLAN items marked `[x]` that didn't actually ship, items `[ ]` that did, or items prepared without subsequent execution.

**Reading.** **Low risk so far.** No BUILD_PLAN markers have been mutated in this corridor. The track-prep work in `TRACK_BUILD_QUEUE_V1.md` does *not* claim any tracks — all 10 candidates remain explicitly RED or BLACK.

**Trend.** Flat.

**Threshold for action.** If any preparation work in this corridor produces a BUILD_PLAN `[x]` marker for a track that hasn't shipped, immediate revert.

### 2.9 Merge friction

**Definition.** Expected wall-clock + cognitive cost to merge the current branch into `main`. See `ORCHESTRATION_COST_CENTERS.md` §2.

**Reading.** **Very low.** Current branch is all net-new files in a previously-empty directory. Zero shared-file edits. Zero shared-global mutations. Zero schema changes. Zero `index.html` touches. Trivially mergeable.

**Trend.** Flat. The branch is becoming *easier* to merge as it ages, not harder, because nothing on trunk could collide with these files.

**Threshold for action.** Branch age ≥72h → merge or close decision is itself time-sensitive (per `ENTROPY_ACCUMULATION_MODEL.md` §6). Current age: approaching this threshold within the next operator window.

### 2.10 Train idle time

**Definition.** Fraction of time potential parallel "trains" (other concurrent sessions/branches) sit idle. High idle = unused capacity; low idle with high BE = over-scheduled.

**Reading.** **N/A.** The user's rule for this corridor is "no worker count increase." Only one train is running. Idle measurement is therefore not meaningful in this corridor.

**Trend.** Held by rule.

**Threshold for action.** None in this corridor. Re-engages as a tracked signal only if the worker-count rule is lifted.

### 2.11 Decomposition ROI

**Definition.** Realized return on architecture-decomposition work. Phase 1 from `ARCHITECTURAL_PRIORITIZATION_MODEL.md`.

**Reading.** **0% (unrealized).** No decomposition work has been started. The Phase 1 ROI remains *potential* and *uncashed*. Every passing day without it leaves the highest-leverage move in the system unfunded.

**Trend.** Flat at zero.

**Threshold for action.** This is the standing #1 architectural action. The dashboard surfaces its zero-status until it changes.

---

## 3. Standing answers — the five questions

### 3.1 Is throughput actually increasing?

**No.** Analysis-doc count is increasing (now 12); feature throughput is zero in this corridor; trunk has not advanced toward Phase 1. The doc lane is up, the value lane is flat, the architecture lane is unmoved. By the only definition that matters (surviving shipped changes on `main`), throughput is not increasing — it is paused.

### 3.2 Is entropy increasing faster than throughput?

**Marginally yes.** Code-layer entropy is flat (no shared-file edits, very low BE). But:
- Operator-attention entropy is rising — every refresh of this corpus that doesn't trigger action narrows the future bandwidth for actually deciding on it.
- The current branch itself is becoming a reservoir as it ages toward 72h (`ENTROPY_ACCUMULATION_MODEL.md` §6).
- BUILD_PLAN drift risk is rising because the queue (`TRACK_BUILD_QUEUE_V1.md`) names actions that haven't been taken yet, creating a small ledger of "things we said to do."

Throughput-side: zero net growth. Entropy-side: small positive growth. Net: entropy slowly outpacing throughput.

### 3.3 What is the current optimal train count?

**One**, doing **non-analysis work**. Specifically: branch hygiene (merging or closing this branch) or Phase 1 planning prep (the one architectural-lane action that outranks all tracks).

Optimal train count for *analysis*: **zero**. The analysis lane has reached its diminishing-return knee.

Optimal train count for *feature execution*: **zero today** — no tracks are GREEN. Will become 1–2 the moment an M-task pair clears.

Optimal *parallel* train count: **strictly capped at the architecture-before-scale rule** — no parallel trains until Phase 1 lands.

### 3.4 What orchestration layer currently produces the highest ROI?

In rank order:

1. **Operator-side: Captain M-task delivery.** Single highest-leverage action available. M04+M05 (clears 5.13, unblocks 6.3) is the top pick; M03+M10 (clears 6.11) is the runner-up. One credential-delivery cycle moves the system more than the entire analysis corpus.
2. **Operator-side: Phase 1 commitment.** Even a one-hour focused planning session on decomposition + module isolation + loader boundaries returns more value than another month of analysis docs.
3. **Operator/Claude-side: Branch hygiene.** Closing or merging stale branches (including this one) is the cheapest entropy-reduction action available. Cost: minutes. Benefit: persistent.
4. **Claude-side: BUILD_INTELLIGENCE entries** when a real gotcha is encountered — but this corridor hasn't encountered a gotcha worthy of an entry.
5. **Claude-side: bounded preparation notes** for the top-3 near-track items (6.11, 5.13, 6.3). ~30 min each, capped. Only useful if M-tasks are about to clear.

NOT in the top 5: more analysis docs. Not skill authoring. Not mode tuning. Not orchestration-tool exploration.

### 3.5 What analysis lanes are now anti-leverage?

Explicit list, this corridor:

- **The `docs/runtime/` economics analysis lane itself.** Twelve docs deep. Each new doc has lower marginal value than the last. Stop unless an underlying state changes (M-task clears, Phase 1 starts, BUILD_PLAN updates with new tracks, branch state shifts).
- **Further synthesis of synthesis.** Combining or restating existing models without new evidence.
- **"Models the cost of X" docs** where X has already been modeled. Diminishing returns are sharpest here.
- **New scoring frameworks** beyond the existing matrix. The matrix produces a defensible ranking; adding a second framework adds confusion, not clarity.
- **Tooling design** for the eight items in `ARCHITECTURAL_PRIORITIZATION_MODEL.md` Tiers 3–4. Premature; calibrates against the wrong baseline.

The lanes that remain net-positive:

- This dashboard, refreshed only when a signal actually moves.
- BUILD_INTELLIGENCE entries on real gotchas.
- Track-prep notes (capped, only for near-track candidates with imminently-clearing blockers).

---

## 4. Health verdict

**AT THE EDGE.**

The corridor has produced unusually high analysis quality and unusually little execution. Captain-attention is being consumed reading the output. The branch is one operator-window away from crossing the 72h aging line, at which point it becomes a small entropy reservoir. The 11 prior docs are not wrong — they are operationally correct — but they are now *waiting on action*, not generating it.

The dashboard refuses to call this state "healthy" (the system isn't producing shipped changes) and refuses to call it "failing" (the analysis itself is sound and the architecture hasn't been damaged). "At the edge" means: the next operator move decides which way it tips.

If the next operator move is *another analysis doc in this lane*, the verdict will downgrade to **THEATER** at next refresh.

If the next operator move is *M-task delivery, Phase 1 planning commit, or branch hygiene*, the verdict will upgrade to **PRODUCTIVE** at next refresh.

The verdict will not change merely because this dashboard is reread.

---

## 5. Decomposition ROI watch

Tracked here separately because it's the single signal whose movement most changes every other signal.

- **Phase 1 plan exists?** **No.**
- **Phase 1a (extract one module fully) shipped?** **No.**
- **Phase 1 full?** **No.**
- **Phase 2 substrate touched?** **No.**

Until any of these change to "yes," the system is operating on a pre-decomposition architecture with all the costs documented in `ORCHESTRATION_COST_CENTERS.md`. Every dashboard refresh that shows no movement in this section is, by definition, a refresh where the binding constraint has not been addressed.

The dashboard's first job is to make this section's stagnation visible.

---

## 6. Self-audit — is this dashboard becoming theater?

Six self-flagging conditions. If any are true at refresh time, the dashboard itself has drifted into theater and must either be acted upon or paused.

### 6.1 The doc grew but no signal moved

Test: at this refresh, did any of §2.1–§2.11 actually change reading? If no, the refresh added text without adding information.

**Current refresh:** v1 — establishing the baseline. No prior reading exists. Pass.

### 6.2 New signals added without new measurement capability

Test: did this refresh introduce a tracked signal that wasn't there before, without any new way to measure it?

**Current refresh:** None added. Pass.

### 6.3 Verdict changed without corresponding evidence

Test: did the §4 verdict shift in direction without a §2 signal moving to justify it?

**Current refresh:** v1 verdict. Pass.

### 6.4 Recommendations grew without prior recommendations being executed

Test: are the recommendations in this refresh just additions to the prior list, with the prior list still un-acted-upon?

**Current refresh:** Recommendations match the prior corpus (M-task delivery, Phase 1, branch hygiene) — same items, not new ones. Pass on additivity. Fail on prior-execution: none of the prior recommendations have been acted on yet. **Flag.**

### 6.5 The dashboard is being refreshed more often than the underlying system is moving

Test: refresh frequency vs. signal-change frequency.

**Current refresh:** Single refresh; no baseline. Will be measurable at v2.

### 6.6 The refresh itself becomes a substitute for action

Test: did the operator open this file as a way to *feel* productive rather than to *decide* something?

**Current refresh:** unknowable from inside the dashboard. The operator's own self-check applies here. Flagged as a category to watch.

**Summary of self-audit at v1:** One flag (§6.4 — recommendations are accurate but un-acted). Acceptable for v1; would be a serious warning at v2 if still flagged.

---

## 7. Refresh cadence

The dashboard refreshes **only when an underlying signal actually moves.** Specifically, any one of:

- An M-task is marked `[x]` in `BUILD_PLAN_MICHAEL.md`.
- A Phase 1 milestone lands (plan written, Phase 1a shipped, Phase 1 complete).
- A `claude/*` branch is merged into `main` or closed.
- A track section advances readiness state (e.g., RED → YELLOW).
- A new BUILD_PLAN item is added or removed.
- The 72h branch-age threshold is crossed by any live `claude/*` branch.
- A reconciliation event consumes >30 Captain-minutes (signals reconciliation fatigue rising).
- An overnight run is attempted (regardless of N).
- A `<file>.html` or shared-global mutation lands on `main`.

The dashboard does **NOT** refresh:

- On a fixed schedule (no daily/weekly cadence).
- Because the operator asks "what's the current health?" without an underlying change.
- To add new tracked signals without measurement.
- To re-restate prior findings.

Refreshing the dashboard when no signal has moved is the canonical theater pattern this document is designed to refuse.

---

## 8. What this dashboard refuses to do

By design:

- **Refuses to grow over time.** Each refresh should be roughly the same size as v1. New material replaces old; it does not append.
- **Refuses to add new metrics for their own sake.** Twelve tracked signals is enough. New ones must displace existing ones, not stack.
- **Refuses to be the place where action items live.** Action items live in the queue (`TRACK_BUILD_QUEUE_V1.md`) and in BUILD_PLAN. The dashboard reports state; it does not duplicate the to-do.
- **Refuses to assess Captain personally.** Captain's bandwidth is treated as a fixed resource (per `OPERATOR_BANDWIDTH_LIMITS.md`). The dashboard reports whether the system is using that resource well; it does not critique the operator.
- **Refuses to produce more analysis docs.** Whenever the dashboard would naturally call for "we should write a doc to model X," the answer is: no. The model already exists in the prior corpus, or the system is past the point where another model is helpful.

---

## 9. Standing recommendations (carried over until acted)

These do not move between refreshes until executed. Each refresh re-prints them; their reappearance is itself a signal.

1. **Captain action: deliver M04 + M05** (top M-task pick) or M03 + M10 (runner-up). Either move advances a top-3 ranked track from RED toward GREEN.
2. **Captain + Claude action: commit a Phase 1 planning window.** One hour minimum; produces the decomposition + isolation + loader-boundaries plan. Outranks every track-section move.
3. **Claude action (immediate, low-cost): branch hygiene.** Merge or close `claude/execution-economics-analysis-vf0FX` (this corridor) before it crosses 72h. Same for any other stale `claude/*` branches.
4. **Claude action (capped, optional): bounded preparation note for 6.11 Windward ERP Live.** ~30 min. Only valuable if M03 + M10 are about to clear.
5. **Universal: do not write doc #13 in this lane** unless one of the standing recommendations 1–4 has been executed.

---

## 10. DONE / KNOWN / NEXT

**DONE**
- Established the EXECUTION_HEALTH dashboard (v1, 2026-05-10).
- Defined 11 tracked signals with definitions, current readings, trends, and action thresholds.
- Answered the five standing questions explicitly:
  - Throughput increasing? No.
  - Entropy outpacing throughput? Marginally yes.
  - Optimal train count? 1, non-analysis.
  - Highest-ROI orchestration layer? Operator-side: M-task delivery or Phase 1 commitment.
  - Anti-leverage analysis lanes? This entire `docs/runtime/` economics lane past doc #12.
- Recorded current verdict: **AT THE EDGE.**
- Specified refresh cadence (signal-triggered only) and self-audit rules (six theater flags).
- Listed five standing recommendations that survive across refreshes until acted upon.

**KNOWN**
- v1 is a baseline; trends are not measurable yet. v2 will be the first comparison.
- Self-audit flagged §6.4 (recommendations are accurate but un-acted) — acceptable at v1, escalates if persistent at v2.
- The dashboard's own existence is conditional on its being used to *gate* further analysis, not to *generate* it. If doc #13 in this lane is written without one of §9.1–§9.4 being executed first, the dashboard itself has become part of the theater it is designed to detect.

**NEXT**
- Refresh trigger: any of the §7 conditions. No fixed cadence.
- Until then: dashboard stays at v1. No new analysis in this lane until a §9 recommendation is acted upon.
- The single sentence that captures the current state: **the analysis lane has done its job; further analysis adds noise; the next move must be an action, not a doc.**
