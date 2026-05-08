---
name: ga4-insights
description: >
  Pull Google Analytics 4 data for the Accent Lighting consumer site and
  trade portal, interpret it through AccentOS's two-audience lens
  (consumer browsing vs. trade-partner ordering), and surface a
  paste-ready weekly insights brief: traffic by source, top landing
  pages, conversion funnel by audience split, week-over-week deviations,
  and >2σ anomaly flags. Reads via the GA4 Data API using the service
  account provisioned in M06; writes nothing, mutates nothing, only
  reports. Use this skill when Michael says: "ga4 insights", "what's
  ga4 saying", "pull ga4", "run ga4", "weekly traffic", "where is
  traffic coming from", "ga4 anomalies", "anomalies in ga4", "trade vs
  consumer traffic", "landing page movers", "conversion drops", "is
  conversion down", "anything weird in ga4", "/ga4", or any phrasing
  that asks for a Google-Analytics-derived view of Accent Lighting
  site performance.
  Do not use this skill for Google Search Console queries (use
  gsc-insights), per-deal investigation (use supabase-sql-magic), or
  full executive recap (use bc-business-review). This skill is gated on
  M06 — until GA4 credentials are provisioned, it ships a documentary
  stub explaining the unblock steps. Always returns either the
  4-block paste-ready GA4 brief (when active) or the M06 stub message
  (when blocked) — never silently no-ops, never invents numbers, never
  mixes GA4 with GSC data without a labeled source line.
---

# ga4-insights

**Purpose:** Give Michael a weekly GA4 read of Accent Lighting's web traffic — split between consumer site (accentlightinginc.com) and trade portal — with WoW deltas and >2σ anomaly flags, so traffic shifts are caught before revenue follows.

Stolen from: bc-business-review's WoW + z-score pattern, adapted to the GA4 Data API and the Accent Lighting trade-vs-consumer audience split.

---

## Trigger Recognition

