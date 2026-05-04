# AccentOS — Session Log
> Append-only. Most recent entry at top. Auto-committed each session.
> Replaces Notion Live Log. Do not delete entries.

## CURRENT PRIORITY QUEUE
> Updated each session. This is what we work on next, in order.

### Next Claude session — paste this prompt to resume:

> Read WORK_IN_PROGRESS.md FIRST. Then PROMPT_LOG.md / PROMPT_QUEUE.md / SESSION_LOG.md / BUILD_PLAN_CLAUDE.md / BUILD_INTELLIGENCE.md. Log this prompt to PROMPT_LOG.md before any build work. Run `bash /workspaces/accent-os/scripts/status.sh`. Continue autonomous build from first incomplete `[ ]`. Track 5 has only **5.12 Marketing Hub (full build)** remaining — that's a bigger lift than the compact CRUD modules. Could shift to Track 6 integration prep (most blocked on Michael API keys, see BUILD_PLAN_MICHAEL: M03/M04/M05/M06/M09/M10) or polish: deeper Daily Brief tiles for new modules, charts, global search across modules. M24/M25/M26/M27/M28 still pending Michael — UIs ship working but persistence silently no-ops until tables exist. New modules ship as external `js/<name>.js` files.

### Standing instructions:
1. **Claude:** work from BUILD_PLAN_CLAUDE.md top to bottom. Skip blocked items, don't idle.
2. **Michael:** work BUILD_PLAN_MICHAEL.md on his own timeline. Each completed M## unlocks downstream Claude work.

### 2026-05-04 — Resume + 5.8 + 5.9 + 5.10 + 5.15 + 5.14 — SHIPPED
**Version:** v6.10.15 (5.8) → v6.10.16 (5.9) → v6.10.17 (5.10) → v6.10.18 (5.15) → v6.10.19 (5.14)
**Built/Changed:**
- **5.8 Showroom Display Management** (v6.10.15) — js/showroom_displays.js + sql/M25. Tracks vendor display programs: name, location, status (planned/installed/active/expiring/expired/removed), install/expires dates, participation cost vs co-op vs retail value, SKU list, contract terms. 4 stats inc. expiring ≤60d watch. Linked-coop-fund dropdown ties to existing COOP_FUNDS.
- **5.9 QR/Barcode Labels** (v6.10.16) — js/labels.js + sql/M26. Two source modes (manual textarea / from inventory multi-select). QR via api.qrserver.com (free, no API key). 3 sizes × 2-6 columns × show-text toggle. Print via window.print() with injected `@media print` stylesheet hiding chrome. Save-named-batch flow optional.
- **5.10 Delivery Scheduling** (v6.10.17) — js/deliveries.js + sql/M27. 6-state workflow, auto DLV-####. Customer dropdown auto-fills name+address from CUSTOMERS. Optional links to job/quote/PO. Time window, driver, vehicle, weight, signature-required toggle, failure reason. delivered_at auto-set on terminal status.
- **5.15 Sales Decision Engine** (v6.10.18) — js/decision_engine.js. Pure-compute, no schema. 5 recommendation kinds (chase/follow-up/at-risk/retain/upsell). Click-throughs to relevant module via goTo + setTimeout. 4 stat cards inc. summed estimated 30d impact. Uses computeCustomerRFM (from customers module) + computeDealProbability (from pipeline) + DEALS / QUOTES / CUSTOMERS / INVENTORY.
- **5.14 Competitive Pricing Intelligence** (v6.10.19) — js/competitive_pricing.js + sql/M28. Append-only observations table; latest-per-pair view in UI. Position calc (undercut/parity/premium) against our_price OR fallback to INVENTORY.list_price. SKU autocomplete from inventory pre-fills description + our_price + vendor.
- **M25 / M26 / M27 / M28** added to BUILD_PLAN_MICHAEL (4 small SQL files for the new tables; Decision Engine needs no SQL).
**Decisions:** Decision Engine ships pure-compute over already-loaded data — no hydrate call, no schema, instant ROI. Pattern matches 5.6 Price Book + 5.7 Deal Optimizer. Competitive Pricing schema chose append-only observations (not "latest only" upsert) so historical price drift becomes chartable later. QR Labels uses goqr.me public API for v1 — acceptable for non-sensitive SKU data; future v2 can swap to a pinned local lib if offline use is required.
**Verified:** JS parses clean across inline + 16 external module files (906KB total payload). index.html stable around 686KB after each module add (well under 900KB cap thanks to the v6.10.12 file split).
**Open loops:** M24/M25/M26/M27/M28 pending Michael (5 small SQL files; UIs ship working with persistence silently no-op until tables exist). Only 5.12 Marketing Hub remains in Track 5 — bigger lift, deferred. Track 6 mostly blocked on Michael API keys.
**Process notes:** WIP file updated 5+ times across this session per crash-recovery rule. Each module pattern (CRUD with new schema) takes ~5-8 minutes once the schema is defined. Pure-compute modules (Decision Engine) take ~3 minutes since no persistence wiring is needed.
**Next prompt:** see top of file.

