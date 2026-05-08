---
name: skill-eval-runner
description: >
  AccentOS skill-ecosystem behavioral test executor. Walks every
  /home/user/accent-os/skills/*/references/eval-cases.yaml file
  authored by skill-eval-suite, dispatches each test case as a
  prompt to the Anthropic API (model from ANTHROPIC_API_KEY env),
  applies the YAML's assertions (contains / contains-any /
  not-contains / regex / icontains), and records PASS/FAIL per case.
  Aggregates per-skill pass-rates, diffs against the last run in
  references/run-history.csv, and surfaces regressions ahead of
  green skills. Distinct from skill-eval-suite (the AUTHOR — generates
  eval-cases.yaml scaffolds) — this skill is the RUNNER (executes
  them on cadence). Does not define its own eval format; consumes
  ONLY skill-eval-suite's contract. Use this skill when Michael says:
  "run evals", "eval the skills", "evaluate the ecosystem",
  "regression check", "what's broken", "/eval", "/eval-run", "test
  all skills", "rerun the eval suite", "check skill regressions",
  "did anything break", "are the skills still passing", or any
  phrasing that asks the AccentOS ecosystem to be re-tested against
  its existing eval cases. Pairs with skill-performance-tracker
  (consumes run-history.csv as quality_signal), skill-health-monitor
  (composes structural + behavioral health), gap-optimizer (consumes
  high-fail-rate skills as deprecation candidates). Always writes
  one append-only row to references/run-history.csv per skill per
  run — never overwrites; never edits a SKILL.md based on findings;
  never authors new eval cases (that is skill-eval-suite's job).
---

# skill-eval-runner

**Purpose:** skill-eval-suite authors eval cases; without an executor those YAMLs are dead weight. This skill runs them on cadence, surfaces regressions, and feeds a longitudinal pass-rate stream to `skill-performance-tracker` so that AccentOS skill quality is measured, not asserted.

This is the **runner** half of the eval pair:

```
skill-eval-suite (AUTHOR — Wave 5A)
       │
       │ writes eval-cases.yaml under each skill
       ▼
skill-eval-runner (THIS SKILL — runs them)
       │
       │ writes run-history.csv (append-only)
       ▼
skill-performance-tracker (consumes pass-rate as quality_signal)
       │
       ▼
gap-optimizer (high-fail-rate skills → deprecation candidates)
```

The contract boundary is hard: this skill READS `eval-cases.yaml` and WRITES `run-history.csv`. It does NOT generate cases, edit cases, or modify any SKILL.md.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "run evals" / "run the evals" / "rerun evals" / "rerun the eval suite"
- "eval the skills" / "evaluate the ecosystem" / "test all skills"
- "/eval" / "/eval-run" / "/run-evals" / "/regression"
- "regression check" / "check skill regressions" / "did anything break"
- "what's broken" / "what just broke" / "any skills failing"
- "are the skills still passing" / "is the ecosystem green"
- "eval [skill-name]" / "run evals for [skill]" — single-skill mode
- "regression-only" / "only show me what's failing" — diff mode

Also run automatically:
- After every `skill-forge` commit lands (full ecosystem run, fresh-skill verification)
- After any `skill-eval-suite` commit lands (re-runs the freshly-authored cases)
- Weekly via `daily-brief-composer` Friday digest (regression band surfaced)
- When `gap-optimizer` requests a "quality-signal refresh" before its next deprecation pass

Do NOT run for:
- Generating new eval cases → `skill-eval-suite`
- Structural ecosystem audits (broken refs, dead companions) → `skill-health-monitor`
- Live in-session inefficiency tracking → `efficiency-monitor`
- Cross-session usage rollups → `skill-performance-tracker`

---

## Scope

**In scope:**
- Discovery of every `skills/*/references/eval-cases.yaml` in the AccentOS repo
- Per-case prompt dispatch to the Anthropic API (default model: claude-sonnet-4-6, override via env `EVAL_RUNNER_MODEL`)
- Assertion evaluation against the response (contains / contains-any / not-contains / not-contains-any / regex / icontains)
- Per-skill pass-rate, regression diff vs prior run, longitudinal CSV append
- Three modes: `run-all`, `run [skill-name]`, `regression-only`

**Out of scope — fail fast with a one-line redirect:**
- Authoring new eval cases → "Use `skill-eval-suite`."
- Editing `eval-cases.yaml` to fix a flaky case → "Edit via `skill-eval-suite`; this runner is read-only on inputs."
- Auto-deprecating a high-fail skill → "Surface to `skill-health-monitor` PROPOSE-DEPRECATION; never auto."
- Code-test execution → "Use the AccentOS test runner; skill-eval-runner is for skill behavior only."

---

## Step 0 — Preflight (gated)

Run these in parallel:

1. **Enumerate eval coverage** — glob `/home/user/accent-os/skills/*/references/eval-cases.yaml`. Build the candidate skill set. Expected ~18 skills as of Wave 5A.
2. **Verify the API key exists** — check `ANTHROPIC_API_KEY` env var is set and non-empty. If missing, return the BLOCKED stub below and exit.
3. **Resolve target model** — env `EVAL_RUNNER_MODEL` if set; else default `claude-sonnet-4-6`. Captured in the run header.
4. **Read run-history.csv** — `/home/user/accent-os/skills/skill-eval-runner/references/run-history.csv`. If absent, this is a first run; baseline diffs render as `NEW`.
5. **Read mode** — Michael's phrasing maps:
   - `run-all` (default) — every discovered skill
   - `run [name]` — single skill
   - `regression-only` — load last run from CSV; only execute skills whose last `fail_count > 0` OR whose YAML mtime is newer than its last run timestamp
6. **Capture branch + commit** — `git -C /home/user/accent-os branch --show-current` + `git -C /home/user/accent-os rev-parse --short HEAD`. Embedded in the run header for cross-reference with `skill-performance-tracker` snapshots.
7. **Lock file** — write `skills/skill-eval-runner/.run.lock` with current ISO timestamp + PID. If a lock <15 min old already exists, exit with the concurrent-run warning.

**Step 0 BLOCKED stub** (when prerequisites missing):

> Warning — skill `skill-eval-runner` is BLOCKED.
> Required: `ANTHROPIC_API_KEY` env var set.
> Optional: at least one `skills/*/references/eval-cases.yaml` (currently found: N).
> To unblock:
> 1. `export ANTHROPIC_API_KEY=...`
> 2. Run `skill-eval-suite` to author eval cases for any skill missing one (currently uncovered: [list]).
> Skill activates automatically once both pass.

**Failure-mode handling for Step 0:**

- **No `eval-cases.yaml` files found anywhere:** emit "Warning — zero eval coverage in the ecosystem. Route to `skill-eval-suite` to author cases for the top-3 skills by `skill-performance-tracker` invocation_rate." Exit without writing CSV.
- **YAML present but malformed** (parser error): mark that skill as `skipped: yaml-parse-error` in the report; continue with the rest. Never fail the whole run on one bad YAML.
- **YAML schema unexpected** (no `tests:` array, missing `vars:` or `assert:` per case): mark `skipped: yaml-schema-unsupported`; continue.
- **API rate-limit (HTTP 429) during a run:** exponential backoff (4s, 8s, 16s) up to 3 attempts per case. After 3, mark the case `error: rate-limited` (not `fail`) so the case is retryable on the next run without polluting trend data.
- **API auth failure (HTTP 401):** abort the entire run; surface "ANTHROPIC_API_KEY rejected" and emit no CSV row. Auth failure is global, not per-case.
- **Stale lock (>15 min):** clear and proceed. Emit footer note "stale lock cleared from PID [n]".

---

## Step 1 — Parse each skill's eval-cases.yaml

For every YAML in the candidate set, parse and validate:

| Field | Required | Notes |
|---|---|---|
| top-level `description:` | yes | run-header context; if missing, derive from skill name |
| `prompts:` array | yes | first entry is the file:// path to SKILL.md (the system prompt) |
| `providers:` array | optional | runner ignores; uses its own resolved model from Step 0 |
| `tests:` array | yes | one element per test case |
| `tests[*].description` | yes | passed through to report |
| `tests[*].vars.input` | yes | the user-message content sent to the model |
| `tests[*].assert[*].type` | yes | one of `contains`, `contains-any`, `not-contains`, `not-contains-any`, `regex`, `icontains` |
| `tests[*].assert[*].value` | yes | string for `contains`/`regex`; array for `*-any` variants |
| `tests[*].tags` | optional | used for filtering on `regression-only` mode |

If any required field is missing on a single test case, mark only that case `skipped: schema` and continue with the rest of the skill's cases.

Output of Step 1: in-memory `runs` table — one row per `(skill, case)` with `input`, `asserts`, and `status: pending`.

---

## Step 2 — Dispatch each case to the Anthropic API

For each pending row:

1. Build the request:
   - **System prompt:** the contents of `skills/[skill]/SKILL.md` (the file referenced in the YAML's `prompts[0]`)
   - **User message:** the YAML `tests[i].vars.input` string
   - **Model:** the one resolved in Step 0
   - **Max tokens:** 4096 (matches skill-eval-suite's default `defaultTest.options.provider.config.max_tokens`)
2. Call the API. Capture the assistant message text (concatenate all `text` blocks).
3. Persist response to in-memory cache for assertion evaluation in Step 3 — never re-dispatch a case in the same run.
4. Throttle: max 5 concurrent in-flight requests (avoids the per-org rate limit). Throttle is a soft semaphore; on 429 use the Step 0 backoff path.

Per-case timeout: 120 seconds. On timeout, mark `error: timeout`; never wedge the run on a single hung case.

---

## Step 3 — Apply assertions

For each case's `assert[*]`:

| Type | Pass condition |
|---|---|
| `contains` | response includes `value` (case-sensitive substring match) |
| `icontains` | response includes `value` (case-insensitive) |
| `contains-any` | response includes ≥1 element from the `value` array |
| `not-contains` | response does NOT include `value` |
| `not-contains-any` | response does NOT include ANY element from the `value` array |
| `regex` | response matches the `value` regex (Python `re.search`) |

A case PASSES only if **all** its assertions pass. Otherwise FAIL. Status `error` (rate-limit, timeout, schema) is its own bucket — never counted as PASS or FAIL in the pass-rate denominator.

**Per-case status taxonomy:**
- `pass` — all asserts pass; counts in pass-rate
- `fail` — at least one assert failed; counts in pass-rate denominator
- `error` — runner-side issue (rate-limit, timeout, parse); excluded from pass-rate, surfaced in report
- `skipped: yaml-parse-error | yaml-schema-unsupported | schema` — case never dispatched; flagged in report footer

---

## Step 4 — Aggregate per-skill pass-rate + diff vs last run

For each skill, compute:

```
total_cases    = count(status in {pass, fail})
pass_count     = count(status = pass)
fail_count     = count(status = fail)
error_count    = count(status = error)
skipped_count  = count(status startswith 'skipped:')
pass_rate      = pass_count / total_cases  (or NULL if total_cases = 0)
```

Diff against last run from `references/run-history.csv` (latest row per skill):

| Trend | Condition |
|---|---|
| `↑` | current pass_rate > prior pass_rate by ≥5pp |
| `↓` | current pass_rate < prior pass_rate by ≥5pp (REGRESSION) |
| `→` | within ±5pp |
| `NEW` | no prior row for this skill |

Regression band — any `↓` row gets surfaced in BLOCK 2 ahead of green skills.

---

## Step 5 — Render the report

Single console block, three sub-blocks plus footer:

```
═══ SKILL-EVAL RUN — YYYY-MM-DD HH:MM ═══
Branch: [branch] | Commit: [shortsha] | Model: claude-sonnet-4-6
Mode: run-all | Skills evaluated: N | Cases run: M | Total: P pass / F fail / E error / S skipped

