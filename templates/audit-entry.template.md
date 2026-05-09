# Audit Entry Template

Append to `audits/AUDIT_LOG.md`. One entry per finding, observation, escalation, or
resolution. Newest-first ordering.

```
[<ISO timestamp>] kind:<finding|observation|escalation|resolution|note> mode:<mode>
  id:        <local unique id within file, e.g. al-0001>
  refs:      <pointer(s): commit / file:line / der-id / patch-id / E#>
  summary:   <one line>
  detail:    <optional, ≤ 4 lines>
  action:    <none | logged | routed-to-DER | escalated | patch-proposed>
```

## Kinds
- **finding** — output of AUDIT_LOOP / GAP_DETECTION_LOOP.
- **observation** — concrete sighting of a known gotcha.
- **escalation** — full escalation block per ESCALATION_POLICY.
- **resolution** — closes a prior escalation/finding by id reference.
- **note** — manual context that doesn't fit elsewhere.

## Rules
- Entries are append-only.
- An entry's `refs` must resolve at write time (no dangling pointers).
- A `resolution` entry must reference a prior id; otherwise it's a `note`.
- Hard cap on file length: 5,000 lines. On overflow, oldest entries archive monthly to
  `audits/audit-archive/<YYYY-MM>.md`.
