# Example: Deployment preparation with caveats

End-to-end demonstration of the `deployment-preparation` workflow, showing the realistic case where the verdict is `GO_WITH_CAVEATS` rather than a clean `GO`.

---

## Setup

### Initial state

**Repo:** `webapp`
**Branch:** `release/v2.4.0`
**Manifest:** `current_mode = "stabilize"`

**Last audit:** 2026-05-07T22:00Z, score 86/100, GOOD tier, no critical findings (within 24h freshness window)

**Release scope (PRs merged into `release/v2.4.0` since v2.3.0):**
- PR #412: New "saved searches" feature
- PR #418: Bug fix for date-picker localization
- PR #421: Performance: switch from JSON to msgpack for internal RPC
- PR #425: Dependency upgrade: react 18.2 → 18.3

---

## Trigger

Michael at 14:00Z: "Let's prep v2.4.0 for deploy."

---

## Workflow: deployment-preparation

### Phase 1 — Stabilize (verify clean entry)

Agent verifies:
- Audit fresh (within 24h): ✓ (yesterday at 22:00Z, well within)
- Stabilize criteria still hold: ✓ (clean working tree, validation passing)
- No in-flight WIP on this branch: ✓
- Release scope finalized (no commits to release branch in last 4h): ✓

**Phase 1 checkpoint:** Repo healthy. ✓

### Phase 2 — Deploy-prep

Agent updates manifest: `current_mode = "deploy-prep"`, `target_release = "2.4.0"`.

Audit-trail entry: `stabilize → deploy-prep`.

Agent runs the deployment-readiness evaluator categories:

#### P (Pre-conditions) — all pass ✓
- Manifest in deploy-prep ✓
- Stabilize criteria met ✓
- Repo-health 86 = GOOD ✓
- Target version 2.4.0 follows semver ✓
- Release scope finalized ✓

#### T (Tests)
- T1 Full test suite in CI: ✓ pass
- T2 Integration / e2e: ✓ pass
- T3 Quarantined tests: 1 quarantined (`payments.flake.test.ts`) but documented in CI config — ✓
- T4 Smoke tests against staging: ⚠ NOT YET RUN — staging deploy is manual; agent flags this

#### S (Security)
- S1 Dependency vulnerabilities: ✓ no CRITICAL/HIGH
- S2 Secrets in history: ✓ clean
- S3 Authn/authz changes reviewed: n/a — no auth changes in this release
- S4 New external endpoints: n/a

#### R (Rollback)
- R1 Rollback plan exists: ✓ — release runbook referenced
- R2 DB migrations: n/a — no migrations in v2.4.0
- R3 Rollback verified: ✗ — last rollback dry-run was 2 months ago, in v2.2.0
- R4 Rollback ownership: ✓ — on-call DevOps named

#### O (Observability)
- O1 Logs/metrics/traces for new code: ⚠ — saved-searches has logs but no metrics yet
- O2 Alerts for new error conditions: ✓ — error rate alert generic enough
- O3 Dashboards updated: ✗ — saved-searches dashboard not yet created
- O4 On-call briefed: ✓ — briefed at standup this morning

#### D (Documentation)
- D1 Release notes drafted: ✓ — `RELEASES.md` updated
- D2 Public-facing docs: ✓ — saved-searches added to user docs
- D3 Internal docs: ⚠ — runbook for saved-searches not yet written
- D4 Migration guide: n/a — no breaking changes

#### B (Build artifacts)
- B1 RC tag created: agent creates `v2.4.0-rc1`
- B2 Build artifacts: ✓ CI produces signed Docker image
- B3 Signatures / attestations: ✓
- B4 Integrity verified: ✓

#### H (Human approval)
- H1 Operator reviewed checklist: pending
- H2 Caveats accepted: pending (since there are caveats)
- H3 Required reviewers: ✓ — PR approvals from CODEOWNERS in place
- H4 Release coordinator notified: ✓ — same person as operator in this case

### Verdict

**GO_WITH_CAVEATS** — three caveats:

| # | Caveat | Operational impact | Mitigation | Operator acceptance |
|---|---|---|---|---|
| 1 | Smoke tests against staging not yet run (T4) | Higher risk of staging-only bugs reaching production | Run smoke tests manually before deploy; if they fail, NO_GO | (pending) |
| 2 | Saved-searches metrics not wired (O1) | Cannot observe usage / latency for new feature | Add metrics in v2.4.1 hotfix within 1 week | (pending) |
| 3 | Saved-searches dashboard not created (O3) | Hard to debug saved-searches issues if they arise | Create dashboard within 24h of deploy; on-call reads logs in the meantime | (pending) |

