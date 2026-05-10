# SAFE AUTONOMY CONSTRAINTS — CONCEPTUAL MODEL

> Status: research only. No implementation, no governance edits, no policy changes.
> Companion to `DURABLE_RUNTIME_SUBSTRATE.md` and `RUNTIME_VS_LOOP_DISTINCTION.md`.
> Purpose: define the constraints that must hold *before* autonomy expansion is safe,
> and explain why expanding unattended scope on top of an immature substrate produces
> failure modes whose blast radius exceeds the value of the autonomy gained.

---

## 1. WHAT "SAFE AUTONOMY" MEANS HERE

Safe autonomy is not "the agent decides on its own." It is a set of properties such
that the agent *can* decide on its own without the operator needing to be present to
prevent harm:

1. **Bounded blast radius per unattended decision.** No single unattended action can
   exceed a defined cost, scope, or reversibility threshold.
2. **Reversibility by default.** Actions that cannot be undone require an explicit
   gate, not an implicit one.
3. **Observable in retrospect.** Every unattended decision leaves a record sufficient
   for an operator, hours or days later, to reconstruct what happened and why.
4. **Bounded duration before a checkpoint.** Unattended runs do not extend
   indefinitely; they pause at predictable points for human inspection, even if no
   error occurred.
5. **Substrate honest about itself.** The autonomy layer trusts the substrate only as
   far as the substrate has actually demonstrated durability — not as far as it
   claims to be durable.

Autonomy without all five is not "more capable" — it is "the same capability with
weaker guarantees and a longer time-to-detect when something goes wrong."

---

## 2. HARD CEILINGS

Hard ceilings are limits that no autonomous action may cross without an explicit human
gate. They are properties of the *action class*, not of any specific action:

| Ceiling                          | Why it must be hard                                              |
|----------------------------------|------------------------------------------------------------------|
| External communication to humans | Email/SMS/post that cannot be unsent has reputation blast radius |
| Spending or commitments          | Money is the canonical irreversible side effect                  |
| Deletion of data                 | Loss is asymmetric: cheap to avoid, expensive to recover         |
| Production deploys               | A bad deploy can take down customer-facing systems               |
| Permission / credential changes  | Privilege escalation enables every other ceiling violation       |
| Schema migrations                | A bad migration can corrupt the substrate the runtime depends on |
| External integrations going live | Vendor-side rate limits, account flags, and reputational risk    |
| Mass operations (>N rows/users)  | Linear cost, exponential consequences when wrong                 |

A ceiling is "hard" only if violating it is *structurally* impossible without the
gate, not merely *advised against*. Documentation alone is not a ceiling. Convention
is not a ceiling. A ceiling enforced only by the agent's good judgment is a ceiling
the agent can lower at will, which is not a ceiling.

---

## 3. IRREVERSIBLE DANGER ZONES

The danger zones are the operations whose consequences cannot be undone by replaying
the substrate. Even with perfect durability, a runtime that performs these operations
unattended is risking damage the substrate cannot heal.

1. **Outbound human communication.** Emails, SMS, slack messages, social posts, public
   comments. The recipient's mental model of the situation is updated; the substrate
   cannot retract that update.
2. **Money movement.** Charges, refunds, transfers, paid integrations, ad spend. The
   counterparty has changed state; reversal requires their cooperation.
3. **Public-facing deploys.** A site update is observable to users between deploy and
   rollback. Crawlers and caches preserve the bad state.
4. **Data deletion or overwrite without versioning.** The prior state ceases to exist
   except in backups, which may be stale, slow to restore, or untested.
5. **Credential rotation or revocation.** A revoked credential is in use somewhere; the
   blast radius is "every dependent integration we did not enumerate."
6. **Vendor-account-affecting operations.** Operations that can flag, suspend, or
   degrade the standing of an account on a third-party platform.
7. **Schema-incompatible writes.** A write that older readers cannot interpret breaks
   the implicit contract with everything that depends on the substrate.
8. **Destructive git operations.** Force-push, branch deletion, history rewrite. The
   prior state may exist only in clones the agent cannot enumerate.

Each zone needs a different gate, not a single global one. "Always ask before
anything risky" collapses to "ask before everything," which trains the operator to
approve without reading.

---

## 4. BOUNDED EXECUTION REQUIREMENTS

