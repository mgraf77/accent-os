# Idea Intake Template

Copy this block when intaking a new idea. Append it to
`evolution-memory/DEFERRED_EVOLUTION_QUEUE.md` under the appropriate queue heading. Default
queue is **Q3 (Research)** unless evidence and risk justify otherwise.

```
id:            der-XXXX
title:         <one-line idea>
intaked_at:    <YYYY-MM-DD>
intaked_by:    <name | session id>
queue:         <Q1 | Q2 | Q3 | Q4 | Q5>
intent:        <what changes if we did this; ≤ 2 lines>
evidence:      <link to audit / gotcha / session / external; ≤ 2 lines>
risk_class:    <low | medium | high | unsafe>
governance:    <MUTATION_POLICY classes touched, e.g. C4, C6>
prerequisites: <list of der-ids, or 'none'>
re_eval_after: <YYYY-MM-DD>
status:        intaked
```

## Filling Notes
- `id` is monotonic, zero-padded to 4 digits.
- `intent` answers "what changes" — not "what we should explore".
- `evidence` is a pointer, not the evidence itself.
- `risk_class = unsafe` forces queue Q5; never auto-promote.
- `re_eval_after` defaults to: Q1 +7d, Q2 +30d, Q3 +60d, Q4 +180d, Q5 never.

## Forbidden in Intake
- No multi-idea entries. One id, one idea.
- No promises about timing inside the entry body — that's the queue field's job.
- No edits to existing entries through this template; use a new id with `prerequisites`
  pointing at the prior id.
