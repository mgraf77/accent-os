# vibe-speak — profiles index

> Multi-user profile system. Each user gets their own calibrated profile. Auto-detected at session start.

## Detection chain

At session start (SKILL.md Step 0), vibe-speak runs in order:

1. **Explicit override** — if Michael ran `/vibe profile [name]` in a previous session and that's persisted as the active profile in `_active.md`, use that.
2. **Git config user.name** — `git config user.name` (e.g. "Michael Graf"). Look for `profiles/michael.md`. Match is case-insensitive on first name.
3. **Git config user.email** — `git config user.email` (e.g. "michael@accentlightinginc.com"). Look for `profiles/[email-prefix].md`.
4. **Fallback** — `profiles/_default.md`.

The detection result is logged to `_active.md` (single-line file: `active_profile: michael`) so subsequent reads can skip detection.

## Files in this directory

| File | Purpose |
|---|---|
| `_index.md` | This file — explains the system |
| `_default.md` | Template / fallback profile |
| `_active.md` | Single-line cache of current active profile name |
| `michael.md` | Michael Graf's calibrated profile |
| `[name].md` | Per-user profile files |

Files starting with `_` are system files. User profiles never start with `_`.

## Switching profiles

| Command | What it does |
|---|---|
| `/vibe profile` | Print the active profile (compact summary) |
| `/vibe profile [name]` | Switch active profile to `[name]` (e.g. `/vibe profile michael`) — writes `_active.md` |
| `/vibe profile new [name]` | Create a new profile — copies `_default.md` to `[name].md` and switches |
| `/vibe profile list` | List all profiles in this directory |
| `/vibe profile delete [name]` | Delete a profile (asks for confirmation; never deletes `_default.md`) |

## Why per-user profiles

- **Different vocabularies.** Michael says "RLS" comfortably; a new collaborator might prefer "who-can-read rule." Active translation list differs.
- **Different default modes.** Michael defaults to `vibe`; a stakeholder reviewer might default to `executive`.
- **Different register.** Michael writes lowercase; another user might write fully punctuated. Register mirror calibrates.
- **Different correction history.** Each user's `feedback-log.md` and `observation-log.md` accumulate their own learnings.

## Cross-machine sync

Profiles are git-tracked. Pull on a new machine = profiles are there. No external sync service needed.

If two machines edit the same profile, regular git merge resolution applies. The `_active.md` file is `.gitignore`-d (machine-local).

## Migration from single-profile vibe-speak

The previous `skills/vibe-speak/user-profile.md` was a single-user file. Its content moved to `profiles/michael.md`. The old file can be deleted, or kept as a redirect note.

The `observation-log.md` and `feedback-log.md` remain at `skills/vibe-speak/` (not split per user) — they accumulate across all users on this repo. To split per-user, future versions can move them to `profiles/[name]/observation-log.md`.

## Profile schema reference

Every profile must include these sections (use `_default.md` as template):
- Active user (name + context)
- Default mode
- Register mirror (on / off)
- Hard-keep additions
- Glossary overrides
- Filler kill list additions
- Custom intensity levels
- Profile state block (version, active_user, default_mode, etc.)
