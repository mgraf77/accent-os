# Template — PHASE 1: Concept Extraction

**Input:** `artifacts/<slug>/00-raw.md`
**Output:** `artifacts/<slug>/01-concept.json` (schema: `schemas/01-concept.schema.json`)

## Prompt contract

Read the raw input and extract, in this exact key order:

```json
{
  "true_objective":      "<single sentence — the system's reason to exist>",
  "system_category":     "<workflow|orchestration|agent|infra|schema|tool>",
  "primary_executor":    "<claude-code|codex|engineer|autonomous-agent|mixed>",
  "operational_goals":   ["<verb-noun bullet>"],
  "implied_workflows":   ["<actor → action → effect>"],
  "hidden_assumptions":  ["<assumption being made implicitly>"],
  "constraints":         ["<hard limit — token, time, cost, infra>"],
  "non_goals":           ["<thing this is explicitly NOT>"]
}
```

## Rules

- Every key required. If unknowable, write `"_unresolved": "<reason>"`.
- `true_objective` is one sentence — not a paragraph.
- `non_goals` ≥ 1 entry. Force a scoping decision.
- Do not invent constraints. If none stated, say so.

## Anti-patterns

- "Various stakeholders need…" → name them, or write `_unresolved`.
- "Etc." in any list → enumerate or stop.
- Multi-sentence `true_objective` → compress.
- Empty `non_goals` → fail Phase 1 and re-run.
