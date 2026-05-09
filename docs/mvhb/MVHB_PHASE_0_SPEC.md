MVHB PHASE 0 SPEC
Mobile-First Operational Layer for AccentOS
Version: 1.0 — 2026-05-09

---

PURPOSE

This document defines the operational file system for phone-first
AccentOS operation. Every file format, field, and schema here
was designed to be readable on a 6.7" iPhone screen without
horizontal scrolling, code block expansion, or multi-level
navigation.

Design constraint: If it doesn't render correctly in GitHub iOS
on first view with no interaction, it doesn't belong here.

---

CORE FILES

Five files form the operational layer. All live at repo root or
one level deep. All must be scannable in under 10 seconds on
a phone screen.

  STATUS.md           — current system snapshot (6 lines)
  WIP.md              — in-flight task state (10 lines max)
  PROMPT_QUEUE.md     — queued relay prompts (flat list)
  SESSION_HANDOFF.md  — cross-session continuity (5 fields)
  WORK_IN_PROGRESS.md — (existing file, superseded by WIP.md)

Note: WORK_IN_PROGRESS.md is retained for backward compatibility
with CLAUDE.md boot sequence. WIP.md is the mobile-optimized
mirror. Claude writes both when updating task state.

---

STATUS.md SCHEMA

Six fields. No prose. No tables. No code blocks. All values
fit on one line.

  BRANCH:  [current branch name, max 30 chars]
  PUSHED:  [ISO date or NO]
  WIP:     [one sentence, max 80 chars]
  QUEUE:   [N ready / N waiting]
  NEXT:    [one action, max 80 chars, imperative verb]
  GATE:    [gate name or CLEAR]

Example:

  BRANCH:  claude/ph-a-mobile-Q6vY
  PUSHED:  2026-05-09
  WIP:     Worker proxy returning 400 on aiParseNotes
  QUEUE:   0 ready / 0 waiting
  NEXT:    Confirm wrangler redeploy — run browser console test
  GATE:    Gate 1 pending manual check

Rules:
- BRANCH truncated to 30 chars if longer (add … suffix)
- PUSHED is the date of last successful git push to any branch
- WIP is one sentence. No sub-clauses. No parentheticals.
- QUEUE format is always "N ready / N waiting" — integers only
- NEXT is always an imperative verb: Confirm / Run / Push / Check
- GATE is the name from GATES.md or literal "CLEAR"
- File must never exceed 10 lines total including blank lines

Update trigger: Claude updates STATUS.md after every git push.

---

WIP.md SCHEMA

Ten lines maximum. Five labeled fields. Three optional lines of
context below a divider. No prose paragraphs.

  STATUS:  [paused | active | blocked | done]
  BUG:     [one line or null]
  STEP:    [next action in one line]
  TEST:    [verification command or check, or null]
  RESUME:  [exact phrase to trigger session resume]

  ---
  [up to 3 lines of context — plain text, no formatting]

Example:

  STATUS:  paused
  BUG:     Worker proxy 400 on aiParseNotes — redeploy needed
  STEP:    Confirm wrangler redeploy then run browser test
  TEST:    fetch(worker url, {method:POST}).then(r=>r.text())
  RESUME:  continue last session

  ---
  Commit 2dca2a6 has the fix but was NOT redeployed yet.
  wrangler deploy must run from local terminal (not Codespace).
  Model ID to verify: claude-sonnet-4-20250514

Rules:
- STATUS must be one of the four values — nothing else
- BUG is null (not the word "null", just omit the line) if none
- STEP is one action — not a list
- TEST is the exact string to run, truncated for phone readability
- RESUME is always a phrase under 5 words that Claude recognizes
- Context block is 0-3 lines, plain text, no markdown
- File must never exceed 15 lines total

Update trigger: Claude updates WIP.md after every discrete step.

---

PROMPT_QUEUE.md SCHEMA

Flat numbered list. No tables. No nested bullets. Each entry
is exactly three lines plus one blank line separator.

Format per item:

  #[N] [status] [mode] [defer if any]
  > [verbatim prompt text, max 120 chars per line]
  queued: [ISO date] | src: [iOS | desktop | web]

Status values:  ready | waiting:[condition] | running | paused | done

Example:

  #1 [ready] [inline]
  > build the kpi-snapshot skill now that infra is confirmed
  queued: 2026-05-05T14:30Z | src: iOS

  #2 [waiting: m_task:M30] [inline]
  > backfill customers.segment for top 100 by revenue
  queued: 2026-05-05T14:45Z | src: desktop

  #3 [done]
  > make the digest skill
  queued: 2026-05-04T11:00Z | src: iOS | done: 2026-05-04T11:28Z

Sections:
- READY section header (all items with status:ready)
- WAITING section header (all items with waiting: condition)
- RUNNING section header (at most 1 item — currently executing)
- DONE section header (last 5 completed, oldest dropped)

Section header format:
  == READY (N) ==
  == WAITING (N) ==
  == RUNNING ==
  == DONE (last 5) ==

Rules:
- No markdown tables ever
- No pipe characters in the entry lines (reserved for metadata)
- Prompt text on > line — if longer than 120 chars, wrap to
  a second > line (not indented, just another > prefix)
- Maximum 20 items total (ready + waiting combined)
- Done section keeps last 5 only — oldest removed on each update
- Blank line between every entry

Lifecycle transitions:
  Add prompt     → status: ready (or waiting if defer_until set)
  Execute starts → status: running, moved to RUNNING section
  Execute done   → status: done, moved to DONE section
  Pause (gate)   → status: paused, stays in RUNNING section
  Resume pause   → status: running, stays in RUNNING section

