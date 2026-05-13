# AccentOS — Module Dependency Tiers
_Last updated: 2026-05-13_

---

## Purpose

Classifies every module and function by dependency tier — what it depends on, and what depends on it. Used to safely plan extractions, refactors, and load-order changes.

---

## Tier Definitions

| Tier | Name | Description |
|---|---|---|
| T0 | **Platform Primitives** | No dependencies. Used by everything. |
| T1 | **Auth + Session** | Depends on T0. Required before any data access. |
| T2 | **Supabase Client** | Depends on T0 + T1. All DB reads/writes go through here. |
| T3 | **Data Globals** | Populated by T2 fetch functions. Read by T4+. |
| T4 | **UI Primitives** | Depends on T0. Renders into DOM. Stateless. |
| T5 | **Module UIs** | Depends on T3 + T4. Read globals, render pages. |
| T6 | **Cross-Module Intelligence** | Reads multiple T3 globals. Can't run until all deps loaded. |
| T7 | **Async Infrastructure** | Timers, scheduled tasks, background compute. |

---

## T0 — Platform Primitives

Defined inline in `index.html` before any module scripts load.

| Symbol | Type | Description |
|---|---|---|
| `$()` | function | `document.getElementById` alias |
| `esc()` | function | HTML entity escaper — XSS guard |
| `fmt()` | function | Number formatter with locale |
| `fmtDate()` | function | Date string formatter |
| `toast()` | function | Notification toast with dedup |
| `csvDownload()` | function | RFC4180 CSV generator + download |
| `openModal()` / `closeModal()` | function | Generic modal open/close |
| `MODULE_REGISTRY` | object | Data-driven page registry (all 26+ pages) |
| `goTo()` | function | Module router — reads MODULE_REGISTRY |
| `ROLES` | const | Role definitions object |

---

## T1 — Auth + Session

| Symbol | Type | Description |
|---|---|---|
| `jwtKey()` | function | Returns current JWT from localStorage |
| `setJwt()` | function | Saves JWT to localStorage |
| `CU` | global | Current user object (set by tryRestoreSession) |
| `tryRestoreSession()` | async fn | JWT validation → profile lookup → activateApp |
| `activateApp()` | function | Builds sidebar, sets role, defers health log |
| `doLogout()` | async fn | Clears JWT, reloads |

**Depends on:** T0 (`$`, `toast`)
**Required by:** Everything — all module renders check `CU` or role

---

## T2 — Supabase Client

| Symbol | Type | Description |
|---|---|---|
| `SB` | object | Supabase client instance (initialized from inline config) |
| `sbConfigured()` | function | Returns true if SB is properly initialized |
| `sbFetch()` | async fn | Canonical Supabase REST wrapper with error handling |
| `sbAuthFetch()` | async fn | Auth-scoped fetch (uses JWT) |
| `sbAuditLog()` | async fn | Writes to audit_log table |
| `sbSaveQuote()` | async fn | Delete+insert save for quotes |
| `sbDeleteQuote()` | async fn | Deletes quote + lines |

**Depends on:** T0, T1 (JWT for auth headers)
**Required by:** All sbLoad* functions, all write operations

---

## T3 — Data Globals

These are the in-memory data stores. All populated during `hydrateFromSupabase()`.

### Core Business Data

