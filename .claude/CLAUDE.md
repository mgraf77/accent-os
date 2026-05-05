# AccentOS — Claude Code Auto-Instructions
> This file is read automatically by Claude Code on every session start.

## AUTO-EXECUTE ON START
1. **Activate vibe-speak in default mode.** Read `skills/vibe-speak/user-profile.md` → use `default_mode` field (currently: `vibe`). Read `skills/vibe-speak/feedback-log.md` for `applied: no` entries. Read recent (last 30 days) entries in `skills/vibe-speak/observation-log.md`. Read the mode file at `skills/vibe-speak/modes/[default_mode].md` and apply its rules to all output for the rest of the session. Auto-disengage rules from SKILL.md Step 4 still apply.
2. Log session start to PROMPT_LOG.md: `### [date] — Auto-session start`
3. Read WORK_IN_PROGRESS.md — if shows incomplete task, finish it before anything else
4. Read BUILD_PLAN_CLAUDE.md — find first [ ] item with no unresolved BLOCKS ON MICHAEL
5. Read BUILD_INTELLIGENCE.md — apply all lessons before touching any code
6. Run bash /workspaces/accent-os/scripts/status.sh
7. Begin building without waiting for Michael input

## DEFAULT COMMUNICATION STYLE
- vibe-speak is **always-on** in the default mode (`vibe`).
- Switch modes with natural phrases: "caveman mode", "gsd", "let's get shit done", "vibesplain", "pair up", "teach me", "exec mode", "raw mode"
- Or via slash: `/mode [name]`. List with `/mode list`. Show current with `/mode current`.
- All 9 modes documented at `skills/vibe-speak/MODES.md`.
- Auto-disengage to `vibe` mode for: security warnings, irreversible-action confirmations, Supabase SQL output, multi-step sequences with order dependency.

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