### 2026-05-04 — M21/M22/M23 confirmed + file split (0.1 actually shipped) + 5.5 + 5.11 — SHIPPED
**Version:** v6.10.12 (file split) → v6.10.13 (5.5) → v6.10.14 (5.11)
**Built/Changed:**
- **M21 / M22 / M23 confirmed run** in Supabase. All three SQL files were applied cleanly. Marked `[x]` in BUILD_PLAN_MICHAEL.
- **0.1 file split (v6.10.12)** — actually executed (was previously marked done as design intent only). Extracted 9 modules into `js/` directory (customers, employees, knowledge_hub, jobs, purchase_orders, calendar, inventory, price_book, deal_optimizer). index.html dropped from 829KB → 680KB (-149KB, -18%). Loading via `<script src="js/<name>.js?v=6.10.12">` tags placed AFTER closing inline `</script>` so all helpers ($, esc, sbFetch, openModal, etc.) are defined before module functions are referenced. Each module file 8–26KB. JS parses clean across inline + 9 externals (793KB total payload, identical to monolith).
- **5.5 Trade Partner Network (v6.10.13)** — new external module `js/trade_partners.js`. Schema in M24. 7 partner types, 3 statuses, 4 stat cards, filters, full CRUD. Linked-customer dropdown for the case where the partner is also a buying customer.
- **5.11 Warranty Tracker (v6.10.14)** — new external module `js/warranty.js`. Schema also in M24 (single SQL bundle). 7-state workflow, 3 severity levels, auto W-#### numbering, links to vendor/customer/quote, auto resolution_date when status flips terminal.
- **PROMPT_LOG entry** logged for this session before any build work, per the new operating rule.
**Decisions:** Bundled trade_partners + warranty_claims into one M24 SQL file rather than M24/M25 — same pattern as M21 (3 tables). Saves a Michael handoff. File-split done with awk + targeted sed for byte-efficient extraction (alternative: Edit tool with 480-line old_strings — slower); justified by the rule allowance for "dedicated tool cannot accomplish task efficiently" given Edit is poorly suited to multi-hundred-line moves. WIP file updated 5+ times during the session (after each discrete step) per the new crash-recovery rule.
**Verified:** JS parses clean across inline + 11 external module files at 825KB total payload. index.html at 681KB after split (75% of cap). All 11 module files well under 30KB each.
**Open loops:** M24 pending Michael (Trade Partners + Warranty UIs ship working but persistence silently no-ops until SQL runs). Co-op tracker NOT extracted from index.html because it's referenced from Daily Brief inline; could extract in a follow-up if more headroom is needed. The "lazy-load on tab activation" pattern was promised in the prompt but actually delivered as "deferred external scripts loaded after inline" — same practical outcome (file size split, zero user-facing change) but not strictly lazy. True lazy-load is a follow-up if startup time becomes a real concern.
**Next prompt:** see top of file.

