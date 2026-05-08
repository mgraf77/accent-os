# Evaluator: pause-readiness

## Identity
- **Name:** `pause-readiness`
- **Purpose:** Determine whether the repo can be paused cleanly — i.e. whether enough state has been captured that a future operator (same or different) can resume without unknowns.
- **Used by:** `clean-pause` workflow (Phase 2), `pause` mode (Validation Requirements)

## Inputs
- Current working tree state (`git status`)
- Pause-state artifact (if drafted)
- Last 5 commits + last 24h of audit trail
- Open PRs / branches with unique work

## Checklist

### Required (any FAIL → NOT_READY)
- R1. Working tree is clean OR uncommitted changes are documented in the pause-state artifact — pass/fail
- R2. Pause-state artifact exists at the expected path — pass/fail
- R3. Pause-state artifact's "next action on resume" field is non-empty and specific — pass/fail
- R4. Pause-state artifact references current branch and last commit hash — pass/fail
- R5. No mode transition is mid-flight (manifest is consistent, not "pending") — pass/fail
- R6. WIP commits (if any) are tagged with a recoverable name (`wip/[date]/...`) OR fully described in the artifact — pass/fail

### Recommended (FAIL → NOT_READY with override option)
- N1. Test suite has been run within the last 30 minutes (so resuming operator inherits a known baseline) — pass/fail
- N2. Open PRs that touch in-flight work are noted in the pause-state artifact — pass/fail
- N3. Time-of-day / time-zone of pause is recorded (helps cross-time-zone handoffs) — pass/fail
- N4. Expected resume window is noted (specific or approximate) — pass/fail

### Bonus (FAIL → still READY, but flagged)
- B1. A "first thing on resume" command is included verbatim (`git fetch && npm test auth.test.ts:88`) — pass/fail
- B2. Known gotchas are listed explicitly — pass/fail
- B3. Decisions made in this session that affect resume are listed (or linked) — pass/fail

## Scoring

Binary verdict, not a score.

```
verdict =
  NOT_READY  if any Required item is FAIL
  NOT_READY  if any Recommended item is FAIL and operator did not override
  READY      otherwise
```

Override: operator can declare "ready anyway" for a Recommended-only failure; the audit trail records the override.

## Verdict mapping

| Verdict | Meaning |
|---|---|
| READY | Pause is safe; resume will be smooth |
| NOT_READY | Pause should not proceed without addressing failures |

## Output format

```markdown
## Pause-readiness: [READY | NOT_READY]

**Pause-state artifact:** [path or "missing"]
**Date:** [ISO-8601]

### Required (must pass)
- R1: ✓ / ✗ — [item]
- R2: ✓ / ✗ — [item]
- R3: ✓ / ✗ — [item]
- R4: ✓ / ✗ — [item]
- R5: ✓ / ✗ — [item]
- R6: ✓ / ✗ — [item]

### Recommended (override possible)
- N1: ✓ / ✗ — [item]
- N2: ✓ / ✗ — [item]
- N3: ✓ / ✗ — [item]
- N4: ✓ / ✗ — [item]

### Bonus (informational)
- B1: ✓ / ✗
- B2: ✓ / ✗
- B3: ✓ / ✗

### Blocking failures (if NOT_READY)
- [item-id]: [specific failure + remediation suggestion]

### Notes
- [Any flagged-but-not-blocking issues]
```

## Common false-positives / false-negatives

- **False-negative on R3 (next action specific):** Hard to automate "specific enough" — a human-readable heuristic is "could a different agent take this action without questions?" Surface to operator if uncertain.
- **False-positive on R1 (working tree clean):** A clean working tree is good but doesn't mean WIP isn't lurking elsewhere — check stashes, other branches, untracked files explicitly.
