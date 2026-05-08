# AccentOS — Known Issues
> Last updated: 2026-05-08 | Post AEOS Phase 1

## Active / Unresolved

### AEOS Command Center — Placeholder Data
- **Severity:** Low (cosmetic)
- **Description:** KPI strip and "What Needs Attention" tiles display hardcoded placeholder values, not live Supabase data
- **Location:** `js/aeos_command.js` — `aeoscommand()` function, KPI strip render and attention tiles
- **Fix:** Wire each KPI to a Supabase query in `aeoscommand()`. Requires schema knowledge for quote/PO/delivery tables.
- **Blocked by:** Governance decision on AEOS Phase 2 scope

### Supabase MCP Auth
- **Severity:** Medium (blocks automated schema changes)
- **Description:** Supabase MCP tools return auth errors on project `hsyjcrrazrzqngwkqsqa`
- **Workaround:** Michael runs all SQL migrations manually via Supabase SQL Editor
- **Fix:** Unclear — may require refreshing MCP server auth tokens or reconfiguring MCP config

### localStorage-Only Handoff History
- **Severity:** Low
- **Description:** Handoff Generator saves history to `localStorage('aeos_handoffs')` only — not persisted to Supabase, not shared across users/devices
- **Fix:** Add `aeos_handoffs` Supabase table + sbLoad/sbSave trio in Phase 2

## Recently Fixed (This Session)

### Model ID 400 Errors — FIXED
- **Was:** `claude-sonnet-4-20250514` (invalid/deprecated) causing silent 400 errors on all AI features
- **Fixed:** Replaced with `claude-sonnet-4-6` in all 4 locations in `index.html`
- **Extra:** Added `!r.ok` early return in `aiParseNotes` to surface API error text

### onclick Injection Vulnerability — FIXED
- **Was:** `JSON.stringify(userText)` embedded directly in HTML `onclick` attributes
  - `_sendToHandoffGen(JSON.stringify(taskType), JSON.stringify(description), JSON.stringify(ai))`
  - Copy buttons with full packet text in onclick
- **Fixed:** Values stored in `window._lastRouteResult` / `window._hgLastPacket`, functions read from window on call
- **Location:** `js/aeos_command.js` — `_computeRoute()`, `_sendToHandoffGen()`, `_hgCopyPacket()`, `_hgLoadHistory()`

## Potential Issues (Not Yet Verified)

### AEOS Routing Logic — Heuristic Only
- **Description:** AI Router uses keyword-matching heuristics to determine task type, not actual AI inference
- **Impact:** Routing recommendations may be wrong for ambiguous task descriptions
- **Expected behavior:** This is by design for Phase 1 — just a routing suggestion, user can override

### Memory Files — Not Machine-Indexed
- **Description:** `/memory/` files are human-readable markdown, not yet indexed for RAG
- **Impact:** AI sessions must read files manually; no semantic search
- **Expected behavior:** This is Phase 1 of the memory system — indexing is Phase 2 scope
