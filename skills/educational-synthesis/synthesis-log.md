# educational-synthesis — synthesis log

> Append-only ledger of every synthesis run. One row per topic + mode combination. Use to spot trends in topic interests, mode preferences, audience calibration, and self-scored quality.
>
> Write entries at the end of Step 13 (per SKILL.md self-score block).

## Schema

| run | date | topic-slug | mode | audience | files | depth | coverage | reinforcement | calibration | originating skill | notes |
|-----|------|------------|------|----------|-------|-------|----------|---------------|-------------|-------------------|-------|
| 001 | 2026-MM-DD | example-slug | deep-dive | intelligent non-expert | 11 | 8 | 9 | 7 | 8 | (none / skill-forge / analysis-snapshot) | one-line note |

## Trend-detection rules

After accumulating 5+ runs, scan for these patterns:

1. **Persistent low scores on the same dimension** — if a single dimension (depth / coverage / reinforcement / calibration) averages <7 across 3+ runs, the skill itself has a calibration gap. Surface as a `shallow-output` entry in `feedback-log.md` and propose a SKILL.md edit.

2. **Mode preference clustering** — if Michael chose the same mode 4+ times for similar-shape topics, that mode's defaults are well-calibrated. If he overrode the default mode in 3+ runs, the default mode-detection logic in `MODES.md` needs tuning.

3. **Originating-skill chains** — if `skill-forge → educational-synthesis` happens 3+ times, the handoff is real and should be documented as a standard chain in skill-forge's SKILL.md.

4. **Topic clustering** — if 3+ runs share a domain (e.g., 3 vendor-strategy topics), consider whether a domain-specific sub-mode would be useful (similar to vibe-speak's user-profile system).

## Reading guide

Most recent runs at top.

## Entries

_(empty — first synthesis run will populate)_
