# Orchestration Bottleneck Map — AccentOS

> Analysis only. No implementation, no governance change, no runtime mutation.
> Companion to `ORCHESTRATION_MATURITY_MODEL.md` and `UNATTENDED_EXECUTION_PREREQUISITES.md`.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
>
> Source-doc note: same caveat as the other two docs in this series. The FIRST READ catalogs (EXECUTION_PATTERN_CATALOG, ORCHESTRATION_ERGONOMICS, TELEMETRY_SIGNAL_CATALOG, BOTTLENECK_VISIBILITY_SPEC, SESSION_STATE_SURFACE, STATUS_MD_V2, CODEX_EXECUTION_PROTOCOL, OVERNIGHT_STATUS) do not exist in the repo at this date. The bottleneck map is grounded in the artifacts that do exist (`autonomous-mode`, `prompt-queue`, `efficiency-monitor`, `codex-review`, `.claude/settings.json`, `.claude/CLAUDE.md`, the markdown ledger, `scripts/*`). If any of those FIRST READ docs ships later, revisit this map — it may invert ordering.

---

## 0. How to read this document

A bottleneck is whatever is *currently* the binding constraint on the next maturity step. Solving a non-bottleneck is throughput-negative — it adds capability the rest of the system cannot use, plus surface area the team has to maintain.

The map is ordered. Each bottleneck must be addressed before the next one can produce real leverage. Working out of order is the most common premature-automation failure.

Each entry has the same shape:

- **What it is.** Plain description.
- **Why it's binding right now.** What downstream capability it gates.
- **Leverage multiplier.** Rough estimate of throughput impact if solved well — *and the explicit assumption that makes that estimate true*. Drop the assumption, drop the multiplier.
- **Entropy source.** What introduces noise / drift around this bottleneck and makes it hard to keep solved.
- **Relay cost.** What it costs (in human time, attention, context-switches) to compensate for it not being solved.
- **Stabilization constraint.** Whether the bottleneck is in a state where it can be solved without re-solving it next month.

---

## 1. Bottleneck inventory (ordered by leverage)

### B1 — The runtime is the same process as the loop

- **What it is.** The "autonomous loop" runs entirely inside one Claude turn (see `autonomous-mode/SKILL.md:155–180`). When that turn ends — for any reason — the loop ends. There is no process outside the turn that knows the loop existed.
- **Why it's binding right now.**
  - Every other autonomy capability (durable resume, supervisor, swarm, overnight expansion) is a special case of "something outside the runtime watches / coordinates the runtime." Without that something, none of them are real.
  - The current heartbeat (`last_heartbeat` in `autonomous_mode.json`) has *no consumer*. It is written but not read. That is a one-line proof of B1 being binding.
- **Leverage multiplier.** Largest in the system. Splitting the runtime from the loop unlocks L2, L3, and is the precondition for L4. Estimate: 2–4× effective unattended throughput (more wall hours of useful work per week of human attention), assuming the new "outside" process is itself simple and does not become its own bottleneck.
- **Entropy source.** The skill specs are written in narrative pseudocode. New contributors (including future Claude sessions) read the spec and reason as if the loop were durable. The doc accidentally simulates the missing capability. Every read of `autonomous-mode/SKILL.md` reinforces the illusion.
- **Relay cost.** Each session death costs the human one re-orientation (~5–10 minutes: read WORK_IN_PROGRESS, read last commit, read SESSION_LOG, restart). Multiply by the rate of session deaths to get the steady-state tax. Today this tax is invisible because Michael is always the one paying it; that means it is felt but not measured.
- **Stabilization constraint.** Stable. The shape of the fix (state file authoritative, session-start parses it, single-writer lock) is well-understood. The only risk is overbuilding it.

### B2 — Resume state is prose, not data

