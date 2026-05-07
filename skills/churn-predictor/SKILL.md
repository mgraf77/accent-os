---
name: churn-predictor
description: >
  AccentOS predictive skill that ranks Accent Lighting customers by
  churn risk before any human notices. Runs RFM-deviation analysis
  (Recency / Frequency / Monetary) per customer: compares each
  customer's rolling 365-day baseline to their last-90-day window,
  flags tier-aware deltas, and emits a ranked top-N list with reason
  codes (RECENCY_DROP_TRADE, FREQUENCY_HALVED, BIG_SPENDER_GONE_QUIET,
  TRIPLE_DROP) and a suggested intervention skill per row. Pulls data
  from Supabase hsyjcrrazrzqngwkqsqa (customer_records, customer_orders
  via the BigCommerce store-cwqiwcjxes ingest path) and runs entirely
  inside AccentOS — no Klaviyo/CRM SaaS dependency. Use this skill when
  Michael says: "who's about to churn", "churn risk", "at-risk
  customers", "RFM scan", "find quiet customers", "predict churn",
  "/churn", or any phrasing asking for forward-looking customer-loss
  intelligence. Do not use this skill for past-tense win/loss reporting
  (use bc-business-review) or single-customer deep dives (use the
  Customer 360 module). Always returns a ranked customer table with
  reason codes plus paste-ready SQL — never returns prose-only "your
  customers might be churning" advice.
---

# churn-predictor

**Purpose:** Catch Accent Lighting customers drifting toward churn before any human notices, by detecting deviation between each customer's rolling 365-day baseline and their last-90-day RFM window.

This is a **Capability Ladder L5 (Predictive)** skill: it answers "what's about to happen" — not "what happened." Closes vision gap V05.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "who's about to churn"
- "churn risk"
- "at-risk customers"
- "RFM scan"
- "find quiet customers"
- "predict churn"
- "who went quiet"
- "customers we're losing"
- "/churn"

Also trigger when `daily-brief-composer` requests the top-3 churn risks for the morning brief, or when `next-action-recommender` asks for retention-suggestion candidates.

---

## Step 0 — Preflight (BLOCKED gate)

This skill is gated on a usable customer-orders dataset in Supabase `hsyjcrrazrzqngwkqsqa`. Until that resolves it returns a stub.

1. Check whether the dependency exists. For `churn-predictor`, that means at least one of:
   - Table `customer_orders` exists and has ≥ 90 days of rows, OR
   - Table `customer_records` exists with `last_order_date` populated for ≥ 50 customers, OR
   - BigCommerce orders feed (`bc_orders` staging table from `store-cwqiwcjxes`) is populated.
2. If none exist, return this stub and exit:

   > skill `churn-predictor` is BLOCKED — needs customer-orders data in Supabase `hsyjcrrazrzqngwkqsqa`. To unblock:
   > 1. Land Track 1.4 (CRM & Customer Intelligence) — schema in MASTER §6 includes `customer_records`, `customer_orders`, `rfm_scores`.
   > 2. OR run the BigCommerce orders ingest (BC store `store-cwqiwcjxes` → Supabase `bc_orders` staging) so this skill can derive RFM.
   > 3. Confirm with `select count(*) from customer_orders where order_date > now() - interval '90 days'` returning > 0.
   > Skill activates automatically once any one of those checks passes.

3. If the dependency exists, also read in parallel:
   - `references/rfm-definitions.md` — exact field mapping
   - `references/reason-codes.md` — reason-code dictionary + intervention routing
   - `references/tier-thresholds.md` — Trade vs. Consumer vs. Designer churn thresholds
   - Then proceed to Step 1.

---

## Step 1 — Compute baselines and current windows

Run two SQL passes against Supabase `hsyjcrrazrzqngwkqsqa`. Hand them to `supabase-sql-magic` if Michael wants to inspect them; otherwise execute directly.

**Pass A — Baseline (rolling 365 days, excluding the last 90):**

```sql
-- Per-customer rolling baseline: median order interval, frequency, monetary
WITH window_a AS (
  SELECT customer_id, order_date, order_total
  FROM customer_orders
  WHERE order_date BETWEEN now() - interval '365 days'
                       AND now() - interval '90 days'
)
SELECT
  customer_id,
  COUNT(*)                                         AS freq_baseline_365,
  SUM(order_total)                                 AS monetary_baseline_365,
  -- median days between consecutive orders
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(epoch FROM order_date
      - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)) / 86400
  )                                                AS median_interval_days_baseline
FROM window_a
GROUP BY customer_id;
```

**Pass B — Current window (last 90 days):**

```sql
SELECT
  customer_id,
  MAX(order_date)                                  AS last_order_date,
  EXTRACT(day FROM now() - MAX(order_date))        AS recency_days,
  COUNT(*)                                         AS freq_last_90,
  COALESCE(SUM(order_total), 0)                    AS monetary_last_90
FROM customer_orders
WHERE order_date >= now() - interval '90 days'
GROUP BY customer_id

UNION ALL

-- include customers with NO orders in last 90 — most important set
SELECT
  c.customer_id,
  c.last_order_date,
  EXTRACT(day FROM now() - c.last_order_date)      AS recency_days,
  0                                                 AS freq_last_90,
  0                                                 AS monetary_last_90
FROM customer_records c
WHERE c.last_order_date < now() - interval '90 days'
  AND c.customer_id NOT IN (
    SELECT customer_id FROM customer_orders
    WHERE order_date >= now() - interval '90 days'
  );
```

