# Rubric Weights — skill-optimizer

> Reference for Step 2 (Score Current) and Step 7 (Score Matrix Test).
> Default weights sum to 100%. Adjust per Step 3 override instructions.

---

## Default Weights

| Dimension | Weight | Rationale |
|---|---|---|
| Output Quality | 25% | A skill that produces undefined or inconsistent output is useless regardless of how well the steps are written |
| Methodology Fitness | 20% | Workflow clarity drives reproducibility — vague steps produce vague results |
| Trigger Coverage | 15% | Trigger phrases are the invocation surface; a skill that isn't found can't be used |
| Accuracy | 15% | Constraints and edge cases being explicit prevents silent failures |
| Speed / Efficiency | 10% | Token waste and unnecessary steps slow down every session that uses the skill |
| AccentOS Fit | 10% | Generic output is lower-value than AccentOS-specific output for Accent Lighting workflows |
| Anti-pattern Compliance | 5% | Listed prohibitions prevent known failure modes from recurring |

---

## Scoring Guide Per Dimension

### Output Quality (25%)
| Raw | What it means |
|---|---|
| 10 | Every step names a specific, paste-ready output. Blocks/tables defined with exact field names. No ambiguity about what you receive. |
| 8–9 | Most steps have named outputs. One or two steps describe process without naming the artifact. |
| 6–7 | Output format exists but is loosely defined ("a summary", "some notes"). |
| 4–5 | Output described at skill level only, not per step. |
| 0–3 | No output format defined. Skill reads like a process description, not a deliverable spec. |

### Methodology Fitness (20%)
| Raw | What it means |
|---|---|
| 10 | Steps are numbered, ordered, imperative-voiced, non-overlapping. Each has a single purpose and a stop condition. |
| 8–9 | Steps are clear and ordered. Minor overlap or one ambiguous step. |
| 6–7 | Steps can be followed but some are multi-purpose or could be reordered without consequence. |
| 4–5 | Steps read as bullet notes rather than a workflow. Order matters but isn't enforced. |
| 0–3 | Workflow is not a workflow — it's a description of desired behavior without actionable steps. |

### Trigger Coverage (15%)
| Raw | What it means |
|---|---|
| 10 | ≥6 trigger phrases; phrases match Michael's documented phrasing from PROMPT_LOG.md; includes common variants (verb swap, rephrase); explicit do-not-trigger list present. |
| 8–9 | 4–5 triggers; reasonable match to real phrasing; no do-not-trigger list. |
| 6–7 | 3–4 triggers; phrasing is generic / hypothetical rather than observed. |
| 4–5 | 1–2 triggers. Likely to be missed. |
| 0–3 | No trigger list or a single vague phrase. |

### Accuracy (15%)
| Raw | What it means |
|---|---|
| 10 | Edge cases listed and handled. Validation steps explicit. Failure modes name what to do. Constraints referenced directly (cap values, required reads, file must-exist checks). |
| 8–9 | Most constraints explicit. One or two edge cases implied but not handled. |
| 6–7 | Happy-path only. Edge cases exist but skill silently fails on them. |
| 4–5 | Constraints present but expressed as "should" rather than "must." |
| 0–3 | No constraints or validation. Skill assumes the best-case input always. |

### Speed / Efficiency (10%)
| Raw | What it means |
|---|---|
| 10 | No redundant reads. Steps do one thing. Parallel work is batched. No unnecessary approval gates. Token footprint is minimal for the task. |
| 8–9 | One redundant read or one step that could be collapsed into another. |
| 6–7 | Two or three efficiency gaps. Some steps do work that earlier steps already did. |
| 4–5 | Repeated context reads. Steps not batched when parallel work is obvious. |
| 0–3 | Skill is structured in a way that guarantees redundant work on every invocation. |

### AccentOS Fit (10%)
| Raw | What it means |
|---|---|
| 10 | ≥5 AccentOS-stack substitutions; references actual paths (`/home/user/accent-os/`); names real tools (Supabase hsyjcrrazrzqngwkqsqa, BigCommerce store-cwqiwcjxes, GMC, Klaviyo, Anthropic API); examples reference vendor scoring or Accent Lighting workflows. |
| 8–9 | 3–4 substitutions; paths correct; one concrete Accent Lighting example. |
| 6–7 | 2–3 substitutions; mostly generic with AccentOS labels pasted on. |
| 4–5 | 1–2 substitutions; could apply to any project with a name swap. |
| 0–3 | No AccentOS-specific content. Fully generic skill. |

### Anti-pattern Compliance (5%)
| Raw | What it means |
|---|---|
| 10 | ≥5 anti-patterns; each is specific ("Never run more than 5 loops"); includes the do-not-trigger case; rules are enforceable (binary pass/fail). |
| 8–9 | 3–4 anti-patterns; most specific; one or two could be tighter. |
| 6–7 | 3 anti-patterns; at least one is generic ("Never produce bad output"). |
| 4–5 | 1–2 anti-patterns or they're all generic. |
| 0–3 | No anti-patterns section. |

---

## Custom Dimension Protocol

When Michael adds a custom dimension (Step 3 override "add ability to [X]"):

1. Name the dimension.
2. Assign a weight (Michael-specified or default to 10%).
3. Reduce all other weights proportionally: `new_weight = old_weight × (100 - custom_weight) / 100`.
4. Round to nearest 1%. Verify sum = 100% before scoring.
5. Define a 0–10 scoring guide for the new dimension before running Step 2.

---

## Weight Override Examples

| Override phrase | Result |
|---|---|
| "+10%" | Threshold = Baseline × 1.10 (not a weight change — a threshold change) |
| "just fix the triggers" | Scope to Trigger Coverage only; all other dimensions frozen at baseline score |
| "add ability to auto-log sessions, weight it 15%" | Add Auto-log Sessions dim at 15%; reduce others proportionally to sum to 100% |
| "minimum 85" | Threshold = 85; weights unchanged |
