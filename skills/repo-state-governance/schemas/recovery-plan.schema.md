# Schema: recovery-plan

## Identity
- **Schema:** `recovery-plan`
- **Version:** v1
- **Purpose:** Plan a recovery operation: identify the trigger, the damage scope, the last known-good state, the strategy, the steps, and the verification. Required before any destructive recovery action.
- **Format:** Markdown
- **Default location:** `.governance/artifacts/[YYYY-MM-DD]-recovery-plan.md`

## Required sections

### Section: Header
| Field | Description |
|---|---|
| `schema_version` | `1` |
| `created_at` | ISO-8601 |
| `created_by` | Operator identity |
| `repo_name` | Repo name |
| `current_broken_commit` | HEAD hash + message at recovery start |

### Section: Trigger event
- What happened (specific, factual, no euphemisms)
- When it happened (ISO-8601 if known; "between X and Y" if not)
- Who noticed (operator, monitoring, downstream consumer, etc.)
- Initial damage assessment (1-2 sentences)

### Section: Damage scope assessment
- Files affected
- Branches affected
- External state affected (db, vendor APIs, infrastructure)
- User-facing impact (if any)
- Data loss potential (yes / no / unknown)

### Section: Last known-good state
- Commit hash + message + date of last verified-working state
- How verification was done (last green CI, last successful deploy, etc.)
- Tags / snapshots / backups available

### Section: Recovery strategy
One of:
- **Rollback** — revert to a known-good commit, accept losing intermediate work
- **Forward-fix** — keep current commit, apply a fix on top
- **Surgical** — selective revert / cherry-pick / file restore
- **Reconstruction** — last known-good state is too old; reconstruct from sources

Justify the choice (1-3 sentences). Document trade-offs.

### Section: Pre-recovery state preservation
- Tag created at current HEAD: `pre-recovery/[date]/[short-description]`
- Branches preserved (list)
- External-state snapshots taken (with snapshot IDs)

### Section: Step-by-step plan
Each step:
- **Step N — [name]**
- **Action:** specific commands / operations
- **Expected result:** what success looks like
- **Verification:** how to confirm step succeeded
- **Authorized destructive operations:** explicit list (force-push, file delete, db restore, etc.) — anything destructive must be enumerated to be allowed
- **If this step fails:** retry / skip / rollback-of-recovery

### Section: Authorized destructive operations
A consolidated list of every destructive operation across all steps. Each entry:
- Operation type (force-push / delete / drop / etc.)
- Target (specific branch / file / table / etc.)
- Authorized by (operator name + date)

If a destructive operation isn't in this list, it is forbidden during recovery — even if it would help.

### Section: Rollback-of-recovery plan
What to do if recovery itself fails or makes things worse:
- Restore from `pre-recovery` tag
- Restore branches from `pre-recovery/*` tags
- Restore external state from snapshots
- Re-enter recovery with a new plan

This section is mandatory — recovery without a rollback-of-recovery is not authorized.

### Section: Verification criteria
Specific, testable conditions for "recovery is complete":
- Tests pass
- Lint / type check pass
- Specific bug-trigger scenarios no longer reproduce
- External state consistent (db checksums match, vendor API responses match expected)
- Manifest valid

### Section: Communications plan
- Who is notified during recovery (operator, on-call, affected users)
- Status updates during recovery (frequency, channel)
- Post-recovery notification

### Section: Authorities & sign-offs
- Recovery plan approved by (name + date) — required for HIGH-risk recovery
- Each authorized destructive operation re-approved (or batch-approved) at execution time

### Section: Outcome (filled in after completion)
- What actually happened
- Deviations from plan
- Lessons learned
- Post-mortem stub link (created if not already)

## Validation rules

1. All required sections must exist.
2. `pre-recovery` tag must exist (and be pushed if remote available).
3. Recovery strategy must be one of the four enumerated types.
4. At least one step must be in the step-by-step plan.
5. Every destructive operation in the steps must appear in the consolidated "Authorized destructive operations" section.
6. Rollback-of-recovery section must be non-empty.
7. Verification criteria must include at least one testable condition.
8. Authority sign-off must be recorded (name + date) for HIGH-risk recovery.

## Markdown rendering example

