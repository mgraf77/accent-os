# AccentOS — Quote Edge Case Matrix
_Last updated: 2026-05-13_

---

## Purpose

Exhaustive matrix of known and potential edge cases in the quote workflow. Each case documents current handling and residual risk.

---

## Input Edge Cases

### Notes Field (aiParseNotes input)

| Input | Expected behavior | Current handling | Risk |
|---|---|---|---|
| Empty notes | Blocked: "Paste fixture schedule first" | `if(!notes) toast(...); return` | SAFE |
| Whitespace-only notes | Blocked (same as empty) | `.trim()` converts to empty | SAFE |
| Very long notes (>10,000 chars) | Sends to API, may truncate at Claude's token limit | No client-side length check | LOW — Claude handles gracefully |
| HTML/script tags in notes | Sent verbatim to AI; AI ignores them | No sanitization needed (AI input, not DOM output) | SAFE |
| Notes in a foreign language | AI attempts to parse; may flag all items as unknown | No language detection | LOW |
| Pure numbers without fixture codes | AI returns empty or all-flagged lines | Handled by empty-lines check | SAFE |
| Repeated fixture code (E1 × 5) | AI typically generates correct qty | Depends on AI interpretation | LOW |
| Ambiguous codes (T1 vs T2 vs T) | AI flags as unknown or guesses | Unknown codes → flagged status | SAFE (flagged, not silent) |

### Line Item Inputs

| Input | Field | Expected behavior | Current handling | Risk (post-fix) |
|---|---|---|---|---|
| Non-numeric qty | qty input | Defaults to 0 | `parseFloat()||0` in onchange | SAFE |
| Non-numeric price | price input | Defaults to 0 | `parseFloat()||0` in onchange | SAFE |
| NaN qty×price in ext column | ext display | Shows $0.00 | `(Number(qty)||0)*(Number(price)||0)` | SAFE |
| Negative qty | qty input | Allowed — represents credit/return lines | No block | LOW RISK (intentional) |
| Extremely large qty (99999) | qty | Renders at face value | No cap | LOW |
| Empty part number | part | Allowed (manual entry) | Blank saves and displays as empty | SAFE |
| XSS attempt in desc/part | All string fields | Escaped in renderLI via `esc()` | `esc()` on all template renders | SAFE |
| Quote number collision | id field | on_conflict → UPDATE (last save wins) | Supabase upsert | SAFE |

---

## AI Parse Response Edge Cases

| AI Response | Expected behavior | Current handling | Risk |
|---|---|---|---|
| Valid JSON, lines array | Lines injected into LI | Full happy path | SAFE |
| Valid JSON, empty lines array | Shows "No lines returned" warning | `if(!parsed.lines || !parsed.lines.length)` | SAFE |
| Valid JSON, lines with missing fields | Fields default to safe values | `l.part || ''`, `Number(l.qty) || 0`, etc. | SAFE |
| JSON with extra fields | Ignored — only known fields mapped | Object destructuring with defaults | SAFE |
| JSON wrapped in markdown (```json...```) | Stripped before parse | `raw.replace(/\`\`\`json|\`\`\`/g,'').trim()` | SAFE |
| Non-JSON response from AI | Shows parse error | Caught in second try/catch | SAFE |
| Trailing garbage after JSON | JSON.parse throws | Caught, shows "not valid JSON" | SAFE |
| HTTP 200 but Anthropic error in body | Shows upstream error | Parsed from `data.message || data.error` | SAFE |
| HTTP 401 "missing x-api-key" | Clears env key flag, shows hint | `/missing x-api-key/i.test(msg)` handler | SAFE |
| HTTP 503 "ai_unconfigured" | Shows "temporarily unavailable" | `r.status===503 || code==='ai_unconfigured'` | SAFE |
| HTTP 429 rate limit | Shows status code in error | General error handler | LOW — no retry |
| Network timeout / fetch throws | Shows "Connection error" | Outer try/catch | SAFE |
| Extremely long reasoning field | Renders in collapsed `<details>` | `esc()` + pre-wrap | SAFE |
| Lines array with 100+ items | Renders all in table | No pagination | LOW — table becomes long |

---

## Save/Load Edge Cases

### saveQ()

