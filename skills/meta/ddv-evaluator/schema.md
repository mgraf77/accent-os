# DDV Evaluator — Schema

Data structures for all evaluation inputs, outputs, and log entries.

---

## 1. Evaluation Input

```
EvaluationInput {
  target_name:       string          # e.g. "vendor-cascade", "Ralph loop v3", "self"
  target_type:       TargetType      # see enum below
  target_path:       string?         # file path if applicable
  baseline_state:    StateSnapshot?  # prior version; null = first evaluation
  result_state:      StateSnapshot   # current version being evaluated
  cost_signals:      CostSignals     # what the transition cost
  context_notes:     string?         # optional context from the caller
  prior_evaluation:  LogEntry?       # previous DDV log entry for this target, if any
}

TargetType:
  SKILL | PROMPT | OPTIMIZATION_PASS | WORKFLOW | BUILD_PLAN |
  HANDOFF_PIPELINE | ORCHESTRATION_SYSTEM | SELF
```

---

## 2. State Snapshot

A snapshot of an artifact at a point in time. Used for both baseline and result.

```
StateSnapshot {
  version:              string?     # e.g. "v1", "v2.3", "post-ralph-3"
  description:          string      # one-sentence characterization
  quality_signals:      string[]    # observable indicators of quality
  complexity_estimate:  0..10       # subjective complexity rating
  maintenance_burden:   0..10       # estimated ongoing maintenance cost
  known_weaknesses:     string[]    # gaps identified at this point in time
  timestamp:            date?       # when this state was captured
}
```

---

## 3. Cost Signals

Raw inputs to the effort computation. All fields optional; omit what is unknown.

```
CostSignals {
  elapsed_minutes:         float?    # wall-clock time for the optimization pass
  tokens_consumed:         int?      # total tokens in + out for the pass
  tool_calls:              int?      # total tool invocations
  retries:                 int?      # failed attempts before success
  human_interventions:     int?      # times Michael stepped in to redirect
  context_switches:        int?      # times the task had to pause and re-orient
  complexity_added:        float?    # 0–10 estimate of complexity introduced
  maintenance_delta:       float?    # -5..+5 estimated change in maintenance burden
}
```

---

## 4. Dimension Score

```
DimensionScore {
  dimension:   DimensionName   # one of the 15 defined dimensions
  baseline:    0..10           # score before optimization
  result:      0..10           # score after optimization
  delta:       float           # result - baseline
  notes:       string          # brief evidence or rationale
}

DimensionName (15 total):
  OUTPUT_QUALITY | ACCURACY | COMPLETENESS | REUSABILITY | MODULARITY |
  AUTOMATION_VALUE | HUMAN_BURDEN_REDUCTION | MAINTAINABILITY |
  INTEGRATION_FIT | SCALABILITY | ADAPTABILITY | COMPLEXITY_EFFICIENCY |
  OPTIMIZATION_POTENTIAL | FAILURE_RESILIENCE | CONTEXT_EFFICIENCY
```

---

## 5. Core Metrics

Computed from dimension scores and cost signals.

```
CoreMetrics {
  baseline_score:       float    # weighted avg of baseline dimension scores × 10
  result_score:         float    # weighted avg of result dimension scores × 10
  delta:                float    # result_score - baseline_score
  effort_units:         float    # computed from CostSignals via weight formulas
  velocity:             float    # delta / effort_units (infinity if effort = 0)
  acceleration:         float?   # velocity - prior_velocity (null if no prior eval)
  complexity_drift:     float    # complexity_added - utility_gained
  optimization_roi:     float?   # future_expected_delta / future_expected_effort
  confidence:           0..100   # pct confidence based on data completeness
}
```

### Effort weights (default)

These are the multipliers applied to each raw cost signal to produce effort_units.

