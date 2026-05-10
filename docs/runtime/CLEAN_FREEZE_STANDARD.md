# CLEAN FREEZE STANDARD
> AccentOS Runtime Doctrine — Freeze Layer  
> Status: DOCTRINE ONLY — No implementation claims.  
> Last revised: 2026-05-10

---

## 0. PURPOSE

A freeze is the unit of cross-session trust. If a freeze is not clean, continuation is not safe. This document defines what "clean" means, how it is verified, and what it enables.

A freeze is not a pause. A pause is informal. A freeze is a **verified atomic snapshot** of packet state that can be independently confirmed by any session resuming the work.

---

## 1. CLEAN-FREEZE ACQUISITION

A freeze is clean only if ALL of the following conditions are met at the moment the freeze record is written:

### 1.1 Work State Conditions

| Condition | Required State |
|---|---|
| In-flight writes | Zero — no artifact is mid-write |
| Pending decisions | Zero — no branch point is unresolved |
| Open escalations | Zero — all escalation signals have been resolved or formally deferred to operator |
| Partial steps | Zero — the current step is either complete or explicitly unwound |
| External calls | Zero outstanding — no async operation is awaiting a response |

**If any condition is not met, freeze acquisition is blocked.** The session must complete, unwind, or escalate the blocking condition before freeze can proceed.

### 1.2 Required Freeze Record Fields

The freeze record must contain, at minimum:

```
packet_id:        [unique packet identifier]
session_id:       [identifier of the session writing this freeze]
freeze_timestamp: [ISO 8601 UTC]
freeze_point:     [named step or artifact hash — the exact point of suspension]
artifact_manifest:
  - path: [artifact path]
    hash: [content hash at time of freeze]
    scope: [in-packet | boundary | shared-read-only]
pending_decisions: [] (must be empty for clean freeze)
escalation_log:   [list of escalations and their resolution status]
success_criterion: [the measurable definition of packet completion]
continuation_constraints:
  - [any constraints a resuming session must respect]
rollback_targets:
  - label: [human-readable label]
    freeze_timestamp: [timestamp of a prior clean freeze]
    artifact_manifest: [manifest at that prior freeze]
operator_grants:  [list of OA grants affecting this packet]
freeze_status:    CLEAN | DIRTY | PARTIAL
```

`freeze_status` must be `CLEAN` for continuation authority to be granted.

### 1.3 Dirty Freeze

A dirty freeze is a freeze record written when work state conditions are not fully met. It is **not** a governance violation to write a dirty freeze — it is the correct response when a session must be interrupted before reaching a clean point. However:

- Dirty freeze does NOT grant continuation authority
- Dirty freeze requires operator resolution before resumption
- The freeze record must explicitly declare `freeze_status: DIRTY` and list all unmet conditions

---

## 2. FREEZE VERIFICATION

Freeze verification is the process a resuming session must complete before exercising continuation authority. It is not optional.

### 2.1 Verification Steps (in order)

**Step 1 — Record Existence**  
Confirm the freeze record exists and is syntactically complete (all required fields present).

**Step 2 — Status Check**  
Confirm `freeze_status: CLEAN`. If `DIRTY` or `PARTIAL`, stop — escalate to operator.

**Step 3 — Artifact Manifest Verification**  
For each artifact in the manifest:
- Confirm the artifact exists at the declared path
- Confirm the content hash matches the freeze record
- Confirm the scope designation is still accurate

If any artifact fails: the freeze cannot be trusted. Write a verification failure record and escalate.

**Step 4 — Packet Boundary Confirmation**  
Confirm the packet boundary has not changed since the freeze was written. If it has changed (new scope, modified success criterion), escalate before proceeding.

**Step 5 — Escalation Log Review**  
Confirm all escalations listed in the freeze record have a resolution status. If any are unresolved, do not continue — await operator resolution.

**Step 6 — Continuation Constraints Review**  
Read all `continuation_constraints`. The resuming session is bound by these constraints for the duration of its execution.

**Step 7 — Verification Declaration**  
Write a verification record to the packet ledger:

```
verification_timestamp: [ISO 8601 UTC]
verifying_session_id:   [session performing verification]
freeze_record_id:       [freeze being verified]
verification_result:    PASS | FAIL
failure_reasons:        [if FAIL — list of failed conditions]
```

Only after `verification_result: PASS` may continuation authority be exercised.

---

## 3. FREEZE-SAFE OPERATIONS

The following operations are defined as freeze-safe — meaning they can be performed without compromising the validity of a prior clean freeze, provided verification has passed.

### 3.1 Freeze-Safe Continuation

A session resuming from a verified clean freeze may:
- Execute steps that come after the declared freeze point
- Write to artifacts designated `in-packet` in the manifest
- Emit status signals
- Acquire a new freeze at any subsequent clean point

A resuming session may NOT:
- Modify artifacts listed in the manifest at their pre-freeze hash without declaring an update
- Override continuation constraints without operator authorization
- Extend the packet boundary

### 3.2 Freeze-Safe Branching

A branch from a clean freeze point is freeze-safe when:
- The branch produces a separate packet with its own packet_id
- The branch freeze record explicitly references the originating freeze_timestamp
- Artifacts shared between branches are designated `shared-read-only` in both manifests
- Neither branch may write to a `shared-read-only` artifact without operator authorization

### 3.3 Freeze-Safe Rollback

Rollback to a prior freeze is freeze-safe when:
- The rollback target is a verified clean freeze (listed in `rollback_targets`)
- All artifacts are restored to the hashes declared in the rollback target's manifest
- A rollback record is written to the packet ledger before artifact restoration begins
- Any work after the rollback target is explicitly voided in the ledger

### 3.4 Freeze-Safe Merge Readiness

A packet is merge-ready (safe to merge into shared state) only when:
- The current freeze is clean and verified
- The success criterion is met and measurable
- No open escalations exist
- No pending decisions exist
- Operator Authority has reviewed and granted merge authorization
- A merge readiness record is written to the packet ledger

**Merge readiness is a state declaration, not an action.** The merge action itself requires explicit operator execution.

---

## 4. FREEZE FAILURE MODES

Understanding failure modes is as important as understanding the happy path.

| Failure Mode | Cause | Response |
|---|---|---|
| Freeze blocked — in-flight writes | Write not completed before freeze attempted | Complete or unwind the write; retry freeze |
| Freeze blocked — pending decision | Branch point unresolved | Make the decision or escalate; retry freeze |
| Dirty freeze — interrupted session | Session terminated before clean state reached | Operator resolves before resumption |
| Verification fail — artifact hash mismatch | Artifact modified outside session scope | Escalate; do not continue |
| Verification fail — record incomplete | Freeze record missing required fields | Treat as dirty freeze; escalate |
| Verification fail — open escalation | Prior escalation unresolved | Await operator resolution |
| Verification fail — packet boundary changed | Scope expanded or success criterion altered | Escalate; re-establish governance before continuing |

---

## 5. FREEZE LIFECYCLE SUMMARY

```
[Work in Progress]
       ↓
[All work-state conditions met?]
  → NO  → [Write DIRTY freeze] → [Escalate to operator]
  → YES → [Write CLEAN freeze record]
             ↓
       [New session begins]
             ↓
       [Freeze Verification — 7 steps]
             ↓
  [FAIL] → [Write verification failure] → [Escalate]
  [PASS] → [Write verification PASS record]
             ↓
       [Continuation Authority granted]
             ↓
       [Execution resumes from freeze_point]
```
