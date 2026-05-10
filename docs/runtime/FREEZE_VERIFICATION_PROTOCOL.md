# FREEZE VERIFICATION PROTOCOL
> AccentOS Runtime Doctrine — Freeze Verification Hardening  
> Status: DOCTRINE ONLY — No implementation claims. No runtime mutation.  
> Depends on: CLEAN_FREEZE_STANDARD.md, GOVERNANCE_EXECUTION_RULES.md  
> Last revised: 2026-05-10

---

## 0. PURPOSE

CLEAN_FREEZE_STANDARD.md defines what a clean freeze is and what verification must cover. This document defines **how verification is performed operationally** — the exact sequence, the pass/fail criteria for each step, and what distinguishes valid verification from verification theater.

The standard is the law. This protocol is the procedure. Both are required.

A verification that follows the procedure produces a result that can be trusted. A verification that skips, abbreviates, or assumes steps produces a result that has the appearance of trust without the substance.

---

## 1. VERIFICATION VALIDITY REQUIREMENTS

Before the 7-step protocol begins, three preconditions must hold. If any precondition is not met, do not begin verification — escalate.

| Precondition | Check | Failure Response |
|---|---|---|
| A freeze record exists | Locate the freeze record in the packet ledger by freeze_record_id | If absent: ESCALATE — freeze record missing |
| The freeze record has a declared freeze_status | Read the `freeze_status` field | If absent: treat as DIRTY; ESCALATE |
| The freeze_status is CLEAN | Confirm `freeze_status: CLEAN` | If DIRTY or PARTIAL: do not proceed — ESCALATE to operator |

**Only `freeze_status: CLEAN` records are eligible for the 7-step protocol.**  
A DIRTY freeze record does not become eligible through optimistic interpretation or operator familiarity. It requires explicit operator resolution with a state change record.

---

## 2. THE SEVEN-STEP VERIFICATION PROTOCOL

Steps are performed in sequence. Each step has a pass criterion and a failure criterion. Steps are not optional and cannot be reordered.

**Recording requirement:** Each step result is written to the verification record as it is completed — not after all steps are done. This ensures that an interrupted verification can be resumed from the last completed step, and that the verification record reflects actual sequence rather than reconstructed sequence.

---

### STEP 1 — RECORD COMPLETENESS

**Action:** Read the freeze record and confirm all required fields are present.

**Required fields:**
```
packet_id
session_id
freeze_timestamp
freeze_point
artifact_manifest (with ≥ 1 entry)
pending_decisions (present, even if empty array)
escalation_log (present, even if empty array)
success_criterion
continuation_constraints (present, even if empty array)
rollback_targets (present, even if empty array)
operator_grants (present, even if empty array)
freeze_status
```

**Pass criterion:** All fields present. `pending_decisions` is an empty array (no open decisions). `escalation_log` has no entries with unresolved status.

**Failure criterion:** Any field absent. Any entry in `pending_decisions`. Any escalation in `escalation_log` without a resolution record.

**Failure response:** ESCALATE. Document which fields are absent or which decisions/escalations are unresolved. Do not proceed to Step 2.

**Theater detection:** A record that is syntactically complete but has `pending_decisions: []` and `escalation_log: []` when the prior session's ledger shows open decisions or logged escalations is freeze theater. Flag it.

---

### STEP 2 — FREEZE STATUS CONFIRMATION

**Action:** Confirm `freeze_status: CLEAN` is present and is not contradicted elsewhere in the freeze record or packet ledger.

**Pass criterion:** `freeze_status: CLEAN` is present. The packet ledger shows no ESCALATING or UNSAFE signals after the freeze_timestamp. No other freeze record for this packet has the same freeze_timestamp.

**Failure criterion:**
- `freeze_status` is not CLEAN
- An ESCALATING signal in the packet ledger post-dates the freeze_timestamp (session escalated after claiming a clean freeze)
- Two freeze records share the same freeze_timestamp (duplicate freeze — ledger conflict)

**Failure response:** ESCALATE. If two freeze records share a timestamp, this is a Severity 4 unsafe state. If an ESCALATING signal post-dates the freeze, the freeze claim is invalid.

---

### STEP 3 — ARTIFACT MANIFEST VERIFICATION

**Action:** For each entry in the artifact_manifest, perform three checks: existence, hash match, scope validity.

This is the step most likely to catch real problems. It must not be abbreviated.

**Sub-step 3a — Existence:**  
Confirm each artifact listed in the manifest exists at the declared path.

**Sub-step 3b — Hash verification:**  
Compute or retrieve the current content hash of each artifact. Compare against the hash declared in the manifest entry.

This step cannot be performed by assumption. "The file hasn't changed" is not a hash comparison. Either the hash matches or it does not. There is no third option.

