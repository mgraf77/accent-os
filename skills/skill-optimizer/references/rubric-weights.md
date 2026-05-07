# Rubric Weights — skill-optimizer

> Reference for Step 3 (Score on Active Rubric) and Step 8 (Score Test).
> Calibration: **50 = average functional skill. 75 = genuinely good. 85+ = exceptional. 90+ requires formal validation. 100 = practically unachievable.**
> These anchors are non-negotiable — they prevent score inflation. Read the calibration reference (bottom of this file) before scoring any skill for the first time.

---

## Score Interpretation

| Total Score | What it means |
|---|---|
| < 40 | Not production-ready. One or more critical dimensions missing or broken. |
| 40–54 | Functional but rough. Happy path only, significant gaps. |
| 55–64 | Competent. Works in standard cases. Production-ready with known caveats. |
| 65–74 | Good. Handles most edge cases. Well-documented. Reliable in practice. |
| 75–84 | Excellent. Comprehensive, robust, minimal gaps. Would satisfy a thorough review. |
| 85–91 | Outstanding. Near-complete. Hard to improve without formal testing infrastructure. |
| 92–99 | Exceptional. Requires formal automated validation (test suite) to substantiate. |
| 100 | Theoretically perfect. Unreachable without exhaustive formal verification. |

---

## Evidence Burden Rules

**All scores above 7.5 on any dimension require explicit evidence citation.** "It has output blocks" is not evidence. You must quote or reference the specific section.

**Scores above 8.0:** Must run Contrarian + Methodologist Perspective Sweep to confirm. Both must agree. If either raises an objection that can't be resolved, cap at 8.0.

**Scores above 9.0:** Must cite formal validation: passing promptfoo test suite OR documented real-use record from 3+ independent sessions showing correct behavior. Label as **PROVISIONAL 9.0** if citing informal use only. Provisional scores do not count toward threshold.

**Floor Penalty:** Any dimension scoring below 3.0 applies a **−5 pt deduction** to the total score. Multiple broken dims stack. This prevents a skill from hiding a completely missing section behind high scores elsewhere.

---

## Dimension Scoring — Default Dimensions

Scores are 0–10 per dimension. **5.0 = average.** Every anchor point below describes the MINIMUM behavior required to achieve that score. Scoring between anchors (e.g., 6.5) is valid when behavior is between two described levels.

---

### Output Quality (default weight: 25%)

*What is the user guaranteed to receive, and how specifically is it defined?*

| Score | Anchor — minimum behavior at this level |
|---|---|
| **0** | No output defined. Skill is a behavioral description or process goal, not a deliverable spec. |
| **2** | Output vaguely mentioned at skill level ("produces a report", "returns analysis"). No structure. |
| **4** | Output format exists at skill level. Steps loosely describe outputs ("some analysis", "a summary"). |
| **5 — AVERAGE** | Most steps name a specific output. Format documented at skill level. 1-2 steps are vague or just name a process phase, not a deliverable. |
| **6** | All steps name a specific output. Format and field names documented. A reader can predict what they'll receive. |
| **7 — GOOD** | Every step has a concrete, paste-ready output. Named blocks with exact field names. No ambiguity. Output shape is defined for all steps including loops and gates. |
| **8** | Everything at 7 + cited evidence that outputs match the documented shape in real use. Edge case outputs (empty data, errors) documented. Evidence required. |
| **8.5** | Everything at 8 + edge case outputs confirmed correct in 2+ independent real sessions (not same session). Evidence required for each edge case. No documented deviation from specified shape in practice. Contrarian + Methodologist Perspective Sweep confirms. |
| **9** | Everything at 8 + promptfoo or equivalent tests confirm output shape across all documented cases. Zero deviations in testing. PROVISIONAL label required without test evidence. |
| **10** | Formally verified across all edge cases and input variations by automated test suite. Zero exceptions. Unreachable without complete test coverage. |

---

### Methodology Fitness (default weight: 20%)

*Can this skill be followed consistently to produce the same result every time?*

