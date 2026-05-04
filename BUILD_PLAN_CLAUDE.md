# BUILD_PLAN_CLAUDE.md — Autonomous Build Queue

> **Rules of engagement.**
> 1. Work this list **top to bottom**. Do not skip ahead arbitrarily.
> 2. Mark `[x]` the moment an item is shipped (committed + pushed).
> 3. Never stop and wait unless the item has an unresolved `BLOCKS ON MICHAEL: M##`. If blocked, **skip to the next unblocked `[ ]` item** — do not idle.
> 4. After each ship, append a SESSION_LOG.md entry. Update MASTER.md §3 if module status flipped.
> 5. Keep commits scoped per item. Use semver-ish: `vX.Y.Z` for code, `docs:` for doc-only.
> 6. If an item is too large for a single session, split into Chunks (A/B/C) inline and check off each chunk.

---

## TRACK 0 — Infrastructure

- [x] **0.1** — File architecture split
  - Originally marked done as a design intent, but the actual extraction shipped v6.10.12 (2026-05-04). Extracted 9 module files into `js/`: customers, employees, knowledge_hub, jobs, purchase_orders, calendar, inventory, price_book, deal_optimizer. index.html dropped from 829KB → 680KB (-149KB, -18%). Each module file 8–26KB. JS parses clean across inline + 9 external script tags. Loading: `<script src="js/<name>.js?v=…">` after the closing inline `</script>` so all helpers ($, esc, sbFetch, openModal) are defined first. Cross-module reads (Daily Brief reading CUSTOMERS, Pipeline matching by customer name, Price Book reading INVENTORY) continue working because globals attach to window same as before.

- [x] **0.2.A** — Auth Chunk A: Supabase Auth + role-based sidebar
  - What: replace hardcoded auto-login with Supabase Auth (REST), 5-role system, JWT session, `data-roles` sidebar gating, audit_log writes for login/logout/session_resume/score_save
  - Blocks: 0.2.B, 0.2.C, all RLS-tightening work

- [x] **0.2.B** — Auth Chunk B: Settings → Users panel
  - Shipped v6.9.7: owner-only Users panel reads user_profiles, role dropdown + Save per row writes via PATCH; "My Account" card with Change Password (PUT /auth/v1/user) and Sign Out; audit_log writes on role_change + password_change.

- [x] **0.2.C** — Auth Chunk C: RLS SQL block written
  - Shipped: `sql/M01_rls_tightening.sql` — drops anon policies, creates authenticated read for all + role-gated writes on vendor_categories / vendor_score_states / vendor_changelog / parent_companies / vendor_parent_assignments. Idempotent. Pending Michael run via M01.

- [x] **0.4** — Core database schema written
  - Shipped: `sql/M02_core_schema.sql` — 18 tables (vendor_scores, vendor_overrides, coop_tracker, customers, customer_interactions, quotes, quote_lines, pipeline_deals, pipeline_events, probability_model_log, employees, employee_scores, goals, kpi_definitions, kpi_snapshots, alerts, telemetry_events, build_events). All RLS-enabled with three write tiers (Owner-only, Manager+, all-authed) and one Sales/Warehouse-readable tier. Pending Michael run via M02.

---

## TRACK 1 — Highest Immediate Business Impact

- [x] **1.1** — Vendor numeric score persistence (full)
  - Shipped v6.9.9: `sbLoadVendorScores` + `sbSaveVendorScore` (upsert by vendor_id+category_key), wired into save flow + sister-brand propagation. Numeric values now persist alongside data_state.

- [x] **1.2** — Quote Generator — Persistence + Save/Retrieve
  - Shipped v6.10.0: quotes + quote_lines tables wired; load/save/delete; Saved Quotes modal with per-row Delete; quote.notes JSONB packs the type/sqft/budget/contact extras until schema gets first-class columns; QUOTE_ID seeded from highest-seen QT-#### number.

- [x] **1.3** — Daily Command Center (phase 1 + phase 2)
  - Phase 1 (v6.9.8): role-aware "📌 Today" card with 6 tiles (unverified scores, tier C, 24h activity, unassigned reps, mixed-rep parents, avg score gauge).
  - Phase 2 (v6.10.2): added Closing ≤7d (deals with expected_close in next 7 days, weighted forecast), Stale Deals (no update 14d+), Stale Quotes (>7d unfollowed), Co-op Deadlines (≤30d open funds with $$ at risk).

