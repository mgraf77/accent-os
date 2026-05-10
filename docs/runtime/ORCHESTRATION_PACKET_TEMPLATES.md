# Orchestration Packet Templates — AccentOS

> Doctrine + reusable templates. No implementation, no runtime claims.
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companion to `RELAY_COMPRESSION_PROTOCOL.md`, `SELF_CONTAINED_EXECUTION_WINDOWS.md`, `SESSION_RESET_RESILIENCE.md`, `SAFE_CONTINUATION_BOUNDARIES.md`. Read those first.

---

## 0. Frame

A packet is a copy-pasteable prompt that opens a bounded execution window inside one Claude session. This document provides reusable templates and three worked examples. Templates are starting points, not standards — Michael edits them per use.

The templates encode the doctrine of the four prior docs. A packet that *follows* a template inherits the doctrine's bias toward bounded scope, named exits, default-deny continuation, clean freeze, and zero runtime claims.

Template structure is consistent across all five:

- **HEADER** — packet type, author, date, branch
- **SCOPE** — what this packet does and does not do
- **CONTEXT** — minimum context needed without external lookup
- **AUTHORITY** — MAY / MUST-NOT / MUST-ESCALATE
- **EXITS** — completion / cap / escalation
- **DELIVERABLES** — what the packet produces on each exit
- **FREEZE CONTRACT** — what the closing artifact must contain
- **FORBIDDEN** — packet-specific tightenings of the standing list

Templates use ANGLE-BRACKET placeholders that Michael replaces.

---

## 1. Template — Bounded Execution Packet

A standard packet for a single self-contained execution window. The shape covers the majority of L1 work.

```
PACKET TYPE: bounded execution
AUTHOR: <michael@phone | michael@desktop>
DATE: <YYYY-MM-DD HH:MM TZ>
BRANCH: <branch-name>
TARGET WALL TIME: <e.g., 30–90 min>
TARGET COMMITS: <e.g., 3–8>

══════════════════════════════════════════════
SCOPE
══════════════════════════════════════════════
IN SCOPE:
- <crisp 1-line statement of the work>
- <list specific items if known>

OUT OF SCOPE:
- <list of related work this packet does NOT do>

══════════════════════════════════════════════
CONTEXT (read at packet start; do not look beyond)
══════════════════════════════════════════════
- Files: <paths>
- Standing skills active: vibe-speak (mode: <mode>), efficiency-monitor
- Last session ended at: <reference, e.g., commit SHA + WIP timestamp>
- Salient inline facts: <paste schema, config, or decision text needed inline>

══════════════════════════════════════════════
AUTHORITY
══════════════════════════════════════════════
MAY (without escalating):
- Edit <paths>
- Commit + push to <branch>
- Choose between <option A | option B> when implementation requires
- <packet-specific MAYs>

MUST NOT (even if useful):
- Touch <files / dirs>
- Introduce new dependencies
- <packet-specific MUST-NOTs>

MUST ESCALATE (surface to Michael, pause):
- <packet-specific premise-wrong signatures>
- Anything in standing halt list (autonomous-mode/SKILL.md:80–90)

══════════════════════════════════════════════
EXITS
══════════════════════════════════════════════
COMPLETION (win): <named completion criterion>
CAP (neutral): commit count = <N> OR wall time = <T>
ESCALATION (pause chain): per AUTHORITY MUST-ESCALATE OR thresholds in
  RELAY_COMPRESSION_PROTOCOL.md §7

══════════════════════════════════════════════
DELIVERABLES
══════════════════════════════════════════════
On COMPLETION:
- <list of expected artifacts>
- Clean-freeze artifact reflecting "completed"
- Optional next-packet draft

On CAP:
- Clean-freeze artifact reflecting "capped"
- Next-packet draft to continue same scope

On ESCALATION:
- Escalation note (see §4 template)
- WIP updated to "paused — awaiting Michael on <topic>"
- NO next-packet draft

══════════════════════════════════════════════
FREEZE CONTRACT
══════════════════════════════════════════════
Closing artifact MUST contain:
- Disposition (completion / cap / escalation)
- List of commits landed (SHA + 1-line)
- WIP final state quote
- Reason for exit (verbatim threshold)
- Next-packet draft (if disposition is completion-with-continuation or cap)

══════════════════════════════════════════════
FORBIDDEN (packet-specific tightenings)
══════════════════════════════════════════════
- <items beyond standing forbidden list>

START.
```

