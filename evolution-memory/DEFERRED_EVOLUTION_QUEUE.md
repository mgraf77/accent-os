# DEFERRED EVOLUTION QUEUE (DER)

## Purpose
Holds every idea that is *not* in CURRENT_PRIORITIES, partitioned by horizon. Lets
brainstorming continue indefinitely without contaminating the active build plan.

## The Five Queues

1. **Q1 — Immediate (next cycle eligible)**
2. **Q2 — Near-Term (1–4 cycles out)**
3. **Q3 — Research (needs investigation before queueing)**
4. **Q4 — Long-Term Vision (directional only; no commitments)**
5. **Q5 — Unsafe / Forbidden (do not pursue; here so we remember why)**

## Required Per-Entry Fields
```
id:            <slug>
title:         <one line>
intaked_at:    <ISO date>
intaked_by:    <name | session>
queue:         <Q1..Q5>
intent:        <what changes if we did this>
evidence:      <link to audit/gotcha/session/external source>
risk_class:    <low | medium | high | unsafe>
governance:    <which policies apply: MUTATION_POLICY classes touched>
prerequisites: <list of ids or 'none'>
re_eval_after: <ISO date — when to revisit if not promoted>
status:        <intaked | reviewed | promoted | deferred | declined | archived>
```

## Routing Logic (idea intake)
```
            ┌─────────────┐
idea ─────► │ idea-intake │  (templates/idea-intake.template.md)
            └──────┬──────┘
                   ▼
        governance routing (this file's rules)
                   ▼
   ┌──────────┬──────────┬──────────┬──────────┬───────────┐
   │ Q1 promote│ Q2 hold  │ Q3 study │ Q4 note  │ Q5 forbid │
   └─────┬────┴─────┬────┴─────┬────┴─────┬────┴────┬──────┘
         │          │          │          │         │
         ▼          ▼          ▼          ▼         ▼
  CURRENT_       cycle-     gap-report  vision    audit
  PRIORITIES     review     output      doc       record
```

Routing rules:
- Default landing zone is **Q3 (Research)** unless evidence and risk justify a shorter horizon.
- Q1 promotion requires: MED+ evidence, low/medium risk_class, prerequisites met, RCI green.
- Q2 hold is for ready-but-deprioritized work; max 8 items in Q2 at a time.
- Q4 vision items have no commitments; serve as direction only.
- Q5 forbidden is a one-way street — items here are not removed; status flips to `archived`
  only after explicit C5 approval.

## Update Rules
- Append-only intake (C1) via the idea-intake template.
- Promotion / demotion: C5 (governance). Records a delta entry.
- Q5 entries: writing requires Plan-Then-Execute; never auto-fix.

## Ownership Rules
- Intake: any session, any mode (including Passive Audit).
- Routing decisions: human or Plan-Then-Execute.
- Re-evaluation: AUDIT_LOOP flags `re_eval_after < today` items as G7 gaps.

## Allowed Mutation Rules
- Status field transitions: `intaked → reviewed → (promoted|deferred|declined|archived)`.
- Queue moves require updated `re_eval_after` and a one-line reason in the entry.
- An idea may not exist in two queues simultaneously.

## Compression Standards
- Each entry ≤ 14 lines.
- `intent` and `evidence` fields ≤ 2 lines each.
- Discussion goes to `audits/AUDIT_LOG.md` (linked by id), not into the entry body.

## Archival Rules
- Declined / archived entries retained 1 year, then summarized into `audits/AUDIT_LOG.md`.
- Q5 entries are **never** deleted; only re-summarized on archival.

## Continuous Brainstorming Contract
DER guarantees:
- Any idea, no matter how raw, has a place to land.
- Active runtime is never destabilized by an idea — only by a *promoted* idea, after
  governance.
- Brainstorming velocity does not change build velocity.

## Entry: Initial Seed (one item to demonstrate format)
```
id:            der-0001
title:         Seed CANONICAL_RUNTIME_STATE from current WIP + BUILD_PLAN
intaked_at:    2026-05-09
intaked_by:    runtime-stabilizer initial session
queue:         Q1
intent:        Bootstrap canonical state so the audit loop has something to read.
evidence:      STABILIZATION_LAYER.md §9 recommended action 2; CGAR cannot run unseeded.
risk_class:    low
governance:    MUTATION_POLICY C2 (state refresh) under Plan-Then-Execute
prerequisites: human approval of P1 phase per ROLLOUT_PLAN
re_eval_after: 2026-05-16
status:        intaked
```