**Sub-step 3c — Scope designation validity:**  
Confirm the scope designation (`in-packet`, `boundary`, or `shared-read-only`) is still accurate given current packet state.

**Pass criterion:** All artifacts exist. All artifact hashes match. All scope designations are still valid.

**Failure criteria and responses:**

| Failure | Severity | Response |
|---|---|---|
| Artifact does not exist at declared path | 4 | ESCALATE — artifact missing |
| Artifact hash mismatch | 4 | ESCALATE — trust gap; cannot continue |
| Scope designation invalid (artifact now outside packet) | 3 | ESCALATE — boundary has shifted |
| Manifest is empty (no artifacts listed) | 3 | ESCALATE — cannot verify what was frozen |

**Theater detection:** A verification record that lists Step 3 as PASS without hash values in the record is verification theater. Hash values must appear in the verification record to demonstrate the comparison was performed.

**Verification record format for Step 3:**
```
step_3_result: PASS | FAIL
artifacts_checked: [count]
artifacts_with_hash_match: [count]
hash_mismatches: [] | [list of paths with mismatch]
missing_artifacts: [] | [list of paths not found]
scope_violations: [] | [list of paths with invalid scope]
```

---

### STEP 4 — PACKET BOUNDARY CONFIRMATION

**Action:** Compare the packet boundary as declared in the freeze record against the current packet definition.

**Pass criterion:** The packet boundary in the freeze record matches the current packet definition exactly. The success criterion is unchanged. The scope of authorized artifacts has not expanded.

**Failure criteria:**
- Packet boundary in the freeze record differs from the current packet definition
- Success criterion has been modified since the freeze was written
- New artifacts appear in the current packet scope that were not in the freeze record's manifest (suggests scope was expanded after freeze)

**Failure response:** ESCALATE. Boundary drift is a Severity 3 condition. Do not proceed.

**Note on minor differences:** If the current packet definition has a trivial formatting change from the freeze record (e.g., whitespace, capitalization) but is semantically identical, this is not a boundary failure — but it must be logged as an advisory. If there is any doubt about whether a difference is semantic, treat it as semantic and escalate.

---

### STEP 5 — ESCALATION LOG REVIEW

**Action:** Read every entry in the freeze record's `escalation_log`. For each entry, confirm a resolution record exists and specifies operator action taken.

**Pass criterion:** `escalation_log` is empty, OR every escalation has a resolution record with a non-null `resolution_action` and a resolution timestamp that precedes the freeze_timestamp.

**Failure criteria:**
- Any escalation with `resolution_status: unresolved`
- Any escalation with a resolution timestamp that is *after* the freeze_timestamp (the escalation was resolved after the freeze was written — resolution may not have been incorporated)
- Any escalation with a resolution record that says "operator aware" without specifying action taken

**Failure response:** ESCALATE. An unresolved escalation in a freeze record means the freeze is not actually clean — it is a dirty freeze misclassified.

**Theater detection:** Resolution records that say "acknowledged" or "noted" without a specific action are escalation theater. Resolution requires an action, not an acknowledgment.

---

### STEP 6 — CONTINUATION CONSTRAINTS REVIEW

**Action:** Read every entry in `continuation_constraints`. For each constraint, confirm it is satisfiable in the current context and that the resuming session is prepared to honor it.

**Pass criterion:** All continuation constraints can be honored. No constraint requires an authority the resuming session does not have. No constraint requires an artifact the resuming session cannot access.

**Failure criteria:**
- A continuation constraint requires OA for an action the session plans to take, and no OA grant is present
- A continuation constraint references an artifact that no longer exists
- A continuation constraint is contradicted by current packet state

**Failure response:** ESCALATE if a constraint cannot be honored. Log advisory if a constraint references a stale artifact but the constraint itself is still satisfiable.

**Required behavior:** The resuming session must explicitly acknowledge each continuation constraint in its CONTINUED signal record. Not as a formality — as a binding commitment. A session that acknowledges a constraint and then violates it has committed an authority violation.

---

### STEP 7 — VERIFICATION DECLARATION

**Action:** Write the complete verification record to the packet ledger before emitting the CONTINUED signal.

**Verification record format:**
```
verification_id:        [unique within packet]
verification_timestamp: [ISO 8601 UTC]
verifying_session_id:   [session performing verification]
freeze_record_id:       [freeze record being verified]
step_1_result:          PASS | FAIL
step_2_result:          PASS | FAIL
step_3_result:          PASS | FAIL
  artifacts_checked:    [count]
  hash_mismatches:      [] | [list]
  missing_artifacts:    [] | [list]
step_4_result:          PASS | FAIL
step_5_result:          PASS | FAIL
step_6_result:          PASS | FAIL
constraints_acknowledged: [list of constraint ids]
verification_result:    PASS | FAIL
failure_reasons:        [] | [list — required if FAIL]
```

