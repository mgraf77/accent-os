# Data Source Fallback — Windward vs BC

> Decision tree for which data source feeds velocity computation. Soft dependency on Windward.

## The two sources

| Source           | What it is                                        | Quality | Latency |
|------------------|---------------------------------------------------|---------|---------|
| `windward`       | Windward sales-line history (real sell-through)   | High    | 1–24h   |
| `bc-po-lines`    | BigCommerce PO_LINES (purchase qty as proxy)      | Medium  | Live    |

The `bc-po-lines` source is the same proxy `js/demand_forecast.js` uses today (Track 6.9). The `windward` source is the upgrade path the Track 6.11 plan describes — same compute, richer input.

---

## Decision tree

Run these probes in order. First match wins.

### Probe 1 — Windward present?

```sql
-- Supabase hsyjcrrazrzqngwkqsqa
select count(*) as n
from windward_sales_lines
where sale_date >= now() - interval '90 days';
```

If table exists AND `n > 0` → source = `windward`. Done.

If table missing OR `n = 0` → continue to Probe 2.

### Probe 2 — BC PO_LINES present?

In-page (when running inside AccentOS):

```javascript
const hasPOs = (typeof POS !== 'undefined') && POS.length > 0;
const hasLines = (typeof PO_LINES !== 'undefined') && Object.keys(PO_LINES).length > 0;
```

Server-side (when running outside the page):

```sql
-- Supabase hsyjcrrazrzqngwkqsqa
select count(*) as n
from po_lines pl
join purchase_orders po on po.id = pl.po_id
where po.order_date >= now() - interval '90 days';
```

If `n > 0` (or in-page constants populated) → source = `bc-po-lines`. Done.

If neither → continue to Probe 3.

### Probe 3 — Stub mode

Return:

```
skill `demand-forecaster-skill` has no usable data source.

To unblock:
1. Populate PO_LINES (Track 6.9 path) — this lights up the BC fallback path that the existing UI already uses.
2. OR run `windward-bridge` to ingest sales-line history (preferred — richer signal).

Probe results:
- windward_sales_lines: [missing | empty]
- po_lines (last 90d):  [missing | empty]

Skill activates automatically as soon as either probe passes.
```

---

## Source declaration is mandatory

Every output (forecast table or PO draft) must declare which source fed it. Format:

```
DEMAND-FORECASTER — ...  •  source: windward
```

or

```
DEMAND-FORECASTER — ...  •  source: bc-po-lines (Track 6.9 proxy)
```

This lets `bc-business-review` weight forecast vs actual deltas appropriately — `bc-po-lines` outputs deserve a wider tolerance band than `windward` outputs.

---

## Switching sources mid-relationship

Once `windward` is available, do NOT silently switch. The first `windward`-sourced run after a `bc-po-lines` history must:

1. Surface "source upgraded: bc-po-lines → windward" in the header.
2. Re-run last week's forecast with the new source for comparison.
3. Write the comparison to `analysis-snapshot/runs/source-upgrade-bc-to-windward-YYYY-MM-DD.md`.

After 4 weeks of windward runs, retire the comparison artifacts.

---

## Mixed mode is forbidden

Do not blend velocity from both sources in one forecast. Either all-windward or all-bc-po-lines per run. Mixing introduces a discontinuity that downstream consumers can't reason about. If both exist, prefer `windward` always.
