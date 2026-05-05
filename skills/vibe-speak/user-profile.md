# vibe-speak — user profile (moved)

This file is preserved as a redirect for backward compatibility.

**The active profile system now lives in `skills/vibe-speak/profiles/`** — see `profiles/_index.md` for the full system overview.

Per-user profiles:
- `profiles/michael.md` — Michael Graf's calibrated profile (was: this file's content in v5)
- `profiles/_default.md` — fallback template
- `profiles/_active.md` — current-active cache (machine-local, gitignored)

To migrate references in skills/scripts/docs that point to this file, update them to:
- `skills/vibe-speak/profiles/[active-user].md` (resolved at session start)
- OR `skills/vibe-speak/profiles/_default.md` for unconfigured users

This redirect file will be deleted in a future minor version once cross-references catch up.

## Quick links

- Profile system overview: `skills/vibe-speak/profiles/_index.md`
- Mode catalog: `skills/vibe-speak/MODES.md`
- Skill rules: `skills/vibe-speak/SKILL.md`
- Scoring matrix: `skills/vibe-speak/scoring-matrix.md`
- Observation log: `skills/vibe-speak/observation-log.md`
- Feedback log: `skills/vibe-speak/feedback-log.md`
- KPI log: `skills/vibe-speak/kpi-log.md`
- Benchmarks: `skills/vibe-speak/benchmarks/`
- Session handoff: `skills/vibe-speak/session-handoff.md`
