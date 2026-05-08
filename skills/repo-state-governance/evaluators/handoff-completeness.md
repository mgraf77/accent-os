# Evaluator: handoff-completeness

## Identity
- **Name:** `handoff-completeness`
- **Purpose:** Verify that a handoff report contains enough context that an incoming operator (different agent / human) can pick up cold and continue work without unknowns.
- **Used by:** `handoff` mode, `ai-handoff` workflow Phase 2

## Inputs
- Handoff report (in progress or finished)
- Manifest's recent state (last 5 transitions)
- Outgoing operator's recent activity (git log, audit trail entries)

## Checklist

### Category I — Identity & dates (any FAIL → INCOMPLETE)
- I1. Outgoing operator named (specific, not "previous session") — pass/fail
- I2. Incoming operator named (specific person, agent type, or "next session of [agent]") — pass/fail
- I3. Handoff date / timestamp recorded — pass/fail
- I4. Date / timestamp of outgoing operator's last meaningful action recorded — pass/fail

### Category S — Repo state snapshot (any FAIL → INCOMPLETE)
- S1. Current manifest mode is recorded — pass/fail
- S2. Current branch is recorded — pass/fail
- S3. Last commit hash + message is recorded — pass/fail
- S4. Working tree status (clean / WIP) is recorded — pass/fail
- S5. Tagged handoff point exists (`handoff/[date]/[from]-to-[to]`) — pass/fail

### Category W — What was done (any FAIL → INCOMPLETE)
- W1. Last 3–10 meaningful actions are listed (commits / decisions / findings) — pass/fail
- W2. The "headline result" of the outgoing session is captured (what got done overall) — pass/fail
- W3. References to longer artifacts (PROMPT_LOG, SESSION_LOG, decision-log) are linked — pass/fail/n-a

### Category N — What's next (any FAIL → INCOMPLETE)
- N1. "What's next" has at least one concrete actionable item — pass/fail
- N2. Items are ordered by priority — pass/fail
- N3. Each item has enough specificity that incoming operator could start without questions — pass/fail
- N4. Open decisions / blockers are listed separately from "what's next" — pass/fail

### Category G — Gotchas (any FAIL → INCOMPLETE)
- G1. Section for gotchas exists (even if empty, marked "no known gotchas") — pass/fail
- G2. If gotchas listed, each has: what the gotcha is, why it matters, how to avoid — pass/fail/n-a
- G3. Failure paths the outgoing operator already tried are listed (so incoming doesn't repeat) — pass/fail/n-a

### Category C — Commands & access (any FAIL → INCOMPLETE)
- C1. Test command is documented (verbatim) — pass/fail
- C2. Build / lint / type-check commands are documented — pass/fail
- C3. Deploy / publish command is documented (or "n/a — not deploying this branch") — pass/fail
- C4. Credentials / access notes use file paths only, not secret values — pass/fail
- C5. Required tooling (specific versions of node, python, etc.) is documented — pass/fail/n-a

### Category R — Risk (any FAIL → INCOMPLETE)
- R1. Outstanding risks / known issues are listed — pass/fail
- R2. Skills required of the incoming operator are listed (so target can self-verify fit) — pass/fail
- R3. Time-sensitive items are flagged (e.g. "must merge by [date]") — pass/fail/n-a

### Category Q — Quality (FAIL → flagged but not blocking)
- Q1. Report length is appropriate (long enough to be complete; short enough to be readable) — pass/fail (judgment)
- Q2. Language is clear (no internal-only jargon without explanation) — pass/fail (judgment)
- Q3. No secrets / API keys / passwords in the report — pass/fail (REQUIRED — secrets failure is INCOMPLETE)

## Scoring

Binary verdict.

```
verdict =
  INCOMPLETE  if any Required item is FAIL
  INCOMPLETE  if Q3 (no secrets) is FAIL — special case, secrets are blocking
  COMPLETE    otherwise
```

Q1 and Q2 are quality flags; they surface but do not block.

## Verdict mapping

| Verdict | Meaning |
|---|---|
| COMPLETE | Handoff report is sufficient for cold pickup |
| INCOMPLETE | Report missing required context; incoming operator will have unknowns |

## Output format

```markdown
## Handoff-completeness: [COMPLETE | INCOMPLETE]

**Outgoing → Incoming:** [outgoing] → [incoming]
**Handoff report:** [path]
**Date:** [ISO-8601]

### Category I — Identity & dates
- I1: ✓ / ✗ — [item]
- ...

### Category S — Repo state snapshot
- ...

### Category W — What was done
- ...

### Category N — What's next
- ...

### Category G — Gotchas
- ...

### Category C — Commands & access
- ...

### Category R — Risk
- ...

### Category Q — Quality (informational)
- Q1: ✓ / ✗ — [item]
- ...

### Blocking failures (if INCOMPLETE)
- [category-id] [item-id]: [item] — [specific gap + remediation]

### Quality flags (informational)
- Q1: [if flagged]
- Q2: [if flagged]

### What this rubric does NOT check
- Whether the handoff target is the right operator for the work (that's an operator decision)
- Whether the outgoing operator's work was high-quality (separate audit concern)
- Whether the incoming operator will actually read the report (cannot be enforced; protocol-compliant agents read manifest first)
```

## Common false-positives / false-negatives

- **False-negative on N3 (specificity):** "Continue refactoring auth" is not specific. "In `auth.ts:88`, finish extracting `validateToken` into `utils/token.ts`; tests at `auth.test.ts:42` already updated; mock import needs `MockClock` from `test-utils.ts:12`" is specific. Hard to fully automate this distinction.
- **False-positive on C4 (no secrets):** A regex / scanner can catch obvious secrets but may miss novel formats. Human review of the report before commit is wise.
- **False-positive on G2 (gotchas have all 3 fields):** Some gotchas are short ("don't run npm install in `worker/`") and don't need long explanations. Use judgment.
