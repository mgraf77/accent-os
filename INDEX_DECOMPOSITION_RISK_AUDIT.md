# Index Decomposition Risk Audit - AccentOS

This document identifies risks and strategies for moving the remaining core logic from `index.html` into specialized files in `js/`.

## 1. Current State of `index.html`

The following large logic blocks remain in `index.html`:

- **Auth & Shell Orchestration:** (~400 lines) - Critical for startup.
- **Supabase Persistence Helpers:** (~500 lines) - Used by all modules.
- **Vendor Ranking Module:** (~2000 lines) - The largest single feature.
- **Quote Generator Module:** (~600 lines) - Highly interactive.
- **Knowledge Engine:** (~150 lines).
- **Dashboard & Mgmt Dashboard:** (~600 lines).

## 2. High-Risk Tightly Coupled Regions

### The "Hydrate" Bottleneck
`hydrateFromSupabase()` in `index.html` calls `sbLoad*` functions for every module.
- **Risk:** Moving a loader function to an external file without ensuring it's defined before `hydrate` is called will cause a `ReferenceError`.
- **Mitigation:** Loader functions should be registered in a central `LOADERS` registry, or `hydrate` should check for function existence (`typeof X === 'function'`).

### Navigation (`goTo` and `pages` dispatcher)
The `goTo` function maps strings to function references in a local `pages` constant.
- **Risk:** Moving a page render function (like `vendors`) to an external file makes the local `pages` map potentially stale if not updated carefully.
- **Mitigation:** Use a global `PAGE_REGISTRY` that modules can register themselves into.

## 3. Shared-State Assumptions

- **Global Arrays:** Modules assume `VD`, `QUOTES`, `CUSTOMERS`, etc., are available globally.
- **Mutation Patterns:** Many modules mutate these global arrays directly (e.g., `QUOTES.push(q)`).
- **Risk:** Direct mutation makes it hard to track state changes across files.
- **Strategy:** Move toward setter functions (e.g., `addQuote(q)`) that handle persistence and state update in one place.

## 4. Extraction Candidates (Priority Order)

1. **Vendor Ranking:** Move to `js/vendors.js`. This is the biggest win for file size.
2. **Quote Generator:** Move to `js/quotes_engine.js`.
3. **Core API / Supabase:** Move `sbFetch`, `sbKey`, etc., to `js/core_api.js`.
4. **Auth:** Move `doLogin`, `doLogout`, role logic to `js/auth.js`.

## 5. Modularization Strategy (Recommended)

1. **Phase 1: Pure Move.** Extract functions verbatim to `js/*.js` and add `<script>` tags. Ensure they load *after* the core API but *before* the boot logic.
2. **Phase 2: Registry Pattern.** Implement `MODULE_REGISTRY` to handle navigation, hydration, and role-gating declaratively.
3. **Phase 3: State Encapsulation.** Move global arrays into "Stores" with defined Get/Set APIs.
