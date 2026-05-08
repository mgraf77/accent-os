# Workflow: repo-recovery

## Identity
- **Name:** `repo-recovery`
- **Motivating use case:** Repo is broken — tests catastrophically failing, working tree corrupted, accidental destructive operation, force-push damage, schema migration gone wrong, dependency hell. Restore to known-good.
- **Spans:** broken state → `recovery` → `stabilize`

## Inputs
- Recovery is triggered by an explicit problem: catastrophic test failure, corrupted state, destructive operation, etc.
- A last known-good state exists (commit, tag, snapshot, backup) — if one does not exist, recovery is harder and the workflow may need an extra "reconstruct from scratch" phase
- A recovery operator is identified (human required for HIGH-risk recovery)

## Outputs
- Updated `repo-manifest.json` returning to `current_mode = "stabilize"` after recovery
- Audit-trail entries for every checkpoint (recovery is verbose)
- Recovery plan at `.governance/artifacts/[YYYY-MM-DD]-recovery-plan.md`
- Pre-recovery state tag (e.g. `git tag pre-recovery/[date]`)
- (If applicable) post-mortem stub at `.governance/artifacts/[date]-postmortem-stub.md`

## Phases

### Phase 1 — Stop the bleeding
**Target mode:** still whatever the broken mode was — no manifest change yet (capturing state is more important than declaring mode here)

**Actions:**
- Identify what is still actively damaging the repo (a CI job that keeps force-pushing, a script in a loop, a migration in flight)
- Halt the active damage (cancel CI, kill scripts, pause migrations)
- If hosting allows: enable temporary branch protection to prevent further accidental commits

**Checkpoint:**
- No active damage in progress
- Repo is in a "stable" broken state (broken, but not getting more broken)

**Exit criteria:**
- Damage halted; preserved-but-broken state ready to be tagged

### Phase 2 — Tag pre-recovery state
**Target mode:** still pre-recovery — about to enter `recovery`

**Actions:**
- `git tag pre-recovery/[YYYY-MM-DD]/[short-description]` at current HEAD
- If branches contain unique broken work: tag those too (`git tag pre-recovery/[date]/[branch]`)
- If applicable: snapshot external state (db snapshot, vendor state)
- Record the tag(s) — they're the rollback target if recovery itself fails

**Checkpoint:**
- Pre-recovery tag exists and is pushed (if remote available)
- All preserved branches accounted for
- External-state snapshots taken if applicable

**Exit criteria:**
- Pre-recovery state is recoverable

### Phase 3 — Identify last known-good state
**Target mode:** entering `recovery`

**Actions:**
- Update manifest: `current_mode = "recovery"`, `entered_by = [operator]`, `recovery_reason = [description]`
- Append audit-trail entry
- Identify the last known-good state:
  - Last green CI build → its commit hash
  - Last release tag
  - Last successful deploy → its commit
  - Last reflog entry where things worked
  - External: last successful db snapshot timestamp
- Document the known-good state in the recovery plan

**Checkpoint:**
- Last known-good state identified with specific commit / tag / snapshot reference
- Recovery plan started (template: `templates/recovery-plan.template.md`)

**Exit criteria:**
- Recovery plan has identified target

### Phase 4 — Draft recovery plan
**Target mode:** `recovery`

**Actions:**
- Choose recovery strategy: rollback / forward-fix / surgical
- Write step-by-step plan with checkpoints
- Enumerate authorized destructive operations (force-push, file delete, db restore) — anything destructive must be in this list to be allowed
- Define rollback-of-recovery (what if the recovery itself fails)
- Define verification criteria
- Surface plan to operator for sign-off

**Checkpoint:**
- Recovery plan is complete and validates against `schemas/recovery-plan.schema.md`
- Operator has signed off (HIGH-risk recovery requires human approval)

**Exit criteria:**
- Plan approved; ready to execute

### Phase 5 — Execute recovery
**Target mode:** `recovery`

**Actions:**
- Execute each step in the recovery plan in order
- After each step, verify the step's checkpoint — do not advance without confirmation
- Append audit-trail entry per step
- If a step fails: stop, surface to operator, choose: retry / skip / rollback

**Checkpoint per step:**
- Step's expected result is observable
- Repo is no worse than the prior step (recovery should monotonically approach known-good)

**Exit criteria for the phase:**
- All steps complete OR explicitly skipped with operator approval
- Recovery plan's verification criteria met

### Phase 6 — Verify recovery
**Target mode:** `recovery` (still — verification is part of recovery)

**Actions:**
- Run repo's tests
- Run repo's lint / type check
- Run any recovery-specific verification (e.g. db consistency check)
- Verify against the recovery plan's verification criteria
- If verification fails: return to Phase 5, address, retry

**Checkpoint:**
- All verification criteria met
- Tests passing

**Exit criteria:**
- Repo is verifiably restored to known-good (or to a documented "good enough" state)

### Phase 7 — Transition to stabilize
**Target mode:** `stabilize`

**Actions:**
- Update manifest: `current_mode = "stabilize"`
- Append audit-trail entry: `[date] recovery → stabilize`
- Drop a post-mortem stub at `.governance/artifacts/[date]-postmortem-stub.md` if not already present
- Surface to operator: "recovery complete; recommend post-mortem"

**Checkpoint:**
- Manifest is in stabilize
- Audit trail records the full recovery chain

**Exit criteria:**
- Workflow complete

## Rollback strategy

- **If recovery itself fails:** invoke the recovery plan's "rollback-of-recovery" section. Restore to the pre-recovery tag. Re-enter recovery with a new plan (or escalate to a different operator).
- **If a phase introduces new damage:** halt; tag the post-damage state separately so it's recoverable; revert the damaging phase using the rollback-of-recovery plan
- **If verification reveals incomplete recovery:** return to Phase 5; do not exit recovery mode prematurely

## Success criteria
- Manifest mode = `stabilize`
- Recovery plan executed completely (or partial with operator-approved skips)
- Verification criteria met
- Pre-recovery tag preserved (do not delete)
- Audit trail tells the full story
- Post-mortem stub dropped (full post-mortem to follow, separate effort)

## Common variations

### Recovery without known-good state
If no good state exists (e.g. corruption goes back further than any backup), Phase 3 includes "reconstruct from sources of truth" — re-clone from a fork, restore from team-member's local clone, etc. Document the reconstruction in the recovery plan.

### Recovery during freeze
If the repo was in `freeze` and recovery is needed, recovery preempts freeze. Audit trail records `freeze → recovery` (special transition documented in detection.md).

### Recovery with external state
If recovery touches db, vendor APIs, or external services, Phase 3 and Phase 5 include external-state operations (snapshot restore, vendor coordination). Verification (Phase 6) includes external consistency checks.

### Multi-operator recovery
If a recovery requires multiple specialists (e.g. DBA + frontend dev + DevOps), the recovery plan assigns steps to specific operators. Each operator's contribution is audit-trail-tagged with their identity.

## Related workflows
- **Before:** `audit` may have surfaced the need for recovery; otherwise recovery is triggered by direct observation of brokenness
- **After:** post-mortem (out of workflow scope), then normal stabilize → active work
- **Instead of:** if the issue is *small* not *broken*, run plain `stabilize`; if the issue is *governance* not *technical*, use `governance-migration`
