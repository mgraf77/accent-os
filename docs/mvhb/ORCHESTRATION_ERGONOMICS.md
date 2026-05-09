# ORCHESTRATION_ERGONOMICS.md — AccentOS Relay Loop Design

> Sandbox doc. Ergonomics and observability design only.
> No governance ownership. No runtime authority. No auto-remediation.
> Formalizes the Michael ↔ Claude relay protocol and the dual orchestration modes
> that govern when Claude communicates, how, and at what density.

---

## WHAT THIS DOCUMENT IS

The relay loop is the operational heartbeat of AccentOS:
Michael sends a directive → Claude executes → output returns → Michael relays or acts.

That loop has friction costs. Every unnecessary interruption from Claude,
every fragmented prompt from Michael, every context loss at a handoff
is a tax on throughput. This document names those costs, defines the two
operating modes that minimize them, and specifies what good orchestration
looks like from both sides of the loop.

This is not about Claude's internal behavior. It is about the relay layer —
the zone between Michael's intent and Claude's execution.

---

## THE RELAY LOOP (base model)

```
Michael
  │
  ▼  DIRECTIVE (prompt)
Claude Session
  │
  ▼  OUTPUT (action + result + optional relay instruction)
Michael
  │
  ├─► ACT (execute M-task, review output, make decision)
  │
  └─► RELAY (forward output or directive to next session/model)
  │
  ▼
Next Claude Session / Same Session
```

Each loop cycle has a cost:
- Michael's attention cost (reading + deciding + composing)
- Relay friction cost (copying, pasting, reformatting on iPhone)
- Context loss risk (something gets dropped at the handoff)
- Decision cost (if Claude asks instead of deciding)

Good orchestration ergonomics minimize the sum of these costs per unit of build output.

---

## DUAL ORCHESTRATION MODES

---

### MODE 1 — HANDOFF ORCHESTRATOR MODE

**Purpose:** Maximum throughput relay workflow. Michael is the relay operator,
not the decision maker. Claude drives; Michael routes.

**When active:** Default mode. Always active unless MODE 2 is triggered.

**Claude behavior in MODE 1:**
- Output is a single copy block
- Block contains exactly: destination, model, prompt, reply flag
- No commentary, no explanation, no meta-discussion
- No questions unless the question is the entire point of the relay
- Claude makes all decisions within its authority — never asks what it can infer
- Status updates only when they contain an action signal (not narrative)

**Output format (MODE 1):**
```
→ TO: [session name / same session / Michael]
→ MODEL: [claude-opus-4-7 / claude-sonnet-4-6 / claude-haiku-4-5]
→ PROMPT: [exact text, ready to paste]
→ REPLY: [YES — Michael must act on output | NO — Claude continues autonomously]
```

**Michael behavior in MODE 1:**
- Read the → TO line
- Copy the → PROMPT block
- Paste into the target session
- If REPLY = NO: put phone down
- If REPLY = YES: read output, act, relay next prompt

**MODE 1 contract:**
Claude does not interrupt Michael's relay flow with observations, suggestions,
or commentary unless those items have a REPLY = YES signal attached.
Output with REPLY = NO is delivered and Claude moves on.

---

### MODE 2 — STRATEGIC INTERRUPTION MODE

**Purpose:** Prevent high-cost mistakes, surface critical insights, or flag
governance-level concerns before they compound.

**When active:** Triggered selectively. MODE 2 is the exception, not the norm.
Every MODE 2 trigger has a cost — it breaks Michael's relay flow.
A false positive MODE 2 trains Michael to ignore MODE 2 signals.

**Trigger conditions (ALL must be verified before triggering):**

