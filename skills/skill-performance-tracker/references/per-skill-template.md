# skill-performance-tracker — Per-Skill Drill-Down Template

> When Michael runs `skill-perf for [name]`, SKILL.md Step 5 emits this single-skill view instead of the three-block summary. Paste-ready shape below.

---

## Drill-down output shape

```
═══ SKILL-PERF DRILL-DOWN: [skill-name] — YYYY-MM-DD ═══
Window: last 30d vs prior 30d

OVERVIEW
  Composite score:        0.XX  ↑/↓/→
  Last invoked:           YYYY-MM-DD ([N] days ago)
  Total runs (30d):       [N]
  Total runs (lifetime):  [N]
  Eval suite present:     yes/no
  Has scheduled cadence:  yes/no  (if yes, show: e.g. "weekly")

METRICS (current 30d / prior 30d / trend)
  match_rate:               XX% / YY% / ↑↓→
  invocation_rate:          XX% / YY% / ↑↓→
  user_satisfaction_signal: 0.XX / 0.YY / ↑↓→
  token_savings_estimate:   X.Xk / Y.Yk / ↑↓→
  staleness:                Nd  / Md  / ↑↓→  (lower is better)
  quality_signal:           XX% / YY% / ↑↓→  (or "—" if no eval suite)

NEGATIVE SIGNALS DETECTED (last 30d)
  retry-loops citing this skill:    [count] sessions
  redone-wip citing this skill:     [count] sessions
  PROMPT_LOG undo-phrases near run: [count] occurrences
  → If any non-zero, list session-shortsha + one-line context

POSITIVE SIGNALS DETECTED (last 30d)
  Sessions where skill ran cleanly: [count]
  Sessions where Michael invoked twice (sticky use): [count]
  Companion-skill chained invocations: [count] (skill X → this skill → skill Y)

OPPORTUNITY GAPS
  match_rate − invocation_rate gap: XX percentage points
  → If gap >20pp: this skill is OPPORTUNITY territory; surface "trigger-rescue [name]" hint

EVAL SUITE STATUS
  promptfooconfig.yaml present:  yes/no
  Last eval run:                 YYYY-MM-DD ([N] days ago)
  Last pass rate:                XX%
  → If no eval suite: "Run skill-eval-suite for [name] to populate quality_signal"
  → If pass rate <90%: "Quality regression — investigate failing test cases"

COMPANION-SKILL ACTIVITY (last 30d)
  Skills Michael ran in the same session as [name]:
    - [companion-1]  ([N] co-occurrences)
    - [companion-2]  ([N] co-occurrences)
    - ...
  → If a high co-occurrence pair isn't listed in companion: hints at undocumented chain

RECOMMENDED ACTIONS
  - [Auto-derived from above. Examples:]
  - "Run skill-eval-suite for [name]" (if no eval suite)
  - "Route to gap-optimizer for trigger remining" (if high match, low invocation)
  - "Route to skill-health-monitor for deprecation review" (if 0 invocations + 60d+ stale)
  - "Healthy — no action needed" (if composite >0.75 and trend ≥ →)

RAW SESSION REFERENCES (last 30d, max 10)
  [shortsha] [date] [one-line summary from efficiency-log.md]
  ...

═══ FOOTER ═══
For full ecosystem rollup, run "skill performance" (no skill name)
For deprecation flow, run "deprecation-candidates"
═══════════════════════════════════════════════════════
```

---

## Behavior contract

- Always include all sections, even if empty (render `(no data)` instead of omitting).
- Trend arrows on EVERY metric row.
- "Recommended actions" must be deterministic from the metrics — same input → same actions list.
- Do not invent companion-skill chains; only list pairs that actually co-occurred in the session log.
- Negative-signals section MUST cite session shortshas, not vague "some sessions."
- If `quality_signal` is null, display the line as `quality_signal: — / — / ·` and add the "Run skill-eval-suite" recommendation at the bottom.
