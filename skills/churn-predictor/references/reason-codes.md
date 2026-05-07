# Reason Codes — AccentOS churn-predictor

> Dictionary of every reason code emitted by `churn-predictor`, the trigger logic that fires it, the priority order for picking the single dominant code per customer, and the suggested-intervention skill for each. Used by SKILL.md Step 3 + Step 5.

---

## Priority order (highest → lowest)

When multiple codes fire for one customer, pick the **single highest-priority** code as the reported reason. Capture all triggered codes in the `secondary_codes` array on the row.

1. `TRIPLE_DROP` — all three RFM dimensions exceed thresholds
2. `BIG_SPENDER_GONE_QUIET` — lifetime > $5K AND zero orders in last 90d
3. `RECENCY_DROP_TRADE` — Trade customer with recency gap > 2× baseline
4. `RECENCY_DROP_DESIGNER` — Designer customer with recency gap > 1.75× baseline
5. `RECENCY_DROP_CONSUMER` — Consumer customer with recency gap > 1.5× baseline
6. `FREQUENCY_HALVED` — annualized frequency dropped ≥ tier threshold (-50% Trade/Designer, -60% Consumer)
7. `MONETARY_DROP` — annualized monetary dropped ≥ tier threshold
8. `NEW_AT_RISK` — first-time buyer with no second order in expected window

---

## Code dictionary

### TRIPLE_DROP

**Trigger:** All three of `recency`, `frequency`, `monetary` deltas exceed their tier-specific thresholds simultaneously.

**Why it matters:** This is the strongest churn signal in the ranking. A Trade customer who hasn't ordered in 200 days, ordered half as much in the prior window, and spent half as many dollars is not "busy" — they have probably switched suppliers.

**Intervention skill:** `email-drafter` — pass `urgency=high`, type=`outreach` with hook context "noted you've been quiet — anything we can win back?"

**Action-queue payload:** `{ kind: 'retention', priority: 'urgent', customer_id, reason: 'TRIPLE_DROP', expires_at: now() + 7 days }`.

---

### BIG_SPENDER_GONE_QUIET

**Trigger:** `customer_records.lifetime_monetary > $5,000` AND `freq_last_90 = 0`.

**Why it matters:** Highest-dollar save opportunity. A $50K-lifetime Trade account with zero last-90 activity is a six-figure-pipeline rescue — owner reach-out, not a Klaviyo email.

**Intervention skill:** `email-drafter` — type=`outreach`, voice profile = owner-signed (Paul or Patrick Graf, not Michael — checked via context). HOLD-FOR-REVIEW on send.

**Action-queue payload:** `{ kind: 'retention', priority: 'urgent', owner_signed: true, customer_id, reason: 'BIG_SPENDER_GONE_QUIET' }`.

---

### RECENCY_DROP_TRADE

**Trigger:** `recency_days > median_interval_days_baseline × 2.0` AND `customer_records.segment = 'Trade'`.

**Why it matters:** Trade customers run on project cadence (often 60–120 day medians). A 2× gap is ~real signal, not normal noise.

**Intervention skill:** `email-drafter` — type=`outreach`, mention current promos / new-arrival vendors that align with the customer's purchase history.

**Companion check:** if the customer's purchase history concentrates in 1–2 vendors that recently dropped in `vendor_scores`, the actual cause may be vendor-driven — surface this via `vendor-cascade` companion call.

---

### RECENCY_DROP_DESIGNER

**Trigger:** `recency_days > median_interval_days_baseline × 1.75` AND `customer_records.segment = 'Designer'`.

**Why it matters:** Designers sit between Trade and Consumer cadence. They buy when their client signs off — a real gap is meaningful but not as urgent as Trade.

**Intervention skill:** `email-drafter` — type=`outreach`, lower-pressure tone, optionally surface a recent showroom event invite.

---

### RECENCY_DROP_CONSUMER

**Trigger:** `recency_days > median_interval_days_baseline × 1.5` AND `customer_records.segment = 'Consumer'`.

**Why it matters:** Consumers don't reorder on a tight cadence — but a customer with a 30-day median who suddenly hasn't ordered in 60+ days is gone or switched.

**Intervention skill:** `email-drafter` — type=`outreach`, Klaviyo-style re-engagement tone (lower personalization, clear offer).

---

### FREQUENCY_HALVED

**Trigger:** `(freq_annualized_last_90 - freq_baseline_365) / freq_baseline_365 <= tier_freq_drop` (where tier_freq_drop is `-0.50` for Trade/Designer, `-0.60` for Consumer).

