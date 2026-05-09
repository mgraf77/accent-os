# RUNTIME STABILIZATION LAYER — CANONICAL INDEX

> Governance + stabilization patch layer. Sits ABOVE BUILD_PLAN_*. Does not mutate
> existing build architecture. Optimizes for: reliability compounding, low entropy,
> long-term evolvability, AI patchability.
>
> **Status:** v0.1 — initial canonical serialization.
> **Owner:** Runtime Stabilizer role.
> **Touch rule:** new MD only; no code/build mutation; no edits to existing root docs
> except by escalation through `governance/MUTATION_POLICY.md`.

---

## 1. Executive Summary

The repo has accumulated execution velocity (BUILD_PLAN, SESSION_LOG, BUILD_INTELLIGENCE,
KPI_CATALOG) but lacks a separate **canonical operational truth** layer. Without it,
every new idea touches the live build plan, and every audit risks destabilizing in-flight
work. This layer introduces a parallel governance + state surface so that:

- **Ideas** are intaked into a queue, not into the build plan.
- **Audits** read from canonical state, not from the entire repo.
- **Mutations** route through one of three policies (auto-fix / plan-then-execute / escalate).
- **Recovery** has a single Last Known Good State to roll back to.
- **Evolution** is continuous, but execution stays serialized.

Reliability is treated as a compounding asset. Every increase in complexity must be
matched by an increase in stability (entropy delta ≤ 0 per merged change).

## 2. Architecture Overview

```
existing build layer            governance + state layer (this patch)
─────────────────────           ────────────────────────────────────
BUILD_PLAN_CLAUDE.md     ◄───   policies/PRIORITY_MATRIX.md
BUILD_PLAN_MICHAEL.md    ◄───   evolution-memory/DEFERRED_EVOLUTION_QUEUE.md
SESSION_LOG.md           ◄───   runtime-state/RUNTIME_DELTA_REPORT.md
BUILD_INTELLIGENCE.md    ◄───   audits/CONTINUOUS_GAP_ANALYSIS_RUNTIME.md
WORK_IN_PROGRESS.md      ◄───   runtime-state/CANONICAL_RUNTIME_STATE.md
KPI_CATALOG.md           ◄───   registers/METRICS_REGISTER.md
PROMPT_LOG.md            ◄───   audits/GOTCHA_REGISTER.md
                                governance/MUTATION_POLICY.md  (gate)
                                stable-evolution-runtime/STABLE_EVOLUTION_RUNTIME.md
```

Read direction: stabilization layer **reads** existing layer; rarely writes back, only
through MUTATION_POLICY-approved patches.

## 3. Repo Structure (added by this patch)

```
/runtime-state/                  — low-entropy "what is true right now"
/evolution-memory/               — DER: ideas not yet promoted to build
/governance/                     — policies that gate every mutation
/stable-evolution-runtime/       — the audit→patch→checkpoint loop
/audits/                         — gap analysis + gotcha registry + history
/registers/                      — metric/checkpoint/complexity ledgers
/loops/                          — operational loop definitions
/templates/                      — entry templates (low-token, structured)
/policies/                       — modes, priority, rollout
```

## 4. Layer Responsibilities

| Layer | Owns | Mutates | Read by |
| --- | --- | --- | --- |
| runtime-state | "now" snapshot | runtime loop only | every mode, every session start |
| evolution-memory | future ideas | idea-intake template | governance, runtime loop |
| governance | rules | human-approved only | every mutation attempt |
| stable-evolution-runtime | the loop | itself | runtime, modes |
| audits | findings | gap loop, gotcha loop | governance |
| registers | metrics + checkpoints | runtime loop | metrics dashboards |
| loops | loop defs | rare | runtime |
| templates | structured entries | rare | every writer |
| policies | modes/priority/rollout | rare | every mode switch |

## 5. Operational Modes

Defined in `policies/MODES.md`. Seven modes:

1. Passive Audit — read-only.
2. Gotcha Detection — read + log to register.
3. Safe Auto-Fix — bounded mutation per AUTO_FIX_POLICY.
4. Plan-Then-Execute — patch plan → review → execute.
5. Deferred / Research / Escalation — write to DER only.
6. Clean Pause Stabilization — flush + checkpoint.
7. Emergency Recovery — rollback to LKG.

