# Constraint Radar — AccentOS

> **Living analysis document.** Updated when readings change. Not a runtime, not a supervisor, not an execution engine. Doctrine and analysis only.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> First written: 2026-05-10
> Last reading: 2026-05-10
> Companions: `ORCHESTRATION_MATURITY_MODEL.md`, `UNATTENDED_EXECUTION_PREREQUISITES.md`, `ORCHESTRATION_BOTTLENECK_MAP.md`, `RELAY_COMPRESSION_PROTOCOL.md`, `SELF_CONTAINED_EXECUTION_WINDOWS.md`, `SESSION_RESET_RESILIENCE.md`, `SAFE_CONTINUATION_BOUNDARIES.md`, `ORCHESTRATION_PACKET_TEMPLATES.md`. Read those before editing this file.

---

## 0. What this document is and is not

**Is.** A station that names the current binding constraint, predicts the next one, lists the earliest warning signals for each, and rejects acceleration paths that would compound — rather than relieve — pressure. Output is text. Cadence is on-demand: updated when a signal moves.

**Is not.** A worker, a train, a runtime, a supervisor, an execution engine. The radar does not act. It does not run. It does not check in on anything. It is read by humans and updated by humans (or by a Claude session under explicit packet authority) and then it goes silent.

**Single test.** If a section of this document implies the radar *itself* is doing something between updates, the wording is wrong. Rewrite to passive observation.

---

## 1. Format and cadence

Each of §3–§9 (the seven living readings) carries the same shape:

```
Reading as of: <YYYY-MM-DD>
Confidence:    <high | medium | low>
Signals:       <bulleted list of concrete observations>
Reading:       <plain-English statement>
Implication:   <what this changes about safe next steps>
```

Updates append a new dated reading; prior readings remain in place as history. Removing prior readings hides the rate-of-change signal that the radar is built to expose.

Cadence triggers (any one is enough):

- A maturity step lands (any of the L2..L5 prerequisites in `UNATTENDED_EXECUTION_PREREQUISITES.md`).
- A bottleneck moves on the ordered list in `ORCHESTRATION_BOTTLENECK_MAP.md`.
- A signal in §5 changes class (warning → active, or active → relieved).
- A new doctrine doc lands or an existing one materially changes.
- Two consecutive packets exhibit the same drift pattern.
- ≥30 days since last update with no other trigger.

Updates outside these triggers are noise.

---

## 2. Operating constraints (binding on every update)

The radar adheres to the existing doctrine. These constraints reject specific update behaviors before they happen.

- **Analysis only.** Updates may not change any runtime, governance, or skill file. They may only change this file (or its companions when a doctrine refinement is genuinely needed and explicitly justified).
- **No fake-runtime language.** Forbidden vocabulary in radar output: "running", "watching", "monitoring", "alive", "autonomous", "self-healing", "supervisor" (when applied to the radar or any pattern that does not exist), "agent acting alone", "between sessions". Per `SAFE_CONTINUATION_BOUNDARIES.md` §10.
- **No capability-expansion recommendations without substrate justification.** A recommendation to enable a capability is valid only if the substrate (per `UNATTENDED_EXECUTION_PREREQUISITES.md`) for that capability is *already in place*. The radar does not promote capabilities; it gates them.
- **Default-deny on inferred autonomy.** If an update implies the system can do something between updates, the implication is wrong. Rewrite.
- **Prior readings are historical record.** Do not edit prior readings; append.

---

## 3. Current limiting constraint

