---
type: module
slug: health
title: Health Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Health Module

**File**: `js/health.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `_hcSchemaCheck()`
- `health()`
- `_hcRun()`
- `_renderHealth()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `health: {t:'...', s:'...'}`
- pages dispatcher: `health` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
