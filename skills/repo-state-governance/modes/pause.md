# Mode: pause

## Identity
- **Mode key:** `pause`
- **Risk tier:** LOW
- **Reversibility:** REVERSIBLE
- **Typical duration:** minutes to weeks
- **Concurrency:** SINGLE_AGENT (only one declared owner during pause)

## Purpose
Temporarily halt active work in a way that preserves resumability. Captures enough state that a different agent or session can pick up exactly where this one stopped, with no implicit context.

## Entry Conditions
- Manifest mode is one of: `stabilize`, `sandbox`, `audit`
- Working tree is either clean OR has WIP that has been documented in a pause-state artifact
- No mode is currently mid-transition (no half-applied workflow)

## Goals (ordered)
1. Active work is preserved with enough context to resume
2. Other actors (agents, humans) reading the manifest can clearly see "this is paused, not abandoned"
3. Pause-state artifact captures: what was in flight, why we stopped, what to do first on resume
4. Audit-trail entry written

## Allowed Actions
- Commit any pending WIP under a clearly-marked WIP commit (e.g. `WIP: [reason]`)
- Update WORK_IN_PROGRESS.md (or repo equivalent)
- Generate the pause-state artifact (template at `templates/pause-state.template.md`)
- Update the manifest
- Append to audit trail

## Forbidden Actions
- Starting new features (you're stopping, not starting)
- Refactors
- Schema migrations
- Pushing to protected branches without WIP marker
- Deleting branches that contain in-flight work
- Resolving open PRs (handle them on resume)
- Closing the session without writing the pause-state artifact

## Execution Priorities
1. **Capture state first, then stop.** Do not write the manifest update until the artifact is written.
2. **Be specific in the artifact.** "Working on auth" is useless. "Started extracting `validateToken` from `auth.ts:42` into a util; tests at `auth.test.ts:88` already updated; integration test still failing because mock setup needs `MockClock` from `test-utils.ts`" is correct.
3. **Capture the *next action*.** The first thing the resuming actor should do.

## Documentation Requirements
- Pause-state artifact at `.governance/artifacts/[YYYY-MM-DD]-pause-state.md` (template: `templates/pause-state.template.md`)
- Audit-trail entry: `[date] [previous-mode] → pause` with reason
- Manifest fields: `current_mode = "pause"`, `entered_at`, `entered_by`, `next_allowed_transitions = ["resume", "handoff", "freeze"]`

## Validation Requirements

**Universal:**
- Pause-state artifact exists and validates against `schemas/state-report.schema.md`
- Pause-state artifact has a non-empty "next action on resume" field
- WIP (if any) is committed under a clearly-marked WIP commit OR fully described in the pause-state artifact

**Repo-specific:**
- If the repo has a `WORK_IN_PROGRESS.md` convention, it is updated

## Completion Criteria
- Pause-state artifact written and valid
- Manifest updated to `pause`
- Audit trail appended
- No mid-transition workflows still pending

## Allowed Transitions
- `pause → resume` — via safe-resumption workflow (passes through audit)
- `pause → handoff` — transferring to a different agent / human
- `pause → freeze` — escalating to a hard stop (e.g. extended absence)

**Not allowed:**
- `pause → stabilize` directly (use resume workflow instead — it includes an audit step that catches drift accumulated during the pause)

## Risk Profile

| Risk | Mitigation |
|---|---|
| Pause-state artifact is too vague to resume from | Validation requires non-empty "next action"; review on entry |
| WIP rots while paused (other branches advance, conflicts accumulate) | safe-resumption workflow includes audit step that surfaces drift |
| Operator forgets they paused; another agent assumes active work | Manifest is the single source of truth; agents must read it on session start |
| WIP commit's branch gets force-deleted | Document the branch name in the pause-state artifact; consider tagging |
| Pause becomes de-facto abandonment | Audit trail surfaces "paused for 30+ days" → recommend transition to freeze |

## AI Agent Guidance

- **Be paranoid about resumability.** When you write the pause-state artifact, imagine a different agent (different model, no context) reading it cold. Would they know what to do?
- **Capture mental state, not just code state.** "Tests passing" is code state. "Stuck on whether to use approach A or B because of [tradeoff]" is mental state. Both belong in the artifact.
- **Don't compress.** Verbose is better than terse here. Tokens are cheap; lost context is expensive.
- **Tag, don't just commit.** If you commit a WIP, also tag it (`git tag wip/[date]/[branch]`) so cleanup never accidentally deletes the recovery point.
- **Use the template.** It exists for a reason; do not skip sections.

## Human-in-the-Loop Touchpoints

- **Required:** none — pause is low-risk.
- **Recommended:** if pause is requested mid-WIP, surface "I'll capture the WIP in the pause-state artifact — confirm you want to stop now vs. finish the current sub-task first."
- **Required override:** if pausing into a state where validation would not pass (e.g. broken tests), surface that explicitly — operator may want recovery instead.
