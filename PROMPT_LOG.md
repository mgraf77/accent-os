## PROMPT LOG
> Every prompt Michael sends is logged here immediately before any build work begins.

### 2026-05-04 — Session resume after Codespace stop
**Prompt:** "Read SESSION_LOG.md and BUILD_PLAN_CLAUDE.md fresh. Read BUILD_INTELLIGENCE.md and apply all lessons before touching any code. Continue autonomous build from the first incomplete [ ] item in BUILD_PLAN_CLAUDE.md that has no unresolved BLOCKS ON MICHAEL dependency. Run bash /workspaces/accent-os/scripts/status.sh first so I can see current state. Then build without stopping. Go."
**Context:** Codespace stopped mid-session. Resuming from last clean checkpoint in BUILD_PLAN_CLAUDE.md.

### 2026-05-04 — Crash-recovery scaffolding
**Prompt:** "Before continuing the build, set up two crash-recovery files: 1) Create PROMPT_LOG.md, 2) Create WORK_IN_PROGRESS.md, 3) Add operating rules to BUILD_INTELLIGENCE, 4) Commit + push, 5) Run status, 6) Continue autonomous build."
**Context:** Codespace had stopped earlier; user wants persistent breadcrumbs so any future stop leaves a clean resume point. Files must be updated and committed continuously, not just at session end.
