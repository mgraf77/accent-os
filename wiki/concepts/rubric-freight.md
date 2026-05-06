---
type: concept
slug: rubric-freight
title: Rubric: Freight
sources: [source-master]
related: [vendor-scoring, rubric-credit-terms, rubric-returns]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Rubric: Freight (Weight: 8)

Free-freight threshold: the minimum order dollar amount to qualify for free shipping. Lower threshold = cheaper to stock lower-velocity items. Higher threshold forces batch ordering.

## 0–10 Scale

| Score | Free freight threshold |
|-------|----------------------|
| 10 | Free on any order (<$500 threshold) |
| 9 | Free at $500–$749 |
| 8 | Free at $750–$999 |
| 7 | Free at $1,000–$1,499 |
| 6 | Free at $1,500–$1,999 |
| 5 | Free at $2,000–$2,499 (average) |
| 4 | Free at $2,500–$2,999 |
| 3 | Free at $3,000–$3,499 |
| 2 | Free at $3,500–$3,999 |
| 1 | Free at $4,000+ |
| 0 | No free freight — always prepaid or third-party |

## Notes

- RUBRIC_NUMERIC in AccentOS uses `dir: 'lower_better'` for the threshold value.
- Drop-ship programs may have separate freight rules — score the primary stock order path.
- Some vendors offer free freight on select product lines or promotional periods — score the best available for Accent's typical order size.
- Freight adds ~3–8% landed cost when not free; critical for margin on low-margin product.

## Related

[[vendor-scoring]] · [[rubric-returns]] · [[rubric-discounts]]
