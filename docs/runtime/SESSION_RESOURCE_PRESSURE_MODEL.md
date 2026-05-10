# SESSION_RESOURCE_PRESSURE_MODEL
> Conceptual model only. No runtime mutation. No autonomous degradation logic.
> Describes how a single Claude Code session should behave as resource
> pressure rises, and what protects continuity across pressure transitions.
>
> Resource = any combination of: context window remaining, tool-call budget,
> token allowance, time-to-deadline, attention surplus, environmental noise
> (orphan WIP, dirty tree, unrun M-task SQL, conflicting priors).

---

## 0. Why pressure must be modeled separately from progress

Progress models ("which BUILD_PLAN item next?") assume resources are abundant.
Pressure models assume they aren't. Most session degradation is not caused
by hard limits — it's caused by **soft pressure invisible until late**:

- context fills with re-reads of the same file
- the same grep is run three times across the session
- WIP is not checkpointed because "almost done"
- a pattern is reinvented because BUILD_INTELLIGENCE was skimmed
- a doc update is interleaved with a code edit, costing a re-read

The corpus shows a clear signature when these accumulate. This document
names the states, the transitions between them, and the protective
behaviors that should kick in at each level.

It does **not** propose autonomous adaptation. The adaptations described
here are existing OPERATING RULES being made explicit, not new ones.

---

## 1. The four pressure states

| State | Signature | Behavior cap | Default voice |
|---|---|---|---|
| **L0 — low** | Fresh session, clean tree, clear intent | full agency | current vibe-speak mode |
| **L1 — medium** | One pattern reused, one ambiguity | cap exploratory greps | current mode, slightly tighter |
| **L2 — high** | Context >50%, repeated reads, unresolved blocker | clean-freeze acquisition | auto-disengage to `vibe` |
| **L3 — critical** | Context >75%, time pressure, dirty tree | checkpoint-only mode | minimal output |

States are **observed**, not declared. Claude reads pressure signals
implicitly the same way it reads code patterns — by looking for the
signature.

---

## 2. Pressure signals (what to look for)

### L0 → L1 (early warnings)

- A file has been Read twice in the same session.
- A grep returned >20 results and was followed by a more specific grep.
- A BUILD_INTELLIGENCE entry that should apply is not being applied.
- An assumption was made aloud and not confirmed.

### L1 → L2 (acquisition)

- A file has been Read three times.
- The same edit was attempted twice and failed once.
- The session has produced no commit in >15 min of activity.
- A clarification was requested and the answer was ambiguous.
- An M-task dependency was hit but not yet bundled.

### L2 → L3 (containment)

- Context window estimate >75%.
- A retry-loop has triggered ≥2 times on the same operation.
- Dirty tree with >1 uncommitted file and no clear path to commit.
- Cross-module call is failing and the reason is not yet diagnosed.
- Time-to-deadline < expected next-step duration.

These are **heuristics**, not measurements. The point is to recognize
the shape, not to instrument it.

---

## 3. Behavioral transitions

### L0 — low pressure (default)

Standard AccentOS operating rules. Claude operates with full agency:
explore patterns, run audits, defer abstractions, batch doc updates at
session end. This is the assumed mode of every session start.

### L1 — medium pressure

**Tighten without changing direction.**

- Cap exploratory reads — read the file once, hold it in working memory,
  don't re-Read to "double-check".
- Prefer the smallest grep that answers the question, not the broadest.
- If a pattern reuse is unclear, check BUILD_INTELLIGENCE before guessing.
- Single Edit with long old_string > many small Edits (token-efficient).
- Skip TodoWrite for tasks that fit in working memory.

This is the mode used in the v6.10.47–50 token-efficient bundling
sequence. It is a **tactical mode**, not a degradation.

### L2 — high pressure (clean-freeze acquisition)

**Stop adding scope. Acquire a clean state, then decide.**

The "clean-freeze acquisition" sequence:

1. **Stop forward progress.** No new feature edits.
2. **WIP checkpoint immediately**, even if mid-step. Use the literal
   "Next step if interrupted" field.
3. **Commit the cleanest current state.** A `wip:` commit is fine; an
   orphan diff is not.
4. **Auto-disengage vibe-speak to `vibe` mode** for any high-stakes
   communication (security warnings, irreversible-action confirmations,
   SQL output, multi-step sequences with order dependency — per CLAUDE.md).
5. **Re-read WIP and last commit summary.** Decide: continue, hand off,
   or stop.

The goal is not to finish — it's to make the session **safely
interruptible**. A clean-freeze never destroys work; it preserves it.

### L3 — critical pressure (checkpoint-only)

**No new work. Preserve what exists.**

- Only mechanical operations: WIP write, status, commit, push.
- No new code edits, no new schema, no new module wiring.
- No exploratory reads.
- One copy block at the end if mobile handoff is active.
- Hand off explicitly: "session ending here at <step>; resume reads WIP."

