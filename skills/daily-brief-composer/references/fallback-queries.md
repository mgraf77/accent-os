# Fallback SQL queries — daily-brief-composer

> Used when companion skills (`next-action-recommender`, `alert-router`, `kpi-data-audit`, `vendor-cascade`) are not yet shipped. SKILL.md Step 2 + Step 3 fall through to these against Supabase `hsyjcrrazrzqngwkqsqa`. Every query is read-only.

> Convention: `:role` and `:watermark` are bind params resolved by SKILL.md Step 0. All queries return ≤ section cap from `role-templates.md`.

---

## Top 3 actions — Owner

Ranked by money-on-the-line × time-decay. Pulls the highest-stakes deals that are also stale.

```sql
WITH stale_deals AS (
  SELECT 'deal' AS kind,
         d.id::text AS target_id,
         d.title AS target_name,
         d.amount AS dollars,
         EXTRACT(DAY FROM NOW() - d.last_contact_at)::int AS days_stale,
         d.amount * (1.0 - EXP(-EXTRACT(DAY FROM NOW() - d.last_contact_at)/30.0)) AS rank_score
  FROM pipeline_deals d
  WHERE d.status = 'open'
    AND d.amount > 5000
),
expiring_coops AS (
  SELECT 'coop' AS kind,
         c.id::text AS target_id,
         c.vendor_name AS target_name,
         c.dollars_at_stake AS dollars,
         EXTRACT(DAY FROM c.deadline - NOW())::int AS days_to_deadline,
         c.dollars_at_stake * (1.0 / GREATEST(EXTRACT(DAY FROM c.deadline - NOW()), 1)) AS rank_score
  FROM coop_tracker c
  WHERE c.deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
    AND c.status = 'open'
)
SELECT * FROM (
  SELECT kind, target_id, target_name, dollars, rank_score FROM stale_deals
  UNION ALL
  SELECT kind, target_id, target_name, dollars, rank_score FROM expiring_coops
) ranked
ORDER BY rank_score DESC
LIMIT 3;
```

---

## Top 3 actions — Sales

```sql
SELECT 'deal' AS kind,
       d.id::text AS target_id,
       d.title AS target_name,
       d.amount AS dollars,
       EXTRACT(DAY FROM NOW() - d.last_contact_at)::int AS days_stale
FROM pipeline_deals d
WHERE d.status = 'open'
  AND d.owner_role = 'sales'
ORDER BY d.amount DESC, days_stale DESC
LIMIT 3;
```

---

## Top 3 actions — Marketing

```sql
SELECT 'kpi_drop' AS kind,
       k.kpi_id AS target_id,
       k.kpi_name AS target_name,
       k.wow_delta_pct AS dollars,
       NULL::int AS days_stale
FROM kpi_snapshots k
WHERE k.group_id LIKE 'M-%'
  AND k.snapshot_date = CURRENT_DATE
  AND ABS(k.wow_delta_pct) >= 15
ORDER BY ABS(k.wow_delta_pct) DESC
LIMIT 3;
```

---

## Top 3 actions — Ops

```sql
SELECT 'breach' AS kind,
       i.sku AS target_id,
       i.product_name AS target_name,
       i.shortfall_qty::numeric AS dollars,  -- shortfall used as urgency proxy
       NULL::int AS days_stale
FROM inventory i
WHERE i.on_hand < i.safety_stock
ORDER BY (i.safety_stock - i.on_hand) DESC
LIMIT 3;
```

---

## Deals at risk

```sql
SELECT d.id, d.title, d.amount, d.stage,
       d.last_contact_at,
       EXTRACT(DAY FROM NOW() - d.last_contact_at)::int AS days_stale,
       EXTRACT(DAY FROM NOW() - d.stage_changed_at)::int AS days_in_stage
FROM pipeline_deals d
WHERE d.status = 'open'
  AND (
       d.last_contact_at < NOW() - INTERVAL '30 days'
       OR (d.stage_changed_at < NOW() - INTERVAL '14 days' AND d.amount > 2000)
  )
ORDER BY d.amount DESC
LIMIT 7;
```

---

## Vendors needing attention

Combines three signals: score delta, co-op deadline, broken-link flag.

```sql
WITH score_movers AS (
  SELECT v.vendor_id, v.vendor_name,
         'score_delta' AS reason,
         (v.score_today - v.score_yesterday) AS signal,
         CASE
           WHEN (v.score_today - v.score_yesterday) > 0.10 THEN 'score jumped up'
           WHEN (v.score_today - v.score_yesterday) < -0.10 THEN 'score fell off'
         END AS narrative
  FROM vendor_scores v
  WHERE ABS(v.score_today - v.score_yesterday) > 0.10
),
coop_deadlines AS (
  SELECT c.vendor_id, c.vendor_name,
         'coop_deadline' AS reason,
         c.dollars_at_stake AS signal,
         'co-op deadline in ' || EXTRACT(DAY FROM c.deadline - NOW())::text || 'd' AS narrative
  FROM coop_tracker c
  WHERE c.deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
    AND c.status = 'open'
),
broken_links AS (
  SELECT b.vendor_id, b.vendor_name,
         'broken_links' AS reason,
         b.broken_count::numeric AS signal,
         b.broken_count::text || ' broken vendor URLs' AS narrative
  FROM vendor_link_health b
  WHERE b.broken_count > 0
)
SELECT * FROM score_movers
UNION ALL SELECT * FROM coop_deadlines
UNION ALL SELECT * FROM broken_links
ORDER BY ABS(signal) DESC
LIMIT 5;
```

