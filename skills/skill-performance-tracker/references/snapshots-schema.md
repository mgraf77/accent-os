# skill-performance-tracker — snapshots.csv Schema

> Append-only longitudinal record. One row per skill per run. `gap-optimizer` and `daily-brief-composer` read this file. Do not rewrite or sort — the timeline matters.

---

## File path

`/home/user/accent-os/skills/skill-performance-tracker/snapshots.csv`

---

## Header row

```csv
date,skill,match_rate,invocation_rate,user_satisfaction,token_savings,staleness_days,quality_signal,composite
```

Columns:

| Column | Type | Range | Notes |
|---|---|---|---|
| `date` | ISO date | YYYY-MM-DD | the date the snapshot was computed |
| `skill` | string | kebab-case | matches directory name in `skills/` |
| `match_rate` | float | 0.0–1.0 | per `metrics.md` formula |
| `invocation_rate` | float | 0.0–1.0 OR `n/a` | `n/a` literal when no matches |
| `user_satisfaction` | float | 0.0–1.0 OR `n/a` | `n/a` literal when no invocations |
| `token_savings` | int | ≥0 | tokens (not k-suffixed in CSV) |
| `staleness_days` | int | ≥0 | days since last invocation |
| `quality_signal` | float | 0.0–1.0 OR `n/a` | from skill-eval-suite |
| `composite` | float | 0.0–1.0 | per `_thresholds.md` weights |

---

## Example rows

```csv
date,skill,match_rate,invocation_rate,user_satisfaction,token_savings,staleness_days,quality_signal,composite
2026-05-07,bc-business-review,0.95,0.92,0.95,8400,1,1.00,0.91
2026-05-07,vendor-cascade,0.87,0.85,0.92,6100,3,0.95,0.86
2026-05-07,demand-forecaster-skill,0.08,0.50,0.50,300,42,n/a,0.27
2026-05-07,rep-group-matchmaker,0.00,n/a,n/a,0,89,n/a,0.05
```

---

## Read patterns by consumers

### gap-optimizer
- Reads last N=30 days of snapshots.
- Aggregates per-skill mean composite. Skills with 30d-mean composite <0.3 → deprecation candidate (B-axis penalty when scoring).
- Skills appearing in OPPORTUNITY runs (high match, low invocation) → trigger-mining candidate.

### daily-brief-composer
- Reads only the latest snapshot date.
- Friday digest mode: surfaces top-3 by composite as the "skill leaderboard" sub-block.
- Other days: skipped.

### skill-health-monitor
- Reads snapshots when computing staleness fallback (preferred over its own git-log heuristic).
- Per-row `staleness_days` is authoritative.

---

## What NOT to put in this file

- Trend arrows (computed at render time, not stored)
- Free-text "likely cause" annotations (Step 3 column, not stored)
- Window comparison values (prior-30d delta — recomputable from CSV history)
- Per-skill drill-down detail (lives in reports/, not here)
- Reasons / hypotheses / human notes (also live in reports/)

The CSV is a numeric trail. Narrative belongs in `reports/YYYY-MM-DD.md`.

---

## Manual archival rule

When `snapshots.csv` exceeds 5000 lines:
1. `mv snapshots.csv snapshots-archive-YYYY-MM-DD.csv`
2. Re-emit header row to fresh `snapshots.csv`
3. Optionally seed with the last 30 rows for trend continuity

Surface the archive event as a one-line note in the next run's report footer.
