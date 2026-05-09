# STABLE EVOLUTION RUNTIME (SER)

## Purpose
The loop that turns audit findings, gotcha detections, and DER-promoted ideas into
verified, checkpointed mutations — without destabilizing in-flight work.

## Phases (canonical sequence)

```
1. AUDIT             →  Passive Audit; produce findings list (audits/AUDIT_LOG.md).
2. GAP DETECTION     →  Compare canonical state ↔ reality (loops/GAP_DETECTION_LOOP.md).
3. RISK CLASSIFY     →  Score each gap; update ACTIVE_RISKS.md.
4. TIMING ANALYSIS   →  Decide cycle: now / next / research / vision / never.
5. QUEUE ROUTING     →  Land in DER queue or promote to CURRENT_PRIORITIES.
6. PATCH PLAN        →  Per MUTATION_POLICY; class declared; reversibility stated.
7. SAFE EXECUTION    →  Mode-bound; one C4+ patch in flight at a time.
8. VERIFICATION      →  Mode-defined green check; auto-revert on failure.
9. DOCUMENTATION     →  Append to RUNTIME_DELTA_REPORT; update registers.
10. RECHECKPOINT     →  Overwrite CANONICAL_RUNTIME_STATE; consider LKG promotion.
```

A phase may *skip forward* (e.g. AUDIT → GAP → ROUTE-TO-DER) but never *skip backward*
without a Clean Pause.

## Triggers

| Trigger | Source | Default Cadence |
| --- | --- | --- |
| **Session Start Audit** | CLAUDE.md auto-execute hook | every session |
| **Cycle Start Audit** | calendar (ISO week) | weekly |
| **Idea Intake** | DER intake template submission | event |
| **Risk Threshold** | ACTIVE_RISKS update raises sev to HIGH+ | event |
| **Metric Threshold** | RCI < 1.0 OR governance_lag > 7d | event |
| **Manual Audit** | user-invoked | event |
| **Pre-Pause Audit** | before a Clean Pause | event |

## Periodic Audits
- **Light audit** every session: read canonical state + WIP + check gotcha register tail.
- **Full audit** weekly (cycle start): runs CONTINUOUS_GAP_ANALYSIS_RUNTIME end-to-end.
- **Deep audit** at LKG promotion: full state reconciliation across canonical ↔ existing layer.

## Clean Pause Integration
- Defined in mode `Clean Pause Stabilization`. Must precede:
  - any LKG update,
  - any C5/C6 mutation,
  - end-of-cycle close.
- Output: a delta entry, an updated CANONICAL_RUNTIME_STATE, and (conditionally) an LKG bump.

## Rollback Integration
- Every C4+ patch records a revert in the delta entry (PHASE 9).
- Rollback = `git revert <sha>` + redeploy step (worker/pages) if applicable.
- After rollback, runtime returns to phase 1 (AUDIT) before any new mutation.

## Milestone Stabilization
- A "milestone" is an externally observable shipped feature (e.g. Quote Generator v2).
- Milestone closeout = Clean Pause + LKG update + DER review.
- No new milestone may begin while a milestone-level risk is open at HIGH+.

## Deferred Evolution Queue Integration
- Phase 4 (TIMING) decides queue placement.
- Phase 5 (ROUTING) writes to DER per `evolution-memory/DEFERRED_EVOLUTION_QUEUE.md`.
- DER promotion back into CURRENT_PRIORITIES requires patch plan (C5 if it changes a
  governance file, C4 otherwise).

## Runtime Health Scoring
Computed at every checkpoint (phase 10). Stored in METRICS_REGISTER.

```
RCI                = (rel_velocity / cmp_velocity) × (1 - entropy_delta)
runtime_health     = clamp(RCI × (1 - normalized_governance_lag), 0, 1)
```

If `runtime_health < 0.6` → next cycle is forced into Clean Pause Stabilization mode
until ≥ 0.7 across two consecutive checkpoints.

## Entropy Tracking
- Entropy proxies (file count growth, doc length growth, todo count, governance lag).
- Recorded as `entropy_delta` per checkpoint in METRICS_REGISTER.
- A patch with positive entropy_delta requires explicit declaration in its patch plan.

## State Machine (modes ↔ phases)
```
Passive Audit         → phases 1–3
Gotcha Detection      → phases 1–3 (writes to GOTCHA_REGISTER only)
Plan-Then-Execute     → phases 4–10
Safe Auto-Fix         → phases 6–10 within AUTO_FIX_POLICY allowlist
Deferred/Research     → phases 4–5 (writes to DER only)
Clean Pause           → phases 9–10 + LKG eligibility
Emergency Recovery    → bypass loop; restore LKG; post-restore audit at phase 1
```

## Failure Modes
- **Phase 8 fails** → phase 10 is *not* allowed; runtime returns to phase 1.
- **Phase 10 fails** (state can't be written cleanly) → escalate (E7).
- **Phase 4 cannot decide** → escalate (E3 if queue ages out).

## Bootstrap Behavior (v0.1)
- Only phases 1, 4, 5, 9 are active at v0.1 (audit + queue + delta append).
- Phases 6–8 (mutation) require P2+ activation per ROLLOUT_PLAN.
- Phase 10 (recheckpoint) requires P3 once CANONICAL_RUNTIME_STATE is seeded.
