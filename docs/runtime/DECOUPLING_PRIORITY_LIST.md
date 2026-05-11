# DECOUPLING PRIORITY LIST
> AccentOS — Phase 1 Semantic Topology Hardening Sprint
> Written: 2026-05-11 · Version: 1.0
> Purpose: Rank modules and coupling relationships by orchestration risk and isolation ROI

---

## RANKING METHODOLOGY

Four dimensions scored 1–5:
- **Semantic risk:** How much damage does this coupling cause if unresolved?
- **Orchestration blocker:** Does this coupling prevent future parallel execution?
- **OCL amplification:** Does this coupling inflate coordination overhead during N=2 runs?
- **Isolation win:** How tractable is the decoupling? High = easy, Low = hard

**Priority score = Semantic risk + Orchestration blocker + OCL amplification + (Isolation win × 1.5)**

---

## TOP 10 DECOUPLING TARGETS

### #1 — VD: Declare a registered provider

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 5 | Consumed by 9+ modules. No declared owner. Changes are untraceable. |
| Orchestration blocker | 5 | Any module touching VD cannot be batched with any other VD consumer. |
| OCL amplification | 5 | Hidden dep in 9 modules means 9 potential SCI incidents per batch containing VD consumers. |
| Isolation win | 4 | Solution: add VD to provides[] of the module that loads it. One-line fix. |
| **Priority score** | **21** | |

**Action:** Identify which module initializes VD (likely index.html inline or an unregistered module). Declare it in that module's provides[]. All consumers should add VD to their consumes[].

**Assumption:** VD is initialized in index.html or in an unregistered module. Needs grep verification before action.

---

### #2 — CAT_DEFS: Declare as index.html-hosted global in all consumers

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 4 | 5 consumers, no provider. Changes to index.html break consumers silently. |
| Orchestration blocker | 4 | Any batch involving a CAT_DEFS consumer carries a hidden cross-batch dep. |
| OCL amplification | 4 | Undeclared dep inflates SCI pre-check uncertainty. |
| Isolation win | 5 | Solution: add 'CAT_DEFS' to consumes[] of all 5 consumers with a comment. No runtime change. |
| **Priority score** | **19.5** | |

**Action:** Add `'CAT_DEFS'` to consumes[] of: vendor_scoring_helpers, repoutreach_module, vendors_overflow, dashboard_module (if confirmed). Document as "(index.html-hosted)" in the dependency contract.

---

### #3 — AI-1 Resolution: openVendorScoreCsvPaste dead reference

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 4 | Button renders when canImportScores=true, calling a function that doesn't exist. Runtime error. |
| Orchestration blocker | 3 | Dead provides[] reference makes vendors_module register() contract inaccurate. |
| OCL amplification | 3 | Carried for 3 runs. Ongoing documentation debt. |
| Isolation win | 5 | Solution A: Remove from provides[] + add the function to vendor_score_import. Solution B: Remove the button + remove from provides[]. |
| **Priority score** | **17.5** | |

**Action:** Either implement openVendorScoreCsvPaste via csvImportFlow in vendor_score_import.js (unregistered — would need registration too) OR remove the dead button and remove from vendors_module provides[]. Document resolution as AI-1 closed.

---

### #4 — vendor_scoring_helpers: CHANGELOG ownership clarification

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 4 | 3 modules own different aspects of CHANGELOG (runtime global, persistence, accessors). |
| Orchestration blocker | 4 | Cannot batch any of the 3 CHANGELOG-owner modules with any CHANGELOG consumer. |
| OCL amplification | 4 | 3-way semantic overlap is the most complex dependency topology in the codebase. |
| Isolation win | 2 | Hard to fully resolve without refactoring. Partial win: document the 3-way split explicitly. |
| **Priority score** | **15** | |

**Action (near-term):** Document in MODULE CONTRACT that CHANGELOG has a 3-way ownership: vendor_scoring_helpers (runtime), vendor_scoring (persistence), deal_optimizer (accessors). This makes the topology visible without requiring refactoring.

**Action (long-term):** Consider making CHANGELOG a first-class module with a single owner. CHANGELOG consumers become pure readers. The persistence and accessor functions become the single module's provides[].

---

### #5 — vendors_overflow: Undeclared CAT_DEFS + full init-chain documentation

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 3 | vendors_overflow is the highest-coupling module. Hidden deps compound its risk. |
| Orchestration blocker | 5 | Effectively a singleton in any batch — cannot be paired with any upstream modules. |
| OCL amplification | 3 | Undeclared CAT_DEFS makes SCI pre-check misleading. |
| Isolation win | 4 | Add CAT_DEFS to consumes[]. Document 3-deep init chain in MODULE CONTRACT. |
| **Priority score** | **17** | |

**Action:** Add `'CAT_DEFS'` to vendors_overflow consumes[]. Write full MODULE CONTRACT documenting the getChangeLog → vendor_scoring_helpers → vendor_scoring init chain.

---