| Score | Anchor |
|---|---|
| **0** | No workflow. A list of goals or behaviors, not executable steps. |
| **2** | Steps exist but are unordered, heavily overlapping, or cannot be reliably followed. |
| **4** | Steps are ordered. Some are multi-purpose or could be reordered without obvious consequence. Implicit stop conditions. |
| **5 — AVERAGE** | Steps can be followed. Single-purpose for most steps. Minor overlap or one ambiguous step. An experienced practitioner could complete the skill. |
| **6** | Steps numbered, ordered, imperative-voiced. Single-purpose. Stop conditions present but not always explicit. Parallel batching implied but not documented. |
| **7 — GOOD** | Steps numbered, ordered, imperative-voiced, non-overlapping. Each has one purpose and an explicit stop condition. Parallel and sequential dependencies documented. Caps and limits on loops. |
| **8** | Everything at 7 + verified to produce consistent, reproducible outputs across multiple independent runs (cited evidence). No identified ambiguities after real use. |
| **8.5** | Everything at 8 + documented case where an independent practitioner followed the workflow without coaching and arrived at equivalent output. One confirmed instance (not 3+). Evidence required. Contrarian + Methodologist Perspective Sweep confirms no ambiguities remain. |
| **9** | Formally verified: an independent practitioner can follow the workflow and arrive at equivalent outputs without coaching. Evidence required. |
| **10** | Proven reproducible by automated test suite across all input variations. Unreachable without test infrastructure. |

---

### Trigger Coverage (default weight: 15%)

*Would a user who needs this skill find it and invoke it correctly?*

| Score | Anchor |
|---|---|
| **0** | No trigger list or a single vague phrase. Skill would not be found in practice. |
| **2** | 1-2 generic triggers. No do-not-trigger case. Phrasing is hypothetical, not observed. |
| **4** | 2-3 triggers. Reasonable but not validated against real use. Do-not-trigger absent. |
| **5 — AVERAGE** | 3-4 triggers covering the main invocation surface. Phrasing is plausible. Do-not-trigger absent or minimal. |
| **6** | 4-5 triggers. Include common variants (verb swaps, rephrases). Do-not-trigger present. |
| **7 — GOOD** | 6+ triggers; match documented real phrasing (observed, not hypothetical); include verb variants and common misspellings; explicit do-not-trigger list with at least 2 entries. |
| **8** | Everything at 7 + validated against PROMPT_LOG.md or equivalent real invocation records. No missed phrasings from recorded use in last 30 days. Evidence required. |
| **8.5** | Everything at 8 + validated across 30+ days of PROMPT_LOG.md records with zero missed phrasings found. At most 1-2 plausible edge phrasings remain unvalidated. Evidence cited. Contrarian + Methodologist Perspective Sweep confirms coverage. |
| **9** | Near-comprehensive coverage validated with evidence. Near-zero miss rate on real inputs. |
| **10** | Formally proven complete via automated trigger-detection testing. Unreachable without test infrastructure. |

---

### Accuracy (default weight: 15%)

*Does the skill handle what it says it handles, and fail gracefully on everything else?*

| Score | Anchor |
|---|---|
| **0** | No constraints or validation. Assumes best-case input always. Silent failures on bad input. |
| **2** | 1-2 constraints mentioned but not enforced. No edge case handling. Fails silently. |
| **4** | Happy path constrained. One main failure mode handled. Edge cases implied but not processed. Constraints use "should" not "must." |
| **5 — AVERAGE** | Happy path + 2-3 edge cases handled. Most constraints are explicit. One or two gaps in coverage. |
| **6** | Most constraints explicit ("must"). Most foreseeable edge cases handled. Failure modes name what to do. One or two gaps remain. |
| **7 — GOOD** | All listed edge cases handled explicitly. All validation steps named. All failure modes specify exactly what to do. All constraints are binary (pass/fail). Cap values, required-file checks, and boundary conditions present. |
| **8** | Everything at 7 + verified correct handling of all listed cases in real use (cited evidence). No silent failures discovered in practice. |
| **8.5** | Everything at 8 + all listed edge cases confirmed correct in 2+ independent real sessions. Adversarial review found no undetected failure paths. All constraints confirmed binary (pass/fail) in practice. Evidence required. Contrarian + Methodologist Perspective Sweep confirms. |
| **9** | Formally verified: automated tests exercise every listed edge case, constraint, and failure mode. Evidence required. |
| **10** | Proven correct by exhaustive formal verification or complete test coverage. Unreachable without test infrastructure. |

---

### Speed / Efficiency (default weight: 10%)

*Does the skill waste tokens or force unnecessary work?*

