# Decomposition Intelligence Master - AccentOS

This master roadmap synthesizes the extraction plans and risk assessments for the AccentOS repository.

## 1. Strategic Goals
1. Reduce `index.html` to <500 lines of orchestration logic.
2. Encapsulate all global state within defined APIs.
3. Implement a declarative module registry.

## 2. Sequencing (The Safest Path)
1. **Stage 1 (Foundation):** Extract `js/utils.js` and `js/supabase_api.js`.
2. **Stage 2 (Isolate Feature):** Extract Knowledge Engine and Quotes to modules.
3. **Stage 3 (The Big Move):** Decompose Vendor Ranking logic.
4. **Stage 4 (Decouple Shell):** Implement `MODULE_REGISTRY` and refactor `goTo`.

## 3. Prerequisite Checklist for Each Extraction
- [ ] Map all incoming function calls (Search for function name in repo).
- [ ] Map all outgoing global references.
- [ ] Define the module's "public surface" (window-bound functions).
- [ ] Verify syntax with `node -c`.
- [ ] Run visual smoke test.

## 4. Critical Blockers to Level 4 Maturity
- **State Encapsulation:** Modules must stop mutating globals directly before the shell can be fully decoupled.
- **Event-Driven Hydration:** Moving from sequential `await` to a "data ready" event system is required for a truly responsive boot sequence.
