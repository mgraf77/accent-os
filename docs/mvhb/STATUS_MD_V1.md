# STATUS_MD_V1.md — AccentOS Operational Status Schema

> This document defines the canonical schema for STATUS.md — the single source of truth
> for operational state across Claude sessions. Written by Claude, read by Michael.

---

## PURPOSE

STATUS.md is a machine-written, human-readable operational heartbeat.
It tells Michael — from any device, at any moment — exactly what Claude is doing,
what is blocked, and what is next. It is NOT a log. It is a snapshot.

---

## SCHEMA — REQUIRED FIELDS (in order)

```
# STATUS — [ISO date] [HH:MM UTC]

## BRANCH
[active branch name]

## LAST PUSH
[commit hash] — [short message] — [timestamp]

## SESSION STATE
[ACTIVE | FROZEN | COMPLETE | PAUSED_ON_MICHAEL]

## WIP
[one line: what Claude is currently doing OR last thing done before pause]

## QUEUE DEPTH
[N items remaining in BUILD_PLAN_CLAUDE.md (unchecked [ ] items)]

## NEXT ACTION
[exact next step Claude will take on resume — no vagueness]

## CURRENT GATE
[NONE | M##: [description of what Michael must do to unblock]]

## BLOCKED
[NO | YES — [reason + which M-task]]

## ACTIVE SESSIONS
[N] — [list session identifiers if >1, else "solo"]

## FROZEN SESSIONS
[N] — [list branch names or "none"]

## HEALTH
[GREEN | YELLOW | RED] — [one-line reason if not GREEN]
```

---

## FIELD DEFINITIONS

### BRANCH
The git branch currently being developed on. Never "main" unless intentional.
Format: `claude/[feature-slug]-[session-id]`

### LAST PUSH
Most recent git push that landed on remote. Format:
`[7-char hash] — [commit message] — [YYYY-MM-DD HH:MM]`
If nothing pushed this session: `[no push yet this session] — last remote: [hash]`

### SESSION STATE
| Value | Meaning |
|---|---|
| ACTIVE | Claude is currently executing work |
| FROZEN | Branch parked, no active work, resumable |
| COMPLETE | All queued work done, ready for Michael review |
| PAUSED_ON_MICHAEL | Blocked on an M-task; Claude cannot proceed |

### WIP
One sentence max. Present tense if active. Past tense if frozen.
Do NOT include file paths unless critical to resume context.
BAD: "Working on lots of stuff across several files"
GOOD: "Wiring Supabase persist into quote save flow — mid-function, not committed"

### QUEUE DEPTH
Raw count of unchecked `[ ]` items in BUILD_PLAN_CLAUDE.md.
Excludes items blocked on Michael. Format: `[N] items` or `[N] items ([M] blocked on Michael)`

### NEXT ACTION
The FIRST thing Claude will do when resumed. Must be actionable without additional context.
BAD: "Continue build"
GOOD: "Commit wip-quote-persist, then move to item 3.2 (Employee module Supabase wiring)"

### CURRENT GATE
An M-task (Michael-owned task) that is blocking further progress.
If no gate: `NONE`
If gated: `M##: [plain English description of what Michael must do]`
Examples:
- `M03: Run sql/M03_rls_v2.sql in Supabase dashboard`
- `M07: Deploy worker via wrangler deploy from local terminal`
- `M12: Confirm which vendor tier logic should apply to inactive brands`

### BLOCKED
Binary. YES or NO. If YES, cite the M-task and what happens when it is resolved.

### ACTIVE SESSIONS
Number of Claude sessions currently live (parallel worktrees / branches).
For solo sessions: `1 — solo`
For parallel: `2 — [branch-a], [branch-b]`

### FROZEN SESSIONS
Count + branch names of parked sessions not yet merged or abandoned.

### HEALTH
| Value | Condition |
|---|---|
| GREEN | Clean state — no blockers, last push clean, WIP committed |
| YELLOW | Minor friction — uncommitted WIP, stale session, queue building up |
| RED | Hard block — M-task unresolved >48h, push failed, broken build |

