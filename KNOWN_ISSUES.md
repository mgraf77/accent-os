# AccentOS — Known Issues
> Last updated: 2026-05-08

---

## Active bugs

### AI-1 — Cloudflare Worker proxy not redeployed
- **Severity:** High (blocks all AI features)
- **Symptom:** "⚡ Parse Notes" in Quote Generator returns 400. "Ask the Engine" may also be affected.
- **Root cause:** `worker/anthropic-proxy.js` was patched (commit `2dca2a6` — arrayBuffer body passthrough, explicit header forwarding, explicit "Missing x-api-key" 400) but never redeployed to Cloudflare.
- **Fix:** Run `wrangler deploy` from Michael's local machine at `C:\Users\Michael\Desktop\accent-os`. Verify with: `fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'}).then(r=>r.text()).then(console.log)` — new code returns `{"error":"Missing x-api-key header"}`.
- **Blocked by:** Michael's local terminal access.

---

## Schema pending (degrades gracefully)

### DB-1 — M02 core schema not run
- **Severity:** Medium (features no-op rather than crash)
- **Symptom:** Data entered in pipeline, quotes, employees, goals, KPIs does not persist to Supabase.
- **Fix:** Michael runs `sql/M02_core_schema.sql` in Supabase SQL editor.

### DB-2 — M22–M40 migration scripts not run
- **Severity:** Low (Phase 3 module persistence not live)
- **Symptom:** Inventory, POs, deliveries, jobs, etc. store to in-memory arrays only.
- **Fix:** Michael runs each `sql/M##_*.sql` sequentially in Supabase.

---

## Design limitations

### DL-1 — Module overrides in localStorage only
- **Severity:** Low
- **Symptom:** Per-user module overrides (Mgmt → Modes) only apply on the browser where they were set.
- **Fix:** Implement `user_module_overrides` Supabase table (M40 schema exists, not run). Build persistence layer in `js/module_modes.js`.

### DL-2 — Customer/quote UUID linkage uses name-match
- **Severity:** Low
- **Symptom:** customer_id ↔ quote_id cross-references resolve by company name, not UUID. Duplicate company names can mis-link.
- **Fix:** Thread UUID from save flows through the link columns (deferred — schema supports it).

---

## Cleanup candidates (not bugs)

### CC-1 — `patch_quote.js` dead code
- **File:** `/patch_quote.js` (repo root)
- **Issue:** One-time script used to surgically patch Quote Generator code; changes already applied. No longer needed.
- **Risk of removal:** None. It only patches index.html and is idempotent.
- **Action:** Safe to delete in any future cleanup commit.
