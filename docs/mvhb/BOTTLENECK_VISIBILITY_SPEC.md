# BOTTLENECK_VISIBILITY_SPEC.md — AccentOS Bottleneck Visibility Design

> Sandbox doc. Observability design only.
> No runtime authority. No auto-remediation. No notification implementation.
> Defines how the 18 telemetry signals compose into operator-visible bottlenecks,
> how Michael triages them from iPhone, and what actions resolve each type.

---

## DESIGN PHILOSOPHY

A bottleneck detector fails if it generates noise.
Michael's attention is the scarcest resource in this system.
Every alert that does not require action trains him to ignore alerts.

The spec prioritizes:
- Signal-to-noise ratio over completeness
- Actionability over informativeness
- One-glance triage over comprehensive dashboards
- False-negative tolerance over false-positive intolerance

Meaning: it is better to miss a minor bottleneck than to surface a non-bottleneck.
True bottlenecks are loud and self-evident when the signal set is right.

---

## BOTTLENECK SEVERITY TIERS

Four tiers. Tiers are defined by: time-sensitivity, blast radius, and reversibility.

```
TIER 0 — CRITICAL
System is halted or degrading. Requires Michael action within hours.
Claude cannot proceed without intervention.
Visible: STATUS.md HEALTH = RED + BLOCKED = YES

TIER 1 — SIGNIFICANT
System is impaired. Michael should act within 24h.
Claude may have workarounds but velocity is reduced.
Visible: STATUS.md HEALTH = YELLOW + specific field flagged

TIER 2 — ADVISORY
System is healthy but a signal warrants awareness.
No immediate action required — monitor.
Visible: One STATUS.md field in degraded state, HEALTH still GREEN or YELLOW

TIER 3 — NOISE FLOOR
Signal exists but does not indicate a real bottleneck.
Below the alerting threshold. Not surfaced.
Example: single wip: commit 30 minutes old, or queue depth 1 lower than yesterday
```

---

## BOTTLENECK TYPE CATALOG

Six bottleneck types. Each maps to a signal family, a severity floor, a STATUS.md
indicator, and a Michael action.

---

### TYPE 1 — SESSION HEALTH FAILURE

Definition: Claude session has gone dark, crashed, or is not making progress.

Primary signals: A1 (Last Push Age), A2 (WIP Commit Presence), A3 (Push Cadence Rate)

Tier mapping:
```
TIER 0: SESSION STATE = ACTIVE + Last Push >4h + No response to chat
TIER 1: SESSION STATE = ACTIVE + Last Push 2h–4h + wip: commit present
TIER 2: SESSION STATE = ACTIVE + Last Push 1h–2h (within normal variance)
TIER 3: wip: commit <1h old (mid-session normal state)
```

Phone indicator: LAST PUSH timestamp + message in STATUS.md.
If LAST PUSH is hours old and message starts with `wip:`, session went dark dirty.

Michael action:
```
TIER 0 → Open a new Claude session on same branch. Say "resume."
          Claude reads STATUS.md + WIP.md and picks up from NEXT ACTION.
TIER 1 → Check chat. If no Claude activity in 2h, initiate resume.
TIER 2 → No action. Monitor next check-in.
```

Noise filter: TIER 3 is never surfaced. A wip: commit <1h old is mid-session normal.
Do not alert on push gaps <1h.

Operator overload risk: LOW. This bottleneck is self-resolving via resume.
Michael's action is cheap (one message in chat).

---

### TYPE 2 — QUEUE PRESSURE / AUTONOMOUS WORK EXHAUSTION

Definition: Claude has run out of autonomous work to do and is waiting on Michael
to add items, resolve gates, or make decisions.

Primary signals: B1 (Unblocked Queue Depth), B2 (Blocked Item Ratio), B3 (Queue Velocity)

Tier mapping:
```
TIER 0: Unblocked depth = 0 + SESSION STATE = ACTIVE + BLOCKED = YES
         (Claude is running but has nothing to do)
TIER 1: Blocked Item Ratio >70% (most queue locked behind Michael)
TIER 2: Blocked Item Ratio 30–70% (significant Michael dependency)
TIER 3: Queue velocity 1 item/session (below average but not stalled)
```

