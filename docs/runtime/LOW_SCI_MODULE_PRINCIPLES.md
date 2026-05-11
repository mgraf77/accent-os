# LOW-SCI MODULE DESIGN PRINCIPLES
> AccentOS — Phase 2 Semantic Observability Prep Sprint
> Written: 2026-05-11 · Version: 1.0
> Purpose: Define how future modules should be architected to preserve orchestration viability

---

## BACKGROUND

The N=2 experiment established that semantic coupling density, not branch count, is the primary driver of coordination overhead. Runs 2 and 3 both achieved zero variable OCL by design — they selected zero-SCI batches, not because the modules were inherently simple, but because the modules were semantically isolated from each other.

This document codifies the design principles that make a module a zero-SCI batching candidate. Following these principles when writing new modules means they will naturally be available for future parallel execution without needing remediation.

These principles are also useful for evaluating existing modules before a batching decision.

---

## CORE PRINCIPLE

**A module should be understandable and testable in isolation.**

If you cannot describe what a module does without referencing another specific module (not just infrastructure), the module is not semantically isolated and carries coupling risk.

---

## PRINCIPLE 1: Explicit Contracts Only

**Rule:** Every symbol consumed from another module must appear in consumes[]. Every symbol provided to other modules must appear in provides[].

**Why:** The register() substrate is the only machine-readable dependency map. Undeclared consumption is invisible to SCI pre-check and produces false confidence in coupling analysis.

**In practice:**
```javascript
// BAD — calls CAT_DEFS without declaring it
register({ name: 'my_module', provides: ['myFn'], consumes: ['CU'] });
function myFn() {
  CAT_DEFS.forEach(...);  // undeclared consumption of index.html global
}

// GOOD — declares the consumption
register({ name: 'my_module', provides: ['myFn'], consumes: ['CU', 'CAT_DEFS'] });
function myFn() {
  CAT_DEFS.forEach(...);
}
```

**Special case — index.html globals:** CAT_DEFS, REP_DIRECTORY, getVPCats, VD, goTo are not module-provided. Add them to consumes[] with a comment `// index.html-hosted` to distinguish from module dependencies.

---

## PRINCIPLE 2: Minimal Global Footprint

**Rule:** A module should write to as few globals as possible. Each global a module writes is a potential coupling surface.

**Target:** 0–2 globals written per module.

**In practice:**
```javascript
// BAD — module writes to 5 globals
let THING_A = [];
let THING_B = {};
let THING_C = 0;
let thingState = null;
let thingCache = {};

// BETTER — consolidate state into one scoped variable + one public global
let _thingState = { b: {}, c: 0, cache: {} };  // private, not in provides[]
let THING_A = [];  // the one global this module owns, declared in provides[]
```

**Corollary:** If a module needs to write to a global it does not own, that is a semantic coupling incident by design. Extract the mutation into the owning module.

---

## PRINCIPLE 3: Initialization Isolation

**Rule:** A module should not require another module's initialization to have already completed before it can load. If it does, this must be declared explicitly and the dep typed as DEP-4 in the MODULE CONTRACT.

**Why:** Hidden init ordering is the most common source of DEP-4 violations and is invisible to SCI pre-check.

**In practice:**
```javascript
// BAD — assumes CHANGELOG is populated before this module loads
function renderFeed() {
  CHANGELOG.forEach(c => { /* renders immediately */ });  // fails if CHANGELOG not yet loaded
}

// BETTER — lazy evaluation with typeof guard
function renderFeed() {
  const log = (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) ? CHANGELOG : [];
  log.forEach(c => { /* renders */ });
}
```

**Exception:** Some init coupling is unavoidable (e.g., pipeline_module must have loaded DEALS before dashboard_module renders). In these cases, declare the init coupling explicitly in consumes[] and in the MODULE CONTRACT.

---

## PRINCIPLE 4: Semantic Ownership Clarity

**Rule:** Each module should own exactly one semantic domain. It should be immediately clear what the module does and does not own.

**Signs of good ownership clarity:**
- "This module owns customer data persistence and the CUSTOMERS global"
- "This module owns the commission calculation UI, reads DEALS, writes nothing"
- "This module owns bulk-selection UI state, provides utilities for table pages"

**Signs of poor ownership clarity:**
- "This module owns vendor scoring, except the helpers are in another module, and the changelog is split between three modules"
- "This module renders vendors but also provides exportCSV which is called by a different vendor module"

