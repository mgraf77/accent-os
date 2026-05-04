# AccentOS — Session Log
> Append-only. Most recent entry at top. Auto-committed each session.
> Replaces Notion Live Log. Do not delete entries.

## CURRENT PRIORITY QUEUE
> Updated each session. This is what we work on next, in order.

1. **Track 0.2 Chunk B** — Settings → Users panel (owner-only role assignment UI)
2. **Track 1.2** — Quote Generator persistence ($22.8K/yr value)
3. **Parent company grouping UI** — data already imported for 130 vendors, UI not built

### 2026-05-04 — Track 0.2 Chunk A: Supabase Auth + role-based sidebar — LIVE
**Version:** v6.9.6a (auth code v6.9.6, anon-JWT bootstrap hotfix v6.9.6a)
**Built/Changed:** Replaced hardcoded auto-login with Supabase Auth (REST). 5-role system (Owner/Admin/Manager/Sales/Warehouse). New tables: `user_profiles`, `audit_log` — created in Supabase. JWT-backed session persistence in sessionStorage. Sidebar gated by `data-roles` whitelist per role matrix. audit_log writes for login / session_resume / logout / score_save. Three users seeded with shared `accentos` password: Michael=Owner, Paul=Admin, Patrick=Admin. v6.9.6a hotfix embedded the public anon JWT into HTML so fresh browsers can log in without first visiting Settings (sessionStorage still wins for rotation).
**Decisions:** Marketing Hub + Roadmap visible to Manager (Michael's tweak to default matrix). Sales/Warehouse roles deferred until those people onboard. Anon JWT is publishable-by-design (RLS protects writes) — embedding it in source is correct.
**Verified:** Michael logged in successfully as Owner on https://accent-os.pages.dev. Auth is live for all three users.
**Open loops:** Chunk B (Settings → Users panel for owner-only role assignment). Existing vendor tables (`vendor_score_states`, `vendor_categories`, `vendor_changelog`) still use anon RLS — tighten in a later pass once Chunk B lands. Users should change shared `accentos` password after first login.
**Next prompt:** Track 0.2 Chunk B (Settings → Users panel) OR proceed to Track 1.1 / 1.2 (vendor + quote persistence).

### 2026-05-04 — MASTER.md and SESSION_LOG.md initialized
**Version:** v6.9.5
**Built/Changed:** MASTER.md and SESSION_LOG.md added to repo root.
**Decisions:** MASTER.md updated every session. SESSION_LOG.md append-only.
**Open loops:** Track 0.2 Auth not started. Supabase MCP broken. Parent company grouping UI not built.
**Next prompt:** Start Track 0.2 — Auth and role-based access.
