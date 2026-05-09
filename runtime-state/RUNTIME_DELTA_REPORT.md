# RUNTIME DELTA REPORT

## Purpose
The diff between checkpoints — the "git for cognition and orchestration." Read to
understand what *changed* between the last canonical state and now, including changes in
governance, priorities, risks, and metrics — not just code.

## Required Sections (per delta entry, newest at top)
1. **Header** — delta_id, from_checkpoint → to_checkpoint, range timestamps, mode used.
2. **State Delta** — what changed in CANONICAL_RUNTIME_STATE.md (added / removed / changed).
3. **Priority Delta** — promotions, demotions, new entries.
4. **Risk Delta** — new, escalated, mitigated, closed.
5. **Mutation Delta** — patches landed (commit refs), patches reverted.
6. **Governance Delta** — policy edits, escalations issued, hard-stops triggered.
7. **Metric Delta** — RCI, entropy_delta, complexity_velocity, governance_lag (before → after).
8. **Architecture Delta** — module added / removed / boundary changed.
9. **DER Delta** — items intaked, promoted, declined, archived.
10. **Open Items Carried Over** — anything not resolved this delta.

## Update Rules
- Append-only. Newest entry at top. Never edit historical entries.
- Written at every successful checkpoint by the runtime loop.
- One delta per checkpoint; no batching across checkpoints.

## Ownership Rules
- Write owner: runtime loop (Patch Loop + Checkpoint Loop).
- Read owner: every audit, every cycle review, every Plan-Then-Execute.

## Allowed Mutation Rules
- Cannot be edited retroactively. Errata appended as a new entry titled `ERRATA on <delta_id>`.
- Quotes from other files must include the file's checkpoint id.

## Compression Standards
- Each delta ≤ 60 lines.
- Use compact notation: `+ added`, `- removed`, `~ changed`, `→ status transition`.
- Numeric metrics shown as `<before> → <after> (Δ<+/-n>)`.

## Archival Rules
- File hard cap: 800 lines or 30 entries (whichever first).
- On overflow, oldest entries moved to `audits/delta-archive/<year>-<week>.md`.

## Schema (entry)
```
## delta-<id>     <from_cp> → <to_cp>     <ISO timestamp>     mode: <mode>

State:        + ... | - ... | ~ ...
Priorities:   + ... | - ... | ~ ...
Risks:        + R<id> ... | ~ R<id> sev<old>→sev<new> | closed R<id>
Mutations:    landed: <sha> ... | reverted: <sha> ...
Governance:   policy: <file>:<section> changed | escalation: <id>
Metrics:      RCI <a>→<b>  entropy_delta <a>→<b>  cv <a>→<b>  gov_lag <a>→<b>
Architecture: + module:<slug> | - module:<slug> | ~ boundary:<slug>↔<slug>
DER:          intaked: <ids> | promoted: <ids> | declined: <ids> | archived: <ids>
Carryover:    <one-liner per open item>
```

## Initial Content (v0.1)
No deltas yet. First delta will be `delta-000` when P1 seeds CANONICAL_RUNTIME_STATE.md.
