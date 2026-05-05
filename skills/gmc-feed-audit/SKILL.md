---
name: gmc-feed-audit
description: >
  Scan the Accent Lighting Google Merchant Center feed (via the Feedenomics
  output → GMC pipeline) for products with missing or broken images,
  disapproved status, schema gaps, or broken canonical URLs. Outputs a
  ranked remediation queue: BC SKU, brand, fix type, severity, suggested
  action. Designed to make M14 (20K+ products with missing images)
  workable as 10–20 fix sprints instead of one impossible queue. Use
  this skill when Michael says: "audit the GMC feed", "what's broken in
  GMC", "GMC remediation queue", "scan the feed", "what products are
  failing GMC", "GMC missing images report", "feed audit", or any
  phrasing that asks for a Google Merchant Center health check on the
  Accent Lighting product feed. Do not use for one-off product lookups
  (use supabase-sql-magic) or for actual GMC API mutations (out of
  scope; this skill is read+report only). Always produces a ranked
  CSV-ready remediation queue plus paste-ready summary — never returns
  prose-only analysis.
---

# gmc-feed-audit

**Purpose:** Turn M14 (20K+ products with missing images) from "20K problems" into "10 fix sprints" by surfacing the highest-impact remediation queue with concrete fix types and severity.

Stolen from: Universal SEO Skill technical-audit pattern + Firecrawl MCP structured-extraction primitive.

---

## Trigger Recognition

Run when Michael says:
- "audit the GMC feed" / "GMC remediation queue"
- "what's broken in GMC" / "GMC missing images report"
- "scan the feed" / "feed audit"
- "what products are failing GMC"

---

## Step 1 — Identify the feed source

The Accent Lighting feed flows: BigCommerce store-cwqiwcjxes → Feedenomics → Lights America → GMC merchant ID 687520574.

Determine the source for this audit (in preference order):
- **Live GMC** — requires M05 (GMC API service account)
- **Feedenomics export** — CSV from the Feedenomics dashboard output
- **Supabase mirror** — if `marketing.feed_status` exists in `/home/user/accent-os/sql/M29_marketing_schema.sql`, prefer for cached data
- **BC product list as proxy** — fallback when above unavailable

Output the chosen source up front so the rest of the audit is reproducible.

---

## Step 2 — Pull the per-product status

Generate the query for the chosen source. For Supabase fallback (most common when M05 is pending):

```sql
SELECT
  bc_sku, brand, vendor_id,
  images_per_sku, primary_image_url,
  gmc_status, gmc_disapproval_reason,
  canonical_url, last_checked_at
FROM marketing.feed_status
WHERE last_checked_at > NOW() - INTERVAL '7 days'
ORDER BY last_checked_at DESC, bc_sku;
```

No LIMIT — the M14 problem is 20K+ rows. If the dataset exceeds 50K, paginate by `last_checked_at` cutoff and run twice. If the result count equals the previous run, flag possible truncation.

If any column is missing from the live schema, flag the gap and proceed with what's available.

---

## Step 3 — Classify each row's fix type

Per row, assign one fix type (in priority order — first match wins):

| Fix type | Trigger condition | Severity |
|---|---|---|
| **MISSING_PRIMARY** | `images_per_sku = 0` OR `primary_image_url IS NULL` | HIGH |
| **DISAPPROVED** | `gmc_status = 'disapproved'` | HIGH |
| **BROKEN_URL** | `canonical_url` returns 404/5xx (run broken-link-rescue first if not done) | HIGH |
| **PENDING_REINDEX** | `gmc_status = 'pending'` AND `last_checked_at` > 14 days | MEDIUM |
| **LOW_IMAGE_COUNT** | `images_per_sku = 1` (best-practice is 3+) | LOW |
| **STALE_CHECK** | `last_checked_at` > 30 days | LOW |
| **CLEAN** | none of the above | — |

---

## Step 4 — Rank and chunk

Sort by:
1. Severity (HIGH > MEDIUM > LOW)
2. Vendor revenue tier (top vendors first — from `vendors.revenue_tier` if available)
3. SKU age descending (newer SKUs first per Feedenomics M17 rule)

Chunk into **fix sprints** of 50–100 SKUs per fix type so Michael can work them serially.

---

## Step 5 — Output

```
═══ BLOCK 1: AUDIT SUMMARY ═══
Source: [chosen]
Total audited: [N]
HIGH: [count]  MEDIUM: [count]  LOW: [count]  CLEAN: [count]

═══ BLOCK 2: REMEDIATION QUEUE (CSV) ═══
sku,brand,vendor_id,fix_type,severity,sprint_id,suggested_action
12345,Acme,V123,MISSING_PRIMARY,HIGH,SPRINT_001,"Upload primary image + bulk-meta-description"
...

═══ BLOCK 3: SPRINT INDEX ═══
SPRINT_001 — 50 HIGH-severity products (top vendors first)
SPRINT_002 — next 50 HIGH
...

═══ BLOCK 4: NEXT-STEP HINTS ═══
- MISSING_PRIMARY rows → pair with bulk-meta-description
- BROKEN_URL rows → run broken-link-rescue first
- DISAPPROVED rows → pull GMC reason via M05 when credentials land
```

---

## Anti-patterns

- **Never** modify GMC or BC data from this skill — read+report only.
- **Never** dump 20K rows as a single block. Sprint chunking is the point.
- **Never** rank without revenue-tier weighting when data is available.
- **Never** silently skip ambiguous rows — flag as `UNKNOWN`.
- **Never** invent severity. Use the explicit table in Step 3.
