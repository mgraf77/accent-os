# Known Issues — AccentOS + Cognition Engine
> As of: 2026-05-08

---

## 🔴 Active Blockers

### Issue 1: Cloudflare Worker Proxy — 400 on AI Parse
**Severity:** High — blocks Quote Generator AI feature
**Symptom:** `POST https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages` returns 400
**Root cause:** Worker commit `2dca2a6` (arrayBuffer fix) may not have been redeployed
**Status:** BLOCKED ON MICHAEL
**Resolution path:**
1. Test: run the fetch probe in browser console (see NEXT_STEPS.md)
2. If old code: run `wrangler deploy` from local terminal
3. If new code live but still 400: get Network tab Response body from DevTools; may be model-ID issue (`claude-sonnet-4-20250514` may need update to `claude-sonnet-4-6`)

### Issue 2: Several SQL Migrations Not Run
**Severity:** Medium — some modules degrade gracefully; none are broken
**Affected migrations:** M21 through M40 (various modules)
**Symptom:** Modules that depend on these tables show empty state instead of data
**Status:** BLOCKED ON MICHAEL (SQL Editor paste required)
**Note:** All migrations are written and in `sql/` directory; idempotent with `IF NOT EXISTS`

---

## 🟡 Known Technical Debt (Operational, Not Blocking)

### Debt 1: cross-module navigation uses setTimeout(80ms)
**Files:** Daily Brief tiles, Deal Optimizer, Decision Engine, internal_meetings
**Risk:** Fragile under slow render — if page render takes >80ms, the follow-up action fires before DOM is ready
**Mitigation:** Tolerable at current page sizes; retirement trigger = first observed failure in production
**Retirement:** Refactor `goTo()` to accept a callback

### Debt 2: Customer ↔ Quote FK is name-match, not UUID
**Files:** `js/customers.js`, `js/pipeline.js` (deal creation)
**Risk:** Breaks under typo/abbreviation drift between customer name and quote customer_name field
**Mitigation:** Only affects cross-module linking, not CRUD operations
**Retirement:** When Quote save flow adds a `customer_id` UUID dropdown

### Debt 3: `_toCsv()` duplicated 3×
**Files:** `js/inventory.js`, `js/reports.js`, `js/demand_forecast.js`
**Risk:** Low — changes to CSV format require updating 3 places
**Retirement:** 4th use (extract to shared util per BUILD_INTELLIGENCE.md rule)

### Debt 4: `module_modes.json` not browser-writable
**Files:** `module_modes.json`, `js/module_modes.js`
**Risk:** Low — UI toggles update in-memory state but changes require Claude command to persist to JSON
**Retirement:** When Supabase `user_module_overrides` table is in use (M40 written, not yet run)

### Debt 5: `vendor_id` is TEXT, not UUID
**Scope:** All vendor-related tables
**Risk:** Medium-term schema inconsistency — all other entities use UUID PKs
**Mitigation:** Acceptable until Windward integration, which is the natural migration point
**Retirement:** When Windward sync goes live — natural re-keying opportunity

---

## 🟢 Low Risk / Cosmetic

### Issue 3: MASTER.md §3 module status list is stale
**Current state:** Still references v6.10.2 state; actual version is ~v6.10.59+
**Impact:** None operational — MASTER.md is a reference doc, not runtime
**Fix:** Batch update in next doc-commit session

### Issue 4: Cognition Engine docs on feature branch, not main
**Current state:** `cognition-engine/` exists only on `claude/cognition-engine-architecture-Czqa7`
**Impact:** Not visible on `main` until PR merge
**Note:** Intentional until governance restructure decides where these docs live
