---
type: module
slug: bulk-vendor-ops
title: Bulk Vendor Ops Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Bulk Vendor Ops Module

**File**: `js/bulk_vendor_ops.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `renderBulkVendorOps()`
- `bvToggle()`
- `bvToggleAllVisible()`
- `bvSelectAllFiltered()`
- `bvClearSelection()`
- `bvAction()`
- `bvApplyRep()`
- `bvApplyRepRaw()`
- `bvApplyTier()`
- `bvApplyInactive()`
- `bvApplyParent()`
- `_bvSaveParent()`
- `bvApplyParentRaw()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `bulkvendorops: {t:'...', s:'...'}`
- pages dispatcher: `bulkvendorops` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
