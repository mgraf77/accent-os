# Patch Plan Template

Required for any C4–C6 mutation. Save the filled plan to
`audits/patch-plans/<patch-id>.md` before the commit. The commit message must reference
the plan id.

```
patch_id:       patch-XXXX
created_at:     <YYYY-MM-DD>
mode:           <Plan-Then-Execute | Clean Pause Stabilization>
linked_der:     <der-id | none>
class:          <C4 | C5 | C6>

intent:
  <one sentence>

files_touched:
  - <path>      class: <C#>
  - <path>      class: <C#>

reasoning:
  <why now; why this scope; what was rejected>

reversibility:
  command: <single-line revert command>
  side_effects: <deploys, secrets, external systems to re-touch on revert>

verification:
  green_check: <exact command or manual smoke step>
  expected_output: <what 'green' looks like>

risks:
  - <risk 1>
  - <risk 2>          # at least one; "none" is rejected

mutation_risk_score: <0–10 per METRICS_REGISTER M6>
```

## Validation
- A plan failing any required field is rejected by the patch loop.
- A plan touching files outside `files_touched` triggers E8.
- A plan with no risks listed is rejected.

## On Approval
- Plan committed to `audits/patch-plans/` with the same commit as the patch (or in the
  preceding commit; never after the patch).
- Linked DER item (if any) gets status `promoted` in the same commit.