```
Reading as of: 2026-05-10
Confidence:    high
Signals:
  - autonomous-mode/SKILL.md describes a loop; the loop runs entirely
    inside one Claude turn (autonomous-mode/SKILL.md:155–180).
  - last_heartbeat field is written but no consumer parses it.
  - WORK_IN_PROGRESS.md is the canonical resume entry per .claude/CLAUDE.md
    step 3; autonomous_mode.json is a sidecar with no authoritative reader.
  - Stop hook (.claude/settings.json) runs efficiency-aggregate.sh after the
    session ends — post-mortem, not supervision.
  - No process exists outside the Claude session that knows a session was
    running, has stopped, or got stuck.
Reading:
  B1 from ORCHESTRATION_BOTTLENECK_MAP.md is binding: the runtime is the
  same process as the loop. Every other autonomy capability is gated by
  this single fact. The illusion of additional capability comes from
  reading skill specs as if they describe a runtime; they describe Claude
  reading pseudocode in markdown.
Implication:
  Only L1 (bounded assisted execution) capabilities are honest. The
  shortest safe next step is splitting the loop from the runtime — i.e.,
  introducing a structured authoritative resume record (B2). Until that
  lands, no capability beyond L1 should be enabled.
```

---

## 4. Next predicted constraint

```
Reading as of: 2026-05-10
Confidence:    medium
Signals:
  - Even if B1 is addressed via a structured state file, the canonical
    resume entry today (WORK_IN_PROGRESS.md) is free-form prose. A B1 fix
    that does not also produce a parseable record cannot be consumed by
    a supervisor without an LLM in the loop (cost + latency + non-
    determinism).
  - Doctrine in SESSION_RESET_RESILIENCE.md §3 already names the four
    sources used today (WIP, freeze artifact, last commit, SESSION_LOG);
    none are individually structured.
  - The temptation to "make WIP more rigorous by adding sections" is
    explicitly named as a forbidden shortcut in
    ORCHESTRATION_MATURITY_MODEL.md §7. The right shape is dual-mode:
    structured canonical + prose mirror.
Reading:
  B2 (resume state is prose, not data) becomes binding the moment B1
  begins to be addressed. Treating it as a separate, later concern would
  produce a B1 fix whose output nothing can read. Therefore B2 is the
  next predicted constraint and must be sequenced *with* B1, not after.
Implication:
  Plan B1 + B2 as one substrate evolution, not two. A B1 design that
  assumes "we will figure out the state file later" predicts a B2 crisis
  immediately after.
```

```
Reading as of: 2026-05-10
Confidence:    medium
Signals (looking past B1 + B2):
  - Once durable state exists, the next pressure point is "nothing reads
    it while the session is alive." That is the L3 supervisor (B5 escalation
    is a downstream concern that becomes binding only after the supervisor
    can produce signals worth escalating).
  - Tempting shortcut: build the supervisor as another Claude session.
    Same harness, same blind spots, two sessions racing on the same files.
    Forbidden per SAFE_CONTINUATION_BOUNDARIES.md §10 (fake-supervisor).
Reading:
  After B1 + B2, the next binding constraint is the absence of an
  out-of-runtime liveness probe (B6 enforcement scope is narrower and
  cheaper, so it slots in here per the bottleneck-map ordering: B1 → B2
  → B6 → B3 → B5).
Implication:
  Do not pre-build the supervisor on top of today's L1. The substrate
  must precede the supervisor; the supervisor must precede unattended
  overnight. Order is non-negotiable.
```

---

## 5. Earliest warning signals

A catalog of observable conditions that indicate a constraint is approaching binding. Each entry: signal, what it would mean, where to look. The radar updates this section by noting which signals have moved.

### 5.1 — Synchronization pressure
- **Signal.** Two sessions opened concurrently against the same workspace; both write `WORK_IN_PROGRESS.md`.
- **Means.** L4 prerequisite (out-of-runtime claim arbitration) is becoming binding sooner than B1 is solved. This inverts the safe ordering.
- **Look.** Last-modified timestamps on `WORK_IN_PROGRESS.md` showing edits within seconds of each other from different session traces; SESSION_LOG.md showing two "session start" entries with overlapping windows.
- **Current reading (2026-05-10):** Not active. Single-session discipline is procedural; nothing technical prevents a second session.

