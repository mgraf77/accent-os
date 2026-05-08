# Schemas

Schemas define the structure of artifacts produced by modes and workflows. Each schema is a JSON-Schema-style spec written in markdown for human readability, with a JSON example that can be used as a programmatic validation source.

## Quick reference

| Schema | File | Used by | Format |
|---|---|---|---|
| repo-manifest | `repo-manifest.schema.md` | bootstrap, every transition | JSON file at repo root |
| state-report | `state-report.schema.md` | audit, status request, pause | Markdown with optional JSON sidecar |
| handoff-report | `handoff-report.schema.md` | handoff mode, ai-handoff workflow | Markdown |
| migration-report | `migration-report.schema.md` | governance-transition, governance-migration workflow | Markdown |
| audit-report | `audit-report.schema.md` | audit mode | Markdown with JSON sidecar |
| recovery-plan | `recovery-plan.schema.md` | recovery mode, repo-recovery workflow | Markdown |

## Schema file conventions

Every schema file has these sections:

1. **Identity** — schema name, version, purpose
2. **Format** — markdown / JSON / hybrid
3. **Required fields** — must be present, validation fails without them
4. **Optional fields** — recommended but not blocking
5. **Field types** — string / list / object / enum / etc.
6. **Validation rules** — invariants beyond field presence (e.g. "field X must be ≤ field Y")
7. **JSON-schema-like example** — copyable starting point
8. **Markdown rendering example** — for human-facing artifacts, the markdown layout

## Versioning

Schemas are versioned. Breaking changes increment the major version. The `repo-manifest.json` records the schema version it was written against. When this skill encounters a manifest written against an older version, it can read it but emits a one-line "consider migrating to v[N]" recommendation.

Current versions:
- `repo-manifest`: v1
- `state-report`: v1
- `handoff-report`: v1
- `migration-report`: v1
- `audit-report`: v1
- `recovery-plan`: v1
