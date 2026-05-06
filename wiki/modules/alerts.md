---
type: module
slug: alerts
title: Alerts Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Alerts Module

**File**: `js/alerts.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadAlerts()`
- `sbInsertAlert()`
- `sbUpdateAlertStatus()`
- `alertKey()`
- `generateAlertsFromData()`
- `alerts()`
- `regenerateAlerts()`
- `markAllAlertsRead()`
- `renderAlerts()`
- `alertSetStatus()`
- `alertGoTo()`
- `alertsUnreadCount()`
- `renderAlertBell()`
- `bellToggle()`
- `bellHandleClick()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `alerts: {t:'...', s:'...'}`
- pages dispatcher: `alerts` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
