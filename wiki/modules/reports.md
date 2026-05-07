---
type: module
slug: reports
title: Reports Module (CSV Export Center)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, inventory, demand-forecast, customers, jobs, purchase-orders, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Reports Module

**File**: `js/reports.js` (v6.10.27)
**Pattern**: pure-compute over already-hydrated globals; no schema, no API; emits CSVs via `csvDownload` shell util
**Sidebar route**: `reports` (CORE, `data-roles="Owner,Admin,Manager"`)

## Purpose

Single-page CSV export center for accounting handoffs, supplier bulk-update sheets (e.g. Eugene's meta-description CSV), BI tools, and ad-hoc analysis. Every dataset already loaded in the session can be downloaded as UTF-8 CSV with quoted-field escape for commas/quotes/newlines. No server round-trips — what's in memory is what exports.

## Functions

| function | role |
|----------|------|
| `reports(c, actions)` | sidebar route; renders `Export all` button into `actions`; builds 4-stat header (available / total rows / largest dataset / generated timestamp) + report list table |
| `collectReportDefs()` | returns the 19-entry definition array `{key, label, description, count}` with `typeof !== 'undefined'` guards on every global |
| `downloadReport(key)` | calls `buildReportRows(key)`; toasts `'Nothing to export'` if <2 rows; `csvDownload` with `${key}_${YYYY-MM-DD}.csv` filename; emits `report_export` audit |
| `buildReportRows(key)` | switch over 19 keys, returning `[[header...], [row...], ...]`; pipe-joins array fields like `tags` and `sku_list` |
| `exportAllReports()` | confirms count, then sequential `setTimeout(next, 250)` chain over non-empty defs to avoid browser multi-download race |

## Report catalog (19)

| key | source global | notes |
|-----|---------------|-------|
| `vendors` | `VD` | id · name · status · rep · tier override · sales totals incl. 2024/2025 |
| `customers` | `CUSTOMERS` | profile + tags pipe-joined; no RFM (compute is in [[customers]]) |
| `deals` | `DEALS` | flattens every stage incl. archive into one rowset |
| `quotes` | `QUOTES` | header only; line count summary |
| `quote_lines` | `QUOTES[].lineItems` | per-line ext_price computed inline |
| `inventory` | `INVENTORY` | full SKU row incl. qty_committed/on_order/available |
| `jobs` | `JOBS` | see [[jobs]] |
| `pos` | `POS` | PO header + linked quote/job |
| `po_lines` | `PO_LINES` | per-line cost + qty_received |
| `trade_partners` | `TRADE_PARTNERS` | designers / contractors / architects |
| `warranty` | `WARRANTY_CLAIMS` | RMA + severity + cost_to_us |
| `showrooms` | `SHOWROOM_DISPLAYS` | sku_list pipe-joined; coop linkage |
| `deliveries` | `DELIVERIES` | driver / vehicle / signature / failure_reason |
| `coop` | `COOP_FUNDS` | vendor name resolved from `VD` lookup |
| `alerts` | `ALERTS` | see [[alerts]] |
| `campaigns` | `MARKETING_CAMPAIGNS` | attribution incl. revenue_attributed |
| `articles` | `ARTICLES` | metadata only — `body_chars` substitutes for body |
| `changelog` | `CHANGELOG` | vendor score change history |
| `demand_reorder` | `computeDemandForecast()` | filters `reorder_now`/`reorder_soon`, computes suggested_total inline (see [[demand-forecast]]) |

## Stat header

`Reports Available` = count where rows>0 / total. `Total Rows` = aggregate sum. `Largest Dataset` = max-count label + count. `Generated` = local date + time at render. Empty-data rows render at 0.5 opacity with disabled Download button.

## State

None — every render recomputes `collectReportDefs()`. No filters, no persisted state.

## Read dependencies

19 globals via `typeof !== 'undefined'`: `VD`, `CUSTOMERS`, `DEALS`, `QUOTES`, `INVENTORY`, `JOBS`, `POS`, `PO_LINES`, `TRADE_PARTNERS`, `WARRANTY_CLAIMS`, `SHOWROOM_DISPLAYS`, `DELIVERIES`, `COOP_FUNDS`, `ALERTS`, `MARKETING_CAMPAIGNS`, `ARTICLES`, `CHANGELOG`. `computeDemandForecast` from [[demand-forecast]]. Shell utils: `esc()`, `csvDownload()`, `toast()`, `sbAuditLog()`.

## Shell touchpoints

- Sidebar: `index.html:370` CORE section, `data-roles="Owner,Admin,Manager"` (Sales/Warehouse blocked)
- PAGE_META: `reports: {t:'Reports', s:'CSV exports for every dataset'}`
- Dispatcher: `pages.reports` in `index.html:759`
- No hydrate call (relies on already-hydrated globals)
- Audit events: `report_export` with `{key, row_count}` per download

## Related

[[ADR-002]] · [[ADR-004]] · [[inventory]] · [[demand-forecast]] · [[customers]] · [[jobs]] · [[purchase-orders]] · [[alerts]]
