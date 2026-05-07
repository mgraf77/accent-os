---
type: module
slug: commission
title: Commission Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, employees, pipeline-analytics, reports]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Commission Module

**File**: `js/commission.js`
**Pattern**: pure-compute over `DEALS.won` grouped by `owner_id`, resolved against `user_profiles`; configurable rate persisted in `localStorage`; no new schema
**Sidebar route**: nested under `mgmt` page → `commission` sub-tab (mounted at `mgmt-content`)

## Purpose

Per-salesperson commission calculator. Filters `DEALS.won` by close-date window (MTD / QTD / YTD / TTM / all), groups by `owner_id`, applies a configurable base rate, and adds tier-accelerator bonuses based on annualized revenue. Lives on the Mgmt Dashboard alongside [[employees]] and KPIs. Default rate 5%; persisted per-browser in `localStorage['aos-comm-rate']`.

## Functions

| function | role |
|----------|------|
| `_loadCommUsers()` | fetches `user_profiles` for name + role resolution; 5-minute in-memory cache; tolerant of unconfigured Supabase |
| `_commGetRate()` / `_commSetRate(rate)` | localStorage-backed read/write of `aos-comm-rate`; default `0.05` |
| `_commPeriodWindow(period)` | resolves `mtd / qtd / ytd / ttm / all` → `{start, end, label}` |
| `renderCommissionTracker(c)` | async entry; loads users then delegates to `_renderCommissionInner` |
| `_renderCommissionInner(c)` | filters won deals by window, groups by `owner_id`, applies base rate + tier accelerator, renders 4-stat header + settings card + per-salesperson breakdown table with totals row |
| `_commExportCsv()` | flat per-deal export with name + role + value + base commission columns; uses `csvDownload` helper |

## Tier accelerator schedule

Annualized revenue → bonus rate added on top of base:

| min annualized | bonus |
|---------------|-------|
| $0 | 0% |
| $250,000 | +0.5% |
| $500,000 | +1.0% |
| $1,000,000 | +2.0% |

Annualization formula: `annualized = revenue * (12 / monthsInWindow)` so quarterly views still recognise high performers. Tier picked via descending threshold scan in `COMMISSION_TIER_THRESHOLDS`. `total = revenue * baseRate + revenue * tier.rate`.

## Period window math

Date math anchored to current year:

- `mtd` → 1st of current month
- `qtd` → 1st of current quarter (`Math.floor(month/3)*3`)
- `ytd` → Jan 1
- `ttm` → same date one year ago
- `all` → Jan 1 2000 (effective floor)

Filter compares against `d.closed_at || d.updated_at`.

## State

`_commUsers` (`user_profiles` cache), `_commLoadedAt` (cache timestamp, 5-min TTL), `commFilter = {period:'qtd'}`. Rate in `localStorage['aos-comm-rate']`.

## Read dependencies

`DEALS.won` (the won-deal array — see [[pipeline-analytics]]), `user_profiles` table (Supabase fetch for name/role/initials), `CU` (no direct read — tracker is read-only across all sales staff visible to whoever has Mgmt page access), `csvDownload` helper.

## Shell touchpoints

- Mounted at `mgmt-content` from the Mgmt page when `mgmtSection === 'commission'`
- Mgmt tab registry: `{id:'commission', label:'Commission'}` in `mgmt(el)` (`index.html` line 5976)
- Audit events: `commission_export`
- No PAGE_META key (sub-tab, not a top-level page); access gated by `mgmt` page roles
- Modal helpers: `toast` only — no modals in this module

## Related

[[ADR-002]] · [[ADR-004]] · [[employees]] · [[pipeline-analytics]] · [[reports]]