### 5.2 — Stale-track pressure
- **Signal.** A feature branch has not merged for >7 days while main has advanced.
- **Means.** Continuation chaining across packets is producing branch divergence; future merge cost rises non-linearly.
- **Look.** `git for-each-ref --sort=-committerdate refs/heads/`; compare branch ages.
- **Current reading (2026-05-10):** This branch (`claude/orchestration-maturity-analysis-qdJ5W`) is 0 days old today and contains analysis-only docs. No code conflict surface. Not active. Reassess at +14 days.

### 5.3 — Orchestration drift
- **Signal.** A skill spec describes behavior that does not match runtime behavior. Pattern: spec adds a step; runtime never executes the step because no consumer reads the spec change.
- **Means.** The doc-as-runtime illusion is widening. Every packet authored against the drifted spec inherits the gap.
- **Look.** Diff between a skill SKILL.md and the most recent invocation's actual artifacts; spec fields with no observable consumer (`autonomous_mode.json` `last_heartbeat` is the canonical example today).
- **Current reading (2026-05-10):** Active at low intensity. `autonomous_mode.json` schema is the live drift case. Documented in `ORCHESTRATION_BOTTLENECK_MAP.md` §4 illusion 3.

### 5.4 — Relay-tax resurgence
- **Signal.** Relay count per unit of work climbs back toward its pre-compression baseline. Specifically, ≥3 small relays on a packet that the templates would have handled in one.
- **Means.** Doctrine adoption is eroding. Either the templates aren't being used or the authority lists are getting too narrow.
- **Look.** Count packet-shaped opening relays vs. single-question relays in PROMPT_LOG.md week-over-week (qualitative read; no automation needed).
- **Current reading (2026-05-10):** Not yet measurable. Doctrine is one day old. First reading available after ≥7 days of post-doctrine work.

### 5.5 — Entropy accumulation
- **Signal.** A ledger file (WORK_IN_PROGRESS, SESSION_LOG, BUILD_PLAN_*) becomes hard to scan in <60 seconds. Lines per file rises faster than meaningful events; section structure decays.
- **Means.** The procedural-resilience baseline (`SESSION_RESET_RESILIENCE.md` §3) is degrading. Resume cost rises silently.
- **Look.** Line count of each ledger file, plus a 30-second human read-test ("can a fresh reader find the resume point?").
- **Current reading (2026-05-10):** SESSION_LOG.md at ~68k lines is the largest ledger and is the most likely entropy carrier. WORK_IN_PROGRESS.md is currently scannable. PROMPT_LOG.md is large but append-only and used differently. Not active; watch.

### 5.6 — Unsafe acceleration
- **Signal.** A pattern, doc, or proposal arrives that calls for capability expansion (overnight runs, parallel drains, adaptive routing) without naming the substrate prerequisite that would justify it.
- **Means.** Premature-automation pressure is rising. The most dangerous form because it presents as "we're ready."
- **Look.** Any doc, commit message, or session output containing words from the forbidden vocabulary list applied to the AccentOS runtime; any plan that puts an L3+ capability on a timeline without a B1/B2 dependency.
- **Current reading (2026-05-10):** Not active in committed artifacts. The doctrine in this directory explicitly defends against it. Re-check whenever new docs are added by anyone.

### 5.7 — Coordination saturation
- **Signal.** The number of files Claude is told to update on every step exceeds ~6, *or* two ledger files describe the same thing in different shapes (e.g., WIP says "paused on X" while SESSION_LOG says "completed Y").
- **Means.** Doctrine enforcement is drifting; reconciliation cost rises faster than information value.
- **Look.** Count "always-update" rules in CLAUDE.md and standing skills; cross-check ledger entries weekly.
- **Current reading (2026-05-10):** Within bounds. CLAUDE.md OPERATING RULES name a small set; OPERATING RULES batched-doc-update mitigates the per-step cost. Watch.

### 5.8 — Branch-aging risk
- **Signal.** A long-lived branch carrying analysis or build work that is being read by other branches but not merging.
- **Means.** The branch becomes a de-facto fork in the narrative; doctrine here drifts from doctrine on main.
- **Look.** This branch (`claude/orchestration-maturity-analysis-qdJ5W`) carries the entire `docs/runtime/` corpus today. If main does not absorb it within 14 days, all future packets that reference these docs are referencing a fork.
- **Current reading (2026-05-10):** Latent. Not active until day 14 from first commit. Reassess.

