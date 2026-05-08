# DDV Evaluator — Evaluation Rubric

Scoring criteria for all 15 dimensions. Each dimension scores 0–10.

Score by the best match, not the average. If an artifact demonstrates the behaviors described at "8–9" but has one small gap, score 8. If it demonstrates "4–5" behaviors with occasional "6–7" moments, score 5.

---

## 1. Output Quality

*Was the final result actually good?*

| Score | Description |
|---|---|
| 9–10 | Output exceeds the stated goal. A reviewer unfamiliar with the task would immediately recognize the result as production-ready. No obvious gaps. |
| 7–8 | Output meets all stated requirements. Minor rough edges that don't affect usefulness. |
| 5–6 | Output is functional and mostly meets requirements but has 1–2 meaningful gaps or quality issues. |
| 3–4 | Output is partially functional. Meets <75% of the stated requirements. Usable in limited cases. |
| 1–2 | Output is mostly non-functional or fails key requirements. Requires significant rework. |
| 0 | Output is absent, broken, or harmful. |

---

## 2. Accuracy

*Is the result correct?*

| Score | Description |
|---|---|
| 9–10 | Produces correct results across all known cases including edge cases. Logic is verifiably sound. |
| 7–8 | Correct in the main use case. Known edge cases are handled or explicitly documented as out of scope. |
| 5–6 | Mostly correct. 1–2 known edge cases produce incorrect results that are minor in impact. |
| 3–4 | Correct behavior is inconsistent. Works for simple cases, fails under realistic variation. |
| 1–2 | Frequently incorrect. Results cannot be trusted without manual verification. |
| 0 | Systematically wrong. Produces incorrect results as the norm. |

---

## 3. Completeness

*Does it cover what was required?*

| Score | Description |
|---|---|
| 9–10 | All requirements met. No known gaps. Scope is explicitly bounded and documented. |
| 7–8 | ≥90% of requirements met. Minor omissions are documented and planned. |
| 5–6 | 70–89% of requirements met. One meaningful feature or behavior missing. |
| 3–4 | 50–69% of requirements met. Multiple meaningful gaps. Partial deliverable. |
| 1–2 | <50% of requirements met. Skeleton or stub. Not deployable without major additions. |
| 0 | Essentially empty. Placeholder only. |

---

## 4. Reusability

*Can this be used by other parts of the ecosystem?*

| Score | Description |
|---|---|
| 9–10 | Applies directly to ≥5 other AccentOS contexts without modification. Input/output contracts are general enough for broad use. |
| 7–8 | Applies to 3–4 other contexts with minor adaptation. Interfaces are mostly general. |
| 5–6 | Applies to 1–2 other contexts with moderate adaptation. Some AccentOS-specific hardcoding. |
| 3–4 | Tightly coupled to its original use case. Reuse would require significant refactoring. |
| 1–2 | Single-purpose. Reuse is theoretically possible but practically infeasible without a rewrite. |
| 0 | Not reusable at all. Bespoke with no extractable logic. |

---

## 5. Modularity

*Is the architecture clean and decomposed?*

| Score | Description |
|---|---|
| 9–10 | Clearly decomposed into independent, named units. Each unit has a single responsibility. No hidden coupling. |
| 7–8 | Mostly modular. One or two areas of coupling that don't materially harm maintainability. |
| 5–6 | Some modular structure but meaningful coupling exists. Changing one part often requires changing another. |
| 3–4 | Monolithic structure with weak internal organization. Hard to locate specific logic. |
| 1–2 | Spaghetti. Logic is entangled. No clear module boundaries. |
| 0 | No structure. Everything is in one undifferentiated block. |

---

## 6. Automation Value

*Does this reduce future manual labor?*

| Score | Description |
|---|---|
| 9–10 | Fully automates a task that previously required 30+ minutes of manual work per occurrence. Estimated to trigger ≥10×/month. |
| 7–8 | Automates 80%+ of a recurring task. Some manual steps remain but they are minimal. |
| 5–6 | Automates the most tedious part of a task. Manual wrap-around still required. |
| 3–4 | Partially automates an infrequent task. Net labor savings are modest. |
| 1–2 | Marginal automation. Saves minutes, not hours, per occurrence. |
| 0 | No automation value. Manual process is unchanged or the artifact is itself a manual process. |

---

## 7. Human Burden Reduction

*Does this reduce how much Michael needs to think or decide?*

| Score | Description |
|---|---|
| 9–10 | Eliminates an entire category of Michael decision-making. He no longer needs to think about this class of problem. |
| 7–8 | Removes most of the cognitive load. Michael approves rather than decides. |
| 5–6 | Reduces cognitive load meaningfully but still requires Michael to do substantive analysis. |
| 3–4 | Provides information to support Michael's decisions but doesn't simplify the decision process. |
| 1–2 | Marginal burden reduction. The same cognitive load remains. |
| 0 | No burden reduction, or adds burden. |

---

## 8. Maintainability

*How easy will this be to keep working over time?*

| Score | Description |
|---|---|
| 9–10 | Self-documenting. A new Claude instance with no session context could read and maintain it in under 5 minutes. No hidden state. |
| 7–8 | Well documented. Minor domain knowledge required but clearly communicated. |
| 5–6 | Moderately maintainable. Some implicit knowledge required. Would take a new instance 15–30 min to get productive. |
| 3–4 | Hard to maintain. Significant institutional knowledge required. Non-obvious failure modes. |
| 1–2 | Very difficult to maintain. Likely to break when touched. Side effects are numerous and undocumented. |
| 0 | Unmaintainable. Any change is likely to introduce a regression. |

