# Template — PHASE 3: Failure & Entropy Analysis

**Input:** `02-systems.json`
**Output:** `03-failures.json` (schema: `schemas/03-failures.schema.json`)

For each category, list ≤ 7 concrete failure modes:

```json
{
  "bottlenecks":         [{"where":"…","why":"…","mitigation":"…"}],
  "ambiguity_risks":     [{"surface":"…","ambiguity":"…","fix":"…"}],
  "token_explosions":    [{"surface":"…","trigger":"…","cap":"…"}],
  "orchestration_drift": [{"actor":"…","drift_mode":"…","guardrail":"…"}],
  "governance_gaps":     [{"rule":"…","gap":"…","owner":"…"}],
  "sync_problems":       [{"surface":"…","race":"…","resolution":"…"}],
  "scalability_cliffs":  [{"axis":"…","cliff_at":"…","next_step":"…"}],
  "maintainability":     [{"surface":"…","decay_mode":"…","preventer":"…"}]
}
```

## Rules

- ≤ 7 entries per category. Force prioritization.
- Every entry references a key from `02-systems.json`. Quote it.
- An empty category requires a justification embedded in the most-recently-written
  entry's "why" or equivalent field — or in the assembled handoff's notes.

## Anti-patterns

- "Could go wrong" → which key, which actor, which trigger?
- "Mitigated by good practice" → which rule, enforced by what?
- Identical entries in two categories → pick the most-fitting one and delete the
  duplicate (Ralph pass 1 will catch leftovers).