### 5.9 — Review bottlenecks
- **Signal.** Codex-review HIGH items, skill-forge approval gates, or PR reviews accumulating with no decision because Michael's review bandwidth is saturated.
- **Means.** B7 from the bottleneck map is becoming binding earlier than predicted (the map placed it late).
- **Look.** Open HIGH-risk items in /tmp/codex-review-* artifacts; PAUSED items in PROMPT_QUEUE.md aged >7 days.
- **Current reading (2026-05-10):** No active accumulation; codex-review has not been invoked recently per PROMPT_LOG. Watch.

### 5.10 — Governance debt
- **Signal.** `.claude/CLAUDE.md`, `.claude/settings.json`, or any file in `skills/*/SKILL.md` not reviewed/edited in >60 days while the runtime around it has changed.
- **Means.** Standing rules describe a system that no longer exists; new packets inherit stale governance.
- **Look.** `git log -- .claude/CLAUDE.md skills/*/SKILL.md`; flag any file not touched in 60+ days.
- **Current reading (2026-05-10):** All files in scope edited recently per `git status` history. Not active. Watch.

---

## 6. Required substrate evolution

The substrate steps that must precede capability expansion. Each step has a prerequisite and a forbidden shortcut. The radar's job here is to refuse capability claims whose substrate isn't listed.

### 6.1 — Substrate step S1: split runtime from loop (addresses B1)
- **What.** Establish a process outside any single Claude session that holds lifecycle and persists state. Form factor (cron, daemon, GitHub Action, push-driven) is a governance choice, not a technical detail; the radar names this and stays neutral on the choice.
- **Prerequisite.** None — this is the first step.
- **Forbidden shortcut.** Using a second Claude session as the "outside process." It is the same harness with the same blind spots.
- **Status.** Not designed. Not implemented. No timeline owned by the radar.

### 6.2 — Substrate step S2: structured authoritative resume record (addresses B2)
- **What.** A machine-parseable file (form factor TBD by governance) that is consumed by both the session-start auto-execute sequence and any out-of-runtime process from S1. Markdown is preserved as a rendered mirror.
- **Prerequisite.** S1 must be designed (not necessarily shipped) so the consumers are known. Designing S2 without knowing its consumers risks an over- or under-fit schema.
- **Forbidden shortcut.** Adding more sections to `WORK_IN_PROGRESS.md` and calling that "structured." Prose with bullet headers is still prose.
- **Status.** Not designed. Pairs with S1.

### 6.3 — Substrate step S6: blast-radius enforcement out of skill prose (addresses B6)
- **What.** Move the standing halt list (`autonomous-mode/SKILL.md:80–90`) from skill prose into harness configuration (permissions, network egress allowlists, file-pattern denylists) so enforcement is structural rather than narrative.
- **Prerequisite.** None individually; ordered before S3 because escalation without enforcement is worse than no escalation.
- **Forbidden shortcut.** Rewriting the skill prose to be "more emphatic." The runtime does not read prose harder.
- **Status.** Not designed.

### 6.4 — Substrate step S3: structured cost / cycle-time series (addresses B3)
- **What.** Per-commit token + wall-time data emitted in a structured form distinct from `PROMPT_LOG.md`. Consumed by the supervisor (S5) for budget enforcement.
- **Prerequisite.** S1 (so an outside consumer exists). Also a baseline of ≥30 days of structured events before any predictor is built (per `UNATTENDED_EXECUTION_PREREQUISITES.md` §2).
- **Forbidden shortcut.** Inferring spend from `actual_tokens` field that has no documented incrementer.
- **Status.** Not designed.

