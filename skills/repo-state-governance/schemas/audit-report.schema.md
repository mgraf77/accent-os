# Schema: audit-report

## Identity
- **Schema:** `audit-report`
- **Version:** v1
- **Purpose:** Findings from `audit` mode. Captures repo health, drift, debt, risks, and recommended next mode.
- **Format:** Markdown (primary) with optional JSON sidecar
- **Default location:** `.governance/artifacts/[YYYY-MM-DD]-audit-report.md`

## Required sections

### Section: Header
| Field | Description |
|---|---|
| `schema_version` | `1` |
| `audited_at` | ISO-8601 |
| `auditor` | Operator identity |
| `repo_name` | Repo name |
| `commit_audited` | HEAD hash + short message |
| `branch_audited` | Branch name |

### Section: Repo-health summary
- **Score:** 0–100 (from `evaluators/repo-health.md`)
- **Tier:** EXCELLENT / GOOD / FAIR / POOR / CRITICAL
- Per-category breakdown (Tests, Lint, etc.) with scores
- Veto flags (if any) with explanation

### Section: Findings
Findings are grouped by severity:

- **CRITICAL** — must address before any non-recovery mode
- **HIGH** — must address before HIGH-risk modes (deploy-prep, extraction-prep, governance-transition)
- **MEDIUM** — address in next stabilize cycle
- **LOW** — backlog

Each finding has:
- ID (e.g. F1, F2, ...)
- Severity
- Category (test / lint / dep / sec / doc / etc.)
- Description
- Affected files / paths
- Suggested remediation
- Estimated effort (small / medium / large)

### Section: Drift report
What has changed since the last audit (or last release if no prior audit):
- Code drift (commits since)
- Doc drift (docs that no longer match code)
- Dependency drift (new / updated / removed deps)
- Schema drift (if applicable)
- Test drift (added / removed / quarantined tests)

### Section: Risk register
Each risk:
- ID (R1, R2, ...)
- Description
- Likelihood (low / medium / high)
- Impact (low / medium / high)
- Mitigation strategy
- Owner (if assigned)

### Section: Recommended next mode
- Recommended mode (one of the 11)
- Rationale (1-3 sentences)
- Alternatives considered (1-2 with rationale why not)
- Risk tier of the recommended next transition

### Section: Recommended remediation actions
- Ordered list of actions handed off to the next mode
- Each action: specific, scoped, with effort estimate
- Cross-reference to findings (each action addresses one or more F#)

### Section: Limitations of this audit
- What this audit did NOT check (and why)
- Required: at least one limitation listed (no audit is exhaustive)

## Validation rules

1. All required sections must exist.
2. Score must be 0–100.
3. Tier must match the score per `evaluators/repo-health.md` mapping.
4. Each finding must have all required fields populated.
5. Recommended next mode must be one of the 11 modes.
6. Recommended next mode must be a valid transition from current mode (per `detection.md` Step 2).
7. At least one limitation must be listed (the audit is not omniscient).

## Markdown rendering example

```markdown
# Audit Report

**Audited at:** 2026-05-08T13:00Z
**Auditor:** claude-code:michael
**Repo:** my-repo
**Commit:** a1b2c3d "Refactor token validation"
**Branch:** main

## Repo-health summary
**Score:** 78/100 — GOOD

### Category breakdown
- Tests (25): 88/100 — 7/8 items pass (one quarantined test)
- Lint / Style / Types (15): 95/100
- Working tree / Git (10): 100/100
- Dependencies (15): 60/100 — one HIGH vuln, one abandoned dep
- Documentation (10): 80/100 — 1 broken link
- CI / Tooling (10): 100/100
- Security / Secrets (10): 100/100
- Governance state (5): 100/100

### Veto flags
- D2 (no CRITICAL/HIGH vulns) — FAIL → tier capped at FAIR (uncapped here because the score is 78 → GOOD; flag only)

## Findings

### HIGH

**F1** [Severity: HIGH] [Category: dep]
- Description: Transitive dependency `foo@1.2.3` has a HIGH-severity CVE (CVE-2026-12345)
- Affected: `package-lock.json` (indirect via `bar@2.0.1`)
- Remediation: upgrade `bar` to `2.1.0` which pulls `foo@1.3.0` (patched)
- Effort: small

### MEDIUM

**F2** [Severity: MEDIUM] [Category: test]
- Description: One test is quarantined with `.skip` and no comment explaining why
- Affected: `auth.test.ts:142`
- Remediation: investigate and either re-enable, delete with rationale, or add comment explaining the quarantine
- Effort: small

### LOW

**F3** [Severity: LOW] [Category: doc]
- Description: `README.md` references `getCwd()` which was renamed to `getCurrentWorkingDirectory()`
- Affected: `README.md` line 87
- Remediation: update doc reference
- Effort: trivial

## Drift report
- Code drift: 14 commits since last audit (2026-05-01)
- Doc drift: README references one renamed API (F3)
- Dependency drift: 3 deps updated, 1 added (`foo@1.2.3` — see F1)
- Schema drift: none (no schema changes this period)
- Test drift: 5 tests added, 1 quarantined (F2), 0 removed

## Risk register
- **R1** Dependency vuln blocks deploy until F1 is addressed. Likelihood: high. Impact: high (security). Mitigation: F1 remediation. Owner: stabilize-mode operator.
- **R2** Quarantined test may be hiding a real bug. Likelihood: low. Impact: medium. Mitigation: F2 remediation.
- **R3** README drift confuses new contributors. Likelihood: medium. Impact: low. Mitigation: F3 remediation.

## Recommended next mode
**stabilize**

Rationale: Two non-trivial findings (F1, F2) that should be addressed before any HIGH-risk transition. F1 in particular blocks deploy-prep until resolved.

Alternatives considered:
- `deploy-prep` — rejected, F1 will fail security check
- `pause` — rejected, F1 should be addressed before pausing (don't pause on a known vuln)

Risk tier of recommended transition: LOW

## Recommended remediation actions
1. Address F1 (dependency vuln upgrade) — small effort
2. Address F2 (quarantined test investigation) — small effort
3. Address F3 (README drift) — trivial effort

## Limitations of this audit
- Did not run integration / e2e tests (only unit tests covered)
- Did not check performance regressions
- Did not check accessibility compliance
- Did not check vendor API contracts (would require live calls)
- Did not check rate-limit / quota usage on external services
```

## JSON sidecar example (abbreviated)

```json
{
  "schema_version": 1,
  "schema": "audit-report",
  "audited_at": "2026-05-08T13:00:00Z",
  "auditor": "claude-code:michael",
  "repo_name": "my-repo",
  "commit_audited": "a1b2c3d",
  "branch_audited": "main",
  "health": {
    "score": 78,
    "tier": "GOOD",
    "categories": {
      "tests": 88,
      "lint": 95,
      "git": 100,
      "deps": 60,
      "docs": 80,
      "ci": 100,
      "secrets": 100,
      "governance": 100
    },
    "veto_flags": ["D2"]
  },
  "findings": [
    {
      "id": "F1",
      "severity": "HIGH",
      "category": "dep",
      "description": "Transitive dependency foo@1.2.3 has a HIGH-severity CVE",
      "affected": ["package-lock.json"],
      "remediation": "upgrade bar to 2.1.0",
      "effort": "small"
    }
  ],
  "recommended_next_mode": "stabilize",
  "limitations": [
    "Did not run integration tests",
    "Did not check performance",
    "Did not check accessibility"
  ]
}
```
