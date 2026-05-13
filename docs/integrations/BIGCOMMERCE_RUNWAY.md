# BigCommerce Integration Runway — Operational Roadmap
> Phase 5 of BIGCOMMERCE_INTEGRATION_RUNWAY_V1
> Last updated: 2026-05-13

---

## What Was Built This Session

| Artifact | Purpose |
|----------|---------|
| `js/bigcommerce_adapter.js` | Read-only BC V3 API adapter with rate limiting, graceful degrade, sync logging, and the opportunity scanner |
| `js/ecommerce_intelligence.js` | UI page: 4-tab module (Overview / Products / Opportunities / Integration) |
| `sql/M45_bigcommerce_schema.sql` | Supabase cache tables: `bc_products_cache`, `bc_categories_cache`, `bc_brands_cache`, `bc_sync_log` |
| `docs/integrations/BIGCOMMERCE_INTEGRATION_AUDIT.md` | Full Phase 1 audit: API shape, auth, webhooks, data surfaces, blockers |
| `docs/integrations/BIGCOMMERCE_RUNWAY.md` | This document |
| `index.html` — MODULE_REGISTRY entry | `ecommerce` key → visible to Owner/Admin/Manager in INTELLIGENCE section |
| `index.html` — script tags | Adapter loaded before intelligence module |

**Functional state:** All code is live in the app. The "Ecommerce Intel" page will appear in the sidebar for Owner/Admin/Manager roles. Until M04 lands, it shows a "pending token" banner and operates off cached Supabase data only (empty until first sync).

---

## Operational Opportunities Discovered

### Immediate (no new integration required)
1. **Catalog metadata gap** — BC store-cwqiwcjxes has 20K+ products with missing GMC images (confirmed from M14 context). Same products likely missing `description` and `search_keywords` in BC. Opportunity scanner will surface these the moment M04 lands and first sync runs.

2. **High-traffic / low-conversion surface** — `view_count` and `total_sold` are BC-native fields. No external analytics needed for a basic conversion rate signal per product. The scanner computes this automatically.

3. **Low-margin SKU list** — `cost_price` + `price` fields in BC give immediate margin visibility at SKU level. No ERP integration required.

4. **Hidden products with live inventory** — Common catalog hygiene issue. Scanner flags any `is_visible=false` product that still has stock > 0.

### Near-term (M04 in hand)
5. **Brand-level opportunity rollup** — group opportunity flags by `brand_id` → identifies which vendor relationships have the worst catalog quality.

6. **Category completeness audit** — products with `categories = []` are unfindable on the storefront. First sync will show the count.

7. **Price list coverage** — BC price lists (designer/trade tiers) should map to AccentOS Trade Partners. `BC.priceLists.list()` is wired and ready.

### Medium-term (after first sync + M45 in Supabase)
8. **bc-business-review skill upgrade** — the `bc-business-review` skill currently reads from the `deals` table. Once BC orders flow in, it can switch to real ecommerce revenue.

9. **Inventory sync bridge** — `bc_products_cache.inventory_level` can replace the manual CSV import in `js/inventory.js`. Same table structure, just a different data source.

10. **Competitive pricing auto-fill** — `js/competitive_pricing.js` already has an `our_price` column that falls back to `INVENTORY.list_price`. After M45 runs, it can instead read `bc_products_cache.price` for the canonical BC price.

---

## Integration Blockers

| Blocker | Impact | Action Required |
|---------|--------|-----------------|
| **M04 — BC API token** | Blocks all live data fetch | Michael: create token in BC admin → Settings → API → Store API accounts. Scopes: Products/Read, Orders/Read, Customers/Read, Information/Read |
| **M45 — SQL run** | Blocks Supabase cache persistence | Michael (or Admin): run `sql/M45_bigcommerce_schema.sql` in Supabase SQL Editor |
| **M05 — GMC service account** | Blocks image gap resolution | Michael: needed to cross-reference missing images at scale |
| **M06 — GA4 service account** | Blocks real traffic/conversion data | Michael: `view_count` in BC is a proxy; GA4 gives true session-level data |

---

## API Constraints + Risk Areas

### Rate Limits
- Standard BC plan: ~150 requests/minute. The adapter conservatively limits to 120/min.
- A full product catalog sync for 20K+ products at `limit=250` per page = ~80 requests minimum.
- Expect ~45 seconds for a full product fetch on the standard plan.
- **Mitigation:** Full sync is manual-only (no auto-polling). Cache in Supabase means reads are free after first sync.

