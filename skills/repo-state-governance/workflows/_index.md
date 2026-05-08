# Workflows

A workflow is a step-by-step orchestration that spans multiple modes. Each workflow is a named, reusable sequence — operators can invoke it by name instead of orchestrating the underlying mode transitions manually.

## Quick reference

| Workflow | File | Spans | Output artifact |
|---|---|---|---|
| clean-pause | `clean-pause.md` | active → stabilize → pause | pause-state |
| governance-migration | `governance-migration.md` | any → governance-transition → any | migration report |
| repo-recovery | `repo-recovery.md` | broken → recovery → stabilize | recovery plan + report |
| deployment-preparation | `deployment-preparation.md` | stabilize → deploy-prep → freeze | deploy checklist |
| safe-resumption | `safe-resumption.md` | pause/freeze → audit → resume → stabilize | resume report |
| architecture-extraction | `architecture-extraction.md` | stabilize → extraction-prep → split | extraction spec |
| ai-handoff | `ai-handoff.md` | active → stabilize → handoff | handoff doc |

## Workflow file template

Every workflow file has these sections:

1. **Identity** — name, motivating use case
2. **Inputs** — what the workflow needs to start
3. **Outputs** — artifacts produced
4. **Phases** — ordered list of phases, each with: target mode, actions, checkpoint, exit criteria
5. **Rollback strategy** — what to do if a phase fails
6. **Success criteria** — workflow-level "done" definition
7. **Common variations** — when the workflow is run differently (sub-paths, accelerated forms)
8. **Related workflows** — what to run before / after / instead

When authoring a new workflow, copy `clean-pause.md` (canonical structure) and adapt.
