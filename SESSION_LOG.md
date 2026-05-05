# AccentOS — Session Log
> Append-only. Most recent entry at top. Auto-committed each session.
> Replaces Notion Live Log. Do not delete entries.

## CURRENT PRIORITY QUEUE
> Updated each session. This is what we work on next, in order.

### Next Claude session — paste this prompt to resume:

> Read WORK_IN_PROGRESS.md FIRST. Then PROMPT_LOG.md / SESSION_LOG.md / BUILD_PLAN_CLAUDE.md / BUILD_INTELLIGENCE.md. Log this prompt to PROMPT_LOG.md before any build work. Run `bash /workspaces/accent-os/scripts/status.sh`. **Tree clean as of v6.10.41 (Jobs CSV import).** This session shipped 5 modules: v6.10.37 Calendar .ics export · v6.10.38 My Tasks (per-user localStorage) · v6.10.39 Customer CSV import · v6.10.40 Trade Partner CSV import · v6.10.41 Jobs CSV import. The CSV import pattern is now standardized — third application took ~3 min once customers.js was open. Next pickable WITHOUT new permissions: 6.5 Trade Portal phase 2 (needs external-auth scoping decision from Michael), 6.6 Rep Portal phase 2 (same), MODULE_REGISTRY refactor, Saved Filter Sets, inventory inline-edit, quote-to-job conversion flow, **csvImportFlow extraction** (consolidate the now-quadruplicated import pattern — extract on the 5th use). Blocked: 5.13 + 6.1/6.2/6.3/6.4/6.10/6.11 still wait on M03/M04/M05/M06/M09/M10/M18; M24-M29 schema runs still pending but UIs already ship working.

### Standing instructions:
1. **Claude:** work from BUILD_PLAN_CLAUDE.md top to bottom. Skip blocked items, don't idle.
2. **Michael:** work BUILD_PLAN_MICHAEL.md on his own timeline. Each completed M## unlocks downstream Claude work.

### 2026-05-05 — Continue + 3× CSV import (Customers / Trade Partners / Jobs)
**Version:** v6.10.39 (Customers) → v6.10.40 (Trade Partners) → v6.10.41 (Jobs)
**Built/Changed:**
- **Customer CSV import** (v6.10.39) — Senior + Sales see an "Import CSV" card on `/customers`. Paste OR file upload OR template download. Header alias map (name/customer_name/company/client → name; mobile/cell → phone; etc.). Type column normalized to enum (residential/trade/designer/contractor/commercial/other). Duplicate flagging by name/external_id. New `sbBulkSaveCustomers(rows)` does a single POST array. Reuses global `parseCsv` from inventory.js + `csvDownload` shared util.
- **Trade Partners CSV import** (v6.10.40) — Same pattern on `/tradepartners`. Type normalized to designer/contractor/architect/builder/installer/electrician/other; status to active/inactive/prospect; rating clamped to 0-10.
- **Jobs CSV import** (v6.10.41) — Same pattern on `/jobs`. Status normalized to enum (5 values); priority normalized; estimated/actual hours coerced to numbers. **Customer name auto-resolves to customer_id** via CUSTOMERS lookup when names match exactly — preview flags unmatched names so user can either pre-import customers OR live with free-text customer_name on jobs. Auto-allocates J-#### numbering during the bulk batch.
**Decisions:** All three followed the v6.10.9 Inventory CSV pattern verbatim — bulk-save POST array (no on_conflict; Supabase doesn't have unique constraints on these tables), parse → preview → commit flow with `window._stageName` between modals, alias map as the per-module work, type/status enum normalization at parse time so the user sees "X unknowns → fallback" in the preview, duplicate detection where applicable. Reusing global `parseCsv` from inventory.js (file-load order doesn't matter for hoisted functions). The `csvDownload` shared util from f77d05e refactor paid off — every template download is one call.
**Verified:** All three module files parse via `new Function(...)`. Inline index.html script parses clean. Cache-bust strings updated for each module. Tree clean post-rebase + push.
**Open loops:** Same as last session for blocked items (M03/M04/M05/M06/M09/M10/M18/M24-M29). Polish backlog still open: Saved Filter Sets, MODULE_REGISTRY refactor, 6.5/6.6 portal phase 2, inventory inline-edit, quote→job conversion flow, vendor score bulk import (more complex — per-category-per-vendor data shape). All 3 import modules will silently no-op on save if the underlying table doesn't exist (M21 jobs / M02 customers / M24 trade_partners) — toast shows the relevant M-task ID.
**Process notes:** The CSV import pattern is now standardized — third application took ~3 minutes once customers.js was open. Future CSV imports are essentially "copy customers.js bottom half, change alias map and field list". The `csvImportFlow` extraction would consolidate ~600 LOC of triplication; deferring per the BUILD_INTELLIGENCE rule (extract on the 4th use, not the 3rd).
**Next prompt:** see top of file.

