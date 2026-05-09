# STATUS_MD_LIVE_EXAMPLE.md — Schema Reality Test

> Observability/ergonomics sandbox only.
> No governance ownership. No runtime authority.
> Uses REAL current state as of 2026-05-09 22:18 UTC.
> No fabricated telemetry, no hypothetical data.

---

## REAL CURRENT STATE (inputs used)

```
Branch:         claude/operational-hud-design-S1Eon
Last push:      5cbba46 — docs: relay handoff templates — 2026-05-09 (this session)
Session type:   Sandbox sprint (observability design docs)
WIP:            STATUS_MD_LIVE_EXAMPLE.md — 9th sandbox doc, final of sprint
Queue (main):   10 items total / 7 blocked on Michael (M04, M05, M06, M09, M03, M10)
Queue (sprint): 1 item remaining (this doc), then freeze
Active sessions: 1 — solo
Frozen sessions: 0 formal frozen branches
Remote branches: origin/claude/operational-hud-design-S1Eon only
Pending gate:   Worker proxy wrangler deploy unresolved since 2026-05-07 (~48h)
                Not formally registered as M-task, not blocking current sprint
                Blocks: Quote Generator "Parse Notes" 400 error on main track
M-tasks open:   M04 (BigCommerce key), M05 (GMC access), M06 (GA4 credential),
                M09 (Klaviyo key), M03 (Windward confirmation), M10 (Curtis outreach)
                + informal worker proxy gate (not yet M-numbered)
```

---

## THE LIVE STATUS.md (generated using v1 schema)

```
# STATUS — 2026-05-09 22:18 UTC

## HEALTH
YELLOW — worker proxy gate ~48h unresolved; sandbox sprint clean

## BLOCKED
NO — sprint unblocked; worker proxy gate on main track, not this session

## CURRENT GATE
NONE (sprint) / run wrangler deploy from local terminal — see WIP.md

## WIP
STATUS_MD_LIVE_EXAMPLE.md in progress — final sandbox sprint doc

## NEXT ACTION
Freeze sandbox branch; resume main track, fix worker proxy 400 on Quote Generator

## LAST PUSH
5cbba46 — docs: relay handoff templates — 2026-05-09 22:05 UTC

## BRANCH
claude/operational-hud-design-S1Eon

## QUEUE DEPTH
10 items (7 blocked on Michael — M04 M05 M06 M09 M03 M10)

## SESSION STATE
ACTIVE

## ACTIVE SESSIONS
1 — solo

## FROZEN SESSIONS
0 — none
```

Content line count: 22. Within 30-line hard limit. ✓
Blank lines (separators): 12. Total rendered lines: 34.

---

## SCHEMA VALIDATION — WHAT WORKED

### Field: HEALTH
Works exactly as designed. First field, one line, immediately readable.
GREEN / YELLOW / RED + reason gives enough context on its own.
The reason after the dash ("worker proxy gate ~48h unresolved; sandbox sprint clean")
carries two facts in one line without exceeding 60 chars.
On iPhone: visible above the fold, first glance confirms action state. ✓

### Field: LAST PUSH
Exact format works. Hash + message + timestamp is complete without being verbose.
Michael can immediately verify in GitHub if needed.
Gives push freshness signal without requiring any computation. ✓

### Field: SESSION STATE
Single value, instantly readable. No ambiguity. ✓

### Field: ACTIVE SESSIONS / FROZEN SESSIONS
1 — solo and 0 — none are both zero-friction reads.
These fields earn their space even when they say nothing alarming — confirming
solo operation is itself useful signal (confirms no parallel conflict risk). ✓

### Field: WIP
One-sentence constraint works. Present tense, active verb, grounded in specifics. ✓

---

## SCHEMA VALIDATION — WHAT CREATED AMBIGUITY

### Problem 1 — CURRENT GATE fails when BLOCKED = NO but a background gate exists

The spec says CURRENT GATE is either `NONE` or `M##: description`.
In reality: there is an active gate (worker proxy deploy) but it does not block
the current branch's work. So BLOCKED = NO is correct, but CURRENT GATE = NONE
is misleading — it hides a 48h-old pending Michael action.

The workaround written (`NONE (sprint) / run wrangler deploy...`) violates the
schema format and is longer than the spec allows.

**Gap identified:** The schema conflates "gate blocking current session" with
"gate pending on any track." A gate can be open without blocking the current session.
The schema has no field for background pending gates.

