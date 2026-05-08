# ai-task-router — Routing Defaults

> Persistent overrides set via `/route default [task_type] [tool]`.
> Read at session start (Step 1). Default tool for a task type appears first in routing output.
> Append-only — do not delete entries. To clear a default, add a `clear` line.

---

## Format

```
[task_type]: [tool]  # set YYYY-MM-DD
```

To clear: `[task_type]: clear  # cleared YYYY-MM-DD`

---

<!-- defaults appended below -->
