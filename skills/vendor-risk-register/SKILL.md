---
name: vendor-risk-register
description: >
  Rank top-N AccentOS vendors by composite risk score across four
  dimensions: revenue concentration on Accent Lighting, score volatility
  in Supabase hsyjcrrazrzqngwkqsqa vendor_scores, stockout history from
  inventory, and GMC compliance failures. For each top-risk vendor,
  produce severity, suggested mitigation, and owner. Use this skill
  when Michael says: "vendor risk register", "top vendor risks",
  "concentration risk", "what are my biggest vendor risks", "vendor
  risk audit", "rank by risk", or any phrasing that asks for a
  ranked top-N risk view of the vendor portfolio. Do not use for
  individual vendor diagnosis (that's vendor-cascade) or for ad-hoc
  vendor queries (that's supabase-sql-magic). Always produces a
  paste-ready risk register table plus mitigation list — never
  returns prose-only.
---

# vendor-risk-register

**Purpose:** Concentration risk on Accent Lighting top vendors is currently invisible — no skill surfaces "if vendor X disappeared tomorrow, what % of revenue evaporates." This is the diagnostic.

Stolen from: Cascade `ceo-advisor` risk register pattern. Rebuilt for the AccentOS / Accent Lighting context — no board format, no quarterly cadence wrapper, just a paste-ready ranked table.

---

## Trigger Recognition

Run when Michael says:
- "vendor risk register"
- "top vendor risks"
- "concentration risk"
- "what are my biggest vendor risks"
- "vendor risk audit"
- "rank by risk"

---

## Step 1 — Set parameters

Defaults (override if Michael specifies):
- **N (top vendors to surface):** 10
- **Lookback window:** 90 days
- **Concentration metric:** % of Accent Lighting revenue (sum of completed deals)

If Michael says "top 5" or "top 20", use that N. If he says "this quarter," use 90 days. If he says "this year," use 365.

Echo the resolved parameters before running SQL:

```
RUN PARAMETERS: N=10 | lookback=90d | concentration=pct_of_revenue
```

---

## Step 2 — Compute the four risk dimensions

Generate the SQL via supabase-sql-magic style — paste-ready against `hsyjcrrazrzqngwkqsqa`:

**Dimension A — Revenue concentration:**
```sql
WITH vendor_revenue AS (
  SELECT vendor_id, SUM(unit_price * quantity) AS revenue
  FROM deals
  WHERE status = 'completed'
    AND completed_at > NOW() - INTERVAL '90 days'
  GROUP BY vendor_id
), total AS (
  SELECT NULLIF(SUM(revenue), 0) AS t FROM vendor_revenue
)
SELECT v.id, v.name, vr.revenue,
       ROUND((vr.revenue * 100.0 / total.t)::numeric, 2) AS pct_of_revenue
FROM vendor_revenue vr
JOIN vendors v ON v.id = vr.vendor_id
CROSS JOIN total
WHERE total.t IS NOT NULL
ORDER BY pct_of_revenue DESC;
```
If `total.t` is NULL (no completed deals in the window), output: "No deals completed in the 90-day window (or whichever lookback was set); concentration cannot be computed. Re-run after the next deal-batch lands or extend the window." Do not proceed with dimension A.

**Dimension B — Score volatility:**
```sql
SELECT vendor_id,
       COUNT(*) AS sample_count,
       STDDEV(score) AS score_volatility,
       MIN(score) AS score_min,
       MAX(score) AS score_max
FROM vendor_scores
WHERE computed_at > NOW() - INTERVAL '90 days'
GROUP BY vendor_id
HAVING COUNT(*) >= 2;  -- volatility undefined for single-sample vendors
```
Vendors with `sample_count < 2` are excluded from this dimension (volatility is "n/a") but still appear in the register if they show up in dimensions A/C/D. Their composite is computed from the available dimensions only.

**Dimension C — Stockout history:**
```sql
SELECT vendor_id, COUNT(*) AS stockout_count_90d
FROM inventory
WHERE on_hand = 0
  AND last_zero_at > NOW() - INTERVAL '90 days'
GROUP BY vendor_id;
```

**Dimension D — GMC compliance failures:**
```sql
SELECT vendor_id,
       COUNT(*) FILTER (WHERE images_per_sku = 0) AS missing_images,
       COUNT(*) FILTER (WHERE gmc_status = 'disapproved') AS disapproved_count
FROM marketing.feed_status
WHERE checked_at > NOW() - INTERVAL '90 days'
GROUP BY vendor_id;
```

If any of the underlying tables/columns do not exist in `/home/user/accent-os/sql/M*.sql`, flag the missing source and proceed with the dimensions that are available.

---

## Step 3 — Composite risk score

Base weights:
```
A — concentration:   0.40
B — volatility:      0.25
C — stockouts:       0.20
D — GMC failures:    0.15
```

For each vendor, normalize each available dimension to 0–1 (divide by max across vendors).

**Weight re-normalization for missing dimensions:** if any dimension is "n/a" for a vendor (e.g. dim B has sample_count<2, dim D has no marketing.feed_status row), drop that dimension's weight and scale the remaining weights so they still sum to 1.0.

Example — vendor with no volatility data (B = n/a):
```
remaining base weights:  0.40 + 0.20 + 0.15 = 0.75
re-normalized:           A → 0.40/0.75 = 0.533
                         C → 0.20/0.75 = 0.267
                         D → 0.15/0.75 = 0.200
```

Composite for that vendor uses only A/C/D with the re-normalized weights. Mark the vendor's row in the register output with `(vol n/a)` so reviewers know one dimension is excluded.

Composite score range: 0–100 (multiply the weighted sum by 100 for readability).

---

## Step 4 — Build the register

| Rank | Vendor | Revenue % | Volatility | Stockouts | GMC fails | Composite | Severity |
|---|---|---|---|---|---|---|---|
| 1 | Acme Lighting | 18.4% | 12.1 σ | 7 | 14 | 78 | HIGH |
| 2 | Bright Co | 11.2% | 4.3 σ | 2 | 3 | 42 | MEDIUM |
| ... | ... | ... | ... | ... | ... | ... | ... |

Severity bands:
- **HIGH** — composite ≥ 70 OR revenue % ≥ 15% (single-vendor concentration cap)
- **MEDIUM** — composite 40–69
- **LOW** — composite < 40

---

## Step 5 — Mitigation per HIGH/MEDIUM row

For each row at HIGH or MEDIUM severity, propose a mitigation. Map the dominant risk dimension to a stock recommendation:

| Dominant dim | Mitigation template |
|---|---|
| Revenue concentration | Identify a 2nd-source vendor for the top SKUs; reduce exposure to ≤ 15% per vendor |
| Score volatility | Run vendor-clarity-test on this vendor; trace via vendor-cascade for the cause |
| Stockouts | Audit lead-time + safety-stock settings in inventory; increase reorder point |
| GMC compliance | Run the GMC feed audit; assign image-fix or feed-config remediation |

Owner: Michael for everything (solo build) — but tag the AccentOS module that owns the fix (e.g. `js/inventory.js`, `js/marketing.js`).

---

## Step 6 — Output

```
═══ BLOCK 1: VENDOR RISK REGISTER ═══
[full Step 4 table]

═══ BLOCK 2: MITIGATIONS ═══
For each HIGH/MEDIUM row:
  Vendor [name] — [severity]
    Dominant risk: [dimension]
    Mitigation: [from Step 5 template]
    Module: [js/...]

═══ BLOCK 3: PASTE-READY QUARTERLY REVIEW BLOCK ═══

## Vendor risk register — [date]
Top concerns:
1. [vendor name] (HIGH) — [one-line summary]
2. [vendor name] (HIGH) — ...
N. [vendor name] (MEDIUM) — ...

Concentration cap status: [N] vendors above 15% revenue (target: ≤2).
Next review: +90 days.
```

---

## Anti-patterns

- **Never** report risk scores without showing the underlying dimension values. The composite score alone hides which lever to pull.
- **Never** auto-apply mitigations. Output proposals; Michael executes.
- **Never** skip the concentration cap check. >15% revenue from a single vendor is the most common AccentOS risk pattern and must always surface.
- **Never** rank vendors that have zero data in all four dimensions — those are out-of-scope for this register, not "low risk."
- **Never** invent normalization denominators when a dimension's data is missing — flag the missing dimension and weight the others.
- **Never** use the composite score alone to define severity — always apply the override rule (HIGH if revenue % ≥15% regardless of composite), because a single concentrated vendor at Accent Lighting can represent existential risk even when its BC store-cwqiwcjxes score looks stable.
