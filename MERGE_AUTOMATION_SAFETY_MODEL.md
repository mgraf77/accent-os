# MERGE_AUTOMATION_SAFETY_MODEL

**Purpose:** define the safety envelope inside which an autonomous
session may merge a sidecar without human review.

**Authority:** advisory. Until a future session promotes this to a
hook-enforced policy, every sidecar merge still requires explicit
session-prompt authorization.

## Tiers

### Tier 0 — fully autonomous merge (no human ack)

Permitted iff ALL of:

1. Diff is **doc-only** (`*.md`, `docs/**`).
2. No file deletions.
3. No edits to `index.html`, `*.sql`, `wrangler.toml`, `worker/**`,
   `js/signals_*.js`, `.orchestration/**`, `module_modes.json`.
4. CI / `scripts/status.sh` / `scripts/check-runtime-wiring.sh` all pass
   on the rebased branch.
5. Author is `claude/*` or `codex/*` and PR has no human review request.

### Tier 1 — autonomous merge with notification (no human ack required)

Permitted iff ALL of:

1. Diff is **scripts + docs** (`scripts/**`, `docs/**`, `*.md`).
2. New script files only (no edits to existing scripts other than
   `scripts/status.sh` additive blocks).
3. All checks in Tier 0 #4 pass.
4. The branch is **not** in `OBSOLETE_BRANCH_REGISTRY.md`'s
   ACTIVE-RECONCILE list.
5. The session emits a notification line to `SESSION_LOG.md`.

### Tier 2 — requires human ack

ANY of:

- Edits to `js/signals_*.js` (including additive).
- Edits to `index.html` `<script>` block.
- New SQL files or edits to existing SQL.
- New globals on `window` (other than the SIGNAL_* / __SIGNAL_*
  namespace, which are pre-approved).
- Changes to `worker/**`, `wrangler.toml`, secrets management.
- Anything labeled FORBIDDEN in the session doctrine.

### Tier 3 — categorically forbidden

- Force pushes to `main`.
- Branch deletions of named-protected branches (`main`,
  `accent-work`).
- Skipping commit hooks (`--no-verify`).
- Modifying CI/CD config without explicit Michael ack.
- Squashing or amending merged commits.
- Anything that bypasses signing.

## Pre-merge checklist (any Tier)

Before any sidecar merge an autonomous session must:

1. `git fetch origin --prune` and confirm `main` SHA matches expectation.
2. Rebase the sidecar onto `main` in a worktree.
3. Run `bash scripts/check-runtime-wiring.sh` — must pass.
4. Run `bash scripts/check-runtime-health.sh` — must pass.
5. Run `bash scripts/check-runtime-replay.sh` — must pass.
6. Run `bash scripts/check-dead-letter-health.sh` — must pass.
7. Run `bash scripts/check-pricing-runtime-path.sh` — must pass.
8. Confirm no new `<script>` tag in `index.html` outside the
   pre-approved namespace.
9. Confirm no new file at `js/signals.js` (forbidden name).
10. Append a SESSION_LOG entry.

If any check fails, the merge is aborted and the failure recorded in
`SESSION_LOG.md` + `RUNTIME_CONFLICT_RESOLUTION_NOTES.md`.

## Rollback policy

Every autonomous merge must be **single-commit-revertable**. If the
sidecar is multi-commit, squash to one merge commit OR cherry-pick to
one new commit before merging. This guarantees `git revert <sha>` is the
emergency stop.

## Open questions for Michael

1. Is Tier 0 (fully autonomous doc-only merge) acceptable, or should
   every sidecar merge require explicit ack?
2. Is the SIGNAL_* / __SIGNAL_* namespace pre-approval acceptable?
3. Should "OBSOLETE_BRANCH_REGISTRY ACTIVE-RECONCILE" branches be
   blocked from auto-merge entirely?

This document is conservative by default. No Tier-0 / Tier-1 merges will
occur until Michael explicitly authorizes the policy.
