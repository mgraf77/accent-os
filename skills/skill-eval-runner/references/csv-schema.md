# run-history.csv schema

> Append-only longitudinal record for skill-eval-runner. One row per skill per run. Consumed by skill-performance-tracker (latest row per skill → quality_signal) and gap-optimizer (3-consecutive-low-pass-rate → deprecation candidate).

## Columns

| Column | Type | Source | Notes |
|---|---|---|---|
| `run_at` | ISO 8601 timestamp (UTC) | runner clock at Step 0 | Identifies the run. All rows from one run share this timestamp. |
| `branch` | string | `git branch --show-current` | Useful for filtering main vs feature-branch runs. |
| `commit` | string (7-char short SHA) | `git rev-parse --short HEAD` | Cross-reference to the SKILL.md state at eval time. |
| `model` | string | resolved in Step 0 | e.g. `claude-sonnet-4-6` or env override. |
| `skill` | string (kebab-case) | directory name | Canonical identifier; matches `skills/_index.md`. |
| `total_cases` | int | count(status in {pass, fail}) | Excludes `error` and `skipped:*`. |
| `pass_count` | int | count(status = pass) | |
| `fail_count` | int | count(status = fail) | |
| `error_count` | int | count(status = error) | Rate-limit, timeout, runner-side noise. |
| `skipped_count` | int | count(status startswith `skipped:`) | YAML parse / schema issues. |
| `pass_rate` | float | pass_count / total_cases | Empty string if total_cases = 0. |
| `duration_sec` | int | wall-clock time for this skill's cases | Used by gap-optimizer to flag slow eval suites. |
| `prior_pass_rate` | float | last row for this skill, prior to this run | Empty string on first run for the skill. |
| `trend` | enum | `UP` / `DOWN` / `FLAT` / `NEW` | UP/DOWN threshold = ±5pp; NEW = no prior row. |

## Append rules

- One row per `(run_at, skill)`. Never two rows for the same skill in the same run — concurrency guard via `.run.lock`.
- Header row written once on file creation. Subsequent runs append data rows only.
- Never edited or overwritten. Trend computation is destroyed if rows are mutated.
- Empty file (header only, zero data rows) is a valid first-run state.

## Consumers (read-only)

- **skill-performance-tracker** — reads the latest row per skill for `quality_signal` column in its leaderboard / underperformers reports.
- **gap-optimizer** — reads the last 3 runs per skill; any skill with pass_rate <0.30 across 3 consecutive runs is a deprecation candidate routed to skill-health-monitor.
- **daily-brief-composer** — reads the latest run's `trend = DOWN` rows for the Friday digest regression band.
- **skill-health-monitor** — composes structural health + this CSV's behavioral pass-rate when ranking deprecation candidates.

## Example

```csv
run_at,branch,commit,model,skill,total_cases,pass_count,fail_count,error_count,skipped_count,pass_rate,duration_sec,prior_pass_rate,trend
2026-05-08T14:32:00Z,claude/accentos-gap-analysis-Dcvcf,a1b2c3d,claude-sonnet-4-6,vendor-cascade,8,5,3,0,0,0.625,42,0.875,DOWN
2026-05-08T14:32:00Z,claude/accentos-gap-analysis-Dcvcf,a1b2c3d,claude-sonnet-4-6,bc-business-review,7,7,0,0,0,1.000,38,1.000,FLAT
2026-05-08T14:32:00Z,claude/accentos-gap-analysis-Dcvcf,a1b2c3d,claude-sonnet-4-6,gmc-feed-audit,6,4,2,1,0,0.667,55,,NEW
```
