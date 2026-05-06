---
type: module
slug: deal-optimizer
title: Deal Optimizer Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Deal Optimizer Module

**File**: `js/deal_optimizer.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `renderDealOptimizer()`
- `computeDealRecommendations()`
- `getAdaptiveTier()`
- `renderOverview()`
- `getChangeLog()`
- `saveChangeLog()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `dealoptimizer: {t:'...', s:'...'}`
- pages dispatcher: `dealoptimizer` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
