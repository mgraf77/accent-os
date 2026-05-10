# Relay Compression Protocol — AccentOS

> Doctrine only. No runtime, no governance change, no implementation.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companion to `ORCHESTRATION_MATURITY_MODEL.md`, `UNATTENDED_EXECUTION_PREREQUISITES.md`, `ORCHESTRATION_BOTTLENECK_MAP.md`. Read those first.

---

## 0. What this document is and is not

**Is.** A doctrine for reducing the number of Michael ↔ Claude round-trips required to move a unit of work forward, while staying inside the L1 maturity baseline (`ORCHESTRATION_MATURITY_MODEL.md`). The mechanism is shape-of-prompt, not new infrastructure.

**Is not.** A runtime, a queue, a supervisor, a substrate, a daemon, or a claim that anything is "autonomous." Every pattern below is the human writing better packets. The runtime is unchanged.

**The single test for every pattern in this document.** If the pattern only works because Claude held something in working memory across a relay it cannot survive, the pattern is fake autonomy. Reject it.

---

## 1. The relay function today

The Michael ↔ Claude session round-trip currently does at least four jobs (per `ORCHESTRATION_BOTTLENECK_MAP.md` §3):

1. **Liveness check.** Michael notices when the session is silent.
2. **Out-of-band escalation.** Claude tells Michael in plain English when something is wrong.
3. **Authoritative resume.** Michael decides where to pick up.
4. **Permission of last resort.** Michael's presence is the actual permission boundary under `dangerouslySkipPermissions: true`.

This document targets reducing the *frequency* of (1) and (3). It does **not** target removing (2) or (4) — those require maturity steps that are not in scope.

A relay reduction that addresses (1) and (3) but silently weakens (2) or (4) is a regression dressed as progress.

---

## 2. The unit of compression: the packet

A **packet** is one Michael-authored prompt that produces a bounded execution window inside a single Claude session. Compression is measured in packets-per-unit-of-work, not commits-per-unit-of-work.

Properties of a well-formed packet:

- **Stated scope.** What is in scope, what is out.
- **Stated exit conditions.** Time, items, tokens, blocker classes.
- **Stated forbidden actions.** A packet-local list that overrides any standing permission.
- **Stated authority.** What decisions Claude may make locally without escalating.
- **Stated escalation triggers.** What surfaces a halt-and-wait.
- **A self-sufficient context.** All inputs needed are either in the packet, in the repo, or in stable session-start state. No "ask Michael for the X" mid-flight.
- **A clean-freeze contract.** What the closing artifact must contain so the next packet can continue without re-relay.

A packet without all six of those properties is a relay, not compression.

---

## 3. Relay minimization patterns

Patterns that reduce relay count, in priority order. Each one is safe at L1.

### 3.1 — Bigger scope per packet, narrower exit
Most relay overhead today is "Claude finished a small thing and asked what next." A packet with a larger scope but a tight exit (e.g., "do all of these N items, halt on first blocker") collapses N relays to 1.

The danger is letting "bigger scope" become "vaguer scope." The mitigation is the named exit list — every packet must say what stops it.

### 3.2 — Pre-stated decisions
Anything the packet author can decide up front should be decided up front. If a sub-step has two reasonable options, name the one to take. Claude making the choice mid-flight is faster than relaying it but slower than not having to choose.

The danger is over-specifying — the author starts writing the work instead of the packet. The mitigation is the authority list (§6): only pre-state decisions that affect packet flow, not implementation details.

### 3.3 — Pre-loaded context references
A packet that says "read X, Y, Z first" beats one that asks for the same files in a follow-up turn. References are cheaper than relays.

The danger is preloading context Claude doesn't need; it inflates token spend and dilutes attention. The mitigation is one rule: only preload what the packet's exit conditions require.

### 3.4 — Generated next-packet at clean-freeze
On clean freeze, Claude writes the next packet as a copy-pasteable block (see §8). Michael's relay shrinks from "compose a new prompt" to "paste."

The danger is the generated packet drifts from what Michael actually wants. The mitigation is the packet contains everything Michael needs to *edit it down* in seconds before pasting — never resubmit blind.

### 3.5 — Bundled doc updates
Doc-only updates batched into the session-end commit (per `.claude/CLAUDE.md` OPERATING RULES) is already this pattern. It is a relay-compression pattern; name it as such.

### 3.6 — Standing skill invocations
A skill that always runs at session start (`vibe-speak`, `efficiency-monitor`) reduces relay count to zero for the work the skill does. The pattern composes with packets: a packet inherits everything the standing skills already do.

---

## 4. Long-running bounded packets