```
T1 — ARCHITECTURE RISK
     Current execution path creates an irreversible structural problem.
     Example: Claude is about to modify the auth layer in a way that
     breaks existing user sessions — not recoverable by re-running.

T2 — ORCHESTRATION FAILURE RISK
     The relay loop itself is about to break down.
     Example: two parallel sessions are about to push conflicting changes
     to the same module without Claude flagging the conflict.

T3 — GOVERNANCE DIVERGENCE
     Execution has drifted outside the scope defined by the governance layer.
     Example: Claude is about to implement a runtime-state mutation that
     was explicitly deferred to the stabilization layer.

T4 — DANGEROUS SCOPE DRIFT
     Work is expanding materially beyond what was authorized in the directive.
     Example: a bug fix prompt has turned into a module refactor touching
     12 files — Michael did not authorize that blast radius.

T5 — SEQUENCING FAILURE
     A dependency is being violated that will cause a cascade failure.
     Example: Claude is about to run a migration that assumes table X exists
     but table X has not been created yet (M-task M02 not run).

T6 — TIER 0 BOTTLENECK IDENTIFIED
     A TIER 0 bottleneck from the Bottleneck Visibility Spec has been detected
     that requires Michael's immediate action before Claude can proceed.

T7 — HIGH-LEVERAGE DIRECTIONAL CORRECTION
     A discovery has been made that changes the optimal path forward.
     Example: midway through building feature X, Claude discovers that
     feature Y (already built) makes feature X redundant. Proceeding wastes
     weeks of downstream work.
```

**False trigger test (check before triggering MODE 2):**
Is the concern something Claude can resolve autonomously? If yes → stay in MODE 1.
Is the concern recoverable without Michael's input? If yes → stay in MODE 1.
Is the concern time-sensitive in a way that justifies breaking relay flow? If no → stay in MODE 1.

**Claude behavior in MODE 2:**
```
⚠ STRATEGIC INTERRUPTION — [trigger type: T1–T7]

[2–3 sentence explanation of the concern]
[Specific risk if not addressed]
[Recommended path forward]

Required from Michael: [exact decision or action needed]
Returning to MODE 1 after this is resolved.
```

Maximum length: 8 lines. If it needs more than 8 lines, it is not concise enough.

**After MODE 2:** Claude returns to MODE 1 immediately after receiving Michael's response.
No lingering in MODE 2. No follow-up MODE 2 unless a new trigger condition is met.

---

## MODE SWITCHING HEURISTICS

### When to escalate: MODE 1 → MODE 2

```
ESCALATE IF:
  - Trigger condition T1–T7 is verified (not suspected)
  - The cost of proceeding incorrectly > cost of interrupting Michael
  - The decision is not within Claude's authority
  - The error is not recoverable without significant rework

STAY IN MODE 1 IF:
  - The concern is addressable by Claude without input
  - The error is recoverable (revert, re-run, re-prompt)
  - The concern is a judgment call that Claude is authorized to make
  - The interruption would be the 3rd or more in a single relay session
    (escalation fatigue — at 3+ interruptions, the root cause is wrong, not the decisions)
```

### When to return: MODE 2 → MODE 1

Always, after Michael responds to the MODE 2 interruption.
No exceptions. MODE 2 is never a permanent state.

### Escalation frequency limit

Maximum 2 MODE 2 triggers per relay session.
If a session requires >2 strategic interruptions, the directive was underspecified
or the scope was wrong. The correct fix is a new directive from Michael,
not continued MODE 2 escalation.

---

## OPERATOR COGNITIVE LOAD MODEL

Michael's attention has a capacity ceiling. Orchestration ergonomics
define how to stay well below that ceiling during long relay sessions.

**Load sources (ranked by cost):**

```
HIGH LOAD:
  - Multi-step decisions with irreversible consequences
  - Parallel threads that require simultaneous context switching
  - Ambiguous Claude output requiring interpretation before relay
  - Long outputs requiring summarization before forwarding
  - Unexpected MODE 2 interruptions mid-flow

MEDIUM LOAD:
  - Gate resolution (executing an M-task — defined action, clear scope)
  - Single clear relay (read → copy → paste → done)
  - Binary choices with explicit options and Claude recommendation

LOW LOAD:
  - YES/NO responses to a Claude question
  - "Continue" / "resume" / "M## done" signals
  - REPLY = NO outputs (no action required)
```

