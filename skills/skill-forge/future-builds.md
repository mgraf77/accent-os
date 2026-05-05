# skill-forge future-builds log

Skills that were proposed and deferred. Consulted when Michael wants to pick the next thing to build.

## Schema

```
### future-NNN — YYYY-MM-DD — [skill-name]
- proposed_from: [target name + URL]
- what_it_does: [one sentence]
- why_deferred: [one sentence]
- revisit_when: [explicit trigger condition]
- pairs_with: [related skills if any]
```

NNN is sequential. Add a `built: YYYY-MM-DD` line and strike-through the entry once the skill ships, do not delete — keeps the history of what was considered and when.

---

## Active deferred candidates

### future-001 — 2026-05-05 — vendor-rebalance
- proposed_from: alirezarezvani/claude-skills c-level-advisor/strategic-alignment (realignment protocols)
- what_it_does: Quarterly recommendation for which AccentOS vendors to deprioritize and which to elevate, based on Q-over-Q score deltas and concentration risk against Accent Lighting margin priorities.
- why_deferred: Premature without multi-quarter score history accumulated in the Supabase `vendor_scores` table. Needs at least 3 quarters of computed scores to detect meaningful Q-over-Q deltas.
- revisit_when: vendor_scores table has ≥3 quarters of computed_at history (target: post-Q1 2027 if scoring runs monthly starting now).
- pairs_with: vendor-cascade, vendor-risk-register, priority-articulation

### future-002 — 2026-05-05 — multi-step-analysis
- proposed_from: hex.tech (Notebook Agent / multi-step exec)
- what_it_does: Chain multiple supabase-sql-magic queries with Claude reasoning steps between them — step N reads step N-1's output. Saves the whole chain as an analysis-snapshot artifact.
- why_deferred: Strong concept but ambitious. Needs the simpler diagnostic skills (vendor-clarity-test, doc-drift, table-eda) to be in real use first so we know what multi-step shapes recur.
- revisit_when: After at least 5 analysis-snapshot artifacts have been saved AND a recurring multi-step pattern surfaces in real use.
- pairs_with: supabase-sql-magic, analysis-snapshot, table-eda

### future-003 — 2026-05-05 — chart-from-query
- proposed_from: hex.tech (drag-and-drop visualizations)
- what_it_does: Given a Supabase query result (rows + columns), produces a Chart.js config spec ready to paste into an AccentOS module. Picks chart type (bar/line/pie/scatter) based on data shape; sets colors to AccentOS palette.
- why_deferred: Utility skill that only pays off during active AccentOS module work (build/refactor). The 5 skills shipping in 2026-05-05 batch surface concrete diagnostic problems immediately; chart-from-query is infrastructure waiting for adoption.
- revisit_when: Next round of AccentOS module work begins (e.g. Track 6.x continues or new viz-heavy module added).
- pairs_with: supabase-sql-magic, analysis-snapshot

---

## Built (graveyard / shipped)

(none yet)
