# Evaluator: deployment-readiness

## Identity
- **Name:** `deployment-readiness`
- **Purpose:** Produce a GO / NO_GO / GO_WITH_CAVEATS verdict for shipping a release. Used by `deploy-prep` mode and `deployment-preparation` workflow as the gate before transitioning to `freeze`.
- **Used by:** `deploy-prep` mode, `deployment-preparation` workflow Phase 2

## Inputs
- Repo at the candidate release commit
- Target release version
- Deploy checklist (in progress)
- Repo-health evaluator's most recent score (must be fresh — within `manifest.audit_freshness_hours`)
- CI status for the candidate commit

## Checklist

### Category P — Pre-conditions (any FAIL → NO_GO)
- P1. Manifest is in `deploy-prep` mode — pass/fail
- P2. Stabilize Completion Criteria were met before entering deploy-prep — pass/fail
- P3. Repo-health score is GOOD or better (≥ 75) — pass/fail
- P4. Target release version is named and follows the repo's versioning convention — pass/fail
- P5. Release scope is finalized (no in-flight feature commits) — pass/fail

### Category T — Tests (any FAIL → NO_GO)
- T1. Full test suite passes in CI (not just locally) — pass/fail
- T2. Integration / e2e suite passes (if present) — pass/fail/n-a
- T3. No quarantined / skipped tests in the release scope without explicit approval — pass/fail
- T4. Smoke tests pass against staging (if staging exists) — pass/fail/n-a

### Category S — Security (any FAIL → NO_GO unless caveat-accepted)
- S1. No CRITICAL or HIGH dependency vulnerabilities — pass/fail
- S2. No secrets in the candidate commit's history — pass/fail
- S3. Authentication / authorization changes (if any) reviewed by a human — pass/fail/n-a
- S4. New external network endpoints (if any) reviewed for hardening — pass/fail/n-a

### Category R — Rollback (any FAIL → NO_GO)
- R1. Rollback plan exists and is specific (not "we can revert the commit") — pass/fail
- R2. Rollback plan handles database migrations if any are in this release — pass/fail/n-a
- R3. Rollback plan has been verified executable (dry-run if possible) — pass/fail
- R4. Rollback ownership is identified (who runs it, who approves it during incident) — pass/fail

### Category O — Observability (FAIL → GO_WITH_CAVEATS or NO_GO)
- O1. New code paths have logs / metrics / traces wired — pass/fail
- O2. Alerts exist for new error conditions — pass/fail/n-a
- O3. Dashboards updated to reflect new functionality — pass/fail/n-a
- O4. On-call / incident-response is briefed on what's deploying — pass/fail

### Category D — Documentation (FAIL → GO_WITH_CAVEATS)
- D1. Release notes drafted and reviewed — pass/fail
- D2. Public-facing docs (if applicable) updated to match release — pass/fail/n-a
- D3. Internal docs (architecture, runbooks) updated for changes — pass/fail/n-a
- D4. Migration guide for breaking changes (if any) — pass/fail/n-a

### Category B — Build artifacts (any FAIL → NO_GO)
- B1. Release candidate (RC) tag created — pass/fail
- B2. Build artifacts (binaries, packages, container images) produced and stored — pass/fail/n-a
- B3. Artifact signatures / provenance attestations exist (if repo signs releases) — pass/fail/n-a
- B4. Artifact integrity verified (checksum, signature) — pass/fail/n-a

### Category H — Human approval (FAIL → NO_GO)
- H1. Operator has reviewed the deploy checklist — pass/fail
- H2. Each GO_WITH_CAVEATS caveat has been explicitly accepted by operator — pass/fail/n-a
- H3. Required reviewers (per CODEOWNERS / branch protection) have approved — pass/fail/n-a
- H4. Release coordinator / on-call notified — pass/fail/n-a

## Scoring

Binary verdict at the category level:

```
verdict =
  NO_GO  if any item in P, T, S (without caveat), R, B, or H is FAIL
  GO_WITH_CAVEATS  if any item in O or D is FAIL OR an S item has accepted caveat
  GO  if all items pass (or are n-a)
```

Caveats list: when GO_WITH_CAVEATS, every failed item is enumerated as a caveat in the output, with operator's explicit acceptance for each.

## Verdict mapping

| Verdict | Meaning |
|---|---|
| GO | All criteria met. Safe to freeze + deploy. |
| GO_WITH_CAVEATS | Critical criteria met; non-critical issues exist. Operator has accepted each caveat explicitly. Deploy with elevated monitoring. |
| NO_GO | Critical criteria failed. Do not deploy. Address findings; re-run evaluator. |

## Output format

```markdown
## Deployment readiness: [GO | GO_WITH_CAVEATS | NO_GO]

**Target release:** [version]
**Candidate commit:** [hash]
**Repo-health score (recent):** [score]/100 — [tier]

### Categories
- P (Pre-conditions): [count passed]/[applicable]
- T (Tests): [count passed]/[applicable]
- S (Security): [count passed]/[applicable]
- R (Rollback): [count passed]/[applicable]
- O (Observability): [count passed]/[applicable]
- D (Documentation): [count passed]/[applicable]
- B (Build artifacts): [count passed]/[applicable]
- H (Human approval): [count passed]/[applicable]

### Failed items (NO_GO blockers)
- [category-id] [item-id]: [item] — [specific failure]
- ...

### Caveats (if GO_WITH_CAVEATS)
- [category-id] [item-id]: [item] — [caveat description]
  - **Operational impact:** [...]
  - **Mitigation:** [...]
  - **Operator acceptance:** [name / date]
- ...

### What this rubric does NOT check
- Production capacity / scaling readiness
- Customer / user impact estimation
- Marketing / launch coordination
- Compliance with legal hold / regulatory deadlines (consult legal separately)
```

## Common false-positives / false-negatives

- **False-positive on R3 (rollback verified):** A "dry run" is best-effort; some rollbacks (especially db) can't truly be tested without going through production conditions. Surface as a caveat if untested.
- **False-negative on T1 (CI passes):** CI green doesn't catch all production issues — e.g. environment-specific bugs, race conditions, traffic-pattern issues. CI is necessary, not sufficient.
- **False-positive on H3 (required reviewers approved):** GitHub-style approval is an audit trail, not a quality guarantee — reviewers may rubber-stamp. Mitigation: require specific reviewers per CODEOWNERS, not "any 1 approval."
