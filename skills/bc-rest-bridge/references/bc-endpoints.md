# BigCommerce REST endpoints — bc-rest-bridge initial set

> Canonical URL templates, headers, and sample request/response bodies for the four mutation variants bc-rest-bridge supports against Accent Lighting's `store-cwqiwcjxes`. Add new variants here before adding them to `payload-schemas.md` or `action-queue/references/executor-registry.md`.

---

## Common header shape

Every request:

```
X-Auth-Token: $BC_API_TOKEN
Content-Type: application/json
Accept:       application/json
```

When `If-Match` is supported (custom-fields, price-list records), include:

```
If-Match: <idempotency_key sha256 prefix>
```

Base URL: `https://api.bigcommerce.com/stores/store-cwqiwcjxes/v3`

Rate limit: **50 requests/sec per store**. Sleep 25 ms between calls. Watch `X-Rate-Limit-Requests-Left` and `X-Rate-Limit-Time-Reset-Ms` headers.

---

## Variant 1 — product_field_edit

Updates one or more direct fields on a catalog product (name, description, meta_description, price, sale_price, sku, weight, is_visible, sort_order, search_keywords, etc.).

### Read-for-diff (Step 3)

```
GET /catalog/products/{product_id}?include_fields=name,description,meta_description,price,sale_price,is_visible,categories
```

### Write

```
PUT /catalog/products/{product_id}
```

Sample body (only include the fields that actually change — never PUT the entire product):

```json
{
  "meta_description": "Shop the Acme Pendant — Antique Brass Pendant with 9.5W LED. UL listed. Free shipping over $99.",
  "price": 149.00
}
```

Sample 200 response excerpt:

```json
{
  "data": {
    "id": 12345,
    "meta_description": "Shop the Acme Pendant — ...",
    "price": 149.00,
    "date_modified": "2026-05-07T14:32:11+00:00"
  },
  "meta": {}
}
```

### Notes

- BC silently strips unknown fields — explicitly compare diff against the GET response, not against the request body.
- `meta_description` truncates to 255 chars at BC. bulk-meta-description already constrains to 145–160; safe.

---

## Variant 2 — custom_field_edit

Updates a single custom_field row attached to a product. Used for vendor-specific attributes (warranty_years, ul_listed, certifications, country_of_origin, custom badges).

### Read-for-diff

```
GET /catalog/products/{product_id}/custom-fields/{custom_field_id}
```

If `custom_field_id` is unknown, list:

```
GET /catalog/products/{product_id}/custom-fields
```

### Write

```
PUT /catalog/products/{product_id}/custom-fields/{custom_field_id}
```

Body:

```json
{
  "name": "warranty_years",
  "value": "5"
}
```

### Notes

- Custom-field `name` is the key clients see; renaming it is a breaking change. The proposer should pass an unchanged `name` and only mutate `value` unless the action_type explicitly says "rename".
- `If-Match` is supported here — pass the idempotency_key.

---

## Variant 3 — price_list_record

Adds or replaces a price-list record (per-variant pricing for trade partners, hospitality contracts, multifamily quotes). Distinct from the product's base `price` — price-lists override the base for specific customer groups.

### Read-for-diff

```
GET /pricelists/{price_list_id}/records?variant_id={variant_id}&limit=1
```

### Write

```
POST /pricelists/{price_list_id}/records
```

Body (the POST is upsert-ish — same variant_id replaces the existing record):

```json
{
  "variant_id": 9876,
  "currency": "USD",
  "price": 119.00,
  "sale_price": null,
  "calculated_price": 119.00,
  "retail_price": 149.00
}
```

### Notes

- Price-list IDs are stable. Common ones for Accent Lighting: trade-partner list, hospitality list, electrician list. Document the mapping in MASTER §13 when M04 lands.
- BC POSTs to /pricelists/{id}/records are NOT atomic across multiple variants — each variant is a separate POST. The proposer should batch via the `batch` payload top-level key.

---

## Variant 4 — category_assignment

Adds or removes category memberships for a product. AccentOS uses this when a vendor reorganizes their catalog or when bulk-meta-description's parent skill (gmc-feed-audit) suggests moving products to a new GMC-friendly category.

### Read-for-diff

```
GET /catalog/products/{product_id}?include_fields=categories
```

### Write (the same product PUT, but with the categories array as the only mutated field)

```
PUT /catalog/products/{product_id}
```

Body:

```json
{
  "categories": [42, 87, 103]
}
```

### Notes

- The `categories` array is **replace-not-merge** at BC. The proposer must pass the union of existing + new ids (or new minus removed). Step 3's diff computes added/removed against the GET response so the receipt is meaningful.
- Removing a product's last category breaks GMC feed inclusion — refuse a write that produces an empty array; mark error "category-assignment leaves product orphaned, refusing write".

---

## Adding a new variant

When a future skill (e.g. inventory-sync, image-uploader, brand-rebrand) needs a new endpoint:

1. Add the variant block above with the four sub-sections (read-for-diff, write, sample body, notes).
2. Add the matching payload shape to `payload-schemas.md`.
3. Register `action_type` in `action-queue/references/executor-registry.md` pointing at `bc-rest-bridge`.
4. Add the variant to the table in `SKILL.md` Step 2.
5. Re-eval via `skill-eval-suite` to confirm round-trip safety.
