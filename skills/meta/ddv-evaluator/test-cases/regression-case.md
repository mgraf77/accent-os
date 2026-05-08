# Test Case: Regression Case

**Scenario:** An optimization pass was intended to improve context efficiency but instead broke the skill's core accuracy. The result is worse than the baseline.

**Purpose of this test case:** Verify that DDV correctly detects a regression and produces ROLL_BACK without hesitation, even when the stated optimization goal (context efficiency) was partially achieved.

---

## Input

```
target_name:    "bc-business-review"
target_type:    SKILL
target_path:    skills/bc-business-review/

baseline_state:
  version:              "v2.1"
  description:          "Generates weekly Accent Lighting business review. Covers revenue, AOV, top vendors, anomalies. Known issue: prompt is verbose — 4200 tokens in the system prompt."
  quality_signals:
    - "produces accurate KPI summaries"
    - "anomaly detection works for 90% of cases"
    - "works correctly in full-context sessions"
    - "heavy system prompt (~4200 tokens)"
  complexity_estimate:  5
  maintenance_burden:   4
  known_weaknesses:
    - "system prompt is heavy — may cause issues in compressed context sessions"
  timestamp:            "2026-05-01"

result_state:
  version:              "v2.2"
  description:          "Compressed system prompt to 2100 tokens by removing example outputs and some behavioral guardrails. Context efficiency improved but key guardrails were removed."
  quality_signals:
    - "system prompt is now 2100 tokens (50% reduction)"
    - "anomaly detection now misses 35% of cases (removed guardrail logic)"
    - "KPI summaries are less precise — missing revenue breakdown by channel"
    - "context efficiency goal achieved"
  complexity_estimate:  4
  maintenance_burden:   3
  known_weaknesses:
    - "anomaly detection accuracy dropped from 90% to 65%"
    - "missing channel revenue breakdown"
    - "removed guardrails that prevented hallucinated vendor names"
  timestamp:            "2026-05-08"

cost_signals:
  elapsed_minutes:       40
  tokens_consumed:       19000
  tool_calls:            16
  retries:               0
  human_interventions:   0
  context_switches:      0
  complexity_added:      -1.5    (removed content — negative)
  maintenance_delta:     -1.0    (simpler = easier to maintain — negative)
```

---

## Expected computation

```
effort_units:
  40/30 = 1.33
  19000/10000 = 1.90
  16 × 0.15 = 2.40
  0 + 0 + 0
  -1.5 × 0.75 = -1.13  (complexity removed — reduces effort burden)
  max(0, -1.0) × 0.6 = 0.00  (maintenance improved — no effort added)
  total = 4.50

baseline_score:   ~81.2  (estimated from strong prior performance)
result_score:     ~66.8  (significant drop in accuracy and completeness)
delta:            -14.4
velocity:         -14.4 / 4.50 = -3.20
```

---

## Expected dimension scores

| Dimension | Baseline | Result | Expected Delta | Rationale |
|---|---|---|---|---|
| Output Quality | 8.5 | 6.5 | -2.0 | Reports are less complete |
| Accuracy | 8.0 | 5.0 | -3.0 | 65% anomaly detection vs 90% — major regression |
| Completeness | 8.0 | 5.5 | -2.5 | Channel revenue breakdown removed |
| Reusability | 7.5 | 7.5 | 0.0 | No change |
| Modularity | 7.0 | 7.0 | 0.0 | No change |
| Automation Value | 8.5 | 6.5 | -2.0 | Less accurate reports reduce automation value |
| Human Burden Reduction | 8.0 | 6.0 | -2.0 | Michael must now manually verify anomalies |
| Maintainability | 7.5 | 8.0 | +0.5 | Simpler prompt is easier to edit |
| Integration Fit | 8.0 | 8.0 | 0.0 | No change |
| Scalability | 8.0 | 8.0 | 0.0 | No change |
| Adaptability | 7.5 | 7.5 | 0.0 | No change |
| Complexity Efficiency | 7.5 | 8.0 | +0.5 | Leaner prompt — but the gains are hollow |
| Optimization Potential | 5.0 | 7.0 | +2.0 | More headroom now (but this is bad news) |
| Failure Resilience | 7.0 | 4.5 | -2.5 | Removed guardrails = more failure modes |
| Context Efficiency | 6.5 | 9.0 | +2.5 | 50% token reduction achieved |

---

## Expected recommendation

**ROLL_BACK**

Logic path:
- delta = -14.4 < -5 → ROLL_BACK triggers immediately.

The context_efficiency improvement (+2.5) is real, but it does not offset the accuracy and completeness regressions. The optimization achieved its stated instrumental goal while destroying the artifact's fundamental purpose.

---

## Expected risk flags

**OPTIMIZATION_THEATER** — HIGH  
Evidence: The optimization optimized a proxy metric (prompt token count) while degrading the primary metrics (accuracy, completeness). Effort was spent making the artifact smaller, not better.

**HIDDEN_MAINTENANCE_COST** — MEDIUM  
Evidence: Removing guardrails reduces maintenance burden now but creates maintenance cost when the hallucinated vendor name issue resurfaces in production. Hidden cost is deferred, not eliminated.

---

## Expected Optimization Trajectory narrative

The trajectory narrative must explain that this is not a case of diminishing returns — it is a regression caused by optimizing the wrong target. The baseline was strong (81.2). The current result (66.8) represents a step backwards, not a plateau. The correct response is reverting the compression changes and instead applying surgical compression that targets filler prose, not behavioral content.

---

## Expected next action

"Revert v2.2 to v2.1 immediately; then apply targeted compression: tighten example output prose (-500 tokens) without touching anomaly detection logic or revenue breakdown guardrails."

---

## Pass/fail criteria for this test case

| Check | Pass condition |
|---|---|
| Primary recommendation | ROLL_BACK |
| delta sign detected | Negative (regression confirmed) |
| Context efficiency improvement acknowledged | Yes — mention the +2.5 improvement while still recommending rollback |
| OPTIMIZATION_THEATER flag | Present with HIGH severity |
| Trajectory narrative | Explicitly distinguishes regression from diminishing returns |
| Next action | Identifies reverting v2.2 AND a safer compression strategy |

---

## Critical behavior to verify

The evaluator must not be swayed by partial improvements. Context efficiency improved (+2.5) and maintainability improved (+0.5). But the overall delta is -14.4. ROLL_BACK must fire based on delta, regardless of which individual dimensions improved. The report should acknowledge the partial improvements honestly while being unambiguous about the recommendation.