**In practice:** If a function in your provides[] is primarily called by a different module, consider whether it belongs in that module instead.

---

## PRINCIPLE 5: Dependency Declaration Discipline

**Rule:** Every time a new function call or global reference is added to a module, check whether the symbol's provider is in consumes[]. If not, add it before committing.

**When to update register():**
- Adding a new function call from another module → add to consumes[]
- Adding a new global that this module provides → add to provides[]
- Removing a function → remove from provides[] if it's gone
- Moving a function to another module → update provides[] in both

**The register() call should be the first thing to change, not the last.**

---

## PRINCIPLE 6: Coupling Minimization Patterns

### Pattern A: Dependency Injection over Global Reads

Instead of reading a global directly, accept it as a parameter:

```javascript
// BAD — reads CHANGELOG global directly (coupling to owner of CHANGELOG)
function renderOptimizer() {
  const recent = CHANGELOG.filter(c => ...);
}

// BETTER — accept as parameter (caller controls the dep)
function renderOptimizer(changelog) {
  const recent = changelog.filter(c => ...);
}
```

**When to use:** When a function is used in multiple contexts and the global provider might vary.

### Pattern B: Provider-Owned Accessors

Instead of consuming a global directly and computing over it, request a computed result from the provider:

```javascript
// BAD — consumer duplicates provider's computation logic
function myRender() {
  const tier = VD.find(v => v.id === id)?.tier;  // duplicates tier logic
}

// BETTER — call an accessor that the provider owns
function myRender() {
  const tier = computeVendorTier(vendor);  // calls the owner's function
}
```

**When to use:** When multiple modules need the same derived value from a global. Consolidates the derivation in the provider.

### Pattern C: Soft-Dependency Feature Gates

For non-critical cross-module function calls, use a typeof guard to degrade gracefully:

```javascript
// BAD — hard coupling; fails if refreshAlertBell isn't loaded
function saveTask() {
  saveMyTasks();
  refreshAlertBell();  // hard dep with no guard
}

// BETTER — soft coupling; continues even if dep not available
function saveTask() {
  saveMyTasks();
  if (typeof refreshAlertBell === 'function') refreshAlertBell();
}
```

**When to use:** Advisory deps (DEP-7), optional features, cross-domain UI coordination.

### Pattern D: Avoid Cross-Domain State Reads at Init Time

Modules that render on page load should not read from other modules' globals during initialization. Read only when the user navigates to the relevant page.

```javascript
// BAD — reads DEALS at module load time
let _dealsCache = DEALS.lead.length;  // fails if pipeline_module hasn't loaded yet

// BETTER — compute on demand
function getOpenDealCount() {
  return typeof DEALS !== 'undefined' ? (DEALS.lead?.length || 0) : 0;
}
```

---

## PRINCIPLE 7: Module Size Discipline

**Rule:** If a module's provides[] has more than 8–10 items, consider whether it should be split.

**Why:** High-provides modules become high-fan-out providers. Every module that consumes them becomes a potential SCI coupling. Smaller, more focused modules reduce the blast radius of any change.

**Signs a module should be split:**
- Provides[] has 10+ items
- Items in provides[] span two distinct concerns (e.g., data persistence + UI rendering)
- Consumers only use a subset of provides[] items

**Reference:** vendor_scoring.js has 15 provides[]. This is a split candidate — persistence functions (sbLoad*, sbSave*) could be separated from the COOP_FUNDS data global.

---

## CHECKLIST FOR NEW MODULES

Before committing a new module's register() call, verify:

```
□ All consumed symbols are in consumes[] (no undeclared consumption)
□ All provided symbols exist in the file (grep each one — HR-2)
□ index.html-hosted globals noted in consumes[] with comment
□ Global mutation count ≤ 2
□ Init-time deps documented (if any)
□ Ownership domain is single and coherent (one sentence describes it)
□ No cross-domain state reads at module load time
□ MODULE CONTRACT drafted (or at minimum SCI risk class assigned)
□ Dep type classified for each non-infrastructure consumes[] item
```

---

## MEASUREMENT

A module designed with these principles should achieve:
- MODULE_ISOLATION_SCORING.md IQS ≥ 80 (Tier 1)
- SCI class = SCI-0 for all batching candidates
- DEPENDENCY_FIELD_REPORT.md "Lowest Coupling-Density" status

Run 2 and Run 3 batches demonstrated that IQS ≥ 80 modules can be combined into any N=2 batch with zero pre-check SCIs. These principles are the design-time encoding of that empirical finding.
