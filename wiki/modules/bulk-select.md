---
type: module
slug: bulk-select
title: Bulk Select Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Bulk Select Module

**File**: `js/bulk_select.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `bulkSelRegister()`
- `bulkSelGetIds()`
- `bulkSelClear()`
- `bulkSelToggle()`
- `bulkSelToggleAll()`
- `bulkSelCheckbox()`
- `bulkSelHeaderCheckbox()`
- `bulkSelBar()`
- `_bulkSelUpdateBar()`
- `bulkSelInvoke()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `bulkselect: {t:'...', s:'...'}`
- pages dispatcher: `bulkselect` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
