# Schema: migration-report

## Identity
- **Schema:** `migration-report`
- **Version:** v1
- **Purpose:** Document a governance migration — the rules / structure / ownership change being made, the cutover plan, the verification, and the outcome. Also used as the artifact for `extraction-prep` (where "migration" means moving a unit out of the repo).
- **Format:** Markdown
- **Default location:** `.governance/artifacts/[YYYY-MM-DD]-governance-migration-[change-name].md` or `.governance/artifacts/[YYYY-MM-DD]-extraction-spec-[unit-name].md`

## Required sections

### Section: Header
| Field | Description |
|---|---|
| `schema_version` | `1` |
| `migration_kind` | `governance-transition` / `extraction-prep` |
| `migration_name` | Specific name (e.g. "MIT → Apache-2.0", "transfer to org X", "extract auth module") |
| `started_at` | ISO-8601 |
| `completed_at` | ISO-8601 (or "in progress") |
| `operator` | Identity |

### Section: Motivation
- 1-3 sentences describing why this change is being made
- Required: not "improvements" or "scaling" — must be specific
- If there's a `decision-log` entry, link to it

### Section: Before-state
For governance-transition:
- Current ownership rules (CODEOWNERS / required reviewers)
- Current license (file + SPDX identifier)
- Current contribution rules
- Current CI requirements
- Current hosting (org / URL)

For extraction-prep:
- Current unit location (path in source repo)
- Current API surface
- Current consumers (list with import paths)
- Current shared dependencies / types / fixtures

### Section: After-state
Same level of detail as Before-state, describing the target.

### Section: Affected artifacts (governance-transition) OR Coupling map (extraction-prep)

For governance-transition:
- File list (CODEOWNERS, LICENSE, CONTRIBUTING.md, .github/workflows/*, etc.)
- Hosting config (branch protection, integrations, redirects)

For extraction-prep:
- Imports INTO the unit
- Imports FROM the unit
- Shared types / config / state / fixtures

### Section: Affected parties / Consumer migration

For governance-transition:
- Active contributors (recent committers, open-PR authors)
- Maintainers / admins
- Downstream consumers (forks, dependents)
- Communications plan: who is notified, when, how

For extraction-prep:
- Per-consumer migration plan (new import path, API changes, owner, timeline)
- Cross-repo coordination needs

### Section: Cutover plan / Migration phases

Phase-by-phase plan with verification per phase.
Each phase:
- **Action:** what happens
- **Verification:** how we confirm it took effect
- **Rollback:** if this phase fails, how do we recover

### Section: Authorities & sign-offs

For governance-transition:
- Required authorities listed (specific roles, e.g. legal counsel, org admin)
- Sign-offs recorded (name, role, date) per authority

For extraction-prep:
- Operator approval (name, date)
- (If applicable) consumer-owner sign-offs

### Section: Risks
- Each risk: description + likelihood + impact + mitigation
- Required: at least one risk listed (no migration is risk-free)

### Section: Rollback plan
- For each affected artifact: how to revert
- Some changes are irreversible (license change post-distribution, completed extraction split) — document explicitly

### Section: Verification criteria
- Specific testable conditions: "new CODEOWNERS approves a test PR", "new license appears in SPDX-License-Identifier comment", "extracted unit passes its test suite in isolation"
- Each criterion must be observable

### Section: Outcome (filled in after completion)
- What actually happened (vs. plan)
- Deviations from plan and why
- Lessons for future migrations
- Post-migration date

## Validation rules

1. All required sections must exist as headers.
2. `migration_name` must be specific (not "governance update").
3. Cutover plan must have at least one phase.
4. Every phase must have action + verification + rollback fields populated.
5. Authority sign-offs must include name + role + date (not just role).
6. Verification criteria must be testable.
7. Risks section must have at least one risk.

## Markdown rendering example (governance-transition)

```markdown
# Migration: MIT → Apache-2.0

**Kind:** governance-transition
**Started:** 2026-05-08T10:00Z
**Operator:** human:michael

## Motivation
Required for compatibility with Apache-licensed downstream consumer X. License change approved by legal counsel on 2026-05-07. See `decisions/2026-05-07-license-change.md`.

## Before-state
- License: MIT (SPDX: `MIT`)
- LICENSE file: contains MIT text
- Per-file headers: none currently
- Contributors notified previously: no

## After-state
- License: Apache-2.0 (SPDX: `Apache-2.0`)
- LICENSE file: contains Apache-2.0 text
- Per-file headers: SPDX-License-Identifier comment in every source file
- Contributors notified: yes (PR comment + email)

## Affected artifacts
- `LICENSE` (replace contents)
- `package.json` `license` field
- `README.md` license badge
- Every `.ts` / `.js` source file (add SPDX comment)
- `.github/CONTRIBUTING.md` license-grant section

## Affected parties
- Active contributors: 12 (last 90 days)
  - Communicated 2026-05-06 via email + PR comment template
- Forks: 8 known
  - Communicated 2026-05-06 via fork-notification script
- Downstream dependents: 3 (per dependency-graph)
  - Communicated 2026-05-06 via maintainer email

## Cutover plan
1. **Phase 1 — Update LICENSE file**
   - Action: replace MIT text with Apache-2.0 text
   - Verification: `head -1 LICENSE | grep "Apache License, Version 2.0"`
   - Rollback: restore MIT from `pre-migration` tag
2. **Phase 2 — Update package.json**
   - Action: change `license` field from `MIT` to `Apache-2.0`
   - Verification: `jq -r .license < package.json` returns `Apache-2.0`
   - Rollback: restore from tag
3. **Phase 3 — Add SPDX headers**
   - Action: prepend `// SPDX-License-Identifier: Apache-2.0` to every source file
   - Verification: `find src -type f \( -name '*.ts' -o -name '*.js' \) -exec grep -L SPDX-License-Identifier {} \;` returns empty
   - Rollback: scripted removal
4. **Phase 4 — Verify with PR**
   - Action: open a small test PR; verify CI / reviewers / license-checker pass
   - Verification: PR opens cleanly, CI green
   - Rollback: close PR; revert affected commits

## Authorities & sign-offs
- Legal counsel: Sarah Y (Senior Counsel) — signed 2026-05-07
- Org admin: Michael X (CEO) — signed 2026-05-07

## Risks
- Risk: existing forks may still expect MIT and break compatibility expectations. Likelihood: low. Impact: medium. Mitigation: announce 30 days before next release.
- Risk: contributors object retroactively. Likelihood: low. Impact: medium. Mitigation: pre-notification 2026-05-06; offer to credit / discuss.

## Rollback plan
- LICENSE / package.json / SPDX headers all revertable via git from `pre-migration/license-change/2026-05-08` tag
- License change post-distribution (any release tagged after this migration) cannot be retroactively undone — once released as Apache-2.0, those releases remain Apache-2.0

## Verification criteria
- LICENSE first line matches Apache-2.0 template
- `package.json` license field = `Apache-2.0`
- All source files have SPDX-License-Identifier comment
- Test PR opens, CI green, license-checker tool reports Apache-2.0
- All affected parties have been notified (email send confirmation logged)

## Outcome
(To be filled in after completion)
```

## Markdown rendering example (extraction-prep)

See `templates/extraction-spec.template.md` for the extraction-prep variant.
