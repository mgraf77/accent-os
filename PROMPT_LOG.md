## PROMPT LOG
> Every prompt Michael sends is logged here immediately before any build work begins.

### 2026-05-04 — Session resume after Codespace stop
**Prompt:** "Read SESSION_LOG.md and BUILD_PLAN_CLAUDE.md fresh. Read BUILD_INTELLIGENCE.md and apply all lessons before touching any code. Continue autonomous build from the first incomplete [ ] item in BUILD_PLAN_CLAUDE.md that has no unresolved BLOCKS ON MICHAEL dependency. Run bash /workspaces/accent-os/scripts/status.sh first so I can see current state. Then build without stopping. Go."
**Context:** Codespace stopped mid-session. Resuming from last clean checkpoint in BUILD_PLAN_CLAUDE.md.

### 2026-05-04 — Crash-recovery scaffolding
**Prompt:** "Before continuing the build, set up two crash-recovery files: 1) Create PROMPT_LOG.md, 2) Create WORK_IN_PROGRESS.md, 3) Add operating rules to BUILD_INTELLIGENCE, 4) Commit + push, 5) Run status, 6) Continue autonomous build."
**Context:** Codespace had stopped earlier; user wants persistent breadcrumbs so any future stop leaves a clean resume point. Files must be updated and committed continuously, not just at session end.

### 2026-05-04 — M21/M22/M23 confirmed + file split + 5.5 + 5.11
**Prompt:** "M21, M22, M23 SQL ran clean in Supabase. Mark all three as [x] in BUILD_PLAN_MICHAEL.md. File is at 809KB — 91KB from split trigger. Before adding any more modules, execute the file split now: split index.html into current shell + any new module files needed for 5.5, 5.11, and remaining Track 5 items. Follow the exact same pattern as Track 0.1 split — lazy-load on tab activation, zero user-facing change. After split, confirm each file is well under 900KB. Then continue autonomous build: 5.5 Trade Partner Network → 5.11 Warranty Tracker. Log prompt to PROMPT_LOG.md first, run status.sh after first commit, go."
**Context:** Three Michael SQL files have run successfully. File size approaching split trigger. Need to execute the actual file split (Track 0.1 was marked done but file is still monolithic) before adding more modules so we don't blow past the 900KB ceiling.

### 2026-05-04 — Pause build · auto-start config + prompt queue
**Prompt:** "pause on the building right now i have some prompts i need to send. Create .claude/settings.json in /workspaces/accent-os/ with autoStart=true + startupPrompt + dangerouslySkipPermissions=true. Also create .claude/CLAUDE.md in repo root with AUTO-EXECUTE ON START + OPERATING RULES + RESUME RULES sections. Commit both. Create PROMPT_QUEUE.md in repo root with QUEUED + COMPLETED sections, two queued items (file split + 5.5/5.11; M07/M08 locked customer+employee scoping). Commit. Then read PROMPT_QUEUE.md and execute all QUEUED items top to bottom, moving each to COMPLETED when done."
**Context:** User pausing autonomous build to install device-agnostic auto-start config so future sessions in any environment (Codespace, desktop, mobile) pick up automatically without re-prompting. Also adding PROMPT_QUEUE.md as a backlog mechanism for prompts queued while Claude Code is busy. The two QUEUED items in this seed batch are likely already complete in current session; need to verify against BUILD_PLAN_CLAUDE state and mark accordingly.

### 2026-05-04 — Resume building
**Prompt:** "resume building"
**Context:** User unpausing after auto-start config + prompt queue setup. Per CLAUDE.md auto-execute, resume by reading WIP → BUILD_PLAN → BUILD_INTELLIGENCE, then continue from first incomplete `[ ]`. WIP is at clean session-end state from last commit. PROMPT_QUEUE.md is empty (both seeded items closed). Next pending: **5.8 Showroom Display Management**.

### 2026-05-04 — Resume (post-5.14)
**Prompt:** "resume"
**Context:** User unpausing again after the 5.8/5.9/5.10/5.15/5.14 batch. WIP shows clean session-end state. Next pending: **5.12 Marketing Hub (full build)** — current `marketing()` page is a static placeholder showing site issues + agency status. Need to replace with real CRUD module: campaigns + assets + keep site-audit tab. Track 5 final remaining item.

### 2026-05-04 — Resume + Track 6 entry
**Prompt:** "give me a prompt to send to claud chat to have it give me instructions to unblock you. while i am doing that, resume the build and then i will send you the info you need when i get it and then you can resume from there and finish out track 6"
**Context:** User asks for a prompt they can paste into Claude.ai to get walk-through instructions for the 22 pending Michael tasks (M03/M04/M05/M06/M09/M10/M11/M12/M13/M14/M15/M16/M17/M18/M19/M20 + the 6 SQL runs M24-M29). Provided prompt above. Meanwhile, I resume autonomous build starting at **6.8 Intelligent Alerts** — cheapest unblocked win because the `alerts` table already exists in M02 schema and the heuristics can compute over existing DEALS / QUOTES / COOP_FUNDS / INVENTORY / VD data.

### 2026-05-04 — Resume + check completed M-tasks
**Prompt:** "resume. also i have done some of my todo list that were blocking you in the build process. check what i did and then resume."
**Context:** User states they completed some Michael tasks. Audit on session start: BUILD_PLAN_MICHAEL.md unchanged since the M21/M22/M23 commit (6409342) — still shows M24/M25/M26/M27/M28/M29 + M03/M04/M05/M06/M09/M10/M11/M12/M13 as `[ ]`. Tree clean, no uncommitted edits, no API tokens or new schema confirmations in any file. Either user did things outside repo without updating file, or refers to prior-session completions. Resuming on next unblocked Track 6 item: **6.9 AI Demand Forecasting** — pure-compute layer over INVENTORY + DEALS + QUOTES + PURCHASE_ORDERS, no schema, same pattern as 5.7 / 5.15.

