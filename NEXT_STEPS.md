# NEXT_STEPS.md
> What happens after the pause · ordered from highest to lowest priority

## IMMEDIATE — Michael's three-step Quote Pro activation (~5 min total)

### Step 1 — Run the schema (1 min)
1. Open `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
2. Open `sql/M42_quote_templates_schema.sql` from the repo, copy entire contents
3. Paste into SQL Editor → click **Run**
4. Verify: the trailing SELECT should return one row with `rls_enabled = true`

### Step 2 — Ingest first Homegrown training pair (~3 min, mostly waiting on Claude)
1. Reload `https://accent-os.pages.dev`
2. Sidebar → **Quote Pro** (◆ icon, just under Quote Generator)
3. **Templates** tab → **+ New training pair**
4. Brand: `Homegrown` · Parent: `Thrive Restaurant Group` · Source location: `Homegrown — [city]` (the prior one you've already done)
5. Upload the prior location's electrical/architectural pages (PDF or images, multi-file)
6. Upload the final invoice you sent the customer (PDF, image, or CSV)
7. Click **Ingest training pair**. ~20–40s for Claude to reconcile. Toast confirms when saved.

### Step 3 — First real reuse on the new Homegrown (~2 min plus review time)
1. **Quote Pro → New Quote** tab
2. Brand template dropdown → pick the Homegrown row you just ingested
3. Upload the new location's blueprint pages
4. Click **Run AI takeoff**. ~30s wait. Lines appear with matched template rows highlighted.
5. Review — every cell editable. Add freight + tax. Notes print on the invoice.
6. Choose:
   - **Save quote** → writes to `quotes`/`quote_lines` (visible in regular Quote Generator + Daily Brief + Decision Engine)
   - **Export CSV** → Windward-import-friendly columns (PartNumber, Description, Qty, UnitPrice, ExtPrice, Vendor, Tag, Notes)
   - **Print quote** → customer-facing PDF via the print dialog

## SHORT-TERM (after first real use, if Michael wants polish — none of this is required for the workflow to function)
- **Multi-page PDF preview inside Quote Pro** — currently the PDF is sent whole to Claude with no in-app thumbnail. Add a pdf.js render in the staging chip area.
- **Template diff view** — "this quote vs. the trained Homegrown pattern: 3 new fixtures, 1 quantity change, 0 missing." Helps spot anomalies before sending.
- **Vendor_id auto-match against `VD_RAW`** — Claude returns vendor name as text; we should normalize to AccentOS vendor IDs so saved quotes link cleanly to inventory + PO downstream.
- **Source-blueprint archive** — Supabase Storage bucket per template, signed URLs, so the prior blueprints are accessible later for reference. Add a `blueprint_urls` array column to `quote_templates`.

## MEDIUM-TERM (ride the next governance restructure wave)
- **Direct Windward push** — replace CSV export with API call to Windward S5WebAPI to create the invoice directly. Blocked on M03 (Windward written confirmation) and M10 (Curtis outreach). Track 6.11.
- **Voice-note refinement** — per MASTER §14 vision: "refined with one voice note." Add a "Refine with voice" button that takes a 30s audio note and applies edits via Claude.
- **Template versioning** — each `quote_templates` row currently overwrites on edit. Add `quote_template_versions` history table if Michael ever needs to see what a template looked like 6 months ago.

## DO NOT DO until governance restructure decisions land
- ❌ Don't refactor the existing inline `quote()` function to share code with `quote_pro.js`. Keep them separate until the repo split clarifies what code goes where.
- ❌ Don't move Quote Pro to a different page slot in the sidebar.
- ❌ Don't introduce new abstractions like a "QuoteEngine" base class.
- ❌ Don't create a unified file-upload component shared across modules.

## Resume-from-pause prompt (paste to Claude when restarting)
> Read `WORK_IN_PROGRESS.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md`, `KNOWN_ISSUES.md`, `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md`, `SESSION_LOG.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md` in that order. Last work: Quote Pro v1 shipped on `claude/build-quote-generator-mUEQ1` (commits `ef1d6aa` + `880a392` + handoff-docs commit). Tree clean, pushed. Current pause is for governance restructure. Don't expand scope — pick up only when restructure direction is clear or when Michael explicitly asks for the next Quote Pro polish (multi-page PDF preview / template diff view / vendor_id match / source-blueprint archive).
