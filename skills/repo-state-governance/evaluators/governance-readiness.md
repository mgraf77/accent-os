# Evaluator: governance-readiness

## Identity
- **Name:** `governance-readiness`
- **Purpose:** Verify that a planned governance change has the documentation, authorization, and stakeholder coordination in place to proceed.
- **Used by:** `governance-transition` mode, `governance-migration` workflow Phase 4

## Inputs
- Migration report (in progress)
- Identity of authorities required (legal, org admin, etc.)
- Communications plan
- Affected-parties list

## Checklist

### Required (any FAIL → NOT_READY)
- R1. Migration report exists and validates against `schemas/migration-report.schema.md` — pass/fail
- R2. Before-state is documented comprehensively (not "current setup is fine") — pass/fail
- R3. After-state is documented with the same level of detail as before-state — pass/fail
- R4. Affected artifacts are enumerated (not "various files") — pass/fail
- R5. Cutover plan is phased, ordered, with verification per phase — pass/fail
- R6. Affected parties are listed (not "the team") — pass/fail
- R7. Communications plan exists (who, when, how) — pass/fail
- R8. Required authorities are named (specific people / roles, not "leadership") — pass/fail
- R9. Authority sign-offs are recorded (with name + date) for changes that require them — pass/fail/n-a
- R10. Rollback plan addresses each affected artifact — pass/fail
- R11. Verification criteria are testable (not "ensure it works") — pass/fail

### Required for specific transition types

#### License change (any FAIL → NOT_READY)
- L1. Legal sign-off recorded with name + date — pass/fail
- L2. SPDX identifier change documented — pass/fail
- L3. Per-file license headers (if applicable) update path planned — pass/fail/n-a
- L4. Downstream consumers / forks notification plan exists — pass/fail/n-a

#### Org transfer (any FAIL → NOT_READY)
- T1. Source org admin authorization recorded — pass/fail
- T2. Destination org admin authorization recorded — pass/fail
- T3. CI / external integrations re-link plan exists — pass/fail
- T4. Existing redirects / external references update plan exists — pass/fail

#### Branch protection tightening (any FAIL → NOT_READY)
- B1. New required reviewers list is consistent with new CODEOWNERS — pass/fail
- B2. Cutover order ensures CODEOWNERS update precedes protection rule update — pass/fail
- B3. Test PR plan exists to verify new protection works — pass/fail

### Recommended (FAIL → NOT_READY with override option)
- N1. Affected parties pre-notified before cutover (not just post-cutover) — pass/fail
- N2. Grace / soak period defined for the new governance — pass/fail
- N3. Documentation (CONTRIBUTING.md, etc.) drafted to reflect new state — pass/fail
- N4. Migration timeline gives consumers reasonable notice (depends on scope) — pass/fail

### Bonus (FAIL → still READY, but flagged)
- B1. Q&A FAQ drafted for affected parties — pass/fail
- B2. Office-hours / channel established for transition questions — pass/fail
- B3. Post-mortem placeholder created (in case transition reveals issues) — pass/fail

## Scoring

Binary verdict.

```
verdict =
  NOT_READY  if any Required item (R1–R11 + transition-specific) is FAIL
  NOT_READY  if any Recommended item is FAIL and operator did not override
  READY      otherwise
```

## Verdict mapping

| Verdict | Meaning |
|---|---|
| READY | Governance change is safe to execute |
| NOT_READY | Documentation, authorization, or coordination is incomplete |

## Output format

```markdown
## Governance-readiness: [READY | NOT_READY]

**Transition:** [name]
**Migration report:** [path]
**Date:** [ISO-8601]

### Required
- R1: ✓ / ✗ — [item]
- ... (R1–R11)

### Transition-specific (if applicable)
**License change:**
- L1: ✓ / ✗ — [item]
- ...

**Org transfer:**
- T1: ✓ / ✗ — [item]
- ...

**Branch protection:**
- B1: ✓ / ✗ — [item]
- ...

### Recommended (override possible)
- N1: ✓ / ✗ — [item]
- ...

### Bonus (informational)
- B1: ✓ / ✗
- ...

### Blocking failures (if NOT_READY)
- [item-id]: [specific failure + remediation]

### Authority sign-offs recorded
- [authority-role]: [name] — [date]
- ...
```

## Common false-positives / false-negatives

- **False-positive on R8 (authorities named):** "Legal team" is too vague; "Sarah X (legal counsel)" is correct. Hard to fully automate the distinction.
- **False-negative on R11 (verification testable):** Verification criteria like "no contributor complaints" are not directly testable but may be the most meaningful. Surface as a flag rather than fail.
- **False-positive on L1 (legal sign-off):** Sign-off must be from someone with authority to bind the org legally; an engineer's "looks good to me" is not legal sign-off.
