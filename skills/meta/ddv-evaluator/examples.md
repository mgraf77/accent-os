# DDV Evaluator — Examples

Four realistic worked evaluations covering distinct scenarios. Each shows how the evaluator reasons from raw signals to a strategic recommendation.

---

## Example 1: High-Performing Skill After Third Optimization Pass

**Target:** `vendor-cascade` v3  
**Context:** Third Ralph loop pass. Prior velocity = 4.1 (v1→v2), prior velocity = 3.7 (v2→v3). The team added metric traceability and orphan metric detection.

### Input signals

```
elapsed_minutes:       45
tokens_consumed:       22000
tool_calls:            18
retries:               0
human_interventions:   0
context_switches:      1
complexity_added:      2.0   (added orphan detection logic)
maintenance_delta:     +0.5  (slightly more code to maintain)
```

### Effort computation

```
time_weight        = 45/30    = 1.50
token_weight       = 22000/10000 = 2.20
tool_weight        = 18 × 0.15   = 2.70
retry_weight       = 0 × 0.5     = 0.00
human_weight       = 0 × 1.0     = 0.00
context_weight     = 1 × 0.4     = 0.40
complexity_weight  = 2.0 × 0.75  = 1.50
maintenance_weight = 0.5 × 0.6   = 0.30

effort_units = 8.60
```

### Dimension scores

| Dimension | Baseline | Result | Delta |
|---|---|---|---|
| Output Quality | 7.5 | 9.0 | +1.5 |
| Accuracy | 8.0 | 9.0 | +1.0 |
| Completeness | 7.0 | 8.5 | +1.5 |
| Reusability | 8.0 | 8.0 | 0.0 |
| Modularity | 7.5 | 8.0 | +0.5 |
| Automation Value | 8.5 | 9.0 | +0.5 |
| Human Burden Reduction | 8.0 | 8.5 | +0.5 |
| Maintainability | 7.0 | 7.5 | +0.5 |
| Integration Fit | 8.5 | 9.0 | +0.5 |
| Scalability | 7.0 | 8.0 | +1.0 |
| Adaptability | 7.5 | 8.0 | +0.5 |
| Complexity Efficiency | 7.0 | 7.0 | 0.0 |
| Optimization Potential | 6.0 | 5.0 | -1.0 |
| Failure Resilience | 7.5 | 8.0 | +0.5 |
| Context Efficiency | 7.5 | 7.5 | 0.0 |

```
baseline_score = weighted avg × 10 = 78.4
result_score   = weighted avg × 10 = 83.7
delta          = +5.3
velocity       = 5.3 / 8.60 = 0.62

acceleration   = 0.62 - 3.7 = -3.08  ← prior velocity was 3.7, this pass was 0.62
```

Wait — the velocity dropped significantly from v2→v3 (3.7) to this pass (0.62). Acceleration is sharply negative. But the result_score at 83.7 is approaching the PROMOTE threshold.

### Recommendation logic

- delta = 5.3 (< 15, does not trigger CONTINUE_OPTIMIZING)
- velocity = 0.62 (< 5, does not trigger HIGH_PRIORITY)
- acceleration = -3.08 (negative — diminishing returns confirmed)
- result_score = 83.7 (approaching 85 threshold)
- maintainability = 7.5, integration_fit = 9.0, scalability = 8.0

Check PROMOTE_TO_CORE: needs result_score ≥ 85. At 83.7, just below threshold.
Check LOW_RETURN_AREA: delta > 0, velocity < 2, acceleration ≤ 0. **Triggers.**

### Output (abbreviated)

```
Recommendation: LOW_RETURN_AREA

Rationale: vendor-cascade has reached maturity — result_score 83.7 is excellent
and the artifact is clearly production-quality. However, velocity has dropped from
3.7 in the previous pass to 0.62 now, and acceleration is -3.08. The optimization
curve is bending hard toward its ceiling. One more targeted pass focused specifically
on closing the maintainability gap from 7.5 to 8.0 would likely tip the overall
score past 85 and qualify for PROMOTE_TO_CORE. Further broad optimization is not
the right tool — the remaining gains are surgical.

Secondary: Optimization_potential dropped from 6 to 5, confirming this artifact
is approaching its ceiling under the current architecture.

Next Action: Run one targeted pass on maintainability (add SKILL.md cross-references
and clean up gotcha-log formatting) then re-evaluate for PROMOTE_TO_CORE.
```

---

## Example 2: Regression After Aggressive Refactor

**Target:** `efficiency-monitor` after a "reduce token footprint" optimization pass  
**Context:** Pass attempted to compress the SKILL.md by 40% to improve context efficiency. Accuracy and completeness dropped as a result.

