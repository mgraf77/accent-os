# ai-task-router — Routing Log

> Append-only log of every routing nudge that fired (passive or active).
> Used for pattern detection (Step 6) and retrospective tuning.
> Rotation threshold: 300 entries or 75KB.

## Schema

```
### route-NNN — YYYY-MM-DD — [task_type]
- suggested_tool: [tool name]
- claude_score: [X.X]
- winner_score: [X.X]
- gap: [X%]
- ctx_bonus: [yes/no]
- mode: [passive-low | passive-strong | active]
- outcome: [pending | accepted | ignored | overridden-to:[tool]]
- notes: [one line if anything unusual]
```

---

<!-- entries appended below -->
