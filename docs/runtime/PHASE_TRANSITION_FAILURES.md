# Phase Transition Failures — AccentOS

> **Predictive systems analysis. Catalogs failure shapes during the *gap* between phases. Not a runtime, not a recovery system.**
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companions: `CONSTRAINT_RADAR.md`, `CONSTRAINT_SEQUENCE_MAP.md` (defines the phases), `BOTTLENECK_PRECURSOR_SIGNALS.md`. Read those first.

---

## 0. Frame

A *phase transition failure* is a failure that occurs not within a stable phase, but in the gap *between* phases — the period when one piece of substrate has landed and the next has not yet caught up. Stable phases tend to have well-understood failure modes; transitions are where the system is most fragile, because invariants from the prior phase are weakening and invariants of the next phase are not yet load-bearing.

This document catalogs:

- **Per-transition failure signatures** — the specific shape a failure takes during each predicted transition (§2).
- **False-success signatures** — transitions that *appear* complete but have left a structural gap (§3).
- **"Looks fine" traps** — states that pass casual inspection while compounding silently (§4).
- **Blast radius per transition failure** — what each failure can damage (§5).
- **Reversibility window** — how long each failure remains cheap to undo (§6).
- **Train stall map** — the user-requested classification of which future bottlenecks stop forward movement entirely, which merely slow it, and which compound silently (§7).

**This document is not.** Not a recovery procedure. Not authorization for any of the named transitions. Not implementation. The transitions are analytical — the failures are *predictions about what would happen* if the transitions were to occur, in their predicted order, without the safeguards already named in `CONSTRAINT_RADAR.md`, `RELAY_COMPRESSION_PROTOCOL.md`, `SAFE_CONTINUATION_BOUNDARIES.md`, etc.

---

## 1. What a transition failure is

A transition failure differs from a steady-state failure in three ways:

- **Asymmetry of state.** Half the system has moved; half has not. Code paths exist that assume the new phase; data exists that reflects the old. Mismatch is the failure surface.
- **Confidence inversion.** The team's confidence is *highest* at the moment of transition (the new capability "just landed") and the system's *actual* reliability is *lowest* (the new capability has the least observed runtime). Confidence and reliability are inverted; this is when over-reach happens.
- **Blame ambiguity.** A failure during transition can be blamed on (a) the new phase's incomplete substrate, (b) the prior phase's residual behavior, or (c) the interaction. Real diagnosis requires distinguishing which; cheap diagnosis just picks one.

Every transition listed below is conditional on the transition occurring at all. The radar (`CONSTRAINT_RADAR.md` §6) does not endorse them; this document predicts what fails *if* they occur.

---

## 2. Per-transition failure signatures

### 2.1 — Phase 0 → 1 (introducing the first substrate seed)
- **Signature.** The seed lands but is treated by the rest of the system as if it were one more ledger file. Sessions write to it because the rules say to, but no consumer outside the runtime actually reads it. The "out-of-runtime" property is structural, not behavioral.
- **Why it happens.** The cheapest implementation of "first substrate seed" is a file. Files are read by humans. Phase 1 requires the file to be read by something other than a session that produced it; a file alone does not enforce the property.
- **Diagnostic test.** Ask: "what would change if the seed file were deleted between sessions?" If the answer is "the next session would notice and freeze," Phase 1 is real. If the answer is "nothing for a while," Phase 1 is documented but not landed.

### 2.2 — Phase 1 → 2 (register() landing on top of the seed)
- **Signature.** register() is called but its records are inconsistent across consumers. One consumer treats a record as authoritative; another treats it as advisory; a third ignores it. The contract is named but not honored.
- **Why it happens.** The contract is published in a doc; no enforcement mechanism distinguishes between "I read the doc" and "I respect the doc." The space between intention and enforcement is the failure surface.
- **Diagnostic test.** Take a register() record that is in a known state. Mutate it externally (file edit). Observe which consumers detect, ignore, or contradict the mutation. If consumers split, the contract is not yet a contract.

