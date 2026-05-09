# PATCH LOOP

## Purpose
Take a queued, approved patch plan and execute it under the active mode's constraints.

## Inputs
- A patch plan (per templates/patch-plan.template.md), referencing one or more files.
- Active mode and its permissions.
- MUTATION_POLICY class for each touched file.
- AUTO_FIX_POLICY allowlist (if mode = Safe Auto-Fix).

## Steps
1. **Validate plan** — required sections present; class declared; reversibility stated.
2. **Mode check** — current mode permits this class. If not, refuse + log.
3. **Hard-stop check** — none of SAFETY_HARD_STOPS triggered.
4. **Pre-state snapshot** — note current SHA + relevant register tail entries.
5. **Apply diff** — single atomic commit; descriptive message linking to plan + DER id.
6. **Verify** — run mode-defined green check (e.g. status.sh, tests, manual smoke).
7. **On failure** — `git revert <sha>`, log to AUDIT_LOG, re-enter AUDIT_LOOP.
8. **On success** — append to `RUNTIME_DELTA_REPORT`, hand off to CHECKPOINT_LOOP.

## Outputs
- 1 commit (success) OR 1 commit + 1 revert (failure).
- Delta report append.
- Possibly an updated GOTCHA_REGISTER entry (if patch fixed a logged gotcha).

## Concurrency
- Max one C4+ patch in flight per branch (S4).
- C1 register appends do not count.

## Failure Behavior
- Always rolls back. Never "fix forward" inside the same loop iteration.
- If revert itself fails → escalate (E5 / S3 territory).

## Bootstrap (v0.1)
- Disabled until P2. v0.1 only specifies the loop; no automation runs it.
