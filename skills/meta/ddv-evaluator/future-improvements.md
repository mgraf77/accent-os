# DDV Evaluator — Future Improvements

Expansion hooks, planned improvements, and the capability roadmap. Items are ordered by expected implementation priority, not by ambition.

**Rule:** Nothing here is pre-built. This file documents intended extension points. Implement each item only when the underlying data or use case justifies it.

---

## Near-term (when real evaluation data exists — after ~10 evaluations)

### 1. Effort weight recalibration

**Current state:** Effort weights are calibrated from reasoning, not data.  
**Target state:** Weights derived from real AccentOS sessions.  
**How:** After 10 evaluations, compute correlation between each effort signal and the resulting delta. Signals with high correlation to outcome get higher weight. Signals with low correlation get lower weight.  
**Trigger:** 10 entries in ddv-log.md.

### 2. Per-artifact-type weight profiles

**Current state:** All artifact types (skills, prompts, workflows) use the same dimension weights.  
**Target state:** Skills weight maintainability and integration_fit higher. Prompts weight accuracy and context_efficiency higher. Workflows weight failure_resilience and scalability higher.  
**How:** Add a `weight_profile` field to the dimension weight table in schema.md, keyed by TargetType.  
**Trigger:** Three or more evaluations of each artifact type.

### 3. Confidence calibration

**Current state:** Confidence penalties are intuition-based.  
**Target state:** Confidence scores are validated against outcome accuracy (did the recommendation turn out to be correct?).  
**How:** After 20+ evaluations, track whether each recommendation was acted on and whether the action produced the predicted outcome. Adjust penalties to match observed calibration.  
**Trigger:** 20 entries in ddv-log.md with followed-through recommendations.

---

## Medium-term (when the AccentOS skill ecosystem has 30+ skills)

### 4. Cross-skill benchmarking

**Current state:** Each evaluation is judged in isolation.  
**Target state:** Scores are contextualized relative to the skill cohort.  
**How:** "This skill scores 79.8, which is 73rd percentile among AccentOS skills evaluated by DDV." Pulls percentile from ddv-log.md aggregates.  
**Design:** Add a `cohort_percentiles` block to the Executive Summary when ≥10 prior evaluations exist in the log.

### 5. Skill cohort grouping

**Current state:** All skills are compared against all other skills.  
**Target state:** Skills compared within natural cohorts (data-query skills vs. automation skills vs. evaluation skills).  
**How:** Add a `skill_cohort` tag to _index.md entries. DDV reads the cohort tag and filters the comparison set accordingly.  
**Trigger:** _index.md entries reach 30+ with manually-assigned cohort tags.

### 6. Optimization priority queue

**Current state:** DDV recommendations are consumed one-at-a-time by whoever triggers an evaluation.  
**Target state:** All CONTINUE_OPTIMIZING and HIGH_PRIORITY_OPTIMIZATION recommendations are aggregated into a priority-ranked queue in BUILD_PLAN_CLAUDE.md.  
**How:** After any DDV evaluation, check ddv-log.md for all open recommendations. Rank by: priority code × velocity × confidence. Write top 5 to a "DDV Optimization Queue" section in BUILD_PLAN_CLAUDE.md.  
**Trigger:** 5+ outstanding CONTINUE_OPTIMIZING recommendations in the log.

---

## Long-term (when session telemetry is available)

### 7. Telemetry-backed cost signals

**Current state:** Cost signals are estimated or manually entered.  
**Target state:** Cost signals are read automatically from Supabase session logs.  
**How:** When AccentOS gains structured session telemetry (token counts, tool call logs, elapsed time per task), DDV reads these directly. Confidence ceiling rises from 95% to 98% for telemetry-backed evaluations.  
**Trigger:** Supabase telemetry table exists and is populated with session data.

### 8. Execution graph analysis

