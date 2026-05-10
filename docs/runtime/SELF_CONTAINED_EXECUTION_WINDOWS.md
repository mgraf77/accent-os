# Self-Contained Execution Windows — AccentOS

> Doctrine only. No runtime claims, no implementation, no governance change.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companion to `RELAY_COMPRESSION_PROTOCOL.md`. Read that first.

---

## 0. Frame

A **self-contained execution window** is a single Claude session, scoped by a single packet (per `RELAY_COMPRESSION_PROTOCOL.md` §2), that runs for an extended period (typically 30 minutes to a few hours) and exits cleanly without intermediate Michael input. The window is *bounded* — it has a named end. It is *self-contained* — it does not require external input mid-flight.

This is the maximum useful shape of work at L1. It is **not**:
- A runtime
- A daemon
- A queue
- A supervisor
- An autonomous agent
- An overnight execution mechanism (overnight requires L3, see `UNATTENDED_EXECUTION_PREREQUISITES.md` §5)

It is one Claude session, started by Michael, ended by a named threshold. The novelty is in the packet's quality, not in the runtime.

---

## 1. What "self-contained" means concretely

A window is self-contained when, between Michael's opening relay and Claude's clean-freeze, no inputs from outside the session are required for the packet to make progress. The test:

| Requirement | Self-contained answer |
|---|---|
| Inputs needed for any sub-step | All present in repo, packet, or stable session-start state at start |
| Decisions Claude must make | All on the packet's authority list (`RELAY_COMPRESSION_PROTOCOL.md` §6) |
| External services called | All credentialed at start; no mid-flight credential prompts |
| Approvals needed | None. If an approval would be needed, the packet must freeze |
| Files to create | Paths derivable from the packet without ambiguity |

If any answer is "ask Michael," the window is not self-contained — it is a relay disguised as a window.

---

## 2. Required packet properties for a multi-hour window

In addition to the six packet properties from `RELAY_COMPRESSION_PROTOCOL.md` §2, a multi-hour window adds five more:

### 2.1 — Inner loop is named
The packet identifies the repeating sub-sequence Claude will execute (e.g., "for each item in [list]: read → edit → test → commit → push → update WIP"). The loop is the unit of progress. Hours = N loop iterations.

### 2.2 — Per-iteration cap
Each iteration has a cap. Default: one commit per iteration unless the packet explicitly authorizes multiple. Capping per-iteration prevents one runaway iteration from consuming the entire window.

### 2.3 — Iteration-count cap (commit cap)
The window halts after N total iterations regardless of wall time. At L1 this is the only cap that is reliably enforceable — token spend and wall time are not measured precisely, but commit count is observable. Treat commit count as the canonical proxy.

### 2.4 — Stated abandonment criteria
What makes the window stop early as a *win* (scope exhausted, queue empty) vs. *neutral exit* (cap reached) vs. *escalation* (blocker hit). Three named outcomes, not one.

### 2.5 — Pre-flight check
Before iteration 1, Claude verifies the preconditions in the packet are still true. Files exist, branch is clean, no uncommitted changes from a prior session. Pre-flight failure freezes immediately with a specific note — does not attempt to "fix" the precondition.

A packet missing any of these five becomes a relay-heavy window in disguise.

---

## 3. Local decision authority within the window

Local authority is the explicit list of decisions Claude may make inside this window without escalating. It is *strictly narrower* than the standing authority list — windows tighten, never widen.

A workable shape:

- **Per-window MAY list.** Inherited defaults from `RELAY_COMPRESSION_PROTOCOL.md` §6 plus packet-specific additions ("MAY pick the import path between two equivalents"; "MAY skip a sub-step that errors with a specific known signature").
- **Per-window MUST-NOT list.** Inherited defaults plus packet-specific tightenings ("MUST NOT touch js/csv_import.js even if a sub-step suggests it"; "MUST NOT introduce new npm dependencies").
- **Per-window MUST-ESCALATE list.** Specific situations the packet anticipates and pre-routes to escalation.

The shape of the list is more important than its contents. Authority that is implicit is the most common cause of windows-that-pretend-to-be-autonomy.

---

## 4. Escalation boundaries

A self-contained window has three exit dispositions: completion, neutral cap, escalation. Each is a documented act, not a side effect.

### 4.1 — Completion
The packet's stated scope is done. All exit criteria for "win" are satisfied. Clean-freeze artifact reflects "completed" and recommends either no next-packet or a fresh-scope next-packet.

### 4.2 — Neutral cap
A cap (commits, time, scope partial) tripped before completion. Window stops mid-scope. Clean-freeze artifact reflects "capped" and the next-packet should be a continuation of the same scope, not a new one.

### 4.3 — Escalation
A threshold from `RELAY_COMPRESSION_PROTOCOL.md` §7 tripped, or a packet-specific escalation criterion fired. Clean-freeze artifact reflects "escalated" with the specific signature and what Michael needs to decide. Next-packet is *not* generated; the chain pauses.

