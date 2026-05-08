# Workflow: governance-migration

## Identity
- **Name:** `governance-migration`
- **Motivating use case:** Operator needs to change *how the repo is governed* — ownership rules, branch protection, license, contribution process, organizational hosting, code-of-conduct. Governance migration is for changes to *rules*, not changes to *code*.
- **Spans:** any healthy mode → `governance-transition` → `stabilize` (or `freeze`)

## Inputs
- Manifest mode is `stabilize` (must be healthy before migrating governance)
- Specific governance change named (not just "improve governance")
- Motivation documented (compliance, scaling, organizational change, license obligation)
- Authorities required for the change identified (legal, org admin, etc.)

## Outputs
- Updated `repo-manifest.json` ending in `current_mode = "stabilize"` (or `freeze` if locked during transition)
- Audit-trail entries for every phase
- Migration report at `.governance/artifacts/[YYYY-MM-DD]-governance-migration-[change-name].md`
- Updated governance artifacts in the repo (CODEOWNERS, LICENSE, CONTRIBUTING.md, branch protection rules, etc.)
- Affected-parties communications sent

## Phases

### Phase 1 — Document the before-state
**Target mode:** `stabilize` (still — about to enter governance-transition)

**Actions:**
- Capture current governance fully:
  - Ownership rules (CODEOWNERS, branch protection, required reviewers)
  - License (file + SPDX identifier + headers if applicable)
  - Contribution rules (CONTRIBUTING.md, PR templates, issue templates)
  - CI requirements (required status checks, required workflows)
  - Code of conduct
  - Hosting (org, repo URL, integrations)
- Record in the migration report (template per `schemas/migration-report.schema.md`)

**Checkpoint:**
- Before-state documented comprehensively
- All governance artifacts identified

**Exit criteria:**
- Before-state is a clear baseline

### Phase 2 — Define the after-state
**Target mode:** `stabilize`

**Actions:**
- Write the target governance with the same level of detail as Phase 1
- For each artifact: specify what changes (or stays)
- Identify required authorities (legal sign-off for license, org admin for transfer, etc.)

**Checkpoint:**
- After-state spec is complete
- Required authorities identified

**Exit criteria:**
- Before and after are both documented

### Phase 3 — Identify affected parties
**Target mode:** `stabilize`

**Actions:**
- List affected parties:
  - Active contributors (recent committers, open-PR authors)
  - Maintainers / admins
  - Downstream consumers (if license changes, e.g. forks, dependents)
  - Org-level stakeholders
- Plan communications: who is notified, when (relative to cutover), how (PR comment, email, Slack, GitHub Discussions)

**Checkpoint:**
- Affected-party list complete
- Communications plan exists

**Exit criteria:**
- No surprise stakeholders

### Phase 4 — Run governance-readiness evaluator
**Target mode:** `stabilize`

**Actions:**
- Run `evaluators/governance-readiness.md`
- Address any NOT_READY findings
- Get verdict: READY / NOT_READY

**Checkpoint:**
- Verdict READY (or specific blockers surfaced)

**Exit criteria:**
- Authority sign-offs collected

### Phase 5 — Enter governance-transition + plan cutover
**Target mode:** `governance-transition`

**Actions:**
- Update manifest: `current_mode = "governance-transition"`, `transition_name = "[change]"`
- Append audit-trail entry
- Plan the cutover order:
  - Some changes have ordering constraints (e.g. update CODEOWNERS *before* tightening branch protection so the new owners can approve)
  - License changes typically come early (legal sign-off is in hand)
  - Hosting transfers typically come late (least reversible)
- Document cutover plan in the migration report
- Optional: send pre-cutover notification to affected parties

**Checkpoint:**
- Cutover plan documented in the migration report
- Pre-cutover comms sent if planned

**Exit criteria:**
- Ready to execute cutover

### Phase 6 — Execute cutover with checkpoints
**Target mode:** `governance-transition`

**Actions:**
- Execute each cutover step in order
- After each step, verify the change is in effect:
  - CODEOWNERS update → verify with a test PR (or dry-run via `gh api`)
  - License update → verify file + SPDX + headers
  - Branch protection → verify via hosting API (`gh api repos/.../branches/.../protection`)
  - Org transfer → verify URL responds, integrations re-link
- Append audit-trail entry per step
- If a step fails: halt, surface, decide retry / rollback / accept partial

**Checkpoint per step:**
- Change verified at the hosting layer
- Affected functionality still works (can still merge PRs, CI still passes, etc.)

**Exit criteria:**
- All steps complete OR explicitly skipped with operator approval

### Phase 7 — Notify affected parties
**Target mode:** `governance-transition`

**Actions:**
- Send post-cutover notifications per the communications plan
- Surface the migration report (commit it; reference it in comms)
- Document acknowledgments / questions in the audit trail

**Checkpoint:**
- Comms sent to all affected parties on the list
- No critical questions / objections unresolved

**Exit criteria:**
- Stakeholders informed

### Phase 8 — Verify and transition out
**Target mode:** `governance-transition` → `stabilize`

**Actions:**
- Verify the migration report's verification criteria
- Confirm the new governance is in effect (run a smoke test: open a PR, check it goes through new approval flow; or any equivalent)
- Update manifest: `current_mode = "stabilize"`, `last_governance_transition = "[change]@[date]"`
- Append audit-trail entry: `governance-transition → stabilize`

**Checkpoint:**
- Verification criteria met
- Smoke test of new governance passed

**Exit criteria:**
- Workflow complete

## Rollback strategy

- **If Phase 6 mid-cutover and a step is unexpectedly destructive:** halt; if rollback of the step is possible (e.g. revert the CODEOWNERS commit), do it; if not (e.g. org transfer that took effect), accept and adjust the after-state spec
- **If verification reveals new governance broke routine work:** halt; consider a partial rollback OR proceed and address the breakage with a follow-up adjustment (operator decides)
- **If affected-parties feedback raises unanticipated objection:** consult operator; may pause workflow at current phase pending discussion
- **If license change is challenged post-cutover:** consult legal; rollback may not be possible; document the challenge in audit trail

## Success criteria
- Manifest in `stabilize`
- Migration report complete with verification criteria met
- All affected parties notified
- New governance verified in effect
- Audit trail records the full chain

## Common variations

### License change (special)
- Phase 4 includes legal sign-off
- Phase 6 includes updating SPDX identifiers and per-file headers if applicable
- Phase 7 includes notifying downstream consumers (forks, dependents) — may require GitHub-level outreach
- Audit trail records legal-sign-off identity + date

### Org transfer
- Phase 6 has a discrete "transfer" step; verify CI / integrations re-link
- Phase 7 includes updating external references (docs, badges, dependencies pointing to old URL)
- Plan for redirect window (GitHub provides redirect, but it's not permanent)

### Branch protection tightening
- Phase 5 cutover order: update CODEOWNERS + required reviewers list FIRST, then tighten protection rules — otherwise new rules may lock everyone out
- Phase 8 verification: open a test PR; confirm it requires new approvers

### Multi-repo governance change (governance applied to multiple repos)
- Run this workflow per repo in sequence (don't batch — coordination errors cascade)
- Or use a future Command Center to orchestrate parallel runs with shared communication

## Related workflows
- **Before:** `clean-pause` if pausing active feature work to focus on governance
- **After:** typically followed by routine `stabilize` work; if governance change reveals broader issues, may chain into `repo-recovery`
- **Instead of:** if the change is *technical* not *governance*, use plain stabilize; if the change involves *splitting the repo*, use `architecture-extraction`
