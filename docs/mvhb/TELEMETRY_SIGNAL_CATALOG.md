# TELEMETRY_SIGNAL_CATALOG.md — AccentOS Operational Signal Catalog

> Sandbox doc. Observability design only.
> No write authority. No governance ownership. No auto-sync.
> Defines the signals Claude naturally emits during operation —
> observable without instrumentation, readable on iPhone.

---

## PURPOSE

Every Claude session already emits operational signals as a byproduct of normal work:
git commits, STATUS.md updates, WIP transitions, gate declarations.
This catalog names those signals, defines their baselines and thresholds,
and maps each to a bottleneck type and mobile-visible indicator.

No new infrastructure required to collect these signals.
They exist now. The catalog makes them explicit and actionable.

---

## SIGNAL TAXONOMY

Signals are grouped into 6 families:

```
A — Push Freshness          (git-derived)
B — Queue Pressure          (build-plan-derived)
C — Gate / Dependency       (M-task-derived)
D — Session Health          (session-state-derived)
E — Frozen Session Aging    (branch-derived)
F — Cadence Degradation     (rate-of-change-derived)
```

---

## FAMILY A — PUSH FRESHNESS SIGNALS

Derived from: `git log --format="%ci" -1` on the active branch.

---

### A1 — Last Push Age

Definition: Time elapsed since last successful push to remote on active branch.

Collection: Compare current timestamp to LAST PUSH field in STATUS.md.

Baseline: <1h during active session.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | <1h | Session is current |
| YELLOW | 1h–4h | Session may be slow or stalled |
| RED | >4h during ACTIVE | Session likely crashed or loop-spinning |
| EXEMPT | SESSION STATE = FROZEN | Age clock pauses — frozen is intentional |

Mobile signal: LAST PUSH timestamp in STATUS.md. Age is the delta from now.

Bottleneck type: SESSION HEALTH — indicates Claude may not be running.

---

### A2 — WIP Commit Presence

Definition: Whether the most recent commit on the active branch carries a `wip:` prefix.

Collection: `git log --oneline -1` — check for `wip:` prefix.

Baseline: `wip:` commits should clear within 1 session (replaced by a real commit).

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | No wip: commits, or wip: <2h old | Normal mid-session state |
| YELLOW | wip: commit >4h old | Session paused mid-task, not wrapped cleanly |
| RED | wip: commit >24h old | Session froze dirty — context may be corrupted |

Mobile signal: LAST PUSH message in STATUS.md. If it starts with `wip:`, the session ended messy.

Bottleneck type: RESUME FRICTION — wip: commit means context is partially committed,
resume requires extra care to not double-commit or lose work.

---

### A3 — Push Cadence Rate

Definition: Average time between commits over the last N commits (trailing window).

Collection: `git log --format="%ci" -10` — compute inter-commit intervals, take median.

Baseline: 1 commit per 30–90 minutes during active build work.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | Median interval <90m | Healthy build cadence |
| YELLOW | Median interval 90m–3h | Slow — possible investigation/debugging loop |
| RED | Median interval >3h, session ACTIVE | Cadence degraded — likely blocker or loop |

Mobile signal: Computed from LAST PUSH timestamps across recent commits in git log.
Not directly visible in STATUS.md v1 — future HUD overlay candidate.

Bottleneck type: CADENCE DEGRADATION — early warning before a session goes fully dark.

---

## FAMILY B — QUEUE PRESSURE SIGNALS

Derived from: `BUILD_PLAN_CLAUDE.md` unchecked item count + blocked split.

---

### B1 — Unblocked Queue Depth

Definition: Count of `[ ]` items in BUILD_PLAN_CLAUDE.md with no BLOCKS ON MICHAEL dependency.

Collection: grep count of `[ ]` lines minus lines also containing `BLOCKS ON MICHAEL`.

Baseline: Decreasing over time during active sessions.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | Decreasing, >0 | Claude has autonomous work, queue moving |
| YELLOW | Static for >24h with ACTIVE session | Queue not moving — investigate |
| RED | 0 unblocked, session ACTIVE | Claude has nothing to do autonomously |

Mobile signal: QUEUE DEPTH field — `[N] items ([M] blocked on Michael)`.

Bottleneck type: QUEUE PRESSURE — if unblocked depth is 0, all work depends on Michael.

---

### B2 — Blocked Item Ratio

Definition: (Blocked items) / (Total unchecked items). Expressed as percentage.

Collection: Derived from QUEUE DEPTH field values.

