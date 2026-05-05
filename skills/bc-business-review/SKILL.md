---
name: bc-business-review
description: >
  Generate a weekly Accent Lighting business review from Supabase
  hsyjcrrazrzqngwkqsqa data: revenue, AOV, top vendors by revenue,
  top categories, week-over-week deltas, anomaly flags (>2σ moves),
  and concentration risk callouts. Reads from the deals table now;
  upgrades to BigCommerce store-cwqiwcjxes REST API when 6.3 + M04
  land. Use this skill when Michael says: "weekly review", "BC
  business review", "what happened this week", "Accent Lighting
  weekly", "weekly digest", "WoW delta", "anomaly check on revenue",
  or any phrasing that asks for a periodic business performance
  summary. Do not use for individual deal investigation (use
  supabase-sql-magic) or for vendor-specific performance (use
  vendor-cascade or vendor-risk-register). Always produces a 4-block
  paste-ready review — never returns prose-only.
---

# bc-business-review

**Purpose:** Accent Lighting has no current "what happened this week" digest. vendor-cascade and vendor-risk-register answer per-vendor questions; this skill answers the aggregate "is the business moving the right direction" question on a weekly cadence.

Stolen from: claude-ecom by takechanman1228 (KPI decomposition from order CSVs) — adapted to read from Supabase deals table instead of CSV import.

---

## Trigger Recognition

Run when Michael says:
- "weekly review" / "BC business review"
- "what happened this week" / "Accent Lighting weekly"
- "weekly digest" / "WoW delta"
- "anomaly check on revenue"

---

## Step 1 — Set the window

Defaults:
- **This week** = last 7 days ending today
- **Comparison window** = previous 7 days (week-over-week)

Overrides: "last week", "last 30 days", "Q4 to date", explicit date range. If Michael specifies a custom window, also pick a comparison window of equal length.

---

## Step 2 — Pull the headline KPIs

```sql
WITH this_week AS (
  SELECT
    SUM(unit_price * quantity) AS revenue,
    COUNT(DISTINCT order_id) AS orders,
    COUNT(DISTINCT customer_id) AS unique_customers,
    AVG(unit_price * quantity) AS avg_line_value
  FROM deals
  WHERE status = 'completed'
    AND completed_at BETWEEN $1 AND $2
), last_week AS (
  SELECT
    SUM(unit_price * quantity) AS revenue,
    COUNT(DISTINCT order_id) AS orders,
    COUNT(DISTINCT customer_id) AS unique_customers
  FROM deals
  WHERE status = 'completed'
    AND completed_at BETWEEN $3 AND $4
)
SELECT
  tw.revenue, tw.orders, tw.unique_customers,
  (tw.revenue / NULLIF(tw.orders, 0)) AS aov,
  ROUND(((tw.revenue - lw.revenue) * 100.0 / NULLIF(lw.revenue, 0))::numeric, 1) AS revenue_wow_pct,
  ROUND(((tw.orders - lw.orders) * 100.0 / NULLIF(lw.orders, 0))::numeric, 1) AS orders_wow_pct
FROM this_week tw, last_week lw;
```

If the deals table doesn't exist or has different column names in `/home/user/accent-os/sql/M*.sql`, flag and adapt.

---

## Step 3 — Pull the breakdowns

**Top 10 vendors by revenue (this week):**
```sql
SELECT v.name, SUM(d.unit_price * d.quantity) AS revenue,
       COUNT(DISTINCT d.order_id) AS orders
FROM deals d
JOIN vendors v ON v.id = d.vendor_id
WHERE d.status = 'completed'
  AND d.completed_at BETWEEN $1 AND $2
GROUP BY v.id, v.name
ORDER BY revenue DESC
LIMIT 10;
```

**Top 10 categories by revenue:**
Similar query against `products.category` joined through deals.

**Concentration risk callout:** if top 3 vendors > 50% of weekly revenue, flag.

---

## Step 4 — Detect anomalies

Pull historical baseline (last 8 weeks excluding current):

```sql
WITH historical AS (
  SELECT vendor_id,
         AVG(weekly_revenue) AS mean_rev,
         STDDEV(weekly_revenue) AS std_rev
  FROM (
    SELECT vendor_id,
           DATE_TRUNC('week', completed_at) AS wk,
           SUM(unit_price * quantity) AS weekly_revenue
    FROM deals
    WHERE completed_at BETWEEN NOW() - INTERVAL '9 weeks' AND NOW() - INTERVAL '1 week'
      AND status = 'completed'
    GROUP BY vendor_id, wk
  ) hist
  GROUP BY vendor_id
  HAVING COUNT(*) >= 4  -- need at least 4 weeks history for std
)
SELECT vendor_id, this_week_rev, mean_rev, std_rev,
       (this_week_rev - mean_rev) / NULLIF(std_rev, 0) AS z_score
FROM historical h
JOIN this_week_rev tw USING (vendor_id)
WHERE ABS((this_week_rev - mean_rev) / NULLIF(std_rev, 0)) > 2.0;
```

Anomaly flags fire on |z| > 2.0. Output direction (UP / DOWN) and magnitude.

**Insufficient history.** If fewer than 4 vendors qualify (i.e. AccentOS hasn't been live long enough OR the deals table is sparse), do NOT silently produce an empty anomaly section. Output explicitly: "Anomaly detection unavailable — needs ≥4 weeks of vendor-level deal history. Currently: [N] qualifying vendors." This appears in BLOCK 3 instead of zero rows.

---

## Step 5 — Output

```
═══ BLOCK 1: HEADLINE KPIs ═══
Window: [start] → [end]
Revenue:    $[XXX,XXX]   ([+/-X.X%] WoW)
Orders:     [N]          ([+/-X.X%] WoW)
AOV:        $[XXX]       ([+/-X.X%] WoW)
Customers:  [N]

[If concentration > 50%:]
⚠ Concentration: top 3 vendors = [X]% of weekly revenue

═══ BLOCK 2: TOP VENDORS / CATEGORIES ═══
Top vendors (this week):
1. [vendor]      $[rev]   ([N] orders)
2. ...
[10 rows]

Top categories:
1. [category]    $[rev]   ([N] orders)
[10 rows]

═══ BLOCK 3: ANOMALIES (|z| > 2.0) ═══
For each anomaly:
  ↑/↓ [vendor name]   z=+2.4   $[this_week] vs $[mean ±std] historical
  Reason hypotheses (best-guess from vendor metadata):
    - [hypothesis 1]
    - [hypothesis 2]

═══ BLOCK 4: NEXT-STEP HINTS ═══
- For UP anomalies: snapshot via analysis-snapshot for tracking
- For DOWN anomalies: pair with vendor-cascade for explainability
- For new concentration risk: pair with vendor-risk-register
- Save this digest as: snapshot-NNN-weekly-review-YYYY-WW
```

---

## Anti-patterns

- **Never** report KPIs without WoW comparison — point-in-time numbers without trend are noise.
- **Never** flag an anomaly with <4 weeks of historical baseline — std deviation is unreliable.
- **Never** include forecasting in this skill — backward-looking only. Forecasting lives in js/demand_forecast.js.
- **Never** use `SELECT *` against deals — large table with PII; only pull needed columns.
- **Never** auto-snapshot the digest. Output the suggested filename in BLOCK 4; Michael invokes analysis-snapshot if he wants to preserve it.