---

## 2. Template — Continuation Packet

Used when chaining packet N+1 from packet N's freeze artifact. Shorter than the bounded execution packet; carries forward most context by reference.

```
PACKET TYPE: continuation
AUTHOR: <michael@phone | michael@desktop>
DATE: <YYYY-MM-DD HH:MM TZ>
BRANCH: <branch-name>
PRIOR PACKET: <reference, e.g., "freeze artifact in turn ending at HH:MM
              on YYYY-MM-DD; SHA <sha>; WIP timestamp <ts>">

══════════════════════════════════════════════
WHAT CARRIES FORWARD
══════════════════════════════════════════════
- Scope: same as prior packet
- Authority: same as prior packet UNLESS adjusted below
- Exits: same as prior packet UNLESS adjusted below

══════════════════════════════════════════════
ADJUSTMENTS
══════════════════════════════════════════════
- Scope changes: <none | list>
- Authority changes: <none | list>
- Exit changes: <none | list>
- Items already done (do not redo): <list of commit SHAs>

══════════════════════════════════════════════
ASSUMPTIONS TO VERIFY IN STEP 0
══════════════════════════════════════════════
- <e.g., "branch <X> is at SHA <Y>">
- <e.g., "WIP last entry mentions <Z>">
- If any assumption is false → freeze immediately with note

══════════════════════════════════════════════
NEXT ITEM
══════════════════════════════════════════════
<the specific next sub-step from prior packet's clean-freeze>

START FROM STEP 0 (verify), THEN PROCEED.
```

---

## 3. Template — Freeze / Resume Artifact

The artifact Claude writes at clean freeze. Not a packet itself — it is *output*. Optimized for human scan in <30 seconds.

```
══════════════════════════════════════════════
CLEAN FREEZE — <YYYY-MM-DD HH:MM TZ>
══════════════════════════════════════════════
Disposition: <COMPLETION | CAP | ESCALATION>
Reason:      <verbatim trigger that ended the packet>
Branch:      <branch>
Commits this packet:
  - <sha> <one-line>
  - <sha> <one-line>
  ...
WIP final:   "<one-line excerpt of WORK_IN_PROGRESS.md last update>"

WHAT LANDED
- <bullet list of effects>

WHAT DID NOT LAND
- <bullet list of items intentionally skipped>
- <bullet list of items that would have been next>

OPEN QUESTIONS (escalation only)
- <if disposition is ESCALATION: 1–3 specific questions>

NEXT PACKET DRAFT (completion-with-continuation OR cap only;
                   ABSENT for escalation by doctrine)
─── PASTE BLOCK START ───
<continuation packet per §2 template, filled in>
─── PASTE BLOCK END ───

NOTES (optional, max 3 lines)
- <anything Michael needs to know that isn't in the next packet>
```

The freeze artifact is the *only* place a next-packet draft appears. Doctrine prohibits drafts elsewhere (in commit messages, in non-freeze turns, etc.) to keep the chain auditable.

---

## 4. Template — Escalation Packet

Used by Claude when a §3 (`SAFE_CONTINUATION_BOUNDARIES.md`) escalation fires. Designed to give Michael enough to decide without re-deriving the situation.

```
══════════════════════════════════════════════
ESCALATION — <YYYY-MM-DD HH:MM TZ>
══════════════════════════════════════════════
Trigger:     <exact escalation criterion that fired>
Packet:      <reference to opening packet>
Last sub-step completed: <description + SHA if a commit landed>
Sub-step that would have been next: <description>

WHY THIS IS ESCALATING
<2–4 sentence plain-English description of why this hit MUST-ESCALATE,
not MAY-continue>

WHAT WAS RULED OUT
- <reasons against alternative dispositions>
- <e.g., "could not be bundled into a continue because [...]">

OPTIONS (numbered, mutually exclusive)
1. <option 1 — what Michael could decide>
2. <option 2>
3. <option 3 if applicable>
0. (default) FREEZE without resolution; continue from a fresh packet later

CONCRETE QUESTION FOR MICHAEL
<one or two questions, answerable with a short reply>

STATE PRESERVED
- WIP updated to "paused — awaiting Michael on <topic>"
- No half-edits in working tree (verify before escalating)
- No pending tool calls

REPLY FORMAT
"resolve N" where N is the option number above, OR free-form override.
```

