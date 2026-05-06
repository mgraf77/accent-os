---
type: module
slug: commission
title: Commission Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Commission Module

**File**: `js/commission.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `_loadCommUsers()`
- `_commGetRate()`
- `_commSetRate()`
- `_commPeriodWindow()`
- `renderCommissionTracker()`
- `_renderCommissionInner()`
- `_commExportCsv()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `commission: {t:'...', s:'...'}`
- pages dispatcher: `commission` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
