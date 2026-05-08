# DDV Evaluator — Scoring Logic

Deterministic formulas, effort weights, recommendation rules, and risk detection logic.

---

## 1. Effort Unit Computation

Effort units represent the total cost of an optimization pass, normalized into a single comparable value.

### Formulas

```
time_weight        = elapsed_minutes / 30
token_weight       = tokens_consumed / 10000
tool_weight        = tool_calls × 0.15
retry_weight       = retries × 0.5
human_weight       = human_interventions × 1.0
context_weight     = context_switches × 0.4
complexity_weight  = complexity_added × 0.75        # 0–10 scale
maintenance_weight = max(0, maintenance_delta) × 0.6 # only positive delta adds to effort

effort_units = sum of all available weights
```

### Calibration rationale

| Signal | Weight basis |
|---|---|
| time | 30 min = 1 unit — a reasonable focused task |
| tokens | 10k tokens = 1 unit — roughly one solid tool-use exchange |
| tool calls | 0.15/call — a session with 20 tool calls = 3 units overhead |
| retries | 0.5/retry — each failed attempt represents wasted motion |
| human interventions | 1.0/intervention — Michael redirecting costs real attention |
| context switches | 0.4/switch — task-switching overhead |
| complexity added | 0.75/point — complexity is future-effort debt |
| maintenance delta | 0.6/point — ongoing cost amortized over 10 future sessions |

If fewer than 3 signals are provided, append a confidence-cap note: "Confidence capped at 60% — fewer than 3 cost signals available."

### Minimum effort floor

If all signals are zero or missing, set `effort_units = 0.5` to avoid division-by-zero in velocity.

---

## 2. Core Metric Formulas

### Baseline Score and Result Score

```
weighted_sum = Σ (dimension_score × dimension_weight)
overall_score = (weighted_sum / total_weight) × 10

# total_weight = 17.9 (sum of all 15 dimension weights per schema.md)
```

### Delta

```
delta = result_score - baseline_score
```

Positive delta = improvement. Negative delta = regression.

### Velocity

```
velocity = delta / effort_units
```

Velocity > 0: optimization produced improvement per unit of effort.
Velocity < 0: optimization made things worse (regression under effort).
Velocity = 0: no change despite effort (optimization theater territory).

### Acceleration

```
acceleration = velocity_current - velocity_previous
```

Only computable when a prior evaluation log entry exists for this target.

Positive acceleration: optimization is getting more efficient over time.
Negative acceleration: each pass is returning less per unit of effort.
N/A: first evaluation for this target.

### Complexity Drift

```
utility_gained = delta × 0.8   # approximation: not all delta = utility
complexity_drift = complexity_added - utility_gained
```

Positive complexity_drift = complexity growing faster than value.
Negative complexity_drift = value growing faster than complexity (healthy).

When `complexity_added` is not explicitly provided, estimate from the artifact's `complexity_estimate` change between baseline and result states.

### Optimization ROI

```
future_expected_delta = (result_score / 100) × remaining_headroom × 0.5
remaining_headroom = 100 - result_score
future_expected_effort = effort_units × (1 + 0.2 × optimization_count)

optimization_roi = future_expected_delta / future_expected_effort
```

The 0.2 factor captures the typical effort increase per additional optimization pass (diminishing returns in optimization effort itself).

`optimization_count` = number of prior evaluations for this target (from log).

When no prior data exists: use `optimization_roi = (100 - result_score) / 50` as a rough headroom indicator.

### Confidence

Start at 100. Apply penalties:

```
-20 if baseline_score is estimated (no prior evaluation)
-10 if fewer than 3 cost signals available
-10 if optimization_count = 0 (no calibration history)
-5  if target_type is PROMPT (inherently higher variance)
-5  if complexity_added was estimated, not measured
+10 if prior evaluation exists (calibration available)
+5  if all 7 cost signals provided

confidence = clamp(base_confidence, 20, 95)
```

Confidence cannot exceed 95% — the evaluator is a strategic tool, not a measurement instrument.

---

## 3. Recommendation Logic

Recommendations are determined by priority-ordered rules. Apply the first matching rule.

### ROLL_BACK

```
IF delta < -5
THEN ROLL_BACK
```
Evidence: quality regressed meaningfully. The optimization made things worse.

### REWRITE

```
IF (maintainability_result <= 3)
OR (architecture_fragility_detected AND result_score < 60)
THEN REWRITE
```
Evidence: the artifact has reached a structural ceiling and cannot be improved incrementally.

### PROMOTE_TO_CORE

```
IF result_score >= 85
AND maintainability_result >= 8
AND integration_fit_result >= 8
AND scalability_result >= 8
AND risk_flags_high_severity = 0
THEN PROMOTE_TO_CORE
```
Evidence: artifact is production-grade and would benefit the entire ecosystem.

### HIGH_PRIORITY_OPTIMIZATION

```
IF result_score < 60
AND optimization_roi > 3.0
AND velocity > 5
THEN HIGH_PRIORITY_OPTIMIZATION
```
Evidence: significant headroom + demonstrated efficiency = high-value target.

### CONTINUE_OPTIMIZING

```
IF delta >= 15
AND velocity >= 5
AND (acceleration > 0 OR acceleration IS NULL)
AND complexity_drift < 2.0
THEN CONTINUE_OPTIMIZING
```
Evidence: optimization is producing meaningful results efficiently with no complexity alarm.