Run this skill when Michael says anything like (all-lowercase / terse register — match Michael's profile):
- "ga4 insights" / "ga4 weekly" / "what's ga4 saying" / "pull ga4" / "run ga4"
- "weekly traffic" / "where is traffic coming from" / "traffic report" / "site traffic"
- "ga4 anomalies" / "anomalies in ga4" / "conversion drops" / "is conversion down"
- "trade vs consumer traffic" / "trade portal traffic" / "consumer site traffic"
- "landing page movers" / "top movers this week" / "what's moving on site"
- "is anything weird in analytics" / "anything weird in ga4" / "anything off in ga4"
- "what's the site doing" / "how's the site doing" (when context is web traffic, not pipeline)
- "/ga4"

Do NOT run for:
- Search Console / SERP / keyword / impressions / rankings → `gsc-insights`
- BigCommerce-side revenue / orders / pipeline → `bc-business-review`
- Single-page deep dive → `supabase-sql-magic` against page logs
- SKU / inventory / reorder forecasts → `demand-forecaster-skill`

---

## Step 0 — Preflight (BLOCKED gate on M06)

This skill is gated on **M06 — Google Analytics 4 + Search Console service account** per `BUILD_PLAN_MICHAEL.md` lines 186–194 (shared blocker with `gsc-insights`). Until that resolves the skill ships in stub mode.

1. Check whether the blocking dependency exists. For `ga4-insights`, **both** of these env vars must be set in the active session:
   - `GA4_PROPERTY_ID` — the GA4 property ID for accentlightinginc.com (e.g. `123456789`)
   - `GA4_CREDENTIALS_JSON` — filesystem path to the service-account JSON, OR the JSON contents inline
   - Optional: `GA4_TRADE_PROPERTY_ID` for the trade portal if it's a separate property; otherwise the skill uses an audience filter on the single property

   Run this check exactly:

   ```bash
   test -n "$GA4_PROPERTY_ID" && test -n "$GA4_CREDENTIALS_JSON" && echo OK || echo BLOCKED
   ```

2. If either is missing, return this exact stub and exit — do **not** attempt to call the API, generate fake data, or "skip the check just this once":

   > ⚠ skill `ga4-insights` is BLOCKED on **M06** (Google Analytics 4 + Search Console service-account credentials — shared with `gsc-insights`).
   >
   > **To unblock (per `BUILD_PLAN_MICHAEL.md` M06, lines 186–194):**
   > 1. Open `https://console.cloud.google.com/iam-admin/serviceaccounts` — reuse the M05 service account or create `accentos-ga4@`.
   > 2. In GA4 Admin → **Property Access Management** → add the service-account email with **Viewer** role.
   > 3. Download the service-account JSON if not already done in M05.
   > 4. Export both env vars in this Codespace (and add to `.env` for persistence):
   >    ```bash
   >    export GA4_PROPERTY_ID="<paste GA4 property ID, e.g. 123456789>"
   >    export GA4_CREDENTIALS_JSON="/home/user/accent-os/.secrets/ga4-sa.json"
   >    # optional, only if trade portal is a separate GA4 property:
   >    export GA4_TRADE_PROPERTY_ID="<paste trade-portal GA4 property ID>"
   >    ```
   > 5. Paste to Claude → `M06 done — GA4 + GSC service account configured. Property ID: <paste>. Sites verified: <paste>.`
   >
   > **What this skill produces once active:** a 4-block paste-ready weekly brief — headline KPIs (sessions, users, conversions) with WoW deltas; trade-portal vs consumer-site split; top 10 landing pages by movement; >2σ anomaly flags on traffic source × landing page combinations. Pulled fresh from the GA4 Data API on each invocation (no cache).
   >
   > Skill activates automatically on the next invocation once both env vars resolve and a smoke-test GA4 API call succeeds.

3. If both env vars are present, proceed to Step 1.

---

## Step 1 — Resolve the analysis date window

Defaults:
- **This week** = last 7 complete days (yesterday minus 6, through yesterday) — GA4 same-day data is unstable
- **Comparison window** = previous 7 days
- **Historical baseline** for anomaly detection = trailing 8 weeks (excluding current)

Overrides Michael may give: "last week", "last 14 days", "Q4 to date", explicit date range. If a custom window is given, pick a comparison of equal length immediately preceding it.

Output the chosen windows on the first line of BLOCK 1 so the brief is reproducible.

---

## Step 2 — Pull headline KPIs from GA4

Use the GA4 Data API `runReport` endpoint. Reference query shapes live in `references/ga4-reports.md` — pull them by report ID, do not improvise dimension/metric combos.

Reports to run for the headline block (`references/ga4-reports.md` IDs **R1–R3**):
- **R1: weekly_traffic_overview** — sessions, totalUsers, newUsers, screenPageViews, conversions, eventCount
- **R2: traffic_by_source** — dimension `sessionSource` × `sessionMedium`, metric `sessions`
- **R3: audience_split** — dimension `customEvent:audience_segment` (set in GA4 to `trade` vs `consumer`); fallback to `hostName` if the custom dimension isn't configured (trade portal hostname differs from consumer site)

Run R1 twice (this week, comparison window) and compute WoW % for each metric. If R1 returns zero rows for a metric, flag the metric as "no data" rather than treating as zero.

If R3's custom dimension isn't configured, output a one-line note in BLOCK 2: "Audience split using hostname proxy — recommend configuring GA4 custom event `audience_segment` for cleaner split."

**Failure paths in Step 2:**
- **API 429 / quota exceeded:** GA4 Data API has per-property daily quotas. On 429, back off 60s and retry once; if the second attempt fails, return a partial brief covering whatever reports completed (with a `═══ PARTIAL RUN ═══` header) plus a `quota exhausted — retry tomorrow or request quota increase in GCP` line. Never invent numbers to fill the missing reports.
- **Service-account JSON expired / 401 unauthenticated:** the env var resolves but auth fails. Re-surface M06 stub Step 1–2 (rotate the key in GCP, re-add the email in GA4 Admin → Property Access Management). Do not retry silently.
- **Custom dimension absent:** already handled above (hostname proxy + recommendation line). Never silently drop the audience split.

---

## Step 3 — Pull breakdowns

Reports R4–R6 from `references/ga4-reports.md`:

- **R4: top_landing_pages** — dimension `landingPagePlusQueryString`, metric `sessions` + `conversions`. Limit 25.
- **R5: conversion_funnel_by_source** — dimension `sessionSource`, metrics `sessions`, `conversions`, computed `conversionRate = conversions / sessions`. Limit 15.
- **R6: trade_vs_consumer_split** — pivot R3 by audience × `sessionSource` to show where each audience originates.

For R4, also pull the same dimensions for the comparison window and compute per-page session delta (this week minus last week). Sort by absolute delta to surface "top movers" — both gainers and decliners.

---

## Step 4 — Detect anomalies

Pull historical baselines (trailing 8 weeks excluding current) for two anomaly tiers:

| Tier | Dimension | Metric | Threshold |
|---|---|---|---|
| **TRAFFIC_SOURCE** | `sessionSource × sessionMedium` | weekly sessions | \|z\| > 2.0 |
| **LANDING_PAGE** | `landingPagePlusQueryString` | weekly sessions | \|z\| > 2.0 AND ≥100 sessions baseline |
| **CONVERSION_RATE** | site-wide | weekly conversionRate | \|z\| > 2.0 |

Compute z-score per row: `(this_week - mean) / stddev`. Require ≥4 weeks of history per dimension to qualify; rows with insufficient history are surfaced as "newcomers" not "anomalies".

**Insufficient history.** If fewer than 4 dimensions qualify across all tiers (i.e. GA4 has been live <4 weeks OR data is sparse), do NOT silently produce an empty anomaly block. Output explicitly: "Anomaly detection unavailable — needs ≥4 weeks of GA4 history. Currently: [N] qualifying dimensions across all tiers." This appears in BLOCK 3 instead of zero rows.

For each firing anomaly, output direction (UP / DOWN), magnitude, and a one-line hypothesis drawn from `references/anomaly-hypotheses.md` (e.g. UP on `google / organic` for landing page → "possible new keyword ranking" → check via gsc-insights).

---

## Step 5 — Output

```
═══ BLOCK 1: HEADLINE TRAFFIC KPIs ═══
Window: [YYYY-MM-DD] → [YYYY-MM-DD]   vs   [comp start] → [comp end]
Source: GA4 property [GA4_PROPERTY_ID]

Sessions:        [N]      ([+/-X.X%] WoW)
Users:           [N]      ([+/-X.X%] WoW)
New Users:       [N]      ([+/-X.X%] WoW)
Pageviews:       [N]      ([+/-X.X%] WoW)
Conversions:     [N]      ([+/-X.X%] WoW)
Conv. Rate:      [X.XX%]  ([+/-X.X pp] WoW)

═══ BLOCK 2: TRADE vs CONSUMER SPLIT ═══
                       Sessions   Conversions   Conv Rate   WoW Sessions
Trade portal           [N]        [N]           [X.X%]      [+/-X.X%]
Consumer site          [N]        [N]           [X.X%]      [+/-X.X%]

[If using hostname proxy:]
Note: split via hostname — recommend configuring GA4 custom event `audience_segment`.

Top sources by audience:
Trade:    1. [source/medium]  [N] sessions  ...
Consumer: 1. [source/medium]  [N] sessions  ...

═══ BLOCK 3: TOP LANDING PAGE MOVERS ═══
Top gainers (by absolute session delta):
1. [landing_path]                  [+N] sessions   ([prev] → [now])
...

Top decliners:
1. [landing_path]                  [-N] sessions   ([prev] → [now])
...

═══ BLOCK 4: ANOMALY FLAGS (|z| > 2.0) ═══
TRAFFIC_SOURCE tier:
  ↑ google / organic               z=+2.4   [now] vs [mean ±std]
    Hypothesis: possible new keyword ranking — check gsc-insights

LANDING_PAGE tier:
  ↓ /trade/account                 z=-2.7   [now] vs [mean ±std]
    Hypothesis: trade portal auth/UX regression — check recent deploys

CONVERSION_RATE tier:
  ↓ site-wide                      z=-2.1   [now] vs [mean ±std]
    Hypothesis: paid traffic mix shift OR checkout regression

[If insufficient history:]
Anomaly detection unavailable — needs ≥4 weeks of GA4 history.
Currently: [N] qualifying dimensions across all tiers.

═══ BLOCK 5: NEXT-STEP HINTS ═══
- For UP anomalies on organic: pair with gsc-insights to confirm SERP changes
- For DOWN anomalies on a landing page: pair with broken-link-rescue + recent deploy log
- For trade-portal drops: cross-check with Supabase deals table via supabase-sql-magic
- For weekly digest into the brief: feed BLOCK 1 + BLOCK 4 into daily-brief-composer
- Save this brief as: snapshot-NNN-ga4-insights-YYYY-WW
```

### Partial output (when one or more reports fail mid-run)

If any of R1–R6 returns an unrecoverable error (429 after retry, 401 auth, 5xx after retry), emit a partial brief — DO NOT replace missing data with zeros or invented numbers:

```
═══ PARTIAL RUN — [YYYY-MM-DD HH:MM] ═══
Completed: [list of report IDs that returned data]
Failed:    [list of report IDs that errored, with error code per ID]
Cause:     [quota | auth | upstream-5xx]

[Render the BLOCKs that have full data — skip BLOCKs whose reports failed]

For failed reports, show the BLOCK header followed by:
  ⚠ data unavailable — [error code]. Re-run after [next-window-suggestion] or fix [auth | quota].
```


---

## AccentOS context

- **Stack:** Google Analytics 4 (Data API v1beta) + Anthropic API for hypothesis generation
- **Project:** Accent Lighting (consumer site `accentlightinginc.com` + trade portal sub-domain)
- **Paths:** `/home/user/accent-os/` (Codespace: `/workspaces/accent-os/`)
- **Skill files:** `/home/user/accent-os/skills/ga4-insights/`
- **GA4 property:** read from `GA4_PROPERTY_ID` env var
- **Auth:** GA4 service account JSON via `GA4_CREDENTIALS_JSON`, provisioned by M06
- **BC store:** store-cwqiwcjxes (referenced when cross-linking GA4 conversions to BigCommerce orders)
- **Supabase:** hsyjcrrazrzqngwkqsqa (when joining GA4 traffic to deals)
- **Companions:**
  - `gsc-insights` — paired companion (Search Console = SERP-side; GA4 = on-site behavior)
  - `bc-business-review` — consumes GA4 traffic + revenue context for the weekly executive recap
  - `daily-brief-composer` — pulls KPI deviations from this skill's BLOCK 4
  - `analysis-snapshot` — preserve a brief as a re-runnable snapshot
  - `broken-link-rescue` — investigate landing-page decliners

---

## Anti-patterns

- **Never** run this skill if Step 0's BLOCKED gate fails — return the stub and exit. Do not invent placeholder numbers to "show what the output would look like".
- **Never** mix GA4 data with GSC data without a labeled source line. They count things differently (sessions vs. clicks); silent merging produces wrong WoW deltas.
- **Never** use same-day GA4 data — GA4's processing latency means today's numbers are unstable. Window always ends at "yesterday" or earlier.
- **Never** flag an anomaly with <4 weeks of historical baseline — std deviation is unreliable and produces false positives.
- **Never** report headline KPIs without WoW comparison — a single-point snapshot is noise.
- **Never** skip the trade-vs-consumer split — that audience cut is the entire reason this skill exists for Accent Lighting.
- **Never** mutate GA4 config or fire test events from this skill — read+report only.
- **Never** silently drop the audience split when the custom dimension isn't configured — fall back to hostname proxy AND output the recommendation in BLOCK 2.
- **Never** fabricate numbers to fill BLOCKs whose underlying reports failed. On API 429, 401, or 5xx after retry, emit a `═══ PARTIAL RUN ═══` header and mark each failed BLOCK as `⚠ data unavailable`. A partial brief is a feature; an invented brief is a silent bug.
- **Never** retry a 401-unauthenticated call without re-surfacing the M06 stub. An expired or rotated key needs human action — silent retries waste quota and hide the problem.
