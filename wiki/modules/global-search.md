---
type: module
slug: global-search
title: Global Search Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Global Search Module

**File**: `js/global_search.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `openGlobalSearch()`
- `globalSearchKey()`
- `repaintGsHighlight()`
- `gsActivate()`
- `renderGlobalSearch()`
- `_gsMatch()`
- `_gsScoreObj()`
- `computeGlobalSearch()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `globalsearch: {t:'...', s:'...'}`
- pages dispatcher: `globalsearch` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
