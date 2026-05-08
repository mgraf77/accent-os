# DDV Evaluator — Output Template

Standard report format. Every evaluation uses this structure exactly. No deviations.

---

## Template

```markdown
# DDV Evaluation Report
**Target:** [Target Name]  
**Type:** [TargetType]  
**Date:** [YYYY-MM-DD]  
**Evaluator Version:** ddv-evaluator v[N]

---

## Executive Summary

| Metric | Value |
|---|---|
| Baseline Score | [0–100] |
| Result Score | [0–100] |
| Delta | [+/- value] |
| Velocity | [delta / effort_units, 2 decimal places] |
| Acceleration | [+/- value or "N/A — first evaluation"] |
| Complexity Drift | [value — negative is healthy] |
| Optimization ROI | [value or "N/A — no prior data"] |
| Confidence | [0–100]% |
| **Recommendation** | **[RECOMMENDATION_CODE]** |

---

## Dimension Analysis

| Dimension | Baseline | Result | Delta | Notes |
|---|---|---|---|---|
| Output Quality | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Accuracy | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Completeness | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Reusability | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Modularity | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Automation Value | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Human Burden Reduction | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Maintainability | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Integration Fit | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Scalability | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Adaptability | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Complexity Efficiency | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Optimization Potential | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Failure Resilience | [0–10] | [0–10] | [+/-] | [brief evidence] |
| Context Efficiency | [0–10] | [0–10] | [+/-] | [brief evidence] |
| **Overall (weighted)** | **[0–100]** | **[0–100]** | **[+/-]** | |

---

## Optimization Trajectory

[2–4 paragraph narrative. Cover:]
[1. Whether optimization is compounding (each pass yields more) or diminishing (each pass yields less).]
[2. The velocity trend across evaluations if prior data exists.]
[3. Whether the current trajectory justifies continued investment.]
[4. If this is the first evaluation, note baseline as the starting trajectory point.]

---

## Complexity Analysis

[2–3 paragraph narrative. Cover:]
[1. What complexity was added in this pass.]
[2. Whether that complexity is justified by the utility gained.]
[3. The complexity_drift value and what it signals about trajectory.]
[If complexity_drift is negative, explain why growth is proportionate and healthy.]
[If positive, identify the specific sources of unjustified complexity.]

---

## Risk Flags

[List all detected risks. Format per flag:]

**[RISK_CLASS]** — [SEVERITY]  
Evidence: [what triggered this flag]  
Recommended action: [one concrete action]

[If no risks detected:]
No risk flags triggered for this evaluation.

---

## Strategic Recommendation

**[RECOMMENDATION_CODE]**

[3–5 sentence rationale. Cover:]
[1. Which metric signals drove this recommendation.]
[2. What would need to change to shift to a different recommendation.]
[3. Any important caveats based on confidence level.]

[Secondary observations (up to 2):]
- [Secondary observation 1]
- [Secondary observation 2]

---

## Next Action

[One specific, actionable next step. Formatted as an imperative sentence.]
[Good: "Run the vendor-cascade eval suite to validate accuracy improvements before promoting to core."]
[Bad: "Consider whether to optimize further."]

---

## Skill Memory Update

*Compact entry for [Target Name]'s changelog:*

```
[YYYY-MM-DD] DDV v[N] eval: baseline=[X] result=[Y] delta=[Z] velocity=[V]
acceleration=[A or N/A] rec=[RECOMMENDATION_CODE] confidence=[C]%
next=[one-line next action]
```
```

---

## Rendering notes

**On Executive Summary:**
The Recommendation row is the load-bearing row. Make it bold, make it clear. Do not bury it.

**On Dimension Analysis:**
Score every row. Never omit a dimension because data is thin — make a calibrated estimate and note it in the Notes column. Omitted rows are worse than estimated rows.

**On Optimization Trajectory:**
Do not just repeat the velocity number in prose. Explain what it means given the artifact's history and context. Is velocity 3.2 good or bad for this type of artifact? Compare to prior evaluations if available.

**On Risk Flags:**
Severity matters. HIGH flags belong at the top of the list. If zero flags detected, say so explicitly — it's signal, not silence.

**On Strategic Recommendation:**
Lead with the code, then justify it. The code alone is not enough (the reader needs to understand the logic) and justification alone without the code is ambiguous. Both are required.

**On Next Action:**
This is the most read line in the report. Make it specific enough that someone with no other context could execute it.

---

## Abbreviated format (for log entries)

When appending to `meta-evaluations/ddv-log.md`, use this condensed format:

```
## [YYYY-MM-DD] [Target Name] v[N]
- Parent Skill:        [triggering skill or "manual"]
- Task Type:           [TargetType]
- Baseline:            [score]
- Result:              [score]
- Delta:               [+/- value]
- Velocity:            [value]
- Acceleration:        [value or "N/A — first evaluation"]
- Complexity Drift:    [value]
- Recommendation:      [RECOMMENDATION_CODE]
- Confidence:          [value]%
- Next Action:         [one-line]
- Notes:               [anything notable about this evaluation]
```
