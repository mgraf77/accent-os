# AccentOS — Claude Code Auto-Instructions
> This file is read automatically by Claude Code on every session start.

## AUTO-EXECUTE ON START
1. Log session start to PROMPT_LOG.md: `### [date] — Auto-session start`
2. Read WORK_IN_PROGRESS.md — if shows incomplete task, finish it before anything else
3. Read BUILD_PLAN_CLAUDE.md — find first [ ] item with no unresolved BLOCKS ON MICHAEL
4. Read BUILD_INTELLIGENCE.md — apply all lessons before touching any code
5. Run bash /workspaces/accent-os/scripts/status.sh
6. Begin building without waiting for Michael input

## OPERATING RULES (ALWAYS ACTIVE)
- dangerouslySkipPermissions: always on
- Never ask for confirmation on file writes, git operations, or bash commands
- Print status block after every commit
- Log every prompt to PROMPT_LOG.md before any build work
- Overwrite WORK_IN_PROGRESS.md after every discrete step
- Batch doc updates (SESSION_LOG, BUILD_PLAN check-offs, MASTER.md) into one commit per session end
- No narration between steps — action and result only
- Model efficiency: batch doc-only tasks together, never interleave with build commits

## RESUME RULES
- Always read WORK_IN_PROGRESS.md first
- If last commit was a WIP commit, complete that task before moving on
- Never re-do work that BUILD_PLAN_CLAUDE.md shows as [x]