**Why it matters:** Customer is still buying but at a fraction of historical pace. Often vendor-driven (favorite line discontinued) or competitive (price-tested elsewhere).

**Intervention skill:** `vendor-cascade` first — examine SKU concentration. If 70%+ of the customer's historical purchases come from 1–2 vendors, and those vendors have recent score deltas, the cause is vendor-side, not customer-side. Then `email-drafter` for the conversation.

---

### MONETARY_DROP

**Trigger:** `(monetary_annualized_last_90 - monetary_baseline_365) / monetary_baseline_365 <= tier_monetary_drop` (where tier_monetary_drop is `-0.40` for Trade/Designer, `-0.50` for Consumer).

**Why it matters:** Customer's average ticket fell. Often tied to project size shrinkage (smaller jobs) or trading down within product mix.

**Intervention skill:** `email-drafter` — check `quotes` table for any open quote tied to this customer. If a quote is open, type=`quote-revival`. If not, type=`follow-up` with question about their project pipeline.

---

### NEW_AT_RISK

**Trigger:** `lifetime_orders = 1` AND `recency_days > 60` AND `last_order_date < now() - interval '45 days'`.

**Why it matters:** First-purchase customer with no follow-on in the typical second-order window (60 days for Consumer, customizable per `references/tier-thresholds.md`). High-leverage early intervention.

**Intervention skill:** `email-drafter` — type=`outreach`, hook = "thanks for your first order; here's what other customers like you bought next."

---

## Intervention routing — single table

| Reason code              | Suggested skill              | Type tag         | Urgency  | Notes |
|--------------------------|------------------------------|------------------|----------|-------|
| `TRIPLE_DROP`            | `email-drafter`              | `outreach`       | urgent   | HOLD-FOR-REVIEW; consider owner signature |
| `BIG_SPENDER_GONE_QUIET` | `email-drafter`              | `outreach`       | urgent   | Owner-signed; always HOLD-FOR-REVIEW |
| `RECENCY_DROP_TRADE`     | `email-drafter`              | `outreach`       | high     | Optionally pair with `vendor-cascade` |
| `RECENCY_DROP_DESIGNER`  | `email-drafter`              | `outreach`       | medium   | Showroom event hook OK |
| `RECENCY_DROP_CONSUMER`  | `email-drafter`              | `outreach`       | medium   | Klaviyo-tone, lower personalization |
| `FREQUENCY_HALVED`       | `vendor-cascade` → `email-drafter` | `follow-up` | medium   | SKU concentration check first |
| `MONETARY_DROP`          | `email-drafter`              | `quote-revival` or `follow-up` | medium | Branch on open-quote presence |
| `NEW_AT_RISK`            | `email-drafter`              | `outreach`       | low      | "Welcome to the second order" hook |

---

## Action-queue contract

Each flagged customer becomes one PROPOSED row in the `action-queue` table with this payload shape:

```json
{
  "kind": "retention",
  "customer_id": "uuid",
  "reason_code": "TRIPLE_DROP",
  "secondary_codes": ["FREQUENCY_HALVED", "MONETARY_DROP"],
  "suggested_skill": "email-drafter",
  "type_tag": "outreach",
  "urgency": "urgent",
  "rfm_snapshot": {
    "recency_days": 218,
    "freq_baseline_365": 8,
    "freq_last_90": 0,
    "monetary_baseline_365": 14200.00,
    "monetary_last_90": 0.00
  },
  "proposed_at": "ISO8601",
  "expires_at": "ISO8601 (proposed_at + 7d default)",
  "status": "PROPOSED"
}
```

Michael approves in `action-queue` → status flips to `APPROVED` → downstream skill (`email-drafter`) executes.

---

## Anti-patterns

- **Never** assign multiple primary reason codes to a single customer. Pick one per the priority order, store the rest in `secondary_codes`.
- **Never** route `BIG_SPENDER_GONE_QUIET` to a Klaviyo flow. That's a $5K+-lifetime customer — the intervention is hand-written, owner-signed, paste-ready, not an automated drip.
- **Never** route `FREQUENCY_HALVED` directly to `email-drafter` without first checking SKU concentration via `vendor-cascade`. If the cause is vendor-side, an outreach email is the wrong response.
- **Never** invent a reason code. New codes require an Edit to this file first, then a corresponding Edit to SKILL.md Step 3.
