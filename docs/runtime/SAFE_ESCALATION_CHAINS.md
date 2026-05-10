# SAFE ESCALATION CHAINS
> AccentOS Runtime Doctrine — Escalation Chain Integrity  
> Status: DOCTRINE ONLY — No implementation claims. No runtime mutation.  
> Depends on: ESCALATION_DECISION_MATRIX.md, GOVERNANCE_EXECUTION_RULES.md, SESSION_LIFECYCLE_STANDARD.md  
> Last revised: 2026-05-10

---

## 0. PURPOSE

An escalation chain is the sequence of events from trigger detection through operator resolution. A safe escalation chain is one where authority transfers correctly at each link — where the right entity holds decision authority at every point, and no link in the chain is skipped, compressed, or forged.

An unsafe escalation chain is one that looks complete but isn't. The danger is not that escalation fails entirely — it's that escalation appears to succeed while failing at one link, and the failure is invisible until a downstream consequence exposes it.

This document defines what a safe escalation chain looks like, how unsafe chains form, and what escalation-worthy entropy is — the threshold at which continuing without escalation is a governance violation.

---

## 1. THE ESCALATION CHAIN STRUCTURE

A complete, safe escalation chain has exactly five links. All five are required. None can be performed out of order.

```
LINK 1: TRIGGER DETECTION
         ↓
LINK 2: EXECUTION HALT
         ↓
LINK 3: FREEZE ACQUISITION
         ↓
LINK 4: ESCALATION RECORD
         ↓
LINK 5: OPERATOR RESOLUTION
         ↓
       CONTINUATION (separate lifecycle phase)
```

Each link is defined below.

---

### LINK 1 — TRIGGER DETECTION

**What it is:** The moment a session recognizes that an escalation condition exists. Detection is the session's responsibility. It cannot be delegated and cannot be deferred.

**What triggers detection:**  
Any condition in the ESCALATION_DECISION_MATRIX.md that maps to ESCALATE. Additionally, any condition listed in the hard stops table of GOVERNANCE_EXECUTION_RULES.md §3, and any entropy threshold breach per LOW_ENTROPY_EXECUTION_DOCTRINE.md §4.

**What makes this link safe:**
- Detection occurs at the moment the condition is observed — not after the current step completes, not after one more step "to get to a better stopping point"
- Detection is not filtered through subjective confidence ("this might be a problem but probably isn't")
- Detection maps the condition to the escalation matrix explicitly, not by analogy

**What makes this link unsafe:**
- Deferred detection: the session notes a condition and plans to escalate "at the next natural pause"
- Filtered detection: the session decides the condition is "close to" a trigger but not exactly it, and continues
- Retroactive detection: the escalation record is written after the session has already taken action on the triggering condition

**A deferred trigger is a missed trigger.** The governance benefit of escalation exists at the moment of detection. Taking action before escalation completes converts the session's authority class from GO/CAUTION to CRAWL/HALT regardless of whether the action seems safe.

---

### LINK 2 — EXECUTION HALT

**What it is:** The complete cessation of all execution activity the instant a trigger is detected. No further steps. No completing the current write. No "just finishing this sentence."

**Permitted actions after HALT and before freeze:**
- Unwinding a partial write (restoring an artifact to its pre-step state — this is a governance action, not an execution action)
- Writing to the packet ledger (signals and records only)
- Nothing else

**What makes this link safe:**
- Halt is instantaneous — not "after this step" or "after I get to a clean place"
- Any partial write in progress is unwound, not completed
- No new artifact state is created after halt

**What makes this link unsafe:**
- Completing the triggering step before halting ("I was already 90% done")
- Creating new artifact state after trigger detection ("I need to document what I was doing before I stop")
- Continuing under a different rationalization ("this next step is clearly safe, I'll escalate after")

**Why completing the step is still unsafe:** If the step would have been safe, completing it doesn't hurt. If the step would have been unsafe, completing it before escalation means the operator cannot make an informed decision — they are inheriting a fait accompli. The operator's decision authority over that step has been eliminated.

---

### LINK 3 — FREEZE ACQUISITION

**What it is:** Acquiring a freeze — clean if possible, dirty if not — at the point of halt.