A "long-running" packet runs for hours inside one session. Long-running does **not** mean unattended; the human may still be reachable. What it means is that the relay frequency drops because the packet is composed to do many sub-steps before exiting.

Required structure:

- **Inner loop.** A documented sequence of sub-steps the packet repeats. Same shape as `autonomous-mode/SKILL.md:155–180` but parameterized by the packet author, not by a standing skill.
- **Per-iteration exit check.** After each sub-step, evaluate exit conditions. Mid-item exit (per `autonomous-mode/SKILL.md:180`) is mandatory, not optional.
- **Per-iteration heartbeat.** Update `WORK_IN_PROGRESS.md` after every sub-step. Today's CLAUDE.md already requires this; the long-running packet relies on it.
- **Hard stop on blocker classes.** A packet inherits the `autonomous-mode` halt list (Supabase migrations, force-pushes, public deploys, etc.) and may add its own narrower halts. Never widens.
- **Token-budget self-cap.** If actual cost is invisible, use a *commit count* cap as a proxy. "Halt after N commits" is enforceable; "halt at K tokens" is wishful at L1.

This is the maximum the L1 baseline supports honestly. Anything more requires the L2 / L3 prerequisites in `UNATTENDED_EXECUTION_PREREQUISITES.md`.

---

## 5. Continuation chaining

Continuation chaining is the human-driven sequence of packet → freeze → next-packet → freeze → next-packet. The chain is **always** linked by a Michael relay; what gets compressed is the *content* of each relay, not the existence of the relay.

Three legitimate chaining patterns:

### 5.1 — Sequential continuation
Packet N writes a clean-freeze artifact. The artifact contains a draft of packet N+1. Michael reads, edits if needed, pastes. The chain is sequential and intentional.

### 5.2 — Branching continuation
Packet N's clean-freeze artifact lists 2–3 candidate next packets, each ranked with rationale. Michael picks one. Useful when the next packet depends on what packet N actually produced.

### 5.3 — Defer continuation
Packet N's clean-freeze artifact says "no good next packet without [external thing]." The chain pauses; Michael does the external thing, then chains a fresh packet.

**Forbidden chaining patterns** (these are fake autonomy):

- Packet N spawns packet N+1 without Michael in the loop. There is no mechanism for this at L1, but the doc temptation exists ("the skill auto-fires the follow-up"). Reject on sight.
- Packet N+1 is generated as if it were already executed. The next-packet is a *proposal* to Michael, not a record of what happened.
- A standing skill auto-runs a follow-up packet on session start. The session-start sequence is for status + context, not for executing chained work without a relay.

---

## 6. Bounded continuation authority

Every packet must include an explicit authority list — the decisions Claude is permitted to make inside the packet without escalating. Two reasons this is mandatory: (a) it defines the local decision boundary so packets are not chains of micro-relays; (b) it makes the boundary auditable after the fact.

A reasonable default authority list for AccentOS packets:

- **MAY decide locally.**
  - Which file to edit when multiple satisfy the requirement
  - Which test to add when the packet says "add appropriate tests"
  - Branch naming, commit message wording (within house style)
  - Which order to do independent sub-steps
  - Whether a sub-step is small enough to ship without a separate commit (within reason — never bundle unrelated edits)

- **MUST escalate.**
  - Anything in the standing halt list (`autonomous-mode/SKILL.md:80–90`)
  - Any decision the packet does not explicitly authorize
  - Any case where the packet's stated premise turns out to be wrong (the wrong file, the wrong table, the wrong sequence)
  - Any external irreversible action not pre-authorized

- **MUST freeze (no decision, no escalation, just stop).**
  - Token / time / commit cap reached
  - Pre-stated exit condition reached
  - Unknown failure with no documented recovery

The authority list inverts the default: **silence is denial**. A decision not on the MAY list is not implicitly granted because the packet "obviously" needs it. Escalate or freeze.

---

## 7. Escalation thresholds

A threshold is a condition that converts continued execution into a relay. Each packet inherits the standing thresholds and may add packet-specific ones.

Standing thresholds (do not omit from any packet):

