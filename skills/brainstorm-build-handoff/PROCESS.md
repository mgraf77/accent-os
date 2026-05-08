# PROCESS — running brainstorm-build-handoff end-to-end

This is the operator's manual. SKILL.md is the contract; this is the walkthrough.

---

## 0. Preflight

```bash
SLUG=<kebab-case-project-name>
node skills/brainstorm-build-handoff/scripts/init.js $SLUG
```

`init.js` creates `artifacts/<slug>/` with placeholder files:

```
artifacts/<slug>/
  00-raw.md             # paste the brainstorm here
  01-concept.json       # filled in by Phase 1
  ...
  07-HANDOFF.md         # final deliverable
  meta.json             # slug, created_at, branch, status
```

Drop the raw input into `00-raw.md`. Anything goes — transcript, voice memo
transcription, slack thread, scribbled outline.

---

## 1. PHASE 1 — Concept extraction

The skill reads `00-raw.md` and writes `01-concept.json` per the schema in
`schemas/01-concept.schema.json`. Follow `templates/01-concept.md` as the prompt
contract.

**Stop condition:** every required key has either a real value or
`"_unresolved": "<reason>"`.

---

## 2. PHASE 2 — Systems thinking

Read `01-concept.json`. Decompose into entities, orchestration, state, dependencies,
governance, scaling axes, interop surface. Write `02-systems.json` per the schema.

**Stop condition:** every orchestration row traces back to a Phase-1
`operational_goal`. Empty arrays are allowed only if Phase 3 explains them.

---

## 3. PHASE 3 — Failure & entropy analysis

Read `02-systems.json`. List ≤7 concrete failure modes per category. Each entry
references a key from Phase 2 — no abstract risk-talk.

**Stop condition:** every category has either entries or a justification.

---

## 4. PHASE 4 — Ralph loop (3 bounded passes)

Three passes, each writing a delta file:

| Pass | Focus    | Goal                                                       |
|------|----------|------------------------------------------------------------|
| 1    | simplify | remove premature abstractions, collapse near-duplicates    |
| 2    | de-risk  | neutralize the top 5 entries from `03-failures.json`       |
| 3    | unify    | make naming, ordering, key shapes consistent across phases |

Each pass is capped at ≤10 changes. A pass with `open_issues: []` and ≤2 changes is
**convergence**; note this in the final handoff.

**Stop condition:** all three passes written. Earlier artifacts are never modified
in place — deltas only.

---

## 5. PHASE 5 — MVP reduction

Conceptually apply the Ralph deltas to the Phase-2 systems map, then split everything
into `must_build`, `defer`, `delete`, `future_hooks`, and a one-sentence
`scope_boundary`.

**Stop condition:** `must_build` covers exactly enough to make the system useful
end-to-end, and `scope_boundary` is unambiguous.

---

## 6. PHASE 6 — Build plan

Generate the build plan: directory structure, schemas, implementation phases (DAG),
validation gates, operating rules, next phases.

**Stop condition:** `implementation_phases` form a DAG (validator checks for
cycles), every phase has at least one validation gate.

---

## 7. PHASE 7 — Handoff assembly

```bash
node skills/brainstorm-build-handoff/scripts/assemble-handoff.js $SLUG
node skills/brainstorm-build-handoff/scripts/validate.js $SLUG
```

The assembler is deterministic — it does not invent prose. The validator runs the
checklist in `validators/checklist.md`. If validation fails, fix the offending JSON
artifact and re-run.

**Stop condition:** `validate.js` exits with code 0.

---

## 8. Final output

After validation passes, the skill prints exactly the eight sections from SKILL.md
§ "Step 8 — Final Output to Michael" and stops.

The handoff file at `artifacts/<slug>/07-HANDOFF.md` is the deliverable.

---

## Resuming a partial run

Re-run the skill with the same slug. It detects existing artifacts and resumes from
the first missing phase. Validators are run after every phase, not just at the end,
so a malformed earlier artifact will halt the run with a specific error.

---

## Common failure modes

| Failure                                | Cause                                  | Fix                                              |
|----------------------------------------|----------------------------------------|--------------------------------------------------|
| Validator reports "ambiguous keyword"  | Words like "various", "etc." in JSON   | Replace with a concrete value or `_unresolved`   |
| DAG cycle in `implementation_phases`   | Phase X depends on Phase Y depends on X| Re-sequence, or split a phase                    |
| `must_build` exceeds ~12 items         | Scope creep                            | Move items to `defer` with a trigger condition   |
| Ralph pass has >10 changes             | Pass is doing too much                 | Split into the next pass or escalate to `defer`  |
| `scope_boundary` is a paragraph        | Not a sentence                         | Compress to a single done-criterion              |

---

## When to NOT run this skill

- Single-feature requests on existing code → use Edit.
- Decision questions ("should we build X?") → `priority-articulation`.
- External-tool ingestion → `skill-forge`.
- Pure data work → `supabase-sql-magic` or `analysis-snapshot`.
