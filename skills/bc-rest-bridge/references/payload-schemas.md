# action_queue payload shapes for action_type=update_bc_product

> Canonical jsonb payload shapes a producer skill (bulk-meta-description, gmc-feed-audit, future competitive-pricing-sync) must emit when calling `action-queue.propose` with `action_type = update_bc_product`. bc-rest-bridge Step 2 matches on these shapes.

---

## Variant 1 — product_field_edit

```json
{
  "variant": "product_field_edit",
  "product_id": 12345,
  "fields": {
    "meta_description": "Shop the Acme Pendant — Antique Brass Pendant with 9.5W LED. UL listed. Free shipping over $99.",
    "price": 149.00
  },
  "proposer_skill": "bulk-meta-description",
  "rationale": "GMC remediation queue rank 3 — meta_description was empty"
}
```

Required: `variant`, `product_id`, `fields` (non-empty object). Optional: `proposer_skill`, `rationale`.

The `fields` object keys must match BigCommerce V3 product attribute names exactly (snake_case, lowercase). bc-rest-bridge does not transform keys.

---

## Variant 2 — custom_field_edit

```json
{
  "variant": "custom_field_edit",
  "product_id": 12345,
  "custom_field_id": 4421,
  "name": "warranty_years",
  "value": "5",
  "proposer_skill": "vendor-onboard-checklist"
}
```

Required: `variant`, `product_id`, `custom_field_id`, `name`, `value`. The `name` should match the existing custom-field name (this skill does not rename custom fields by default — see bc-endpoints.md notes).

---

## Variant 3 — price_list_record

```json
{
  "variant": "price_list_record",
  "price_list_id": 7,
  "variant_id": 9876,
  "currency": "USD",
  "price": 119.00,
  "sale_price": null,
  "calculated_price": 119.00,
  "retail_price": 149.00,
  "proposer_skill": "competitive-pricing-sync"
}
```

Required: `variant`, `price_list_id`, `variant_id`, `currency`, `price`. Optional: `sale_price`, `calculated_price`, `retail_price`. Currency must be ISO 4217.

---

## Variant 4 — category_assignment

```json
{
  "variant": "category_assignment",
  "product_id": 12345,
  "categories": [42, 87, 103],
  "proposer_skill": "gmc-feed-audit"
}
```

Required: `variant`, `product_id`, `categories` (non-empty array of ints). bc-rest-bridge Step 3 computes added/removed against the current category membership; an empty array is refused (orphans the product from GMC feed).

---

## Batch envelope

For bulk pushes (e.g. bulk-meta-description's CSV after Michael approves), wrap N variants in a `batch` array:

```json
{
  "batch": [
    { "variant": "product_field_edit", "product_id": 12345, "fields": { "meta_description": "..." } },
    { "variant": "product_field_edit", "product_id": 12346, "fields": { "meta_description": "..." } },
    { "variant": "product_field_edit", "product_id": 12347, "fields": { "meta_description": "..." } }
  ],
  "proposer_skill": "bulk-meta-description",
  "rationale": "Eugene CSV M15 batch 1 of 4"
}
```

bc-rest-bridge processes batch entries sequentially with the 25ms inter-call sleep. Each entry is a sub-write with its own idempotency_key, diff, and receipt row.

Mixed-variant batches (e.g. one product_field_edit + one price_list_record) are valid but discouraged — separate batches are easier to audit.

---

## Idempotency-key derivation

bc-rest-bridge derives the per-call idempotency_key as:

```
sha256(product_id + "::" + field_name + "::" + canonical(new_value) + "::" + proposer_skill)
```

Where:
- `product_id` falls back to `price_list_id::variant_id` for variant 3.
- `field_name` falls back to "categories" for variant 4 and to the custom-field `name` for variant 2.
- `canonical(new_value)` is `JSON.stringify` with sorted keys for objects, raw for primitives.
- `proposer_skill` is the payload's `proposer_skill` field, or "unknown" if absent.

A producer skill MAY supply its own `idempotency_key` in the payload to override the derivation — useful when the same logical change might be proposed by different upstream skills and they want to dedupe.

---

## Validation rules a producer should self-enforce

Before calling `action-queue.propose`:

1. `product_id` is a positive integer (BC catalog ids are >= 1).
2. `fields` keys are valid BC product columns (consult bc-endpoints.md or the BC docs).
3. `value` for custom-field edits is a string (BC stores all custom-field values as strings — even numeric ones).
4. Price values are decimals with 2 fractional digits (`149.00`, not `149` or `149.000`).
5. Category ids exist in the BC catalog (do not invent ids — fetch from `/catalog/categories` first).

Failing any of these does not block the propose — it will fail at bc-rest-bridge Step 5 with a 422 — but pre-validating saves a round trip and a failed audit row.
