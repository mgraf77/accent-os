# ROLLOUT PLAN

## Purpose
Phased adoption of the stabilization layer with explicit gates between phases. Each gate
is a verifiable condition; phases do not overlap.

## Phases

### P0 — Specification (v0.1, this commit)
**Goal:** scaffold + canonical specs only. No behavior change.
**Deliverables:**
- 9 directories created.
- 20 specification MD files (across runtime-state, evolution-memory, governance,
  stable-evolution-runtime, audits, registers, loops, policies).
- 6 templates.
- Root `STABILIZATION_LAYER.md` index.
**Gate to P1:**
- Human reviews STABILIZATION_LAYER.md and approves P1 entry.

### P1 — Bootstrap Seed
**Goal:** seed CANONICAL_RUNTIME_STATE and CURRENT_PRIORITIES from existing artifacts.
**Deliverables:**
- Populated `runtime-state/CANONICAL_RUNTIME_STATE.md` (from WIP + BUILD_PLAN_CLAUDE).
- Populated `runtime-state/CURRENT_PRIORITIES.md` (top 1–5 from BUILD_PLAN top items).
- Initial `audits/AUDIT_LOG.md` created (empty header).
- DER seed entry `der-0001` already present.
- First delta entry `delta-000` written.
**Gate to P2:**
- Two consecutive sessions run with canonical state read at start (per CLAUDE.md
  auto-execute step proposed in STABILIZATION_LAYER §9 action 3).
- No two-truth divergence detected (G4 = 0).

### P2 — Audit + DER Activation
**Goal:** AUDIT_LOOP and GAP_DETECTION_LOOP run automatically; DER intake live.
**Deliverables:**
- `scripts/status.sh` extended (C4 patch) to invoke AUDIT_LOOP and print health snapshot.
- First CGAR report `audits/gap-reports/0001.md`.
- Idea intake template wired into a session-start prompt.
- Mode 2 (Gotcha Detection) and Mode 4 (Plan-Then-Execute) activated.
**Gate to P3:**
- Two cycles with full CGAR reports.
- 0 unresolved E1/E5 escalations.
- RCI computable from real values (M2/M3/M4 produce non-null).

### P3 — Mutation + Checkpoint Loop
**Goal:** PATCH_LOOP and CHECKPOINT_LOOP active; first LKG captured.
**Deliverables:**
- Mode 3 (Safe Auto-Fix) activated for the AUTO_FIX_POLICY allowlist only.
- Automated CHECKPOINT_LOOP at end of every successful patch.
- First `LAST_KNOWN_GOOD_STATE.md` populated.
- METRICS_REGISTER values recorded at every checkpoint.
**Gate to P4:**
- One LKG promoted; one rollback exercised (in test, not in anger).
- runtime_health ≥ 0.7 across two consecutive checkpoints.

### P4 — Continuous Stabilization
**Goal:** layer is part of normal operation; cycle reviews drive priority changes.
**Deliverables:**
- Weekly cycle reviews populate CURRENT_PRIORITIES from DER promotions.
- Quarterly archive runs trim audit/delta files per archival rules.
- Module boundary manifest seeded (enables G8 detector).
**No further gate.** This is steady-state.

## Dependency Graph
```
P0 ──► P1 ──► P2 ──► P3 ──► P4
              │       │
              ▼       ▼
       CGAR-active  LKG-active
```

## P0 Patch Set (this commit; verbatim)
- new dir `runtime-state/`           with 5 files
- new dir `evolution-memory/`        with 1 file
- new dir `governance/`              with 4 files
- new dir `stable-evolution-runtime/` with 1 file
- new dir `audits/`                  with 2 files
- new dir `registers/`               with 1 file
- new dir `loops/`                   with 4 files
- new dir `templates/`               with 6 files
- new dir `policies/`                with 2 files
- root `STABILIZATION_LAYER.md`
**No edits to existing files.**

## Priority Matrix (across phases)

| Item | P0 | P1 | P2 | P3 | P4 |
| --- | --- | --- | --- | --- | --- |
| Canonical specs | P0 | — | — | — | — |
| Canonical state seed | — | P0(prio) | — | — | — |
| AUDIT_LOOP automation | — | — | P0 | — | — |
| DER intake live | — | — | P0 | — | — |
| Safe Auto-Fix on | — | — | — | P1 | — |
| LKG promotion | — | — | — | P0 | — |
| Module boundary manifest | — | — | P2 | P1 | P0 |
| Cycle review cadence | — | — | P2 | P1 | P0 |

(P0 = highest within phase; values are *intra-phase* ranks.)

## Risks of Rollout
- **R-rollout-1:** layer becomes ignored if not integrated into CLAUDE.md auto-execute.
  Mitigation: P1 gate requires the auto-execute change to land.
- **R-rollout-2:** doc proliferation. Mitigation: hard caps + archival rules.
- **R-rollout-3:** human-approval bottleneck. Mitigation: AUTO_FIX_POLICY allowlist, narrow.
- **R-rollout-4:** metrics computed but not acted upon. Mitigation: thresholds in METRICS_REGISTER tied to escalation triggers.

## Bootstrap Realism Statement
This is a single-developer + AI-collaborator repo. The rollout is sized for that. No
dashboards, no workflow engines, no service mesh — just markdown files, scripts, and
human review at the gates that matter.
