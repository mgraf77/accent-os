# Demand Forecaster — Model & Constants

> Single source of truth for forecast heuristics. Mirrors `js/demand_forecast.js` (Track 6.9 UI).

## Constants (must match `js/demand_forecast.js`)

| Constant                | Value | Meaning                                                |
|-------------------------|-------|--------------------------------------------------------|
| `LEAD_WEEKS`            | 4     | Default vendor lead time (weeks)                       |
| `SAFETY_WEEKS`          | 2     | Safety stock buffer (weeks)                            |
| `REORDER_THRESHOLD`     | 6     | `LEAD_WEEKS + SAFETY_WEEKS` — trigger to reorder       |
| `TARGET_WEEKS`          | 14    | Forward demand to cover with each PO (lead+safety+8w)  |
| `OVERSTOCK_WEEKS`       | 26    | More than this = flag as overstock                     |
| `VELOCITY_WINDOW_DAYS`  | 90    | Rolling window for velocity computation                |

If Michael says "use 8 weeks lead time" or similar in-prompt, override `LEAD_WEEKS` for that run only and surface the override in the output header.

---

## Velocity formula

```
velocity_per_week[sku] = sum(qty in window) / (VELOCITY_WINDOW_DAYS / 7)
                       = sum(qty in last 90 days) / 12.857
```

Source of `qty in window`:
- **Windward path (preferred):** `windward_sales_lines.qty_sold` where `sale_date >= now() - 90d`, grouped by `sku`.
- **BC fallback:** `PO_LINES.qty` where parent PO `order_date >= now() - 90d`, grouped by `sku|vendor_id` (matches Track 6.9 UI).

---

## Classification

```
weeks_of_stock = qty_available / velocity_per_week

if velocity <= 0.05            → no_data
elif avail <= 0 OR weeks < 6    → reorder_now
elif weeks < 9                  → reorder_soon
elif weeks > 26                 → overstock
else                            → normal
```

`qty_available = COALESCE(qty_available, qty_on_hand - qty_committed)`

---

## Recommended reorder qty

Only computed for `reorder_now` and `reorder_soon`:

```
recommended_reorder_qty = max(1, round(velocity × TARGET_WEEKS - qty_available - qty_on_order))
```

Always at least 1 unit.

---

## Forecast horizons

```
forecast_30d = velocity × seasonality_factor_next_4w  × (30/7)
forecast_60d = velocity × seasonality_factor_next_8w  × (60/7)
forecast_90d = velocity × seasonality_factor_next_12w × (90/7)
```

Seasonality factors come from `seasonality.md`.

---

## Why this is v1 — and the upgrade path

This is a deliberately simple forecast model: rolling-average velocity × seasonal multiplier. It is honest about what it is. It is **not**:
- ARIMA / SARIMA
- Prophet
- Any neural / gradient-boosted model
- Causal-feature aware (price changes, marketing pulses, supply shocks)

We start simple because:
1. Track 6.9's velocity-from-PO-lines proxy is itself thin until Windward sales history lands.
2. With < 52 weeks of history, more sophisticated models overfit.
3. The Track 6.9 UI commits to these exact constants — staying simple keeps skill output drop-in compatible.

**Upgrade triggers** — when to revisit:
- `MAPE` (mean absolute percent error) of `forecast_30d` vs actual sell-through exceeds 35% across any vendor for 3 consecutive weeks (track via `bc-business-review`).
- `windward-bridge` lands and we have ≥ 52 weeks of clean sales-line history.
- Michael invests in M-task for ML pipeline (no current M-task slot — would be M11+ in MASTER.md).

When that triggers, the upgrade is: replace `velocity × seasonality` with a Prophet model per SKU group (vendor or category), keep the same input/output schema so downstream consumers (`action-queue`, `bc-business-review`, the UI) are unaffected.

---

## Compute-contract guarantee

Output rows from this skill must be 1:1 schema-compatible with rows from `computeDemandForecast()` in `js/demand_forecast.js`. Required fields:

```
sku, vendor_id, vendor_name, description,
qty_available, qty_on_order, reorder_point,
unit_cost, list_price,
velocity_per_week, weeks_of_stock,
kind, suggested_qty
```

The skill adds three fields the UI doesn't (yet): `forecast_30d`, `forecast_60d`, `forecast_90d`. The UI ignores extra fields — additive only, never break the existing shape.
