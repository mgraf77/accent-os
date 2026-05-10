# GOVERNANCE EXECUTION RULES
> AccentOS Runtime Doctrine — Execution Hardening Layer  
> Status: DOCTRINE ONLY — No implementation claims. No runtime mutation.  
> Depends on: BOUNDED_ORCHESTRATION_GOVERNANCE.md, ESCALATION_DECISION_MATRIX.md, LOW_ENTROPY_EXECUTION_DOCTRINE.md  
> Last revised: 2026-05-10

---

## 0. PURPOSE

This document converts governance doctrine into **operational execution discipline** — the rules that govern moment-to-moment session behavior, not just the theory behind them.

Doctrine defines what is correct. Execution rules define what a session must actually do, in order, when conditions arise. The gap between doctrine and execution rules is where governance theater lives.

This document closes that gap.

---

## 1. GOVERNANCE THEATER — DEFINITION AND TAXONOMY

### 1.1 Definition

**Governance theater** is the condition in which documentation accurately describes a safe process, but operational behavior systematically violates it — while maintaining the appearance of compliance.

Governance theater is worse than absent governance. Absent governance is visible. Governance theater creates false confidence: operators believe safety controls are active when they are not. The documentation becomes evidence of safety at exactly the moment it has stopped providing it.

Governance theater is not caused by bad actors. It is caused by the ordinary pressure of execution — deadlines, familiarity, efficiency incentives — gradually eroding the friction that governance intentionally introduces. Each individual erosion is locally justifiable. The aggregate is structural unsafety.

### 1.2 Theater Taxonomy

The following are the primary forms of governance theater. Each has a name because naming it makes it recognizable in the moment it occurs.

---

**FREEZE THEATER**  
The freeze record exists and is complete on paper, but the work-state conditions for a clean freeze were not actually met at the time of writing. The record declares `freeze_status: CLEAN` because that is the expected status — not because the conditions were verified.

*Signature behavior:* Freeze records written with the same timestamp as the last execution step. Work-state conditions section filled in as a formality rather than verified.

*Why it happens:* Freezing feels interruptive. Writing the record feels like completing the freeze. The distinction between "the record is written" and "the freeze is clean" collapses.

*Consequence:* Verification of this freeze will pass (the record is syntactically complete). But the state it describes may not be the actual state. Continuation builds on an unverified foundation that appears verified.

---

**ESCALATION THEATER**  
The escalation record is written. The ESCALATING signal is emitted. But the session does not actually halt — it continues executing while nominally "awaiting operator resolution."

*Signature behavior:* Escalation record written, followed immediately by execution steps in the same session. Operator resolution record appears after the fact, backdated or vague.

*Why it happens:* The session knows what the operator will likely say. Writing the escalation record feels like satisfying the requirement; continuing feels like being productive.

*Consequence:* The operator's decision is made after the fact, on a situation the session has already resolved. The escalation mechanism has been converted from a decision gate into a notification mechanism. Operator authority over that decision is retroactively voided.

---

**VERIFICATION THEATER**  
The freeze verification steps are listed as complete, but the artifact hash verification (Step 3) was not actually performed — or was performed superficially (file exists, not hash-matched).

*Signature behavior:* Verification records created rapidly. Step 3 results show no discrepancies across multiple consecutive verifications (statistically unlikely unless hash checking is not actually occurring).

*Why it happens:* Hash verification is mechanical and feels redundant when artifacts "obviously haven't changed." The step is checked off because the expected outcome is assumed rather than confirmed.

*Consequence:* The one step most likely to catch real problems — artifact modification outside session scope — is neutralized. Continuation after verification theater is identical to continuation without verification.

---

**AUTHORITY THEATER**  
An OA grant is cited in the ledger, but the grant is vague, retroactive, or covers a different action than the one being taken. The grant is present as a compliance marker, not as a specific authorization.

*Signature behavior:* OA grant records that say "operator approves continuation" without specifying the freeze record, packet_id, or specific action. Grant records with timestamps after the action they purportedly authorize.

*Why it happens:* Operators trust the execution sessions. Operators grant authority broadly to reduce friction. Sessions cite broad grants as specific authorization.

*Consequence:* The OA requirement becomes a documentation step rather than an authority transfer. Operator authority is present in the record while being absent from the actual decision.

---

**RELAY THEATER**  
Relay notes are written and present in the ledger, but they describe what the author intended to convey rather than the actual current state. The resuming session reads them as verified state description.

