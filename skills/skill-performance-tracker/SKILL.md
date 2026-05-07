---
name: skill-performance-tracker
description: >
  AccentOS skill-ecosystem performance auditor. Aggregates per-skill USAGE
  and OUTCOME metrics across sessions — match rate (harness considered
  invoking), invocation rate (skill actually ran), token-savings estimate,
  user-satisfaction proxy (re-runs / undos / complaints in same session),
  staleness, and quality signal from skill-eval-suite pass rates. Sources
  data from skills/efficiency-monitor/ logs, PROMPT_LOG.md, git log, and
  skills/_index.md. Produces three ranked Markdown reports — leaderboard
  (top-10 best performers), underperformers (bottom-10 by either rate or
  satisfaction), and opportunity (skills with high match-rate but low
  invocation = harness considered but bypassed). Last-30-vs-prior-30 day
  trend arrows on every metric. Use this skill when Michael says: "skill
  performance", "leaderboard", "which skills are working", "underperforming
  skills", "skill stats", "skill ROI", "/skill-perf", or any phrasing that
  asks how the skill ecosystem is performing in usage terms. Distinct from
  skill-health-monitor (structural audit) and efficiency-monitor (in-session
  signals) — this is cross-session usage rollup. Always produces three
  report blocks with sparkline trend arrows — never returns prose-only.
---

# skill-performance-tracker

**Purpose:** Skills only earn their keep if Michael actually uses them and they save time when invoked. This skill measures both — invocation usage and outcome quality — across sessions, then surfaces winners (replicate the pattern), losers (deprecation candidates), and the silent-killer category: skills the harness considered but bypassed (something is mismatched between trigger surface and real Michael phrasing).

This is the **performance** counterpart to:
- `skill-health-monitor` — STRUCTURAL audit (broken refs, frontmatter rot, duplicates)
- `efficiency-monitor` — IN-SESSION observer (live signals during one session)
- `skill-eval-suite` — QUALITY tests (does the skill produce correct output?)

```
efficiency-monitor (live)  →  skill-performance-tracker (rollup)  →  gap-optimizer (act on it)
                                          ↕
                                skill-health-monitor (cleanup)
                                skill-eval-suite (quality probe)
```

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "skill performance"
- "leaderboard" / "skill leaderboard"
- "which skills are working" / "which skills are dead"
- "underperforming skills" / "underperformers"
- "skill stats" / "skill ROI" / "skill metrics"
- "/skill-perf" / "/skill-performance"
- "harness considered but bypassed" / "high match low invocation"
- "skill-perf for [skill name]" — single-skill drill-down

Also run automatically:
- Weekly via `daily-brief-composer` Friday digest (leaderboard top-3 surfaced in the brief)
- After every `skill-forge` commit lands (snapshot before/after to credit/debit the new skill)
- When `gap-optimizer` requests a "deprecation-candidate scan" for queue-aging logic

---

## Scope

**In scope:**
- Cross-session aggregation of per-skill metrics from `efficiency-log.md`, `PROMPT_LOG.md`, `SESSION_LOG.md`, `git log`
- Three reports: leaderboard, underperformers, opportunity
- 30-day vs prior-30-day trend arrows on each metric
- Per-skill drill-down on request (`skill-perf for [name]`)

**Out of scope — fail fast with a one-line redirect:**
- Building a new skill → "Use `skill-forge`."
- Auditing structural health (broken refs, dups) → "Use `skill-health-monitor`."
- Generating regression test cases → "Use `skill-eval-suite`."
- Deciding what to build next → "Use `gap-optimizer`."
- Live in-session inefficiency tracking → "`efficiency-monitor` does that automatically."

---

## Step 0 — Preflight

Run these in parallel:

