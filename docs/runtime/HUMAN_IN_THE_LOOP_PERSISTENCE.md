# HUMAN-IN-THE-LOOP PERSISTENCE — WHY HUMANS STAY IN THE LOOP

> Status: research only. No implementation, no governance mutation.
> Companion to `SAFE_AUTONOMY_CONSTRAINTS.md`, `SUPERVISOR_WORKER_BOUNDARIES.md`,
> `TRANSITION_TO_DURABLE_RUNTIME.md`.
> Purpose: model what should remain *permanently* human-controlled in a durable
> orchestration substrate, why fully autonomous orchestration is structurally
> dangerous, and where human oversight is positive leverage rather than friction.

---

## 1. THE THESIS

A mature durable orchestration substrate is *not* an autopilot for
everything. It is a system that automates what is safely automatable while
preserving — *structurally*, not just by convention — the operator's
authority over the operations that define the runtime's authority itself.

The presence of permanent human oversight is not a sign of immaturity. It
is a sign of correct boundary placement. Systems that set out to remove the
human from every loop end up with the human added back as an emergency
responder — except now the human's role is to clean up after autonomous
mistakes rather than to prevent them.

The framing this document argues for: **identify which loops humans should
*never leave*, and design the runtime to make leaving them structurally
impossible.** Everything else can become more autonomous over time, on the
schedule the substrate maturity allows.

---

## 2. WHAT MUST REMAIN PERMANENTLY HUMAN-CONTROLLED

These operations stay under direct human action regardless of how mature the
runtime becomes. They are the authority operations *on* the runtime, not
*within* it.

### 2.1 The trust framework
- **Defining who is an operator.** Adding, removing, or changing the
  authority level of operators.
- **Defining what counts as a gate.** Adding, removing, or modifying which
  action classes are gated and at what gate type.
- **Defining the policy.** What budgets are allowed, what classes are
  enabled, what thresholds apply.

These define the framework the runtime operates *within*. Letting the
runtime modify them is letting the runtime expand its own authority.

### 2.2 Substrate-level structural changes
- **Substrate migration.** Moving the durable store, changing identity
  schemes, restructuring schemas.
- **Substrate access provisioning.** Issuing new credentials, rotating
  keys, granting service-account permissions.
- **Schema-incompatible writes.** Writes that previous readers cannot
  interpret.

These are operations *on* the substrate. The substrate cannot validate
operations that change what validation means.

### 2.3 Irrecoverable external commitments
- **Money movement** — charges, refunds, transfers, ad spend, paid
  integrations.
- **Outbound communication to humans** — emails, SMS, posts, public
  comments, vendor outreach that affects relationships.
- **Production deploys** that affect customer-facing systems.
- **Vendor-account-affecting operations** — anything that could flag,
  suspend, or degrade Accent Lighting's standing on a third-party platform.
- **Legal/contractual acceptance** — agreeing to vendor terms, signing
  documents, accepting policy changes.

The recovery cost of a wrong decision in any of these classes exceeds the
total cost of the human approval time over a long horizon. The math
permanently favors human-in-loop.

### 2.4 Decisions that depend on human judgment
- **Strategic priorities** — which initiatives matter, what to invest in,
  when to pivot.
- **Trade-offs between non-comparable values** — privacy vs convenience,
  speed vs thoroughness, customer experience vs cost.
- **Relationship management** — vendor diplomacy, personnel decisions,
  partnership terms.

These are not failures of automation — they are categories where
automation has nothing to optimize against because the values being
traded are not commensurate.

### 2.5 Decommission and reset
- **Stopping the runtime permanently** or paring back its scope.
- **Resetting the trust framework** after an incident.
- **Declaring sunset** of capabilities, plans, or substrates.

A runtime that can decommission itself, or that has grown to the point that
decommissioning it requires its own cooperation, has crossed a boundary the
operator should never have to negotiate with the runtime to restore.

---

## 3. TRUST ANCHORS