### SIMPLIFY

```
IF complexity_drift > 3.0
OR (complexity_added > utility_gained BY 2+ points)
THEN SIMPLIFY
```
Evidence: complexity is outpacing value. Refactoring will pay off.

### PAUSE

```
IF delta < 5
AND effort_units > 2.0
THEN PAUSE
```
Evidence: small gains at high cost. Optimization budget better spent elsewhere.

### DEPRECATE

```
IF result_score < 30
AND optimization_roi < 0.5
AND optimization_count >= 3
THEN DEPRECATE
```
Evidence: three passes have failed to bring the artifact above threshold.

### FORK_VARIANT

```
IF result_score >= 70
AND scalability_result < 6
AND reusability_result < 6
AND target has 2+ distinct use patterns
THEN FORK_VARIANT
```
Evidence: the artifact is good but has grown too specialized. Two focused variants would outperform one bloated general case.

### MERGE

```
IF target SHARES > 60% of logic with another artifact in the same skill family
AND both artifacts score >= 70
THEN MERGE
```
Evidence: redundant artifacts with overlapping logic; consolidation reduces maintenance burden.

### LOW_RETURN_AREA

```
IF delta > 0
AND velocity < 2
AND acceleration <= 0
THEN LOW_RETURN_AREA
```
Evidence: optimization is technically improving but at a declining rate that doesn't justify continued focus.

### REQUIRES_HUMAN_REVIEW

```
IF confidence < 40
OR (risk_flags contain RECURSIVE_INSTABILITY or OPTIMIZATION_OVERFITTING)
OR (recommendation is ambiguous — two rules trigger simultaneously)
THEN REQUIRES_HUMAN_REVIEW
```
Evidence: the evaluator lacks sufficient data or the situation is structurally unusual.

---

## 4. Risk Detection Logic

### COMPLEXITY_CREEP

```
TRIGGER IF: complexity_drift > 1.5 across 2+ consecutive evaluations
SEVERITY:   HIGH if drift > 3.0, MEDIUM otherwise
EVIDENCE:   complexity_drift values from current and prior evaluations
```

### ABSTRACTION_BLOAT

```
TRIGGER IF: number of abstraction layers added in this pass > 2
            AND delta < 10
SEVERITY:   MEDIUM
EVIDENCE:   artifact structure change description
```

### RECURSIVE_INSTABILITY

```
TRIGGER IF: target_type = SELF
            AND optimization_count > 3
            AND acceleration is consistently negative
SEVERITY:   HIGH
EVIDENCE:   acceleration trend from last 3 evaluations
```

### OPTIMIZATION_OVERFITTING

```
TRIGGER IF: result_score improves on training cases
            BUT generalization_score (estimated from test cases) < result_score - 15
SEVERITY:   HIGH
EVIDENCE:   test case performance vs main score gap
```

### CONTEXT_INFLATION

```
TRIGGER IF: artifact token footprint grew > 40% between baseline and result
            AND context_efficiency_delta < 0
SEVERITY:   MEDIUM
EVIDENCE:   token count estimates for artifact
```

### TOKEN_INEFFICIENCY

```
TRIGGER IF: token_weight > 3.0 (>30k tokens consumed for this pass)
            AND delta < 10
SEVERITY:   MEDIUM
EVIDENCE:   tokens_consumed and resulting delta
```

### ARCHITECTURE_FRAGMENTATION

```
TRIGGER IF: integration_fit_delta < -2
            OR artifact introduces dependencies on 3+ external artifacts
SEVERITY:   HIGH if integration_fit_result < 5, MEDIUM otherwise
EVIDENCE:   dependency list
```

### DUPLICATED_FUNCTIONALITY

```
TRIGGER IF: artifact replicates logic already present in another skill
            in _index.md with > 60% overlap
SEVERITY:   MEDIUM
EVIDENCE:   overlapping skill names and shared behaviors
```

### OPTIMIZATION_THEATER

```
TRIGGER IF: effort_units > 3.0
            AND delta < 3
            AND velocity < 1
SEVERITY:   HIGH
EVIDENCE:   effort_units and delta values
```

### HIDDEN_MAINTENANCE_COST

```
TRIGGER IF: maintainability_delta < -2
            OR maintenance_delta > 2.0
SEVERITY:   MEDIUM
EVIDENCE:   maintainability dimension scores
```

### ORCHESTRATION_BOTTLENECK

```
TRIGGER IF: target_type is ORCHESTRATION_SYSTEM or WORKFLOW
            AND failure_resilience_result < 5
            AND scalability_result < 5
SEVERITY:   HIGH
EVIDENCE:   failure_resilience and scalability scores
```

### BRITTLE_DEPENDENCY_CHAIN

```
TRIGGER IF: artifact depends on > 4 external artifacts
            AND failure_resilience_result < 6
SEVERITY:   MEDIUM
EVIDENCE:   dependency count and failure_resilience score
```

---

## 5. Confidence Floor Rules

The evaluator applies these floors before outputting any confidence-dependent recommendation:

- If confidence < 40 → override recommendation to REQUIRES_HUMAN_REVIEW
- If confidence < 60 → add warning: "Score estimates should be validated with direct measurement before acting on this recommendation"
- If confidence = 95 → this is the maximum; do not claim higher
