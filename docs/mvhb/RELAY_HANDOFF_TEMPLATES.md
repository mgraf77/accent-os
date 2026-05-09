# RELAY_HANDOFF_TEMPLATES.md — AccentOS Ready-to-Use Relay Templates

> Ergonomics/orchestration design only.
> No governance ownership. No runtime authority. No auto-remediation.
> All templates are copy-paste ready. Bracketed fields [like this] are the only edits needed.
> Optimized for iPhone composition — minimal typing, minimal scrolling.

---

## HOW TO USE THIS DOC

1. Find the template that matches your scenario (table of contents below)
2. Tap-hold the code block → Select All → Copy
3. Paste into Claude chat
4. Replace bracketed fields only
5. Send

Everything outside brackets is fixed text — do not change it.
If a field says [OPTIONAL], delete that whole token if not needed.

---

## QUICK INDEX

```
T01  Resume Session (standard)
T02  Resume Session (with gate resolution)
T03  Resume Session (with constraint)
T04  Freeze Session
T05  Clean Pause Request
T06  Gate Resolution — single
T07  Gate Resolution — batch
T08  Gate Resolution — judgment call
T09  Branch Handoff (outgoing)
T10  Branch Handoff (incoming)
T11  Sandbox Exploration Start
T12  Governance Escalation Surface
T13  MODE 2 — Strategic Interruption (Claude → Michael)
T14  MODE 2 — Michael Response
T15  Parallel Session Coordination
T16  Blocked Session Recovery
T17  Bottleneck Escalation (TIER 0)
T18  Decision Compression — multi-answer
T19  Relay Reset — initiate
T20  Relay Reset — resume after
T21  DONE / KNOWN / NEXT context block
T22  Session Wrap / End-of-Session signal
T23  Orphan Branch Triage
T24  Scope Confirmation (pre-execution)
```

---

## FORMATTING RULES (applied to all templates)

```
RULE 1 — One block per relay action
  Every template produces one copy block.
  One copy action on iPhone = one relay cycle.

RULE 2 — Brackets are the only edit zones
  [like this] = fill in or delete if marked OPTIONAL
  Everything else is fixed protocol text.

RULE 3 — No trailing commentary
  Templates do not include explanation after the block.
  Explanation belongs in this document, not in the relay.

RULE 4 — REPLY flag is always the last line
  REPLY: YES = Michael must act on Claude's output
  REPLY: NO = Claude continues autonomously, no response needed

RULE 5 — Lines >60 chars wrap gracefully on iPhone — acceptable
  Lines >100 chars may truncate in some readers — avoid in prompt text

RULE 6 — Code blocks for templates, prose for context
  Templates live in ``` blocks (monospace, tap-to-select)
  Explanation lives outside blocks (readable prose)
