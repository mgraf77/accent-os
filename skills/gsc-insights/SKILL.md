---
name: gsc-insights
description: >
  Pull Google Search Console data for the Accent Lighting site
  (accentlightinginc.com) and surface three high-leverage AccentOS
  reports: top-mover SKUs (queries with biggest position deltas
  week-over-week), missed-impression opportunities (impressions > 100
  AND CTR < 1% AND position < 10 = needs better meta description),
  and ranking drops (>5 position drop on tracked product URLs). Each
  row includes a paste-ready suggested action — most often "→ run
  bulk-meta-description for [URL]" — making this skill the work-order
  generator that feeds bulk-meta-description for SEO triage. Use this
  skill when Michael says: "gsc report", "search console insights",
  "pull gsc", "run gsc", "what's moving in search", "what's ranking",
  "ranking drops", "rankings dropping", "missed impressions", "gsc
  weekly", "search query report", "what urls need better meta", "what
  pages need meta work", "serp check", "/gsc", or any phrasing that
  asks for a Google Search Console pull or organic-search performance
  review.
  Do not use for paid-search (Google Ads is separate) or for
  on-page SEO crawling (use broken-link-rescue). Always produces three
  Markdown sections (movers / missed-impressions / drops) with
  per-row suggested actions — never returns prose-only commentary,
  and always returns the BLOCKED stub when M06 credentials are absent.
---

# gsc-insights

**Purpose:** Convert raw Google Search Console data into a paste-ready AccentOS triage report — top movers, missed impressions, ranking drops — each row tagged with a concrete next-action that feeds the right downstream skill (most often `bulk-meta-description`).

---

## Trigger Recognition

