# Test Case: High-Performing Skill

**Scenario:** A well-maintained skill has just completed its second optimization pass and is approaching production-grade quality.

**Purpose of this test case:** Verify that DDV correctly identifies PROMOTE_TO_CORE when all thresholds are met, and does not over-recommend CONTINUE_OPTIMIZING when the artifact is clearly mature.

---

## Input

```
target_name:    "supabase-sql-magic"
target_type:    SKILL
target_path:    skills/supabase-sql-magic/

baseline_state:
  version:              "v1.1"
  description:          "Converts natural-language data questions to SQL. Handles simple to medium queries. Known gap: multi-join queries sometimes mis-order the JOIN conditions."
  quality_signals:
    - "SKILL.md is complete and well-structured"
    - "works correctly for 85% of test queries"
    - "one known edge case (multi-join ordering)"
    - "registered in _index.md"
  complexity_estimate:  4
  maintenance_burden:   3
  known_weaknesses:
    - "multi-join ordering not handled"
    - "no gotcha-log entries yet"
  timestamp:            "2026-04-20"

result_state:
  version:              "v1.2"
  description:          "Converts natural-language data questions to SQL. Multi-join ordering fixed. Added gotcha-log with 3 entries. Added AccentOS-specific table aliases."
  quality_signals:
    - "SKILL.md is complete, gotcha-log has 3 entries"
    - "multi-join ordering fixed and tested"
    - "AccentOS table aliases added (hsyjcrrazrzqngwkqsqa → acc)"
    - "registered and companion skills listed in _index.md"
  complexity_estimate:  5
  maintenance_burden:   3
  known_weaknesses: []
  timestamp:            "2026-05-08"

cost_signals:
  elapsed_minutes:       35
  tokens_consumed:       18000
  tool_calls:            14
  retries:               1
  human_interventions:   0
  context_switches:      0
  complexity_added:      1.0
  maintenance_delta:     0.0

prior_evaluation:
  result_score:          76.2
  velocity:              5.8
  recommendation:        "CONTINUE_OPTIMIZING"
  date:                  "2026-04-20"
```

---

## Expected computation

```
effort_units:
  35/30 = 1.17
  18000/10000 = 1.80
  14 × 0.15 = 2.10
  1 × 0.5 = 0.50
  0 + 0 + 0
  1.0 × 0.75 = 0.75
  0.0 × 0.6 = 0.00
  total = 6.32

baseline_score: ~76.2 (from prior evaluation)
result_score:   ~87.5 (estimated given the fixes applied)
delta:          +11.3
velocity:       11.3 / 6.32 = 1.79
acceleration:   1.79 - 5.8 = -4.01  (velocity dropped significantly from v1.1 pass)
complexity_drift: 1.0 - (11.3 × 0.8) = 1.0 - 9.04 = -8.04 (healthy — value >> complexity)
```

---

## Expected dimension scores

| Dimension | Baseline | Result | Expected Delta | Rationale |
|---|---|---|---|---|
| Output Quality | 7.5 | 9.0 | +1.5 | Multi-join fix eliminates the main quality gap |
| Accuracy | 7.0 | 9.0 | +2.0 | Edge case fixed — now correct for all tested query types |
| Completeness | 8.0 | 9.0 | +1.0 | Gotcha-log adds edge case coverage |
| Reusability | 8.5 | 8.5 | 0.0 | No change — already high |
| Modularity | 8.0 | 8.0 | 0.0 | No structural changes |
| Automation Value | 8.5 | 8.5 | 0.0 | No change |
| Human Burden Reduction | 8.5 | 8.5 | 0.0 | No change |
| Maintainability | 7.0 | 8.5 | +1.5 | Gotcha-log adds institutional memory |
| Integration Fit | 8.5 | 9.0 | +0.5 | Companion skills listed |
| Scalability | 8.0 | 8.0 | 0.0 | No change |
| Adaptability | 8.0 | 8.0 | 0.0 | No change |
| Complexity Efficiency | 8.0 | 8.0 | 0.0 | Complexity increase proportionate to fix |
| Optimization Potential | 5.0 | 3.5 | -1.5 | Approaching ceiling |
| Failure Resilience | 7.5 | 8.0 | +0.5 | Minor improvement |
| Context Efficiency | 8.0 | 8.0 | 0.0 | No change |

---

## Expected recommendation

**PROMOTE_TO_CORE**

Logic path:
- result_score ≥ 85 ✓ (87.5)
- maintainability ≥ 8 ✓ (8.5)
- integration_fit ≥ 8 ✓ (9.0)
- scalability ≥ 8 ✓ (8.0)
- risk_flags_high_severity = 0 ✓

All four PROMOTE_TO_CORE criteria met.

---

## Expected risk flags

None. The artifact is clean, well-maintained, complexity growth is proportionate.

---

## Pass/fail criteria for this test case

| Check | Pass condition |
|---|---|
| Primary recommendation | PROMOTE_TO_CORE |
| No regression detected | delta > 0 |
| Acceleration acknowledged | acceleration noted as negative but not penalized since PROMOTE overrides |
| No false risk flags | Zero HIGH or MEDIUM risk flags triggered |
| Skill Memory Update | Contains result_score, recommendation, and next action |
| Log entry written | Appended to ddv-log.md |

---

## Edge case to verify

The negative acceleration (-4.01) should NOT trigger a LOW_RETURN_AREA recommendation when the PROMOTE_TO_CORE criteria are all met. PROMOTE_TO_CORE outranks LOW_RETURN_AREA. The evaluation should acknowledge the acceleration drop in the Optimization Trajectory narrative while still recommending promotion.