### Input signals

```
elapsed_minutes:       60
tokens_consumed:       35000
tool_calls:            28
retries:               3
human_interventions:   1
context_switches:      2
complexity_added:      -1.5   (removed code, so negative — simplified)
maintenance_delta:     -0.5   (slightly easier to maintain now)
```

### Core metrics

```
effort_units = 60/30 + 35000/10000 + 28×0.15 + 3×0.5 + 1×1.0 + 2×0.4 + 0 + 0
             = 2.0 + 3.5 + 4.2 + 1.5 + 1.0 + 0.8
             = 13.0

baseline_score = 74.2
result_score   = 65.8
delta          = -8.4
velocity       = -8.4 / 13.0 = -0.65
```

### Recommendation logic

delta = -8.4 (< -5). **ROLL_BACK triggers immediately.**

### Output (abbreviated)

```
Recommendation: ROLL_BACK

Risk Flags:
  OPTIMIZATION_THEATER — HIGH
  Evidence: 13.0 effort_units consumed to produce a -8.4 delta. High cost, negative outcome.

  TOKEN_INEFFICIENCY — MEDIUM  
  Evidence: 35,000 tokens consumed for a refactor that decreased value.

Rationale: The compression pass reduced context efficiency by stripping content that
accuracy and completeness depend on. The optimization achieved its stated goal
(smaller footprint) at the cost of the qualities that make the footprint worth having.
This is a classic case of optimizing a proxy metric (size) rather than the target
metric (useful information density). Roll back to v_baseline and instead apply surgical
compression: remove filler sentences, not structural content.

Next Action: git revert the compression commit; then identify the 3 longest paragraphs
in efficiency-monitor's SKILL.md and tighten prose without removing behavioral spec.
```

---

## Example 3: Diminishing Returns on Prompt Engineering

**Target:** bc-business-review system prompt, optimization pass 5  
**Context:** Five consecutive prompt engineering passes on the business review prompt. Each pass has yielded less improvement than the last.

### Velocity history

```
Pass 1: velocity = 12.4  (raw prompt → structured)
Pass 2: velocity = 6.8   (added KPI weighting)
Pass 3: velocity = 3.2   (improved anomaly framing)
Pass 4: velocity = 1.7   (tone calibration)
Pass 5: velocity = 0.9   (current)
```

### Core metrics (pass 5)

```
baseline_score = 88.1
result_score   = 89.7
delta          = +1.6
effort_units   = 3.2
velocity       = 0.50
acceleration   = 0.50 - 0.9 = -0.4   (using pass 4 velocity = 0.9)
```

Wait — acceleration from pass 4 to pass 5: 0.50 - 0.9 = -0.4. Consistently negative through all 5 passes.

### Risk flags

```
OPTIMIZATION_THEATER — MEDIUM
Evidence: velocity = 0.50, consistent negative acceleration through 5 passes.
Delta is positive but tiny given effort invested.
```

### Recommendation logic

- delta = 1.6 (< 5), effort_units = 3.2 (high). **PAUSE triggers.**
- result_score = 89.7 ≥ 85, maintainability = 9, integration_fit = 8, scalability = 8. **PROMOTE_TO_CORE triggers.**

Two rules trigger. Priority: PROMOTE_TO_CORE outranks PAUSE when the artifact meets all core criteria.

### Output (abbreviated)

```
Recommendation: PROMOTE_TO_CORE

Rationale: After 5 optimization passes, the bc-business-review prompt has reached
89.7/100 — a genuinely excellent score for a prompt artifact, where 90+ represents
the practical ceiling. Optimization has clearly delivered compounding value across
the first 3 passes, and appropriate diminishing returns are appearing as the prompt
approaches its ceiling. This is healthy trajectory, not failure. The artifact meets
all PROMOTE_TO_CORE criteria: result_score ≥ 85, maintainability = 9, integration_fit
= 8, scalability = 8. Lock this prompt as the production version. Further optimization
should only trigger if a structural requirement changes, not to chase the remaining
0.3 points.

Next Action: Tag this prompt version as v5-production in the skill's changelog and
update the weekly review automation to pin to this version explicitly.
```

---

## Example 4: First Evaluation — New Skill, No Baseline

**Target:** `ddv-evaluator` v1 (self-evaluation)  
**Context:** First evaluation of the DDV Evaluator after initial build. No prior version. Baseline = 0 (new artifact, no prior state).

### Input signals

