# vibe-speak — sessions index

> Real-session captures. One file per Claude Code session that wraps with the Step 18 ritual. Used to validate that vibe-speak's measured benchmark reductions hold in actual Michael sessions, not just synthetic prompts.

## Filename convention

`session-YYYY-MM-DD-NNN-[mode].md` where NNN is sequential per-day and `[mode]` is the dominant mode of that session.

Example: `session-2026-05-05-001-vibe.md`

## Schema (per session file)

```markdown
# session [date] #NNN — mode: [mode]

## summary
- duration: [start-end]
- turns: [N]
- assistant_output_words: [W]
- estimated_default_baseline: [B]
- measured_reduction: [X]%
- target_reduction: [Y]%
- delta_vs_target: [+/- Z]%

## modes used
- [mode]: [N turns]
- [mode]: [N turns]

## signals fired
- closure: [count]
- autonomy: [count]
- echo: [count, terms]
- correction: [count]

## file edits
- skills/vibe-speak/feedback-log.md: [N appends]
- skills/vibe-speak/observation-log.md: [N appends]

## proposals surfaced
- [proposal text or "none"]

## notable
- [one-line takeaway from this session, if any]

## sample turns (3 representative — for A/B comparison)
- input: "..."
- output: "..."
- input: "..."
- output: "..."
- input: "..."
- output: "..."
```

## How sessions get written

At Step 18 (end-of-session ritual), the wrap routine writes a new session file via the Edit tool. Triggered by Michael saying "wrap" / "end session" / "commit and push" / etc.

If the session ends without a wrap (Codespace dies, conversation auto-compacts), no session file is written. KPI continuity is best-effort — `kpi-log.md` still gets the entry if Step 18 fired.

## How A/B comparison works

`/vibe ab-test [prompt]` reads the prompt, generates outputs in 2 named modes (or 2 explicit modes if specified), surfaces the diff. Useful for deciding whether to switch default mode based on real prompts.

## How replay works

`/vibe replay [session-id]` reads the session file and re-runs the 3 sample turns through the active mode. Compares output word counts to the original session's word counts. Validates that mode behavior is stable over time.

## Privacy

Session files are git-tracked and travel with the repo. They contain Michael's prompts and Claude's outputs, paraphrased to one-line summaries (NOT full verbatim). Anything sensitive (secrets, customer PII) is redacted to `[redacted]` per Step 7 disengage rules.

For full verbatim history, use Claude Code's native session log (not part of vibe-speak).

## Rotation

Sessions accumulate. After 200 entries OR 30 days of files, the rotation routine summarizes oldest 100 into a single quarterly rollup file. Same pattern as observation-log rotation.

## What this measures (matrix dim 19)

- Real-session validation = match between predicted (benchmark) and actual (session) reduction
- A delta of <5% between benchmark and trailing 7-session average = validation passing
- A delta of >15% = signal that benchmarks are wrong OR session patterns differ — surface as a KPI alert
