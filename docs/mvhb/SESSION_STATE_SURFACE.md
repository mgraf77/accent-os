# SESSION_STATE_SURFACE.md — AccentOS Session Visibility & State Model

> Defines how Claude sessions are tracked, surfaced, and managed.
> Covers: branch visibility, session states, queue ownership, and resume semantics.
> Pure design — no implementation.

---

## CORE PROBLEM THIS SOLVES

AccentOS runs Claude across multiple sessions (iOS app, Codespace, Claude.ai web).
Without a defined session state model, work gets orphaned, branches multiply silently,
and Michael has no way to know what is active vs. frozen vs. dead.

This doc is the contract for how sessions are represented and resumed.

---

## SESSION VOCABULARY

| Term | Definition |
|---|---|
| Session | A single continuous Claude conversation with a defined branch and WIP context |
| Active session | A session currently executing work (Claude is running or available to run) |
| Frozen session | A session that has committed work but is currently parked — not running, resumable |
| Paused session | A session waiting on a Michael M-task — Claude cannot proceed |
| Abandoned session | A session that will not be resumed — work either merged or discarded |
| Orphan | A branch with commits but no SESSION_STATE entry — indicates a gap in tracking |

---

## BRANCH VISIBILITY MODEL

### What is a "visible" branch?

A branch is visible if it appears in one of these states in STATUS.md:
- Listed as CURRENT BRANCH (active)
- Listed in FROZEN SESSIONS (parked)
- Referenced in CURRENT GATE or NEXT ACTION

A branch that exists on remote but appears in none of these is an **orphan**.

### Orphan detection (manual v1)

Claude checks for orphan branches at session start:
```
git branch -r | grep claude/
```
Any branch not referenced in STATUS.md ACTIVE SESSIONS or FROZEN SESSIONS
gets flagged in HEALTH as YELLOW with note: "orphan branch detected: [name]"

Michael decides: merge, abandon, or activate.

### Branch naming convention (reinforcement)

```
claude/[feature-slug]-[session-id]
```
- `feature-slug`: 2-4 words, kebab-case, describes the primary work
- `session-id`: 5-char alphanumeric from the session context (from branch URL or manual)

Examples:
- `claude/employee-supabase-wiring-S2Abc`
- `claude/operational-hud-design-S1Eon`
- `claude/quote-persist-fix-X9kQm`

The session-id is not semantically meaningful — it just guarantees uniqueness
and allows branch ↔ session correlation.

---

## SESSION STATE MACHINE

```
           ┌─────────────────────────────────────┐
           │              ACTIVE                 │
           │  Claude is executing work           │
           └──────┬──────────────────────────────┘
                  │
        ┌─────────┼───────────────┐
        ▼         ▼               ▼
   FROZEN    PAUSED_ON       COMPLETE
   (parked)   MICHAEL        (done)
        │         │               │
        │         │               ▼
        │         │          [merge to main]
        │         │               │
        └────┬────┘               ▼
             │               ABANDONED
             ▼               (if not merged)
          ACTIVE
       (on resume)
```

### State transitions

| From | To | Trigger |
|---|---|---|
| ACTIVE | FROZEN | Claude session ends without completing queue |
| ACTIVE | PAUSED_ON_MICHAEL | M-task blocking all remaining work |
| ACTIVE | COMPLETE | All queued work shipped and pushed |
| FROZEN | ACTIVE | Michael says "resume [branch]" or "continue last session" |
| PAUSED_ON_MICHAEL | ACTIVE | Michael resolves the M-task |
| COMPLETE | ABANDONED | Work merged into main; branch deleted |
| FROZEN | ABANDONED | Michael explicitly abandons the branch |
| PAUSED_ON_MICHAEL | ABANDONED | Michael decides not to resolve the gate |

### What Claude does at each state transition

**ACTIVE → FROZEN:**
1. Commit any uncommitted WIP with `wip:` prefix
2. Update STATUS.md: SESSION STATE = FROZEN, WIP = last action, NEXT ACTION = resume instruction
3. Push STATUS.md update
4. Add branch to FROZEN SESSIONS list in STATUS.md

**ACTIVE → PAUSED_ON_MICHAEL:**
1. Commit WIP if any
2. Update STATUS.md: SESSION STATE = PAUSED_ON_MICHAEL, CURRENT GATE = M##, BLOCKED = YES
3. Push
4. Stop — do not pick next task; wait for Michael to resolve gate

**FROZEN → ACTIVE (resume):**
1. Read STATUS.md → find NEXT ACTION
2. Read WORK_IN_PROGRESS.md for deep context
3. Confirm CURRENT GATE is still NONE (or resolve before proceeding)
4. Update STATUS.md: SESSION STATE = ACTIVE
5. Execute NEXT ACTION

---

## QUEUE OWNERSHIP

### What is the "queue"?

The build queue is `BUILD_PLAN_CLAUDE.md` — the ordered list of `[ ]` items
Claude works through autonomously.

### Queue ownership rules

