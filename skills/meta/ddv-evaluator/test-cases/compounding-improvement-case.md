# Test Case: Compounding Improvement

**Scenario:** An early-stage skill is in its second optimization pass and showing positive acceleration — each pass is yielding more velocity than the last. This is the rarest and most valuable optimization pattern.

**Purpose of this test case:** Verify that DDV correctly identifies positive acceleration, triggers CONTINUE_OPTIMIZING without hesitation, and surfaces the compounding pattern prominently in the trajectory narrative as a signal to prioritize this optimization thread.

---

## Input

```
target_name:    "skill-forge"
target_type:    SKILL
target_path:    skills/skill-forge/

baseline_state:
  version:              "v1.1"
  description:          "Deep-research skill for building custom AccentOS skills from external tools. Six-phase workflow. Phase 5 (approve gate) requires Michael input. Phase 6 (log) is manual."
  quality_signals:
    - "six-phase workflow complete"
    - "approve gate works"
    - "log step is manual — Michael writes gotcha entries by hand"
    - "no trigger disambiguation logic"
    - "8-step Ralph loop but no exit condition defined"
  complexity_estimate:  6
  maintenance_burden:   5
  known_weaknesses:
    - "log step is manual — relies on Michael to write gotcha entries"
    - "trigger disambiguation not yet defined (skill-forge vs repo-scout overlap)"
    - "Ralph loop has no exit condition — could run indefinitely"
  timestamp:            "2026-04-15"

result_state:
  version:              "v1.2"
  description:          "Added auto-log step that writes gotcha entries automatically. Added trigger disambiguation logic (repo-scout vs skill-forge decision tree). Defined Ralph loop exit condition (5 passes OR PROMOTE_TO_CORE). Added DDV integration hook."
  quality_signals:
    - "gotcha entries now written automatically at Step 9"
    - "trigger disambiguation decision tree added to Step 0"
    - "Ralph loop exits after 5 passes or PROMOTE recommendation"
    - "DDV evaluation hook wired at end of each Ralph pass"
    - "Michael's manual workload reduced: no more hand-written gotcha entries"
  complexity_estimate:  7
  maintenance_burden:   5
  known_weaknesses:
    - "auto-gotcha entries may be verbose — needs calibration"
  timestamp:            "2026-05-08"

cost_signals:
  elapsed_minutes:       50
  tokens_consumed:       26000
  tool_calls:            24
  retries:               1
  human_interventions:   0
  context_switches:      1
  complexity_added:      2.0
  maintenance_delta:     +0.5

prior_evaluation:
  result_score:          62.4
  velocity:              3.8
  recommendation:        "CONTINUE_OPTIMIZING"
  date:                  "2026-04-15"
  optimization_count:    1
```

---

## Expected computation

```
effort_units:
  50/30 = 1.67
  26000/10000 = 2.60
  24 × 0.15 = 3.60
  1 × 0.5 = 0.50
  0 × 1.0 = 0.00
  1 × 0.4 = 0.40
  2.0 × 0.75 = 1.50
  0.5 × 0.6 = 0.30
  total = 10.57

baseline_score:   62.4
result_score:     ~78.1  (significant multi-dimension improvement)
delta:            +15.7
velocity:         15.7 / 10.57 = 1.49

Wait — prior velocity was 3.8, current is 1.49. That's negative acceleration.
acceleration = 1.49 - 3.8 = -2.31
```

Hmm. At first glance this looks like diminishing returns, not compounding improvement. Let's reconsider — the scenario claims positive acceleration. Let me adjust the cost signals to make the scenario internally consistent with the stated "compounding improvement" premise.

**Revised cost signals** (lower effort pass — tighter execution):

```
cost_signals:
  elapsed_minutes:       30
  tokens_consumed:       15000
  tool_calls:            14
  retries:               0
  human_interventions:   0
  context_switches:      0
  complexity_added:      2.0
  maintenance_delta:     0.0
```

```
effort_units:
  30/30 = 1.00
  15000/10000 = 1.50
  14 × 0.15 = 2.10
  0 + 0 + 0 + 0
  2.0 × 0.75 = 1.50
  0.0 × 0.6 = 0.00
  total = 6.10

baseline_score:   62.4
result_score:     ~78.1
delta:            +15.7
velocity:         15.7 / 6.10 = 2.57

Prior velocity was 3.8. Acceleration = 2.57 - 3.8 = -1.23.
```

Still negative. For genuine positive acceleration, the second pass must be cheaper per unit of delta than the first. Let's construct the numbers correctly:

**Prior evaluation (v1.0 → v1.1):**  
delta = 12.0, effort_units = 8.5, velocity = 1.41

**Current evaluation (v1.1 → v1.2):**  
delta = 15.7, effort_units = 6.10, velocity = 2.57

```
acceleration = 2.57 - 1.41 = +1.16  ← positive acceleration confirmed
```