Run this skill when Michael says (all-lowercase, terse — match Michael's profile):
- "gsc report" / "gsc weekly" / "search console insights" / "pull gsc" / "run gsc"
- "what's moving in search" / "what's ranking" / "what's ranking now"
- "ranking drops" / "missed impressions" / "we're losing rankings" / "rankings dropping"
- "search query report" / "queries this week" / "top queries"
- "what urls need better meta" / "what needs a meta rewrite" / "what pages need meta work"
- "gsc for [vendor / category]" / "gsc for [brand]"
- "are we losing serp" / "serp check"
- "/gsc"

Do not trigger for: Google Ads / paid-search performance, on-page crawl audits (use `broken-link-rescue`), GMC product-feed health (use `gmc-feed-audit`), or on-site behavior / sessions / conversions (use `ga4-insights`).

---

## Step 0 — Preflight (BLOCKED gate on M06)

This skill is gated on **M06 — Google Analytics 4 + Search Console service account** per `BUILD_PLAN_MICHAEL.md` lines 186–194 (shared blocker with `ga4-insights`). Until that resolves the skill ships in stub mode.

1. Check whether the blocking dependency exists. For `gsc-insights`, **both** of these env vars must be set in the active session:
   - `GSC_PROPERTY_URL` — the GSC property identifier (e.g. `sc-domain:accentlightinginc.com` or `https://www.accentlightinginc.com/`)
   - `GSC_CREDENTIALS_JSON` — filesystem path to the service-account JSON, OR the JSON contents inline

   Run this check exactly:

   ```bash
   test -n "$GSC_PROPERTY_URL" && test -n "$GSC_CREDENTIALS_JSON" && echo OK || echo BLOCKED
   ```

2. If either is missing, return this exact stub and exit — do **not** attempt to call the API, generate fake data, or "skip the check just this once":

   > ⚠ skill `gsc-insights` is BLOCKED on **M06** (Google Analytics 4 + Search Console service-account credentials — shared with `ga4-insights`).
   >
   > **To unblock (per `BUILD_PLAN_MICHAEL.md` M06, lines 186–194):**
   > 1. Open `https://console.cloud.google.com/iam-admin/serviceaccounts` — reuse the M05 service account or create `accentos-ga4@`.
   > 2. In Search Console (`https://search.google.com/search-console`) → **Settings → Users and permissions → Add user** → paste the service-account email → grant **Restricted** access.
   > 3. Download the service-account JSON if not already done in M05.
   > 4. Export both env vars in this Codespace (and add to `.env` for persistence):
   >    ```bash
   >    export GSC_PROPERTY_URL="sc-domain:accentlightinginc.com"
   >    export GSC_CREDENTIALS_JSON="/home/user/accent-os/.secrets/gsc-sa.json"
   >    ```
   > 5. Paste to Claude → `M06 done — GA4 + GSC service account configured. Property ID: <paste>. Sites verified: <paste>.`
   >
   > **What this skill produces once active:** three Markdown sections — *Top Movers*, *Missed Impressions*, *Ranking Drops* — each row with query, current position, prior position, impressions, CTR, suggested action. Companion handoff: BLOCK 5 emits a paste-ready URL list that feeds the `bulk-meta-description` skill as a work order.
   >
   > Skill activates automatically on the next invocation once both env vars resolve and a smoke-test GSC API call succeeds.

3. If both env vars are present, proceed to Step 1.

---

## Step 1 — Resolve scope and date window

Parse Michael's request for scope hints; default to **whole-site, last 7 days vs. previous 7 days** when none given.

| Scope hint | Action |
|---|---|
| "for [vendor / category]" | Filter queries+pages whose URL path contains that brand/category slug (resolve via Supabase `vendors` if ambiguous) |
| "last 30 days" / "monthly" | Window = last 30 vs. prior 30 |
| "since [date]" | Window = [date]→today vs. equal-length prior period |
| (no hint) | Window = last 7 vs. prior 7 |

Output the chosen scope + window up front so the run is reproducible. GSC has a ~2-day data lag — use `today - 3` as the upper bound to avoid partial-day noise.

---

## Step 2 — Pull the four GSC reports

Authenticate with the service-account JSON (from `GSC_CREDENTIALS_JSON`) against `webmasters.searchanalytics.query` for the property in `GSC_PROPERTY_URL`. See `references/gsc-reports.md` for the four canonical query shapes — pull all four in parallel:

1. **Current period — by query+page** (dimensions: `query, page`; rows: 25000)
2. **Prior period — by query+page** (same shape, shifted window)
3. **Current period — by page only** (dimensions: `page`; rows: 5000) — for the missed-impressions filter
4. **Tracked-SKU drops** — same query+page rows but joined on the AccentOS tracked-SKU URL list (Supabase `products.canonical_url` when available, else BigCommerce sitemap)

If the API returns `403 forbidden`, the service account exists but isn't attached to the property — re-surface the M06 stub's step 2 (Search Console → Users and permissions). Do not retry with a different identity.

If a query returns 0 rows for a period, mark the report as `EMPTY_PERIOD` and continue — don't fail the whole run.

**Failure paths in Step 2:**
- **API 429 / quota exceeded:** 25k-row pulls can blow the per-day quota for the GSC search-analytics endpoint. On 429, back off 60s and retry once with `rowLimit=10000`. If the second attempt fails, run the per-page report (R3) only, mark Top Movers + Ranking Drops as `QUOTA_PARTIAL`, and emit a partial run (see Output format below).
- **Tracked-SKU URL list empty:** if the Supabase `products.canonical_url` join in R4 returns 0 rows (schema not yet populated, or `canonical_url` column missing), skip the Ranking Drops view entirely and surface a one-line note: `Ranking Drops unavailable — Supabase products.canonical_url is empty. Populate via product-self-knowledge or BC sitemap import.` Never substitute "all product URLs" for the tracked list silently — the threshold contract assumes a curated tracked-SKU set.
- **Supabase unreachable for the canonical_url join used in Step 4:** see Step 4's fallback (emit BLOCK 5b only).

---

## Step 3 — Compute the three triage views

Run each row through the classifier in `references/gsc-reports.md`. The thresholds are **not** suggestions — they're the contract:

| View | Filter | Sort | Cap |
|---|---|---|---|
| **Top Movers** | `abs(position_current - position_prior) >= 3` AND `impressions_current >= 50` | `position_delta` desc (gainers first), then losers section | 25 rows total |
| **Missed Impressions** | `impressions_current >= 100` AND `ctr_current < 0.01` AND `position_current < 10` | `impressions_current` desc | 50 rows |
| **Ranking Drops** | `position_current - position_prior >= 5` AND `page` is in tracked-SKU URL list | `position_delta` desc (worst drops first) | 25 rows |

Per row, attach a **suggested action** from this lookup:

| Pattern | Action |
|---|---|
| Missed Impressions row | `→ run bulk-meta-description for [page]` |
| Ranking Drop on a product URL | `→ run broken-link-rescue for [page]; if 200, run bulk-meta-description` |
| Top Mover gainer | `→ no action; expand related content (note for marketing)` |
| Top Mover loser, page is product URL | `→ run bulk-meta-description; check competitor pricing in competitive-pricing` |
| 404/redirect-implied (position degraded but impressions zero) | `→ run broken-link-rescue for [page]` |
| GSC reports a `coverage error` URL | `→ run broken-link-rescue; flag in gmc-feed-audit if product` |

If no action pattern fits, write `→ review manually` rather than guessing.

---

## Step 4 — Produce the work-order list for `bulk-meta-description`

Every row across Missed Impressions + Ranking Drops + product-URL Top Mover losers tagged `→ bulk-meta-description` is collected into a deduplicated work-order at the end of the report.

**Handoff contract (must match `bulk-meta-description` Step 1 input shapes — that skill accepts product IDs / CSV path / prior-skill output, NOT raw URL strings):**

1. Resolve each candidate URL to a BigCommerce product ID via Supabase `hsyjcrrazrzqngwkqsqa` table `products` on `canonical_url`. Use the same lookup join as the tracked-SKU URL list in Step 2.
2. Emit two sub-blocks in BLOCK 5:
   - **5a — Resolved product IDs:** one `bc_product_id` per line — paste-ready into `bulk-meta-description` Step 1 ("Direct product ID list in Michael's prompt"). Header line is exactly `# bulk-meta-description input — paste below this line` so the format is unambiguous.
   - **5b — Unresolved URLs:** one URL per line whose `canonical_url` lookup failed (non-product page, redirect, or schema gap). Tagged `→ review manually` — these do NOT feed `bulk-meta-description`.
3. If Supabase is unreachable for the lookup, emit only 5b with every URL and a one-line note: `Supabase unreachable for canonical_url join — paste the URL list to Michael, who will re-resolve when Supabase is back.` Do not silently produce a list of URLs labeled as product IDs.

---

## Step 5 — Render the report and write the run artifact

Render the three Markdown sections per the `## Output format` block below. After rendering, write a copy of the run to `/home/user/accent-os/skills/gsc-insights/runs/[YYYY-MM-DD]-gsc-run.md` so the next run can compute deltas against it (and so `analysis-snapshot` can pin a notable run).

If the `runs/` directory doesn't exist, create it. If a same-day run already exists, append a timestamp suffix (`-1500.md`) rather than overwriting — drop history is the point.

---

## Output format

```
═══ BLOCK 1: SCOPE ═══
Property: [GSC_PROPERTY_URL]
Window:   [current start]→[current end]  vs.  [prior start]→[prior end]
Scope:    [whole-site | vendor:X | category:Y]
Pulled:   [N] queries × pages

═══ BLOCK 2: TOP MOVERS (≤25) ═══

### Gainers
| Query | Page | Pos (cur→prior) | Δ | Impr | CTR | Suggested action |
|---|---|---|---|---|---|---|
| modern brass pendant | /pendants/brass | 4.2 → 8.7 | -4.5 | 1,240 | 3.1% | → no action; expand related content |
| ...

### Losers
| Query | Page | Pos (cur→prior) | Δ | Impr | CTR | Suggested action |
|---|---|---|---|---|---|---|
| outdoor wall sconce | /outdoor/sconces | 11.4 → 6.2 | +5.2 | 870  | 0.8% | → run bulk-meta-description for /outdoor/sconces |
| ...

═══ BLOCK 3: MISSED IMPRESSIONS (≤50) ═══
High impressions, low CTR, top-10 position = meta description is the lever.

| Query | Page | Pos | Impr | CTR | Suggested action |
|---|---|---|---|---|---|
| flush mount ceiling light | /flush-mount    | 6.8 | 3,210 | 0.7% | → run bulk-meta-description for /flush-mount |
| ...

═══ BLOCK 4: RANKING DROPS (≤25, tracked SKUs only) ═══
| Query | Page | Pos (cur→prior) | Δ | Impr | Suggested action |
|---|---|---|---|---|---|
| acme bronze chandelier | /p/acme-bronze | 14.2 → 7.1 | +7.1 | 410 | → run broken-link-rescue, then bulk-meta-description |
| ...

═══ BLOCK 5: BULK-META-DESCRIPTION HANDOFF (paste-ready) ═══

5a — Resolved product IDs (paste into bulk-meta-description Step 1):
# bulk-meta-description input — paste below this line
12345
67890
24680
...

5b — Unresolved URLs (no canonical_url match — review manually, do NOT pipe to bulk-meta-description):
/non-product/page-without-sku       → review manually
/redirected/old-url                 → review manually
...

[If Supabase was unreachable for the lookup, BLOCK 5 contains only 5b plus:]
Supabase unreachable for canonical_url join — paste the URL list to Michael, who will re-resolve when Supabase is back.

═══ BLOCK 6: NEXT-STEP HINTS ═══
- Pair this run with `gmc-feed-audit` if any losers are product URLs flagged disapproved
- Run `ga4-insights` (when M06-unblocked GA4 portion lands) for revenue context on each mover
- Add notable rows to `decision-log` if they reflect a strategy shift
- Snapshot this run via `analysis-snapshot` if the deltas are unusual
```

### Partial output (when one or more reports fail mid-run)

If R1–R4 hits an unrecoverable error (429 after retry, 403 auth, Supabase down for tracked-SKU join), emit a partial run header — DO NOT replace missing data with zeros or fabricated rows:

```
═══ PARTIAL RUN — [YYYY-MM-DD HH:MM] ═══
Completed: [list of report IDs that returned data]
Failed:    [list of report IDs that errored, with error code per ID]
Cause:     [quota | auth | supabase-down | tracked-sku-list-empty]

[Render BLOCKs whose underlying reports completed.]
[For BLOCKs whose reports failed, show the BLOCK header followed by:]
  ⚠ data unavailable — [error code]. Re-run after [next-window-suggestion] or fix [auth | quota | populate canonical_url].
```


---

## AccentOS context

- **Stack:** Google Search Console API (webmasters v1) authed via service-account JSON; cross-references Supabase `hsyjcrrazrzqngwkqsqa` for `products.canonical_url` and `vendors` lookup; consumed by `bulk-meta-description` and `broken-link-rescue`.
- **Project:** AccentOS (Accent Lighting — accentlightinginc.com)
- **Paths:** `/home/user/accent-os/skills/gsc-insights/` (Codespace: `/workspaces/accent-os/...`)
- **Property:** `sc-domain:accentlightinginc.com` (set via `GSC_PROPERTY_URL`)
- **Credentials:** service-account JSON path in `GSC_CREDENTIALS_JSON`; provisioned via M06 (shared with GA4)
- **Companion skills:**
  - `bulk-meta-description` — **primary downstream consumer**; receives Block 5 URL list as work-order input
  - `ga4-insights` — paired insight skill (revenue + behavior to GSC's traffic + visibility); same M06 unblock
  - `broken-link-rescue` — runs on Ranking-Drop pages before meta rewrites
  - `gmc-feed-audit` — cross-check Google product visibility for any product-URL losers
  - `bc-business-review` — embeds the top 3 movers + drop count in the weekly review
  - `analysis-snapshot` — pin a notable run for re-runnable comparison
- **Cadence:** weekly (Monday) by default; on-demand for vendor or category drill-downs

---

## Anti-patterns

- **Never** bypass the Step 0 BLOCKED gate. If `GSC_PROPERTY_URL` or `GSC_CREDENTIALS_JSON` is missing, return the stub and exit — do not call the API, do not fabricate sample rows, do not "show what it would look like."
- **Never** include the most-recent 2 days in the current window — GSC data lags ~48h and partial-day rows skew CTR badly.
- **Never** silently change the thresholds in Step 3. The contract is: missed-impressions = `impressions ≥ 100 AND CTR < 1% AND position < 10`. Drops = `position delta ≥ 5 on tracked SKU`. Top mover = `|delta| ≥ 3 AND impressions ≥ 50`. Lower thresholds means more noise, not more value.
- **Never** dump all 25k rows. Cap each section per Step 3; overflow goes to the run artifact only.
- **Never** suggest an action that isn't in the Step 3 lookup. If no pattern fits, write `→ review manually` — don't guess at marketing strategy.
- **Never** overwrite a same-day run artifact. Append a timestamp suffix so drop history is preserved.
- **Never** treat GSC rankings as causal. A position drop with no traffic loss is data; the action is investigate, not panic-rewrite.
- **Never** emit raw URL paths in BLOCK 5a as if they were `bulk-meta-description` input. That skill expects product IDs; BLOCK 5a must hold resolved `bc_product_id` values from the Supabase `products.canonical_url` lookup. Unresolved URLs go to BLOCK 5b tagged `→ review manually`.
- **Never** substitute "all product URLs" for the curated tracked-SKU list when Supabase returns 0 rows for the canonical_url join. Skip the Ranking Drops view and surface the populate-`canonical_url` note instead — the drop-threshold contract is calibrated on a curated set.