*Signature behavior:* Relay notes that describe planned next steps accurately but whose artifact state descriptions don't match the actual manifest. Relay notes written before the final execution steps of the outgoing session were complete.

*Why it happens:* Relay notes are written while work is still in progress, then not updated before freeze. The author knows the final state intuitively; writing it down accurately feels redundant.

*Consequence:* The resuming session builds a mental model from relay notes that diverges from actual artifact state. Decisions are made on incorrect context. Verification is still technically passed (freeze record is accurate) but the relay context is wrong.

---

### 1.3 Governance Theater Detection

Governance theater is detectable through **behavioral signatures**, not through document audits alone. A document audit only confirms the record exists — it cannot confirm the behavior that produced it.

Behavioral detection requires asking: **does the timing and content of governance records match the behavior they claim to reflect?**

| Theater Type | Behavioral Signature | Detection Test |
|---|---|---|
| Freeze theater | Freeze record timestamp = last execution step timestamp | Are work-state conditions verifiable from record alone? |
| Escalation theater | Execution steps follow ESCALATING signal | Did execution stop? When did it resume? Was operator resolution logged first? |
| Verification theater | No discrepancies found across many verifications | Are hash values present in verification records? |
| Authority theater | OA grants are broad, retroactive, or undated | Does the grant specify: packet_id, action, freeze_id, scope? |
| Relay theater | Relay note timestamps precede final execution steps | Do relay note artifact descriptions match the freeze manifest? |

---

## 2. BOUNDED EXECUTION AUTHORITY CLASSES

Four execution authority classes govern the operational posture of any session at any moment. Unlike the five-class authority taxonomy in BOUNDED_ORCHESTRATION_GOVERNANCE.md (which defines *who* has authority), these four classes define *how much authority is active* given current conditions.

A session's authority class is not fixed for its duration. It changes as conditions change. A session may begin in GO and transition to HALT within the same execution window.

---

### CLASS: GO

**Definition:** Full execution authority is active. All governance conditions are met. The session may proceed at normal execution pace.

**Entry conditions — ALL must hold:**
- Packet boundary unambiguous and unchanged
- Success criterion defined and measurable
- Freeze record verified (if resuming) — PASS recorded
- All continuation constraints satisfied
- No escalation triggers active
- Entropy metrics: all GREEN (per LOW_ENTROPY_EXECUTION_DOCTRINE.md §4.1)
- Last clean freeze: within current session or prior session (≤ 1 relay)
- No open escalations on this packet

**Permitted execution behaviors:**
- Execute steps at normal pace
- Make decisions within BEA scope without pre-logging
- Write to in-manifest artifacts
- Plan next 2–3 steps ahead

**Required behaviors (even in GO):**
- Log each decision at point of decision (not batched)
- Update ledger at step completion
- Monitor entropy metrics — any metric moving to YELLOW triggers CLASS: CAUTION immediately

**Does not permit:**
- Extending packet scope
- Skipping freeze verification at next relay
- Treating GO as permanent — it is a condition, not a status

---

### CLASS: CAUTION

**Definition:** Execution continues, but with heightened discipline and compressed freeze horizons. Something has moved outside nominal parameters. Not yet dangerous — but trending.

**Entry conditions — any ONE triggers CAUTION:**
- One entropy metric in YELLOW range
- Advisory signal logged in current session
- Session count since last clean freeze = 2
- Minor packet boundary ambiguity (logged, locally resolvable)
- Relay notes have a noted discrepancy (resolved but logged)
- Prior session ended in dirty freeze that was operator-resolved

**Permitted execution behaviors:**
- Execute steps one at a time (no multi-step planning)
- Write to in-manifest artifacts
- Make decisions within BEA scope

**Required behaviors in CAUTION:**
- Log every decision immediately (stricter than GO)
- Acquire clean freeze every 3 steps maximum (compressed horizon)
- Write CAUTION advisory to packet ledger on entry
- Re-evaluate authority class after each freeze

**Transitions:**
- Any additional YELLOW metric → re-evaluate; 3 YELLOWs simultaneously = CLASS: CRAWL
- Any RED metric → CLASS: CRAWL immediately
- All metrics return to GREEN + freeze acquired → CLASS: GO

---

### CLASS: CRAWL

**Definition:** Execution authority is severely restricted. Significant entropy or governance risk is present. Execution continues only one step at a time, with a freeze after every single step. Operator has been notified.

