# Known Issues
**As of:** 2026-05-08

---

## ISSUE-001: Worker Proxy Returns 400 on AI Calls
**Severity:** High — blocks all AI features in the UI
**Status:** Open (pre-dates this session)
**File:** `worker/anthropic-proxy.js`

**Symptom:**
```
POST https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages 400 (Bad Request)
[aiParseNotes] JSON parse error
```

**Probable cause:** Commit `2dca2a6` fixed the proxy code (arrayBuffer passthrough + explicit headers) but was never redeployed via `wrangler deploy`. The live Worker is still running the old code.

**Diagnosis step:**
```js
fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'})
  .then(r=>r.text()).then(console.log)
// Old code → Anthropic auth error (means old code still live)
// New code → {"error":"Missing x-api-key header"} (means redeploy worked)
```

**Fix:** From Michael's local machine (not Codespace):
```
wrangler deploy
```

**NOTE:** Before redeploying, the sentinel audit identified additional Critical security issues in the Worker (SEC-001 through SEC-007). Recommend patching those at the same time as the redeploy.

---

## ISSUE-002: Worker Has Critical Security Vulnerabilities
**Severity:** Critical — open relay, wildcard CORS
**Status:** Open — identified by sentinel audit, not yet patched
**File:** `worker/anthropic-proxy.js`

**Issues:**
1. API key read from client request headers and forwarded to Anthropic (open relay)
2. `Access-Control-Allow-Origin: *` — any origin can use this proxy
3. No body size limit
4. No upstream fetch timeout
5. No rate limiting
6. Raw upstream errors returned to browser

**See:** `skills/accentos-sentinel-audit/history/2026-05-08-full-audit.md` — SEC-001 through SEC-007 for remediation details and copy-paste Codex prompt.

---

## ISSUE-003: 7 SQL Migrations May Lack Inline RLS
**Severity:** High — may mean tables lack row-level security
**Status:** Open — requires human verification against live Supabase
**Files:** M31, M32, M34, M36, M37, M38, M39

**Context:** The sentinel audit scanner flagged these migrations for not enabling RLS inline. This may be a false positive — AccentOS uses a dedicated RLS tightening migration (M01) and some tables may have RLS applied separately. Verification needed against the live Supabase project to confirm actual policy state.

**Verify:** Check each table in Supabase Dashboard → Database → Tables → [table] → Policies.

---

## ISSUE-004: index.html Has No Patch Boundary Markers
**Severity:** High — AI-assisted edits are risky without section delimiters
**Status:** Open — identified, not yet added
**File:** `index.html` (718KB, 7,170 lines)

**Fix:** Add `<!-- START: AccentOS [Section Name] -->` / `<!-- END: AccentOS [Section Name] -->` markers to major feature sections. Copy the Codex task from `skills/accentos-sentinel-audit/examples/sample-codex-delegation.md`.

---

## ISSUE-005: module_modes.json Drift Risk
**Severity:** Low
**Status:** Monitor
**Context:** `module_modes.json` and `MODULE_MODES.md` exist but no scanner currently verifies they stay in sync with actual module code in index.html. Low-priority but worth future automation.
