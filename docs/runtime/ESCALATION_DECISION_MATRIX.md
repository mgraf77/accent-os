# ESCALATION DECISION MATRIX
> AccentOS Runtime Doctrine — Escalation Layer  
> Status: DOCTRINE ONLY — No implementation claims.  
> Last revised: 2026-05-10

---

## 0. PURPOSE

Every execution session will encounter conditions that cannot be resolved locally. This matrix defines, with precision, which conditions demand which response. The goal is to eliminate judgment calls at the session level: if a condition matches a row in this matrix, the response is mandatory.

**Three response classes exist:**

- **CONTINUE** — local resolution is safe; no escalation required
- **FREEZE** — acquire a clean freeze immediately; halt execution; await signal
- **ESCALATE** — acquire freeze (if possible) and transfer to operator; execution blocked until operator resolves

When in doubt between FREEZE and ESCALATE, always choose ESCALATE.

---

## 1. SEVERITY MODEL

Severity is assigned to conditions, not to decisions. Higher severity = more restricted local authority.

| Level | Label | Meaning |
|---|---|---|
| 0 | NOMINAL | Expected condition; local resolution authorized |
| 1 | ADVISORY | Unexpected but bounded; local resolution authorized with signal |
| 2 | CAUTION | Outside normal parameters; freeze recommended; operator notification required |
| 3 | CRITICAL | Execution must halt; clean freeze required; operator resolution required before continuation |
| 4 | UNSAFE | Immediate freeze or abort; no further local action permitted; operator must resolve before any state is trusted |

---

## 2. ESCALATION TRIGGER MATRIX

### 2.1 Packet Integrity Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| Packet boundary is unambiguous, success criterion defined | 0 | CONTINUE | Nominal |
| Packet boundary has informal ambiguity (minor scope question) | 1 | CONTINUE + log advisory | Resolve within session if clearly safe |
| Packet boundary is materially ambiguous | 3 | FREEZE → ESCALATE | Cannot proceed without knowing scope |
| Packet boundary has been extended without OA | 4 | ESCALATE | Governance violation; all work after extension is suspect |
| Success criterion is undefined or unmeasurable | 3 | FREEZE → ESCALATE | Cannot determine when done |
| Success criterion has changed since session start | 3 | FREEZE → ESCALATE | Prior work may no longer be valid |

### 2.2 Artifact State Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| All artifacts match expected state | 0 | CONTINUE | Nominal |
| Artifact outside packet scope was read (read-only) | 1 | CONTINUE + log advisory | Permitted; log for transparency |
| Artifact outside packet scope was written | 4 | ESCALATE | Authority violation; scope breach |
| Artifact hash mismatch at resume verification | 4 | ESCALATE | Trust gap; cannot continue safely |
| Artifact missing at resume verification | 4 | ESCALATE | Freeze record is invalid |
| Artifact manifestly corrupted | 4 | ESCALATE | Do not attempt repair locally |

### 2.3 Decision & Branching Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| Decision point with clear local authority and bounded impact | 0 | CONTINUE | Make the decision; log it |
| Decision point with unclear local authority | 2 | FREEZE → ESCALATE | Do not guess at authority |
| Decision point with shared-state impact | 3 | FREEZE → ESCALATE | Cannot affect shared state without OA |
| Unresolvable branch (two valid paths with conflicting implications) | 3 | FREEZE → ESCALATE | Present both paths to operator |
| Decision that would extend packet boundary | 3 | FREEZE → ESCALATE | OA required for boundary extension |

### 2.4 Freeze & Continuation Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| Freeze conditions met; clean freeze acquired | 0 | FREEZE (clean) | Normal freeze lifecycle |
| Freeze conditions partially met; must interrupt | 2 | FREEZE (dirty) + notify | Operator must resolve before continuation |
| Continuation attempted without freeze verification | 4 | ESCALATE | Verification is not optional |
| Continuation attempted from dirty freeze without OA | 4 | ESCALATE | Trust gap unresolved |
| Two freeze records exist for the same packet state | 4 | ESCALATE | Ledger conflict; cannot determine canonical state |

### 2.5 Entropy & Coherence Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| Execution is monotonically progressing | 0 | CONTINUE | Nominal |
| Session detects retry loop (same step attempted 3+ times) | 2 | FREEZE → ESCALATE | Loop is an entropy signal |
| Session detects coherence drift (output diverging from success criterion) | 2 | FREEZE → ESCALATE | Deceptive productivity pattern |
| Session cannot verify its own prior output is correct | 3 | FREEZE → ESCALATE | Self-trust failure requires external verification |
| Entropy threshold exceeded (see LOW_ENTROPY_EXECUTION_DOCTRINE.md §4) | 3 | FREEZE → ESCALATE | Doctrine-defined threshold |

### 2.6 Operator Interaction Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| Operator instruction is present and unambiguous | 0 | CONTINUE per instruction | |
| Operator instruction is ambiguous | 1 | CONTINUE with best interpretation + log | Flag interpretation for operator review |
| Operator instruction contradicts governance doctrine | 3 | FREEZE → ESCALATE | Doctrine governs; cannot override locally |
| No operator instruction and path is unclear | 2 | FREEZE → ESCALATE | Do not guess at operator intent |
| Operator is unreachable and action is time-sensitive | 2 | FREEZE (clean) + log urgency | Hold; do not self-authorize |

### 2.7 Rollback Triggers

| Condition | Severity | Response | Notes |
|---|---|---|---|
| Rollback to verified clean freeze within packet scope | 1 | ROLLBACK authorized | Log; proceed |
| Rollback target is dirty freeze | 3 | FREEZE → ESCALATE | Cannot trust dirty freeze as rollback target |
| Rollback would cross a merge boundary | 4 | ESCALATE | Shared-state impact; OA required |
| Rollback target not present in rollback_targets list | 4 | ESCALATE | Unverified rollback target; authority gap |

---

## 3. UNSAFE STATE DEFINITION

A packet is in **UNSAFE STATE** when any of the following hold:

1. An artifact outside packet scope has been written without OA
2. A continuation was executed from an unverified or dirty freeze
3. A merge was executed without OA
4. A governance violation has been logged and not resolved
5. The packet ledger has conflicting signal chains (e.g., MERGED and ACTIVE simultaneously)
6. An artifact manifest hash cannot be verified and execution continued past that point

**Unsafe state is not self-resolvable.** An unsafe packet must be:
1. Immediately frozen (dirty freeze is acceptable here)
2. Flagged as UNSAFE in the packet ledger
3. Held for operator resolution before any further execution

---

## 4. OPERATOR-REQUIRED BOUNDARY SUMMARY

These conditions always require operator involvement. No exception, no local override.

- Packet boundary extension
- Merge into shared/main state
- Resolution of any open escalation
- Continuation authorization after failed freeze verification
- Continuation authorization from a dirty freeze
- Rollback across a merge boundary
- Retirement of a packet
- Modification of the governance doctrine
- Resolution of conflicting freeze records
- Resolution of unsafe state

---

## 5. MATRIX USAGE PROTOCOL

When a session encounters any condition:

1. Look up the condition in this matrix
2. Read the Severity and Response
3. If CONTINUE: proceed; log any advisory
4. If FREEZE: acquire clean freeze immediately; emit FROZEN signal; halt
5. If ESCALATE: acquire freeze (clean if possible, dirty if not); emit ESCALATING signal; write escalation record; halt until operator logs resolution

There is no "use judgment" step. The matrix is the judgment.
