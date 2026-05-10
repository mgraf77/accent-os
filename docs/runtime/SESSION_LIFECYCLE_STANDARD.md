# SESSION LIFECYCLE STANDARD
> AccentOS Runtime Doctrine — Session Layer  
> Status: DOCTRINE ONLY — No implementation claims.  
> Last revised: 2026-05-10

---

## 0. PURPOSE

A session is the atomic unit of execution. Every session has a defined beginning, a defined end, and a defined set of valid states between them. This standard makes session behavior predictable — meaning a governance layer, an operator, or a resuming session can look at any session's ledger record and immediately understand what state it is in and what is valid next.

**The core guarantee this standard provides:** No session exits without a freeze record or a retirement record. The packet never goes dark.

---

## 1. SESSION STATES

Eight states are defined. Every session occupies exactly one state at any moment.

```
ACTIVATED → EXECUTING → FROZEN
                      → ESCALATING
                      → ROLLED_BACK → EXECUTING
           → CONTINUED → EXECUTING
                       → FROZEN
                       → ESCALATING
FROZEN → CONTINUED
       → (awaiting operator)
ESCALATING → (awaiting operator resolution)
EXECUTING → MERGED (only via OA)
MERGED → RETIRED
```

| State | Description |
|---|---|
| ACTIVATED | Session has started; freeze verification (if resuming) has not yet completed |
| EXECUTING | Session is actively making progress on the packet |
| FROZEN | Clean or dirty freeze has been acquired; session is halted |
| ESCALATING | Escalation trigger fired; session is halted awaiting operator |
| ROLLED_BACK | Rollback authority exercised; artifacts restored to rollback target |
| CONTINUED | New session has passed freeze verification; continuation authority granted |
| MERGED | Packet artifacts merged into shared state by operator authority |
| RETIRED | Packet is complete and closed; no further execution authorized |

---

## 2. PHASE DEFINITIONS

### 2.1 ACTIVATION

**Entry condition:** A new session begins on a packet.

**Required actions:**
1. Read the packet ledger — identify the most recent signal
2. If prior signal is FROZEN: proceed to freeze verification before EXECUTING
3. If prior signal is ESCALATING: halt immediately; do not proceed to EXECUTING; await operator resolution
4. If prior signal is MERGED or RETIRED: halt; packet is closed
5. If no prior signal (first session on packet): verify packet definition is complete (boundary, success criterion, initial manifest)
6. Emit ACTIVATED signal to packet ledger with session_id and timestamp

**Exit condition:** Freeze verification complete (if resuming) and first step declared.

**Low-entropy requirement:** Do not begin executing before ACTIVATED is logged. Do not skip step 2–4. Reading the ledger is not optional.

---

### 2.2 EXECUTION

**Entry condition:** ACTIVATED state complete; all activation checks passed.

**Permitted actions:**
- Execute steps within packet scope
- Write to in-manifest artifacts
- Make decisions within Bounded Execution Authority
- Emit advisory signals
- Log decisions at point of decision

**Prohibited actions during EXECUTING:**
- Writing to artifacts outside packet scope
- Making decisions outside BEA
- Skipping step logging
- Treating an escalation trigger as advisory

**Exit conditions:**
- Clean freeze acquired → FROZEN
- Escalation trigger fired → ESCALATING
- Rollback invoked → ROLLED_BACK
- Success criterion met AND OA merge grant received → MERGED (rare direct path)

**Low-entropy requirement:** Every step that completes must be logged before the next step begins. No batch logging.

---

### 2.3 CONTINUATION

**Entry condition:** A session is picking up a FROZEN packet.

**Required actions:**
1. Read the freeze record
2. Execute all 7 freeze verification steps (per CLEAN_FREEZE_STANDARD.md)
3. If verification FAILS: emit ESCALATING; halt
4. If verification PASSES: emit CONTINUED signal; proceed to EXECUTING

**The CONTINUED state is brief.** It is the window between verification PASS and the first execution step. It is logged separately so that the ledger reflects the precise moment continuation authority was granted.

**Low-entropy requirement:** Never skip verification. Never begin execution before CONTINUED is logged.

---

### 2.4 ESCALATION

**Entry condition:** An escalation trigger fires (per ESCALATION_DECISION_MATRIX.md).

