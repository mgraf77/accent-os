---
type: concept
slug: vendor-scoring
title: Vendor Scoring System Hub
sources: [source-master]
related: [rubric-rebates, rubric-discounts, rubric-credit-terms, rubric-freight, rubric-returns, rubric-imap, rubric-marketing-funds, rubric-display, rubric-lights-america, rubric-web-listing, rubric-rep-score, rubric-dtc, rubric-l1-member, rubric-demand, ADR-005]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Vendor Scoring System

Accent Lighting scores every vendor on a 14-category, 0–10 rubric. The weighted sum produces a single score used to rank vendors, gate co-op spend, prioritize showroom space, and route sales reps.

## Category weights (live in AccentOS)

**Financial Terms** (weights in parentheses):

| Category | Weight | Key rubric |
|----------|--------|-----------|
| Rebates | 10 | ≥6% = 10; 0% = 0 |
| Discounts | 8 | ≥20% = 10; 0% = 0 |
| Credit Terms | 6 | Net 120+ = 10; No credit = 0 |
| Freight | 8 | Free <$500 = 10; No free freight = 0 |
| Returns/RGA | 7 | Free returns <7d = 10; None = 0 |
| IMAP/Markup | 8 | 2.5× = 10; No IMAP = 0 |

**Sales, Marketing & Market Position**:

| Category | Weight | Key rubric |
|----------|--------|-----------|
| Marketing Funds | 7 | MDF + assets + cobrand = up to 10 |
| Display Program | 6 | Discount + promos + buyback = up to 10 |
| Lights America | 5 | Binary: on = 10; off = 0 |
| Web Listing | 4 | Featured dealer = 10; not on site = 0 |
| Rep Score | 8 | Proactive full support = 10; no rep = 0 |
| DTC | 7 | No DTC + refers to Accent = 10; sells DTC = 0 |
| L1 Member | 6 | Lighting One member = 10; not = 0 |
| Demand | 10 | 100K+ monthly searches = 10; 0 = 0 |

Total weight: 100 (weights are percentages in the weighted sum).

## Scoring formula

`weightedScore = Σ(score_i × weight_i) / Σ(weight_i)`

Each category score is 0–10. The weighted average is the vendor's final score.

## Tier system (adaptive)

Tiers are computed from the live score distribution:
- **S-tier**: top 10% of scored vendors
- **A-tier**: 10–30%
- **B-tier**: 30–60%
- **C-tier**: 60–80%
- **D-tier**: bottom 20%

Tier boundaries recalculate as new scores are added.

## Score states

Each category can be: `scored | unverified | needs_review | n/a`

Data state tracked in `vendor_score_states` Supabase table.

## Usage in AccentOS

- Vendor Ranking page: primary sort + tier grouping
- Daily Brief: surfaces low-scoring key vendors
- Deal Optimizer: flags vendors below score threshold
- Co-op tracker: gates spend recommendations
- Rep Outreach: prioritizes outreach queue

## Related rubric pages

[[rubric-rebates]] · [[rubric-discounts]] · [[rubric-credit-terms]] · [[rubric-freight]] · [[rubric-returns]] · [[rubric-imap]] · [[rubric-marketing-funds]] · [[rubric-display]] · [[rubric-lights-america]] · [[rubric-web-listing]] · [[rubric-rep-score]] · [[rubric-dtc]] · [[rubric-l1-member]] · [[rubric-demand]]
