# MVHB Roadmap
**Minimum Viable Handoff Bus — Phase Map and Automation Boundary Charter**

**Version:** 1.0  
**Authority:** Implementation Hub  
**Branch:** claude/implement-claude-design-ui-eFn9b  
**Created:** 2026-05-09  
**Status:** Active  

---

## What This Document Is

The authoritative phase-by-phase plan for evolving the handoff bus from its current
file-based skeleton into a resilient, usage-aware session coordination layer.
Each phase has a clear entry gate, exit criteria, and automation boundary statement.
Nothing in this document authorizes automation that bypasses Michael.

---

## Phase 0 — Pre-MVHB (Complete)

**Period:** Sessions 1–5 on this branch  
**State:** Conversational only. No durable state between sessions.  
**Failure mode:** Every session started blind. Each agent re-read the same docs,
re-derived the same context, re-made the same decisions. Estimated 30–40% of every
session was pure re-orientation overhead.  
**Exit trigger:** Context compaction + recovery cost exceeded benefit of stateless design.

---

## Phase 1 — Static Runtime Foundation (Current)

**Status:** Complete as of 2026-05-08  
**Commit:** 99f4f6e  

### What exists

```
runtime/
  README.md          — architecture + phone-first read order
  SCHEMA.md          — 6 artifact schemas with YAML frontmatter
  handoffs/          — session handoff packets
  sessions/          — session entry/exit records
  queue/             — task queue with _index.md snapshot
  branches/          — per-branch state records
  tasks/             — task-level tracking (future)
  events/            — append-only event log per day
  locks/             — mutex tokens (future)
```

### What it does

Gives each session a known landing pad: `runtime/handoffs/_latest.md`.
Gives Michael a phone-readable status surface.
Establishes schemas so future tooling can parse artifacts without guessing structure.

### What it does NOT do

- Zero automation. Files don't move themselves.
- Zero enforcement. Schema violations don't block anything.
- Zero routing. Sessions still claim tasks manually.
- Zero compression. Handoffs are human-written, full-prose.

### Exit criteria for Phase 1

- [x] Directory structure exists
- [x] All 6 schemas defined in SCHEMA.md
- [x] Sample artifacts for all non-empty schema types
- [x] _latest.md pointer file exists
- [x] Event log operational
- [ ] First real (non-sample) handoff written by an active session
- [ ] Queue index updated from a real task completion

---

## Phase 2 — Phone-First Operation Layer

**Status:** Designed, not built  
**Gate:** Phase 1 exit criteria fully satisfied  
**Estimated effort:** 1 session  

### Goal

Make `runtime/` fully navigable from a phone in under 60 seconds.
Current state requires reading 3+ files to understand system status.
Target: one file gives complete operational picture.

### Deliverables

**`runtime/STATUS.md`** — Single-file system dashboard, overwritten each session start/end.

```
# AccentOS System Status
Updated: [timestamp] by [session-id]

## Active Sessions
[table: session-id | branch | started | last-seen | task]

## Queue (Ready)
[table: task-id | priority | est-sessions | claimed-by]

## Blocked (Michael)
[table: item-id | severity | description | days-blocked]

## Recent Events
[last 5 from events/today.log]

## Boot Smoke
[pass/fail | timestamp | 27/27 or N/27]
```

**`runtime/RELAY.md`** — Relay compression template. Standardizes what Michael reads
between sessions. Replaces ad-hoc prose in handoff packets.

```
# Relay — [timestamp]

SESSION: [id] → [status]
TASK: [what was done in one sentence]
ARTIFACTS: [list of files changed]
NEXT: [exact next task with task-id]
BLOCKING: [what Michael must do, or NONE]
BOOT: [27/27 or N/27 + failure list]
```

### Automation boundary

Phase 2 is still 100% manual file writes. Sessions write STATUS.md and RELAY.md
at start/end. No automation touches these files. The value is format standardization,
not automation.

---

## Phase 3 — Queue Runtime

**Status:** Designed, not built  
**Gate:** Phase 2 complete + first real relay cycle confirmed working  
**Estimated effort:** 0.5 sessions  

### Goal

Make task claiming/releasing observable without reading multiple files.
Current state: queue index is stale by definition (hand-maintained snapshot).

### Deliverables

**`runtime/queue/_live.md`** — Single-file live queue state, overwritten on every claim/release.

Format:

```
# Queue Live State
Updated: [timestamp]

IN_FLIGHT: [task-id] claimed by [session-id] at [timestamp]
READY: r-01-prototype-hardening, r-02-decision-lock-doc, r-03-feature-flag-scaffold
BLOCKED: [count] items (see _index.md for details)
```

**Queue mutation protocol:**
1. Read `_live.md` before claiming — fail if task already IN_FLIGHT
2. Write `_live.md` with new state immediately on claim
3. Write task file `status: in_flight` + `claimed_by: [session-id]`
4. On complete: write task `status: complete`, overwrite `_live.md`, update `_index.md`

### Automation boundary

Still manual. Phase 3 adds protocol and format discipline, not automation.
The mutation sequence is written by the claiming session, not a daemon.

---

## Phase 4 — Relay Compression