### 2.3 — Phase 2 → 3 (governance landing without supervisor) / Phase 2 → 5 (supervisor landing without governance)
- **Signature (governance-first failure).** Halt list is enforced; halt-list violations now produce hard refusals from the harness. But because no observer is watching the runtime, a halt produces silence — the runtime stops without anyone knowing. The system is *more* reliable than before but *less* observable.
- **Signature (supervisor-first failure).** Observer is wired; it sees behavior it can describe but not constrain. It logs misbehavior; it cannot prevent misbehavior. The observer becomes a chronicler of failure rather than a guard against it.
- **Why it happens.** Path choice (`CONSTRAINT_SEQUENCE_MAP.md` §4) treats governance-first and supervisor-first as equivalent. They are not — each has a distinctive failure mode the other does not.
- **Diagnostic test.** For governance-first: cause a halt in a test packet; verify a human notices within an acceptable window. If they don't, the silence-on-halt failure is active. For supervisor-first: induce a halt-list-class action; verify whether it was prevented or merely logged. If logged-only, the chronicler failure is active.

### 2.4 — Phase 3 → 4 (governance to module isolation)
- **Signature.** Modules retreat into their newly-explicit scopes and stop coordinating across them. Work that crosses module boundaries piles up because no module is "responsible" for it. The system becomes more disciplined and less productive.
- **Why it happens.** Allowlists tell each module what it *may* do; they do not tell modules how to coordinate when they need to do something together. Coordination has no home.
- **Diagnostic test.** Find any work item from the prior 30 days that touched two or more modules' scopes. Trace where the cross-module decision was made. If the answer is "in Michael's head" or "in a chat message," the post-isolation failure is incipient.

### 2.5 — Phase 4 → 5 (module isolation to supervisor seed)
- **Signature.** The supervisor reads the registration record and enforces lifecycle, but the modules' isolation has caused state to fragment across module-owned files. The supervisor sees lifecycle correctly and sees the work badly, because the work's state is now distributed.
- **Why it happens.** Module isolation pushed write scopes apart for safety; the supervisor needs a unified read view that the isolation undermines. Isolation is a write property; supervision needs a read property; the two were not negotiated.
- **Diagnostic test.** Ask the supervisor "what is the state of work item X?" If the answer requires reading multiple module-owned files and the supervisor does not have read scope across them, the failure is structural.

### 2.6 — Phase 5 → 6 (supervisor to escalation channel)
- **Signature.** The channel is wired and produces messages. The messages are tuned to the supervisor's signal-to-noise (early supervisors are noisy by default). The first noisy week trains the recipient to ignore the channel; by the time real signals arrive, the channel is silenced socially even if it is functional technically.
- **Why it happens.** Escalation channels are tuned post-hoc by observed false-positive rate. Without observation, the first tuning happens against pre-production guesses.
- **Diagnostic test.** Count escalation messages the recipient acknowledged in the first week vs. the second. If the second-week acknowledge rate is below 50%, channel is degrading; if it stays low, the failure has landed.

---

## 3. False-success signatures

A false-success is a transition that *appears* complete and is not. Sorted by which phase they masquerade as completed.

### 3.1 — "We have a substrate" when the seed has only one writer
- **Phase claimed.** 1.
- **Reality.** A file exists; one Claude session writes it; the same session reads it. The claim "out of runtime" is technically true (the file is on disk) and operationally false (no other process consumes it).
- **Tell.** No commit references reading the seed from outside a Claude session.

### 3.2 — "register() works" when only happy-path is exercised
- **Phase claimed.** 2.
- **Reality.** register() succeeds when sessions complete cleanly; it has never been exercised on a session that died mid-write. The "register" contract is single-write; the "deregister or update on death" half is unimplemented.
- **Tell.** No test, dry-run, or post-mortem in the artifact base shows a register record being correctly resolved after an unplanned session end.

### 3.3 — "Governance has transitioned" when one rule moved
- **Phase claimed.** 3.
- **Reality.** A single rule from skill prose has been moved to harness config; the rest of the standing halt list remains in prose. The transition is real for that rule; the phase is misclassified because partial governance produces governance-first failure (§2.3) where some halts are structural and others are advisory, with no mechanism to distinguish them.
- **Tell.** Conversation or doc treats the standing halt list as transitioned in aggregate when only a subset has.

