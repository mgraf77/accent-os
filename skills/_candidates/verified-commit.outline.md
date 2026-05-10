# Skill outline (DRAFT — not installed): `verified-commit`

> Status: **candidate**. Not in `_index.md`. Not auto-invoked. Promotion requires Michael review.
> Source pattern: every AccentOS commit currently follows the same pre-commit verification cycle. This skill formalizes that cycle.

## One-line summary
Run a fixed verification cycle before every commit so AccentOS commits never silently break the build.

## Trigger phrases
- "commit this"
- "ship this commit"
- "verified commit"
- "ship + verify"

## When to use
- Any user-facing AccentOS code change (`index.html`, `js/`, worker, SQL migration about to be run by Michael).
- Any commit that touches a multi-file boundary (worker + frontend, SQL + frontend).

## When NOT to use
- Doc-only commits (this is one of those — verify-commit would be overkill).
- WIP / pause-point commits intentionally left mid-flight.

## Companions
- `build-plan-status` — sync BUILD_PLAN markers after a verified commit.
- `doc-drift` — run after the commit if doc surfaces also moved.
- `efficiency-monitor` — silently records retry-loops if the verify steps fail repeatedly.

## Procedure (draft)

1. **Detect commit class** (frontend / worker / sql / docs / mixed).
2. **Hard-stop checks** (skip in doc-only):
   - Branch is not `main`.
   - Working tree dirty matches the diff the user asked for (no stray files).
   - No staged secrets (`.env`, `*.key`, `wrangler.toml` private keys).
3. **Class-specific verify**:
   - Frontend → grep `index.html` for syntax markers (`</script>` count balanced, no orphan `${`).
   - Worker → no edits unless deployment is also planned this turn (otherwise abort with hint).
   - SQL → confirm migration is in `sql/` with verification SELECT at the bottom.
   - Docs → no verify required.
4. **Commit message format**:
   - Conventional prefix (`feat:`, `fix:`, `chore:`, `docs:`, `wip:`).
   - `wip:` only with a pause-point body and a `Resume:` line.
5. **Post-commit**:
   - Print status block (per OPERATING RULES).
   - Append SESSION_LOG entry if non-doc.
   - Update `WORK_IN_PROGRESS.md` to "clean" or to the next discrete step.

## Inputs / outputs

- Inputs: `git status`, current branch, latest commit, conventional message draft.
- Outputs: `git commit` SHA + status block printed to chat.

## Failure modes to encode
- Pre-commit hook fail → DO NOT amend. Fix, re-stage, **new** commit (per CLAUDE.md OPERATING RULES + Git Safety Protocol).
- Mixed worker + frontend in one commit → require explicit ack; the worker proxy bug (commit `2dca2a6`) is the canonical example of why this should be split.
- Commit on `main` → abort and surface "switch to a `claude/` or `feature/` branch first".

## Smallest end-to-end test
On a clean repo with one staged docs change, the skill should:
- detect `class=docs`
- skip frontend/worker/sql verifies
- author a `docs:` commit with proper format
- print the status block

## Promotion checklist (for the morning)
- [ ] Michael reviews outline.
- [ ] Pick a name (`verified-commit` vs `commit-with-verify`).
- [ ] Draft full `SKILL.md` under `skills/verified-commit/SKILL.md`.
- [ ] Add registry entry in `skills/_index.md`.
- [ ] Smoke test on a doc-only commit.
- [ ] Commit live skill in one atomic commit (skill folder + index entry).
