# Mode: stabilize

## Identity
- **Mode key:** `stabilize`
- **Risk tier:** LOW
- **Reversibility:** REVERSIBLE
- **Typical duration:** minutes to hours
- **Concurrency:** MULTI_AGENT_OK (with file-level coordination)

## Purpose
Bring the repository to a clean, low-entropy steady state: tests passing, lint clean, no in-flight WIP, docs aligned with code. This is the **default healthy state** that most other transitions pass through.

## Entry Conditions
- Repo is reachable and not corrupted
- Working tree is git-tracked (uncommitted changes are allowed, will be addressed during the mode)
- Operator has commit/push rights (or accepts that artifacts will remain local)
- No active `freeze` mode (must exit freeze first)

## Goals (ordered)
1. All committed code passes the repo's existing test suite
2. All committed code passes the repo's existing linter / type checker
3. Working tree is either clean (no uncommitted changes) OR uncommitted changes are deliberate and tracked in a WIP doc
4. Documentation references match current code (no broken file paths, no references to removed APIs)
5. Audit trail entry exists for the transition into stabilize

## Allowed Actions
- Run tests, lints, type checks
- Commit fixes that resolve test / lint / type failures
- Commit doc updates that resolve drift
- Refactor for clarity if it does not change behavior (code-equivalent only)
- Update dependency lockfiles if they are out of sync with manifests
- Reorganize files only when reorganization is reverting a known mistake (not for new structure)

## Forbidden Actions
- Adding new features
- Changing public APIs
- Adding new dependencies
- Schema migrations
- Deleting tests (even ones that look stale — flag them, do not delete)
- Force-pushing
- Rewriting git history
- Disabling CI checks
- Suppressing warnings to make them "pass"

## Execution Priorities
1. **Stop the bleeding.** If tests are failing, fix the failure before improving anything else.
2. **Don't expand scope.** If a fix tempts you into a refactor, log the refactor idea in a TODO and only fix the original issue.
3. **Smaller commits over larger ones.** One logical fix per commit so reverts are surgical.
4. **Re-run the full check suite after each commit.** Avoid cumulative regression.

## Documentation Requirements
- Audit-trail entry: `[date] active → stabilize` with reason
- If WIP is left uncommitted: `WORK_IN_PROGRESS.md` (or repo's equivalent) describing what's mid-flight
- If new TODOs were noted: appended to the repo's existing TODO/backlog file

## Validation Requirements

**Universal (always required):**
- `git status --porcelain` matches the WIP doc (or is empty)
- The repo's documented test command exits 0
- The repo's documented lint command exits 0

**Language-specific (required if applicable):**
- TypeScript / Flow: type check exits 0
- Python: mypy / pyright exits 0 if configured
- Rust: `cargo clippy -- -D warnings` exits 0 if configured

**Repo-specific (per manifest):**
- Defined in `repo-manifest.json` `validation.repo_specific` field

## Completion Criteria
- All Validation Requirements pass
- Goals 1–5 are satisfied
- Audit-trail entry written
- Manifest updated with `current_mode = "stabilize"` and clean timestamp

## Allowed Transitions
- `stabilize → pause` — operator stepping away
- `stabilize → freeze` — pre-deploy lockdown
- `stabilize → deploy-prep` — preparing to ship
- `stabilize → extraction-prep` — preparing to split
- `stabilize → governance-transition` — migrating ownership rules
- `stabilize → handoff` — transferring to another agent / human
- `stabilize → audit` — read-only inspection
- `stabilize → sandbox` — branching off for experiments
- `stabilize → recovery` — only if stabilize uncovered brokenness it cannot fix

## Risk Profile

| Risk | Mitigation |
|---|---|
| Stabilize work expands into feature work | Hard rule: forbidden-action enforcement; log scope creep as a separate decision |
| "Drive-by" refactors create new bugs | Refactor only when reverting a known mistake; otherwise log the idea |
| Test suite has flaky tests masking real issues | Flag flaky tests in the audit trail; do not silence them; surface to operator |
| Linter rules are wrong, not the code | Surface to operator; do not weaken linter as a workaround |
| Multi-agent: two agents fix the same thing differently | Coordinate via git; prefer smaller, faster commits to expose conflicts early |

## AI Agent Guidance

- **Default scope is small.** A stabilize pass is not a refactor; if you are tempted to "while I'm here," stop.
- **Commit each fix individually.** Easier to revert; easier for a reviewing agent to read.
- **Use existing skills first.** If the repo has a doc-drift skill, run it. If it has a build-plan-status skill, run it. Don't reinvent.
- **Surface, don't hide.** A flaky test is information; a suppressed warning is debt. Always surface, never hide.
- **End with a state report.** Even if no commits were needed, write the audit-trail entry confirming the repo is stable.

## Human-in-the-Loop Touchpoints

- **Required:** none — stabilize is low-risk and reversible.
- **Recommended:** if you uncover a non-trivial issue (broken external integration, missing credential, schema drift), pause and surface to the operator before fixing autonomously.
- **Required override:** if a forbidden action becomes necessary (e.g. a "fix" requires changing a public API), exit stabilize first and re-enter via the appropriate mode.
