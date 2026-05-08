# Evaluators

An evaluator is a structured rubric that scores a specific dimension of repo readiness and produces a verdict. Evaluators are deterministic — same inputs should produce the same verdict. They are run by modes and workflows; they don't run themselves.

## Quick reference

| Evaluator | File | Used by | Verdict format |
|---|---|---|---|
| repo-health | `repo-health.md` | audit, stabilize, deploy-prep | numeric score 0–100 + tier |
| pause-readiness | `pause-readiness.md` | clean-pause workflow | READY / NOT_READY |
| deployment-readiness | `deployment-readiness.md` | deploy-prep mode | GO / NO_GO / GO_WITH_CAVEATS |
| governance-readiness | `governance-readiness.md` | governance-transition mode | READY / NOT_READY |
| extraction-readiness | `extraction-readiness.md` | extraction-prep mode | READY / NOT_READY |
| handoff-completeness | `handoff-completeness.md` | handoff mode, ai-handoff workflow | COMPLETE / INCOMPLETE |

## Evaluator file template

Every evaluator file has these sections:

1. **Identity** — name, purpose, used-by
2. **Inputs** — what the evaluator inspects
3. **Checklist** — explicit pass/fail or scored items, grouped by category
4. **Scoring** — how items combine into a verdict (binary, weighted, tiered)
5. **Verdict mapping** — ranges → verdict labels
6. **Output format** — exactly what the evaluator returns
7. **Common false-positives / false-negatives** — known limits of the rubric

When authoring a new evaluator, copy `repo-health.md` (the most structured example) and adapt.

## Evaluator hard rules

1. **Deterministic.** Same inputs, same verdict. If the rubric has fuzzy items, surface them as "needs operator interpretation," not "score it however."
2. **Self-contained.** An evaluator should be runnable without invoking other evaluators (avoid circular dependencies).
3. **Honest about limits.** Every evaluator has blind spots; the output format includes "what this rubric does NOT check."
4. **Repo-agnostic core, repo-specific extensions.** Universal items first; repo-specific items pulled from manifest's `validation.[evaluator]_extras`.
