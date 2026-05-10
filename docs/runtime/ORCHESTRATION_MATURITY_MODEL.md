# Orchestration Maturity Model — AccentOS

> Analysis only. No runtime, governance, or implementation changes.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Scope: documents the current orchestration baseline of AccentOS (one human, one Claude session, markdown ledger, Stop-hook) and the smallest safe steps from there toward unattended overnight execution.
>
> Source-doc note: the FIRST READ list (EXECUTION_PATTERN_CATALOG.md, ORCHESTRATION_ERGONOMICS.md, TELEMETRY_SIGNAL_CATALOG.md, BOTTLENECK_VISIBILITY_SPEC.md, SESSION_STATE_SURFACE.md, STATUS_MD_V2.md, CODEX_EXECUTION_PROTOCOL.md, OVERNIGHT_STATUS.md) does not exist in the repo at this date. The model below is grounded in the artifacts that do exist: `skills/autonomous-mode/SKILL.md`, `skills/prompt-queue/SKILL.md`, `skills/efficiency-monitor/SKILL.md`, `skills/codex-review/SKILL.md`, `.claude/settings.json`, `.claude/CLAUDE.md`, `WORK_IN_PROGRESS.md`, `PROMPT_LOG.md`, `SESSION_LOG.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `BUILD_INTELLIGENCE.md`, `scripts/efficiency-aggregate.sh`, `scripts/status.sh`. If/when the catalogs above are written, this model should be revised against them — do not ship the next maturity step on the analysis below alone.

---

## 0. Definitions

- **Runtime.** The thing that moves work forward when the human is not watching. In AccentOS today: a single Claude session executing inside one CLI turn, reading and writing markdown.
- **Supervisor.** A process *outside* the runtime that observes the runtime, can detect that it has stopped, and can decide what happens next. AccentOS does not have one. The Stop-hook is fire-and-forget aggregation, not supervision.
- **Bounded execution.** A run with an explicit, machine-checked cap on time, tokens, items completed, or commits — and a clean exit when the cap trips. `autonomous-mode` Step 4 documents the intent; the cap is honored only if the live Claude turn reaches the check between commits.
- **Unattended.** No human present and no human reachable for the duration. Distinct from "autonomous" (human asleep but reachable on phone) and "assisted" (human in the loop turn-by-turn).
- **Maturity level.** A discrete band of capability that a runtime has demonstrably earned, gated by the safeguards listed for that level. Lower-level safeguards are inherited; you cannot "skip past" them.

These distinctions matter because the AccentOS runtime today reads as if it is at L2 ("durable autonomous loop") when read top-down through `autonomous-mode/SKILL.md`. It is at L1. The doc describes a loop; the runtime is a single turn.

---

## 1. The maturity ladder

Six levels, each strictly stronger than the last. AccentOS is currently inside L1 with one foot in L2.

### L0 — Manual assist
- **Capability.** Human prompts Claude one task at a time. Claude does not act between prompts.
- **Required safeguards.** None beyond standard tool-permission prompts.
- **Failure signature.** None that this model cares about — failures happen on the human side (forgotten task, lost context).
- **Rollback.** `git restore` of the latest edit; nothing is durable enough to need more.
- **Forbidden shortcut.** None.

### L1 — Bounded assisted execution *(AccentOS today)*
- **Capability.** Human launches one Claude session with a stated scope and a soft cap (time, tokens, item count). Claude executes commits in a loop until the cap trips or scope ends. Human is reachable; session may be visible on the phone.
- **Required safeguards.**
  - `dangerouslySkipPermissions: true` is acceptable only because the human is reachable (`.claude/settings.json:4`).
  - State written to disk before each step (`WORK_IN_PROGRESS.md`, optional `.claude/autonomous_mode.json`).
  - Heartbeat after every sub-step, not only between items (`autonomous-mode/SKILL.md:178`).
  - Mid-item time/token check after every commit (`autonomous-mode/SKILL.md:180`).
  - Hard list of tasks that halt the loop instead of executing (Supabase migrations, force-pushes, public deploys, billing-impact API calls, skill-forge approval gate, codex-review HIGH).
  - Stop-hook flushes telemetry (`scripts/efficiency-aggregate.sh`).
- **Failure signature.**
  - Session dies (Codespace stop, OOM, network reset). The runtime dies with it. `WORK_IN_PROGRESS.md` is the only resume baton; nothing outside Claude verifies it is correct.
  - Mid-item check is skipped because the loop is implemented as Claude reading pseudocode in markdown — there is no compiler enforcing the check.
  - Two sessions on the same workspace race-write `WORK_IN_PROGRESS.md` and silently last-writer-wins.
- **Rollback.** Read last entry of `SESSION_LOG.md` plus latest commit; resume by hand. Worst case: revert the in-flight WIP commit, fix WORK_IN_PROGRESS.md by hand, restart.
- **Forbidden shortcut.**
  - Treating the documented loop as if it were a daemon. It is not.
  - Adding parallel subagents (prompt-queue parallel drain) without first proving the serial loop honors its caps under stress.

### L2 — Durable bounded execution
- **Capability.** Same scope as L1, but the loop survives one session death without losing more than the in-flight commit. The next session-start auto-detects an interrupted run and resumes from the persisted state instead of asking the human "what happened?".
- **Required safeguards (additive on top of L1).**
  - A single canonical resume record consumed by the session-start hook, not free-form prose. Today `WORK_IN_PROGRESS.md` mixes status, narrative, and next-step hints; an L2 record is structured enough to be parsed without an LLM.
  - `autonomous_mode.json` written *atomically* (temp-file + rename) before each commit so a crash never leaves a half-written state file.
  - Cross-session lock: a session that detects an existing `running` state file refuses to start a parallel autonomous run on the same branch.
  - Resume contract: explicit list of which steps are safe to redo if interrupted (idempotent commits, doc updates) vs. which must be marked failed and skipped.
- **Failure signature.**
  - Lock is missing or stale → two sessions resume the same run, double-commit.
  - Resume record points at a commit that no longer exists (force-push, branch reset).
  - Idempotency contract not honored — a "resumed" step re-applies edits that already landed and corrupts the file.
- **Rollback.** Mark `autonomous_mode.json` status `interrupted`, fall back to L1 manual resume.
- **Forbidden shortcut.**
  - Skipping the structured-state requirement and trying to parse `WORK_IN_PROGRESS.md` with regex.
  - Building the cross-session lock on a file that is rebuilt from scratch on Codespace reboot.

### L3 — Supervised autonomous execution
- **Capability.** A process outside the Claude session can answer "is the loop alive, stuck, or done?" without prompting Claude. Heartbeat freshness, commit cadence, and token spend are observable in seconds, not by reading prose. Human can be asleep / unreachable for the run because the supervisor knows when to escalate (page the human) vs. when to halt cleanly.
- **Required safeguards (additive).**
  - Heartbeat written by the runtime is *read* by something other than the runtime. Today nothing reads `last_heartbeat`; the field is documented in `autonomous-mode/SKILL.md:124` but no consumer exists.
  - Stuck-detector: heartbeat older than N minutes triggers a halt signal that the runtime checks between commits.
  - Budget oracle outside the runtime: tokens-spent and wall-time are tracked by the supervisor, not by Claude inferring its own usage.
  - Escalation channel that is not the same Claude session (text, push, email).
- **Failure signature.**
  - Supervisor itself dies — the runtime now thinks it is supervised but is not. Worse than no supervisor.
  - False-stuck (long single commit) triggers premature halt; the loop ping-pongs.
  - Escalation channel is noisy → human silences it → real escalations missed.
- **Rollback.** Disable supervisor, fall back to L2 (durable bounded). Document explicitly that the run is now unsupervised.
- **Forbidden shortcut.**
  - Using the same Claude session as its own supervisor. It cannot observe its own death.
  - Starting an unattended overnight run before the escalation channel has been tested end-to-end while the human was awake.

### L4 — Multi-runtime coordinated execution
- **Capability.** More than one runtime makes progress on the same plan without stepping on each other. In AccentOS terms: prompt-queue parallel drain with subagents (today's wave-of-5 design) running with a real coordinator that owns work distribution, conflict detection, and failure isolation.
- **Required safeguards (additive).**
  - Work distribution outside the runtime — a queue or table that hands out claims, not a markdown file edited concurrently.
  - Per-runtime isolation: each subagent's writes are scoped (separate branches, scoped paths) so a failure cannot corrupt sibling work.
  - Failure-quarantine: a stuck subagent is killed and its claim returned to the queue; sibling runtimes continue.
  - Aggregator that merges sibling outputs *after* they are individually verified.
- **Failure signature.**
  - Two subagents both edit `WORK_IN_PROGRESS.md` (or any shared markdown) and last-writer wins.
  - Subagent silently produces low-quality output that passes the aggregator's shallow check.
  - Coordinator becomes the single point of failure — dies, takes the whole fan-out with it.
- **Rollback.** Cancel all in-flight claims, fall back to L3 serial supervised execution. Re-run the queue items in a single runtime.
- **Forbidden shortcut.**
  - Calling the existing `prompt-queue` parallel drain (`SKILL.md:339`) "L4". It is L4-shaped on paper; without out-of-runtime claim arbitration it is L1 with extra rope.

### L5 — Self-healing unattended runtime
- **Capability.** The runtime detects a class of failures it has seen before and recovers without paging the human. It can downgrade itself gracefully (drop from parallel to serial, drop from autonomous to assisted) when conditions degrade.
- **Required safeguards (additive).**
  - A failure catalog: every recovery rule is documented, tested, and tied to a specific signature. No heuristic "try again, maybe it works."
  - Bounded recovery budget: at most N retries per failure class per run, then escalate.
  - Self-downgrade is a documented action, not a side effect — the runtime emits "I'm dropping to L3" so the supervisor records it.
- **Failure signature.**
  - Recovery rule masks a real underlying bug; the run "succeeds" on broken state.
  - Downgrade ladder is taken too aggressively; system spends the whole run shrinking instead of working.
  - Recovery actions themselves accumulate cost (re-running expensive steps) and blow the budget the recovery was supposed to protect.
- **Rollback.** Disable self-healing rules; require human acknowledgment per failure. Fall back to L3.
- **Forbidden shortcut.**
  - Building self-healing before the failure catalog has at least 30 days of real (not synthesized) failure observations to draw from.

---

## 2. Capability ↔ level matrix

| Capability | L0 | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|---|
| Single-task assisted edits | ok | ok | ok | ok | ok | ok |
| Multi-commit run with soft cap | — | ok | ok | ok | ok | ok |
| Loop survives session death | — | — | ok | ok | ok | ok |
| Out-of-runtime liveness check | — | — | — | ok | ok | ok |
| Unattended overnight run | — | — | — | ok (with escalation) | ok | ok |
| Parallel subagents on same plan | — | — | — | — | ok | ok |
| Auto-recover from known failures | — | — | — | — | — | ok |
| Self-downgrade under stress | — | — | — | — | — | ok |

A capability is "ok" only when *every* required safeguard for its level is in place. Partial implementations do not count.

---

## 3. Honest assessment of AccentOS today

- **Effective level:** **L1.** The loop is single-turn; if the session dies, the run dies.
- **L2 facade:** the documented `autonomous_mode.json` schema (`autonomous-mode/SKILL.md:101–127`) reads like durable state, but no session-start consumer parses it as authoritative resume input. The actual resume entry-point is `WORK_IN_PROGRESS.md` (free-form prose), per `.claude/CLAUDE.md` step 3. The two diverge in practice.
- **L3 hooks present, not wired:** `last_heartbeat` is written but not read. The Stop hook runs `efficiency-aggregate.sh` which produces telemetry *after* the session ends — useful, but not a supervisor. There is no liveness probe.
- **L4 shape, no plumbing:** `prompt-queue` parallel drain (Step 6) describes wave-of-5 subagents. Without an out-of-runtime claim queue, this is parallel fan-out with shared markdown state — L1 with more concurrency, not L4.
- **Codex-review (`skills/codex-review/SKILL.md`)** is the most mature piece: explicit LOW-auto / HIGH-gate split, replay artifacts on disk, schema-validated recommendations, post-edit re-validation with revert. This is the only place in the repo where another agent's output is treated as untrusted by default. The same posture is what L3 supervision will need — borrow the pattern, don't reinvent it.

---

## 4. Required safeguards — consolidated checklist

Read top-down. Each row is a hard precondition for the level it sits in. Inheritance is implicit: L3 also requires every L2 row, etc.

### L1 (current)
- [x] `WORK_IN_PROGRESS.md` overwritten after every step
- [x] Stop-hook flushes telemetry
- [x] Halt-on-blocker list in `autonomous-mode/SKILL.md:80–90`
- [ ] Mid-item time/token check is *enforced*, not just documented (today: relies on Claude remembering)
- [ ] Heartbeat actually written every sub-step (today: documented; no observation that it happens)

### L2 (durable)
- [ ] Structured `autonomous_mode.json` is the canonical resume record; markdown is a human-readable mirror
- [ ] Atomic write (temp-file + rename) for state file
- [ ] Single-writer lock keyed on branch + state file
- [ ] Idempotency contract documented per task class (which steps are safe to retry on resume)

### L3 (supervised)
- [ ] Out-of-runtime liveness probe (cron, daemon, GitHub Action, push-driven, anything not the same Claude turn)
- [ ] Stuck-detector with a halt-signal the runtime checks between commits
- [ ] Token / wall-time budget tracked outside the runtime
- [ ] Escalation channel tested end-to-end while the human is awake

### L4 (multi-runtime)
- [ ] Out-of-runtime claim queue (not shared markdown)
- [ ] Per-subagent write isolation (branches or scoped paths)
- [ ] Aggregator with a non-shallow verification step
- [ ] Failure-quarantine that returns claims to the queue

### L5 (self-healing)
- [ ] Failure catalog with ≥30 days of real failure data
- [ ] Bounded retry budget per failure class
- [ ] Documented self-downgrade path with supervisor record

---

## 5. Failure signatures by level

A short field guide for spotting the level a failure is "really" coming from. Misattributing the level is itself a failure mode (treating a missing-supervisor incident as a missing-recovery-rule incident leads to building the wrong fix).

| Symptom | Most likely level cause |
|---|---|
| Run stopped halfway, no resume hint | L1 (cap not enforced) or L2 (no durable state) |
| Resume picked the wrong commit / re-applied an edit | L2 (idempotency contract missing) |
| Human woke up to a session that had been idle for hours | L3 (no liveness probe) |
| Two subagents wrote the same file with conflicting edits | L4 (no claim isolation) |
| Loop kept retrying a clearly-broken step | L5 (recovery rule too loose) |
| Run "succeeded" but produced obviously bad work | aggregator quality (L4) or recovery masking a bug (L5) |
| Stop-hook ran but produced no useful signal | telemetry, not orchestration — separate concern |

---

## 6. Rollback requirements

Every level must be reversible to the level below in a single, documented action.

- **L2 → L1.** Stop reading `autonomous_mode.json` as authoritative; fall back to `WORK_IN_PROGRESS.md` prose. The prose mirror exists already, so this is free.
- **L3 → L2.** Disable the supervisor process; runtime keeps writing heartbeat (no consumer, but no harm). Annotate the next run as unsupervised in `SESSION_LOG.md`.
- **L4 → L3.** Cancel in-flight subagent claims, return queue items to QUEUED, re-run serially.
- **L5 → L3 (jump-down).** Disable self-healing rules wholesale rather than partial; partial leaves a system that thinks it is recovering when it isn't.

The point of rollback is not that you might need to use it — it is that *not having one is the signal that the new level is not real*. If you cannot describe how to step back down, you have not actually stepped up.

---

## 7. Forbidden shortcuts

In priority order. These are the moves that look like progress and aren't.

1. **Calling parallel-drain "L4."** It will pass surface inspection (subagents fan out, work happens) and fail the first time two of them touch shared markdown. Do not declare L4 reached without an out-of-runtime claim queue.
2. **Self-supervision.** The Claude session checking its own liveness is not L3. It cannot observe its own death.
3. **Skipping L2 to "go straight to overnight."** The temptation is "we already have soft caps and a state file, let's just run longer." The state file is not durable enough yet, and longer runs widen the failure window quadratically.
4. **Adopting telemetry as supervision.** `efficiency-aggregate.sh` runs *after* the session — it is post-mortem, not liveness. Treating the Stop hook as a supervisor is the most likely category error in this repo.
5. **Adding self-healing before the failure catalog exists.** Recovery rules built from imagined failures recover from imagined failures. The real ones go uncaught.
6. **Making `WORK_IN_PROGRESS.md` more structured by adding more sections.** The shape of L2 is "structured state file + prose mirror," not "more disciplined prose."
7. **Granting more permissions** (`dangerouslySkipPermissions` is already on, but expanding to network egress, deploy, or DB writes) **before the supervisor exists.** Permissions × maturity-gap is where blast radius lives.

---

## 8. The single most important sentence in this model

The runtime is currently the same process as the loop. Until that is no longer true, every additional autonomy capability multiplies blast radius without adding a brake.
