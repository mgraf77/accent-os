# GA4 Report Shapes

> Canonical Data API `runReport` shapes for `ga4-insights`. Pull by report ID — do not improvise dimension/metric combos. Each shape was chosen to map cleanly to the AccentOS trade-vs-consumer audience cut and to the >2σ anomaly tiers in Step 4.

---

## Authentication

All reports authenticate against the GA4 Data API v1beta using the service-account JSON at `GA4_CREDENTIALS_JSON` for property `GA4_PROPERTY_ID` (and optionally `GA4_TRADE_PROPERTY_ID` if the trade portal is a separate property).

Endpoint: `https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY_ID}:runReport`

Auth scope: `https://www.googleapis.com/auth/analytics.readonly`

If a `403 PERMISSION_DENIED` returns, the service account exists but isn't attached to the property — re-surface Step 0's stub message at the GA4 Admin → Property Access Management step.

---

## Shared parameters

- **Default window**: `dateRanges = [{startDate: "{this-week-start}", endDate: "{this-week-end}"}]` — `this-week-end` is always `yesterday` or earlier (GA4 processing lag makes same-day data unstable).
- **Comparison window**: a second `dateRanges` entry with the prior period of equal length. The Data API returns both ranges in one response when you pass two `dateRanges`.
- **Currency**: not requested — none of these reports are revenue-denominated; revenue lives in BigCommerce / Supabase deals (see `bc-business-review`).

---

## R1 — `weekly_traffic_overview`

**Purpose**: BLOCK 1 headline KPIs.

```json
{
  "dimensions": [],
  "metrics": [
    {"name": "sessions"},
    {"name": "totalUsers"},
    {"name": "newUsers"},
    {"name": "screenPageViews"},
    {"name": "conversions"},
    {"name": "eventCount"}
  ],
  "dateRanges": [
    {"startDate": "{cur_start}", "endDate": "{cur_end}"},
    {"startDate": "{prev_start}", "endDate": "{prev_end}"}
  ]
}
```

WoW for each metric: `(cur - prev) / prev * 100`. If `prev = 0`, output `n/a` not `inf`.

If a metric returns zero rows (vs. zero value), flag the metric as `no data` in BLOCK 1 — do not silently zero it.

---

## R2 — `traffic_by_source`

**Purpose**: source/medium feed for BLOCK 2 + the TRAFFIC_SOURCE anomaly tier.

```json
{
  "dimensions": [
    {"name": "sessionSource"},
    {"name": "sessionMedium"}
  ],
  "metrics": [{"name": "sessions"}],
  "dateRanges": [
    {"startDate": "{cur_start}", "endDate": "{cur_end}"},
    {"startDate": "{prev_start}", "endDate": "{prev_end}"}
  ],
  "orderBys": [{"metric": {"metricName": "sessions"}, "desc": true}],
  "limit": 50
}
```

Cap at 50 rows — long tail isn't actionable for AccentOS at this scale.

---

## R3 — `audience_split`

**Purpose**: trade vs consumer breakdown — the entire reason this skill exists.

**Primary** (custom event dimension, when configured):

```json
{
  "dimensions": [{"name": "customEvent:audience_segment"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "dateRanges": [
    {"startDate": "{cur_start}", "endDate": "{cur_end}"},
    {"startDate": "{prev_start}", "endDate": "{prev_end}"}
  ]
}
```

The custom event `audience_segment` should fire with values `trade` or `consumer` from the AccentOS frontend on every page load. Configured in GA4 Admin → Custom Definitions → Custom Dimensions.