---

SESSION_HANDOFF.md SCHEMA

Five bare-markdown fields at top of file. Always visible on
GitHub iOS first view — no code block, no expand, no scroll.

  ACTIVE:   [user]
  MODE:     [vibe | gsd | raw | pair | teach | exec | caveman]
  MID-TASK: [YES | NO]
  LAST:     [ISO date]
  NEXT:     [one-line guidance for next session, max 80 chars]

Below the five fields, a blank line and a horizontal rule,
then the full detail block (code-block format is fine there
because it is below the fold — the critical fields are exposed).

Example top of file:

  ACTIVE:   michael
  MODE:     vibe
  MID-TASK: NO
  LAST:     2026-05-09
  NEXT:     Gate 1 manual check pending — run from iPhone

  ---

  [full YAML-ish detail block follows here]

Rules:
- The five fields must always be the first five content lines
- No heading before the five fields
- MID-TASK is always YES or NO — binary, no qualifiers
- NEXT is the most important field: it tells the next session
  exactly what to do in one line without reading any other file
- If NEXT is null, the session closed cleanly — write "CLEAR"

---

QUEUE SEMANTICS

Lifecycle states (5 total):

  ready    — queued, no deferral, available for execution
  waiting  — deferred until condition resolves
  running  — currently executing (at most 1 at a time inline)
  paused   — executing, hit an approval gate, needs input
  done     — completed (kept in graveyard, last 5 visible)

Condition types for waiting items:

  m_task:M30                   build plan item M30 marked done
  track:6.5                    Claude build plan track 6.5 done
  date:2026-05-12T09:00Z       clock passes timestamp
  file:/path/to/file           file exists at path
  prompt:#3_done               queue item #3 reached done state

Execution modes:

  inline    — executes in current Claude turn (default)
  subagent  — dispatches via Agent tool (for parallel/isolated)

Drain policy:
  1 item    → inline
  2 items   → inline serial
  3+ items  → subagent parallel unless "drain serial" specified

---

PHONE-FIRST RENDERING RULES

Rule 1 — No markdown tables in operational files
  All four schema files (STATUS, WIP, SESSION_HANDOFF, QUEUE)
  must never contain a markdown table. GitHub iOS renders tables
  as horizontal scrollers. The rightmost columns — always the
  most important — are clipped on a 428px viewport.

Rule 2 — No code blocks above the fold
  Code blocks collapse on GitHub iOS and require a tap to expand.
  Any field that must be visible without interaction must be
  bare markdown text, not inside a fenced block.

Rule 3 — Maximum 10 lines before scroll
  GitHub iOS displays approximately 10-12 lines before requiring
  a scroll gesture. The most critical information in every file
  must appear in the first 10 lines.

Rule 4 — Maximum 80 characters per line
  Lines longer than 80 characters wrap on a 428px screen at
  default font size, creating visual confusion and making
  structured fields look like prose. Hard limit: 80 chars.

Rule 5 — No nested bullet lists in operational files
  Nested bullets collapse into a single visual run on GitHub
  iOS narrow viewports. Use flat structure only: numbered lists
  or labeled fields.

Rule 6 — No HTML in markdown files
  GitHub iOS renders HTML inconsistently. Details/summary blocks,
  inline spans, and custom attributes are unreliable. Plain
  markdown only.

Rule 7 — No checkboxes inside operational content
  GitHub iOS renders checkboxes but they are not tappable in
  the file view. Checkboxes are acceptable only in files where
  the rendered state is purely informational (BUILD_PLAN files).
  Operational state (queue status, gate status) uses text values,
  not checkboxes.

Rule 8 — File depth maximum 2 levels from repo root
  Files deeper than 2 directory levels require 6+ taps to reach
  on GitHub iOS. All five operational files must live at:
  - repo root (STATUS.md, WIP.md, SESSION_HANDOFF.md,
    PROMPT_QUEUE.md), or
  - one directory deep (docs/mvhb/) for spec files only

Rule 9 — No horizontal rules except as section dividers
  One horizontal rule maximum per file. Used only to divide
  "above the fold critical fields" from "below the fold detail."

Rule 10 — File size maximum 30 lines for operational files
  STATUS.md: 10 lines max
  WIP.md: 15 lines max
  SESSION_HANDOFF.md above-the-fold block: 7 lines max
  PROMPT_QUEUE.md: scales with items but each entry is 3 lines

---

GITHUB iOS OPERATIONAL ASSUMPTIONS

These are facts about GitHub iOS behavior as of 2026-05-09.
Design decisions in this spec depend on all of them being true.

- Markdown files render on first tap with no additional input
- Plain text fields (label: value) render correctly at any width
- Numbered lists render correctly (1. 2. 3.)
- Blockquote syntax (> text) renders as indented text — readable
- Code blocks render but are collapsed by default on long files
- Horizontal rules render as a visual divider line
- Commit history is reachable in 3 taps from repo root
- Branch list is reachable in 2 taps from repo root
- Branch names truncate at approximately 30 characters in the
  branch list — longer names are unreadable without tapping in
- File search requires 3 taps to reach (search icon, type, tap)
- Copy-to-clipboard works on any selected text in file view
- PR list is reachable in 2 taps from repo root
- PR description renders fully (no truncation)
- PR diff is readable (one file at a time, swipe to navigate)
- CI status shown on PR view (pass/fail only, no log access)

---

END OF SPEC
