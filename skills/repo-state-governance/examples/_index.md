# Examples

Worked examples of full mode cycles. Each example walks through a realistic scenario end-to-end, showing inputs, manifest updates, audit trail entries, and produced artifacts. Examples are illustrative — actual repos will differ — but the structure is canonical.

## Quick reference

| Example | File | Demonstrates |
|---|---|---|
| Pause cycle | `example-pause-cycle.md` | clean-pause workflow + safe-resumption workflow |
| Handoff | `example-handoff.md` | ai-handoff workflow (Claude → Codex) |
| Deploy prep | `example-deploy-prep.md` | deployment-preparation workflow with caveats |
| Extraction | `example-extraction.md` | architecture-extraction workflow |

## How to read these examples

Each example shows:
1. **Setup** — initial state (manifest, working tree, recent activity)
2. **Trigger** — what the operator said / why the workflow runs
3. **Execution** — phase-by-phase what happens
4. **Artifacts** — what gets produced (manifest update, audit trail entry, full artifact body)
5. **Outcome** — final state

Examples deliberately include the kind of small messy details that real workflows have (a flaky test, a forgotten dependency, an unclear next step) so the example illustrates how the framework handles imperfection, not just clean cases.
