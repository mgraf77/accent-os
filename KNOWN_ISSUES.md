# KNOWN_ISSUES.md
> Gotchas, edge cases, and risks at the time of stabilization pause · 2026-05-07

## Quote Pro — operational

### A. M42 schema must be run before templates persist
- **Symptom:** Trying to save a training pair toasts "Save failed (run sql/M42_quote_templates_schema.sql in Supabase first?)". Browser console shows `[quote_templates] table not yet created`.
- **Cause:** Standard AccentOS pattern — schema is written but Michael runs it manually in Supabase SQL Editor (Supabase MCP perms are broken; see MASTER §3 "Known Supabase Issue").
- **Fix:** Run M42. Module gracefully no-ops template persistence until the table exists; everything else (build flow, takeoff, CSV export, print) works without it.
- **Risk:** Low. Documented in `BUILD_PLAN_MICHAEL.md` M42 and `NEXT_STEPS.md`.

### B. Anthropic key required, must have vision-capable model access
- **Symptom:** "Add your Anthropic API key in Settings → API Keys." or `Anthropic 401: …` toast.
- **Cause:** Either no key set, or key tier doesn't include `claude-sonnet-4-5-20250929`.
- **Fix:** Settings → API Keys → paste sk-ant-… → Save. Sonnet 4.5 is widely available on standard Anthropic tiers; if Michael's key fails, swap the `model` arg in `qpCallAnthropic({…})` (one-line change) to `claude-sonnet-4-20250514` which is the model already used elsewhere in this codebase.
- **Risk:** Low — key was verified live this session.

### C. Token cost on dense blueprint sets
- Multi-page PDFs of full electrical sets can be large. The vision model bills per input token (image tokens add up fast for high-res pages).
- **Mitigation today:** None applied — we send what the user uploads. Should be fine for typical 3–8 page lighting plan extracts; could get expensive on 50-page full electrical packages.
- **Future hardening:** Add a page-count warning at >10 pages OR pre-process PDFs to extract only pages tagged `E-*` or `EL-*`. Defer until cost actually bites.

### D. CSV export column names assume Windward conventions
- We export `PartNumber, Description, Qty, UnitPrice, ExtPrice, Vendor, Tag, Notes`.
- **Risk:** If Windward import requires different headers (e.g. `ItemNumber` vs `PartNumber`), the export needs renaming.
- **Mitigation:** One-line change in `qpExportCsv()`. Verify with a real Windward import once and adjust.

### E. Vendor name is free text in saved quote_lines
- The takeoff Claude returns vendor as text (e.g. "Halo"); we don't auto-match to `VD_RAW.id`.
- **Symptom:** Saved Quote Pro quotes have `vendor_name` populated but `vendor_id` is null. Means downstream linkage to vendor scoring / inventory / PO is text-match only, not UUID.
- **Risk:** Low for v1. Quotes are still complete and printable. The CRM/RFM/Decision Engine joins by customer name already, so no new data integrity hit.
- **Fix when ready:** In `qpSaveDraftQuote`, fuzzy-match `r.vendor` against `VD_RAW.map(v=>v.n)` and set `vendorId` when confident.

### F. MutationObserver in `quotepro()` page entry
- We attach a `MutationObserver` on `pg-content` that re-binds editable cell handlers after every render.
- **Risk:** The observer is created on every navigation to `quotepro` and never explicitly disconnected when the user navigates away. Modern browsers GC it when `pg-content` is replaced, but technically it could leak listeners if `pg-content` itself is reused (which it is — the shell only replaces innerHTML).
- **Impact:** Negligible. Each observer only re-binds handlers; doesn't allocate growing memory. Multiple observers stacked on `pg-content` would each fire on the same mutations — slight CPU waste. Not noticeable in real use.
- **Fix when convenient:** Track the observer in a module-level `qpObserver` and `disconnect()` on each entry into `quotepro()`. ~3 line change.

### G. State exported on window was misleading — REMOVED in stabilization pass
- Original module exported `window.qpDraft / qpStaged / QP_TEMPLATES / qpTemplateFilter` as snapshots at module load.
- **Old issue:** Reassignments inside the module (e.g. `qpDraft = qpEmptyDraft()`) didn't update the window properties. A debugger inspecting `window.qpDraft` would see stale `null`.
- **Status:** Fixed in stabilization commit. These exports were removed. Function exports (`qpRender`, `qpRunTakeoff`, etc.) stayed.

## API key persistence — operational

### H. localStorage is per-origin and per-browser
- Key now persists across tab/browser restart on the same machine and same browser profile.
- It does NOT sync across devices. Each device (Michael's iPhone, work desktop, home laptop per MASTER §2) needs the key pasted once.
- This is the same posture as before — no regression. Just clearer now that it's documented.

### I. localStorage doesn't auto-clear on logout
- If Michael wants to remove the key (e.g. rotate it), there's no UI button for "clear key" — he has to paste a new one or use browser DevTools.
- **Fix when convenient:** Add a "Clear" button next to "Save Key" that calls `clearApi()` (helper already exists in shell, just no UI binding yet).

### J. localStorage is shared across sessionStorage-isolated tabs
- Old behavior: each tab had its own key.
- New behavior: all tabs in the same browser share the key.
- For this single-user app on Michael's own browser, this is the correct change. Worth flagging if AccentOS ever becomes multi-user on shared devices.

## Existing AccentOS — pre-existing risks (not introduced this session, just noting)
- Supabase MCP permission errors persist (MASTER §3) — schema runs are still all manual via SQL Editor.
- 9 of 41 M-tasks blocked on Michael (M03, M04, M05, M06, M09, M10, M18, plus M40/M42 newly added). See `BUILD_PLAN_MICHAEL.md` for the full list.
- index.html nearing the 900KB hard-split limit at ~700KB. Quote Pro is external (`js/quote_pro.js`) so this session didn't bloat the shell.
