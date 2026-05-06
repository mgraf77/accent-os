# efficiency-monitor — Tunable Thresholds

> Edit these freely. Aggregator script reads them at run time.

## Signal-level thresholds

| Signal | Min occurrences to log |
|--------|------------------------|
| retry-loop | 1 (always log) |
| redundant-read | 2 (same file ≥2 reads in session) |
| recurring-sequence | 2 (sequence repeats ≥2 in session) |
| skill-bypass | 1 (always log) |
| clarification-loop | 3 (≥3 clarification msgs before any code change) |
| redone-wip | 1 (always log) |

## Skill-candidate promotion ladder

| Status | Promote when |
|--------|--------------|
| OBSERVED → CANDIDATE | 3 occurrences in one session OR 2+ separate sessions with ≥1 occurrence each |
| CANDIDATE → PROMOTE | 3+ separate sessions OR cumulative est. time saved > 10 minutes/occurrence × occurrences |
| PROMOTE → BUILT | Manual — set when `skill-forge` ships a real skill for this pattern |

## Time-saved estimation rule

Per occurrence, estimated time saved if a skill existed = (steps in sequence) × 30 seconds.

Example: 5-step recurring sequence = 2.5 min saved per run.
After 4 runs across 3 sessions = 10 min saved → PROMOTE trigger.

## Boot-display caps

- Show top 3 inefficiencies (sorted by occurrence count, then severity).
- Show all PROMOTE-status candidates (no cap).
- Hide INFO-level (single-occurrence non-bypass) flags at boot.

## Reset behavior

- `efficiency-log.md` never auto-rotated. Manual archive when > 5000 lines.
- `skill-candidates.md` rebuilt from scratch by aggregator each run (idempotent).
- `session-end-summary.md` overwritten each session.
