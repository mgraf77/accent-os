# Deadline pattern grammar

> The string format `vendor_overrides.coop_deadline_pattern` uses, plus the parser logic Step 2 applies to derive concrete `period_start`, `period_end`, and `deadline` per vendor.

## Grammar

```
PATTERN := CADENCE ":" ANCHOR "+" CLAIM_WINDOW
        |  "calendar:" PERIOD_LIST ":" CLAIM_WINDOW
```

**CADENCE:**
- `quarterly` — four periods per calendar year (Q1 = Jan–Mar, Q2 = Apr–Jun, etc.)
- `semiannual` — two periods per year (H1 = Jan–Jun, H2 = Jul–Dec)
- `annual` — one period per year (FY = Jan–Dec, unless ANCHOR overrides)
- `monthly` — twelve periods per year (rare, but supported)

**ANCHOR:** the day the claim window opens, relative to a period boundary
- `end-of-quarter` — last day of the relevant quarter
- `end-of-month` — last day of the relevant month
- `dec-31` — December 31 of the period year
- `jun-30,dec-31` — semiannual list (one anchor per period)
- `mmm-dd` literal — e.g. `mar-31` for fiscal years that end March

**CLAIM_WINDOW:** how long after the anchor the claim deadline falls
- `30d` — 30 days
- `45d` — 45 days
- `60d` — 60 days

**PERIOD_LIST** (calendar variant only): explicit period names
- `Q1,Q2,Q3,Q4` — quarterly with no anchor (anchor implied as end-of-quarter)
- `Q1,Q3` — only odd quarters

## Parsing examples

| Pattern string | Period_start | Period_end | Deadline |
|---|---|---|---|
| `quarterly:end-of-quarter+30d` (today = 2026-05-07) | 2026-01-01 (Q1) | 2026-03-31 | 2026-04-30 → expired, advance to Q2: 2026-04-01 / 2026-06-30 / 2026-07-30 |
| `annual:dec-31+60d` (today = 2026-05-07) | 2025-01-01 | 2025-12-31 | 2026-03-01 → expired, advance to 2026 cycle: 2026-01-01 / 2026-12-31 / 2027-03-01 |
| `semiannual:jun-30+45d,dec-31+45d` (today = 2026-05-07) | 2026-01-01 (H1) | 2026-06-30 | 2026-08-14 |
| `calendar:Q1,Q2,Q3,Q4:claim-30d` (today = 2026-05-07) | 2026-01-01 | 2026-03-31 | 2026-04-30 → advance to Q2 |

## Period-advancement rule

If the deadline derived for the most-recent-completed period has already passed (i.e., `deadline < today`), advance to the next period whose **period_end has not yet passed** OR whose **deadline is still in the future**. This ensures the skill always returns a forward-looking claim window.

Pseudocode:

```python
period = most_recent_completed_period(pattern, today)
deadline = compute_deadline(period, pattern)
while deadline < today:
    period = next_period(period, pattern)
    deadline = compute_deadline(period, pattern)
return period, deadline
```

## Edge cases

- **Mid-period invocation** (today inside a not-yet-closed period): return the *current* period — eligible spend will be partial, but Michael may want to see the trajectory. Mark the draft `IN-PROGRESS` in Block 1.
- **Past-period catch-up** (Michael missed a deadline): if `coop_tracker` has no row for a past period that *should* have produced a claim, surface it on the watch list as `MISSED — claim no longer valid`. Do not generate a draft (the deadline has passed).
- **Multiple programs per vendor** (current schema doesn't support): document in `vendor_overrides.notes` and Michael handles via email-drafter directly. A `vendor_coop_programs` table is the future fix; this skill is not blocked on it.
- **Unknown pattern string**: fall back to "deadline unknown" — exclude from draft list, surface on watch list with reason `unparseable pattern: {string}`.