### #6 — dashboard_module: Multi-domain consumer without full consumes declaration

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 4 | Consumes from 6 modules. CAT_DEFS use confirmed (line 133). Not declared. |
| Orchestration blocker | 4 | Cannot be batched with any of its 6 upstream modules. |
| OCL amplification | 3 | Complex fan-in makes SCI pre-check labor-intensive. |
| Isolation win | 3 | Add CAT_DEFS to consumes[]. Document all 6 upstream deps with types. |
| **Priority score** | **15.5** | |

**Action:** Add `'CAT_DEFS'` to consumes[]. Write MODULE CONTRACT documenting all 6 upstreams (DEALS, VD, STAGES, weightedScore, CHANGELOG, CAT_DEFS) with types from DEPENDENCY_TAXONOMY.

---

### #7 — getVPCats, REP_DIRECTORY, goTo: Declare as index.html globals

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 2 | 2–3 consumers each. Not mission-critical. |
| Orchestration blocker | 2 | Minor — consumers are already partially isolated. |
| OCL amplification | 2 | Small surface area but creates false confidence in consumes[] completeness. |
| Isolation win | 5 | One-line fix: add to consumes[] with comment. |
| **Priority score** | **13.5** | |

**Action:** Add `'getVPCats'` to consumes[] of vendor_filters, vendor_scoring, vendors_module. Add `'REP_DIRECTORY'` to consumes[] of repoutreach_module (already done) and vendors_module. Add `'goTo'` to consumes[] of quick_actions (already done) and quotes_module (already done). All with "(index.html-hosted)" comment.

---

### #8 — vendor_score_import.js: Register the module

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 3 | Unregistered module uses CAT_DEFS and sbBulkSaveVendorScores. Invisible to substrate. |
| Orchestration blocker | 2 | Small surface area but resolves AI-1 if combined with #3. |
| OCL amplification | 2 | One of 12 unregistered modules contributing to substrate blind spots. |
| Isolation win | 4 | Add register() call. Define provides and consumes. |
| **Priority score** | **12** | |

**Action:** Add register() to vendor_score_import.js. Provides: `sbBulkSaveVendorScores` (+ any auto-generated csvImportFlow functions if using that pattern). Consumes: `CAT_DEFS`, `sbFetch`, `sbConfigured`, `CU`, `$`, `toast`.

---

### #9 — vendor_scoring: SUPABASE_URL declaration

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 2 | SUPABASE_URL is an environment constant, not a module-provided dep. But it's declared in consumes[] which is semantically incorrect. |
| Orchestration blocker | 1 | Low blocker — SUPABASE_URL won't be in any other module's provides[]. |
| OCL amplification | 2 | Creates confusion in SCI pre-check: is there a provider for SUPABASE_URL? |
| Isolation win | 5 | Reclassify SUPABASE_URL as an environment global in the contract doc. |
| **Priority score** | **11.5** | |

**Action:** In MODULE CONTRACT for vendor_scoring, document SUPABASE_URL as an environment/config global (not a module-provided dep). Optionally reclassify it in consumes[] with a comment.

---

### #10 — inventory.js registration (highest unregistered priority)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Semantic risk | 4 | INVENTORY global is likely consumed by demand_forecast, inventory_analytics, price_book, purchase_orders, possibly decision_engine. All invisible. |
| Orchestration blocker | 3 | Any future batch touching inventory domain will have hidden SCI risk until registered. |
| OCL amplification | 3 | Entire inventory domain is a substrate blind spot. |
| Isolation win | 3 | Requires reading inventory.js to audit provides/consumes before registering. |
| **Priority score** | **13.5** | |

**Action:** Read inventory.js. Identify what globals it provides (likely INVENTORY, possibly INV_ITEMS or similar). Register with accurate provides/consumes. This also unblocks register() for demand_forecast, inventory_analytics, price_book, purchase_orders.

---

## QUICK WINS (Highest isolation win, lowest effort)

These can be completed in a single editing session without reading the files:

1. Add `'CAT_DEFS'` to consumes[] of: vendor_scoring_helpers, vendors_overflow, repoutreach_module, dashboard_module
2. Add `'getVPCats'` to consumes[] of: vendor_filters, vendor_scoring, vendors_module
3. Remove `'openVendorScoreCsvPaste'` from vendors_module provides[] (dead reference)

**Effort:** ~4 Edit calls. No behavioral change. Substrate accuracy improves immediately.

---

## LONG-TERM ARCHITECTURAL BETS

These are not quick wins but are worth tracking as future design targets:

| Target | Description | Requires |
|--------|-------------|---------|
| CHANGELOG module | Consolidate 3-way split into single canonical module | Refactoring, schema audit |
| VD declared provider | Identify or create a module that owns vendor data loading | Finding/creating vendor_data.js |
| index.html global migration | Move CAT_DEFS, REP_DIRECTORY, getVPCats into registered modules | index.html surgery |
| Inventory domain registration | Register all 5 inventory-domain modules | 5 register() calls |
| Full substrate completion | Register remaining 11 modules | Audit + 11 register() calls |
