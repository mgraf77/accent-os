# Mode: deploy-prep

## Identity
- **Mode key:** `deploy-prep`
- **Risk tier:** HIGH
- **Reversibility:** REVERSIBLE (the prep itself is reversible; the deploy that follows is what must be carefully managed)
- **Typical duration:** minutes to hours
- **Concurrency:** SINGLE_AGENT (avoid two prep streams diverging)

## Purpose
Pre-production validation gate. Verify the repo is ready to ship: tests pass, security scans clean, performance acceptable, observability wired, rollback plan in place, release notes drafted. Deploy-prep does **not** itself deploy; it produces a GO / NO_GO verdict and a deploy checklist.

## Entry Conditions
- Manifest mode is `stabilize` (must be healthy first)
- Recent audit (within `manifest.audit_freshness_hours`, default 24h) shows no critical findings
- All target-release scope is merged to the release branch (no in-flight feature work for this release)
- A target release version / tag is named (semver, calver, or other repo convention)

## Goals (ordered)
1. Run the deployment-readiness evaluator (`evaluators/deployment-readiness.md`) → produces GO / NO_GO / GO_WITH_CAVEATS
2. Verify rollback plan is in place and tested
3. Verify observability (logs, metrics, alerts) is wired for the new release
4. Draft release notes
5. Produce a deploy checklist (per `templates/deploy-checklist.template.md`)
6. Transition to `freeze` (lock the release branch) until deploy actually happens

## Allowed Actions
- Run all tests, including integration / e2e suites
- Run security scans (dependency vulnerabilities, secrets-in-history check)
- Run performance benchmarks if the repo has them
- Verify observability hooks (logs, metrics, alerts) for new code paths
- Draft release notes
- Tag a release candidate (`git tag v1.2.3-rc1`)
- Run smoke tests against staging if the repo has staging
- Update CHANGELOG / release notes
- Generate the deploy checklist
- Append to audit trail
- Update manifest

## Forbidden Actions
- Adding new features (feature work belongs in stabilize, not deploy-prep)
- Refactors that aren't security or rollback-related
- Schema migrations that haven't been tested in staging
- Disabling tests to make the suite green
- Suppressing security findings without explicit operator override
- Skipping the rollback plan
- Skipping observability verification
- Tagging a release without RC verification

## Execution Priorities
1. **Tests first.** A failing test is a NO_GO; resolve before any other prep work.
2. **Security second.** Dependency vulns and secrets-in-history are NO_GO until resolved.
3. **Rollback plan third.** Without a rollback plan, deploy-prep cannot complete.
4. **Observability fourth.** Cannot deploy what you cannot monitor.
5. **Release notes fifth.** Communication artifact, not a gate.
6. **Tag a release candidate.** RC tag immutable; production tag comes later.

## Documentation Requirements
- Deploy checklist at `.governance/artifacts/[YYYY-MM-DD]-deploy-checklist-[version].md` (template: `templates/deploy-checklist.template.md`)
  - Required sections:
    - Target version
    - Scope (what's in this release)
    - Test results (link or summary)
    - Security scan results (link or summary)
    - Rollback plan (specific, executable)
    - Observability verification (specific dashboards / alerts)
    - Release notes (drafted)
    - Deploy steps (ordered)
    - Verification steps post-deploy
    - On-call / incident-response contact
- Release notes (location depends on repo: CHANGELOG.md, RELEASES.md, GitHub Release, etc.)
- Audit-trail entry: `[date] stabilize → deploy-prep` with target version
- Manifest update: `current_mode = "deploy-prep"`, `target_release = "[version]"`

## Validation Requirements

**Universal:**
- Deploy-readiness evaluator returned GO or GO_WITH_CAVEATS (NO_GO blocks completion)
- All test suites passed in CI (not just locally)
- Dependency vulnerability scan: no CRITICAL or HIGH issues unexplained
- No secrets in git history (commit history scan run)
- Rollback plan exists, is specific, and has been verified executable
- Observability hooks verified for new code paths

**Repo-specific (per manifest):**
- Defined in `repo-manifest.json` `validation.deploy_prep_extras`
- Examples: smoke test against staging, performance budget compliance, accessibility audit, vendor API contract tests

## Completion Criteria
- Deploy checklist complete and approved
- Release candidate tag created
- Deploy-readiness verdict = GO or GO_WITH_CAVEATS (with explicit operator acceptance of caveats)
- Manifest updated
- Transition to `freeze` (lock release branch until deploy)

## Allowed Transitions
- `deploy-prep → freeze` — typical: prep done, lock branch until deploy
- `deploy-prep → stabilize` — rollback if deploy was aborted or NO_GO blocking
- `deploy-prep → recovery` — if prep revealed brokenness that wasn't caught earlier

**Not allowed:**
- `deploy-prep → audit` (any audit findings during prep are part of prep itself)
- `deploy-prep → handoff` (finish prep first, then hand off in `freeze`)

## Risk Profile

| Risk | Mitigation |
|---|---|
| GO_WITH_CAVEATS used to ship known-broken code | Caveats must be specific + accepted by operator with audit-trail record |
| Rollback plan exists but is wrong / unexecutable | Plan must be tested (e.g. dry-run rollback in staging) |
| Security findings suppressed | Suppression requires operator approval and is logged in audit trail |
| Observability is "good enough" without verification | Validation requires evidence — dashboard URL, alert config screenshot |
| Secrets in git history | Pre-deploy scan; if found, halt and use git history rewrite tools |
| RC tag confused with production tag | Tag naming convention enforced; manifest tracks both |
| Multi-week deploy-prep (mode rots) | Manifest tracks `entered_at`; surface "deploy-prep open >7 days" |

## AI Agent Guidance

- **Do not self-declare GO.** Agents propose GO; humans confirm GO. NO_GO is fine for agents to declare.
- **Be paranoid about rollback.** "We can revert the commit" is not a rollback plan if there's a database migration.
- **Treat staging as production.** If something would block in production, it blocks in staging.
- **Surface caveats explicitly.** GO_WITH_CAVEATS is a contract — caveats must be enumerable and accepted, not "you know, the usual stuff."
- **Verify with the repo's actual tools.** If the repo has CI, the CI run is the ground truth, not your local run.
- **Tag conservatively.** RC tags are cheap; create one even for a small release.

## Human-in-the-Loop Touchpoints

- **Required to enter:** human authorizes "yes, we are preparing to deploy version X."
- **Required to accept GO_WITH_CAVEATS:** human explicitly acknowledges each caveat.
- **Required to declare GO:** human signs off; agents do not self-declare.
- **Required to skip a normally-required validation (e.g. perf benchmark):** human approves with audit-trail record.
- **Required to actually deploy (out of scope for this mode but worth noting):** human triggers; deploy-prep does not auto-deploy.