### 6.5 — Substrate step S5: external escalation channel (addresses B5)
- **What.** A channel out of the runtime (text/push/email) that the supervisor (S1) can trigger when a stuck or budget condition fires.
- **Prerequisite.** S1 + S6 + S3. Without S6, escalations arrive after the bad action; without S3, there are no thresholds worth escalating on.
- **Forbidden shortcut.** Sending notifications from inside Claude sessions. They die with the session.
- **Status.** Not designed.

### 6.6 — Substrate steps NOT to take pre-emptively
- **No claim queue / parallel arbitration (B4).** Off the path until L4 is on the table; L4 is not on the radar.
- **No cross-agent automation of HIGH-risk approvals (B7).** Off the path; intentionally late.
- **No self-healing rule catalog (L5).** Requires ≥30 days of real failure data, which presupposes S1+S3 emit it.

---

## 7. Unsafe tempting acceleration paths

Specific shapes of "make it faster" that compound pressure rather than relieve it. Listed in increasing order of subtle danger.

### 7.1 — Larger packets without tighter exits
Tempting because relay compression is real. Dangerous because "larger" without "tighter exits" produces runaway windows that hit caps mid-state. Mitigation already in `SELF_CONTAINED_EXECUTION_WINDOWS.md` §6: 30–90 minute windows; pushing past 3h at L1 stops compressing and starts gambling.

### 7.2 — Auto-drain the prompt queue
Tempting because the queue exists and the gate feels like ceremony. Dangerous because the gate is the entire L1 safety mechanism for halt-and-wait items. Per `UNATTENDED_EXECUTION_PREREQUISITES.md` §1: auto-drain is forbidden until a supervisor + tested PAUSED-state behavior exist.

### 7.3 — Parallel drain as "swarm"
Tempting because subagent dispatch via the Agent tool already works inside one turn. Dangerous because shared markdown becomes a race surface the moment subagents persist beyond the parent turn. Per `ORCHESTRATION_MATURITY_MODEL.md` §1.L4: this is L1-with-concurrency, not L4.

### 7.4 — Treat the Stop hook as supervision
Tempting because the hook exists, runs, and produces telemetry. Dangerous because telemetry is post-mortem, not liveness. Confusing the two leads to "we have a supervisor" claims with no observability of live runs.

### 7.5 — Add another Claude session to "watch the first"
Tempting because it sounds like external supervision. Dangerous because it is the same harness, the same blind spots, and two sessions racing on shared markdown. Per `SAFE_CONTINUATION_BOUNDARIES.md` §10: prototypical fake-supervisor.

### 7.6 — "Promote autonomous-mode SKILL.md to runtime" by adding more steps
Tempting because the skill spec already reads as if it were a runtime. Dangerous because the spec is not the runtime; adding steps deepens the illusion without changing what executes. The fix is either S1+S2 or *fewer* steps (so the spec stops *describing* a runtime that does not exist).

### 7.7 — Adopt overnight runs once a freeze artifact "looks clean"
Tempting because a clean freeze feels like the precondition. Dangerous because clean freeze is the L1 ceiling, not an overnight prerequisite. Overnight requires L3 substrate (`UNATTENDED_EXECUTION_PREREQUISITES.md` §5). The radar refuses to recommend overnight on freeze quality alone.

### 7.8 — Bundle related substrate steps for "efficiency"
Tempting because S1+S2+S3+S5+S6 sounds like a project. Dangerous because each step has its own prerequisite chain and its own failure mode. Bundling reduces pre-prerequisite verification per step. The radar recommends sequenced delivery: S1+S2 paired, S6 next, S3 next, S5 last.

---

## 8. Sustainable throughput estimate

Honest numbers, grounded in L1 reality. Updated when observed throughput moves materially.