Phone indicator: QUEUE DEPTH field.
`0 items` = TIER 0. `11 items (9 blocked on Michael)` = TIER 1 by ratio.

Michael action:
```
TIER 0 → Review BUILD_PLAN_CLAUDE.md. Add new items or resolve the top gate.
TIER 1 → Identify which M-tasks are blocking. Batch-resolve them in one sitting.
TIER 2 → No urgency. Check gates on next scheduled review.
TIER 3 → No action. Velocity variance is normal.
```

Noise filter: TIER 3 is informational only — never surface as an alert.
A queue depth of 1 is not a crisis. An unblocked depth of 0 with ACTIVE session is.

Operator overload risk: MEDIUM. TIER 0 requires Michael to make decisions
(what to build next) rather than execute a simple task. Decision fatigue is real.
Mitigation: BUILD_PLAN_CLAUDE.md should always have at least 5 unblocked items buffered.

---

### TYPE 3 — DEPENDENCY BLOCKAGE (M-TASK GATE)

Definition: A specific Michael-owned action is preventing Claude from proceeding.
The clearest and most common bottleneck in the system.

Primary signals: C1 (Gate Open Duration), C2 (Gate Recurrence), C3 (Concurrent Gate Count)

Tier mapping:
```
TIER 0: Gate >48h old + BLOCKED = YES + Unblocked queue = 0
         (Claude is fully stopped, gate is stale, no workaround)
TIER 1: Gate 12h–48h old OR Concurrent gates ≥2
         (Claude may have workarounds but gate is aging)
TIER 2: Gate <12h old (recently set, Michael likely aware)
TIER 3: Gate recurring (C2 ≥3x) — advisory only, not urgency
```

Phone indicator: CURRENT GATE field + BLOCKED field. These are the highest-priority
STATUS.md fields for this bottleneck type.

Michael action:
```
TIER 0 → Execute the M-task immediately. It is the only thing unblocking the system.
          After completing: tell Claude "[M-task] done" in chat.
TIER 1 → Execute the M-task within 24h. Note if concurrent gates can be batched.
TIER 2 → Acknowledge gate exists. Schedule it for next available window.
TIER 3 → Flag recurring gate type as automation candidate. Note in BUILD_INTELLIGENCE.md.
```

Gate recurrence is not an urgency signal but a systemic signal.
If the same M-task type appears ≥3x (e.g., "run SQL in Supabase"), that M-task
should be automated, scripted, or eliminated from the gate loop.

Noise filter: A gate <6h old that Claude explicitly set is not noise — but it is also
not a crisis. Do not page yourself at 2am for a gate set 4h ago.

Operator overload risk: HIGH. Multiple open gates simultaneously cause decision paralysis.
The batch-resolution strategy (resolve all open gates in one sitting) prevents this.
TIER 0 gate + TIER 0 session = the maximum alert state — true operational emergency for this system.

---

### TYPE 4 — RESUME FRICTION / CONTEXT DEGRADATION

Definition: A frozen or paused session has accumulated enough friction that
resuming it will require significant ramp-up time. The work is not lost but
the cost to continue it is rising.

Primary signals: D2 (Resume Friction Index), D3 (State Transition Rate),
                 A2 (WIP Commit Presence), E1 (Frozen Session Age)

Tier mapping:
```
TIER 0: Resume Friction = HIGH + session is the only one with the relevant work
         (Michael needs this work and it will cost >30min to resume correctly)
TIER 1: Resume Friction = MEDIUM + NEXT ACTION is set but wip: commit present
TIER 2: Resume Friction = LOW (NEXT ACTION set, clean freeze, <7d)
TIER 3: Single wip: commit <2h old (normal mid-session state, not frozen)
```

Phone indicator: NEXT ACTION field + LAST PUSH message in STATUS.md.
Missing NEXT ACTION on a frozen session = TIER 1 minimum.
wip: commit in LAST PUSH on a frozen session = TIER 1.