### Pagination
- V3 API uses `page` + `limit` parameters. Max `limit=250`.
- `bcFetchAll()` handles pagination automatically with a `total_pages` check.
- Very large catalogs (50K+ products) may hit rate limits mid-sync — adapter backs off on 429 and retries once.

### Token Security
- BC token is stored in `localStorage` in this build (dev-mode convenience).
- **Production recommendation:** Move to Supabase `integration_configs` table (per-store, per-user-role), encrypted at rest. Never send to the Cloudflare Worker or log it.
- Token has only read-only scopes — worst case of exposure is catalog data read, not write.

### Write Risk Areas (DO NOT APPROACH without explicit plan)
| Operation | Risk | Notes |
|-----------|------|-------|
| `PUT /catalog/products/{id}` | **High** — mutates live product data | Any typo breaks live listings |
| `DELETE /catalog/products/{id}` | **Critical** — irreversible | Never automate |
| `PUT /pricelists/{id}/records` | **High** — affects live customer pricing | Needs preview + dry-run |
| `POST /catalog/products/{id}/images` | **Medium** — image upload can fail mid-batch | Needs per-item error handling |
| Inventory level writes | **High** — conflicts with POS / manual adjustments | Needs source-of-truth decision |

---

## Safe Next Integration Steps (in order)

### Step 1 — Get M04 token + run M45 SQL (prerequisite)
- Michael creates read-only BC API token (M04)
- Michael runs M45 SQL in Supabase
- Claude wires token into AccentOS via the Integration tab config modal

### Step 2 — First catalog sync
- Open Ecommerce Intel → Integration → Full Sync
- Confirm products/categories/brands cache populated
- Run opportunity scanner, review flag list

### Step 3 — Triage opportunity flags
- Filter to `missing_image` + `high` severity → this is the GMC overlap list
- Filter to `missing_description` → candidates for Eugene Klein CSV (M15)
- Filter to `low_margin` → pricing strategy discussion

### Step 4 — Wire bc_products_cache into existing modules
- `js/competitive_pricing.js`: read `our_price` from `bc_products_cache.price` where sku matches
- `js/inventory.js`: show BC `inventory_level` alongside CSV-import data
- `js/demand_forecast.js`: use `total_sold` as a velocity seed

### Step 5 — Webhook receiver (Cloudflare Worker)
- Add `/bc-webhook` route to `worker/` for real-time product + order events
- Validate HMAC-SHA256 `X-Webhook-Signature` header
- On `store/product/updated`: upsert into `bc_products_cache`
- On `store/order/created`: write to a new `bc_orders_cache` table (M46)
- Register webhooks via `POST /hooks` using the adapter (one-time setup call)

### Step 6 — bc-business-review skill upgrade
- Skill already exists at `skills/bc-business-review/SKILL.md`
- Currently reads from `deals` table
- After Step 5, switch to reading from `bc_orders_cache` for true ecommerce revenue

### Step 7 — GA4 bridge (after M06)
- Augment `view_count` / `total_sold` with real GA4 session data per page
- Enable true conversion funnel: Sessions → PDP views → Cart adds → Orders
- Surface in Ecommerce Intel → Overview as a new "Funnel" card

---

## Future Intelligence Opportunities

| Opportunity | Data Needed | Value |
|-------------|------------|-------|
| SKU-level conversion funnel | GA4 + BC orders | Find high-visibility / low-buy products |
| Replenishment alerts | BC inventory + PO lead times | Prevent stockouts on fast movers |
| Price elasticity signals | Historical BC price changes + order deltas | Inform markdown strategy |
| Vendor catalog completeness score | BC products grouped by brand_id | Vendor scorecard input |
| Trade customer price list audit | BC price lists + Trade Partners table | Ensure designers get right tier |
| GMC feed health bridge | BC products + GMC feed via M05 | Flag products suppressed in Shopping feed |
| Abandoned cart recovery | BC webhooks (`store/cart/abandoned`) | High-value recovery opportunity |
| New product velocity tracking | BC order history + date_created | Identify slow launchers vs fast movers |

---

## M-Task Summary (what Michael needs to do)

| Task | Action | Unlocks |
|------|--------|---------|
| **M04** | Create BC read-only API token | Entire live BC integration |
| **M45** | Run `sql/M45_bigcommerce_schema.sql` in Supabase | Cache persistence + sync log |
| **M05** | GMC service account | Image gap cross-reference |
| **M06** | GA4 service account | True conversion data |

---

*End of Runway Roadmap — clean pause point. Push branch → report to Michael.*
