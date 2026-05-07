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
- [x] **5.10** — Delivery Scheduling
  - Shipped v6.10.17: New "Deliveries" page (CORE, all roles incl. Warehouse). External JS module `js/deliveries.js`. Persistence on `deliveries` table from M27 schema. 6-state workflow (scheduled/out_for_delivery/delivered/failed/rescheduled/cancelled). Auto DLV-#### numbering. 4 stat cards: today/tomorrow count / overdue count (red border) / in-transit count / delivered YTD. Filters: when (upcoming/today/past/all) + status + free-text. Edit modal with customer dropdown auto-fills name + address from CUSTOMERS, optional links to job/quote/PO, scheduled date + time window, driver + vehicle, items summary, weight, signature-required toggle + signed-by name, failure reason. delivered_at auto-set when status flips to delivered.
- [x] **5.11** — Warranty Tracker
  - Shipped v6.10.14: New "Warranty" page (CORE, all roles). External JS module `js/warranty.js`. Persistence on `warranty_claims` table from M24 schema. 7-state workflow: open → sent_to_vendor → approved/denied → replaced/refunded → closed. 3 severity levels (cosmetic/functional/safety). Auto W-#### claim numbering. 4 stat cards (open count by sub-status, warranty expiring ≤30d, open cost-to-us $, resolved count). Filters: free-text + status + vendor. Edit modal links to vendors (VD), customers (CUSTOMERS dropdown OR free-text), and quotes (QUOTES dropdown). Auto-sets resolution_date when status flips to closed/denied/refunded/replaced. Severity color-coded.
- [x] **5.12** — Marketing Hub (full build)
  - Shipped v6.10.20: replaced static placeholder `marketing()` (was just site issues + agency status) with full multi-tab module in `js/marketing.js`. 4 tabs: Overview (4 stats: active count / budget vs spent / ROI color-coded / leads-deals conversion + by-type breakdown + recent activity feed), Campaigns (CRUD with 8 types: email/print/digital/social/event/promo/co_op/other; 5 statuses; promotion-specific collapsed details for discount %/$ + promo SKUs; attribution metrics for leads/deals_won/revenue_attributed; ROI computed per row), Asset Library (grid view with type icons + tag chips + URL passthrough; 6 asset types), Site Audit (preserved from original placeholder). Schema in M29 (marketing_campaigns + marketing_assets, idempotent). Linked-vendor + linked-campaign cross-refs. Track 5 fully complete.
- [ ] **5.13** — E-Commerce Command Center
  - BLOCKS ON MICHAEL: **M04** (BigCommerce API key) AND **M05** (GMC API access)
- [x] **5.14** — Competitive Pricing Intelligence
  - Shipped v6.10.19: New "Competitive Pricing" page (CORE, Sales+ access). External JS module `js/competitive_pricing.js`. Schema in M28 (`competitor_prices` — append-only observations table; multiple snapshots per SKU+competitor). Latest-per-pair view in UI. Position calc: undercut (we &gt;5% below), parity (within 5%), premium (we &gt;5% above), unknown. our_price falls back to current INVENTORY.list_price for the SKU. 4 stat cards: SKUs tracked / undercutting / premium / avg vs competitor. Filters: SKU/desc/competitor search + competitor + position. SKU autocomplete from inventory; auto-fills description + our_price + vendor. Each row click-throughs to edit modal.
