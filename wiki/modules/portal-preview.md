---
type: module
slug: portal-preview
title: Portal Preview Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Portal Preview Module

**File**: `js/portal_preview.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `portalpreview()`
- `_ppTradePicker()`
- `_ppRepPicker()`
- `_ppRender()`
- `_ppRenderTrade()`
- `_ppRenderRep()`
- `_ppCopySummary()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `portalpreview: {t:'...', s:'...'}`
- pages dispatcher: `portalpreview` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
