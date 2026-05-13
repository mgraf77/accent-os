# RECONCILIATION_AUDIT.md
> Generated: 2026-05-13 — MASTER_RECONCILIATION_AND_DEPLOYMENT_V1
> Role: Integration Engineer / Release Manager / Runtime Safety Authority
> Base: `main` @ e609662

---

## 1. ACTIVE BRANCHES ENUMERATED

### Code-bearing branches (touch runtime files)

| Branch | Commits ahead of main | Files changed | Risk |
|--------|----------------------|---------------|------|
| `accent-work-514226236373803311` | 5 | index.html, scripts/runtime-health.js, patch_quote.js, module_modes.json, 20+ doc files | LOW |
| `claude/harden-quote-transactions-zukcz` | 2 | index.html, sql/M45_quote_save_rpc.sql, sql/M46_quote_stale_guard.sql | MEDIUM |
| `improve-quote-generator-workflow-5275513777064613019` | 2 | index.html, js/quotes.js | HIGH (conflicts) |
| `claude/harden-operational-workflows-gP9bP` | 1 | index.html | LOW |
| `claude/bigcommerce-integration-setup-fio8z` | 3 | index.html, 6× new js/*.js, sql/M45_bigcommerce_schema.sql, sql/M46_ecommerce_v2_schema.sql | MEDIUM |

### Doc/analysis-only branches (no runtime impact)

| Branch | Commits ahead of main | Content |
|--------|----------------------|---------|
| `ecommerce-intel-v1-247115529123932528` | 2 | docs/ECOMMERCE_INTELLIGENCE_REPORT_V1/V2.md, analysis scripts |
| `klaviyo-marketing-intel-v1-13574086956632958594` | 1 | docs/KLAVIYO_MARKETING_INTELLIGENCE_V1.md |
| `claude/runtime-stabilization-layer-Tneyd` | 3 | STABILIZATION_LAYER.md + audits/ governance/ policies/ registers/ (all doc) |
| `accent-work` | 0 (merged) | Already in main via PR #14 |

### Already merged / irrelevant
- `accent-work` → merged to main via PR #14 (integration/reconcile). COMPLETE.
- All `claude/forge-*`, `claude/cohort*`, `claude/build-*`, planning/research branches → no AccentOS runtime code. IRRELEVANT to this reconciliation.

---

## 2. COMMIT INVENTORY — CODE-BEARING BRANCHES

### accent-work-514226236373803311
```
081999a docs: comprehensive architectural evolution and Stage 1 decomposition planning
9d43d89 chore: architectural evolution and governance compression audit
e20ea6f chore: deep architectural evolution and documentation pass
19e370c chore: repository audit, remediation, and decomposition planning
441e5ed chore: repository audit and operational visibility improvements
```
**Runtime changes in index.html:**
- Adds `console.log('[boot] hydration started')` + `const start = Date.now()` to `hydrateFromSupabase()`
- Adds `console.log('[boot] hydration complete in ${ms}ms')` + `window.__AOS_HYDRATED__ = true` at hydration end
- Removes `openRepOutreach()` function body (large dead UI code, ~60 lines removed)
- Removes one inline TODO comment

**New runtime files:**
- `scripts/runtime-health.js` — runtime health probe script
- `patch_quote.js` — quote patching utility
- `module_modes.json` — module mode configuration

---

### claude/harden-quote-transactions-zukcz
```
c0714b4 feat(quotes): atomic transaction hardening via Supabase RPC (M45)
f57b5bf feat(quotes): V2 hardening — stale detection, draft recovery, observability
```
**Runtime changes in index.html:**
- `sbLoadQuotes()`: adds `updated_at` to select, maps `_updatedAt` on quote objects
- `sbSaveQuote()`: **completely rewrites** save path — removes 3-call REST sequence, replaces with single `POST /rpc/upsert_quote_with_lines` call that is transactionally atomic
- Stale-edit detection: `p_expected_updated_at` param — RPC raises `CONFLICT:` if DB row is newer
- Re-throws errors so `saveQ()` can surface them to the operator (previous version swallowed)

**New SQL:**
- `sql/M45_quote_save_rpc.sql` — `CREATE OR REPLACE FUNCTION upsert_quote_with_lines(...)` — wraps header upsert + line delete + line insert in one Postgres transaction
- `sql/M46_quote_stale_guard.sql` — stale edit guard logic

**New doc:**
- `docs/QUOTE_TRANSACTION_SAFETY.md`

---

### improve-quote-generator-workflow-5275513777064613019
```
b64966d Improve quote generator workflow for real-world sales usage
88d3ab4 Finalize quote generator improvements and address PR audit request
```
**Runtime changes in index.html:**
- Adds mobile CSS for quote generator (`.frow`, `.li-table`, `#q-stickybar` responsive rules)
- **Removes entire inline `sbLoadQuotes()` + `sbSaveQuote()`** from index.html (~120 lines deleted)
- Moves quote functions to new `js/quotes.js` (extraction)
- Adds `_qDirty` dirty-tracking flag on `addLI()`, `LI.splice()`, `Clear` button

**New file:**
- `js/quotes.js` — extracted quote logic (includes `sbLoadQuotes`, `sbSaveQuote`, full quote module)

---

### claude/harden-operational-workflows-gP9bP
```
7a0d26f harden: quote lifecycle safety, auth expiry, boot timeouts
```
**Runtime changes in index.html:**
- `hydrateFromSupabase()`: adds better error surfacing for `sbLoadQuotes` failure (toast instead of silent warn)
- `sbFetch()`: adds 15-second `AbortController` timeout to all Supabase requests
- `sbFetch()`: adds 401 handler — clears JWT, shows "Session expired" toast, reloads after 1.8s
- `sbFetch()`: removes two inline comments (cleanup)
- `addLI()`: adds `_qDirty=true` to dirty tracking
- `renderLI()` delete button: adds `_qDirty=true`
- `saveQ()`: wraps in `_qSaving` guard to prevent double-submit

---

### claude/bigcommerce-integration-setup-fio8z
```
d1b94bb feat(bc): BigCommerce integration runway — read-only adapter + opportunity engine
6290c2a feat(bc): BigCommerce Intelligence V2 — GMC/SEO/Merch scanners + 4 platform adapter runway
9ce0451 docs: update WIP with V2 ecommerce intelligence session summary
```
**Runtime changes in index.html:**
- `MODULE_REGISTRY`: adds `{key:'ecommerce', icon:'◈', label:'Ecommerce Intel', ...}` entry
- Script loading: appends 6 new `<script>` tags at end of `<body>`:
  - `js/bigcommerce_adapter.js?v=6.11.1`
  - `js/ga4_adapter.js?v=6.11.1`
  - `js/gsc_adapter.js?v=6.11.1`
  - `js/klaviyo_adapter.js?v=6.11.1`
  - `js/gmc_adapter.js?v=6.11.1`
  - `js/ecommerce_intelligence.js?v=6.11.1`

**New JS files (all additive, no modification of existing globals):**
- `js/bigcommerce_adapter.js` — BC REST v2/v3 adapter, credentials stored in localStorage
- `js/ga4_adapter.js` — GA4 stub adapter
- `js/gsc_adapter.js` — Google Search Console stub adapter
- `js/klaviyo_adapter.js` — Klaviyo stub adapter
- `js/gmc_adapter.js` — Google Merchant Center stub adapter
- `js/ecommerce_intelligence.js` — 6-tab ecommerce command center (depends on bigcommerce_adapter.js)

**New SQL (NAMING CONFLICT — see §3):**
- `sql/M45_bigcommerce_schema.sql` — BigCommerce cache tables (bc_products_cache, bc_categories_cache, bc_brands_cache, bc_sync_log)
- `sql/M46_ecommerce_v2_schema.sql` — Ecommerce V2 schema

---

## 3. CONFLICT ZONES

### 3.1 CRITICAL: SQL Migration Number Collision

**BLOCKER — cannot deploy both without resolution.**

| Migration # | harden-quote-transactions | bigcommerce-integration |
|-------------|--------------------------|------------------------|
| M45 | `M45_quote_save_rpc.sql` — upsert_quote_with_lines() RPC | `M45_bigcommerce_schema.sql` — BC cache tables |
| M46 | `M46_quote_stale_guard.sql` — stale edit guard | `M46_ecommerce_v2_schema.sql` — Ecommerce V2 schema |

**Resolution:** Quote transactions take M45/M46 (critical ops safety). BigCommerce renumbers to M47/M48.

---

### 3.2 HIGH: index.html Quote Section — Three-Way Divergence

All three branches modify the same ~200-line quote save/load block in index.html:

| Branch | Change to sbSaveQuote | Change to sbLoadQuotes | Change to sbFetch |
|--------|----------------------|----------------------|------------------|
| `harden-quote-transactions` | Rewrites to atomic RPC | Adds `updated_at` + `_updatedAt` | None |
| `improve-quote-generator` | **Deletes** from index.html (moves to js/quotes.js) | **Deletes** from index.html | None |
| `harden-operational-workflows` | None | None | Adds 15s timeout + 401 handler |

**These cannot be auto-merged.** Manual resolution required.

**Resolution strategy:**
- `harden-quote-transactions` wins for the save path logic (atomicity is non-negotiable).
- `harden-operational-workflows` wins for `sbFetch` hardening (timeout + 401 — safe, additive).
- `improve-quote-generator` extraction to `js/quotes.js` is **deferred** — the mobile CSS and dirty-tracking from it can be cherry-picked safely, but the extraction itself conflicts with the inline RPC save logic.

---

### 3.3 MEDIUM: index.html Hydration Function — Two-Branch Overlap

| Branch | Change to hydrateFromSupabase() |
|--------|--------------------------------|
| `accent-work-514226236373803311` | Adds boot timing logs + `window.__AOS_HYDRATED__` |
| `harden-operational-workflows` | Adds toast on sbLoadQuotes failure |

These are in the same function but different lines. **Compatible — can be manually applied.**

---

### 3.4 LOW: `_qDirty` Flag — Two Implementations

| Branch | Implementation |
|--------|---------------|
| `improve-quote-generator` | `_qDirty` on addLI, splice, Clear button |
| `harden-operational-workflows` | `_qDirty` on addLI, splice — identical pattern |

Both implement the same feature identically. **Non-conflicting if only one source is used.** The `harden-operational-workflows` version is the one to take (improve-quote-generator is deferred).

---

### 3.5 LOW: index.html Script Load Order

| Branch | Script changes |
|--------|---------------|
| `bigcommerce-integration` | Appends 6 scripts at end of body |
| All others | No script tag modifications |

No conflict — scripts are appended after all existing ones. Load order is additive.

---

## 4. DUPLICATE TELEMETRY / DUPLICATE MODULE REGISTRATIONS

**No duplicates found** in the merge candidates. Ecommerce module uses key `'ecommerce'` which does not exist in current MODULE_REGISTRY. Quote save path has one implementation path (inline in index.html) that will be replaced by the RPC version.

---

## 5. INCOMPLETE / SPECULATIVE SYSTEMS — DO NOT MERGE

| Branch | Reason to defer |
|--------|----------------|
| `improve-quote-generator-workflow-*` | Extraction conflicts with transactional save; mobile CSS safe to cherry-pick separately |
| `claude/runtime-stabilization-layer-Tneyd` | Design docs only, no runtime code — safe to merge doc tree but zero runtime value |
| `ecommerce-intel-v1-247115529123932528` | Analysis reports + Python scripts — no runtime impact, safe as doc cherry-pick |

---

## 6. STARTUP ORDER RISKS

**Current startup order in index.html (verified):**
1. Inline globals (SUPABASE_URL, ANON_KEY helpers, sbFetch, sbConfigured)
2. Inline module definitions (quotes, pipeline, etc.)
3. `window.addEventListener('DOMContentLoaded', ...)` → `activateApp()` → `hydrateFromSupabase()`
4. External `<script>` tags in order at bottom of `<body>`

**Risk with BigCommerce addition:**
- `ecommerce_intelligence.js` depends on `bigcommerce_adapter.js` — `bigcommerce_adapter.js` must load first.
- Current proposed order: bigcommerce_adapter → ga4 → gsc → klaviyo → gmc → ecommerce_intelligence. **Correct.**
- `ecommerce` key in MODULE_REGISTRY calls `renderEcommerce(el)` which is defined in `ecommerce_intelligence.js`. Module is only rendered on user navigation — DOMContentLoaded fires after all scripts load. **No startup race.**

---

## 7. MISSING GLOBALS CHECK

- `upsert_quote_with_lines` — defined in M45 SQL (must be applied to Supabase before deployment)
- `bcConfigured()` — defined in `bigcommerce_adapter.js` (will be loaded before `ecommerce_intelligence.js`)
- `renderEcommerce()` — defined in `ecommerce_intelligence.js` (referenced from MODULE_REGISTRY dispatcher)
- `window.__AOS_HYDRATED__` — set at hydration end (accent-work branch), referenced nowhere yet (observability only)

---

## 8. SUMMARY VERDICT

| Stream | Merge Candidate | Risk | SQL Dependency |
|--------|----------------|------|----------------|
| accent-work-514226236373803311 (index.html + scripts) | ✅ YES | LOW | None |
| harden-quote-transactions | ✅ YES | MEDIUM | M45 + M46 SQL must run first |
| harden-operational-workflows | ✅ YES | LOW | None |
| bigcommerce-integration (JS + MODULE_REGISTRY + scripts) | ✅ YES | LOW | M47 + M48 SQL (renamed from M45/M46) |
| bigcommerce SQL (renamed to M47/M48) | ✅ YES (deferred apply) | LOW | After M45/M46 quote SQL |
| improve-quote-generator (extraction) | ❌ DEFERRED | HIGH conflict | — |
| improve-quote-generator (mobile CSS only) | ✅ cherry-pick | LOW | None |
| ecommerce-intel-v1 (docs + scripts) | ✅ YES (docs only) | NONE | None |
| klaviyo-marketing-intel (doc) | ✅ YES (doc only) | NONE | None |
| runtime-stabilization-layer (docs) | ✅ YES (doc only) | NONE | None |
