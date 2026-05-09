# CONTINUOUS GAP ANALYSIS RUNTIME (CGAR)

## Purpose
The end-to-end runtime that ties AUDIT_LOOP + GAP_DETECTION_LOOP together on a recurring
schedule and emits a gap report consumable by the SER (phase 4).

## Required Sections of the Recurring Output (the report)
1. **Header** — report_id, generated_at, span (since last report).
2. **Inputs Surveyed** — files/registers/scripts read.
3. **Gaps Detected (by category G1–G8)** — id, file/area, severity, evidence pointer.
4. **Trend** — gap count by category vs. last 3 reports.
5. **Suggested Routing** — per gap: defer / build / research / escalate.
6. **Open Carry-Over** — gaps from prior reports still unresolved.
7. **Health Snapshot** — RCI, entropy_delta, runtime_health.

## Update Rules
- One report per cycle (default ISO week) plus event-triggered reports for E1/E2/E5.
- Reports are append-only, written under `audits/gap-reports/<report_id>.md`.
- The CGAR file itself (this one) is the spec; it is not the report.

## Ownership Rules
- Generator: AUDIT_LOOP + GAP_DETECTION_LOOP composed.
- Read owner: SER phase 4, cycle review, escalation handler.

## Allowed Mutation Rules
- Spec edits (this file): C5 governance.
- Reports (output dir): C1 append; never edited after writing.

## Compression Standards
- Per-report cap: 200 lines.
- Each gap ≤ 4 lines (id, area, severity, one-line evidence).
- Trend section ≤ 10 lines.

## Archival Rules
- Reports retained 90 days on disk; older summarized into `audits/AUDIT_LOG.md` quarterly.

## Detection Sources (canonical mapping)
| Source | Used for gaps |
| --- | --- |
| `runtime-state/CANONICAL_RUNTIME_STATE.md` vs filesystem | G1, G4 |
| `CURRENT_PRIORITIES` vs SESSION_LOG activity | G2 |
| `ACTIVE_RISKS` review-age field | G3 |
| METRICS_REGISTER null entries | G5 |
| `audits/GOTCHA_REGISTER.md` open-age | G6 |
| `evolution-memory/DEFERRED_EVOLUTION_QUEUE.md` near-term-age | G7 |
| Module boundary manifest (P2+) | G8 |

## Anti-Stale Self-Check
- If two consecutive reports produce identical gap lists, that itself is a finding
  (`cgar.no_progress`) and routes to ESCALATION_POLICY E10.

## Bootstrap (v0.1)
- v0.1 ships only the spec. First report (`gap-reports/0001.md`) is generated at P1
  rollout once CANONICAL_RUNTIME_STATE is seeded.
