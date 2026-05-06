---
type: concept
title: "Rubric · Discount"
slug: rubric-discount
aliases: [discount-category, discount-rubric]
sources: [[sources/master]], [[sources/seed-corpus-v1]]
related: [[vendor-scoring]], [[rubric-freight]], [[rubric-rebates]], [[rubric-spiff]]
cluster: vendor-scoring
cluster_role: member
confidence: high
contradictions: []
open_questions: []
created: 2026-05-05
updated: 2026-05-05
---

# Rubric · Discount

**Weight:** HIGH. **What it measures:** standard discount off MSRP available to Accent Lighting on a typical order.

## Scale

| Score | Meaning |
|---|---|
| **10** | ≥50% off MSRP, consistent across all SKUs and order sizes |
| **8** | 40–49% off, consistent |
| **6** | 30–39% off OR 40%+ but inconsistent (depends on order size or product line) |
| **4** | 20–29% off |
| **2** | 10–19% off OR significant tier-gating where Accent rarely qualifies |
| **0** | No discount, full list, or absent program |

## Rules

- **Missing / unverified:** score = 0 with `Unverified` flag (see [[scoring-missing-data-rule]]).
- **Confirmed absent:** 0 (penalize the gap; don't paper over).
- **Case-by-case discount:** N/A in this category — score case-by-case in vendor notes.

## Compounds with

- [[rubric-freight]] — a 50% discount with 10% freight is effectively 45% net. Capture both before negotiating.
- [[rubric-rebates]] — rebates often gate higher discount tier eligibility.
- [[rubric-spiff]] — separate dimension; do not double-count.