The escalation packet sits in Claude's assistant turn; Michael's reply opens a new packet (continuation or fresh) with the resolution. Doctrine forbids Claude from drafting a continuation packet inside an escalation — that crosses the line into "deciding what Michael's answer means."

---

## 5. Template — Clean-Pause Packet

Distinct from freeze. A clean pause is an intentional, planned end of a chain (end of day, end of work session, deliberate handoff). The packet's role is to set up the *next chain*, days or weeks later, with maximum context preservation.

```
══════════════════════════════════════════════
CLEAN PAUSE — <YYYY-MM-DD HH:MM TZ>
══════════════════════════════════════════════
Reason:      <intentional pause; not a freeze, not a cap>
Branch:      <branch>
Chain summary (this chain):
  - Packets: <N>
  - Commits: <M>
  - Net effect: <2–3 sentences>

WHERE THE WORK IS
- Most recent commit: <sha> <one-line>
- WIP final: "<excerpt>"
- Open work this chain *did not* address (deliberately): <list>

WHEN TO RESUME
- Earliest sensible resume: <condition or date>
- Blockers that must lift first: <list>
- Standing context that may go stale: <list with expiration>

RESUME PACKET DRAFT (forward-looking; may need refresh if days pass)
─── PASTE BLOCK START ───
<continuation packet per §2, but with a "refresh" step at top>
─── PASTE BLOCK END ───

ARCHIVE NOTE
- SESSION_LOG.md final entry written
- BUILD_PLAN_*.md check-offs landed (per OPERATING RULES batched commit)
- Nothing left "running" — at L1, nothing can be running anyway
```

A clean pause is the doctrine-sanctioned way to end a stretch of work. It is distinguished from a cap-driven freeze in that the *human* chose to stop; the packet did not run out.

---

## 6. Template usage rules

- **Templates are starting shapes.** Michael edits and tightens. The shape's purpose is to ensure no required field is silently dropped.
- **Brevity beats completeness.** Do not paste a template that has all sections empty as `<TBD>`. Either fill, omit, or write `(none)` — never leave placeholders.
- **One packet per session.** Doctrine does not stack packets within one session. A single Claude turn may receive only one packet.
- **No template invokes another packet.** A packet that says "and then run packet X" is a recursive pattern (`SAFE_CONTINUATION_BOUNDARIES.md` §8).
- **Templates do not name a runtime.** Words like "agent," "worker," "supervisor," "daemon," "schedule" are absent from the templates by design. Replacing them in a filled-in packet is a doctrine violation.

---

## 7. Three worked examples

The three examples below show the templates filled in for representative AccentOS situations. Names, paths, and SHAs are illustrative.

### 7.1 — Ideal long-running bounded packet (overnight-scale scope)

This is the *shape* of a packet sized for overnight-scale work. **It is not authorization to run overnight unattended.** Per `UNATTENDED_EXECUTION_PREREQUISITES.md` §5, unattended overnight requires L2 + L3 maturity that does not exist today. The packet below is L1-safe when executed *with Michael reachable*; it is the building block for future unattended use, not a substitute for it.