- **What it is.** `WORK_IN_PROGRESS.md` is the documented session-resume entry point (`.claude/CLAUDE.md` step 3) and is free-form Markdown. `autonomous_mode.json` is structured but is not the canonical resume record — it is a sidecar.
- **Why it's binding right now.**
  - Without B2 solved, B1 cannot be solved durably. A supervisor process needs a record it can parse without an LLM. Today it would have to either run an LLM to read prose (cost + latency + non-determinism) or trust regex (brittle).
  - Resume after a crash today involves re-reading prose and inferring intent. Reliability is whatever Claude's reading-and-inference quality is on that prose at that moment.
- **Leverage multiplier.** Second-largest, *but only if B1 is also addressed* — solving B2 alone produces a structured file that nothing reads. Estimate (paired with B1): 1.5–2× over B1-alone, because durable resume with structured state takes resume-from-crash from "minutes of human effort" to "automatic."
- **Entropy source.** WORK_IN_PROGRESS.md gets edited mid-flow with whatever is most recent and most useful to the human. Every useful edit makes the file harder to parse. Useful and machine-readable are in tension.
- **Relay cost.** Re-reading prose to reconstruct state is a session-startup tax — happens on every session, not only after failures. Lower per-event than B1's relay cost, higher in aggregate because of frequency.
- **Stabilization constraint.** Stable, but only if the prose mirror is preserved. Removing the human-readable file in favor of pure JSON is a regression in operability. The right shape is "JSON is canonical, Markdown is rendered from JSON or maintained alongside as a deliberate mirror."

### B3 — No structured cost / cycle-time series

- **What it is.** PROMPT_LOG.md, SESSION_LOG.md, and the Stop-hook aggregator (`scripts/efficiency-aggregate.sh` writing into `skills/efficiency-monitor/efficiency-log.md`) capture qualitative session signals. They do not capture per-commit token spend, per-task wall time, or per-skill cost. Token budget tracking inside `autonomous-mode/SKILL.md:180` is "evaluate `actual_tokens vs estimated_tokens × 0.8`" — `actual_tokens` is set to 0 in the example state file with no documented incrementer.
- **Why it's binding right now.**
  - Adaptive routing (a tempting next step) requires a cost series. There is none.
  - Time/token-budget enforcement in the loop is unverifiable post-hoc — there is no record of what the loop "thought" the spend was at each check.
  - Supervisor budget enforcement (L3 prerequisite) needs the supervisor to *measure* spend, not infer it. The measurement source does not exist.
- **Leverage multiplier.** Third. Modest unless B1 and B2 are solved first. Estimate (in concert): 1.2–1.5× — primarily by making bounded execution actually bounded instead of "bounded if Claude remembers."
- **Entropy source.** The Stop-hook aggregator's design is good, but its output is not designed to feed an orchestration consumer. Drift will happen if "telemetry for humans" and "telemetry for the supervisor" continue to share one schema.
- **Relay cost.** Today's relay is "Michael notices the session has been running too long." This is a human-attention tax that scales with run length — exactly the wrong scaling property for unattended execution.
- **Stabilization constraint.** Mostly stable. Risk: building this before the schema of the supervisor's needs is known leads to a series tuned for the wrong consumer.

### B4 — Shared markdown as concurrency surface

- **What it is.** `WORK_IN_PROGRESS.md`, `PROMPT_QUEUE.md`, `SESSION_LOG.md`, and `BUILD_PLAN_*.md` are edited by Claude. The parallel-drain spec (`prompt-queue/SKILL.md:339–377`) dispatches up to 5 subagents per wave that share this filesystem. Today's subagents run inside one parent turn, which keeps contention low. The moment subagents persist beyond the turn or run in separate processes, the markdown becomes a race surface.
- **Why it's binding right now.**
  - Swarm scaling cannot ship without a non-shared queue store. B4 is the gating constraint for L4.
  - It is *not* binding for L2 or L3 — those don't add concurrent writers.