**Cognitive load ceiling indicators:**

```
APPROACHING CEILING:
  - Michael's responses become shorter and less specific
  - Michael starts answering questions with "whatever you think" or "you decide"
  - Response latency increases (Michael is taking longer to reply)
  - Relay errors appear (wrong context sent to wrong session)

AT CEILING:
  - Michael stops responding mid-session
  - Prompt quality degrades ("just do it" / "figure it out")
  - Gate resolution latency spikes (M-tasks sit unresolved >48h)

ABOVE CEILING (orchestration saturation):
  - Michael explicitly says he's overwhelmed
  - Relay loop breaks entirely — sessions freeze without resolution
  - Quality of decisions degrades (Michael approves things he'd normally question)
```

**Claude's responsibility at ceiling:**
When ceiling indicators appear → drop to lowest load relay pattern:
- REPLY = NO on all outputs where possible
- No questions
- Batch all gates into a single list at session end
- Compress output to single-line status signals
- Never introduce new work items or scope expansions

---

## RELAY FRAGMENTATION FAILURE MODES

These are the ways the relay loop breaks down. Each has a name, a description,
a detection signal, and a prevention pattern.

---

### FRAG-1: PROMPT FRAGMENTATION

**What it is:** Michael splits one complex directive into multiple short messages,
each incomplete. Claude gets partial context and must guess at intent.

**Detection:** Claude asks clarifying questions on >30% of prompts in a session.

**Cost:** Each clarification is a round-trip. 3 clarifications = 6 relay cycles wasted.

**Prevention:**
- Michael writes complete directives before sending (compose on desktop when possible)
- Claude provides a prompt template for complex directives when fragmentation is detected
- On iPhone: use the "one action, one sentence" format — Claude infers the rest

---

### FRAG-2: CONTEXT LOSS AT HANDOFF

**What it is:** When relaying output from one Claude session to another,
the relay drops critical context. The receiving session has incomplete state.

**Detection:** Second session contradicts or re-does work from first session.

**Cost:** Duplicated work, conflicting decisions, wasted session cycles.

**Prevention:**
- Every relay prompt must be self-contained (no "as discussed in the other session")
- Claude outputs a context block at session wrap:
  `CONTEXT FOR NEXT SESSION: [3-line summary of state, decisions made, what's next]`
- Michael copies this context block verbatim into the next session's opening prompt

---

### FRAG-3: DECISION CASCADE

**What it is:** Claude asks multiple clarifying questions instead of making
reasonable inferences and proceeding. Michael must answer all of them before
Claude can move forward.

**Detection:** Claude outputs >2 questions per prompt response.

**Cost:** High cognitive load. Interrupts relay flow. Trains Michael to
expect interrogation rather than execution.

**Prevention:**
- Claude makes the reasonable inference and states it: "Assuming X — proceeding."
- Only escalate to MODE 2 if the decision has irreversible consequences
- Never ask more than 1 question per output, and only if the answer is genuinely
  required before proceeding

---

### FRAG-4: STATUS SPAM

**What it is:** Claude provides status updates that contain no action signal.
Michael reads them, processes them, and does nothing — wasted attention cycles.

**Detection:** >3 consecutive REPLY = NO outputs where Michael has nothing actionable.

**Cost:** Relay fatigue. Michael starts skimming, increasing risk of missing real signals.

**Prevention:**
- STATUS updates go to STATUS.md, not to chat
- Chat output is reserved for: relay instructions, gate declarations, MODE 2 interruptions
- If a status update has no action signal → write it to STATUS.md, not to Michael

---

### FRAG-5: AMBIGUITY INJECTION

**What it is:** Claude surfaces options, alternatives, or trade-offs mid-execution
when Michael gave a clear directive. Forces Michael to make a decision he
already implicitly made by sending the directive.