Baseline: <30% blocked is normal. High blocked ratio = Michael is the bottleneck.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | <30% blocked | Claude can run autonomously |
| YELLOW | 30–70% blocked | Significant Michael dependency — check gates |
| RED | >70% blocked | System is waiting on Michael, not Claude |

Mobile signal: Visible from the parenthetical in QUEUE DEPTH field.
`11 items (9 blocked on Michael)` = 82% blocked = RED.

Bottleneck type: DEPENDENCY BLOCKAGE — operator is the constraint, not the agent.

---

### B3 — Queue Velocity

Definition: Number of BUILD_PLAN items completed per session (or per 24h window).

Collection: Count `[x]` additions to BUILD_PLAN_CLAUDE.md since last session start.

Baseline: 2–5 items per full active session.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | ≥2 items/session | Productive session |
| YELLOW | 1 item/session | Below-average — possibly investigation-heavy |
| RED | 0 items/session, session ran >2h | Session produced no shipped items |

Mobile signal: Not directly in STATUS.md v1. Computable from BUILD_PLAN git diff.
Future HUD overlay: "X items shipped this session."

Bottleneck type: OUTPUT RATE — measures actual shipping, not just activity.

---

## FAMILY C — GATE / DEPENDENCY SIGNALS

Derived from: CURRENT GATE and BLOCKED fields in STATUS.md + M-task registry.

---

### C1 — Gate Open Duration

Definition: Time elapsed since CURRENT GATE was set (i.e., since Claude declared a blocker).

Collection: Timestamp of the commit that set CURRENT GATE in STATUS.md.

Baseline: Gates should resolve within 24h. Michael runs a SQL script, deploys a worker,
or makes a judgment call — none of these should take more than a day.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | Gate <12h old | Recently set, Michael likely aware |
| YELLOW | Gate 12h–48h old | Michael may have missed it — needs ping |
| RED | Gate >48h old | Stale gate — session idle, work blocked |

Mobile signal: CURRENT GATE field + BLOCKED field. Age requires comparing commit timestamp
to current time (not yet in STATUS.md v1 — gate timestamp is a v2 addition candidate).

Bottleneck type: DEPENDENCY BLOCKAGE — the most high-value signal in the catalog.
A stale gate = silent idle time.

---

### C2 — Gate Recurrence

Definition: Whether the same M-task type (SQL run, worker deploy, judgment call)
appears repeatedly across sessions.

Collection: Search PROMPT_LOG.md and git commit history for repeated CURRENT GATE patterns.

Baseline: Each gate type should appear ≤2 times. Recurring gates indicate a process gap.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | Gate type appears ≤2x | Normal M-task handling |
| YELLOW | Gate type appears 3x | Pattern forming — consider automating or documenting |
| RED | Gate type appears ≥4x | Systemic friction — Michael keeps doing the same thing |

Mobile signal: Not directly visible. Requires log review.
Future HUD: "M-task type X has recurred 4 times — automation candidate."

Bottleneck type: RELAY FRICTION — repeated gates are the operator ergonomics problem.

---

### C3 — Concurrent Gate Count

Definition: Number of open M-tasks across all active and frozen sessions simultaneously.

Collection: Count CURRENT GATE entries across all STATUS-*.md files (or STATUS.md for solo).

Baseline: ≤1 open gate at a time in solo operation.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | 0–1 open gates | Normal |
| YELLOW | 2 open gates | Michael has two actions pending |
| RED | ≥3 open gates | Gate queue is building — Michael is behind |

Mobile signal: CURRENT GATE in STATUS.md. In multi-session future, this requires
a gate tally field in the root STATUS.md.

Bottleneck type: DEPENDENCY BLOCKAGE — compounding gates compound idle time.

---

## FAMILY D — SESSION HEALTH SIGNALS

Derived from: SESSION STATE transitions + session metadata.

---

### D1 — Session Age

Definition: Time since current session started (i.e., since branch was created or resumed).

Collection: `git log --format="%ci" --diff-filter=A -- STATUS.md` (first STATUS write on branch).

Baseline: Sessions should complete or freeze within 4–8h of active work.
Long-running sessions accumulate WIP debt and context drift.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | Session <8h active work | Healthy session scope |
| YELLOW | Session 8h–24h active | Large session — may need to split |
| RED | Session >24h active | Scope too large or session is stuck |

Mobile signal: Not directly in STATUS.md v1. Derivable from branch creation date in GitHub.

Bottleneck type: CONTEXT DRIFT — very old sessions have stale assumptions baked in.

---

### D2 — Resume Friction Index