**Required actions:**
1. Immediately halt execution (do not complete the current step if it involves a decision or artifact write)
2. Acquire a freeze — clean if work state conditions are met; dirty if not
3. Write escalation record to packet ledger:
   ```
   escalation_timestamp: [ISO 8601 UTC]
   session_id: [session that detected the trigger]
   trigger: [the specific condition from the escalation matrix]
   severity: [1–4]
   freeze_type: CLEAN | DIRTY
   freeze_record_id: [id of the freeze written]
   context: [concise description of the state at time of trigger]
   operator_action_required: [specific question or decision needed]
   ```
4. Emit ESCALATING signal
5. Halt — no further execution

**Resolution:** An operator reads the escalation record, takes the required action, and logs a resolution record. Only after resolution is logged may the packet advance to CONTINUED or another state.

**Low-entropy requirement:** The escalation record must be specific enough for a new operator (unfamiliar with this session) to understand the situation and make a decision without asking follow-up questions.

---

### 2.5 FREEZE

**Entry condition:** Session has acquired a freeze (clean or dirty).

**What freeze means:** The session has halted. No further execution is authorized until either operator resolution (if dirty or escalating) or continuation authority is granted (if clean).

**Freeze record is written before FROZEN signal is emitted.** Never emit FROZEN without a freeze record.

**During FROZEN state:**
- No artifact writes
- No decisions
- No execution
- The freeze record stands as the canonical state of the packet

**Exit conditions:**
- Clean freeze + new session begins → CONTINUED (after verification)
- Dirty freeze or open escalation + operator resolves → operator logs resolution → CONTINUED or other state per operator instruction
- Operator decides to retire the packet → RETIRED

---

### 2.6 RESUME

Resume is not a separate state — it is the transition from FROZEN to CONTINUED. The CLEAN_FREEZE_STANDARD.md freeze verification is the resume protocol. "Resume" without verification is not a resume; it is an unauthorized continuation.

---

### 2.7 MERGE

**Entry condition:** Packet is in merge-ready state; OA has been granted.

**Required actions:**
1. Confirm freeze is clean and verified
2. Confirm success criterion is met
3. Confirm OA merge grant is logged in packet ledger
4. Execute merge (artifacts moved/applied to shared state)
5. Write merge record to packet ledger:
   ```
   merge_timestamp: [ISO 8601 UTC]
   merged_by: [operator identifier]
   packet_id: [packet being merged]
   freeze_record_id: [freeze from which merge was executed]
   artifacts_merged: [list of artifacts and their final states]
   ```
6. Emit MERGED signal

**MERGED is a terminal state for the execution lifecycle.** After MERGED, the packet moves to RETIRED.

**Low-entropy requirement:** Do not execute merge if any escalation is unresolved. Do not execute merge without OA grant in the ledger. Both are governance violations.

---

### 2.8 RETIREMENT

**Entry condition:** Packet is MERGED and operator confirms retirement, OR operator decides to retire without merge (e.g., packet abandoned or superseded).

**Required actions:**
1. Write retirement record:
   ```
   retirement_timestamp: [ISO 8601 UTC]
   retired_by: [operator identifier]
   retirement_reason: MERGED | ABANDONED | SUPERSEDED | OTHER
   final_state: [description of packet state at retirement]
   ```
2. Emit RETIRED signal
3. Archive packet ledger

**RETIRED is an absolute terminal state.** No execution of any kind is authorized on a RETIRED packet.

---

## 3. SIGNAL CHAIN INVARIANTS

These invariants must hold in every valid packet ledger:

1. Every packet has exactly one ACTIVATED signal
2. EXECUTING may appear multiple times (once per active session)
3. FROZEN always follows EXECUTING or ESCALATING
4. CONTINUED always follows FROZEN (with verification pass between them)
5. ESCALATING always follows EXECUTING or CONTINUED
6. MERGED appears exactly once and only after OA grant
7. RETIRED appears exactly once and only after MERGED (or explicit abandonment)
8. No signal appears after RETIRED
9. No CONTINUED signal without a preceding FROZEN signal with a CLEAN freeze_status

A packet ledger that violates any invariant is in UNSAFE STATE.

---

## 4. MAKING SESSION BEHAVIOR PREDICTABLE

Predictability is the goal. A session is predictable when an external observer can, at any point:

1. Name the current state from the signal chain
2. Name the last action taken from the ledger
3. Name the next valid action from the state machine
4. Name what would trigger an escalation from the escalation matrix
5. Reconstruct the artifact state from the manifest

A session that fails any of these five checks is producing entropy. The remedy is to freeze immediately, log the gap, and escalate.

**Predictability is not a nice-to-have.** It is the operational property that makes multi-session, bounded execution viable at all. Without it, each session handoff amplifies uncertainty rather than transmitting progress.
