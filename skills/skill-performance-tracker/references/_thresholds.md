# skill-performance-tracker — Tunable Thresholds

> Edit these freely. SKILL.md Step 1 + Step 3 read these at run time. Mirrors `efficiency-monitor/_thresholds.md` shape for consistency.

---

## Window thresholds

| Threshold | Default | Notes |
|---|---|---|
| Current window | 30 days | the "now" frame |
| Prior window | 30 days (preceding current) | the trend baseline |
| Trend significance | ±10% | below this is `→` (stable) |

---

## Underperformer thresholds (Step 3)

A skill enters the UNDERPERFORMERS report if ANY of:

| Condition | Threshold |
|---|---|
| match_rate AND staleness | match_rate <20% AND staleness >30d |
| invocation_rate | invocation_rate <50% (matched but rarely run when matched) |
| user_satisfaction_signal | <0.7 (user friction) |

Bottom 10 sorted by inverse composite score.

---

## Opportunity thresholds (Step 4)

A skill enters the OPPORTUNITY report if ALL of:

| Condition | Threshold |
|---|---|
| match_rate | ≥40% (harness considered it often) |
| invocation_rate | <50% (but didn't actually run) |

Sorted by widest match-vs-invocation gap.

---

## Composite-score weights

| Component | Weight | Rationale |
|---|---|---|
| match_rate | 0.30 | being considered = trigger surface working |
| invocation_rate | 0.30 | actually running = end-to-end fit |
| user_satisfaction | 0.20 | output usable = quality of fit |
| token_savings | 0.15 | impact-per-run |
| quality_signal | 0.05 | structural correctness (low weight = many skills lack evals) |

---

## Imputation rules

| Missing metric | Imputed value | Reason |
|---|---|---|
| user_satisfaction (no invocations) | 0.5 (neutral) | don't penalize unrun skills |
| quality_signal (no eval suite) | 0.5 (neutral) | many skills lack evals |
| token_savings (no invocations) | 0 | savings only realized on invocation |
| match_rate (no data) | 0 | unmatched = unmatched |

---

## Schedule-aware staleness override

If skill's frontmatter description contains any of these cadence hints:
- "quarterly" → staleness multiplier 4.5×
- "monthly" → staleness multiplier 1.5×
- "weekly" → staleness multiplier 1.0× (default 30d still applies)
- "annual" / "yearly" → staleness multiplier 18×
- otherwise → 1.0× (default 30d)

`STALE` flag triggers at `staleness > (30 × multiplier)`.

---

## Token-savings calibration

| Constant | Value | Source |
|---|---|---|
| seconds saved per skill step | 30 | matches `efficiency-monitor/_thresholds.md` |
| Claude throughput | 600 tokens/min | rough; tune from real usage data |

If profiling shows different real throughput, tune this constant to keep `token_savings_estimate` honest.

---

## Cap on output

| Report | Max rows |
|---|---|
| Leaderboard | 10 |
| Underperformers | 10 |
| Opportunity | 10 |

---

## Reset behavior

- `snapshots.csv` never auto-rotated. Manual archive when >5000 lines.
- `last-run.md` overwritten each run.
- `reports/YYYY-MM-DD.md` written only on `skill-perf save` request; never auto-written.
