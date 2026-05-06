---
type: module
slug: warranty
title: Warranty Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Warranty Module

**File**: `js/warranty.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadWarrantyClaims()`
- `sbSaveWarrantyClaim()`
- `sbDeleteWarrantyClaim()`
- `warranty()`
- `renderWarranty()`
- `doBulkWarrantyStatus()`
- `doBulkWarrantyDelete()`
- `openWarrantyEdit()`
- `saveWarranty()`
- `deleteWarrantyConfirm()`
- `sbUpdateWarrantyField()`
- `commitWarrantyCellSelect()`
- `sbBulkSaveWarrantyClaims()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `warranty: {t:'...', s:'...'}`
- pages dispatcher: `warranty` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
