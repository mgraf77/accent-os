# RFM Definitions for AccentOS churn-predictor

> Exact field mapping between RFM (Recency / Frequency / Monetary) concepts and the Supabase `hsyjcrrazrzqngwkqsqa` schema used by Accent Lighting. Read this before changing any column name in SKILL.md Step 1.

---

## R — Recency

**Definition:** Days since this customer's most recent order.

| Field | Source | Type | Notes |
|-------|--------|------|-------|
| `recency_days` | computed | int | `EXTRACT(day FROM now() - max(order_date))` |
| `last_order_date` | `customer_records.last_order_date` | timestamptz | Materialized; refreshed on each order ingest |
| `order_date` | `customer_orders.order_date` | timestamptz | Source of truth — `last_order_date` is denormalized |

Customers with **no orders ever** are excluded from the churn ranking (use `vendor-onboard-checklist`-style new-customer flows instead, not churn flagging).

A customer's "normal" recency is the **median interval between consecutive orders** over the rolling 365-day baseline (Pass A in SKILL.md Step 1) — `median_interval_days_baseline`. Trade customers running on a project cadence may have a 90-day median; Consumer customers may have a 14-day median. Always compare to the per-customer baseline, never to a global threshold.

---

## F — Frequency

**Definition:** Order count in the trailing window.

| Window | Field | Computation |
|--------|-------|-------------|
| Baseline (365d–90d ago) | `freq_baseline_365` | `count(*) from customer_orders where order_date between now() - interval '365 days' and now() - interval '90 days'` |
| Current (last 90d) | `freq_last_90` | `count(*) from customer_orders where order_date >= now() - interval '90 days'` |

**Annualization for delta math:** the baseline window is 275 days (365 − 90 = 275). The current window is 90 days. To compare like-for-like, scale the current to a 365-day-equivalent rate using factor `90/365 ≈ 0.247`:

```
freq_annualized_last_90 = freq_last_90 / 0.247
frequency_delta         = freq_annualized_last_90 - freq_baseline_365
```

Negative `frequency_delta` = ordering less than baseline. The threshold check uses **percent change** vs. baseline (`frequency_delta / max(freq_baseline_365, 1)`), so a customer with 4 orders in baseline going to 1 in last-90 (4 annualized) is `(4 − 4) / 4 = 0` change — not flagged. Same customer going to 0 orders in last-90 is `(0 − 4) / 4 = -100%` — flagged.

---

## M — Monetary

**Definition:** Sum of order totals in the trailing window.

| Window | Field | Computation |
|--------|-------|-------------|
| Baseline (365d–90d ago) | `monetary_baseline_365` | `sum(order_total) from customer_orders where order_date between now() - interval '365 days' and now() - interval '90 days'` |
| Current (last 90d) | `monetary_last_90` | `sum(order_total) from customer_orders where order_date >= now() - interval '90 days'` |

**Source column:** `customer_orders.order_total` (numeric, includes tax + freight, excludes voids/returns). If `order_total` is null on a row, treat it as 0 — do not coalesce to `subtotal` because freight/tax differences can mask churn signals on Trade accounts that buy chandelier-only orders vs. install-package orders.

**Annualization:** identical math to Frequency — scale `monetary_last_90 / 0.247`.

```
monetary_annualized_last_90 = monetary_last_90 / 0.247
monetary_delta              = monetary_annualized_last_90 - monetary_baseline_365
monetary_delta_pct          = monetary_delta / max(monetary_baseline_365, 1)
```

---

## Lifetime monetary (for reason-code routing)

The reason code `BIG_SPENDER_GONE_QUIET` requires lifetime context, not just baseline window:

| Field | Source |
|-------|--------|
| `lifetime_monetary` | `sum(order_total) from customer_orders` (no date filter) |
| `lifetime_orders`   | `count(*) from customer_orders` (no date filter) |

Threshold: `lifetime_monetary > $5,000` AND `freq_last_90 = 0` → `BIG_SPENDER_GONE_QUIET`. This catches the $50K Trade customer who quietly stopped buying — the highest-leverage save in the ranking.

---

## Customer segment (for tier-aware thresholds)

**Source column:** `customer_records.segment` — enum-like text. Expected values: `Trade` | `Designer` | `Consumer` | `Unknown`.

If `customer_records.segment` is null or a value outside that set, fall through to `Unknown` (1.5× recency mult, -50%/-50% drop triggers — see `tier-thresholds.md`). Never guess from `customer_name` patterns ("LLC" ≠ Trade) — segment is a Michael-curated field.

If a churn run shows >20% of flagged customers in `Unknown`, surface that as a data-quality flag in the snapshot (the segment column needs backfill — eligible for a `vendor-onboard-checklist`-style cleanup pass).

---

## Source tables — single page summary

```sql
-- AccentOS Supabase hsyjcrrazrzqngwkqsqa
customer_records (
  customer_id        uuid PK,
  windward_id        text,           -- legacy Windward id, optional
  name               text,
  segment            text,           -- 'Trade' | 'Designer' | 'Consumer' | 'Unknown'
  status             text,           -- 'active' | 'inactive' | 'closed'
  last_order_date    timestamptz,    -- denormalized
  lifetime_monetary  numeric,        -- denormalized; refresh nightly
  ...
)

customer_orders (
  order_id           uuid PK,
  customer_id        uuid FK,
  order_date         timestamptz,
  order_total        numeric,
  source             text,           -- 'bigcommerce' | 'windward' | 'manual'
  ...
)
```

If `customer_records.lifetime_monetary` is not yet materialized, churn-predictor falls back to `select sum(order_total) from customer_orders where customer_id = ? group by customer_id` per top-N candidate. Slower but correct.

---

## Anti-patterns specific to RFM

- **Never** use `customer_orders.subtotal` for monetary. Use `order_total`. Tax/freight inclusion is consistent across all customers — switching mid-calculation breaks deltas.
- **Never** trust `customer_records.last_order_date` if `customer_orders` has rows for that customer with a later `order_date`. The denorm field can lag — when in doubt, recompute from `customer_orders`.
- **Never** count quote-only or voided orders. Filter on `customer_orders.status = 'completed'` if that column exists; otherwise the upstream ingest should already exclude them.