---

## KPI deviations (WoW)

```sql
SELECT k.kpi_id, k.kpi_name, k.group_id,
       k.value_this_week, k.value_last_week,
       k.wow_delta_pct,
       CASE
         WHEN k.group_id = 'F'  AND ABS(k.wow_delta_pct) >= 15 THEN true
         WHEN k.group_id = '$'  AND ABS(k.wow_delta_pct) >= 20 THEN true
         WHEN k.group_id = 'V'  AND ABS(k.wow_delta_pct) >= 20 THEN true
         WHEN k.group_id LIKE 'S-%' AND ABS(k.wow_delta_pct) >= 20 THEN true
         WHEN k.group_id LIKE 'M-%' AND ABS(k.wow_delta_pct) >= 15 THEN true
         ELSE false
       END AS surface
FROM kpi_snapshots k
WHERE k.snapshot_date = CURRENT_DATE
  AND CASE
        WHEN k.group_id = 'F'  AND ABS(k.wow_delta_pct) >= 15 THEN true
        WHEN k.group_id = '$'  AND ABS(k.wow_delta_pct) >= 20 THEN true
        WHEN k.group_id = 'V'  AND ABS(k.wow_delta_pct) >= 20 THEN true
        WHEN k.group_id LIKE 'S-%' AND ABS(k.wow_delta_pct) >= 20 THEN true
        WHEN k.group_id LIKE 'M-%' AND ABS(k.wow_delta_pct) >= 15 THEN true
        ELSE false
      END
ORDER BY ABS(k.wow_delta_pct) DESC
LIMIT 4;
```

---

## New since last brief (24h diff)

```sql
WITH new_deals AS (
  SELECT 'deal' AS kind, id::text AS target_id, title AS narrative,
         amount AS dollars, created_at
  FROM pipeline_deals
  WHERE created_at > :watermark::timestamptz
),
new_interactions AS (
  SELECT 'interaction' AS kind, id::text AS target_id,
         'with ' || customer_name || ' — ' || channel AS narrative,
         NULL::numeric AS dollars, created_at
  FROM customer_interactions
  WHERE created_at > :watermark::timestamptz
),
new_alerts AS (
  SELECT 'alert' AS kind, id::text AS target_id,
         severity || ': ' || message AS narrative,
         NULL::numeric AS dollars, created_at
  FROM alerts
  WHERE created_at > :watermark::timestamptz
    AND status = 'open'
)
SELECT * FROM new_deals
UNION ALL SELECT * FROM new_interactions
UNION ALL SELECT * FROM new_alerts
ORDER BY created_at DESC
LIMIT 6;
```

---

## Co-op deadlines (Owner / Ops)

```sql
SELECT c.id, c.vendor_name, c.dollars_at_stake,
       c.deadline,
       EXTRACT(DAY FROM c.deadline - NOW())::int AS days_left
FROM coop_tracker c
WHERE c.status = 'open'
  AND c.deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
ORDER BY c.deadline ASC
LIMIT 4;
```

---

## Funnel pulse (Marketing / Sales)

```sql
SELECT k.kpi_id, k.kpi_name, k.value_this_week, k.value_last_week, k.wow_delta_pct
FROM kpi_snapshots k
WHERE k.group_id IN ('M-FN', 'M-AC')
  AND k.snapshot_date = CURRENT_DATE
ORDER BY k.kpi_id
LIMIT 3;
```

---

## Today's ship list (Ops)

```sql
SELECT o.order_id, o.customer_name, o.line_count, o.total_amount,
       o.warehouse_status
FROM orders o
WHERE o.ship_date = CURRENT_DATE
  AND o.status IN ('picked', 'packed', 'ready')
ORDER BY o.total_amount DESC
LIMIT 7;
```

---

## Safety-stock breaches (Ops)

```sql
SELECT i.sku, i.product_name, i.on_hand, i.safety_stock,
       (i.safety_stock - i.on_hand) AS shortfall,
       v.vendor_name AS primary_vendor
FROM inventory i
LEFT JOIN vendors v ON v.vendor_id = i.primary_vendor_id
WHERE i.on_hand < i.safety_stock
ORDER BY (i.safety_stock - i.on_hand) DESC
LIMIT 5;
```

---

## Schema notes

- `pipeline_deals` and `customer_interactions` come from M03 (CRM Customer 360). If those tables don't yet exist, the queries return zero rows — render the section as `_nothing flagged_`.
- `coop_tracker` is live (per MASTER §5 — Track 2.3 shipped).
- `vendor_scores` is live (vendor scoring engine ships in `index.html`).
- `kpi_snapshots` is the materialized snapshot table behind KPI_CATALOG.md; populated daily by the KPI roll-up cron.
- `vendor_link_health` is populated by `broken-link-rescue` runs.
- `inventory.safety_stock` and `orders.ship_date` are M-pending — see KPI_CATALOG schema gaps section. Until those resolve, the Ops fallback queries return zero rows; section renders as `_nothing flagged_`.

When invoking via Supabase MCP, use `execute_sql` (read path). Do NOT use `apply_migration`.
