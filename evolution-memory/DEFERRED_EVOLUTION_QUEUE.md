# DEFERRED EVOLUTION QUEUE (DER)

> Holds every idea NOT in CURRENT_PRIORITIES, partitioned by horizon.
> Continuous brainstorming surface; never destabilizes the active runtime.
> tag: CORE

## The Five Queues
1. **Q1 — Immediate (next cycle eligible)**
2. **Q2 — Near-Term (1–4 cycles out)**
3. **Q3 — Research (needs investigation before queueing)**
4. **Q4 — Long-Term Vision (directional only; no commitments)**
5. **Q5 — Unsafe / Forbidden (do not pursue; here so we remember why)**

## Per-Entry Schema
See `templates/idea-intake.template.md`.

## Routing Logic
```
            ┌─────────────┐
idea ─────► │ idea-intake │
            └──────┬──────┘
                   ▼
        governance routing
                   ▼
   ┌──────────┬──────────┬──────────┬──────────┬───────────┐
   │ Q1 promote│ Q2 hold  │ Q3 study │ Q4 note  │ Q5 forbid │
   └─────┬────┴─────┬────┴─────┬────┴─────┬────┴────┬──────┘
         │          │          │          │         │
         ▼          ▼          ▼          ▼         ▼
  CURRENT_       cycle-     gap-report  vision    audit
  PRIORITIES     review     output      doc       record
```

## Update Rules
- Append-only intake (C1) via the idea-intake template.
- Promotion / demotion: C5. Records a delta entry.
- Q5 entries: writing requires Plan-Then-Execute; never auto-fix.

---

## Entries

### Q1 — Immediate
(empty)

### Q2 — Near-Term
(empty)

### Q3 — Research

```
id:            der-0004
title:         Governance file consolidation candidates
intaked_at:    2026-05-09
intaked_by:    P1 hardening session
queue:         Q3
intent:        Evaluate whether MUTATION_POLICY/AUTO_FIX/ESCALATION/HARD_STOPS could
               compress to fewer files without losing reasoning trails.
evidence:      governance/GOVERNANCE_COMPRESSION_REVIEW.md
risk_class:    medium
governance:    C5 if any merge proceeds
prerequisites: 2 cycles operating under P0 governance to gather usage data
re_eval_after: 2026-07-08
status:        intaked
```

```
id:            der-0005
title:         Mode count reduction (7 → 5 active) post-P3
intaked_at:    2026-05-09
intaked_by:    P1 hardening session
queue:         Q3
intent:        Fold Gotcha Detection into Passive Audit and Deferred/Research/Escalation
               into Passive Audit's output stream. Keep Plan-Then-Execute, Safe Auto-Fix,
               Clean Pause, Emergency Recovery as distinct.
evidence:      audits/P1_SIMPLIFICATION_PASS.md F1
risk_class:    low
governance:    C5 (policies/MODES.md edit)
prerequisites: P3 mode activation; 1 cycle with mode 3 + mode 4 active
re_eval_after: 2026-07-08
status:        intaked
```

```
id:            der-0006
title:         Add `compute_phase` annotation to METRICS_REGISTER
intaked_at:    2026-05-09
intaked_by:    P1 hardening session
queue:         Q3
intent:        Tag each metric M1–M11 with the rollout phase at which it produces
               real values (P1 / P3 / P4). Reduces ritualistic null recording.
evidence:      audits/P1_SIMPLIFICATION_PASS.md F2
risk_class:    low
governance:    C5 (registers edit, but small)
prerequisites: none
re_eval_after: 2026-06-08
status:        intaked
```

```
id:            der-0007
title:         AUDIT_LOOP / GAP_DETECTION_LOOP merge evaluation
intaked_at:    2026-05-09
intaked_by:    P1 hardening session
queue:         Q3
intent:        Decide whether to merge after both are automated at P3.
evidence:      audits/P1_SIMPLIFICATION_PASS.md F3
risk_class:    low
governance:    C5
prerequisites: P3 loop activation; 1 cycle of automated runs
re_eval_after: 2026-08-08
status:        intaked
```

```
id:            der-0008
title:         DER `quick:` intake shortcut
intaked_at:    2026-05-09
intaked_by:    P1 hardening session
queue:         Q3
intent:        Allow a single-line idea entry that promotes to full schema at routing.
evidence:      audits/P1_SIMPLIFICATION_PASS.md F8
risk_class:    low
governance:    C5 (template edit)
prerequisites: none
re_eval_after: 2026-07-08
status:        intaked
```

### Q4 — Long-Term Vision

```
id:            der-0002
title:         Temporal / Bottleneck Awareness Runtime (TOR) — FUTURE CORE CONCEPT
intaked_at:    2026-05-09
intaked_by:    Session 8 directive
queue:         Q4
intent:        Future runtime for time-shaped signals across orchestration: duration,
               aging, stalls, bottlenecks, cadence, pacing, escalation timing,
               orchestration load. Belongs to AgentOS Core (post-extraction).
evidence:      evolution-memory/FUTURE_CORE_CONCEPTS.md CP-1
risk_class:    medium (when eventually pursued)
governance:    C6 (architecture; would create new top-level concepts)
prerequisites: AgentOS Core extraction or a multi-deployment context
re_eval_after: 2027-05-09
status:        intaked
```

```
id:            der-0003
title:         Evolution Governance Runtime (EGR) — FUTURE CORE CONCEPT
intaked_at:    2026-05-09
intaked_by:    Session 8 directive
queue:         Q4
intent:        Future runtime governing distributed deployment evolution: lineage,
               selective propagation, governed evolution, telemetry abstraction,
               mutation sandboxing, deployment sovereignty.
evidence:      evolution-memory/FUTURE_CORE_CONCEPTS.md CP-2
risk_class:    high (when eventually pursued; multi-deployment scope)
governance:    C6
prerequisites: at least 2 active deployment instances
re_eval_after: 2027-05-09
status:        intaked
```

### Q5 — Unsafe / Forbidden
(empty — anything that would end up here would also trip SAFETY_HARD_STOPS first)

---

## Promoted / Resolved

```
id:            der-0001
title:         Seed CANONICAL_RUNTIME_STATE from current WIP + BUILD_PLAN
intaked_at:    2026-05-09
intaked_by:    runtime-stabilizer initial session
queue:         Q1
intent:        Bootstrap canonical state so the audit loop has something to read.
evidence:      STABILIZATION_LAYER.md §9; CGAR cannot run unseeded.
risk_class:    low
governance:    MUTATION_POLICY C2 (state refresh) under Plan-Then-Execute
prerequisites: human approval of P1 phase per ROLLOUT_PLAN
re_eval_after: 2026-05-16
status:        promoted (to P4 → pri-claude-md-canonical-read)
note:          Canonical state seed itself was completed under P1 hardening commit.
               The promotion above refers to the linked CLAUDE.md auto-execute amendment,
               which is the *patch* path of this DER item. Patch plan: patch-0001.
```

## Continuous Brainstorming Contract
DER guarantees:
- Any idea has a place to land.
- Active runtime is destabilized only by a *promoted* idea, after governance.
- Brainstorming velocity does not change build velocity.