| Global | Type | Populated by | Read by |
|---|---|---|---|
| `VD` | array | sbLoadCategories | Vendor ranking, score import, decision engine |
| `PARENTS` | array | sbLoadParents | Vendor ranking (parent grouping), vendor detail |
| `SCORE_STATES` | object | sbLoadScoreStates | Vendor scoring UI |
| `VENDOR_SCORES` | array | sbLoadVendorScores | Vendor ranking, analytics |
| `VENDOR_OVERRIDES` | object | sbLoadVendorOverrides | Vendor scoring adjustments |
| `CHANGELOG` | array | sbLoadChangelog | Dashboard activity, KPI snapshots |
| `QUOTES` | array | sbLoadQuotes | Quote generator, pipeline linkage |
| `COOP_FUNDS` | array | sbLoadCoopFunds | Vendor detail, dashboard |
| `CUSTOMERS` | array | sbLoadCustomers | CRM, pipeline, quotes |
| `EMPLOYEES` | array | sbLoadEmployees | Employee scorecard, assignments |
| `CALENDAR_EVENTS` | array | sbLoadCalendarEvents | Calendar, dashboard |
| `ARTICLES` | array | sbLoadArticles | Knowledge hub |
| `JOBS` | array | sbLoadJobs | Job tracker, deliveries, warranty |
| `INVENTORY` | array | sbLoadInventory | Inventory, POs, demand forecast |
| `PURCHASE_ORDERS` | array | sbLoadPurchaseOrders | POs, demand forecast, vendor ranking |
| `TRADE_PARTNERS` | array | sbLoadTradePartners | Trade partner module |
| `WARRANTY_CLAIMS` | array | sbLoadWarrantyClaims | Warranty module |
| `SHOWROOM_DISPLAYS` | array | sbLoadShowroomDisplays | Showroom module |
| `LABEL_BATCHES` | array | sbLoadLabelBatches | Labels module |
| `DELIVERIES` | array | sbLoadDeliveries | Deliveries module |
| `COMPETITOR_PRICES` | array | sbLoadCompetitorPrices | Competitive pricing |
| `MARKETING_CAMPAIGNS` | array | sbLoadMarketingCampaigns | Marketing hub |
| `MARKETING_ASSETS` | array | sbLoadMarketingAssets | Marketing hub |
| `ALERTS` | array | sbLoadAlerts | Alerts engine, dashboard |
| `PIPELINE` | array | sbLoadPipeline | Sales pipeline, analytics, decision engine |
| `KPI_SNAPSHOTS` | array | sbLoadKPIs | Dashboard, KPI tracking |
| `GOALS` | array | sbLoadGoals | OKR tracker, dashboard |

### Quote-Specific State

| Global | Type | Description |
|---|---|---|
| `LI` | array | Current quote line items (mutable) |
| `CQ` | object/null | Currently loaded quote metadata |
| `QUOTE_ID` | number | Current quote ID counter |

---

## T4 — UI Primitives

Stateless rendering utilities. No data dependencies.

| Module | File | Provides |
|---|---|---|
| CSV Import Flow | `js/csv_import.js` | `csvImportFlow()` — config-driven import modal |
| Vendor Score Import | `js/vendor_score_import.js` | Score bulk-import utility |
| Bulk Select | `js/bulk_select.js` | `bulkSelBar()`, selection state management |
| Saved Filters | `js/saved_filters.js` | `savedFiltersBar()`, filter persistence |
| Quick Actions | `js/quick_actions.js` | FAB menu render |
| Portal Preview | `js/portal_preview.js` | Read-only portal iframe preview |

---

## T5 — Module UIs

Each module reads from specific T3 globals and renders into the page container.

| Module | File | Primary T3 globals consumed |
|---|---|---|
| Customers | `js/customers.js` | CUSTOMERS, JOBS, PIPELINE |
| Employees | `js/employees.js` | EMPLOYEES |
| Knowledge Hub | `js/knowledge_hub.js` | ARTICLES |
| Jobs | `js/jobs.js` | JOBS, CUSTOMERS, PURCHASE_ORDERS |
| Purchase Orders | `js/purchase_orders.js` | PURCHASE_ORDERS, INVENTORY, VD |
| Calendar | `js/calendar.js` | CALENDAR_EVENTS, EMPLOYEES |
| Inventory | `js/inventory.js` | INVENTORY, PURCHASE_ORDERS |
| Price Book | `js/price_book.js` | VD, VENDOR_SCORES (pure-compute) |
| Deal Optimizer | `js/deal_optimizer.js` | PIPELINE, CUSTOMERS (pure-compute) |
| Trade Partners | `js/trade_partners.js` | TRADE_PARTNERS |
| Warranty | `js/warranty.js` | WARRANTY_CLAIMS, JOBS |
| Showroom Displays | `js/showroom_displays.js` | SHOWROOM_DISPLAYS |
| Labels | `js/labels.js` | LABEL_BATCHES |
| Deliveries | `js/deliveries.js` | DELIVERIES, JOBS, CUSTOMERS |
| Marketing | `js/marketing.js` | MARKETING_CAMPAIGNS, MARKETING_ASSETS |
| Reports | `js/reports.js` | All T3 globals (19 CSV exports) |
| Bulk Vendor Ops | `js/bulk_vendor_ops.js` | VD, VENDOR_SCORES |
| Activity Feed | `js/activity_feed.js` | CHANGELOG |
| Commission | `js/commission.js` | EMPLOYEES, PIPELINE |
| Health Check | `js/health.js` | `window.__AOS_*` flags + Supabase ping |
| Inventory Analytics | `js/inventory_analytics.js` | INVENTORY, PURCHASE_ORDERS |
| Digest | `js/digest.js` | Multiple T3 globals (daily brief) |
| My Tasks | `js/my_tasks.js` | JOBS, CALENDAR_EVENTS, EMPLOYEES |
| Module Modes | `js/module_modes.js` | module_modes.json (fetch at render) |
| Internal Meetings | `js/internal_meetings.js` | EMPLOYEES, JOBS, CUSTOMERS |

