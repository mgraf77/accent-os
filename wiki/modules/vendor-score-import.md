---
type: module
slug: vendor-score-import
title: Vendor Score Import Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Vendor Score Import Module

**File**: `js/vendor_score_import.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbBulkSaveVendorScores()`
- `_buildVendorScoreAliasMap()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `vendorscoreimport: {t:'...', s:'...'}`
- pages dispatcher: `vendorscoreimport` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