```
elapsed_minutes:       90         (build session)
tokens_consumed:       ~45000     (estimated)
tool_calls:            35
retries:               0
human_interventions:   0
context_switches:      0
complexity_added:      6.0        (substantial new framework)
maintenance_delta:     +2.5       (adds ongoing maintenance surface)
```

### Effort computation

```
effort_units = 90/30 + 45000/10000 + 35×0.15 + 0 + 0 + 0 + 6.0×0.75 + 2.5×0.6
             = 3.0 + 4.5 + 5.25 + 0 + 0 + 0 + 4.5 + 1.5
             = 18.75
```

### Dimension scores (result only — no baseline)

| Dimension | Result | Notes |
|---|---|---|
| Output Quality | 8.0 | All required files present, no placeholders |
| Accuracy | 7.5 | Formulas grounded; edge cases documented |
| Completeness | 9.0 | All 12 required files + 5 test cases + log |
| Reusability | 9.0 | Designed for any artifact type, not skill-specific |
| Modularity | 8.5 | Each file has single responsibility; clean boundaries |
| Automation Value | 7.0 | Auto-triggers via integration; full manual mode |
| Human Burden Reduction | 7.5 | Removes optimization decision burden from Michael |
| Maintainability | 7.0 | Well documented; some formulas need calibration |
| Integration Fit | 8.0 | Integrates with skill-forge, efficiency-monitor |
| Scalability | 8.5 | Designed for recursive and multi-artifact use |
| Adaptability | 9.0 | Future expansion hooks explicitly designed in |
| Complexity Efficiency | 7.0 | Substantial but necessary for scope |
| Optimization Potential | 8.0 | Calibration data will improve accuracy over time |
| Failure Resilience | 7.0 | Confidence floor protects against bad outputs |
| Context Efficiency | 7.5 | 12 files; lazy-read design reduces session footprint |

```
baseline_score = 0   (new artifact)
result_score   = weighted avg × 10 = 79.8
delta          = +79.8
velocity       = 79.8 / 18.75 = 4.25
acceleration   = N/A (first evaluation)
complexity_drift = 6.0 - (79.8 × 0.8) = 6.0 - 63.8 = -57.8  (strongly healthy)
```

### Confidence

```
-20 (baseline estimated as 0 — new artifact)
-10 (optimization_count = 0)
-5  (complexity_added estimated)
base = 65%
```

### Recommendation logic

- delta = 79.8 ≥ 15
- velocity = 4.25 (< 5, just below CONTINUE_OPTIMIZING threshold)
- acceleration = N/A
- result_score = 79.8 < 85 (not PROMOTE_TO_CORE yet)

Check HIGH_PRIORITY_OPTIMIZATION: result_score < 60? No (79.8). Does not trigger.
Check CONTINUE_OPTIMIZING: velocity = 4.25 < 5. Does not fully trigger.

Closest match: LOW_RETURN_AREA? No — delta is massive and this is v1.
Best fit given context: result_score 79.8, first evaluation, clear identified improvements → CONTINUE_OPTIMIZING with note about velocity just below threshold.

Rule: when no rule triggers cleanly for a first evaluation with positive velocity, apply CONTINUE_OPTIMIZING with a caveat.

### Output (abbreviated)

```
Recommendation: CONTINUE_OPTIMIZING

Rationale: For a first-version framework artifact of this scope, 79.8/100 at
velocity 4.25 is a strong result. Velocity falls just below the 5.0 threshold
for a clean CONTINUE_OPTIMIZING signal, which is appropriate — the remaining
headroom (20.2 points) is achievable but will require calibration passes as
real evaluation data accumulates. The framework is structurally sound. The
three lowest-scoring dimensions (Automation Value, Maintainability, Complexity
Efficiency) each have clear, targeted improvement paths.

Identified improvements to apply in v1.1:
1. Maintainability: add a quick-start decision flowchart to README
2. Complexity Efficiency: simplify the effort weight formula to use a lookup
   table instead of inline arithmetic
3. Automation Value: add explicit integration hooks for skill-forge's Ralph loop

Next Action: Apply the three targeted improvements above, then re-evaluate
after the first real evaluation run using actual AccentOS data.
```

**Weaknesses found in self-evaluation:**
1. Effort weights need calibration against real AccentOS session data — current defaults are reasonable but not validated.
2. The confidence penalty for "no prior evaluation" (-20) may be too aggressive for mature frameworks being evaluated for the first time.
3. The recommendation selection logic has a gap: no rule cleanly handles "first evaluation, good score, velocity 4–5 range."

**Improvements applied in v1:**
- Added explicit "first evaluation" handling note to scoring-logic.md
- Added calibration rationale to schema.md effort weights section

See `changelog.md` for the full self-evaluation record.
