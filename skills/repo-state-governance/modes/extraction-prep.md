# Mode: extraction-prep

## Identity
- **Mode key:** `extraction-prep`
- **Risk tier:** HIGH
- **Reversibility:** IRREVERSIBLE-IF-COMPLETED (the actual split is one-way; extraction-prep is reversible *until* the split happens)
- **Typical duration:** hours to weeks (the prep itself; the split is a discrete event after)
- **Concurrency:** SINGLE_AGENT (avoid two extraction streams diverging)

## Purpose
Prepare a subsystem (module, library, skill, service) inside the repo to be split out into its own repository. Extraction-prep produces an extraction spec, identifies coupling points, defines the API boundary, prepares migration scripts, and tests that the extracted unit works in isolation. It does **not** itself perform the split; it produces the artifact and verdict that authorize the split.

## Entry Conditions
- Manifest mode is `stabilize`
- The subsystem to extract is named (file paths, module name, or directory)
- A motivating reason exists (architecture decision, ownership change, reuse across repos, performance)
- An extraction target is named (new repo name, organization, hosting)

## Goals (ordered)
1. Identify all coupling points between the subsystem and the rest of the repo (imports, shared types, shared config, shared data)
2. Define the API boundary the extracted unit will expose
3. Verify (via tests or dry-run extraction) that the unit can run standalone
4. Plan the migration of consumers (who imports this? how do they update?)
5. Plan deprecation / pointer of the in-repo version after extraction
6. Run the extraction-readiness evaluator → READY / NOT_READY
7. Produce an extraction spec
8. Hand off to the actual split (out of mode scope)

## Allowed Actions
- Read all coupling sites; map dependencies in both directions
- Refactor in-repo to clean coupling boundaries (only when refactor is API-stabilizing, not feature work)
- Write standalone tests for the to-be-extracted unit
- Create a sandbox copy of the unit and verify it builds standalone (`extraction-prep` may create a sibling `_extraction-sandbox/` directory)
- Draft the new repo's `README.md`, `package.json` / `pyproject.toml` / equivalent
- Document the API boundary explicitly
- Plan consumer migration
- Plan in-repo deprecation strategy (delete vs. shim vs. re-export)
- Tag the pre-extraction state (`git tag pre-extraction/[unit-name]/[date]`)
- Generate the extraction spec
- Append to audit trail
- Update manifest

## Forbidden Actions
- Performing the actual split (this mode prepares; another action splits)
- Removing the in-repo unit before extraction is verified
- Breaking consumers (any consumer-facing change must be backward-compatible until migration is planned)
- Adding new features to the unit during extraction (pure prep, not enhancement)
- Renaming files / APIs unless the rename is part of the documented extraction spec
- Force-pushing or rewriting history
- Skipping the standalone-build verification
- Marking extraction-ready without consumer migration plan

## Execution Priorities
1. **Map dependencies first.** Don't refactor before you understand coupling.
2. **Stabilize the API boundary.** Once defined, treat it as a contract.
3. **Verify standalone.** A unit that builds and tests in isolation is extractable.
4. **Plan consumer migration.** An extracted unit nobody can use is a fork, not an extraction.
5. **Plan deprecation.** The in-repo version becomes a pointer or dies; never both.

## Documentation Requirements
- Extraction spec at `.governance/artifacts/[YYYY-MM-DD]-extraction-spec-[unit-name].md` (template: `templates/extraction-spec.template.md`)
  - Required sections:
    - Unit name (and current path in source repo)
    - Target repo name + hosting + organization
    - Motivation (1-3 sentences)
    - Coupling map (imports IN, imports OUT, shared types, shared state)
    - API boundary (exported surface; explicit)
    - Standalone-build verification (tested? how?)
    - Consumer list (who imports this; how they migrate)
    - Migration timeline (suggested phases)
    - In-repo deprecation strategy (delete / shim / re-export)
    - Risks
    - Rollback plan (what if extraction must be undone)
- Audit-trail entry
- Manifest update: `current_mode = "extraction-prep"`, `extraction_target = "[unit-name]"`

## Validation Requirements

**Universal:**
- Extraction-readiness evaluator returned READY (or NOT_READY blocks completion)
- Pre-extraction state tagged in git
- Extraction spec validates against `schemas/migration-report.schema.md`
- All required sections of the spec are non-empty
- Standalone-build verification passes (the unit, isolated, builds and tests green)
- Consumer migration plan exists and lists every known consumer

**Repo-specific:**
- Per manifest's `validation.extraction_extras`

## Completion Criteria
- Extraction spec complete and READY verdict
- Pre-extraction tag created
- Manifest updated
- Audit trail appended
- Operator has reviewed and approved the spec

The actual split happens after extraction-prep; it is a separate operation (typically `git filter-repo`, `git subtree split`, or manual file move + history rewrite). The split itself is what makes extraction irreversible.

## Allowed Transitions
- `extraction-prep → stabilize` — extraction completed (or aborted)
- `extraction-prep → freeze` — freeze the source repo during the actual split

**Not allowed without going through stabilize:**
- `extraction-prep → deploy-prep`
- `extraction-prep → handoff`

## Risk Profile

| Risk | Mitigation |
|---|---|
| Coupling missed; extracted unit doesn't actually build standalone | Standalone-build verification is a hard gate |
| Consumers break after split | Consumer list + migration plan; backward-compatible API where possible |
| In-repo deprecation is "delete" but consumers still import | Deprecation strategy is documented and matches consumer migration timeline |
| Extracted repo has no owner | Spec requires "target organization + maintainer" — cannot be empty |
| Extraction motivated by org politics, not architecture | Spec requires "motivation" — surface to operator if motivation is weak |
| API boundary changes after extraction | Boundary is a contract; changes go through normal release process in the new repo |
| Pre-extraction tag is not preserved | Validation requires the tag; do not complete without it |
| Multiple parallel extractions interfere | SINGLE_AGENT concurrency; only one extraction-prep at a time per repo |

## AI Agent Guidance

- **Map twice, cut once.** The dependency map is the most important artifact; spend time getting it right.
- **Be explicit about what's in scope.** "Extract the auth module" is vague — auth might mean files A-D, or A-D plus shared types in E. Pin it down.
- **Test the standalone build for real.** A sandbox copy that builds + tests green is the gate. Don't accept "should work."
- **Find every consumer.** Search across the repo (and known sister repos) for imports. Missed consumers = post-extraction bug reports.
- **Plan the in-repo deprecation strategy explicitly.** Delete vs. shim vs. re-export are different — pick one and document the timeline.
- **Don't perform the split.** Extraction-prep ends with a READY spec; the human (or a follow-up workflow) performs the actual split.

## Human-in-the-Loop Touchpoints

- **Required to enter:** human authorizes "yes, we are extracting [unit] into a new repo."
- **Required to declare READY:** human reviews the spec and confirms; agents do not self-declare extraction-ready.
- **Required to execute the split:** out of scope for this mode, but the split itself is human-driven.
- **Required to override consumer migration plan:** if a consumer cannot be migrated, human accepts the breakage explicitly.