### 2026-05-05 — Resume building (new session)
**Prompt:** "remue building"
**Context:** Typo for "resume building". WIP file is stale (last updated 2026-05-04, before nine subsequent commits including v6.10.28–v6.10.36 + customer 360 / vendor 360 / csv util refactor). Tree has 1 uncommitted file: js/calendar.js, with an .ics-export topbar button referencing undefined `exportCalendarIcs()`. Per CLAUDE.md resume rules: complete the orphan WIP first (implement the function so the button works), commit, then move to next BUILD_PLAN [ ]. Unblocked options remaining: 6.5 Trade Portal (phase 1 already shipped as Portal Preview v6.10.33 — phase 2 is full external-facing build, large), 6.6 Vendor Rep Portal (same shape as 6.5), 6.10 accentlightinginc.com embed (depends on Track 6.10 deploy + M18 site approval — likely blocked in practice). Plan: finish ICS export, then ship a small follow-on improvement that fits in the same session window.

### 2026-05-05 — Continue (unblocked work)
**Prompt:** "continue working on things that are not blocked by me, or that have been unblocked"
**Context:** After the calendar ICS fix (v6.10.37) + My Tasks (v6.10.38), user signaled "keep going". Reviewed BUILD_PLAN_MICHAEL: M19/M20 are user-action backlog tasks; M04/M05/M06/M09 are external API keys; M24-M29 are SQL runs the user does. Polish backlog ships freely. Picked the bulk-import vector since the Inventory CSV pattern was already proven and the Customers + Trade Partners modules both saw real-world use cases for bulk loading. Shipped v6.10.39 (Customer CSV import) + v6.10.40 (Trade Partners CSV import). Same parse → preview → commit flow, type/status enum normalization, duplicate flagging, header alias map. Reused the global parseCsv + csvDownload utilities so both modules add ~150 LOC each with no new infrastructure.

### 2026-05-05 — Continue (extended)
**Prompt:** "continue"
**Context:** User confirms more autonomous work. Pivoted off CSV imports (now quadruplicated — at the threshold for extraction) to ship two real workflow improvements: v6.10.42 Deal → Job conversion (button on deal modal pre-fills a Job from deal/customer data; closes a real workflow gap where won deals had to be manually re-typed) and v6.10.43 Inventory inline qty edit (warehouse can adjust qty_on_hand directly in the list with optimistic UI + audit_log). Total session count: 7 ships (v6.10.37/38/39/40/41/42/43). BUILD_INTELLIGENCE +9 lessons across the session.

### 2026-05-05 — Continue (third)
**Prompt:** "continue"
**Context:** Three more ships. v6.10.44 extended inventory inline-edit from 1 to 4 editable fields (qty_on_hand / reorder_point / unit_cost / list_price) by generalizing the cell renderer. v6.10.45 finally extracted csvImportFlow() into js/csv_import.js — the CSV import pattern was at 4 inline implementations, past the abstraction threshold; helper exposes 5 conventional window handlers via key-derived names + 2 normalizer utilities (csvEnumNormalizer, csvNumberNormalizer). Used the helper to ship Showroom Displays bulk import. v6.10.46 shipped Warranty bulk import on the same helper — both new use cases land at ~70 LOC of config (down from ~150 LOC inline). Existing 4 imports remain inline since refactoring working production code adds risk without benefit. Total session count: 10 ships. BUILD_INTELLIGENCE +13 lessons.

### 2026-05-05 — Resume (after token-budgeted run)
**Prompt:** "resume"
**Context:** Continued in efficient bundling mode. Knocked out the remaining inline-edit candidates from the Sept 5 wrap-up backlog: v6.10.51 Warranty (severity + status) + Deliveries (status), v6.10.52 Showroom Displays (status) + Purchase Orders (status — senior only since POs are a financial commitment), v6.10.53 Employees (active toggle + role + department text). Pattern is now applied across 9 modules: Inventory, Customers, Jobs, Trade Partners, Warranty, Deliveries, Showroom Displays, POs, Employees.

### 2026-05-05 — Continue (final extension)
**Prompt:** "continue"
**Context:** Pushed inline-edit further into the secondary list pages: v6.10.54 Co-op Tracker + Marketing Campaigns (status select on both, senior only since both are financial); v6.10.55 Knowledge Hub article pin/unpin button on the viewer (no modal needed for the most common content-curation toggle). Inline-edit now spans 12 modules. Day total = 19 ships (v6.10.37 → v6.10.55).

### 2026-05-05 — Time-budgeted continue (token-efficient run)
**Prompt:** "i have an hour and 10 minutes until my current session resets (i am at 100% usage and currently using extra usage), knock out whatever you can in the next hour that is unblocked, will take about an hour (bundle tasks if needed), and is low usage required but more time required. basically use as little of my extra usage as you can but get max efficiency out of it. go."
**Context:** User on Max plan extra-usage with $67 buffer; 70 min wall-clock budget. Pivoted to maximum-density bundling: read once + write once + commit per feature, no exploration. Shipped 4 ships in ~50 min: v6.10.47 (string-input cell variant + inventory bin/location inline edit + Bulk Vendor Score CSV import), v6.10.48 (Customer inline-edit phone+email), v6.10.49 (Job inline-edit status+priority dropdowns), v6.10.50 (Trade Partner inline-edit status+rating). Each ship was a single Edit + cache-bust + commit, ~3-4 tool calls each. Total session count this day: 14 ships.