### 3.4 — "Modules are isolated" when convention enforces isolation
- **Phase claimed.** 4.
- **Reality.** Skills' SKILL.md describe their write scopes; nothing structurally prevents one skill from editing another's files. Isolation is convention, not enforcement.
- **Tell.** A skill's commits include edits outside the SKILL.md-declared scope, with no governance gate having complained.

### 3.5 — "We have a supervisor" when the same Claude is the supervisor
- **Phase claimed.** 5.
- **Reality.** A skill or pattern claims to "watch" or "monitor" the runtime. It is the same process. Same harness, same death conditions, same blind spots.
- **Tell.** Vocabulary in artifacts (forbidden in `SAFE_CONTINUATION_BOUNDARIES.md` §10): "I will watch," "monitoring," "self-checking."

### 3.6 — "Escalation works" when escalations have only been tested while awake
- **Phase claimed.** 6.
- **Reality.** The channel has been verified end-to-end during business hours. It has not been verified at 3am, on a phone in airplane mode, after Wi-Fi reconnects, etc. The success-set is the easy set.
- **Tell.** No artifact records a real off-hours escalation that produced an acknowledged response.

---

## 4. "Looks fine" traps (deeper than false-success)

States that pass casual inspection over multiple sessions and weeks while the underlying problem compounds.

### 4.1 — The audit-log substrate
- **Trap.** The substrate has accumulated thousands of records, formatted correctly, with no errors. It is referenced in commit messages. It looks like a working orchestration substrate. It is an audit log — records arrive after work happens; nothing acts on them.
- **Why it persists.** Records *are* useful for retrospectives. The retrospective utility masks the orchestration utility's absence.
- **Detection.** The substrate's "decisions" cannot be enumerated. If asked "list every decision the substrate has made," the answer is empty (a record is not a decision).

### 4.2 — The decorative supervisor
- **Trap.** A process exists outside Claude sessions; it reads register() records; it produces a status display. It does not stop, halt, or escalate anything. It is decoration with the silhouette of supervision.
- **Why it persists.** Status displays are pleasant. Their pleasantness reads as proof.
- **Detection.** Ask "what would change if the supervisor were turned off for a week?" If the answer is "nothing observable would change," the supervisor is decorative.

### 4.3 — The aspirational packet template
- **Trap.** Packets cite the templates from `ORCHESTRATION_PACKET_TEMPLATES.md`. The packets follow the template structure. The packets do *not* honor the doctrine the templates encode (default-deny, freeze-bias, no fake-runtime language). Form is followed; substance is not.
- **Why it persists.** Form is what's visible. Substance requires reading the prior eight docs.
- **Detection.** Spot-check a packet's authority list against `SAFE_CONTINUATION_BOUNDARIES.md` §11 decision tree. If the packet's MAY list authorizes anything in §6 (never self-continue), the trap is active.

### 4.4 — The post-hoc rule landfill
- **Trap.** Each new misbehavior produces a new rule in CLAUDE.md or a SKILL.md. The rules are individually correct. Their *aggregation* is unreadable; new packets cannot honor what cannot be read in <10 minutes.
- **Why it persists.** Individually each rule "obviously" should be added. The cumulative readability collapse is invisible until a packet author skips reading.
- **Detection.** Time how long it takes to read all standing rules. If it grows month over month, the landfill is in motion.

### 4.5 — The unenforced packet boundary
- **Trap.** Packets state caps (commit count, time, scope). Sessions report honoring them. Sessions actually exceed them by small margins each time. The margin is small enough that no individual exceedance triggers concern; the aggregated drift is large.
- **Why it persists.** Self-reporting and self-honoring are the same actor.
- **Detection.** Compare stated caps in opening packets to actual commit/time outcomes in freeze artifacts. If actuals exceed caps systematically, the boundary is fictional.

---

## 5. Blast radius per transition failure

Estimated breadth of damage if a transition failure goes uncaught.