- **Leverage multiplier.** Zero today (no real concurrency exists), large later (gates L4 entirely). Estimate when activated: 1.5–3× on parallelizable batches, *assuming the items in those batches are actually parallelizable*. Many AccentOS items are not (touch shared modules), so the realized multiplier is a fraction of the theoretical.
- **Entropy source.** Every new doc that Claude is told to update on every step is one more shared-write target. The list is growing.
- **Relay cost.** Zero today. Will be non-zero the first time a parallel drain produces a merge conflict on a file Claude is supposed to be the sole writer of.
- **Stabilization constraint.** Unstable until the doc-edit policy is made explicit — which files are "live editable by Claude" vs. "snapshot-only."

### B5 — No external escalation channel

- **What it is.** When the loop halts cleanly, Michael learns about it next time he opens the session. There is no SMS / push / email out of the runtime. The Cloudflare Worker exists for Anthropic API CORS, not for orchestration signaling.
- **Why it's binding right now.**
  - Unattended overnight is impossible without B5 — "unattended" without escalation is "unobserved."
  - It is the only L3 prerequisite that requires a piece of infrastructure beyond the repo and Claude. Everything else is internal.
- **Leverage multiplier.** Step-function for overnight. Zero for daytime work. Estimate: makes the difference between "overnight = possible" and "overnight = forbidden." There is no fractional version.
- **Entropy source.** The first false-page silences future real pages. The channel must be aggressively low-noise from day one.
- **Relay cost.** Currently zero (no overnight runs allowed). Will be human sleep quality once overnight is enabled — high to a single individual.
- **Stabilization constraint.** Stable once chosen. The technology is not the hard part; the rule that decides what counts as escalation-worthy is.

### B6 — Implicit blast-radius policy

- **What it is.** `autonomous-mode/SKILL.md:80–90` lists tasks that halt the loop. The list is good. It is also *narrative* — a human reads it and decides to honor it; nothing enforces it. There is no "this commit cannot push to main" guardrail except convention.
- **Why it's binding right now.**
  - Stretches the higher levels of maturity. Autonomy + soft enforcement is the worst combination: the system *can* do the thing, and the only defense is "Claude remembered the rule."
- **Leverage multiplier.** Low in throughput terms; high in survivability terms. Failure here is correlated — when it fails, it fails large. Multiplier in the unhappy-path tail: very large.
- **Entropy source.** Every new skill adds new actions; the forbidden list does not auto-update.
- **Relay cost.** Today: low (human is reachable). At L3+: prohibitive (a 3am incident with the wrong action taken is a six-figure relay cost in worst-case scenarios — production data, billing-impact API calls).
- **Stabilization constraint.** Unstable until enforcement is moved out of skill specs and into either harness configuration (permissions, network egress allow-list) or runtime checks.

### B7 — Single human reviewer for cross-agent output

- **What it is.** `codex-review` is the only place in the repo where another agent's output is treated as adversarial-by-default. The pattern (LOW auto, HIGH gated, replay artifacts on disk, post-edit re-validation with revert) is solid. The bottleneck is that the HIGH gate is Michael; his review bandwidth is finite.
- **Why it's binding right now.**
  - Self-healing (L5 prerequisite) wants every recovery rule to have provenance and negative tests. Today the only review channel that produces that quality of artifact is codex-review, and it goes through Michael.
  - It is not binding for L2 or L3. It becomes binding around L4–L5.
- **Leverage multiplier.** Modest now, large at L5. The honest leverage move is *not* automating Michael's review — it is reducing the number of HIGH items per run by improving the prompt and validation, so his attention stretches.
- **Entropy source.** Codex's prompt template lives in the skill spec; drift between prompt and reality (new skills, new patterns) silently lowers the gate's quality.
- **Relay cost.** Per HIGH item: minutes of Michael's attention. Per missed HIGH item: a bad auto-applied edit landing in a skill, then propagating to other skills.
- **Stabilization constraint.** Stable as long as Codex's behavior is stable; unstable across model upgrades.

---

