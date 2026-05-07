---
type: module
slug: health
title: Health Module (Owner+Admin Diagnostics)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, alerts, reports, module-modes]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Health Module

**File**: `js/health.js` (v6.10.34)
**Pattern**: read-only diagnostic page; per-table presence pings + in-memory global counts; 5-min result cache
**Sidebar route**: `health` (ADMIN, Owner/Admin only)

## Purpose

Owner+Admin "why doesn't X show data?" diagnostic. One page surfaces every module's hydration status (which globals are loaded, row counts), schema presence (does the underlying Supabase table exist), and current build info. No new schema; no new API beyond a read-only `count` ping per `schemaCheck:true` table.

## Functions

| function | role |
|----------|------|
| `_hcSchemaCheck(table)` | GET `/${table}?select=count&limit=0` with `Prefer: count=exact`; returns `{exists, msg}`; matches `relation .* does not exist`/`PGRST`/`404` to flag missing |
| `health(c, actions)` | sidebar route; renders `Refresh` button into `actions`; runs `_hcRun(false)` if cache stale (>5 min) |
| `_hcRun(forceRender)` | Promise.all schema checks for the small `schemaCheck:true` set; stamps `_hcLastRun` |
| `_renderHealth(c)` | builds 4-stat header (Supabase status / Tables OK / Schema Missing / Empty+Lazy) + main table + Build Info card |

## HC_TABLES (32 entries)

Each row: `{name, global, countFn, schemaCheck?, optional?}`. Status derived as:

- `ok` — `countFn()` returns numeric > 0 OR schema check passed
- `missing` — `schemaCheck:true` and ping returned `relation … does not exist` (rendered with red-tinted row + accent border)
- `empty` — count === 0 (yellow)
- `lazy` — count === `'lazy'` (loaded on demand, e.g. `AF_PIPELINE`, `AF_AUDITS`)
- `unknown` — count === `'—'` (no global, no schemaCheck)

`schemaCheck:true` set: `employees`, `employee_scores`, `goals`, `kpi_definitions`, `kpi_snapshots`, `competitor_prices`, `label_batches` (optional). The other ~25 tables are inferred from in-memory globals — no extra round-trips.

## State

`_hcResults` (last schema-check map), `_hcLastRun` (epoch ms; 5-min cache window before auto-rerun).

## Read dependencies

Probes `typeof X !== 'undefined'` against 17+ window globals: `VD`, `CHANGELOG`, `PARENT_COMPANIES`, `CUSTOMERS`, `CUSTOMER_INTERACTIONS`, `QUOTES`, `DEALS`, `AF_PIPELINE`, `AF_AUDITS`, `ALERTS`, `COOP_FUNDS`, `INVENTORY`, `POS`, `PO_LINES`, `JOBS`, `ARTICLES`, `CAL_EVENTS`, `TRADE_PARTNERS`, `WARRANTY_CLAIMS`, `SHOWROOM_DISPLAYS`, `DELIVERIES`, `MARKETING_CAMPAIGNS`, `MARKETING_ASSETS`. Also reads `CU` (current user) and calls `sbConfigured()` for the Supabase status pill.

## Build Info card

Shows `navigator.userAgent` (first 80 chars), window size, current `curPage`, and a "Memory globals: N / 17 loaded" gauge across the 17 most critical globals.

## Shell touchpoints

- Sidebar: `index.html:372` ADMIN section, `data-roles="Owner,Admin"`
- PAGE_META: `health: {t:'Health Check', s:'Schema · hydration · diagnostics'}`
- Dispatcher: `pages.health` in `index.html:759`
- No hydrate call in `sbHydrate()` — the page is the hydrate audit
- No audit events emitted (read-only)

## Related

[[ADR-002]] · [[ADR-004]] · [[alerts]] · [[reports]] · [[module-modes]]
