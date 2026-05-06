---
type: concept
title: Vendor Scoring
slug: vendor-scoring
aliases: [vendor-rubric, scoring-system, 14-category-rubric]
sources: [[sources/master]], [[sources/build-intelligence]]
related: [[vendor-tier-eligibility]], [[scoring-missing-data-rule]], [[scoring-curve-bell-distribution]]
cluster: vendor-scoring
cluster_role: hub
confidence: high
contradictions: []
open_questions:
  - "Should scoring weights themselves be tunable per vendor type (commercial vs residential vs hardware)?"
  - "When does a vendor's tier_override expire automatically vs require manual re-justification?"
created: 2026-05-05
updated: 2026-05-05
---

# Vendor Scoring

The 14-category bell-curve rubric AccentOS uses to rank every vendor. Average target = 5; perfect = 10; worst = 0. Higher score = stronger partner. Tier A/B/C eligibility computed off score + sales + activity (see [[vendor-tier-eligibility]]).

## In this cluster

| Category | Weight | Rubric page |
|---|---|---|
| Discount | HIGH | [[rubric-discount]] |
| Freight | HIGH | [[rubric-freight]] |
| Returns Policy | MEDIUM | [[rubric-returns-policy]] |
| Lead Time | MEDIUM | [[rubric-lead-time]] |
| IMAP Enforcement | HIGH | [[rubric-imap-enforcement]] |
| Marketing Funds | MEDIUM | [[rubric-marketing-funds]] |
| Display Allowance | MEDIUM | [[rubric-display-allowance]] |
| Spiff | MEDIUM | [[rubric-spiff]] |
| Web Listing | MEDIUM | [[rubric-web-listing]] |
| DTC / Consumer Direct | HIGH | [[rubric-dtc-consumer-direct]] |
| Consumer Demand | HIGH | [[rubric-consumer-demand]] |
| Rebates | MEDIUM | [[rubric-rebates]] |
| Co-op | MEDIUM | [[rubric-coop]] |
| Rep Score | ADMIN ONLY | [[rubric-rep-score]] (never visible on Rep View — see [[decisions/ADR-003-rep-score-admin-only]]) |

## Cross-cutting rules

- **Missing data rule:** unverified or never asked → score = 0 with `Unverified` flag in UI. See [[scoring-missing-data-rule]].
- **Confirmed absent** → 0 (penalize the gap; don't paper over).
- **Case-by-case** → N/A in that category, score the deal individually in vendor notes.
- **Inactive vendors** → excluded from tier-cutoff calculations.
- **Bell distribution intent:** the average across all vendors should land near 5; if it drifts above 6 or below 4, the rubrics are mis-calibrated, not the vendor population.

## How a vendor gets re-scored

1. Outreach email scaffolded from vendor detail modal (see [[sop-rep-outreach]]).
2. Rep responds; data captured into `vendor_score_states` (state = `verified`) and `vendor_scores` (numeric value).
3. Bulk re-score runs (top 30 web listing rescore, etc.) update many vendors at once — see [[sources/session-log]] entry "2026-05-01 web listing rescore".
4. Score states auto-load on every Vendor Ranking page load via `sbLoadScoreStates` (see [[sb-fetch-pattern]]).

## Open questions

- Whether to weight residential vs commercial vendors differently within the same rubric (e.g. should "Display Allowance" matter less for an internet-only vendor?). Currently uniform weights.
- Whether rubrics should auto-update from `vendor_changelog` deltas (right now they're a static once-per-rep-cycle data set).