Definition: Estimated cost of resuming a frozen session, based on:
- Age of freeze (older = more context ramp-up)
- Presence of wip: commit (dirty freeze = higher friction)
- Whether NEXT ACTION is set (missing = high friction)
- Merge conflict probability (time since branch diverged from main)

Collection: Derived from STATUS.md NEXT ACTION presence + WIP commit presence + branch age.

Baseline: Every frozen session should have NEXT ACTION set (friction = LOW).
A frozen session without NEXT ACTION has friction = HIGH.

| Friction | Conditions | Resume cost |
|---|---|---|
| LOW | NEXT ACTION set, no wip: commit, <7d frozen | <5 min ramp-up |
| MEDIUM | NEXT ACTION set, wip: commit present, OR 7–14d frozen | 10–20 min ramp-up |
| HIGH | NEXT ACTION missing, OR >14d frozen, OR merge conflicts likely | >30 min ramp-up |

Mobile signal: Partially visible — NEXT ACTION in STATUS.md. Age in branch name date.

Bottleneck type: RESUME FRICTION — the hidden cost of frozen sessions.

---

### D3 — Session State Transition Rate

Definition: How often SESSION STATE changes between ACTIVE / FROZEN / PAUSED.

Collection: Count of SESSION STATE changes in STATUS.md git history.

Baseline: 1–2 transitions per session (start → active → frozen/complete) is healthy.
Rapid cycling (active → frozen → active → frozen) indicates context thrashing.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | 1–3 transitions/session | Normal lifecycle |
| YELLOW | 4–6 transitions/session | Frequent interruption |
| RED | >6 transitions/session | Thrashing — Michael interrupting too often or Claude context-collapsing |

Mobile signal: Not directly visible. Derivable from STATUS.md git history.

Bottleneck type: CADENCE DEGRADATION — frequent state changes kill flow state.

---

## FAMILY E — FROZEN SESSION AGING SIGNALS

Derived from: FROZEN SESSIONS field + branch metadata.

---

### E1 — Frozen Session Age

Definition: Time since a session was last committed to (while frozen).

Collection: `git log --format="%ci" -1 [branch-name]` for each frozen branch.

Baseline: Frozen sessions should resolve (merge or abandon) within 14 days.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | <7d frozen | Recent park — likely to be resumed |
| YELLOW | 7–14d frozen | Aging — review needed |
| RED | >14d frozen | Stale — merge conflict risk growing |
| CRITICAL | >30d frozen | Likely abandoned — explicit decision required |

Mobile signal: FROZEN SESSIONS field in STATUS.md (shows count + branch names).
Age requires checking branch last-commit date in GitHub — one tap from the branches view.

Bottleneck type: FROZEN SESSION DEBT — the most insidious form of work-in-progress.

---

### E2 — Frozen Session Count

Definition: Number of branches currently in FROZEN state.

Collection: Count of entries in FROZEN SESSIONS field in STATUS.md.

Baseline: ≤2 frozen sessions at a time. More than 3 indicates session management breakdown.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | 0–2 frozen | Normal parallel work |
| YELLOW | 3 frozen | Review needed — which ones merge, which abandon |
| RED | ≥4 frozen | Branch accumulation — system is not closing work |

Mobile signal: FROZEN SESSIONS count in STATUS.md.

Bottleneck type: FROZEN SESSION DEBT — proxy for unfinished work that hasn't shipped.

---

### E3 — Frozen Session Commit Depth

Definition: Number of commits on a frozen branch not yet merged to main.

Collection: `git log main..[frozen-branch] --oneline | wc -l`

Baseline: <10 commits behind main before friction becomes high.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | <5 commits ahead of main | Easy to merge |
| YELLOW | 5–15 commits ahead | Moderate rebase/review effort |
| RED | >15 commits ahead | Significant merge investment required |

Mobile signal: Not visible in STATUS.md v1. Visible in GitHub branch comparison view.

Bottleneck type: FROZEN SESSION DEBT — high commit depth = merge cost compounds over time.

---

## FAMILY F — CADENCE DEGRADATION SIGNALS

Derived from: Rate-of-change across signals A, B, C, D over time.

---

### F1 — Queue Stall Duration

Definition: Time since QUEUE DEPTH last decreased (i.e., since last BUILD_PLAN item shipped).

Collection: Time between consecutive decrements of QUEUE DEPTH in STATUS.md git history.

Baseline: QUEUE DEPTH decreases at least once per active session.

