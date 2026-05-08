# Test Case: Diminishing Returns

**Scenario:** A skill has been optimized five times. Each pass has produced positive delta, but the velocity has dropped steadily from 8.2 to 0.4. The artifact is good but approaching its ceiling.

**Purpose of this test case:** Verify that DDV correctly distinguishes healthy diminishing returns (artifact approaching maturity) from optimization theater (effort wasted on minimal gains). In this case, the artifact is good enough to stop optimizing but not quite ready for PROMOTE_TO_CORE.

---

## Input

```
target_name:    "vendor-risk-register"
target_type:    SKILL
target_path:    skills/vendor-risk-register/

baseline_state:
  version:              "v1.5"
  description:          "Tracks vendor risk factors with named risk classes. Good coverage of concentration risk, dispute history, payment terms drift. Minor gap: sourcing risk class is shallow."
  quality_signals:
    - "covers 5 of 6 risk classes well"
    - "sourcing risk class has minimal content"
    - "integrated with vendor-cascade"
    - "Michael rarely needs to redirect mid-execution"
  complexity_estimate:  5
  maintenance_burden:   4
  known_weaknesses:
    - "sourcing risk class needs more depth"
  timestamp:            "2026-04-28"

result_state:
  version:              "v1.6"
  description:          "Improved sourcing risk class depth. Added two new sourcing risk signals (single-country concentration, lead time volatility). Now covers all 6 risk classes with consistent depth."
  quality_signals:
    - "covers all 6 risk classes at consistent depth"
    - "no known gaps remaining"
    - "integrated with vendor-cascade"
  complexity_estimate:  6
  maintenance_burden:   4
  known_weaknesses: []
  timestamp:            "2026-05-08"

cost_signals:
  elapsed_minutes:       30
  tokens_consumed:       14000
  tool_calls:            12
  retries:               0
  human_interventions:   0
  context_switches:      0
  complexity_added:      1.0
  maintenance_delta:     0.0

prior_evaluation:
  result_score:          79.5
  velocity:              0.8
  recommendation:        "LOW_RETURN_AREA"
  date:                  "2026-04-28"
  optimization_count:    5
```

### Velocity history (from ddv-log.md)

```
v1.0 → v1.1:  velocity = 8.2  (initial build to functional)
v1.1 → v1.2:  velocity = 5.1  (added risk class coverage)
v1.2 → v1.3:  velocity = 3.4  (improved output format)
v1.3 → v1.4:  velocity = 1.6  (added cascade integration)
v1.4 → v1.5:  velocity = 0.8  (minor completeness gap)
v1.5 → v1.6:  [this evaluation]
```

---

## Expected computation

```
effort_units:
  30/30 = 1.00
  14000/10000 = 1.40
  12 × 0.15 = 1.80
  0 + 0 + 0
  1.0 × 0.75 = 0.75
  0.0 × 0.6 = 0.00
  total = 4.95

baseline_score:   79.5
result_score:     ~82.0  (gap closed — modest improvement)
delta:            +2.5
velocity:         2.5 / 4.95 = 0.51
acceleration:     0.51 - 0.8 = -0.29  (continuing to decline, but shallowing)
complexity_drift: 1.0 - (2.5 × 0.8) = 1.0 - 2.0 = -1.0  (acceptable)
```

---

## Expected dimension scores

| Dimension | Baseline | Result | Expected Delta | Rationale |
|---|---|---|---|---|
| Output Quality | 7.5 | 8.0 | +0.5 | Sourcing section now complete |
| Accuracy | 8.0 | 8.5 | +0.5 | New sourcing signals are correct |
| Completeness | 7.0 | 9.0 | +2.0 | All 6 risk classes now complete |
| Reusability | 7.5 | 7.5 | 0.0 | No change |
| Modularity | 8.0 | 8.0 | 0.0 | No change |
| Automation Value | 8.0 | 8.0 | 0.0 | No change |
| Human Burden Reduction | 8.0 | 8.0 | 0.0 | No change |
| Maintainability | 8.0 | 8.0 | 0.0 | No change |
| Integration Fit | 8.5 | 8.5 | 0.0 | No change |
| Scalability | 8.0 | 8.0 | 0.0 | No change |
| Adaptability | 7.5 | 7.5 | 0.0 | No change |
| Complexity Efficiency | 7.5 | 7.5 | 0.0 | No change |
| Optimization Potential | 4.0 | 2.5 | -1.5 | Gap closed — near ceiling |
| Failure Resilience | 8.0 | 8.0 | 0.0 | No change |
| Context Efficiency | 7.5 | 7.5 | 0.0 | No change |

---

## Expected recommendation

**LOW_RETURN_AREA**

Logic path:
- delta = 2.5 (< 5, effort_units = 4.95 — PAUSE threshold approaching but effort < 2.0 cutoff)
- velocity = 0.51 < 2
- acceleration = -0.29 ≤ 0

LOW_RETURN_AREA triggers: delta > 0, velocity < 2, acceleration ≤ 0. ✓

Check PROMOTE_TO_CORE: result_score = 82.0 < 85. Not quite. maintainability = 8.0 ✓, integration_fit = 8.5 ✓, scalability = 8.0 ✓. Only threshold not met is result_score.

LOW_RETURN_AREA is the correct call. But the trajectory narrative should acknowledge this is a mature, healthy artifact — not a failing one.

---

## Expected risk flags

None significant. The artifact is clean, the velocity decline is proportionate to maturity, and no structural risks are present. The evaluator should note the declining velocity as expected behavior, not as a risk.

---

## Expected Optimization Trajectory narrative

The narrative must clearly explain the distinction between this case (healthy maturity curve) and optimization theater (wasted effort on a broken artifact). Six optimization passes have taken vendor-risk-register from 0 to 82.0 with a textbook velocity decay curve: 8.2 → 5.1 → 3.4 → 1.6 → 0.8 → 0.51. This is not failure — it is a well-optimized artifact reaching its ceiling. The recommendation to stop is a success signal, not a warning.

The narrative should also explain that 82.0 is within striking distance of PROMOTE_TO_CORE (85.0 threshold) and that a single targeted improvement pass could push it over — but only if a meaningful gap is identified. The current pass closed the last known gap.

---

## Expected next action

"Lock vendor-risk-register as production-ready at v1.6; only revisit if a new risk class category emerges from real vendor incidents that requires formal classification."

---

## Pass/fail criteria for this test case

| Check | Pass condition |
|---|---|
| Primary recommendation | LOW_RETURN_AREA |
| Tone | Should not be alarming — this is healthy maturity, not failure |
| Optimization Potential score | ≤ 3 in result |
| Trajectory narrative | Explicitly cites velocity history across all 6 passes |
| Distinguishes from optimization theater | Yes — risk flags should be absent or low severity |
| No false PAUSE recommendation | PAUSE requires effort_units > 2.0; at 4.95 it could trigger — verify evaluator uses the correct threshold |

---

## Subtle behavior to verify

This is the trickiest edge case: the PAUSE rule says delta < 5 AND effort_units > 2.0. Both are true here (delta = 2.5, effort_units = 4.95). PAUSE could trigger. But the artifact is close to PROMOTE_TO_CORE and the velocity decline is proportionate.

The evaluator should apply LOW_RETURN_AREA (which specifically captures the "declining velocity on a positive trajectory" pattern) over PAUSE (which captures "high effort for small gain" without regard to trajectory). When both trigger, LOW_RETURN_AREA is more informative for a mature, high-quality artifact.

The test passes only if LOW_RETURN_AREA wins.