---

## T6 — Cross-Module Intelligence

These functions read from **multiple** T3 globals simultaneously. Must run after full hydration.

| Function | Reads from | Called by |
|---|---|---|
| `generateAlertsFromData()` | VD, PIPELINE, INVENTORY, PURCHASE_ORDERS, WARRANTY_CLAIMS, JOBS, CUSTOMERS | hydrateFromSupabase() — last step |
| `maybeAutoSnapshotKPIs()` | KPI_SNAPSHOTS, GOALS, PIPELINE, INVENTORY | hydrateFromSupabase() — after alerts |
| Pipeline Analytics | PIPELINE, CUSTOMERS, EMPLOYEES | `js/pipeline_analytics.js` |
| Decision Engine | PIPELINE, INVENTORY, VD, CUSTOMERS, PURCHASE_ORDERS | `js/decision_engine.js` |
| Demand Forecast | PURCHASE_ORDERS, INVENTORY, VD | `js/demand_forecast.js` |
| Competitive Pricing | COMPETITOR_PRICES, VD | `js/competitive_pricing.js` |
| Global Search | All 16 T3 globals (indexes at search time) | `js/global_search.js` |
| Vendor Ranking | VD, VENDOR_SCORES, VENDOR_OVERRIDES, PARENTS, COOP_FUNDS | inline in index.html |

---

## T7 — Async Infrastructure

Background processes and scheduled operations.

| Function | Trigger | Depends on |
|---|---|---|
| Worker probe IIFE | Inline script parse (Phase 1) | T0 only (fetch) |
| `applyModuleModesAfterHydrate()` | Post-hydration | T3 fully loaded |
| KPI auto-snapshot | Post-hydration + 30-min timer | T3 (KPI_SNAPSHOTS, GOALS) |
| Dashboard auto-refresh | Not implemented | — |

---

## Dependency Graph (Simplified)

```
T0 (Platform Primitives)
  └── T1 (Auth + Session)
        └── T2 (Supabase Client)
              └── T3 (Data Globals) ← populated by 27 sbLoad* calls
                    ├── T5 (Module UIs)    ← renders when goTo() called
                    └── T6 (Intelligence)  ← runs at hydration end
T4 (UI Primitives) ← no data deps, loaded with T5 scripts
T7 (Async Infra)   ← fires independently, reads T3 when ready
```

---

## Extraction Safety by Tier

| Tier | Can extract? | Notes |
|---|---|---|
| T0 | No | Inline required for DOM-ready availability |
| T1 | Partial | tryRestoreSession/activateApp depend on inline state |
| T2 | No | SB client initialization is inline |
| T3 | No | sbLoad* functions tightly coupled to inline globals |
| T4 | Yes | Already extracted to js/ |
| T5 | Yes | Already extracted to js/ |
| T6 | Yes | Already extracted to js/ |
| T7 | Partial | Probe IIFE must remain inline for Phase 1 timing |

---

_Update when new modules are added or load order changes._
