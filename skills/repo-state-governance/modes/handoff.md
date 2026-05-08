# Mode: handoff

## Identity
- **Mode key:** `handoff`
- **Risk tier:** MEDIUM
- **Reversibility:** REVERSIBLE
- **Typical duration:** minutes to hours (the *artifact* persists; the mode itself is transient)
- **Concurrency:** SINGLE_AGENT (one outgoing operator at a time)

## Purpose
Transfer effective ownership of the repo (or a scope within it) from one operator to another. The "operator" can be a human, a specific AI agent (Claude, Codex, ChatGPT), or an automation. Handoff produces a comprehensive state-transfer document so the incoming operator inherits full context, not implicit assumptions.

## Entry Conditions
- Manifest mode is one of: `stabilize`, `pause`, `freeze`, `audit`, `sandbox`
- The outgoing operator is identified
- The incoming operator is named (specific person, agent type, or "any next session" if generic)

## Goals (ordered)
1. Incoming operator can pick up cold and know exactly: what state the repo is in, what was last done, what to do next, what to avoid
2. All non-obvious context (decisions made, paths considered and rejected, gotchas hit, current frustrations) is captured
3. Manifest reflects new ownership
4. Outgoing operator's session is cleanly closeable

## Allowed Actions
- Run audit-readiness evaluator (`evaluators/handoff-completeness.md`)
- Generate handoff report (`templates/handoff.template.md`)
- Update manifest with new operator and new mode
- Append to audit trail
- Commit any captured context (handoff report goes into git so the incoming operator can read it)
- Tag a recovery point (`git tag handoff/[date]/[outgoing]→[incoming]`)
- Update `WORK_IN_PROGRESS.md` (or repo equivalent) with handoff context
- Make any final read-only checks the outgoing operator wants to surface

## Forbidden Actions
- Starting new work
- Hiding ongoing problems ("it'll be fine, they'll figure it out")
- Vague handoff reports ("see git log" is not a handoff)
- Marking incomplete work as complete
- Closing PRs that have outstanding review feedback
- Updating manifest before the handoff report is committed

## Execution Priorities
1. **Write the handoff report first.** Manifest update comes last.
2. **Be honest about state.** If something is broken, say so. If you're not sure why something works, say so.
3. **Capture decisions, not just code.** "We chose approach A because B failed at scale" is more valuable than "we chose A."
4. **Surface gotchas explicitly.** "Don't run `npm install` in the worker/ directory — use `pnpm install` from root" type knowledge.
5. **Define done for the next operator.** What does success look like for them?

## Documentation Requirements
- Handoff report at `.governance/artifacts/[YYYY-MM-DD]-handoff-[outgoing]-to-[incoming].md`
  - Required sections (per `templates/handoff.template.md`):
    - Outgoing operator + dates
    - Incoming operator
    - Current repo state (mode, branch, key files modified)
    - What was just done
    - What's next (ordered list)
    - Open decisions / blockers
    - Gotchas the incoming operator should know
    - Test / build / deploy commands the repo expects
    - Credentials / access notes (file paths only — no secrets in the artifact)
    - Where to find more context (PROMPT_LOG, SESSION_LOG, etc.)
- Audit-trail entry: `[date] [previous-mode] → handoff` with from/to operator names
- Manifest update: `current_mode = "handoff"`, `entered_by = [outgoing]`, `handoff_to = [incoming]`

## Validation Requirements

**Universal:**
- Handoff report exists and validates against `schemas/handoff-report.schema.md`
- All required sections in the report are non-empty
- "What's next" section has ≥1 specific actionable item (not "continue work")
- No secrets / API keys in the report

**Repo-specific:**
- If the repo has a SESSION_LOG.md or equivalent, the most recent entry is closed out properly
- If the repo has skill/role-specific docs, they are referenced in the handoff report

## Completion Criteria
- Handoff report committed to git (so incoming operator can read it on session start)
- Manifest updated
- Audit trail appended
- Handoff readiness evaluator (if run) returned COMPLETE

## Allowed Transitions
- `handoff → (any mode)` — incoming operator inherits and chooses, subject to their own entry conditions

The handoff mode itself is transient. As soon as the incoming operator starts work, they declare a new mode (typically `resume` or `stabilize`).

## Risk Profile

| Risk | Mitigation |
|---|---|
| Handoff report is too vague | Schema requires non-empty fields; evaluator catches incompleteness |
| Incoming operator skips reading the report | Manifest references the report path; protocol-compliant agents read manifest first |
| Outgoing operator forgets a critical gotcha | Handoff template prompts for gotchas explicitly; review before commit |
| Secret leakage into handoff report | Forbidden by validation; agents must reference paths, not contents |
| Handoff target is wrong agent for the work | Handoff report includes "skills required" so target can self-verify fit |
| Two operators briefly hold ownership simultaneously | Manifest atomicity (commit handoff together) prevents split-brain |

## AI Agent Guidance

- **Write for a stranger.** Imagine the incoming operator has never seen this repo. They have not.
- **Capture failure paths.** "I tried X and Y; both failed because of [reason]; Z is what I'd try next" prevents the next operator from repeating the same mistakes.
- **Reference, don't restate.** If a long decision is captured in a `decision-log` artifact, link to it; do not re-summarize.
- **Be specific about the next action.** "Continue work on auth" is wrong. "Run `npm test auth.test.ts:88`; expected to fail with `MockClock undefined`; fix is to import from `test-utils.ts` line 12" is right.
- **Test the handoff mentally.** Before committing, ask: if I lost all session context right now and only had this report, could I continue?
- **Tag the handoff point.** `git tag handoff/[date]/[from]-to-[to]` — gives the incoming operator a stable reference.

## Human-in-the-Loop Touchpoints

- **Required when handing off to a different person:** the human recipient should acknowledge receipt before the outgoing operator considers handoff complete.
- **Required when handing off to an agent type the operator hasn't named:** explicit operator confirmation of the target agent.
- **Recommended:** human reads the handoff report before the incoming agent starts, especially for HIGH-risk subsequent work.
