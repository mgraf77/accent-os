---
type: module
slug: my-tasks
title: My Tasks Module (v6.10.38 personal to-do)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, alerts, digest, customers]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# My Tasks Module

**File**: `js/my_tasks.js` (v6.10.38)
**Pattern**: localStorage-only, per-user-id keyed; no Supabase, no schema, no Michael handoff; 3-status × 4-priority + due_date
**Sidebar route**: `mytasks` (CORE, all roles incl. Warehouse)

## Purpose

Single-device personal task list. Storage key `accentos_my_tasks_${user_id}` (falls back to `anon`) so each session stays personal. Surfaces "due today" + "overdue" counts to the [[digest]] tile generator and refreshes the [[alerts]] bell on completion. v1 deliberately ships without Supabase — no cross-device sync, no team sharing.

## Functions

| function | role |
|----------|------|
| `_mtKey()` | `accentos_my_tasks_${CU?.user_id || 'anon'}` localStorage key |
| `loadMyTasks()` | parse + array-guard from localStorage; resets to `[]` on JSON failure |
| `saveMyTasks()` | JSON.stringify persist; warns silently on quota exceed |
| `_mtTodayStr()` | `YYYY-MM-DD` of today (ISO slice) |
| `_mtIsOverdue(t)` | `due_date < today` AND `status !== 'done'` |
| `_mtIsDueToday(t)` | `due_date === today` AND `status !== 'done'` |
| `mytasks(el, act)` | sidebar route; lazy-loads on first visit (`window._mtLoaded` guard); renders `+ New Task` button into `act` |
| `renderMyTasks(el)` | 4-stat header (Open / Due Today / Overdue / Completed) + filter row + table; sort = open first → due_date asc (no-due last) → created_at desc |
| `_mtRow(t)` | single row HTML; overdue tinted `#fef2f2`; checkbox toggle; pencil + × buttons |
| `toggleMyTaskDone(id)` | flips `status` between `open` ↔ `done`; stamps/clears `completed_at`; refreshes alert bell |
| `openMyTaskEdit(id)` | full modal (title required, notes, due, priority, status); auto-IDs new with `mt-${base36 ts + rand}` |
| `saveMyTaskFromModal(id, isNew)` | validates title; persists; stamps `completed_at` if status flipped to `done` |
| `deleteMyTaskConfirm(id)` | `confirm()` then splice-remove |
| `myTasksDueTodayCount()` / `myTasksOverdueCount()` | exported counts for [[digest]] Daily Brief tile |

## Statuses + priorities

`_MT_STATUSES = ['open', 'in_progress', 'done']`. `_MT_PRIORITIES = ['low', 'normal', 'high', 'urgent']`. Status badge colors: open=gray, in_progress=blue, done=green. Priority badge colors: urgent=red, high=amber, normal/low=gray.

## State

`MY_TASKS` (in-memory mirror of localStorage), `_mtFilter = {q, status, priority}` (default all), `window._mtLoaded` (lazy-load guard). Nothing persisted to Supabase; no audit events.

## Read dependencies

`CU.user_id` from inline shell auth (for storage key). `refreshAlertBell()` from [[alerts]] (call-guarded by `typeof === 'function'`). `$()`, `esc()`, `toast()`, `openModal()`, `closeModal()` from shell utilities.

## Shell touchpoints

- Sidebar: `index.html:360` CORE section, `data-roles="Owner,Admin,Manager,Sales,Warehouse"`
- PAGE_META: `mytasks: {t:'My Tasks', s:'Personal to-do list · stays in your browser'}`
- Dispatcher: `pages.mytasks` in `index.html:759`
- No hydrate call in `sbHydrate()` (lazy-loaded in `mytasks()` route)
- No audit events (privacy: tasks live only on the device)

## Related

[[ADR-002]] · [[ADR-004]] · [[alerts]] · [[digest]] · [[customers]]
