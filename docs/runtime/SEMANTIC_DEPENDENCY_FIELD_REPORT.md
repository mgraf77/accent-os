# SEMANTIC DEPENDENCY FIELD REPORT
> AccentOS — Phase 1 Semantic Topology Hardening Sprint
> Generated: 2026-05-11 · Based on: register() substrate audit (40 registered modules, 12 unregistered)
> Methodology: register() call analysis + grep verification against actual file contents + index.html global audit

---

## REALITY AUDIT

| Claim | Status |
|-------|--------|
| Register() substrate completeness | PARTIAL — 40/52 modules registered |
| Provides[] accuracy | MOSTLY ACCURATE — 1 confirmed dead reference (AI-1) |
| Consumes[] completeness | INCOMPLETE — index.html globals systematically undeclared |
| Dependency topology visibility | PARTIAL — module-to-module visible; index.html→module invisible |

---

## SUBSTRATE COMPLETENESS

### Registered Modules (40)

activity_feed, alerts, bulk_select, calendar, commission, competitive_pricing, csv_import, customers, dashboard_module, deal_optimizer, decision_engine, deliveries, digest, employees, health, internal_meetings, jobs, knowledge_hub, knowledge_module, labels, marketing, mgmt_module, module_modes, my_tasks, pipeline_analytics, pipeline_module, quick_actions, quotes_module, repoutreach_module, saved_filters, settings_module, showroom_displays, supabase_categories, trade_partners, vendor_filters, vendor_scoring, vendor_scoring_helpers, vendors_module, vendors_overflow, warranty

### Unregistered Modules (12)

| Module | Notes |
|--------|-------|
| bulk_vendor_ops.js | Bulk operations on vendor data — likely high VD coupling |
| demand_forecast.js | Analytics — likely DEALS + INVENTORY consumer |
| global_search.js | Cross-module search — likely high fan-in from many globals |
| inventory.js | Core inventory data — likely INVENTORY global provider |
| inventory_analytics.js | Analytics over inventory — depends on inventory.js |
| portal_preview.js | Portal UI — unclear coupling profile |
| price_book.js | Pricing data — likely VD + INVENTORY coupling |
| purchase_orders.js | PO management — likely JOBS/VENDORS coupling |
| reports.js | Reporting — likely high fan-in from many globals |
| trade_designer_portal.js | Trade portal — unclear coupling profile |
| vendor_rep_portal.js | Rep portal — consumes VD, REP_DIRECTORY, COOP_FUNDS, SHOWROOM_DISPLAYS |
| vendor_score_import.js | Score CSV import — consumes CAT_DEFS, sbBulkSaveVendorScores |

**Note:** inventory.js is the most strategically important unregistered module. INVENTORY is likely consumed by multiple unregistered modules (demand_forecast, inventory_analytics, price_book, purchase_orders) and possibly by registered ones (decision_engine, competitive_pricing). Its coupling profile is invisible.

---

## COUPLING DENSITY ANALYSIS

### Universal Infrastructure (not tracked in dependency risk)

These are consumed by nearly every module. They are architectural primitives, not semantic coupling signals:

| Global | Provider | Consumers | Notes |
|--------|----------|-----------|-------|
| `$` | shell_utils | ~28 modules | DOM selector — universal |
| `CU` | shell_utils | ~28 modules | Current user — universal |
| `esc` | shell_utils | ~22 modules | HTML escape — universal |
| `toast` | shell_utils | ~20 modules | Toast notification — universal |
| `sbFetch` | shell_utils | ~18 modules | Supabase REST wrapper — universal |
| `sbConfigured` | shell_utils | ~18 modules | Supabase config check — universal |

These consume relationships do not constitute semantic coupling for orchestration purposes. They are runtime infrastructure shared by all modules.

### Semantic Coupling Map (non-infrastructure only)

| Provider Module | Provided Item | Consumer Modules | Fan-out |
|----------------|---------------|-----------------|---------|
| vendor_scoring_helpers | `weightedScore` | dashboard_module, mgmt_module, digest, vendors_module, vendor_filters | **5** |
| vendor_scoring_helpers | `computeVendorTier` | vendor_filters, vendors_overflow, deal_optimizer | **3** |
| vendor_scoring_helpers | `CHANGELOG` | dashboard_module, deal_optimizer, activity_feed, vendors_overflow | **4** |
| vendor_scoring_helpers | `scoreColor`, `dispScore`, `fmt$`, `colSummary` | vendors_overflow | 1 each |
| pipeline_module | `DEALS` | dashboard_module, pipeline_analytics, commission, mgmt_module, deal_optimizer, decision_engine | **6** |
| pipeline_module | `STAGES` | dashboard_module, mgmt_module | **2** |
| bulk_select | `bulkSelRegister`, `bulkSelBar`, `bulkSelHeaderCheckbox`, `bulkSelCheckbox` | customers, jobs, trade_partners, showroom_displays | **4** each |
| customers | `CUSTOMERS` | deliveries, warranty | **2** |
| jobs | `JOBS` | deliveries | **1** |
| quotes_module | `QUOTES` | decision_engine | **1** |
| vendors_overflow | `exportCSV`, `openAddVendor` | vendors_module | **1 each** |
| deal_optimizer | `getChangeLog` | vendors_overflow | **1** |
| vendor_scoring | `sbAppendChangelog` | vendor_scoring_helpers | **1** |
| dashboard_module | `computeDailyBrief` | digest | **1** |