Output the merged dataset to a working set in memory: `(customer_id, segment, recency_days, freq_last_90, monetary_last_90, freq_baseline_365, monetary_baseline_365, median_interval_days_baseline)`.

Per-field mappings live in `references/rfm-definitions.md` — read it before changing column names.

---

## Step 2 — Compute deltas and apply tier-aware thresholds

For each customer, compute:

```
recency_delta   = recency_days - median_interval_days_baseline      (positive = late)
frequency_delta = (freq_last_90 / 0.247) - freq_baseline_365        (annualized; 0.247 = 90/365)
monetary_delta  = (monetary_last_90 / 0.247) - monetary_baseline_365
```

Look up tier-specific thresholds in `references/tier-thresholds.md`:

| Segment   | Recency mult | Freq drop trigger | Monetary drop trigger |
|-----------|--------------|-------------------|------------------------|
| Trade     | 2.0×         | -50%              | -40%                   |
| Designer  | 1.75×        | -50%              | -40%                   |
| Consumer  | 1.5×         | -60%              | -50%                   |
| Unknown   | 1.5×         | -50%              | -50%                   |

Trade customers tolerate longer gaps — a 90-day silence from a Trade account is normal, but from a Consumer it's loud. Always read tier from `customer_records.segment` — never guess.

A flag fires when ANY of these is true:
- `recency_days > median_interval_days_baseline × tier_recency_mult`
- `frequency_delta / max(freq_baseline_365, 1) <= tier_freq_drop`
- `monetary_delta / max(monetary_baseline_365, 1) <= tier_monetary_drop`

---

## Step 3 — Assign reason codes

Use `references/reason-codes.md` lookup. Most-common codes:

| Reason code              | Trigger                                                       |
|--------------------------|---------------------------------------------------------------|
| `RECENCY_DROP_TRADE`     | Recency gap > 2× baseline, segment=Trade                      |
| `RECENCY_DROP_CONSUMER`  | Recency gap > 1.5× baseline, segment=Consumer                 |
| `FREQUENCY_HALVED`       | freq_last_90 annualized ≤ 50% of baseline                     |
| `BIG_SPENDER_GONE_QUIET` | Lifetime monetary > $5K AND freq_last_90 = 0                  |
| `MONETARY_DROP`          | monetary_last_90 annualized ≤ 50% of baseline                 |
| `TRIPLE_DROP`            | All three deltas exceed thresholds (highest-priority signal)  |
| `NEW_AT_RISK`            | First-time buyer with no second order in expected window      |

Pick the **single highest-priority** code per customer (`TRIPLE_DROP` > `BIG_SPENDER_GONE_QUIET` > `RECENCY_DROP_*` > `FREQUENCY_HALVED` > `MONETARY_DROP` > `NEW_AT_RISK`). Capture all triggered codes in a `secondary_codes` array.

---

## Step 4 — Score and rank

Compute composite churn-probability per customer:

```
churn_score = w_r * normalize(recency_delta_pct, 0..2)
            + w_f * normalize(-frequency_delta_pct, 0..1)
            + w_m * normalize(-monetary_delta_pct, 0..1)
            + segment_lifetime_weight
```

Default weights: `w_r=0.40`, `w_f=0.30`, `w_m=0.25`, `segment_lifetime_weight=0..0.05` based on lifetime_value bucket.

Sort descending. Default `top_n = 20` (configurable via `--top N` argument or Michael saying "top 50 churn risks", "all customers above 0.7", etc.).

Tie-break order: lifetime monetary value desc → recency_days desc.

---

## Step 5 — Route interventions

For every flagged customer, attach a suggested intervention skill. Routing logic in `references/reason-codes.md` Section "Intervention routing":

| Reason code              | Suggested skill         | Why                                              |
|--------------------------|-------------------------|--------------------------------------------------|
| `BIG_SPENDER_GONE_QUIET` | `email-drafter`         | Personal owner-signed reach-out, urgent          |
| `RECENCY_DROP_TRADE`     | `email-drafter`         | Trade follow-up template, mention current promos |
| `RECENCY_DROP_CONSUMER`  | `email-drafter`         | Klaviyo-style re-engagement                      |
| `FREQUENCY_HALVED`       | `vendor-cascade`        | Vendor-driven if SKU-pattern shows brand exit    |
| `MONETARY_DROP`          | `email-drafter`         | Quote follow-up; check open quotes               |
| `TRIPLE_DROP`            | `email-drafter` (urgent) | All-three-down = top priority                    |
| `NEW_AT_RISK`            | `email-drafter`         | First-second order nudge                         |