| Situation | Owner |
|---|---|
| Item is unblocked [ ] | Claude owns it — executes without asking |
| Item has `BLOCKS ON MICHAEL: M##` | Michael owns the gate; Claude skips and moves to next |
| Queue reaches 0 items | Michael owns it — must add new items or signal COMPLETE |
| Item requires a judgment call not documented in BUILD_INTELLIGENCE.md | Claude asks once, then documents the answer in BUILD_INTELLIGENCE.md |

### Queue visibility in STATUS.md

QUEUE DEPTH shows:
- Total unchecked items
- How many are currently blocked on Michael

This tells Michael at a glance: "Claude can keep building without me" vs. "Claude needs me before it can keep going."

---

## ACTIVE vs. FROZEN — OPERATIONAL RULES

### Active session rules
- Claude must push at least once per hour of active work
- WIP must be committed (even as `wip:` commit) before any session end
- HEALTH degrades to YELLOW if last push > 2h during active session
- HEALTH degrades to RED if last push > 6h during active session

### Frozen session rules
- A frozen session is NOT stale — it is intentionally parked
- Frozen sessions do not degrade HEALTH unless count > 3
- Claude does not touch frozen branches without Michael's explicit instruction
- A frozen session's NEXT ACTION is the canonical resume instruction — it must be set
- Frozen branches are listed in STATUS.md FROZEN SESSIONS for visibility

### Frozen session debt

Frozen sessions accumulate silently. They represent:
- Work not yet in main
- Features not yet available to users
- Potential merge conflicts if left too long
- Context ramp-up cost when resumed

Michael should review FROZEN SESSIONS list at minimum weekly.
If a frozen session is >14 days old, Claude flags it as YELLOW.
If a frozen session is >30 days old, Claude flags it as RED.

---

## RESUME SEMANTICS

### What "resume" means for Claude

Resume is NOT starting fresh. It is picking up exactly where the previous session left.

Resume checklist (Claude executes in order):
1. Read STATUS.md → confirm SESSION STATE, CURRENT GATE, BLOCKED
2. Read WORK_IN_PROGRESS.md → get deep context on current task
3. Read BUILD_PLAN_CLAUDE.md → confirm NEXT ACTION is still the right next item
4. Read BUILD_INTELLIGENCE.md → refresh lessons before touching code
5. Confirm git branch matches STATUS.md CURRENT BRANCH
6. Check for uncommitted changes (`git status`) — if found, evaluate and commit or discard
7. Execute NEXT ACTION

### Resume triggers Michael can use

| Phrase | Effect |
|---|---|
| "resume" | Resume from STATUS.md NEXT ACTION on current branch |
| "continue last session" | Same as resume |
| "resume [branch name]" | Explicitly resume a named frozen session |
| "M## done" | Mark gate resolved, resume from NEXT ACTION |
| "abandon [branch]" | Claude marks session ABANDONED, proposes cleanup |

### What Claude NEVER does on resume without explicit instruction

- Switch to a different branch than what STATUS.md shows
- Restart a completed task
- Merge a frozen branch into main
- Delete a frozen branch
- Change QUEUE DEPTH by adding or removing BUILD_PLAN items

---

## MULTI-SESSION VISIBILITY (current + future state)

### v1 (current — solo sessions)
- One active session at a time
- ACTIVE SESSIONS = `1 — solo`
- FROZEN SESSIONS tracks parked branches
- STATUS.md is the single source of truth

### v2 (parallel sessions — future)
For when Michael runs Claude in multiple tabs or windows simultaneously:

- Each active session writes to its own STATUS-[branch].md file
- A root STATUS.md aggregates: ACTIVE SESSIONS list, HEALTH (worst-case rollup)
- Sessions must not push to the same branch (branch isolation enforced by naming convention)
- Michael sees parallel sessions as distinct rows in the ACTIVE SESSIONS field

This is a future design — not implemented in MVHB.

---

## OPERATIONAL BLIND SPOTS THIS MODEL ADDRESSES

1. **Silent branch accumulation** — FROZEN SESSIONS list makes parked work visible
2. **Orphan branches** — orphan detection at session start flags uncategorized branches
3. **Stale gates** — CURRENT GATE + BLOCKED in STATUS.md makes Michael's debt visible
4. **Lost context on resume** — NEXT ACTION + WIP.md gives Claude a cold-start resume path
5. **Unknown session count** — ACTIVE SESSIONS field shows if parallel work is happening
6. **Uncommitted WIP** — HEALTH degrades if push is stale during active session
7. **Frozen session debt** — age-based HEALTH degradation for frozen branches >14d

---

## STATUS.md AS THE SESSION REGISTRY

STATUS.md is not just a status report — it is the session registry.
Every session that exists (active or frozen) must appear in STATUS.md.
If a session is not in STATUS.md, it does not exist from Michael's operational perspective.

This makes STATUS.md the single answer to: "What is Claude currently doing,
what has it left unfinished, and what does Michael need to do next?"
