# BRANCH HYGIENE PROTOCOL

> **Purpose.** Operational rules for `claude/*` branch lifecycle. Converts the branch-aging and reservoir findings (`ENTROPY_ACCUMULATION_MODEL.md` §5.1, §6; `ORCHESTRATION_COST_CENTERS.md` §3, §6; `PARALLELISM_SAFETY_THRESHOLDS.md` §4) into IF/THEN rules.
> **Frame.** Operational protocol. Apply directly. No theory.
> **Last updated:** 2026-05-10. v1.

---

## 1. Branch lifecycle states

Every `claude/*` branch sits in exactly one state. Movement between states is rule-driven, not preference-driven.

| State | Definition |
|---|---|
| **ACTIVE** | Has commits in last 24h; intended to receive more |
| **OPEN** | No commits in 24–72h; intended to be resumed |
| **AGED** | 72–168h old, unmerged, unmerged work present |
| **STALE** | >168h old, unmerged, unmerged work present |
| **MERGE-READY** | All work complete, no further commits expected |
| **DEAD** | Closed; reference only |

State transitions are timed (24h, 72h, 168h boundaries) or event-driven (work complete → MERGE-READY; closure → DEAD).

---

## 2. When a branch must merge

**RULE M1.** If branch is MERGE-READY and the speed governor (`EXECUTION_GATES.md` §1) is GO or CAUTION → merge within 24h.

**RULE M2.** If branch is AGED and the diff is mergeable without conflict → merge immediately, regardless of feature-completeness state. (Aged branches are reservoirs; finishing them later costs more than merging the partial work now.)

**RULE M3.** If branch is OPEN and another live branch begins editing the same file → merge immediately (or close — see §3) to avoid frozen-file tax.

**RULE M4.** If branch contains a BUILD_INTELLIGENCE entry, that entry must merge to `main` even if the rest of the branch dies. (BUILD_INTELLIGENCE is the highest-ROI write in the system — never let it die with the branch.)

**RULE M5.** If branch contains a paired-down migration for a previously-applied migration, merge immediately. The down-migration is more valuable than the rest of the branch combined.

---

## 3. When a branch must die

A branch that "must die" is closed without merge. Its commits are preserved in the closed branch reference but do not enter `main`.

**RULE D1.** If branch is STALE (>168h) and merging would now require manual reconciliation → close. Reconciling 168h+ of drift costs more than re-doing the work cleanly later.

**RULE D2.** If branch attempts a sequencing-forbidden action (per `SCALING_SEQUENCE_ANALYSIS.md` §2 — governance hardening pre-decomposition; Codex as concurrent writer pre-isolation; etc.) → close immediately, even if the work was technically clean.

