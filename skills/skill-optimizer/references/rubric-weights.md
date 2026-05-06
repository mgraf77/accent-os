# Rubric Weights — skill-optimizer

> Reference for Step 3 (Score on Active Rubric) and Step 8 (Score Test).
> Default 7 dimensions are a starter set — not a mandate. The Dimension Registry (Step 2) can add, retire, or rename dimensions each pass. This file provides scoring guides for the defaults and most common alternatives.

---

## Default Starter Set

| Dimension | Default Weight | Applies To | Rationale |
|---|---|---|---|
| Output Quality | 25% | all | A skill that produces undefined or inconsistent output is useless regardless of step quality |
| Methodology Fitness | 20% | all | Workflow clarity drives reproducibility — vague steps produce vague results |
| Trigger Coverage | 15% | all | Trigger phrases are the invocation surface; a skill not found can't be used |
| Accuracy | 15% | all | Explicit constraints and edge cases prevent silent failures |
| Speed / Efficiency | 10% | all | Token waste and redundant steps slow every session that uses the skill |
| AccentOS Fit | 10% | PROJECT / BOTH | Generic output is lower-value than AccentOS-specific output for Accent Lighting workflows |
| Anti-pattern Compliance | 5% | all | Listed prohibitions prevent known failure modes from recurring |

---

## Scoring Guide — Default Dimensions

### Output Quality (25%)
| Raw | What it means |
|---|---|
| 10 | Every step names a specific, paste-ready output. Blocks/tables defined with exact field names. No ambiguity about what you receive. |
| 8–9 | Most steps have named outputs. One or two describe process without naming the artifact. |
| 6–7 | Output format exists but loosely defined ("a summary", "some notes"). |
| 4–5 | Output described at skill level only, not per step. |
| 0–3 | No output format. Skill reads like a process description, not a deliverable spec. |

### Methodology Fitness (20%)
| Raw | What it means |
|---|---|
| 10 | Steps numbered, ordered, imperative-voiced, non-overlapping. Each has a single purpose and a stop condition. |
| 8–9 | Steps clear and ordered. Minor overlap or one ambiguous step. |
| 6–7 | Steps can be followed but some are multi-purpose or could be reordered without consequence. |
| 4–5 | Steps read as bullet notes rather than a workflow. Order matters but isn't enforced. |
| 0–3 | Workflow is not a workflow — a description of desired behavior without actionable steps. |

### Trigger Coverage (15%)
| Raw | What it means |
|---|---|
| 10 | ≥6 trigger phrases; match Michael's documented phrasing; include common variants; explicit do-not-trigger list. |
| 8–9 | 4–5 triggers; reasonable match to real phrasing; no do-not-trigger list. |
| 6–7 | 3–4 triggers; generic / hypothetical rather than observed. |
| 4–5 | 1–2 triggers. Likely to be missed in practice. |
| 0–3 | No trigger list or a single vague phrase. |

### Accuracy (15%)
| Raw | What it means |
|---|---|
| 10 | Edge cases listed and handled. Validation steps explicit. Failure modes name what to do. Constraints referenced directly (cap values, required reads, must-exist checks). |
| 8–9 | Most constraints explicit. One or two edge cases implied but not handled. |
| 6–7 | Happy-path only. Edge cases exist but skill silently fails on them. |
| 4–5 | Constraints present but expressed as "should" rather than "must." |
| 0–3 | No constraints or validation. Skill assumes best-case input always. |

### Speed / Efficiency (10%)
| Raw | What it means |
|---|---|
| 10 | No redundant reads. Steps do one thing. Parallel work is batched. No unnecessary approval gates. Token footprint minimal for the task. |
| 8–9 | One redundant read or one step that could be collapsed. |
| 6–7 | Two or three efficiency gaps. Some steps redo earlier work. |
| 4–5 | Repeated context reads. Steps not batched when parallel work is obvious. |
| 0–3 | Structured in a way that guarantees redundant work on every invocation. |

### AccentOS Fit (10%)
| Raw | What it means |
|---|---|
| 10 | ≥5 AccentOS-stack substitutions; references actual paths (`/home/user/accent-os/`); names real tools (Supabase hsyjcrrazrzqngwkqsqa, BigCommerce store-cwqiwcjxes, GMC, Klaviyo, Anthropic API); examples reference Accent Lighting workflows. |
| 8–9 | 3–4 substitutions; paths correct; one concrete Accent Lighting example. |
| 6–7 | 2–3 substitutions; mostly generic with AccentOS labels pasted on. |
| 4–5 | 1–2 substitutions; could apply to any project with a name swap. |
| 0–3 | No AccentOS-specific content. Fully generic skill. |

