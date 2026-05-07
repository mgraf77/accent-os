---
type: module
slug: calendar
title: Calendar Module (Track 5.16)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, alerts, my-tasks, employees, digest]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Calendar Module

**File**: `js/calendar.js` (M21 phase-3 schema: `calendar_events`)
**Pattern**: month-grid + list-view CRUD with role-scoped visibility and RFC-5545 `.ics` export
**Sidebar route**: `calendar` (CORE, all roles)

## Purpose

Company-wide events calendar: trade shows, training, deadlines, holidays, meetings, product launches. Categories drive month-grid pill colors. Per-event `visible_to_roles` array (default: all roles) gates server-side reads via RLS. Exports the next 30d-back-to-future window as a downloadable `.ics` for Google Cal / Outlook / Apple.

## Functions

| function | role |
|----------|------|
| `sbLoadCalendarEvents()` | GET `/calendar_events?order=starts_at.asc&limit=2000`; tolerant of missing M21-phase3 table |
| `sbSaveCalendarEvent(rec)` | upsert; default `visible_to_roles` = `[Owner, Admin, Manager, Sales, Warehouse]`, stamps `owner_id` from `CU` |
| `sbDeleteCalendarEvent(id)` | hard delete |
| `calendar(el, act)` | sidebar route; renders topbar `☰ List` / `▦ Month` toggle, `⬇ .ics` export, `+ New Event` |
| `renderCalendar(el)` | dispatches month-grid vs list view based on `calView`; navbar with `‹` / `›` / `Today` + counts |
| `catColorFor(cat)` | category → hex color: `trade_show=purple`, `training=green`, `deadline=red`, `holiday=amber`, `meeting=blue`, `launch=pink`, `other=gray` |
| `calListRow(e)` | list-row markup with category bar + datetime + location + badge |
| `calShiftMonth(delta)` / `calToday()` | month-cursor controls |
| `openCalendarDetail(eventId)` | read-only modal: starts/ends/location/url + description + Edit + Delete buttons |
| `openCalendarEdit(eventId, defaultDate)` | full modal: title + category + all-day + start + end + location + url + description; `defaultDate` from grid-cell click pre-fills 09:00 |
| `saveCalendarEvent(eventId)` | persists; converts `datetime-local` → ISO via timezone offset |
| `deleteCalendarEventConfirm(eventId)` | confirm + delete + audit |
| `_icsEscape(s)` / `_icsDt(iso, allDay)` / `_icsFold(line)` | RFC 5545 helpers: backslash + comma + semicolon escape, `VALUE=DATE` vs UTC-stamp, 75-octet line folding |
| `exportCalendarIcs()` | builds `VCALENDAR` from past-30d → forward; auto end = +1d (all-day) or +1h; downloads `accentos-calendar-YYYY-MM-DD.ics` |

## Categories

`meeting`, `trade_show`, `training`, `deadline`, `holiday`, `launch`, `other`. Color legend rendered under the month grid. ICS export emits `CATEGORIES:` uppercased.

## Views

- **Month grid**: 7-col cells, today highlighted with inset accent shadow. Up to 3 events per cell as colored pills, then `+N more`. Cell click → new-event modal pre-filled with that date.
- **List**: future-only (`ends_at || starts_at >= now`), sorted ascending, virtualized within 360px max-height pane.

## ICS export

Window = `now - 30d` forward. Events with `all_day` use `DTSTART;VALUE=DATE:` + `DTEND` set to start+1 day per spec. Timed events use UTC `Z`-stamps. Each line ≤75 octets via `_icsFold`. Audit: `cal_export_ics`. Phase-2 portals could subscribe via webcal URL.

## State

`CAL_EVENTS` (loaded list), `calView` (`month` | `list`), `calCursor` (YYYY-MM-01 anchor, defaults to first-of-month).

## Read dependencies

`CU` (for `owner_id` stamp + RLS context). No cross-module reads — events are self-contained.

## Shell touchpoints

- Sidebar: `data-roles="Owner,Admin,Manager,Sales,Warehouse"` → `goTo('calendar')`
- PAGE_META: `calendar: {t:'Company Calendar', s:'Trade shows · Training · Deadlines'}`
- Dispatcher: `calendar` key in `pages` map
- Hydrate: `sbLoadCalendarEvents()` in `hydrateFromSupabase` chain
- Modal helpers: `openModal`, `closeModal`, `toast`, `esc`, `sbFetch`, `$`
- Audit events: `cal_event_create`, `cal_event_edit`, `cal_event_delete`, `cal_export_ics`

## Related

[[ADR-002]] · [[ADR-004]] · [[alerts]] · [[my-tasks]] · [[employees]] · [[digest]]