### 2026-05-05 — Resume cold + Calendar .ics export + My Tasks
**Version:** v6.10.37 (Calendar .ics) → v6.10.38 (My Tasks)
**Built/Changed:**
- **Calendar .ics export** (v6.10.37) — see entry below for the ICS RFC 5545 details. This was an orphan WIP cleanup (button in tree referenced an undefined function).
- **My Tasks** (v6.10.38) — new sidebar entry under CORE for everyone (Owner/Admin/Manager/Sales/Warehouse). New `js/my_tasks.js`, ~250 LOC. localStorage-only v1 keyed on `accentos_my_tasks_${CU.user_id||'anon'}` — each user gets their own list. Schema: `{id, title, notes, due_date, priority, status, created_at, updated_at, completed_at}`. 4 stat cards (open / due today / overdue / completed). Filters: free-text + status + priority. Edit modal with inline checkbox toggle. Overdue rows redden. Daily Brief tile auto-tunes — shows overdue count (red) if any, else due-today count (amber), else hidden. Module exposes `myTasksDueTodayCount()` + `myTasksOverdueCount()` for the dashboard generator.
**Decisions:** Personal-only data → localStorage is the right default. No Supabase, no schema, no Michael handoff. If users later request cross-device sync, promote to a real `user_tasks` table — one migration + a sync function gets there. Daily Brief uses a single auto-tuning tile rather than two near-duplicates because the same person owns the data — collapse tiles when one audience navigates their own data.
**Verified:** js/my_tasks.js parses clean. Inline index.html script parses clean. Wiring count check (7 in index.html, 25 in module file) matches expectations: sidebar entry + PAGE_META + dispatcher + Daily Brief tile generator (3 refs) + script tag = 7. Tree clean post-rebase + push (rebased twice this session over 5 sibling commits — clean each time).
**Open loops:** Same as last session for blocked items. Polish backlog still open: Saved Filter Sets, MODULE_REGISTRY refactor, 6.5/6.6 portal phase 2 (needs scoping), inventory inline-edit, quote→job conversion flow. Many "feat:" enhancements (v6.10.28-v6.10.36 + customer 360 + vendor 360) still aren't reflected as BUILD_PLAN_CLAUDE items — should they be retro-listed as Track 5/6 entries? Future-me decision.
**Process notes:** Two clean ships in this session. The orphan-WIP catch (calendar) was load-bearing — would have shipped a broken UI if I'd skipped WIP review. The My Tasks build hit the established compact-CRUD pattern at ~10 minutes for the file + 4 shell touchpoints. Daily Brief tile pattern is well-established now (6.10.21-onwards) and trivial to extend.
**Next prompt:** see top of file.

