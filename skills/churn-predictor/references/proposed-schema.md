# Proposed Schema Notes — AccentOS churn-predictor

> Schema this skill depends on. Most tables already documented in MASTER.md §6 as **planned** for Track 1.4 (CRM & Customer Intelligence). This file only documents schema **specifically required** by `churn-predictor`. **Do NOT write SQL migrations** — Michael runs all schema changes manually via Supabase SQL Editor (per AccentOS Hard Rule #7).

---

## Required tables (already planned in MASTER §6)

### `customer_records`
```sql
customer_records (
  customer_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  windward_id        text,                       -- legacy Windward id, optional
  name               text NOT NULL,
  segment            text,                       -- 'Trade' | 'Designer' | 'Consumer' | 'Unknown'
  status             text DEFAULT 'active',      -- 'active' | 'inactive' | 'closed'
  last_order_date    timestamptz,                -- denormalized; refresh nightly
  lifetime_monetary  numeric(12,2) DEFAULT 0,    -- denormalized; refresh nightly
  lifetime_orders    int DEFAULT 0,              -- denormalized; refresh nightly
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
)
CREATE INDEX ON customer_records (segment, status);
CREATE INDEX ON customer_records (last_order_date);
```

### `customer_orders`
```sql
customer_orders (
  order_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid REFERENCES customer_records(customer_id),
  order_date    timestamptz NOT NULL,
  order_total   numeric(12,2) NOT NULL,
  status        text DEFAULT 'completed',        -- 'completed' | 'voided' | 'refunded'
  source        text,                            -- 'bigcommerce' | 'windward' | 'manual'
  source_order_id text,                          -- BC order id or Windward sales doc id
  created_at    timestamptz DEFAULT now()
)
CREATE INDEX ON customer_orders (customer_id, order_date DESC);
CREATE INDEX ON customer_orders (order_date);
```

---

## Optional but recommended

### `rfm_scores` (caches the per-customer baseline, refreshed nightly)
```sql
rfm_scores (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                     uuid REFERENCES customer_records(customer_id) UNIQUE,
  freq_baseline_365               int,
  monetary_baseline_365           numeric(12,2),
  median_interval_days_baseline   numeric(8,2),
  computed_at                     timestamptz DEFAULT now()
)
CREATE INDEX ON rfm_scores (computed_at);
```

If this table exists, `churn-predictor` reads from it directly (much faster than recomputing baselines on every run). If it doesn't exist, the skill computes baselines inline per Step 1 of SKILL.md.

### `action_queue` (companion-skill table — already planned in `action-queue` skill)
The `action-queue` skill owns this table's schema; `churn-predictor` is just an upstream producer. If `action-queue` isn't built yet, skip the queue write and surface "action-queue not available — actions printed in-message only" in the run output.

---

## Refresh strategy

`customer_records.last_order_date`, `lifetime_monetary`, `lifetime_orders` should be refreshed nightly via a Supabase Edge Function or scheduled cron. Sample refresh SQL:

```sql
UPDATE customer_records cr
SET last_order_date  = sub.last_order,
    lifetime_monetary = sub.total_dollars,
    lifetime_orders   = sub.total_orders,
    updated_at        = now()
FROM (
  SELECT customer_id,
         MAX(order_date) AS last_order,
         SUM(order_total) AS total_dollars,
         COUNT(*) AS total_orders
  FROM customer_orders
  WHERE status = 'completed'
  GROUP BY customer_id
) sub
WHERE cr.customer_id = sub.customer_id;
```

If `customer_records` denorm fields are stale, `churn-predictor` falls back to recomputing from `customer_orders` per top-N candidate. Slower but always correct.

---

## Where this fits in the AccentOS roadmap

- **Track 0.4** — Core Database Schema. Both `customer_records` and `customer_orders` ship here.
- **Track 1.4** — CRM & Customer Intelligence ($19.2K/yr value). Activates churn-predictor by populating those tables from BigCommerce orders ingest + Windward CSV import.
- **Capability Ladder L5** — Predictive. churn-predictor is one of several L5 skills (others: `next-action-recommender`, `alert-router`).

Until Track 1.4 lands, `churn-predictor` Step 0 BLOCKED gate returns the stub message.

---

## What this skill does NOT need

- Does **not** need `quotes`, `quote_lines`, `pipeline_deals` — those are companion-skill territory (`email-drafter` may reference quotes when drafting `quote-revival` interventions, but `churn-predictor` itself works only on completed orders).
- Does **not** need `customer_interactions` — interactions are a companion-skill input (`email-drafter` reads them for tone), not a churn signal.
- Does **not** need RLS policies beyond the project default (read-only for the skill; the skill writes only to `analysis-snapshot/runs/` and `daily-brief-composer/inbox/`).
