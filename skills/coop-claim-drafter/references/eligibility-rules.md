# Eligibility & prioritization rules

> The math `coop-claim-drafter` Step 3 applies. Tunable thresholds live here so Michael can adjust without editing SKILL.md.

## Priority formula

For each vendor with computed `eligible_amount` and `days_until_deadline`:

```
priority_score = (1 / max(days_until_deadline, 1)) * eligible_amount
```

Sort the draft list descending by `priority_score`. This puts a $500 claim due in 3 days ahead of a $5,000 claim due in 60 days — deadline urgency dominates when timelines are tight, and money dominates when they aren't.

## Filter thresholds (configurable)

A vendor produces a draft only if **both** conditions are true:

| Threshold | Default | Override location |
|---|---|---|
| `deadline_threshold_days` | 30 | env `COOP_DRAFTER_DEADLINE_THRESHOLD` or Michael says "scan with [N]-day window" |
| `min_amount_threshold` | $500 | env `COOP_DRAFTER_MIN_AMOUNT` or Michael says "drop the floor to $[X]" |

Vendors that miss either threshold but have non-null co-op config go to the **watch list** (Block 2 in the output) — Michael sees them but no draft is generated.

## De-duplication rule

A claim is excluded from the draft list if `coop_tracker` already has a row matching:

```sql
SELECT 1 FROM coop_tracker
WHERE vendor_id = $1
  AND period_end = $2  -- the period_end derived from coop_deadline_pattern
  AND status IN ('submitted', 'claimed', 'paid');
```

This prevents re-drafting a claim Michael already submitted. If `status = 'open'` exists for the same `(vendor_id, period_end)`, the skill **updates** the existing row's `claim_amount` and `supporting_invoice_ids` instead of creating a duplicate.

## Eligible spend computation — what counts

`purchase_orders.status` filter: rows with `status IN ('received', 'invoiced', 'paid')` count toward eligible spend. Excluded: `cancelled`, `pending`, `disputed`.

**Why `received` counts:** vendor co-op programs typically accrue at PO-receipt, not invoice-payment. Some vendors require paid invoices only — that quirk lives in `vendor_overrides.notes` and the email-drafter's body acknowledges it.

**Why `disputed` is excluded:** a disputed PO might net out to zero spend; counting it inflates the eligible amount and risks an over-claim that has to be clawed back.

## Documentation parsing

`vendor_overrides.coop_documentation_required` is a JSONB array of strings. Each string is rendered as a checkbox line in the draft body. Common values:

| String | Meaning |
|---|---|
| `claim form` | Vendor's standard co-op claim PDF |
| `ad placement screenshots` | Print/digital ad proofs |
| `invoice copies` | PDF copies of supporting invoices |
| `proof of publication` | Letter from publication confirming run dates |
| `tear sheets` | Physical print clippings (less common, mostly legacy) |
| `digital analytics` | GA4 / Meta ads screenshots for digital co-op |
| `co-op pre-approval` | Pre-claim approval form (some vendors require) |

Unknown strings are passed through verbatim — no validation, no rejection.

## Risk-flag interaction

If `vendor-risk-register` flags a vendor as `at-risk`, the draft is still generated but tagged `HOLD-FOR-REVIEW: vendor-risk` in the queue payload. The reasoning block explains:

```
HOLD reasoning: vendor-risk-register flagged {vendor_name} as at-risk on {date} ({reason}).
Submitting a co-op claim during an active dispute can complicate settlement. Recommend
reviewing the dispute status before approving this claim. (Source: vendor-risk-register/{ref}.)
```

This skill never auto-suppresses an at-risk draft — Michael decides. Surfacing the risk is the contract.