| Level | Threshold | Indicator |
|---|---|---|
| GREEN | Decreased this session | Queue is moving |
| YELLOW | Not decreased in 24h | Build momentum stalled |
| RED | Not decreased in 48h, session ACTIVE | System is not shipping — investigate |

Mobile signal: QUEUE DEPTH field — static value across multiple STATUS.md reads = stall.

Bottleneck type: OUTPUT RATE — the clearest signal that build momentum has stopped.

---

### F2 — Gate-to-Resolution Latency

Definition: Time from CURRENT GATE being set to CURRENT GATE being cleared.

Collection: Timestamps of STATUS.md commits that set vs. clear CURRENT GATE.

Baseline: <24h resolution for most M-tasks. SQL runs and deploys should be same-day.

| Level | Latency | Interpretation |
|---|---|---|
| FAST | <4h | Michael is active and responsive |
| NORMAL | 4h–24h | Acceptable — Michael has other obligations |
| SLOW | 24h–48h | Gate is being deprioritized |
| CRITICAL | >48h | Gate is forgotten — explicit ping needed |

Mobile signal: Not directly in STATUS.md v1. Gate set timestamp needed for v2.

Bottleneck type: RELAY FRICTION — the gap between Claude stopping and Michael unblocking.

---

### F3 — Relay Friction Index (composite)

Definition: Composite signal summarizing the friction in the Claude ↔ Michael relay loop.
High relay friction = the handoff between Claude and Michael is slow or lossy.

Components:
- Gate open duration (C1)
- Gate recurrence (C2)
- Resume friction (D2)
- Gate-to-resolution latency (F2)

Scoring (each component contributes):
- Each GREEN component = 0 points
- Each YELLOW component = 1 point
- Each RED component = 2 points

| Total score | Relay Health |
|---|---|
| 0 | SMOOTH — relay is working |
| 1–2 | MINOR FRICTION — watch but don't act yet |
| 3–4 | SIGNIFICANT FRICTION — identify which component and address |
| ≥5 | HIGH FRICTION — system throughput impaired |

Mobile signal: Not visible in STATUS.md v1. Future HUD overlay — single derived field.

Bottleneck type: RELAY FRICTION — the meta-signal. If this is RED, the operator ↔ agent
loop is the constraint, not the build queue or the code.

---

## SIGNAL COVERAGE SUMMARY

```
FAMILY          SIGNALS    PRIMARY MOBILE SIGNAL         BOTTLENECK TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A Push Fresh.   A1 A2 A3   LAST PUSH timestamp           Session health
B Queue Pres.   B1 B2 B3   QUEUE DEPTH (split)           Queue pressure
C Gate / Dep.   C1 C2 C3   CURRENT GATE + BLOCKED        Dependency blockage
D Session Hlth  D1 D2 D3   SESSION STATE + NEXT ACTION   Context / friction
E Frozen Aging  E1 E2 E3   FROZEN SESSIONS count         Session debt
F Cadence Deg.  F1 F2 F3   QUEUE DEPTH change rate       Output rate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL           18 signals  8 visible in STATUS.md v1     6 bottleneck types
                            10 require git inspection
```

---

## MINIMUM VIABLE OBSERVABILITY (iPhone-readable, no tooling)

These 6 signals are visible RIGHT NOW from STATUS.md alone,
requiring no new instrumentation:

```
1. A1 — Last Push Age        → LAST PUSH timestamp
2. A2 — WIP Commit Presence  → LAST PUSH message (wip: prefix)
3. B1 — Unblocked Queue      → QUEUE DEPTH unblocked count
4. B2 — Blocked Item Ratio   → QUEUE DEPTH blocked split
5. C1 — Gate Open Duration   → CURRENT GATE + BLOCKED
6. E2 — Frozen Session Count → FROZEN SESSIONS count
```

These are the MVHB telemetry floor — zero implementation cost,
already being written to STATUS.md by design.

---

## HIGH-VALUE FUTURE OVERLAYS (not for MVHB — require tooling)

```
Signal          Collection method needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A3 Push Cadence  git log timestamp analysis (script)
C1 Gate Age      Gate-set timestamp in STATUS.md (v2 field)
D2 Resume Friction  Composite of wip: + NEXT ACTION + branch age
E1 Frozen Age    git log per frozen branch (script)
E3 Commit Depth  git log main..branch (script)
F2 Relay Latency  Git timestamp diff between gate-set + gate-clear
F3 Relay Index   Composite of C1 + C2 + D2 + F2 (derived field)
```

All 7 are implementable with a single shell script run at session start.
None require external services. All output can feed back into STATUS.md.
Governance layer defines write authority before implementation.
