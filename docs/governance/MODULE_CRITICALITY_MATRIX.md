# AccentOS — Module Criticality Matrix
_Last updated: 2026-05-13_

---

## Purpose

Classifies every module by runtime criticality, stability, data dependencies, and operator impact. Used to prioritize hardening, testing, and decomposition work.

---

## Criticality Tiers

| Tier | Definition | Count |
|---|---|---|
| **CRITICAL** | App is non-functional or data loss risk if this fails | 6 |
| **HIGH** | Core business operation blocked if this fails | 10 |
| **MEDIUM** | Significant inconvenience; workaround exists | 12 |
| **LOW** | Minor feature; degraded gracefully | 8+ |

---

## Critical Tier

These modules represent the minimum viable AccentOS. If any fail, the session is broken.

| Module | Location | Why critical | Failure surface |
|---|---|---|---|
| **Auth + Session** | index.html (Tier 2) | No auth = no data, no visibility | Login loop; session loss |
| **Supabase client** | index.html (Tier 4) | All persistence depends on sbFetch | All saves/loads fail |
| **Navigation (goTo/MODULE_REGISTRY)** | index.html (Tier 3) | No page routing = blank screen | App appears broken |
| **Vendor data (VD)** | index.html (Tier 6) | 478 vendors + scoring = core product | Blank vendor ranking |
| **Quote Generator** | index.html (Tier 8) | Active sales workflow; used daily | Quote saves fail |
| **AI Worker** | index.html (Tier 5) + worker/ | AI parse, AI chat, vendor AI — all depend on worker auth | AI features 503 |

---

## High Tier

| Module | File | Data dependencies | Business function |
|---|---|---|---|
| **Customers** | `js/customers.js` | CUSTOMERS global | CRM — customer lookup for all other modules |
| **Sales Pipeline** | index.html | DEALS, QUOTES, CUSTOMERS | Revenue tracking |
| **Purchase Orders** | `js/purchase_orders.js` | VD, INVENTORY, CUSTOMERS | Vendor ordering |
| **Inventory** | `js/inventory.js` | VD | Stock tracking + reorder |
| **Alerts** | `js/alerts.js` | ALL globals | Proactive warning system |
| **Dashboard** | index.html (Tier 10) | ALL globals | Owner command center |
| **Reports** | `js/reports.js` | ALL globals | CSV exports — audit/compliance |
| **Warranty** | `js/warranty.js` | VD, CUSTOMERS | Claims tracking |
| **Deliveries** | `js/deliveries.js` | CUSTOMERS, JOBS, POs | Delivery scheduling |
| **Module Modes** | `js/module_modes.js` | module_modes.json | Controls visible features |

---

## Medium Tier

| Module | File | Business function |
|---|---|---|
| **Jobs** | `js/jobs.js` | Project tracking |
| **Employees** | `js/employees.js` | Scorecard + HR |
| **Marketing Hub** | `js/marketing.js` | Campaign tracking |
| **Knowledge Hub** | `js/knowledge_hub.js` | Internal docs |
| **Showroom Displays** | `js/showroom_displays.js` | Display program |
| **Trade Partners** | `js/trade_partners.js` | Designer/contractor network |
| **Competitive Pricing** | `js/competitive_pricing.js` | Price intelligence |
| **Demand Forecast** | `js/demand_forecast.js` | Reorder recommendations |
| **Decision Engine** | `js/decision_engine.js` | AI-derived sales recs |
| **Activity Feed** | `js/activity_feed.js` | Audit log viewer |
| **Internal Meetings** | `js/internal_meetings.js` | Meeting management |
| **Calendar** | `js/calendar.js` | Event scheduling |

---

## Low Tier

| Module | File | Business function |
|---|---|---|
| **Labels** | `js/labels.js` | Barcode printing |
| **Price Book** | `js/price_book.js` | Margin analysis view |
| **Deal Optimizer** | `js/deal_optimizer.js` | Negotiation recommendations |
| **Commission** | `js/commission.js` | Comp calculations |
| **Pipeline Analytics** | `js/pipeline_analytics.js` | Funnel/trend view |
| **Portal Preview** | `js/portal_preview.js` | Future portal mockup |
| **Digest** | `js/digest.js` | Scheduled summaries |
| **Vendor Score Import** | `js/vendor_score_import.js` | Bulk score CSV import |

