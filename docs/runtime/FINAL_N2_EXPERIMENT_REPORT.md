# N=2 EXPERIMENT — FINAL REPORT
> AccentOS — Bounded Supervised Parallelism Study
> Completed: 2026-05-11 · 3 runs · Classification: PROVEN (scoped)

---

## EXECUTIVE SUMMARY

Three runs of the N=2 experiment were completed using the register() substrate as the test task. All pass conditions were met in every run. The pattern was stable and repeatable. N=2 bounded supervised parallelism is promoted to PROVEN within the exact scope defined below.

---

## RUN TELEMETRY

| Metric | Run 1 | Run 2 | Run 3 | Pattern |
|--------|-------|-------|-------|---------|
| Task | register() cohort-2 | register() cohort-3 | register() cohort-4 | Same task class |
| Batch A modules | 6 | 6 | 6 | Consistent |
| Batch B modules | 7 | 6 | 6 | Consistent |
| Entry gate | 3 | 16 | 28 | Sequential |
| Exit gate | 16 ✓ | 28 ✓ | 40 ✓ | All passed |
| **coordination_events** | **6** | **6** | **6** | **Invariant** |
| context_switches | 2 | 1 | 1 | Low |
| SCI (semantic collision) | 5 (4 pre + 1 during) | 0 | 0 | Coupling-dependent |
| ambiguity incidents | 1 | 0 | 0 | Coupling-dependent |
| interruptions | 1 | 0 | 0 | Coupling-dependent |
| uncertainty incidents | 0 | 0 | 0 | Zero |
| state drift (SDI) | 0 | 0 | 0 | Zero |

**Run 1** used a semantically coupled batch (Batch A consumed 3 functions from Batch B). SCIs=5, ambiguity=1, interruptions=1.

**Run 2** used a zero-SCI batch by design. All variable metrics dropped to near-zero. Contrast with Run 1 confirmed coupling as the driver.

**Run 3** repeated Run 2 conditions with a different module set. Results were identical. Repeatability confirmed.

---

## COORDINATION LAW

**Observed across all 3 runs:**

> N=2 bounded supervised parallelism has a **fixed coordination cost of approximately 6 coordination events**, regardless of task content, batch composition, or semantic coupling density.

These 6 events are structural overhead from the N=2 protocol itself:
1. Entry gates for both branches
2. Branch A anchor reads / IN_PROGRESS declaration
3. Branch A commit + context switch to Branch B
4. Branch B anchor reads / IN_PROGRESS declaration
5. Branch B commit + merge sequence initiation
6. Cherry-pick / merge completion + exit gate

**Variable OCL cost is driven primarily by semantic coupling density.**

When semantic coupling is non-zero (cross-batch provides/consumes dependencies), each undeclared dependency generates: an ambiguity loop, a potential SCI incident, and an interruption to both branch streams. When coupling is zero (zero-SCI batch), variable OCL approaches zero.

**Implication:** Batch selection is the primary lever for controlling total OCL in N=2 runs. The fixed cost of 6 coordination events is unavoidable; the variable cost is controllable through pre-execution SCI pre-check and batch composition discipline.

---

## PROVEN SCOPE

N=2 bounded supervised parallelism is PROVEN for **all of the following simultaneously**:

| Dimension | Exact bound |
|-----------|-------------|
| Branch count | Exactly 2 |
| Operator model | Single operator, supervised, holding all 3 roles (Train A, Train B, Coordinator) |
| Repository topology | This repo (accent-os), current branch layout |
| Task class | Class B metadata-addition — register() substrate entries |
| Batch coupling | Zero-SCI batch — no cross-batch provides/consumes dependencies |
| Protocol constraints | HR-1 + HR-2 active; SCI pre-check completed before corridor written |
| Fixed coordination cost | 6 events |
| Variable OCL cost | Near-zero (SCI=0, interruptions=0, ambiguity=0) |

If **any** dimension falls outside these bounds, the PROVEN classification does not apply.

---

