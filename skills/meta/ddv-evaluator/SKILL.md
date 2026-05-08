---
name: ddv-evaluator
description: >
  Universal meta-evaluation framework that measures the quality, efficiency, and
  optimization trajectory of any AccentOS system artifact: skills, prompts, optimization
  passes, workflows, agent chains, Ralph loops, handoff pipelines, build plans, and
  orchestration flows. Applies the DDV (Derivative Delta Velocity) model — previous state
  → current state → delta → velocity → acceleration — and produces a structured evaluation
  report with a strategic recommendation (CONTINUE_OPTIMIZING, PROMOTE_TO_CORE, SIMPLIFY,
  PAUSE, ROLL_BACK, REWRITE, DEPRECATE, etc.). Integrates into the Optimization Skill
  pipeline automatically when an optimization pass completes. Also evaluates itself
  recursively. Use when Michael says: "evaluate this skill", "is this worth optimizing
  further", "what's the ROI on this", "score this pass", "should we keep iterating",
  "is this diminishing returns", "DDV check", "optimization score", or any phrasing
  that asks whether continued investment in a system artifact is justified.
---

# ddv-evaluator

**Purpose:** Every skill changes state. This skill asks: was that change worth it, is the trajectory improving, and what should happen next? Not a scoring toy — a strategic optimization intelligence layer that sits beneath all future optimization work in AccentOS.

**Scope:** Skills, prompts, optimization passes, workflows, agent chains, Ralph loops, handoffs, build plans, autonomous execution flows, orchestration systems. The evaluator is itself evaluatable.

---

## Trigger Recognition

Run when Michael says:
- "evaluate this skill" / "eval [skill name]"
- "is this worth optimizing further"
- "what's the ROI on this optimization"
- "score this [pass/skill/workflow/prompt]"
- "should we keep iterating on [X]"
- "is this diminishing returns"
- "DDV check" / "ddv score"
- "optimization score for [X]"
- "should we promote [X] to core"
- "is [X] ready for production"

**Auto-trigger:** Fires automatically when the Optimization Skill completes a pass (see `integration-guide.md`).

---

## Step 0 — Identify the target artifact

Accept one of:
- A skill name (e.g. `vendor-cascade`)
- A skill path (e.g. `skills/vendor-cascade/`)
- A prompt or prompt template (inline or file path)
- A workflow description (inline or reference to a SKILL.md step)
- An optimization pass reference (e.g. "the Ralph loop we just ran")
- A build plan section or task ID
- "self" → evaluate the DDV Evaluator itself

If the target is ambiguous, pick the most likely interpretation given conversation context. State the choice and continue.

---

## Step 1 — Gather baseline and result state

For skills: read the target's SKILL.md + changelog.md + gotcha-log.md (if present).

For optimization passes: read the before/after artifacts and the optimization log entry.

For prompts: read the prior version and current version.

For self-evaluation: use the build session state as both baseline (pre-build) and result (post-build).

Extract:
- Prior state quality indicators (if available from changelog or log)
- Current state quality indicators
- Cost incurred to reach current state (tokens, tool calls, time, retries, human interventions)

If prior state data is unavailable, note this and set baseline_score to a reasonable estimate based on artifact maturity signals (e.g. "no changelog = first version, baseline = 0").

---

## Step 2 — Score all 15 evaluation dimensions

Per `evaluation-rubric.md`. Each dimension scored 0–10.

Score both baseline and result for each dimension.

Compute per-dimension delta.

---

## Step 3 — Compute core metrics

Per `scoring-logic.md`.

Compute:
1. baseline_score (weighted average of baseline dimension scores)
2. result_score (weighted average of result dimension scores)
3. delta
4. effort_units (weighted sum of cost signals)
5. velocity (delta / effort_units)
6. acceleration (current_velocity − previous_velocity, if prior velocity on record)
7. complexity_drift (complexity_added − utility_gained)
8. optimization_roi (future_expected_delta / future_expected_effort)
9. confidence (based on data availability and signal strength)

---

## Step 4 — Detect risk flags

Per the risk catalog in `scoring-logic.md`. Scan for:
- complexity creep
- abstraction bloat
- recursive instability
- optimization overfitting
- context inflation
- token inefficiency
- architecture fragmentation
- duplicated functionality
- optimization theater
- hidden maintenance costs
- orchestration bottlenecks
- brittle dependency chains

Flag any detected. Include evidence.

---

## Step 5 — Generate recommendation

Per the recommendation logic in `scoring-logic.md`.

Output exactly one primary recommendation from the allowed set:
CONTINUE_OPTIMIZING / PROMOTE_TO_CORE / SIMPLIFY / FORK_VARIANT / MERGE / PAUSE / ROLL_BACK / DEPRECATE / REWRITE / REQUIRES_HUMAN_REVIEW / HIGH_PRIORITY_OPTIMIZATION / LOW_RETURN_AREA

Include up to two secondary observations.

---

## Step 6 — Render the report

Per `output-template.md`. No deviations from the report structure.

---

## Step 7 — Log to ddv-log.md

Append a compact entry to `/home/user/accent-os/meta-evaluations/ddv-log.md`.

Format per `schema.md` log-entry spec.

---

## Step 8 — Update skill memory (for skill evaluations)

If the target is a skill, append a Skill Memory Update entry to the target's own `changelog.md` (or create one if missing).

---

## Anti-patterns

- **Never** produce a score without showing dimension breakdown. A single number is meaningless.
- **Never** recommend PROMOTE_TO_CORE when maintainability < 7 or integration_fit < 6.
- **Never** recommend CONTINUE_OPTIMIZING when acceleration is negative and velocity < 3. That's optimization theater.
- **Never** skip the risk flag scan. Hidden risks are the most expensive kind.
- **Never** use made-up baseline scores without disclosing the estimate and its basis.
- **Never** conflate effort_units with wall-clock time alone. Token cost and human intervention weight more in the AccentOS context.

---

## Output blocks

```
═══ DDV EVALUATION REPORT ═══
[Executive Summary table]

═══ DIMENSION ANALYSIS ═══
[15-dimension table]

═══ OPTIMIZATION TRAJECTORY ═══
[Narrative: compounding or diminishing, with velocity/acceleration evidence]

═══ COMPLEXITY ANALYSIS ═══
[Narrative: is complexity growth justified]

═══ RISK FLAGS ═══
[Detected flags with evidence]

═══ STRATEGIC RECOMMENDATION ═══
[Primary recommendation + rationale]

═══ NEXT ACTION ═══
[Highest-leverage next step]

═══ SKILL MEMORY UPDATE ═══
[Compact memory entry for changelog]
```
