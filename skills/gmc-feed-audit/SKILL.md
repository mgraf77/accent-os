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

**Purpose:** Convert M14 (20K+ products with missing images, disapprovals, and broken canonicals) from an undifferentiated 20K-row dump into sprint-sized remediation queues ranked by revenue impact and fix type.

Stolen from: Universal SEO Skill technical-audit pattern + Firecrawl MCP structured-extraction primitive.

---

## Trigger Recognition

Run when Michael says:
- "audit the GMC feed" / "GMC remediation queue"
- "what's broken in GMC" / "GMC missing images report"
- "scan the feed" / "GMC feed audit" / "feed audit" (only when GMC context is clear — a standalone "feed audit" about RSS/Atom or site crawl goes elsewhere; "check broken URLs site-wide" or "404 audit" routes to broken-link-rescue, not here)
- "what products are failing GMC"
- "M14 sprint" / "run the feed audit" / "Feedenomics report"

---

## Step 1 — Identify the feed source

The Accent Lighting feed flows: BigCommerce store-cwqiwcjxes → Feedenomics → Lights America → GMC merchant ID 687520574.

Determine the source for this audit (in preference order):
- **Live GMC** — requires M05 (GMC API service account)
- **Feedenomics export** — CSV from the Feedenomics dashboard output
- **Supabase mirror** — if `marketing.feed_status` exists in `/home/user/accent-os/sql/M29_marketing_schema.sql`, prefer for cached data
- **BC product list as proxy** — fallback when above unavailable

Output the chosen source up front so the rest of the audit is reproducible:

```
Audit source: Supabase hsyjcrrazrzqngwkqsqa → marketing.feed_status (M29 schema, last synced YYYY-MM-DD, row_count: N)
```
Replace `YYYY-MM-DD` with the actual `last_synced_at` timestamp from the table — never use a cached or assumed date. If `last_synced_at` is older than 7 days, stop and output: `STALE SOURCE — re-sync marketing.feed_status before auditing.`

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

Omit LIMIT — M14 has 20K+ rows and needs a full scan. If the result set exceeds 50K rows, paginate by `last_checked_at` cutoff and run twice. If the result count matches the previous run exactly, flag possible truncation.

If any column is missing from the live schema, flag the gap, list which fix types become unclassifiable (e.g. `gmc_status` absent → DISAPPROVED and PENDING_REINDEX rows cannot be classified; `images_per_sku` absent → MISSING_PRIMARY and LOW_IMAGE_COUNT rows cannot be classified), and proceed using only the columns present. If fewer than 3 of the 9 expected columns are present, stop and output: `SCHEMA TOO SPARSE — marketing.feed_status is missing [N] of 9 expected columns. Re-sync or use a different source before auditing.`

---

## Step 3 — Classify each row's fix type

Per row, assign one fix type (in priority order — first match wins):

| Fix type | Trigger condition | Severity |
|---|---|---|
| **MISSING_PRIMARY** | `images_per_sku = 0` OR `primary_image_url IS NULL` | HIGH |
| **DISAPPROVED** | `gmc_status = 'disapproved'` | HIGH |
| **BROKEN_URL** | `canonical_url` returns 404/5xx — this is a GMC feed `canonical_url` check only; standalone site-wide 404 audits use broken-link-rescue, not this skill | HIGH |
| **PENDING_REINDEX** | `gmc_status = 'pending'` AND `last_checked_at` > 14 days | MEDIUM |
| **LOW_IMAGE_COUNT** | `images_per_sku = 1` (best-practice is 3+) | LOW |
| **STALE_CHECK** | `last_checked_at` > 30 days | LOW |
| **CLEAN** | none of the above | — |

---

## Step 4 — Rank and chunk

Sort by:
1. Severity (HIGH > MEDIUM > LOW)
2. Vendor revenue tier (top vendors first — from `vendors.revenue_tier` if available)
3. SKU age descending (newer SKUs first — Feedenomics M17 rule: newly added products have a shorter GMC-approval window before the listing lapses to "pending" status, so fixing them earlier avoids re-submission)

Chunk into **fix sprints** of 50–100 SKUs per fix type so Michael can work them serially. Each sprint gets a numbered ID: `SPRINT_001`, `SPRINT_002`, etc. The sprint-to-SKU mapping feeds directly into Step 5 BLOCK 3.

---

## Step 5 — Output

```
═══ BLOCK 1: AUDIT SUMMARY ═══
Source: [chosen]
Total audited: [N]
HIGH: [count]  MEDIUM: [count]  LOW: [count]  CLEAN: [count]

═══ BLOCK 2: REMEDIATION QUEUE (CSV) ═══
# Save as: gmc-audit-YYYY-MM-DD-sprint[N].csv (one file per sprint)
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
- **Never** rank without revenue-tier weighting when `vendors.revenue_tier` is present in the schema — omitting it causes top-revenue vendors to appear behind low-revenue ones in the sprint queue.
- **Never** silently skip rows where both `gmc_status IS NULL` and `images_per_sku IS NULL` — flag these as `UNKNOWN` fix type with severity TBD and include them in the sprint count.
- **Never** invent severity. Use the explicit table in Step 3.
- **Never** run this skill on a Feedenomics export older than 7 days without flagging staleness — GMC status changes daily and a stale audit produces misleading sprint queues for Accent Lighting's 20K+ SKU catalog.
