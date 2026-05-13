# BigCommerce Integration Audit
> Phase 1 of BIGCOMMERCE_INTEGRATION_RUNWAY_V1
> Last updated: 2026-05-13

---

## 1. Store Identity

| Field | Value |
|-------|-------|
| Store hash | `store-cwqiwcjxes` |
| Admin URL | `https://store-cwqiwcjxes.mybigcommerce.com/manage` |
| API base (V3) | `https://api.bigcommerce.com/stores/store-cwqiwcjxes/v3` |
| API base (V2) | `https://api.bigcommerce.com/stores/store-cwqiwcjxes/v2` |
| Auth header | `X-Auth-Token: <token>` |
| Token location | Michael task M04 — not yet created |

---

## 2. API Shape

### V3 Endpoints (primary — use these)

| Resource | Endpoint | Notes |
|----------|----------|-------|
| Products | `GET /catalog/products` | Supports `include=images,variants,custom_fields` |
| Single product | `GET /catalog/products/{id}` | |
| Product images | `GET /catalog/products/{id}/images` | |
| Product variants | `GET /catalog/products/{id}/variants` | |
| Categories | `GET /catalog/categories` | Tree via `GET /catalog/categories/tree` |
| Brands | `GET /catalog/brands` | |
| Summary | `GET /catalog/summary` | Catalog health: product count, variant count, etc. |
| Channel listings | `GET /catalog/products/channel-listings` | Per-channel availability |
| Price lists | `GET /pricelists` | Multiple customer group prices |
| Price list records | `GET /pricelists/{id}/records` | SKU-level prices per list |

### V2 Endpoints (legacy — use only where V3 unavailable)

| Resource | Endpoint | Notes |
|----------|----------|-------|
| Orders | `GET /orders` | V3 orders endpoint exists but V2 more stable |
| Order products | `GET /orders/{id}/products` | Line-item details |
| Customers | `GET /customers` | Use V3 `/customers` instead |
| Coupons | `GET /coupons` | No V3 equivalent |
| Shipping zones | `GET /shipping/zones` | |

### V3 Customers (separate from catalog)

| Resource | Endpoint |
|----------|----------|
| Customers | `GET /customers` |
| Customer groups | `GET /customer-groups` |
| Addresses | `GET /customers/{id}/addresses` |

---

## 3. Authentication Requirements

- **Token type:** V2/V3 API Token (store-level, not OAuth)
- **Header format:** `X-Auth-Token: {token}` on every request
- **Content-Type:** `application/json`
- **Rate limits:** ~150 req/min for standard plans; 429 when exceeded
- **Pagination:** V3 uses `?page=N&limit=250` (max 250); check `meta.pagination.total_pages`
- **Scopes needed (read-only):**
  - `Products` → Read
  - `Orders` → Read
  - `Customers` → Read
  - `Information & Settings` → Read
  - `Marketing` → Read (for coupons/banners)
  - `Store Analytics` → Read (if available)
  - `Channel Settings` → Read

---

## 4. Webhook Catalog

Webhooks POST to an AccentOS endpoint (Cloudflare Worker) when events fire.
All require a registered endpoint via `POST /hooks`.

### High-value webhooks for AccentOS

| Scope | Event | Opportunity |
|-------|-------|-------------|
| `store/product/created` | New product added | Auto-flag for metadata completeness |
| `store/product/updated` | Product modified | Track description/image changes |
| `store/product/deleted` | Product removed | Sync cache invalidation |
| `store/product/inventory/updated` | Stock level change | Low-stock alert |
| `store/order/created` | New order | Revenue + conversion tracking |
| `store/order/statusUpdated` | Order status change | Fulfillment + win/loss signal |
| `store/cart/created` | Cart opened | Funnel entry signal |
| `store/cart/abandoned` | Cart abandoned | High-value abandoned opportunity |
| `store/category/created` | New category | Catalog structure change |

### Webhook setup requirements (M04 unlocks this)
- Need public HTTPS endpoint → Cloudflare Worker in `worker/` is the natural receiver
- AccentOS worker already handles `/ai` and auth — add `/bc-webhook` route
- Webhook signature validation via `X-Webhook-Signature` HMAC-SHA256