Agent generates deploy checklist artifact at `.governance/artifacts/2026-05-08-deploy-checklist-2.4.0.md` (per `templates/deploy-checklist.template.md`) populating all sections, including the caveats table.

Agent surfaces to Michael:
> Deploy verdict: **GO_WITH_CAVEATS** for v2.4.0.
>
> Three caveats to accept:
> 1. Staging smoke tests not yet run — run them manually before deploy
> 2. Saved-searches metrics missing — wire in v2.4.1 within 1 week
> 3. Saved-searches dashboard missing — create within 24h of deploy
>
> Each caveat needs explicit acceptance. Reply "accept all" or "accept #1 #3" / etc.

Michael at 14:25Z: "Run staging smoke tests now. If they pass, I accept caveats #2 and #3 with the mitigations as stated. Don't accept #1 — turn it from a caveat into a pre-flight check."

Agent runs staging smoke tests (assume they pass). T4 changes from ⚠ to ✓. Caveat #1 is removed.

Updated verdict: **GO_WITH_CAVEATS** with 2 remaining caveats (#2 and #3).

Michael accepts: "Accept #2 and #3."

Caveats are recorded in the deploy checklist with operator name + timestamp.

**Phase 2 checkpoint:** Deploy checklist complete; verdict GO_WITH_CAVEATS accepted; RC tag `v2.4.0-rc1` created. ✓

### Phase 3 — Freeze (lock release branch)

Agent updates manifest:
```json
{
  "schema_version": 1,
  "current_mode": "freeze",
  "entered_at": "2026-05-08T14:35:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "deploy-prep",
  "next_allowed_transitions": ["pause", "deploy-prep", "recovery", "handoff"],
  "validation_tier": "language-specific",
  "freeze_reason": "deploy-prep complete; awaiting deploy of v2.4.0",
  "freeze_thaw_conditions": [
    "v2.4.0 deployed to production",
    "Production smoke tests pass for 30 minutes",
    "Caveats #2 and #3 mitigations are scheduled (not yet executed; tracked separately)"
  ],
  "freeze_expected_thaw": "2026-05-08T18:00:00Z",
  "target_release": "2.4.0"
}
```

Agent generates freeze declaration at `.governance/artifacts/2026-05-08-freeze-declaration.md` referencing the deploy checklist.

Agent updates branch protection on `release/v2.4.0`:
- Require 2 approvals (was 1)
- Require status checks: CI build, integration tests
- Restrict who can push: only the release coordinator

Audit trail entries:
```markdown
## 2026-05-08T14:00:00Z stabilize → deploy-prep
- operator: claude-code:michael
- workflow: deployment-preparation
- artifacts: (in progress)
- entry-conditions: pass
- completion: complete (verdict: GO_WITH_CAVEATS, caveats #2 #3 accepted)
- notes: target release 2.4.0; rc tag v2.4.0-rc1 created

## 2026-05-08T14:35:00Z deploy-prep → freeze
- operator: claude-code:michael
- workflow: deployment-preparation
- artifacts: .governance/artifacts/2026-05-08-deploy-checklist-2.4.0.md, .governance/artifacts/2026-05-08-freeze-declaration.md
- entry-conditions: pass
- completion: complete
- notes: pre-deploy lockdown; expected thaw 2026-05-08T18:00Z; branch protection updated
```

Agent surfaces: "Repo frozen for v2.4.0 deploy. Checklist + freeze declaration committed. Expected thaw: 18:00Z after production verification. Caveats #2 #3 logged for follow-up tickets."

---

## Outcome

- Deployment readiness gated by an evaluator that surfaced specific gaps
- Operator made a granular decision: convert one caveat into a pre-flight check, accept the other two with explicit mitigations
- Repo locked at the hosting layer (branch protection) and at the manifest layer (freeze mode)
- Caveats are logged in audit-trail-readable form so v2.4.1 follow-up work has clear provenance

## What this example demonstrates

- `GO_WITH_CAVEATS` is a structured conversation, not a rubber stamp — operator interaction is granular per caveat
- The workflow does not auto-accept caveats — `evaluators/deployment-readiness.md` explicitly requires operator acceptance per item
- Some caveats are convertible into pre-flight actions (#1 above); others are accepted with mitigations (#2, #3). The framework supports both paths.
- The freeze mode at hosting layer (branch protection) plus manifest layer (mode) is dual enforcement — agents who don't read the manifest still can't merge because the hosting layer blocks them
