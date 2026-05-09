# Tasks
> Full task specifications. Richer than queue items.

## Distinction

- `runtime/queue/[task-id].md` — queue item (status, dependencies, scope summary)
- `runtime/tasks/[task-id].md` — full task spec (description, history, artifacts)

A queue item is the "header." A task record is the "body."

## Usage

- Created when a queue item exists and richer documentation is needed
- Updated at session boundaries (session-X notes appended to history section)
- Never deleted

## When to create a task file vs just a queue item

- Quick task (< 1 session): queue item only
- Multi-session task: full task file
- Tasks with cross-session learning: full task file with history section
