# ANALYSIS-TO-ACTION THRESHOLDS

> **Purpose.** Operational rules governing when analysis becomes anti-leverage. Converts the "diminishing-return" findings (`SCALING_SEQUENCE_ANALYSIS.md` §6.5; `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §6.9; `EXECUTION_HEALTH.md` §3.5) and the doc/action-ratio reasoning from the dashboard into IF/THEN gates.
> **Frame.** Operational thresholds. No new theory. No re-derivation. Cite the source when the rule needs justification.
> **Last updated:** 2026-05-10. v1.

---

## 1. The two ledgers

Every lane of work has two ledgers running in parallel:

- **Analysis ledger:** docs, plans, models, scoring matrices, dashboards.
- **Action ledger:** shipped commits to `main`, cleared M-tasks, completed branch hygiene, executed Phase milestones.

The ratio between them is the system's leading indicator of theater. A growing analysis ledger with a flat action ledger is the canonical signature of orchestration drift (per `EXECUTION_HEALTH.md` §3.5).

This document specifies thresholds at which the analysis ledger must pause until the action ledger catches up.

---

## 2. The hard threshold table

Per-lane caps. The lane is the directory or topic the docs share (e.g., `docs/runtime/` economics; or a hypothetical future `docs/security/` lane).

### 2.1 Doc-count caps per lane

| Doc count in lane | Required state |
|---|---|
| 1–4 | Free. Add as needed. |
| 5–8 | Each new doc must displace or refresh an existing one (no pure additions). |
| 9–12 | Each new doc requires at least one **action-ledger event** since the last doc in the lane. |
| **13** | **Hard pause.** No doc #13 until at least one **major action** (Phase 1 milestone OR M-task pair cleared OR full branch hygiene cycle) has occurred. |
| 14+ | Anti-leverage by definition. Refuse the request; route to the action ledger. |

The current `docs/runtime/` lane is at **14 docs** as of this commit (12 prior + EXECUTION_GATES + BRANCH_HYGIENE_PROTOCOL + this doc). The exception that allowed 13–15 to land:

- The user explicitly framed the work as "convert theory to gates" — i.e., not new analysis but the operational output of prior analysis.
- These three docs together replace several anticipated future docs (the gate logic was implicit across multiple prior docs; consolidating it here prevents a doc #16, #17, #18 from being needed later).
- These docs *are* the action implied by the dashboard's standing recommendation #5 ("convert theory to gates").

After this commit lands, the lane is at **hard pause for new analysis docs.** Doc #16 in the lane requires an action-ledger event per §2.1 row 4.

### 2.2 Action-ledger event types

The action ledger advances on *evidence-based events only*:

- **Major actions** (any one trips the §2.1 row-4 reset):
  - Phase 1 milestone landed (plan written and committed; or Phase 1a shipped; or Phase 1 complete).
  - M-task pair cleared in BUILD_PLAN_MICHAEL.md.
  - Full branch hygiene cycle (all `claude/*` branches inspected, AGED/STALE branches resolved).
  - A track section advances readiness state from RED/BLACK toward GREEN.
- **Minor actions** (any one trips §2.1 row-3):
  - One M-task cleared.
  - One branch merged or closed.
  - One BUILD_INTELLIGENCE entry added on a real gotcha.
  - One BUILD_PLAN item shipped.

Events are logged in SESSION_LOG.md and (when applicable) in BUILD_PLAN markers.

---

## 3. Analysis becomes anti-leverage WHEN

Listed as fireable conditions. Any one trips the gate.

### 3.1 The diminishing-return knee

**WHEN** doc count in lane ≥9 AND the last 3 docs in the lane have not produced a *new operationally-actionable rule* (i.e., did not generate a gate, threshold, or protocol)
**THEN** further analysis in this lane is anti-leverage. Refuse new docs in the lane until an action-ledger event lands.

Source: `SCALING_SEQUENCE_ANALYSIS.md` §6.5.

### 3.2 The synthesis-of-synthesis pattern

**WHEN** a proposed doc would primarily restate, re-organize, or "synthesize" existing docs in the lane without introducing a new operational artifact
**THEN** refuse. Synthesis-of-synthesis is the canonical low-value addition.

### 3.3 The unmoved-recommendations signal

**WHEN** the prior 2 docs in the lane each produced standing recommendations AND none of those recommendations have been acted upon
**THEN** the lane is producing unread output. Refuse new docs until the recommendations are addressed.

Source: `EXECUTION_HEALTH.md` §6.4.

### 3.4 The dashboard-without-signal-movement pattern

**WHEN** a dashboard or status doc in the lane is being refreshed AND no underlying signal has actually moved since the last refresh
**THEN** refuse the refresh. The refresh would itself be theater.

Source: `EXECUTION_HEALTH.md` §6.1.

### 3.5 The cap-doc-count reached

**WHEN** doc count in lane is at the hard-pause level (13+ in `docs/runtime/`)
**THEN** refuse all new docs in the lane until a major action-ledger event lands.

### 3.6 The Captain-saturated review-debt pattern

**WHEN** Captain has unread/un-acted-upon analysis docs ≥ N (calibrated: 5 in `docs/runtime/`) AND no Captain interaction has occurred in 24h
**THEN** new docs add to the unread pile and reduce the chance any of them are acted on. Refuse.

Source: `OPERATOR_BANDWIDTH_LIMITS.md` §5 (relay saturation).

---

## 4. When analysis IS leverage

Equally important. Refusing all analysis would be its own failure mode.

### 4.1 First-pass on a new domain

**WHEN** the lane has <5 docs AND a question is asked that has no prior treatment in the lane
**THEN** analysis is leverage. Proceed.

### 4.2 Conversion of theory to operations

**WHEN** existing theoretical docs need to become rules, gates, protocols, or thresholds
**THEN** analysis is leverage. Proceed (this is what the current commit is doing).

### 4.3 Refresh of a dashboard whose signal has actually moved

**WHEN** a dashboard exists AND a signal it tracks has moved
**THEN** refresh is leverage. Proceed.

### 4.4 BUILD_INTELLIGENCE capture on a real gotcha

**WHEN** a session encountered an actual gotcha worth preserving
**THEN** the entry is leverage. Always proceed (per §2.2 minor-action — it itself counts as an action-ledger event).

### 4.5 Documentation that unblocks a Captain decision

**WHEN** a Captain-side decision is pending AND a brief decision document would unstall it
**THEN** the brief is leverage. Proceed; cap at ≤500 words.

---

## 5. Per-lane gate enforcement

Each lane has a counter (doc count) and an action-ledger pointer (last action-ledger event). The gate logic:

```
to_write_doc(lane, proposed_doc):
  count = docs_in(lane)
  last_action = action_ledger.last_event(lane)
  
  IF count <= 4:
      return ALLOW
  IF count <= 8 and proposed_doc.is_displacement_or_refresh:
      return ALLOW
  IF count <= 8 and not displacement:
      return DENY ("must displace or refresh")
  IF count <= 12:
      IF action_ledger_event_since(last_doc) is None:
          return DENY ("no action since last doc; route to action ledger first")
      return ALLOW
  IF count == 13:
      return DENY ("hard pause; major action required first")
  IF count >= 14:
      return DENY ("anti-leverage by definition; refuse")
```

The session asking to write a doc applies the gate. If the user explicitly overrides the gate (e.g., "convert theory to gates" — recognized as a major operational shift, not a new theory doc), the override is logged and the gate is satisfied for the specific override case but resets immediately after.

---

## 6. Action-cooldown rules

Symmetric to the analysis cap: even *actions* can theatre.

### 6.1 Same-action repetition

**WHEN** the same action type (e.g., branch hygiene) has been logged 3 times in a single day without producing a state change in any other ledger
**THEN** the action is being repeated for its own sake. Re-evaluate.

### 6.2 BUILD_PLAN check-off without ship

**WHEN** a `[x]` is being added without a corresponding ship commit in the same operator window
**THEN** stop. Per `EXECUTION_GATES.md` §3.5 stale-track detection.

### 6.3 Doc-update batching as substitute for ship

**WHEN** the only commits in a session are doc updates AND no shipped feature exists
**THEN** the session is in pure-analysis mode. Per `EXECUTION_HEALTH.md` §2.1 useful-throughput threshold.

---

## 7. Operator-side triggers vs Claude-side triggers

The gates apply to both, but with different escalation paths.

### 7.1 Claude-side trigger

If a session decides on its own to write a new analysis doc that the gate would deny:

- Refuse the write.
- Log the refusal in WIP with the gate citation.
- Suggest the highest-leverage *non-doc* action available.

### 7.2 Operator-side trigger

If the operator explicitly requests a new analysis doc that the gate would deny:

- The session should:
  - Surface the gate citation.
  - State which action-ledger event would clear the gate.
  - Ask whether the operator wants to override the gate or address the action first.
- If the operator overrides, log the override with the reason. The override doesn't change the gate state — it allows one specific exception.

(This commit's three docs — EXECUTION_GATES, BRANCH_HYGIENE_PROTOCOL, this doc — are themselves operator-side overrides under §4.2 "Conversion of theory to operations." Logged here.)

---

## 8. Lane-specific rules — `docs/runtime/`

Specific applied rules for the current lane:

- **Cap:** 13 docs hard-pause. Currently at 15 (12 prior + 3 this commit, accounted for as conversion-to-operations override per §4.2).
- **Refresh:** allowed only when an underlying signal has moved (per `EXECUTION_HEALTH.md` §7).
- **Next allowed analysis doc in this lane:** doc #16 only if Phase 1 milestone landed OR M-task pair cleared OR full branch hygiene cycle completed.
- **Standing forbidden patterns:**
  - "Models the cost of X" doc when X has already been modeled.
  - "Synthesizes findings from prior docs" without operational artifact.
  - New scoring frameworks beyond `TRACK_PRIORITIZATION_MATRIX.md`.
  - New tooling design for Tier 3–4 architectural moves (premature).

---

## 9. The exit ramp

The system should be able to leave high-analysis mode cleanly. The exit ramp:

1. **Stop adding analysis docs.** Apply §3 gates.
2. **Convert latest theory to operational artifacts.** This commit is an example.
3. **Refresh the dashboard** (`EXECUTION_HEALTH.md`) only if a signal has moved.
4. **Surface the standing recommendations** to Captain at next interaction.
5. **Wait for an action-ledger event** before allowing further analysis in the lane.

A clean exit ramp prevents the alternative — a slow, ambiguous fade where no one decides whether the lane is over.

The current state of `docs/runtime/`:

- Step 1: applied (this commit's thresholds enforce the stop).
- Step 2: in-progress (this commit *is* the conversion).
- Step 3: dashboard at v1; refresh not warranted yet.
- Step 4: pending Captain interaction.
- Step 5: pending action-ledger event.

---

## 10. The single sentence

**Analysis is leverage when it produces an operational artifact (gate, protocol, threshold, decision brief) or a real-gotcha BUILD_INTELLIGENCE entry; otherwise, past doc #9 in a lane it is anti-leverage and must wait for an action-ledger event before continuing.**

---

## 11. DONE / KNOWN / NEXT

**DONE**
- Defined the two-ledger model (analysis vs action) and the doc-count cap table.
- Specified six analysis-anti-leverage WHEN conditions and five analysis-IS-leverage WHEN conditions.
- Defined gate-enforcement logic and operator vs Claude-side trigger paths.
- Specified action-cooldown rules to prevent action-side theater.
- Snapshotted the current `docs/runtime/` lane state: at 15 docs (this commit included), accounted for as conversion-to-operations override, then hard pause until an action-ledger event lands.
- Stated the exit ramp from high-analysis mode and the single-sentence rule.

**KNOWN**
- The thresholds (5/9/13/14) are calibrated against this lane's experience. Other lanes may need different cuts.
- Gate enforcement assumes the session and operator both honor the gate. Bypassing it without override is itself a HALT-trigger per `EXECUTION_GATES.md` §5.
- The "conversion to operations" override (§4.2) is intentionally narrow — it applies when theory becomes rules, not when one analysis doc spawns another.

**NEXT**
- After this commit: no new analysis docs in `docs/runtime/` until Phase 1 milestone OR M-task pair cleared OR branch hygiene cycle.
- Refresh `EXECUTION_HEALTH.md` only on signal movement.
- The dashboard, the gates, the hygiene protocol, and these thresholds together are the operational surface. They do their job by being applied, not by being added to.