| Threshold | Action |
|---|---|
| Halt-list action encountered | escalate (write a HALT note, surface, freeze) |
| Pre-commit hook fails | freeze, do not retry past 1 attempt |
| `git push` fails after 4 retries with backoff | freeze, do not switch to `--force` |
| Codex / external API returns error after 1 retry | freeze, log raw error |
| Two consecutive sub-steps fail with different errors | freeze (suggests the packet's premise is wrong) |
| Edit produces a syntax / parse error the first attempt does not catch | freeze (do not iterate without human gate) |
| `WORK_IN_PROGRESS.md` cannot be updated (disk, permission) | freeze immediately, do not commit further |

Packet-specific thresholds are added by the packet author. They tighten standing thresholds; they never loosen.

The principle: thresholds are biased toward freeze, not toward continue. A surplus freeze is one extra relay; a deficit freeze is a corrupted state.

---

## 8. Clean-freeze acquisition

Clean freeze is the act of stopping a packet in a state that the next packet (or the next session) can resume from without re-establishing context.

The acquisition sequence:

1. **Finish the current commit cleanly.** No half-applied edits. If mid-edit, complete or revert — never leave the working tree mid-state.
2. **Update `WORK_IN_PROGRESS.md`** with the current resume point. The file's existing format (CONTEXT / CURRENT BUG or TASK / NEXT STEPS PENDING) is sufficient at L1.
3. **Write the clean-freeze artifact** (see §9 + `ORCHESTRATION_PACKET_TEMPLATES.md` freeze/resume template). The artifact lives in the closing turn's output, not necessarily in a file.
4. **Record the freeze reason** verbatim (which threshold tripped, which sub-step was last completed, which sub-step would have been next).
5. **Generate the next-packet draft** (§3.4). Include enough that Michael can edit it down in <60 seconds before pasting.
6. **End the turn.** Do not ask "should I continue?" — the freeze is the answer.

A clean freeze that requires Michael to read a long prose narrative to understand what happened is not clean. The artifact's job is to be scannable in 30 seconds.

---

## 9. Next-prompt generation doctrine

When clean-freeze generates the next packet, the generated packet must:

- **Be self-sufficient under §2.** Same six properties: scope, exits, forbidden actions, authority, escalation triggers, clean-freeze contract.
- **Cite the freeze artifact as input.** "Resume from clean-freeze artifact in turn ending at HH:MM" is the reference; the artifact is the input.
- **Re-state the standing constraints** rather than rely on Michael's memory. The next packet is read in isolation when pasted.
- **Mark its own assumptions** explicitly. "Assumes: worker `2dca2a6` was deployed manually; verify in step 0." Never silently inherit.
- **Be smaller than the packet that produced it** by default. If the freeze was due to scope creep, the next packet should narrow.
- **Never include "do whatever you think is right."** That phrasing is the signature of fake autonomy and the author of the next packet, not of this one.

If a clean-freeze cannot produce a useful next-packet (the work is genuinely done, or the next step is genuinely unknown until Michael decides), say so explicitly: "No next packet recommended; chain pauses here." Do not invent a next-packet to fill space.

---

## 10. Safe relay reduction vs. fake autonomy

This is the section that matters most. Every other section is in service of getting this distinction right.

| Pattern | Safe relay reduction | Fake autonomy |
|---|---|---|
| Bigger packets | Larger scope, tighter named exits | Larger scope, fuzzier exits ("just keep going") |
| Pre-stated decisions | Author decides up front, packet records | Claude decides mid-flight without authority |
| Standing skills | Auto-run on session start, scope is fixed | Auto-spawn new work without a relay |
| Generated next-packet | Written into the closing turn for Michael to paste | Auto-fired at session start without Michael |
| Heartbeat / WIP updates | Recorded for next session's resume | Treated as supervision (nothing reads them) |
| Long-running packets | Hours within one session, named exits | Hours across sessions without a relay |
| Continuation chaining | Michael links packet N to N+1 | Skill links packet N to N+1 silently |
| Authority list | Explicit per-packet boundary | Implicit "Claude knows what to do" |
| Escalation threshold | Biased toward freeze | Biased toward continue |
| Clean-freeze artifact | Written at every halt | Skipped because "it was obvious" |

The line is whether the relay is *replaced by a human-driven artifact* or *replaced by a runtime claim that does not exist*. Everything in the left column shrinks the human's per-relay cost while keeping the human in the loop. Everything in the right column moves the human out of the loop without putting anything in their place.

---

## 11. The single sentence

Relay compression makes each Michael relay carry more work. It does not make the runtime carry the relay.

---

## 12. What this enables today

Under this protocol, at L1, with no infrastructure changes:

- A 2-hour packet that completes 5–10 commits with one relay at the start and one clean-freeze at the end.
- A chained sequence of 3–4 such packets across a working day with relays only between packets.
- A clean-freeze artifact that lets a fresh session resume in <60 seconds of reading.
- An escalation that arrives at Michael in a form he can act on without re-deriving the situation.

What it does **not** enable, and what no doctrine alone can enable:

- Unattended overnight (requires L3 supervisor).
- Survives session death without re-orientation (requires L2 durable state).
- Multi-runtime parallel work on shared state (requires L4).
- Recovery without a human (requires L5).

The protocol's job is to make L1 maximally useful. Not to pretend it is L3.
