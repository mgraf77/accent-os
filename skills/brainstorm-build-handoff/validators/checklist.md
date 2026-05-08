# VALIDATORS — checklist

The validator script (`scripts/validate.js`) enforces these rules. The checklist is
the human-readable spec; the script is the machine.

---

## Schema-presence checks (per artifact)

For every artifact `0N-*.json` in `artifacts/<slug>/`:

- [ ] Required keys present per `schemas/0N-*.schema.json`.
- [ ] No additional keys beyond `additionalProperties: false`.
- [ ] String fields satisfy `minLength` / `maxLength`.
- [ ] Array fields satisfy `minItems` / `maxItems`.
- [ ] Enum fields hold a permitted value.

---

## Ambiguity-keyword scan

The validator scans every JSON string and the assembled `07-HANDOFF.md` for these
banned tokens (case-insensitive, word-boundary):

```
TBD, ???, FIXME, "various", "some of the", "etc.", "and so on",
"as needed", "where appropriate", "in general", "kind of",
"maybe", "probably", "should be", "we'll figure out", "later"
```

Exception: a value of the form `_unresolved: <reason>` is allowed and surfaced as a
warning, not a failure.

---

## Phase-specific structural checks

### 01-concept

- [ ] `true_objective` is a single sentence (≤ 2 sentence-ending punctuation marks).
- [ ] `non_goals` has ≥ 1 entry.

### 02-systems

- [ ] Every entity has exactly one owner.
- [ ] Every orchestration row has either `traces_to_goal` set, or the artifact's
      `_unresolved_orchestration` array contains a reason for absence.

### 03-failures

- [ ] No category exceeds 7 entries.
- [ ] At least one of the eight categories is non-empty.

### 04-ralph-pass-{1,2,3}

- [ ] All three pass files exist.
- [ ] Each pass has ≤ 10 changes total across removals + merges + renames + additions.
- [ ] `pass` value matches filename suffix.
- [ ] `focus` matches the pass-to-focus contract:
      pass 1 → simplify, pass 2 → de-risk, pass 3 → unify.

### 05-mvp

- [ ] `must_build` has ≥ 1 entry.
- [ ] `scope_boundary` is a single sentence.
- [ ] Every `delete.reason` is in the fixed enum.

### 06-build-plan

- [ ] `implementation_phases` form a DAG (no cycles in `depends_on`).
- [ ] Every phase has ≥ 1 validation gate.
- [ ] `next_phases.trigger` values are concrete conditions, not "later" / "soon".

### 07-HANDOFF.md

- [ ] All required H2 sections present in order (see
      `schemas/07-handoff.schema.json`).
- [ ] No template placeholders remain (`{{...}}`).
- [ ] Ambiguity-keyword scan passes.

---

## Validator output contract

`scripts/validate.js <slug>` exits:

- `0` — all checks pass.
- `1` — at least one failure. Stdout lists each failure as
        `[<artifact>] <key path>: <reason>`.
- `2` — script invocation error (slug missing, paths broken).

Warnings (`_unresolved` markers) are printed to stderr but do not affect exit code.