---

## 9. Integration Fit

*Does it fit naturally into the existing AccentOS ecosystem?*

| Score | Description |
|---|---|
| 9–10 | Integrates with 3+ existing skills/systems. Follows all AccentOS conventions. Registered in _index.md. Companion skills noted. |
| 7–8 | Integrates cleanly with 1–2 existing skills. Minor convention gaps. |
| 5–6 | Fits the ecosystem but has integration friction. May require wrapper code or minor ecosystem changes. |
| 3–4 | Partial fit. Requires meaningful ecosystem changes or workarounds. |
| 1–2 | Poor fit. Conventions ignored. Would require significant ecosystem adaptation. |
| 0 | Incompatible. Contradicts existing architecture or conventions. |

---

## 10. Scalability

*Will this hold up as data, usage, or complexity grows?*

| Score | Description |
|---|---|
| 9–10 | Architecture handles 10× current load with no changes. Bottlenecks are identified and documented if any. |
| 7–8 | Handles 3–5× growth. One known scalability ceiling that is documented. |
| 5–6 | Works at current scale. Meaningful scalability concerns at 2–3× growth. |
| 3–4 | Approaching scalability limits at current usage. Will need rework soon. |
| 1–2 | Already near capacity. Any growth will cause degradation. |
| 0 | Does not scale. Already failing under current load. |

---

## 11. Adaptability

*Can this evolve with changing requirements?*

| Score | Description |
|---|---|
| 9–10 | Expansion hooks designed in. Adding a new case requires touching one file or one configuration value. |
| 7–8 | Adding new requirements is straightforward. 1–2 files need changes, no architectural shifts. |
| 5–6 | Adaptable but requires meaningful refactoring for significant changes. |
| 3–4 | Rigid. Adding new behavior requires changes in multiple tightly-coupled places. |
| 1–2 | Very rigid. Any meaningful change risks breaking existing behavior. |
| 0 | Fixed. Cannot adapt without a full rewrite. |

---

## 12. Complexity Efficiency

*Is the complexity justified by the value delivered?*

| Score | Description |
|---|---|
| 9–10 | Delivers high value with minimal complexity. Could not achieve the same outcome with meaningfully less complexity. |
| 7–8 | Complexity is appropriate. One or two places where a simpler approach exists but the current approach is defensible. |
| 5–6 | Some unnecessary complexity. 20–30% of the complexity could be removed without losing capability. |
| 3–4 | Notably over-engineered. Significant complexity serves marginal use cases. |
| 1–2 | Severely over-engineered. The complexity is the dominant feature; value is secondary. |
| 0 | Complexity delivers no value. Pure complexity theater. |

---

## 13. Optimization Potential

*Is there meaningful upside remaining?*

| Score | Description |
|---|---|
| 9–10 | Large headroom remains. Specific, high-confidence improvements are identified. |
| 7–8 | Meaningful headroom. 2–3 identified improvement vectors. |
| 5–6 | Some headroom. Improvements are possible but require more analysis to identify. |
| 3–4 | Limited headroom. Close to practical ceiling for this approach. |
| 1–2 | Near ceiling. Only marginal improvements remain. |
| 0 | At ceiling. No meaningful optimization potential without a paradigm shift. |

---

## 14. Failure Resilience

*How well does this degrade under failure conditions?*

| Score | Description |
|---|---|
| 9–10 | Fails gracefully in all tested scenarios. Error messages are actionable. Partial failure doesn't cascade. |
| 7–8 | Handles the most likely failure modes well. 1–2 edge failure cases have room for improvement. |
| 5–6 | Handles happy path failures but has gaps under unusual failure conditions. |
| 3–4 | Brittle. Failures in dependencies cause silent errors or confusing output. |
| 1–2 | Fragile. A single failure in any dependency causes a full breakdown. |
| 0 | No failure handling. Any deviation from the happy path causes an unrecoverable state. |

---

## 15. Context Efficiency

*Does this use token/context budget effectively?*

| Score | Description |
|---|---|
| 9–10 | Achieves its goal with minimal token cost. Output is dense with signal. No filler. Reads well from within a compressed context window. |
| 7–8 | Efficient. Some verbosity but not enough to materially impact session context budget. |
| 5–6 | Moderate efficiency. Noticeable verbosity or repeated content that could be compressed. |
| 3–4 | Inefficient. Token cost to use this artifact is high relative to the value extracted. |
| 1–2 | Very inefficient. Heavy on boilerplate, filler, or repeated content. |
| 0 | Context poison. Using this artifact significantly degrades the session context budget. |

---

## Score Calibration Guide

Use these reference points to anchor scoring across sessions:

| Score | Meaning |
|---|---|
| 10 | World-class. Better than you expected to achieve in this pass. |
| 8–9 | Production-ready. No meaningful gaps. |
| 6–7 | Good. Useful and deployable with known limitations. |
| 4–5 | Functional but not ready for production use without improvement. |
| 2–3 | Draft quality. Shows direction but needs substantial work. |
| 0–1 | Failing or absent. |

**Important:** Do not award 10 unless you can articulate why it couldn't be improved further. A 9 is excellent; save 10 for genuinely exceptional cases.
