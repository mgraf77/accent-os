---
type: module
slug: pipeline-analytics
title: Pipeline Analytics Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, alerts, sop-quote-creation]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Pipeline Analytics Module

**File**: `js/pipeline_analytics.js`
**Pattern**: pure-compute modal over `DEALS` + `AF_PIPELINE` (pipeline_events). No new schema.
**Sidebar route**: none — invoked from Pipeline page topbar button (`openPipelineAnalytics`)

## Purpose

Modal-displayed funnel + conversion + time-in-stage + win/loss-reason analytics over the existing pipeline data. Uses `pipeline_events` from M02 schema for stage-move-derived metrics; falls back gracefully when events are missing (UI shows "No pipeline_events in window" placeholder).

## Functions

| function | role |
|----------|------|
| `openPipelineAnalytics()` | main entry. Lazy-loads `AF_PIPELINE` via `sbLoadPipelineEvents(2000)` if empty, computes 4 panels (funnel, conversion, time-in-stage, loss reasons), renders into a `1100px` modal |

## Window selector

Top-of-modal `<select>` with `7d`, `30d`, `90d` (default), `ytd`, `all`. Cutoff is `Date.now() - <window>`. Re-runs `openPipelineAnalytics()` on change.

## Computed panels

| panel | source | metric |
|-------|--------|--------|
| **Funnel by Count** | `DEALS[stage].filter(inWindow)` for `lead → qualified → quoted → negotiating → won` | per-stage count + summed `value`; bar widths normalized to `max(count)`. Footer adds lost + abandoned counts/values. |
| **Stage Conversion** | `AF_PIPELINE` filtered by `ts ≥ cutoff` and `from_stage`/`to_stage` set | for each adjacent pair `(from, to)` in `[lead, qualified, quoted, negotiating, won]`: `rate = forward / total_exits_from_stage`. Header shows overall `lead → won` rate. |
| **Time in Stage** | `AF_PIPELINE` grouped by `deal_id`, sorted by `ts`, deltas in days (filtered to `[0, 365]d` to drop outliers) | per-stage average + median + sample count `n` for `lead`, `qualified`, `quoted`, `negotiating` |
| **Why We Lost** | `(DEALS.lost||[]).filter(inWindow)` grouped by `loss_reason` (or `(unspecified)`) | sorted desc by count; bar widths normalized to top reason |

## Conversion math edge cases

- `total_exits` for stage = sum of `moves[from→*]` across all destinations (so a deal exiting `lead` to `qualified`, `quoted`, or `won` all count toward the denominator)
- `rate === null` when `total_exits === 0` → UI shows `—`
- Graph re-rank style runaway is impossible here since we only count distinct `(from, to)` pairs

## State

`_paWindow` (default `'90d'`), persisted across modal opens within the session.

## Shell touchpoints

- Topbar button on Pipeline page (`onclick="openPipelineAnalytics()"`)
- Modal width hack: `setTimeout` adjusts `.modal { max-width: 1100px }` after open
- No `PAGE_META`, no sidebar entry, no dispatcher route
- Loaded after the inline shell (`DEALS`, `openModal`, `closeModal`, `esc` from shell; `sbLoadPipelineEvents` from inline persistence layer)

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[alerts]] · [[sop-quote-creation]]
