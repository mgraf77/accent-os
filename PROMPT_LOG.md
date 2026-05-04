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