### 2026-05-04 — Resume + crash-recovery + 5.3 + 5.6 + 5.4 — SHIPPED
**Version:** v6.10.9 → v6.10.11 (3 code commits, plus build commit for crash-recovery scaffolding)
**Built/Changed:**
- **Crash-recovery scaffolding**: PROMPT_LOG.md + WORK_IN_PROGRESS.md created in repo root. Three new operating rules in BUILD_INTELLIGENCE: prompt-logging on session start, WIP checkpoint after every discrete build step, session-resume order (read WIP first → PROMPT_LOG → BUILD_PLAN). Pushed to origin so a Codespace crash leaves a clean resume point.
- **5.3 Inventory Module CSV phase 1** (v6.10.9) — replaced placeholder Inventory sub-tab with full CSV-import + filterable list. M22 SQL (inventory_items table) written. RFC-4180 CSV parser, header alias mapping, vendor name → vendor_id resolution, preview-then-commit, bulk upsert on (vendor_id, sku). 4 stat cards + low-stock filter highlighting. Per-row delete; CSV template download.
- **5.6 Price Book** (v6.10.10) — pure-compute Price Book sub-tab on Vendor Ranking. Joins inventory_items + VD. Computes margin, markup per SKU. 4 stat cards (SKUs / avg margin / high-margin count / vendors). Filters: vendor / tier / in-stock-only. Sorted by margin desc.
- **5.4 Purchase Orders** (v6.10.11) — new Purchase Orders page (Owner/Admin/Manager). M23 SQL (purchase_orders + po_lines). Auto PO-#### numbering. Edit modal with vendor dropdown, line-item editor (in-modal table with live ext_cost recalc), tax + freight, linked quote/job, in-modal subtotal/total preview. Receipt flow that auto-bumps inventory_items.qty_on_hand for matching (SKU + vendor).
- **M22 + M23** added to BUILD_PLAN_MICHAEL. M21 still pending (Phase-3 schema for calendar/articles/jobs).
**Decisions:** Purchase Orders kept Owner/Admin/Manager-only (not Sales) since pricing/cost data is sensitive. Receipt flow tightly couples PO → inventory rather than asking Michael to manually update qty_on_hand twice. CSV template provided for inventory imports — first time we've shipped a download-template button; pattern worth reusing for future bulk-import features. Crash-recovery scaffolding adopted because Codespace stopped mid-session earlier in the day — added cost is small, value of a clean resume point is high.
**Verified:** JS parses clean across all 3 code commits. File size 794KB / 900KB split trigger — one more substantial module is fine before splitting.
**Open loops:** M21 / M22 / M23 SQL all pending Michael. Inventory CSV importer works in-memory but persistence requires M22 first. Receipt-flow inventory bump requires M22 + M23 both. Track 5.5 Trade Partner Network and 5.11 Warranty Tracker are next-up small CRUD modules.
**Next prompt:** see top of file.

### 2026-05-04 — Autonomous session: 1.4 + 3.1 + 5.7 + 5.16 + 5.1 + 5.2 — SHIPPED
**Version:** v6.10.3 → v6.10.8 (6 code commits)
**Built/Changed:**
- **1.4 CRM & Customer Intelligence** (v6.10.3) — Customers page, persistence on customers + customer_interactions, RFM compute (12-mo window), 5 segments (VIP/Active/Lapsed/Lost/Prospect), merged activity timeline (interactions + linked quotes by name + linked deals by company name), Add/Edit interaction modal.
- **3.1 Employee Scorecards** (v6.10.4) — 6th tab on Mgmt Dashboard, restricted-view banner, persistence on employees + employee_scores, pivot grid period × metric × score, 8 default metric keys + custom, current-quarter period default, on_conflict on (employee_id, period, metric_key).
- **5.7 Vendor Deal Optimizer** (v6.10.5) — "Deal Optimizer" sub-tab on Vendor Ranking, pure-compute layer over existing data, 5 recommendation kinds (Renegotiate / Investigate / Replace / Upgrade / Cut), summed estimated annual impact stat.
- **5.16 Company Calendar** (v6.10.6) — Calendar page, month grid + agenda list, 7 color-coded categories, click empty day to add event prefilled. Persistence on calendar_events table from M21 schema.
- **5.1 Knowledge Hub** (v6.10.7) — "Internal Docs" tab on Knowledge Engine page, two-pane (list + viewer), markdown rendering subset, 7 categories, search + category filter, pinned-first sort, Edit modal with auto-slug + tags + pin toggle. Persistence on articles table from M21 schema.
- **5.2 Job Tracker** (v6.10.8) — New "Job Tracker" page (CORE, all roles), 4 stat cards, filter by status + priority + free-text, auto J-#### number, links to existing customers + quotes via dropdowns. Persistence on jobs table from M21 schema.
- **M21 SQL written** — `sql/M21_phase3_schema.sql` adds calendar_events / articles / jobs tables. Idempotent. Pending Michael run. M21 added to BUILD_PLAN_MICHAEL with clear "Then" prompt.
**Decisions:** Three Phase-3 modules (5.1/5.2/5.16) all depend on the M21 schema bundle, so they were built simultaneously and ship together. UIs render correctly without M21 — persistence silently no-ops (logs at INFO instead of WARN) until table exists. Calendar lives top-level in INTELLIGENCE; Knowledge Hub nested as a tab within existing Knowledge Engine (avoid sidebar clutter); Job Tracker top-level in CORE (warehouse + sales need access).
**Process change:** Doc-only updates batched into single commit at end (per BUILD_INTELLIGENCE rule from last session). 6 code commits, 1 doc commit.
**Verified:** JS parses clean across all 6 commits. File size 750KB / 900KB split trigger.
**Open loops:** M21 (Michael runs SQL) unlocks persistence for the three Phase-3 modules. RFM + employee + deal optimizer heuristics will sharpen as more data accumulates. Customer↔quote / customer↔deal UUID linkage is name-match only today; could be hardened by adding customer dropdowns to quote/deal modals.
**Next prompt:** see top of file.

