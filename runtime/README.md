# AccentOS Runtime — Minimum Viable Handoff Bus (MVHB)
> Phase 1 foundation. Durable operational state outside conversational sessions.

**Status:** PHASE 1 — FOUNDATION
**Last Updated:** 2026-05-08
**Authority:** Implementation Hub
**Governance:** Additive only. Compatible with existing freeze/governance architecture.

---

## WHAT THIS IS

The MVHB is a filesystem-based handoff system. It externalizes runtime state from conversational sessions into durable, human-inspectable files.

The "bus" is this directory. Sessions write to it. Sessions read from it. The bus persists. Sessions are disposable.

---

## WHAT THIS IS NOT

- Not autonomous orchestration
- Not auto-routing
- Not agent spawning
- Not self-modifying
- Not a dashboard
- Not a CI/CD pipeline
- Not a database

It is files. Markdown and JSON. Read by humans on a phone. Read by Claude in a session.

---

## DESIGN CONSTRAINTS

1. **Phone-first** — readable from GitHub mobile. Markdown and JSON only.
2. **Human-inspectable** — no hidden state. No automation that writes outside of explicit session actions.
3. **Default-safe** — no autonomous execution. No auto-routing. The bus does not "run" anything.
4. **Session-disposable** — sessions are workers. The bus is the durable layer. No session may assume continuity.
5. **Governance-compatible** — additive only. Does not modify existing governance architecture.

---

## FOLDER LAYOUT

```
runtime/
├── README.md           # This file
├── SCHEMA.md           # All schemas (handoff, session, queue, etc.)
├── queue/              # Pending work items (one file per task)
│   ├── README.md
│   └── _index.md       # Current queue snapshot
├── handoffs/           # Session-to-session handoff packets
│   ├── README.md
│   ├── _latest.md      # Pointer to most recent handoff
│   └── 2026-05-08T*.md # Timestamped handoff packets
├── sessions/           # Session registry (start, end, summary)
│   ├── README.md
│   ├── _active.md      # Currently-active session marker
│   └── 2026-05-08T*.md # Per-session entries
├── branches/           # Branch ownership records
│   ├── README.md
│   └── *.md            # One per active branch
├── tasks/              # Full task specs (richer than queue items)
│   ├── README.md
│   └── *.md            # One per task
├── events/             # Append-only event log (daily files)
│   ├── README.md
│   └── 2026-05-08.log
└── locks/              # Active file/resource locks
    ├── README.md
    └── *.lock          # One per locked path
```

---

## LIFECYCLE STATES

A task or session moves through these states. State transitions are written to events/ and reflected in queue/_index.md.

### Task States

```
NEW         — task created, not yet ready
READY       — prerequisites met, may be claimed
CLAIMED     — a session has claimed it
IN_FLIGHT   — actively being worked
BLOCKED     — paused on external dependency
COMPLETE    — done and committed
DEFERRED    — postponed indefinitely
ABANDONED   — explicitly cancelled
```

### Session States

```
ACTIVE      — currently running
HANDED_OFF  — session ended, handoff written
COMPACTED   — context compacted mid-session (resume from handoff)
TERMINATED  — session ended without handoff (recovery via Hub)
```

### Branch States

```
PLANNED     — declared but not yet created
ACTIVE      — created, accepting commits
PAUSED      — no active sessions, awaiting resumption
MERGED      — content merged to target, awaiting retirement
RETIRED     — deleted from remote
```

### Lock States

```
HELD        — lock active, expected_release in future
EXPIRED     — past expected_release, may be reclaimed
RELEASED    — no longer held (file deleted)
```

---

## OPERATIONAL FLOW

### Session A starts

1. Read `runtime/handoffs/_latest.md` — pick up where last session left off
2. Read `runtime/sessions/_active.md` — verify no other active session
3. Write own session entry to `runtime/sessions/[timestamp]-[slug].md`
4. Update `runtime/sessions/_active.md` to point to new session
5. Optionally claim a task from `runtime/queue/` by writing to `runtime/locks/[task-id].lock`
6. Append session-start event to `runtime/events/[date].log`

### Session A works

1. Updates task file with progress notes
2. Writes intermediate notes to own session file
3. May acquire/release locks on files

### Session A ends

1. Writes handoff packet to `runtime/handoffs/[timestamp]-[slug].md`
2. Updates `runtime/handoffs/_latest.md` to point to new handoff
3. Updates own session file: status → HANDED_OFF
4. Releases locks (deletes lock files)
5. Appends session-end event to events log
6. Updates `runtime/sessions/_active.md` (cleared)
7. Updates queue/_index.md if task state changed

### Session B starts (next day, phone-first)

1. Reads `runtime/handoffs/_latest.md`
2. Reads pointed-to handoff packet
3. Has full continuation context: open questions, blockers, exact next prompt
4. Proceeds without needing to scroll prior conversation

---

## WHAT MICHAEL READS ON HIS PHONE

In priority order:

1. `runtime/handoffs/_latest.md` — what's the current state, what's next
2. `runtime/queue/_index.md` — what's pending, what's blocked on me
3. `runtime/sessions/_active.md` — is anything running right now
4. `runtime/events/[today].log` — what happened today

Everything else is read by Claude when starting a session.

---

## GOVERNANCE POSTURE

This system is **additive**. It does not modify:
- `index.html` (frozen)
- `worker/` (Michael deploys)
- `wrangler.toml` (frozen)
- `supabase/` (Michael runs migrations)
- Existing governance docs (`GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, etc.)
- `docs/implementation/*` (read by sessions, not mutated by bus)

The bus reads governance docs to know what is frozen. It does not enforce freezes; sessions self-enforce.

---

## RELATIONSHIP TO docs/implementation/

The implementation hub layer (`docs/implementation/`) defines policy. The runtime bus (`runtime/`) records state.

- `docs/implementation/ACCENTOS_IMPLEMENTATION_MASTER_QUEUE.md` — what should be done
- `runtime/queue/` — the live queue, one file per task

- `docs/implementation/ACCENTOS_ACTIVE_BRANCH_REGISTRY.md` — branch policy
- `runtime/branches/` — live branch state

- `docs/implementation/ACCENTOS_PARALLEL_WORK_RULES.md` — concurrency rules
- `runtime/locks/` — active file locks (enforces concurrency rules in practice)

---

## WHAT IS DELIBERATELY EXCLUDED

- No `runtime/agents/` — agents are session-scoped, not durable
- No `runtime/orchestrator/` — there is no orchestrator yet
- No `runtime/api/` — no programmatic interface, files only
- No `runtime/auto/` — no automated processes
- No `runtime/cache/` — no derived state
- No `runtime/secrets/` — credentials never live here

---

## NEXT PHASE (PHASE 2 — NOT THIS SESSION)

Possible additions, deferred:

- A simple `runtime/_sync.sh` script that prints handoff status (read-only)
- Phone-friendly summary card auto-generated from queue state
- Hook into git pre-commit to verify lock files match changed files
- GitHub Actions to surface handoff status in PR descriptions

These are NOT built yet. Phase 1 is files only.
