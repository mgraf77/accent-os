# LOW ENTROPY EXECUTION DOCTRINE
> AccentOS Runtime Doctrine — Execution Quality Layer  
> Status: DOCTRINE ONLY — No implementation claims.  
> Last revised: 2026-05-10

---

## 0. PURPOSE

Entropy in orchestration is not random noise — it is accumulated ambiguity that compounds across sessions. A high-entropy execution environment produces work that is individually coherent but collectively incoherent. This doctrine defines what low-entropy execution looks like, how to detect entropy accumulation, and when entropy levels mandate escalation.

**The governing principle:** Prefer one correct step over three plausible ones.

---

## 1. ENTROPY DEFINED IN ORCHESTRATION CONTEXT

Orchestration entropy is the degree to which the current state of a packet cannot be confidently described by a new session picking it up cold.

High entropy = a new session cannot determine what was decided, why, what the current state is, or what comes next without extensive reconstruction.

Low entropy = a new session can read the freeze record, the packet ledger, and the artifact manifest and begin execution within one verification pass.

**Entropy is not a feeling. It is measurable by answering:**
- How many decisions were made that are not logged?
- How many artifacts were modified that are not in the manifest?
- How many branch points exist that have no resolution record?
- How many steps were taken that do not advance the success criterion?

Each unanswered question is an entropy unit. The doctrine defines acceptable entropy thresholds in §4.

---

## 2. ENTROPY-MINIMIZING EXECUTION

### 2.1 Core Behaviors

**Make one decision at a time.**  
Multiple concurrent decisions multiply the state space. A session that makes five simultaneous decisions creates 5! possible orderings that a resuming session must reconstruct.

**Log every decision at the point it is made.**  
Not in a batch at the end of the session. Not in a summary. At the point of decision, in the packet ledger. A decision that is not logged is indistinguishable from a decision that was never made.

**Write only what the success criterion requires.**  
Every artifact write that does not advance the success criterion is entropy accumulation. It adds to the manifest, increases verification surface area, and creates state that a resuming session must account for.

**Prefer explicit over inferred.**  
If a step's output is implicit (e.g., "it follows from the prior work"), it must be made explicit. Resuming sessions do not inherit inference chains — they inherit artifacts and records.

**Complete a step before starting the next.**  
Interleaving steps creates partial state on multiple fronts simultaneously. A session interrupted mid-interleave leaves a dirty freeze with multiple partial states, maximizing reconstruction cost.

### 2.2 Execution Stance

Low-entropy execution operates from a **declared stance**: at any moment, the session can answer:
- What step am I on?
- What artifacts am I writing?
- What decision is currently open?
- What does completion look like?

If any of these cannot be answered immediately and concisely, the session is in elevated entropy.

---

## 3. BOUNDED CONTINUATION

Continuation is low-entropy only when the boundary conditions are respected.

### 3.1 Continuation Constraints

Every continuation session is bounded by:
- The original packet scope (cannot expand)
- The freeze record's `continuation_constraints`
- The verified artifact manifest (cannot modify artifacts outside manifest scope without logging)
- The declared success criterion (cannot redefine success locally)

### 3.2 Continuation Entropy Sources

The primary entropy introduced at continuation points:

| Source | Entropy Mechanism |
|---|---|
| Undeclared re-interpretation of prior decisions | Creates invisible divergence from original intent |
| Scope creep in first steps | Expands artifact surface before manifest is updated |
| Skipping verification steps | Inherits potentially invalid state |
| Implicit assumption about prior session's intent | Introduces inference chains not in the record |
| Adding new decisions without logging them | Silent state accumulation |

### 3.3 Low-Entropy Continuation Checklist

Before executing the first step of a continuation:
1. Freeze verification complete and PASS recorded
2. All continuation constraints read and confirmed
3. Success criterion confirmed unchanged
4. First step identified and declared in the ledger
5. No undeclared artifact modifications from prior sessions

---

## 4. ENTROPY THRESHOLD MODEL

### 4.1 Thresholds

| Metric | Green | Yellow | Red (Escalate) |
|---|---|---|---|
| Unlogged decisions | 0 | 1–2 | 3+ |
| Artifacts modified outside manifest | 0 | 0 | 1+ |
| Open branch points (unresolved) | 0 | 1 | 2+ |
| Steps taken without advancing success criterion | 0–1 | 2–3 | 4+ |
| Retry loops on same step | 0 | 1 | 2+ (same step) |
| Sessions since last verified clean freeze | 1 | 2 | 3+ |

### 4.2 Threshold Breach Response

- **Yellow on any metric:** Log advisory; continue with heightened logging discipline
- **Red on any single metric:** Acquire clean freeze; emit ESCALATING; halt

Entropy thresholds are additive risk signals. Three yellow metrics at the same time should be treated as one red metric.

---

## 5. LOW-ENTROPY BRANCHING

Branching is a high-entropy event by nature. Every branch doubles the active state surface. Low-entropy branching constrains this.

### 5.1 Branch Conditions

A branch is low-entropy only when:
- The branch point is explicitly declared (not discovered retroactively)
- Each branch has its own packet_id and freeze record
- Shared artifacts are explicitly designated `shared-read-only` in both manifests
- Each branch has an independent, measurable success criterion
- The merge condition (what makes the branches merge-ready simultaneously) is declared at branch time

