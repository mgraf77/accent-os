---
type: module
slug: jobs
title: Jobs Module (Track 5.2 Job Tracker)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, sop-quote-creation, deliveries, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Jobs Module

**File**: `js/jobs.js`
**Pattern**: full CRUD on `jobs` (M21 schema), with CSV bulk import + Quote→Job + Deal→Job preset converters
**Sidebar route**: `jobs` (CORE, all roles)

## Purpose

Project-level work tracking. Auto `J-####` numbering. Optional links to a CRM customer (FK + free-text fallback), to a saved quote, or to a pipeline deal. Status workflow: `open → in_progress → blocked → complete / cancelled`. `completed_at` auto-stamped when status flips to `complete`.

## Functions

| function | role |
|----------|------|
| `sbLoadJobs()` | GET `/jobs?order=updated_at.desc&limit=500`; advances `JOB_NUM` past max existing |
| `sbSaveJob(rec)` | upsert; auto-issues `J-XXXX` if blank; sets `completed_at` based on status |
| `sbBulkSaveJobs(rows)` | bulk import POST; per-row auto-numbering |
| `sbDeleteJob(id)` | hard delete |
| `sbUpdateJobField(id, field, value)` | PATCH allow-list: `status`, `priority`, `assigned_to`, `due_date`, `estimated_hours`, `actual_hours`, `notes`; sets `completed_at` on status flip |
| `commitJobCellSelect(select)` | inline-edit handler for status + priority dropdowns |
| `jobs(el, act)` | sidebar route; renders `+ New Job` button |
| `renderJobs(el)` | 4-stat header (active count by sub-status / overdue / due ≤7d / completed) + import card + filtered table sorted active-first by priority then due-date asc; complete/cancelled appear last with 0.6 opacity |
| `doBulkJobStatus(ids, status)` | bulk mark complete or cancelled via `bulkSel*` |
| `openJobEdit(jobId, preset)` | full modal: project + customer (dropdown or free-text) + status + priority + due + linked quote + hours + notes |
| `saveJob(jobId)` | persists; resolves `customer_id` from dropdown, falls back to free-text `customer_name` |
| `deleteJobConfirm(jobId)` | confirm + delete |
| `downloadJobCsvTemplate()` / `openJobCsvPaste()` / `onJobFilePick(input)` | CSV input surfaces (template + paste + file) |
| `processJobCsvText(text)` | parse + alias map + status/priority enum normalize + customer name → id resolution → preview |
| `commitJobCsv()` | bulk save staged rows |
| `createJobFromQuote(quoteIdOrUuid)` | preset from `QUOTES`: project_name from `q.project`, customer_id resolved, priority by total ($50K=urgent, $10K=high), seed notes with type/sqft/budget/total/notes |
| `createJobFromDeal(dealId)` | preset from `DEALS` via `findDealAnyStage`: priority by deal value, due = `d.close`, related_deal_id stamped, seed notes with project_type/value/source/notes |

## Status workflow

`open` → `in_progress` → `blocked` (mid-cycle stall) → `complete` or `cancelled`. `completed_at` stamped on flip to `complete`, cleared on flip away.

## Filters + sort

`jobFilter = {q, status, priority}`. Sort: active jobs first by priority (`urgent → high → normal → low`) then due-date asc; complete/cancelled last by `updated_at` desc. Bulk actions: `Mark complete`, `Mark cancelled` (any user with edit access incl. Warehouse).

## State

`JOBS` (list), `jobFilter`, `JOB_NUM` (next number). `_jobStaged` window-scoped CSV preview cache.

## Cross-module presets

The Quote→Job and Deal→Job converters use the same `setTimeout(openJobEdit(null, preset), 50)` pattern as PO converters in [[purchase-orders]] — `closeModal` first then defer-open so animations don't conflict.

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[sop-quote-creation]] · [[deliveries]] · [[alerts]]
