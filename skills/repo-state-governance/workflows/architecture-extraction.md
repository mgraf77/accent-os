# Workflow: architecture-extraction

## Identity
- **Name:** `architecture-extraction`
- **Motivating use case:** Operator has decided that a subsystem (module, library, skill, service) inside the repo should become its own repo. Prepare the extraction with full coupling analysis, standalone-build verification, and consumer migration plan.
- **Spans:** `stabilize` → `extraction-prep` → (the actual split, out of scope) → `stabilize` (in source repo)

## Inputs
- Manifest mode is `stabilize`
- Subsystem to extract is named (file paths, module name, directory)
- Target repo named (new repo name, hosting, organization)
- Motivation documented (architectural reason, ownership change, reuse, performance)

## Outputs
- Updated `repo-manifest.json`
- Audit-trail entries
- Extraction spec at `.governance/artifacts/[YYYY-MM-DD]-extraction-spec-[unit-name].md`
- Pre-extraction tag (`pre-extraction/[unit]/[date]`)
- (Optional) sandbox copy of the unit demonstrating standalone build
- Updated source repo with deprecation strategy in place (after the actual split)

## Phases

### Phase 1 — Stabilize (verify clean entry)
**Target mode:** `stabilize`

**Actions:**
- Verify stabilize Completion Criteria
- Run universal validation
- Confirm no in-flight WIP touching the unit-to-extract

**Checkpoint:**
- Repo healthy
- Unit-to-extract is in a clean state (not mid-refactor)

**Exit criteria:**
- Ready to enter extraction-prep

### Phase 2 — Map coupling
**Target mode:** `extraction-prep`

**Actions:**
- Update manifest: `current_mode = "extraction-prep"`, `extraction_target = "[unit]"`
- Find all imports / references TO the unit (consumers)
- Find all imports / references FROM the unit (dependencies)
- Identify shared types, shared config, shared state, shared test fixtures
- Document the coupling map in the extraction spec (template: `templates/extraction-spec.template.md`)

**Checkpoint:**
- Coupling map complete
- Every consumer identified
- Every dependency identified

**Exit criteria:**
- Coupling map is comprehensive

### Phase 3 — Define API boundary
**Target mode:** `extraction-prep`

**Actions:**
- Define the explicit exported surface of the extracted unit
- For each consumer, identify which parts of the surface they use
- Trim the surface to the minimum necessary (smaller boundary = healthier extraction)
- Document the boundary as a contract in the extraction spec

**Checkpoint:**
- API boundary defined as a list of named exports
- Each export's stability commitment noted (stable / semi-stable / experimental)

**Exit criteria:**
- API boundary is a contract, not a guess

### Phase 4 — Verify standalone build
**Target mode:** `extraction-prep`

**Actions:**
- Create a sandbox copy of the unit (in `_extraction-sandbox/[unit]/` or similar; sandbox-mode for the path)
- Add minimum scaffolding (package.json, pyproject.toml, etc.) for the unit to build standalone
- Resolve coupling: anything from the source repo that the unit needs becomes either: (a) a duplicated copy, (b) a dependency on the source repo, (c) an interface that consumers must satisfy
- Build standalone
- Run the unit's tests in the sandbox

**Checkpoint:**
- Standalone build succeeds
- Tests pass in isolation
- Resolution decision documented for each shared element

**Exit criteria:**
- Unit is verifiably extractable

### Phase 5 — Plan consumer migration
**Target mode:** `extraction-prep`

**Actions:**
- For each consumer identified in Phase 2: document migration path
  - Update import path (from local path to extracted package)
  - Adjust if API changed during extraction
  - Note: who owns the consumer; how they're notified; expected timeline
- Identify cross-repo coordination needed (if consumers live in different repos)
- Document migration in the extraction spec

**Checkpoint:**
- Every consumer has a migration plan
- Consumer owners are identified
- Communication plan exists

**Exit criteria:**
- Migration plan is comprehensive

### Phase 6 — Plan in-repo deprecation
**Target mode:** `extraction-prep`

