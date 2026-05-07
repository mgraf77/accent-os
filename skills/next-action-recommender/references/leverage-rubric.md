# next-action-recommender — Leverage Rubric

> Tunable. Edit weights freely; the recommender reads this at run time. Modeled on `skills/gap-optimizer/references/scoring-rubric.md` but tuned for daily action ranking, not skill-roadmap selection.

## Composite formula

```
leverage = (Impact × Time-sensitivity) ÷ (Effort × Blocked-by-penalty)
```

Each of `Impact`, `Time-sensitivity`, `Effort` is a 1–5 integer.
`Blocked-by-penalty` is a multiplier: `1` (clean / Michael-only) or `2` (waiting on someone external).

Composite range: `0.04` (worst — `1×1 ÷ 5×2`) → `25.0` (best — `5×5 ÷ 1×1`).

### Why this shape, not gap-optimizer's

Gap-optimizer scores skill candidates over weeks-of-build; here we score actions over hours-of-work. So:

- **Impact × Time-sensitivity** in numerator (compounds — a $50K-at-risk deal that closes today is much more leveraged than the same deal closing in 90d)
- **Effort × Blocked-by-penalty** in denominator (a 4h job waiting on a vendor reply has the same effective effort as an 8h job that's unblocked)
- **Frequency** is omitted — every action is a one-shot today; the multi-day daily-brief loop captures recurrence at the meta level
- **Buildability** is omitted — actions don't need to be "built," they're already structured by the source row

A typical "ship-now" action lands at 8–15. A 20+ score means "drop everything." A <2 score should not appear in the top-3 — if it does, the candidate pool was empty (acceptable) or the scoring is mis-calibrated (re-check).

---

## Impact (1–5) — business-impact magnitude

| Score | Meaning | Signal |
|-------|---------|--------|
| 5 | $10K+ revenue at risk OR full critical-path M-task unblock OR >5h/week saved | Named deal at-risk, M-task with ≥3 "Unlocks:" entries, or a KPI deviation breaching critical band |
| 4 | $1K–$10K revenue at risk OR M-task with 1–2 unblocks OR 1–5h/week saved | Mid-size deal stall, single-unblock M-task, or HIGH-severity alert |
| 3 | <$1K revenue OR ops improvement OR 1h/week saved | Vendor score delta on a top-20 vendor, MEDIUM alert, or `action_queue` PROPOSED with named ROI |
| 2 | Risk class only — no quantifiable upside but eliminates a future failure mode | Risk register entries, schema-contract test failures with no current data corruption |
| 1 | Quality-of-life only | Cleanup, doc-drift fix, single-vendor metadata polish |

**Rule of thumb:** if the candidate has an explicit dollar figure attached (deal `value_usd`, vendor co-op claim amount, KPI tied to revenue), use the table above with that figure. If no dollar figure, score Impact ≤2 and document the reason in the `expected:` output field.

---

## Time-sensitivity (1–5) — when does this stop mattering

| Score | Meaning | Signal |
|-------|---------|--------|
| 5 | Today — drops to 0 if missed (deal closes / deadline passes / window shuts) | "deadline today", co-op claim window expiring, customer waiting on response right now |
| 4 | This week — value decays meaningfully by EOW | Deal at risk, alert with a 7d auto-escalation, KPI deviation that compounds |
| 3 | This month — value decays slowly | M-task that unblocks Q-end work, vendor onboarding that's blocking next month's PO |
| 2 | This quarter — strategic but not urgent | Vendor risk register additions, M-task that's nice-to-have for Q+1 |
| 1 | Whenever — no decay | Cleanup, stylistic fixes, non-binding doc updates |

**Default to 3** when no decay signal exists. Override upward only with an explicit date or named decay condition (e.g. "deal stage hasn't moved in 14d → escalation tier").

---

## Effort (1–5) — Michael time required

| Score | Meaning | Time |
|-------|---------|------|
| 1 | One click / one paste — under 15 minutes | Approve a queued action, click a Daily Command Center alert, paste an SQL file |
| 2 | Focused 1-hour task | One email reply, one vendor cascade trace, one M-task that's self-contained SQL |
| 3 | Half-day | M-tasks requiring credential setup + verification, multi-vendor outreach batch, full deal triage |
| 4 | Full day | Cross-system integration unlock, complex M-task with 3+ steps |
| 5 | Multi-day | Architectural refactor, vendor re-onboarding wave, KPI catalog overhaul |

**Numerator-denominator guard:** denominator counts `Effort` directly — so doubling the time required halves the leverage. This is intentional: at AccentOS scale, Michael's hour is the bottleneck.

---

## Blocked-by-penalty (1 or 2) — external dependency

| Value | Meaning |
|-------|---------|
| 1 | Michael can act now — no external waiting | M-task purely Michael-side, alert that's actionable directly, deal where Michael is the next-mover |
| 2 | Action is waiting on a third party — vendor, Google, BC, customer | "Wait for vendor X to send file", M-task pending Google credential approval, deal stalled on customer's side |

**Why a flat 2× penalty, not a gradient:** in practice, "waiting on someone else" actions either move (1×, full leverage) or they don't (in which case any leverage estimate is meaningless). The 2× penalty gracefully demotes "waiting" actions without zeroing them out — they still land in BLOCK 2 (runners-up) where they belong.

If `Blocked-by = 2`, also write a note in BLOCK 1: "blocked-by: [named party]".

---

## Worked examples

### Example 1 — High-leverage M-task

```
Candidate: M06 — Google Search Console credentials
Source: BUILD_PLAN_MICHAEL.md "Unlocks: gsc-insights, gmc-feed-audit live mode"
Impact: 4              (unblocks 2 skills; ~$5–10K Google Shopping revenue gated on it)
Time-sensitivity: 4    (compounding — every week without it is missed audit data)
Effort: 1              (one OAuth flow, ~15 min)
Blocked-by-penalty: 1  (Michael-side)
leverage = (4 × 4) ÷ (1 × 1) = 16.0  →  TOP-3
first_step: "Open `sql/M06_*.md`, follow the OAuth instructions, paste credentials into Supabase Vault."
```

### Example 2 — Stalled deal

```
Candidate: deal_id=8821 ($24K, stage="Quoted", 18d at stage)
Source: deals table stall query
Impact: 5              ($24K revenue at risk)
Time-sensitivity: 4    (stall-decay curve says 70% close-rate at 14d → 35% at 30d)
Effort: 1              (15-min "still alive?" email)
Blocked-by-penalty: 1  (Michael writes it)
leverage = (5 × 4) ÷ (1 × 1) = 20.0  →  TOP-3
first_step: "Open BC store-cwqiwcjxes deal/8821, reply with the 'still alive?' template from skills/email-drafter."
```

### Example 3 — Demoted because external-blocked

```
Candidate: vendor_score delta vendor_id=147 (composite dropped 0.18)
Source: vendor_scores 7d delta query
Impact: 3              (top-20 vendor; co-op pipeline implications)
Time-sensitivity: 3    (this-month decay)
Effort: 2              (1h cascade trace + vendor outreach)
Blocked-by-penalty: 2  (need vendor's response)
leverage = (3 × 3) ÷ (2 × 2) = 2.25  →  RUNNER-UP (BLOCK 2)
note: "blocked-by: vendor_147 sales rep response"
```

### Example 4 — Quality-of-life cleanup

```
Candidate: doc-drift in BUILD_PLAN_CLAUDE.md (3 [x] markers don't match commits)
Source: doc-drift skill output
Impact: 1              (no business risk)
Time-sensitivity: 1    (no decay)
Effort: 1              (15 min)
Blocked-by-penalty: 1
leverage = (1 × 1) ÷ (1 × 1) = 1.0  →  excluded from top-3
```

---

## Tie-breakers

When two candidates share the same leverage score:

1. Higher **Impact** wins (the bigger thing matters more, even at equal leverage)
2. Then earlier `time_sensitive_until` (closer-to-expiry first)
3. Then lower **Effort** (cheap-and-good beats expensive-and-good at parity)
4. Then alphabetical by `id` (deterministic, reproducible across runs)

Document the tie-break path in BLOCK 0 if it fired (e.g. "Tie at #2/#3 broken on Impact").

---

## Calibration

The rubric is designed so that on a typical day:
- 1–2 candidates score ≥15 (the obvious top picks)
- 3–6 candidates score 6–14 (the runners-up)
- the rest score <6 (excluded)

If after 5 runs the top-3 consistently score >20 or <5, recalibrate dimension definitions — don't change the formula. Calibration history goes in `run-log.md` next to the candidate list.

If the same candidate scores >15 for 3 runs and Michael never approves it (`approved-by-michael: none`), demote it: subtract 1 from its computed Impact next run, log the override. This is the feedback loop that tunes the rubric to Michael's actual revealed priorities, not just stated ones.

---

## Why these dimensions, not others

Considered and rejected:

- **Reversibility** — irrelevant for daily actions; nothing here is irreversible at the action level
- **Confidence in source data** — implicitly captured in Impact (low-confidence data forces Impact ≤2 by the "no quantifiable" rule)
- **Strategic alignment** — captured in Impact via the M-task `Unlocks:` annotation, which itself maps to MASTER §14
- **Michael's stated mood / energy** — out of scope; this rubric scores the action, not the actor

Keep the formula stable. Re-running with shifted weights breaks the `run-log.md` approval-rate signal, which is the only mechanism that auto-tunes the recommender over time.
