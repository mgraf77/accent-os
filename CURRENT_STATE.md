# CURRENT_STATE.md — AccentOS as of 2026-05-07

**Snapshot for governance-restructure handoff.**

## Repo state

- **Branch:** `claude/accentos-roadmap-planning-PKRA0` (planning-only, NOT merged to `main`)
- **HEAD:** `6690495` — `fix(status): drop self-referencing fields to break regen-amend loop`
- **Working tree:** clean
- **Sync:** in sync with origin

## Code state

- `index.html`: 694KB SPA (vanilla JS, no framework, no build step)
- `js/`: 9 external modules (extracted in v6.10.12)
- `sql/`: idempotent migration files (M01-M30+ run manually by Owner)
- 36 modules shipped across Tracks 0-6
- No Phase 0+ task started; this branch only added planning + dashboard scaffolding

## Plan state (per ROADMAP_2026.md v3.1)

| Phase | Track | Status |
|---|---|---|
| Phase 0 — Foundation Gate | 7 | 0 / 14 (not started) |
| Phase 1 — ROI Integrations | 8 | 0 / 6 (creds-blocked on M03/M04/M05/M10) |
| Phase 2 — Inline Retrieval + Ecom RAG | 9 | 0 / 16 |
| Phase 3 — Named Automations A1-A8 | 10 | 0 / 8 |
| BC Site Maximization E1-E10 | 11 | 0 / 10 (blocked on M38) |
| User-Safety Charter S1-S10 | 12 | 0 / 10 |
| Compounding Loops L1-L5 | 13 | 0 / 5 |
| Phase 4 — Continuous | 14 | 0 / 4 |

## Foundational principles (frozen at v3.1)

1. Multi-metric heartbeat (4 tiers, ~15 metrics)
2. Δ-ROI system-wide via `automation_events`
3. Dynamic thresholds (Bayesian Beta-LCB)
4. Control-panel UX per persona
5. Anti-deskill by default (explain-mode + edit-distance)
6. Cost-bounded AI (caching, tiering, kill-switch)
7. Security as gate (RLS CI, hash-chained log, JWT aud split)
8. Recalibrate, don't ratify
9. AI honesty for customers (label, "I don't know" handoff)
10. Compounding > linear
11. Owner-time discipline (5h/wk cap, office hours)
12. Safety-by-default for all users (spec-token, email gate)
13. Site is product (BC theme is build target, not afterthought)

## Active hooks

- **Stop hook** (`.claude/settings.json`):
  - efficiency-aggregate.sh
  - build-status.sh
- **Pre-push hook** (`.git/hooks/pre-push`, NOT tracked by git):
  - regenerates BUILD_STATUS.md
  - amends into HEAD if HEAD is unpushed

## Skills active

Per `skills/_index.md` and CLAUDE.md auto-execute:
- vibe-speak (default mode `vibe`)
- efficiency-monitor (always-on observer)
- skill-forge, supabase-sql-magic, others (registry)

## What is "live" vs "planned"

**Live and operational:**
- AccentOS SPA at https://accent-os.pages.dev (36 modules)
- Supabase Postgres backend (18 tables + RLS)
- Cloudflare Pages deploy
- Auth (Supabase JWT, 5-role system)
- audit_log (NOT yet hash-chained)

**Planned but not built (this branch is the plan, not the build):**
- Everything in Tracks 7-14
- BUILD_STATUS.md is "live" as a dashboard but reflects pre-Phase-0 state

## Where the source-of-truth lives

| Concern | File |
|---|---|
| Long-term vision + Decisions Log | `ROADMAP_2026.md` |
| Claude task queue | `BUILD_PLAN_CLAUDE.md` |
| Owner unblock queue | `BUILD_PLAN_MICHAEL.md` |
| Live dashboard | `BUILD_STATUS.md` (auto-gen) |
| Current WIP snapshot | `WORK_IN_PROGRESS.md` |
| Per-session log | `SESSION_LOG.md` |
| Per-prompt log | `PROMPT_LOG.md` |
| Lessons | `BUILD_INTELLIGENCE.md` |
| Master architecture | `MASTER.md` |
| Skill registry | `skills/_index.md` |