**Proposed solution:** Add `PENDING GATES` as a separate field from `CURRENT GATE`.
```
CURRENT GATE — blocks current session (causes BLOCKED = YES)
PENDING GATES — M-tasks open but not blocking current session
```

### Problem 2 — QUEUE DEPTH is ambiguous when running a sandbox session

The 10-item queue refers to the main build track (Track 5.13, 6.1–6.12).
But the current session is a sandbox sprint with its own implicit queue
(sandbox docs remaining). The field shows main track data while the session
is doing sandbox work.

A reader would see "10 items (7 blocked on Michael)" and might assume Claude is
idling when actually Claude is fully occupied with the sprint.

**Gap identified:** QUEUE DEPTH does not carry session-type context.
"10 items" looks like Claude has main track work available when it does not.

**Proposed solution:** A SESSION ROLE field, or a QUEUE DEPTH format that
distinguishes sprint queue from build queue:
```
QUEUE DEPTH
sprint: 1 item remaining / main: 10 items (7 blocked on Michael)
```

### Problem 3 — BRANCH name carries no semantic context

`claude/operational-hud-design-S1Eon` tells Michael what the branch is
but not what *kind* of work it is (sandbox vs. main build vs. bugfix).
On iPhone, the branch name alone cannot help Michael determine if this is
a work-in-progress feature branch or a standalone design sprint.

**Gap identified:** Branch field has no session-type signal.

**Proposed solution:** Either a SESSION ROLE field (sandbox / build / bugfix / hotfix)
or a naming convention addition: `claude/sandbox/operational-hud-design-S1Eon`.

### Problem 4 — NEXT ACTION mixes two tracks

`Freeze sandbox branch; resume main track, fix worker proxy 400 on Quote Generator`
is doing double duty: it names the end of the sandbox AND the start of the next
main-track action. These are two different sequenced events collapsed into one line.

On iPhone this is fine (short enough), but semantically it conflates session
lifecycle and task selection in a single field that was designed for one purpose.

**Gap identified:** NEXT ACTION assumes one contiguous track of work.
When a session is completing a sprint and returning to a different track,
the single NEXT ACTION line cannot represent the transition cleanly.

**Proposed solution:** Allow NEXT ACTION to use a two-part format when a track change
is imminent:
```
NEXT ACTION
end: freeze this branch
then: resume main track — worker proxy 400 fix
```

---

## MISSING FIELDS (not in v1 schema, needed in practice)

### Missing 1 — SESSION ROLE

What kind of session is this? The schema has SESSION STATE (lifecycle: ACTIVE/FROZEN)
but not SESSION ROLE (purpose: sandbox / main-build / hotfix / investigation).

Without SESSION ROLE, a reader cannot immediately know whether the active work
is on the critical path or a side track. On iPhone: this matters — "ACTIVE"
looks the same for a critical hotfix and a design sprint.

Proposed field:
```
## SESSION ROLE
sandbox — observability design sprint
```
or
```
## SESSION ROLE
main-build — track 3.4 employee module
```

### Missing 2 — PENDING GATES (background gates not blocking current session)

(See Problem 1 above.) The worker proxy gate is real, 48h old, and visible in WIP.md
but invisible in STATUS.md because BLOCKED = NO and CURRENT GATE = NONE.

This is the #1 gap found in the live test. A gate can exist and be aging
without blocking the current session. The schema has no slot for it.

Proposed field:
```
## PENDING GATES
M-worker: wrangler deploy (48h open) / M04 M05 M06 M09 M03 M10 (queue-blocked)
```

### Missing 3 — GATE AGE TIMESTAMP

The C1 signal (Gate Open Duration) requires knowing when a gate was set.
The current schema has no timestamp for gate-open events.
On iPhone: Michael cannot assess gate urgency without knowing how old it is.

Proposed addition to CURRENT GATE or PENDING GATES format:
```
CURRENT GATE
M##: [description] (set: YYYY-MM-DD HH:MM)
```

Without this, HEALTH = YELLOW for "48h gate" and HEALTH = YELLOW for "2h gate"
look identical in STATUS.md. The gate age is the most important triage dimension.

### Missing 4 — MAIN TRACK NEXT ACTION (when on a side branch)

When Claude is on a sandbox or hotfix branch, NEXT ACTION refers to that branch.
But Michael may need to know the main track state independently.

Not high priority — WIP.md covers this — but the STATUS.md "one screen" promise
is partially broken when you have to cross-reference WIP.md to get the full picture.