Michael action:
```
TIER 0 → Resume the session soon. Delay compounds friction further.
          Tell Claude "resume [branch]" — Claude reads WIP.md and NEXT ACTION,
          re-establishes context before touching code.
TIER 1 → Resume within 7 days or make a merge/abandon decision.
TIER 2 → Monitor. Friction is low, no urgency.
TIER 3 → No action. Mid-session normal state.
```

The TIER 0 case for this type is subtle: it is not urgent in the same way a
stale gate is urgent. But it is the most invisible bottleneck — friction accumulates
silently and only becomes visible when Michael tries to resume and Claude takes
30 minutes to reconstruct context.

Noise filter: Any session with NEXT ACTION set and clean last commit is TIER 2 or below.
Only surface as TIER 0 when: missing NEXT ACTION AND frozen >14d AND no other session
covers the same work.

Operator overload risk: LOW. The action is cheap (resume command). The cost is
front-loaded during the ramp-up, not on Michael's side.

---

### TYPE 5 — FROZEN SESSION DEBT

Definition: Branches are accumulating faster than they are being resolved.
Work is parked, not shipping, and merge complexity is compounding.

Primary signals: E1 (Frozen Session Age), E2 (Frozen Session Count), E3 (Commit Depth)

Tier mapping:
```
TIER 0: ≥4 frozen sessions OR any frozen session >30d old
         (branch accumulation is out of control — explicit triage required)
TIER 1: 3 frozen sessions OR any frozen session 14–30d old
         (debt is building — review needed within the week)
TIER 2: 2 frozen sessions, all <14d
         (normal parallel work — monitor)
TIER 3: 1 frozen session <7d (single recent park — completely normal)
```

Phone indicator: FROZEN SESSIONS field in STATUS.md.
Count + branch names visible at a glance. Age requires one-tap to branch view in GitHub.

Michael action:
```
TIER 0 → Schedule a triage session. For each frozen branch, decide:
          MERGE: Claude resumes + merges to main
          ABANDON: branch deleted, work discarded (explicitly)
          HOLD: justified (active dependency) — set a review date
TIER 1 → Identify the oldest frozen session. Make a merge/abandon decision on it.
TIER 2 → No action required. Review at next weekly check-in.
TIER 3 → No action. Single parked session is normal.
```

The TIER 0 case is the "frozen debt crisis." Four branches with unreleased work,
some >30 days old, represents: merge conflicts almost certain, context ramp-up cost
high on all of them, and a growing delta from main that makes each successive merge harder.

Triage rule: Oldest sessions first. FIFO on frozen session resolution.

Noise filter: A single frozen session <7d old is never surfaced. This is the
expected state after any session pause — not a bottleneck.

Operator overload risk: MEDIUM. Triage requires decisions. But the decision framework
is simple (merge / abandon / hold) and each decision is fast once Claude provides
a one-line summary of what the frozen session contains.

---

### TYPE 6 — RELAY FRICTION / OPERATOR ↔ AGENT LOOP DEGRADATION

Definition: The handoff loop between Michael and Claude is slow, lossy, or repetitive.
This is the meta-bottleneck — it compounds all other types.

Primary signals: F1 (Queue Stall Duration), F2 (Gate-to-Resolution Latency),
                 F3 (Relay Friction Index — composite)

Tier mapping:
```
TIER 0: F3 Relay Friction Index ≥5 (multiple contributing components RED)
         AND queue stall >48h
         (the relay loop is the primary constraint on system throughput)
TIER 1: F3 ≥3 OR Gate-to-resolution latency >48h on the most recent gate
TIER 2: F3 = 1–2 (minor friction in one component)
TIER 3: Single slow resolution that is an outlier (Michael was traveling, etc.)
```

Phone indicator: No single STATUS.md field captures this directly.
It is derivable from: BLOCKED duration + CURRENT GATE age + QUEUE DEPTH stall.
Future HUD overlay: a single RELAY HEALTH field (SMOOTH / FRICTION / DEGRADED).

