# Sessions
> Per-session registry entries. Schema in SCHEMA.md.

## Usage

- On session start: write `[ISO-timestamp]-[slug].md` with status `active`
- Update `_active.md` to point to current session
- On session end: status → `handed_off`, write handoff packet, clear `_active.md`

## Files

- `_active.md` — pointer to currently-active session (empty when no session running)
- `[timestamp]-[slug].md` — per-session entries

## Lifecycle

```
active → handed_off       (normal completion with handoff)
active → compacted        (mid-session context limit hit, resume from handoff)
active → terminated       (session died without handoff — Hub recovery)
```

## Conflict prevention

If `_active.md` already points to a session when starting:
1. Check that session's `started` timestamp
2. If > 8 hours ago: assume terminated, take ownership
3. If < 8 hours ago: WAIT or escalate
