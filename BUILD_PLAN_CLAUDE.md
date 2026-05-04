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
  - What: split monolithic index.html into shell + 4 module files (vendor / pipeline / knowledge / marketing)
  - Blocks: nothing immediate (already done)

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

- [ ] **1.4** — CRM & Customer Intelligence
  - What: `customers` + `customer_interactions` tables, customer profile UI, RFM scoring, lifecycle tagging, basic timeline view
  - Value: $19.2K/yr per MASTER §5
  - Blocks: 1.5 Pipeline (deals attach to customers), 4.1 Owner Dashboard
  - BLOCKS ON MICHAEL: **M02** AND **M07** (decision: manual entry vs. Windward CSV import)

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

- [ ] **3.1** — Employee Scorecards
  - Scoping LOCKED via M08: visible to Owner/Admin/Manager only; Windward CSV import data source (waiting). Build UI + schema hooks; wire CSV when Michael provides file. Tables `employees` + `employee_scores` exist in M02.

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

- [ ] **5.1** — Knowledge Hub (internal docs, vendor playbooks, rep contact protocols)
- [ ] **5.2** — Job Tracker (project-level work tracking)
- [ ] **5.3** — Inventory Module (live data — currently display-only)
  - BLOCKS ON MICHAEL: **M03** (Windward S5WebAPI confirmation) for live data; can ship CSV-import version without
- [ ] **5.4** — Purchase Orders
- [ ] **5.5** — Trade Partner Network (external designers/contractors)
- [ ] **5.6** — Price Book (catalog with margin analysis)
- [ ] **5.7** — Vendor Deal Optimization (recommend negotiation moves from score deltas)
- [ ] **5.8** — Showroom Display Management (display program tracking)
- [ ] **5.9** — QR/Barcode (warehouse + showroom labeling)
- [ ] **5.10** — Delivery Scheduling
- [ ] **5.11** — Warranty Tracker
- [ ] **5.12** — Marketing Hub (full build — current `marketing` page is a scaffold)
- [ ] **5.13** — E-Commerce Command Center
  - BLOCKS ON MICHAEL: **M04** (BigCommerce API key) AND **M05** (GMC API access)
- [ ] **5.14** — Competitive Pricing Intelligence
- [ ] **5.15** — Sales Decision Engine
- [ ] **5.16** — Company Calendar

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