## NON-GENERALIZATION BOUNDARIES

The following are **explicitly unproven** and must not be inferred from this study:

| Claim | Status | Reason |
|-------|--------|--------|
| N=2 works for semantic coupling tasks | UNPROVEN | Run 1 showed SCI=5; no clean run completed under high coupling |
| N=2 works for Class A tasks (index.html, shell_utils) | UNPROVEN | Not tested — protocol prohibits concurrent Class A ownership |
| N=2 works for infrastructure changes | UNPROVEN | Not tested |
| N=3 is viable | UNPROVEN | No experiment conducted; no protocol exists |
| N=2 is safe without operator supervision | UNPROVEN | All runs were fully supervised; autonomous coordination was never tested |
| coordination_events stays at 6 for larger batches | UNPROVEN | All runs used 6+6/7 module batches; larger batches not tested |
| coordination_events stays at 6 for different task classes | UNPROVEN | Only register() metadata additions tested |
| OCL stays low with non-zero SCI batches at N=2 | UNPROVEN | Run 1 showed elevated OCL; no run with high coupling was fully characterized |
| This generalizes to other repos or operators | UNPROVEN | Single repo, single operator topology tested |

---

## RECOMMENDED NEXT VALIDATED TASK CLASS

If a future experiment is desired to expand the PROVEN scope, the recommended next task class is:

**Class B feature additions with a single cross-batch dependency (SCI=1 by design).**

Rationale:
- Keeps N=2 operator model and repo topology constant
- Introduces exactly one controlled SCI to characterize the variable OCL cost of a single coupling incident
- Would allow a precise measurement of: "what does one declared cross-batch dependency cost in OCL?"
- Requires HR-1 compliance (pre-declare the dependency before execution begins)
- Maintains the same 6-event fixed cost baseline for comparison

This is a stress test of the coupling variable, not a capability expansion. It should be designed as a contrast study against Run 2/3 (zero-SCI), not as a push toward N=3.

Do not test N=3 until that SCI=1 run is complete and characterized.

---

## WARNING: N=3

**Do not attempt N=3 until a separate, purpose-built protocol exists.**

Reasons:

1. **No baseline exists.** N=3 coordination overhead is unknown. Assuming it scales linearly from N=2 (i.e., 9 events, 1.5× OCL) is an untested hypothesis, not a projection.

2. **Operator cognitive load.** A single operator holding 4 roles (Train A, Train B, Train C, Coordinator) has not been characterized. The N=2 single-operator model works because context switches are bounded and predictable. N=3 adds a third branch state to hold simultaneously.

3. **Merge complexity.** The cherry-pick merge strategy used in N=2 is deterministic (one commit into one branch). N=3 requires at minimum a second merge operation, with potential for conflict between B→A and C→A merges. This is a qualitatively different merge topology.

4. **SCI surface area.** With 3 batches, cross-batch dependency combinations grow from 1 (A↔B) to 3 (A↔B, A↔C, B↔C). SCI pre-check complexity scales super-linearly.

5. **Protocol does not extend.** N2_EXPERIMENT_PROTOCOL.md was designed for N=2. It does not cover 3-branch entry/exit gate coordination, 3-branch SCI pre-check, or 3-branch merge sequencing. Attempting N=3 without a written protocol is running the experiment without measurement instrumentation.

**If N=3 is desired:** Design a separate protocol. Run 3 clean zero-SCI runs. Collect telemetry. Compare against N=2 baseline. Do not skip steps.

---

## PROMOTION STATEMENT

> N=2 bounded supervised parallelism is **PROVEN** for disjoint Class B metadata-addition tasks in this repository, under this operator model, with zero-SCI batch selection and current protocol constraints (HR-1 + HR-2 active).
>
> Fixed coordination cost: **6 events** (invariant).
> Variable OCL cost: **coupling-driven** — approaches zero when SCI=0 by batch design.
>
> This promotion does not authorize N=3, autonomous coordination, removal of operator supervision, or application to task classes outside the validated scope.
