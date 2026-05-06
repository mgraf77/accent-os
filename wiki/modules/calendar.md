---
type: module
slug: calendar
title: Calendar Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Calendar Module

**File**: `js/calendar.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadCalendarEvents()`
- `sbSaveCalendarEvent()`
- `sbDeleteCalendarEvent()`
- `calendar()`
- `renderCalendar()`
- `catColorFor()`
- `calListRow()`
- `calShiftMonth()`
- `calToday()`
- `openCalendarDetail()`
- `openCalendarEdit()`
- `saveCalendarEvent()`
- `deleteCalendarEventConfirm()`
- `_icsEscape()`
- `_icsDt()`
- `_icsFold()`
- `exportCalendarIcs()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `calendar: {t:'...', s:'...'}`
- pages dispatcher: `calendar` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