- [x] **1.4** — CRM & Customer Intelligence
  - Shipped v6.10.3: Customers page (sidebar) with persistence on customers + customer_interactions. RFM compute (recency/frequency/monetary in 12-mo window), 5 segments (VIP/Active/Lapsed/Lost/Prospect). Detail modal: profile + RFM stats + merged activity timeline (interactions + linked quotes by name + linked deals by company name). Add/Edit interaction modal. customer_id ↔ quote_id / deal_id UUID linkage is a follow-up — schema supports it but save flows still use name-match.

- [x] **1.5** — Sales Pipeline — Persistent + Loss Tracking
  - Shipped v6.10.1: stages refactored to schema-compatible (lead/qualified/quoted/negotiating/won/lost/abandoned). 8-factor probability model `computeDealProbability` with weights {lead_source 10%, customer_history 18%, segment 8%, project_type 10%, quote_age 12%, comm_recency 12%, quote_size 10%, stage 20%}. Probability shown on every deal card + factor breakdown in detail modal. Forecast = Σ(value × probability) on Pipeline header. Close Rate stat (Won/(Won+Lost)). Archive view for lost/abandoned deals with loss reason capture. Persist via pipeline_deals; pipeline_events log on every stage change + note. Daily Brief gets new Stale Deals tile (no update in 14d).

---

## TRACK 2 — Vendor Intelligence (Foundation Completion)

- [x] **2.1** — Parent Company / Brand Family Grouping UI
  - Shipped v6.9.7: collapsible parent groups in Scores tab (▼/▶ chevron, click row to toggle, Expand all / Collapse all buttons); parent badge in vendor detail header; Sister Brands card with click-through to each sister's detail. Pre-existing rolled-up sales + avg score retained.

- [x] **2.2** — Vendor Metadata, Notes & Override Persistence
  - Shipped v6.9.9: `sbLoadVendorOverrides` + `sbSaveVendorOverride`. Edit modal extended with Tier Override (Auto/A/B/C), Notes textarea, Inactive checkbox + reason. `computeVendorTier` honors `v.tier_override` first.

- [x] **2.3** — Rebate & Co-Op Fund Tracker
  - Shipped v6.10.0: new "Co-op Funds" sub-tab on Vendor Ranking page; load/save/delete via coop_tracker REST; 4-stat header (open count + $ on table, deadline ≤30d count, claimed YTD, total tracked); add/edit modal with vendor picker, fund_type, amount, period, deadline, status, notes. Daily Brief tile for ≤30d open funds with $$ at risk.

---

## TRACK 3 — Employee Intelligence

- [x] **3.1** — Employee Scorecards
  - Shipped v6.10.4: Employees added as 6th tab on Mgmt Dashboard (Owner/Admin/Manager only — restricted view banner). Persistence on employees + employee_scores. Directory list with avg-score color coding. Detail modal: pivot grid of period × metric × score with click-through edit. 8 default metric keys (revenue_attainment, quote_close_rate, avg_deal_size, customer_satisfaction, tickets_resolved, on_time_delivery, attendance, training_complete) — custom metric keys preserved on edit. Period default = current quarter. on_conflict on (employee_id, period, metric_key) for safe re-save. Banner notes Windward CSV is the eventual data source; manual entry works today.

- [x] **3.2** — Role-Based Dashboards
  - Shipped v6.10.2: `dashboard()` now branches by role. Warehouse = minimal (Inventory + activity feed). Sales = my-deals + my-quotes stats with probability per deal. Owner/Admin/Manager = full vendor + pipeline view with system status reflecting v6.10.x state. All variants share the role-aware Daily Brief.

---

## TRACK 4 — Owner Intelligence & Strategy

- [x] **4.1** — Owner Dashboard
  - Shipped v6.10.2: Mgmt Dashboard restructured into 5 sub-tabs (Overview / KPIs / Goals & OKRs / Team Activity / System). Overview = YTD Won revenue, pipeline forecast, Co-op $ open, avg vendor score, pipeline-by-stage, quote velocity 30d, top 10 vendors.

- [x] **4.2** — KPI Master Registry
  - Shipped v6.10.2: 8-KPI seed catalog auto-loads on Owner first visit; renders per visible_to_roles. Owner-only "Snapshot today" writes one kpi_snapshots row per KPI per day (on_conflict on kpi_key+snapshot_date for safe re-run). audit_log on kpi_snapshot.

- [x] **4.3** — Goal Architecture / OKRs
  - Shipped v6.10.2: 5-level hierarchy via parent_id. Tree view with progress bars. Edit modal auto-suggests level one deeper than parent. Delete cascades. audit_log on goal_create/edit/delete.

---

## TRACK 5 — Phase 3 Modules (Fall 2026)

> Each is a standalone module. Parallel-buildable once §0.4 schema is in place.

