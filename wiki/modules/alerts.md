---
type: module
slug: alerts
title: Alerts Module (Track 6.8 Intelligent Alerts)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, pipeline-analytics, vendor-scoring, my-tasks, demand-forecast]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Alerts Module

**File**: `js/alerts.js`
**Pattern**: 9 generators that walk in-memory globals on hydrate, persist novel alerts to the `alerts` table (M02 schema), dedupe via `(type, source_id)` key
**Sidebar route**: `alerts` (CORE, all roles)

## Purpose

Persistent, role-aware alerts auto-emitted from existing data each session. No new SQL — uses the `alerts` table from `sql/M02_core_schema.sql`. Re-runs skip alerts already in `unread`/`read`/`actioned` status; `dismissed` alerts can re-emerge if the underlying issue persists ("remind me later" semantics).

## Generators (9)

| type | trigger | severity rule |
|------|---------|---------------|
| `deal_stale` | active deal (not won/lost/abandoned), no `updated_at` change in ≥14d, value ≥ $2K | `urgent` if ≥30d, else `warn` |
| `coop_deadline` | open coop fund with `deadline` in `[0, 14]d` (see [[vendor-scoring]] coop tracker) | `urgent` if ≤7d, else `warn` |
| `quote_cold` | quote ≥21d old, total ≥ $500 | `warn` |
| `inventory_low` | `qty_available < reorder_point` | `urgent` if `avail==0`, else `warn` |
| `delivery_overdue` | scheduled date past today, status not `delivered`/`cancelled` | `urgent` |
| `warranty_expiring` | open warranty with `warranty_expires` in `[0, 30]d` | `urgent` if ≤7d, else `warn` |
| `showroom_expiring` | active display with `expires_date` in `[0, 14]d` | `warn` if ≤7d, else `info` |
| `po_overdue` | PO past `expected_date`, status not `received`/`cancelled` | `urgent` if ≥14d overdue, else `warn` |
| `score_dropped` | `CHANGELOG` numeric score drop ≥3 points within 7d (skips Categories/Notes/Tier/Inactive) | `urgent` if ≥5pt, else `warn` |

## Functions

| function | role |
|----------|------|
| `sbLoadAlerts()` | GET `/alerts?order=created_at.desc&limit=500`; tolerant of missing table |
| `sbInsertAlert(rec)` | POST one alert; `recipient_id`/`recipient_role` optional (broadcast when null) |
| `sbUpdateAlertStatus(id, status)` | PATCH; sets `read_at` when `read`/`actioned` |
| `alertKey(type, payload)` | builds `type:source_id` from `deal_id` / `coop_id` / `quote_id` / etc. for dedupe |
| `generateAlertsFromData()` | runs the 9 generators, skips active keys, persists in serial loop |
| `alerts(el, act)` | sidebar route; renders Refresh + Mark-all-read topbar buttons |
| `regenerateAlerts()` | reload + regenerate, then re-render |
| `markAllAlertsRead()` | bulk PATCH all unread → read |
| `renderAlerts(el)` | 4-stat header + filterable list (q/severity/status), urgent → warn → info → newest |
| `alertSetStatus(id, status)` | per-alert state transition with audit log |
| `alertGoTo(id, page)` | mark-read on click-through, then `goTo(page)` |
| `alertsUnreadCount()` | exported for any caller (bell uses it) |
| `renderAlertBell()` | topbar bell with unread badge + dropdown of top-5 sorted by severity |
| `bellToggle()` | open/close + outside-click closer |
| `bellHandleClick(id, page)` | bell-row click → `alertGoTo` then re-render bell |

## Shell touchpoints

- Sidebar: `index.html` CORE → `alerts` slot
- Topbar bell mount: `<span id="bell-host">` (always visible)
- IIFE wraps `window.goTo` so `renderAlertBell()` runs after every page change
- Initial bell render: `setTimeout(renderAlertBell, 100)` after script load
- Audit events: `alert_status`, `alerts_mark_all_read`

## Globals read

`DEALS`, `COOP_FUNDS`, `QUOTES`, `INVENTORY`, `DELIVERIES`, `WARRANTY_CLAIMS`, `SHOWROOM_DISPLAYS`, `POS`, `CHANGELOG` — generators are guarded by `typeof !== 'undefined'` so missing tables are skipped silently.

## State

`ALERTS` (loaded list), `alertFilter` (q/severity/status, default status=`unread`), `bellOpen`.

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[pipeline-analytics]] · [[vendor-scoring]] · [[my-tasks]] · [[demand-forecast]]
