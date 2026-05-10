# Unattended Execution Prerequisites — AccentOS

> Analysis only. No implementation, no governance change.
> Companion to `ORCHESTRATION_MATURITY_MODEL.md`. Read that first.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
>
> Source-doc note: same caveat as the maturity model — the FIRST READ catalogs (EXECUTION_PATTERN_CATALOG, ORCHESTRATION_ERGONOMICS, TELEMETRY_SIGNAL_CATALOG, BOTTLENECK_VISIBILITY_SPEC, SESSION_STATE_SURFACE, STATUS_MD_V2, CODEX_EXECUTION_PROTOCOL, OVERNIGHT_STATUS) are not in the repo at this date. Prerequisites below are derived from the artifacts that exist (the four orchestration-relevant skills, `.claude/settings.json`, the markdown ledger, `scripts/efficiency-aggregate.sh`).

---

## 0. Scope of this document

This document answers one question per capability: **what must already be true before we turn this on?**

It is not a roadmap. It does not order the capabilities. The order is in `ORCHESTRATION_BOTTLENECK_MAP.md`.

A prerequisite is "must be true" if its absence would make a failure of that capability silent, irreversible, or hard to attribute. "Nice to have" is not in scope.

Five capabilities are covered, each one corresponding to a real temptation that could be acted on this quarter:

1. Autonomous queues (prompt-queue draining without a human present)
2. Adaptive routing (work picked / re-prioritized by something other than Michael)
3. Swarm scaling (>1 runtime working the same plan)
4. Self-healing runtime (auto-recover from known failures)
5. Unattended overnight execution expansion (multi-hour runs, human asleep, longer scope)

Each section ends with a hard "do not enable until" line.

---

## 1. Autonomous queues

**Capability.** `prompt-queue` items are pulled and executed without an explicit human "execute next queued" / "drain queue" trigger. Today the skill (`skills/prompt-queue/SKILL.md:382–408`) is explicitly non-auto-pull: surfaces a peek, requires confirmation. The capability in question removes that gate.

**Prerequisites.**

- **State integrity under contention.** PROMPT_QUEUE.md is currently a markdown table edited by Claude. Two sessions or one session + one human edit can collide. Auto-drain widens the contention window from "rare" to "the steady state." Required: either a single-writer claim mechanism (the runtime is the only writer; humans submit via a typed channel that the runtime applies) or a non-markdown queue store.
- **Stale-recovery proven on real failures.** Step 5 of prompt-queue describes stale-recovery for IN PROGRESS rows. It has never been exercised on a real interrupt. Required: at least three observed real interrupt events resolved correctly by the documented stale-recovery path before auto-drain is permitted to use it.
- **Halt-and-wait honored without a human in the loop.** A queued prompt that triggers `skill-forge` approval gate or `codex-review` HIGH must move to PAUSED *and stay there*. Auto-drain must not invent its own "best guess" answer. Required: explicit test that the parallel-drain wave-of-5 dispatcher refuses to advance past a PAUSED item.
- **Per-item budget.** Today's loop budget is per-session; an auto-drain item can blow it inside one prompt. Required: per-item soft cap (commits, tokens, wall time) defaulted from item metadata, not from session-wide totals.
- **Audit log readable without an LLM.** A human walking up cold should be able to read "what did the queue do last night" in under 60 seconds. Today the COMPLETED graveyard is a list; that is enough only if every entry has a one-line outcome. Required: outcome-note format enforced at write time, not best-effort.

**Do not enable until** an out-of-runtime supervisor exists *and* the parallel-drain wave dispatcher has been exercised against PAUSED-state items in a non-production run.

---

## 2. Adaptive routing

**Capability.** Something other than Michael picks which item runs next. Concrete examples: priority re-scoring based on observed cycle time, item batching by predicted cost, dynamic reordering when a defer-condition resolves earlier than expected.

**Prerequisites.**