- [x] **5.15** — Sales Decision Engine
  - Shipped v6.10.18: New "Decision Engine" page (CORE, Sales+ access). External JS module `js/decision_engine.js`. Pure-compute layer over DEALS + QUOTES + CUSTOMERS + CUSTOMER_INTERACTIONS + INVENTORY + CHANGELOG — no new schema. 5 recommendation kinds: CHASE (high prob × high value, not won), FOLLOW-UP (open quotes 7-60d old), AT-RISK (deals 14d+ stale ≥$2K), RETAIN (VIP/Active customers 60+ days quiet), UPSELL (recently won deals ≥$3K, 7-90d post-win). Each row click-throughs to the relevant page (deal detail, customer detail, etc.) via existing `goTo` + `setTimeout` pattern. 4 stat cards: chase / follow-up / at-risk / total estimated 30d impact. Filters by kind + min-impact threshold.
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
- [x] **6.7** — AI Lighting Consultant (phase 1 — customer mode toggle inside AccentOS)
  - Shipped v6.10.23: Added "Customer Mode" toggle to the existing Knowledge Engine "Ask the Engine" tab. Two modes: **Internal** (existing — vendor names + margins + specs OK) vs **Customer** (warm consumer-facing tone, room-by-room recommendations, fixture sizing, layered design ideas; never reveals internal data). Mode persists via sessionStorage. Different intro text, chip suggestions (5 customer-friendly questions), and label ("ACCENT CONSULTANT" vs "ACCENT ENGINE"). Different system prompt: customer mode warns it never reveals being an AI on Claude and routes specifics to "schedule a showroom visit or request a quote." Phase 2 (deferred): extract chat to a public iframe embeddable on accentlightinginc.com once M18 site approval lands and Track 6.10 deploys the embed.
- [x] **6.8** — Intelligent Alerts (Agentic Level 3 → 4 cross-system)
  - Shipped v6.10.21: New "Alerts" sidebar entry (CORE, all roles). External JS module `js/alerts.js`. Uses existing `alerts` table from M02 schema — no new SQL needed. 9 generators auto-run on hydrate: deal_stale (14d+ no update, ≥$2K), coop_deadline (≤14d), quote_cold (>21d, ≥$500), inventory_low (below reorder_point), delivery_overdue (past schedule, not done), warranty_expiring (≤30d, open), showroom_expiring (≤14d), po_overdue (past expected_date, not received), score_dropped (≥3 points down in last 7d via CHANGELOG). Dedupe via (type, source_id) key — re-runs skip already-emitted alerts. 4 stat cards: unread / urgent / read+actioned / total. Filters: free-text + status + severity. Per-alert actions: Open → / Mark read / Done (actioned) / Dismiss. Click-through marks as read automatically. Mark-all-read button.
  - **v6.10.22 polish:** Topbar bell icon with unread count badge + dropdown showing top-5 unread alerts sorted by severity. Click an item → marks read + navigates to relevant page. "View all alerts" button. Bell auto-refreshes on every goTo() via wrapped dispatcher; outside-click closes dropdown. 🔔 (unread) / 🔕 (none) emoji toggle.
- [x] **6.9** — AI Demand Forecasting
  - Shipped v6.10.25: New "Demand Forecast" page (CORE, Owner/Admin/Manager). External JS module `js/demand_forecast.js`. Pure-compute layer over INVENTORY + PO_LINES — no new schema. Velocity proxy = sum(qty in PO lines, last 90d) / 13 weeks. Per-SKU recommendation: `reorder_now` (<6 weeks of stock or out with velocity), `reorder_soon` (6-9 weeks), `overstock` (>26 weeks), `normal`, `no_data` (no PO history). Suggested qty targets 14 weeks of forward demand. 4 stat cards: SKUs forecasted / reorder now / reorder soon / suggested PO $. Filters: free-text + vendor + recommendation kind. Topbar Export button → CSV of all reorder_now + reorder_soon SKUs. Daily Brief tile for "Reorder Now" (senior-only) with summed suggested PO $. Heuristic constants documented inline; sharpens as PO history accumulates. Track 6.11 (Windward live) will swap PO-line proxy for actual sales-line history without UI changes.
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

---

## TRACK 7 — Phase 0 Foundation Gate (ROADMAP_2026 v3.1)

> Gates Phase 1+. Nothing past Track 7 ships until 7.1, 7.2, 7.4, 7.5 are green at W4 review.
> 12 items, ~3 weeks, ~91h retrofit budget across Phase 0+2.

- [ ] **7.1** — `automation_events` table (the spine for ΔROI + adoption + edit-distance + thumbs)
  - Schema per ROADMAP §9; columns: action_id, action_version, user_id, fired_at, trigger_kind, dry_run, model, tokens_in/out (cached + uncached), compute_ms, human_approval_sec, est_cost_usd, value_kind, value_amount_usd, value_attribution_method, value_confidence, value_realized_at, outcome, linked_entity (jsonb), counterfactual_group
  - Idempotent SQL → M30
  - BLOCKS ON MICHAEL: **M30** (run automation_events schema)

