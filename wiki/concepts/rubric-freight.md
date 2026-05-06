---
type: concept
title: "Rubric · Freight"
slug: rubric-freight
aliases: [freight-rubric, freight-category, ffa]
sources: [[sources/master]], [[sources/seed-corpus-v1]]
related: [[vendor-scoring]], [[rubric-discount]]
cluster: vendor-scoring
cluster_role: member
confidence: high
contradictions: []
open_questions: []
created: 2026-05-05
updated: 2026-05-05
---

# Rubric · Freight

**Weight:** HIGH. **What it measures:** freight cost burden on a typical Accent order.

## Scale

| Score | Meaning |
|---|---|
| **10** | Free freight always, no minimum |
| **8** | Free freight at order minimums Accent regularly hits ($500-$1K) |
| **6** | FFA at $1K-$2.5K |
| **4** | Freight charged on most orders, ~5-8% of order value |
| **2** | Freight charged on every order, 10%+ of order value |
| **0** | Freight charged plus $250+ minimum order |

## Benchmarks (Knowledge Engine reference)

> No min = best (Nicor) · FFA $250+ = good · $1K+ = average

## Compounds with

- [[rubric-discount]] — net effective discount is `discount × (1 - freight%)`. Always compute both before benchmarking.
