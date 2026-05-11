# DEPENDENCY TAXONOMY
> AccentOS — Phase 2 Semantic Observability Prep Sprint
> Written: 2026-05-11 · Version: 1.0
> Purpose: Canonical classification system for all dependency types in the AccentOS module substrate

---

## PURPOSE

The register() substrate records provides[] and consumes[] without characterizing the nature of each dependency. This taxonomy provides a precise vocabulary for dependency classification — enabling:
- More accurate SCI pre-checks
- Better batch composition decisions
- Future observability tooling with meaningful category labels
- Clear communication about dependency risk

This is a classification system, not a runtime enforcement mechanism.

---

## TAXONOMY

### DEP-1: Hard Dependency

**Definition:** The consuming module will error, produce incorrect output, or fail to initialize if this dependency is absent or not yet loaded.

**Characteristics:**
- No typeof guard or fallback in the consumer
- Called at initialization time or in a code path executed on first page load
- Module behavior is undefined without it

**Examples:**
- `vendor_scoring_helpers` consuming `CAT_DEFS` — CAT_DEFS.forEach() called with no null check
- `deliveries` consuming `CUSTOMERS` — CUSTOMERS array accessed directly

**Batching implication:** Must be in same batch as provider OR provider must be in an already-committed batch (existing registration).

---

### DEP-2: Soft Dependency

**Definition:** The consuming module degrades gracefully if the dependency is absent. A typeof guard, fallback value, or optional-chaining pattern handles the absent case.

**Characteristics:**
- `typeof dep !== 'undefined'` guard present
- Fallback value provided (e.g., `|| []`)
- Optional chaining (`dep?.method()`) used

**Examples:**
- `vendor_scoring_helpers` consuming `sbAppendChangelog` — called with typeof guard
- `decision_engine` consuming `QUOTES` — array accessed but falls back to empty

**Batching implication:** Lower SCI risk than DEP-1. Still produces OCL if absent — degraded behavior may not be obvious.

---

### DEP-3: Runtime Dependency

**Definition:** The dependency is not required at initialization but is called during normal user interaction. The module loads fine without it but will fail at the point of use.

**Characteristics:**
- Not called during module initialization
- Called in event handlers or user-triggered functions
- May not be obvious from static analysis

**Examples:**
- `vendors_module` consuming `exportCSV` (from vendors_overflow) — called when user clicks Export
- `quick_actions` consuming `goTo` — called when user triggers navigation

**Batching implication:** Does not cause init-time failures but will cause runtime errors. SCI risk is deferred but real.

---

### DEP-4: Initialization Dependency

**Definition:** The dependency must be present (and already executed) at the time the consuming module first loads. Unlike DEP-1, this is specifically about load order, not just presence.

**Characteristics:**
- Consuming module reads the dependency's global state at module-load time
- Side effects of the dependency must have already run
- Cannot be initialized concurrently with the provider

**Examples:**
- `vendors_overflow` consuming CHANGELOG from `vendor_scoring_helpers` — the CHANGELOG global must be populated before vendors_overflow renders
- `digest` consuming `computeDailyBrief` from `dashboard_module` — dashboard_module must have initialized before digest can run

**Batching implication:** Hard initialization ordering constraint. The provider's module and all its own init deps must be committed and loaded before this module runs.

---

### DEP-5: Shared-Global Dependency

**Definition:** Multiple modules read from or write to the same global variable. The variable is not owned by any single module.

**Characteristics:**
- Global defined in index.html or with unclear ownership
- Multiple modules both read it
- No single module declares it in provides[]
- Changes to it affect all consumers simultaneously

**Examples:**
- `VD` (vendor data array) — consumed by 9+ modules, provider not declared
- `CAT_DEFS` — defined in index.html, consumed by 5 modules
- `REP_DIRECTORY` — defined in index.html, consumed by 3 modules

**Batching implication:** Highest risk category. Changes to the underlying data affect all consumers with no traceability. Cannot be fully captured in SCI pre-check because the dependency has no registered provider.

---

### DEP-6: Semantic Dependency

**Definition:** The consuming module implicitly relies on the conceptual model, naming conventions, or data shape of another module — even without a direct function call.