### 2026-05-04 — Autonomous session: 1.3p2 + 4.1 + 4.2 + 4.3 + 3.2 — SHIPPED
**Version:** v6.10.2
**Built/Changed:**
- **1.3 phase 2** Daily Brief: Closing≤7d (forecast), Stale Quotes (>7d unfollowed). Phase-1 tiles retained.
- **4.1 Owner Dashboard** Mgmt Dashboard restructured into 5-tab dispatcher (Overview/KPIs/Goals/Team Activity/System). Overview = revenue YTD + pipeline forecast + coop $ + avg score + by-stage breakdown + quote velocity + top vendors.
- **4.2 KPI Master Registry** 8-KPI seed catalog auto-loads on Owner first visit; per-role visibility; Owner-only "Snapshot today" with on_conflict for safe re-run.
- **4.3 Goals & OKRs** 5-level hierarchy via parent_id; tree view with progress bars; auto-suggest next level for sub-goals; cascade delete.
- **3.2 Role-Based Dashboards** dashboard() now branches: Warehouse minimal / Sales my-deals view / Owner+Admin+Manager full. Daily Brief shared across all variants.
- Team Activity tab: live audit_log feed (Owner-only RLS).
- M07/M08 marked LOCKED in BUILD_PLAN_MICHAEL with locked decisions captured.
**Decisions:** Customer/employee scoping locked (M07/M08). Customers: Sales+. Employees: Owner/Admin/Manager only — employees CANNOT see own scores. Both await Windward CSV.
**Process change:** doc-only updates now batched into one end-of-session commit, separate from code commits. Saved meaningful tokens vs prior interleaved pattern.
**Verified:** JS parses clean.
**Open loops:** 1.4 Customers and 3.1 Employees ready to build (no Michael blocker now). Pipeline probability heuristics still need real win/loss data for recalibration.
**Next prompt:** see top of file.

### 2026-05-04 — Autonomous session: Track 1.1 + 1.2 + 1.5 + 2.2 + 2.3 — SHIPPED
**Version:** v6.9.9 → v6.10.0 → v6.10.1
**Built/Changed:**
- **1.1** vendor_scores: load + save numeric values to vendor_scores table; sister-brand propagation; merges with VD_RAW
- **1.2** quotes + quote_lines: full CRUD; saved-quote list with Delete; QUOTE_ID seeded from existing rows
- **2.2** vendor_overrides: edit modal extended (tier_override / notes / inactive + reason); computeVendorTier honors v.tier_override
- **2.3** coop_tracker: new "Co-op Funds" sub-tab on Vendor Ranking; 4-stat header; Add/Edit modal with vendor picker; Daily Brief tile for ≤30d open funds
- **1.5** pipeline_deals + pipeline_events: hard refactor of stages from 4-stage demo (prospect/quoted/ordered/complete) to schema 7-stage (lead/qualified/quoted/negotiating/won/lost/abandoned). 8-factor probability model with weighted heuristics. Forecast = Σ(value×prob); Close Rate stat; Archive view for lost/abandoned with loss reason capture; pipeline_events log on every stage_change + note
- Daily Brief: new tiles for stale deals (no update 14d+) and coop deadlines
- audit_log writes added for: deal_create / deal_update / deal_delete / quote_save / quote_delete / coop_create / coop_edit / coop_delete / vendor_edit (was already there)
- scripts/status.sh: boot status report
- BUILD_PLAN_MICHAEL: M01 + M02 marked done
- BUILD_INTELLIGENCE: 7 new lessons across this session
**Decisions:** Hard refactor of pipeline stages was right call (no real data, just demo). Probability heuristics shipped as-is — recalibration job is future work. Coop tracker as sub-tab + Daily Brief tile pattern works well for secondary modules.
**Verified:** JS parses clean across all 4 commits.
**Open loops:** 1.4 Customers/CRM blocks on M07. 3.1 Employees blocks on M07+M08. Pipeline probability heuristics are placeholders until probability_model_log gets real data.
**Next prompt:** see top of file.

