# Queue
> Pending work items. One file per task. Lifecycle states per SCHEMA.md.

## Usage

- New task: write `[task-id].md` per queue_item schema
- Update `_index.md` to reflect current state
- A session claims by writing a lock file in `runtime/locks/` and updating `claimed_by`
- On completion: status → complete, append event to `runtime/events/`

## Files

- `_index.md` — current queue snapshot (overwritten on every state change)
- `[task-id].md` — individual task entries

## Phone-first read order

1. `_index.md` for the snapshot
2. drill into specific task only if needed

## Anti-patterns

- Do NOT delete tasks — change status to `abandoned` or `deferred`
- Do NOT mutate completed tasks — they are historical record
