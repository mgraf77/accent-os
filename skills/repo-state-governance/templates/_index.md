# Templates

Templates are starting points for artifacts. Copy a template, fill in the placeholders, validate against the matching schema in `schemas/`. Templates are NOT boilerplate — every field should be tailored to the actual situation.

## Quick reference

| Template | File | Schema | Use case |
|---|---|---|---|
| handoff | `handoff.template.md` | `schemas/handoff-report.schema.md` | `handoff` mode, `ai-handoff` workflow |
| audit-report | `audit-report.template.md` | `schemas/audit-report.schema.md` | `audit` mode |
| recovery-plan | `recovery-plan.template.md` | `schemas/recovery-plan.schema.md` | `recovery` mode, `repo-recovery` workflow |
| pause-state | `pause-state.template.md` | `schemas/state-report.schema.md` (variant) | `pause` mode, `clean-pause` workflow |
| deploy-checklist | `deploy-checklist.template.md` | (none — internal, but informed by `evaluators/deployment-readiness.md`) | `deploy-prep` mode |
| extraction-spec | `extraction-spec.template.md` | `schemas/migration-report.schema.md` (extraction variant) | `extraction-prep` mode, `architecture-extraction` workflow |

## Placeholder convention

- `[VALUE]` — replace with the actual value
- `[OPTIONAL: VALUE]` — section may be omitted if not applicable; replace label with the real one
- `<!-- delete this comment when filling in -->` — instructions for the operator to remove after filling in

## Hard rules

1. **Tailor every field.** "TBD" is not acceptable in a committed artifact (except for sections explicitly marked "fill in after completion").
2. **Validate before commit.** Run the matching evaluator (e.g. `handoff-completeness` for handoff reports) before committing.
3. **Don't leave instructional comments in the final artifact.** They're for the author, not the reader.
4. **Be specific.** Templates exist to ensure structure; specificity is the author's job.
