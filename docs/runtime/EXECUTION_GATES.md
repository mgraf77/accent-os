# EXECUTION GATES

> **Purpose.** Operational gates derived from the existing economics corpus (`EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `ORCHESTRATION_COST_CENTERS.md`, `ENTROPY_ACCUMULATION_MODEL.md`, `OPERATOR_BANDWIDTH_LIMITS.md`, `EXECUTION_HEALTH.md`). Every gate below is an IF/THEN derived from a finding already documented elsewhere — this doc adds no theory, only conversion.
> **Frame.** Operational rules. Not narrative. Read the gate, apply the rule. Cite the source doc when the rule needs justification.
> **Last updated:** 2026-05-10. v1.

---

## 1. The speed governor

Four named operating speeds. The dashboard (`EXECUTION_HEALTH.md`) sets the active speed; sessions read the governor before any non-trivial action. Conditions are measurable; the operator does not pick the speed by feel.

### 1.1 GO

**Conditions (all must hold):**
- BE estimated **Low** (≤ 0.20). See `PARALLELISM_SAFETY_THRESHOLDS.md` §4.
- Captain supervision tax estimated **≤ 25%** (Zone GREEN or YELLOW). See `OPERATOR_BANDWIDTH_LIMITS.md` §2.
- Live `claude/*` branches: **≤ 2** active.
- Oldest live branch age: **< 72h**.
- No reservoir-entropy event detected in last 24h (no out-of-band drift, no WIP clobber, no unmerged branch >72h).
- Phase 0 hygiene current (BUILD_INTELLIGENCE entries written for any gotchas in last session; WIP truthful at session-end).

**Allowed actions:**
- Spawn up to N=2 concurrent sessions on isolated module work.
- Ship `js/<feature>.js` modules with thin index.html wire-ups.
- Apply idempotent migrations with paired down (when down exists).
- Standard commit/push cadence.
- Bounded analysis (≤30 min per session).

**Forbidden:**
- Concurrent edits to `index.html` from two sessions.
- Migrations without paired downs.
- Adding a new top-level global without grep-sweep of all references.

**Stop condition:** any GO condition becomes false → governor drops one level.

---

### 1.2 CAUTION

**Conditions (any one triggers):**
- BE estimated **Elevated** (0.20–0.40).
- Captain supervision tax estimated **25–45%**.
- Live `claude/*` branches: **3** active.
- Oldest live branch age: **48–72h**.
- One reservoir-entropy event in last 24h.
- Phase 0 hygiene lapse (skipped BUILD_INTELLIGENCE entry, untruthful WIP).
- Captain reports decision fatigue or relay saturation.

**Allowed actions:**
- Continue currently-active sessions to natural stopping points.
- New work only if: confined to one module, no shared-global mutation, no migration.
- Required: pre-claim BUILD_PLAN item in WIP before starting.
- Required: Captain-batched review window planned within 24h.

**Forbidden:**
- Spawning a 4th concurrent session.
- Starting migrations.
- Editing `index.html` significantly (≥5 lines).
- iPhone-only review of any non-trivial diff.

**Stop condition:** two CAUTION conditions held simultaneously → governor drops to CRAWL.

**Escalation:** Captain notified at next interaction; CAUTION shown explicitly with the triggering condition named.

---

### 1.3 CRAWL

**Conditions (any one triggers):**
- BE estimated **High** (0.40–0.65).
- Captain supervision tax estimated **45–70%**.
- Live `claude/*` branches: **4–5** active.
- Any branch age **> 72h** with unmerged work.
- ≥2 reservoir-entropy events in last 24h.
- Captain backlog: ≥3 unreviewed branches (per `ORCHESTRATION_COST_CENTERS.md` §6).
- Reconciliation collapse condition triggered (per `PARALLELISM_SAFETY_THRESHOLDS.md` §5).

**Allowed actions:**
- Drain existing queue serially. One session at a time.
- Branch hygiene: merge or close stale branches per `BRANCH_HYGIENE_PROTOCOL.md`.
- Captain review of pending branches.
- Stabilization-only commits.

**Forbidden:**
- Any new work that adds BE.
- Spawning new sessions.
- Touching `index.html` or shared globals.
- New branches (no exceptions).
- Schema migrations.

**Stop condition:** if any CRAWL condition still holds 4 hours after entering CRAWL → governor drops to HALT.

**Escalation:** Captain notified immediately. Other live sessions surfaced in next status block.

---

### 1.4 HALT

**Conditions (any one triggers):**
- BE estimated **Critical** (>0.65).
- Captain saturated (>70% supervision tax with no slack).
- Reconciliation cost has exceeded value of in-flight work for 24h.
- Irreversible move attempted out of sequence (per `SCALING_SEQUENCE_ANALYSIS.md` §2): governance hardening pre-decomposition; Codex as concurrent writer pre-isolation; overnight N>3 pre-Phase-1; CI/CD pre-substrate; production state mutation without down-migration.
- Two consecutive CRAWL→HALT escalations in the same week (per `EXECUTION_HEALTH.md` self-audit).

**Allowed actions:**
- Captain decision-making only.
- Branch closure (no merges that haven't already been Captain-approved).
- Documentation of the HALT condition.

**Forbidden:**
- Any code change.
- Any new session spawn.
- Any commit that is not the explicit HALT acknowledgment.

**Stop condition:** Captain explicitly clears the HALT *and* the triggering condition has measurably reversed.

**Escalation:** This is the escalation. No higher level exists.

---

## 2. Per-action gates

Each action class has a gate. The session checks the gate before acting; the gate denies if its conditions aren't met.

### 2.1 Gate: spawn-new-session

**ALLOW IF:**
- Speed governor is GO or CAUTION.
- Adding the session keeps BE in the current band.
- The new session has a pre-claimed BUILD_PLAN item or a named scoped task.
- Captain bandwidth has slack for the corresponding supervision-tax delta.

**DENY IF:**
- Speed governor is CRAWL or HALT.
- Adding the session would push BE up a band.
- No pre-claim or named task.
- Captain backlog ≥3 unreviewed branches.

### 2.2 Gate: edit-shared-resource (index.html, MASTER, BUILD_PLAN, module_modes.json)

**ALLOW IF:**
- No other live session has uncommitted changes to the same file.
- Speed governor is GO or CAUTION.
- The edit is captured in WIP before starting.

**DENY IF:**
- Another live session is mid-edit on the same file (frozen-file tax — `ORCHESTRATION_COST_CENTERS.md` §6).
- Speed governor is CRAWL or HALT.
- The edit is to `index.html` and Phase 1 has not started (anti-leverage per `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §6.1) — *unless* the edit is a thin wire-up (≤5 lines) for a `js/<feature>.js` module.

### 2.3 Gate: apply-schema-migration

**ALLOW IF:**
- Migration is idempotent (e.g., `DROP POLICY IF EXISTS` pattern).
- Paired down-migration exists and is committed.
- No other migration is open in any live session.
- Captain has approved within the last review window OR the migration is in a pre-approved class.
- Speed governor is GO.

**DENY IF:**
- Speed governor is CAUTION, CRAWL, or HALT.
- No paired down-migration.
- Another migration is in flight.
- Captain on iPhone-only.

### 2.4 Gate: ship-feature

**ALLOW IF:**
- Track is GREEN per `TRACK_READINESS_SCORE.md`.
- Speed governor is GO.
- Branch is healthy per `BRANCH_HYGIENE_PROTOCOL.md`.
- Verification path exists.

**DENY IF:**
- Track is YELLOW, ORANGE, RED, or BLACK.
- Speed governor is below GO.

### 2.5 Gate: write-analysis-doc

**ALLOW IF:**
- Action checkpoint condition met per `ANALYSIS_TO_ACTION_THRESHOLDS.md`.
- The doc displaces an existing doc (refresh) rather than adding a 13th, 14th, etc.
- The doc is operational (gates, protocols) rather than theoretical.

**DENY IF:**
- An analysis doc in the same lane was written without an intervening action.
- The doc adds new theory rather than converting existing theory.
- Total docs in `docs/runtime/` would exceed 13 without a Phase 1 milestone clearing.

### 2.6 Gate: overnight-run

**ALLOW IF:**
- Speed governor is GO at session start.
- N ≤ 2 sessions scheduled (or ≤ 3 with all guardrails per `PARALLELISM_SAFETY_THRESHOLDS.md` §6).
- Pre-overnight checklist passes (per `PARALLELISM_SAFETY_THRESHOLDS.md` §6 checklist).
- Captain pre-approved the overnight scope.

**DENY IF:**
- Any of the above fails.
- Phase 1 has not landed and the overnight would touch `index.html` or migrations.

---

## 3. Continuous-condition gates

Conditions that are checked continuously, not just before an action.

### 3.1 Synchronization overhead vs. execution gain

**RULE:** If estimated session-time spent on coordination + sync > 40% of total session-time across the day, drop the speed governor one level until the next morning.

**Source:** `EXECUTION_ECONOMICS_MODEL.md` §4 ("coordination overhead is ~12% at N=2, ~28% at N=3, ~48% at N=4"). 40% threshold corresponds to entering Zone RED behavior.

### 3.2 Decomposition velocity

**RULE:** If decomposition work begins, *velocity must be small*. No more than one module extracted per session. No "big bang" rewrites of `index.html` in a single branch.

**Source:** `SCALING_SEQUENCE_ANALYSIS.md` §2.1 (locking concurrency into the monolith) — applies in reverse to decomposition itself, where moving too fast creates a different irreversible mistake.

**TRIGGER:** if a decomposition session attempts >1 module extraction or >300 lines moved in one commit, drop to CAUTION immediately and require Captain review before continuing.

### 3.3 Operator review debt

**RULE:** If unreviewed `claude/*` branches ≥3 *and* total Captain-minutes-needed-to-review estimated > 90 → drop to CRAWL until backlog drains.

**Source:** `ORCHESTRATION_COST_CENTERS.md` §5 (Captain saturation behavior).

**ESCALATION:** if backlog ≥5 → HALT, drain serially, no new work.

### 3.4 Train count reduction

**RULE:** If supervision tax measured > 50% for 2 consecutive sessions, max train count drops by 1 until next morning.

**Source:** `OPERATOR_BANDWIDTH_LIMITS.md` §2.

### 3.5 Stale-track detection

**RULE:** If any BUILD_PLAN `[x]` claim is found unsupported by an actual ship commit, immediate revert of the marker. Drop to CAUTION until corrected.

**Source:** `ENTROPY_ACCUMULATION_MODEL.md` §1.4, §5.2.

---

## 4. Gate precedence

Gates are evaluated in this fixed order. Lower-numbered gates fire first; their action overrides higher-numbered.

1. **HALT conditions** (§1.4). Override everything.
2. **Stale-track / reservoir corrections** (§3.5). Must fix before proceeding.
3. **Operator review debt** (§3.3). Drains before new work.
4. **Speed governor level** (§1.1–§1.4). Sets allowed action set.
5. **Per-action gates** (§2.x). Confirms the specific action.
6. **Continuous-condition gates** (§3.1–§3.4). Adjust governor mid-session.

A session that wants to act first checks the governor (4), then the per-action gate (5). The continuous-conditions can lower the governor at any time, which retroactively narrows the allowed action set for the next decision.

---

## 5. Gate refusals — what to do when denied

The session must not work around a denied gate. The protocol when a gate denies:

1. **Stop the action.** Do not retry with a workaround.
2. **Log the refusal in WIP** with the gate name and the failing condition.
3. **Surface to Captain** at next interaction with one-line summary.
4. **Switch to a permitted action** (typically: drain queue, branch hygiene, BUILD_INTELLIGENCE capture).

Trying to circumvent a denied gate (e.g., by re-classifying the action, by asserting the condition has changed without evidence, by spawning a session that does the forbidden action under cover) is itself a HALT-trigger: it breaks the gate-based contract that the dashboard relies on.

---

## 6. Current state (snapshot, 2026-05-10)

Read from `EXECUTION_HEALTH.md` v1:

- **Speed governor:** **CAUTION**.
  - Triggering condition: planning overhead ≈100% of corridor (per `EXECUTION_HEALTH.md` §2.6); review burden elevated (§2.7); branch age approaching 72h (§2.9); Phase 0 hygiene lapse (no BUILD_INTELLIGENCE entries despite 4 work-passes).
  - Demotion source: §3.1 synchronization-vs-execution rule does not yet apply (single session, low sync); §3.5 stale-track does not apply (no false `[x]` markers). The dominant trigger is §1.2 — multiple CAUTION conditions simultaneously.
- **Allowed actions right now:** drain (this work — converting theory to gates is a draining action), branch hygiene, M-task delivery (Captain-side), Phase 1 planning (Captain + Claude).
- **Forbidden right now:** spawning a second session, editing `index.html`, opening a migration, writing more theory docs, iPhone-only review of any of the 12 prior analysis docs.
- **Next governor change:** if (a) the current branch is merged or closed, AND (b) at least one of the standing recommendations from `EXECUTION_HEALTH.md` §9 is acted upon → governor advances to GO at next morning.

---

## 7. DONE / KNOWN / NEXT

**DONE**
- Defined the four-level speed governor (GO/CAUTION/CRAWL/HALT) with measurable conditions per level.
- Specified six per-action gates with ALLOW/DENY conditions.
- Specified five continuous-condition gates with explicit thresholds.
- Set gate precedence order (HALT > corrections > review debt > governor > per-action > continuous).
- Defined the gate-refusal protocol.
- Snapshotted current state: governor at **CAUTION**.

**KNOWN**
- Every condition is calibrated qualitative; the BE estimator and supervision-tax estimator do not exist as instruments. Conditions are read against the corpus and the dashboard.
- No new theory introduced. All rules cite their source doc.
- The gates assume the operator and any future session will respect them. Bypassing a gate is itself a HALT-trigger.

**NEXT**
- `BRANCH_HYGIENE_PROTOCOL.md` operationalizes the branch-side rules referenced here (§3.3, §1.2, §1.3).
- `ANALYSIS_TO_ACTION_THRESHOLDS.md` operationalizes the analysis-doc gate (§2.5) and the doc-count thresholds.
- Refresh: only when the dashboard refreshes (signal-triggered).
