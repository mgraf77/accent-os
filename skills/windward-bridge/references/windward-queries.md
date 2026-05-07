# Windward query patterns
> The canonical six pre-defined query patterns this skill supports. New patterns go here as versioned additions — never freestyled.

This file is the **only** source of SQL / API definitions for `windward-bridge`. Step 1 of `SKILL.md` picks one pattern by key; Step 3 reads the SQL/endpoint from this file.

All queries are READ-ONLY. There are no `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, or DDL statements anywhere in this file. If a future PR adds one, it is a P0 bug per `read-only-policy.md`.

---

## Pattern 1 — `customer_balance_by_id`

**What it returns:** open balance + last-payment-date + days-since-last-payment for one customer, by Windward customer ID.

**Parameters:**
- `customer_id` (string, Windward customer ID — usually `WW-NNNNN`)

**Method A — Supabase replica:**
```sql
SELECT
  c.windward_id          AS customer_id,
  c.name                 AS name,
  c.open_balance         AS open_balance,
  c.currency             AS currency,
  c.last_payment_date    AS last_payment_date,
  c.last_invoice_date    AS last_invoice_date,
  CASE
    WHEN c.last_payment_date IS NULL THEN NULL
    ELSE (CURRENT_DATE - c.last_payment_date)::int
  END                    AS days_since_last_pmt
FROM windward_customers c
WHERE c.windward_id = :customer_id
LIMIT 1;
```

**Method B — Direct S5WebAPI:**
- `GET {WINDWARD_S5WEBAPI_URL}/customers/{customer_id}/balance`
- Map response fields → output schema (left column).

**Output schema:**
| customer_id | name | open_balance | currency | last_payment_date | last_invoice_date | days_since_last_pmt |

---

## Pattern 2 — `invoice_by_id`

**What it returns:** single invoice header + line items, by Windward invoice number.

**Parameters:**
- `invoice_id` (string, Windward invoice number)

**Method A:**
```sql
SELECT
  i.invoice_id,
  i.customer_id,
  i.invoice_date,
  i.due_date,
  i.status,
  i.subtotal,
  i.tax,
  i.total,
  i.amount_paid,
  i.balance_due
FROM windward_invoices i
WHERE i.invoice_id = :invoice_id
LIMIT 1;

-- Then line items
SELECT
  l.line_no,
  l.sku,
  l.description,
  l.qty,
  l.unit_price,
  l.line_total
FROM windward_invoice_lines l
WHERE l.invoice_id = :invoice_id
ORDER BY l.line_no ASC;
```

**Method B:**
- `GET {WINDWARD_S5WEBAPI_URL}/invoices/{invoice_id}` — returns header + lines in one payload.

**Output schema:**
- Header: `invoice_id, customer_id, invoice_date, due_date, status, subtotal, tax, total, amount_paid, balance_due`
- Lines: `line_no, sku, description, qty, unit_price, line_total`

Render header as a labeled key:value block, then a single table for lines.

---

## Pattern 3 — `invoice_aging_summary`

**What it returns:** aging buckets (current / 1-30 / 31-60 / 61-90 / 90+) for all open AR.

**Parameters:** none.

**Method A:**
```sql
WITH aged AS (
  SELECT
    invoice_id,
    balance_due,
    CASE
      WHEN due_date >= CURRENT_DATE                                    THEN 'current'
      WHEN due_date >= CURRENT_DATE - INTERVAL '30 days'               THEN '1-30'
      WHEN due_date >= CURRENT_DATE - INTERVAL '60 days'               THEN '31-60'
      WHEN due_date >= CURRENT_DATE - INTERVAL '90 days'               THEN '61-90'
      ELSE                                                                  '90+'
    END AS bucket
  FROM windward_invoices
  WHERE balance_due > 0
)
SELECT
  bucket,
  COUNT(*)                          AS invoice_count,
  SUM(balance_due)                  AS open_amount,
  ROUND(100.0 * SUM(balance_due) / SUM(SUM(balance_due)) OVER (), 1)
                                    AS pct_of_open_ar
FROM aged
GROUP BY bucket
ORDER BY
  CASE bucket
    WHEN 'current' THEN 1
    WHEN '1-30'   THEN 2
    WHEN '31-60'  THEN 3
    WHEN '61-90'  THEN 4
    WHEN '90+'    THEN 5
  END;
