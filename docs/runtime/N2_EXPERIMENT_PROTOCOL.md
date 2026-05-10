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
- All 7 metrics recorded
- Experiment log complete

A run fails if:
- Shared-file edit detected (constraint violation — not just bad luck)
- Hard stop triggered before both branches committed (timeout or abort)
- Fewer than 5 of 7 metrics recorded (measurement failure)

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