Michael action:
```
TIER 0 → The relay loop itself needs attention. Diagnose which component is primary:
          If gates are slow → batch-resolve all open M-tasks in one session
          If queue is stalled → Claude may need a "resume + priority reset" directive
          If context is degrading → scheduled sync session (Claude summarizes all
          frozen sessions + open gates, Michael makes decisions, Claude resumes)
TIER 1 → Identify the dominant F3 component. Address just that one.
TIER 2 → Monitor. Single friction point is normal variance.
TIER 3 → No action. Outlier event does not indicate systemic degradation.
```

This is the only bottleneck type where the action is not a simple task execution.
TIER 0 relay friction requires a "reset session" — Michael and Claude spend time
triaging the system state rather than building. This is expensive but necessary
when the loop has degraded.

Noise filter: F3 TIER 3 is never surfaced. One slow gate resolution is not a pattern.
Relay friction only becomes a bottleneck when multiple components degrade simultaneously.

Operator overload risk: HIGH. Relay friction is itself a symptom of operator overload —
Michael has too many open items and too little bandwidth. The reset session is the remedy.
Frequency of reset sessions is itself a health signal: >1/month = system design problem.

---

## TRIAGE PRIORITY ORDER

When Michael opens STATUS.md and sees multiple signals degraded, this is the
order to read and act:

```
Priority 1 — HEALTH field         (synthesized severity — one glance)
Priority 2 — BLOCKED field         (binary: is Claude stopped?)
Priority 3 — CURRENT GATE field    (if blocked: what must Michael do?)
Priority 4 — SESSION STATE field   (ACTIVE / FROZEN / PAUSED_ON_MICHAEL)
Priority 5 — LAST PUSH timestamp   (how fresh is the most recent work?)
Priority 6 — QUEUE DEPTH split     (how much unblocked work remains?)
Priority 7 — FROZEN SESSIONS count (is session debt accumulating?)
Priority 8 — NEXT ACTION           (what happens when Michael acts?)
```

Triage rule: Resolve in priority order. Do not jump to QUEUE DEPTH before checking BLOCKED.
A degraded QUEUE DEPTH with BLOCKED = YES means the queue stat is misleading —
unblocking Claude is the action, not adding queue items.

---

## PHONE-FIRST BOTTLENECK DETECTION (20-second triage)

This is the complete iPhone triage flow:

```
STEP 1 (2s): Read HEALTH field.
  → GREEN: put phone down. No action needed.
  → YELLOW: continue to step 2.
  → RED: continue to step 2 immediately.

STEP 2 (3s): Read BLOCKED field.
  → NO: Claude is running. YELLOW HEALTH may be minor friction. Read WIP for context.
  → YES: Claude is stopped. Proceed to step 3.

STEP 3 (5s): Read CURRENT GATE field.
  → NONE: contradiction — BLOCKED = YES but no gate set. Flag to Claude.
  → M##: description: This is Michael's action. Execute it.
           Check if it's fast (run SQL = 5 min) or requires local terminal
           (wrangler deploy = need desktop). Schedule accordingly.

STEP 4 (5s, optional): Read QUEUE DEPTH and FROZEN SESSIONS.
  → If blocked ratio is high: batch-plan M-task resolution.
  → If frozen count is high: schedule triage session.

STEP 5 (5s, optional): Read NEXT ACTION.
  → Confirms what Claude will do when unblocked.
  → If NEXT ACTION is missing: first action after unblocking is to ask Claude to set it.
```

Total time: 20 seconds for TIER 0 detection, 2 seconds for GREEN confirmation.

---

## LOW-ENTROPY ALERTING RULES

What earns an alert vs. what gets ignored:

```
SURFACE (true bottleneck signal):
✓ BLOCKED = YES with gate >12h old
✓ SESSION STATE = ACTIVE but LAST PUSH >4h old
✓ FROZEN SESSIONS count ≥3
✓ QUEUE DEPTH = 0 with SESSION STATE = ACTIVE
✓ HEALTH = RED for any reason

SUPPRESS (noise — do not alert):
✗ wip: commit <2h old
✗ Single frozen session <7d
✗ Queue depth decreased by 1 (normal progress)
✗ Gate <6h old (recently set, Michael likely aware)
✗ HEALTH = YELLOW with no BLOCKED = YES and active push activity
✗ Session state transition ACTIVE → FROZEN (expected lifecycle)
```