### Index.html-Hosted Globals (invisible to register() substrate)

These are defined in index.html, not in any module. They are consumed by modules but have no provider declaration.

| Global | Definition Location | Consumers | Risk |
|--------|--------------------|-----------|----|
| `CAT_DEFS` | index.html:1060 | vendor_scoring_helpers, repoutreach_module, vendors_overflow, vendor_scoring, vendor_score_import | **HIGH** — undeclared, widely consumed |
| `REP_DIRECTORY` | index.html:1057 | repoutreach_module, vendors_module, vendor_rep_portal | MEDIUM — undeclared |
| `getVPCats` | index.html:902 | vendor_filters, vendor_scoring, vendors_module | MEDIUM — undeclared |
| `goTo` | index.html (+ wrapped by module_modes, alerts) | quick_actions, quotes_module | LOW — two consumers |
| `VD` | index.html (inferred) | 9 modules | **HIGH** — most-consumed semantic global, provider unclear |

**Note on VD:** VD (vendor data array) is consumed by 9 modules but its provider is not declared in any register() call. It appears to be loaded into the global scope from index.html or an unregistered module. This is the single highest-risk undeclared dependency in the entire codebase.

---

## HIGHEST COUPLING-DENSITY MODULES

Ranked by total unique semantic coupling surface (excluding infrastructure globals):

| Rank | Module | Unique Semantic Deps (in) | Unique Provides (out fan-out) | OCL Risk |
|------|--------|--------------------------|-------------------------------|---------|
| 1 | `vendors_overflow.js` | 7 (CHANGELOG, VD, getChangeLog, computeVendorTier, weightedScore, scoreColor, dispScore, fmt$, colSummary, CAT_DEFS*) | 2 consumed by vendors_module | **VERY HIGH** |
| 2 | `vendors_module.js` | 4 (VD, weightedScore, exportCSV, openAddVendor, getVPCats*) | 0 | **HIGH** |
| 3 | `dashboard_module.js` | 6 (DEALS, VD, STAGES, weightedScore, CHANGELOG, CAT_DEFS*) | 1 (computeDailyBrief → digest) | **HIGH** |
| 4 | `vendor_scoring_helpers.js` | 2 (VD, sbAppendChangelog) + CAT_DEFS* | 11 items, fan-out to 7+ modules | **HIGH** — both ways |
| 5 | `deal_optimizer.js` | 3 (CHANGELOG, VD, DEALS) | 1 (getChangeLog → vendors_overflow) | MEDIUM-HIGH |
| 6 | `decision_engine.js` | 3 (DEALS, VD, QUOTES) | 0 | MEDIUM-HIGH |
| 7 | `digest.js` | 2 (computeDailyBrief, weightedScore) | 0 | MEDIUM |
| 8 | `showroom_displays.js` | 2 (VD, 4x bulkSel) | 0 | MEDIUM |
| 9 | `deliveries.js` | 2 (CUSTOMERS, JOBS) | 0 | MEDIUM |
| 10 | `vendor_filters.js` | 2 (VD, computeVendorTier) | 0 | MEDIUM |

*Asterisk: consumes this global but does not declare it in consumes[].

---

## LOWEST COUPLING-DENSITY MODULES (SAFE FOR BATCHING)

These modules consume only infrastructure globals. Zero unique semantic dependencies.

| Module | Provides | Notes |
|--------|----------|-------|
| `calendar.js` | CAL_EVENTS, sbLoad/SaveCalendarEvent* | Pure Supabase CRUD, no semantic deps |
| `knowledge_hub.js` | ARTICLES, sbLoad/Save/DeleteArticle* | Pure Supabase CRUD, no semantic deps |
| `marketing.js` | MARKETING_CAMPAIGNS, MARKETING_ASSETS* | Pure Supabase CRUD, no semantic deps |
| `labels.js` | LABEL_BATCHES | Pure Supabase CRUD, no semantic deps |
| `internal_meetings.js` | IM_MEETINGS | Pure Supabase CRUD, no semantic deps |
| `employees.js` | EMPLOYEES, EMPLOYEE_SCORES* | Pure Supabase CRUD, no semantic deps |
| `my_tasks.js` | MY_TASKS | localStorage only, no semantic deps |
| `saved_filters.js` | getSavedFilters, saveFilterSet* | localStorage only, no semantic deps |
| `csv_import.js` | csvImportFlow, csvEnumNormalizer* | Pure helper, no semantic deps |
| `health.js` | health | sbFetch only |
| `settings_module.js` | settings, changeMyPassword | Infrastructure only |
| `knowledge_module.js` | knowledge, sendChat | Supabase + CU only |
| `alerts.js` | ALERTS, sbLoadAlerts* | Supabase CRUD + CU only |
| `supabase_categories.js` | sbLoadCategories* | Supabase CRUD + CU only |
| `module_modes.js` | MODULE_MODES, canSeeModule | CU only |

