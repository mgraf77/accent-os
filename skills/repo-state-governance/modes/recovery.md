# Mode: recovery

## Identity
- **Mode key:** `recovery`
- **Risk tier:** HIGH
- **Reversibility:** SEMI (some recovery actions are destructive — git reset, file restore from backup)
- **Typical duration:** minutes to days (depends on damage scope)
- **Concurrency:** SINGLE_AGENT (avoid two recoveries fighting each other)

## Purpose
Restore a degraded or broken repository to a known-good state. Recovery is the mode you enter when something is *wrong*: tests catastrophically failing, working tree corrupted, accidental destructive operation, force-push damage, dependency hell, or unrecoverable migration.

Recovery is not stabilize. Stabilize is "tidy a healthy repo." Recovery is "restore a sick one."

## Entry Conditions
- Manifest mode is any (recovery can be entered from any state)
- An explicit recovery trigger has been identified — one of:
  - Tests catastrophically failing in ways stabilize cannot fix
  - Working tree is corrupted (`.git` damaged, conflicting states)
  - Accidental destructive operation (force-push, deleted branch with unique work, dropped table)
  - External dependency irreversibly changed (vendor API, database schema)
  - Audit identified critical issue requiring rollback
- A recovery plan has been drafted (or will be drafted as Step 1 of the mode)

## Goals (ordered)
1. Identify the **last known-good state** (commit, tag, snapshot, backup)
2. Identify the **damage scope** — which files / modules / services are affected
3. Define the **recovery strategy** (rollback / forward-fix / surgical repair) and capture it in a recovery plan
4. Execute the recovery plan with checkpoints
5. Verify recovery by re-running the repo's tests + manifest validation
6. Hand off to `stabilize` once verified

## Allowed Actions
- Read git reflog, stash, tags, archived branches
- Restore from backup (file restore, db restore from snapshot)
- Cherry-pick or revert specific commits
- Force-push only when explicitly authorized in the recovery plan AND no alternative exists
- Reset branches to known-good commits (with `git tag` first to preserve current state)
- Restore deleted files from git history
- Re-run migrations from a known-good state
- Coordinate with upstream services / vendors when external state must be restored
- Write the recovery plan
- Append to audit trail
- Update manifest

## Forbidden Actions
- Any destructive action not explicitly listed in the recovery plan
- Force-push without authorization in the recovery plan
- Deleting branches that may contain unique work, even if they look broken
- Treating recovery as license to "clean up" — recovery is narrow, not broad
- Skipping the verification step
- Marking recovery complete without re-running tests
- Recovering by introducing new bugs ("the tests pass now because I removed them")

## Execution Priorities
1. **Stop the bleeding.** If the repo is still being damaged (a script keeps running, a CI job keeps failing destructively), halt that first.
2. **Identify the known-good state before touching anything else.** Without a target, recovery is guesswork.
3. **Tag current state before any destructive action.** Even a broken state is information; preserve it.
4. **Plan, then execute.** Recovery without a written plan compounds damage.
5. **Verify before declaring complete.** Tests pass + manifest valid + audit-trail entry written.
6. **Communicate.** During recovery, surface progress to the operator at each checkpoint.

## Documentation Requirements
- Recovery plan at `.governance/artifacts/[YYYY-MM-DD]-recovery-plan.md` (template: `templates/recovery-plan.template.md`, schema: `schemas/recovery-plan.schema.md`)
  - Required sections:
    - Trigger event (what happened, when, who noticed)
    - Damage scope assessment
    - Last known-good state (commit / tag / snapshot)
    - Recovery strategy (rollback / forward-fix / surgical)
    - Step-by-step plan with checkpoints
    - Authorized destructive operations (explicit list)
    - Rollback-of-recovery plan (what to do if recovery itself fails)
    - Verification criteria
    - Post-mortem reference (link to a future post-mortem document, even if not yet written)
- Audit-trail entries at every checkpoint (recovery is verbose — every step is a row)
- Manifest update on completion: `current_mode = "stabilize"` (recovery transitions out on success)

## Validation Requirements

**Universal:**
- Recovery plan exists and is signed off by the operator (human approval mandatory for HIGH-risk recovery)
- Pre-recovery state was tagged before any destructive action
- All authorized destructive operations match the plan (no out-of-scope destruction)
- Repo's tests pass after recovery
- Audit-trail entries exist for each checkpoint

**Recovery-specific:**
- If force-push was used, the prior state is preserved as a tag and documented
- If file restore was used, the source of the restored files is documented
- If a database recovery was involved, the snapshot ID and recovery method are recorded

## Completion Criteria
- All steps in the recovery plan executed (or explicitly skipped with reason)
- Verification criteria met
- Tests pass
- Recovery plan marked complete with end-state described
- Audit trail closed with `[date] recovery → stabilize`
- Manifest updated to `stabilize`

## Allowed Transitions
- `recovery → stabilize` — normal completion
- `recovery → freeze` — if recovery determined the repo must lock down (e.g. broader incident response)
- `recovery → handoff` — if the recovery itself must be handed off (e.g. specialist needed)

**Not allowed:**
- `recovery → resume` directly
- `recovery → deploy-prep` directly (must pass through stabilize and audit)

## Risk Profile

| Risk | Mitigation |
|---|---|
| Recovery introduces new bugs | Verification criteria require re-running tests; do not skip |
| Recovery loses unique work | Tag pre-recovery state; preserve all branches even if broken |
| Force-push without authorization | Explicitly forbidden unless in plan; plan requires human sign-off |
| Recovery scope creeps into "while we're in here, fix X" | Hard rule: recovery is narrow; surface other issues to post-recovery stabilize |
| Recovery plan lacks rollback-of-recovery | Schema requires the rollback-of-recovery section; cannot complete plan without it |
| External state (db, vendor) recovered incorrectly | Document snapshot IDs and methods; verify with vendor / db owner |
| Multiple agents try to recover simultaneously | SINGLE_AGENT concurrency; manifest write is atomic |
| Operator approves recovery plan without reading | Make the plan short enough to read; surface critical points |

## AI Agent Guidance

- **Recovery is not your moment to be heroic.** Slow down. Plan first.
- **Preserve evidence.** Even a broken state is data — tag it, document it, do not delete it.
- **Get human sign-off on the plan.** This is a HIGH-risk mode; agents do not self-authorize destructive operations.
- **Communicate at every checkpoint.** "Step 3 complete. Tagged pre-step-4 state. Proceeding." Each step a quick status update.
- **Be surgical.** Recovery touches only what is broken. The temptation to "tidy up while I'm here" is how recovery becomes a second incident.
- **Verify, then verify again.** Tests pass once doesn't mean recovery is done — verify against the recovery plan's full criteria.
- **Write the post-mortem placeholder.** Even before the post-mortem is written, drop a stub at `.governance/artifacts/[date]-postmortem-stub.md` so it's not forgotten.

## Human-in-the-Loop Touchpoints

- **Required to enter:** explicit human acknowledgment that recovery is needed (not a self-declared "I think this is broken").
- **Required to approve plan:** human signs off before any destructive action.
- **Required at each destructive checkpoint:** human approves the specific operation (force-push, file delete, db rollback) — not blanket approval.
- **Required to declare complete:** human verifies the verification criteria.
- **Required to skip post-mortem:** if a post-mortem stub is dropped, only a human can decide it doesn't need a full follow-up.