1. **Enumerate all skills** — `ls /home/user/accent-os/skills/` (excluding `_*.md`, `_deprecated/`). Collect skill names from directory listing.
2. **Read the skill registry** — `/home/user/accent-os/skills/_index.md`. Build the canonical name set.
3. **Read efficiency-monitor logs** — last 60 days from `/home/user/accent-os/skills/efficiency-monitor/efficiency-log.md`. Parse session blocks, extract `skill-bypass` (matched-skill cited) and any explicit invocation references.
4. **Read PROMPT_LOG.md** — last 60 days. Each session entry is a date-headed block. Search for `/skill-name` slash invocations and natural-language matches against `_index.md` triggers (apply Jaccard ≥0.6 on trigger phrases).
5. **Read git log** — `git -C /home/user/accent-os log --since="60 days ago" --pretty=format:"%h %ad %s" --date=short`. Skill-related commits (paths under `skills/`) are activity proxies for the skill being touched.
6. **Read skill-eval-suite results** — for each skill, check `skills/[name]/promptfooconfig.yaml` and `skills/[name]/eval-results.json` if present. Last pass-rate becomes the `quality_signal` per skill.
7. **Capture branch state** — `git -C /home/user/accent-os branch --show-current`.

Output of Step 0: one-line preflight: "tracking N skills over last 60 days; M sessions parsed; K invocations detected; L skills with eval results."

If `efficiency-log.md` does not exist or contains zero sessions, return this stub and exit:

> ⚠ skill `skill-performance-tracker` cannot run — no `efficiency-log.md` data to aggregate. Wait for ≥3 sessions of efficiency-monitor activity, then re-run.

---

## Step 1 — Compute per-skill metrics

For each skill in the registry, compute the six metrics defined in `references/metrics.md`. Quick reference:

| Metric | Source | Formula |
|---|---|---|
| `match_rate` | `efficiency-log.md` skill-bypass + invocations | (sessions where skill matched a trigger) / (total sessions in window) |
| `invocation_rate` | `PROMPT_LOG.md` slash-cmds + `efficiency-log.md` invocations | (sessions where skill ran) / (sessions where skill matched a trigger) |
| `token_savings_estimate` | efficiency-monitor heuristic | invocations × steps-in-skill × 30s × token-per-min(≈600) |
| `user_satisfaction_signal` | `efficiency-log.md` retry-loop / redone-wip / `PROMPT_LOG.md` undo phrases | 1.0 − (negative_signals_in_skill_session / total_skill_sessions) |
| `staleness` | last-invocation date | days since most recent invocation |
| `quality_signal` | skill-eval-suite pass rate | last `eval-results.json` pass-percentage; null if no eval suite |

Window: last 30 days (current period) + prior 30 days (trend baseline). Compute each metric for both windows. Trend arrow:
- `↑` current > prior by ≥10%
- `↓` current < prior by ≥10%
- `→` within ±10% (stable)
- `·` insufficient data in either window

Per-skill row collected into the in-memory `skills` table.

---

## Step 2 — Compose the LEADERBOARD report

Top-10 skills, sorted by composite score:

```
composite = (match_rate × 0.30)
          + (invocation_rate × 0.30)
          + (user_satisfaction_signal × 0.20)
          + (token_savings_estimate_normalized × 0.15)
          + (quality_signal_or_0.5 × 0.05)
```

Render as a Markdown table with trend arrows:

```
═══ BLOCK 1: LEADERBOARD (top 10 by composite score, last 30d) ═══

| # | Skill | Match | Inv | Sat | TokSv | Qual | 30d Trend |
|---|-------|-------|-----|-----|-------|------|-----------|
| 1 | bc-business-review     | 95% ↑ | 92% ↑ | 0.95 → | 8.4k ↑ | 100% → | strong |
| 2 | vendor-cascade         | 87% → | 85% → | 0.92 → | 6.1k → | 95%  ↑ | strong |
| ... |
```

