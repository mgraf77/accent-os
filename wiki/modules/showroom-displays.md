---
type: module
slug: showroom-displays
title: Showroom Displays Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Showroom Displays Module

**File**: `js/showroom_displays.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadShowroomDisplays()`
- `sbSaveShowroomDisplay()`
- `sbUpdateShowroomField()`
- `commitShowroomCellSelect()`
- `sbDeleteShowroomDisplay()`
- `showrooms()`
- `renderShowroomDisplays()`
- `doBulkShowroomDelete()`
- `openShowroomEdit()`
- `saveShowroom()`
- `deleteShowroomConfirm()`
- `sbBulkSaveShowroomDisplays()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `showroomdisplays: {t:'...', s:'...'}`
- pages dispatcher: `showroomdisplays` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
