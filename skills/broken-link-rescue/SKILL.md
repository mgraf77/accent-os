---
name: broken-link-rescue
description: >
  Crawl Accent Lighting product URLs (BC store-cwqiwcjxes /products/*
  and feed canonical URLs from Supabase hsyjcrrazrzqngwkqsqa
  marketing.feed_status) and flag 404s, 5xx responses, redirect chains,
  GMC-disapproved URLs, and missing canonicals. Outputs a per-row fix
  recommendation: re-index trigger, canonical correction, 301 setup,
  or product retirement. Use this skill when Michael says: "broken
  link rescue", "find broken product URLs", "URL audit", "404 check",
  "GMC re-index pending", "M16 batch", "P053-077", or any phrasing
  that asks for a URL-health audit of the Accent Lighting product
  catalog. Do not use for general SEO audits (use gmc-feed-audit) or
  for actual URL rewrites (this skill is read+report only — Michael
  applies fixes via BC admin or 301 rules). Always produces a
  per-row fix recommendation table — never returns prose-only.
---

# broken-link-rescue

**Purpose:** M16 (4 GMC URLs pending re-index, P053-077 batch) and ongoing URL hygiene. Without this skill, broken canonicals get noticed only when GMC penalizes a product.

Stolen from: Firecrawl MCP recurring-crawls + broken-link-detection patterns + Universal SEO Skill link-auditing primitive.

---

## Trigger Recognition

Run when Michael says:
- "broken link rescue" / "find broken product URLs"
- "URL audit" / "404 check"
- "GMC re-index pending" / "M16 batch"
- "P053-077" / any product batch identifier (e.g. "P100-150 batch")
- "canonical issues" / "fix canonical tags" / "check canonicals"

---

## Step 1 — Define the URL set to crawl

Input one of:
- A specific batch (e.g. "P053-077") — resolves to a SKU range in Supabase
- All products with `gmc_status = 'pending'` and `last_checked_at` > 14 days
- A direct list of URLs in the prompt
- Default: top 500 products by revenue from `vendors.revenue_tier` (sample mode)

Output the chosen URL set count up front so the run scope is explicit:

```
Scope: P053-077 batch → 25 URLs from Supabase hsyjcrrazrzqngwkqsqa (gmc_status = 'pending', last_checked_at > 14 days)
```

---

## Step 2 — Crawl each URL

For each URL, capture:
- HTTP status (final, after redirects)
- Redirect chain (each hop)
- Canonical tag in HTML head (`<link rel="canonical" href="...">`)
- Meta robots directive (noindex/nofollow flags)
- Page title (for redirect-target sanity check)

Use `WebFetch` for direct probes when the URL set is ≤20 — capture results into a per-URL crawl record (url, http_status, redirect_hops, canonical, robots_directive, page_title). Above 20, generate a Firecrawl batch payload as paste-ready JSON output for Michael to run externally — sequential WebFetch calls hit rate limits fast and cost compounds.

---

## Step 3 — Classify each URL

| Status | Trigger | Severity | Recommended action |
|---|---|---|---|
| **OK** | 200 + canonical present + no robots block | — | None |
| **HARD_404** | 404 final | HIGH | Retire product OR set 301 to category page |
| **5XX** | 500/503 final | HIGH | Investigate BC origin; retry in 1h |
| **REDIRECT_CHAIN** | >2 hops to reach 200 | MEDIUM | Set direct 301 from original URL to final destination |
| **CANONICAL_MISMATCH** | canonical points to different URL than crawled | MEDIUM | Update BC product canonical OR fix redirect target |
| **GMC_NOINDEX** | meta robots noindex on a feed-eligible product | HIGH | Remove noindex tag (likely a BC misconfig) |
| **MISSING_CANONICAL** | no `<link rel="canonical">` | LOW | Add canonical via BC product setting |
| **PENDING_REINDEX** | matches M16 batch criteria, was URL-clean on last check | LOW | Trigger GMC re-index manually (M16 close-out) |

---

## Step 4 — Suggest the fix per row

For each non-OK row, output one concrete next step:

- **HARD_404** → "Retire product in BC OR set 301 to the matching category page path"
- **REDIRECT_CHAIN** → "Add direct 301 in BC redirect manager from the original slug to the final destination slug"
- **CANONICAL_MISMATCH** → "Edit BC product canonical to match the final resolved URL"
- **GMC_NOINDEX** → "Remove `<meta name='robots' content='noindex'>` from product template"
- **PENDING_REINDEX** → "Submit the product URL to GMC re-index queue"

Pair every fix line with the BC admin path (e.g. `/manage/products/12345` or `/manage/redirects`) and the Feedenomics re-index rule number if the product is in the M16 batch.

---

## Step 5 — Output

```
═══ BLOCK 1: CRAWL SUMMARY ═══
URLs crawled: [N]
OK: [count]   HARD_404: [count]   REDIRECT_CHAIN: [count]
CANONICAL_MISMATCH: [count]   GMC_NOINDEX: [count]
PENDING_REINDEX: [count]   MISSING_CANONICAL: [count]   5XX: [count]

═══ BLOCK 2: PER-URL FIX QUEUE (CSV) ═══
url,status,severity,action,bc_admin_path
/products/acme-pendant-001,HARD_404,HIGH,"Retire OR 301 → /category/pendants",/manage/products/12345
/products/old-sconce-fixture,REDIRECT_CHAIN,MEDIUM,"Direct 301 → /products/new-sconce",/manage/redirects
...

═══ BLOCK 3: FIRECRAWL BATCH PAYLOAD ═══ (only if URL set > 50)
[paste-ready Firecrawl MCP batch JSON]

═══ BLOCK 4: M16 CLOSE-OUT ═══
For PENDING_REINDEX rows that were P053-077:
  Submit to GMC re-index queue:
  https://merchants.google.com/mc/products?merchantId=687520574
```

---

## Anti-patterns

- **Never** modify BC URLs or set redirects from this skill — output the actions, Michael executes.
- **Never** make >50 sequential WebFetch calls. Batch via Firecrawl when scope is large.
- **Never** flag a redirect chain of length 1 (single 301) as broken — that's intentional.
- **Never** classify a URL as HARD_404 on a single failed probe. Retry once after 60s.
- **Never** silently ignore the canonical tag — it's the single most common GMC issue after missing images.
- **Never** mix URL sets from different batches (e.g. P053-077 and P100-150) in a single crawl run — keep batch IDs separate so the M16 close-out CSV maps cleanly to one batch at a time.