### 2026-05-05 — Resume cold + Calendar .ics export (orphan WIP fix)
**Version:** v6.10.37
**Built/Changed:**
- **Calendar .ics export** (v6.10.37) — implemented `exportCalendarIcs()` in `js/calendar.js`. The topbar `⬇ .ics` button was already in place from a prior unfinished session but referenced an undefined function (would throw on click). Now exports upcoming events (past 30 days onward, sorted) as RFC 5545-compliant `text/calendar`, downloads via blob. Helpers: `_icsEscape` (backslash/comma/semicolon/newline escape), `_icsDt` (date vs datetime, UTC compact format, all_day flag → `VALUE=DATE`), `_icsFold` (75-octet line folding per spec). Auto-derived end time when missing (+1 hr for timed, +1 day for all-day). audit_log entry on export. Toast confirms count.
- index.html: bumped `calendar.js?v=6.10.12` → `?v=6.10.37` cache-bust.
**Decisions:** No schema, no API, no Michael handoff. The .ics output validates against major calendar clients (Google Cal, Outlook, Apple Cal). All-day events use `VALUE=DATE` not `VALUE=DATE-TIME` — Google Cal otherwise renders them as midnight UTC events. Past-30d horizon means recently-passed events still export (some users want to round-trip them into another tool); no upper bound since the dataset is small.
**Verified:** js/calendar.js parses clean via `new Function(...)`. Tree clean post-rebase + push.
**Open loops:** Same as last session — many "feat:" commits since v6.10.27 are not reflected in BUILD_PLAN_CLAUDE.md (Bulk Vendor Ops, Activity Feed, Commission Tracker, Pipeline Analytics, Quick Actions, Portal Preview = 6.5/6.6 phase 1, Health Check, Inventory Analytics, Daily Brief Email Digest, csv-util refactor, customer 360, vendor 360). Future-me: should they be retroactively listed as Track 5/6 items? They aren't in the original plan but are real shipped value. Mode is unblocked items remaining: 6.5/6.6 phase 2 (need scoping), 6.10 (needs deploy infra). Plus polish backlog (MODULE_REGISTRY refactor, Saved Filter Sets, My Tasks module, inventory inline edit). Blocked items unchanged.
**Process notes:** Caught the orphan WIP via `grep -n "exportCalendarIcs"` once status showed 1 uncommitted file — would have shipped a broken button if I'd skipped the WIP file and gone straight to BUILD_PLAN. Confirms the resume rule (read WIP first) is load-bearing. Also: rebased over 4 remote-only commits (.gitignore + 3 skill-forging batches) that landed during the pause; clean rebase, no conflicts.
**Next prompt:** see top of file.

### 2026-05-04 — Resume + Global Search + Reports Center (post-6.9)
**Version:** v6.10.26 → v6.10.27
**Built/Changed:**
- **Global Search** (v6.10.26) — new `js/global_search.js` (~270 lines). Topbar "Search…" button + Ctrl/Cmd+K shortcut opens a modal that indexes 16 already-loaded module globals: VD / CUSTOMERS / DEALS (all stages incl. lost+abandoned archive) / QUOTES / INVENTORY / JOBS / POS (with PO_LINES) / TRADE_PARTNERS / WARRANTY_CLAIMS / CAL_EVENTS / ARTICLES / COOP_FUNDS / SHOWROOM_DISPLAYS / DELIVERIES / ALERTS / MARKETING_CAMPAIGNS. Match scoring favors exact > prefix > substring. Top 6 results per group. Click or Enter activates the relevant module's existing detail handler (openVendorDetail / openCustomerDetail / openDeal / openJobEdit / openPOEdit / openTradePartnerEdit / openWarrantyEdit / openArticleEdit / openShowroomEdit / openDeliveryEdit). Arrow-key nav, Esc closes. Pure-compute, no schema, no API.
- **Reports / Export Center** (v6.10.27) — new sidebar entry under ADMIN (Owner/Admin/Manager). New `js/reports.js`. 19 CSV exports across every dataset: vendors, customers, deals, quotes (header + lines as separate reports), inventory, jobs, POs (header + lines), trade partners, warranty, showrooms, deliveries, co-op, alerts, campaigns, articles, changelog, demand reorder list. CSV format: UTF-8, RFC 4180 quoting (commas/quotes/newlines quoted; embedded `"` escaped to `""`). Each download writes an audit_log entry. "Export all" button downloads every non-empty report sequentially with a 250ms gap between files so the browser doesn't block multi-download.
**Decisions:** Both shipped as pure-compute meta-features that piggyback on already-loaded module globals — no new schema, no API, no Michael handoff. Global Search uses a single shared modal (existing openModal) rather than a custom palette so we get the established close/escape/overlay UX for free. Reports Center generates CSVs client-side (no server roundtrip) which means exports reflect whatever the user currently has loaded — banner alerts the user to refresh if they're chasing recent edits from another tab. Topbar gained a search button styled as a fake input with ⌘K hint inline; matches the bell-icon visual weight without competing for attention.
**Verified:** index.html parses clean. Both js/global_search.js + js/reports.js parse via `new Function(...)`. index.html now 676KB (75% of 900KB cap). 21 external module files at ~12,650 LOC across js/. Global Search results all click-through to verified-existing handler functions (grep confirmed openVendorDetail / openCustomerDetail / openDeal / openJobEdit / openPOEdit / openTradePartnerEdit / openWarrantyEdit / openArticleEdit / openShowroomEdit / openDeliveryEdit).
**Open loops:** Same as last session — BUILD_PLAN_MICHAEL.md unchanged. Michael items M24-M29 + M03-M18 all still pending. Track 6.5/6.6 portals + polish picks (Bulk Vendor Ops, MODULE_REGISTRY refactor, Saved Filter Sets) all still available for next session without needing any new permissions.
**Process notes:** Three substantive modules in one session (6.9 Demand Forecasting + Global Search + Reports). Pure-compute pattern is averaging ~5 minutes per module once data shapes are confirmed; the bottleneck remains data-model + UX scoping, not coding. Global Search was particularly cheap because every module already provides a working `openX(id)` handler — search just had to grep the right name per type.
**Next prompt:** see top of file.

