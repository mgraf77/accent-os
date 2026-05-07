# skill-performance-tracker — Metrics Definitions

> Canonical formulas for the six per-skill metrics computed in SKILL.md Step 1. All windows default to 30 days; trend baseline = prior 30 days. Edit thresholds here; SKILL.md reads them at run time.

---

## 1. `match_rate`

**Definition:** Fraction of sessions in the window where the harness considered invoking this skill (matched a trigger phrase from `_index.md` or saw a `/skill-name` slash invocation), regardless of whether it actually ran.

**Formula:**
```
match_rate = (sessions_with_match) / (total_sessions_in_window)
```

**Sources (in priority order):**
1. `skills/efficiency-monitor/efficiency-log.md` — `skill-bypass` entries cite `matched-skill: [name]`. Each is a match where the skill did NOT run.
2. `PROMPT_LOG.md` — slash-cmd usages (`/[name]`) and natural-language phrases that pass Jaccard ≥0.6 against the skill's `triggers` field in `_index.md`. Both count as matches.
3. `skills/efficiency-monitor/efficiency-log.md` — implicit invocation references in the session block (skill name appears in the "Notes" section or the work-done description).

**Edge case:** If the same session has both an explicit invocation AND a skill-bypass entry citing the same skill, count it as a match once (not double).

---

## 2. `invocation_rate`

**Definition:** Fraction of MATCHED sessions where the skill actually ran (i.e. produced its output, not just considered).

**Formula:**
```
invocation_rate = (sessions_invoked) / (sessions_with_match)
```

If `sessions_with_match == 0`, render as `n/a` (not 0%).

**Sources:**
1. `PROMPT_LOG.md` — `/skill-name` slash invocation explicit
2. `skills/efficiency-monitor/efficiency-log.md` — work attributed to skill (not bypass)
3. `git log` skill-related commits in window — proxy when other signals missing

**Edge case:** Skills with high invocation_rate but low match_rate are over-performers (every match converts but rarely matched). Surface in LEADERBOARD with annotation.

---

## 3. `token_savings_estimate`

**Definition:** Estimated tokens saved across the window vs the brute-force baseline (Claude doing the work without the skill).

**Formula:**
```
savings_per_invocation = steps_in_skill × 30 seconds × 600 tokens/min
                       = steps_in_skill × 300 tokens

token_savings_estimate = invocations_in_window × savings_per_invocation
```

`steps_in_skill` = count of `## Step N` headers in the skill's SKILL.md.

The 600 tokens/min coefficient is a rough Claude throughput baseline; tune via `_thresholds.md` if profiling data shows otherwise. The 30s/step is borrowed from `efficiency-monitor`'s time-saved heuristic to keep the two skills in agreement.

**Display:** Round to nearest 100 tokens, render with `k` suffix (e.g. `8.4k`).

---

## 4. `user_satisfaction_signal`

**Definition:** Proxy for whether Michael was satisfied with the skill's output — derived from absence of negative signals in the same session.

**Formula:**
```
negative_signals = count of:
  - retry-loop entries citing this skill, OR
  - redone-wip entries citing this skill, OR
  - PROMPT_LOG phrases like "undo", "redo", "that's wrong", "try again",
    "actually", "no, do it differently" — within 5 prompts of the skill invocation

user_satisfaction_signal = 1.0 - (negative_signals / sessions_invoked)
```

If `sessions_invoked == 0`, render as `n/a`.

**Caveats:**
- Proxy only. Real satisfaction = Michael saying "good" or not saying anything (no news = good news in this codebase). The negative-signal mining catches the opposite.
- Don't conflate with `quality_signal` (which is structural pass/fail from skill-eval-suite).

---

## 5. `staleness`

**Definition:** Days since the most recent invocation of this skill.

**Formula:**
```
staleness = (today - max(invocation_date)) in days
```

**Sources (in priority order):**
1. `skills/efficiency-monitor/efficiency-log.md` — most recent session block citing this skill
2. `PROMPT_LOG.md` — most recent slash invocation
3. `git log` for files inside `skills/[name]/` — last commit date, fallback only

**Display:** Integer days. `0` if invoked today.

**Schedule-aware override:** If the skill's frontmatter description contains a cadence hint (e.g. "quarterly", "weekly", "monthly"), the staleness threshold for `STALE` flagging is the cadence × 1.5 (e.g. quarterly = 90d × 1.5 = 135d, not the default 30d).

---

## 6. `quality_signal`

**Definition:** Pass-rate from the skill's most recent `skill-eval-suite` run.

**Formula:**
```
quality_signal = passed_test_count / total_test_count
```

**Sources:**
1. `skills/[name]/eval-results.json` (Promptfoo standard output) — `summary.numAsserts.pass / summary.numAsserts.total`
2. If file missing or older than 30d → `null` (render as `—` in tables)
3. If older than 30d but exists → `quality_signal_stale = true` flag — render as `XX% ⚠ stale`

**Caveat:** A null quality_signal is NOT a negative signal — many skills don't have eval suites yet. Don't penalize the composite score for nulls (use 0.5 as a neutral imputation per `_thresholds.md`).

---

## Composite score

```
composite = (match_rate × 0.30)
          + (invocation_rate × 0.30)
          + (user_satisfaction_signal_or_0.5 × 0.20)
          + (token_savings_estimate_normalized × 0.15)
          + (quality_signal_or_0.5 × 0.05)

token_savings_estimate_normalized = min(1.0, token_savings_estimate / 10000)
```

Weights tuned to favor matched + invoked + satisfied skills over high-token-saving but rarely-used skills. Tune in `_thresholds.md`.

---

## Trend arrows

For each metric, compare current 30d window to prior 30d window:

| Arrow | Condition |
|---|---|
| `↑` | current ≥ prior + 10% (relative) |
| `↓` | current ≤ prior − 10% (relative) |
| `→` | within ±10% (stable) |
| `·` | insufficient data in either window |

The arrow appears immediately after the value: `95% ↑`, `0.92 →`, `8.4k ·`.

---

## What's NOT a metric

- **Lines of code in the skill** — irrelevant to performance
- **Number of references/ files** — structural, belongs to skill-health-monitor
- **Time since last edit** — proxies for staleness but inferior to invocation date
- **Companion-link count** — doesn't predict actual usage
