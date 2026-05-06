---
type: module
slug: employees
title: Employees Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Employees Module

**File**: `js/employees.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadEmployees()`
- `sbLoadEmployeeScores()`
- `sbSaveEmployee()`
- `sbUpdateEmployeeField()`
- `commitEmployeeCell()`
- `sbDeleteEmployee()`
- `sbSaveEmployeeScore()`
- `sbDeleteEmployeeScore()`
- `computeEmployeeAggregate()`
- `renderEmployees()`
- `openEmployeeDetail()`
- `openEmployeeEdit()`
- `saveEmployee()`
- `deleteEmployeeConfirm()`
- `openEmployeeScoreEdit()`
- `defaultPeriodNow()`
- `saveEmployeeScore()`
- `deleteEmployeeScore()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `employees: {t:'...', s:'...'}`
- pages dispatcher: `employees` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
