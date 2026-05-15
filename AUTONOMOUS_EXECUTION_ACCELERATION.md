# AUTONOMOUS_EXECUTION_ACCELERATION

**Goal:** identify the highest-leverage tooling and visibility additions
that let future autonomous sessions move faster *without* introducing
runtime risk, hidden coupling, or operational complexity.

**Doctrine:** anything that increases throughput must (a) be additive,
(b) be reversible, (c) reduce cognitive load, (d) be visible.

## Current bottlenecks (observed)

| Bottleneck | Symptom | Cost |
|---|---|---|
| Manual sidecar merge analysis | every reconciliation pass requires a fresh worktree probe + per-file inspection | ~30 min per sidecar |
| Hard-to-find runtime surface | name discovery requires grep across 4 files | ~5 min per session boot |
| Branch state opacity | "is sidecar X mergeable?" requires manual rebase + diff | ~10 min per question |
| No merge-readiness signal in `status.sh` | session must compute it ad-hoc | ~3 min |
| No runtime-health signal in `status.sh` | session must run multiple `check-*` scripts | ~3 min |

Cumulative per-session friction: ~40 min that does not produce code.

## Acceleration levers (Session 36 deliverables — landed)

1. **`scripts/check-runtime-health.sh`** — single command answers
   "is the canonical runtime intact?".
2. **`scripts/check-runtime-replay.sh`** — single command answers
   "is replay safety primitive in place?".
3. **`scripts/check-dead-letter-health.sh`** — single command answers
   "is the dead-letter path wired and observable?".
4. **`window.__SIGNAL_RUNTIME_HEALTH__()`** — single browser console call
   answers "is the live runtime healthy right now?".
5. **`SIGNAL_NAME_CANON.md`** — onboarding lookup; eliminates grep.
6. **`OBSOLETE_BRANCH_REGISTRY.md`** — onboarding scoping.
7. **Expanded `scripts/status.sh`** — adds runtime-health and
   merge-readiness blocks (this branch).

## Acceleration levers (deferred — recommended)

1. **`js/signals_registry.js`** — declarative signal-type registry.
   Removes hard-coded lists from 5+ files. (See RUNTIME_REGISTRY_PLAN.)
2. **`js/runtime_loader.js`** — collapse the `index.html` `<script>`
   list into a data-driven loader. Reduces #1 merge-conflict zone.
   (See FUTURE_MERGE_FRICTION_REDUCTION §1.)
3. **`scripts/sidecar-probe.sh`** — automate the worktree-rebase probe
   used in this session's reconciliation. Output: per-sidecar JSON
   summary `{textual_conflicts, semantic_conflicts, files_added,
   files_deleted_in_main}`. Can be CI-run.
4. **`scripts/branch-classify.sh`** — read `OBSOLETE_BRANCH_REGISTRY.md`
   and emit a per-branch status header on `status.sh`.
5. **A single CLI dispatcher**: `bash scripts/all-checks.sh` runs
   `check-runtime-wiring + check-runtime-health + check-runtime-replay
   + check-dead-letter-health + check-pricing-runtime-path` and
   summarizes. Replaces 5 separate invocations.

## Throughput model

Assumption: a future autonomous session has ~4 hours of execution
budget. Today, ~40 min is consumed by friction that doesn't ship code,
i.e. ~17%. Landing items 1–5 above would reduce friction to ~10 min,
recovering ~12% of session budget (~30 min) per session.

## Forbidden accelerators (per session doctrine)

- No workflow/orchestration engine (Temporal, Airflow, etc.).
- No autonomous-agent dispatchers.
- No AI-policy systems.
- No microservice extraction.
- No speculative abstractions.
- Anything that hides behavior or introduces magic.

## Acceptance test for any accelerator

A new accelerator may land only if:

1. It can be removed in a single revert without affecting runtime.
2. It introduces no new runtime dependency.
3. It produces visible output (counter, log, or panel field).
4. Its absence degrades the session gracefully.
5. It has an associated `scripts/check-*` verifier.

If any of (1)–(5) fails, the accelerator is rejected.
