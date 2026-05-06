# Global Claude Code Instructions
> Loaded for every repo on this machine. Project-specific `.claude/CLAUDE.md` loads on top and can override or extend anything here.

## AUTO-EXECUTE ON START

1. **Activate vibe-speak** (communication framework — always-on):
   a. Read `~/.claude/skills/vibe-speak/profiles/_active.md` (cached active user). If missing, run detection: `git config user.name` → `git config user.email` → fall back to `_default.md`.
   b. Read `~/.claude/skills/vibe-speak/profiles/[active-user].md` for default mode + calibration.
   c. Read `~/.claude/skills/vibe-speak/session-handoff.md` for cross-session continuity.
   d. Read `~/.claude/skills/vibe-speak/feedback-log.md` for `applied: no` entries.
   e. Read last 30 days of `~/.claude/skills/vibe-speak/observation-log.md`.
   f. Read last 7 entries of `~/.claude/skills/vibe-speak/kpi-log.md` for trend display.
   g. Read `~/.claude/skills/vibe-speak/modes/[default-mode].md` and apply its voice rules.
   h. Read `~/.claude/skills/_index.md` for the global skill registry.
   i. If the current project has a local skills registry at `[project-root]/skills/_index.md`, read that too and merge — project skills take precedence over global skills of the same name.
   j. vibe-speak Step 7 auto-disengage rules + Step 12 pre-send accuracy gate + Step 23 skill router apply to every response.

2. **Check project WIP** — if `[project-root]/WORK_IN_PROGRESS.md` exists and shows an incomplete task, finish it before anything else.

3. **Log session start** — if `[project-root]/PROMPT_LOG.md` exists, append `### [date] — Auto-session start`.

---

## DEFAULT COMMUNICATION STYLE

- vibe-speak is **always-on** in default `vibe` mode.
- Switch modes: "caveman mode", "gsd", "vibesplain", "pair up", "teach me", "exec mode", "raw mode"
- Slash: `/mode [name]` | `/mode list` | `/mode current`
- All 9 modes: `~/.claude/skills/vibe-speak/MODES.md`
- Auto-disengage to `vibe` for: security warnings, irreversible-action confirmations, multi-step sequences with order dependency.

---

## GLOBAL OPERATING RULES

- Never ask for confirmation on local file writes, git operations, or bash commands unless the action is destructive or affects shared infrastructure.
- Print a one-line status after every commit.
- When WORK_IN_PROGRESS.md exists: overwrite it after every discrete step.
- No narration between steps — action and result only.
- Model efficiency: batch doc-only tasks together, never interleave with build commits.

---

## SKILL SYSTEM

### Where skills live

```
~/.claude/skills/          ← global skills (all repos)
[project-root]/skills/     ← project-specific skills (this repo only)
```

Both registries are merged at session start. When the same skill name exists in both, the project-local version wins.

### Global skills (always available)

| Skill | Trigger shorthand |
|---|---|
| vibe-speak | auto-on |
| skill-forge | "forge a skill from [X]", "look into [X] and build" |
| skill-optimizer | "optimize [skill]", "score [skill]", "level up [skill]" |
| skill-eval-suite | "eval suite for [skill]", "regression tests for [skill]" |
| decision-log | "log this decision", "record this call" |
| codex-review | "codex review", "peer review this", "second opinion" |
| community-skill-vet | "vet this skill", "is this safe to install" |
| repo-scout | "scout repos", "find new skills", "what should I install" |
| autonomous-mode | "going to lunch", "go autonomous", "work while I'm gone" |
| bottleneck-finder | "what's the bottleneck", "what unblocks the most" |
| prompt-queue | "queue this prompt", "queue: [text]", "drain the queue" |
| doc-drift | "check for doc drift", "are my docs consistent" |
| analysis-snapshot | "save this analysis", "snapshot this", "make this re-runnable" |
| table-eda | "EDA on [table]", "data quality check", "profile this table" |

### Skill router

Before brute-forcing any non-trivial task, check whether an existing skill handles it. Surface the match. Do not auto-invoke — always confirm first.

---

## SETUP GUIDE (first-time on a new machine)

This file is already in place. To verify everything is wired:

```bash
# Confirm global skills are present
ls ~/.claude/skills/

# Confirm vibe-speak profile exists (or create yours)
ls ~/.claude/skills/vibe-speak/profiles/
# → should show _default.md and _active.md
# → if you want a personal profile: /vibe profile new [your-name]

# Confirm global CLAUDE.md is being loaded
# → Claude Code reads ~/.claude/CLAUDE.md automatically on every session start
# → No extra config needed

# To add project-specific skills, create a skills/ folder in any repo:
mkdir -p [your-repo]/skills
# → Then add project-specific SKILL.md files there
# → They'll be merged with global skills automatically
```

### Adding your user profile to vibe-speak

```bash
cp ~/.claude/skills/vibe-speak/profiles/_default.md \
   ~/.claude/skills/vibe-speak/profiles/[your-name].md
# Then edit the file to set your default mode, glossary, and preferences
# vibe-speak will auto-detect you via git config user.name
```

---

## PORTABILITY NOTES

- `[project-root]` is detected at runtime via `git rev-parse --show-toplevel`.
- If you're not in a git repo, `[project-root]` falls back to the current working directory.
- Skills that reference project-specific stack (DB, hosting, API keys) should read those from environment variables or project-local config — not hardcoded in the SKILL.md.
