# Mode: governance-transition

## Identity
- **Mode key:** `governance-transition`
- **Risk tier:** HIGH
- **Reversibility:** SEMI (some governance changes are hard to undo: org migrations, license changes, branch protection migrations)
- **Typical duration:** hours to weeks
- **Concurrency:** SINGLE_AGENT (avoid two transitions stepping on each other)

## Purpose
Migrate the repo's **governance layer** — ownership rules, approval processes, branch protection, license, code-of-conduct, contribution guidelines, CI requirements, or organizational hosting. Governance-transition is for changes to *how the repo is governed*, not changes to *what the repo does*.

Distinct from `extraction-prep`: extraction splits a unit out. Governance-transition keeps the unit but changes its rules.

## Entry Conditions
- Manifest mode is `stabilize`
- The transition is named (specific governance change, e.g. "migrate from solo-owner to 2-of-3 approval", "move from MIT to Apache-2.0", "transfer to org X")
- A motivating reason exists (compliance, scaling, organizational change, license obligation)
- Authorities required for the transition are identified (legal review for license, org admin for transfer, etc.)

## Goals (ordered)
1. Document the **before** state (current governance)
2. Document the **after** state (target governance)
3. Identify all artifacts that must change (CODEOWNERS, branch protection, LICENSE, CONTRIBUTING.md, CI config, .github/, etc.)
4. Run the governance-readiness evaluator → READY / NOT_READY
5. Plan the cutover (which changes happen when, in what order, with what verification)
6. Coordinate with affected parties (contributors, admins, legal if applicable)
7. Execute the transition with checkpoints
8. Verify the new governance is in effect

## Allowed Actions
- Read all governance artifacts (CODEOWNERS, LICENSE, branch protection rules, CI config, contribution docs)
- Draft new governance artifacts
- Update CODEOWNERS, .github/CODEOWNERS, .github/workflows/, branch protection rules
- Update LICENSE (only with explicit legal sign-off)
- Update CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
- Migrate branch protection rules at the hosting layer
- Transfer the repo at the hosting layer (if applicable)
- Coordinate with contributors via PR / issue / external comm
- Generate the migration report
- Append to audit trail
- Update manifest

## Forbidden Actions
- Changing governance silently (every change must be documented)
- License changes without explicit legal sign-off
- Removing CODEOWNERS / branch protection without a replacement
- Org transfers without notifying current contributors
- Removing required reviews / required checks during transition
- Mixing governance changes with feature work in the same commits
- Skipping the governance-readiness evaluator
- Marking transition complete without verifying the new governance is in effect

## Execution Priorities
1. **Document before.** Capture current governance fully before changing anything.
2. **Define after.** Spec the target governance with the same level of detail.
3. **Identify all touch points.** Governance lives in many files + hosting config; map them all.
4. **Plan cutover order.** Some changes must come before others (e.g. update CODEOWNERS before tightening branch protection).
5. **Coordinate.** Affected contributors get notice; surprise governance changes erode trust.
6. **Execute with checkpoints.** Each phase verified before the next.
7. **Verify the new state.** Don't assume the change took effect — confirm.

## Documentation Requirements
- Migration report at `.governance/artifacts/[YYYY-MM-DD]-governance-migration-[change-name].md` (template: `templates/migration-report.template.md` if present, otherwise spec via `schemas/migration-report.schema.md`)
  - Required sections:
    - Transition name
    - Motivation
    - Before state (full description of current governance)
    - After state (target governance)
    - Affected artifacts (file list + hosting config)
    - Affected parties (contributors, admins, downstream consumers)
    - Cutover plan (phased, ordered, with verification per phase)
    - Authorities (legal sign-off, org admin approval, etc.)
    - Communications plan (who is notified, when, how)
    - Rollback plan (if transition must be undone, can it be? how?)
    - Verification criteria (post-transition checks)
- Audit-trail entries at every phase
- Manifest update on completion: `current_mode = "stabilize"` (or `freeze` if locked during transition)

## Validation Requirements

**Universal:**
- Governance-readiness evaluator returned READY
- Migration report exists and validates against `schemas/migration-report.schema.md`
- All required authorities have signed off (recorded in audit trail with names + dates)
- Affected-parties communication has been sent (recorded in audit trail)
- Verification criteria have been met (post-transition checks pass)

**Transition-specific:**
- License change: legal sign-off recorded; SPDX identifier updated; LICENSE file updated; affected files' headers updated if applicable
- Org transfer: admin authorization on both source and destination orgs; CI / external integrations re-verified
- Branch protection: protection rules verified active at hosting layer post-transition
- CODEOWNERS: every covered path matches the new ownership map; no orphan paths

## Completion Criteria
- Migration report complete with all sections
- All cutover phases executed
- Verification criteria met
- New governance is in effect (verified)
- Audit trail closed with `[date] governance-transition → [next-mode]`
- Manifest updated

## Allowed Transitions
- `governance-transition → stabilize` — normal completion
- `governance-transition → freeze` — freeze during transition (lock until done)

**Not allowed:**
- `governance-transition → deploy-prep` directly (governance change should bake before shipping)

## Risk Profile

| Risk | Mitigation |
|---|---|
| License change without legal review | Validation requires legal sign-off recorded |
| Contributors blindsided by governance change | Communications plan is required; recorded in audit trail |
| Branch protection lapses mid-transition | Cutover plan must order changes such that protection is never absent |
| Org transfer breaks CI / integrations | Verification criteria include CI + integration checks post-transfer |
| CODEOWNERS update misses paths | Validation requires "no orphan paths" check |
| Transition rolled back partially (some artifacts changed, others not) | Phased cutover with verification per phase; rollback plan applies to *all* affected artifacts |
| Mixing governance + feature changes muddies audit | Forbidden action: mixing in same commits |
| New governance is stricter than expected; routine work blocks | Communicate before tightening; provide grace period if applicable |

## AI Agent Guidance

- **Governance is not code; it has stakeholders.** Communications plan is mandatory, not optional.
- **License changes are special.** Never proceed without legal sign-off from a human. Agents do not self-authorize license changes.
- **Document before changing.** The migration report's "before" section is written first; otherwise the after state is detached from reality.
- **Verify after every phase.** Don't trust that a change took effect — confirm with `gh api`, `git ls-remote`, or whatever the hosting layer offers.
- **Be patient with cutover.** Some changes need a soak period; plan for it rather than rushing.
- **Surface unknowns.** If you don't know whether a change is reversible, ask before acting.

## Human-in-the-Loop Touchpoints

- **Required to enter:** human authorizes the specific governance change.
- **Required for license changes:** legal sign-off (human, with appropriate authority).
- **Required for org transfers:** admin authorization on both ends.
- **Required to declare READY:** human reviews the migration report and approves the cutover plan.
- **Required at each cutover checkpoint:** human approves the phase before agent proceeds.
- **Required to mark complete:** human verifies the new governance is in effect.