| Score | Anchor |
|---|---|
| **0** | Guaranteed redundant work on every invocation. Structural inefficiency. |
| **2** | Multiple redundant reads. Steps not batched. Significant unnecessary work for the task. |
| **4** | Some redundancy. Parallel work not documented. A few steps do multiple things. |
| **5 — AVERAGE** | No obvious redundancies. Steps do approximately one thing. Some batching present. Works but not lean. |
| **6** | No redundant reads. Steps are single-purpose. Parallel work batched where obvious. Approval gates minimal. |
| **7 — GOOD** | No redundant reads. Every step does one thing. All parallelizable work explicitly batched with documentation. Approval gates minimal and justified. Token footprint appropriate for the task. |
| **8** | Everything at 7 + profiled (cited evidence that no redundant tokens are spent in practice). No unnecessary context reads identified in real use. |
| **8.5** | Everything at 8 + profiled across 2+ independent sessions showing consistent token footprint. Specific redundancy sources eliminated and documented. Not yet benchmarked against a baseline alternative. Evidence required. Contrarian + Methodologist Perspective Sweep confirms. |
| **9** | Token-optimal for the task class. Benchmarked against a simpler alternative. Improvement headroom < 5%. |
| **10** | Formally proven minimal. Theoretical lower bound on token usage established and achieved. |

---

### AccentOS Fit (default weight: 10%)

*Is this skill actually wired for the AccentOS/Accent Lighting stack, or is it generic?*

**Ceiling note:** For GLOBAL-scope meta-skills (like skill-optimizer), the design ceiling is ~6-7 by nature. Supabase and BigCommerce refs are not applicable to fully generic meta-skills. Do not force refs that don't belong. The ceiling is a design fact, not a gap.

| Score | Anchor |
|---|---|
| **0** | No AccentOS-specific content. Fully generic. Any project could use this with a name swap. |
| **2** | "AccentOS" mentioned once. No stack-specific content, paths, or tool names. |
| **4** | 2-3 AccentOS refs. One correct path present. Mostly generic with AccentOS labels. |
| **5 — AVERAGE** | 3 AccentOS refs. Correct paths. Basic stack context. Stack tool names mentioned. |
| **6** | 3-4 refs. Correct paths (/home/user/accent-os/). Stack tools named. One Accent Lighting workflow example. |
| **7 — GOOD** | 4-5 AccentOS substitutions; correct paths; real tool names (Supabase hsyjcrrazrzqngwkqsqa, BC store-cwqiwcjxes, GMC, Klaviyo, Anthropic API); at least one workflow example from Accent Lighting operations. |
| **8** | Everything at 7 + examples drawn from documented real Accent Lighting use cases. Stack integration validated in practice. Evidence required. |
| **8.5** | Everything at 8 + 2+ real Accent Lighting use case examples with documented outcomes across independent sessions. Stack integration validated in 2+ separate real sessions. Evidence required. Contrarian + Methodologist Perspective Sweep confirms. |
| **9** | Fully integrated into AccentOS stack with tested behavior against the real environment. Evidence required. |
| **10** | Formally integration-tested with CI against AccentOS stack. Unreachable without test infrastructure. |

---

### Anti-pattern Compliance (default weight: 5%)

*Does the skill prevent known failure modes, and are those prohibitions enforceable?*

| Score | Anchor |
|---|---|
| **0** | No anti-patterns section. |
| **2** | 1-2 generic anti-patterns ("Never produce bad output"). Not enforceable. |
| **4** | 3 anti-patterns. Mix of specific and generic. No do-not-trigger anti-pattern. |
| **5 — AVERAGE** | 3-4 anti-patterns. Most specific and enforceable. At least one covers a real documented failure mode. |
| **6** | 4-5 anti-patterns. Specific and binary (pass/fail). Includes do-not-trigger case. |
| **7 — GOOD** | 5+ anti-patterns. All specific ("Never run more than 5 loops"), all binary pass/fail. Covers do-not-trigger, mutation guard, and at least 2 methodology failure modes. |
| **8** | Everything at 7 + all anti-patterns validated (no known violation in real use, cited evidence). Each maps to a real failure mode that was observed and prevented. |
| **8.5** | Everything at 8 + at least 3 anti-patterns have documented real failure instances they prevented (evidence cited). Adversarial review found no undetected failure modes. Contrarian + Methodologist Perspective Sweep confirms no blind spots. |
| **9** | Formally non-violating: adversarial test inputs exercising each anti-pattern produce the correct refusal behavior. |
| **10** | Proven non-violating by formal verification or exhaustive adversarial test coverage. |

---

## Calibration Reference Skill (scores 50/100)

Use this as your anchor. A skill that does everything below — and nothing more — should score 50. If you're scoring a skill higher than 50 and it doesn't clearly exceed ALL of these, your scores are inflated.