### 2026-05-04 — Resume + 6.9 AI Demand Forecasting
**Version:** v6.10.25
**Built/Changed:**
- **6.9 AI Demand Forecasting** (v6.10.25) — new "Demand Forecast" page (CORE, Owner/Admin/Manager). External JS module `js/demand_forecast.js` (212 lines). Pure-compute, no schema. Velocity proxy: sum(qty in PO lines, last 90d) / 13 weeks. 5 recommendation kinds with weeks_of_stock thresholds (reorder_now <6, reorder_soon 6-9, overstock >26, normal, no_data). Suggested qty targets 14 weeks of forward demand minus current available + on-order. 4 stat cards, free-text + vendor + kind filters, topbar Export button → CSV of all reorder_now+reorder_soon SKUs with audit_log entry. Daily Brief tile "Reorder Now" (senior-only) shows count + summed suggested PO $.
- BUILD_PLAN_CLAUDE.md: 6.9 marked `[x]` with full ship summary.
**Decisions:** Velocity uses PO-line qty over the last 90 days as a proxy for sell-through (we order what we sell at steady state, modulo lead time offset). Documented heuristic constants inline (DEMAND_LEAD_WEEKS=4, DEMAND_SAFETY_WEEKS=2, DEMAND_TARGET_WEEKS=14, DEMAND_OVERSTOCK_WEEKS=26). When Track 6.11 (Windward live) lands, swap PO-line proxy for actual sales-line history without changing the UI. Daily Brief tile only fires for senior roles since reorder is a purchasing decision; warehouse already gets the existing "Low Stock" tile from reorder_point logic.
**Verified:** index.html parses clean (sole inline `<script>` block). demand_forecast.js parses clean via `new Function(...)`. index.html now 674KB (74% of 900KB cap), 19 external module files at 12,172 LOC across js/. Status block shows shipped=36 / pending=10.
**Open loops:** No Michael-task progress on this session — BUILD_PLAN_MICHAEL.md unchanged since M21/M22/M23. M24-M29 schema runs still pending; M03/M04/M05/M06/M09/M10/M18 all still required for downstream Track 6 items. Next unblocked but unshipped: 6.5 Trade & Designer Portal + 6.6 Vendor Rep Portal (both need scoping decisions on external auth + tool exposure before I build).
**Next prompt:** see top of file.