═══ BLOCK 1: REGRESSIONS (skills with ↓ trend or fresh failures) ═══

| # | Skill | Cases | Pass | Fail | Pass-rate | Δ vs last | First failing case |
|---|-------|-------|------|------|-----------|-----------|--------------------|
| 1 | vendor-cascade        | 8 | 5 | 3 | 62%  | ↓ -25pp | "Edge — empty input" |
| 2 | gmc-feed-audit        | 6 | 4 | 2 | 67%  | ↓ -16pp | "Gotcha — feed lag"  |

═══ BLOCK 2: ALL SKILLS (sorted by pass-rate ascending) ═══

| # | Skill | Cases | Pass | Fail | Err | Pass-rate | Trend |
|---|-------|-------|------|------|-----|-----------|-------|
| 1 | vendor-cascade        | 8 | 5 | 3 | 0 | 62%  | ↓ |
| 2 | bc-business-review    | 7 | 7 | 0 | 0 | 100% | → |
| ... |

═══ BLOCK 3: COVERAGE GAPS (skills without eval-cases.yaml) ═══

| Skill | Status |
|-------|--------|
| churn-predictor       | yaml-schema-unsupported (no `tests:` array) |
| trade-vendor-portal   | NO eval-cases.yaml — route to skill-eval-suite |

