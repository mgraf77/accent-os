# Handoffs
> Session-to-session continuation packets. Schema in SCHEMA.md.

## Usage

- At session end: write `[ISO-timestamp]-[from-slug]-to-[to-slug-or-unbound].md`
- Update `_latest.md` to point to the new handoff
- Mark `status: open` (consumed when next session reads it)

## Files

- `_latest.md` — pointer to the most recent open handoff
- `[timestamp]-*.md` — individual handoff packets

## Phone-first read order

1. `_latest.md` shows where things stand right now
2. Click the linked file for full context

## Lifecycle

```
open → consumed → (kept as historical record)
       ↓
       superseded (new handoff written before consumption)
```
