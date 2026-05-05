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

### future-004 — 2026-05-05 — bc-product-sync-audit
- proposed_from: BigCommerce MCP (product CRUD pattern) + table-eda diagnostic shape
- what_it_does: Audits BigCommerce store-cwqiwcjxes ↔ Supabase product data agreement: SKU presence, price drift, inventory mismatch, last-modified gaps.
- why_deferred: Hard-blocked on M04 (BigCommerce API credentials). No BC API access means no audit possible.
- revisit_when: M04 lands (BigCommerce API credentials provisioned).
- pairs_with: table-eda, supabase-sql-magic, schema-contract-tests

### future-005 — 2026-05-05 — klaviyo-segment-builder
- proposed_from: Klaviyo MCP (segments + predictive analytics)
- what_it_does: Builds Klaviyo segment definitions from AccentOS data (top vendors, low-stock buyers, deal-completion patterns). Outputs Klaviyo API JSON + segment-purpose note.
- why_deferred: Hard-blocked on M09 (Klaviyo API key).
- revisit_when: M09 lands (Klaviyo API key provisioned).
- pairs_with: vendor-cascade, supabase-sql-magic, bc-business-review

### future-006 — 2026-05-05 — session-compress
- proposed_from: lean-ctx (history summarization + importance ranking)
- what_it_does: Summarizes the current session's prompt/response history into a compact handoff document — preserving decisions made, files modified, and the next-step queue. Writes to /home/user/accent-os/sessions/handoff-NNN.md.
- why_deferred: Premature without observed session-bloat pain in real use.
- revisit_when: A session hits Claude Code's auto-compaction threshold OR a single session produces >100 PROMPT_LOG entries.
- pairs_with: WORK_IN_PROGRESS.md (resume flow), decision-log

### future-007 — 2026-05-05 — token-audit
- proposed_from: claude-token-lens (per-skill attribution)
- what_it_does: Parses recent session logs for tool-call patterns, attributes token consumption per skill, surfaces top consumers and recommends consolidation.
- why_deferred: No active cost concern surfaced yet. Premature.
- revisit_when: Cost concern surfaces OR after 30+ skill-forge runs in a single billing period.
- pairs_with: session-compress (future-006)

### future-008 — 2026-05-05 — module-registry-audit
- proposed_from: (AccentOS-internal pattern)
- what_it_does: Verifies every js/ module is properly registered: in MODULE_REGISTRY, with sidebar entry, route in index.html, appropriate data-roles attributes. Outputs missing/orphaned modules per role-visibility matrix.
- why_deferred: Only fires during the planned MODULE_REGISTRY refactor on the WIP next-step list.
- revisit_when: MODULE_REGISTRY refactor begins.
- pairs_with: doc-drift, build-plan-status

### future-009 — 2026-05-05 — vendor-review-sentiment
- proposed_from: Yotpo / Stamped (review-data-as-segmentation-signal)
- what_it_does: For each vendor, pulls review-velocity and average-rating signal from a configured review source (Yotpo API, BC native reviews, or Stamped), surfaces vendors with declining review velocity or sub-3.5 avg rating. Feeds vendor-cascade priority "vendor reputation."
- why_deferred: No decision yet on review data source (Yotpo paid? BC native? Stamped?). Build when source is picked.
- revisit_when: Michael picks a review data source for Accent Lighting.
- pairs_with: vendor-cascade, vendor-risk-register

### future-010 — 2026-05-05 — partner-account-map
- proposed_from: Crossbeam / Reveal (partner ecosystem account mapping)
- what_it_does: For each Accent Lighting trade partner (5.5 module), surfaces overlap with the vendor list — "Trade Partner X also reps Vendors A, B, C." Useful for relationship-aware deal sourcing and rep portal scope (6.6).
- why_deferred: Premature without 6.5 (Trade Portal) or 6.6 (Rep Portal) scoped.
- revisit_when: 6.5 or 6.6 scoping begins.
- pairs_with: vendor-cascade, supabase-sql-magic

### future-011 — 2026-05-05 — payout-reconciliation
- proposed_from: BC vendor-payout patterns + accounting reconciliation primitives
- what_it_does: At month-end, generates vendor payout reconciliation: deals completed × commission % vs. AccentOS commission.js records vs. Windward ERP. Surfaces variance with reason codes.
- why_deferred: Depends on commission.js maturity AND Windward integration (M03/M10/M11).
- revisit_when: commission.js stabilizes AND Windward integration lands (M11 + M03).
- pairs_with: js/commission.js, supabase-sql-magic, decision-log

### future-012 — 2026-05-05 — vendor-score-pipeline-tests
- proposed_from: dbt (singular tests + unit tests for transformation logic)
- what_it_does: Generates assertion tests specifically for the vendor_scores compute pipeline: every vendor_id in vendor_scores has a row in vendors; weights per priority sum to 1.0; computed_at within last N days for "active" vendors; score in [0,100].
- why_deferred: AccentOS doesn't yet have a formal vendor_scores compute pipeline (scoring is currently module-internal).
- revisit_when: vendor_scores compute moves to a scheduled job, edge function, or dbt-style transformation pipeline.
- pairs_with: vendor-cascade, schema-contract-tests

---

## Built (graveyard / shipped)

(none yet)