## 2. Ordering and dependencies

```
B1 (split runtime from loop)
  └── B2 (structured resume state) — can start in parallel; ships only after B1
        └── B3 (cost/cycle-time series) — useful only once B1+B2 enable a supervisor
              └── B5 (escalation channel) — only useful once B3 has thresholds to escalate on
                    └── unattended overnight execution unlocked

B4 (shared markdown contention)
  └── only ever binding when L4 (swarm) is on the table; do not address before B1–B3.

B6 (blast-radius enforcement)
  └── must be addressed before B5 escalation is wired, because escalation without
      enforcement turns "page Michael" into "Michael is paged but the bad action
      already happened."

B7 (cross-agent review bandwidth)
  └── address late. Solving it early invites premature automation of judgment
      calls that are still unstable.
```

The shortest safe path through this graph for the stated mission (bounded overnight execution → reliable unattended orchestration maturity):

**B1 → B2 → B6 → B3 → B5.** B4 and B7 sit outside this path and should *not* be picked up opportunistically.

---

## 3. Why human relay is still necessary today

This question deserves an honest answer. The relay (Michael ↔ Claude session) feels like overhead, and the temptation is to remove it because it feels like overhead.

The relay does at least four things that nothing else in the system currently does:

1. **Liveness check.** When Michael notices the session has been quiet for too long, he restarts it. Without him, no other process notices.
2. **Out-of-band escalation.** When something is wrong, Claude tells Michael in plain English. There is no other channel.
3. **Authoritative resume.** When the session dies, Michael decides where to resume from. His decision is grounded in context the structured state cannot express ("we changed direction on Tuesday").
4. **Permission of last resort.** `dangerouslySkipPermissions` is on; Michael's presence is the actual permission boundary. Removing him without replacing this function expands the blast radius silently.

A "remove the relay" project that addresses (1)–(3) but not (4) is the most dangerous shape this work can take. (4) is not a technical capability — it is a governance question, and it is explicitly out of scope for this analysis.

The relay should be *reduced*, not *removed*. Reduction targets each of (1)–(3) with a specific replacement. (4) gets a separate, deliberate decision when the time comes.

---

## 4. Dangerous illusion zones

These are the places where surface inspection of the system suggests a capability is present that is not. Each one is a real, current temptation.

### Illusion 1 — "We have an autonomous mode, so we can leave it running"
Reality: `autonomous-mode/SKILL.md` documents a loop. The loop is one Claude turn. Leaving it running means leaving one turn open. Closing the laptop ends it.

### Illusion 2 — "The Stop hook is supervision"
Reality: it is post-mortem aggregation. It runs *after* the session ends. It cannot detect a session that is alive but stuck, and it cannot escalate. The aggregator (`scripts/efficiency-aggregate.sh`) is correctly scoped — it is being miscategorized, not under-built.

### Illusion 3 — "The autonomous_mode.json file is durable resume"
Reality: it is a status sidecar. Nothing reads it on session start as authoritative. The session-start sequence reads `WORK_IN_PROGRESS.md`. Until that changes, the JSON file is documentation, not state.

### Illusion 4 — "Parallel drain is a swarm"
Reality: it is a wave of subagents inside one Claude turn. Without out-of-runtime claim arbitration, it is L1 with concurrency, not L4. Calling it a swarm gives confidence it has not earned.

### Illusion 5 — "Codex-review proves we can let other agents act"
Reality: codex-review proves we can let another agent *propose* and use a strict gate to filter. It does not prove we can let another agent *act*. The gate's existence is the entire mechanism — removing the gate doesn't elevate the runtime, it removes the only thing that made it safe.

### Illusion 6 — "Token budgets are enforced"
Reality: `actual_tokens` is documented as a field; no incrementer is documented to keep it accurate. Mid-item budget checks rely on Claude's self-estimate, which is unreliable across long runs. The budget is suggestive, not enforced.