```markdown
# Recovery Plan

**Created at:** 2026-05-08T15:00Z
**Created by:** human:michael
**Repo:** my-repo
**Current (broken) commit:** xyz9876 "Bad migration"

## Trigger event
A schema migration was applied that dropped the `users` table without a backup. The migration was committed as commit xyz9876 and run automatically by CI at 2026-05-08T14:30Z. Detected at 14:45Z when production smoke test failed with "table users does not exist."

## Damage scope assessment
- Files affected: `migrations/2026-05-08-add-feature-flags.sql` (the bad migration)
- Branches affected: `main` (post-merge)
- External state affected: production database — `users` table dropped
- User-facing impact: HIGH — application returns 500 for all auth endpoints
- Data loss potential: yes (depending on snapshot freshness)

## Last known-good state
- Commit: a1b2c3d "Add user-profile features" (2026-05-07T10:00Z)
- Verification: production smoke tests passed after deploy at 2026-05-07T11:00Z
- Tags: `v1.2.2` is at this commit
- Snapshots: production db snapshot `snap-2026-05-08-1300` taken 90 minutes before the bad migration

## Recovery strategy
**Surgical.** We will (1) restore the `users` table from snapshot `snap-2026-05-08-1300`, (2) revert commit xyz9876 in git, (3) write a corrected migration that achieves the original intent without dropping `users`. Trade-off: 90 minutes of data updates between snapshot and damage are lost; acceptable per RTO.

## Pre-recovery state preservation
- Tag: `pre-recovery/2026-05-08/dropped-users-table` at xyz9876
- Branches preserved: main (already has the bad commit; tag preserves it)
- External-state snapshots: `snap-2026-05-08-1300` (existing) + `snap-2026-05-08-1500` (taken just now, captures the broken state for forensics)

## Step-by-step plan

### Step 1 — Pause production traffic
- Action: enable maintenance mode (`./scripts/maintenance.sh on`)
- Expected result: app returns 503 with maintenance page
- Verification: `curl https://prod.example.com` returns 503
- Authorized destructive operations: none
- If fails: surface to on-call; do not proceed without traffic pause

### Step 2 — Restore users table from snapshot
- Action: `pg_restore -t users snap-2026-05-08-1300` against production db
- Expected result: `users` table exists with rows from 13:00Z snapshot
- Verification: `SELECT count(*) FROM users` returns expected count (≈ 50K rows)
- Authorized destructive operations: PG_RESTORE table-targeted (overwrites table)
- If fails: rollback-of-recovery — escalate to DBA

### Step 3 — Revert bad migration in git
- Action: `git revert xyz9876 --no-commit`; resolve any conflicts; commit as "Revert: bad users-drop migration"
- Expected result: commit added that reverses xyz9876
- Verification: `git log` shows the revert; `migrations/` directory matches pre-bad-migration state
- Authorized destructive operations: none (revert is non-destructive)
- If fails: investigate conflict; retry

### Step 4 — Write corrected migration
- Action: write a new migration file that achieves the feature-flags addition without dropping users
- Expected result: new file `migrations/2026-05-08-add-feature-flags-v2.sql` exists; tests pass
- Verification: `npm test migrations` passes
- Authorized destructive operations: none
- If fails: surface to engineer; can be done outside recovery if blocked

### Step 5 — Resume production traffic
- Action: disable maintenance mode (`./scripts/maintenance.sh off`)
- Expected result: app serves traffic normally
- Verification: production smoke tests pass; auth endpoints return 200
- Authorized destructive operations: none
- If fails: rollback-of-recovery — re-enable maintenance mode; deeper investigation

## Authorized destructive operations
| Operation | Target | Authorized by | Date |
|---|---|---|---|
| pg_restore table-targeted | production.users | human:michael | 2026-05-08T15:10Z |

## Rollback-of-recovery plan
If any step fails:
- Re-enable maintenance mode (`./scripts/maintenance.sh on`)
- Restore from `pre-recovery/2026-05-08/dropped-users-table` tag (returns repo to broken state, preserves forensics)
- If db restore (Step 2) fails or makes things worse, restore from `snap-2026-05-08-1500` (the broken-state snapshot) for forensics; engage DBA for deeper recovery
- Surface to on-call; do not retry without a revised plan

## Verification criteria
- Production smoke tests pass: auth, user-profile, feature-flags endpoints all 200
- Production db: `SELECT count(*) FROM users` returns ≥ 49K rows (allowing for ~1K data loss between 13:00Z and 14:30Z)
- Application logs: no "table users does not exist" errors in last 5 minutes after Step 5
- Maintenance mode: disabled

## Communications plan
- During recovery: status update in #incident channel every 15 minutes
- Affected users: maintenance page displayed during Steps 1–5
- Post-recovery: incident summary posted within 1 hour; full post-mortem within 1 week

## Authorities & sign-offs
- Recovery plan approved by: human:michael (CEO) — 2026-05-08T15:10Z
- DBA on standby: Sarah Y — 2026-05-08T15:10Z

## Outcome
(To be filled in after completion)
```