```

---

## REPLY / NO-REPLY SIGNALING

All Claude outputs in MODE 1 must close with one of these:

```
REPLY: YES — [one-line description of what Michael must do]
```
```
REPLY: NO — Claude continues autonomously
```

Michael's decision rule:
- See REPLY: NO → put phone down
- See REPLY: YES → read what follows, act, then relay or respond

Claude never omits the REPLY flag in MODE 1 output.
The flag is the primary cognitive load reducer — Michael doesn't read
the full output to decide whether action is needed.

---

## TEMPLATES

---

### T01 — Resume Session (standard)

Use when: STATUS.md is current, WIP.md is current, no gate changes.
Assumption: Claude reads STATUS.md + WIP.md and picks up from NEXT ACTION.

```
resume
```

That's the entire template. One word. STATUS.md does the rest.
Only use longer variants when STATUS.md is stale or context has shifted.

---

### T02 — Resume Session (with gate resolution)

Use when: resuming AND telling Claude an M-task was just completed.

```
M[##] done — resume
```

Example:
```
M03 done — resume
```

Claude resolves the gate, updates STATUS.md, picks up from NEXT ACTION.

---

### T03 — Resume Session (with constraint)

Use when: resuming but adding or changing a constraint from the last session.

```
resume — [constraint in one phrase]
```

Examples:
```
resume — skip the tests this pass
resume — stay on js/employees.js only
resume — treat M11 as HOLD for now
```

---

### T04 — Freeze Session

Use when: Michael needs to end the session but Claude should wrap cleanly.

```
freeze — commit any WIP, update STATUS.md with NEXT ACTION, push
```

Claude responds with:
- Commits open WIP (wip: prefix if incomplete)
- Sets NEXT ACTION in STATUS.md
- Updates SESSION STATE to FROZEN
- Pushes
- Outputs a T21 DONE / KNOWN / NEXT block

---

### T05 — Clean Pause Request

Use when: Michael needs to stop soon but wants Claude to finish the current atomic task first.

```
finish current task then pause — do not start next item
```

Claude completes the in-progress action, commits it, then executes T04 behavior.
Does not begin the next BUILD_PLAN item.

---

### T06 — Gate Resolution (single)

Use when: one M-task is resolved and Michael is reporting it.

```
M[##] done
```

Claude updates STATUS.md CURRENT GATE → NONE, BLOCKED → NO, resumes from NEXT ACTION.

---

### T07 — Gate Resolution (batch)

Use when: multiple M-tasks resolved in one sitting. Most efficient gate pattern.

```
M[##] done. M[##] done. M[##] done. [OPTIONAL: continue from NEXT ACTION]
```

Example:
```
M03 done. M07 done. M11 done. continue from NEXT ACTION
```

Claude processes all resolutions in one pass, updates STATUS.md, resumes.
Batch always preferred over sequential single-gate resolution.

---

### T08 — Gate Resolution (judgment call)

Use when: the gate requires a decision, not just an action execution.

```
M[##]: [decision or answer in one phrase]
```

Examples:
```
M11: use vendor tier B for inactive brands
M14: skip — not needed for MVP
M17: yes, persist to Supabase
M22: use the same pattern as the employee module
```

Multiple judgment calls can batch with T07:
```
M11: use tier B. M14: skip. M17: yes persist. M22: same as employee pattern.
```

---

### T09 — Branch Handoff (outgoing)

Use when: current session work needs to be handed to a different session or model.
Michael sends this to the CURRENT session to prepare the handoff package.

```
prepare handoff — write DONE / KNOWN / NEXT block for [target session or context]
then freeze this session
```

Claude outputs a T21 block optimized for the target context, then freezes.

---

### T10 — Branch Handoff (incoming)

Use when: starting a new session that is receiving work from another session.
Michael pastes the T21 block from the prior session, then appends this.

```
[paste DONE / KNOWN / NEXT block here]

continuing from above context — branch: [branch-name] — proceed with NEXT
```

The receiving Claude session reads the context block and executes NEXT directly.
No re-reading of full WIP.md required if context block is accurate.

---

### T11 — Sandbox Exploration Start

Use when: initiating a new observability or ergonomics design doc (this document's origin).

```
sandbox doc: [doc-name].md

focus:
- [topic 1]
- [topic 2]
- [topic 3]

requirements:
- observability/ergonomics only
- no runtime authority
- no governance ownership
- no implementation assumptions

optimize for mobile readability
MOBILE HANDOFF MODE active — one copy block output
```

---

### T12 — Governance Escalation Surface

Use when: Claude identifies something that requires governance layer review before proceeding.
This surfaces it without blocking and without Claude taking unilateral action.

```
⚑ GOVERNANCE SURFACE — [topic in one phrase]

observation: [what was found — 1 sentence]
risk if unaddressed: [consequence — 1 sentence]
recommended deferral: [what Claude will skip or hold — 1 sentence]

no action required now — logging for governance layer review
```

This is NOT a MODE 2 interruption. It is an advisory surface.
Claude continues with unaffected work after writing this.
If the observation requires immediate action → use T13 (MODE 2) instead.

---

### T13 — MODE 2 Strategic Interruption (Claude → Michael)

Canonical format for Claude triggering a strategic interruption.
Used sparingly — maximum 2 per session.

```
⚠ STRATEGIC INTERRUPTION — [T1|T2|T3|T4|T5|T6|T7]

situation: [what is happening — 1 sentence]
risk: [what breaks if we proceed — 1 sentence]
recommended path: [what Claude suggests — 1 sentence]

required from Michael: [exact decision or action needed — 1 sentence]

returning to MODE 1 after your response
```

Trigger types for reference:
```
T1 Architecture risk       T5 Sequencing failure
T2 Orchestration failure   T6 Tier 0 bottleneck
T3 Governance divergence   T7 Directional correction
T4 Scope drift
```

---

### T14 — MODE 2 Response (Michael → Claude)

Use when: responding to a T13 interruption. Keeps response minimal.

Option A — Accept recommended path:
```
[T#] — go with recommended
```

Option B — Override with specific direction:
```
[T#] — [your decision in one phrase]
```

Option C — Hold and investigate:
```
[T#] — hold, I'll review and follow up
```

After receiving any T14 response, Claude returns to MODE 1 immediately.

---

### T15 — Parallel Session Coordination

Use when: two Claude sessions are active and need to avoid conflicts.
Send to BOTH sessions before they touch shared modules.

```
parallel coordination — two active sessions:

SESSION A: branch [branch-a] — owns [module or file list]
SESSION B: branch [branch-b] — owns [module or file list]

do not touch files owned by the other session
flag immediately if conflict detected (MODE 2 T2)
```

Each session acknowledges by stating its owned files before proceeding.

---

### T16 — Blocked Session Recovery

Use when: SESSION STATE = PAUSED_ON_MICHAEL and the blocking M-task is now resolved.

```
M[##] done — unblocked — resume from NEXT ACTION on branch [branch-name]
```

If multiple gates were blocking:
```
M[##] done. M[##] done — all gates cleared — resume from NEXT ACTION
```

Claude verifies STATUS.md gates are all resolved before resuming.
If additional gates appear on resume → T13 (T6) to escalate.

---

### T17 — Bottleneck Escalation (TIER 0)

Use when: Claude has identified a TIER 0 bottleneck requiring immediate Michael action.
Claude sends this format. Michael should treat it as highest urgency.

```
⛔ TIER 0 BOTTLENECK — [bottleneck type]

blocked since: [timestamp or duration]
what is stopped: [one phrase describing what cannot proceed]
required action: [exact M-task or Michael action — specific enough to execute immediately]
time cost if unresolved: [what accumulates per hour of delay]

REPLY: YES — execute required action above
```

Bottleneck types for reference (from Bottleneck Visibility Spec):
```
TYPE 1 Session health failure    TYPE 4 Resume friction
TYPE 2 Queue exhaustion          TYPE 5 Frozen session debt
TYPE 3 Dependency blockage       TYPE 6 Relay friction
```

---

### T18 — Decision Compression (multi-answer)

Use when: Claude has surfaced multiple pending decisions or questions across a session.
Michael answers all of them in one message rather than sequential round-trips.

Format for Michael:
```
decisions:
[topic 1]: [answer]
[topic 2]: [answer]
[topic 3]: [answer]
[OPTIONAL topic 4]: [answer]
```

Example:
```
decisions:
vendor tier for inactive brands: use tier B
M14 scope: skip for MVP
Goals module persist pattern: same as employee module
frozen branch quota-generator: abandon
```

Claude processes all decisions before executing any of them.
Batch processing prevents decision-ordering side effects.

---

### T19 — Relay Reset (initiate)

Use when: the relay loop has degraded (3+ MODE 2 in one session, context collapse,
operator saturation). Stops all active work and initiates triage.

```
relay reset — stop all active work

compile:
- all active sessions (branch + state + last push)
- all open gates (M-task + age)
- all frozen sessions (branch + age + commit depth)
- queue depth (unblocked vs blocked)
- current WIP (uncommitted or wip: commit present)

output as triage summary — REPLY: YES
```

Claude halts execution, reads STATUS.md + BUILD_PLAN + git branch state,
outputs a triage summary. Does not proceed with any build work until
Michael sends T20.

---

### T20 — Relay Reset Resume (after triage)

Use when: responding to the T19 triage summary. Gives Claude clear instructions
for each item in the triage list.

```
reset directives:

active session [branch]: [RESUME | FREEZE | ABANDON]
frozen session [branch]: [RESUME | MERGE | ABANDON | HOLD until [date]]
frozen session [branch]: [RESUME | MERGE | ABANDON | HOLD until [date]]
gate M[##]: [RESOLVED | SKIP | HOLD]
gate M[##]: [RESOLVED | SKIP | HOLD]

priority after reset: [first thing Claude should do]
```

Claude executes each directive in order, updates STATUS.md, then proceeds
with the specified priority.

---

### T21 — DONE / KNOWN / NEXT Context Block

Canonical 3-line context compression format.
Written by Claude at every session freeze or branch handoff.
Pasted by Michael into the next session as the opening context.

```
DONE: [specific shipped action — commit hash or file — 1 line]
KNOWN: [one critical decision, constraint, or discovery — 1 line]
NEXT: [exact next action Claude will take on resume — 1 line]
```

Rules:
- DONE must be verifiable (commit hash preferred, file name acceptable)
- KNOWN must be a fact that would change execution if forgotten
- NEXT must be specific enough to execute without reading WIP.md
- Three lines exactly — no sub-bullets, no prose

Good example:
```
DONE: wired Supabase persist into employee save modal — commit 3f8a12c
KNOWN: employee_id is UUID not integer — schema already enforces this
NEXT: wire Goals module save handler using sbSaveEmployee as the pattern
```

Bad example (anti-pattern):
```
DONE: worked on the employee stuff today
KNOWN: there were some schema things
NEXT: continue with the next module
```

Bad DONE loses verifiability. Bad KNOWN loses the specific constraint.
Bad NEXT loses the actionable path — the receiving session will reconstruct from scratch.

---

### T22 — Session Wrap / End-of-Session Signal

Use when: Michael is ending a session intentionally and wants Claude to wrap properly
before the conversation closes.

```
wrap — commit open WIP, write DONE/KNOWN/NEXT, update STATUS.md, push, log session
```

Claude executes in this order:
1. Commit any uncommitted WIP (wip: prefix if incomplete task)
2. Write T21 block (DONE / KNOWN / NEXT) in chat output
3. Update STATUS.md: SESSION STATE, WIP, NEXT ACTION, LAST PUSH, HEALTH
4. Push STATUS.md + WIP.md update
5. Append session entry to PROMPT_LOG.md

Output after wrap:
```
SESSION WRAPPED
branch: [branch]
last commit: [hash] — [message]
DONE: [...]
KNOWN: [...]
NEXT: [...]
STATUS: [GREEN|YELLOW|RED]
REPLY: NO
```

---

### T23 — Orphan Branch Triage

Use when: git branch -r shows branches not tracked in STATUS.md.
Claude surfaces orphans; Michael decides fate.

Claude format:
```
⚑ ORPHAN BRANCHES DETECTED

[branch-name-1] — last commit: [date] — [commit message]
[branch-name-2] — last commit: [date] — [commit message]

for each: RESUME | MERGE | ABANDON?
REPLY: YES
```

Michael response (uses T18 decision compression format):
```
decisions:
[branch-1]: abandon
[branch-2]: resume — add to FROZEN SESSIONS
```

---

### T24 — Scope Confirmation (pre-execution)

Use when: a directive has ambiguous blast radius and Claude wants to confirm scope
before touching files. Use sparingly — only for high-blast-radius work.

Claude format (only used when genuinely ambiguous — not as a habit):
```
scope check before executing:

directive: [original Michael directive — 1 line]
my interpretation: [what Claude plans to do — files, functions, scope]
blast radius: [N files, [module list]]

confirm? or redirect?
REPLY: YES
```

Michael response options:
```
confirmed — go
```
```
redirect — [correction in one phrase]
```

If Michael does not respond within reasonable time → Claude executes with the
stated interpretation and notes it in the commit message.
This template is a one-time confirmation, not a blocking gate.

---

## MODE 1 FULL OUTPUT STRUCTURE

Reference: what a complete MODE 1 Claude output looks like.

```
→ TO: [same session | Michael | new session on branch X]
→ MODEL: [claude-opus-4-7 | claude-sonnet-4-6 | claude-haiku-4-5]
→ PROMPT: [exact text Michael pastes into target]

---
[result or status — 3 lines max if REPLY: NO]
[or full context if REPLY: YES]
---

REPLY: [YES — [what Michael must do] | NO — Claude continues autonomously]
```

When REPLY: NO, the result section is optional (Claude may omit entirely).
When REPLY: YES, the result section must contain exactly what Michael needs to read.

---

## MODE 2 FULL OUTPUT STRUCTURE

Reference: what a complete MODE 2 Claude output looks like.

```
⚠ STRATEGIC INTERRUPTION — [T1|T2|T3|T4|T5|T6|T7]

situation: [1 sentence]
risk: [1 sentence]
recommended path: [1 sentence]

required from Michael: [1 sentence — exact action or decision]

returning to MODE 1 after your response
```

Hard limits:
- Maximum 8 lines total (including blank lines between sections)
- No sub-bullets
- No background or history
- No alternatives (unless the choice itself is the question)
- No MODE 2 output without a required-from-Michael line

---

## COPY-PASTE OPTIMIZATION RULES

iPhone-specific rules for maximizing relay speed:

```
RULE A — Templates live in code blocks
  iOS allows tap-hold → Select All on a code block.
  All template text is in ``` blocks for this reason.

RULE B — Brackets are the only friction points
  Every bracket is one editing action. Minimize bracket count.
  T01 has zero brackets. T07 has two. T20 has the most (intentional — it's complex).

RULE C — Numbered templates for fast reference
  T01–T24 in the quick index. Michael memorizes the T-numbers for common flows.
  Common: T01 (resume), T06/T07 (gate), T04 (freeze), T22 (wrap).

RULE D — Templates that fit in one screen
  All templates are ≤15 lines. Most are ≤8 lines.
  No template requires scrolling to see the full text on a 375px screen.

RULE E — Most common templates should be committed to muscle memory
  T01: "resume" — no template needed, memorized
  T06: "M## done" — memorized
  T04: "freeze — commit any WIP, update STATUS.md with NEXT ACTION, push" — memorized
  T22: "wrap — commit open WIP, write DONE/KNOWN/NEXT, update STATUS.md, push, log session" — memorized
```

---

## MOBILE READABILITY RULES (template design constraints)

Rules applied when creating new templates or extending existing ones:

```
MAX LINES: 15 per template (fits one iPhone screen)
MAX LINE LENGTH: 80 chars (wraps cleanly, does not truncate)
BRACKET COUNT: ≤4 per template
REQUIRED FIELDS: ≤3 per template (more = fragmentation risk)
OPTIONAL FIELDS: marked [OPTIONAL] — delete if not needed, never leave blank
FIXED TEXT RATIO: >60% of template should be fixed (non-bracketed) text
NESTING: no sub-bullets inside templates
HEADERS: not inside templates — only in this doc's structure
EMOJI/SYMBOLS: only ⚠ (MODE 2), ⛔ (TIER 0), ⚑ (advisory surface) — no others
```

---

## ANTI-PATTERN EXAMPLES

**Anti-Pattern A — Over-contextualized resume**
```
BAD:
"Hi Claude, I was working earlier on the employee module and we had some issues
with the schema. We decided to use UUID for employee_id. Can you continue from
where we left off? The last thing you did was the save handler I think."

GOOD:
"resume"
```
STATUS.md + WIP.md contain all of this. Michael restating it adds noise,
not fidelity, and wastes composition time on iPhone.

---

**Anti-Pattern B — Single-gate sequential resolution**
```
BAD:
[message 1] "M03 done"
[wait for Claude response]
[message 2] "M07 done"
[wait for Claude response]
[message 3] "M11: use option B"

GOOD:
"M03 done. M07 done. M11: use option B."
```
Three relay cycles become one. Claude batches all resolutions in a single pass.

---

**Anti-Pattern C — Scope-free directive**
```
BAD:
"Fix the quota generator"

GOOD:
"fix 400 error in quota generator — scope: worker/anthropic-proxy.js only"
```
Scope-free directives invite scope drift. One constraint line prevents it.

---

**Anti-Pattern D — Missing DONE/KNOWN/NEXT at freeze**
```
BAD:
[session ends with no context block]
[next session starts]
"continue last session"
[Claude spends 20 min reading files to reconstruct state]

GOOD:
[before ending] "wrap"
[Claude outputs T21 block]
[next session] paste T21 block + "continuing from above — proceed with NEXT"
```

---

**Anti-Pattern E — MODE 2 overuse**
```
BAD:
[5 MODE 2 interruptions in one session]
Michael's final response: "just do whatever you think is right"

GOOD:
[0–2 MODE 2 per session]
3rd concern → write to BUILD_INTELLIGENCE.md, proceed with best inference,
surface at session wrap in DONE/KNOWN/NEXT
```
MODE 2 overuse trains Michael to treat MODE 2 as noise.
When MODE 2 is rare, it is always read immediately.