```
Reading as of: 2026-05-10
Confidence:    medium (anecdotal; no structured cycle-time series exists yet — see B3)
Unit:          commits per attended hour during a packet-shaped session
Estimate:      3–8 commits/hour on item-batch work
               1–4 commits/hour on single-track-walk work
               1–3 commits/hour on bounded-investigation (doc) work
Floor at L1:   1 commit/hour during clarification-heavy work or when relay
               compression has not yet been adopted
Ceiling at L1: ~10 commits/hour on highly homogeneous batch work; pushing
               past this produces commit-quality decay (unrelated bundling,
               weak messages) before it produces volume gain
Sustainable
attended day:  3–4 well-shaped packets, ≤90 min each, with breaks. ≈12–25
               commits/day at L1. Higher numbers are bursts; bursts are not
               throughput.
Honest note:   This is throughput while Michael is reachable. Unattended
               throughput at L1 is zero — no work happens between sessions.
               Predicted ceiling at honest L3 (when reached): ~2–3× attended,
               not 10×. Asymptotes are bounded by review bandwidth (B7),
               not by execution.
```

A throughput claim higher than the ceiling above is a flag. Either the unit being counted is wrong (LOC instead of meaningful commits), or quality is being eaten to produce volume.

---

## 9. Current orchestration maturity level

```
Reading as of: 2026-05-10
Confidence:    high
Level:         L1 — bounded assisted execution
Evidence:
  - One Claude turn is the runtime (B1 binding).
  - WORK_IN_PROGRESS.md is canonical resume; prose, not structured (B2).
  - last_heartbeat is written, no consumer.
  - Stop hook is post-mortem.
  - No external escalation channel.
  - prompt-queue parallel drain is L1-with-concurrency, not L4.
  - codex-review LOW/HIGH gate is the only mature cross-agent pattern.
Hooks present
toward L2/L3:
  - autonomous_mode.json schema (latent; no consumer)
  - heartbeat field (latent)
  - Stop hook + efficiency-aggregate.sh (telemetry, not supervision)
  - Doctrine corpus in docs/runtime/ (this branch)
Forecast:
  - Next level reachable: L2, conditional on S1+S2 substrate steps.
  - L2 → L3 jump is non-trivial; do not promise it on the same project.
  - L4 / L5 not on the radar's horizon at this date.
Honesty test:
  Question: if Michael never sends another message, what continues to
            happen?
  Answer:   nothing. Confirms L1.
```

Maturity level is the most honesty-sensitive reading the radar produces. Promotions are evidenced or they are wrong. The radar will not promote on doctrine alone; doctrine is necessary but not sufficient.

---

## 10. Update protocol

When a reading needs updating:

1. Confirm the trigger (§1 cadence triggers).
2. Append a new dated reading to the affected section. Do not edit prior readings.
3. If the trigger is ambiguous, add a "watch" entry rather than a full reading.
4. Cross-check that the update is doctrine-compatible (§2 operating constraints).
5. If the update implies the radar is doing something between updates, rewrite. The radar does not act.
6. Commit with a message that names the section(s) updated and the trigger.

Example commit message shapes:
- `docs(runtime): radar §3 → B2 begins binding (S1 design started)`
- `docs(runtime): radar §5.4 → relay-tax resurgence active week-over-week`
- `docs(runtime): radar §9 → L1 confirmed at +30 days (no change)`

---

## 11. Anti-patterns specific to the radar

The radar is itself a target for the same illusions it observes. Common shapes to refuse:

- **"The radar is monitoring."** It is not. It is read. Wording bug; rewrite.
- **"The radar updated itself."** A Claude session under explicit packet authority updated it. The radar is text.
- **"The radar predicted X."** A reading captured at the time produced a prediction. Predictions belong to the reading, not to a continuous process.
- **"The radar should auto-escalate."** Out of scope. Escalation is a human + supervisor concern; the radar surfaces context for that escalation when it is read.
- **"Future-proof the radar by adding more sections."** The seven sections cover the mission. Adding sections diffuses signal.
- **"Combine the radar with the bottleneck map."** They are intentionally separate: the map is structural and slow-moving; the radar is observational and faster-moving. Combining them collapses the difference.

---

## 12. The single sentence

The radar names what is binding now, what will be binding next, and which acceleration paths would compound the binding instead of relieving it; everything past that is for humans and substrate, not for the radar.
