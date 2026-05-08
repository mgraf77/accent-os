# Last-run cache — registry-validator
> Overwritten on every registry-validator run. Used by Step 3's escalation logic to detect findings that recur across runs (and thus warrant severity escalation per `diff-rules.md`).

## Schema

Each finding record:
- `action_type` — the bound action_type
- `diff_class` — one of: registry-hallucination · orphan-executor · payload-shape-drift · return-shape-drift · registry-duplicate
- `executor_skill` — the executor named in the registry row (or "—" for orphan-executor diffs)
- `severity` — BLOCKING | WARN | INFO
- `first_seen` — ISO date of the first run that surfaced this finding
- `runs_unfixed` — count of consecutive runs where this finding has appeared

The (action_type, diff_class, executor_skill) tuple is the dedup key. If the same tuple appears in this run AND the prior run, increment runs_unfixed and escalate severity per the rules in `diff-rules.md`.

---

## Run history (most recent run only)

(empty — populated on first registry-validator run)

```
Run timestamp: [ISO]
Bindings parsed: [N]
Executor skills checked: [M]
Findings: [BLOCKING: x | WARN: y | INFO: z | OK: green-rows]

Findings detail:
| action_type | diff_class | executor_skill | severity | first_seen | runs_unfixed |
|-------------|------------|----------------|----------|------------|--------------|
| (none yet)  |            |                |          |            |              |
```

---

## Escalation rules (mirror of diff-rules.md, included here for self-containment)

If the same (action_type, diff_class, executor_skill) tuple appears in this run AND the prior run:
- INFO → WARN (escalate)
- WARN → BLOCKING (escalate)
- BLOCKING → BLOCKING (no further escalation; surface in BLOCK 3 with "fix overdue: N runs unfixed")

If a finding from the prior run is **absent** from this run, treat it as resolved — drop from this file silently. Resolution is the natural endpoint; no celebration message needed.

If this is the first run (file has no prior records), all findings are first-seen with `runs_unfixed = 1` and severity = the default per `diff-rules.md`.