```
PACKET TYPE: bounded execution
AUTHOR: michael@desktop
DATE: 2026-05-11 21:30 ET
BRANCH: claude/kpi-catalog-pass
TARGET WALL TIME: 4–6h (Michael reachable on phone for escalation)
TARGET COMMITS: 8–14

══════════════════════════════════════════════
SCOPE
══════════════════════════════════════════════
IN SCOPE:
- Walk KPI_CATALOG.md from line 1 to last entry, in order.
- For each KPI marked "data source: TBD", attempt to identify the source
  table.column from existing skills (kpi-data-audit pattern, supabase-sql-magic
  patterns) and update the catalog entry.
- Commit per KPI updated. One KPI per commit.

OUT OF SCOPE:
- Adding new KPIs (catalog additions are Michael-authored).
- Editing the KPI definition prose (only the data-source field).
- Touching any sql/* file.
- Touching any non-KPI doc.

══════════════════════════════════════════════
CONTEXT
══════════════════════════════════════════════
- Files: KPI_CATALOG.md (read-write), skills/kpi-data-audit/SKILL.md (read-only),
         skills/supabase-sql-magic/SKILL.md (read-only).
- Standing skills active: vibe-speak (vibe), efficiency-monitor.
- Last commit on branch: <sha>.
- WIP timestamp at packet start: 2026-05-11 21:25.
- Inline fact: there are 38 known TBD entries per the last KPI audit
  (BUILD_INTELLIGENCE.md gotcha #41).

══════════════════════════════════════════════
AUTHORITY
══════════════════════════════════════════════
MAY:
- Edit KPI_CATALOG.md data-source fields only.
- Commit + push to claude/kpi-catalog-pass.
- Update WORK_IN_PROGRESS.md after every KPI.
- Skip any KPI where the source is genuinely ambiguous (escalate via the
  freeze artifact, do not block other KPIs).

MUST NOT:
- Edit prose, definitions, formulas, or threshold rules in KPI_CATALOG.md.
- Touch sql/* or skills/* (read-only here).
- Introduce a new commit message style; use existing conventions.
- Run kpi-data-audit during this packet (it is itself out of scope).

MUST ESCALATE:
- More than 3 consecutive KPIs cannot be resolved (suggests the resolution
  approach is wrong).
- A KPI's apparent source contradicts a prior commit's resolution.
- Any halt-list action becomes the only path forward.

══════════════════════════════════════════════
EXITS
══════════════════════════════════════════════
COMPLETION: All TBD entries resolved or skipped with reason.
CAP: 14 commits OR 6h wall time OR context threshold reached.
ESCALATION: per AUTHORITY MUST-ESCALATE OR standing thresholds.

══════════════════════════════════════════════
DELIVERABLES
══════════════════════════════════════════════
On COMPLETION:
- KPI_CATALOG.md updated, all TBDs resolved or noted.
- One commit per resolved KPI.
- Clean-freeze artifact ("completed").
- Next-packet draft suggesting either KPI prose review or kpi-data-audit run.

On CAP:
- Whichever KPIs were resolved before the cap.
- Clean-freeze artifact ("capped at 14/38").
- Next-packet draft = continuation of remaining TBDs.

On ESCALATION:
- Escalation packet identifying the contradiction or ambiguity class.
- WIP paused.

══════════════════════════════════════════════
FREEZE CONTRACT
══════════════════════════════════════════════
Closing artifact MUST contain:
- Count of TBDs resolved / skipped / remaining.
- Pattern of skip reasons (1 line per pattern).
- Last KPI line number processed.
- Verbatim threshold that ended the packet.

══════════════════════════════════════════════
FORBIDDEN (packet-specific)
══════════════════════════════════════════════
- No SQL execution of any kind, including read-only queries.
- No invocation of standing skills other than vibe-speak / efficiency-monitor.
- No bundled fixes ("while we're here, fix the typo on line 47" — refuse;
  note in freeze artifact's open-questions list).
- Do not generate any artifact using the words "autonomous", "running in the
  background", "self-healing", "supervisor", or "agent acting alone".

START.
```

### 7.2 — Ideal clean-freeze + resume packet pair

The freeze artifact (left) and the continuation packet it generates (right) form a pair. The freeze is what Claude writes at the end of a session; the continuation is what Michael pastes at the start of the next.

**Freeze artifact (Claude writes):**

```
══════════════════════════════════════════════
CLEAN FREEZE — 2026-05-12 02:14 ET
══════════════════════════════════════════════
Disposition: CAP
Reason:      commit cap reached (14/14)
Branch:      claude/kpi-catalog-pass

Commits this packet:
  - a1b2c3d  kpi: resolve gross_margin_pct → orders.subtotal/orders.total
  - b2c3d4e  kpi: resolve repeat_purchase_rate → customer_orders join
  - c3d4e5f  kpi: resolve gmc_disapproved_pct → gmc_status_log
  ... (11 more)
WIP final:   "2026-05-12 02:14 — KPI pass capped at 14/38; remaining
              TBDs start at line 217 (cohort_retention_d30)."

WHAT LANDED
- 14 KPI catalog entries resolved with table.column source.
- Each commit one KPI, conventional message.
- WIP updated after every commit.

WHAT DID NOT LAND
- 24 TBD entries remain (lines 217–end).
- 3 entries skipped within the 14 with one-line reason in commit body.
- Did not run kpi-data-audit (out of scope per packet).
- Did not edit prose or thresholds (out of scope per packet).

OPEN QUESTIONS
(none — disposition is CAP, not ESCALATION)

NEXT PACKET DRAFT
─── PASTE BLOCK START ───
PACKET TYPE: continuation
AUTHOR: michael@<device>
DATE: <when pasted>
BRANCH: claude/kpi-catalog-pass
PRIOR PACKET: freeze artifact 2026-05-12 02:14, SHA <sha>, WIP "<excerpt>"

WHAT CARRIES FORWARD
- Scope: same as prior — resolve TBD data-source fields in KPI_CATALOG.md.
- Authority: same.
- Exits: same.

ADJUSTMENTS
- Scope changes: start at line 217, walk to end (24 remaining TBDs).
- Authority changes: none.
- Exit changes: TARGET COMMITS raised to 24 (one per remaining TBD).
- Items already done: 14 commits a1b2c3d..n3o4p5q (do not redo).

ASSUMPTIONS TO VERIFY IN STEP 0
- Branch claude/kpi-catalog-pass is at SHA <sha>.
- KPI_CATALOG.md line 217 begins "cohort_retention_d30".
- WIP last entry mentions "capped at 14/38".
- If any false → freeze immediately.

NEXT ITEM
Resume the per-KPI loop starting at line 217.

START FROM STEP 0 (verify), THEN PROCEED.
─── PASTE BLOCK END ───

NOTES
- Skip-reason patterns are uniform; consider adjusting the catalog to add
  a "source-skipped" column in a future packet (Michael's call).
- Recommend pasting within 24h to keep the assumptions section accurate.
```