```

**Method B:**
- `GET {WINDWARD_S5WEBAPI_URL}/ar/aging?as_of={today}`
- Map bucket labels to the same names.

**Output schema:**
| bucket | invoice_count | open_amount | pct_of_open_ar |

---

## Pattern 4 — `inventory_by_sku`

**What it returns:** on-hand / committed / available qty + last-received-date for one SKU.

**Parameters:**
- `sku` (string)

**Method A:**
```sql
SELECT
  i.sku,
  i.description,
  i.qty_on_hand,
  i.qty_committed,
  (i.qty_on_hand - i.qty_committed) AS qty_available,
  i.last_received_date,
  i.last_sold_date,
  i.unit_cost,
  i.location
FROM windward_inventory i
WHERE i.sku = :sku
LIMIT 1;
```

**Method B:**
- `GET {WINDWARD_S5WEBAPI_URL}/inventory/{sku}`

**Output schema:**
| sku | description | qty_on_hand | qty_committed | qty_available | last_received_date | last_sold_date | unit_cost | location |

---

## Pattern 5 — `vendor_balance_by_id`

**What it returns:** open AP balance + 90-day spend for one vendor.

**Parameters:**
- `vendor_id` (string, Windward vendor ID)

**Method A:**
```sql
SELECT
  v.vendor_id,
  v.name,
  v.open_ap_balance,
  v.currency,
  v.last_payment_date,
  v.last_invoice_received_date,
  COALESCE((
    SELECT SUM(p.amount)
    FROM windward_ap_invoices p
    WHERE p.vendor_id = v.vendor_id
      AND p.invoice_date >= CURRENT_DATE - INTERVAL '90 days'
  ), 0)                AS spend_90d,
  v.payment_terms
FROM windward_vendor_balances v
WHERE v.vendor_id = :vendor_id
LIMIT 1;
```

**Method B:**
- `GET {WINDWARD_S5WEBAPI_URL}/vendors/{vendor_id}/balance`
- `GET {WINDWARD_S5WEBAPI_URL}/vendors/{vendor_id}/spend?days=90`

**Output schema:**
| vendor_id | name | open_ap_balance | currency | last_payment_date | last_invoice_received_date | spend_90d | payment_terms |

---

## Pattern 6 — `recent_orders_by_date_range`

**What it returns:** orders (header + line count) in a `[from, to]` date range. Used by `bc-business-review` to capture non-BC channels (walk-in, electrician, phone) and by `churn-predictor` to attribute purchase activity to customers who don't transact on the website.

**Parameters:**
- `from_date` (ISO date)
- `to_date` (ISO date)
- Optional: `channel` (e.g. `walk-in`, `phone`, `electrician`) — if omitted, all channels

**Method A:**
```sql
SELECT
  o.order_id,
  o.customer_id,
  c.name              AS customer_name,
  o.order_date,
  o.channel,
  o.status,
  o.subtotal,
  o.total,
  (SELECT COUNT(*) FROM windward_order_lines l WHERE l.order_id = o.order_id) AS line_count
FROM windward_orders o
LEFT JOIN windward_customers c ON c.windward_id = o.customer_id
WHERE o.order_date BETWEEN :from_date AND :to_date
  AND (:channel IS NULL OR o.channel = :channel)
ORDER BY o.order_date DESC, o.order_id DESC;
```

**Method B:**
- `GET {WINDWARD_S5WEBAPI_URL}/orders?from={from_date}&to={to_date}&channel={channel}`

**Output schema:**
| order_id | customer_id | customer_name | order_date | channel | status | subtotal | total | line_count |

If row count > 1,000, surface the count and offer to narrow the range — do not silently truncate.

---

## Adding a new pattern

To add a 7th pattern:
1. Append a new `## Pattern 7 — <key>` section here with parameters, both methods, and the output schema.
2. Update `SKILL.md` Step 1 table with the new key + companion-skill hint.
3. Bump the version comment at the top of this file.
4. Verify with the read-only audit in `read-only-policy.md` that the new query touches no write verbs.

Patterns are versioned, not freestyled.