```
time_weight        = elapsed_minutes / 30
token_weight       = tokens_consumed / 10000
tool_weight        = tool_calls × 0.15
retry_weight       = retries × 0.5
human_weight       = human_interventions × 1.0
context_weight     = context_switches × 0.4
complexity_weight  = complexity_added × 0.75
maintenance_weight = maintenance_delta × 0.6   # positive = more burden added
```

`effort_units = sum of all applicable weights`

If fewer than 3 cost signals are available, confidence is capped at 60%.

---

## 6. Risk Flag

```
RiskFlag {
  risk_class:   RiskClass    # one of 12 defined classes
  severity:     LOW | MEDIUM | HIGH
  evidence:     string       # what triggered this flag
  recommended_action: string
}

RiskClass:
  COMPLEXITY_CREEP | ABSTRACTION_BLOAT | RECURSIVE_INSTABILITY |
  OPTIMIZATION_OVERFITTING | CONTEXT_INFLATION | TOKEN_INEFFICIENCY |
  ARCHITECTURE_FRAGMENTATION | DUPLICATED_FUNCTIONALITY |
  OPTIMIZATION_THEATER | HIDDEN_MAINTENANCE_COST |
  ORCHESTRATION_BOTTLENECK | BRITTLE_DEPENDENCY_CHAIN
```

---

## 7. Recommendation

```
Recommendation {
  primary:     RecommendationCode   # exactly one
  rationale:   string               # 2–4 sentence justification
  secondary:   string[]?            # up to 2 supporting observations
}

RecommendationCode:
  CONTINUE_OPTIMIZING | PROMOTE_TO_CORE | SIMPLIFY | FORK_VARIANT |
  MERGE | PAUSE | ROLL_BACK | DEPRECATE | REWRITE |
  REQUIRES_HUMAN_REVIEW | HIGH_PRIORITY_OPTIMIZATION | LOW_RETURN_AREA
```

---

## 8. Evaluation Report

The full output of a DDV evaluation. Rendered per `output-template.md`.

```
EvaluationReport {
  target_name:          string
  target_type:          TargetType
  evaluation_date:      date
  core_metrics:         CoreMetrics
  dimension_scores:     DimensionScore[15]
  risk_flags:           RiskFlag[]
  recommendation:       Recommendation
  next_action:          string       # one concrete next step
  skill_memory_update:  string       # compact entry for target's changelog
  confidence:           int          # 0–100
}
```

---

## 9. Log Entry (ddv-log.md)

Compact format appended to `/home/user/accent-os/meta-evaluations/ddv-log.md` after every evaluation.

```
## [YYYY-MM-DD] [Target Name] v[Version]
- Parent Skill:          [skill that triggered this evaluation, or "manual"]
- Task Type:             [TargetType]
- Baseline:              [baseline_score]
- Result:                [result_score]
- Delta:                 [delta]
- Velocity:              [velocity]
- Acceleration:          [acceleration or "N/A — first evaluation"]
- Complexity Drift:      [complexity_drift]
- Recommendation:        [RecommendationCode]
- Confidence:            [confidence]%
- Next Action:           [next_action]
- Notes:                 [any notable context]
```

---

## 10. Dimension Weights

Used to compute weighted overall score from 15 dimension scores.

Higher weight = more influence on the overall score.

```
Dimension                  Weight
OUTPUT_QUALITY             1.5
ACCURACY                   1.5
COMPLETENESS               1.2
REUSABILITY                1.2
MODULARITY                 1.0
AUTOMATION_VALUE           1.3
HUMAN_BURDEN_REDUCTION     1.3
MAINTAINABILITY            1.4
INTEGRATION_FIT            1.1
SCALABILITY                1.0
ADAPTABILITY               1.0
COMPLEXITY_EFFICIENCY      1.3
OPTIMIZATION_POTENTIAL     0.8
FAILURE_RESILIENCE         1.1
CONTEXT_EFFICIENCY         1.2
```

Total weight = 17.9. Weighted sum / 17.9 = weighted average (0–10). Multiply by 10 = overall score (0–100).