**Pass criterion:** All 6 prior steps produced PASS results. `verification_result: PASS`.

**Failure criterion:** Any prior step produced FAIL. `verification_result: FAIL`. All failure reasons documented.

**After PASS:** The CONTINUED signal may be emitted. Execution may begin. Authority class is assessed fresh (see GOVERNANCE_EXECUTION_RULES.md §2).

**After FAIL:** ESCALATE immediately. Do not emit CONTINUED signal. Do not begin execution. Write escalation record referencing this verification_id.

---

## 3. WHAT INVALIDATES A FREEZE

A freeze that has been written and declared CLEAN can be subsequently invalidated. Invalidation means the freeze record is no longer trustworthy as a basis for continuation — it must be treated as dirty.

| Invalidating Event | Trigger | Required Response |
|---|---|---|
| Artifact hash mismatch found at Step 3 | An artifact's current hash doesn't match the manifest | ESCALATE; freeze is invalid |
| Escalation resolution found to be theater | Resolution record is not substantive | ESCALATE; treat all downstream work as built on invalid base |
| Packet boundary changed after freeze | Scope expanded or success criterion altered | ESCALATE; freeze describes a different packet than the current one |
| A second clean freeze for the same packet state is found | Ledger conflict | ESCALATE; canonical state is unknowable |
| An artifact in the manifest is discovered to have been written outside the session that produced the freeze | Unauthorized write between freeze and verification | ESCALATE; trust gap |
| The session that produced the freeze is found to have continued executing after writing the freeze record | Freeze was written mid-stream, not at a stop point | Freeze theater; escalate; all work after the freeze timestamp is suspect |
| Operator explicitly invalidates the freeze | Operator has information not available to the session | Follow operator instruction; do not re-validate independently |

**Invalidation is permanent.** A freeze that has been invalidated cannot be re-validated by a passing verification of a subsequent freeze. The invalidated freeze simply cannot be used as a rollback target or continuation basis.

---

## 4. FREEZE VALIDITY STATES — FULL MODEL

```
                    ┌─────────────────┐
                    │  FREEZE WRITTEN  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     freeze_status: CLEAN          freeze_status: DIRTY
              │                             │
              ▼                             ▼
    [Eligible for 7-step          [Not eligible; operator
     verification protocol]        resolution required]
              │                             │
    [Step 3: hash check]         [Operator logs resolution]
              │                             │
         ┌────┴────┐                        │
         │         │                        ▼
       PASS      FAIL              [Operator re-classifies
         │         │                to CLEAN if warranted]
         │         ▼                        │
         │     [ESCALATE]                   │
         │     [Invalidated]                │
         ▼                                  ▼
   [Steps 4–7]                    [Re-enters 7-step
         │                         protocol from Step 1]
    ┌────┴────┐
    │         │
  PASS      FAIL
    │         │
    ▼         ▼
[CONTINUED] [ESCALATE]
[signal]    [Invalidated]
```

---

## 5. FREEZE VERIFICATION ANTI-PATTERNS

These are the specific behaviors that produce verification theater. Each is named so it can be recognized.

**Anti-pattern: The Retrospective Hash**  
Step 3 is performed after continuation has already begun. Hash values are "confirmed" based on the assumption that nothing changed. Detection: verification record timestamp is close to or after the first execution step timestamp.

**Anti-pattern: The Trusting Scan**  
Step 3 confirms that files exist but does not compare hash values. Detection: verification record for Step 3 lacks hash values or artifact count.

**Anti-pattern: The Rubber Stamp Step 6**  
Continuation constraints are listed as acknowledged without the session having read them. Detection: constraints_acknowledged list in the verification record matches the freeze record's continuation_constraints list exactly and immediately (no pause for review).

**Anti-pattern: The Optimistic Step 5**  
Escalation log review finds an escalation with a vague resolution and marks Step 5 PASS anyway because "it seems resolved." Detection: escalation resolution records that lack a specific action field.

**Anti-pattern: The Abbreviated Record**  
Step 7 verification record is written without per-step results. "Verification: PASS" with no step breakdown. Detection: verification record missing step_N_result fields.

**Anti-pattern: The Pre-Written Verification**  
Verification record is written before verification steps are performed (template filled in with expected PASS results). Detection: verification record timestamp precedes the earliest possible time the artifact checks could have been performed.

Each of these anti-patterns converts verification from a safety gate into a formality. Any verification record exhibiting these patterns must be treated as verification theater — which invalidates the freeze it is attached to.