**Continuation packet (Michael pastes from the block above):**

The PASTE BLOCK above is the continuation packet. Michael copies the block, optionally edits the first three header lines (date, device), and submits to a fresh session. The packet self-verifies in step 0 and proceeds.

### 7.3 — Ideal escalation packet

```
══════════════════════════════════════════════
ESCALATION — 2026-05-12 22:47 ET
══════════════════════════════════════════════
Trigger:     "More than 3 consecutive KPIs cannot be resolved" (packet
              MUST-ESCALATE rule fired at KPI lines 234, 235, 236, 237).
Packet:      bounded execution, opened 2026-05-12 21:30, branch
              claude/kpi-catalog-pass.
Last sub-step completed: commit f4e5d6c — kpi: resolve average_order_value
                          → orders.total / count(orders.id) (line 233).
Sub-step that would have been next: line 234, "vendor_score_drift_30d".

WHY THIS IS ESCALATING
The 4 KPIs at lines 234–237 all reference vendor_scores history but the
existing schema has no vendor_scores_history table — only a current-state
vendor_scores. Resolving them requires either (a) treating them as TBD
"awaiting M-task to create vendor_scores_history", or (b) interpreting them
as point-in-time queries against current state (different semantics).

The packet's MAY list does not authorize this choice. It is a semantic
question about how the catalog should treat history-dependent KPIs.

WHAT WAS RULED OUT
- Bundling into a "skip with reason" continuation: 4 in a row exceeds the
  packet's premise that skip is rare; the premise is wrong, not the data.
- Inferring the answer from kpi-data-audit's prior runs: that skill is
  out-of-scope for this packet.
- Picking option (a) by default: option (b) is also defensible and the
  decision sets a pattern for ~7 similar history-dependent KPIs further on.

OPTIONS
1. Treat all history-dependent KPIs as TBD pending an M-task that creates
   vendor_scores_history. Stop the current packet, queue an M-task.
2. Treat them as point-in-time over current state, document the semantic
   choice in BUILD_INTELLIGENCE.md, continue resolving with that convention.
3. Split: resolve the non-history-dependent remainder first; defer all
   history-dependent ones as a separate sub-batch.
0. FREEZE without resolution; continue from a fresh packet later.

CONCRETE QUESTION FOR MICHAEL
- Is the catalog's intent that KPIs reference live state (option 2), or
  historical snapshots (option 1)?
- If option 2: should the convention be applied to all such KPIs in one
  follow-up packet or per-KPI in this packet?

STATE PRESERVED
- WIP updated to "2026-05-12 22:47 — paused — awaiting Michael on KPI
  history-vs-current-state convention; last good commit f4e5d6c at line 233".
- Working tree clean (no half-edits).
- No pending tool calls.
- 11 commits this packet so far; cap was 14; cap not reached.

REPLY FORMAT
"resolve 1" / "resolve 2" / "resolve 3" / "resolve 0" or free-form override.
Once resolved, a fresh continuation packet (per the resolved option) opens
the next session.
```

---

## 8. The single sentence

A template's job is to make the next packet shorter to write than to second-guess; doctrine's job is to make the template impossible to fill in dishonestly.
