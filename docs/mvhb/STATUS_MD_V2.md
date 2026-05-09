# STATUS_MD_V2.md — STATUS.md Schema v2

> Observability/ergonomics sandbox only.
> No governance ownership. No runtime authority.
> Hardening iteration only — incorporates findings from live validation pass.
> No redesign. No new concepts introduced outside of validated gaps.

---

## V1 → V2 DELTA SUMMARY

```
ADDED:     SESSION ROLE      (new field — position 9, after BRANCH)
ADDED:     PENDING GATES     (new field — position 4, after CURRENT GATE)
MODIFIED:  CURRENT GATE      (+ gate-set timestamp in format)
MODIFIED:  LAST PUSH         (40-char commit message truncation enforced)
MODIFIED:  NEXT ACTION       (dual-track format when track change is imminent)
UNCHANGED: HEALTH, BLOCKED, WIP, BRANCH, QUEUE DEPTH,
           SESSION STATE, ACTIVE SESSIONS, FROZEN SESSIONS
REMOVED:   nothing
```

Fields: 11 → 13 (+2)
Content lines: 22 → 26 (+4, within 30-line hard limit)
Hard limit: 30 content lines (unchanged)
Field order: preserved, two insertions only

---

## STATUS.md v2 SCHEMA

### Field order (phone-optimized, validated in v1 live test)

```
1.  HEALTH           ← triage tier 1: one-glance system state
2.  BLOCKED          ← triage tier 1: is Claude stopped?
3.  CURRENT GATE     ← triage tier 1: what must Michael do? (+ age)
4.  PENDING GATES    ← triage tier 2: aging background gates [NEW]
5.  WIP              ← triage tier 2: what is Claude doing?
6.  NEXT ACTION      ← triage tier 2: what happens next?
7.  LAST PUSH        ← proof of work (truncated message)
8.  BRANCH           ← where is the work?
9.  SESSION ROLE     ← what kind of session is this? [NEW]
10. QUEUE DEPTH      ← how much remains?
11. SESSION STATE    ← lifecycle: active/frozen/paused
12. ACTIVE SESSIONS  ← parallel work count
13. FROZEN SESSIONS  ← parked branch debt
```

---

### Full field specifications (v2)

---

#### FIELD 1: HEALTH (unchanged)

Format: `[GREEN | YELLOW | RED] — [reason, ≤60 chars]`

Rules unchanged from v1. The reason line is the highest-value signal in the schema.
Always answers: "what is the specific reason this is not GREEN and what must Michael know?"

```
## HEALTH
GREEN — clean push, no gates, queue moving
```
```
## HEALTH
YELLOW — worker proxy gate 2d open; current sprint unblocked
```
```
## HEALTH
RED — BLOCKED: M03 gate 72h unresolved, queue fully exhausted
```

---

#### FIELD 2: BLOCKED (unchanged)

Format: `[NO | YES — reason, ≤50 chars]`

Rules unchanged from v1.

```
## BLOCKED
NO
```
```
## BLOCKED
YES — M03 gate: no unblocked queue items remain
```

---

#### FIELD 3: CURRENT GATE (modified — gate-set timestamp added)

Format: `[NONE | M##: description (set: YYYY-MM-DD HH:MM)]`

v1 format: `M##: description`
v2 format: `M##: description (set: YYYY-MM-DD HH:MM)`

The `(set: ...)` suffix enables gate age computation on iPhone without opening git log.
Michael can calculate how long the gate has been open by comparing to current time.
This directly surfaces the C1 signal (Gate Open Duration) from the Telemetry Signal Catalog.

Line length with timestamp: ~80 chars max. Wraps gracefully on 375px. Acceptable.

```
## CURRENT GATE
NONE
```
```
## CURRENT GATE
M03: run sql/M03_rls_v2.sql in Supabase dashboard (set: 2026-05-07 14:00)
```

Rules:
- CURRENT GATE is ONLY for gates that cause or would cause BLOCKED = YES
- Background gates that do not block the current session go to PENDING GATES
- If no gate is actively blocking: CURRENT GATE = NONE, regardless of PENDING GATES count
- Timestamp is written by Claude at the moment the gate is declared
- Timestamp is preserved (not overwritten) until the gate is resolved

