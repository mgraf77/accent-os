# OPERATIONAL_HUD_SPEC.md — AccentOS Operational HUD Field Definitions

> Canonical spec for every field displayed in the AccentOS operational HUD.
> Source of truth for what gets written to STATUS.md and how it is surfaced.

---

## OVERVIEW

The Operational HUD is the set of fields that give Michael a complete system picture
in a single read. Every field maps 1:1 to a STATUS.md section.
This doc defines the semantic contract for each field — what it means, what writes it,
what makes it stale, and what action it demands from Michael.

---

## FIELD CATALOG

---

### 1. CURRENT BRANCH

**Purpose:** Tells Michael which branch Claude is actively developing on.

**Written by:** Claude at session start and on branch switch.

**Format:** Full branch name. `claude/[feature-slug]-[session-id]`

**Staleness signal:** If branch name is more than 7 days old with no push, flag YELLOW.

**Michael action required:** None unless branch is wrong — then correct via chat.

**Why it matters:** Michael may be reviewing code on GitHub and needs to know which branch
to look at. Branch name also encodes the session ID for multi-session triage.

---

### 2. LAST PUSH

**Purpose:** Confirms Claude's most recent successful push to remote. Proof of work.

**Written by:** Claude immediately after `git push` succeeds.

**Format:** `[7-char hash] — [commit message] — [YYYY-MM-DD HH:MM]`

**Staleness signal:** If session is ACTIVE and last push is >2h ago, status is YELLOW.
If session is ACTIVE and last push is >6h ago, status is RED.

**Michael action required:** None unless push shows unexpected message (e.g., "no changes").

**Why it matters:** Primary signal that work is actually landing. A frozen LAST PUSH
during an ACTIVE session means something is wrong.

---

### 3. WIP (Work In Progress)

**Purpose:** One-sentence description of what Claude is doing right now (or last did).

**Written by:** Claude at every meaningful state transition — before uncommitted work,
after commits, at pause/freeze.

**Format:** Single sentence, present tense (ACTIVE) or past tense (FROZEN/PAUSED).

**Staleness signal:** If SESSION STATE is ACTIVE but WIP hasn't changed across two
consecutive commits, something may be stuck.

**Michael action required:** None unless WIP says "stuck" or "blocked" — then read CURRENT GATE.

**Why it matters:** The fastest way to know if Claude is making progress or spinning.
Michael reads this first.

---

### 4. QUEUE DEPTH

**Purpose:** How much work is left in the autonomous build queue.

**Written by:** Claude after every BUILD_PLAN_CLAUDE.md item is checked off.

**Format:** `[N] items` or `[N] items ([M] blocked on Michael)`

**Source:** Count of unchecked `[ ]` items in BUILD_PLAN_CLAUDE.md, split by
blocked-on-Michael vs. unblocked.

**Staleness signal:** If QUEUE DEPTH hasn't decreased in 24h with no BLOCKED status, investigate.

**Michael action required:** None unless queue reaches 0 — then Michael reviews what shipped
and potentially adds new items.

**Why it matters:** Gives Michael a rough ETA signal. "3 items (0 blocked)" means
Claude can keep running without input. "7 items (7 blocked on Michael)" means
Claude is fully stopped pending M-tasks.

---

### 5. NEXT ACTION

**Purpose:** Exactly what Claude will do next — no ambiguity.

**Written by:** Claude at session pause, freeze, and after each BUILD_PLAN item completes.

**Format:** One sentence. Starts with an action verb. References a BUILD_PLAN item number
or a specific file/function if relevant.

**Staleness signal:** If session resumes and NEXT ACTION is more than 48h old,
Claude must re-read context before acting (WIP may have shifted).

**Michael action required:** None unless NEXT ACTION says "awaiting M-task resolution."

**Why it matters:** Enables instant resume with zero ramp-up. Michael can read this
and immediately know if Claude is about to do something dangerous or wrong,
and stop it before it starts.

---

### 6. CURRENT GATE

**Purpose:** The specific Michael-owned action blocking Claude's path forward.

**Written by:** Claude the moment a blocking dependency on Michael is identified.

**Format:** `NONE` or `M##: [plain English action description]`

**Gate resolution:** Michael performs the action, then either:
a. Edits CURRENT GATE to NONE manually, or
b. Tells Claude "M## done" in chat — Claude updates STATUS.md.

**Active gates (M-task registry — maintained in BUILD_PLAN_CLAUDE.md):**
- M01: Run `sql/M01_rls_tightening.sql` in Supabase dashboard
- M02: Run `sql/M02_core_schema.sql` in Supabase dashboard
- M03–M30+: as defined in BUILD_PLAN_CLAUDE.md

