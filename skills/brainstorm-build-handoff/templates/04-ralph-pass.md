# Template — PHASE 4: Ralph Loop Pass

**Input:** all prior artifacts.
**Output:** `04-ralph-pass-<N>.json` (schema: `schemas/04-ralph-pass.schema.json`)

Three passes, each writes a delta. Earlier artifacts are *never* modified in place.

| Pass | Focus     | What to do                                                       |
|------|-----------|------------------------------------------------------------------|
| 1    | simplify  | remove premature abstractions, collapse near-duplicates          |
| 2    | de-risk   | neutralize the top 5 entries from `03-failures.json`             |
| 3    | unify     | make naming, ordering, and key shapes consistent across phases   |

```json
{
  "pass":             1,
  "focus":            "simplify",
  "removals":         [{"target":"02-systems.entities[3]","reason":"duplicate of [2]"}],
  "merges":           [{"targets":["…","…"],"into":"…","reason":"same lifecycle"}],
  "renames":          [{"from":"…","to":"…","reason":"naming consistency"}],
  "additions":        [{"target":"…","value":"…","reason":"closes ambiguity_risks[1]"}],
  "determinism_wins": [{"surface":"…","before":"<vague>","after":"<concrete>"}],
  "open_issues":      ["<remaining ambiguity to surface in handoff>"]
}
```

## Rules

- ≤ 10 changes per pass. Force prioritization.
- Reference targets by *artifact-key path*: `02-systems.entities[3]`,
  `03-failures.token_explosions[0].cap`.
- Convergence signal: ≤ 2 changes AND `open_issues: []`. Note in handoff.

## Anti-patterns

- Free-form prose in any field — every value is concrete and bounded.
- A pass that touches more than 10 keys — split into multiple passes (pass 4 is
  not allowed; instead, demote items to `defer` in Phase 5).
- Modifying the original artifact in place. Deltas only.