---

## UPDATE CADENCE

| Trigger | Who updates | What changes |
|---|---|---|
| Session start | Claude | SESSION STATE → ACTIVE, WIP → current task |
| Every commit | Claude | LAST PUSH, WIP |
| M-task encountered | Claude | CURRENT GATE, BLOCKED, NEXT ACTION |
| Session pause/wrap | Claude | SESSION STATE → FROZEN or PAUSED_ON_MICHAEL, WIP → last thing done |
| M-task resolved by Michael | Michael | CURRENT GATE → NONE, BLOCKED → NO |
| Build plan item completed | Claude | QUEUE DEPTH decremented, NEXT ACTION updated |

Claude updates STATUS.md atomically with every commit. Never a separate commit for STATUS alone unless it is a wrap-up doc-batch commit.

---

## OWNERSHIP

| Section | Writer | Reader |
|---|---|---|
| All fields | Claude (primary) | Michael (primary) |
| CURRENT GATE + BLOCKED | Claude writes / Michael resolves | Both |
| HEALTH | Claude | Michael + any CI/monitoring hook |

Michael may manually edit CURRENT GATE when an M-task is completed.
Claude overwrites on next session start.

---

## FORMATTING RULES

1. No markdown tables inside STATUS.md itself — flat key-value only
2. No nested bullet lists
3. No emoji in field values (section headers only, sparingly)
4. Every field present even if value is NONE or 0
5. File must open with `# STATUS —` header — no preamble
6. Hard limit: **30 lines total** (not counting blank lines between sections)
7. No prose paragraphs — every line is a label or a value
8. Dates: ISO 8601 only (`YYYY-MM-DD HH:MM`)

---

## MOBILE RENDERING ASSUMPTIONS

- Rendered in GitHub mobile app (markdown viewer) or raw text in Safari
- 375px minimum viewport — no horizontal scroll
- No reliance on table rendering — tables break on narrow viewports
- Line length: 60 chars max per value line (wrap is fine, truncation is not)
- Header hierarchy: H1 = file title, H2 = sections — no H3/H4 in the actual STATUS.md
- Code fences not used inside STATUS.md (values are plain text)
- Bold used only for HEALTH status value and BLOCKED YES/NO

---

## MAX LINE COUNT

**Hard limit: 30 lines** (excluding blank separator lines).
If a field value needs more than one line, it is too detailed.
Move detail to WORK_IN_PROGRESS.md and link with: `→ see WIP`

---

## FORBIDDEN ELEMENTS

- Markdown tables inside STATUS.md
- Nested lists or sub-bullets
- Multi-sentence WIP values
- File paths longer than 40 chars
- Commit hashes longer than 7 chars
- Prose explanations or context narration
- Session logs, history, or changelogs
- Anything that requires scrolling on a 375px screen to see all fields
- Emoji in field values (reserved for HEALTH label prefix only)
- HTML tags
- Relative dates ("yesterday", "2 days ago") — always absolute ISO timestamps

---

## EXAMPLE — VALID STATUS.md

```
# STATUS — 2026-05-09 14:32 UTC

## BRANCH
claude/employee-supabase-wiring-S2Abc

## LAST PUSH
3f8a12c — feat: employee module Supabase persist v1 — 2026-05-09 14:30

## SESSION STATE
ACTIVE

## WIP
Wiring sbSaveEmployee into the edit-modal save handler — uncommitted

## QUEUE DEPTH
11 items (2 blocked on Michael)

## NEXT ACTION
Commit employee persist, then move to 3.3 (Goals module schema wiring)

## CURRENT GATE
M03: Run sql/M03_rls_v2.sql in Supabase dashboard

## BLOCKED
NO — gate does not block current track; blocked items skipped per rules

## ACTIVE SESSIONS
1 — solo

## FROZEN SESSIONS
1 — claude/operational-hud-design-S1Eon

## HEALTH
YELLOW — uncommitted WIP in progress
```