**What a 50/100 skill looks like:**
- Has 3-4 trigger phrases, phrasing is plausible but not validated against real use
- Has numbered, ordered steps that can be followed; some minor overlap
- Outputs described at skill level; most steps name a deliverable loosely
- Handles the happy path; 2 edge cases mentioned but not explicitly handled
- 3 anti-patterns, mix of specific and generic
- 3 AccentOS refs, correct paths, no workflow examples
- No formal testing, no real-use validation cited

This reference skill scores approximately:
| Dim | Score | Contribution |
|---|---|---|
| Output Quality | 5.0 | 1.25 |
| Methodology | 5.0 | 1.00 |
| Trigger Coverage | 5.0 | 0.75 |
| Accuracy | 5.0 | 0.75 |
| Speed | 5.0 | 0.50 |
| AccentOS Fit | 5.0 | 0.50 |
| Anti-pattern | 5.0 | 0.25 |
| **TOTAL** | | **5.00 × 10 = 50.0** |

---

## Weight Optimization — Expected Impact Method

Used in Step 9 (Rubric Evolution). Distributes weights toward dimensions with the highest expected improvement potential next pass.

**Formula:**

For each active dimension i:
1. `gap_i = 10 − score_i` (remaining raw headroom)
2. `potential_i` = estimated improvement rate:
   - Dimension moved this pass: use actual delta as baseline
   - Dimension targeted but resisted (<0.5 delta): use `actual_delta × 0.5` (penalize resistance)
   - Dimension not targeted: use cross-skill average or default 0.5 pts/pass
   - Structural ceiling (same score ±0.5 for 3+ consecutive passes): `potential = 0`
3. `expected_impact_i = gap_i × potential_i`
4. `new_weight_i = (expected_impact_i / Σ expected_impact_j) × 100`
5. Clamp: minimum 3% per dim, maximum 35% per dim
6. Renormalize after clamping to sum = 100%

**Structural ceiling detection:** If a dimension has been within ±0.5 of the same score for 3+ consecutive passes despite being targeted, flag it as a structural ceiling. Set `potential = 0` and floor weight at 3% (don't zero — it still matters, just deprioritized).

**Dead-weight detection:** If a dimension's expected_impact rounds to 0 (either at raw 10 or structural ceiling), its weight floors at 3%. All other dims absorb the freed weight proportionally.

---

## Common Alternative Dimensions

When Step 2 (Dimension Registry Review) adds a custom dimension, define anchors before scoring.

### Route Accuracy (routing / trigger-detection skills)
| Score | Anchor |
|---|---|
| 5 | Routes correctly for obvious inputs. Ambiguous inputs produce inconsistent results. |
| 7 | Routes correctly across all documented inputs; explicit tie-break rule for ambiguous cases; fallback for no-match. |
| 9 | Validated: no misroutes in real session history (evidence required). |

### Reasoning Transparency (analysis / recommendation skills)
| Score | Anchor |
|---|---|
| 5 | Conclusions present but reasoning mostly implicit. |
| 7 | Every recommendation shows: data → interpretation → conclusion. Reader can trace and challenge each step. |
| 9 | Independently verified: a skeptic reviewing the reasoning chains can reproduce the conclusions (evidence required). |

### Format Correctness (artifact-generation skills)
| Score | Anchor |
|---|---|
| 5 | Output structure is approximately correct but requires manual cleanup. |
| 7 | Every output block is in exact required format; all required fields present; could pass schema validation. |
| 9 | Passes automated schema validation on all documented inputs (evidence required). |

### Edge Case Coverage (when split from Accuracy)
| Score | Anchor |
|---|---|
| 5 | Handles the obvious empty-input case. Misses boundary and malformed cases. |
| 7 | Every potentially-failing step has an explicit handler naming what to do (not just "handle it"). Boundary values, missing prereqs, malformed inputs all covered. |
| 9 | All listed edge cases tested with automated inputs (evidence required). |

---

## Dimension Registry Protocol

**Adding a dimension:**
1. Name it (title case, consistent with existing names)
2. Define anchors at 0, 5, 7, 9, 10 before scoring
3. Assign initial weight; default 10% unless specified
4. Reduce all other weights proportionally: `new_wt = old_wt × (100 − new_dim_wt) / 100`
5. Round to nearest 1%. Verify sum = 100%

**Retiring a dimension:**
1. Record reason in history log (Step 12)
2. Redistribute weight proportionally to remaining active dims
3. Keep visible in score tables as `[retired v[N]]` for longitudinal readability

**Anti-inflation guard:** Never increase any single dimension's weight above 35% — it would allow one dim to dominate and mask a broken dimension with floor penalty.
