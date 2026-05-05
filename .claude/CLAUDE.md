# AccentOS — Claude Code Auto-Instructions
> This file is read automatically by Claude Code on every session start.

## AUTO-EXECUTE ON START
1. **Activate vibe-speak in default mode** (per SKILL.md Step 0):
   a. Detect active user — read `skills/vibe-speak/profiles/_active.md` if it exists; else run detection chain (git config user.name → user.email → `_default.md`).
   b. Read `skills/vibe-speak/profiles/[active-user].md` for default mode + calibration. (For Michael: `profiles/michael.md`, default mode `vibe`.)
   c. Read `skills/vibe-speak/session-handoff.md` for cross-session continuity.
   d. Read `skills/vibe-speak/feedback-log.md` for `applied: no` entries.
   e. Read last 30 days of `skills/vibe-speak/observation-log.md`.
   f. Read last 7 entries of `skills/vibe-speak/kpi-log.md` for trend display.
   g. Read `skills/vibe-speak/modes/[default-mode].md` and apply its voice rules.
   h. SKILL.md Step 4 expanded auto-disengage rules + Step 8.5 pre-send accuracy gate apply to every response.
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
