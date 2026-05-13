## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-13 — BigCommerce Integration Runway (BIGCOMMERCE_INTEGRATION_RUNWAY_V1)
**Branch:** `claude/bigcommerce-integration-setup-fio8z`
**Resume trigger:** "continue BC runway" or "M04 done" (wire token and run first sync)

---

## STATUS

5 phases shipped across 1 session on `claude/bigcommerce-integration-setup-fio8z`. Tree is clean, docs committed.

**BIGCOMMERCE_INTEGRATION_RUNWAY_V1:**
- ✅ Phase 1 — Integration Audit (`docs/integrations/BIGCOMMERCE_INTEGRATION_AUDIT.md`) — store hash, API shape, webhook catalog, data surfaces, blockers
- ✅ Phase 2 — Read-Only Adapter (`js/bigcommerce_adapter.js`) — BC V3 API client, rate limiting, paginated fetch, `BC.*` namespace (products/categories/brands/priceLists/health/syncLog/opportunity)
- ✅ Phase 3 — Ecommerce Opportunity Engine (`js/ecommerce_intelligence.js`) — 4-tab UI page: Overview / Products / Opportunities / Integration
- ✅ Phase 4 — Observability + Safety — baked into adapter: `BC.health.ping()`, `BC.health.status()`, `BC.syncLog.freshness()`, rate-limit backoff, graceful 401/429/network degrade
- ✅ Phase 5 — Operational Roadmap (`docs/integrations/BIGCOMMERCE_RUNWAY.md`) — 7-step next-integration sequence, write-risk catalog, M-task summary
- ✅ Schema — `sql/M45_bigcommerce_schema.sql` — `bc_products_cache`, `bc_categories_cache`, `bc_brands_cache`, `bc_sync_log` with full RLS
- ✅ Wired — MODULE_REGISTRY entry (`ecommerce`, INTELLIGENCE section, Owner/Admin/Manager) + script tags in index.html

**Opportunity scanner flags (8 types):**
- missing_description, missing_image, missing_keywords, no_category
- low_margin (<10%), high_traffic_low_conversion (<0.5% conv rate)
- hidden_with_stock, low_stock

## NEXT (BLOCKED — waiting on Michael)

- **M04** — Michael creates BC read-only API token → paste to Claude
- **M45** — Michael runs `sql/M45_bigcommerce_schema.sql` in Supabase SQL Editor
- After M04: Claude wires token via Ecommerce Intel → Integration → Configure Token
- After M45: First full catalog sync → opportunity flag triage

## AFTER M04 + M45 LAND
- First sync run + opportunity flag review
- Wire `bc_products_cache.price` into competitive_pricing.js `our_price` fallback
- Wire `bc_products_cache.inventory_level` into inventory.js as live data source
- Add `/bc-webhook` route to Cloudflare Worker for real-time events
- Upgrade `bc-business-review` skill from deals table → BC orders

## MERGE READINESS

`claude/bigcommerce-integration-setup-fio8z` contains:
- 2 new JS modules (adapter + intelligence UI)
- 1 new SQL schema (M45)
- 2 new integration docs
- 1 MODULE_REGISTRY entry + 2 script tags in index.html

All changes are additive. No existing functionality modified.
Rollback: remove 2 script tags from index.html, remove MODULE_REGISTRY entry.

---

## V2 UPDATE — 2026-05-13 (same session)

**BIGCOMMERCE_INTELLIGENCE_V2 shipped:**
- ✅ BC adapter expanded — `scanGMC()` (10 types), `scanSEO()` (9 types), `scanMerchandising()` (9 types), `scanAll()` with execMetrics
- ✅ Ecommerce Intelligence rebuilt — 6 tabs: Exec Dashboard / GMC+Images / SEO / Merchandising / Products / Integration
- ✅ Exec Dashboard — catalog quality %, GMC eligibility %, SEO health %, revenue opportunity estimates, domain flag breakdown
- ✅ GA4 adapter runway (`js/ga4_adapter.js`) — topPages, topProducts, channelRevenue, conversionFunnel — awaits M06
- ✅ GSC adapter runway (`js/gsc_adapter.js`) — topQueries, topPages, productQueries — awaits M06
- ✅ Klaviyo adapter runway (`js/klaviyo_adapter.js`) — campaigns, flows, metrics revenue — awaits M09
- ✅ GMC adapter runway (`js/gmc_adapter.js`) — productStatuses, disapproved, issues, merchant 687520574 — awaits M05
- ✅ M46 SQL — page_title/meta_description/condition columns on bc_products_cache; platform_sync_status table + 3 views
- ✅ Committed `6290c2a` + pushed

**CLEAN PAUSE — branch: claude/bigcommerce-integration-setup-fio8z**