- [ ] **7.2** — AI Gateway module (`js/ai_gateway.js`)
  - Wraps all Claude API calls. Cost telemetry per call → 7.1. Prompt caching enabled. Model-tier router (Haiku default → Sonnet on demand → Opus escalate). Workspace cap with 80% kill-switch. Per-user/action quota. Env-flag shim through W2 so legacy direct calls still work, hard-cut W3.
  - BLOCKS ON MICHAEL: **M31** (Anthropic workspace billing cap configured)

- [ ] **7.3** — Threshold service (`js/thresholds.js`)
  - Bayesian Beta-LCB recalibration loop. Min-N=15 gate before LCB trusted (red-team fix). EMA smoothing α=0.4. Asymmetric tightening (1 round) vs loosening (3-round confirm). Step size capped ±0.10/round. `thresholds/registry.yaml` + `thresholds/history.jsonl`. Owner override via `thresholds/overrides.yaml`. Decoupling alarm: T relaxes >5pp AND downstream KPI drops >1σ same round → auto-revert + page Owner.

- [ ] **7.4** — Heartbeat dashboard v1 (6 metrics)
  - `js/heartbeat.js`. Tier 1 (Daily Revenue, Gross Margin, CR, AOV, Quote→Close, RPS — 4 deferred to v2). Tier 4 (ΔROI per automation, AI Cost Burn, Eval Score, Retrieval Relevance — 2 deferred to v2). Per-persona top-of-dashboard tiles (Michael / Patrick / Paul / Employee scaffold; Customer in §13). Single "needs-attention-now" alert lane (red-team fix vs wallpaper).

- [ ] **7.5** — Security gate CI (RLS regression + JWT aud split + hash-chained audit_log)
  - One CI job, three checks. RLS regression matrix per role × table (ephemeral DB on PR). JWT `aud` claim split (`internal` vs future `portal_*`). audit_log hash-chained — every row stores hash of prior + own contents; tamper detection job runs nightly.
  - BLOCKS ON MICHAEL: **M32** (CI runner / GH Actions enabled with Supabase test creds)

- [ ] **7.6** — Dev platform: bundler + type-gen + migration runner + Playwright harness
  - esbuild zero-config bundler. Pre-commit hook fails build if index.html >1MB. Supabase type-gen on schema. Migration runner with version table (kills manual SQL). Playwright smoke harness: 20 tests, persistence-trio round-trip per active module. Keep old loading path behind flag through W4; cutover only after Playwright green for 1 week.

- [ ] **7.7** — Cmd-K v1 (10 hardcoded actions)
  - `js/cmdk.js`. Actions: New Quote · Move Pipeline Stage · Add CRM Note · Create PO · Mark Job Milestone · Check Inventory · Open Daily Brief · Ask AI Consultant · Schedule Delivery · Run Global Search. No fuzzy ranking yet, no plugins. Covers all 5 personas, mixes read+write+AI.

- [ ] **7.8** — First-run checklist v1 (static markdown rendered in-app)
  - Per-persona checklist (Michael / Patrick / Paul / Warehouse / Sales). Self-completion detection deferred to Phase 2.

- [ ] **7.9** — Friday "what shipped" demo ritual (cadence + auto-Loom by agent)
  - Agent generates Loom + bullet list each Friday. Michael watches + reacts (8 min target). 20-min standing slot Fri 4:00-4:20. Includes weekly 5-min "kill anything?" prompt.

- [ ] **7.10** — Per-persona control-panel scaffold
  - Each user's dashboard reads their goals + thresholds from `user_personas` table. Tile config editable by user. Owner sees aggregate.
  - BLOCKS ON MICHAEL: **M33** (run user_personas schema)