- **Priority discipline that is a fact, not a vibe.** Today priority is Michael's call (`prompt-queue/SKILL.md:421`). Routing logic that overrides his ordering is a governance change, not a technical change. Required: a written policy that names *which* priority decisions the routing layer is allowed to second-guess, and which it must never touch. Without that policy, "adaptive routing" silently launders Claude's preferences into Michael's queue.
- **Observed cost data for the inputs.** Re-prioritizing by predicted cost requires real cost-per-item data. PROMPT_LOG.md and SESSION_LOG.md are prose; they do not produce a structured cost series. Required: ≥30 days of structured per-commit token + wall-time data before any predictor is built on top of it.
- **Reversibility per decision.** Every routing decision must be journaled with the inputs that produced it, so a wrong decision is auditable. Required: routing decisions are append-only records, not in-place edits to PROMPT_QUEUE.md.
- **Defer-condition resolver is trustworthy.** The current resolver (Step 4.5 of prompt-queue) explicitly refuses to promote on uncertain SQL evidence (gotcha-026, `prompt-queue/SKILL.md:267`). Adaptive routing built on top of this resolver inherits that uncertainty. Required: the resolver's known-uncertain cases are catalogued and the router treats SCHEMA_PARSE_UNCERTAIN as a hard "do not adapt" signal, not a hint.
- **Cold-start safety.** First time the router runs, it has no history; it must default to the human's order. Required: a documented cold-start rule that says "with <N events, behave like priority is final."

