# AccentOS — Doc Registry
_Single classification index. Read this before writing a new doc._
_Last updated: 2026-05-13_

---

## Tier 1 — CANONICAL (authoritative operational truth, updated regularly)

These docs must remain accurate. Update them when state changes.

| Doc | Purpose | Owner |
|---|---|---|
| `SYSTEM_STATE.md` | Current runtime, branch, DB, worker state | Claude/ops |
| `KNOWN_ISSUES.md` | Active issue register | Claude/ops |
| `CURRENT_PRIORITIES.md` | Tier 1–3 priority queue | Claude |
| `WORK_IN_PROGRESS.md` | Live session checkpoint | Claude |
| `RUNTIME_MAP.md` | System topology, URLs, localStorage keys | Claude |
| `docs/canonical/RUNTIME_REGISTRY_CONTRACT.md` | `window.__AOS_RUNTIME__` schema | Claude |
| `docs/runtime/CLOUDFLARE_DEPLOYMENT_FLOW.md` | How to deploy worker | Claude/ops |
| `docs/runtime/WORKER_RUNTIME_RECOVERY.md` | Worker failure recovery | Claude/ops |

---

## Tier 2 — REFERENCE (supporting intelligence, read-only analysis)

These docs are correct at time of writing. Not expected to be updated.

| Doc | Purpose |
|---|---|
| `BUILD_INTELLIGENCE.md` | Pattern/gotcha database |
| `KPI_CATALOG.md` | 50+ KPI formula definitions |
| `MASTER.md` | Architecture + feature catalog |
| `docs/decomp/DECOMPOSITION_INTELLIGENCE_MASTER.md` | Extraction queue + coupling chains |
| `docs/governance/FEATURE_STABILITY_MATRIX.md` | Module stability ratings |
| `docs/governance/MODULE_DEPENDENCY_TIERS.md` | Load-order dependency graph |
| `docs/governance/MODULE_CRITICALITY_MATRIX.md` | Criticality tiers |
| `docs/governance/STARTUP_RUNTIME_ORDER.md` | Boot sequence phases |
| `docs/governance/RUNTIME_CRITICAL_PATHS.md` | Critical execution paths |
| `docs/governance/EXECUTION_LANE_OWNERSHIP.md` | Module ownership map |
| `docs/ops/DEGRADED_RUNTIME_SPEC.md` | Degraded mode behavior |
| `docs/ops/DEPLOYMENT_FORENSICS_GUIDE.md` | Forensic debugging playbook |
| `docs/ops/FAILURE_RECOVERY_PATHS.md` | Failure → recovery decision tree |
| `docs/ops/OPERATOR_DIAGNOSTICS_GUIDE.md` | 7 diagnostic playbooks |
| `docs/ops/RUNTIME_BOTTLENECK_MATRIX.md` | Bottleneck analysis |
| `docs/ops/RUNTIME_HEALTH_SCORECARD.md` | Health scoring model |
| `docs/ops/RUNTIME_OBSERVABILITY_V3.md` | Observability surface definitions |
| `docs/ops/RUNTIME_SEVERITY_MODEL.md` | HEALTHY/INFO/WARN/FAIL taxonomy |
| `docs/ops/RUNTIME_SURVIVABILITY_MODEL.md` | Survivability under partial failure |
| `docs/ops/STARTUP_PERFORMANCE_PROFILE.md` | Startup timing analysis |
| `docs/ops/EVENT_STORM_RISK_ANALYSIS.md` | Event storm risk |
| `docs/quote/QUOTE_EDGE_CASE_MATRIX.md` | Quote workflow edge cases |
| `docs/quote/QUOTE_RUNTIME_ARCHITECTURE.md` | Quote lifecycle + state |
| `docs/runtime/DEPLOYMENT_ROLLBACK_MODEL.md` | Rollback decision model |
| `docs/runtime/WORKER_RUNTIME_FORENSICS.md` | Worker diagnostic report |

---

## Tier 3 — ARCHIVE (historical / one-shot, not updated)

These exist for record. Don't update or reference them for current state.

| Doc | Why archived |
|---|---|
| `docs/archive/LUNCH_EXECUTION_REPORT.md` | One-shot session report (2026-05-12) |
| `docs/archive/PARALLEL_BRANCH_RECONCILIATION_PLAN.md` | Branch reconciliation complete |
| `docs/runtime/DEPLOYMENT_STATE_MODEL_V1.md` | Superseded by `SYSTEM_STATE.md` |

---

## Rules

1. A doc starts life as REFERENCE. It only becomes CANONICAL if it needs to track live state.
2. Archive docs are never deleted — only reclassified downward.
3. CANONICAL docs have an explicit `_Last updated:` header that must be kept current.
4. If two docs describe the same thing, collapse them — keep the more current one, archive the other.
