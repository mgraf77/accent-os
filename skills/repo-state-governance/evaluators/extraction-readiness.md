# Evaluator: extraction-readiness

## Identity
- **Name:** `extraction-readiness`
- **Purpose:** Verify that a planned extraction (subsystem → its own repo) is fully prepared: coupling mapped, API boundary defined, standalone build verified, consumer migration planned.
- **Used by:** `extraction-prep` mode, `architecture-extraction` workflow Phase 7

## Inputs
- Extraction spec (in progress)
- The unit's source files
- Repo-wide search results for consumers
- Sandbox (or planned sandbox) demonstrating standalone build

## Checklist

### Category C — Coupling map (any FAIL → NOT_READY)
- C1. Extraction spec lists all imports INTO the unit (dependencies) — pass/fail
- C2. Extraction spec lists all imports FROM the unit (consumers) — pass/fail
- C3. Shared types / shared config / shared state are enumerated — pass/fail
- C4. Test fixtures / test utilities the unit uses are accounted for — pass/fail
- C5. Indirect dependencies (via dynamic imports, reflection) are surfaced — pass/fail

### Category A — API boundary (any FAIL → NOT_READY)
- A1. Exported surface is enumerated as a list of named exports — pass/fail
- A2. Each export's stability commitment is noted (stable / semi-stable / experimental) — pass/fail
- A3. Boundary is minimized — only what consumers actually use is exposed — pass/fail
- A4. Internal-only utilities are clearly marked as not part of the boundary — pass/fail

### Category B — Standalone build (any FAIL → NOT_READY)
- B1. Sandbox copy of the unit exists (in `_extraction-sandbox/` or similar) — pass/fail
- B2. Sandbox copy includes minimum scaffolding (package.json, etc.) — pass/fail
- B3. Sandbox copy builds without errors — pass/fail
- B4. Sandbox copy's tests pass — pass/fail
- B5. Resolution decision is documented for each shared element (duplicate / depend-on / interface) — pass/fail

### Category M — Consumer migration plan (any FAIL → NOT_READY)
- M1. Every consumer (from C2) has a migration plan — pass/fail
- M2. Migration plan specifies new import path for each consumer — pass/fail
- M3. If API changed during extraction, per-consumer impact is documented — pass/fail/n-a
- M4. Consumer owners are identified (people responsible for each consumer) — pass/fail
- M5. Cross-repo consumers (if any) have notification plan — pass/fail/n-a

### Category D — In-repo deprecation strategy (any FAIL → NOT_READY)
- D1. Strategy is chosen explicitly: delete / shim / re-export — pass/fail
- D2. Timeline for the strategy is dated (not "eventually") — pass/fail
- D3. Soak / grace period is specified (if applicable) — pass/fail/n-a
- D4. Deprecation steps are coordinated with the actual split timing — pass/fail

### Category G — Governance for the new repo (any FAIL → NOT_READY)
- G1. New repo name is decided — pass/fail
- G2. Hosting / organization is decided — pass/fail
- G3. License for the new repo is decided — pass/fail
- G4. Maintainer / owner of the new repo is identified — pass/fail
- G5. License compatibility (source repo → new repo) is verified — pass/fail

### Category P — Pre-extraction state (any FAIL → NOT_READY)
- P1. Pre-extraction tag exists (`pre-extraction/[unit]/[date]`) — pass/fail
- P2. Tag is pushed to remote (if remote exists) — pass/fail/n-a
- P3. Source repo is in `extraction-prep` mode in manifest — pass/fail
- P4. Operator has reviewed the extraction spec — pass/fail
- P5. Operator sign-off is recorded — pass/fail

### Recommended (FAIL → NOT_READY with override)
- N1. README for the new repo is drafted — pass/fail
- N2. CHANGELOG for the new repo (with v1.0 covering the extraction) is drafted — pass/fail/n-a
- N3. CI configuration for the new repo is drafted — pass/fail/n-a
- N4. Initial test coverage for the extracted unit meets repo's typical bar — pass/fail/n-a

## Scoring

Binary verdict.

```
verdict =
  NOT_READY  if any Required item (C, A, B, M, D, G, P categories) is FAIL
  NOT_READY  if any Recommended item is FAIL and operator did not override
  READY      otherwise
```

## Verdict mapping

| Verdict | Meaning |
|---|---|
| READY | Extraction is fully prepared; safe to execute the actual split |
| NOT_READY | Preparation incomplete; do not perform the split |

## Output format

```markdown
## Extraction-readiness: [READY | NOT_READY]

**Unit:** [unit name]
**Source path:** [path in source repo]
**Target repo:** [name + hosting]
**Date:** [ISO-8601]

### Category C — Coupling map
- C1: ✓ / ✗ — [item]
- ...

### Category A — API boundary
- ...

### Category B — Standalone build
- ...

### Category M — Consumer migration plan
- ...

### Category D — In-repo deprecation strategy
- ...

### Category G — Governance for new repo
- ...

### Category P — Pre-extraction state
- ...

### Recommended (override possible)
- ...

### Blocking failures (if NOT_READY)
- [category-id] [item-id]: [item] — [specific failure + remediation]

### What this rubric does NOT check
- Whether extraction is the *right* architectural decision (that's a `decision-log` concern)
- Long-term maintainability of the new repo (depends on its future maintainers)
- Performance / build-time impact on consumers
```

## Common false-positives / false-negatives

- **False-negative on B3 (standalone build):** A sandbox copy may build but only because it copied test fixtures from the source repo; the *real* extracted repo will fail. Audit the resolution decisions in B5.
- **False-positive on M1 (every consumer has plan):** "Update import path" is not a real plan if the consumer is a third-party fork that the source-repo owner can't update. Surface cross-org consumers explicitly.
- **False-positive on G5 (license compatibility):** Heuristic check only; real compatibility analysis may need legal review.
