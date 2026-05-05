# vibe-speak — profile: _default

> Template profile used when no user-specific profile matches the active operator. Copy this to `profiles/[your-name].md`, customize, and vibe-speak will auto-detect via `git config user.name`.

Active user: **(default — no user-specific calibration)**.

Detection: this profile loads when no `profiles/[name].md` matches the operator detected via:
1. `git config user.name` (primary)
2. `git config user.email` (fallback)
3. Explicit `/vibe profile [name]` override

---

## Default mode (auto-activated on session start)

`vibe`

---

## Register mirror

`on` — match the operator's casing / typo tolerance / sentence structure.

---

## Hard-keep additions

(none — falls back to SKILL.md Step 3 baseline)

---

## Glossary overrides

(none — falls back to SKILL.md Step 2 active-translation list)

---

## Filler kill list — additions

(none — falls back to SKILL.md Step 5 baseline)

---

## Custom intensity levels

(none — falls back to SKILL.md Step 1 five-level table)

---

## Override commands

All `/vibe` and `/mode` commands per SKILL.md Step 10 + Step 12.

---

## Onboarding checklist (for new users)

When this `_default.md` is loaded for the first time, vibe-speak surfaces:

```
─── vibe-speak — first session ───
No profile detected for: [operator name]

Options:
  1. Run with default settings — type "ok" or "default" or just continue
  2. Create personal profile — run /vibe profile new [your-name]
  3. Use Michael's profile (if you're Michael on a different machine)
     — run /vibe profile michael

Default mode: vibe. Switch with "caveman" / "gsd" / "vibesplain" / etc.
Full mode catalog: skills/vibe-speak/MODES.md
```

After first session, the user's choice persists.

---

## Profile state

```
version: 2.1.0
active_user: (default)
default_mode: vibe
default_intensity: vibe
register_mirror: on
modes_available: vibe, caveman, gsd, executive, pair, teach, vibesplain, wenyan, raw
custom_modes: (none)
hard_keep_count: 0 (uses SKILL.md baseline)
active_glossary_count: 40 (full SKILL.md Step 2 table)
filler_kill_count: 11 (SKILL.md Step 5 baseline)
custom_levels: (none)
```
