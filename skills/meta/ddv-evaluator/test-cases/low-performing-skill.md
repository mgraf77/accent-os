# Test Case: Low-Performing Skill

**Scenario:** A skill has been through three optimization passes and has not improved meaningfully. Maintainability is low, architecture is fragile, and the approach may be fundamentally flawed.

**Purpose of this test case:** Verify that DDV correctly identifies REWRITE (not CONTINUE_OPTIMIZING or DEPRECATE) when maintainability is critically low despite multiple passes.

---

## Input

```
target_name:    "rep-group-matchmaker"
target_type:    SKILL
target_path:    skills/rep-group-matchmaker/

baseline_state:
  version:              "v1.3"
  description:          "Assigns rep_group_id to unassigned vendors by matching on category/region. Brittle — uses fragile text-matching heuristics that break on abbreviation variants."
  quality_signals:
    - "works for ~50% of unassigned vendors"
    - "has 12 heuristic rules baked in as nested if-else"
    - "no test coverage"
    - "requires Michael to review all outputs manually"
  complexity_estimate:  7
  maintenance_burden:   8
  known_weaknesses:
    - "brittle text matching fails on abbreviation variants"
    - "nested if-else with 12 rules is unreadable"
    - "no graceful failure — wrong match is worse than no match"
    - "all three prior passes added more rules instead of fixing the architecture"
  timestamp:            "2026-04-25"

result_state:
  version:              "v1.4"
  description:          "Added 3 more heuristic rules. Accuracy improved from ~50% to ~58% for common vendors. Architecture unchanged — still nested if-else."
  quality_signals:
    - "works for ~58% of unassigned vendors"
    - "now has 15 heuristic rules in nested if-else"
    - "no test coverage added"
    - "still requires full manual review"
  complexity_estimate:  8
  maintenance_burden:   9
  known_weaknesses:
    - "15 nested rules now unmaintainable"
    - "no graceful failure still"
    - "3 passes have not addressed the architecture problem"
  timestamp:            "2026-05-08"

cost_signals:
  elapsed_minutes:       55
  tokens_consumed:       24000
  tool_calls:            22
  retries:               2
  human_interventions:   2
  context_switches:      1
  complexity_added:      2.0
  maintenance_delta:     +2.5

prior_evaluation:
  result_score:          38.4
  velocity:              1.2
  recommendation:        "CONTINUE_OPTIMIZING"   # incorrect recommendation from v1.2 eval
  date:                  "2026-04-25"
  optimization_count:    3
```

---

## Expected computation

```
effort_units:
  55/30 = 1.83
  24000/10000 = 2.40
  22 × 0.15 = 3.30
  2 × 0.5 = 1.00
  2 × 1.0 = 2.00
  1 × 0.4 = 0.40
  2.0 × 0.75 = 1.50
  2.5 × 0.6 = 1.50
  total = 13.93

baseline_score:   ~38.4
result_score:     ~42.1  (modest improvement from 8% accuracy gain)
delta:            +3.7
velocity:         3.7 / 13.93 = 0.27
acceleration:     0.27 - 1.2 = -0.93  (declining from prior pass)
complexity_drift: 2.0 - (3.7 × 0.8) = 2.0 - 2.96 = -0.96 (borderline — complexity near utility)
optimization_roi: (100 - 42.1) × (1 - 42.1/100) × 0.5 / (13.93 × (1 + 0.2×3))
                ≈ small and declining
```

---

## Expected dimension scores

| Dimension | Baseline | Result | Expected Delta | Rationale |
|---|---|---|---|---|
| Output Quality | 3.5 | 4.0 | +0.5 | Small improvement from 8 more percentage points |
| Accuracy | 3.0 | 3.8 | +0.8 | 58% match rate vs 50% — still failing nearly half |
| Completeness | 4.0 | 4.0 | 0.0 | Requirements unchanged, coverage unchanged |
| Reusability | 3.0 | 3.0 | 0.0 | Brittle heuristics not reusable |
| Modularity | 2.0 | 2.0 | 0.0 | Nested if-else unchanged |
| Automation Value | 4.0 | 4.0 | 0.0 | Still requires manual review of all outputs |
| Human Burden Reduction | 3.0 | 3.0 | 0.0 | Full manual review still required |
| Maintainability | 2.5 | 2.0 | -0.5 | More rules = harder to maintain; got worse |
| Integration Fit | 5.5 | 5.5 | 0.0 | No integration changes |
| Scalability | 3.0 | 2.5 | -0.5 | More rules = more fragile at scale |
| Adaptability | 2.5 | 2.0 | -0.5 | Adding more rules makes adaptation harder |
| Complexity Efficiency | 3.0 | 2.5 | -0.5 | Same approach, more complexity |
| Optimization Potential | 4.0 | 3.0 | -1.0 | 3 passes haven't helped; potential further diminished |
| Failure Resilience | 2.0 | 2.0 | 0.0 | No graceful failure added |
| Context Efficiency | 6.0 | 5.5 | -0.5 | Larger SKILL.md with more rules |

---

## Expected recommendation

**REWRITE**

Logic path:
- maintainability_result = 2.0 ≤ 3 → REWRITE triggers
- architecture_fragility confirmed (3 passes without structural fix)

Note: REWRITE takes priority over DEPRECATE because the *use case* is valid — vendors need rep group assignment. The *approach* (heuristic text matching) is what's broken.

---

## Expected risk flags

**OPTIMIZATION_THEATER** — HIGH  
Evidence: effort_units = 13.93, delta = +3.7, velocity = 0.27. Three passes have consumed substantial effort for trivial improvement.

**HIDDEN_MAINTENANCE_COST** — HIGH  
Evidence: maintenance_delta = +2.5 (significant ongoing burden added). maintainability dropped from 2.5 to 2.0.

**COMPLEXITY_CREEP** — HIGH  
Evidence: complexity_added = 2.0 in this pass alone. Three consecutive passes have added complexity without proportionate value. Total complexity_drift across 4 passes is deeply positive.

**BRITTLE_DEPENDENCY_CHAIN** — MEDIUM  
Evidence: 15 nested rules each depend on vendor name text matching. Any vendor naming convention change breaks multiple rules simultaneously.

---

## Expected next action

"Rewrite rep-group-matchmaker using a table-driven lookup (rep_group_region_map Supabase table) instead of heuristic text matching — eliminate all if-else rules in favor of a join query that assigns rep_group by (vendor_state, vendor_category) match."

---

## Pass/fail criteria for this test case

| Check | Pass condition |
|---|---|
| Primary recommendation | REWRITE (not CONTINUE_OPTIMIZING or DEPRECATE) |
| Risk flags: count | ≥ 3 risk flags triggered |
| Risk flags: OPTIMIZATION_THEATER | Present with HIGH severity |
| Maintainability score | ≤ 3 in result (triggers REWRITE threshold) |
| Trajectory narrative | Clearly states optimization has failed to address root cause |
| Next action specificity | References table-driven approach or SQL-based alternative |

---

## Common failure mode to guard against

The evaluator must NOT recommend CONTINUE_OPTIMIZING just because delta > 0 (+3.7). A positive delta with 0.27 velocity, negative acceleration, and maintainability = 2.0 is clearly a REWRITE situation. Positive delta alone is not sufficient to continue optimizing a broken architecture.