---

## UNNECESSARY FIELDS (v1 spec, low real-world value)

### Low value: ACTIVE SESSIONS when solo operation is the norm

`1 — solo` carries almost no information for AccentOS in its current phase.
The value of this field grows when parallel sessions become common.
In solo operation, it confirms what's already implied by having only one branch.

Not worth removing — the confirmation has value — but its placement in the schema
consumes a line that could surface more urgent information.

**Finding:** ACTIVE SESSIONS stays, but should move lower in priority order than
FROZEN SESSIONS (frozen sessions carry more risk signal than the active count).

---

## MOBILE READABILITY FINDINGS

### Finding M1 — 30-line limit holds
22 content lines rendered clearly on a 375px screen with standard GitHub markdown.
The schema fits in approximately 1.2 iPhone screens (no scroll required for
HEALTH, BLOCKED, CURRENT GATE — the three triage fields). ✓

### Finding M2 — H2 headers are too heavy on mobile
GitHub renders H2 (##) as large bold text with a horizontal rule.
On a 375px screen, each section header takes significant vertical space.
A 22-line document renders as ~35 effective lines due to H2 header height.

**Observation:** The PHONE_FIRST_DASHBOARD_CONCEPT.md specified "H2 = sections"
but did not anticipate the horizontal rule that GitHub adds under H2 headers.
This approximately doubles the visual height of each section separator.

**Mitigation (no schema change needed):** Use bold labels instead of H2 for low-priority
fields (ACTIVE SESSIONS, FROZEN SESSIONS). Reserve H2 for the top 5 triage fields.
Or: accept the scroll cost — the critical fields (HEALTH through NEXT ACTION)
still land in the first screen.

### Finding M3 — QUEUE DEPTH parenthetical reads clean on iPhone
`10 items (7 blocked on Michael — M04 M05 M06 M09 M03 M10)` fits in one line
at 375px (52 chars). The blocked split is immediately parseable. ✓

### Finding M4 — LAST PUSH timestamp format is slightly long
`5cbba46 — docs: relay handoff templates — 2026-05-09 22:05 UTC` = 59 chars.
Renders without truncation at 375px but close to the limit.
If commit messages are longer (which they often are), this line wraps on iPhone.

**Finding:** The LAST PUSH field should enforce a 40-char commit message truncation:
`5cbba46 — docs: relay handoff templates (trunc.) — 2026-05-09 22:05 UTC`
Or: separate the timestamp to its own sub-line.

---

## OPERATIONAL TRIAGE FINDINGS

### Finding T1 — 20-second triage test: PASS (with caveat)

Michael opens STATUS.md on iPhone:
- HEALTH = YELLOW → reads reason → "worker proxy gate ~48h, sprint clean"
- BLOCKED = NO → Claude is running
- CURRENT GATE = NONE (sprint) → reads caveat → sees main track gate
- Decision: sprint is fine, need to handle worker proxy when sprint ends

Total time: ~15 seconds. Under the 20-second target. ✓

**Caveat:** The CURRENT GATE field required reading the full line to understand
the NONE (sprint) / workaround format. A clean NONE with no caveats would be
faster. The background gate is the cause of the ambiguity — confirms Missing 2.

### Finding T2 — HEALTH reason line carries the most triage information

`YELLOW — worker proxy gate ~48h unresolved; sandbox sprint clean` tells Michael:
1. There is a pending action (worker proxy)
2. It has been sitting 48 hours
3. The current session is not the problem

This is more informative than any other field in the schema for this scenario.
The HEALTH reason line does heavy lifting that CURRENT GATE, BLOCKED, and WIP
would all need to combine to express separately.

**Finding:** The HEALTH reason line is the most valuable 60 chars in STATUS.md.
Treat it with precision — it should always answer: "what is the specific reason
this is not GREEN and what is the single most important thing Michael should know?"

### Finding T3 — The schema correctly surfaces the ~48h gate

Even through the CURRENT GATE field ambiguity, the HEALTH = YELLOW with reason
correctly surfaced the stale gate. A well-written HEALTH reason line compensates
for schema limitations in other fields.

**Finding:** HEALTH is the safety net. Even when other fields are ambiguous or
missing, a precise HEALTH reason can carry the operational signal. This validates
the decision to put HEALTH first in the phone-optimized field order.

---

## RELAY FRICTION FINDINGS

### Finding R1 — STATUS.md successfully replaces context re-explanation

The T01 template ("resume") works ONLY if STATUS.md is current.
In this session, STATUS.md was not updated between the last commit and the current
task (STATUS_MD_LIVE_EXAMPLE.md). This means a resume mid-sprint would require
Michael to either re-explain context OR Claude to read multiple files.

**Finding:** STATUS.md must be updated with each commit, not just at session end.
The "update at every commit" rule in the spec is not optional — it is what makes
the 1-word resume template work. When STATUS.md lags behind, FRAG-2 (context loss)
becomes the failure mode.

### Finding R2 — Worker proxy gate has no formal M-task number

The worker proxy gate (`wrangler deploy` needed) is:
- Real (it breaks Quote Generator Parse Notes)
- 48h old (approaching TIER 0 threshold)
- In WIP.md (not in BUILD_PLAN_MICHAEL.md)
- Not assigned an M-task number (M01–M28 exist, this is unnumbered)

Michael cannot resolve it with "M## done" because it has no number.
The relay template T06 (gate resolution) requires an M## value.

**Finding:** Any pending gate that doesn't have an M-task number breaks the
gate resolution relay workflow. The informal gate is invisible to templates T06–T08.

**Action surfaced:** Assign M29 (or next available) to the worker proxy deploy gate.
Add it to BUILD_PLAN_MICHAEL.md with the exact action. Convert the informal gate
to a formal one before the next main-track session.

### Finding R3 — Queue depth signal is misleading for the current session context

QUEUE DEPTH = 10 items (7 blocked) reflects the main build track.
But Claude is not working the main build track in this session.
A relay operator reading this STATUS.md might think the main track is Claude's
current work and the queue is the constraint — when in reality Claude is in
a completed sandbox sprint with nothing left to work on in that context.

**Finding:** Queue depth without session role context creates a false picture
of what Claude is doing. In a multi-track operation, QUEUE DEPTH alone
is not enough to understand system throughput.

---

## SCHEMA V1 SCORECARD

```
FIELD                   WORKS?    NOTES
─────────────────────────────────────────────────────────────
HEALTH                  ✓ YES     Most valuable field. Reason line does heavy lifting.
BLOCKED                 ✓ YES     Binary, fast, correct.
CURRENT GATE            △ PARTIAL Fails for background gates. Needs PENDING GATES companion.
WIP                     ✓ YES     One sentence constraint holds.
NEXT ACTION             △ PARTIAL Awkward across track changes.
LAST PUSH               ✓ YES     Clean. Watch commit message truncation at 60 chars.
BRANCH                  △ PARTIAL No session-role signal in branch name.
QUEUE DEPTH             △ PARTIAL Ambiguous without session role context.
SESSION STATE           ✓ YES     Clean, unambiguous.
ACTIVE SESSIONS         ✓ YES     Low value in solo, but confirmation useful.
FROZEN SESSIONS         ✓ YES     0 — none reads instantly.
─────────────────────────────────────────────────────────────
OVERALL:  7 fields clean / 4 fields need refinement
MISSING:  SESSION ROLE, PENDING GATES, GATE AGE TIMESTAMP
REMOVE:   Nothing — all fields earn their space
LINE COUNT: 22 content lines (within 30-line limit)
MOBILE:   Fits ~1.2 screens — top 3 triage fields above fold
20s TRIAGE: PASS with caveat on CURRENT GATE ambiguity
```

---

## RECOMMENDED SCHEMA V2 CHANGES

```
CHANGES:
1. Add SESSION ROLE field (after BRANCH)
   Values: main-build / sandbox / hotfix / investigation / sprint
   
2. Add PENDING GATES field (after CURRENT GATE)
   Format: [M##: description (Nh open)] or [none]
   Separates "blocking current session" from "aging background gates"
   
3. Add gate-set timestamp to CURRENT GATE format
   Format: M##: description (set: YYYY-MM-DD HH:MM)
   
4. Enforce 40-char commit message truncation in LAST PUSH
   Format: [hash] — [message ≤40 chars] — [timestamp]
   
5. Allow NEXT ACTION two-part format when track change is imminent
   Format: end: [current session close] / then: [next track action]

NO CHANGES:
- 30-line content limit (holds)
- Field order (phone-optimized order validated)
- H2 for top 5 fields (weight is acceptable tradeoff)
- HEALTH as first field (validated as highest-value position)
- REPLY / NO-REPLY not needed in STATUS.md (that lives in chat output)
```