Header semantics:
- `Match` = match_rate, `Inv` = invocation_rate, `Sat` = user_satisfaction_signal
- `TokSv` = token_savings_estimate, `Qual` = quality_signal (`—` if no eval suite)
- `30d Trend` band: **strong** (composite >0.75), **steady** (0.5–0.75), **weak** (<0.5)

---

## Step 3 — Compose the UNDERPERFORMERS report

Bottom-10 skills meeting at least one of:
- match_rate <20% AND staleness >30 days
- invocation_rate <50% (matched but rarely run when matched)
- user_satisfaction_signal <0.7 (user friction in recent runs)

Sort by inverse composite (worst first). Same table shape as Step 2, but add a `Likely cause` column:

```
═══ BLOCK 2: UNDERPERFORMERS (bottom 10 by composite, last 30d) ═══

| # | Skill | Match | Inv | Sat | Stale | Likely cause |
|---|-------|-------|-----|-----|-------|--------------|
| 1 | rep-group-matchmaker | 0%  · | n/a · | n/a · | 89d | never invoked since shipped |
| 2 | demand-forecaster    | 8%  ↓ | 50% ↓ | 0.5 ↓ | 42d | trigger phrases mismatched |
| ... |

Recommended actions per row:
  - 0 invocations + ≥60d stale → consider deprecation (route via skill-health-monitor)
  - low Sat + high Match → quality regression; route to skill-eval-suite
  - low Match + recent skill → trigger phrases mismatched; route to gap-optimizer for re-mining
```

Hard rule: NEVER auto-deprecate. Surface as a candidate; the actual deprecation flow belongs to `skill-health-monitor`.

---

## Step 4 — Compose the OPPORTUNITY report

