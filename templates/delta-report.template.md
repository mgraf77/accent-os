# Delta Report Entry Template

Copy this block when appending to `runtime-state/RUNTIME_DELTA_REPORT.md`. Newest entry at
the top of that file.

```
## delta-XXX     <from_cp> → <to_cp>     <ISO timestamp>     mode: <mode>

State:        + <added fact>
              - <removed fact>
              ~ <changed fact: old → new>

Priorities:   + P<n> <title>
              - P<n> <title> (reason: <one liner>)
              ~ P<n>: <change>

Risks:        + R<id> <title> sev:<S>
              ~ R<id> sev: <old> → <new>
              closed R<id> reason:<one liner>

Mutations:    landed:   <sha> <one-line subject>
              reverted: <sha> reason:<one liner>

Governance:   policy: <file>:<section> changed via patch:<patch-id>
              escalation: <ESCALATION-id> <trigger>

Metrics:      RCI <a>→<b>   entropy_delta <a>→<b>
              cv <a>→<b>    rv <a>→<b>
              gov_lag <a>→<b>   runtime_health <a>→<b>

Architecture: + module:<slug>
              - module:<slug>
              ~ boundary:<slug>↔<slug> (note)

DER:          intaked:  <der-ids>
              promoted: <der-ids>
              declined: <der-ids>
              archived: <der-ids>

Carryover:
  - <one open item per line>
```

## Rules
- Sections that have no change are written with literal text `(no change)` — never omitted.
- Numeric metrics: if not computable this checkpoint, write `null` not omit.
- Do not edit a delta entry after writing it. Errata are new entries titled
  `## ERRATA on delta-XXX`.