- [x] **5.1** — Knowledge Hub (internal docs, vendor playbooks, rep contact protocols)
  - Shipped v6.10.7: "Internal Docs" tab on Knowledge Engine page. Two-pane layout (article list + viewer with markdown rendering). 7 categories. Search + category filter, pinned-first sort. Markdown subset (# / ## / ### headings, **bold**, *italic*, [text](url) links, - bullets, newlines). Edit modal with auto-derived slug, comma tags, pin toggle. Persistence on `articles` table from M21 schema (no-ops gracefully if table doesn't exist).
- [x] **5.2** — Job Tracker (project-level work tracking)
  - Shipped v6.10.8: New "Job Tracker" page (CORE section, all roles). 4 stat cards (active/overdue/due≤7d/completed). Filters by status + priority + free-text. Auto job_number J-####. Edit modal links to existing customers (CUSTOMERS dropdown) and quotes (QUOTES dropdown), or accepts free-text customer name. Status-color badges. completed_at auto-set when status flips to complete. Persistence on `jobs` table from M21 schema.
- [x] **5.3** — Inventory Module — CSV phase 1
  - Shipped v6.10.9: replaced placeholder Inventory sub-tab with full CSV-import + filterable list. New `inventory_items` table (M22 SQL written, pending Michael run). 4 stat cards (tracked SKUs / units / inventory value / below-reorder). CSV import: paste-or-upload, header alias mapping (sku/qty/cost/etc.), vendor_name → vendor_id resolution against existing VD, preview-then-commit flow. Bulk upsert via on_conflict on (vendor_id, sku). Low-stock filter highlights rows red. Live Windward sync still ships with Track 6.11 — uses the same `inventory_items.import_source` column ('windward' vs 'csv').
  - BLOCKS ON MICHAEL: **M22** (run inventory schema), **M03** + **M10** (Windward live data, future Track 6.11)
- [x] **5.4** — Purchase Orders
  - Shipped v6.10.11: New "Purchase Orders" page (CORE section, Owner/Admin/Manager). Persistence on purchase_orders + po_lines tables (M23 SQL, pending Michael run). 4 stat cards (open count by status / past-expected count / open $ / received YTD). Filters: free-text + status + vendor. Auto PO-#### number. Edit modal: vendor dropdown from VD, line-item editor (in-modal table with add/remove rows + live ext_cost + auto-calc subtotal/total), tax + freight, related quote + job dropdowns. "Mark Received & Update Inventory" button increments inventory_items.qty_on_hand for matching SKU+vendor on receipt. Status badges color-coded.
- [x] **5.5** — Trade Partner Network (external designers/contractors)
  - Shipped v6.10.13: New "Trade Partners" page (CORE, Sales+ access). External JS module `js/trade_partners.js`. Persistence on `trade_partners` table from M24 schema. 7 partner types (designer/contractor/architect/builder/installer/electrician/other). 4 stat cards (active count, designer/architect/builder breakdown, trade subtotal, avg rating). Filters: free-text + type + status. Edit modal with name/company/contact/address/license/rating/preferred terms/notes/linked-customer dropdown. Status workflow: active/prospect/inactive.
- [x] **5.6** — Price Book (catalog with margin analysis)
  - Shipped v6.10.10: New "Price Book" sub-tab on Vendor Ranking. Pure-compute view over inventory_items + VD — no new schema. Computes margin = (list-cost)/list and markup = (list-cost)/cost per SKU; joins vendor tier + score from VD. 4 stat cards (SKUs in book / avg margin / high-margin count / vendor count). Filters: free-text, vendor, tier, in-stock-only. Sort by margin descending. Color-codes margin column (green ≥50%, blue ≥30%, accent <30%). Shows "empty until inventory loaded" placeholder when INVENTORY is empty.
- [x] **5.7** — Vendor Deal Optimization (recommend negotiation moves from score deltas)
  - Shipped v6.10.5: "Deal Optimizer" sub-tab on Vendor Ranking page. Pure-compute layer over existing data — no new schema. 5 recommendation kinds: RENEGOTIATE (≥$25K spend + low pricing/freight/returns score), INVESTIGATE (any cat dropped ≥2 points in last 90d via CHANGELOG), REPLACE (inactive flag but >$1K in 2024–25 sales), UPGRADE (Tier B + avg ≥7.5 across ≥3 cats + ≥$5K), CUT (low spend + low score + near-zero recent activity). Stats header: count per kind + summed estimated annual impact. Click row → vendor detail.
- [x] **5.8** — Showroom Display Management (display program tracking)
  - Shipped v6.10.15: New "Showroom Displays" page (CORE, Sales+ access). External JS module `js/showroom_displays.js`. Persistence on `showroom_displays` table from M25 schema. 6-state workflow (planned/installed/active/expiring/expired/removed). 4 stat cards: live displays / expiring ≤60d / retail value / net cost (paid minus co-op). Filters: free-text + status + vendor. Edit modal: vendor (VD dropdown), display name, location, install/expires/removed dates, participation cost, co-op value, retail value, SKUs (comma-list parsed to array), linked co-op fund (COOP_FUNDS dropdown), contract terms, notes. removed_date auto-set when status flips to removed.
- [x] **5.9** — QR/Barcode (warehouse + showroom labeling)
  - Shipped v6.10.16: New "Labels" page (CORE, all roles incl. Warehouse). External JS module `js/labels.js`. Two source modes: manual entry (textarea, "value | caption" per line) OR from inventory (multi-select with filter, pulls from INVENTORY). 3 label sizes (small/medium/large) × 2-6 columns. QR codes via api.qrserver.com (free, no API key, GET URLs). Print via window.print() with injected `@media print` stylesheet hiding chrome. Optional save-batch flow persists to `label_batches` table (M26 SQL). audit_log writes for labels_print + labels_batch_save.
- [ ] **5.10** — Delivery Scheduling
- [x] **5.11** — Warranty Tracker
  - Shipped v6.10.14: New "Warranty" page (CORE, all roles). External JS module `js/warranty.js`. Persistence on `warranty_claims` table from M24 schema. 7-state workflow: open → sent_to_vendor → approved/denied → replaced/refunded → closed. 3 severity levels (cosmetic/functional/safety). Auto W-#### claim numbering. 4 stat cards (open count by sub-status, warranty expiring ≤30d, open cost-to-us $, resolved count). Filters: free-text + status + vendor. Edit modal links to vendors (VD), customers (CUSTOMERS dropdown OR free-text), and quotes (QUOTES dropdown). Auto-sets resolution_date when status flips to closed/denied/refunded/replaced. Severity color-coded.
- [ ] **5.12** — Marketing Hub (full build — current `marketing` page is a scaffold)
- [ ] **5.13** — E-Commerce Command Center
  - BLOCKS ON MICHAEL: **M04** (BigCommerce API key) AND **M05** (GMC API access)
- [ ] **5.14** — Competitive Pricing Intelligence
- [ ] **5.15** — Sales Decision Engine
- [x] **5.16** — Company Calendar
  - Shipped v6.10.6: Calendar page (sidebar INTELLIGENCE, all roles). Two views: month grid + agenda list. Prev / Next / Today nav. 7 categories color-coded (trade_show / training / deadline / holiday / meeting / launch / other) with legend. Click empty day → New Event prefilled to that date. Detail modal: starts/ends, location, URL, description. Persistence on `calendar_events` table from M21 schema.

---

## TRACK 6 — Phase 4 Integrations & AI Automation (EOY 2026)

- [ ] **6.1** — Google Analytics 4 integration
  - BLOCKS ON MICHAEL: **M06** (GA4 service account credential)
- [ ] **6.2** — Google Search Console integration
  - BLOCKS ON MICHAEL: **M06**
- [ ] **6.3** — BigCommerce REST integration
  - BLOCKS ON MICHAEL: **M04**
- [ ] **6.4** — Klaviyo integration
  - BLOCKS ON MICHAEL: **M09** (Klaviyo API key)
- [ ] **6.5** — Trade & Designer Portal (external-facing)
- [ ] **6.6** — Vendor Rep Portal (external-facing)
- [ ] **6.7** — AI Lighting Consultant (customer-facing chat for accentlightinginc.com)
- [ ] **6.8** — Intelligent Alerts (Agentic Level 3 → 4 cross-system)
- [ ] **6.9** — AI Demand Forecasting
- [ ] **6.10** — AccentOS → accentlightinginc.com embed (employee tools on the public site, role-gated)
- [ ] **6.11** — Windward ERP Live Integration (read-only via S5WebAPI Edge Function)
  - BLOCKS ON MICHAEL: **M03** (Windward written confirmation) AND **M10** (Curtis outreach)
- [ ] **6.12** — Google Ads / Meta Ads
  - Status: **No API access** per MASTER §10. Manual admin only — not automatable until Google Ads API auth granted by account holder.

---

## How to use this file

When you start a session:
1. Open this file. Find the first `[ ]` item from the top.
2. If it has `BLOCKS ON MICHAEL: M##`, check BUILD_PLAN_MICHAEL.md — if M## is `[ ]` (still pending), skip to the next `[ ]` item that isn't blocked.
3. Build it. Commit. Push.
4. Mark `[x]` here. Update SESSION_LOG.md.
5. If multiple items completed in one session, batch the SESSION_LOG entry.

When everything is `[x]`, AccentOS Phase 4 is done.
