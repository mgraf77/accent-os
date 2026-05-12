# Staged Decomposition Sequence - AccentOS

This document defines the recommended order and prerequisites for extracting the remaining logic from `index.html`.

## Stage 1: The Utils Migration (Low Risk)
**Prerequisites:** None.
1. Extract `fmt$`, `fmtS`, `esc`, `toast`, and `csvDownload` to `js/core_utils.js`.
2. Extract Supabase persistence base (`sbFetch`, `sbKey`, `sbConfigured`) to `js/supabase_api.js`.

## Stage 2: Vendor Ranking Extraction (High Impact, Medium Risk)
**Prerequisites:** Stage 1.
1. Move `VD_RAW` and `VD` logic to `js/vendors.js`.
2. Ensure `weightedScore` remains global for `Global Search` and `Deal Optimizer`.
3. Update `index.html` to load `js/vendors.js` immediately after core utils.

## Stage 3: Quote Generator Extraction (Medium Risk)
**Prerequisites:** Stage 1.
1. Move all `aiParseNotes`, `calcTrackHardware`, and quote UI logic to `js/quotes_engine.js`.
2. Move `sbLoadQuotes` and persistence to the same file.

## Stage 4: Module Registry Refactor (High Risk, Long-term Stability)
**Prerequisites:** Stages 1-3.
1. Implement the declarative `MODULE_REGISTRY`.
2. Refactor `goTo` to use the registry.
3. Consolidate `PAGE_META` and `pages` dispatcher.

## Sequence Rationale
- **Utils First:** Provides a stable foundation for other extractions.
- **Vendors Second:** Removes the largest block of code (2K+ lines), significantly cleaning up the shell.
- **Registry Last:** This change touches the most critical navigation paths and should only be done once module boundaries are clearly defined.

## Risk Assessment
| Stage | Estimated Risk | Impact |
|---|---|---|
| 1. Utils | 🟢 Low | Improved maintainability. |
| 2. Vendors | 🟡 Medium | Drastic reduction in `index.html` size. |
| 3. Quotes | 🟡 Medium | Cleaner interactive logic. |
| 4. Registry | 🔴 High | Complete decoupling of shell and modules. |