---

## Stability Matrix

| Module | Stability | Last major change | Primary risk |
|---|---|---|---|
| Auth/Session | STABLE | v6.9.7 | JWT expiry handling |
| VD + scoring | STABLE | v6.9.x | scorecard formula drift |
| Quote Generator | STABLE | v6.10.75 | AI parse JSON shape |
| Pipeline | STABLE | v6.10.x | Stage enum drift |
| Customers | STABLE | v6.10.65 | RFM formula |
| Module Modes | EVOLVING | v6.10.65 | Permission resolution order |
| Internal Meetings | EVOLVING | v6.10.74 | Largest module (2,436 lines) |
| Inventory | STABLE | v6.10.62 | Windward sync gap |
| Alerts | STABLE | v6.10.22 | New alert type additions |
| Health | STABLE | v6.10.34 | Schema drift |
| Worker | STABLE | v3-env-fallback | API key binding |

---

## Data Dependency Tiers

Modules that READ the most globals carry the highest cross-module risk.

| Tier | Modules | Globals read |
|---|---|---|
| **Full-stack** (reads everything) | Dashboard, Reports, Alerts, Decision Engine | VD, CUSTOMERS, DEALS, QUOTES, INVENTORY, KPIs, GOALS, COOP_FUNDS, WARRANTY, DELIVERIES, POs |
| **Multi-domain** | Daily Brief, Pipeline Analytics, Demand Forecast | 4–8 globals |
| **Single-domain** | Most CRUD modules | 1–2 globals |
| **Pure-compute** | Price Book, Deal Optimizer | 1–2 globals, no mutation |

---

## Module Load Order (Critical Path)

External modules load in `<script>` tag order after the inline block. All inline globals are defined by the time any module's top-level code runs.

```
[Inline script — Tiers 1–10 parsed]
     ↓
customers.js      → attaches sbLoadCustomers, renderCustomers, etc.
employees.js      → attaches sbLoadEmployees, renderEmployees, etc.
knowledge_hub.js
jobs.js
purchase_orders.js
calendar.js
inventory.js      → attaches sbLoadInventory, INVENTORY var
csv_import.js     → attaches csvImportFlow helper
vendor_score_import.js
price_book.js     → pure-compute over INVENTORY + VD
deal_optimizer.js → pure-compute over VD + DEALS
trade_partners.js
warranty.js
showroom_displays.js
labels.js
deliveries.js
decision_engine.js → pure-compute, reads all globals
competitive_pricing.js
marketing.js
alerts.js         → generateAlertsFromData reads all globals
demand_forecast.js
global_search.js  → indexes all globals
reports.js        → reads all globals
bulk_vendor_ops.js
activity_feed.js
commission.js
pipeline_analytics.js
quick_actions.js
portal_preview.js
health.js         → diagnostics, reads sbConfigured
inventory_analytics.js
digest.js
my_tasks.js
saved_filters.js
bulk_select.js
module_modes.js   → last; reads MODULE_REGISTRY + USER_OVERRIDES
internal_meetings.js → largest module, last-ish load
     ↓
[DOMContentLoaded fires]
     ↓
tryRestoreSession → activateApp → hydrateFromSupabase → goTo('dashboard')
```

**Key invariant:** `DOMContentLoaded` fires AFTER all `<script>` tags parse. The startup sequence is safe because all module functions exist on `window` before the async boot sequence starts.

---

## Module Ownership Matrix

Who is responsible for each layer when things break:

| Layer | Owner | Symptom | First action |
|---|---|---|---|
| Worker auth | Cloudflare + GitHub Actions | `env_key_set: false` or 401 | Check GitHub Actions run → CF secrets |
| Supabase schema | Michael (SQL runner) | 404 on sbLoad*, RLS errors | Run pending M## migrations |
| Module logic bugs | Claude Code | JS errors in console | Identify function, patch inline or in module |
| Data quality | Michael (data entry) | Wrong scores/counts | Edit data in UI or CSV import |
| Role permissions | Michael (user mgmt) | User can't see page | Settings → Users → fix role |
| Module mode visibility | Michael (module modes UI) | Module hidden/showing wrong | module_modes page → toggle |

---

_Last updated: 2026-05-13. Review after each new module extraction or architectural decision._
