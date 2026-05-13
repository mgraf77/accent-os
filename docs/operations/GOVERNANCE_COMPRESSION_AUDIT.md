# Governance Compression Audit - AccentOS

## 1. Document Classification

| Document | Classification | Role |
|---|---|---|
| `MASTER.md` | Canonical | Primary project reference. |
| `docs/architecture/*` | Reference | Deep-dive architectural mapping. |
| `BUILD_PLAN_CLAUDE.md` | Canonical | Current technical roadmap. |
| `BUILD_PLAN_MICHAEL.md`| Canonical | Owner-gated roadmap. |
| `SESSION_LOG.md` | Canonical | Historical session truth. |
| `docs/archive/*` | Archive | Historical reports (e.g., REMEDIATION_REPORT). |
| `docs/DOC_TRUTH_MAP.md` | Intelligence | Mapping of document overlaps. |

## 2. Duplication Findings

- **Hydration Logic:** Described in `STARTUP_INITIALIZATION_ORDER.md` and implicitly in `MODULE_DEPENDENCY_AUDIT.md`.
- **Global State:** Mapping exists in `GLOBAL_RUNTIME_REGISTRY.md` and `GLOBAL_RUNTIME_REGISTRY.md`.
- **Extraction Candidates:** Duplicated between `LOW_RISK_EXTRACTION_CANDIDATES.md` and `STAGED_DECOMPOSITION_SEQUENCE.md`.

## 3. Runtime Ownership Gaps

- **Initialization Ownership:** `index.html` owns the boot sequence, but modules lack a formal "registration" phase.
- **Probe Ownership:** The Anthropic Proxy probe logic is in the shell; it should ideally be owned by an `AppHealth` module.
- **Verification Ownership:** Runtime health checks are documented in prose (`RUNTIME_HEALTH_VERIFICATION.md`) rather than code.

## 4. Stale-Risk Identification

- **`AI_INTERACTION_MAP.md`**: High risk of drift as model IDs (`claude-sonnet-4-5`) or worker endpoints change.
- **`SHARED_STATE_MUTATION_MAP.md`**: Becomes stale the moment a module is refactored to use a setter API.
- **`VENDOR_RANKING_EXTRACTION_PLAN.md`**: Becomes stale once the module is extracted.

## 5. Governance Compression Recommendations

1. **Canonicalize the Registry:** Move all global state and ownership mapping into a single `GLOBAL_RUNTIME_REGISTRY.md`.
2. **Consolidate Extraction Plans:** Merge CANDIDATES and SEQUENCE into a single `MODULARIZATION_ROADMAP.md`.
3. **Automate Truth:** Replace prose-based verification steps with a `scripts/health-check.js` that can be run from the browser console.

## 6. Unresolved Risks
- **Race Conditions:** Hydration is parallel but non-deterministic for cross-dependent modules.
- **Global Mutation:** Direct modification of global arrays (`VD`, `CUSTOMERS`) lacks auditability beyond the UI layer.
- **Stale Documentation:** Architecture docs (`EVENT_PROPAGATION_GRAPH.md`) require manual updates after هر implementation change.

## 7. Next Analysis Runway
- **State Transition Audit:** Trace exactly how `VD_RAW` transitions to `VD` and identify optimization points for initial load.
- **Event-Driven Initialization:** Design a prototype for `document.dispatchEvent(new CustomEvent('aos:data-ready'))` to replace sequential hydration.