| Scenario | Expected behavior | Current handling | Risk |
|---|---|---|---|
| Missing project name | Blocked: "Add project name first" | Guard at top of saveQ() | SAFE |
| 0 line items | Saved with empty lineItems array | No minimum check | LOW — empty quote is valid |
| sbSaveQuote fails (network) | In-memory save succeeds; Supabase fails silently | `.then()` not `.catch()` on sbSaveQuote | LOW — data in memory until refresh |
| sbSaveQuote: quote_lines DELETE succeeds, INSERT fails | Lines deleted, not re-inserted | Two-step in sbSaveQuote | MEDIUM — data loss on network failure |
| Double-tap Save | Two saves in quick succession | Second save overwrites first (same qid) | SAFE — idempotent |
| Save during AI parse | LI snapshot taken at save time | `[...LI]` spread at save time | SAFE |

### loadQ() / showSaved()

| Scenario | Expected behavior | Current handling | Risk |
|---|---|---|---|
| QUOTES is empty | Shows empty modal | Renders "No saved quotes" state | SAFE |
| Quote with null lineItems | Renders empty LI | `q.lines || []` in loadQ | SAFE |
| Quote with malformed lineItems | Each field individually defaulted | `l.part||''`, `Number(l.qty)||0`, etc. | SAFE |
| Filter with no matches | Shows 0 quotes | Filtered array renders empty | SAFE |

### deleteQ()

| Scenario | Expected behavior | Current handling | Risk |
|---|---|---|---|
| Delete + reload before sbDeleteQuote fires | In-memory delete races Supabase | QUOTES filtered first, Supabase async | LOW — race is transient |
| Delete non-existent quote | No-op | `QUOTES.filter(q => q.id !== numberId)` on already-absent entry | SAFE |

---

## Track Calculator Edge Cases

| Scenario | Expected behavior | Current handling | Risk |
|---|---|---|---|
| Empty run lengths | No lines added | `parseRunLengths` returns [] | SAFE |
| Non-numeric run lengths | Filtered out | `.map(Number).filter(n=>n>0)` | SAFE |
| Fractional lengths (4.5 ft) | Rounds up to 6ft section | Logic checks ≤2, ≤4, ≤6 | LOW — boundary check |
| Exactly 0 ft run | Filtered out | `filter(n=>n>0)` | SAFE |
| Very long run (100ft) | Generates 12×8ft sections + 1 power feed + 11 connectors | Loop handles any length | SAFE |
| Missing QKB track parts for size | Undefined access | `QKB.trackParts[col][sz]` — all sizes covered | SAFE |
| Both black and white runs | Generates independent line item sets | `calcTrackHardware(blRuns, 'black')` + `(whRuns, 'white')` | SAFE |

---

## Duplicate + Export Edge Cases

| Scenario | Expected behavior | Current handling | Risk |
|---|---|---|---|
| Duplicate quote with no lineItems | Clones empty LI, adds starter row | `if(!LI.length) LI = [nLI()]` | SAFE |
| Email quote (PDF/mailto) | Opens mailto with quote summary | `emailQuote()` — basic mailto only | LOW — no rich PDF |
| Export CSV with 0 lines | Shows "Nothing to export" | `csvDownload` checks rows.length | SAFE |
| Export CSV with flagged lines | Flagged lines included in CSV | No filter — operator sees all rows | INTENTIONAL |
| Print with flagged lines | All lines print including flagged | No pre-print filter | LOW — operator should review first |

---

## Concurrency Edge Cases

| Scenario | Risk level | Notes |
|---|---|---|
| Two tabs open, same quote | MEDIUM | Both tabs share QUOTES array only if loaded in same session. Supabase upsert by number ensures last-write-wins. |
| Two users editing same quote (different sessions) | MEDIUM | Both load from DB, both save to same row. Last save wins. No locking. |
| AI parse while manual edit in progress | LOW | LI replacement is user-initiated; typing in a cell doesn't lock against replacement |
| Session timeout during save | LOW | sbSaveQuote uses anon key which doesn't expire; JWT expiry is for auth checks only |

---

## Unaddressed Risks (Known Gaps)

| Risk | Priority | Potential fix |
|---|---|---|
| sbSaveQuote DELETE+INSERT atomicity | MEDIUM | Wrap in Supabase RPC with transaction |
| No client-side validation of line count | LOW | Add warning if >200 lines |
| AI parse replaces user's manual edits without warning | LOW | Add "are you sure?" if LI already has user-edited rows |
| No undo after AI parse | ✅ FIXED | `_LI_UNDO` stashes LI before replacement; ↩ Undo parse button shown in success panel |
| No partial-parse recovery | LOW | If AI returns 5 valid + 3 malformed lines, only 5 are injected |

---

_Update this matrix when new edge cases are encountered in production or discovered in code review._
