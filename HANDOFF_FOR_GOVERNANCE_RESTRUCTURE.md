# Handoff for Governance Restructuring

**Date:** 2026-05-08  
**Current SHA:** `74684a40` (main + claude/deploy-accent-os-redesign-eaJFH)

---

## Systems Touched (This Repo)

| System | Files | Notes |
|---|---|---|
| App UI | `index.html` | Single-file SPA, 6600+ lines, all modules inline |
| JS Modules | `js/*.js` | 20+ module files, all loosely coupled via global state |
| Module Modes | `module_modes.json`, `MODULE_MODES.md`, `js/module_modes.js` | Per-user rollout-state registry + Supabase sync |
| Skills | `skills/` (30 dirs) | Markdown-only skill definitions for Claude Code |
| Efficiency Monitor | `skills/efficiency-monitor/`, `scripts/efficiency-aggregate.sh` | Always-on session observer, Stop hook wired |
| vibe-speak | `skills/vibe-speak/` | Full voice/mode skill, corpus-calibrated |
| SQL | `sql/M30–M40_*.sql` | Pending Supabase migrations, not yet applied |

---

## Dependencies & Coupling

### High Coupling Zones
- `index.html` ↔ all `js/*.js` — modules loaded via `<script>` tags, share global `window.*` state
- `js/module_modes.js` ↔ Supabase `user_module_overrides` table (M40 SQL, not yet applied)
- `skills/efficiency-monitor/` ↔ `.claude/settings.json` Stop hook — aggregator runs on session end

### External Dependencies
- **Cloudflare Pages** — deploys from `main`, no config file in repo (configured in CF dashboard)
- **Supabase** — auth + data persistence; project URL/keys in Supabase dashboard (not in repo)
- **Google Fonts** — `Outfit` + `DM Mono` loaded from CDN in `index.html`

---

## What Belongs Where (Recommended)

### Stay in AccentOS repo
- `index.html` — the app
- `js/*.js` — module logic
- `module_modes.json` — app config
- `sql/` — schema migrations for this project's DB

### Move to Skills repo (when created)
- `skills/` entire directory — these are Claude Code skills, not app code
- `scripts/efficiency-aggregate.sh` — skill infrastructure

### Move to AgentOS (when created)
- `skills/autonomous-mode/` — agent orchestration
- `skills/prompt-queue/` — task queuing
- Skills with cross-project applicability (repo-scout, skill-forge, vibe-speak)

### Command Center (when created)
- KPI catalog + audit skills
- BC business review skill
- Bottleneck finder

---

## Incomplete Abstractions
- `js/module_modes.js` — rollout-state system built but Supabase sync path incomplete (M40 SQL not applied)
- `skills/prompt-queue/` — v2 built with `defer_until` + `execution_mode` but no runtime executor exists yet
- `skills/autonomous-mode/` — framework exists, no live agent loop wired

## Risky Zones for Restructuring
- `index.html` is a monolith — any split will require careful dependency mapping
- Global `window.*` state shared across `js/` modules — no module system, direct coupling
- Skills directory is large (30 skills) — moving it will break `.claude/settings.json` Stop hook path

## Recommended Before Restructuring
1. Tag `main` at current SHA: `git tag pre-governance-restructure-2026-05-08`
2. Apply pending SQL migrations (M30–M40) or formally defer them
3. Close/delete stale `claude/*` branches (or archive them)
4. Confirm Cloudflare Pages branch setting (should be `main`)

---

## Repo is Clean and Resumable
- Tree: clean
- No WIP code changes
- All session findings documented in SESSION_SUMMARY.md, CURRENT_STATE.md, NEXT_STEPS.md, KNOWN_ISSUES.md
- Immediate resume path: user shares redesign HTML → 5-minute deploy