**Entry conditions — any ONE triggers CRAWL:**
- One entropy metric in RED range
- Three entropy metrics in YELLOW simultaneously
- Retry loop detected (same step failed twice)
- Session count since last clean freeze = 3
- Relay integrity concern (artifact state uncertain but not confirmed mismatch)
- Continuation constraint near-violation detected

**Permitted execution behaviors:**
- Execute exactly ONE step
- Acquire clean freeze
- Log the step result
- Evaluate whether to proceed or escalate

**A CRAWL session never executes two steps without a freeze between them.**

**Required behaviors in CRAWL:**
- Write CLASS: CRAWL entry to packet ledger on transition
- Notify operator (log notification record — operator response not required to continue single steps)
- After each step + freeze: re-evaluate conditions; any worsening → CLASS: HALT
- Every step in CRAWL mode is individually logged with: step taken, artifact state before, artifact state after, entropy metrics at time of step

**Transitions:**
- Any RED metric worsens, or new RED metric appears → CLASS: HALT immediately
- All RED metrics resolve to YELLOW + operator acknowledgment received → CLASS: CAUTION
- Entropy clears completely after freeze + operator confirms → CLASS: GO

**CRAWL is not stable.** It is a temporary authority class for navigating out of a degraded state. Sessions that remain in CRAWL for more than 3 steps without improving should transition to HALT.

---

### CLASS: HALT

**Definition:** No execution authority. The session has encountered conditions that make continued execution unsafe. All action stops. The packet is frozen (clean if possible, dirty if not) and control transfers to operator.

**Entry conditions — any ONE triggers HALT:**
- Any entropy metric at RED and worsening
- Any Severity 3 or 4 trigger from the escalation matrix
- Artifact hash mismatch at verification
- Artifact written outside packet scope (detected)
- Session has been in CRAWL for 3+ steps without improvement
- Conflicting freeze records detected
- Open escalation with no operator response for > 96 hours
- Any governance theater pattern confirmed (not suspected — confirmed)
- Authority violation detected (any class)
- Unsafe state declared in packet ledger

**Required behavior in HALT:**
1. Stop execution immediately — do not complete the current step if it involves a write or decision
2. Acquire freeze:
   - If work-state conditions are met: CLEAN freeze
   - If not: DIRTY freeze — document all unmet conditions
3. Write CLASS: HALT record to packet ledger with:
   - Trigger condition (specific, not general)
   - Authority class at time of halt
   - Entropy metric values at time of halt
   - Freeze type acquired
   - Specific operator action required
4. Emit ESCALATING signal
5. Do not resume until operator logs resolution

**HALT is not a failure state. It is a correct response to a real condition.** A session that reaches HALT and follows protocol correctly has performed governance well. A session that should have reached HALT and didn't has failed governance regardless of what the outcome was.

**What HALT does not mean:**
- The packet is abandoned
- The work done so far is void
- The session failed

**What HALT does mean:**
- Local execution authority has reached its limit
- Operator authority is required
- The freeze record is the canonical state until operator resolves

---

### 2.1 Authority Class Transition Map

```
            ┌─────────────────────────────────────────┐
            │                                         │
   ┌──────► GO ◄──────────────────┐                  │
   │         │                    │                  │
   │         │ 1 metric YELLOW    │ all GREEN        │
   │         ▼                    │ + freeze         │
   │      CAUTION ────────────────┘                  │
   │         │                                       │
   │         │ 1 metric RED                          │
   │         │ OR 3 metrics YELLOW                   │
   │         ▼                                       │
   │       CRAWL ──────────────── operator ack ─────►│
   │         │                   + all RED → YELLOW   
   │         │ any RED worsens                       
   │         │ OR 3+ steps no improvement            
   │         ▼                                       
   └──────  HALT  ──────────────── operator resolves ─►
```

---

## 3. EXECUTION MUST STOP — HARD STOPS

These are the conditions under which execution authority terminates completely, immediately, and without exception. No authority class permits continued execution when a hard stop condition is present.

| Hard Stop Condition | Why Non-Negotiable |
|---|---|
| Artifact written outside packet scope | Trust boundary violated; all subsequent work is suspect |
| Continuation from unverified freeze | Foundation is invalid; all work built on it is invalid |
| Conflicting freeze records for same packet | Canonical state is unknowable; no safe basis for action |
| Open escalation — session continues anyway | Operator authority actively bypassed |
| Governance theater pattern confirmed | Safety controls are inactive; documentation is fraudulent |
| Unsafe state declared | By definition; no local resolution path exists |
| Session count since clean freeze ≥ 4 | Cross-session coherence cannot be maintained |