**Do not enable until** a structured cost dataset exists, the routing layer's authority over Michael's ordering is written down, and a "no-route" mode (fall back to today's behavior) can be flipped on at any time.

---

## 3. Swarm scaling (multi-runtime)

**Capability.** More than one runtime makes progress on the same plan. Today's parallel-drain (`prompt-queue/SKILL.md:339`) describes a wave of up to five subagents dispatched via the Agent tool inside a single Claude turn. "Swarm scaling" extends this to: longer runs, more concurrent runtimes, runtimes that may outlive their parent turn, runtimes on independent machines.

**Prerequisites.**

- **Out-of-runtime claim queue.** Subagents in one Claude turn share the parent's filesystem and cannot accidentally race because they are dispatched as one tool call. The moment any subagent persists state for the next turn or runs in a separate process, the shared markdown becomes a race surface. Required: a claim mechanism that is not "Claude reads the file then writes the file" — i.e., not PROMPT_QUEUE.md.
- **Per-runtime write isolation.** Each runtime writes only to paths or branches it owns. Required: a documented scope per runtime + a pre-merge step that catches scope violations.
- **Aggregator that is not the source.** The runtime that aggregates sibling output is *not* allowed to be one of the siblings. Today's parallel-drain has the parent turn as both dispatcher and aggregator — fine for one wave, unsafe across waves and across sessions.
- **Subagent observability.** When five subagents run, the human (or supervisor) needs to know which is healthy, which is stuck, and which has failed silently. Today the subagent return is a single text summary; partial failure is hard to detect. Required: structured per-subagent status (started, in-progress, succeeded, failed, halted-on-gate) written somewhere outside the subagent.
- **Failure containment of one subagent.** A bad commit by one subagent must not block siblings or poison shared state. Required: each subagent commits to a scratch/feature branch, never to the integration branch directly.
- **Wave sizing rule defended by data.** The wave-of-5 cap is sourced as Anthropic best-practice (`prompt-queue/SKILL.md:365`). It is correct as a starting point, but for AccentOS specifically the right number is whichever value keeps shared-state contention near zero. Required: a measurement of contention before the cap is raised.

**Do not enable until** the L4 row of the maturity model is satisfied — particularly the out-of-runtime claim queue and per-runtime write isolation.

---

## 4. Self-healing runtime

**Capability.** The runtime detects a failure that matches a known signature and recovers without paging the human. Examples: retry on transient network error, re-run a single failed commit on a clean working tree, re-issue a Codex API call after a 429.

**Prerequisites.**

- **A failure catalog drawn from real, observed failures.** "Real" excludes failures synthesized from "what could go wrong." Required: ≥30 days of recorded actual failure events (timestamp, signature, observed cause, manual recovery taken). Today no such record exists; SESSION_LOG.md is prose and the Stop-hook log is aggregated counts.
- **Per-rule recovery budget.** Every healing rule has a maximum invocations per run. After the cap, escalate. Required: the budget is enforced by the supervisor, not by the rule itself counting.
- **Rule provenance.** Each rule cites the failure events that justified it and a date. Rules without provenance are deleted on sight. Required: a one-line provenance string per rule.
- **Idempotency proof for the recovered step.** A step the runtime might re-run must be safe to run twice. Today not all steps are. Required: per-step idempotency annotation (safe-to-retry / unsafe / unknown) and unsafe steps are never auto-recovered.
- **Negative tests in the catalog.** Each rule has at least one example of a failure that *looks* like a match but isn't, plus the reason the rule must skip it. Without negative tests, recovery rules drift toward false-positive recovery (the worst kind: it masks real bugs).
- **Self-downgrade path documented.** When healing fails twice in a session, the runtime drops to L3 (supervised, no auto-recover). Required: the downgrade is a documented, single action — not a side effect of accumulated retries.

**Do not enable until** the failure catalog has ≥30 days of real data *and* the supervisor exists to enforce per-rule budgets.

---

## 5. Unattended overnight execution expansion

**Capability.** Multi-hour runs (currently capped soft at 2h per `autonomous-mode/SKILL.md:60`), human asleep and unreachable, scope larger than a single track.

**Prerequisites.**

- **Durable state (L2).** The session can die and the next session resumes from a structured record, not from prose. Without this, an overnight run that dies at hour 3 is silently lost until morning.
- **Out-of-runtime supervisor (L3).** Something checks heartbeat freshness and emits an escalation if the runtime stalls past a threshold. Without this, "unattended overnight" means "unobserved overnight."
- **Escalation channel rehearsed while awake.** The first time the page goes off must not be at 3am. Required: at least one full end-to-end escalation test during business hours.
- **Hard list of forbidden tasks for unattended runs.** Today's `autonomous-mode/SKILL.md:80–90` already names this list. Overnight tightens it: anything that *touches the outside world irreversibly* is excluded, even if it is allowed in attended autonomous runs. Required: an overnight-only forbidden list, not just the attended one.
- **Bounded blast radius per commit.** A single bad commit at 3am must be revertable in seconds in the morning. Required: every overnight commit is on a non-default branch with no auto-merge.
- **Minimum resume cost.** When the human wakes up, the cost of "what happened?" must be bounded. Required: a single canonical morning-after artifact (an OVERNIGHT_STATUS.md or equivalent — does not exist today) that summarizes the run without the human reading the full SESSION_LOG.
- **Power-loss / network-loss test.** Pull the plug at hour 1 of a fake overnight run during the day. Verify resume. Today untested.
- **Cost ceiling.** Token spend cap, dollar cap, and Codex/API call cap, all enforced by the supervisor. Required: any of the three is enough to halt cleanly; *all three must be present* because each catches a different runaway pattern.

**Do not enable expansion (longer runs, broader scope) until** every other prerequisite in this document for L2 and L3 is satisfied. Overnight is the *last* capability to enable, not an early one.

---

## 6. Cross-cutting prerequisites

These apply to every capability above. Calling them out once.

- **Telemetry that pre-dates the change.** No capability ships without a baseline of how the system behaved before. The Stop-hook aggregator (`scripts/efficiency-aggregate.sh`) is the right shape; what it records today is not yet enough to baseline orchestration changes specifically.
- **A way to turn it off in one action.** Each capability has a single config flip (env var, settings.json field, file existence) that disables it without code change. If turning the capability off requires editing a skill, the off-switch is too slow.
- **Dry-run mode.** Each capability supports a mode that does everything except the irreversible action. For autonomous-queue: pull the item, log what would have run, do not run. Used in week-zero to build trust.
- **A record of what the capability *did not* do.** Skipped items, deferred decisions, declined recoveries — all logged. Reasoning: the failure mode of autonomy is "silent inaction," and inaction is invisible unless it is recorded as inaction.
- **A human-readable reason for every autonomous decision.** Not for governance theater — for debugging at 9am Monday.

---

## 7. The line between bounded overnight execution and the rest

Bounded overnight execution (a single session, capped at hours, pre-approved scope, halts on first blocker) is *adjacent* to today's L1 baseline. It needs durable state (L2) and a supervisor (L3). It does not need adaptive routing, swarm, or self-healing.

Everything above bounded overnight (queues that drain themselves, swarms, self-healing, multi-hour expansion) is *not* adjacent. Each one independently requires the L4 or L5 prerequisites.

The shortest safe path is: today (L1) → durable state (L2) → supervisor (L3) → bounded overnight, *full stop*. Anything past that is a separate project.