---

## HIDDEN DEPENDENCY HOTSPOTS

### 1. CHANGELOG Ownership Split (3-way)

Three modules own different aspects of CHANGELOG with no clear canonical owner:

- `vendor_scoring_helpers.js` — owns the CHANGELOG runtime global (provides CHANGELOG)
- `vendor_scoring.js` — owns CHANGELOG persistence (provides sbLoadChangelog, sbAppendChangelog)
- `deal_optimizer.js` — owns CHANGELOG per-vendor accessors (provides getChangeLog, saveChangeLog)

**Risk:** Adding to any of these modules risks touching the same conceptual entity. Batching any two together is SCI=0 only because the coupling is already resolved. Batching any of them with a module that consumes CHANGELOG is a potential SCI.

### 2. VD Global (undefined provider)

VD is consumed by 9 modules (competitive_pricing, deal_optimizer, decision_engine, mgmt_module, repoutreach_module, showroom_displays, vendor_filters, vendor_scoring_helpers, vendors_module, vendors_overflow) but its provider is not declared in any register() call. It is likely initialized in index.html or the unregistered vendor domain. Until VD has a declared provider, it is invisible to the dependency substrate.

### 3. CAT_DEFS (index.html-hosted, widely consumed)

CAT_DEFS is a scoring category definition array embedded in index.html. Five modules consume it, none declare it. It has no versioning, no mutation contract, and no rollback path. Any change to CAT_DEFS in index.html silently affects all five consumer modules.

### 4. Initialization Chain: vendors_overflow

vendors_overflow must initialize AFTER: vendor_scoring_helpers (for weightedScore, computeVendorTier, CHANGELOG, scoreColor, dispScore, fmt$, colSummary), deal_optimizer (for getChangeLog), and VD (for vendor data). This creates a 3-deep initialization dependency chain that is enforced only by load order in index.html, not by any explicit contract.

### 5. vendors_module → vendors_overflow Circular-Pattern Risk

vendors_module consumes exportCSV and openAddVendor from vendors_overflow. vendors_overflow consumes CHANGELOG from vendor_scoring_helpers. vendor_scoring_helpers consumes sbAppendChangelog from vendor_scoring. This creates a 4-deep transitive chain: vendors_module depends on vendors_overflow depends on vendor_scoring_helpers depends on vendor_scoring. Any change in vendor_scoring can cascade to vendors_module through 3 intermediate hops.

---

## DEAD REFERENCES

| Module | Dead Item | Location | Classification | Status |
|--------|-----------|----------|---------------|--------|
| vendors_module.js | `openVendorScoreCsvPaste` | provides[] + onclick button | AI-1 (confirmed Run 1) | Carried — not yet resolved |

**Note:** vendor_score_import.js is unregistered and does not define openVendorScoreCsvPaste. The function would be auto-generated by csvImportFlow with key='vendorScore' — but vendor_score_import.js does not use csvImportFlow. The button renders when canImportScores is true but the function doesn't exist.

---

## IMPLICIT GLOBALS

Globals consumed by modules but not declared in any provides[]:

| Global | Type | Known Consumers | Declared? |
|--------|------|----------------|-----------|
| `VD` | Runtime array (vendor data) | 9+ modules | NO |
| `CAT_DEFS` | index.html constant array | 5 modules | NO |
| `REP_DIRECTORY` | index.html constant array | 3 modules | NO |
| `getVPCats` | index.html function | 3 modules | NO |
| `goTo` | index.html function | 2 modules + wrappers | NO |
| `SUPABASE_URL` | Environment/config constant | vendor_scoring | Consumed as global, no module owns it |

---

## MODULES SAFE FOR FUTURE LOW-SCI BATCHING

**Cohort 5 candidates** (zero semantic coupling — could form a zero-SCI batch):

Group A (pure Supabase CRUD):
- calendar.js, employees.js, knowledge_hub.js, internal_meetings.js, marketing.js

Group B (localStorage / utility):
- my_tasks.js, saved_filters.js, csv_import.js, module_modes.js

Group C (lightweight infrastructure):
- health.js, settings_module.js, knowledge_module.js

**Note:** Any combination within or across these groups would produce SCI=0 by inspection, since none consume from each other.

---

## MODULES DANGEROUS FOR FUTURE BATCHING

These should be treated as HIGH-SCI-RISK for any parallel execution:

| Module | Risk Reason |
|--------|-------------|
| vendors_overflow | Consumes from 5+ provider modules |
| vendors_module | Consumes from vendors_overflow (transitive chain) |
| dashboard_module | Consumes from 6 distinct modules |
| vendor_scoring_helpers | Both high-fan-out provider AND consumer of CAT_DEFS |
| deal_optimizer | CHANGELOG/VD/DEALS triple dependency |
| digest | computeDailyBrief + weightedScore cross-module |
| deliveries | Cross-domain: CUSTOMERS + JOBS |
| warranty | Cross-domain: CUSTOMERS |

Do not batch these with any module that touches their provide/consume chains.
