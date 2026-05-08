# DDV Evaluator

**Derivative Delta Velocity — Universal Meta-Evaluation Framework**

---

## What it does

The DDV Evaluator answers three questions about any AccentOS system artifact:

1. **Did this optimization actually improve things?** (Delta)
2. **Was the improvement worth the cost?** (Velocity)
3. **Is further optimization justified?** (Recommendation)

It is not a benchmarking tool. It is a strategic decision layer: given what we just shipped, what should happen next?

---

## What it evaluates

| Artifact type | Examples |
|---|---|
| Skills | `vendor-cascade`, `efficiency-monitor`, any `skills/*/SKILL.md` |
| Prompts | System prompts, task prompts, Ralph loop prompts |
| Optimization passes | Any Ralph loop iteration, codex-review pass, refactor |
| Workflows | Multi-step automation sequences, agent chains |
| Build plans | `BUILD_PLAN_CLAUDE.md` sections, M-tasks |
| Handoff pipelines | Session handoffs, cross-agent context transfers |
| Orchestration systems | Multi-skill dispatch flows |
| Itself | Recursive self-evaluation after each version |

---

## Core model

```
Previous State
    → Current State
        → Delta (raw improvement)
            → Velocity (delta / effort)
                → Acceleration (velocity trend)
                    → Recommendation
```

---

## Quick start

**Manual trigger:**
```
evaluate skill: vendor-cascade
```
or:
```
DDV check on the last optimization pass
```

**Auto-trigger:** Fires automatically at the end of any Optimization Skill pass. No explicit invocation needed when the integration pipeline is active.

**Self-evaluation:**
```
DDV check: self
```

---

## File map

| File | Purpose |
|---|---|
| `SKILL.md` | Trigger recognition + 8-step evaluation workflow |
| `schema.md` | Data structures for inputs, outputs, and log entries |
| `scoring-logic.md` | Metric formulas, effort weights, recommendation rules, risk detection |
| `evaluation-rubric.md` | Per-dimension scoring criteria (0–10) for all 15 dimensions |
| `output-template.md` | Standard report format — copy-paste ready |
| `examples.md` | Four realistic worked evaluations with full report output |
| `integration-guide.md` | How to wire DDV into the Optimization Skill pipeline |
| `future-improvements.md` | Expansion hooks — what this becomes when the ecosystem matures |
| `changelog.md` | Version history + self-evaluation results |
| `test-cases/` | Five evaluation scenarios for regression testing |

---

## Output summary

Every evaluation produces:
- **Executive Summary** table (9 metrics)
- **15-dimension analysis** (baseline → result → delta for each)
- **Optimization Trajectory** narrative (compounding vs diminishing)
- **Complexity Analysis** narrative (is added complexity justified)
- **Risk Flags** (12 risk classes checked)
- **Strategic Recommendation** (one of 12 allowed outputs)
- **Next Action** (highest-leverage next step)
- **Skill Memory Update** (compact entry for target's changelog)
- **Log entry** appended to `meta-evaluations/ddv-log.md`

---

## Recommendation outputs

```
CONTINUE_OPTIMIZING      HIGH_PRIORITY_OPTIMIZATION
PROMOTE_TO_CORE          LOW_RETURN_AREA
SIMPLIFY                 REQUIRES_HUMAN_REVIEW
FORK_VARIANT             REWRITE
MERGE                    ROLL_BACK
PAUSE                    DEPRECATE
```

---

## Design philosophy

The evaluator is deliberately conservative:
- Scores require evidence, not intuition
- Recommendations require multiple metric signals, not one
- Complexity growth is always suspicious until proven justified
- Optimization theater (high effort, low delta) is a first-class risk
- The evaluator surfaces its own confidence level on every report

When data is thin (first evaluation, no baseline), the evaluator says so and uses conservative estimates. It never fabricates precision.

---

## Self-evaluation

The DDV Evaluator runs on itself after build completion. The first self-evaluation result is recorded in `changelog.md` and `meta-evaluations/ddv-log.md`. It identified three weaknesses in v1 and applied two improvements automatically.

See `changelog.md` for the full self-evaluation record.
