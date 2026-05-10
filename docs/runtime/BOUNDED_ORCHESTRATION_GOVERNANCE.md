# BOUNDED ORCHESTRATION GOVERNANCE
> AccentOS Runtime Doctrine — Governance Layer  
> Status: DOCTRINE ONLY — No implementation claims.  
> Last revised: 2026-05-10

---

## 0. PURPOSE

This document defines the authority model governing bounded execution packets, multi-session orchestration, and operator interaction. It answers one question with precision: **who or what is allowed to authorize which action under which conditions.**

Governance is not a runtime mechanism. It is the doctrine the runtime must satisfy.

---

## 1. AUTHORITY TAXONOMY

Five authority classes are recognized. Each is bounded. None is absolute.

### 1.1 Bounded Execution Authority (BEA)
The authority granted to a single execution session to make progress on a defined work packet.

**Scope:** Within the packet boundary, for the duration of the session.  
**Permitted actions:**
- Read any artifact within the packet scope
- Write to artifacts explicitly within the packet boundary
- Mark steps complete within its own progress ledger
- Emit status signals (ready / frozen / escalating)

**Hard limits — BEA cannot:**
- Extend its own packet boundary
- Authorize its own continuation beyond the declared horizon
- Modify shared artifacts outside packet scope
- Make merge decisions
- Self-escalate to operator authority

### 1.2 Continuation Authority (CA)
The authority to resume a frozen packet in a new session.

**Granted by:** Freeze record that passes Freeze Verification (see CLEAN_FREEZE_STANDARD.md).  
**Scope:** Bounded to the same packet boundary as the originating session.  
**Permitted actions:**
- Resume execution from the verified freeze point
- Inherit all in-progress artifacts as declared in the freeze record
- Emit continuation status signals

**Hard limits — CA cannot:**
- Assume the packet scope has changed
- Inherit decisions not present in the freeze record
- Execute actions that were marked ESCALATE in the freeze record

### 1.3 Escalation Authority (EA)
The authority to halt local execution and transfer a decision to an operator.

**Scope:** Any session, at any time, unconditionally.  
**Permitted actions:**
- Freeze the current session immediately
- Write an escalation record to the packet ledger
- Block continuation until operator resolution is logged

**EA is not optional.** Any session that encounters an escalation trigger (see ESCALATION_DECISION_MATRIX.md) must exercise EA immediately. Deferral is a governance violation.

### 1.4 Rollback Authority (RA)
The authority to revert a packet to a prior verified state.

**Scope:** Only to states covered by verified freeze records or clean checkpoints.  
**Permitted actions:**
- Restore artifact state to a declared rollback target
- Mark all work after the rollback target as void
- Emit rollback completion signal

**Hard limits — RA cannot:**
- Rollback across a merge boundary
- Rollback to a state not covered by a freeze record
- Be exercised by a session that did not originate the packet (without explicit operator grant)

### 1.5 Operator Authority (OA)
The authority held by a human operator. This is the only authority class with no hard ceiling.

**Operator authority supersedes all other authority classes.**  
**Required for:**
- Extending packet boundaries
- Approving merge of a packet into shared state
- Resolving escalation records
- Granting continuation authority across a freeze that failed verification
- Authorizing rollback across a merge boundary
- Retiring a packet

---

## 2. GOVERNANCE BOUNDARIES

### 2.1 What Must NEVER Be Session-Controlled

These decisions are outside the authority of any execution session, regardless of context:

| Decision | Why It Cannot Be Session-Controlled |
|---|---|
| Packet boundary extension | Creates unbounded execution risk |
| Merge into shared/main state | Affects all downstream work |
| Resolution of an open escalation | Requires human judgment by definition |
| Authorization of continuation after a failed freeze | Trust gap cannot be self-resolved |
| Retirement of a packet | Irreversible; must be operator-confirmed |
| Rollback across a merge boundary | Shared-state impact; cascade risk |
| Modification of the governance doctrine itself | Self-referential authority violation |
| Any action tagged OPERATOR-REQUIRED in the escalation matrix | See ESCALATION_DECISION_MATRIX.md |

### 2.2 What Must ALWAYS Escalate

Escalation is mandatory — not advisory — when any of the following are detected:

- **Ambiguous packet boundary**: the session cannot determine what is in scope
- **Conflicting freeze records**: two freeze records exist for the same packet
- **Artifact state mismatch**: the artifact does not match the freeze record at resume
- **Authority violation detected**: any session has attempted an action outside its authority class
- **Entropy threshold exceeded**: see LOW_ENTROPY_EXECUTION_DOCTRINE.md §4
- **Unknown operator intent**: the packet has no clear success criterion
- **Cascade risk detected**: a local action would affect artifacts outside packet scope

### 2.3 What Can Safely Continue Locally

A session may continue without escalation when ALL of the following hold:

- The packet boundary is unambiguous and unchanged
- The freeze record (if resuming) has passed full verification
- No escalation trigger has fired
- All artifacts being written are within packet scope
- Progress is monotonic (no backward steps without RA invocation)
- The success criterion is defined and measurable
- The session is operating within its declared horizon

---

## 3. GOVERNANCE ENFORCEMENT MODEL

Governance is enforced through **doctrine compliance** at the point of session design — not through runtime locks. The responsible party for compliance is the entity designing the session.

### 3.1 Compliance Signal Chain
Every session must emit the following signals to the packet ledger:

```
ACTIVATED    → session begins
EXECUTING    → work is in progress
FROZEN       → clean freeze acquired (with freeze record)
ESCALATING   → escalation trigger fired; awaiting operator
ROLLED_BACK  → RA exercised; artifact state restored
CONTINUED    → CA granted; execution resumed
MERGED       → OA granted merge; packet complete
RETIRED      → OA confirmed retirement
```

Absence of a signal when it is warranted is itself a governance violation.

### 3.2 Authority Conflict Resolution
When two authority claims conflict, resolution order is:

1. Operator Authority (highest)
2. Escalation Authority (always executable; overrides BEA and CA)
3. Rollback Authority (when exercised, suspends BEA)
4. Continuation Authority
5. Bounded Execution Authority (lowest; constrained by all above)

---

## 4. DOCTRINE VERSIONING

This doctrine is versioned. Any change to authority definitions, governance boundaries, or the escalation mandate requires:
- Operator authorization
- A new version entry in this document
- Propagation notice to all active packet ledgers

**Current version:** 1.0.0  
**Next review:** Before any production orchestration is enabled.
