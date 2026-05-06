---
type: concept
slug: rubric-demand
title: Rubric: Demand / Brand Awareness
sources: [source-master]
related: [vendor-scoring, rubric-dtc, rubric-web-listing]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Rubric: Demand / Brand Awareness (Weight: 10)

Consumer brand search volume (monthly US searches). Higher brand awareness drives inbound showroom traffic without Accent spending on acquisition.

## 0–10 Scale

| Score | Monthly US searches |
|-------|-------------------|
| 10 | 100K+ (top 1% — Kichler, Progress, Hunter) |
| 9 | 50K–100K |
| 8 | 20K–50K |
| 7 | 10K–20K |
| 6 | 5K–10K |
| 5 | 1K–5K (average for mid-tier brands) |
| 4 | 500–1K |
| 3 | 200–500 |
| 2 | 50–200 |
| 1 | <50 |
| 0 | No measurable search signal |

## Notes

- AccentOS uses `RUBRIC_NUMERIC.demand` with `dir: 'higher_better'` and monthly_searches unit.
- Source data: Google Keyword Planner or SEMrush for brand name + common variant.
- Tied with Rebates for highest weight (both 10) — reflects that consumer pull and financial return are equally critical.
- High demand vendors justify showroom floor space investment even at lower financial scores.
- Brands with strong designer followings (Visual Comfort, Hudson Valley) may undercount on pure search volume — adjust judgment.

## Related

[[vendor-scoring]] · [[rubric-imap]] · [[rubric-dtc]]