**Hard stops are not escalation triggers. They are execution terminators.** The response is HALT, not CAUTION or CRAWL.

---

## 4. VALID EXECUTION — DECISION LOGGING STANDARD

Decisions made during execution are governance-valid only when logged at the point of decision. Retroactive logging is governance theater (see §1.2, Authority Theater variant).

A valid decision log entry contains:

```
decision_id:        [unique within packet]
session_id:         [session making the decision]
timestamp:          [ISO 8601 UTC — must be ≤ 60 seconds after decision point]
decision:           [what was decided — specific, not general]
authority_class:    [GO | CAUTION | CRAWL]
alternatives_considered: [if applicable — what other paths existed]
rationale:          [why this decision and not alternatives]
artifacts_affected: [which artifacts this decision touches]
reversibility:      [reversible | requires-RA | requires-OA]
```

Decisions with `reversibility: requires-OA` must have an OA grant record before the decision can be acted on.

Decisions with `reversibility: requires-RA` must have a rollback_target in the current freeze record before execution proceeds.

---

## 5. WHEN RELAY CHAINS BECOME UNSAFE

A relay chain is the sequence of freeze → verify → continue → freeze across multiple sessions. A relay chain is safe as long as each link is a verified clean freeze.

**A relay chain becomes unsafe when any of the following is true:**

| Condition | Unsafe Because |
|---|---|
| Any freeze in the chain was dirty (unresolved) | The chain has an unverified link; all subsequent links inherit the gap |
| Verification was skipped or theater at any link | The chain's integrity cannot be confirmed from any point forward |
| Relay notes diverge from freeze manifest at any link | Resuming sessions have operated on incorrect context |
| An escalation in the chain was resolved without operator record | A decision was made without proper authority; subsequent work built on an unauthorized foundation |
| Session count exceeds 4 without a verifiable clean freeze | The chain is too long to trace reliably |
| An artifact modified in any link wasn't in the manifest of that link | Scope has drifted across sessions without governance |

**When a relay chain is deemed unsafe:** do not attempt to continue from the most recent link. Trace back to the last verifiably clean freeze. That is the rollback target. Escalate to operator with the full chain trace.

---

## 6. WHEN BRANCHES MUST HARD-FREEZE

A branch must immediately acquire a clean freeze (not dirty, not deferred) when any of the following occurs:

| Condition | Rationale |
|---|---|
| Main packet reaches a merge-ready state while branch is active | Pre-merge divergence must be captured before merge alters shared state |
| Shared-read-only artifact in the branch manifest is modified by main packet | Branch's inherited state is now stale; freeze preserves the pre-divergence point |
| Branch age reaches 3 sessions without progress | Aging branch must freeze or be declared abandoned — never just inactive |
| An escalation fires on the main packet | Main packet's freeze is required; branch must freeze to maintain coherent shared state |
| Any artifact that both branches reference enters conflict | Cannot proceed on either branch without operator resolution |
| Operator initiates a review | All active packets must freeze at review initiation — no moving targets during review |

A branch hard-freeze is not optional when these conditions trigger. A branch that cannot acquire a clean hard-freeze at these moments must be escalated immediately.

---

## 7. GOVERNANCE EXECUTION RULES — SUMMARY TABLE

| Rule | Class | Override? |
|---|---|---|
| Log every decision at point of decision | All | No |
| Freeze after every step in CRAWL | CRAWL | No |
| Stop execution on any HALT condition | HALT | No |
| Verify freeze before CONTINUED signal | All | No |
| No execution steps during active escalation | HALT | No |
| Relay notes must match freeze manifest | All | No |
| No branch continuation without declared branch packet_id | All | No |
| OA required for all merge actions | All | No |
| Hard-freeze branch on main-packet escalation | All | No |
| Governance theater finding → HALT immediately | All | No |

All rules in this table are non-negotiable. "No override" means no override — not "no override except under extreme pressure," not "no override unless the operator verbally approves." Doctrine modification requires the process in BOUNDED_ORCHESTRATION_GOVERNANCE.md §4. Verbal approval in the moment is not doctrine modification.
