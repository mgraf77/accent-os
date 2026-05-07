# Seasonality — 52-Week Decomposition

> Weekly seasonality factor table used to multiply rolling-average velocity.

## How factors are computed

For each ISO week 1..52:

```
factor[w] = (avg_qty_in_week_w_across_all_years) / (avg_qty_per_week_overall)
```

If `factor[w] = 1.2`, week `w` is 20% above the annual mean. If `0.8`, 20% below.

Computed only when **≥ 52 weeks of clean history** exists. Otherwise all factors collapse to 1.0 — the forecast becomes pure rolling average. The output header must surface "thin-history fallback (factor=1.0)" when this happens.

Source data:
- Windward path: `windward_sales_lines` aggregated by ISO week
- BC fallback: `PO_LINES` aggregated by ISO week (less accurate — PO timing ≠ sell-through timing — but better than nothing)

---

## Lighting-industry priors (Accent Lighting context)

These are **prior expectations** to sanity-check the computed factors against. Do not hard-code them — flag a warning if computed factors deviate by > 30% from priors.

| ISO Week range  | Period                  | Expected factor | Why                                                    |
|-----------------|-------------------------|-----------------|--------------------------------------------------------|
| 1–8             | Jan–Feb                 | 0.7–0.9         | Post-holiday lull                                      |
| 9–16            | Mar–Apr                 | 0.9–1.1         | Spring renovation pickup                               |
| 17–22           | May–early Jun           | 1.0–1.2         | Designer / new-build season starts                     |
| 23–30           | mid Jun–Jul             | 1.1–1.3         | Peak design install season                             |
| 31–35           | Aug                     | 1.0–1.2         | Sustained installs, back-to-school slowdown for retail |
| 36–43           | Sep–mid Oct             | 1.1–1.3         | Pre-holiday entertaining purchases                     |
| 44–48           | late Oct–Nov            | 1.2–1.5         | Holiday peak, gift purchases, BC promotional pushes    |
| 49–52           | Dec                     | 0.8–1.1         | Sharp tail — gift orders cut off mid-month             |

Trade-channel SKUs follow a flatter curve than consumer SKUs. If the active scope is "trade" or vendor segment is `Trade`, dampen factors toward 1.0 by 50%.

---

## Forward-window aggregation

For 30/60/90-day forecasts, the skill needs forward-looking factors:

```
seasonality_factor_next_4w  = avg(factor[current_iso_week + 1 .. current_iso_week + 4])
seasonality_factor_next_8w  = avg(factor[current_iso_week + 1 .. current_iso_week + 8])
seasonality_factor_next_12w = avg(factor[current_iso_week + 1 .. current_iso_week + 12])
```

Wrap around year boundary as needed (week 52 + 1 = week 1).

---

## When to recompute factors

Recompute when any of:
- Each Monday (weekly cadence) — overwrites the cached factor table
- After a Windward backfill lands (one-time)
- When Michael says "rebuild seasonality" or `--rebuild-seasonality`

Cache location: write to `analysis-snapshot/runs/seasonality-factors-YYYY-MM-DD.md` so the table is auditable.
