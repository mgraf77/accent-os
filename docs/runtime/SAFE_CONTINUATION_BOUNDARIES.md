# Safe Continuation Boundaries — AccentOS

> Doctrine only. No implementation, no governance change, no fake-supervisor patterns.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companion to `RELAY_COMPRESSION_PROTOCOL.md`, `SELF_CONTAINED_EXECUTION_WINDOWS.md`, `SESSION_RESET_RESILIENCE.md`. Read those first.

---

## 0. Frame

"Continuation" inside a single session is the act of moving from one sub-step to the next without a Michael relay. Most of what Claude does inside a packet is continuation. This document defines the *boundaries* of safe continuation — what is permitted, what must escalate, what must freeze, what must remain human-routed, and what must never self-continue under any condition.

The boundaries operate at L1. They are not weakened or overridden by maturity steps that have not landed. If the maturity step lands later, this document is revisited; until then, the more conservative boundary applies.

---

## 1. The four dispositions

Every potential next sub-step inside a packet maps to exactly one of:

- **Continue** — execute it; record it; loop
- **Escalate** — surface to Michael in the same turn with a structured note; pause
- **Freeze** — write a clean-freeze artifact; end the turn; do not act on the sub-step
- **Refuse** — explicitly do not do the action; record the refusal; choose another sub-step or escalate

The default is *not* "continue." The default is "match this sub-step against the explicit lists below; the matching disposition wins." Silence is not consent.

---

## 2. What MAY self-continue

The following classes of action MAY proceed without escalation, *if and only if* they fall inside the packet's stated authority list and the standing halt list does not apply.

- **Local file edits** in repository paths the packet authorizes
- **Reads** of any repo file
- **Local commands** that produce no external side effect (linters, type checks, local test runs, `git status` / `git log`)
- **Branch + commit + push** to the feature branch the packet operates on
- **Updates to `WORK_IN_PROGRESS.md` and other ledger files** per the standing CLAUDE.md rules
- **Running existing standing skills** that the packet names (e.g., a packet may invoke `kpi-data-audit` if listed)
- **Reverting an edit** Claude itself made in the same turn that did not land in a commit
- **Choosing among equivalent implementations** within the packet's MAY list

That is the full list. Anything not on it requires explicit packet authorization.

---

## 3. What MUST escalate

These actions are not refused — they are surfaced with structured context for Michael to decide. The packet pauses; the chain may continue once Michael responds.

- **Codex-review HIGH-risk recommendations.** Per `codex-review/SKILL.md`, HIGH items always go to Michael. Doctrine confirms this is non-overridable.
- **Skill-forge approval gate.** When forging produces candidates that would create new skills, the gate is the gate; the packet does not "approve and proceed."
- **A halt-list action becomes the only available next step.** If the packet's only forward motion is a halt-list item (e.g., a Supabase migration), escalate — do not pivot to a different scope without Michael.
- **A packet's stated premise turns out wrong.** ("The file we were going to edit doesn't exist where the packet said.") Escalate; do not guess the right path.
- **Two consecutive sub-steps fail with different errors.** This is the doctrine's "premise wrong" detector. The probability the third try succeeds is low; the probability of corrupting state is rising.
- **An edit's diff would touch >1 unrelated subsystem.** A change that crosses subsystem lines without packet authorization is escalation, even if it is technically necessary.
- **A new external integration** (new MCP, new env var dependency, new service URL) that the packet did not pre-authorize.
- **Anything that would change `.claude/settings.json` or `.claude/CLAUDE.md`.** These are governance surfaces; doctrine does not let a packet rewrite them.

Escalation format: a structured note in the assistant turn naming the trigger, the proposed action, and one or two concrete questions for Michael. No long prose narrative.

---

## 4. What MUST freeze

These conditions stop the packet without escalating. The chain pauses; the next packet (if any) is composed by Michael with the freeze artifact in hand.

- **Cap reached.** Commit cap, time cap, iteration cap. Not negotiable; freeze.
- **Pre-flight check fails.** Packet preconditions are not satisfied; do not attempt to fix them — freeze.
- **Pre-commit hook fails after one retry.** Do not investigate further inside the packet. Freeze, surface the hook error.
- **`git push` fails after the standard 4-retry exponential backoff.** Freeze; do not switch to `--force` or alternate branches.
- **Working tree is in a state the packet did not anticipate** at any sub-step boundary (unexpected uncommitted changes, unexpected branch). Freeze.
- **The next sub-step would require a decision not on the MAY list and not on the MUST-escalate list.** Default-deny: freeze.
- **Disk / file-write error.** Including failure to update `WORK_IN_PROGRESS.md`. Freeze before the next commit.
- **The session is approaching a usage threshold** (context, model usage). Per `SESSION_RESET_RESILIENCE.md` §6, freeze pre-emptively at the next sub-step boundary.