**Current state:** DDV evaluates artifacts as static documents.  
**Target state:** For workflow and orchestration artifacts, DDV can ingest an execution trace (which tools were called, in what order, with what latencies) and score the workflow on its actual runtime behavior, not just its design.  
**How:** Add a `execution_trace: string[]` field to EvaluationInput. When provided, augment failure_resilience, scalability, and automation_value scores from trace data rather than design inference.  
**Trigger:** AccentOS gains execution trace logging for multi-step workflows.

### 9. Multi-agent orchestration scoring

**Current state:** DDV evaluates individual artifacts.  
**Target state:** DDV can evaluate a system of agents — how well they coordinate, where handoffs lose context, where parallelism is underutilized.  
**How:** Add TargetType AGENT_CHAIN. Evaluation input accepts a sequence of agent descriptions and handoff documents. DDV scores the chain on integration_fit (between agents), failure_resilience (handoff quality), and context_efficiency (total context consumed across the chain).  
**Trigger:** AccentOS deploys its first multi-agent workflow with 3+ handoff points.

### 10. Automated skill retirement

**Current state:** Skills are never formally retired — they just stop being used.  
**Target state:** DDV automatically flags skills for retirement when they accumulate DEPRECATE or LOW_RETURN_AREA recommendations across 3 consecutive evaluations.  
**How:** Read the last 3 ddv-log.md entries for each skill. If all 3 recommend DEPRECATE or LOW_RETURN_AREA, create a "Retirement Candidate" entry in a new `meta-evaluations/retirement-queue.md` and surface to Michael at next session start.  
**Trigger:** Any skill reaches 3 consecutive DEPRECATE/LOW_RETURN_AREA recommendations.

### 11. Token economics dashboard

**Current state:** Token costs are estimated in DDV and not tracked over time.  
**Target state:** A running view of token costs by skill, normalized by value delivered.  
**How:** Aggregate token_weight values from ddv-log.md by skill. Plot against result_score to identify high-cost/low-value skills. Surface in bc-business-review or a dedicated Daily Brief tile.  
**Trigger:** Telemetry-backed cost signals are available (depends on item 7).

---

## Recursive capability improvements

### 12. Self-optimization loop

**Current state:** DDV self-evaluates once per version and applies improvements manually.  
**Target state:** DDV applies a structured self-improvement pass after each significant set of real evaluations.  
**How:** After every 10 real evaluations (not self-evaluations), DDV reviews its own recommendation accuracy and calibration. If confidence calibration error > 15%, it triggers a self-improvement pass and increments its own version.  
**Design constraint:** Self-improvement is capped at 3 consecutive passes before requiring Michael's review. Prevents recursive instability.

### 13. Evolutionary optimization systems

**Current state:** Optimization is applied to one artifact at a time.  
**Target state:** DDV can compare multiple optimization trajectories across the skill ecosystem and recommend which artifact will yield the most ecosystem-level value per unit of effort.  
**How:** Given a portfolio of N skills with open optimization opportunities, DDV computes expected ROI for each, ranks them, and recommends the top-3 optimization investments for the current sprint.  
**Trigger:** 15+ skills with DDV evaluation history.

---

## Architecture extensibility notes

The following extension points are already designed into v1 to support the above roadmap:

| Extension point | Where it lives | What it enables |
|---|---|---|
| `TargetType` enum | schema.md | Add new artifact types (AGENT_CHAIN, etc.) without schema redesign |
| `weight_profile` field | schema.md dimension weights | Per-type weight profiles |
| `prior_evaluation` field | EvaluationInput | Acceleration and trend computation already wired |
| `optimization_count` in ROI formula | scoring-logic.md | Diminishing-returns calculation ready to use |
| `cohort_percentiles` placeholder | output-template.md | Cross-skill benchmarking output slot |
| `execution_trace` field | schema.md (designed but not active) | Execution graph analysis when traces available |
| ddv-log.md append-only format | meta-evaluations/ | Aggregation and trend analysis without schema migration |

**Do not implement items from this file without a concrete triggering condition.** The architecture supports them; the data doesn't exist yet.