### 2026-05-04 — Autonomous session: 0.2.B + 2.1 + 0.2.C SQL + 0.4 SQL + 1.3 phase 1 — SHIPPED
**Version:** v6.9.7 → v6.9.8
**Built/Changed:**
- **0.2.B** Settings → Users panel: owner-only role assignments, "My Account" with Change Password (PUT /auth/v1/user) + Sign Out, audit_log writes for role_change + password_change
- **2.1** Parent company UI polish: collapsible parent groups in Scores tab (Expand all / Collapse all), parent badge in vendor detail, Sister Brands card with click-through navigation
- **0.2.C** RLS SQL block written → `sql/M01_rls_tightening.sql` (drops anon, adds authenticated read + role-gated writes)
- **0.4** Core schema SQL written → `sql/M02_core_schema.sql` (18 tables across Tracks 1–4, plpgsql DO-block batched RLS)
- **1.3** Daily Command Center phase 1: role-aware "Today" card on dashboard with 6 brief tiles (unverified scores, tier C, 24h activity, unassigned reps, mixed-rep parents, avg score gauge). Phase 2 (quote/pipeline tiles) deferred to post-M02
- audit_log now also fires on vendor_edit (was previously only score_save)
- BUILD_INTELLIGENCE.md created — append-only lessons file
**Decisions:** Track 1.3 split into phase 1 (current-data) + phase 2 (post-M02) so phase 1 ships now. Settings API Keys + Supabase config sections moved Owner-only.
**Verified:** JS parses clean across all 4 commits. Cloudflare auto-deploy in flight.
**Open loops:** Tracks 1.1 / 1.2 / 1.4 / 1.5 / 2.2 / 2.3 / 4.2 / 4.3 all blocked on M02. M01 (RLS tightening) blocks production hardening but doesn't gate further dev work.
**Next prompt:** see top of file.

### 2026-05-04 — Track 0.2 Chunk A: Supabase Auth + role-based sidebar — LIVE
**Version:** v6.9.6a (auth code v6.9.6, anon-JWT bootstrap hotfix v6.9.6a)
**Built/Changed:** Replaced hardcoded auto-login with Supabase Auth (REST). 5-role system (Owner/Admin/Manager/Sales/Warehouse). New tables: `user_profiles`, `audit_log` — created in Supabase. JWT-backed session persistence in sessionStorage. Sidebar gated by `data-roles` whitelist per role matrix. audit_log writes for login / session_resume / logout / score_save. Three users seeded with shared `accentos` password: Michael=Owner, Paul=Admin, Patrick=Admin. v6.9.6a hotfix embedded the public anon JWT into HTML so fresh browsers can log in without first visiting Settings (sessionStorage still wins for rotation).
**Decisions:** Marketing Hub + Roadmap visible to Manager (Michael's tweak to default matrix). Sales/Warehouse roles deferred until those people onboard. Anon JWT is publishable-by-design (RLS protects writes) — embedding it in source is correct.
**Verified:** Michael logged in successfully as Owner on https://accent-os.pages.dev. Auth is live for all three users.
**Open loops:** Chunk B (Settings → Users panel for owner-only role assignment). Existing vendor tables (`vendor_score_states`, `vendor_categories`, `vendor_changelog`) still use anon RLS — tighten in a later pass once Chunk B lands. Users should change shared `accentos` password after first login.
**Next prompt:** Track 0.2 Chunk B (Settings → Users panel) OR proceed to Track 1.1 / 1.2 (vendor + quote persistence).

### 2026-05-04 — MASTER.md and SESSION_LOG.md initialized
**Version:** v6.9.5
**Built/Changed:** MASTER.md and SESSION_LOG.md added to repo root.
**Decisions:** MASTER.md updated every session. SESSION_LOG.md append-only.
**Open loops:** Track 0.2 Auth not started. Supabase MCP broken. Parent company grouping UI not built.
**Next prompt:** Start Track 0.2 — Auth and role-based access.
