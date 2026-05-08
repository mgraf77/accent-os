# Schema: repo-manifest

## Identity
- **Schema:** `repo-manifest`
- **Version:** v1
- **Purpose:** Single source of truth for the repo's declared operational state. Every mode and workflow reads from and writes to this file.
- **Format:** JSON
- **Default location:** `repo-manifest.json` at repo root

## Required fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | integer | Schema version (currently `1`) |
| `current_mode` | enum | One of: `stabilize`, `pause`, `freeze`, `handoff`, `resume`, `audit`, `recovery`, `deploy-prep`, `extraction-prep`, `governance-transition`, `sandbox` |
| `entered_at` | string (ISO-8601) | When the current mode was entered |
| `entered_by` | string | Operator identity (e.g. `claude-code:michael`, `codex`, `human:michael`) |
| `previous_mode` | enum or null | The mode prior to current. Null only on bootstrap. |
| `next_allowed_transitions` | array of enum | Modes the repo may transition to next, per `detection.md` Step 2 |
| `validation_tier` | enum | `universal` / `language-specific` / `repo-specific` (highest tier the repo enforces) |
| `audit_trail_path` | string | Path to the audit-trail markdown file (default `.governance/audit-trail.md`) |
| `artifacts_path` | string | Directory for mode artifacts (default `.governance/artifacts/`) |

## Optional fields (mode-specific)

| Field | Type | When set | Description |
|---|---|---|---|
| `scope` | object | Anytime | Scope of the current mode |
| `scope.kind` | enum | If `scope` set | `whole-repo` / `paths` / `branches` / `modules` |
| `scope.paths` | array of strings | If `scope.kind = paths` | Glob patterns or paths the mode applies to |
| `scope.branches` | array of strings | If `scope.kind = branches` | Branch names |
| `scope.modules` | array of strings | If `scope.kind = modules` | Module names per repo's convention |
| `freeze_reason` | string | When `current_mode = freeze` | Required field while frozen |
| `freeze_thaw_conditions` | array of strings | When `current_mode = freeze` | Specific testable conditions |
| `freeze_expected_thaw` | string (ISO-8601) | When `current_mode = freeze` | Approximate target |
| `target_release` | string | When `current_mode = deploy-prep` or related | Version being prepared |
| `extraction_target` | string | When `current_mode = extraction-prep` | Unit being extracted |
| `transition_name` | string | When `current_mode = governance-transition` | Name of the change |
| `handoff_to` | string | When `current_mode = handoff` | Incoming operator identity |
| `recovery_reason` | string | When `current_mode = recovery` | What broke |
| `last_audit_at` | string (ISO-8601) | After any audit | Most recent audit timestamp |
| `last_audit_score` | integer (0-100) | After any audit | Most recent repo-health score |
| `last_audit_tier` | enum | After any audit | EXCELLENT / GOOD / FAIR / POOR / CRITICAL |
| `last_extraction` | string | After successful extraction | Format: `[unit-name]@[tag]` |
| `last_governance_transition` | string | After successful gov-transition | Format: `[name]@[date]` |
| `validation` | object | Repo-specific extensions | See "validation extensions" below |

### Validation extensions

```json
{
  "validation": {
    "audit_extras": ["custom check 1", "..."],
    "deploy_prep_extras": ["..."],
    "extraction_extras": ["..."],
    "audit_freshness_hours": 24,
    "validation_freshness_minutes": 30
  }
}
```

Repos can extend the universal validation requirements by adding entries here. Each entry is consulted by the corresponding evaluator's "Repo-specific" tier.

## Validation rules

1. `current_mode` must be a valid mode enum value.
2. `next_allowed_transitions` must contain only modes valid per `detection.md` Step 2 transition table from `current_mode`.
3. `entered_at` must not be in the future (allow 60s clock skew).
4. `freeze_reason` is required iff `current_mode = freeze`.
5. `target_release` is required iff `current_mode = deploy-prep`.
6. `extraction_target` is required iff `current_mode = extraction-prep`.
7. `transition_name` is required iff `current_mode = governance-transition`.
8. `handoff_to` is required iff `current_mode = handoff`.
9. `recovery_reason` is required iff `current_mode = recovery`.
10. `previous_mode` is null iff this is the bootstrap manifest.
11. `audit_trail_path` and `artifacts_path` must point to writable locations (or be createable).
12. If `scope.kind = paths`, every path must be a valid glob pattern or relative path from repo root.

## JSON example

```json
{
  "schema_version": 1,
  "current_mode": "stabilize",
  "entered_at": "2026-05-08T15:30:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "audit",
  "next_allowed_transitions": [
    "pause",
    "freeze",
    "deploy-prep",
    "extraction-prep",
    "governance-transition",
    "handoff",
    "audit",
    "sandbox"
  ],
  "validation_tier": "language-specific",
  "audit_trail_path": ".governance/audit-trail.md",
  "artifacts_path": ".governance/artifacts/",
  "scope": {
    "kind": "whole-repo"
  },
  "last_audit_at": "2026-05-08T14:00:00Z",
  "last_audit_score": 87,
  "last_audit_tier": "GOOD",
  "validation": {
    "audit_freshness_hours": 24,
    "validation_freshness_minutes": 30
  }
}
```

## Bootstrap example (first manifest, no prior mode)

```json
{
  "schema_version": 1,
  "current_mode": "sandbox",
  "entered_at": "2026-05-08T15:00:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": null,
  "next_allowed_transitions": [
    "stabilize",
    "audit"
  ],
  "validation_tier": "universal",
  "audit_trail_path": ".governance/audit-trail.md",
  "artifacts_path": ".governance/artifacts/",
  "scope": {
    "kind": "whole-repo"
  }
}
```

## Frozen example

```json
{
  "schema_version": 1,
  "current_mode": "freeze",
  "entered_at": "2026-05-08T16:00:00Z",
  "entered_by": "human:michael",
  "previous_mode": "deploy-prep",
  "next_allowed_transitions": ["pause", "deploy-prep", "recovery", "handoff"],
  "validation_tier": "language-specific",
  "audit_trail_path": ".governance/audit-trail.md",
  "artifacts_path": ".governance/artifacts/",
  "freeze_reason": "Pre-deploy lockdown for v1.2.3",
  "freeze_thaw_conditions": [
    "v1.2.3 deployed to production",
    "Production smoke tests pass for 30 minutes"
  ],
  "freeze_expected_thaw": "2026-05-09T18:00:00Z",
  "target_release": "1.2.3"
}
```

## Atomicity guidance

The manifest must be updated atomically with the audit-trail entry — both happen or neither. Recommended pattern:
1. Stage manifest update (write to temp).
2. Append audit-trail entry.
3. Move temp manifest into place.
4. Commit both changes in the same git commit.

If git is unavailable, an OS-level rename is the minimum atomicity primitive.

## Migration from older versions

There is currently only v1. When v2 is introduced:
- v1 manifests will be readable but flagged.
- A migration command will be provided to upgrade v1 → v2 in place.
- The migration will be a single atomic transaction with a backup.
