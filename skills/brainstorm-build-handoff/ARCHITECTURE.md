# ARCHITECTURE — brainstorm-build-handoff

This document records the architecture decisions made during the skill's design pass,
including critiques of the original directive and the reasoning behind the final
shape.

---

## 1. Pipeline shape

**Decision:** seven phases, strict order, one artifact per phase.

```
01-concept.json        (PHASE 1 — extraction)
02-systems.json        (PHASE 2 — systems thinking)
03-failures.json       (PHASE 3 — failure & entropy)
04-ralph-pass-1.json   (PHASE 4 — simplify)
04-ralph-pass-2.json   (PHASE 4 — de-risk)
04-ralph-pass-3.json   (PHASE 4 — unify)
05-mvp.json            (PHASE 5 — reduction)
06-build-plan.json     (PHASE 6 — plan)
07-HANDOFF.md          (PHASE 7 — assembled handoff)
```

**Why fixed phases instead of an open loop:** open loops produce prompt soup. Fixed
phases produce diffable artifacts that the validator can check.

**Why one artifact per phase:** lets the pipeline resume from any phase, lets phases
be regenerated independently, lets a downstream auditor diff a specific phase.

---

## 2. Naming and directory layout

**Decision:** AccentOS-style skill at `skills/brainstorm-build-handoff/`.

**Rejected:** the directive's top-level `brainstorm_build_handoff/` and nested
`skills/brainstorm_build_handoff.md`.

**Why:**
- AccentOS skills always live under `skills/<kebab-case>/SKILL.md` so the skill
  router (`skills/_index.md`) can discover them.
- A nested `skills/` dir inside this skill is redundant — SKILL.md at root carries
  the philosophy, principles, and pipeline. Nesting introduces a second skill-like
  artifact with no executor.

**Tradeoff:** breaks symmetry with the directive's filename. Documented in
`README.md` § "Naming convention".

---

## 3. Ralph loop bounding

**Decision:** exactly three passes, each with a fixed focus (simplify, de-risk,
unify) and a delta-only schema.

**Rejected:** "minimum 3 passes" with free-form iteration.

**Why:**
- Free-form iteration drifts into prompt soup. The directive itself names "no prompt
  soup" as Principle 4 — the original "minimum 3" wording violates that principle.
- Capping each pass at ≤10 changes forces prioritization. Convergence (≤2 changes
  with empty `open_issues`) is detectable and reportable.
- Three fixed focuses cover the orthogonal axes of optimization: complexity, risk,
  consistency. Adding a fourth axis (e.g., performance) is a `next_phases` decision.

**Tradeoff:** caps the upside on highly entangled systems. Mitigated by the
`open_issues` field, which surfaces unresolved items for human judgment.

---

## 4. Determinism strategy

**Decision:** every artifact is JSON until Phase 7. Phase 7 is structured Markdown
assembled by a deterministic script.

**Why:**
- JSON is diffable, machine-readable, and resists narration drift.
- Markdown at the end is the deliverable format because human and AI executors both
  consume it, and structured headings preserve machine readability.
- Separating "AI writes the JSON" from "script writes the Markdown" prevents the AI
  from inserting prose into the final artifact.

**Implementation:** `scripts/assemble-handoff.js` reads phases 01–06 and substitutes
into `templates/handoff.md`. No prose is generated at assembly time.

---

## 5. Validator design

**Decision:** Node.js script with no external dependencies, plus a human-readable
checklist.

**Why:**
- Adding `ajv` or `zod` ships a 200KB dependency for ~20 lines of validation logic.
- The checks needed (required-keys, ambiguity-keyword scan, DAG cycle detection) are
  ~150 LOC of vanilla JS.
- A checklist (`validators/checklist.md`) serves as the spec; the script enforces it.

**Tradeoff:** fewer features than `ajv` (no `$ref`, no `oneOf`). Acceptable for MVP;
documented as `next_phases` extension if cross-skill schema reuse becomes a need.

---

## 6. Storage strategy

**Decision:** runtime artifacts live in `artifacts/<slug>/` and are gitignored
*per-project* but the skill itself ships an `artifacts/.gitkeep` so the directory is
reified. The `examples/airlock/` directory is the exception — those artifacts are
checked in as the worked example.

**Why:**
- Runtime artifacts pollute git history.
- Examples are documentation, so they stay in version control.
- A single `.gitignore` line in the skill keeps things clean without
  per-developer setup.

---

## 7. Out-of-scope list (deliberately excluded from MVP)

These were considered and rejected for v1.0:

| Item                              | Why deferred                                          |
|-----------------------------------|-------------------------------------------------------|
| Web UI for the pipeline           | CLI is sufficient for MVP; UI is a downstream skill.  |
| Vector store for past handoffs    | Filesystem grep is sufficient at AccentOS scale.      |
| Auto-trigger from voice memos     | Requires audio pipeline; out of skill's scope.        |
| Cross-skill schema sharing        | Premature — one consumer, no shared types yet.        |
| LLM-judge convergence detection   | Heuristic (≤2 deltas + empty `open_issues`) suffices. |
| Multi-executor handoff variants   | Single Markdown handoff covers all named executors.   |
| Streaming / incremental output    | Phases are short enough that batching is fine.        |

Each item lives in `ROADMAP.md` with a trigger condition for revisiting.

---

## 8. Improvement summary vs. the original directive

| Original directive                                    | Final design                             |
|-------------------------------------------------------|------------------------------------------|
| `/brainstorm_build_handoff/` top-level                | `skills/brainstorm-build-handoff/`       |
| Nested `/skills/brainstorm_build_handoff.md`          | Removed — SKILL.md at skill root         |
| "Minimum 3 optimization passes"                       | Exactly 3 passes, fixed focuses          |
| Free-form Ralph passes                                | Delta-only schema with ≤10 changes       |
| Implicit artifact format per phase                    | JSON Schema for every phase              |
| Hand-written final handoff                            | Script-assembled from artifacts          |
| "Lightweight validation rules"                        | Single Node script + checklist           |
| Ambiguous "structured outputs"                        | Required-key contract per phase          |

The pipeline still implements every phase the directive required. Improvements are
in *form*, not in scope.
