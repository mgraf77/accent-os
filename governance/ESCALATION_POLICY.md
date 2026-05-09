# ESCALATION POLICY

## Purpose
Defines when work must stop and surface to the human, what evidence to provide, and how
to resume after resolution.

## Escalation Triggers (any one)
- E1. Risk severity ≥ HIGH with no mitigation in flight.
- E2. RCI < 1.0 across two consecutive checkpoints.
- E3. Governance lag > 7 days (a queued idea or audit finding has not been routed).
- E4. Three consecutive auto-revert events in a cycle (see AUTO_FIX_POLICY strike rule).
- E5. Any C7 hard-stop hit (see SAFETY_HARD_STOPS).
- E6. Architectural drift detected (see GOTCHA_REGISTER `arch-drift`).
- E7. Two-truth divergence: CANONICAL_RUNTIME_STATE disagrees with WORK_IN_PROGRESS or
     BUILD_PLAN in a non-reconcilable way.
- E8. A patch plan touches a file outside its declared scope.
- E9. The DER `unsafe/forbidden` queue receives a re-submission.
- E10. Continuous gap analysis flags the same gap 3+ times unresolved.

## Required Escalation Output
A single block written to `audits/AUDIT_LOG.md` and surfaced to the human:
```
ESCALATION <id>
trigger:    <E1..E10>
context:    <one paragraph; what was happening>
state:      <pointer to checkpoint id>
options:    <2–4 bullets, with reversibility noted>
recommend:  <one option, with reasoning>
blocked:    <list of work paused pending resolution>
```

## Behavior While Escalated
- Mode forced to Passive Audit until human resolves.
- No C3+ mutations may proceed.
- DER intake remains open; ideas may still be captured.
- Audit and gotcha registers may still receive C1 appends.

## Resolution Recording
- Human decision recorded in `audits/AUDIT_LOG.md` linked to the escalation id.
- If resolution mutates governance, that follows MUTATION_POLICY C5.
- A delta entry records the escalation lifecycle in `RUNTIME_DELTA_REPORT.md`.

## Time Budget
- Escalations should resolve within 1 cycle (default ISO week).
- Unresolved escalations roll forward and themselves become a HIGH risk in ACTIVE_RISKS.

## Anti-Pattern
Do not "auto-resolve" an escalation by lowering severity, redefining scope, or moving the
trigger threshold without recording the change as a C5 governance edit.
