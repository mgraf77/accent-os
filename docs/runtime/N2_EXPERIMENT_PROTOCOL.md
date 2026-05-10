# N=2 EXPERIMENT PROTOCOL
> AccentOS — Bounded, supervised protocol for first dual-Train execution test.
> Measurement goal. Not velocity goal.
> Written: 2026-05-10

---

## REALITY AUDIT · 2026-05-10

**Document status: EXPERIMENTAL — protocol defined, not yet executed.**

| Claim | Status |
|-------|--------|
| Protocol definition and measurement framework | EXPERIMENTAL |
| Coordination overhead measurement | EXPERIMENTAL |
| Any claim about N=2 performance or viability | UNPROVEN |
| N=2 considered PROVEN | Requires 3 clean runs with consistent measurements |

**Nothing in this document implies that N=2 concurrent execution works. It defines how to find out.**

---

## EXPERIMENT SCOPE

**What this experiment is:**
- A supervised, bounded, disjoint-file dual-Train execution session
- A measurement instrument — every metric is recorded before, during, and after
- A single data point — one run produces no conclusions, only observations

**What this experiment is not:**
- A velocity optimization
- A proof that N=2 is safe
- A reason to expand to N=3 or unattended execution
- Successful if no measurements were taken

---

## SCOPE BOUNDARY

**This experiment validates bounded supervised branch parallelism only.**

It does NOT validate:
- Generalized orchestration runtime scalability
- Autonomous branch coordination
- Unattended execution safety
- N=3 or N=4 concurrency
- Any claim about orchestration beyond two supervised operators on disjoint files

A successful run produces one data point about coordination overhead under these specific conditions.
A failed run produces one data point about failure modes under these specific conditions.
Neither outcome extrapolates beyond these bounds.

**Primary metric: OCL.** Operator cognitive saturation is the likely true scaling bottleneck. If OCL is high under the minimum-complexity experiment (pure metadata additions, disjoint files, known outputs), it will only increase with real extraction work. That is the signal this experiment is designed to surface.

---

## HARD CONSTRAINTS

Every constraint below is a hard stop if violated. No override. No "just this once."

