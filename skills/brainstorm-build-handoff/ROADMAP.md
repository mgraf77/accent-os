# ROADMAP — brainstorm-build-handoff

The MVP is intentionally minimal. This document records what to build *next* and
the trigger conditions for each, so scope stays bounded.

---

## v1.0 — MVP (current)

Shipped:
- Seven-phase pipeline with deterministic JSON artifacts.
- Three-pass bounded Ralph loop with fixed focuses.
- Script-assembled final handoff (`scripts/assemble-handoff.js`).
- Zero-dependency validator (`scripts/validate.js`).
- Worked example (AIRLOCK).
- Schemas + templates per phase.

---

## v1.1 — Convergence diagnostics

**Trigger:** ≥3 real handoffs run; we want quantitative tracking of Ralph loop
quality.

Build:
- `scripts/diagnose.js` — emit per-pass deltas count, convergence flag, and time-to-
  convergence per slug.
- Append to `artifacts/<slug>/meta.json`.
- Optional: a top-level `RALPH_LOG.md` aggregating across slugs.

Do not build: dashboards, charts, web UIs.

---

## v1.2 — Cross-skill schema sharing

**Trigger:** a second skill (likely `priority-articulation` or a future
`build-orchestrator`) needs to consume `06-build-plan.json`.

Build:
- Move shared schemas to `skills/_shared/schemas/`.
- Switch `validate.js` to a tiny `$ref` resolver.

Do not build: `ajv` integration. The custom resolver stays under 100 LOC.

---

## v1.3 — Multi-executor handoff variants

**Trigger:** Michael actually runs a handoff against Codex (or another non-Claude
executor) and reports it required adaptation.

Build:
- `templates/handoff-codex.md`, `templates/handoff-engineer.md`.
- `scripts/assemble-handoff.js --executor=<name>` flag.

Do not build: separate handoffs per executor combo. One per declared
`primary_executor` is enough.

---

## v2.0 — Resumable observer mode

**Trigger:** raw inputs start exceeding ~50KB and Phase 1 starts losing fidelity.

Build:
- Streaming preflight that splits `00-raw.md` into chunks before extraction.
- Per-chunk `01-concept-N.json` files merged in a final pass.

Do not build: vector embeddings, semantic search. Filesystem grep + chunking is
sufficient up to ~500KB inputs.

---

## NEVER (or until proven necessary)

These are intentionally out of scope:

- **Web UI** — terminal output is the executor surface.
- **Vector store of past handoffs** — filesystem is enough at AccentOS scale.
- **Auto-trigger from voice memos** — audio pipeline belongs in another skill.
- **LLM-as-judge convergence detection** — heuristic is sufficient.
- **Streaming output** — phases are short enough that batching is fine.
- **Cross-project artifact sharing** — slugs are project-scoped on purpose.
- **Auto-PR creation from handoff** — that's the executor's job, not this skill's.

If any of these become necessary, document the trigger condition first, then build.