Each row in the final output emits a `proposed_action` for `action-queue` ingestion. The `action-queue` skill stores rows in PROPOSED state until Michael approves.

---

## Step 6 — Emit ranked output + snapshot

Write three artifacts:

1. **In-message ranked table** (paste-ready, see Output format).
2. **Snapshot** via `analysis-snapshot` so the run is re-runnable. Snapshot name pattern: `churn-predictor-YYYY-MM-DD-top{N}.md`. Include the SQL from Step 1, the parameters used (top_n, weights), and the full ranked table.
3. **Daily-brief feed**: write top-3 to `skills/daily-brief-composer/inbox/churn-top3.md` (overwrite each run) so the morning brief picks them up.

If `--dry-run` flag is passed (or Michael says "preview only"), skip the `action-queue` and brief writes — keep only the in-message table.

---

## Output format

```
CHURN-PREDICTOR — [YYYY-MM-DD HH:MM]  •  Accent Lighting  •  Supabase hsyjcrrazrzqngwkqsqa

Scope: [N customers in baseline] → [M flagged] → top [TOP_N] shown
Weights: r=0.40 f=0.30 m=0.25  •  Tier thresholds: per references/tier-thresholds.md

═══ RANKED CHURN RISK ═══

Rank | Customer            | Segment   | R-delta   | F-delta   | M-delta    | Reason code              | Suggested skill
-----+---------------------+-----------+-----------+-----------+------------+--------------------------+------------------------
   1 | [Name / windward_id]| Trade     | +148 d    |  -82%     |  -$11.4K   | TRIPLE_DROP              | email-drafter (urgent)
   2 | [Name]              | Trade     | +96 d     |  -55%     |  -$7.2K    | BIG_SPENDER_GONE_QUIET   | email-drafter
   3 | [Name]              | Consumer  | +71 d     |  -100%    |  -$1.8K    | RECENCY_DROP_CONSUMER    | email-drafter
   ... (through TOP_N)

═══ SUMMARY ═══
TRIPLE_DROP:                 [n]
BIG_SPENDER_GONE_QUIET:      [n]
RECENCY_DROP_TRADE:          [n]
RECENCY_DROP_CONSUMER:       [n]
FREQUENCY_HALVED:            [n]
MONETARY_DROP:               [n]
NEW_AT_RISK:                 [n]

Snapshot:        skills/analysis-snapshot/runs/churn-predictor-YYYY-MM-DD-top20.md
Daily brief feed: skills/daily-brief-composer/inbox/churn-top3.md (overwritten)
Action queue:    [N] PROPOSED rows queued for approval

═══ PASTE-READY SQL ═══
[the Step 1 baseline + current-window SQL, parameterized for re-run]
```

---

## AccentOS context

- **Stack:** Supabase `hsyjcrrazrzqngwkqsqa` (data + RFM logic), BigCommerce `store-cwqiwcjxes` (orders origin), Anthropic API via `ANTHROPIC_API_KEY` for any natural-language reason-code summarization.
- **Project:** AccentOS — internal operating system for Accent Lighting.
- **Paths:** `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`).
- **Schema source of truth:** MASTER.md §6 — `rfm_scores`, `customer_records`, `customer_orders` tables.
- **Capability ladder level:** L5 — Predictive (closes vision gap V05).
- **Companion skills:**
  - `email-drafter` — primary intervention drafter for most reason codes
  - `vendor-cascade` — used when churn pattern is vendor-driven (SKU concentration)
  - `next-action-recommender` — consumes the ranked list for daily action prioritization
  - `daily-brief-composer` — surfaces top-3 churn risks each morning
  - `supabase-sql-magic` — for ad-hoc RFM queries Michael writes by hand
  - `analysis-snapshot` — captures each run as a re-runnable artifact
  - `action-queue` — receives PROPOSED retention actions for approval

---

## Anti-patterns

- **Never** guess a customer's segment. Read it from `customer_records.segment`. Trade and Consumer have different baselines and different thresholds — getting the segment wrong corrupts the whole ranking.
- **Never** use a single global threshold (e.g. "90 days = at risk"). That's what every off-the-shelf tool does and it's why we're building this in-house. Per-customer baselines beat global thresholds — every Accent Lighting customer's normal cadence is different.
- **Never** auto-send any retention action. This skill produces PROPOSED rows for `action-queue` and drafts for `email-drafter`. Sending requires Michael's approval per AccentOS Hard Rule "Spend Rules" (and per L4 capability ladder gating L6 autonomous execution).
- **Never** skip the snapshot. Every run is re-runnable via `analysis-snapshot`. Prose-only output is a failed run — Michael needs paste-ready data to act on.
- **Never** include inactive customers (e.g. closed accounts, businesses out of business) in the ranking. Filter on `customer_records.status = 'active'` if available.
- **Never** invent customers. If `customer_orders` is empty for a customer, only flag them as `BIG_SPENDER_GONE_QUIET` if `customer_records.lifetime_monetary > $5K` confirms historical revenue exists.
- **Never** output prose advice ("you should reach out to your top customers"). Output the ranked table with reason codes and suggested skill — that's the contract.
