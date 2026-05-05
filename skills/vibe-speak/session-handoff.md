# vibe-speak — session handoff

> Single-entry snapshot of state that should survive between sessions. Updated at every Step 11 wrap ritual. Read at every Step 0 alongside profiles + logs.

Differs from `WORK_IN_PROGRESS.md` (which is for AccentOS build state) — this file is specifically for vibe-speak's own continuity.

---

## Current handoff

```
last_session_end:           2026-05-05 (vibe-speak v6 buildout)
active_user:                michael
active_profile:             profiles/michael.md
active_mode_at_close:       vibe
last_intensity:             vibe
register_mirror:            on
session_turns:              ~8 (this conversation through v6)

pending state to pick up:
  - feedback-log unapplied entries:  0
  - observation-log unapplied:        0
  - pending self-optimize proposals:  0
  - last surfaced proposal:           never
  - session-only overrides applied:   none

session-only overrides that did NOT persist (re-issue if you want them back):
  (none)

mid-task interruption flag: NO
  (set to YES if a session ends with a multi-step task in flight; the
   next session reads this and resumes the task)

files modified this session:
  - skills/vibe-speak/profiles/michael.md (renamed from user-profile.md)
  - skills/vibe-speak/profiles/_default.md (new)
  - skills/vibe-speak/profiles/_index.md (new)
  - skills/vibe-speak/profiles/_active.md (new, gitignored)
  - skills/vibe-speak/benchmarks/prompts.md (new)
  - skills/vibe-speak/benchmarks/results.md (new)
  - skills/vibe-speak/kpi-log.md (new)
  - skills/vibe-speak/session-handoff.md (this file, new)
  - skills/vibe-speak/SKILL.md (Steps 13-15 added)
  - skills/vibe-speak/scoring-matrix.md (v6 row added)
  - .claude/CLAUDE.md (profiles reference)

next session should:
  - read profiles/_active.md to resume on michael's profile
  - skip Step 0 file-bootstrap (all files exist)
  - go straight to handling Michael's next prompt in vibe mode
```

---

## Schema

The handoff is a single block of YAML-ish key-value pairs. Plain markdown so Claude can read it without a parser.

Updated fields per Step 11:

| Field | Source |
|---|---|
| `last_session_end` | UTC date of wrap ritual |
| `active_user` / `active_profile` | from `profiles/_active.md` |
| `active_mode_at_close` | mode active at wrap time |
| `last_intensity` | intensity active at wrap time |
| `register_mirror` | on/off at wrap time |
| `session_turns` | count of user messages this session |
| `pending state` block | scan obs/feedback logs for unapplied entries |
| `session-only overrides` | any /vibe tighter / /vibe full grammar etc. that were session-only |
| `mid-task interruption flag` | YES if Michael said "wrap" mid-task; NO if normal close |
| `files modified this session` | diff vs session-start state |
| `next session should` | guidance for the next Step 0 |

---

## Why this exists

Without session-handoff:

- Mid-task interruption recovery requires re-explaining state
- Session-only overrides invisible to next session
- Modified-file context lost (next session has to re-discover what changed)

With session-handoff: 1 read at Step 0 reconstructs full continuity.

---

## When to use

- Always. This file is read at every Step 0 and written at every Step 11.

## When to ignore

- Fresh-clone bootstrap: if file doesn't exist, treat as "no prior session" and fall through to defaults. Step 0.5 doesn't auto-create this file (unlike profile / observation / feedback) — it's optional and only meaningful after a real session.

---

## Cross-machine continuity

This file is git-tracked. Pulling on a new machine = continuity travels with you. Combined with profiles/[name].md (also git-tracked), the full vibe-speak state is portable.

The only machine-local file is `profiles/_active.md` (gitignored), which caches the detection result.
