# POST_DEPLOY_SMOKE_TESTS.md
> Run AFTER merging integration/reconcile-v2 to main and confirming Cloudflare Pages deployment complete.
> Generated: 2026-05-13 — DEPLOYMENT_EXECUTION_AND_SMOKE_VALIDATION_V1

---

## PRE-TEST GATE

Before running any test, confirm:
- [ ] Cloudflare Pages deployment shows "Success" in CF dashboard
- [ ] `curl https://accent-os.pages.dev` returns HTML (not an error page)
- [ ] `bash scripts/health-check.sh` — Worker shows ✓
- [ ] Browser DevTools console open — watching for errors

---

## SMOKE TEST SUITE

### T01 — App Boot
**Steps:**
1. Open https://accent-os.pages.dev in a fresh private window
2. Wait for login form to appear
**Pass:** Login form renders. No JS errors in console. No white/blank screen.
**Critical check:** `window.__AOS_HYDRATED__` is NOT set yet (user not logged in — hydration fires post-login)

---

### T02 — Login
**Steps:**
1. Enter Supabase credentials (email + password)
2. Click Sign In
**Pass:** Dashboard renders. Activity feed populates or shows empty state.
**Check console for:** `[boot] hydration started` and `[boot] hydration complete in NNNms`
**Pass gate:** `window.__AOS_HYDRATED__ === true` in console.

---

### T03 — Dashboard Navigation
**Steps:**
1. Confirm sidebar renders with module icons
2. Click through: Dashboard → Pipeline → Customers → Quotes
**Pass:** Each module renders without white-page or uncaught TypeError.
**Regression check:** Dashboard cards show data (or "no data" empty states — not errors).

---

### T04 — Quote List Load
**Steps:**
1. Navigate to Quotes
2. Wait for list to populate
**Pass:** Quote list renders. If empty, shows empty state. No "Save failed" toast on load.
**Console check:** No `[sb] sbLoadQuotes:` error in console.

---

### T05 — Quote Create + Save (Critical)
**Steps:**
1. Click "New Quote"
2. Fill project name, customer name
3. Add 2 line items (vendor, qty, price)
4. Click Save
**Pass:** Toast shows `Saved (QT-XXXX) · NNNms` — NOT `Save failed`.
**Verify:** Reload page → quote still exists with correct line items.
**This test validates M45 (upsert_quote_with_lines RPC) is working in production.**

---

### T06 — Quote Reload Persistence
**Steps:**
1. After T05 save, hard-reload the page (Cmd+Shift+R)
2. Navigate to Quotes
**Pass:** The saved quote appears in the list with all line items intact.
**Fail signal:** Quote appears with 0 line items → M45 RPC has a regression.

---

### T07 — Draft Recovery
**Steps:**
1. Start a new quote, add project name + 1 line item
2. Do NOT save
3. Close the tab (or navigate away)
4. Open Quotes again
**Pass:** Yellow recovery banner appears at top of quote page with "Restore" / "Discard" options.
**Pass:** Clicking "Restore" restores the line items.

---

### T08 — 401 Session Expiry Handler
**Steps:** (Simulate only — do not force in production)
Mechanism: If Supabase JWT expires mid-session, sbFetch's 401 handler clears the JWT and shows "Session expired — please sign in again" toast, then reloads.
**Manual check:** Confirm `if(r.status === 401)` block exists at line ~1188 in index.html (already verified in pre-deploy checks).

---

### T09 — sbFetch Timeout
**Mechanism:** 15s AbortController timeout on every Supabase call.
**Verify via:** DevTools → Network tab → check any Supabase request has been initiated (no hanging indefinite requests).

---

### T10 — Worker Probe
**Steps:**
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
```
**Pass:** Response includes `"version":"v4-bc-proxy"` and `"env_key_set":true`.
**Fail:** `"version":"v3-env-fallback"` → Worker not yet updated (GitHub Actions may not have run yet due to missing CF secrets).

---

### T11 — Health Check Script
**Steps:**
```bash
bash scripts/health-check.sh
```
**Pass:** WORKER ✓, PAGES ✓, SUPABASE ✓ (HTTP 403 on SUPABASE REST is acceptable — means it's responding, anon key required for data access).

---

### T12 — Ecommerce Intel Module Navigation
**Steps:**
1. Navigate to Ecommerce Intel (sidebar — Owner/Admin/Manager role only)
**Pass:** Module renders with 6 tabs visible: Exec Dashboard, GMC+Images, SEO, Merchandising, Products, Integrations.
**Pass:** Header shows "⚙ Connect BC" button (since BC secrets not set yet — expected).
**Fail:** White page, JS error, module not in sidebar.

---

### T13 — Ecommerce Intel Degraded State
**Steps:**
1. Click "⚙ Connect BC"
**Pass:** Modal shows setup instructions (wrangler secret put commands) — NOT a token input field.
**Pass:** No CORS errors in console.
**Fail:** Old-style token input form appears (means outdated JS was deployed).

---

### T14 — Executive Signals / Dashboard KPIs
**Steps:**
1. Navigate to Dashboard
2. Check KPI cards
**Pass:** KPI cards render (data or zero state). `maybeAutoSnapshotKPIs()` ran silently.
**Check:** No `[kpi] auto-snapshot:` error in console.

---

### T15 — Runtime Telemetry
**Steps:** After login, in DevTools console:
```javascript
console.log('Hydrated:', window.__AOS_HYDRATED__)
```
**Pass:** `true`

**Also check:**
```javascript
console.log('Quote obs:', _quoteObs)
```
**Pass:** Object with `attempts:0, successes:0, failures:0` (no saves yet in this session).

---

### T16 — Degraded State Handling
**Steps:**
1. In Settings, enter an invalid Supabase URL (e.g. `https://invalid.supabase.co`)
2. Reload
**Pass:** App loads in local-only mode (prefill data shows). Quotes show empty state. No infinite spinner.
**Pass:** Toast: "Quotes failed to load — refresh to retry" (not a silent failure).

---

## PASS / FAIL THRESHOLD

| Category | Tests | Must-pass |
|----------|-------|-----------|
| Boot + auth | T01, T02 | Both |
| Navigation | T03 | Pass |
| Quote workflow | T04, T05, T06, T07 | All 4 |
| Network hardening | T09, T10, T11 | T10 and T11 at minimum |
| Ecommerce module | T12, T13 | Both |
| Telemetry | T14, T15 | T14 |
| Degraded state | T16 | Pass |

**Rollback if:** T05 (quote save) or T06 (quote reload) fail. These represent the core operational workflow.

---

## KNOWN ACCEPTABLE NON-PASS STATES

| Test | Non-pass state | Why acceptable |
|------|---------------|----------------|
| T10 Worker version | `"version":"v3-env-fallback"` | GitHub Actions needs CF secrets set first |
| T12 BC sidebar icon | Not visible in non-Owner roles | Role restriction is correct |
| T13 Connect BC button | May show "checking…" briefly | `bcRefreshConfigured()` is async |
