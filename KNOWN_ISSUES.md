# KNOWN ISSUES — 2026-05-08

## Open

### 1. Worker deployment is stale
- **Symptom:** Parse Notes button returns 400 from worker; vendor overview shows "Overview unavailable"; chat says "Connection error".
- **Root cause:** `wrangler deploy` has not been run since at least commit `2dca2a6`. Three commits of fixes are sitting in the repo unused.
- **Fix:** `npx wrangler deploy` from Michael's local terminal (Codespace doesn't have wrangler creds).
- **Owner:** Michael (operator action — Claude can't deploy from here).

### 2. Silent failure mode in 3 other AI fetch sites
- **Files/lines:** `index.html` ~3760, ~3786, ~5976.
- **Symptom:** When the worker or Anthropic returns a non-2xx, the catch block masks the error as "Overview unavailable" / "Connection error" with no console detail.
- **Status:** Only `aiParseNotes` was patched this session. Other three retain the swallow-the-error pattern.
- **Risk:** Low (cosmetic — features fail gracefully). Address after governance restructure.

### 3. 4 hard-coded copies of the worker URL
- **Locations:** `index.html` lines 3760, 3786, 5684, 5976.
- **Risk:** If the worker URL ever changes, all four must be updated by hand. Not abstracted on purpose this session (would be scope expansion).

### 4. Model ID may be drifting toward retirement
- **Hard-coded:** `claude-sonnet-4-20250514` in 4 places.
- **Risk:** If Anthropic retires this snapshot, Parse + chat + vendor overview all break simultaneously. Centralize during cleanup.

## Closed this session

- Empty `raw` in `[aiParseNotes] JSON parse error:` log → fixed; real upstream error now surfaces in console and UI status pill.
- No way to probe whether deployed worker is current → fixed; `GET /` returns `{ok:true, version:2}`.

## Risks for the upcoming governance restructure

- Worker code (`worker/anthropic-proxy.js`, `wrangler.toml`) probably should NOT live in the `accent-os` web-app repo long-term. Moving it during restructure will require updating 4 fetch-URL string literals if the public URL changes.
- `sessionStorage['aos-api']` is the single source of truth for the Anthropic key on the client. Any future "shared services" repo will need a coordinated key-storage convention.
- Skill registry under `skills/` is read by the auto-instructions on session start (per `.claude/CLAUDE.md`). Restructure must preserve `skills/_index.md` and `skills/vibe-speak/profiles/*.md` paths or update the `CLAUDE.md` boot sequence.
