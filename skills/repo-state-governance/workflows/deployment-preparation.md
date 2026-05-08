# Workflow: deployment-preparation

## Identity
- **Name:** `deployment-preparation`
- **Motivating use case:** Operator wants to ship a release. Move the repo through the gates that produce a GO / NO_GO verdict and lock the release branch until deploy.
- **Spans:** `stabilize` → `deploy-prep` → `freeze`

## Inputs
- Manifest mode is `stabilize`
- Recent audit (within `manifest.audit_freshness_hours`, default 24h) without critical findings
- Target release version named (semver, calver, or repo's convention)
- Release scope finalized (no in-flight feature work for this release)

## Outputs
- Updated `repo-manifest.json` ending in `current_mode = "freeze"` + `target_release = "[version]"`
- Audit-trail entries
- Deploy checklist at `.governance/artifacts/[YYYY-MM-DD]-deploy-checklist-[version].md`
- Release candidate tag (e.g. `v1.2.3-rc1`)
- Updated CHANGELOG / release notes (location per repo convention)
- Branch protection rules updated to lock the release branch

## Phases

### Phase 1 — Stabilize (verify clean entry)
**Target mode:** `stabilize` (already there per Inputs, but verify)

**Actions:**
- Verify `stabilize` Completion Criteria still hold
- Run universal validation
- Verify no in-flight WIP or open PRs targeting this release
- If audit is stale: run a quick audit (Phase 1.5)

**Checkpoint:**
- Stabilize criteria met
- No surprise drift

**Exit criteria:**
- Repo is verifiably healthy

### Phase 2 — Deploy-prep
**Target mode:** `deploy-prep`

**Actions:**
- Update manifest: `current_mode = "deploy-prep"`, `target_release = "[version]"`
- Run all test suites including integration / e2e
- Run security scans (dependency vulns, secrets-in-history)
- Run performance benchmarks if the repo has them
- Verify observability hooks for new code paths (logs, metrics, alerts wired)
- Draft release notes
- Run smoke tests against staging if the repo has staging
- Generate deploy checklist via `templates/deploy-checklist.template.md`
- Verify rollback plan is specific and executable (dry-run if possible)
- Tag a release candidate: `git tag v[version]-rc[n]`
- Run `evaluators/deployment-readiness.md` → GO / NO_GO / GO_WITH_CAVEATS

**Checkpoint:**
- Deploy checklist complete
- Verdict = GO or GO_WITH_CAVEATS
- RC tag created
- All required validations passed

**Exit criteria:**
- Deploy-prep Completion Criteria met
- Verdict accepted (GO_WITH_CAVEATS requires explicit operator acceptance of each caveat)

### Phase 3 — Freeze (lock release branch)
**Target mode:** `freeze`

**Actions:**
- Update manifest: `current_mode = "freeze"`, `freeze_reason = "deploy-prep complete; awaiting deploy of [version]"`
- Generate freeze declaration referencing the deploy checklist
- Update branch protection rules at the hosting layer (e.g. require approvals, require status checks to pass)
- Append to audit trail
- (Optional) notify on-call / release coordinators that the release is queued

**Checkpoint:**
- Manifest in freeze with reason populated
- Branch protection verified at hosting layer
- Hotfix protocol documented

**Exit criteria:**
- Freeze Completion Criteria met
- Repo is ready for the actual deploy (which is **out of scope** for this workflow)

## Rollback strategy

- **If Phase 1 fails:** transition back to active stabilize work; do not enter deploy-prep
- **If Phase 2 verdict is NO_GO:** transition back to stabilize; address findings; retry deployment-preparation later
- **If Phase 2 reveals brokenness mid-prep:** transition to recovery
- **If Phase 3 fails to lock at hosting layer:** retry; if persistent, escalate (deploy-prep stays open until freeze can be applied)
- **If GO_WITH_CAVEATS but operator does not accept caveats:** treat as NO_GO, return to stabilize

## Success criteria
- Manifest mode = `freeze` with `target_release` and `freeze_reason` populated
- Deploy checklist complete and approved
- RC tag created
- Branch protection enforced
- Operator has been surfaced the GO / GO_WITH_CAVEATS verdict and has explicitly accepted

## Common variations

### Hotfix release
Skip Phase 1's full stabilize verification (the underlying healthy state is assumed); enter deploy-prep directly with a narrow scope. Deploy checklist scope = hotfix only. RC tagging optional. Phase 3 freeze must specify hotfix-only allowed during the freeze window.

### Multi-environment release (staging → canary → production)
Phase 2's smoke tests run against staging. After this workflow completes, a separate deploy-and-verify cycle runs for each environment. The freeze in Phase 3 only lifts after production deploy is verified.

### Release with known caveats
GO_WITH_CAVEATS verdict requires the deploy checklist to enumerate each caveat with: (a) what the caveat is, (b) operational impact, (c) rollback if it manifests, (d) operator acceptance. Caveats accumulate technical debt — log them.

## Related workflows
- **Before:** `clean-pause` if pausing for review before prep, `safe-resumption` if resuming a paused branch into deploy-prep
- **After:** the actual deploy (out of scope), then `safe-resumption` from freeze post-deploy
- **Instead of:** if not deploying but just locking down, use a direct freeze without deploy-prep
