# Quotes System Extraction Plan - AccentOS

## Current Responsibilities
- **Persistence:** `sbLoadQuotes`, `sbSaveQuote`, `sbDeleteQuote`.
- **UI:** Main quote editor, AI parse logic (`aiParseNotes`), track hardware calculator, project preview, and PDF/CSV export.

## Dependencies
- **Globals:** `QUOTES`, `QUOTE_ID`, `LI` (current line items), `CQ` (current quote).
- **External:** `INVENTORY` (for SKU autocomplete), `CUSTOMERS` (for lookup).
- **AI:** Anthropic Proxy Worker.

## Extraction Boundaries
- **Persistence Logic:** Approx. lines 1534-1650.
- **UI Logic:** Approx. lines 5282-5964.
- **Proposed File:** `js/quotes_engine.js`

## Proposed Module Surface
```javascript
// State
let QUOTES = [];
let QUOTE_ID = 1;

// UI Handlers
function quotes(el, act);
function saveQ();
function printQ();
function duplicateQuote(id);
```

## Migration Risks
1. **Splintered Logic:** Some quote-to-other-module helpers (e.g., `createJobFromQuote`) live in `js/jobs.js`. This distribution is stable but must be documented.
2. **State Reset:** The current system uses globals like `CQ` and `LI` to track the active editor state. Moving these must not break the "Clear" or "Duplicate" buttons.
3. **Inventory Coupling:** SKU pick logic (`liSkuPick`) is heavily coupled to the `INVENTORY` global.

## Rollback Considerations
- High interactivity means manual testing of the AI parsing and Track Calculator is required after any move.

## Verification Requirements
- [ ] Save a quote and verify it appears in "Saved Quotes".
- [ ] Parse a fixture schedule and verify 100% data fidelity.
- [ ] Export a PDF and verify layout integrity.
- [ ] Duplicate a quote and ensure the project name is blanked but line items persist.