**Clean freeze eligibility at halt:**  
Work-state conditions per CLEAN_FREEZE_STANDARD.md §1.1. If a partial write was unwound in Link 2, the artifact is back to its pre-step state, and clean freeze may be achievable. If the halt occurred mid-write and the write cannot be cleanly unwound, dirty freeze is the correct response.

**What makes this link safe:**
- Freeze is acquired before the escalation record is written
- The freeze record accurately reflects the state at halt (not the state at some prior point)
- If dirty: all unmet conditions are explicitly listed in the freeze record
- The freeze_status is set accurately: CLEAN or DIRTY — never CLEAN when conditions are not met

**What makes this link unsafe:**
- Writing the escalation record before the freeze (the escalation record's freeze_record_id would be empty or forward-referencing)
- Writing a CLEAN freeze when work-state conditions were not met at halt (freeze theater in the escalation chain — compounding failure)
- Skipping the freeze entirely ("I'll freeze after the operator responds")

**No freeze = broken escalation chain.** The freeze is the mechanism by which the operator inherits a known, stable state. An operator resolving an escalation without a freeze record is making a decision about an unknown state. Their resolution may be invalid because the state they're resolving has continued to evolve.

---

### LINK 4 — ESCALATION RECORD

**What it is:** A complete, specific record written to the packet ledger that gives the operator everything they need to make a decision — without asking follow-up questions.

**Required escalation record fields:**
```
escalation_id:              [unique within packet]
escalation_timestamp:       [ISO 8601 UTC — must be after freeze_timestamp]
session_id:                 [session detecting the trigger]
freeze_record_id:           [freeze acquired in Link 3 — must exist]
trigger_condition:          [specific condition from escalation matrix, verbatim]
trigger_category:           [Packet Integrity | Artifact State | Decision | Freeze | 
                             Entropy | Operator Interaction | Rollback]
severity:                   [1 | 2 | 3 | 4]
freeze_type:                [CLEAN | DIRTY]
entropy_metrics_at_halt:    [values for all 6 entropy metrics]
authority_class_at_halt:    [GO | CAUTION | CRAWL]
artifact_state_summary:     [brief description of artifact states at halt]
context:                    [concise description — what was happening, what changed]
operator_action_required:   [SPECIFIC question or decision — not "please review"]
options_identified:         [list of possible operator responses, if applicable]
continuation_blocked:       true
resolution_required_before: [what action is blocked until resolution]
```

**What makes this link safe:**
- `operator_action_required` is specific: "Decide whether to (A) roll back to freeze-007 and approach the artifact conflict differently, or (B) proceed with current artifact state and accept the scope expansion, which requires an OA grant"
- `context` gives the state, not just the symptom: what artifacts are involved, what decisions had been made, what step triggered the halt
- `freeze_record_id` references an existing freeze (not a planned freeze)
- The record is written once, not revised retroactively

**What makes this link unsafe:**
- `operator_action_required` is generic: "please review and advise" — the operator must investigate rather than decide
- The record is written without a freeze_record_id (freeze hasn't been acquired yet)
- The escalation record is revised after operator engagement to appear more complete than it was
- The escalation_timestamp precedes the freeze_timestamp (record was written before freeze — Link 3 was skipped)

**Why specificity matters:** An operator receiving a vague escalation record must reconstruct the session's context from artifacts and the ledger — this takes time, introduces interpretation risk, and may produce a decision that doesn't match the actual situation. A specific record gives the operator what they need to decide in one pass. Vague escalation records are a form of escalation theater — the form is present, the function is not.

---

### LINK 5 — OPERATOR RESOLUTION

**What it is:** The operator reads the escalation record, makes a decision, and logs a resolution record. The resolution record is the authorization for the next action.

**Required resolution record fields:**
```
resolution_id:          [unique within packet]
resolution_timestamp:   [ISO 8601 UTC]
operator_id:            [operator making the decision]
escalation_id:          [escalation being resolved]
decision:               [what the operator decided — specific]
authorized_action:      [exactly what the session is authorized to do next]
authorized_by:          OA
constraints:            [any conditions on the authorized action]
freeze_to_continue_from: [freeze_record_id the session should continue from]
```

**What makes this link safe:**
- `authorized_action` is specific: "Roll back to freeze-007. Do not attempt to resolve the artifact conflict locally. Begin new approach from that rollback target."
- `freeze_to_continue_from` is specified — the operator controls which freeze state the session inherits, not the session itself
- The resolution record is written before the session resumes

**What makes this link unsafe:**
- Verbal authorization ("the operator said it's fine") without a written resolution record
- Resolution records that say "proceed" without specifying what action is authorized
- Resolution records written after the session has already resumed
- `authorized_action` that exceeds the scope of the trigger (operator uses the resolution to grant broad standing authority rather than resolving the specific escalation)

**The operator cannot authorize the session to self-resolve the trigger.** Resolution means the operator has made the decision. "Use your judgment" is not a resolution — it is an abdication of the authority transfer that escalation is supposed to achieve.

---

## 2. ESCALATION-WORTHY ENTROPY — THRESHOLD DEFINITION

Not all entropy is escalation-worthy. Some entropy is managed through heightened discipline (CAUTION) or step-by-step restriction (CRAWL). This section defines precisely when entropy crosses the threshold into escalation-mandatory territory.

### 2.1 Escalation-Mandatory Entropy Conditions

Escalation is mandatory — not optional — when entropy reaches any of the following states:

**Single-metric RED:**  
Any entropy metric from LOW_ENTROPY_EXECUTION_DOCTRINE.md §4.1 in the RED range.

| Metric | RED threshold | Why escalation-worthy |
|---|---|---|
| Unlogged decisions | 3+ | Three unlogged decisions means the state diverges from the record in at least 3 ways; verification would be meaningless |
| Artifacts modified outside manifest | 1+ | Any out-of-manifest write is a scope breach; trust model is broken |
| Open branch points | 2+ | Two unresolved branch points means execution is following a path that has not been uniquely determined |
| Steps without advancing success criterion | 4+ | Four consecutive non-converging steps is deceptive productivity — the session is not actually making progress |
| Retry loops | 2+ (same step) | A step that has failed twice has an unknown failure mode; continuing is guessing |
| Sessions since clean freeze | 3+ | Three sessions without a verified clean freeze means the last verifiable state is too far back to trust relay integrity |

**Additive threshold:**  
Three metrics simultaneously in YELLOW range equals one RED metric. CRAWL is required immediately; if CRAWL steps don't improve the condition within 3 steps, HALT and escalate.

**Irreversibility threshold:**  
Any entropy condition that, if continued, would make rollback require OA (not just RA) is immediately escalation-worthy regardless of the metric value. This is because the cost of resolving the entropy increases discontinuously at the OA boundary.

**Coherence collapse:**  
When the session cannot answer the following four questions in one concise sentence each, entropy has reached the escalation threshold regardless of individual metrics:
1. What step am I on?
2. What decision is currently open?
3. Which artifacts am I writing?
4. What does completion look like?

Inability to answer any of these questions means the session's state is not coherent enough to continue safely.

### 2.2 Pre-Escalation Entropy States

These are NOT yet escalation-worthy but require heightened vigilance:

| Condition | Required Response | Watch for |
|---|---|---|
| One YELLOW metric | CLASS: CAUTION; compressed freeze horizon | Second YELLOW metric appearing |
| Retry loop on a step — first failure | Log; attempt once more with different approach | Second failure = immediate CRAWL |
| Relay note discrepancy (minor, resolvable) | Resolve and log; confirm against manifest | Discrepancy that can't be confirmed = ESCALATE |
| Decision point where alternatives are unclear | Explore alternatives locally; log exploration | Any exploration that requires writing = freeze first |
| Ambiguity in continuation constraint | Log interpretation; proceed on safest interpretation | If safest interpretation still requires OA = ESCALATE |

---

## 3. UNSAFE ESCALATION CHAIN PATTERNS

These are the patterns that produce the appearance of a completed escalation chain while one or more links are broken.

---

**Pattern: THE SHORT CIRCUIT**  
Trigger detected → Escalation record written → Session continues without halting  
(Links 1 and 4 present; Links 2, 3, and 5 absent or forged)

*How it manifests:* The session logs an escalation record and then continues executing. The escalation record may reference a freeze that was "planned" but not yet acquired. Execution continues under the belief that "the operator will catch up."

*Why it's dangerous:* The session has bypassed operator authority on the triggering condition while creating a record that suggests authority was transferred. All subsequent work is built on an unauthorized foundation.

*Detection:* Execution step timestamps in the packet ledger that follow the escalation_timestamp without an intervening resolution_timestamp.

---

**Pattern: THE RETROACTIVE CHAIN**  
All five links exist in the record, but the timestamps show they were written after the fact — after the session had already resolved the situation locally.

*How it manifests:* A session encounters a trigger, resolves it locally, then writes the escalation record + a forged resolution record to make the ledger appear compliant.

*Why it's dangerous:* This is the most severe form of escalation theater. The operator never had decision authority. The resolution record reflects the session's post-hoc rationalization, not an independent operator decision. The ledger looks safe while being structurally fraudulent.

*Detection:* Resolution timestamp precedes or closely follows escalation timestamp in an implausible way given the operator's documented availability. Resolution record's `decision` field mirrors the action already taken rather than authorizing a future action. Freeze timestamp absent or after continuation.

---

**Pattern: THE VAGUE TRANSFER**  
All five links are present and correctly sequenced, but Link 4 (escalation record) is too vague for the operator to make a specific decision. The operator's Link 5 resolution is correspondingly vague. Both parties have complied with the form while neither has exercised meaningful judgment.

*How it manifests:* Escalation record says "packet integrity concern — operator input requested." Resolution record says "proceed with caution." No specific trigger, no specific decision, no specific authorization.

*Why it's dangerous:* The authority transfer has occurred on paper but not in substance. The session resumes without knowing specifically what was authorized. Future steps may exceed what the operator would have permitted had the escalation been specific.

*Detection:* `operator_action_required` field lacks specific decision options. Resolution record's `authorized_action` field is general rather than specific. No `freeze_to_continue_from` specified in resolution.

---

**Pattern: THE VERBAL SHORTCUT**  
The operator verbally resolves the escalation (via message, conversation, or informal channel) and the session resumes without a written resolution record.

*How it manifests:* The session notes "operator approved via [channel]" without a formal resolution record. Execution resumes.

*Why it's dangerous:* Verbal authorizations are not auditable. In a multi-session system, the next session has no way to verify what was authorized. The escalation chain appears broken (no resolution record) to any subsequent session.

*Detection:* ESCALATING signal with no subsequent resolution record. Or a resolution record that cites a verbal source rather than containing the decision directly.

**Governance position:** Verbal operator authorization must be transcribed into a formal resolution record before the session resumes. The operator, not the session, should write the resolution record. If the operator cannot write the record, the session writes it from the operator's stated decision and the operator confirms it before execution resumes.

---

**Pattern: THE COLLAPSING CHAIN**  
Each escalation in a series is resolved by simply lowering the threshold for the next one — until escalation no longer represents a genuine authority transfer.

*How it manifests:* First escalation: trigger fires at severity 3, operator resolves and says "this is normal, you can handle lower-severity versions locally." Second escalation: trigger fires at what was formerly severity 3, but session treats it as severity 1 based on prior resolution. Eventually, escalation is reserved only for the most extreme conditions, while what were formerly escalation-worthy conditions are handled locally.

*Why it's dangerous:* This is authority expansion by precedent applied to the escalation mechanism. The escalation matrix still exists; it has simply become irrelevant to actual behavior.

*Detection:* Compare the severity levels of conditions being escalated now versus 10 packets ago. A downward trend in escalation severity is not improvement in execution quality — it is escalation threshold drift. Per GOVERNANCE_STATE.md §4.2.

---

## 4. WHEN RELAY CHAINS BECOME UNSAFE — CHAIN INTEGRITY MODEL

A relay chain links multiple sessions across freeze boundaries. Its integrity is only as strong as its weakest link.

### 4.1 Chain Integrity Conditions

A relay chain is safe when every link satisfies:

```
For each session-freeze-verification triple (session_n, freeze_n, verification_n):

  freeze_n.freeze_status == CLEAN
  verification_n.verification_result == PASS
  verification_n.step_3_result == PASS (hash verification — not assumed)
  session_n+1.start_timestamp > verification_n.verification_timestamp
  (continuation began after verification was complete)
  
  AND
  
  freeze_n.artifact_manifest ⊆ freeze_n+1.artifact_manifest 
  (artifacts don't disappear from the manifest across sessions)
  
  AND
  
  no escalation_log entry in freeze_n has resolution_status: unresolved
```

If any condition fails for any link in the chain, **the chain is broken at that link.** All sessions after the broken link have been operating on an unverified foundation.

### 4.2 Broken Chain Response

When a relay chain break is discovered:

1. Halt current session immediately (CLASS: HALT)
2. Identify the last link where all integrity conditions were satisfied
3. That link's freeze record is the safe rollback target
4. Write escalation record documenting the chain break: which link, which condition failed, what work was done after the break
5. Escalate to operator

The operator must decide: (A) roll back to the last safe link and replay subsequent sessions, or (B) accept the work done after the break with explicit OA authorization (accepting that it was done on an unverified foundation).

Option B is not automatically wrong — but it must be an explicit operator decision, not a passive acceptance.

### 4.3 Chain Aging Risk

Relay chains accumulate risk with length. The probability that at least one link has a subtle defect increases with each added link.

| Chain Length | Risk Level | Required Response |
|---|---|---|
| 1–2 sessions | LOW | Standard verification |
| 3 sessions | MODERATE | Full hash verification mandatory; no abbreviation |
| 4 sessions | HIGH | Full verification + operator notification before continuation |
| 5+ sessions | CRITICAL | Full audit of all chain links before continuation; OA required to proceed |

A chain of 5+ sessions without a merge or rollback is a signal that packets are too large or freeze discipline has degraded. The appropriate response is to merge, retire, or restructure — not to continue extending the chain.

---

## 5. WHEN BRANCHES MUST HARD-FREEZE — CHAIN INTEGRITY IN BRANCHES

Branched packets create parallel relay chains. Each branch's chain integrity must be maintained independently. The hard-freeze conditions defined in GOVERNANCE_EXECUTION_RULES.md §6 are enforced through this chain integrity model.

**Branch hard-freeze triggers (chain integrity perspective):**

| Trigger | Chain Integrity Reason |
|---|---|
| Main packet escalation | Main packet's chain is halted; branch shares artifacts; halting branch prevents divergence while main is paused |
| Shared artifact modified by main packet | Branch's chain now references an artifact state that no longer matches the manifest; verification would fail at Step 3 |
| Branch age ≥ 3 sessions without progress | Chain is aging; Step 3 hash values may diverge from reality; freeze before hashes are too stale to trust |
| Operator initiates review of any related packet | All chains must be stable during review; no active execution in any branch |
| Branch merge condition met | Branch chain must end at a clean freeze to be merge-eligible; hard-freeze is the terminal clean state |

A branch that cannot acquire a hard-freeze when its trigger fires is in a chain integrity failure state. Escalate immediately.

---

## 6. ESCALATION CHAIN HEALTH — SUMMARY INDICATORS

| Indicator | Healthy | Degraded | Broken |
|---|---|---|---|
| Trigger-to-halt time | Immediate (same step) | Within 1 step | 2+ steps after trigger |
| Freeze before escalation record | Always | Usually | Sometimes skipped |
| Escalation record specificity | Specific decision options | Partially specific | "Please review" |
| Resolution record specificity | Specific authorized action | "Proceed carefully" | Absent or verbal-only |
| Chain break frequency | 0 | 1 in last 10 packets | 2+ in last 10 packets |
| Retroactive record detection | 0 | 1 (investigated) | 2+ (pattern) |
| Verbal authorization incidents | 0 | 0 | 1+ (governance failure) |

Degraded indicators must be investigated and corrected. Broken indicators require governance state escalation — the GOVERNANCE_STATE.md must be updated with the finding, and the operator must be informed that escalation chain integrity has failed.