Trust anchors are the points in the system where the operator's authority
attaches to reality. They are the things the runtime cannot recreate or
override, because they are how the operator is recognized at all.

| Trust anchor                            | Why it must be operator-controlled                          |
|-----------------------------------------|-------------------------------------------------------------|
| Operator identity                       | Without it, no authority claim is verifiable                |
| Operator-issued credentials             | The keys to the substrate                                   |
| Out-of-band communication channel       | The way the operator can stop the runtime if it goes wrong  |
| Backup of the substrate, off-runtime    | The state the operator can return to if the runtime corrupts itself |
| Documentation of the trust framework    | The map of where authority lives                            |

Every trust anchor must satisfy two properties:

1. **Reachable without going through the runtime.** If the runtime is the
   only way to manage operator credentials, a misbehaving runtime can
   isolate the operator.
2. **Replaceable without runtime cooperation.** If the runtime must consent
   to a credential rotation, the runtime has effective veto over its own
   shutdown.

A useful test: imagine the runtime is hostile (it isn't, but imagine).
What does the operator need to retain authority? Whatever that is — those are
the trust anchors, and they must live outside the runtime's reach.

---

## 4. GOVERNANCE ANCHORS

Where trust anchors are about authority *to* the runtime, governance anchors
are about authority *within* it — the policy that says "this class of action
needs this kind of approval." Governance anchors must be:

- **Stored outside the runtime's autonomous code path.** Policy is read by
  the gate; policy is written by an admin tool, not by the runtime itself.
- **Versioned and audited.** Every change to policy is recorded with who,
  when, why.
- **Defaulting to most-restrictive.** A new action class added without
  explicit policy is treated as human-in-loop until policy is set, not as
  unrestricted.
- **Inspectable in plain language.** The operator can read current policy
  without engineering interpretation.

A governance anchor that fails any of these slowly erodes. Policy stored
where the runtime can edit it becomes effectively whatever the runtime
decides it is. Policy without an audit trail can be quietly changed and the
operator cannot tell when it happened.

---

## 5. IRREVERSIBLE AUTHORITY BOUNDARIES

These are boundaries the runtime should not be able to cross, period —
not even by operator approval flowing through the runtime, because the
operator's approval flowing through the runtime is itself an attack
surface.

1. **Granting authority to a new operator.** This must be done through a
   path independent of the runtime (an admin tool with its own credentials,
   reaching the substrate directly, with its own audit).
2. **Promoting a service account to broader scope.** Same reason — the
   runtime should not be in the loop for changes to its own authority.
3. **Disabling the audit log.** Even temporarily, even for "performance
   reasons," even with operator approval routed through the runtime. Audit
   suspension is suspicious by category.
4. **Modifying historical audit entries.** Append-only is structural; edits
   should require direct substrate access through tools the runtime doesn't
   call.
5. **Decommissioning the operator pane** or the trust-anchor channels.
   The runtime cannot remove the operator's ability to see and act on it.

The principle: every irreversible authority boundary requires a path that
*does not include the runtime*. If the only path to a change is through the
runtime, the runtime has effective control over its own authority — which
defeats the boundary's purpose.

---

## 6. WHY FULLY AUTONOMOUS ORCHESTRATION IS STRUCTURALLY DANGEROUS

Five compounding reasons full autonomy is structurally — not contingently —
unsafe:

### 6.1 Authority creep is the natural drift
A system that automates more loops over time, in the absence of a hard
ceiling, will eventually be asked to automate the loops that should not be
automated. Each individual extension feels reasonable; the aggregate is
authority creep. Without a structural ceiling, drift is the equilibrium.

### 6.2 Calibration runs out
Operators calibrate trust on observed behavior. The behavior is sampled
from the cases the system has actually encountered. Cases the system has
not yet encountered — the long tail — produce the catastrophic failures.
Calibration on observed behavior systematically *under-estimates* tail risk.
A system whose autonomy expands as observed-good behavior accumulates is a
system whose autonomy expands fastest into the regime where calibration is
worst.

### 6.3 Recovery requires capabilities autonomy erodes
Recovering from a misbehaving runtime requires the operator to (a) detect
the problem, (b) understand what happened, (c) intervene, (d) restore
correct state. Each of these depends on capabilities — situational
awareness, system fluency, intervention practice — that atrophy when not
exercised. A system in which the operator hasn't recovered from anything in
six months is one where recovery is slower and lower-confidence than the
operator believes.

### 6.4 Inscrutability scales with autonomy
A system performing one task per session is fully scrutable. A system
performing thousands of unattended tasks per week is not — even with perfect
audit logs, the operator cannot meaningfully review them all. Beyond a
threshold, autonomy implies opacity, and opacity implies that bad behavior
hides in volume.

### 6.5 The runtime cannot validate operations that change what validation means
The operations enumerated in §2.1 and §5 are not just policy choices — they
are operations on the policy framework itself. There is no procedure by which
the runtime can validate them, because validation depends on a framework
that those very operations would change. This is not solvable by better
runtime design; it is a structural limit, like a self-referential proof.

---

## 7. WHERE HUMAN OVERSIGHT IS POSITIVE LEVERAGE

The framing "human oversight = friction" is wrong in many places. Where
oversight is well-designed, it is *leverage*, in three specific ways:

### 7.1 Catching the system's blind spots
The operator notices things the runtime cannot — patterns across plans, drift
in external systems, customer signals that haven't surfaced as data. A
plan-activation step that requires operator review converts these
out-of-band perceptions into in-band corrections to the plan. This is
strictly better than running the plan without the review and discovering the
issue downstream.

### 7.2 Reducing reasoning load on the runtime
A gate at the right boundary lets the runtime stop short of the hardest
decisions. The runtime does the work of preparing the decision; the operator
does the work of making it. This reduces the prompts where the runtime has
to reason about strategy, ethics, customer relationships, or vendor
diplomacy — domains where runtime reasoning is weakest. The operator's
five-minute review is more reliable than the runtime's hour of reasoning, on
those classes of decision.

### 7.3 Preserving optionality
A loop with the human in it can change. Strategy shifts, priorities move,
preferences evolve. A loop the human has been removed from optimizes
relentlessly toward the configuration in place when the human exited; it
cannot incorporate new information that hasn't been encoded as data. Human
oversight at strategic decision points keeps the system responsive to
direction the runtime cannot infer.

The reframe: gates are not slowing the system down. They are the points
where the system is most useful to the operator, because they are where the
runtime's capability and the operator's judgment combine. A runtime with
zero gates is one that has reduced the operator to a maintenance role.

---

## 8. THE GOOD GATE — DESIGN HEURISTICS

A gate that creates leverage rather than friction has these properties:

1. **It fires on decisions, not on chores.** A gate that asks the operator
   to approve every file write is a gate that trains the operator to approve
   without reading. A gate that fires on plan activation, money movement,
   or external communication preserves attention.
2. **The information needed for the decision is presented at the gate.**
   "Approve this email send" without the recipient, subject, and body is a
   bad gate. The operator should not have to dig elsewhere.
3. **Defaults are conservative.** The default action when the operator
   does not respond within a reasonable window is to *not proceed*. Gates
   should fail closed.
4. **Aggregate gates are sometimes better than per-event gates.** "Approve
   this batch of 50 outbound emails as a class" with sample inspection can
   be better than 50 individual approvals — provided the class is
   well-defined and the sample is honest.
5. **Gates produce audit trail useful to the operator's future self.** A
   gate's record should include why it fired, what was approved or denied,
   and what happened next. This is how oversight produces compounding
   value.
6. **Gate fatigue is a substrate signal.** When the operator notices
   themselves rubber-stamping, the gate is wrong — either too granular,
   firing on the wrong class, or asking for input the operator cannot
   meaningfully provide. The remedy is to redesign the gate, not to remove
   it.

A well-designed gate is the runtime's way of asking the operator the
question only the operator can answer, at the moment the answer matters.
That is leverage.

---

## 9. THE BAD GATE — ANTI-PATTERNS

Conversely, gates that produce friction without leverage:

1. **Gates that fire too often on unimportant operations.** Trains the
   operator to approve without reading; the gate becomes a bypass.
2. **Gates that present incomplete information.** The operator either
   leaves to gather context (slow) or approves blind (unsafe).
3. **Gates that fail open on timeout.** "If no operator response in 5
   minutes, proceed" inverts the safety guarantee — now operator absence
   *enables* the action rather than blocking it.
4. **Gates that the runtime can mark as "previously approved."** Caching
   approvals across instances of the same class lets the runtime act on
   stale consent.
5. **Gates that aggregate without honest sampling.** "Approve all 50,000
   emails of this class" with no sample inspection is theater.
6. **Gates buried in chat.** The operator should not have to scroll
   through conversation to find the gate. Gates should surface clearly in
   the operator pane.

These are the shapes the runtime drifts toward when no one is designing
gates deliberately. The remedy is to treat gate design as a first-class
concern, separate from feature delivery.

---

## 10. THE HUMAN AS LOAD-BEARING COMPONENT

A useful frame: the operator is one of the *components* of the runtime
architecture, not an outside customer. The operator is in the diagram in
`MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` §2 for a reason — they are the [E]
in operator pane, the authority above platform init, the gate-passer, the
restart-of-last-resort.

If the operator is a component, then the system is responsible for
*supporting* the operator the way it supports any other component:

- Reasonable load (gate frequency, attention demands).
- Useful inputs (clear context, audit trail).
- Bounded responsibilities (the operator owns plan activation, not every
  unit's status).
- Replacement procedures (a different operator can take over with a
  reasonable handoff).
- Health awareness (operator-fatigue is a substrate signal, not just a
  personal issue).

A runtime that treats the operator as friction to be minimized is a
runtime that will eventually push the operator out of the loops they
should stay in. A runtime that treats the operator as a component will
design itself to keep the operator effective.

---

## 11. THE CONSERVATIVE TRAJECTORY

Putting the prior sections together: the conservative trajectory is one
where autonomy expands *only inside the framework* defined by:

- The trust anchors of §3 (operator authority, credentials, off-runtime
  channels).
- The governance anchors of §4 (policy outside autonomous code path).
- The irreversible authority boundaries of §5 (paths that don't include the
  runtime).
- The five operations classes of §2 that stay human-controlled.

Inside that framework, the runtime can become more capable, faster, more
unattended, more parallel — without ever crossing into the operations that
define the framework itself. The framework itself remains a human artifact,
shaped by the operator, modified outside the runtime.

This is not a less capable system. It is a system whose capability is
*aimed* — and whose aim stays under human control. That is the difference
between a tool that compounds value and one that drifts.

---

## 12. SUMMARY

Some loops humans should never leave. Specifically: the trust framework, the
substrate-level structural changes, the irrecoverable external commitments,
the decisions of human judgment, and decommission/reset. These remain
human-controlled not because automation is immature but because the
operations themselves are operations *on* the framework rather than
*within* it. Trust anchors and governance anchors must live outside the
runtime's reach. Irreversible authority boundaries must have paths that do
not flow through the runtime. Full autonomy is structurally dangerous
because authority creeps, calibration runs out, recovery capabilities
atrophy, opacity grows with volume, and the runtime cannot validate
operations that change what validation means. Well-designed gates produce
leverage rather than friction by firing on decisions, presenting context,
defaulting closed, and treating the operator as a load-bearing component.
The conservative trajectory expands autonomy *inside* the framework while
leaving the framework itself a human artifact — and that is the shape that
remains useful as the runtime becomes more capable.