| Constraint | Limit | If violated |
|------------|-------|-------------|
| Maximum duration | 2 hours | Hard stop — freeze both branches, record partial data |
| Maximum trains | 2 | Abort — one branch must reach MERGED or ABANDONED |
| Shared file edits | 0 | Immediate stop — both branches freeze, collision documented |
| Autonomous rebases | 0 | Not permitted at any point — operator executes every rebase |
| Autonomous merges | 0 | Not permitted — operator executes and confirms every merge |
| Infra mutations | 0 | No changes to scripts/, .github/, Supabase, CI config |
| Class A concurrency | 0 | At most one branch may own Class A (index.html) at any time |
| Concurrent same-module edits | 0 | No two branches touch the same js/*.js module |

---

## PRE-CONDITIONS

All must be true before the experiment begins. Check each one.

```
PRE-CONDITIONS CHECKLIST

□ Integration HEAD is stable (no pending hotfixes, no open merge conflicts)
□ Both corridors are PENDING state (neither has started execution)
□ Both corridors have been calibrated within 24 hours of experiment start
□ Both corridors' entry gates have been confirmed NOT_RUN (not stale runs)
□ Both corridors are FRESH (age_commits = 0)
□ File ownership is disjoint — confirmed by:
     git log --oneline --all -- [branch-A affected files] | grep [branch-B] → 0 results
     git log --oneline --all -- [branch-B affected files] | grep [branch-A] → 0 results
□ No Class A conflict: at most one branch affects index.html
□ Rollback commands written for both branches' first packets (before execution begins)
□ WIP.md updated with both branch ACTIVE states
□ Measurement log initialized (see MEASUREMENT LOG section)
□ Experiment start time recorded
□ Operator(s) available for the full 2-hour window
```

Do not start if any box is unchecked. A failed pre-condition is not a blocker — it is data: the experiment requires more setup time than estimated.

---

## PARTICIPANT ROLES

| Role | Responsibility | Authority |
|------|---------------|-----------|
| **Train A Operator** | Executes Branch A corridor packets | Branch A state only |
| **Train B Operator** | Executes Branch B corridor packets | Branch B state only |
| **Coordinator** | Runs synchronization checkpoints, records measurements, calls hard stops | Both branches (read) — no execution authority |

In a single-operator experiment: one person holds all three roles. Record context switches between roles in the measurement log.

---

## BRANCH SETUP REQUIREMENTS

**Branch A (may be Class A or Class B):**
```
Branch A setup:
  branch_id:          [name]
  file_class:         A | B
  corridor_id:        [name]
  affected_files:     [explicit list — no globs]
  first_packet:       [name]
  rollback_command_for_first_packet: [written before experiment starts]
  entry_gate_command: [exact command, not a description]
  entry_gate_expected_output: [exact expected value]
```

**Branch B (must be Class B if Branch A is Class A):**
```
Branch B setup:
  branch_id:          [name]
  file_class:         B  (if Branch A is A — mandatory)
  corridor_id:        [name]
  affected_files:     [explicit list — no globs]
  first_packet:       [name]
  rollback_command_for_first_packet: [written before experiment starts]
  entry_gate_command: [exact command, not a description]
  entry_gate_expected_output: [exact expected value]
```

**Disjoint ownership confirmation:**
```bash
# Run before starting — both commands must return 0 lines of Branch B in Branch A's files:
git log --oneline --all -- [branch-A-file-1] [branch-A-file-2] | grep "branch-B-name"
git log --oneline --all -- [branch-B-file-1] [branch-B-file-2] | grep "branch-A-name"
```

---

## EXECUTION STRUCTURE

```
T+0:00   Experiment start — both entry gates run simultaneously
         Record: entry gate start time, actual outputs
         If either gate fails → abort, document pre-condition failure

T+0:05   Branch A: first packet → IN_PROGRESS
         Branch B: first packet → IN_PROGRESS
         Record: first IN_PROGRESS timestamps for both

T+0:30   CHECKPOINT 1 (see SYNCHRONIZATION CHECKPOINTS)
         Coordinator: collect state from both branches
         Record: all measurement metrics at T+0:30

T+1:00   CHECKPOINT 2

T+1:30   CHECKPOINT 3

T+2:00   HARD STOP
         Regardless of state: freeze both branches
         Record final state, partial metrics, abort reason if applicable

         If both branches reached COMMITTED before T+2:00:
           Proceed to merge sequence (see MERGE SEQUENCE)
           Record merge friction metrics
```

---

## FREEZE TIMESTAMPS

Fill in at experiment start (T+0:00). Do not estimate or backfill retroactively.

```
EXPERIMENT TIMING

Experiment start:             [HH:MM]   ← fill at T+0:00
Freeze cutoff (hard stop):    [HH:MM]   ← fill at T+0:00 (= start + 2:00)
Checkpoint 1 due:             [HH:MM]   ← fill at T+0:00 (= start + 0:30)
Checkpoint 2 due:             [HH:MM]   ← fill at T+0:00 (= start + 1:00)
Checkpoint 3 due:             [HH:MM]   ← fill at T+0:00 (= start + 1:30)
Merge checkpoint:             [HH:MM]   ← fill when both branches reach COMMITTED
                                           (if this exceeds freeze cutoff: hard stop wins)

Branch A entry gate actual:   [HH:MM]   ← fill when gate runs
Branch B entry gate actual:   [HH:MM]   ← fill when gate runs
Branch A first IN_PROGRESS:   [HH:MM]   ← fill when first packet starts
Branch B first IN_PROGRESS:   [HH:MM]   ← fill when first packet starts
Branch A COMMITTED:           [HH:MM]   ← fill when commit executes
Branch B COMMITTED:           [HH:MM]   ← fill when commit executes
```

**Checkpoint discipline:** If a checkpoint time arrives and the coordinator has not called it — call it immediately. Do not slide checkpoints. A checkpoint that slips by 10 minutes is a data quality failure.

---

## SYNCHRONIZATION CHECKPOINTS

Checkpoint occurs every 30 minutes. Coordinator runs this sequence.

```
CHECKPOINT PROCEDURE (5 minutes max):

1. Both branches pause (no new edits during checkpoint)

2. Coordinator runs:
     Branch A: git log --oneline -3 origin/[branch-A]
     Branch B: git log --oneline -3 origin/[branch-B]
     Record actual HEADs in measurement log.

3. Both operators report:
     Current packet state (PENDING/IN_PROGRESS/VERIFIED/COMMITTED)
     Any halt triggers encountered since last checkpoint
     Any uncertainty incidents since last checkpoint
     Any coordination events since last checkpoint

4. Coordinator checks for drift:
     Does advisory state in WIP.md match authoritative git state?
     If mismatch found: log STATE DRIFT INCIDENT, resolve before continuing.

5. Coordinator records checkpoint data in MEASUREMENT LOG

6. Both branches resume (coordinator signals "clear to continue")
```

Checkpoint data that must be recorded each time:
```
CHECKPOINT [N] — T+[HH:MM]

Branch A:
  current_packet:         [id]
  packet_state:           [state]
  commits_since_start:    [count]
  head_commit:            [hash]

Branch B:
  current_packet:         [id]
  packet_state:           [state]
  commits_since_start:    [count]
  head_commit:            [hash]

Coordination events since last checkpoint:
  [list — or "none"]

Uncertainty incidents since last checkpoint:
  [list — or "none"]

State drift detected:
  [list — or "none"]

Both branches: any halt triggers?
  [yes/no — if yes, describe]
```

---

## ROLLBACK CHECKPOINTS

A rollback checkpoint is established before each packet enters IN_PROGRESS.

```
ROLLBACK CHECKPOINT PROCEDURE (before each packet):

1. Confirm rollback_command is written for this packet
2. Confirm current HEAD is recorded (this is the "safe point")
3. Confirm: if rollback is triggered, where does execution return?
   Answer must be: a specific prior COMMITTED or VERIFIED state
4. Record in WIP.md:
     Rollback checkpoint [N]:
       safe_point_commit: [hash]
       rollback_command:  [exact command]
       safe_to_rollback:  true
```

If a packet has no rollback checkpoint: STOP. Write it. Then start the packet.

---

## MERGE SEQUENCE (when both branches reach COMMITTED)

Merge ordering follows TWO_BRANCH_COORDINATION_PROTOCOL.md:
- If Branch A = Class A and Branch B = Class B: Branch B merges first
- Branch A rebases on new Integration HEAD
- Branch A re-runs exit gate
- Branch A merges

```
MERGE SEQUENCE RECORD:

Branch B merge:
  merge_start_time:    [HH:MM]
  merge_end_time:      [HH:MM]
  conflicts:           [count — should be 0]
  friction_notes:      [any rebases, gate re-runs, blockers]

Branch A rebase (if required):
  rebase_start_time:   [HH:MM]
  rebase_end_time:     [HH:MM]
  conflicts:           [count — should be 0]
  exit_gate_rerun:     [yes/no — expected yes]
  gate_passed:         [yes/no]

Branch A merge:
  merge_start_time:    [HH:MM]
  merge_end_time:      [HH:MM]
  conflicts:           [count — should be 0]
  friction_notes:      [any blockers]

Post-merge Integration smoke test:
  smoke_test_passed:   [yes/no]
  pages_tested:        [list]
```

---

## MEASUREMENT FRAMEWORK

Seven metrics. All are required. An experiment that completes without all seven recorded is incomplete data.

---

### Metric 1 — Coordination Overhead (CO)

**What:** Fraction of total session time spent on inter-branch coordination rather than execution.

**What counts as coordination:**
- Checking the other branch's state
- Reading the other branch's WIP.md
- Running ownership verification commands
- Checkpoint procedures
- Resolving ambiguity about file ownership or corridor scope
- Any "wait, is this safe for both branches?" pause

**How to measure:**
Record start/stop for each coordination event in the COORDINATION LOG.
```
CO% = total_coordination_minutes / total_session_minutes × 100
```

**Target:** Record actual. Do not target a number before the experiment.

---

### Metric 2 — Operator Cognitive Load (OCL)

**What:** Count of branch context switches and uncertainty incidents per hour.

**What counts as a context switch:**
- Operator mentally shifting from "Branch A execution" to "Branch B state" or "coordination"
- Opening the other branch's WIP.md, corridor doc, or git log
- Switching terminals/tabs to check the other branch

**What counts as an uncertainty incident:**
- Any moment of "wait, is this file safe for me to touch?"
- Any moment of "is the other branch ahead of or behind me?"
- Any moment of "should I check in before committing this?"

**How to measure:** Both operators self-report each event at each checkpoint.
```
OCL = (context_switches + uncertainty_incidents) / session_hours
```

---

### Metric 3 — Synchronization Delay (SD)

**What:** Lag between a state change on one branch and the other branch/coordinator becoming aware.

**Events that trigger measurement:**
- Packet committed on Branch A → when does Branch B operator know?
- Halt trigger on Branch B → when does Branch A pause?
- Checkpoint called → how long until both branches are synchronized?

**How to measure:** Record timestamp of event on originating branch, timestamp of acknowledgment on other side.
```
SD_average = sum(ack_time - event_time) / count(events)
```

---

### Metric 4 — Merge Friction (MF)

**What:** Time and complexity of the merge sequence.

**Components:**
- Time from "both branches COMMITTED" to "both branches MERGED"
- Number of conflicts encountered (should be 0 — any >0 is a constraint violation)
- Number of rebase steps required
- Number of exit gate re-runs required
- Any unexpected blockers

**How to measure:** Record in MERGE SEQUENCE RECORD (above).
```
MF_time = (integration_merge_complete_time) - (first_branch_COMMITTED_time)
MF_complexity = conflicts + rebase_steps + gate_reruns
```

---

### Metric 5 — State Drift Incidents (SDI)

**What:** Number of times advisory state (WIP.md, corridor docs) was found to not match authoritative state (git).

**What counts:**
- WIP.md shows ACTIVE branch but git shows unrelated commits
- Corridor doc says FRESH but age_commits is actually > 0
- Packet state in WIP.md doesn't match git commit log

**How to measure:** Coordinator records each mismatch at checkpoints.
```
SDI = count(advisory ≠ authoritative) over entire session
```

---

### Metric 6 — Interruption Recovery (IR)

**What:** Time from an unplanned interruption to safe execution resumption.

**What counts as an interruption:**
- Halt trigger on either branch
- Unexpected merge conflict detection
- External distraction requiring operator attention
- Coordinator calling a pause (outside of scheduled checkpoints)

**How to measure:** Record interruption start and "execution resumed" timestamp.
```
IR_average = sum(resume_time - interrupt_time) / count(interruptions)
```

---

### Metric 7 — Ambiguity Incidents (AI)

**What:** Moments where the operator could not determine the correct next action without external input.

**What counts:**
- "I don't know if this file is mine to touch"
- "I don't know if the other branch has already done this"
- "I don't know if I should wait for the other branch to commit first"
- Any question that required looking up a protocol doc to resolve

**How to measure:** Both operators self-report each incident. Coordinator records.
```
AI = count(ambiguity_incidents) over session
```

Ambiguity incidents that required protocol doc lookups: note which doc and which rule resolved it.

---

### Metric 8 — Semantic Collision Incidents (SCI)

**What:** Collisions in runtime assumptions, dependencies, or initialization order — not detectable by file disjointness alone.

**File disjointness is necessary but not sufficient.** Two branches can own completely separate files and still produce semantic collisions at runtime through shared globals, hidden dependency chains, or initialization coupling.

**Four collision types to track:**

| Type | Definition | How it surfaces |
|------|-----------|-----------------|
| Shared runtime assumption | Both batches assume a global (AOS_REGISTRY, sbFetch, VD_RAW, ROLES, etc.) is in a specific state at execution time | One batch's register() consumes something the other batch is also consuming, with conflicting expectations about its state |
| Hidden dependency overlap | A module in Batch A's `provides[]` is consumed by a module in Batch B, or vice versa | Batch B's consumes[] lists something Batch A provides — creates an implicit load-order dependency |
| Initialization coupling | Module A must be initialized before Module B, but both are being registered in parallel without that constraint visible | One module calls `window.[fn]` at load time where `[fn]` is provided by a module in the other batch |
| Global mutation overlap | Two modules both write to the same global at load time, outside of their `register()` call | Grep for `window.X =` or direct registry mutations in module bodies |

**Pre-execution SCI check (run before either branch starts):**
```bash
# These are the 13 modules — read the first 40 lines of each to extract provides/consumes:
head -40 js/vendors_module.js js/vendor_scoring.js js/quotes_module.js \
         js/dashboard_module.js js/mgmt_module.js js/pipeline_module.js \
         js/repoutreach_module.js js/settings_module.js js/knowledge_module.js \
         js/vendors_overflow.js js/vendor_filters.js js/vendor_scoring_helpers.js \
         js/supabase_categories.js

# Cross-check: does anything in Batch A's provides[] appear in Batch B's consumes[] (or vice versa)?
# If yes: log as SCI-RISK before execution begins — do not start until documented
```

**Record each SCI incident:**
```
SCI INCIDENT [N]:
  type:         [shared_assumption | hidden_dependency | init_coupling | global_mutation]
  batch_A_file: [file involved]
  batch_B_file: [file involved]
  description:  [one sentence — what the collision is]
  detected_at:  [pre-execution | checkpoint | post-commit | post-merge]
  resolved_by:  [how it was resolved, or "unresolved"]
```

**How to measure:**
```
SCI = count(semantic_collision_incidents) over session
SCI_type_breakdown: count per type
SCI_detected_pre_execution: count (these are caught — good)
SCI_detected_post_execution: count (these are missed pre-checks — bad)
```

SCI > 0 on a "trivially disjoint" experiment means file-level disjointness is less predictive of runtime safety than assumed. SCI detected only post-execution means the pre-execution check was insufficient. Both are key data points.

---

## MEASUREMENT LOG TEMPLATE

```
EXPERIMENT RUN [N]
Date:              [YYYY-MM-DD]
Start time:        [HH:MM]
End time:          [HH:MM]
Total duration:    [minutes]
Operator(s):       [names or "single-operator"]
Branch A:          [branch id] / corridor: [id] / class: [A|B]
Branch B:          [branch id] / corridor: [id] / class: [B]

PRE-CONDITIONS:    [all passed? or list failures]
ABORT REASON:      [if applicable — or "completed normally"]

─────────────────────────────────────────────
METRIC RESULTS

CO (coordination overhead):
  Total session time:        [min]
  Total coordination time:   [min]
  CO%:                       [%]
  Coordination events:       [list with timestamps]

OCL (cognitive load):
  Context switches:          [count]
  Uncertainty incidents:     [count]
  OCL per hour:              [rate]

SD (synchronization delay):
  Events measured:           [count]
  Average lag:               [minutes]
  Maximum lag:               [minutes]

MF (merge friction):
  Time from COMMITTED to MERGED: [minutes]
  Conflicts:                 [count]
  Rebase steps:              [count]
  Exit gate reruns:          [count]

SDI (state drift incidents):
  Count:                     [count]
  Details:                   [list each mismatch]

IR (interruption recovery):
  Interruptions:             [count]
  Average recovery time:     [minutes]

AI (ambiguity incidents):
  Count:                     [count]
  Resolved by:               [doc + rule for each]

SCI (semantic collision incidents):
  Total count:               [count]
  Detected pre-execution:    [count]
  Detected post-execution:   [count]
  By type:
    shared_assumption:       [count]
    hidden_dependency:       [count]
    init_coupling:           [count]
    global_mutation:         [count]
  Incident log:              [list each SCI record]

─────────────────────────────────────────────
FREEZE TIMESTAMPS (actual)

Experiment start:            [HH:MM]
Freeze cutoff:               [HH:MM]
Branch A entry gate:         [HH:MM]
Branch B entry gate:         [HH:MM]
Branch A first IN_PROGRESS:  [HH:MM]
Branch B first IN_PROGRESS:  [HH:MM]
Branch A COMMITTED:          [HH:MM]
Branch B COMMITTED:          [HH:MM]
Merge checkpoint:            [HH:MM]
Experiment end:              [HH:MM]

─────────────────────────────────────────────
CHECKPOINT DATA

CHECKPOINT 1 — T+0:30: [see template above]
CHECKPOINT 2 — T+1:00: [see template above]
CHECKPOINT 3 — T+1:30: [see template above]

─────────────────────────────────────────────
OBSERVATIONS

What worked:        [list]
What didn't:        [list]
Unexpected events:  [list]
Protocol gaps:      [list — where the protocol gave insufficient guidance]
Recommended edits to N2_EXPERIMENT_PROTOCOL.md: [list]
```

---

## SUCCESS AND FAILURE CRITERIA

### Run-level success (single run)

A run succeeds if:
- Both branches reached COMMITTED state without collision
- Zero shared-file edits
- Zero Class A conflicts
- All 8 metrics recorded (CO, OCL, SD, MF, SDI, IR, AI, SCI)
- Freeze timestamps filled in completely
- Experiment log complete

A run fails if:
- Shared-file edit detected (constraint violation — not just bad luck)
- Hard stop triggered before both branches committed (timeout or abort)
- Fewer than 6 of 8 metrics recorded (measurement failure)

Note: a failed run still produces data. A "failed run" with complete measurements is more valuable than a "successful run" with no measurements.

### Experiment-level validation (across runs)

N=2 concurrent execution transitions from EXPERIMENTAL to PROVEN only when:
- Minimum 3 successful runs completed
- Metrics are consistent (no single metric varies >30% across runs)
- Zero collision incidents across all runs
- Zero protocol violations requiring hard stops

Until that bar is met: N=2 is EXPERIMENTAL. Results from 1–2 runs are observations, not conclusions.

---

## ABORT CONDITIONS

Stop both branches immediately if any of these occur:

| Condition | Action |
|-----------|--------|
| Shared-file edit detected | Freeze both branches. Document collision. Do not attempt to merge. |
| Halt trigger on either branch | Freeze BOTH branches per Rule 5. Resolve halted branch first. |
| State drift > 2 incidents in one checkpoint period | Stop both. Reconcile advisory state. Re-run entry gates before resuming. |
| Clock reaches T+2:00 | Hard stop regardless of packet state. Freeze both. Record partial data. |
| Coordinator loses track of state on either branch | Stop. Reconcile. Resume only after coordinator can state both branch states accurately. |
| Any operator says "I don't know what state I'm in" | Stop. Reconcile. This is not failure — it is data. |

---

## OPERATOR ESCALATION THRESHOLDS

These are the triggers at which an operator MUST stop execution and call the coordinator — not continue independently, not resolve silently, not assume.

| Trigger | Threshold | Required action |
|---------|-----------|-----------------|
| Semantic ambiguity | Cannot determine `provides[]` or `consumes[]` for a module after reading the file for **> 3 minutes** | Stop. Call coordinator. Log as AI incident. Do not guess provides/consumes. |
| Unexpected dependency overlap | A module's `consumes[]` references something in the other batch's `provides[]` | Stop both branches. Document as SCI incident type: hidden_dependency. Do not continue until resolved. |
| State drift | Advisory state (WIP.md) doesn't match authoritative (git log) | Stop this branch. Run `git log --oneline -5`. Update WIP.md. Re-run entry gate. Log as SDI incident. |
| Synchronization uncertainty | Cannot state the other branch's current packet state without asking | Stop. Coordinator calls an out-of-cycle checkpoint. Do not assume the other branch's state. |
| Protocol lookup > 5 min | Looking up how to handle a situation takes more than 5 minutes | Stop. Log as AI incident. Document which protocol section was missing or unclear. This is a protocol gap, not operator failure. |

**These thresholds are measurement instruments, not failure conditions.** Every escalation that fires is data about where the protocol is under-specified or where cognitive load exceeds the expected baseline. Log them precisely — they are the most useful telemetry this experiment produces.

---

## POST-EXPERIMENT ANALYSIS

After the experiment completes (or aborts), write a POST-RUN ANALYSIS in SESSION_LOG.md:

```
N=2 EXPERIMENT RUN [N] — POST-RUN ANALYSIS
Date: [YYYY-MM-DD]

Outcome: [COMPLETED / ABORTED — reason]

Key metric findings:
  CO%:    [%]  — [interpretation]
  OCL:    [rate] — [interpretation]
  SD avg: [min] — [interpretation]
  MF:     [time + complexity] — [interpretation]
  SDI:    [count] — [interpretation]
  IR avg: [min] — [interpretation]
  AI:     [count] — [interpretation]

Conclusion: [one paragraph — what did this run tell us?]
  Do NOT conclude "N=2 works" from a single run.
  Do NOT conclude "N=2 is too hard" from a single run.
  State: "This run observed [X]. Next run should vary [Y] to test [Z]."

Protocol changes recommended:
  [list of specific edits to N2_EXPERIMENT_PROTOCOL.md]

Maturity update:
  N=2 concurrent execution status: EXPERIMENTAL (N runs completed, [N] remaining for PROVEN)
```

---

## MATURITY PROGRESSION

| State | Condition |
|-------|-----------|
| EXPERIMENTAL | Protocol defined (current) |
| EXPERIMENTAL-ACTIVE | First run completed with measurements |
| EXPERIMENTAL-CONFIRMED | 3+ runs with consistent metrics, 0 collisions |
| PROVEN | 3+ runs, metrics stable <30% variance, independent operator replication |

Do not declare PROVEN without independent replication. One operator running three runs proves the operator can do it. An independent operator running one run proves the protocol is self-sufficient.

---

## CLAIM REGISTRY

| ID | Claim | Status |
|----|-------|--------|
| N2-1 | File disjoint ownership prevents collisions | EXPERIMENTAL |
| N2-2 | Coordination overhead is measurable | EXPERIMENTAL |
| N2-3 | Operator cognitive load is quantifiable per session | EXPERIMENTAL |
| N2-4 | Merge sequence (B first, A rebases) completes without conflict | EXPERIMENTAL |
| N2-5 | Synchronization delay is under 5 minutes | UNPROVEN — requires measurement |
| N2-6 | N=2 provides throughput improvement vs N=1 | UNPROVEN — requires measurement |
| N2-7 | N=2 coordination overhead is acceptable | UNPROVEN — requires measurement |
| N2-8 | Protocol is self-sufficient for an independent operator | UNPROVEN — requires replication |
| N2-9 | N=2 is PROVEN viable | FALSE until maturity criteria met |
| N2-10 | File disjointness alone prevents semantic collisions | UNPROVEN — SCI metric designed to test this |
| N2-11 | OCL is the primary scaling bottleneck (not file conflicts) | UNPROVEN — primary hypothesis to measure |
| N2-12 | Escalation thresholds capture operator saturation accurately | EXPERIMENTAL |