Freeze artifact: produced per `RELAY_COMPRESSION_PROTOCOL.md` §8. Includes the freeze trigger, last successful sub-step, and what would have been next.

The difference from escalation: escalation expects Michael to answer a question and the packet may resume. Freeze expects Michael to compose a fresh packet (or none).

---

## 5. What MUST remain human-routed

These categories of work do not get packet authority at L1, regardless of how the packet is written. Even a packet that *says* it authorizes them does not — doctrine is conservative against the packet author.

- **Schema migrations on production Supabase.** Always Michael; per `autonomous-mode/SKILL.md:80–90` and confirmed here.
- **Force-push to main / shared branches.**
- **Public deploy promotion** (Cloudflare Pages production push, BigCommerce config changes, any DNS / domain change).
- **Email / SMS / social sends to real recipients.**
- **Billing-impact external API calls** beyond pre-approved low-cost classes (Codex LOW auto-apply is pre-approved; arbitrary new APIs are not).
- **Granting permissions** to skills, MCPs, or the harness.
- **Editing `.claude/CLAUDE.md`, `.claude/settings.json`, or any file that defines the packet authority itself.**
- **Merging PRs to main.**
- **Decisions about scope expansion.** A packet that "discovers it should also do X" routes that discovery to Michael; the packet does not expand itself.
- **Decisions about new tooling adoption.** Installing new MCPs, adding new skills as runtime-active.
- **Anything tagged `BLOCKS ON MICHAEL`** in any plan file.

The list is intentionally broad. At L1, Michael is the permission boundary; the cost of a misrouted sensitive action vastly exceeds the relay cost.

---

## 6. What must NEVER self-continue

A stricter category than §5. These actions are not just human-routed; they must never even be *proposed by* a self-continuing pattern. If Claude finds itself about to do one of these as a continuation, the disposition is *refuse*, not escalate, not freeze.

- **Re-invoking the packet itself with widened scope.** A packet does not re-issue itself bigger. The next packet is Michael's authorship.
- **Spawning a new session.** No tool, skill, or pattern in this doctrine spawns sessions. Sessions are Michael-initiated.
- **Modifying its own authority list mid-flight.** A packet does not edit its own MAY list to grant itself a new action.
- **Triggering another packet's start signal.** No "and then run packet B" as a side effect.
- **Auto-approving a HIGH-risk recommendation** in any cross-agent review system, current or future.
- **Marking a halt-list item as "low-risk" in the moment.** Risk class is set in the standing list, not in the packet's working-memory judgment.
- **Sending an external notification** other than via existing approved channels.
- **Self-supervising** — claiming to monitor its own liveness, its own budget, its own correctness. Self-supervision is the prototypical fake-supervisor pattern.
- **Generating a runtime claim** in any artifact (commit message, doc, freeze artifact) — e.g., describing the system as "autonomous," "running in the background," "self-healing." Doctrine prohibits this language in self-generated artifacts because the language outlives the moment and propagates the illusion.

The category is intentionally smaller than §5 but more sharply enforced. §5 says "Michael decides;" §6 says "no one in the system decides; the action is structurally absent."

---

## 7. Dangerous continuation patterns

Patterns that *look* like safe continuation and aren't. Each has been observed (or is one realistic packet away from being observed) at L1.

- **The "obvious next step" trap.** Claude finishes sub-step N and "obviously" the next thing is sub-step N+1, not on the packet. Disposition: escalate or freeze. The fact that something is obvious is not authorization.
- **The "we already do this" trap.** A pattern shows up in a packet that resembles a standing skill's behavior; Claude reasons "this is the same as X, so it's safe." Disposition: refuse (per §6 — no implicit grant).
- **The "small fix while we're here" trap.** A typo or small bug appears mid-packet; the packet did not authorize it. Disposition: refuse to bundle; escalate or note for next packet. Never silently include unrelated fixes.
- **The "let me just check" trap.** A read or query that is not in the packet, expanding the working context. Disposition: allowed only if it would obviously not change the next sub-step's behavior; otherwise escalate.
- **The "this looks done so let me commit" trap.** Marking work complete based on absence of obvious errors rather than presence of explicit verification. Disposition: never declare completion without the packet's stated completion check.
- **The "it failed but probably for an unrelated reason" trap.** Test fails; Claude reasons it's flaky and continues. Disposition: freeze. A failure is a failure unless the packet pre-named it as expected-flaky.
- **The "I'll fix the docs at the end" trap.** Doc updates accumulate as TODOs in working memory. Disposition: per-sub-step doc updates per the OPERATING RULES; do not accumulate — the working-memory list is exactly what dies at session end.