- [ ] **7.11** — Late / Short / Damaged unified board (Patrick's #1 unmet ask)
  - Filtered view of existing orders/deliveries/warranty tables. No new schema. Single page combines: late deliveries (overdue) + short shipments (PO received qty < ordered) + damaged (warranty claims open). Defaults: senior + Warehouse access.

- [ ] **7.12** — Thumbs telemetry hook (`<thumbs-row>` web component)
  - One tap per AI output → writes to automation_events (event_id, user_id, value: +1/-1, free-text reason). Wired to AI Consultant first; rolled to all Phase 3 automations.

- [ ] **7.13** — Module retrofit kit (6 shared primitives, ships in 7.1/7.2)
  - `logEvent(action_id, opts)` · `aiCall(prompt, opts)` · `<thumbs-row>` · `<explain-link>` · `threshold(key, default)` · `registerCmdK(spec)`. Per-module retrofit becomes 4-8 lines. JSON-schema validation server-side for shape drift defense.

- [ ] **7.14** — Retrofit pilots: Daily Brief · Quotes · Pipeline · Vendor Intelligence · Employee Scorecards
  - First 5 modules wired through retrofit kit. Validates pattern. ~20h. Gates the bucket-A/B sweep in W3-W4 and bucket-C interleave in W6-W9.

---

## TRACK 8 — Phase 1 ROI Integrations + Compatibility Checker (W4-W10)

- [ ] **8.1** — BigCommerce live integration (was 6.3) — write-back path: PDP copy, meta, schema markup, inventory pull
  - BLOCKS ON MICHAEL: **M04** (BC API credentials)
- [ ] **8.2** — Windward ERP live integration (was 6.11) — real inventory + sales velocity, replaces PO-line proxy in Demand Forecast
  - BLOCKS ON MICHAEL: **M03** + **M10**
- [ ] **8.3** — Review platform integration (Yotpo or equivalent) + PDP widget
  - BLOCKS ON MICHAEL: **M34** (review platform account)
- [ ] **8.4** — GMC feed health monitor (disapproval alerts, attribute audit)
  - BLOCKS ON MICHAEL: **M05**
- [ ] **8.5** — Public AI Consultant embed — internal first (Phase 1), public PDP/category in Phase 2 after eval ≥80%
  - Was 6.10. Un-deferred per ecom growth lead. Customer trust charter: AI labeled, "I don't know" handoff allowed, source citations mandatory.
- [ ] **8.6** — Compatibility Checker v1 (dimmer / driver / bulb)
  - Sarah's #1 unmet need. Pure-compute over INVENTORY metadata once spec fields exist. Phase 1 internal tool, Phase 2 customer-facing on PDP. Spec-token system (S1) prevents LLM free-text on safety-critical fields.
  - BLOCKS ON MICHAEL: **M35** (audit existing inventory_items spec coverage; identify SKUs missing wattage/voltage/dimmer-list/wet-rating)

---

## TRACK 9 — Phase 2 Inline Retrieval + Ecom RAG Surfaces (W5-W12)

- [ ] **9.1** — pgvector enabled + per-source ACL columns (`tenant_id`, `vendor_id`, `sensitivity`)
  - BLOCKS ON MICHAEL: **M36** (enable pgvector extension; run kb_documents + kb_chunks schema)
- [ ] **9.2** — Per-source chunking pipeline (SOPs by heading, PDFs layout-aware, emails as thread-units)
- [ ] **9.3** — Hybrid search (FTS + vector + Reciprocal Rank Fusion)
- [ ] **9.4** — Cross-encoder reranker (top-20 → top-5)
- [ ] **9.5** — Citation post-processor (rejects uncited LLM answers; chunk_id mandatory)
- [ ] **9.6** — 150-pair golden eval set (agent drafts 200 from PROMPT_LOG/SESSION_LOG, Michael edits 90 sec/pair = 3.75h). Monthly auto-rebuild from real failed queries (red-team fix vs citation theater).
- [ ] **9.7** — RAG eval CI gate (recall@5, MRR, faithfulness, citation-precision, refusal accuracy; >2pp regression blocks merge)
- [ ] **9.8** — Internal surface: Quote → "3 similar past quotes + outcome" sidecar
- [ ] **9.9** — Internal surface: Pipeline → stale-deal context retrieval
- [ ] **9.10** — Internal surface: Knowledge Hub → grounded answers with citations (replace stub)
- [ ] **9.11** — Ecom surface: PDP copy generation
- [ ] **9.12** — Ecom surface: Meta description generation
- [ ] **9.13** — Ecom surface: Schema markup generation (Product / Offer / AggregateRating / FAQ / BreadcrumbList)
- [ ] **9.14** — Ecom surface: FAQ generation per PDP
- [ ] **9.15** — Ecom surface: Alt-text generation for product images
- [ ] **9.16** — Public AI Consultant goes live on PDP/category (gated on eval ≥80% from 9.7)

---

## TRACK 10 — Phase 3 Named Automations on Dynamic Ladder (W9-W16)

> Promotion ladder: Shadow → Draft → Auto-with-approval → Auto. Beta-LCB gates per 7.3. 10% holdout counterfactual permanent.
> Auto-execute allowlist: tag, status-flip, internal note, draft-save, regenerate report. **Never:** external send, BC mutation without click, pricing change, comp/scores writes, cross-tenant read.

- [ ] **10.1** — A1: PO drafts (top-50 fast-movers) — Patrick's domain. Kill threshold: accept-rate <50% OR vendor errors >2%. Survival prob 80%.
- [ ] **10.2** — A2: Follow-up drafts (stale deals) — Paul's domain. Delayed attribution 60d. Kill: revenue-attributed <2× cost. Survival 65%.
- [ ] **10.3** — A3: Auto call-note logging — Sales-wide, 10-15h/wk saved. Keystone. Kill: accuracy <60% OR <3 active users. Survival 95%.
- [ ] **10.4** — A4: Abandoned cart drafts (Klaviyo) — REDESIGNED v3.0: cap 1 plain-text email max, AI-labeled, real address. Kill: unsubscribe >2%. Survival 40%.
  - BLOCKS ON MICHAEL: **M09** (Klaviyo API key)
- [ ] **10.5** — A5: PDP rewrite drafts (low-CVR SKUs) — handoff contract with 9.11 (one generator, two trigger paths). Kill: CR lift <0.3pp. Survival 55%.
- [ ] **10.6** — A6: GMC disapproval auto-fix drafts — handoff contract with 8.4 (monitor emits alert; A6 subscribes). Kill: disapproval volume <5/mo OR accuracy <70%. Survival 35%.
- [ ] **10.7** — A7: Bundle / cross-sell drafts — Kill: AOV lift <3% on bundle-shown sessions. Survival 45%.
- [ ] **10.8** — A8: Negative-keyword drafts (paid search) — Kill: wasted-spend recovery <$200/mo OR no Google Ads spend. Survival 20% (most likely first kill).
  - BLOCKS ON MICHAEL: **M37** (Google Ads API access — historically blocked per MASTER §10; if not available, auto-kill A8 in W12)

---

## TRACK 11 — BigCommerce Site Maximization (E1-E10, ROADMAP §13)

> Forks Cornerstone → "AccentOS Theme" repo. ~150h Phase 1, ~120h Phase 2.
> E5/E6 overlap with Track 9 RAG surfaces — implement once, expose twice.

- [ ] **11.1** — E1: Fork Cornerstone → "AccentOS Theme" repo, CI/CD via Stencil CLI
  - BLOCKS ON MICHAEL: **M38** (BC theme dev access + Stencil CLI auth)
- [ ] **11.2** — E2: PDP v2 redesign (above-fold, room mockups, compatibility module, designer-review CTA)
- [ ] **11.3** — E3: PLP v2 lighting-specific faceted filters (room/ceiling-height/smart/CCT/IP/lead-time)
- [ ] **11.4** — E4: Core Web Vitals pass (LCP <2.0s, INP <150ms, CLS <0.05, TTFB <400ms)
- [ ] **11.5** — E5: AI Consultant inline embed (PDP sticky right-rail desktop, bottom-sheet mobile, SKU-context-aware) — depends on 8.5 + 9.16
- [ ] **11.6** — E6: Schema.org full coverage + auto-generated PDP narratives — uses 9.11-9.15 generators
- [ ] **11.7** — E7: Customer control panel (My Lighting Plan · Reorder+Warranty · My Rep · Compatibility Profile · Sample Tracker · Design Reviews)
- [ ] **11.8** — E8: Mobile-first refactor (bottom-sheet filters, sticky CTA, swipe gallery, AR-ready)
- [ ] **11.9** — E9: Live Windward inventory + lead-time badges via 8.2 BC sync
- [ ] **11.10** — E10: Persona-aware nav + content (trade/designer/homeowner) from logged-in customer record

---

## TRACK 12 — User-Safety Charter (S1-S10, ROADMAP §14)

> Protects humans from system-caused harm. Distinct from internal RLS/JWT security (Track 7.5).

- [ ] **12.1** — S1: Spec-token system — wattage/voltage/dimmer/wet-rating rendered from `product_specs` DB only; LLM cannot free-text safety specs; refuse-to-answer if no token. Prerequisite for 8.5 public AI Consultant.
- [ ] **12.2** — S2: Outbound customer email gate — no auto-send; merge-fields + allow-listed URLs only; DKIM+DMARC enforced. Gates A4 abandoned cart and any future customer-email automation.
- [ ] **12.3** — S3: MFA mandatory for trade/vendor/employee portals (nudged for retail) + session rotation + device-anomaly alerts
  - BLOCKS ON MICHAEL: **M39** (Supabase Auth MFA enabled at project level)
- [ ] **12.4** — S4: Pricing token TTL 60s, LLM never renders numbers, no per-user dynamic retail pricing
- [ ] **12.5** — S5: Surveillance policy — telemetry on outputs not process; employee self-dashboard; weekly aggregates only
  - BLOCKS ON MICHAEL: **M40** (publish surveillance policy to team; CA notice law if applicable)
- [ ] **12.6** — S6: Vendor RAG namespace isolation (retrieval-time, not just prompt) + pre-send cost-leak scanner
- [ ] **12.7** — S7: PO banking-change gate — 2-person + out-of-band verify; allow-list of vendor remit-to accounts; AI cannot draft POs with new payee info
- [ ] **12.8** — S8: Real-inventory scarcity only; A/B on copy/layout never price; published dark-pattern ban list
- [ ] **12.9** — S9: WCAG AA + axe-core in CI; nursery/kids PDPs require safety-cert badges
- [ ] **12.10** — S10: CCPA/GDPR endpoints (export, delete, PII-redaction in RAG ingest); AI never promises refund/warranty outcomes

---

## TRACK 13 — Compounding Loops (L1-L5, ROADMAP §9)

> Plan-wide leverage 6.2 → 8.0 after these land. Keystone (rejection→eval→retrieval) is in 9.6 + 9.7; protect above all.

- [ ] **13.1** — L1: Closed quotes → vendor pricing intelligence loop. Every won/lost quote fingerprints vendor cost vs final margin into `vendor_pricing_intel` table. Feeds next-quote drafting.
- [ ] **13.2** — L2: Customer-question corpus → FAQ + PDP rewrite signal. Inbound emails/SMS/chat questions cluster monthly; high-frequency unmet questions auto-feed 9.14 FAQ generation.
- [ ] **13.3** — L3: Cross-employee task patterns → skill extraction. When 3+ employees do the same manual sequence (detected via automation_events absence), surface as auto-proposed automation candidate to Owner.
- [ ] **13.4** — L4: Failed automation runs → root-cause clusters → preventive playbooks. Errors clustered weekly into pattern → fix-template loops in BUILD_INTELLIGENCE.md.
- [ ] **13.5** — L5: Persona × mode × task-success matrix. vibe-speak mode preference correlated to task completion quality; auto-suggests mode changes per persona.

---

## TRACK 14 — Phase 4 Continuous Ralph + Quarterly Kill (W17+)

- [ ] **14.1** — Quarterly kill review automation (`v_kill_candidates` SQL view + Owner 7-day veto window + auto-retire)
- [ ] **14.2** — Per-module 3-iter Ralph loop scheduler (proven on internal-meetings); applied to bottom 5 by ΔROI each quarter
- [ ] **14.3** — Health gate watcher: WAU/MAU <0.4 for 2 weeks across top 10 modules → freeze new module work alarm
- [ ] **14.4** — Anti-compounding trap conversions: per-PDP review → confidence-sampled (bottom 10% + random 2%); manual threshold tuning → auto from ΔROI; hand-curated eval → auto-grown from rejections; heartbeat dashboards → exception-only paging