**RULE D3.** If branch was an exploration that produced *negative findings* (the approach didn't work) and no commits document the lesson → close. (If the lesson is worth keeping, lift it into a BUILD_INTELLIGENCE entry on `main`, then close the branch.)

**RULE D4.** If a branch's matrix-scored value (`TRACK_PRIORITIZATION_MATRIX.md`) drops below the cost-to-merge estimate → close.

**RULE D5.** If a branch attempted Codex/external-model concurrent writes to `index.html` before Phase 1 → close. (Per `SCALING_SEQUENCE_ANALYSIS.md` §2.2 — irreversible-by-narrative; closure prevents the narrative from forming.)

**RULE D6.** If the operator declares a Captain-veto on the branch's underlying intent → close.

---

## 4. Hard age thresholds

These are absolute. No exceptions. The age clock starts at first commit on the branch.

| Age | Required action |
|---|---|
| 0–24h | Continue normal use (ACTIVE) |
| 24–72h | If no commits in last 24h → mark OPEN; decide intent |
| **72h** | Merge or close decision **required** within 24h. Default action if no decision: merge if mergeable; close if not. |
| 96h | If still open after the 72h decision was missed → CRAWL governor; force decision |
| 168h | Mandatory close per RULE D1 unless explicit Captain override (rare) |

The 72h threshold is the most important. It is the inflection point at which BE roughly doubles relative to trunk (`PARALLELISM_SAFETY_THRESHOLDS.md` §4). A branch crossing 72h without a decision is itself a CAUTION-trigger.

---

## 5. Per-branch routine inspection

At every session start, the session reads the live branch list and applies these checks.

### Inspection checklist

```
For each `claude/*` branch:
  age = now - first_commit_time
  state = ACTIVE if commits in last 24h
        OPEN    if 24h ≤ no-commit-window < 72h
        AGED    if 72h ≤ age < 168h
        STALE   if age ≥ 168h

  IF state == AGED and no merge/close decision logged in WIP:
      → flag for decision in this session
  IF state == STALE:
      → must close per RULE D1 (or merge per M2 if mergeable)
  IF state == ACTIVE and another branch edits same file:
      → coordinate or merge (RULE M3)
  IF branch contains BUILD_INTELLIGENCE entry:
      → confirm it lands on `main` regardless (RULE M4)
  IF branch contains paired-down migration:
      → confirm it lands (RULE M5)
```

This inspection is bounded — at most 2 minutes per session-start.

---

## 6. Procedures for each transition

### 6.1 Procedure: ACTIVE → OPEN (24h no-commit)

- Append a one-line WIP entry: "branch X is OPEN as of [date]; intent: [resume / merge / close]."
- No code change required.

### 6.2 Procedure: OPEN → AGED (72h crossed)

- Captain decision required. If Captain unavailable, default to:
  - Merge if branch passes the merge gate (`EXECUTION_GATES.md` §2.2).
  - Close otherwise.
- Log the decision and reason in WIP.

### 6.3 Procedure: AGED → STALE (168h crossed)

- Mandatory close (RULE D1) unless Captain has explicitly overridden.
- Captain override must be re-affirmed every 7 days the branch remains open past 168h.

### 6.4 Procedure: any state → MERGE-READY

- Pre-merge checks: speed governor at GO or CAUTION; no shared-file conflicts; verification path documented.
- Merge via `git merge` from `main` perspective; resolve conflicts if any (only allowed at GO).
- Post-merge: branch closed automatically; SESSION_LOG entry added at session-end.

### 6.5 Procedure: any state → DEAD

- Confirm closure conditions (one of the D rules holds).
- Lift any BUILD_INTELLIGENCE entries or paired-down migrations onto `main` first (RULES M4, M5).
- Close the branch with `git push origin --delete claude/<branch>`.
- Log the closure in WIP and SESSION_LOG with the rule cited.

(Procedures describe what should happen. They are not commands run by this session — the user's rule is no execution. The procedures exist to be applied at the next operator window.)

---

## 7. Branch lifecycle illegal moves

These are forbidden in all states:

- **Resurrecting a DEAD branch.** If the work is still wanted, start a fresh branch from current `main`. The dead branch's diff is reference, not foundation.
- **Force-pushing to a `claude/*` branch to "clean up history."** Per the global rules: never force-push without explicit Captain authorization. The branch's history is read by other sessions and may be referenced from WIP.
- **Re-basing a branch >24h old without re-running the inspection.** Rebases compound drift; the older the branch, the worse.
- **Opening a new branch while at CRAWL or HALT.** Per `EXECUTION_GATES.md` §1.3, §1.4.
- **Letting a `claude/*` branch survive past 168h without explicit Captain re-affirmation.** This is the drift-into-permanent-reservoir failure mode.

---

## 8. Special cases

### 8.1 The analysis branch (current)

`claude/execution-economics-analysis-vf0FX` is itself a live branch. Its current state per inspection:

- **Age:** approaching 72h (started 2026-05-10 within the same operator window per the session record).
- **Commits:** 13 (12 prior + this gate-pass).
- **Files touched:** all in `docs/runtime/` (previously empty); zero shared-file mutation.
- **State estimate:** ACTIVE → soon OPEN → soon AGED.
- **Mergeability:** trivially mergeable. Zero conflict expected. RULE M1 will fire as soon as it is MERGE-READY.

The branch is *almost* its own test case for this protocol. Its eventual merge (or close) will be the first protocol exercise.

### 8.2 Branches paused for Captain decision

If a branch is paused waiting on an ORANGE-class decision (per `TRACK_READINESS_SCORE.md` §4), the age clock continues. A Captain decision must land within the standard ORANGE window (7 days per `TRACK_READINESS_SCORE.md` §4 stop-condition) or the branch is closed regardless.

### 8.3 Branches blocked on Captain credentials (RED)

A branch should not exist for a track that is RED on Captain credentials. The track's preparation work (per `TRACK_BUILD_QUEUE_V1.md` §2) is captured in BUILD_PLAN entries, not in a long-lived branch. If a RED-track branch already exists, close it.

### 8.4 Hotfix branches

If a branch is opened explicitly as a hotfix (production-breaking issue requires immediate ship), it bypasses the 72h decision rule — but only because it is expected to merge within hours. A hotfix branch that ages past 24h is no longer a hotfix and falls under standard rules.

---

## 9. Operator-side responsibilities

These cannot be done by Claude alone:

- **Decide branch fate at 72h.** If Claude flags a branch for decision and Captain doesn't engage, the default action fires.
- **Authorize closures of branches with material work.** If Claude proposes closing a branch with non-trivial commits, Captain confirms.
- **Re-affirm any branch surviving past 168h.** Stale-but-not-yet-closed branches require Captain to say "yes, keep it" each week.
- **Veto a branch.** Captain can declare a branch dead at any time per RULE D6.

Claude-side:

- **Run inspection at session-start.** Bounded, ≤2 min.
- **Surface flagged branches in the session-start status block.**
- **Merge MERGE-READY branches per the §6.4 procedure when permitted by the speed governor.**
- **Close DEAD branches per §6.5.**
- **Refuse to start work on AGED branches without Captain re-affirmation.**

---

## 10. DONE / KNOWN / NEXT

**DONE**
- Defined six branch lifecycle states with timed and event-driven transitions.
- Specified five must-merge rules (M1–M5) and six must-die rules (D1–D6).
- Hardcoded the age-threshold ladder (24h, 72h, 96h, 168h).
- Defined the per-session inspection routine, the procedures for each transition, and the list of illegal moves.
- Snapshotted the current analysis branch as a near-term test case for the protocol.

**KNOWN**
- This protocol assumes the inspection step actually runs. If it is skipped, the protocol provides no protection.
- Stale-branch detection requires the live `claude/*` list to be readable. Branches that are local-only or that exist on a different remote are invisible to the protocol.
- The 72h and 168h thresholds are derived from the BE-doubling-per-72h heuristic; they are calibrated, not measured.

**NEXT**
- `ANALYSIS_TO_ACTION_THRESHOLDS.md` covers the analogous lifecycle for analysis docs.
- The protocol becomes operational at the next session-start. No retroactive enforcement.
