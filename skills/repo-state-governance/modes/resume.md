# Mode: resume

## Identity
- **Mode key:** `resume`
- **Risk tier:** LOW
- **Reversibility:** REVERSIBLE
- **Typical duration:** minutes (transient mode — quickly transitions to stabilize or active work)
- **Concurrency:** SINGLE_AGENT

## Purpose
Re-enter active work after `pause`, `freeze`, or `handoff`. Resume is intentionally a **transient mode** — its job is to safely re-establish context and validate that nothing has rotted, then transition to `stabilize` or active feature work.

Skipping resume (going straight from pause to active work) is the most common cause of post-pause bugs: the resuming actor missed accumulated drift.

## Entry Conditions
- Manifest mode is one of: `pause`, `handoff`
- A pause-state artifact OR handoff report exists for the current pause/handoff
- The resuming operator has identified themselves (especially after handoff)
- Repo is reachable and not in a recovery situation

## Goals (ordered)
1. Resuming operator has read the pause-state / handoff artifact
2. Drift since pause / handoff is identified (new commits on related branches, dependency updates, schema changes, etc.)
3. The "next action" specified in the artifact is still valid — or, if not, a new next action is documented
4. Resume completes by transitioning to stabilize OR a more specific mode (extraction-prep, deploy-prep, etc.)
5. Audit trail captures the resume event

## Allowed Actions
- Read the pause-state / handoff artifact in full
- Run a lightweight audit (subset of full audit mode — see `workflows/safe-resumption.md`)
- Pull / fetch latest from upstream
- Compare current state vs. expected state at pause time
- Update WORK_IN_PROGRESS.md (or equivalent) with resume context
- Run repo's tests / lint to confirm baseline is intact
- Append to audit trail
- Update manifest to `resume` (transient) then immediately to next target mode

## Forbidden Actions
- Starting new work before reading the pause/handoff artifact
- Skipping the drift check
- Force-pushing to recover from drift (use `recovery` mode if recovery is needed)
- Deleting WIP commits without verifying their content
- Resolving open PRs without reviewing them
- Treating pause/handoff artifact as optional reading

## Execution Priorities
1. **Read first, act second.** No commits before the artifact has been fully read.
2. **Validate the next action.** If the artifact says "fix the integration test in auth.test.ts:88" but auth.test.ts no longer exists, do not fabricate — escalate.
3. **Surface drift explicitly.** If 30 commits landed on main since the pause, that's information the resuming operator needs.
4. **Don't auto-fix drift in resume.** Use stabilize for that. Resume's job is to *report* drift, not *resolve* it.

## Documentation Requirements
- Resume report (often inline as audit-trail entry, optionally also a separate artifact for long pauses) containing:
  - Pause/handoff artifact read: yes/no
  - Drift identified: list of changes since pause
  - Next action: confirmed / revised
  - Validation baseline: tests pass / fail
- Audit-trail entry: `[date] [pause|handoff] → resume → [next-mode]`
- Manifest update reflecting both transitions (resume → next-mode) atomically

## Validation Requirements

**Universal:**
- Pause-state or handoff artifact has been read (operator confirms)
- `git fetch` and a comparison vs. last-known state has been run
- Repo's documented test command still exits 0 (baseline intact)
- The artifact's "next action" has been verified to still apply (or replaced)

**Repo-specific:**
- If repo has resume-on-start hooks (e.g. AccentOS `WORK_IN_PROGRESS.md` resume rule), they have been honored

## Completion Criteria
- Resume report or audit-trail entry written
- Manifest transitioned away from `resume` to the next target mode (stabilize, extraction-prep, etc.)
- No unresolved drift left undocumented

## Allowed Transitions
- `resume → stabilize` — the normal next step
- `resume → audit` — escalation when drift is significant
- `resume → recovery` — escalation when drift broke things
- `resume → (other modes)` — only after passing through stabilize

## Risk Profile

| Risk | Mitigation |
|---|---|
| Resuming actor skips reading the artifact | Validation requires explicit confirmation; agents that skip violate protocol |
| Drift is significant but invisible | Workflow includes audit step; surface accumulated changes |
| "Next action" is stale | Validation requires re-confirmation of next action; revise if invalid |
| Pause was actually a freeze (operator confused modes) | Manifest is authoritative; freeze→resume is forbidden, must go through pause |
| Multiple pause-state artifacts (long pause with intermediate updates) | Use the most recent; audit trail surfaces the chain |
| Resuming actor has different skills than outgoing | Handoff report's "skills required" field surfaces mismatch |

## AI Agent Guidance

- **Read everything first.** Pause-state artifact, last 5 audit-trail entries, last commit messages, any TODOs the prior actor flagged.
- **Trust but verify the artifact.** Take the artifact's "next action" as the starting point, but verify it still applies before acting.
- **Don't perform stabilize work in resume.** If drift requires stabilization, transition to stabilize. Resume is a transit, not a workspace.
- **Be paranoid about partial completion.** If the prior actor's WIP was at 80% complete, don't assume the remaining 20% is what they thought it was — confirm by reading.
- **Surface to operator early.** If anything looks meaningfully different from what the artifact described, surface it before acting.

## Human-in-the-Loop Touchpoints

- **Required after handoff between humans:** human acknowledges they've read the handoff report.
- **Recommended:** for pauses longer than 7 days, surface the drift summary to the operator before continuing.
- **Required override:** if drift is large enough that the artifact's "next action" no longer applies, surface to operator and confirm new direction before acting.