### Anti-pattern Compliance (5%)
| Raw | What it means |
|---|---|
| 10 | ≥5 anti-patterns; each is specific and enforceable (binary pass/fail); includes do-not-trigger case. |
| 8–9 | 3–4 anti-patterns; most specific; one or two could be tighter. |
| 6–7 | 3 anti-patterns; at least one generic ("Never produce bad output"). |
| 4–5 | 1–2 anti-patterns or all are generic. |
| 0–3 | No anti-patterns section. |

---

## Common Alternative Dimensions

When the Dimension Registry adds or replaces a dimension, define a scoring guide before scoring. Most common alternatives:

### Route Accuracy (for routing / trigger-detection skills)
| Raw | What it means |
|---|---|
| 10 | Routes to the correct downstream skill in ≥95% of realistic inputs; handles ambiguous inputs with a tie-break rule; explicit fallback for no-match. |
| 7–9 | Routes correctly for common cases; one or two edge inputs route incorrectly. |
| 4–6 | Routing is best-effort with no explicit tie-break. Ambiguous inputs often misrouted. |
| 0–3 | No routing logic; delegates to guesswork or produces arbitrary output. |

### Reasoning Transparency (for analysis / recommendation skills)
| Raw | What it means |
|---|---|
| 10 | Every recommendation shows the chain of reasoning: data → interpretation → conclusion. Reader can trace and challenge each step. |
| 7–9 | Most recommendations have visible reasoning. One or two conclusions are asserted without supporting chain. |
| 4–6 | Conclusions present but reasoning mostly implicit. |
| 0–3 | Outputs assertions with no visible reasoning. |

### Format Correctness (for artifact-generation skills)
| Raw | What it means |
|---|---|
| 10 | Every output block is in the exact required format (YAML / JSON / markdown table / etc.) with all required fields present and no extras. Passes schema validation. |
| 7–9 | Format correct; one or two optional fields missing or slightly malformed. |
| 4–6 | Output structure is approximately right but would require manual cleanup. |
| 0–3 | Output format is ad hoc; cannot be parsed or used directly. |

### Edge Case Coverage (specific split from Accuracy when needed)
| Raw | What it means |
|---|---|
| 10 | Every step that could fail on atypical input has an explicit handler (empty data, missing prereq, ambiguous input, boundary value). Handlers name what to do, not just "handle it." |
| 7–9 | Most edge cases handled. One or two implied but not explicit. |
| 4–6 | Handles the obvious empty-input case; misses boundary and malformed cases. |
| 0–3 | No edge case handling. Assumes all inputs are well-formed. |

---

## Dimension Registry Protocol

When the Dimension Registry (Step 2) adds, retires, or renames a dimension:

**Adding a new dimension:**
1. Name the dimension (kebab-case or title case — consistent with existing names).
2. Define the 0–10 scoring guide (add it to this file or define inline in Step 2 output).
3. Assign initial weight — default 10%; Michael-specified if requested.
4. Reduce all other weights proportionally: `new_wt = old_wt × (100 − new_dim_wt) / 100`. Round to nearest 1%. Verify sum = 100%.

**Retiring a dimension:**
1. Record retirement reason in the history log (Step 12).
2. Redistribute its weight proportionally to remaining active dimensions.
3. Keep the dimension visible in score tables marked `[retired v[N]]` so longitudinal comparisons remain readable.

**Renaming a dimension:**
1. Carry all historical scores forward under the new name.
2. Note the rename in the history log and rubric evolution output.

**Weight Override Examples:**

| Override phrase | Result |
|---|---|
| "+10%" | Threshold = Baseline × 1.10 (threshold change, not weight change) |
| "just fix the triggers" | Scope to Trigger Coverage only; all other dims frozen at baseline score |
| "add ability to auto-log sessions, weight it 15%" | Add new dim at 15%; reduce others proportionally to sum to 100% |
| "minimum 85" | Threshold = 85; weights unchanged |
| "accuracy is critical" | Apply accuracy-heavy profile |
