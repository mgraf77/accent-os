# Events
> Append-only event log. Daily files. Plain text.

## Usage

- One file per UTC date: `YYYY-MM-DD.log`
- Format: `[ISO-timestamp]  [event-type]  [session-id]  [k=v ...]`
- APPEND ONLY — never edit, never delete

## Event types

```
session_start        session_end
task_created         task_claimed         task_completed
task_blocked         task_deferred        task_abandoned
commit_made          push_made
handoff_written      handoff_consumed
lock_acquired        lock_released
branch_created       branch_merged        branch_retired
freeze_declared      freeze_lifted
```

## Why plain text

- Grep-able from phone via GitHub mobile
- Fast scrolling
- No structured-parsing overhead for human readers
- Append-only is trivial to implement

## Retention

- Keep all daily files indefinitely (cheap)
- Future cleanup: archive files older than 90 days