---

## 5. Catalog Access Patterns

### Product fields (V3 catalog/products)
```
id, name, sku, description, search_keywords, availability,
weight, price, retail_price, sale_price, cost_price,
categories (array of IDs), brand_id,
inventory_level, inventory_warning_level, inventory_tracking,
condition, is_visible, is_featured, is_free_shipping,
images (array), custom_fields (array of {name, value}),
date_created, date_modified,
total_sold, view_count,
variants (array with sku, price, inventory_level)
```

### Category fields
```
id, parent_id, name, description, image_url,
is_visible, default_product_sort, sort_order,
views, url
```

### Brand fields
```
id, name, page_title, meta_keywords, meta_description,
image_url, search_keywords
```

---

## 6. Data Opportunity Surfaces (pre-token analysis)

Based on known BC catalog characteristics for Accent Lighting (`store-cwqiwcjxes`):

### A. Missing Metadata (known from M14, M15 context)
- **20K+ products with missing GMC images** — same products missing in BC
- **Missing meta descriptions** — Eugene Klein CSV work (M15) targets these
- **Missing search_keywords** — SEO gap for organic product discovery
- **Empty product descriptions** — hurts on-site conversion + SEO

### B. Pricing Intelligence
- `cost_price` vs `price` → margin at SKU level
- `sale_price` vs `price` → discount depth tracking
- `retail_price` → MAP compliance signal
- Price list records → designer/trade tier pricing

### C. Inventory Signals
- `inventory_level` + `inventory_warning_level` → low-stock surface
- `inventory_tracking` flag → which SKUs actively tracked
- `total_sold` → velocity indicator (high-vel + low-stock = urgent)

### D. Conversion Signals
- `view_count` → traffic proxy per product
- `total_sold` → conversion denominator
- `view_count / total_sold` ratio → high-traffic/low-conversion list
- Category views + product count → thin-category surface

### E. Catalog Completeness
- Products with `images` array length = 0
- Products with `description` length < 50 chars
- Products with no `categories` assigned
- Products with `is_visible = false` (suppressed inventory)
- Products with `availability = 'disabled'`

---

## 7. Integration Blockers

| Blocker | Owner | Status | Unlocks |
|---------|-------|--------|---------|
| M04 — BC API token | Michael | Pending | Everything |
| M05 — GMC service account | Michael | Pending | Image issue resolution |
| M06 — GA4 service account | Michael | Pending | Traffic → conversion bridge |
| Cloudflare Worker webhook route | Claude | Ready to build (after M04) | Real-time BC events |
| Supabase BC cache tables | Claude | **Built this session (M45)** | Data persistence |

---

## 8. Existing AccentOS Surfaces That Benefit From BC Data

| Module | What BC adds |
|--------|-------------|
| Inventory (`js/inventory.js`) | Live BC inventory levels replace CSV import |
| Competitive Pricing (`js/competitive_pricing.js`) | `our_price` auto-fills from BC `price` field |
| Decision Engine (`js/decision_engine.js`) | View/sold ratio adds conversion surface |
| Demand Forecast (`js/demand_forecast.js`) | `total_sold` velocity replaces manual entry |
| KPI Snapshots | Catalog completeness score as a KPI |
| Alerts (`js/alerts.js`) | `inventory_low` can read live BC stock instead of cached |
| bc-business-review skill | Revenue from BC orders replaces deals-only view |

---

## 9. Safe Write Operations (future — post read-only runway)

These are cataloged here to inform risk planning but are NOT part of this build:

| Operation | Risk Level | Notes |
|-----------|------------|-------|
| Bulk update product descriptions | Medium | Reversible; should preview before write |
| Bulk update meta descriptions | Medium | Use CSV preview workflow first |
| Update inventory levels | High | Sync conflicts if POS also writes |
| Create/modify price lists | High | Affects live customer pricing |
| Disable/delete products | Very High | Irreversible visibility change |
| Create webhook subscriptions | Low | Safe; easy to delete |

---

*End of Phase 1 Audit*
