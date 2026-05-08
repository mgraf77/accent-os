# Pause State

<!--
Validate against: schemas/state-report.schema.md (variant for pause)
Run evaluator: evaluators/pause-readiness.md
-->

**Schema version:** 1
**Paused at:** [ISO-8601]
**Paused by:** [operator identity]
**Repo:** [repo name]

---

## Repo state at pause

- **Branch:** [branch]
- **HEAD commit:** [hash] "[message]"
- **Working tree:** [clean | dirty-tracked | dirty-untracked | dirty-mixed]
- **WIP commit (if any):** [hash + tag, e.g. wip/2026-05-08/feature-auth]
- **Tag preserving WIP:** `wip/[YYYY-MM-DD]/[branch-or-description]` [or "n/a — no WIP"]
- **Universal validation status at pause:** [passing | failing — list failures]

## Why we stopped

[1-3 sentences. Specific. Examples:
- "Stepping away for a meeting; will resume in ~1h."
- "End of work day; resuming tomorrow morning."
- "Hit a blocker on Foo; need to wait for input from team."]

## What was in flight

<!-- The work that was active at the moment of pause. Be specific. -->

- **What I was doing:** [specific task, file, line numbers]
- **How far I got:** [percentage / specific milestone]
- **What works:** [tests / features / paths that are functional]
- **What doesn't work yet:** [tests / features / paths still broken]

## Next action on resume

<!-- REQUIRED: at least one specific actionable item. The first thing the resuming actor should do. -->

**Next:** [specific action — file, line, command, expected result]

**Then:** [follow-up actions]

## Open decisions / blockers

<!-- Anything that could change direction on resume. -->

- [Decision: what's the question, what are the options]
- [Blocker: what's blocked, on what, by whom]

## Gotchas to remember on resume

<!-- Things that aren't obvious and could trip up future-you. -->

- [Gotcha: description]
- [Failure path: tried X, failed because Y, don't repeat]

## Expected resume window

[Specific date/time, or approximate range, or "unknown".]

## References

- **Audit trail entry:** [path] [line range]
- **Decision log:** [if relevant]
- **Prior pause-state (if continuation of earlier pause):** [path]
