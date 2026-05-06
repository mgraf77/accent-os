---
type: module
slug: inventory-analytics
title: Inventory Analytics Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Inventory Analytics Module

**File**: `js/inventory_analytics.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `renderInventoryAnalytics()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `inventoryanalytics: {t:'...', s:'...'}`
- pages dispatcher: `inventoryanalytics` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