**Detection:** Claude output contains "would you prefer X or Y?" or "we could also..."
when no decision was pending.

**Cost:** Breaks flow. Introduces doubt. Increases relay time.

**Prevention:**
- If the directive is clear, execute it. Document the approach in BUILD_INTELLIGENCE.md.
- Only surface alternatives in MODE 2 when the chosen path has a T4 (scope drift)
  or T7 (directional correction) trigger

---

### FRAG-6: PARALLEL THREAD COLLAPSE

**What it is:** Michael is managing more simultaneous Claude sessions than he can
hold in working memory. Sessions blend together. Context is sent to the wrong session.
Relay errors compound.

**Detection:** Michael asks "wait, which branch is this?" or sends context intended
for Session A to Session B.

**Cost:** Significant rework. Potential conflicts between sessions. High recovery cost.

**Prevention:**
- Maximum 2 active sessions simultaneously for solo operator
- Each session's output must include its branch name in the first line
- Claude detects cross-session context errors and flags immediately (MODE 2 T2)

---

## GATE BATCHING STRATEGIES

The most efficient pattern for M-task (gate) resolution. Instead of resolving gates
one at a time across multiple interactions, batch them.

**Gate batching rules:**

```
BATCH CONDITION 1 — Same tool / same system:
  All gates requiring Supabase dashboard → run in one Supabase session
  All gates requiring wrangler deploy → run in one terminal session
  All gates requiring judgment → answer in one message

BATCH CONDITION 2 — Same session:
  If multiple gates are open across frozen sessions, Claude surfaces all of them
  at session end as a single list. Michael resolves the full list in one sitting.

BATCH CONDITION 3 — Priority ordering within batch:
  Resolve in this order: TIER 0 gates first → then TIER 1 → then TIER 2
  Within same tier: fastest to execute first (SQL run < deploy < judgment call)

BATCH FORMAT (Michael sends one message):
  "M03 done. M07 done. M11: use option B. M14: skip for now."
  Claude processes all four resolutions in one response.
```

**Anti-pattern:** Resolving gates one at a time with full round-trips between each.
One gate = one relay cycle. Four gates = four relay cycles. Batch = one relay cycle.

---

## CONTEXT COMPRESSION PRINCIPLES

When relaying Claude output to another session or back to the same session after a break,
compression quality determines context fidelity.

**The compression contract:**
Every session handoff must include a 3-line context block (not more):

```
LINE 1 — WHAT WAS DONE: [specific shipped action — commit hash or file name]
LINE 2 — WHAT IS KNOWN: [one critical decision or constraint discovered this session]
LINE 3 — WHAT IS NEXT: [exact next action — same as NEXT ACTION in STATUS.md]
```

**Good compression (example):**
```
DONE: wired Supabase persist into employee save modal — commit 3f8a12c
KNOWN: employee_id must be UUID not integer — schema already set this way
NEXT: wire Goals module save handler using same sbSaveEmployee pattern
```

**Bad compression (example):**
```
We worked on the employee module today and fixed some stuff.
There were some schema issues we worked through.
Next we need to do the Goals module stuff.
```

Bad compression loses: what specifically shipped, the key constraint, and the exact next step.
The receiving Claude session will spend 10–20 minutes reconstructing this context.

**Compression failure modes:**
- Omitting the specific commit hash or file (makes DONE unverifiable)
- Including background/history instead of current-state facts
- Vague NEXT action ("continue with the module") vs. specific ("use sbSaveEmployee pattern for Goals")

---

## PROMPT HANDOFF OPTIMIZATION

When Michael composes a prompt to relay to a Claude session, the prompt quality
determines execution quality. On iPhone, prompt composition is constrained.

**iPhone prompt principles:**

