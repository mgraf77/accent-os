# Known Issues — 2026-05-08

## Critical (Blocks Feature)

### KI-001 — Cloudflare Worker 400 on aiParseNotes
- **Symptom:** POST to `accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages` returns 400. Quote Generator "Parse Notes" fails.
- **Root cause (suspected):** Worker patched in commit `2dca2a6` (arrayBuffer body passthrough + explicit 400 for missing x-api-key) but `wrangler deploy` may not have been run after that commit.
- **Diagnostic:** From browser console on accent-os.pages.dev: `fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'}).then(r=>r.text()).then(console.log)` — if returns Anthropic auth error, old code is live. If returns `{"error":"Missing x-api-key header"}`, new code is live.
- **Fix:** `wrangler deploy` from `C:\Users\Michael\Desktop\accent-os` after `git pull origin main`. Secondary fix: verify model ID `claude-sonnet-4-20250514` is still valid.
- **Blocks:** Quote Generator AI features.

---

## High (Schema Pending)

### KI-002 — M01 RLS SQL not run
- **File:** `sql/M01_rls_tightening.sql`
- **Status:** Written and committed. Not run in Supabase.
- **Impact:** Anon policies still active on `vendor_score_states`, `vendor_categories`, `vendor_changelog`. RLS hardening is incomplete.
- **Fix:** Michael pastes SQL into Supabase editor.

### KI-003 — M02 Core Schema SQL not run
- **File:** `sql/M02_core_schema.sql`
- **Status:** Written and committed. Not run in Supabase.
- **Impact:** 18 tables for Track 1–4 features do not exist in production. Any feature relying on these tables degrades silently or errors.
- **Fix:** Michael pastes SQL into Supabase editor. Run M01 first.

---

## Low (Non-blocking)

### KI-004 — customer_id / quote_id / deal_id UUID linkage not wired in save flows
- **Status:** Schema supports it. Save flows still use name-matching.
- **Impact:** CRM cross-references between customers, quotes, and deals are loose.
- **Fix:** Future session — wire UUID linkage into save flows post-M02.

### KI-005 — Branch divergence from main unknown
- **Status:** `claude/chatgpt-limits-guide-ADDqi` has not been compared to main this session.
- **Impact:** Unknown merge complexity before governance restructuring.
- **Fix:** `git diff main...claude/chatgpt-limits-guide-ADDqi` before any restructuring work.
