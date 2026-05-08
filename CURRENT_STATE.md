# CURRENT_STATE.md
> Snapshot at clean pause · 2026-05-07

## Branch
- `claude/build-quote-generator-mUEQ1`
- HEAD == origin (pushed)
- Tree clean
- 2 commits ahead of `main` (Quote Pro feature + API key persistence). Not yet merged.

## What is live in the working tree
| Component | Status | Notes |
|---|---|---|
| Existing inline Quote Generator | ✅ Untouched | Sidebar entry "Quote Generator" still works exactly as v6.10.0 shipped it. |
| Quote Pro page | ✅ Code complete | New sidebar entry "Quote Pro". Loads via `js/quote_pro.js`. Awaiting Michael to (1) run M42 SQL and (2) ingest first training pair. |
| Anthropic API key persistence | ✅ Live | Now in `localStorage`. Survives tab close. Auto-migrates from sessionStorage on read. |
| Existing Track 0–6 modules (vendor, pipeline, customers, etc.) | ✅ Unchanged | No edits made outside the Quote Pro scope this session. |

## What requires Michael to act before Quote Pro is end-to-end functional
1. **Run `sql/M42_quote_templates_schema.sql`** in Supabase SQL Editor (creates `quote_templates` table). Verification SELECT included; should return one row, `rls_enabled=true`.
2. **Anthropic API key already configured** ✓ (verified this session by the user — badge flipped to green).
3. **Ingest first training pair** — Quote Pro → Templates → + New training pair → upload prior Homegrown blueprints + the final invoice we sent. ~30s for Claude to reconcile.
4. **First real use** — Quote Pro → New Quote → pick Homegrown → upload new-location blueprints → Run AI takeoff → review → Save / Export / Print.

## Schema state
- `quote_templates` (M42) — **WRITTEN, NOT YET RUN.** SQL file exists at `sql/M42_quote_templates_schema.sql`. Module gracefully degrades if table missing (logs `[quote_templates] table not yet created — run sql/M42_…`; render still works for everything except template persistence).
- `quotes` + `quote_lines` (M02) — already live in production Supabase. Quote Pro writes to these for the final saved output.
- All other M-tasks unchanged.

## Module wiring
Quote Pro hooks into the existing AccentOS shell at exactly four points in `index.html`:
1. Sidebar `<div class="ni" … onclick="goTo('quotepro')">…</div>` (under Quote Generator)
2. `PAGE_META.quotepro = { t:'Quote Pro', s:'AI takeoff · National-account templates' }`
3. `pages` dispatch object includes `quotepro`
4. `<script src="js/quote_pro.js?v=6.10.75"></script>` at end of body

## Dependencies the new module relies on (all pre-existing in shell)
`$`, `esc`, `openModal`, `closeModal`, `toast`, `sbFetch`, `sbConfigured`, `sbKey`, `getApi`, `getS`, `sbSaveQuote`, `QUOTES`, `QUOTE_ID`, `curPage`. No new external libraries. No build step.

## API surface added to window
12 named handlers exported on `window` for inline-handler reach:
`quotepro`, `qpSetTab`, `qpRender`, `qpStageFiles`, `qpClearStaged`, `qpRunTakeoff`, `qpExportCsv`, `qpPrintInvoice`, `qpSaveDraftQuote`, `qpAddLine`, `qpRemoveLine`, `qpClearDraft`, `qpClearDraftSilent`, `qpOnTemplateChange`, `qpUseTemplate`, `qpReopenSaved`, `qpViewTemplate`, `qpConfirmDeleteTemplate`, `qpOpenIngestModal`, `qpIngestTrainingPair`, `qpRefreshIngestChips`. Module-internal state (`qpDraft`, `qpStaged`, `QP_TEMPLATES`, `qpTemplateFilter`) is NOT exported on window — handlers read these via lexical binding.

## Anthropic model in use
- `claude-sonnet-4-5-20250929` for both takeoff (vision) and ingest (reconciliation). Single configurable point: the `model` arg in `qpCallAnthropic({…})` inside `js/quote_pro.js`. Easy to swap to Opus if Michael wants higher accuracy on dense plans.

## Cost surface
- Each AI takeoff call: 1× Anthropic API call. Token usage scales with blueprint page count and density. No new monthly subscription. Pay-per-use against existing Anthropic key.
- No new infra, no new vendor relationships, no new monthly cost beyond existing ~$5/mo Anthropic line.

## Repo size at pause
- `index.html` ~700KB (within 900KB hard split limit per MASTER §4)
- `js/quote_pro.js` ~33KB
- `sql/M42_quote_templates_schema.sql` ~2.3KB