**Why it matters:** The most common reason Claude stops. A stale CURRENT GATE
is the #1 operational blind spot — Michael forgets, Claude idles.

---

### 7. BLOCKED STATUS

**Purpose:** Binary signal — is Claude currently unable to proceed?

**Written by:** Claude.

**Values:** `NO` or `YES — [reason]`

**Distinction from CURRENT GATE:**
- CURRENT GATE names WHAT is blocking.
- BLOCKED says WHETHER that gate is stopping all progress.
- Claude may have a gate open but still be unblocked if the gate affects a different
  track and unblocked items remain. Per BUILD_PLAN rules: skip blocked items, pick
  next unblocked item.

**Michael action required:** If BLOCKED is YES — resolve the gate. Immediately.

**Why it matters:** YES = Claude is idle. Every hour of YES is an hour of lost build momentum.

---

### 8. ACTIVE SESSIONS

**Purpose:** How many Claude sessions are currently live and working.

**Written by:** Claude. For multi-agent or parallel-worktree scenarios.

**Format:**
- `1 — solo` for single session
- `2 — [branch-a], [branch-b]` for parallel

**Current AccentOS norm:** 1 session at a time (solo build). This field grows
when Michael explicitly launches parallel sessions (e.g., "also work on X").

**Michael action required:** If count >1 and Michael didn't authorize it, flag to Claude.

**Why it matters:** Parallel sessions can conflict. Michael needs to know if more than
one Claude is pushing to related branches at the same time.

---

### 9. FROZEN SESSIONS

**Purpose:** Branches that were active, have committed work, but are currently parked.

**Written by:** Claude at the time of freezing (session wrap or context switch).

**Format:** `[N] — [branch names]` or `0 — none`

**Frozen ≠ abandoned.** Frozen sessions have unreleased work that needs to be either:
a. Resumed and merged, or
b. Explicitly abandoned (branch deleted, work discarded)

**Michael action required:** If frozen session count grows >3, review with Claude
which ones to merge, which to kill. Frozen sessions are silent debt.

**Why it matters:** The biggest operational blind spot in multi-session Claude workflows.
Work that is frozen is not visible in main, not shipped to users, and silently ages.

---

## DERIVED HEALTH SIGNAL

The HEALTH field is a synthesis of all other fields.

| GREEN | All sessions active or cleanly frozen, no gate, last push <2h |
|---|---|
| YELLOW | Gate open but Claude still building; OR uncommitted WIP >1h; OR frozen sessions >2 |
| RED | BLOCKED YES; OR last push >6h during active session; OR frozen sessions >4; OR gate unresolved >48h |

---

## FIELD DEPENDENCIES

```
BLOCKED YES ──────────────┐
                           ▼
CURRENT GATE ──────► NEXT ACTION (waits)
                           ▲
QUEUE DEPTH ───────────────┘

SESSION STATE ACTIVE ──► WIP must update with each commit
SESSION STATE FROZEN ──► NEXT ACTION must be set (resume instruction)
SESSION STATE PAUSED_ON_MICHAEL ──► BLOCKED must be YES + CURRENT GATE set
```

---

## ANTI-PATTERNS

These indicate HUD is not being maintained:

1. SESSION STATE = ACTIVE but LAST PUSH timestamp is >4h old — Claude may have crashed or loop-spun
2. CURRENT GATE set but BLOCKED = NO and QUEUE DEPTH = 0 — contradicts itself
3. NEXT ACTION = "TBD" or blank — Claude didn't set a resume instruction
4. FROZEN SESSIONS growing without corresponding ACTIVE work — sessions accumulate silently
5. QUEUE DEPTH = 0 but SESSION STATE = ACTIVE — Claude may be spinning on non-plan work
6. WIP is multi-sentence — too detailed for the HUD, detail belongs in WIP.md
7. HEALTH = GREEN while BLOCKED = YES — impossible, flag as HUD maintenance failure

---

## FIELD UPDATE RESPONSIBILITY MATRIX

| Field | Claude writes | Michael writes | Auto-source |
|---|---|---|---|
| CURRENT BRANCH | Y | N | git branch |
| LAST PUSH | Y | N | git push result |
| WIP | Y | N | manual judgment |
| QUEUE DEPTH | Y | N | BUILD_PLAN count |
| NEXT ACTION | Y | N | manual judgment |
| CURRENT GATE | Y | Y (resolution) | M-task registry |
| BLOCKED | Y | N | derived from gate |
| ACTIVE SESSIONS | Y | N | session context |
| FROZEN SESSIONS | Y | N | branch tracking |
| HEALTH | Y | N | derived |