---

#### FIELD 4: PENDING GATES (new)

Format: `[none | M## desc (Nd/Nh) · M## desc (Nd/Nh) · ...]`

Purpose: Surfaces aging background gates that are not blocking the current session
but represent pending Michael actions. Prevents informal gates from becoming invisible.

Separator: `·` (middle dot) between multiple gates.
Age format: `Nd` for days, `Nh` for hours. Round to nearest whole unit.

```
## PENDING GATES
none
```
```
## PENDING GATES
M-worker proxy deploy (2d) · M04 BigCommerce key (5d) · M06 GA4 credential (5d)
```

Rules:
- Gates with no M-task number use plain description until registered (e.g., `M-worker`)
- Every pending gate must be assigned an M-task number within one session of discovery
  (informal gates break the T06–T08 relay templates)
- Gates that are formally blocked queue items (BLOCKS ON MICHAEL: M##) belong here
  unless they are also the active CURRENT GATE
- List ordered by age (oldest first — highest priority for Michael's batch resolution)
- Maximum 3 gates on one line. If >3: `M##(Nd) · M##(Nd) · M##(Nd) + N more — see WIP.md`
- If no pending gates: `none` (not NONE — lowercase distinguishes from CURRENT GATE)

PENDING GATES vs CURRENT GATE:
```
CURRENT GATE = the one gate causing BLOCKED = YES (or the primary blocking gate)
PENDING GATES = all other open gates: aging background gates, queue-blocked M-tasks
```

---

#### FIELD 5: WIP (unchanged)

Format: `[one sentence, ≤60 chars, present/past tense]`

Rules unchanged from v1.

```
## WIP
Wiring Supabase persist into Goals module save handler — uncommitted
```

---

#### FIELD 6: NEXT ACTION (modified — dual-track support)

Format:
Single track: `[one sentence action]`
Dual track: `end: [current close] / then: [next track action]`

Use dual-track format ONLY when the current session is completing a side branch
(sandbox, hotfix, investigation) and returning to a different track.
Use single-track format when continuing on the same track.

```
## NEXT ACTION
Commit Goals persist then move to item 3.3 (KPI snapshot wiring)
```
```
## NEXT ACTION
end: freeze sandbox branch / then: resume main track — worker proxy 400 fix
```

Rules:
- The `/ then:` clause is always the first action on the new track
- Dual-track format caps at two parts — never three (that is a relay reset condition)
- Both parts must be ≤40 chars each
- Do not use dual-track format for mid-session task transitions on the same track

---

#### FIELD 7: LAST PUSH (modified — 40-char commit message truncation)

Format: `[7-char hash] — [message ≤40 chars] — [YYYY-MM-DD HH:MM]`

v1 format: full commit message
v2 format: commit message hard-truncated at 40 chars, ellipsis appended if truncated

Reason: long commit messages caused LAST PUSH to approach 100 chars,
which wraps on 375px viewports and risks truncation in some readers.

```
## LAST PUSH
5cbba46 — docs: relay handoff templates — 2026-05-09 22:05
```
```
## LAST PUSH
3f8a12c — feat: employee module Supabase persist v… — 2026-05-09 14:30
```

Rules:
- Hash: always 7 chars (not 6, not full)
- Message: ≤40 chars. If longer, truncate and append `…`
- Timestamp: `YYYY-MM-DD HH:MM` (UTC, no timezone label needed — system is UTC-only)
- No "UTC" suffix (saves 4 chars, UTC is the only timezone used)
- Total line target: ≤70 chars. Hard limit: 80 chars.

---

#### FIELD 8: BRANCH (unchanged)

Format: `[full branch name]`

No format change. The SESSION ROLE field (below) provides the semantic context
that BRANCH alone could not carry in v1.

```
## BRANCH
claude/operational-hud-design-S1Eon
```

---

#### FIELD 9: SESSION ROLE (new)

Format: `[role] — [one-phrase description]`

Purpose: Tells Michael immediately what *kind* of work this session is doing.
Without this, ACTIVE looks identical for a critical hotfix and a design sprint.
Also contextualizes QUEUE DEPTH — a sandbox session's queue is not the main build queue.

```
## SESSION ROLE
sandbox — observability design sprint (docs only, no production code)
```
```
## SESSION ROLE
main-build — track 3.4 employee module Supabase wiring
```
```
## SESSION ROLE
hotfix — worker proxy 400 error on Quote Generator
```
```
## SESSION ROLE
investigation — diagnosing wrangler deploy failure before fix attempt
```

Allowed values:
```
main-build      Active BUILD_PLAN_CLAUDE.md work (primary track)
sandbox         Design, spec, or observability docs (no production code)
hotfix          Targeted fix for a known production bug (narrow scope)
investigation   Diagnostic or research work before committing to a fix
sprint          Bounded multi-item push on a specific sub-track
```

Rules:
- One value from the allowed list above
- Followed by ` — ` and a one-phrase description (≤40 chars)
- If SESSION ROLE = sandbox: QUEUE DEPTH refers to the main build queue, not this session
  (note this explicitly in QUEUE DEPTH if likely to confuse)
- SESSION ROLE is set at session start and does not change mid-session
  (a session that changes role should be frozen and a new session started)

---

#### FIELD 10: QUEUE DEPTH (unchanged in format, one new rule)

Format: `[N items] or [N items (M blocked on Michael)]`

New rule for v2: if SESSION ROLE ≠ main-build, append context note:
```
## QUEUE DEPTH
10 items (7 blocked on Michael) — main track, not this session
```

This prevents the ambiguity found in the v1 live test where a sandbox session
showed main-track queue numbers that implied Claude had autonomous build work
available when it did not.

---

#### FIELDS 11–13: SESSION STATE, ACTIVE SESSIONS, FROZEN SESSIONS (unchanged)

No changes. All three validated clean in the live test.

---

## COMPLETE V2 EXAMPLE

Using the real 2026-05-09 session state, v2 schema applied:

```
# STATUS — 2026-05-09 22:30 UTC

## HEALTH
YELLOW — worker proxy gate 2d open; sandbox sprint otherwise clean

## BLOCKED
NO

## CURRENT GATE
NONE

## PENDING GATES
M-worker proxy deploy (2d) · M04 BigCommerce key (5d) · M06 GA4 cred (5d)

## WIP
STATUS_MD_V2.md in progress — final schema hardening doc

## NEXT ACTION
end: freeze sandbox branch / then: resume main — worker proxy 400 fix

## LAST PUSH
3002bbb — docs: STATUS.md live reality test — 2026-05-09 22:25

## BRANCH
claude/operational-hud-design-S1Eon

## SESSION ROLE
sandbox — observability design sprint (docs only, no production code)

## QUEUE DEPTH
10 items (7 blocked on Michael) — main track, not this session

## SESSION STATE
ACTIVE

## ACTIVE SESSIONS
1 — solo

## FROZEN SESSIONS
0 — none
```

Content line count: 26. Within 30-line hard limit. ✓
Top 3 triage fields (HEALTH, BLOCKED, CURRENT GATE): above fold on 375px. ✓
PENDING GATES visible with one short scroll. ✓
Comparison to v1 live example: CURRENT GATE ambiguity resolved, background gates visible,
session context clear, NEXT ACTION is unambiguous about track change. ✓

---

## WHY EACH CHANGE SURVIVED VALIDATION

### SESSION ROLE — survived

Evidence: QUEUE DEPTH = "10 items (7 blocked)" was misleading in v1 when read
during a sandbox session. Reader could not determine whether Claude had autonomous
build work available.

Value: Immediately contextualizes every other field. A sandbox session's NEXT ACTION
means something different than a main-build session's NEXT ACTION.
One field clarifies the semantics of six others.

Complexity cost: +2 content lines. +1 vocabulary entry (5 role values).
Value-to-complexity ratio: high.

### PENDING GATES — survived

Evidence: Worker proxy gate was 48h old and completely invisible in STATUS.md v1.
BLOCKED = NO meant CURRENT GATE = NONE, which made an aging actionable gate disappear.
Gate had been open long enough to qualify as TIER 0 in the Bottleneck Visibility Spec
but could not be seen without reading WIP.md.

Value: Surfaces the most dangerous blind spot found in live validation.
Background gates are real Michael actions that age silently. Making them visible
prevents the gate-forgetting failure mode that the TELEMETRY_SIGNAL_CATALOG.md
identified as "the #1 efficiency killer."

Complexity cost: +2 content lines. New format syntax (middle dot separator, age suffix).
Value-to-complexity ratio: very high. Directly addresses the highest-severity gap.

### Gate-set timestamp in CURRENT GATE — survived

Evidence: HEALTH = YELLOW for a 2h gate and a 72h gate look identical without the timestamp.
C1 (Gate Open Duration) is the highest-value telemetry signal in Family C — and in v1
it required computing age from git history, which is not possible from iPhone.

Value: Enables iPhone-side gate age calculation. Michael reads "(set: 2026-05-07 14:00)"
and immediately knows the gate is ~2 days old without opening git.

Complexity cost: +timestamp suffix on one field value. Adds ~20 chars to CURRENT GATE line.
Value-to-complexity ratio: high. One suffix unlocks C1 signal without tooling.

### LAST PUSH 40-char truncation — survived

Evidence: Long commit messages pushed LAST PUSH toward 100 chars, approaching
viewport-width in some readers. The spec allowed full messages; reality revealed
the risk.

Value: Keeps LAST PUSH within 70-char target across all commit message styles.
Removes variability from field length — consistent render on iPhone.

Complexity cost: Requires Claude to truncate messages when writing STATUS.md.
Minor discipline cost. No reader complexity added.
Value-to-complexity ratio: medium. Prevents rendering issues, no new information lost.

### Dual-track NEXT ACTION — survived

Evidence: v1 live test showed "Freeze sandbox branch; resume main track, fix worker
proxy 400 on Quote Generator" — semantically doing two things in one sentence
and approaching 60 chars on a field designed for single-action clarity.

Value: The `end: ... / then: ...` format makes the track transition explicit
without adding a new field. Michael immediately knows there are two sequenced steps.

Complexity cost: Optional format variant (not always active). Only used at track transitions.
Single-track sessions are unchanged.
Value-to-complexity ratio: medium-high. Eliminates a real ambiguity with minimal overhead.

---

## WHAT WAS REJECTED AND WHY

### Rejected: Replacing H2 headers with bold for low-priority fields

Proposal: Use `**ACTIVE SESSIONS**` instead of `## ACTIVE SESSIONS` for the bottom
three fields to reduce vertical space on iPhone.

Rejection reason: Inconsistent formatting within the same document creates cognitive
parsing friction. The uniform H2 pattern is faster to scan than a mixed format.
The scroll cost for bottom fields is acceptable — they are low-urgency reads.

### Rejected: Separate LAST UPDATED timestamp field

Proposal: Add a `## LAST UPDATED` field distinct from the file header timestamp
and from LAST PUSH.

Rejection reason: Redundant. The `# STATUS — YYYY-MM-DD HH:MM UTC` header IS the
last-updated timestamp. Adding a third timestamp would create confusion about
which one to trust. The header timestamp = time Claude wrote STATUS.md.
LAST PUSH timestamp = time code landed on remote. Both serve distinct purposes.
No third timestamp needed.

### Rejected: QUEUE VELOCITY field

Proposal: Add `## QUEUE VELOCITY` showing items completed per session (e.g., `3/session`).

Rejection reason: Cannot be written manually with confidence — requires computing
BUILD_PLAN_CLAUDE.md diff since session start. Without tooling, the value would
be estimated and therefore unreliable. Unreliable fields degrade schema trust.
Deferred to the telemetry tooling layer (B3 signal in the Telemetry Signal Catalog).

### Rejected: TRACK field (naming the active build track)

Proposal: Add `## TRACK` showing which BUILD_PLAN_CLAUDE.md track is active
(e.g., `Track 3 — Vendor Intelligence`).

Rejection reason: Redundant with SESSION ROLE + WIP. SESSION ROLE contextualizes
the session type; WIP describes the specific current task. Adding TRACK would be
a third way to say the same thing with less precision. The track number alone
gives less context than "employee module Supabase wiring."

### Rejected: Raising ACTIVE SESSIONS priority in the field order

Proposal: Move ACTIVE SESSIONS above BRANCH based on the finding that parallel
session conflicts are a high-risk scenario.

Rejection reason: In solo operation (AccentOS current state), ACTIVE SESSIONS = "1 — solo"
is a zero-information-value confirmation. Elevating it penalizes the common case to
prepare for the rare case. When parallel sessions become standard, revisit field order.
Field order optimization should reflect actual usage distribution, not worst-case scenarios.

### Rejected: Adding RELAY HEALTH as a derived composite field

Proposal: Add `## RELAY HEALTH` showing the F3 Relay Friction Index composite
(SMOOTH / FRICTION / DEGRADED).

Rejection reason: F3 requires computing 4 sub-signals (C1 + C2 + D2 + F2).
Without tooling, writing this field manually is either inaccurate or expensive.
The HEALTH field already captures most of this signal. A second health-composite field
would create ambiguity about which one to trust. Defer to future tooling layer.

---

## COMPLEXITY INCREASE VS VALUE INCREASE

```
ADDITION         COMPLEXITY COST    VALUE ADDED          VERDICT
─────────────────────────────────────────────────────────────────
SESSION ROLE     +2 content lines   Disambiguates 6       HIGH ROI
                 +5 vocabulary      other fields
                 entries

PENDING GATES    +2 content lines   Surfaces #1 blind     HIGHEST ROI
                 +age syntax        spot from live test
                 +middle dot sep

Gate timestamp   +~20 chars to      Unlocks C1 signal     HIGH ROI
in CURRENT GATE  one field value    without tooling

LAST PUSH        Claude truncation  Consistent iPhone     MEDIUM ROI
truncation       discipline         render

Dual NEXT        Optional format    Cleaner track         MEDIUM ROI
ACTION           variant            transitions
─────────────────────────────────────────────────────────────────
NET:             +4 content lines   Major gaps from       POSITIVE
                 (26 total, <30)    live test resolved
```

---

## FIELDS STILL INTENTIONALLY EXCLUDED

These fields were discussed and will not appear in STATUS.md v2 or any near-term version.
They belong in future tooling overlays, not in the manually-written STATUS.md.

```
EXCLUDED FIELD         REASON FOR EXCLUSION
───────────────────────────────────────────────────────────────
QUEUE VELOCITY         Requires tooling — manual value unreliable
RELAY HEALTH (F3)      Requires tooling — 4-component composite
GATE RECURRENCE (C2)   Requires log analysis — manual value unreliable
FROZEN SESSION AGE     Requires git inspection — not manually derivable
COMMIT DEPTH           Requires git inspection — not manually derivable
SESSION HISTORY        Belongs in SESSION_LOG.md, not STATUS.md
BUILD TRACK            Redundant with SESSION ROLE + WIP
RISK LEVEL             Too subjective — degrades to noise
ETA                    Cannot be reliably predicted — misleads operator
```

The boundary: STATUS.md contains only what Claude can write accurately without
running shell commands or analyzing git history. Every excluded field depends on
computation. When the telemetry tooling layer ships, these become overlay signals —
not STATUS.md fields.

---

## V2 FORMATTING RULES (complete, including all v1 rules)

1. No markdown tables inside STATUS.md — flat key-value only
2. No nested bullet lists
3. No emoji in field values (section headers only, sparingly)
4. Every field present even if value is NONE, none, NO, or 0
5. File must open with `# STATUS —` header
6. Hard limit: 30 content lines (blank separator lines excluded)
7. No prose paragraphs — every line is a label or a value
8. Dates: `YYYY-MM-DD HH:MM` format, UTC, no timezone label
9. LAST PUSH commit message: ≤40 chars, truncate with `…` if longer
10. CURRENT GATE timestamp: append `(set: YYYY-MM-DD HH:MM)` when gate is set
11. PENDING GATES age: `Nd` for days, `Nh` for hours, oldest gate listed first
12. SESSION ROLE: one of five defined values + ` — ` + description ≤40 chars
13. NEXT ACTION dual-track: `end: [≤40 chars] / then: [≤40 chars]`
14. Bold used only for HEALTH status value and BLOCKED YES/NO
15. CURRENT GATE = NONE (caps) when no active blocking gate
16. PENDING GATES = none (lowercase) when no background gates
