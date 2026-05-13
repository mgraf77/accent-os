# AccentOS — Quote Runtime Architecture
_Last updated: 2026-05-13_

---

## Overview

The Quote Generator is AccentOS's most AI-coupled feature and one of the most actively used daily workflows. Understanding its runtime architecture is critical for safe modifications.

---

## Core State

All quote state lives in index.html (lines ~5682). Never extracted — state ownership is the blocker.

| Variable | Type | Contents | Mutated by |
|---|---|---|---|
| `QUOTES` | Array | All saved quotes (loaded from Supabase) | `sbLoadQuotes`, `saveQ`, `deleteQ` |
| `QUOTE_ID` | Number | Next auto-increment quote number | `sbLoadQuotes` (seeds from max seen) |
| `CQ` | Object\|null | Currently open quote (unsaved state) | `quotes()`, `saveQ()` |
| `LI` | Array | Current line items (working copy) | `addLI()`, `aiParseNotes()`, `renderLI()` |
| `_pendingTrackLines` | Array | Track hardware lines staged for insertion | `addTrackLinesToQuote()` |
| `_savedQuoteFilter` | String | Filter string for Saved Quotes modal | `showSaved()` |

---

## Lifecycle: New Quote

```
quotes(container)                   ← page render entry point
  → CQ = {number: QUOTE_ID++, ...}  ← new blank quote
  → LI = []                          ← empty line items
  → render quote form HTML
  → render empty LI table
```

**Key DOM IDs written:**
- `q-no` — quote number display
- `q-client` — client name input
- `q-date` — date input
- `q-no2` — project notes / fixture schedule input field
- `ai-parse-status` — AI parse status message
- `q-preview` — quote preview panel

---

## Lifecycle: AI Parse (aiParseNotes)

```
aiParseNotes()
  ├── preflight: _aiWorkerReady() → false → show hint → return
  ├── read: $('q-no').value (fixture schedule notes)
  ├── post: AOS_WORKER_URL (claude-sonnet-4-5, max_tokens:4000)
  │          system: QKB fixture map + track hardware rules
  │          user: "Parse this fixture schedule..."
  ├── on success:
  │     parse JSON → { reasoning, lines: [...] }
  │     map each line → { id, part, desc, qty, price, cat, status, flag, reasoning }
  │     LI = newLines           ← REPLACES existing line items
  │     renderLI()              ← re-renders line item table
  │     updatePreview()         ← re-renders quote preview
  │     show reasoning in statusEl
  ├── on HTTP error:
  │     503 / ai_unconfigured → graceful "temporarily unavailable" message
  │     missing x-api-key → clear __AOS_WORKER_ENV_KEY_READY__ → show hint
  │     other → show error with status code
  ├── on non-JSON proxy response → show error
  └── on bad AI JSON → show "not valid JSON, try again"
```

**Important:** `LI = newLines` REPLACES the entire line item array. If the user had manually added lines, AI parse overwrites them. This is intentional — the button label says "Parse & Replace".

---

## Lifecycle: Manual Line Item Edit

```
renderLI()
  → render <table> with one <tr> per LI entry
  → each row has: part input, desc input, qty input, price input, cat select, status select
  → each input: oninput="LI[i].field = this.value; updatePreview()"

updatePreview()
  → read LI array
  → compute: subtotal = sum(qty * price for each line)
  → compute: taxable = sum for taxable cats, taxAmt = taxable * (tax% / 100)
  → total = subtotal + taxAmt + freight
  → write to preview panel HTML

renderLI() is called:
  - After aiParseNotes() completes
  - After addLI() (user clicks Add Row)
  - After addTrackLinesToQuote() (track calculator)
  - NOT automatically on input — inputs update LI directly, updatePreview() re-renders preview only
```

---

## Lifecycle: Save Quote (saveQ)

```
saveQ()
  ├── validate: client name required
  ├── validate: at least 1 line item
  ├── build quote object:
  │     { number, client, project, date, notes, tax_pct, freight, lines: LI }
  ├── sbSaveQuote(q) → POST /rest/v1/quotes + /rest/v1/quote_lines
  │     uses on_conflict on quote number for update
  │     DELETE existing quote_lines for this number, then INSERT new
  ├── on success: toast "Quote saved", push to QUOTES if new
  └── on error: toast error
```

**Race condition risk:** If the user saves while `aiParseNotes` is still running, `LI` may be partially updated. Not observed in practice (save requires user click; AI parse takes 2-5s; user typically waits).

---

## Lifecycle: Load Saved Quote