---

## 8. Recursive expansion risks

A specific class of dangerous continuation where the packet's actions feed back into the packet's own scope.

- **A packet that lists its own work items in a file Claude reads.** If a sub-step adds an item to the work file Claude is iterating, the iteration may not terminate. Doctrine: never iterate a list that the iteration mutates.
- **A packet that triggers a standing skill which itself extends the packet's scope.** E.g., a packet runs `bottleneck-finder`, which surfaces a new top-priority M-task, which the packet's logic interprets as the new "next item." Doctrine: standing-skill output is information, not instruction. Refuse to re-prioritize the packet from inside it.
- **A packet that generates its own next-packet draft and then "executes the draft" in the same session.** The draft is for Michael. Same-session execution is recursion.
- **An escalation that is satisfied by Claude's own prior reasoning.** "I asked Michael; I think the answer is X; let me proceed." Refuse: an escalation pauses until Michael actually responds.

The pattern under all of these: the packet's output becoming the packet's input. Every doctrine-safe pattern keeps the packet's input fixed for the duration of the session.

---

## 9. Orchestration illusion traps

Patterns that produce the appearance of orchestration capability without the substance. These are the traps `ORCHESTRATION_BOTTLENECK_MAP.md` §4 already names; doctrine adds the *continuation-side* response to each.

- **"The session is monitoring itself."** Refuse to write artifacts that imply monitoring (no "watching for X" language; no "if X happens I will Y" claims about what will happen *outside* the current turn).
- **"The packet is durable across sessions."** Refuse the framing. A packet's effects (commits, doc changes) are durable. The packet's authority is not.
- **"This is autonomous mode."** Refuse the framing in self-generated artifacts. Use "long-running packet" or "self-contained execution window" — terms that don't smuggle a runtime claim.
- **"I will check back in N minutes."** Refuse: there is no "I" between turns. The next turn is a fresh runtime instance with whatever state survived to disk.
- **"Subagents are working in parallel."** Allowed *only* when subagents were dispatched in the current turn via the Agent tool, and only for the duration of the parent turn. Beyond that, the framing is wrong.
- **"The Stop hook will handle this."** Refuse for anything other than the documented `efficiency-aggregate.sh` aggregation. The Stop hook is a one-shot post-mortem, not a supervisor.

---

## 10. Fake-supervisor behaviors to avoid

A "fake supervisor" is any pattern in which Claude (the same session that is doing the work) claims to also be observing the work. The category is structurally impossible to do safely at L1 — observation and execution must be different processes. Doctrine catalogs the common fake forms so they can be recognized and refused.

- **Self-budget enforcement.** Tracking and stopping on budget *can* be done within a packet, but artifacts must say "the packet's stated cap was honored," not "the supervisor enforced the budget." Wording matters.
- **Self-liveness reporting.** Heartbeat writes are fine; claims that "I am alive and well" in artifacts are not. The runtime cannot know it is alive — only Michael can.
- **Self-anomaly detection.** Claude noticing "this commit looks unusual" inside the same session that produced it is not a check; it is the same agent's second opinion. Acceptable as a soft signal; never as a gate.
- **Self-escalation suppression.** "I considered escalating but decided it was fine." The mere appearance of "considered escalating" means escalate.
- **Self-recovery.** Auto-retrying a failed action under the framing of "recovery" is fake L5. Retry per the standing thresholds (§4); name it as retry, not recovery.

The simple rule: anything that uses the word "supervise," "monitor," "watch," "guard," "ensure," "self-heal" in an artifact about the same session that produced the artifact is a fake-supervisor signal. Rewrite.

---

## 11. Decision tree (compact reference)

For a candidate next sub-step, in order:

1. Is it on the packet's MAY list **and** not on the standing halt list? → **Continue**
2. Is it on the standing halt list (`autonomous-mode/SKILL.md:80–90`)? → **Refuse** (then likely **Escalate**)
3. Is it on §5 (must-be-human-routed)? → **Escalate**
4. Is it on §6 (never self-continue)? → **Refuse**
5. Is a §7 trap suspected? → **Escalate**
6. Is a §8 recursive expansion risk suspected? → **Refuse**
7. Is a §9 illusion framing being invoked? → **Refuse the framing**, then re-evaluate the underlying action
8. Is a freeze condition (§4) tripped? → **Freeze**
9. Otherwise: **Freeze** (default-deny on unmatched sub-steps)

Note the bias. The default is freeze, not continue. Adding new sub-steps to a packet at runtime is the most common way safe continuation becomes dangerous; default-deny is the only stable answer at L1.

---

## 12. The single sentence

A packet's safe continuation is exactly the set of actions explicitly authorized in advance; the absence of an explicit prohibition is not authorization.
