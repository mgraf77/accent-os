# Template — PHASE 6: Build Plan Generation

**Input:** `05-mvp.json` + `02-systems.json`.
**Output:** `06-build-plan.json` (schema: `schemas/06-build-plan.schema.json`)

```json
{
  "directory_structure": [
    {"path":"…","purpose":"…"}
  ],
  "schemas": [
    {"name":"…","owner_phase":"P1","format":"json-schema|yaml|markdown|typescript|none"}
  ],
  "implementation_phases": [
    {"id":"P1","title":"…","outputs":["…"],"depends_on":[],"validation":"…"}
  ],
  "validation_gates": [
    {"gate":"…","applies_to":"…","passes_if":"…"}
  ],
  "operating_rules": ["…"],
  "next_phases": [
    {"trigger":"…","scope":"…"}
  ]
}
```

## Rules

- `implementation_phases` form a DAG. Validator rejects cycles.
- Every phase has ≥ 1 validation gate.
- `next_phases` are *outside* MVP — they document the scaling path.

## Anti-patterns

- Phases ordered by hope, not dependency. Use `depends_on` honestly.
- Validation gates expressed as "passes_if it works" → write a measurable condition.
- `next_phases` doubling as a wishlist — only items with concrete triggers.
