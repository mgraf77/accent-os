# Deploy Checklist — [VERSION]

<!--
Informed by: evaluators/deployment-readiness.md
Verdict for this checklist: GO / GO_WITH_CAVEATS / NO_GO
-->

**Schema version:** 1
**Target version:** [e.g. 1.2.3]
**Candidate commit:** [hash]
**Created at:** [ISO-8601]
**Created by:** [operator]
**Verdict:** [GO | GO_WITH_CAVEATS | NO_GO]

---

## Scope

<!-- What's in this release. Bullet list. Reference PRs / issues if applicable. -->

- [Feature or fix #1]
- [Feature or fix #2]
- [...]

## Test results

- **Unit tests:** [pass | fail; CI link]
- **Integration tests:** [pass | fail | n/a; CI link]
- **E2E tests:** [pass | fail | n/a; CI link]
- **Smoke tests against staging:** [pass | fail | n/a]
- **Skipped / quarantined tests:** [list with rationale, or "none"]

## Security scan results

- **Dependency vulnerabilities:** [HIGH/CRITICAL count: 0 | summary]
- **Secrets in history scan:** [clean | findings]
- **Authn/authz changes reviewed:** [yes by [reviewer] | n/a]
- **New external endpoints reviewed:** [yes | n/a]

## Rollback plan

<!-- REQUIRED: specific, executable. Not "we can revert the commit." -->

- **Strategy:** [rollback / forward-fix / mixed]
- **Steps:**
  1. [Specific step]
  2. [Specific step]
  3. [...]
- **DB migrations in this release:** [yes — describe rollback per migration | no]
- **Rollback verified by:** [dry-run in staging | manual review | n/a — first-time deploy]
- **Rollback owner during incident:** [name + role]

## Observability verification

- **Logs:** [new code paths emit logs; example dashboard URL]
- **Metrics:** [new metrics defined; example dashboard URL]
- **Alerts:** [alerts configured for new error conditions; list alert names]
- **Traces (if used):** [new spans added; example trace]
- **On-call briefing:** [date + briefer + briefee]

## Release notes (drafted)

<!-- Customer-facing. Be clear about user-visible changes. -->

### What's new
- [User-visible feature 1]
- [User-visible feature 2]

### What's fixed
- [Bug fix 1]
- [Bug fix 2]

### Breaking changes
- [If any — and migration guide]

### Internal-only changes
- [Refactors, deps updates, etc. — if worth listing]

## Deploy steps (ordered)

1. [Step: e.g. "Tag release: `git tag v[VERSION]`"]
2. [Step: e.g. "Push tag: `git push origin v[VERSION]`"]
3. [Step: e.g. "CI builds artifact"]
4. [Step: e.g. "Deploy to canary"]
5. [Step: e.g. "Verify canary; promote to production"]
6. [Step: e.g. "Verify production smoke tests"]

## Post-deploy verification

<!-- Specific testable conditions. -->

- [Condition 1: e.g. "auth endpoint returns 200 within 1s"]
- [Condition 2: e.g. "error rate < 0.1% in first 30 minutes"]
- [Condition 3: ...]

## On-call / incident-response contacts

- **Primary on-call:** [name + comm channel]
- **Secondary on-call:** [name + comm channel]
- **Release coordinator:** [name + role]
- **Escalation:** [name / process]

## Caveats (if GO_WITH_CAVEATS)

<!-- Empty if verdict is GO. -->

| # | Caveat | Operational impact | Mitigation | Operator acceptance |
|---|---|---|---|---|
| 1 | [description] | [impact] | [mitigation] | [name + date] |
| 2 | [...] | [...] | [...] | [...] |

## Sign-offs

- **Operator approved checklist:** [name + ISO-8601]
- **Required reviewers (per CODEOWNERS):** [names + dates]
- **Release coordinator notified:** [name + ISO-8601]
- **GO / GO_WITH_CAVEATS verdict accepted by:** [human name + ISO-8601]

---

## Out of scope for this checklist

<!-- Be honest about what we are NOT verifying. -->

- [e.g. "Production capacity / scaling readiness — handled separately"]
- [e.g. "Marketing / launch coordination"]
- [...]
