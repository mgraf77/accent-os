# STATUS.md

> Lightweight live status board. **Source of truth** for "where are we right now?". Auto-readable by `scripts/status.sh` companion.
> Created 2026-05-10 during Safe Overnight Autonomy Mode. Update it any time the answer to "what's the state?" changes.

---

## Right now (2026-05-10, overnight pause)

**Branch:** `claude/safe-overnight-autonomy-EHEbQ`
**Last meaningful commit on `main`:** `940e7f8` — Quote Generator v2 (AI parse, track calc, per-row approval, CSV export).
**Open WIP:** Cloudflare worker proxy patched (`2dca2a6`) but **not redeployed**. Parse Notes still 400s in production.
**Mode:** Safe overnight autonomy. No production mutations allowed.

## Active blockers (need Michael)

| # | Blocker | What unblocks it |
|---|---------|------------------|
| B1 | Worker proxy not redeployed | Michael runs `wrangler deploy` from his local machine (NOT codespace) |
| B2 | Parse Notes 400 root cause unknown | Reproduce after redeploy, capture DevTools → Network → response body |
| B3 | M24–M29 schemas not run | Michael runs each `sql/M##_*.sql` in Supabase dashboard |
| B4 | M11 Supabase MCP permissions | Michael grants in dashboard |
| B5 | M12 `accentos` shared password rotation | Michael rotates and distributes |
| B6 | M04 BigCommerce API credentials | Michael generates store keys |

## What is safe overnight (no Michael needed)

- Documentation hardening (this file, `SAFE_OVERNIGHT_QUEUE.md`, `OVERNIGHT_STATUS.md`).
- Read-only audits (e.g., grep BUILD_PLAN drift).
- Skill candidate drafts in `skills/_candidates/`.
- Codex pilot prep docs.
- See `SAFE_OVERNIGHT_QUEUE.md` for the explicit allowed list.

## What is NOT safe overnight

- Anything in `index.html`, `js/`, `worker/`, `wrangler.toml`, `patch_quote.js`.
- Anything in `sql/` (no migrations).
- Anything in `.claude/CLAUDE.md`, `MODULE_MODES.md`, `module_modes.json`, `BUILD_INTELLIGENCE.md` core rules.
- Any deploy, force-push, amend, rebase, branch delete.

## Repo health snapshot

- `index.html`: 717KB (79% of 900KB split trigger — see `CODEX_PILOT_CANDIDATES.md` P4).
- BUILD_PLAN_CLAUDE: 36 shipped / 10 pending. Next: 5.13 E-Commerce Command Center.
- BUILD_PLAN_MICHAEL: 7 done / 34 pending.
- Skills installed: 27 (per `skills/_index.md`). Candidate drafts: 3 (`skills/_candidates/`).

## Next morning action (one line)
Read `OVERNIGHT_STATUS.md` first. Then redeploy worker (B1) and capture Parse Notes response body (B2).

## How to update this file
- After every meaningful state change (commit, blocker resolved, plan-ledger tick), refresh the relevant section.
- Don't grow it past ~80 lines — it's a status board, not a log. Push history into `SESSION_LOG.md`.