**Actions:**
- Choose deprecation strategy: delete / shim / re-export
  - **Delete** — remove the unit entirely after consumers migrate
  - **Shim** — keep a thin wrapper that calls the extracted package; useful when migration takes time
  - **Re-export** — keep as a re-export for backward compatibility
- Document timeline (when the deprecation triggers; soak period)
- Plan the deprecation execution order with the actual split

**Checkpoint:**
- Strategy chosen and justified
- Timeline specific (not "eventually")

**Exit criteria:**
- Deprecation strategy is clear and dated

### Phase 7 — Run extraction-readiness evaluator
**Target mode:** `extraction-prep`

**Actions:**
- Run `evaluators/extraction-readiness.md`
- Address any NOT_READY findings
- Get verdict: READY / NOT_READY

**Checkpoint:**
- Verdict is READY (or NOT_READY surfaces specific blockers)

**Exit criteria:**
- READY verdict OR explicit operator override (rare; document why)

### Phase 8 — Tag pre-extraction state + operator approval
**Target mode:** `extraction-prep`

**Actions:**
- `git tag pre-extraction/[unit]/[YYYY-MM-DD]` at current HEAD
- Surface extraction spec to operator for review
- Operator approves; sign-off recorded in audit trail

**Checkpoint:**
- Tag created
- Operator sign-off recorded

**Exit criteria:**
- Ready for the actual split (which is out of workflow scope)

### Phase 9 — (After the actual split) return to stabilize
**Target mode:** `stabilize`

**Actions:**
- (After the split is performed externally) update source repo:
  - Apply deprecation strategy (delete / shim / re-export per Phase 6)
  - Update consumers per migration plan (or notify consumer owners to migrate on their own timeline)
  - Update docs to reference extracted package
- Update manifest: `current_mode = "stabilize"`, `last_extraction = "[unit]@[tag]"`
- Append audit-trail entry: `extraction-prep → stabilize` with extraction outcome

**Checkpoint:**
- Source repo cleanly transitioned
- Audit trail records the extraction event

**Exit criteria:**
- Workflow complete

## Rollback strategy

- **If Phase 4 (standalone build) fails:** workflow halts in extraction-prep; address coupling that prevents standalone, then retry
- **If extraction-readiness is NOT_READY:** address blockers; do not split until READY
- **If the split itself fails (out of scope, but worth noting):** restore from pre-extraction tag; rerun the workflow with adjusted plan
- **If consumer migration fails post-split:** in source repo, revert to shim strategy if delete was chosen; longer migration runway

## Success criteria
- Manifest in `stabilize` (after split)
- Extracted unit lives in its own repo
- Source repo's deprecation strategy in place
- All consumers either migrated or on a documented migration timeline
- Pre-extraction tag preserved
- Audit trail records the full chain

## Common variations

### Extraction with simultaneous renaming
If the unit is being renamed during extraction (e.g. `old-name` → `new-name`), Phase 3 documents the rename in the API boundary; Phase 5 includes the rename in the consumer migration; Phase 6 ensures shim handles both names temporarily.

### Extraction with breaking API changes
If extraction is opportunistically used to clean up the API, Phase 3 documents the breaking changes; Phase 5 explicitly handles per-consumer breaks; Phase 6's shim is short-term only.

### Extraction across organizations (e.g. into open source)
Phase 8 includes legal review for licensing, attribution, third-party code review. This may be its own governance-transition workflow run before architecture-extraction.

### Multiple parallel extractions
SINGLE_AGENT concurrency for extraction-prep; if multiple extractions are needed, run sequentially. Manifest's `extraction_target` field is a single value, not a list.

## Related workflows
- **Before:** `clean-pause` if pausing to plan the extraction; `governance-migration` if extraction is part of a broader org change
- **After:** the actual split (typically `git filter-repo`, `git subtree split`, or manual move with history rewrite); then long-tail consumer migration coordinated outside this workflow
- **Instead of:** if the goal is to *move* the unit (not split), use a simpler refactor; if the goal is to *deprecate* the unit, use stabilize with deprecation strategy directly
