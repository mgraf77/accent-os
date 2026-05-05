# vibe-speak — quickstart

Two-minute orientation. Skip the rest of the docs unless you're customizing.

## What it is

A Claude Code communication-style skill. Strips dev jargon, mirrors casual register, cuts ~50–80% of output tokens depending on mode. Auto-active on every session.

## What's the default

`vibe` mode. Conversational native English. No trigger needed — it's already on.

## Switch modes when needed

| Say this | Get this |
|---|---|
| `caveman mode` | grunt speech, ~75% reduction |
| `gsd` / `get shit done` | zero prose, action-only |
| `vibesplain` | self-aware mansplain narration |
| `pair up` | pair-coding with trap-spotting |
| `teach me` | educational + comprehension checks |
| `exec mode` | formal stakeholder voice |
| `raw` | vibe-speak fully off |
| `back to vibe` | back to default |

Or `/mode [name]`. Full catalog: `MODES.md`.

## Tighten / loosen within a mode

- `tighter` → more compressed
- `looser` → less compressed
- `status only` → bullet-mode

## Common commands (top 5)

| Command | Does |
|---|---|
| `/vibe profile` | print active profile (≤12 lines) |
| `/vibe help` | print all commands grouped |
| `/vibe kpi` | print recent token-savings trend |
| `/vibe debug` | print signal misses + recent state |
| `/vibe stop translating X` | add X to hard-keep list |

Full command list: `/vibe help`.

## What's preserved (never compressed)

- Code identifiers, file paths, SQL keywords
- Error messages, numbers, IDs, hashes
- AccentOS module names, M-task IDs, version tags (v6.10.41)
- Anything inside backticks
- Code blocks (entire fenced blocks pass through untouched)

## What's compressed

- Filler ("Great question!", "Let me know...")
- Preamble ("I'll go ahead and...")
- Dev jargon translated to plain English (deploy → push live, etc.)
- Restating-the-question

## When it auto-disengages (drops back to clear English)

- Security warnings (secrets, credentials)
- Irreversible actions (`rm -rf`, force push, drop table)
- Supabase SQL output (exact wording is load-bearing)
- Multi-step ordered sequences
- Schema-drift / data-exfil / cost-significant actions

## First-time setup

Already done — vibe-speak is auto-active per `.claude/CLAUDE.md`. If you're someone other than Michael, run `/vibe profile new [your-name]` to seed your own calibrated profile.

## When something feels off

- Output feels too terse → `looser` or `vibe mode` (if you're in caveman/gsd)
- Output feels too verbose → `tighter` or `caveman` / `gsd`
- Translated a term you wanted kept → `/vibe stop translating X`
- Used filler you want killed → `/vibe drop filler X`

## Want the deep dive

- Full skill spec: `SKILL.md`
- Mode details: `modes/[name].md`
- Why this scores 99.6% on its own matrix: `scoring-matrix.md`
- Real measured benchmarks: `benchmarks/results.md`

That's it. Go build.
