---
type: module
slug: competitive-pricing
title: Competitive Pricing Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Competitive Pricing Module

**File**: `js/competitive_pricing.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadCompetitorPrices()`
- `sbSaveCompetitorPrice()`
- `sbDeleteCompetitorPrice()`
- `competitive()`
- `buildCompetitiveLatest()`
- `positionFor()`
- `renderCompetitive()`
- `openCompetitivePriceEdit()`
- `onCompetitiveSkuPick()`
- `saveCompetitivePrice()`
- `deleteCompetitivePriceConfirm()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `competitivepricing: {t:'...', s:'...'}`
- pages dispatcher: `competitivepricing` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
