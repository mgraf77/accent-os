---
name: bulk-meta-description
description: >
  Given a list of Accent Lighting BigCommerce product IDs (from
  gmc-feed-audit output, Eugene's CSV for M15, or any vendor batch),
  generate SEO-optimized meta descriptions using product attributes
  pulled from Supabase hsyjcrrazrzqngwkqsqa or the BC export. Each
  description: 145–160 characters, primary keyword first, brand and
  category mention, action verb. Outputs a CSV ready for BigCommerce
  store-cwqiwcjxes bulk import. Use this skill when Michael says:
  "generate meta descriptions", "bulk meta", "write meta for [product
  list]", "Eugene's CSV is ready", "fill in meta descriptions",
  "M15 batch", "do meta descriptions for [vendor]", or any phrasing
  that asks for batch SEO meta description generation. Do not use for
  product titles (separate skill) or for full product descriptions
  (use product-self-knowledge instead). Always produces a CSV with
  product_id, current_meta, new_meta, char_count — never returns
  prose-only.
---

# bulk-meta-description

**Purpose:** Eugene's CSV (M15) and the gmc-feed-audit output both produce lists of products that need meta descriptions. This skill generates them at scale, optimized for Accent Lighting SEO and ready for BigCommerce bulk import.

Stolen from: Universal SEO Skill meta-tag-generation primitive + product-self-knowledge attribute-mining pattern.

---

## Trigger Recognition

Run when Michael says:
- "generate meta descriptions" / "bulk meta"
- "write meta for [product list]"
- "Eugene's CSV is ready" / "M15 batch"
- "do meta descriptions for [vendor name]"
- "fill in meta descriptions"

---

## Step 1 — Receive the input list

The input is one of:
- Direct product ID list in Michael's prompt
- File path to a CSV (Eugene's CSV for M15)
- Output from a prior gmc-feed-audit run (filter MISSING_PRIMARY or LOW_IMAGE_COUNT rows)
- Vendor name (resolves to all that vendor's BC products)

If the input is ambiguous, ask once: "Source — paste IDs, /path/to/csv, or vendor name?"

---

## Step 2 — Load product attributes per ID

Pull from Supabase hsyjcrrazrzqngwkqsqa (preferred) or BC export:

```sql
SELECT
  bc_sku, name, brand, category, subcategory,
  finish, dimensions_in, lumens, color_temperature,
  ul_listed, vendor_id, current_meta_description
FROM products
WHERE bc_sku = ANY($1::text[]);
```

If `products` table is missing or schema-shaped differently in `/home/user/accent-os/sql/M*.sql`, fall back to whatever attribute table exists. Flag missing fields per row.

---

## Step 3 — Generate the meta description

Each meta description must:

| Constraint | Rule |
|---|---|
| **Length** | 145–160 characters (Google truncates ~160) |
| **Keyword position** | Primary keyword (category + brand) in first 60 chars |
| **Action verb** | Lead with "Shop", "Discover", "Find", "Browse" — pick the one that fits product class |
| **Specificity** | Include at least 2 product attributes (finish, lumens, dimensions) when available |
| **Brand mention** | Brand name appears once |
| **No clickbait** | No "best" / "amazing" / "must-have" — Accent Lighting voice is informative, not hyped |

Template shapes (pick one based on product class):

```
"Shop the [Brand] [Product Name] — [Finish] [Category] with [Key Attribute]. [Differentiator]. Free shipping on orders over $99."

"Discover [Brand]'s [Product Name]. [Dimensions] [Category] in [Finish], [Lumens]lm, [Color Temp]K. UL listed. Same-day shipping."
```

If a product has too few attributes (< 2) for a quality description, flag it as `INSUFFICIENT_DATA` and skip — Michael adds attributes upstream.

---

## Step 4 — Validate per row

Per generated description, check:
1. **Char count** in [145, 160] — if outside, regenerate with template variant
2. **No HTML / weird unicode** — strip if present
3. **No duplicate from existing meta** — if `current_meta_description` matches generated, mark `NO_CHANGE` (skip row)
4. **No vendor name confused with brand** — vendor (e.g. "Acme Lighting Co.") is not the same as brand

Output the validation result for every row as a one-line status entry:

```
product_id | sku       | char_count | status
-----------|-----------|------------|------------------
12345      | ACME-001  | 157        | OK
67890      | BC-002    | 143        | REGEN (too short)
11111      | MFG-007   | —          | INSUFFICIENT_DATA
```

---

## Step 5 — Output

```
═══ BLOCK 1: SUMMARY ═══
Input source: [source from Step 1]
Products processed: [N]
Generated: [count]   Skipped (insufficient data): [count]   Unchanged: [count]

═══ BLOCK 2: BC BULK IMPORT CSV (canonical format) ═══
# BC bulk import expects exactly: product_id,meta_description
product_id,meta_description
12345,"Shop the Acme Pendant — Antique Brass Pendant with 9.5W LED. UL listed. Free shipping over $99."
67890,"Discover Bright Co's Sconce. 12in W, 1200lm, 3000K. Same-day shipping."
...

═══ BLOCK 2b: REVIEW LOG (Michael-internal, do NOT import) ═══
product_id,sku,current_meta,new_meta,char_count,status
12345,ACME-001,"Old description","Shop the Acme Pendant...",157,OK
67890,BC-002,"","Discover Bright Co's...",153,OK
...

═══ BLOCK 3: FLAGGED ROWS ═══
For each INSUFFICIENT_DATA row:
  - sku, what attribute is missing, what to add upstream

═══ BLOCK 4: PASTE TARGET ═══
BC bulk product import:
https://store-cwqiwcjxes.mybigcommerce.com/manage/products/import
```

---

## Anti-patterns

- **Never** generate meta descriptions outside [145, 160] chars. If a product can't fit, regenerate with a tighter template.
- **Never** use clickbait language. Accent Lighting voice is informative.
- **Never** confuse vendor with brand — they're different fields.
- **Never** overwrite a meta that's already within length AND mentions brand — skip it as `NO_CHANGE`.
- **Never** invent product attributes. If a finish/lumens isn't in the data, leave it out of the description.
