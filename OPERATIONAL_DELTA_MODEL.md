# OPERATIONAL_DELTA_MODEL.md
> Detecting deterioration, acceleration, drift, anomaly — v1
> Pair with OPERATIONAL_SIGNAL_TAXONOMY.md

## Why deltas matter more than levels

Operationally, **change is the signal**. A 92% fill rate is fine — *unless* it was 98% last month. A 14-day lead time is fine — *unless* it was 9 days a quarter ago. Level-based thresholds are static and noisy; delta-based detection captures the actual operating reality: things drift, then break.

Roughly **60–70% of elevated/critical signals in the taxonomy are delta-driven**, not threshold-driven. This document defines how AccentOS computes and reasons about deltas.

## Delta types

### 1. Deterioration
A directional negative move in a metric where higher-is-better or lower-is-better is well-defined.

- *Vendor fill rate trending down*
- *Conversion rate falling*
- *On-time shipping declining*

**Trigger pattern**: `current_window < baseline_window × decline_factor` AND `current_window < baseline_window - min_absolute_delta`.

The absolute floor matters — a fill rate moving from 99.5% → 99.0% is a 0.5pt decline but operationally meaningless.

### 2. Acceleration
A *rate of change* is itself changing.

- *Backorders growing each week, with growth-rate increasing*
- *Cost increases compounding*
- *Margin erosion accelerating*

**Trigger pattern**: second derivative crosses zero or exceeds a slope threshold across N consecutive windows.

Acceleration signals are early-warning. They should typically be **elevated**, not critical — they predict pain rather than reflect it.

### 3. Trend shift
A previously stable directional trend reverses or breaks.

- *Sales of category X had been climbing 4 quarters, now flat*
- *Inventory turns had been stable, now declining*

**Trigger pattern**: regression slope sign change, or slope magnitude change > 2 standard errors.

Trend shifts are **strategic** signals — almost always INFO or WARN, routed to owner.

### 4. Anomaly
A point that doesn't fit recent distribution.

- *Today's order volume is 4σ above 90-day mean*
- *One vendor's lead time on this PO is 3× their own median*

**Trigger pattern**: |value - rolling_median| / rolling_MAD > k (default k=4, see "robust statistics" below).

Anomalies are **noisy** — be conservative. Most anomalies should be INFO; only anomalies that match a known-bad pattern (e.g. zero-orders during business hours) deserve CRIT.

### 5. Velocity
Pace of an operational process, in units/time.

- *Quote close velocity (quotes/week)*
- *PO receipt velocity*
- *Order ship velocity*

**Trigger pattern**: rolling 7d velocity vs rolling 30d velocity, with min-volume gate.

Velocity signals capture **process health**, not state. They are how we detect "things are slowing down" before anyone complains.

### 6. Directional change
A binary flip: was growing, now shrinking. Was shrinking, now growing.

- *Net new customers flipped negative*
- *Inventory $ flipped from declining to growing without a planned buy*

**Trigger pattern**: rolling slope sign change persists ≥ N windows (avoid flapping).

### 7. Drift
Slow movement away from a baseline that no single window crosses a threshold.

- *Average freight % of revenue moved from 4.2% → 5.1% over 6 months*
- *Discount rate crept up 2pts/quarter*

**Trigger pattern**: cumulative delta from 90d baseline exceeds threshold, even if each step is sub-threshold.

Drift is the **silent margin killer**. Detection requires long memory — keep at least 18 months of weekly aggregates for any metric on the drift watchlist.

## Worked examples (mapped to taxonomy)

| Taxonomy signal | Delta type | Detection sketch |
|---|---|---|
| `vendor.score_deteriorating` | Deterioration | composite_score_30d < composite_score_90d − 10 AND volume_gate met |
| `margin.freight_outpacing_revenue` | Acceleration | d(freight)/d(t) > d(revenue)/d(t) across 4 weekly windows |
| `quote.velocity_slowing` | Velocity | avg_time_to_close_30d > avg_time_to_close_90d × 1.3 |
| `inv.dead_stock_aging` | Drift | aging_buckets shifting right (slow), cumulative shift > threshold |
| `ecom.conversion_drop` | Deterioration | conv_7d < conv_30d × 0.8 AND sessions_7d ≥ min_volume |
| `ship.backorder_increasing` | Trend shift | backorder count slope positive 5 consecutive days |
| `price.cost_increase_unpassed` | Directional change | cost_step_function detected, sell_price_slope == 0 over 14d |

## Mathematical conventions

To keep this realistic for SMB infra, AccentOS uses **robust, cheap** statistics — not ML.

- **Rolling windows**: 7d, 30d, 90d are the canonical windows. Longer for drift (180d, 365d).
- **Central tendency**: rolling **median**, not mean. (Mean is dragged by spikes; median is not.)
- **Spread**: rolling **MAD** (median absolute deviation), not standard deviation.
- **Anomaly threshold**: `|x - median| / MAD > 4` (≈ 6σ-equivalent for normal, much more conservative for fat-tailed real data).
- **Slope detection**: simple OLS on the last N points, with slope sign and slope-vs-standard-error.
- **Volume gates**: every delta detection requires a minimum sample size before it can fire. Without this, low-volume SKUs / customers / vendors will fire constantly.

## Volume gates (mandatory)

| Window | Min observations to fire | Min entity-level volume |
|---|---|---|
| 7d | 14 data points | ≥ 5 events on the entity |
| 30d | 25 data points | ≥ 20 events on the entity |
| 90d | 60 data points | ≥ 50 events on the entity |

A signal that fails its volume gate is **dropped silently**, not suppressed — it never existed.

## Baseline management

The hardest part of delta detection is **what is "normal."**

1. **Baselines are computed lazily** per metric × entity, on a daily cron.
2. **Baselines are persisted** in a `signal_baselines` table — never recomputed at signal-evaluation time.
3. **Seasonal metrics** (ecommerce conversion, retail demand) get **dual baselines**: prior-period (90d) and year-over-period.
4. **Baseline staleness** > 7 days → all dependent signals enter a degraded mode (info-only) until baseline refresh.
5. **New entities** (new SKU, new vendor) have no baseline — eligible only for level-based signals, not delta-based, until volume gate is met.

## Anti-patterns to avoid

1. **Threshold-chasing**: don't lower the threshold every time someone misses an issue. Re-examine the *delta condition*, the *volume gate*, or the *baseline window*.
2. **Mean-based everything**: don't use mean+stddev as the default. Real operational data is heavy-tailed.
3. **Per-row alerting**: don't fire one signal per affected row. Aggregate by entity and by signal_name.
4. **Recomputing baselines at signal time**: way too expensive at scale and introduces non-determinism. Pre-compute.
5. **Forgetting to age out**: a signal whose underlying delta has reverted should self-resolve, not require manual close.

## Self-resolution

Delta-driven signals **self-resolve** when the triggering delta no longer holds for a full evaluation window. A `signal.resolved` event is emitted referencing the original `signal_id`. The original is never mutated.

This is how the operational feed stays clean without humans clicking "acknowledge" on every drift event.

## Phase 1 delta coverage (recommended)

Phase 1 should implement delta detection for **only 5 metrics**:

1. vendor fill rate (deterioration)
2. ecommerce conversion (deterioration)
3. quote close velocity (velocity)
4. backorder count (trend shift)
5. freight % of revenue (drift)

Everything else uses level-based triggers in Phase 1. We earn delta detection by proving the infrastructure on these five.