**Corrected prior_evaluation:**
```
prior_evaluation:
  result_score:          62.4
  velocity:              1.41
  optimization_count:    1
```

---

## Corrected expected computation

```
baseline_score:   62.4
result_score:     78.1
delta:            +15.7
effort_units:     6.10
velocity:         2.57
acceleration:     2.57 - 1.41 = +1.16  ← POSITIVE — compounding confirmed
complexity_drift: 2.0 - (15.7 × 0.8) = 2.0 - 12.56 = -10.56 (strongly healthy)
```

---

## Expected dimension scores

| Dimension | Baseline | Result | Expected Delta | Rationale |
|---|---|---|---|---|
| Output Quality | 6.0 | 8.5 | +2.5 | Auto-log + disambiguation = better output completeness |
| Accuracy | 7.0 | 8.0 | +1.0 | Disambiguation prevents wrong skill from firing |
| Completeness | 6.5 | 8.5 | +2.0 | All gaps addressed in one pass |
| Reusability | 6.0 | 7.5 | +1.5 | DDV hook makes skill-forge output evaluatable |
| Modularity | 7.0 | 7.5 | +0.5 | Decision tree added cleanly |
| Automation Value | 6.5 | 9.0 | +2.5 | Auto-gotcha eliminates biggest manual step |
| Human Burden Reduction | 6.0 | 9.0 | +3.0 | Michael no longer writes gotcha entries manually |
| Maintainability | 6.5 | 7.5 | +1.0 | More structure, better documented |
| Integration Fit | 7.5 | 9.0 | +1.5 | DDV integration hook added |
| Scalability | 7.0 | 7.5 | +0.5 | Loop exit condition prevents runaway |
| Adaptability | 7.0 | 7.5 | +0.5 | Better structure = easier to extend |
| Complexity Efficiency | 7.0 | 7.5 | +0.5 | Added complexity serves clear purposes |
| Optimization Potential | 7.0 | 6.0 | -1.0 | Gap list shrinking |
| Failure Resilience | 6.5 | 7.5 | +1.0 | Loop exit prevents indefinite loops |
| Context Efficiency | 7.0 | 7.0 | 0.0 | No change |

---

## Expected recommendation

**CONTINUE_OPTIMIZING**

Logic path:
- delta = 15.7 ≥ 15 ✓
- velocity = 2.57 (< 5, but in context of first two passes and positive acceleration, threshold check passes with explicit note)
- acceleration = +1.16 ✓ (positive)
- complexity_drift = -10.56 ✓ (strongly negative — no complexity concern)

Standard CONTINUE_OPTIMIZING threshold requires velocity ≥ 5. At 2.57, it's below. However, when acceleration is positive (+1.16) and delta is ≥ 15, the evaluator should apply the tie-breaker from scoring-logic.md: "When delta ≥ 15 and acceleration is positive, CONTINUE_OPTIMIZING applies even if velocity < 5."

---

## Expected risk flags

None. Positive acceleration with no complexity creep and no hidden maintenance cost is a clean signal.

---

## Expected Optimization Trajectory narrative

This narrative is the most important element of this test case. It must:

1. Explicitly name the positive acceleration (+1.16) and explain what it means: each pass is becoming more efficient, not less.
2. Contrast with the typical optimization pattern (velocity starts high, declines over time).
3. Identify the likely cause: foundational improvements (auto-log, disambiguation) are unlocking compound benefits rather than filling isolated gaps.
4. Recommend prioritizing the next pass because the trajectory suggests continued compound gains.
5. Identify the specific remaining gaps (auto-gotcha verbosity calibration) as high-confidence targets.

---

## Expected next action

"Prioritize the next skill-forge optimization pass: focus on calibrating auto-gotcha entry verbosity (target: ≤ 3 sentences per entry) and add a prompt for Michael to confirm Ralph loop exit when PROMOTE_TO_CORE triggers."

---

## Pass/fail criteria for this test case

| Check | Pass condition |
|---|---|
| Primary recommendation | CONTINUE_OPTIMIZING |
| Positive acceleration | Explicitly surfaced in report — not buried |
| Velocity threshold caveat | Report notes velocity is below threshold and applies tie-breaker |
| Trajectory narrative | Uses the word "compounding" or equivalent — describes this as an unusual, high-value pattern |
| Risk flags | Zero — no false positives |
| Next action | Specific to the identified remaining gap (verbosity calibration) |
| Confidence | ≥ 65% (prior evaluation exists, all 7 cost signals provided) |

---

## Design insight captured by this test case

Positive acceleration is the rarest DDV pattern. Most optimization trajectories show monotonically declining velocity. When acceleration is positive, it signals that prior optimization work is multiplying the value of current work — the skills are compounding. This scenario should be surfaced prominently, prioritized in the optimization queue, and not confused with "high velocity, no acceleration data" (a first-evaluation artifact with a good v1 pass).

The test verifies the evaluator doesn't treat all high-delta results equally — it specifically rewards and highlights the compounding pattern.
