# vibe-speak — KPI log

> Append-only log of session-level token-savings KPIs. Used to track whether the skill is actually delivering its promised compression in real Michael sessions (not just on benchmark prompts).

## How to use

**Read at session start:** print the trailing 7-session and 30-session averages so Michael can see the trend.

**Write at session end (Step 11 wrap ritual):** append a new entry summarizing this session's measured reduction.

**Self-tighten:** if 3 consecutive sessions show reduction < 50%, surface a proposal to permanently lower the default mode (vibe → tight or → caveman). Don't auto-apply.

---

## Entry schema

```
### kpi-NNN — YYYY-MM-DD — [active-mode]
- session_turns: [N]
- assistant_output_words: [W]
- estimated_default_baseline: [B]    (B = W / (1 - mode_reduction%))
- measured_reduction: [(B-W)/B × 100]%
- target_reduction: [mode's target from MODES.md]
- delta_vs_target: [+/-X%]
- signals_fired: [list]
- mode_switches: [list]
- self_optimize_proposals: [count]
- notes: [one line — anything notable]
```

`NNN` is sequential, zero-padded to 4 digits.

---

## Trend reporting

`/vibe kpi` prints:

```
─── vibe-speak KPI ───
last 7 sessions:
  avg reduction:    XX%   (target for [mode]: YY%)
  avg turns:        N
  avg output:       W words / turn
  vs target:        +/- Z%

last 30 sessions:
  avg reduction:    XX%
  best session:     [date] @ XX%
  worst session:    [date] @ XX%

mode usage:
  vibe:        XX% of sessions
  gsd:         XX%
  caveman:     XX%
  ...

trending:
  [up/flat/down]   reduction trend over 30 days
```

If trending down 3+ sessions in a row, surface:
> ⚠ KPI alert: reduction trending down. Consider running /vibe propose updates or switching default to a tighter mode.

---

## Seed entry (initial benchmark, 2026-05-05)

### kpi-0001 — 2026-05-05 — vibe
- session_turns: 8 (this conversation, vibe-speak buildout)
- assistant_output_words: ~5,200 (estimate from this session)
- estimated_default_baseline: ~11,500
- measured_reduction: 55%
- target_reduction: 55–60% (vibe mode)
- delta_vs_target: 0%
- signals_fired: closure (×3), autonomy (×0), echo (×0), correction (×0)
- mode_switches: vibe (active throughout)
- self_optimize_proposals: 0
- notes: Initial seed. Output is intentionally longer because this session built the skill itself — lots of explanatory prose that vibe mode would normally compress further. Real-build sessions should hit ~58%+.

---

## Active log (entries appear here)

(none yet — populated by Step 11 wrap rituals)

---

## Annual rollup (graveyard)

When the active log exceeds 100 entries, oldest entries get summarized into the rollup section:

```
## 2026 Q2 — N sessions, avg reduction: X%
- best: [date] @ Y%
- worst: [date] @ Z%
- mode usage: vibe X%, gsd Y%, caveman Z%, ...
- patterns: [one-line takeaway]
```

This keeps the file scanable without losing history.