Skills where match_rate ≥40% but invocation_rate <50% — the harness considered invoking them but the user (or Claude on the user's behalf) bypassed. Almost always a signal that:
- The trigger surface matches but the skill's actual workflow doesn't fit the request, OR
- A faster/older path was used out of habit, OR
- The skill has a perceived friction (long preflight, eval-gate, etc.)

```
═══ BLOCK 3: OPPORTUNITY (high match, low invocation, last 30d) ═══

| # | Skill | Match | Inv | Bypass-to | Hypothesis |
|---|-------|-------|-----|-----------|------------|
| 1 | gmc-feed-audit       | 60% ↑ | 30% ↓ | manual SQL | preflight too heavy; check Step 0 |
| 2 | priority-articulation| 55% → | 25% → | bottleneck-finder | scope overlap; route to skill-health-monitor for merge eval |
| ... |

For each row:
  - "Bypass-to" = which alternative was used instead (mined from same-session efficiency-log entries that cite the matched-skill but show the work being done elsewhere)
  - "Hypothesis" = one-sentence pattern for Michael to verify
  - Auto-suggest: "route to gap-optimizer for trigger-mining" OR "route to skill-health-monitor for merge-eval"
```

---

## Step 5 — Output report

Single console block, three sub-blocks (Leaderboard, Underperformers, Opportunity) plus footer:

```
═══ SKILL-PERFORMANCE REPORT — YYYY-MM-DD HH:MM ═══
Branch: [branch] | Window: last 30d vs prior 30d | Skills tracked: N | Sessions parsed: M

[BLOCK 1: LEADERBOARD table]

[BLOCK 2: UNDERPERFORMERS table]

[BLOCK 3: OPPORTUNITY table]

═══ FOOTER ═══
Suggested follow-up actions:
  - "skill-perf for [name]" → drill-down on a specific skill
  - "skill-perf save"        → write report to skills/skill-performance-tracker/reports/YYYY-MM-DD.md
  - "deprecation-candidates" → forward UNDERPERFORMERS bottom-3 to skill-health-monitor for review
  - "trigger-rescue [name]"  → forward an OPPORTUNITY-row skill to gap-optimizer for trigger remining

I am stopping here. Nothing is modified until you reply.
═══════════════════════════════════════════════
```

If Michael runs `skill-perf save`, write the report to `skills/skill-performance-tracker/reports/[YYYY-MM-DD].md` and `git add` it. Otherwise the report is console-only.

If Michael runs `skill-perf for [name]`, skip Steps 2–4 and instead emit a single-skill drill-down per `references/per-skill-template.md`.

---

## Step 6 — Persist the snapshot

Always (on every run) append a snapshot row to `skills/skill-performance-tracker/snapshots.csv`:

```csv
date,skill,match_rate,invocation_rate,user_satisfaction,token_savings,staleness_days,quality_signal,composite
2026-05-07,bc-business-review,0.95,0.92,0.95,8400,1,1.00,0.91
2026-05-07,vendor-cascade,0.87,0.85,0.92,6100,3,0.95,0.86
...
```

`gap-optimizer` reads this CSV when computing its B-axis (boost/blocking) score. `daily-brief-composer` reads the latest snapshot for the Friday digest leaderboard top-3 surface. Schema lives in `references/snapshots-schema.md`.

The snapshot append is the one always-on side effect — even if Michael doesn't request `save`. Keeps the longitudinal record intact for trend computation.

---

## Output format

See Step 5 for the report shape. Files this skill writes:

- `skills/skill-performance-tracker/snapshots.csv` — append-only longitudinal record (every run)
- (optional, on `skill-perf save`) `skills/skill-performance-tracker/reports/YYYY-MM-DD.md` — saved report
- `skills/skill-performance-tracker/last-run.md` — overwrites with the most recent report (consumed by `daily-brief-composer`)

---

## AccentOS context

- Stack: AccentOS skill ecosystem itself; reads `skills/`, `PROMPT_LOG.md`, `SESSION_LOG.md`, `git log`. No Supabase / BigCommerce / Cloudflare write paths.
- Project: AccentOS (the skill ecosystem is the audit subject)
- Paths: `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`)
- Registry: `skills/_index.md`
- Data sources: `skills/efficiency-monitor/efficiency-log.md`, `PROMPT_LOG.md`, `git -C /home/user/accent-os log`
- Companion skills:
  - `efficiency-monitor` (DATA SOURCE — provides match/invocation/skill-bypass signals)
  - `skill-health-monitor` (COMPOSES — performance + structural health together; routes deprecation candidates)
  - `skill-eval-suite` (QUALITY SOURCE — provides pass-rate for quality_signal)
  - `gap-optimizer` (CONSUMER — low performers are deprecation candidates; high-match-low-invocation skills are trigger-mining candidates)
  - `daily-brief-composer` (CONSUMER — Friday digest surfaces top-3 leaderboard)

---

## Anti-patterns

- **Never** auto-deprecate a skill based on poor performance metrics. Always route through `skill-health-monitor`'s PROPOSE-DEPRECATION flow with Michael's explicit approval.
- **Never** auto-edit a SKILL.md based on performance findings. Performance data informs decisions; decisions belong to humans.
- **Never** treat a low quality_signal as authoritative if eval-results.json is older than 30 days. Surface as `qual: ⚠ stale` instead.
- **Never** produce prose-only output. The three report blocks are mandatory; an empty block renders as `(no skills meet criteria)` rather than being omitted.
- **Never** double-count a skill invocation that appears in both `PROMPT_LOG.md` (Michael typed `/name`) and `efficiency-log.md` (efficiency-monitor logged it). Use `efficiency-log.md` as the canonical source; PROMPT_LOG only fills gaps where efficiency-monitor missed an entry.
- **Never** flag a "scheduled-cadence" skill (e.g. `vendor-risk-register` quarterly) as stale based on calendar days alone. Honor the same schedule-aware logic `skill-health-monitor` uses — read the skill's frontmatter for cadence hints before flagging.
- **Never** run silently with no output. Always produce the three blocks + footer, even if all metrics are zero (signals "no data yet, run more sessions").
- **Never** overwrite `snapshots.csv` — always append. Trend computation requires longitudinal history.