Signal-to-noise calibration principle:
A well-calibrated system should surface a true bottleneck ≤3 times per week
in a healthy solo build operation. If Michael is seeing alerts more frequently,
the thresholds are too sensitive. If he is surprised by stalled work,
the thresholds are too loose.

---

## BOTTLENECK INTERACTION MAP

Bottlenecks compound. Knowing which types co-occur is operationally valuable:

```
TYPE 3 (Gate) + TYPE 2 (Queue Exhaustion)
→ Claude stopped AND has nothing else to do
→ Highest urgency combination: TIER 0 + TIER 0
→ Full system halt — Michael must act immediately

TYPE 5 (Frozen Debt) + TYPE 4 (Resume Friction)
→ Many frozen sessions + high ramp-up cost
→ The debt is expensive to pay off: triage session required
→ Worst-case: Michael must spend 2–3h reviewing and resuming sessions

TYPE 6 (Relay Friction) + TYPE 3 (Gate)
→ Gate is open AND Michael's response latency is high
→ The relay loop cannot clear its own backlog
→ System throughput grinds: reset session is the intervention

TYPE 1 (Session Dark) + TYPE 5 (Frozen Debt)
→ Active session went dark AND frozen sessions already accumulating
→ Resume the active session first (cheapest fix), then triage frozen

TYPE 2 (Queue Exhaustion) alone (no gate, no frozen debt)
→ Claude finished everything. BUILD_PLAN needs new items.
→ Michael's highest-leverage action: write the next 10 build items.
```

---

## OPERATOR OVERLOAD INDICATOR

Operator overload is a meta-bottleneck: Michael himself becomes the system constraint.

Signals:
- ≥2 open gates simultaneously (C3 TIER 1+)
- Gate-to-resolution latency trending upward across consecutive gates (F2)
- Frozen session count increasing across consecutive sessions (E2 trend)
- Relay Friction Index stable at ≥3 for >1 week (F3 persistent)

Indicator in STATUS.md: No single field captures this today.
Future HEALTH field note: `YELLOW — operator bandwidth appears constrained (multiple aging gates)`

Michael action when overloaded:
```
1. Do a 10-minute triage: which open gates are fastest to resolve? Do those first.
2. Batch all SQL-type gates: run them all in one Supabase session.
3. Batch all deploy-type gates: run wrangler deploy once, cover multiple items.
4. For judgment-call gates: answer them in one Claude chat message.
   "M05: use vendor tier B for inactive brands. M08: yes, persist to Supabase."
5. After clearing gates: let Claude run autonomously until queue is exhausted
   before introducing new work.
```

Operator overload is not a failure state — it is a signal that Claude is outpacing
Michael's available bandwidth. In a healthy system, Claude should occasionally wait.
If Claude never waits, the queue is too thin. If Claude always waits, the gates are too thick.

---

## MINIMUM VIABLE BOTTLENECK SURFACE (v1 — zero new tooling)

These are the only checks Michael needs to do from iPhone to detect 90% of true bottlenecks:

```
CHECK 1: STATUS.md HEALTH field
  RED = act. YELLOW = check BLOCKED. GREEN = done.

CHECK 2: STATUS.md BLOCKED field
  YES = read CURRENT GATE and execute the M-task.
  NO = Claude is running.

CHECK 3: STATUS.md FROZEN SESSIONS count
  ≥3 = schedule triage. <3 = normal.

CHECK 4: STATUS.md LAST PUSH timestamp
  >4h during ACTIVE session = open chat and say "resume."

CHECK 5: STATUS.md QUEUE DEPTH (blocked split)
  All blocked = batch-resolve open gates.
  Unblocked present = Claude can keep running.
```

5 checks. 20 seconds. Covers TIER 0 and TIER 1 for all 6 bottleneck types.

Everything else in this spec is either tooling-dependent (future overlays)
or low-priority advisory (TIER 2/3) that can be reviewed weekly rather than on-demand.
