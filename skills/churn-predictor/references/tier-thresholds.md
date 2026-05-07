# Tier Thresholds — AccentOS churn-predictor

> Per-segment churn-flag thresholds. Trade customers tolerate longer gaps than Consumer; thresholds are calibrated for Accent Lighting's actual order cadence patterns. Used by SKILL.md Step 2.

---

## Threshold table

| Segment   | Recency multiplier vs. baseline | Frequency drop trigger | Monetary drop trigger | Second-order window (NEW_AT_RISK) |
|-----------|-------------------------------- |------------------------|------------------------|-----------------------------------|
| **Trade**     | `2.00×`                          | `≤ -50%`               | `≤ -40%`               | n/a (Trade customers don't trigger NEW_AT_RISK by default) |
| **Designer**  | `1.75×`                          | `≤ -50%`               | `≤ -40%`               | 90 days |
| **Consumer**  | `1.50×`                          | `≤ -60%`               | `≤ -50%`               | 60 days |
| **Unknown**   | `1.50×`                          | `≤ -50%`               | `≤ -50%`               | 60 days |

---

## Why these numbers

### Trade — `2.00×` recency

Trade customers (lighting contractors, builders, electricians) buy on project cadence. A typical Trade account has a median interval of 45–120 days between orders, depending on project pipeline depth. A 2× gap means a 90-day median customer is now at 180+ days quiet — that's lost-account territory, not "between projects."

Tightening this to `1.5×` would generate noise (every Trade slow month would flag); loosening it to `2.5×` would miss real churn.

### Designer — `1.75×` recency

Designers (interior designers, lighting consultants) sit between Trade and Consumer cadence. They buy when their client signs off, which is more variable than a contractor's pipeline but more cadenced than a homeowner. A 1.75× gap on a 60-day median customer means 105+ days quiet — meaningful but not panic-button.

### Consumer — `1.50×` recency

Consumers (homeowners, gift purchases) are episodic. Many never order twice. The threshold here is calibrated **only against repeat customers** — first-time-only buyers route through `NEW_AT_RISK`, not `RECENCY_DROP_CONSUMER`.

A 1.5× gap on a 30-day median customer means 45+ days quiet — for someone with a 30-day cadence, that's a real drop.

### Unknown — `1.50×` recency

Conservative default. If `customer_records.segment` is null or out-of-set, treat as Consumer-tight thresholds — better to surface than miss. The fact that a customer is `Unknown` is itself a data-quality flag — surface in the snapshot when the share of `Unknown` flagged customers exceeds 20%.

---

## Frequency thresholds — why -50% / -60%

A customer ordering at exactly half their historical pace is a clear signal. Trade and Designer thresholds are tighter (-50%) because their baselines are more stable (project-pipeline driven). Consumer baselines are noisier (variable life events), so we set Consumer at -60% to filter out random fluctuation.

If a Trade customer's baseline frequency is 8 orders/year and last-90 annualized is 4 orders/year, that's `(4 − 8) / 8 = -50%` → flag. If a Consumer's baseline is 4 orders/year and last-90 annualized is 2 orders/year, that's also `-50%` but **below the Consumer threshold of -60%** → not flagged on frequency alone (may still flag on recency or monetary).

---

## Monetary thresholds — why -40% / -50%

Slightly looser than frequency because monetary is more volatile (a single big chandelier order can dwarf a half-dozen small Consumer orders). Trade `-40%` reflects that even a project gap shouldn't drop dollars 40% over the baseline window if the customer is healthy. Consumer `-50%` filters single-big-purchase noise.

---

## NEW_AT_RISK second-order window

Customers with `lifetime_orders = 1` are evaluated on a separate clock — the "expected second order window." If they don't reorder by:

- **Designer:** 90 days from first order
- **Consumer:** 60 days from first order
- **Trade:** evaluated as `RECENCY_DROP_TRADE` instead — a Trade customer with one order is unusual and the recency baseline doesn't really apply (no per-customer baseline to deviate from). Treat as a pipeline lead, not a churn target.

---

## Tuning protocol

When Michael says "tune the churn thresholds" or after enough APPROVED/REJECTED action-queue feedback accumulates:

1. Pull last 90 days of `action-queue` rows where `kind='retention'`.
2. For each rejected row, classify: false positive (customer wasn't actually churning) or false negative (customer churned but wasn't flagged in time).
3. If false-positive rate > 30% in any tier → loosen that tier's thresholds (e.g. Trade recency mult `2.0×` → `2.25×`).
4. If false-negative rate > 20% (customers who churned without prior flag) → tighten thresholds.
5. Edit this file. Run `churn-predictor --backfill` to recompute prior 90 days with new thresholds and validate the curve before shipping.

Do not edit thresholds in SKILL.md — only edit this file. SKILL.md reads from this file.

---

## Override path

If Michael needs a one-off run with different thresholds (e.g. "show me everything 1.25× or worse"), pass overrides via prompt:

```
churn-predictor --override-recency-mult 1.25 --override-segments Trade,Designer top 30
```

Overrides do not persist — the next run reads this file again. Persistent changes require an Edit to this file.

---

## Related skills

- `priority-articulation` — when Michael says "what does 'at risk' really mean for Trade", that's a priority-articulation cascade-the-thresholds question, not a churn-predictor run.
- `kpi-data-audit` — when these thresholds drift far from the data, the audit will surface the disconnect.
- `vendor-clarity-test` — used when the cause of a `FREQUENCY_HALVED` flag is suspected to be vendor-side, not customer-side.