### Illusion 7 — "BUILD_PLAN_CLAUDE.md walking is deterministic"
Reality: it is "first `[ ]` item with no unresolved BLOCKS ON MICHAEL." That phrase requires interpretation; two sessions can choose differently. Determinism here is the human keeping the plan tight, not the algorithm being precise.

---

## 5. Premature automation risks

A list of moves that look like the next step and are not. Each of these has a plausible-sounding case and a real failure mode.

- **Auto-drain the prompt queue overnight.** Plausible: the queue exists, drain exists, just remove the gate. Failure mode: any item with a halt-and-wait behavior parks silently; any item with a transient failure retries forever; any item with a billing implication runs unattended. The gate is doing real work today.
- **Add adaptive routing to the queue.** Plausible: optimize execution order. Failure mode: routing layer's preferences quietly diverge from Michael's, with no audit trail. The routing decisions are themselves untracked, so the system is making choices it cannot justify.
- **Spin up a swarm via the Agent tool.** Plausible: fan out work, finish faster. Failure mode: shared markdown contention turns parallel work into serialized retries with conflict resolution overhead, often slower than serial.
- **Ship self-healing rules from imagined failures.** Plausible: harden the runtime. Failure mode: rules built without real failure data recover from cases that don't happen and miss the cases that do. The catalog needs real events first.
- **Promote the autonomous-mode SKILL.md from "documented loop" to "documented runtime" by adding more steps to it.** Plausible: tightening the spec. Failure mode: the spec is not the runtime. Adding steps to the spec makes the illusion stronger without changing what executes.
- **Move WORK_IN_PROGRESS.md to JSON for "rigor."** Plausible: structured state is better. Failure mode: removes the human-readable surface that makes session resume actually work for Michael. The right shape is dual-mode (structured canonical + prose mirror), not single-mode.
- **Add a second Claude session to "watch the first one."** Plausible: external supervisor. Failure mode: same harness, same failure modes, same blind spots — and now two sessions racing on the same files. The supervisor must be a different shape of process, not another Claude turn.
- **Build a fancy queue UI before fixing claim arbitration.** Plausible: usability win. Failure mode: every UI action becomes a write to PROMPT_QUEUE.md and the contention gets worse, not better. Fix the store, then build the UI.

---

## 6. Points where "more autonomy" decreases throughput

Underappreciated and worth naming explicitly.

- **Autonomy without resume.** A 2-hour run that dies at minute 90 produces less work than a 30-minute attended run that completes. Autonomy multiplies the cost of the failure case faster than it shrinks the cost of the happy case, until durable resume exists.
- **Parallelism without isolation.** A wave of 5 subagents that conflict on shared markdown produces fewer net commits than 1 subagent doing the same work serially, because the conflict resolution is itself work — and that work happens at the human's expense (or at Claude's confused expense).
- **Routing without telemetry.** Reordering items based on a guess produces worse results than honoring the human's order, until the cost data justifies the reordering. The payoff curve is concave; the early portion is negative.
- **Recovery without a real catalog.** Auto-retrying a step with an unknown failure mode is a coin flip on whether the retry produces a different failure or papers over a real bug. Either way, the human's attribution cost goes up.
- **Larger scope per run before durability.** An overnight run with broader scope and no durable state is one big failure waiting to happen. Smaller, capped runs that complete cleanly produce more weekly output than larger runs that fail and need full re-orientation.
- **Removing the human gate before an alternate gate exists.** The gate is throughput-negative on every individual decision and throughput-positive on the one that would have been catastrophic. Net throughput sign is positive until the alternate gate is in place.

The pattern: each of these has a positive ceiling but a negative floor, and we are below the floor. Doing them now lowers throughput; doing them after the prerequisites are in place raises it. Order matters more than ambition.

---

## 7. Summary in one sentence

The single binding constraint is that the runtime is the same process as the loop; everything else on this map is either a downstream consequence of that fact or a temptation that becomes safe only after that fact is no longer true.
