---
type: module
slug: my-tasks
title: My Tasks Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# My Tasks Module

**File**: `js/my_tasks.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `_mtKey()`
- `loadMyTasks()`
- `saveMyTasks()`
- `_mtTodayStr()`
- `_mtIsOverdue()`
- `_mtIsDueToday()`
- `mytasks()`
- `renderMyTasks()`
- `_mtRow()`
- `toggleMyTaskDone()`
- `openMyTaskEdit()`
- `saveMyTaskFromModal()`
- `deleteMyTaskConfirm()`
- `myTasksDueTodayCount()`
- `myTasksOverdueCount()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `mytasks: {t:'...', s:'...'}`
- pages dispatcher: `mytasks` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
