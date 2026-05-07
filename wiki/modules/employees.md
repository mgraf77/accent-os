---
type: module
slug: employees
title: Employees Module (Track 3.1 Scorecards · M08 Locked)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, commission, reports, health, module-modes]
confidence: high
sensitive: true
created: 2026-05-06
updated: 2026-05-07
---

# Employees Module

**File**: `js/employees.js` (v6.10.53)
**Pattern**: full CRUD on `employees` + `employee_scores` (M08 schema); pivoted period × metric grid; pure-compute aggregate score
**Sidebar route**: rendered as `mgmt` sub-tab `employees` (`mgmtSection==='employees'`); no top-level sidebar entry. Mgmt Dashboard itself is `data-roles="Owner,Admin,Manager"` (`index.html:374`).

## Purpose

Restricted scorecard hub. Owner / Admin / Manager only — employees never see their own scores. Eight default metrics seeded at module load (`EMP_DEFAULT_METRICS`); custom metric keys allowed via free-form save. Aggregate score = mean within each period, then mean across periods, rounded to 1 decimal. Data source designed for Windward CSV import (waiting); manual entry currently the only path. `sensitive: true` because rows serialize `full_name` + `user_id` + `notes`.

## Default metrics (8)

`revenue_attainment` (%), `quote_close_rate` (%), `avg_deal_size` ($), `customer_satisfaction` (NPS), `tickets_resolved` (count), `on_time_delivery` (%), `attendance` (%), `training_complete` (%).

## Functions

| function | role |
|----------|------|
| `sbLoadEmployees()` | GET `/employees?order=full_name.asc&limit=500` |
| `sbLoadEmployeeScores(employeeId)` | GET `/employee_scores?employee_id=eq.<id>&order=period.desc,metric_key.asc&limit=500`; caches into `EMPLOYEE_SCORES[id]` |
| `sbSaveEmployee(rec)` | upsert; `on_conflict=id` when editing; defaults `active:true` |
| `sbUpdateEmployeeField(id, field, value)` | PATCH allow-list: `role`, `department`, `active`, `email`, `quota`, `hire_date`, `terminated_at` |
| `commitEmployeeCell(input)` | inline-edit blur handler with optimistic UI + revert on failure + audit log; re-renders on `active` flip |
| `sbDeleteEmployee(id)` | hard delete (scores cascade per schema) |
| `sbSaveEmployeeScore(rec)` / `sbDeleteEmployeeScore(id)` | score CRUD; `on_conflict=employee_id,period,metric_key`; stamps `recorded_by` from `CU.user_id` |
| `computeEmployeeAggregate(empId)` | `{avgScore, periods, latestPeriod}`; mean-of-means across periods, rounded to 1 decimal |
| `renderEmployees(c)` | 4-stat header (Active / Departments / Avg Score / Rated) + sortable inline-edit table |
| `openEmployeeDetail(empId)` | modal: profile + aggregate + pivoted period × metric scorecard grid |
| `openEmployeeEdit(empId)` / `saveEmployee(empId)` | full modal: name (required) + role + dept + hire_date + linked `auth.users` UUID + active + notes |
| `deleteEmployeeConfirm(empId)` | confirm + delete + cascade scores |
| `openEmployeeScoreEdit(empId, scoreId)` | per-score modal: period + metric (preset or custom) + raw value + score (0–10) + notes |
| `defaultPeriodNow()` | `${YYYY}-Q${quarter}` of today |
| `saveEmployeeScore(empId, scoreId)` / `deleteEmployeeScore(empId, scoreId)` | score persist + reload + re-open detail |

## Score color thresholds

`avgScore ≥ 8` green · `≥ 6` blue · `≥ 4` yellow · else accent (red). Same thresholds applied to per-cell scores in the pivoted grid and to the stat header's `border-left` accent.

## Pivot grid

`openEmployeeDetail` builds `grid[period][metric_key] = scoreRow` from `EMPLOYEE_SCORES[empId]`. Periods sorted desc; columns are the union of `metric_key` values seen for that employee. Each cell is a click-to-edit anchor opening `openEmployeeScoreEdit`. `(metric_value)` shown in muted text alongside the score.

## State

`EMPLOYEES` (list), `EMPLOYEE_SCORES[empId]` (per-employee score cache), `EMP_DEFAULT_METRICS` (8-entry preset). No filter object — table sorted alphabetically by `full_name`.

## Read dependencies

`CU.role` for the `Owner/Admin/Manager` edit gate (inline cells revert to plain `<td>` for non-senior viewers). `CU.user_id` for `recorded_by` stamping. Shell utils: `$()`, `esc()`, `toast()`, `sbFetch()`, `sbConfigured()`, `sbAuditLog()`, `openModal()`, `closeModal()`. Re-renders via `mgmt($('pg-content'))` (parent dashboard route).

## Shell touchpoints

- No own sidebar slot — surfaces inside [[commission]]'s parent Mgmt Dashboard at `index.html:5993` (`mgmtSection==='employees' → renderEmployees(c)`)
- No PAGE_META key
- No `pages.*` dispatcher key (renders inside `mgmt`)
- Hydrate: `sbLoadEmployees()` called from `sbHydrate()`; per-employee scores lazy-load on detail open
- Audit events: `employee_create`, `employee_edit`, `employee_${field}_edit`, `employee_delete`, `emp_score_create`, `emp_score_edit`, `emp_score_delete`

## Related

[[ADR-002]] · [[ADR-004]] · [[commission]] · [[reports]] · [[health]] · [[module-modes]]