```
showSaved()
  → render modal with QUOTES list
  → user clicks quote row → loadQ(quoteId)

loadQ(quoteId)
  → find q in QUOTES by id
  → CQ = { ...q }             ← sets current quote
  → LI = q.lines || []         ← loads saved line items
  → re-render quote form
  → renderLI()
  → updatePreview()
```

---

## Track Hardware Calculator

```
openTrackCalc()
  → opens modal with run-length input + color picker

previewTrackCalc()
  → parseRunLengths($('track-runs').value)
     → returns array of numbers [8, 12, 6]
  → calcTrackHardware(runs, color)
     → PURE FUNCTION — returns array of line item objects
  → render preview table

addTrackLinesToQuote()
  → _pendingTrackLines = calcTrackHardware(runs, color)
  → LI = LI.concat(_pendingTrackLines)   ← APPENDS (not replaces)
  → renderLI()
  → updatePreview()
  → close modal
```

**Safe:** Track lines APPEND to existing LI. Unlike AI parse which replaces.

---

## AI Confidence + Flag States

Line items have two quality signals:

| Field | Values | Meaning |
|---|---|---|
| `status` | `pending` | Normal line — included in quote as-is |
| `status` | `flagged` | Operator review needed — shown in yellow |
| `flag` | string | Human-readable reason for flag |
| `reasoning` | string | AI's explanation for this line |

### Flag Triggers
- Unknown fixture code (not in QKB map)
- Zero price (AI couldn't find a price)
- AI response includes status:"flagged" explicitly

### Flagged Line Handling
- Flagged lines ARE included in the quote
- They display with yellow highlight in renderLI()
- `approveAllRows()` clears all flags (sets status → 'pending')
- `qFlagRow(i)` toggles flag on a single row

---

## Quote Edge Cases + Current Handling

| Scenario | Current handling | Risk level |
|---|---|---|
| Empty notes + AI parse | Returns early: "Paste fixture schedule first" | SAFE |
| AI parse when no worker | Returns early with hint | SAFE |
| AI returns empty lines array | Shows warning: "No lines returned" | SAFE |
| AI returns non-JSON | Shows parse error | SAFE |
| AI times out | fetch() throws, caught by try/catch → error shown | SAFE |
| User saves with 0 line items | Blocked: "Add at least one line item" | SAFE |
| Duplicate quote number | on_conflict on number → UPDATE (last save wins) | SAFE (intentional) |
| AI parse during existing LI edit | LI replaced silently | LOW RISK — user initiated |
| sbSaveQuote fails mid-line-delete | quote_lines deleted but not re-inserted | MEDIUM RISK — data loss possible |
| Track calc: run length 0 | calcTrackHardware([0]) → pushes 0 power feeds | LOW RISK — renders 0-item section |
| Track calc: non-numeric input | parseRunLengths returns [] → no lines added | SAFE |
| Quote loaded while AI parsing | Race between loadQ(LI=...) and LI=newLines | VERY LOW RISK — user can't trigger both simultaneously |

---

## Subtotal Computation

```javascript
// updatePreview() computes:
const subtotal = LI.reduce((s, l) => s + (Number(l.qty)||0) * (Number(l.price)||0), 0);
const taxPct = parseFloat($('q-tax')?.value) || 0;
const freight = parseFloat($('q-freight')?.value) || 0;
const total = subtotal + (subtotal * taxPct / 100) + freight;
```

**Edge cases:**
- Non-numeric qty/price: `Number(l.qty)||0` → defaults to 0 (safe)
- Missing tax/freight inputs: `parseFloat(...) || 0` → defaults to 0 (safe)
- No lines: subtotal = 0, total = freight (correct behavior)

---

## Quote ↔ Pipeline Linkage

```
createDealFromQuote(quoteIdOrUuid)
  → finds quote in QUOTES
  → creates new deal: { company: q.client, value: q.total, source_quote_id: q.id }
  → calls openAddDeal(stage, preset) with deal preset
  → user completes deal form + saves
```

**No reverse link yet:** Deals don't update quotes when won/lost. This is a known gap.

---

## AI Model Used

`claude-sonnet-4-5` — specified in `aiParseNotes()` body. Max tokens: 4000.

**Why this model:** Best balance of speed + parsing accuracy for the structured fixture schedule task. The system prompt is ~1,200 tokens; typical fixture schedule is 200–500 tokens; output is 500–2000 tokens.

**When to change:** If Anthropic deprecates claude-sonnet-4-5, update the model string in `aiParseNotes()` (line ~6046). Also check `sendChat()` for the same pattern.

---

_Update this document when the quote lifecycle changes, new edge cases are discovered, or the AI model is upgraded._