The three dispositions are mutually exclusive. A window does not "complete with notes about open questions" — open questions are escalations.

---

## 5. Packet self-sufficiency

Self-sufficiency is the property that the packet, read in isolation by a fresh Claude session, contains everything needed to start. The session's own auto-execute steps (`.claude/CLAUDE.md`) provide standing context; the packet provides the rest.

**Self-sufficiency rules:**

- **No external links** the session cannot fetch. URLs are fine if the session can `WebFetch`; "see the doc Michael sent on Slack" is not.
- **Inline the salient facts.** If the packet depends on a specific schema, paste the schema into the packet rather than referring to "the schema in the migration."
- **Quote the standing rules** that matter. If a packet relies on a specific halt-list item being honored, name it explicitly even though the standing list already covers it.
- **State the day-of facts.** Branch name, base commit SHA, expected next commit count after completion. These move; do not assume.
- **Mark the stale parts.** If part of the packet is "as of last session, X was true," say so. Self-sufficiency does not mean omniscience.

A self-sufficient packet survives the worst-case L1 condition: a fresh session with no memory of the previous run. If the packet only works when pasted into a session that "already knows," it is not self-sufficient.

---

## 6. Orchestration compression in this shape

The compression is not infrastructure compression — it is *meeting* compression. A 2-hour self-contained window with one opening relay and one closing artifact replaces what would otherwise be ~10–20 small relays. The total clock time is similar; the human attention required drops by an order of magnitude.

The compression ratio is bounded by:

- Iteration cap (more iterations per window = more compression, until quality drops)
- Authority list breadth (broader = fewer mid-flight escalations, but riskier)
- Scope homogeneity (similar items per window compress better than mixed)
- Cleanliness of the clean-freeze artifact (worse artifact = next packet costs more to compose)

Optimal at L1 today, by observation: 30–90 minute windows of 3–8 commits, with authority broadened only by item-class within the packet, not by category.

Pushing toward 3+ hour windows at L1 stops compressing and starts gambling. The win comes from *more frequent* well-shaped windows, not from heroic single windows.

---

## 7. What the window does not provide

To prevent illusion-creep:

- **Does not provide durability.** Session death ends the window. Resume requires L2 (`ORCHESTRATION_MATURITY_MODEL.md` §1).
- **Does not provide supervision.** Nothing outside the session knows the window is alive. Stuck = stuck until Michael returns.
- **Does not provide concurrency.** One window per session. Subagents inside the window remain inside the parent turn.
- **Does not provide unattended safety.** Michael being out of the room is fine; Michael being asleep is not. The escalation channel (`ORCHESTRATION_BOTTLENECK_MAP.md` B5) does not exist.
- **Does not provide self-recovery.** A failure that the packet did not pre-anticipate freezes the window. There is no L5 self-healing here.
- **Does not provide cross-session learning.** Each window is independent. `efficiency-monitor` aggregates after the fact; it does not feed the next window's authority list.

These are not bugs. They are the L1 contract. The doctrine is to maximize what L1 *can* do, not to paper over what it cannot.

---

## 8. Window archetypes that work today

Three shapes of self-contained window that are well-formed at L1:

### 8.1 — Item-batch window
Scope: a list of N similar items (KPI catalog updates, doc-drift fixes, build-plan check-offs). Inner loop: per-item read → edit → commit. Cap: commit count = N or first error. Strong compression, low risk.

### 8.2 — Single-track-walk window
Scope: walk the next K `[ ]` items in a build plan track until first BLOCKS-ON-MICHAEL. Inner loop: pick → execute → commit → check next. Cap: K items or first blocker. Moderate compression, moderate risk (item heterogeneity).

### 8.3 — Bounded-investigation window
Scope: investigate a specific question and write a doc. Inner loop: gather evidence → draft section → commit section → next section. Cap: doc complete or N sections. High compression on doc tasks, low risk because output is doc-only.

All three are bounded, all three are self-contained when written per §2, all three exit cleanly. None are unattended; none survive session death.

Window archetypes that are **not** L1-safe and should not be attempted under this doctrine:

- **Open-ended-build window.** "Build until done." Open-ended scope plus L1 = likely runaway.
- **Multi-track window.** Switching tracks mid-window costs context every switch and dilutes the authority list. Two short windows beat one wide one.
- **Speculative window.** "Try things and see what works." Real exploration is fine; it should be a single experiment per window with a named exit.
- **Cross-session window.** "Continue last session's run." Even with a clean-freeze artifact, a new session is a new window — the prior window's authority does not carry.

---

## 9. The single sentence

A self-contained execution window maximizes the work one Claude session can do without a relay; it is not, and at L1 cannot become, work without a runtime.
