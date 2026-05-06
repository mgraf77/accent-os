---
type: module
slug: wiki
title: Wiki Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Wiki Module

**File**: `js/wiki.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `parseWikiIndex()`
- `loadWikiIndex()`
- `renderWikiMd()`
- `fetchWikiPage()`
- `searchWikiIndex()`
- `wikiGroundQuery()`
- `openWikiPage()`
- `wiki()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `wiki: {t:'...', s:'...'}`
- pages dispatcher: `wiki` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
