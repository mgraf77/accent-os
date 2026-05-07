# gsc-reports

> Canonical Search Console API query shapes and classifier thresholds for the AccentOS `gsc-insights` skill. Pull queries by ID — never improvise dimension/metric combos.

This file is the **contract** that `gsc-insights` SKILL.md Step 2 + Step 3 depend on. Edit with care: changing a threshold here changes triage output everywhere downstream (including the work-order list piped into `bulk-meta-description`).

---

## API basics

- **Endpoint:** `https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`
- **Auth:** service-account OAuth2 (JWT bearer) — credentials JSON path in env var `GSC_CREDENTIALS_JSON`. Required scope: `https://www.googleapis.com/auth/webmasters.readonly`.
- **Property:** value of env var `GSC_PROPERTY_URL` (e.g. `sc-domain:accentlightinginc.com` for the Accent Lighting domain property, or `https://www.accentlightinginc.com/` for the URL-prefix property — must match exactly what's verified in GSC).
- **Data lag:** GSC data is ~48 h behind real time. **Always set `endDate = today - 3`** to avoid partial-day skew on CTR.
- **Row cap per request:** 25,000. If a query returns exactly 25,000 rows, paginate via `startRow` until fewer come back — but for the AccentOS catalog 25k is sufficient at the weekly cadence.
- **Search type:** `web` only (Discover and Image are out of scope for the SEO triage use case).

---

## Reports R1–R4

### R1 — current_period_query_page

> Primary mover-detection signal: queries × landing pages this period.

```json
{
  "startDate":  "{{current_start}}",
  "endDate":    "{{current_end}}",
  "dimensions": ["query", "page"],
  "rowLimit":   25000,
  "type":       "web",
  "dataState":  "final"
}
```

Returns rows of `{query, page, clicks, impressions, ctr, position}`.

### R2 — prior_period_query_page

> Same shape as R1 with the comparison window. Required to compute deltas.

```json
{
  "startDate":  "{{prior_start}}",
  "endDate":    "{{prior_end}}",
  "dimensions": ["query", "page"],
  "rowLimit":   25000,
  "type":       "web",
  "dataState":  "final"
}
```

### R3 — current_period_page_only

> Page-level rollup for the missed-impressions filter. Lighter than R1; query dimension dropped so impressions aggregate per page.

```json
{
  "startDate":  "{{current_start}}",
  "endDate":    "{{current_end}}",
  "dimensions": ["page"],
  "rowLimit":   5000,
  "type":       "web",
  "dataState":  "final"
}
```

### R4 — tracked_sku_drops

> R1 filtered to the AccentOS tracked-SKU URL list. Tracked-SKU URL list comes from Supabase `hsyjcrrazrzqngwkqsqa` (`products.canonical_url`) when populated; falls back to the BigCommerce `store-cwqiwcjxes` sitemap (`/sitemap.xml`) when the Supabase column is empty.

Same payload as R1 but with a post-filter (the GSC API does not support page-prefix filters reliably across both property types). Filter logic:

```
keep_row = row.page IN tracked_sku_urls
```

If the tracked-SKU list is empty (early M02 state), R4 falls back to "any URL whose path contains `/p/` or `/products/`" — note this fallback in BLOCK 1 of the report so Michael knows the precision is reduced.

---

## Classifier thresholds (Step 3 contract)

These thresholds are the contract — do not soften them locally. If a future audit decides they're wrong, change them **here** and document the change in `decision-log`.

| View | Filter | Sort | Cap | Suggested action source |
|---|---|---|---|---|
| **Top Movers — Gainers** | `(position_prior - position_current) >= 3` AND `impressions_current >= 50` | `position_delta` desc | 12 | "no action; expand related content" |
| **Top Movers — Losers** | `(position_current - position_prior) >= 3` AND `impressions_current >= 50` | `position_delta` desc | 13 | per-pattern table below |
| **Missed Impressions** | `impressions_current >= 100` AND `ctr_current < 0.01` AND `position_current < 10` | `impressions_current` desc | 50 | always `→ run bulk-meta-description for [page]` |
| **Ranking Drops** | `(position_current - position_prior) >= 5` AND `page IN tracked_sku_urls` | `position_delta` desc | 25 | per-pattern table below |

Combined Top-Mover cap of 25 (12 gainers + 13 losers) is intentional — losers get the extra row because they're the actionable side.

Position is averaged across the period (GSC default). Treat positions as **continuous floats**, not integer ranks — a 4.2 → 8.7 shift is real movement even though both round to "top 10."

---

## Suggested-action lookup (Step 3 + Step 4)

The action column is what makes the report a work-order generator. Match each row through this table in order — first match wins. If no rule fires, write `→ review manually` (do not invent advice).

| # | Pattern | Suggested action |
|---|---|---|
| 1 | Row is in **Missed Impressions** view | `→ run bulk-meta-description for [page]` |
| 2 | Row is in **Ranking Drops** AND `page` matches `/p/` or `/products/` | `→ run broken-link-rescue for [page]; if 200, run bulk-meta-description` |
| 3 | Row is in **Ranking Drops** AND `page` is non-product (category / blog / static) | `→ run broken-link-rescue for [page]; if 200, review meta + content freshness` |
| 4 | Row is in **Top Movers — Losers** AND `page` matches `/p/` or `/products/` | `→ run bulk-meta-description; cross-check competitor pricing via gmc-feed-audit` |
| 5 | Row is in **Top Movers — Losers** AND `page` is non-product | `→ run broken-link-rescue, then review meta + internal link freshness` |
| 6 | Row is in **Top Movers — Gainers** | `→ no action; expand related content (note for marketing)` |
| 7 | Position degraded but `impressions_current == 0` AND `clicks_prior > 0` (page may be 404 / deindexed) | `→ run broken-link-rescue for [page]` |
| 8 | GSC reports `coverage error` indicator on the URL | `→ run broken-link-rescue; flag in gmc-feed-audit if product` |
| 9 | None of the above | `→ review manually` |

Patterns 2 and 4 are the most common bulk-meta-description handoffs — together they typically generate 60–80% of the URLs in BLOCK 5.

---

## Output ordering rules

- Within Top Movers, gainers print before losers — gainers are wins worth surfacing first; losers anchor attention for the action items below.
- Missed Impressions sort by **raw impressions** (descending), not by CTR — the volume is the leverage.
- Ranking Drops sort by **delta magnitude** descending — biggest fall first.
- Block 5 (handoff list) deduplicates by URL: a page may appear in both Missed Impressions and Ranking Drops, but it only goes into the bulk-meta-description input once.

---

## Edge cases

- **First run, no prior period.** If `prior_period_query_page` returns 0 rows (the property was just verified, no GSC history), **skip Top Movers and Ranking Drops** — they require deltas. Still produce Missed Impressions; mark Movers / Drops with "no prior history yet — need ≥1 week of GSC data".
- **Property type mismatch.** A `sc-domain:` property exposes all subdomains; a URL-prefix property does not. If `GSC_PROPERTY_URL` starts with `sc-domain:`, do not filter rows by hostname — GSC already scopes them. If it starts with `https://`, drop rows whose page hostname doesn't match.
- **Brand-name queries.** Queries that exactly match `accent lighting` or close variants typically have unusually high CTR — they're navigation, not discovery. Flag any Missed-Impressions row whose query starts with the brand as `[brand-query — verify]` so Michael doesn't waste a meta rewrite on it.
- **EMPTY_PERIOD reports.** R1, R2, or R3 returning 0 rows means an API auth or property-mismatch issue, not "the site got no traffic." Do not silently produce empty sections — surface the error in BLOCK 1.

---

## Cross-skill handoff contract

The `bulk-meta-description` skill's Step 1 explicitly accepts `output from a prior gsc-insights run` as an input source — Block 5 of the gsc-insights output is the handoff payload. Format:

```
# Pipe into: bulk-meta-description
/outdoor/sconces
/flush-mount
/p/acme-bronze
...
```

One URL per line, no headers, no commentary. This is parsed as-is by `bulk-meta-description` Step 1.
