# Template — PHASE 2: Systems Thinking

**Input:** `01-concept.json`
**Output:** `02-systems.json` (schema: `schemas/02-systems.schema.json`)

Decompose the system into seven dimensions:

```json
{
  "entities":         [{"name":"…","owns":"…","lifecycle":"…"}],
  "orchestration":    [{"trigger":"…","actor":"…","effect":"…","traces_to_goal":"…"}],
  "state":            [{"key":"…","shape":"…","owner":"…","persistence":"ephemeral|session|durable|git|external"}],
  "dependencies":     [{"upstream":"…","downstream":"…","kind":"data|control|time"}],
  "governance":       [{"rule":"…","enforced_by":"…","failure_mode":"…"}],
  "scaling_axes":     [{"axis":"…","current_limit":"…","future_limit":"…"}],
  "interop_surface":  [{"protocol":"…","consumer":"…","format":"…"}]
}
```

## Rules

- Every entity has exactly one owner. No "shared", no "everyone".
- Every orchestration row's `traces_to_goal` quotes a Phase-1 `operational_goals` entry.
- Empty arrays allowed only if Phase 3 explains the absence.

## Anti-patterns

- "The system manages X" → name the entity that owns X.
- Implicit state ("we'll figure persistence out later") → write
  `"persistence": "_unresolved: <reason>"`.
- Cyclic dependencies → split into a control-vs-data direction or fail Phase 2.