Bounded execution is the property that any single autonomous run terminates within
limits set *before* the run started, not limits the run can extend itself.

Required bounds, each declared per run or per work unit:

- **Wall-clock budget.** "This run may consume at most T minutes of real time."
- **Cost budget.** "This run may consume at most $X of API/compute spend."
- **Action budget.** "This run may perform at most N writes to external systems."
- **Reach budget.** "This run may touch at most M distinct entities (rows, users,
  files)."
- **Recursion budget.** "This run may spawn at most K sub-runs, depth at most D."

Two essential properties of every budget:

1. **The runtime cannot raise its own budget.** Raising a budget requires authority
   from outside the run.
2. **Hitting a budget halts cleanly with checkpoint.** Budget exhaustion is a
   *normal* termination, not an error — the next run resumes from the checkpoint.

A run with no declared budgets is a run whose worst case is "until something else
stops it," and the things that stop unbounded runs are usually the things you did not
want stopped.

---

## 5. GOVERNANCE GATES

A gate is a *required* approval, observation, or condition before a class of action is
permitted. Gates differ from ceilings in that gates can be passed (with the right
authority); ceilings cannot be crossed without lowering them first.

Categories of gate:

| Gate type           | What it requires                                                  |
|---------------------|-------------------------------------------------------------------|
| Human-in-loop       | Operator approval per action, before execution                    |
| Human-on-loop       | Operator can interrupt; default is proceed if no objection in T   |
| Two-key             | Two distinct authorities must approve (rare; for ceilings)        |
| Quorum / consensus  | A majority of designated reviewers must approve (rare)            |
| Automated invariant | An automated check must pass (e.g. tests green, schema compatible)|
| Time-window         | Action allowed only within an operator-defined window             |
| Rate-limit          | Action allowed only at most N times per period                    |

Important: gates must live *outside* the agent's authority surface. A gate the agent
can bypass when "obviously fine" is not a gate. The agent's role at a gate is to
*request*, not to *grant*.

For autonomy expansion, the design question is not "how few gates can we have" but
"which gates are present, on which action classes, and what is the escape path when a
gate fails closed."

---

## 6. ROLLBACK REQUIREMENTS

Every autonomous action class must have a defined rollback path *before* it is
permitted unattended. The rollback design answers:

1. **Detection.** How is a bad action detected? (alarm, KPI drift, operator report,
   automated invariant)
2. **Containment.** How is further damage prevented while rollback is decided? (drain
   the queue, freeze the action class, revoke a credential)
3. **Reversal.** What is the actual undo? (restore from snapshot, send correction
   email, reverse the transaction, redeploy prior version)
4. **Recovery.** How does normal operation resume? (replay queued work after the
   reversal, repair the substrate, re-enable the action class)
5. **Learning.** What durable record is kept so the same failure does not recur in the
   same form?

An action class without a rollback path is a class that should not be made
unattended. "We will figure out rollback if it happens" is a synonym for "we will
not roll back."

For irreversible-by-physics operations (sent emails, completed payments), rollback is
*compensating action* — a follow-up that corrects the impression or refunds the
charge — and must be designed in the same plan as the original action, not improvised
later.

---

## 7. WHY UNATTENDED EXPANSION IS DANGEROUS PREMATURELY

Expanding unattended scope on top of an immature substrate is dangerous for reasons
that compound:

### 7.1 Failure detection is slowest exactly when stakes are highest
With an operator present, a misbehaving loop is caught in seconds. Unattended, it is
caught when the operator next looks — minutes, hours, or overnight later. The blast
radius scales with detection time, and detection time scales inversely with operator
presence.

### 7.2 The substrate's weakest property dominates the system's behavior
A system can be 95% durable and behave catastrophically in the 5% case if the 5% is
where unattended runs spend most of their time (long tasks, retries, edge cases).
Unattended operation is the regime that *finds* the substrate's weakest property and
exercises it disproportionately.

### 7.3 Recovery requires reconstructing intent the substrate did not preserve
When unattended autonomy goes wrong, the operator's first question is "what was it
*trying* to do?" If the plan lived in a context window that is now gone, the answer
is unrecoverable, and the operator is reduced to forensic guesswork from artifacts.
Mature substrates make this question trivially answerable; immature ones make it
unanswerable, exactly when the answer matters most.

