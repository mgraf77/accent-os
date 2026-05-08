# Template — PHASE 5: MVP Reduction

**Input:** all prior artifacts (apply Ralph deltas conceptually).
**Output:** `05-mvp.json` (schema: `schemas/05-mvp.schema.json`)

```json
{
  "must_build": [
    {"item":"…","phase_ref":"02-systems.entities[0]","reason":"…"}
  ],
  "defer": [
    {"item":"…","until":"<trigger condition>","reason":"…"}
  ],
  "delete": [
    {"item":"…","reason":"scope creep|speculation|duplicate|premature abstraction"}
  ],
  "future_hooks": [
    {"surface":"…","extension_point":"…","rationale":"…"}
  ],
  "scope_boundary": "<one sentence — the deterministic done-criterion>"
}
```

## Rules

- `must_build` only includes items required for end-to-end usefulness.
- `defer` is the pressure-relief valve. Over-eager additions go here.
- `delete.reason` must be from the fixed enum.
- `scope_boundary` is one sentence. Validator fails on multi-sentence values.

## Anti-patterns

- `must_build` over ~12 items → scope creep, demote.
- `defer.until` = "later" → write a real trigger condition.
- `future_hooks` for systems that don't yet exist → goes in `next_phases` instead.