═══ FOOTER ═══
Run-history: skills/skill-eval-runner/references/run-history.csv (appended N rows)
Suggested follow-ups:
  - "eval [skill]"          → re-run a single skill (faster cycle)
  - "regression-only"       → next run only re-evaluates ↓ skills
  - "trigger-rescue [skill]" → forward a high-fail skill to gap-optimizer for trigger remining
  - PROPOSE-DEPRECATION via skill-health-monitor for any skill at <30% pass-rate for 3 consecutive runs

I am stopping here. No SKILL.md is modified.
═══════════════════════════════════════════════
```

**Partial-output rules:**

- All three blocks emit even when empty. An empty BLOCK 1 renders `(no regressions detected)`.
- BLOCK 3 always lists skills in `/home/user/accent-os/skills/` that have NO `eval-cases.yaml` — coverage gap surface. Source: directory listing minus the discovered YAML set.
- If the entire run aborts (auth, no API key, lock collision), emit ONLY the run header + the abort reason. Do not emit empty blocks; do not write a CSV row.
- A successful run always writes one CSV row per evaluated skill in Step 6 — even if every case in that skill failed.

---

## Step 6 — Append to run-history.csv

After all blocks render, append one row per evaluated skill to `skills/skill-eval-runner/references/run-history.csv`:

```csv
run_at,branch,commit,model,skill,total_cases,pass_count,fail_count,error_count,skipped_count,pass_rate,duration_sec,prior_pass_rate,trend
2026-05-08T14:32:00Z,claude/accentos-gap-analysis-Dcvcf,a1b2c3d,claude-sonnet-4-6,vendor-cascade,8,5,3,0,0,0.625,42,0.875,DOWN
2026-05-08T14:32:00Z,claude/accentos-gap-analysis-Dcvcf,a1b2c3d,claude-sonnet-4-6,bc-business-review,7,7,0,0,0,1.000,38,1.000,FLAT
```

Schema lives in `references/csv-schema.md`. Append-only; never overwritten — `skill-performance-tracker` reads the latest row per skill for its `quality_signal` column.

Also overwrite `skills/skill-eval-runner/last-run.md` with the rendered Step-5 report (consumed by `daily-brief-composer` for the Friday digest).

Release the lock file last.

---

## Output format

See Step 5. Files this skill writes:

- `skills/skill-eval-runner/references/run-history.csv` — append-only longitudinal record (every run, every skill)
- `skills/skill-eval-runner/last-run.md` — overwrites with the most recent rendered report
- `skills/skill-eval-runner/.run.lock` — concurrency guard, removed at end

Files this skill READS (never writes):

- `skills/*/references/eval-cases.yaml` — input contract from skill-eval-suite
- `skills/*/SKILL.md` — system prompt for each test case
- `skills/_index.md` — registry consistency check (BLOCK 3 coverage gaps cross-reference)

---

## AccentOS context

- Stack: AccentOS skill ecosystem itself; reads `skills/`, calls Anthropic API via `ANTHROPIC_API_KEY`. No Supabase / BigCommerce / Cloudflare paths.
- Project: AccentOS (the skill ecosystem is the eval subject; Accent Lighting is the business owner)
- Paths: `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`)
- Model: default `claude-sonnet-4-6` (matches `skill-eval-suite`'s authored YAMLs); override via `EVAL_RUNNER_MODEL`
- Companion skills:
  - `skill-eval-suite` (AUTHOR — produces the input `eval-cases.yaml` files; this runner consumes them)
  - `skill-performance-tracker` (CONSUMER — reads `run-history.csv` latest row per skill for `quality_signal`)
  - `skill-health-monitor` (COMPOSES — structural health + this runner's behavioral pass-rate together)
  - `gap-optimizer` (CONSUMER — high-fail-rate skills surface as deprecation candidates)
  - `daily-brief-composer` (CONSUMER — Friday digest surfaces the regression band)

---

## Anti-patterns

- **Never** define a new eval-case format. The runner consumes ONLY `eval-cases.yaml` as authored by `skill-eval-suite`. If the format needs to evolve, edit `skill-eval-suite` first.
- **Never** edit a `eval-cases.yaml` file from this runner — read-only on input. Flaky case fixes go through `skill-eval-suite`.
- **Never** edit a `SKILL.md` based on eval results. The runner reports; humans decide.
- **Never** auto-deprecate a high-fail skill. Surface as a `skill-health-monitor` PROPOSE-DEPRECATION candidate; require Michael's explicit approval.
- **Never** count `error` status in the pass-rate denominator. Rate-limits and timeouts are runner-side noise, not skill quality signals; conflating them corrupts trend arrows.
- **Never** overwrite `run-history.csv`. Always append; the longitudinal record is the only basis for trend computation.
- **Never** dispatch a case twice in the same run. Cache the response; idempotency matters for cost and rate-limit control.
- **Never** abort the entire run on a single malformed YAML. Mark that skill `skipped`; continue.
- **Never** run silently with no output. Even an aborted run emits a header + abort reason — debugging requires visible failure.
- **Never** double-run concurrently. Honor the `.run.lock`; concurrent appends to `run-history.csv` produce duplicate rows that distort trend arrows downstream in `skill-performance-tracker`.
- **Never** treat `BLOCK 3` (coverage gaps) as a failure of this skill. Coverage authoring belongs to `skill-eval-suite`; this runner only surfaces the gap.