| Transition | Failure | Blast radius |
|---|---|---|
| 0 → 1 | Seed has no consumer outside runtime | Workspace-local. The runtime baseline is unchanged; only the new substrate is fictional. |
| 1 → 2 | register() not respected by all consumers | Workspace-local + branch state. Consumers diverge; no irreversible damage to repo. |
| 2 → 3 | Halt enforced, no observer | Workspace-local; missed work is recoverable; no external irreversibility. |
| 2 → 5 | Observer logs but cannot constrain | Workspace + external services *if* the observer was relied on as a gate (which it cannot be). |
| 3 → 4 | Isolation without coordination protocol | Productivity; cross-module work stalls; no irreversible damage. |
| 4 → 5 | Supervisor reads fragmented state | Decisions made on incomplete state; can lead to wrong halts or missed escalations. |
| 5 → 6 | Channel trains recipient to ignore it | The channel itself is corrupted; rebuilding requires either a new channel or a credibility-restoration plan. |

The blast radius grows monotonically through the transitions. By Phase 5+, failures touch external state (escalation channels, third-party services) and become harder to contain. By Phase 6, the channel is a social artifact; corruption requires a re-introduction, not just a fix.

---

## 6. Reversibility window per transition

How long after a transition failure is detected does it remain cheap to revert?

| Transition | Reversibility window | Why |
|---|---|---|
| 0 → 1 | Indefinite | The seed is a single artifact; deleting it has no downstream consumers yet. |
| 1 → 2 | ~2 weeks after first dependent consumer | Consumers begin to assume register() works as advertised; reverting after multiple consumers depend on it requires unwinding all of them. |
| 2 → 3 / 2 → 5 | ~1 week | Each session run on the new gate or observer accumulates expectations. Revert before expectations harden. |
| 3 → 4 | ~1 month | Isolation is sticky; once skills' SKILL.md documents narrowed scopes, broadening them feels like governance regression. |
| 4 → 5 | ~3 weeks | Supervisor decisions become referenced in artifacts; each reference makes revert more expensive. |
| 5 → 6 | ~immediately to a few days | Channel credibility is the asset; corruption is fast. Revert is "build a new channel," not "fix the old one." |

The reversibility window inverts the team's intuition: early transitions feel reversible because they "are just experiments," but they become irreversible *because experiments accumulate dependents*. By the time the system formally calls something "production," the window has already closed.

---

## 7. The train stall map

Forward movement of orchestration evolution can stall in three distinct ways. Each future bottleneck is classified.

### 7.1 — Hard stalls (forward movement stops entirely)

Conditions under which evolution cannot continue without resolving the stall first. Attempting to push past a hard stall does not produce slow progress — it produces no progress, often with regression.

- **B1 unsolved while attempting Phase 5 / 6.** The runtime cannot be supervised if it is the same process as the loop; building a supervisor on top of B1 produces the decorative supervisor (§4.2) and movement stops at Phase 5.
- **Phase 1 → 2 with diverging readers.** If two consumers split on the seed's shape and the resolution is deferred, every later phase inherits the divergence. The corpus loses internal consistency (`BOTTLENECK_PRECURSOR_SIGNALS.md` §10) — no honest readings can be produced.
- **Phase 5 supervisor without Phase 3 governance.** The observer halts on encountered behavior it cannot constrain. Each halt is permanent (no enforcement to release the halt). System grinds.
- **Phase 6 channel corrupted before Phase 7.** A trained-to-ignore escalation channel cannot be the first defense for unattended overnight. Phase 7 cannot land on a corrupted channel.
- **Doctrine corpus self-contradiction.** Per `BOTTLENECK_PRECURSOR_SIGNALS.md` §10. If the docs in `docs/runtime/` lose consistency, the radar produces inconsistent readings; sequencing intelligence becomes unreliable.

Hard stalls share a property: the longer the stall is ignored, the more the team's expected throughput drifts from real throughput, and the larger the gap between perceived and actual readiness.

### 7.2 — Soft slows (forward movement continues, slower)

Conditions that increase per-packet cost without stopping evolution. Soft slows are tolerable in the short term and corrosive in the medium term.