```
PRINCIPLE 1 — One directive per prompt
  Bad: "Fix the 400 error and also refactor the worker and update the docs"
  Good: "Fix the worker 400 error. Context: last push was 2dca2a6."

PRINCIPLE 2 — State the constraint explicitly
  Bad: "Continue with the employee module"
  Good: "Continue employee module — only touch js/employees.js, don't modify auth"

PRINCIPLE 3 — Use resume triggers when context exists
  "Resume" alone is enough if STATUS.md + WIP.md are current.
  Do not re-explain context that is already in those files.

PRINCIPLE 4 — Include the M-task resolution inline
  "M03 done — continue from NEXT ACTION."
  Claude knows to check STATUS.md for the full gate context.

PRINCIPLE 5 — Compress authorization signals
  "Go." = proceed as planned, no new constraints
  "Go, skip the tests." = proceed with one explicit exception
  "Stop — wait for input." = pause before next action
```

**Prompt length target on iPhone:**
- Optimal: 1–3 sentences
- Acceptable: 4–6 sentences
- Too long: >6 sentences → compose on desktop or use a structured template

---

## RELAY RESET CONDITIONS

A relay reset is a deliberate pause to re-establish shared context before continuing.

**When to reset:**

```
R1 — AFTER PARALLEL THREAD COLLAPSE (FRAG-6)
     Context has been mixed between sessions. Stop. Triage current state.
     Claude summarizes each active session's true state before resuming.

R2 — AFTER 3+ MODE 2 INTERRUPTIONS
     The directive structure is wrong. Reset with a new framing.
     Michael provides a revised directive. Claude starts clean.

R3 — AFTER OPERATOR SATURATION (ceiling indicators present)
     Michael is overwhelmed. Stop adding work.
     Claude writes a triage summary: active sessions, open gates, frozen debt.
     Michael reviews it in one sitting and makes resolve/abandon decisions.

R4 — AFTER A GOVERNANCE DIVERGENCE FLAG (T3)
     Work has drifted outside authorized scope.
     Hard stop. Claude describes what was done and what is in question.
     Michael confirms scope or resets directive.

R5 — AFTER A MAJOR ARCHITECTURE REVERSAL (T7 acted on)
     The strategic direction changed based on a discovery.
     Previous work may be invalidated. Checkpoint before proceeding.
     Claude commits current state, writes a WIP note on what changed and why.
```

**Relay reset protocol:**

```
STEP 1: Claude writes RELAY_RESET.md (temp file, not committed):
         - All active sessions + their states
         - All open gates
         - All frozen sessions
         - Current queue depth (unblocked vs blocked)
         - What was in-progress at reset point

STEP 2: Michael reviews RELAY_RESET.md on iPhone (5-minute read)

STEP 3: Michael sends one directive:
         "Resume [branch] after M03 done. Abandon [other-branch]. Close [third-branch]."

STEP 4: Claude executes the triage actions, updates STATUS.md, resumes build.

STEP 5: RELAY_RESET.md is deleted (it was a temporary diagnostic, not a permanent doc)
```

---

## MOBILE-FIRST ORCHESTRATION CONSTRAINTS

All orchestration patterns must degrade gracefully to iPhone-only operation.

**The iPhone constraint profile:**
- Input method: touchscreen keyboard or voice
- Typical prompt length composable: 1–4 sentences
- Copy-paste friction: moderate (requires tap-hold-select-copy sequence)
- Context held in working memory: limited (no second screen to reference)
- Session: intermittent (Michael checks in, acts, returns to other work)
- Connectivity: generally reliable but not guaranteed

**Orchestration designs that break on iPhone:**
- Requiring Michael to format a multi-field structured response
- Outputs that require >1 scroll to read before relaying
- Relay sequences requiring sequential prompts with no pause (assumes continuous attention)
- Outputs with >1 copy block (each block = a separate relay action)
- Prompts that depend on Michael remembering details from a prior message not in STATUS.md

