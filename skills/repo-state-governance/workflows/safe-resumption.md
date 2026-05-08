# Workflow: safe-resumption

## Identity
- **Name:** `safe-resumption`
- **Motivating use case:** Re-entering a paused or frozen repo without missing accumulated drift. The most common cause of post-pause bugs is skipping the audit step — this workflow makes it mandatory.
- **Spans:** `pause` (or `freeze`) → `audit` (lightweight) → `resume` → `stabilize` (or other active mode)

## Inputs
- Manifest mode is `pause` or `freeze`
- Pause-state artifact OR handoff report exists for the current pause/freeze
- Resuming operator is identified

## Outputs
- Updated `repo-manifest.json` reflecting new active mode
- Audit-trail entries for each phase
- Resume report (often inline in audit trail; optional separate artifact for long pauses or handoffs)
- (If audit found issues) audit report at `.governance/artifacts/[YYYY-MM-DD]-resume-audit.md`

## Phases

### Phase 1 — Read the prior artifact
**Target mode:** still `pause` (or `freeze`) — no transition yet

**Actions:**
- Read pause-state artifact OR handoff report in full
- Confirm operator identity matches expected (especially for handoff)
- Note: what was in flight, what to do first on resume, gotchas, blockers

**Checkpoint:**
- Operator (human or agent) confirms artifact has been read
- If artifact is missing: workflow halts; operator must locate or accept reconstructing context

**Exit criteria:**
- Artifact understood; resuming operator has a clear "next action" candidate

### Phase 2 — Lightweight audit (drift check)
**Target mode:** `audit` (transient)

**Actions:**
- Update manifest: `current_mode = "audit"`, `entered_by = [resuming-operator]`
- Append audit-trail entry
- Run drift-check subset of audit:
  - `git fetch --all`
  - Compare current branch vs. main vs. last-known-state at pause time
  - Run repo's universal validation (tests + lint)
  - Check dependency lockfile vs. installed (if applicable)
  - Check schema / migration state (if applicable)
- Record findings inline in audit trail OR as a separate audit report if findings are non-trivial

**Checkpoint:**
- Drift summary captured
- Tests passing OR drift-introduced failures explicitly noted

**Exit criteria:**
- Drift report complete
- Operator decision: proceed to resume OR escalate

**If drift is large:**
- Surface to operator: "[N] commits landed since pause; [list of meaningful changes]; [test status]; recommend [proceed | recover | re-pause for full audit]"
- Operator chooses: continue workflow, escalate to full `audit` mode, or escalate to `recovery`

### Phase 3 — Resume
**Target mode:** `resume` (transient)

**Actions:**
- Update manifest: `current_mode = "resume"`
- Append audit-trail entry
- Validate the artifact's "next action" still applies — if drift made it stale, document a revised next action
- Update WORK_IN_PROGRESS.md (or repo equivalent) with revised context

**Checkpoint:**
- Next action is clear and current
- Manifest reflects resume

**Exit criteria:**
- Resuming operator is ready to do work, not just navigate

### Phase 4 — Transition to active mode
**Target mode:** `stabilize` (typical) or other (extraction-prep, deploy-prep, etc.)

**Actions:**
- Update manifest to target active mode
- Append audit-trail entry
- (Optional) Discard transient `resume` audit trail row OR keep for chain visibility — current convention: keep, helps replay history

**Checkpoint:**
- Manifest is in active mode
- Audit trail shows full chain: pause/freeze → audit → resume → active

**Exit criteria:**
- Workflow complete

## Rollback strategy

- **If Phase 1 cannot read artifact (missing/corrupt):** workflow halts; recommend reconstructing artifact from git log + audit trail OR escalate to recovery
- **If Phase 2 audit shows recovery is needed:** workflow exits early; transition to `recovery` mode instead of `resume`
- **If Phase 3 reveals the artifact's "next action" is impossible (e.g. files deleted, deps gone):** operator chooses: revise the next action, escalate to recovery, or re-enter pause/freeze with an updated artifact

## Success criteria
- Manifest is in target active mode
- Audit trail shows all transitions
- Resuming operator has a concrete, current next action
- Drift (if any) has been documented, not silently absorbed

## Common variations

### Express resumption (short pause, no drift)
If pause was < N hours (default 4h) and no upstream commits, Phase 2's audit can skip the universal validation re-run and just confirm `git status` + `git log -5`.

### Resume after handoff (different operator)
Phase 1's operator-identity check is mandatory — the resuming operator must match the handoff's `incoming` field, OR the discrepancy is documented.

### Resume from freeze (escalation friction)
Per `modes/freeze.md`, freeze → resume directly is forbidden. This workflow handles the friction: if entering from freeze, transition through pause first (write a pause-state artifact reflecting the freeze conditions before lifting), then continue normally.

## Related workflows
- **Before:** `clean-pause` (or any pause-producing workflow) preceded this
- **After:** typically followed by active feature work or a more specific workflow like `deployment-preparation`
- **Instead of:** if drift is severe, run `repo-recovery` instead