**Characteristics:**
- Not captured in provides[]/consumes[]
- Arises from shared conceptual entities (e.g., both modules interpret `v.s` as vendor score map)
- Can produce subtle semantic collisions if the underlying model changes

**Examples:**
- Multiple modules assuming `VD` entries have `.s` (scores), `.n` (name), `.id` (id) shape
- Both vendor_scoring and deal_optimizer treating CHANGELOG entries with `{ts, vendor, cat, oldVal, newVal}` shape
- All pipeline consumers expecting DEALS to be `{lead:[], qualified:[], quoted:[], negotiating:[], won:[], lost:[]}` shape

**Batching implication:** Not detectable by SCI pre-check alone. Requires schema contract documentation. Changes to data shape in one module can silently break semantic dependencies in others.

---

### DEP-7: Advisory Dependency

**Definition:** The consuming module calls a function from another module but the result is purely informational and does not affect core behavior.

**Characteristics:**
- Used for display, logging, or audit purposes
- Module functions correctly if the advisory dep is absent
- Typically uses typeof guard

**Examples:**
- `sbAuditLog` called in saved_filters, supabase_categories, etc. — purely for audit trail
- `refreshAlertBell` called in my_tasks after toggle — purely for UI feedback

**Batching implication:** Near-zero SCI risk. Can safely batch across different batches from their providers.

---

### DEP-8: Optional Dependency

**Definition:** The consuming module has an explicit feature gate that enables or disables functionality based on whether a dependency is present. The module is designed for this optionality.

**Characteristics:**
- `if(typeof dep === 'function')` style feature check
- Deliberate design choice, not a missing consumes declaration
- Module works in both states (dep present / dep absent)

**Examples:**
- `my_tasks` calling `refreshAlertBell` only if typeof === 'function'
- `activity_feed` calling `sbLoadPipelineEvents` only when needed
- `vendor_scoring_helpers` conditional behavior based on whether sbAppendChangelog is available

**Batching implication:** Zero SCI risk. Optional deps by design do not create coupling incidents.

---

## DEPENDENCY RISK MATRIX

| Type | Name | SCI Risk | Batching Safety | Init-Order Risk |
|------|------|----------|-----------------|----------------|
| DEP-1 | Hard | **HIGH** | Low — must pre-declare | High |
| DEP-2 | Soft | MEDIUM | Medium — degradation risk | Low |
| DEP-3 | Runtime | MEDIUM | Medium — deferred failure | Low |
| DEP-4 | Initialization | **HIGH** | Low — load-order constraint | **Very High** |
| DEP-5 | Shared-Global | **VERY HIGH** | Very Low — undeclared | High |
| DEP-6 | Semantic | HIGH | Low — invisible | High |
| DEP-7 | Advisory | LOW | High | Very Low |
| DEP-8 | Optional | NONE | Very High | None |

---

## APPLICATION TO REGISTER() SUBSTRATE

When writing or auditing a register() call, classify each consumes[] entry by type:

```javascript
// Example with annotated types
register({
  name: 'vendors_overflow',
  provides: ['renderChangelog','openVP','liveScore','exportCSV','openAddVendor','changelog'],
  consumes: [
    'VD',            // DEP-5: shared-global, undeclared provider
    'CU',            // infrastructure (not classified in this taxonomy)
    'CHANGELOG',     // DEP-4: init-time dep from vendor_scoring_helpers
    '$',             // infrastructure
    'esc',           // infrastructure
    'toast',         // infrastructure
    'getChangeLog',  // DEP-1: hard dep from deal_optimizer
    'computeVendorTier', // DEP-1: hard dep from vendor_scoring_helpers
    'weightedScore', // DEP-1: hard dep from vendor_scoring_helpers
    'scoreColor',    // DEP-1: hard dep from vendor_scoring_helpers
    'dispScore',     // DEP-1: hard dep from vendor_scoring_helpers
    'fmt$',          // DEP-1: hard dep from vendor_scoring_helpers
    'colSummary'     // DEP-1: hard dep from vendor_scoring_helpers
    // MISSING: CAT_DEFS (DEP-5: undeclared shared-global from index.html)
  ]
});
```

This annotation discipline is not required in the register() call itself — it belongs in the MODULE CONTRACT document.
