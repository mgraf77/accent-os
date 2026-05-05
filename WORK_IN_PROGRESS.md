## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-05 — apilayer scoping turn (no code shipped, scope-only)
**Current task:** —
**Step:** Branch `claude/investigate-apilayer-OGXnQ`. Scoped APILayer integration onto BUILD_PLAN: **Track 6.13** (address validation phase 1 across deliveries / customers / trade_partners; currency phase 2 deferred, same proxy + key) + **M42** (Michael — APILayer account + key, free tier OK to start). Architecture decision logged: single Supabase Edge Function `apilayer-proxy` accepting `{api, params}` so future APILayer APIs ride one key — key never leaves server. No code shipped this turn. Tree clean on main pre-this-turn at v6.10.65.

**Recent shipped (last 7 turns of this session):**
- vibe-speak v6 → v7 → v8 → v9 (multi-user profiles + benchmarks + KPI + scoring matrix + Step numbering cleanup + lazy-load contract + sessions/ + skill router + corpus learning)
- profiles/michael.md v2.2.0 (corpus calibration applied — 6 proposals from PROMPT_LOG backtest baked in: `knock out` autonomy verb, time-budgeted recognition, +inline-edit/Module Modes/vibe-speak/extract/pivot to hard-keep)
- skills/_index.md registry (26 skills) + skills/vibe-speak/skill-router.md
- skills/vibe-speak/corpus/ directory (vocabulary, trends, topics + claude.ai import path)

**Files touched (recent):** skills/vibe-speak/{SKILL.md, profiles/michael.md, scoring-matrix.md, skill-router.md, corpus/*}, skills/_index.md, .claude/CLAUDE.md.

**Commit status:** All committed + pushed. Branch `claude/caveman-conversational-english-jr6Vy` and `main` both at `6641a1f` baseline + new corpus-calibration commit pending in this WIP refresh.

**Next step if interrupted:**

1. `git add -A`
2. Commit `vibe-speak: apply v9 corpus calibration to michael.md + refresh WIP`
3. `git pull --rebase origin main && git push origin main`
4. Pause. Next session targets:

**AccentOS module backlog (all genuinely unblocked items shipped — remaining are Michael-blocked or polish):**
- Polish backlog: MODULE_REGISTRY refactor, Saved Filter Sets surface (js/saved_filters.js exists but verify wiring), Bulk action bars (js/bulk_select.js exists), Compact-view toggle, Column visibility toggles
- M30 SQL: `user_module_overrides` table — when Michael wants real cross-device per-user Module Modes gating
- 6.5/6.6 portal phase 2: needs Michael scoping
- All 6.x integrations: blocked on M03/M04/M05/M06/M09/M10/M18

**vibe-speak skill backlog:**
- Once Michael exports claude.ai history → drop in `skills/vibe-speak/corpus/imports/` → run `/vibe import` → corpus expands from 18 prompts to thousands → richer calibration
- Real-session KPI accumulation: dim 19 will rise from 9 → 10 after 7 wraps with KPI-log entries
- First brute-force-pattern → forged skill flow: dim 22 will rise from 9 → 10 once that organic event happens
- Optional: claude.ai JSON parser implementation (currently spec'd, not coded)