- **Entropy in ledger files** (`CONSTRAINT_RADAR.md` §5.5). Resume cost rises; sessions still resume.
- **Branch aging.** Long-lived analysis branches (e.g., this one) raise eventual merge cost; branches still merge.
- **Module isolation without coordination protocol** (§2.4). Cross-module work slows; single-module work proceeds.
- **Governance lag.** Some rules in prose, some in config. New packets cost more to author; packets still author.
- **Doc-as-contract pattern accumulating** (`BOTTLENECK_PRECURSOR_SIGNALS.md` §7.1). Each new contract doc costs reading time; the system still functions.
- **Heterogeneous cost reporting** (`BOTTLENECK_PRECURSOR_SIGNALS.md` §6.3). Decisions made on inconsistent units are slower; decisions still get made.

Soft slows are diagnosable by relative comparison: "this packet took longer than the equivalent did three months ago" with no other explanation.

### 7.3 — Silent compounders (look fine; get worse)

The most dangerous category. Each silent compounder passes routine inspection. Collectively they shift the system's baseline so far that a future return to the original baseline is implausible.

- **Self-reported budget compliance with measurement absence.** The numbers look fine; the numbers were never real.
- **Audit-log substrate framing** (§4.1). Records accumulate; orchestration value is zero.
- **Decorative supervisor** (§4.2). Status displays exist; constraint exists nowhere.
- **Aspirational packet template usage** (§4.3). Form followed; substance lost.
- **Post-hoc rule landfill** (§4.4). Each rule individually justified; aggregate unreadable.
- **Fake-supervisor language creep.** Each occurrence of "running in the background," "watching," "auto-recovers" in artifacts gets absorbed into team vocabulary. By the time the language is challenged, it is consensus.
- **"We don't measure it anyway" pattern recurrence** (`BOTTLENECK_PRECURSOR_SIGNALS.md` §7.3). Each constraint relaxed for measurement-honesty reasons appears virtuous; cumulative relaxation dissolves the constraint surface.
- **Heartbeat-without-consumer patterns recurring.** Each new "lifecycle field" written but unread reproduces today's `last_heartbeat` situation in a new place. The pattern's presence in two places normalizes it.

Silent compounders are detected by *looking for them* deliberately. Steady-state operations will not surface them.

---

## 8. Cross-transition failure modes

Failures whose causes cross transition boundaries. Listed because they are the hardest to diagnose: each individual transition appears healthy; the failure is in the joint.

### 8.1 — Phase 2 + Phase 3 incoherence
register() lands and governance lands but they reference each other in ways neither doc commits to. register() assumes the governance applies; governance assumes register() reports correctly. Each is independently consistent; together they have a circular reference that holds until tested.

### 8.2 — Phase 4 + Phase 5 read/write skew
Module isolation creates per-module write scopes; supervisor expects a unified read view. Each is correctly designed within its own scope. The skew is at the seam.

### 8.3 — Phase 5 + Phase 6 without Phase 3
Observer + channel without governance produces a system that escalates a lot without preventing anything. Each escalation is correct. The volume of escalations corrupts the channel within weeks.

### 8.4 — Doctrine drift across phases
The doctrine corpus in `docs/runtime/` is read at the start of each phase to define safe behavior. If a phase's substrate changes the meaning of doctrine without updating the docs, every subsequent phase is built on a misunderstood foundation. The docs are the contract; phases consuming the contract must trigger doc updates.

---

## 9. Forbidden during a transition

Behaviors that are L1-honest but become L2/L3-dishonest *during* a transition, because the transition has temporarily broken assumptions both phases relied on.

- **Asserting that the new phase is "production."** A phase is production when its full failure surface has been observed for >30 days under load. Earlier assertions invite over-reach.
- **Removing prior-phase artifacts immediately on transition.** The prior phase's heuristics often catch transition failures the new phase cannot yet see. Keep both for ≥1 cycle.
- **Authoring packets that depend on the new phase's invariants** during the transition window. Packets pin invariants; transition is the worst time to pin.
- **Marking transition complete on the day it lands.** A transition is provisional for at least one full session-cycle of observed work. Premature completion claims are the highest-yield false-success generator.

---

## 10. The single sentence

Phase transitions fail not at landing but in the gap immediately after — the system's confidence is highest and its observed reliability lowest precisely when over-reach is most expensive; this catalog names the failure shapes so the gap can be navigated rather than rationalized.
