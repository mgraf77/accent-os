# Extraction Spec — [UNIT_NAME]

<!--
Validate against: schemas/migration-report.schema.md (extraction variant)
Run evaluator: evaluators/extraction-readiness.md
-->

**Schema version:** 1
**Migration kind:** extraction-prep
**Unit name:** [e.g. "auth-module", "supabase-client", "form-validator"]
**Created at:** [ISO-8601]
**Operator:** [identity]

---

## Header

- **Source repo:** [name + URL]
- **Source unit path:** [e.g. `src/auth/`, `skills/some-skill/`]
- **Target repo:** [planned name]
- **Target hosting:** [e.g. github.com/org/repo]
- **Target organization:** [org name]
- **Target maintainer:** [name + role]

## Motivation

<!-- 1-3 sentences. Specific. Not "scaling" or "improvements". -->

[Why this unit should become its own repo. Reference decision-log entry if there is one.]

## Coupling map

### Imports INTO the unit (dependencies)

<!-- Things the unit needs from elsewhere in the source repo. -->

- [Source path] → [unit's usage]
- [Source path] → [unit's usage]
- [...]

### Imports FROM the unit (consumers)

<!-- Places elsewhere in the source repo that use the unit. -->

- [Consumer path] → [what it imports from the unit]
- [Consumer path] → [...]
- [...]

### Shared types / config / state / fixtures

- [Shared element] — [resolution: duplicate | depend-on | interface]
- [...]

### Indirect dependencies

<!-- Dynamic imports, reflection, etc. that static analysis might miss. -->

- [If any]

## API boundary

### Exported surface

<!-- The named exports the extracted package will expose. Smaller is better. -->

| Export | Type | Stability | Used by |
|---|---|---|---|
| `validateToken` | function | stable | [list of consumers] |
| `TokenError` | type | stable | [...] |
| `MockToken` | testing helper | semi-stable | [...] |

### Internal-only (NOT part of the boundary)

- [Internal utilities that should NOT be exported]

## Standalone build verification

- **Sandbox copy location:** [e.g. `_extraction-sandbox/auth-module/`]
- **Scaffolding added:** [package.json, tsconfig.json, etc.]
- **Build command:** [verbatim]
- **Build result:** [pass | fail; if fail, what's blocking]
- **Test command:** [verbatim]
- **Test result:** [pass | fail; if fail, what's blocking]
- **Resolution decisions:** see "Coupling map > Shared types" above

## Consumer migration plan

| Consumer | Owner | New import | API change? | Notification | Migration deadline |
|---|---|---|---|---|---|
| [path] | [name] | [new import path] | [yes/no — describe] | [comm channel + date] | [date] |
| [...] | [...] | [...] | [...] | [...] | [...] |

### Cross-repo consumers

- [Consumer in other repo / org] — [coordination plan]

## In-repo deprecation strategy

**Strategy:** [delete | shim | re-export]

**Justification:** [why this strategy]

**Timeline:**
- [Date]: actual split happens; new repo published
- [Date]: in-repo deprecation marker added (warning on import, etc.)
- [Date]: in-repo version removed (or shim removal date)

**Soak / grace period:** [duration; what consumers can do during it]

## Governance for the new repo

- **Repo name:** [final name]
- **License:** [SPDX identifier; same as source repo or different]
- **License compatibility verified:** [yes by [reviewer] + date]
- **Maintainer / owner:** [name]
- **Initial governance:** [CODEOWNERS / branch protection / required reviewers — describe]

## Pre-extraction state

- **Tag at source repo HEAD:** `pre-extraction/[UNIT]/[YYYY-MM-DD]`
- **Tag pushed:** [yes | no | n/a — local-only]
- **Source repo manifest:** `current_mode = "extraction-prep"`, `extraction_target = "[unit]"`

## Risks

- [Risk 1: description, likelihood, impact, mitigation]
- [Risk 2: ...]
- [Risk 3: ...]

## Rollback plan

<!-- What to do if extraction must be undone before the actual split. -->

- Restore from `pre-extraction/[UNIT]/[date]` tag
- Delete sandbox copy at `_extraction-sandbox/[unit]/`
- Revert manifest to prior mode
- (After the actual split is irreversible — document that it cannot be undone, only re-merged via separate workflow)

## Verification criteria

- [Criterion 1: e.g. "Sandbox build + tests pass"]
- [Criterion 2: e.g. "Every consumer's migration is documented and consumer-owner has acknowledged"]
- [Criterion 3: e.g. "License compatibility verified by [reviewer]"]
- [Criterion 4: ...]

## Authorities & sign-offs

- **Operator approval (for extraction-prep completion):** [name + ISO-8601]
- **Source repo maintainer approval:** [name + ISO-8601]
- **Target repo maintainer (if different):** [name + ISO-8601]
- **License review (if cross-license):** [legal counsel name + ISO-8601]

## Outcome

<!-- Fill in after the actual split. -->

- **What actually happened:** [vs. plan]
- **Deviations:** [list]
- **Lessons learned:** [for future extractions]
- **Split completion date:** [ISO-8601]
- **Extracted repo URL:** [actual URL once published]