L3 is rare and should be designed to be rare. If L3 is being hit
regularly, the **session shape is wrong** (sessions are too long, or
scope per session is too large) and the fix is governance, not
orchestration.

---

## 4. Checkpoint escalation

Checkpoint frequency rises with pressure level. The cost is small; the
value rises with pressure.

| State | WIP write frequency | Commit frequency |
|---|---|---|
| L0 | After each discrete step | Per feature |
| L1 | After each discrete step | Per feature |
| L2 | After every 1–2 file edits | At every clean state |
| L3 | After every operation | Immediately on every clean state |

The principle from BUILD_INTELLIGENCE entry 51: "Default to
over-checkpointing. Better to have a stale WIP than no WIP." This is
a stabilization primitive, and pressure scales it up, never down.

---

## 5. Delegation / routing changes under pressure

Routing cognition (PROCEDURAL_INTELLIGENCE_MODEL_V1 §1, layer 5) becomes
**more conservative** as pressure rises. The bias shifts from "the right
pattern" to "the safest pattern."

| Pressure | Routing bias |
|---|---|
| L0 | Pick the cleanest pattern even if it costs an extraction |
| L1 | Pick the established pattern; defer extractions |
| L2 | Pick the smallest scope that ships value; skip cross-module spawns |
| L3 | No routing — only continuation of in-flight work to a clean state |

Critical: **delegation does not expand under pressure.** Higher pressure
narrows the active surface, never widens it. This is the inverse of the
intuitive "delegate more when overloaded" reflex — in this single-operator
system, delegation is a governance act (who builds what across sessions)
and is Michael's choice, not a pressure response.

A subagent (Agent tool) call is itself a pressure-sensitive decision. At
L0–L1 it can be useful for parallel research. At L2 it adds a coordination
cost (the parent must integrate results) that often exceeds the saving.
**Default**: at L2+, do not spawn subagents unless explicitly authorized.

---

## 6. Entropy containment

Entropy = the gap between session intent and session state. It rises
naturally with time and pressure. Three containment primitives keep it
bounded:

### 6.1 Single source of truth per concern

- Code state: git working tree
- Task state: WORK_IN_PROGRESS.md
- Plan state: BUILD_PLAN_CLAUDE.md
- Lessons: BUILD_INTELLIGENCE.md
- Architecture: MASTER.md
- Module rollout: module_modes.json

When two files disagree, the canonical one wins. Drift between two
files is the most common entropy signature.

### 6.2 Append-only logs for history

PROMPT_LOG, SESSION_LOG, BUILD_INTELLIGENCE, vibe-speak observation-log
are append-only. History is never rewritten because rewriting it
destroys the recoverability the next session depends on.

### 6.3 Doc-update batching

OPERATING RULE — doc-only edits batched into one final commit per
session, separate from code commits. Interleaving causes file-state
re-reads on every code edit. Batching contains the entropy.

Under pressure, all three containment primitives become **more strict**,
not less. L3 in particular is "checkpoint-only" precisely because at L3
the entropy budget is gone — only preservation operations are safe.

---

## 7. Inter-session pressure carryover

Pressure does not reset between sessions automatically. A session that
ended at L2 with a half-finished task imposes that pressure on the next
session unless explicitly cleared.

The existing AccentOS protocol handles this:

1. **Resume rule**: WIP read first → if half-finished, finish before
   moving on.
2. **Orphan-WIP catch**: status.sh first; `git diff` if dirty tree;
   look for "function-name referenced 1× but defined 0×" signature.
3. **PROMPT_LOG verbatim**: replay original intent without guessing.

A session that ends at L0 (clean tree, completed task, WIP shows "no
in-flight work") imposes minimal carryover. A session that ends at L2
imposes full WIP-finish-first carryover.

**Implication**: ending sessions clean is itself a pressure-management
act. The cost (10 minutes of WIP write + commit) buys the next session's
L0 start.

---

## 8. What is explicitly out of scope

This model deliberately does not include:

- Automated pressure detection or threshold instrumentation
- Autonomous mode-switching based on detected pressure
- Token-counting heuristics that feed back into behavior
- Cross-session pressure metrics or dashboards
- Subagent spawning policies under pressure (beyond the L2+ default)

Each of these crosses into governance/runtime-state territory and is
forbidden under the bounded-intelligence-extraction mode this work is
operating in. They are recorded here as future temptation zones (see
DONE/KNOWN/NEXT) so they are not silently absorbed into orchestration.

---

## 9. The pressure invariants

Three claims that must remain true.

1. **Pressure narrows scope; it never widens it.** Higher pressure →
   smaller active surface, more checkpointing, more conservative routing.
2. **Clean-freeze is always an option.** No state is so deep that
   stopping cleanly is unsafe. If it is, the design is wrong.
3. **Pressure response is observable, not declared.** Claude reads
   the signature; Claude does not announce "entering L2 mode."

---

*End of SESSION_RESOURCE_PRESSURE_MODEL.md — conceptual model, no runtime effect.*