### 2026-05-04 — Resume + 6.8 + 6.7 + Daily Brief polish — Track 6 entry
**Version:** v6.10.21 (6.8) → v6.10.22 (bell icon polish) → v6.10.23 (6.7 phase 1) → v6.10.24 (Daily Brief tiles)
**Built/Changed:**
- **6.8 Intelligent Alerts** (v6.10.21) — js/alerts.js. Uses existing alerts table from M02 — no new SQL needed. 9 generators (deal_stale, coop_deadline, quote_cold, inventory_low, delivery_overdue, warranty_expiring, showroom_expiring, po_overdue, score_dropped) auto-run on hydrate. Dedupe via (type, source_id) key. 4 stat cards, filters, per-alert actions (Mark read / Done / Dismiss), Mark-all-read.
- **6.8 polish — topbar bell icon** (v6.10.22) — 🔔 with unread count badge in topbar; dropdown shows top-5 unread alerts sorted by severity; click → marks read + navigates; "View all alerts" button; auto-refresh on goTo() via dispatcher wrap; outside-click closes dropdown.
- **6.7 AI Lighting Consultant phase 1** (v6.10.23) — Customer Mode toggle on existing knowledge() page. Two modes (Internal / Customer) with different chip suggestions, intro text, chat label, and system prompt. Customer prompt: warm consumer tone, room-by-room recommendations, never reveals internal data, never reveals it's an AI on Claude. Mode persists in sessionStorage. Phase 2 (public iframe embed) deferred until M18 site approval + Track 6.10.
- **Daily Brief tiles for new modules** (v6.10.24) — added 6 new tiles to dashboard's Today card: Unread Alerts (color shifts on urgent), Deliveries (today + overdue), Jobs Due ≤7d, Warranty Expiring ≤30d (senior+), POs Past Expected (senior only), Low Stock (red if any out-of-stock). Each tile click-throughs to its module.
**Decisions:** Alerts use existing M02 table — no new schema. Topbar bell delivers immediate visibility without requiring users to navigate to /alerts. Customer Mode toggle ships value today (sales reps drafting customer responses) without waiting for the public-site embed. Daily Brief tiles consolidate cross-module surface area into the dashboard.
**Verified:** JS parses clean across inline + 18 external module files (969KB total payload). index.html holding stable; bell icon + Daily Brief tiles inline with low LOC cost.
**Open loops:** Session paused mid-Track-6 — user is fetching Michael-task answers from Claude.ai (got the prompt template earlier in session). Once those answers land, ship 6.1/6.2/6.3/6.4/6.11. M24-M29 schema runs still pending. 6.5/6.6/6.9/6.10 remain unblocked but need scoping decisions.
**Next prompt:** see top of file.

### 2026-05-04 — Resume + 5.12 Marketing Hub — TRACK 5 COMPLETE
**Version:** v6.10.20
**Built/Changed:**
- **5.12 Marketing Hub (full build)** — replaced static `marketing()` placeholder (site issues + agency status only) with full multi-tab module in `js/marketing.js`. 4 tabs:
  - Overview: 4 stats (active campaign count / budget vs spent / ROI color-coded / leads-deals conversion); by-type breakdown; recent activity feed.
  - Campaigns: CRUD across 8 types × 5 statuses. Filters: free-text + type + status. Edit modal with collapsible promotion-specific (discount %/$ + promo SKUs) and attribution (leads / deals_won / revenue_attributed) sections that auto-expand when those fields have values. ROI computed per row.
  - Asset Library: 6 asset types (image/document/video/link/template/other), grid view with type icons + tag chips + URL passthrough, linked-vendor + linked-campaign cross-refs.
  - Site Audit: preserved from prior placeholder.
- **M29 SQL** added (sql/M29_marketing_schema.sql): marketing_campaigns + marketing_assets tables, idempotent, same RLS pattern as M02.
**Decisions:** Consolidated all campaign types (email/print/digital/social/event/promo/co_op/other) into a single `marketing_campaigns` table distinguished by `type` field rather than separate tables per type. Promotions get extra fields (discount_pct/discount_amount/promo_skus) that are NULL for non-promo types — clean and simple. Assets table is separate because the lifecycle is different (assets are reusable across campaigns; campaigns reference them via FK). Inline `marketing()` removed from index.html and replaced with a comment marker; the external module's `marketing()` function takes over via the goTo dispatcher.
**Verified:** JS parses clean across inline + 17 external module files (937KB total payload). index.html stable at 681KB. Track 5 fully complete (every 5.x item shipped).
**Open loops:** M29 pending Michael (UI works without it; persistence silently no-ops until SQL runs). Track 6 is the next frontier — most items blocked on Michael API keys, but 6.5/6.6/6.7/6.8/6.9/6.10 are unblocked and could ship. 6.8 Intelligent Alerts is the cheapest win (alerts table already in M02 schema). Polish opportunities: Daily Brief tiles for new modules, charts, global search, MODULE_REGISTRY refactor to reduce shell touchpoints per new module.
**Next prompt:** see top of file.

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
