---
type: module
slug: quick-actions
title: Quick Actions Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Quick Actions Module

**File**: `js/quick_actions.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `_qaInjectButton()`
- `toggleQuickActions()`
- `_qaOpen2()`
- `_qaClose()`
- `qaActivate()`
- `_qaInvoke()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `quickactions: {t:'...', s:'...'}`
- pages dispatcher: `quickactions` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
