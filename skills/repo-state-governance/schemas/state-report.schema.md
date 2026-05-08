# Schema: state-report

## Identity
- **Schema:** `state-report`
- **Version:** v1
- **Purpose:** Snapshot of the repo's current operational state. Generated on demand (e.g. `audit` mode, status request) without requiring a mode transition.
- **Format:** Markdown (human-readable) with optional JSON sidecar for machine consumption

## Required fields

| Field | Type | Description |
|---|---|---|
| `repo_name` | string | Repo name as known by the manifest or directory |
| `report_at` | string (ISO-8601) | When the report was generated |
| `report_by` | string | Operator who generated it |
| `current_mode` | enum | From the manifest |
| `mode_entered_at` | string (ISO-8601) | When current mode was entered |
| `mode_duration` | string | Human-readable (e.g. "2 hours", "3 days") |
| `branch` | string | Current branch |
| `head_commit` | string | Current HEAD commit hash (short, 7-12 chars) |
| `working_tree_status` | enum | `clean` / `dirty-tracked` / `dirty-untracked` / `dirty-mixed` |
| `audit_trail_summary` | object | See "Audit trail summary" below |

## Optional fields

| Field | Type | Description |
|---|---|---|
| `last_audit` | object | If a recent audit exists: score, tier, date |
| `open_blockers` | array of objects | If known: each blocker with description + impact |
| `next_allowed_transitions` | array of enum | From the manifest |
| `recommendations` | array of strings | Recommended next actions |

### Audit trail summary

```json
{
  "audit_trail_summary": {
    "total_entries": 42,
    "last_5_transitions": [
      "2026-05-08 audit → stabilize",
      "2026-05-08 stabilize → audit",
      "..."
    ],
    "current_mode_duration": "2h",
    "transitions_in_last_30d": 18
  }
}
```

## Validation rules

1. `report_at` is not in the future.
2. `mode_entered_at` ≤ `report_at`.
3. `mode_duration` is consistent with `(report_at - mode_entered_at)`.
4. `head_commit` is a valid git hash (or "no-commits" for empty repo).
5. `current_mode` matches the manifest's current_mode at time of report.

## Markdown rendering example

```markdown
# State Report

**Repo:** my-repo
**Report at:** 2026-05-08T15:30:00Z
**Report by:** claude-code:michael

## Current state
- **Mode:** stabilize (entered 2h ago at 13:30Z)
- **Branch:** feature/auth-refactor
- **HEAD:** a1b2c3d ("Refactor token validation")
- **Working tree:** dirty-tracked (3 modified files, see WIP doc)

## Recent activity
- Audit trail: 42 entries total, 18 in last 30 days
- Last 5 transitions:
  - 2026-05-08T13:30 audit → stabilize
  - 2026-05-08T13:00 pause → audit
  - 2026-05-07T17:45 stabilize → pause
  - 2026-05-07T15:20 audit → stabilize
  - 2026-05-07T15:00 (any) → audit

## Last audit
- **Date:** 2026-05-08T13:00Z
- **Score:** 87/100 — GOOD
- **Top finding:** dependency vuln in transitive dep `foo@1.2.3` (HIGH)

## Next allowed transitions
- pause, freeze, deploy-prep, extraction-prep, governance-transition, handoff, audit, sandbox

## Recommendations
- Address the dependency vuln before deploy-prep
- Consider stabilize → pause if stepping away
```

## JSON sidecar example

```json
{
  "schema_version": 1,
  "schema": "state-report",
  "repo_name": "my-repo",
  "report_at": "2026-05-08T15:30:00Z",
  "report_by": "claude-code:michael",
  "current_mode": "stabilize",
  "mode_entered_at": "2026-05-08T13:30:00Z",
  "mode_duration": "2h",
  "branch": "feature/auth-refactor",
  "head_commit": "a1b2c3d",
  "working_tree_status": "dirty-tracked",
  "audit_trail_summary": {
    "total_entries": 42,
    "last_5_transitions": [
      "2026-05-08T13:30 audit → stabilize",
      "2026-05-08T13:00 pause → audit",
      "2026-05-07T17:45 stabilize → pause",
      "2026-05-07T15:20 audit → stabilize",
      "2026-05-07T15:00 (any) → audit"
    ],
    "current_mode_duration": "2h",
    "transitions_in_last_30d": 18
  },
  "last_audit": {
    "date": "2026-05-08T13:00:00Z",
    "score": 87,
    "tier": "GOOD",
    "top_finding": "dependency vuln in transitive dep foo@1.2.3 (HIGH)"
  },
  "next_allowed_transitions": [
    "pause", "freeze", "deploy-prep", "extraction-prep",
    "governance-transition", "handoff", "audit", "sandbox"
  ],
  "recommendations": [
    "Address the dependency vuln before deploy-prep",
    "Consider stabilize → pause if stepping away"
  ]
}
```
