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
