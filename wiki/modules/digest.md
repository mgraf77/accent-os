---
type: module
slug: digest
title: Digest Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Digest Module

**File**: `js/digest.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `generateDailyDigest()`
- `showDailyDigest()`
- `_ddCopy()`
- `_ddEmail()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `digest: {t:'...', s:'...'}`
- pages dispatcher: `digest` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