**Fallback** (hostname proxy, when custom dim isn't set):

```json
{
  "dimensions": [{"name": "hostName"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "dateRanges": [
    {"startDate": "{cur_start}", "endDate": "{cur_end}"},
    {"startDate": "{prev_start}", "endDate": "{prev_end}"}
  ]
}
```

Map `trade.accentlightinginc.com` (or whatever the trade portal subdomain resolves to) → `trade`; everything else → `consumer`. Output the recommendation line in BLOCK 2 prompting Michael to configure the custom dimension for cleaner data.

---

## R4 — `top_landing_pages`

**Purpose**: BLOCK 3 top movers.

```json
{
  "dimensions": [{"name": "landingPagePlusQueryString"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "dateRanges": [
    {"startDate": "{cur_start}", "endDate": "{cur_end}"},
    {"startDate": "{prev_start}", "endDate": "{prev_end}"}
  ],
  "orderBys": [{"metric": {"metricName": "sessions"}, "desc": true}],
  "limit": 100
}
```

Pull 100 rows (more than the 25 displayed) so the per-page WoW delta computation has enough overlap between the two windows. Then:

1. Inner join the cur/prev period rows on `landingPagePlusQueryString`.
2. Compute `delta_sessions = cur - prev`.
3. Sort by `abs(delta_sessions)` desc.
4. Display top 10 gainers (positive delta) and top 10 decliners (negative delta).
5. Pages appearing in only one window are surfaced separately as `new` or `dropped`.

---

## R5 — `conversion_funnel_by_source`

**Purpose**: which sources convert and which don't (informs trade-vs-consumer optimization).

```json
{
  "dimensions": [{"name": "sessionSource"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "dateRanges": [{"startDate": "{cur_start}", "endDate": "{cur_end}"}],
  "orderBys": [{"metric": {"metricName": "sessions"}, "desc": true}],
  "limit": 15
}
```

Compute `conversionRate = conversions / sessions` per row in post-processing. GA4 has a `sessionConversionRate` metric but it's audience-scoped — computing manually keeps the math transparent for the brief.

---

## R6 — `trade_vs_consumer_split` (pivot)

**Purpose**: BLOCK 2 "top sources by audience" sub-table.

This is a pivot of R3 × R2 in post-processing — not a separate API call. For each audience value (`trade`, `consumer`):

1. Filter R2 rows to sessions originating from that audience (use the `audience_segment` custom dimension as a secondary filter when present, else hostname filter).
2. Sort by `sessions` desc.
3. Take top 5.

If the API supports the `dimensionFilter` clause for the custom dimension, do it server-side instead of pivoting client-side:

```json
{
  "dimensions": [
    {"name": "sessionSource"},
    {"name": "sessionMedium"}
  ],
  "metrics": [{"name": "sessions"}],
  "dateRanges": [{"startDate": "{cur_start}", "endDate": "{cur_end}"}],
  "dimensionFilter": {
    "filter": {
      "fieldName": "customEvent:audience_segment",
      "stringFilter": {"value": "trade"}
    }
  },
  "orderBys": [{"metric": {"metricName": "sessions"}, "desc": true}],
  "limit": 5
}
```

Run twice (once per audience value).

---

## Historical baseline pulls (for anomaly z-scores)

For each anomaly tier in Step 4, pull the trailing 8 weeks individually:

```json
{
  "dimensions": [{"name": "{tier_dimension}"}, {"name": "isoWeek"}, {"name": "isoYear"}],
  "metrics": [{"name": "sessions"}],
  "dateRanges": [{"startDate": "9 weeks ago", "endDate": "1 week ago"}]
}
```

Where `{tier_dimension}` is `sessionSource` (TRAFFIC_SOURCE tier) or `landingPagePlusQueryString` (LANDING_PAGE tier).

For CONVERSION_RATE tier, use site-wide weekly values (no dimension):

```json
{
  "dimensions": [{"name": "isoWeek"}, {"name": "isoYear"}],
  "metrics": [{"name": "sessions"}, {"name": "conversions"}],
  "dateRanges": [{"startDate": "9 weeks ago", "endDate": "1 week ago"}]
}
```

Compute `conversionRate = conversions / sessions` per week, then `mean` and `stddev` across the 8 weeks.

Require `≥4 weeks` of qualifying data per dimension. Below that, surface as `newcomer` not `anomaly` per Step 4.

---

## Rate limits & retry

- Quota: 50,000 tokens/day per property (GA4 Data API). Each `runReport` call costs ~5–50 tokens depending on dimension cardinality.
- All 6 reports + baseline pulls in a single weekly run cost ≈ 200–400 tokens — well within quota.
- On `429 RESOURCE_EXHAUSTED`: back off 60s, then retry once. If second attempt fails, return partial brief with `[QUOTA EXHAUSTED]` flag in BLOCK 1 and skip anomaly detection for this run.
- On `503 BACKEND_ERROR`: retry once after 30s. If still failing, return the stub-style "GA4 backend currently degraded — try again in 30 minutes" message.

---

## Cross-references

- The trade portal hostname proxy mapping should match the same proxy used by `bc-business-review` when it cross-references GA4 sessions with BigCommerce orders.
- Anomaly hypotheses for each firing flag live in `references/anomaly-hypotheses.md` — this file generates the rows; that file generates the explanation column.
- `gsc-insights` uses the same M06 service account; if M06 is provisioned, both skills activate together.
