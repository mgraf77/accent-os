# CURRENT PRIORITIES

## Purpose
The 1–5 highest-leverage active priorities, ranked. Anything not here is not a priority
this cycle — it lives in `evolution-memory/DEFERRED_EVOLUTION_QUEUE.md`.

## Required Sections
1. **Cycle id + window** — e.g. `cycle-2026-W19` (ISO week) and start/end date.
2. **Ranked list (max 5)** — each entry: id, title, owner, success criterion, blocker (if any).
3. **Recently demoted** — items that left the top-5 since last cycle, with reason.
4. **Promotion sources** — where items came from (DER queue, audit finding, escalation).

## Update Rules
- Updated at start of each cycle (default = ISO week) and on any P0 escalation.
- Replacing an item requires writing the demoted item back to DER with status `parked`.
- No more than 5 items at any time. Adding a 6th forces a demotion decision.

## Ownership Rules
- Human (Michael) ranks and approves entries. AI proposes via patch plan.
- Read owner: every mode, every session start, every BUILD_PLAN check-in.

## Allowed Mutation Rules
- Append-only within a cycle (rationale lines below entries).
- Replacement requires Plan-Then-Execute mode.
- Auto-fix mode may not modify this file.

## Compression Standards
- Hard cap: 80 lines.
- Each priority entry ≤ 6 lines.
- Success criterion must be falsifiable (a test, a metric threshold, a shipped commit).

## Archival Rules
- On cycle close, file is snapshotted to `audits/priorities-archive/<cycle_id>.md`.
- Snapshot retains rationale; current file resets to next cycle.

## Schema (entry)
```
P<n>. <title>           id: <slug>
     owner: <name>
     success: <falsifiable criterion>
     blocker: <none | text>
     source: <DER | audit | escalation | direct>
```

## Initial Content (v0.1, unseeded)
P1 rollout seeds this from BUILD_PLAN_CLAUDE.md top items + WORK_IN_PROGRESS.
