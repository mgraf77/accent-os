---
type: module
slug: price-book
title: Price Book Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Price Book Module

**File**: `js/price_book.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `renderPriceBook()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `pricebook: {t:'...', s:'...'}`
- pages dispatcher: `pricebook` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
