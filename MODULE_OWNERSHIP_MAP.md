# MODULE_OWNERSHIP_MAP.md — AccentOS Module Ownership
> Who owns each module, where it lives, what it touches.

**Last updated:** 2026-05-08

---

## MODULE REGISTRY

| Module | Code Location | Schema Tables | Roles With Access | Status |
|---|---|---|---|---|
| Auth / Session | index.html (inline) | user_profiles, audit_log | All | ✅ Live |
| Dashboard / Daily Brief | index.html → dashboard() | quotes, pipeline_deals, customers, coop_tracker | All (role-variant) | ✅ Live |
| Vendor Intelligence | index.html (inline) | vendor_scores, vendor_overrides, vendor_score_states, parent_companies, vendor_parent_assignments | Owner, Admin, Manager, Sales | ✅ Live |
| Co-op Fund Tracker | index.html (inline, sub-tab) | coop_tracker | Owner, Admin, Manager | ✅ Live |
| Quote Generator | index.html (inline) | quotes, quote_lines | Owner, Admin, Manager, Sales | ✅ Live (BUG-01) |
| Sales Pipeline | index.html (inline) | pipeline_deals, pipeline_events | Owner, Admin, Manager, Sales | ✅ Live |
| CRM / Customers | js/customers.js | customers, customer_interactions | Owner, Admin, Manager, Sales | ✅ Live |
| Employees | js/employees.js | employees, employee_scores | Owner, Admin, Manager | ✅ Live |
| Product Lookup / Inventory | js/inventory.js | inventory_items | Owner, Admin, Manager, Warehouse | ✅ Live |
| Price Book | js/price_book.js | inventory_items (read-only compute) | Owner, Admin, Manager, Sales | ✅ Live |
| Purchase Orders | js/purchase_orders.js | purchase_orders, po_lines | Owner, Admin, Manager, Warehouse | ✅ Live |
| Knowledge Hub | js/knowledge_hub.js | knowledge_articles | All | ✅ Live |
| Job Tracker | js/jobs.js | jobs | Owner, Admin, Manager, Sales | ✅ Live |
| Calendar | js/calendar.js | calendar_events | All | ✅ Live |
| Trade Partners | js/trade_partners.js | trade_partners | Owner, Admin, Manager, Sales | ✅ Live |
| Warranty | js/warranty.js | warranty_claims | All | ✅ Live |
| Competitive Pricing | js/competitive_pricing.js | competitor_prices | Owner, Admin, Manager | ✅ Live |
| Marketing Hub | js/marketing.js | marketing_campaigns | Owner, Admin, Manager | ✅ Live |
| Decision Engine | js/decision_engine.js | (compute over existing tables) | Owner, Admin, Manager | ✅ Live |
| Deal Optimizer | js/deal_optimizer.js | (compute over existing tables) | Owner, Admin, Manager, Sales | ✅ Live |
| Reports | js/reports.js | (aggregate queries) | Owner, Admin, Manager | ✅ Live |
| Deliveries | js/deliveries.js | deliveries | Owner, Admin, Manager, Warehouse | ✅ Live |
| Showroom Displays | js/showroom_displays.js | showroom_displays | Owner, Admin, Manager | ✅ Live |
| Internal Meetings | js/internal_meetings.js | internal_meetings, meeting_agenda_items | Owner, Admin, Manager | ✅ Live |
| Mgmt Dashboard | index.html (inline) | (aggregate) | Owner, Admin, Manager | ✅ Live |
| AccentOS Shell | ui/ (new, isolated) | (none — UI only) | All (prototype) | 🟡 Prototype |

---

## EXTRACTION STATUS

Modules extracted from index.html to js/ (v6.10.12):
- customers, employees, knowledge_hub, jobs, purchase_orders, calendar, inventory, price_book, deal_optimizer

Still inline in index.html:
- Auth, Dashboard, Vendor Intelligence, Co-op Tracker, Quote Generator, Sales Pipeline, Mgmt Dashboard

---

## OWNERSHIP NOTES

- **Claude owns:** Code quality, extraction, new module builds, design system docs
- **Michael owns:** SQL migration runs, wrangler deploys, Supabase config, production decisions
- **Shared:** Architecture decisions, feature prioritization

---

## DEPENDENCY MAP (CRITICAL CROSS-MODULE READS)

| Consumer | Reads From | Data | Risk if Broken |
|---|---|---|---|
| Daily Brief | CUSTOMERS, QUOTES, pipeline_deals, coop_tracker | Tiles and counts | High — dashboard goes empty |
| Pipeline | CUSTOMERS | Name-match for customer linkage | Medium — loses customer link |
| Price Book | INVENTORY | SKU cost data for margin compute | Medium — prices show $0 |
| Deal Optimizer | DEALS, QUOTES, CUSTOMERS, CUSTOMER_INTERACTIONS, INVENTORY, CHANGELOG | All recs | Low — module goes blank |
| Decision Engine | All of the above | All signals | Low — module goes blank |

These cross-module reads all depend on globals (CUSTOMERS, QUOTES, INVENTORY, etc.) being populated before the consuming module runs. The current architecture loads all external scripts synchronously after the inline block, so globals are available. Do not convert these to async imports without a dependency graph plan.