### 7.4 Confidence compounds faster than capability
Each successful unattended run increases operator confidence in the next one — but
the operator is calibrating off a sample where nothing exceptional happened. Capability
to handle the *exceptional* case grows slowly and is invisible until exercised. The
gap between perceived and actual reliability grows silently until a single bad run
closes it abruptly.

### 7.5 Reversibility erodes as scope expands
Early autonomous actions tend to be inherently reversible (file edits in git, scratch
data). As scope expands, the action set drifts toward irreversible side effects
(emails, deploys, payments, deletions). The substrate properties that were "good
enough" for reversible work are no longer adequate, and the failure mode is silent.

### 7.6 The "fake runtime" makes premature expansion look safe
The illusions catalogued in `RUNTIME_VS_LOOP_DISTINCTION.md` §3 cause operators to
overestimate substrate maturity. Premature autonomy expansion is the predictable
consequence of that overestimation — it does not feel premature in the moment because
the substrate looks more capable than it is.

The remedy is not "be careful" — careful operators still hit these failure modes. The
remedy is *not expanding unattended scope until the substrate floor in
`DURABLE_RUNTIME_SUBSTRATE.md` §11 is satisfied for the action class in question.*

---

## 8. ACTION-CLASS GATING MATRIX (CONCEPTUAL)

A conceptual map of how action classes should be gated against substrate maturity.
This is a model, not a policy.

| Action class                  | At current maturity      | At minimum-viable substrate | At mature substrate         |
|-------------------------------|--------------------------|-----------------------------|-----------------------------|
| Local file edits in git       | autonomous OK            | autonomous OK               | autonomous OK               |
| Repo commits to feature branch| autonomous OK            | autonomous OK               | autonomous OK               |
| Repo commits to main          | human-in-loop            | human-on-loop               | human-on-loop               |
| Internal data reads           | autonomous OK            | autonomous OK               | autonomous OK               |
| Internal data writes          | human-on-loop            | autonomous w/ idempotency   | autonomous w/ idempotency   |
| Schema migrations             | human-in-loop            | human-in-loop               | two-key                     |
| Outbound email (drafts)       | autonomous OK            | autonomous OK               | autonomous OK               |
| Outbound email (send)         | human-in-loop            | human-in-loop               | human-on-loop + rate-limit  |
| Money movement                | human-in-loop            | human-in-loop               | two-key                     |
| Production deploy             | human-in-loop            | human-on-loop + invariant   | human-on-loop + invariant   |
| Credential rotation           | human-in-loop            | human-in-loop               | two-key                     |
| Mass operations (>N entities) | human-in-loop            | human-in-loop               | human-on-loop + rollback    |
| Vendor-account operations     | human-in-loop            | human-in-loop               | human-in-loop               |
| Destructive git operations    | human-in-loop            | human-in-loop               | two-key                     |

The two columns to the right are *not unlocked by adding gates* — they are unlocked by
the substrate becoming durable enough that "human-on-loop" is meaningful (i.e. the
human can actually inspect, interrupt, and roll back; not merely receive a
notification).

---

## 9. THE OPERATOR'S COVENANT

A symmetric obligation: if the agent is going to be granted unattended scope, the
operator owes the agent an environment in which unattended operation is *possible*:

- A substrate with the floor properties present.
- Declared budgets the agent can read and respect.
- Defined rollback paths the agent can invoke.
- A clear list of action classes the agent may take, and at what gate level.
- A reachable channel for the agent to request a gate without blocking forever.

Unattended autonomy granted *without* this environment is a setup for both sides:
the agent will perform actions that look reasonable in isolation and produce harm in
aggregate; the operator will lose trust in autonomy generally, when the failure was
actually environmental.

---

## 10. SUMMARY

Safe autonomy is the product of substrate durability, declared bounds, defined gates,
and rehearsed rollback — not of the agent's competence in isolation. Premature
expansion converts substrate weakness into observable harm at exactly the moment the
operator is least available to catch it. The conservative path — and the one this
research mode argues for — is to keep human-in-loop gating on every action class with
irreversible blast radius until the substrate floor is met, and to treat the gap
between "feels durable" and "is durable" as the actual project, not as a checkbox on
the way to something else.
