---
name: brainstorm-build-handoff
description: >
  Transforms rough ideas, fragmented brainstorming, and partially formed concepts
  into deterministic, implementation-ready build handoff documents. Runs a 5-phase
  pipeline: concept extraction → systems analysis → failure/entropy analysis →
  Ralph loop optimization → MVP reduction + handoff generation. Outputs a structured
  markdown handoff suitable for Claude Code, Codex, engineering teams, or autonomous
  agent execution. Trigger when Michael says: "turn this brainstorm into a build plan",
  "take my idea and structure it", "make this buildable", "convert this concept into
  a handoff", "clean up my brainstorm", "what's the MVP of this", "write a build plan
  for this idea", or any phrasing that moves from fuzzy concept to execution-ready spec.
---

# brainstorm-build-handoff

**Purpose:** Convert ambiguous input (ideas, transcripts, bullet dumps, rough specs) into a deterministic build handoff that another AI, engineer, or agent can execute without clarification.

Five phases in order: **extract → analyze → audit → optimize → handoff**. Every phase runs. The Ralph loop (Phase 4) is non-negotiable — minimum 3 passes. The handoff is the only deliverable; intermediate phase outputs are working memory, not published artifacts.

---

## Philosophy

This skill is infrastructure, not a brainstorming assistant. It operates like a systems architect reviewing a napkin sketch:
- It assumes the original idea has hidden assumptions worth challenging
- It assumes the obvious implementation is not the right implementation
- It treats ambiguity as a defect to be eliminated
- It treats complexity as a cost to be justified

The output must be usable by someone who was not in the original brainstorm. If it requires explanation to execute, it failed.

---

## Trigger Recognition

Run this skill when Michael says:
- "turn this brainstorm into a build plan"
- "make this buildable"
- "take my idea and structure it"
- "write a build plan for [X]"
- "what's the MVP of [X]"
- "convert this to a handoff"
- "clean up my brainstorm"
- "give this to Claude Code"
- "structure this for Codex"
- Any phrasing that moves from idea → execution

**Do NOT trigger** for pure design discussion, technology evaluation, or when Michael just wants to think out loud (offer to capture for later instead).

---

## Input Formats Accepted

- Free-form text (stream of consciousness, meeting notes, Slack dump)
- Bullet lists (structured or unstructured)
- Existing markdown documents (PRDs, specs, design docs)
- Conversation transcripts
- Single-sentence ideas
- Partially completed designs

---

## Execution Pipeline

### PHASE 1 — Concept Extraction

Extract the signal from the noise. Read the full input without acting on it first.

Produce a `concept-extraction` artifact with:

```json
{
  "true_objective": "What is actually being built? Strip the framing.",
  "system_category": "workflow | data-pipeline | UI | skill | agent | API | infra | other",
  "operational_goals": ["goal1", "goal2"],
  "constraints": {
    "explicit": ["stated constraints"],
    "implied": ["inferred constraints the user didn't say"]
  },
  "hidden_assumptions": ["assumption1", "assumption2"],
  "out_of_scope": ["what this is definitely NOT"]
}
```

Do not proceed with an assumption if it's genuinely ambiguous — surface it in `hidden_assumptions` and pick the most conservative reading.

---

### PHASE 2 — Systems Analysis

Map the system structure. Don't think in features — think in entities, workflows, and state.

Produce a `systems-analysis` artifact:

```json
{
  "entities": [
    { "name": "EntityName", "role": "what it does", "owns": ["data or state"] }
  ],
  "workflows": [
    { "name": "WorkflowName", "steps": ["step1", "step2"], "trigger": "what starts it", "terminal": "what ends it" }
  ],
  "state": [
    { "name": "StateName", "owner": "entity", "transitions": ["state1 → state2"] }
  ],
  "dependencies": ["external systems, APIs, files, services"],
  "governance": "who controls what, what needs authorization",
  "scaling_axis": "what grows as usage grows"
}
```

