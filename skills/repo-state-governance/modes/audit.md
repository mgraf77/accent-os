# Mode: audit

## Identity
- **Mode key:** `audit`
- **Risk tier:** LOW
- **Reversibility:** READ-ONLY (no state changes by definition)
- **Typical duration:** minutes to an hour
- **Concurrency:** MULTI_AGENT_OK (read-only)

## Purpose
Read-only evaluation of the repo's current state, health, drift, debt, and risk. Audit produces a structured report that informs the *next* mode decision but does not itself change state.

Audit is the "look before you leap" mode. Run it before HIGH-risk transitions (deploy-prep, extraction-prep, governance-transition) and as part of safe-resumption.

## Entry Conditions
- None beyond repo reachability — audit is the most permissive mode to enter
- Can be entered from any mode (audit is always allowed)

## Goals (ordered)
1. Run the repo-health evaluator (`evaluators/repo-health.md`) and produce a score
2. Identify drift between code and docs
3. Identify in-flight work that may have been forgotten
4. Identify risks (security, dependency, schema, test coverage)
5. Produce an audit report (per `templates/audit-report.template.md`)
6. Recommend next mode based on findings

## Allowed Actions
- Run the repo's tests (read-only execution)
- Run the repo's lint / type check / static analysis
- Run the repo-health evaluator
- Read all files
- Inspect git log, branches, tags, and remotes
- Compare working tree vs. main vs. last release tag
- Inspect dependency lockfiles for known-vulnerable packages
- Generate the audit report
- Append to audit trail (only the audit-mode entry, no other state changes)

## Forbidden Actions
- ANY commit (audit is read-only by definition)
- Modifying files (including auto-fixing lint issues — surface them, don't fix them)
- Updating dependencies
- Modifying the manifest beyond appending the audit-mode entry
- Closing or commenting on PRs
- Pushing to any branch
- Deleting branches, tags, or files

## Execution Priorities
1. **Read-only is non-negotiable.** Even "obvious" fixes wait for the post-audit mode.
2. **Capture, don't act.** Findings go into the report; remediation is for the next mode.
3. **Score on universal rubric first.** Then add repo-specific observations.
4. **Surface the worst finding first.** Audit reports are read; people skim.

## Documentation Requirements
- Audit report at `.governance/artifacts/[YYYY-MM-DD]-audit-report.md` (template: `templates/audit-report.template.md`, schema: `schemas/audit-report.schema.md`)
  - Required sections:
    - Repo identity (name, branch, commit hash audited)
    - Repo-health score + tier
    - Findings: critical / high / medium / low
    - Drift report
    - Risk register
    - Recommended next mode
    - Recommended remediation actions (handed off to the next mode, not done here)
- Audit-trail entry: `[date] [previous-mode] → audit` with summary score

## Validation Requirements

**Universal:**
- Repo-health evaluator ran and produced a score
- Audit report exists, validates against `schemas/audit-report.schema.md`
- All required sections in the report are non-empty
- No commits were made during the audit (verify via `git rev-parse HEAD` before/after)

**Repo-specific:**
- Per manifest's `validation.audit_extras` field

## Completion Criteria
- Audit report written
- Audit-trail entry appended
- No state changes outside the audit-trail entry

## Allowed Transitions
- `audit → (any mode)` — audit findings inform the next mode; operator decides
- Most common: `audit → stabilize` if findings warrant fixes
- `audit → recovery` if audit found brokenness
- `audit → freeze` if findings warrant locking down
- `audit → deploy-prep` if findings show ready-to-ship

## Risk Profile

| Risk | Mitigation |
|---|---|
| Audit becomes "let me just fix this one thing" | Hard rule: forbidden-action enforcement; auditor's job is reporting, not remediation |
| Audit report is too long to read | Schema requires "top finding" and "recommended next mode" at the top; details below |
| Audit misses a known issue | Repo-health evaluator includes a `known-issues` carry-forward field |
| Concurrent audits produce conflicting reports | Both append to audit trail; later audit can reference earlier |
| Auditor lacks repo-specific context | Audit report includes a "limitations of this audit" section so consumers know what wasn't checked |
| Stale audit used to justify a HIGH-risk transition | Manifest tracks `last_audit_at`; HIGH-risk modes' entry conditions check freshness |

## AI Agent Guidance

- **Be honest about what you didn't check.** Listing "limitations of this audit" is a feature, not a weakness.
- **Use the repo's own tools.** If the repo has a `doc-drift` skill, run it. If it has `efficiency-monitor`, surface its flags. Don't reinvent.
- **Run tests in a clean environment if possible.** Otherwise note "tests run in [environment]" in the report.
- **Score the universal rubric first.** Then layer repo-specific observations. This makes the report comparable across repos.
- **Recommend, don't prescribe.** Say "recommend stabilize mode" + reasons; let the operator decide.
- **Multiple agents can audit concurrently.** That's fine — each appends to the audit trail. If reports conflict materially, surface the conflict.

## Human-in-the-Loop Touchpoints

- **Required:** none for the audit itself.
- **Recommended:** human reviews critical or high findings before the next mode is entered.
- **Required override:** if audit recommends `recovery` and operator wants to proceed otherwise, capture that decision in `decision-log` (or equivalent).