**Orchestration designs that work on iPhone:**
- REPLY = YES / NO flag (binary — no interpretation needed)
- Single copy block with complete context (one tap-copy action)
- Resume signals ("resume" / "M## done" / "go") — minimal composition
- Gate batch format ("M03 done. M07 done. M11: option B.") — structured but short
- MODE 2 interruptions that fit in one screen read (~8 lines)

---

## ORCHESTRATION QUALITY SCORING CONCEPTS

These are diagnostic primitives — not a live scoring system.
They define what "good orchestration" looks like so degradation can be detected.

**Signal set (qualitative, per session):**

```
Q1 — RELAY DENSITY
     Ratio of build output to relay cycles. HIGH = more build per relay action.
     Target: >3 committed changes per Michael relay cycle.
     LOW = too much back-and-forth per unit of work produced.

Q2 — CLARIFICATION RATE
     Ratio of Claude questions to Claude outputs. TARGET: <10%.
     HIGH = Claude is not making enough autonomous decisions.

Q3 — MODE 2 FREQUENCY
     Count of strategic interruptions per session. TARGET: 0–2.
     >2 = directive was underspecified or scope was wrong.

Q4 — GATE RESOLUTION SPEED
     Median hours from gate set to gate resolved. TARGET: <12h.
     >48h = relay loop is not flowing; Michael is the bottleneck.

Q5 — CONTEXT FIDELITY AT HANDOFF
     Qualitative: does the receiving session start with correct context?
     Failures appear as: re-doing completed work, contradicting prior decisions.

Q6 — PROMPT COMPLETENESS RATE
     Ratio of prompts that required 0 follow-up clarification to all prompts.
     TARGET: >80%. LOW = Michael's prompts are underspecified on arrival.

Q7 — RELAY RESET FREQUENCY
     Count of relay resets per month. TARGET: 0–1/month.
     >1/month = systemic orchestration design problem.
```

---

## IDEAL RELAY PATTERNS

**Pattern A — AUTONOMOUS RUN (best case)**
```
Michael: "Go."
Claude: [executes 5 BUILD_PLAN items] [commits 5x] [pushes] [updates STATUS.md]
Claude: "→ REPLY: NO — 5 items shipped. NEXT ACTION: starting item 3.6."
Michael: [reads STATUS.md once] [puts phone down]
```
Relay cycles: 1. Build cycles: 5. Ratio: 5:1. Excellent.

**Pattern B — GATE BATCH**
```
Claude: "→ REPLY: YES — 3 gates open: M03 (SQL), M07 (deploy), M11 (judgment)"
Michael: "M03 done. M07 done. M11: use option B."
Claude: [resumes] [executes next 4 items] [no further gates]
Claude: "→ REPLY: NO — 4 items shipped."
```
Relay cycles: 2. Gates resolved: 3. Excellent batch efficiency.

**Pattern C — STRATEGIC INTERRUPT + RESUME**
```
Claude: "⚠ T4 — scope drift: current fix touches 8 files, directive authorized 1."
Michael: "Limit to the one file. Continue."
Claude: [adjusts scope] [executes] [ships]
Claude: "→ REPLY: NO — fix scoped correctly. 1 file changed."
```
Relay cycles: 2 (including the interrupt). Good — interrupt was justified and resolved fast.

---

## BAD RELAY ANTI-PATTERNS

**Anti-Pattern 1 — THE INTERROGATION**
```
Claude: "Before I proceed, can you clarify: (1) which file? (2) which function?
         (3) should I also update the tests? (4) what about the docs?"
Michael: [answers 4 questions] [1 relay cycle burned on clarification alone]
```
Fix: Claude infers (1)(2) from context, does (3) by default, skips (4) — proceeds.

**Anti-Pattern 2 — THE STATUS DUMP**
```
Claude: "I've completed step 1. Now starting step 2. Step 2 involves X and Y and Z.
         I'll also be checking for edge case W. Progress is looking good so far.
         Expected completion in about 3 more steps. Let me know if you have questions."
Michael: [reads 8 lines] [no action required] [attention wasted]
```
Fix: STATUS goes to STATUS.md. Chat output only when REPLY = YES.