## 6. Reliability Compounding (headline metric)

`RCI = (reliability_velocity / complexity_velocity) × (1 - entropy_delta)`

If RCI < 1 across a checkpoint window → next mutation cycle restricted to
Safe Auto-Fix or Clean Pause until RCI ≥ 1. Full formulas in
`registers/METRICS_REGISTER.md`.

## 7. Rollout Plan (P0 → P2)

See `policies/ROLLOUT_PLAN.md`. Bootstrap order:

- **P0 (this patch):** scaffold dirs, write specs, no behavior change.
- **P1:** seed CANONICAL_RUNTIME_STATE.md from current repo; define DER intake hook.
- **P2:** wire status.sh to print runtime health summary; activate gotcha register.
- **P3+:** auto-fix mode, metrics computation, recheckpoint loop.

Nothing executes without MUTATION_POLICY approval per phase.

## 8. Risks Identified at v0.1

- Doc proliferation — mitigated by template-driven, fixed-section files + archival rules.
- Two-truth drift between root docs and canonical state — mitigated by read-only relationship + scheduled reconciliation in CONTINUOUS_GAP_ANALYSIS_RUNTIME.
- Governance lag — tracked as a metric; escalates if > threshold.
- Layer ignored in practice — mitigated by integrating into existing session-start (CLAUDE.md auto-execute) at P2.

## 9. Recommended Immediate Actions

1. Review this layer (no code change required).
2. Approve P1 seed: populate `runtime-state/CANONICAL_RUNTIME_STATE.md` from current
   WORK_IN_PROGRESS + BUILD_PLAN.
3. Approve adding step 9 to CLAUDE.md auto-execute: *"Read CANONICAL_RUNTIME_STATE.md
   before BUILD_PLAN."* — this is the only proposed mutation to existing files.
4. After one full session under P1, evaluate RCI and decide on P2.

## 10. Index (file → purpose, one line each)

### runtime-state/
- `CANONICAL_RUNTIME_STATE.md` — single source of "what is true now"
- `CURRENT_PRIORITIES.md` — top 1–5 active priorities, ranked
- `ACTIVE_RISKS.md` — open risks with severity + owner
- `LAST_KNOWN_GOOD_STATE.md` — commit + spec snapshot for rollback
- `RUNTIME_DELTA_REPORT.md` — diff between checkpoints

### evolution-memory/
- `DEFERRED_EVOLUTION_QUEUE.md` — five queues: immediate / near / research / vision / forbidden

### governance/
- `MUTATION_POLICY.md` — what may change, by whom, under which mode
- `AUTO_FIX_POLICY.md` — bounded autonomous fixes
- `ESCALATION_POLICY.md` — when to stop and ask
- `SAFETY_HARD_STOPS.md` — non-negotiable refusals

### stable-evolution-runtime/
- `STABLE_EVOLUTION_RUNTIME.md` — the loop spec

### audits/
- `CONTINUOUS_GAP_ANALYSIS_RUNTIME.md` — recurring gap detection
- `GOTCHA_REGISTER.md` — known anti-patterns + detectors

### registers/
- `METRICS_REGISTER.md` — all metric definitions, formulas, thresholds

### loops/
- `AUDIT_LOOP.md`, `GAP_DETECTION_LOOP.md`, `PATCH_LOOP.md`, `CHECKPOINT_LOOP.md`

### templates/
- delta-report, checkpoint, gotcha-entry, idea-intake, patch-plan

### policies/
- `MODES.md` — operational mode definitions
- `ROLLOUT_PLAN.md` — phased adoption with gates

---

## Read Order for a Fresh AI Session

1. This file (index).
2. `runtime-state/CANONICAL_RUNTIME_STATE.md` (state).
3. `runtime-state/CURRENT_PRIORITIES.md` (focus).
4. `runtime-state/ACTIVE_RISKS.md` (caution).
5. `policies/MODES.md` (which mode am I in?).
6. `governance/MUTATION_POLICY.md` (what may I change?).
7. Mode-specific files only when entering that mode.

Token budget for full warm-start read: ≤ 4k tokens.