If a workflow can't be expressed in steps, it's not a workflow — it's a vague goal. Flag it.

---

### PHASE 3 — Failure + Entropy Analysis

Actively look for what will go wrong. This is an adversarial phase.

Produce a `failure-analysis` artifact:

```json
{
  "bottlenecks": ["where throughput or progress collapses"],
  "ambiguity_defects": ["things that will require clarification mid-build"],
  "token_explosion_risks": ["prompts or contexts that will blow up in AI execution"],
  "orchestration_drift": ["places where multiple agents/components will get out of sync"],
  "governance_failures": ["where authorization or ownership is undefined"],
  "overengineering_risks": ["complexity that wasn't asked for and won't be needed"],
  "maintainability_risks": ["things that will be painful to change in 6 months"],
  "missing_implementation_detail": ["gaps that block a builder from starting"]
}
```

Every item in `missing_implementation_detail` blocks the handoff. Resolve them in Phase 4 or call them out explicitly in the handoff as **OPEN ITEMS**.

---

### PHASE 4 — Ralph Loop Optimization

Run minimum 3 optimization passes. Each pass: critique → simplify → improve.

**Pass structure:**

```
PASS N
  Critique: [what's wrong with the current design]
  Simplify: [what can be removed or collapsed]
  Improve: [specific architectural or workflow improvement]
  Delta: [what changed vs previous pass]
```

Target each pass at a different axis:
- Pass 1: **Workflow correctness** — are the steps right? are triggers and terminals defined?
- Pass 2: **Entropy reduction** — what's ambiguous, duplicated, or undefined?
- Pass 3: **MVP boundary** — what's essential vs speculative?

Additional passes if any `missing_implementation_detail` items remain unresolved after Pass 3.

Stop when:
- No new critiques surface
- All `ambiguity_defects` are resolved or explicitly flagged as OPEN ITEMS
- MVP boundary is agreed upon

---

### PHASE 5 — MVP Reduction + Build Handoff Generation

Produce the final artifact: a single markdown document suitable for direct executor consumption.

Use the template at `templates/build-handoff.md`.

The handoff must contain:
- **Objective** — one paragraph, no ambiguity
- **Constraints** — what is out of scope, what cannot be changed
- **Architecture** — entities, key workflows, state diagram in text
- **Implementation Order** — phases with clear entry/exit criteria
- **Validation Gates** — how to know each phase succeeded
- **Operating Rules** — behavioral constraints for the builder
- **Open Items** — unresolved decisions (must be minimal)
- **What NOT to Build** — explicit exclusion list
- **Next Phase** — first recommended follow-on after MVP

---

## Output Contract

The handoff document is the only required output.

Intermediate phase artifacts (concept-extraction, systems-analysis, failure-analysis, optimization passes) are working memory. Surface them only if Michael asks or if they contain something he needs to decide.

Final response format:
1. Handoff document (full)
2. 4-bullet summary: architecture improvements, simplifications, tradeoffs, remaining risks
3. Scaling path (1 paragraph)
4. What NOT to build yet (bullet list)

Then stop.

---

## Behavioral Constraints

- Do NOT ask for clarification mid-pipeline. Resolve ambiguity via the most conservative assumption. Surface it as an OPEN ITEM.
- Do NOT expand scope beyond the input. Identify opportunities but don't build them.
- Do NOT narrate phase transitions. Deliver the handoff.
- Do NOT produce prompt soup — no transcript dumps, no conversational artifacts in the handoff.
- DO aggressively challenge the original design.
- DO prefer simple implementations over elegant ones when both satisfy the objective.
- DO call out overengineering explicitly, even if the original input asked for it.

---

## Companion Skills

- `skill-forge` — when the input is an external tool/methodology to adapt
- `priority-articulation` — when the input is a list of competing ideas
- `decision-log` — for capturing architectural decisions made during Phase 4
- `build-plan-status` — for tracking implementation progress post-handoff