**Anti-Pattern 3 — THE AMBIGUITY TRAP**
```
Michael: "Fix the 400 error."
Claude: "I see three possible causes. Option A would involve X. Option B would involve Y.
         Option C is more complex but more robust. Which do you prefer?"
Michael: [must now research and decide what Claude should have inferred]
```
Fix: Claude picks the most likely cause based on context, executes, documents the choice.
If wrong → easy to redirect. Asking first = guaranteed relay friction.

**Anti-Pattern 4 — THE CONTEXT ORPHAN**
```
[Session A ends without writing NEXT ACTION or context block]
[Session B starts]
Michael: "Continue from last session."
Claude: [spends 20 minutes reading files to reconstruct context]
```
Fix: NEXT ACTION is always set before session freeze. Context block always written at wrap.

**Anti-Pattern 5 — THE ESCALATION LADDER**
```
[Session contains 5 MODE 2 interruptions]
Each interruption breaks Michael's flow.
Michael's responses get shorter and lower quality with each one.
Final decision ("just do whatever") is worse than what Claude would have inferred initially.
```
Fix: Cap at 2 MODE 2 triggers per session. 3rd concern → write it to BUILD_INTELLIGENCE.md,
proceed with best inference, surface at session wrap instead.

---

## SITUATIONAL AWARENESS SWITCHING

Michael manages multiple contexts simultaneously: AccentOS build, client work, personal.
Each switch into AccentOS orchestration mode has a cognitive ramp-up cost.

**Minimizing ramp-up cost:**

```
SIGNAL 1 — STATUS.md as the re-entry point
  Michael opens STATUS.md, reads HEALTH + BLOCKED + WIP in 10 seconds.
  Full context restored without reading chat history.
  STATUS.md must always be current enough to serve this function.

SIGNAL 2 — NEXT ACTION as the action trigger
  Michael reads NEXT ACTION and knows immediately what to do.
  No inference required. No chat history review required.

SIGNAL 3 — Gate list as the decision queue
  If CURRENT GATE is set, Michael knows his first action before reading anything else.
  One field → one action → context switch complete.

SIGNAL 4 — MODE 2 as the interrupt signal
  When Claude sends a MODE 2 message, Michael knows this requires more than relay.
  The ⚠ prefix is the visual trigger for "this needs my decision, not just routing."
```

**Switching cost formula (conceptual):**
Cost = (time to find current state) + (time to understand next action) + (time to act)

With STATUS.md current + NEXT ACTION set: cost = <2 minutes.
Without STATUS.md or with stale NEXT ACTION: cost = 10–20 minutes (full context reconstruction).

---

## ORCHESTRATION ERGONOMICS — THE SUMMARY DEFINITION

Good orchestration ergonomics = the relay loop moves more build work through Michael's
finite attention than it consumes.

```
BUILD OUTPUT > RELAY OVERHEAD

Measured by:
  - Relay density (Q1): builds per relay cycle
  - Clarification rate (Q2): Claude decisions vs. questions
  - Gate batch efficiency: gates resolved per relay interaction
  - Ramp-up cost: seconds to full context on re-entry

Achieved by:
  - MODE 1 as default (high throughput, low noise)
  - MODE 2 as exception (high signal, high cost, use sparingly)
  - STATUS.md as the re-entry surface (always current)
  - Context blocks at every handoff (no fidelity loss)
  - Gate batching (minimize resolution round-trips)
  - Claude deciding > Claude asking (FRAG-3 prevention)
  - One copy block per output (iPhone relay = one tap)

Degraded by:
  - Fragmented prompts (FRAG-1)
  - Context loss at handoffs (FRAG-2)
  - Decision cascades (FRAG-3)
  - Status spam (FRAG-4)
  - Ambiguity injection (FRAG-5)
  - Parallel thread collapse (FRAG-6)
  - Excessive MODE 2 triggering (escalation fatigue)
```