### 5.2 Branch Entropy Risks

**Silent branching:** A session makes a decision that implicitly creates a branch (e.g., writes an alternate version of an artifact) without declaring a branch. This is maximum entropy — two states exist with no record of the divergence.

**Premature branching:** Branching before the packet has reached a stable freeze creates two branches each inheriting unstable state.

**Branch proliferation:** More than two active branches from a single packet requires operator authorization. The cognitive load of tracking three or more concurrent states exceeds what freeze records can reliably capture.

---

## 6. LOW-ENTROPY RELAY

A relay is the handoff from one session to the next within a packet. Every relay is a freeze-and-verify cycle.

### 6.1 Relay Protocol

**Outgoing session:**
1. Complete or explicitly unwind all open steps
2. Log all decisions made since last freeze
3. Acquire clean freeze (all conditions met)
4. Write relay notes to the packet ledger: what was done, what comes next, what decisions were made, what constraints the incoming session must respect

**Incoming session:**
1. Read relay notes before freeze verification
2. Complete freeze verification (7 steps per CLEAN_FREEZE_STANDARD.md)
3. Confirm first step matches relay notes
4. Begin execution

### 6.2 Relay Anti-Patterns

**Implicit relay:** No freeze record, no relay notes. The incoming session reconstructs context from artifacts alone. High entropy; likely to introduce invisible divergence.

**Overlapping relay:** Two sessions active on the same packet simultaneously. Entropy is immediately critical; escalate.

**Relay by summary:** Relay notes that describe what was done but not the current artifact state or open decisions. Creates false confidence in the incoming session.

---

## 7. LOW-ENTROPY MERGE STRATEGY

Merge is the highest-entropy event in the packet lifecycle. Every merge collapses branch state into shared state, making it permanent.

### 7.1 Pre-Merge Entropy Reduction

Before merge readiness is declared:
- All unlogged decisions must be logged
- All branch points must be resolved
- Artifact manifest must match actual artifact state exactly
- Success criterion must be demonstrably met
- All continuation constraints must be satisfied

### 7.2 Merge Entropy Risks

**Partial merge:** Merging some artifacts but not all. Creates a shared state that is internally inconsistent.

**Assumption merge:** Merging based on the assumption that the success criterion is met, rather than verification. Silent failure propagation.

**Rushed merge:** Merging without clean freeze verification because the operator is available "right now." Timeline pressure is not a governance exception.

---

## 8. LOW-ENTROPY REVIEW STRATEGY

Review is a verification operation, not a creative operation. Low-entropy review preserves this distinction.

### 8.1 Review Scope

Review must be scoped to the packet boundary. A reviewer examining artifacts outside the packet scope is conducting an audit (different authority class) not a review.

### 8.2 Review Output

Every review produces one of three outputs:
- **APPROVED:** Success criterion is met; artifacts match manifest; merge readiness confirmed
- **CONDITIONAL:** Specific, enumerated conditions must be met before approval; session can continue to resolve them
- **REJECTED:** Success criterion not met or artifact state unacceptable; reason declared; packet returned to active execution

Review output must be logged in the packet ledger. A review that produces no log entry has not been completed.

---

## 9. HIGH-ENTROPY ORCHESTRATION BEHAVIORS

These are the behaviors that look productive but damage coherence. They must be recognized and stopped.

### 9.1 Deceptive Productivity Patterns

**"Making progress" without advancing the success criterion**  
Writing artifacts, refining structure, improving naming — while the actual deliverable remains untouched. Produces activity metrics with no convergence signal.

**Decision batching**  
Making ten decisions and logging them all at the end of the session. Each decision not immediately logged is a window during which a freeze would be dirty. Extends the dirty-freeze risk window unnecessarily.

**Scope creep as helpfulness**  
Expanding the packet scope to "help" the operator by delivering more than was asked. Every unauthorized scope extension is a governance violation, regardless of intent.

**Soft branching**  
Writing an "alternate" version of an artifact without formally declaring a branch. Creates two states with no tracking, no separate packet_id, no governance.

**Relay by momentum**  
Continuing from a prior session's context based on tone and apparent direction, without freeze verification. The most common entropy amplification loop in multi-session work.

**Premature merge readiness**  
Declaring a packet merge-ready based on the session's own assessment of the success criterion, without independent verification.

### 9.2 Entropy Amplification Loops

An entropy amplification loop is a pattern where each iteration adds more entropy than the previous:

- **Interpretation loop:** Incoming session interprets prior session's intent → acts on interpretation → next session must interpret the interpretation → compounding divergence
- **Retry loop:** Same step fails repeatedly → each attempt leaves partial state → freeze becomes progressively dirtier
- **Scope drift loop:** Each session expands scope slightly → success criterion becomes unmeasurable → merge readiness can never be declared
- **Decision accumulation loop:** Decisions accumulate without logging → freeze record becomes incomplete → verification becomes unreliable → continuation becomes unsafe

Entropy amplification loops, once identified, mandate immediate ESCALATE. They do not resolve themselves.