**Status:** Conceptual  
**Gate:** Phase 3 working + Michael confirms relay is bottleneck  

### Problem

Current handoff packets are designed to be human-readable narratives.
That's correct for archival. But Michael's relay cost (reading handoff → composing
next prompt) is proportional to handoff prose volume.

### Design

Two formats coexist:

**Full handoff** (`handoffs/[timestamp].md`): Complete narrative, all context,
designed for archive + recovery from cold. Human writes, human reads.
Average target: 400–600 lines.

**Relay digest** (`handoffs/_relay.md`): Machine-targeted summary, overwrites each
session end. Designed for Claude to read as the FIRST and ONLY startup artifact
in a standard session. Target: 50 lines or fewer.

```yaml
---
schema: v1
type: relay_digest
session_id: [id]
emitted: [timestamp]
branch: [branch-name]
---
## One-liner
[what was done]

## State
task_completed: [id]
task_next: [id]
queue_depth: [n ready / n blocked]
boot_smoke: [27/27 or failure list]

## Files changed
[list, one per line]

## Michael must
[bulleted action list, or NONE]

## Cold start if
[list of conditions that indicate relay is stale and full handoff should be read]
```

### Automation boundary

Phase 4 automation boundary: sessions MAY emit relay digests automatically at
session end. This is the FIRST automation authorization in MVHB. Requires Michael
DEC-05 (not yet created) to authorize.

---

## Phase 5 — Stale Session Detection

**Status:** Future  
**Gate:** Phase 4 complete + multi-session parallelism demonstrated  

### Problem

With multiple sessions potentially active simultaneously, a session can go stale
without anyone noticing. A stale session holds a task claim indefinitely.

### Design

**`runtime/sessions/_active.md`** becomes a registry (currently a single-session pointer).

Each session writes a heartbeat timestamp on every commit.
A session is declared stale if its last heartbeat is > [STALE_THRESHOLD] (proposed: 4 hours).

Stale detection is performed by the NEXT session to start. Not by a daemon.
On detecting stale: write event log entry, release the stale task claim, notify Michael
in the first STATUS.md write of the new session.

### Automation boundary

Stale detection is executed by sessions, not external automation. No daemon.
No cron. No external trigger. Self-healing occurs only when a human-initiated session
starts and happens to observe stale state.

---

## Phase 6 — Usage-Aware Orchestration (Future)

**Status:** Conceptual sketch only  
**Gate:** Michael DEC-06 (not yet created), after Phase 5 demonstrated  

### Concept

Sessions observe their own context consumption and emit a pre-compaction handoff
before hitting context limits, rather than running out mid-task. Currently Claude
Code manages this somewhat automatically but the handoff quality degrades under
compaction pressure.

### Would require

- Session tracking of approximate context usage (rough heuristic, not exact)
- Automatic RELAY.md write when usage crosses [THRESHOLD]
- Michael opt-in per-session (not global — too risky as default)

### Automation boundary

This is the highest-autonomy automation currently imagined in MVHB. Still requires
explicit Michael opt-in per session. No global default. No persistent daemon.

---

## Phase 7 — Codex/External Agent Integration (Far Future)

**Status:** Placeholder only  
**Gate:** Phases 1–6 stable + explicit charter expansion by Michael  

### Concept

External agents (Codex, other Claude instances via API, etc.) read `runtime/` artifacts
as their primary context source instead of requiring full conversational handoff.
The MVHB becomes an agent coordination bus, not just a human-Claude relay channel.

### Why this is far future

Requires: stable schema version (v2+), relay digest format stability, proven multi-session
safety, Michael explicit authorization of external agent read access to runtime/.

### Automation boundary

Absolute gate: Michael explicit opt-in, branch-level authorization only, reversible.
External agents NEVER write to runtime/ without additional charter (Phase 8+).

---

## Automation Boundaries — Summary Table

| Phase | Name | Auto? | Who acts | Auth required |
|-------|------|-------|----------|---------------|
| 1 | Static Foundation | No | Human session | None |
| 2 | Phone-First Layer | No | Human session | None |
| 3 | Queue Runtime | No | Human session | None |
| 4 | Relay Compression | Yes (emit only) | Session at end | DEC-05 |
| 5 | Stale Detection | Yes (detect only) | Session at start | DEC-05 |
| 6 | Usage-Aware | Yes (emit early) | Session (opt-in) | DEC-06 |
| 7 | External Agents | Yes (read only) | External agent | DEC-07+ |

Current authorization level: Phase 1–3 (zero automation).

---

## Human Attention Budget Integration

See `MICHAEL_ATTENTION_BUDGET.md` for the relay cost model.
Key constraint shaping MVHB design: Michael's relay overhead target is ≤ 90 seconds
per session-boundary crossing. Every MVHB phase is evaluated against this constraint.
Phase 2 (RELAY.md) is the highest-leverage intervention for reducing relay cost.

---

## What MVHB Is Not

- Not a task scheduler
- Not an agent coordinator
- Not a CI/CD replacement
- Not a monitoring system
- Not a messaging bus
- Not a database
- Not autonomous

MVHB is a structured filesystem pattern for preserving session context across
the hard boundary of Claude Code session termination. That's it.
