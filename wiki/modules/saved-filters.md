---
type: module
slug: saved-filters
title: Saved Filters Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Saved Filters Module

**File**: `js/saved_filters.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `_sfReadAll()`
- `_sfWriteAll()`
- `getSavedFilters()`
- `saveFilterSet()`
- `deleteFilterSet()`
- `applyFilterSet()`
- `savedFiltersBar()`
- `_sfApply()`
- `_sfDelete()`
- `_sfSavePrompt()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `savedfilters: {t:'...', s:'...'}`
- pages dispatcher: `savedfilters` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
