# OBSOLETE_BRANCH_REGISTRY

Catalog of remote branches that should be regarded as **superseded** by the
canonical Wave 1A runtime baseline (`main@d4966c7`) or by later work.

This is **advisory** — branches are not deleted by this session. Future
sessions may delete after a 2-session quiet period with no human override.

**Total remote branches at audit time:** 118
**Branches merged into main:** 12
**Branches not merged into main:** 106 (audit subset below)

## Status legend

- **OBSOLETE** — work superseded by main; safe to archive/delete.
- **SUPERSEDED-PENDING-SALVAGE** — superseded but contains content worth
  cherry-picking (docs, scripts, tests).
- **ACTIVE-RECONCILE** — under active sidecar reconciliation
  (see `SIDECAR_RECONCILIATION_REPORT.md`).
- **HISTORICAL** — planning/audit branches. Keep until next quarterly
  cleanup.
- **UNREVIEWED** — out of scope for this session.

## Runtime / signals lineage

| Branch | Status | Notes |
|---|---|---|
| `claude/wire-minimal-runtime-tgo0c` | OBSOLETE | Became `signals_runtime.js`, `signals_producers.js`, `signals_panel.js` in main (51a847e). |
| `claude/minimal-signal-runtime-ZEwod` | OBSOLETE | Same lineage. Predecessor of the canonical runtime. |
| `claude/agentOS-runtime-v1-XTQrv` | OBSOLETE | Speculative orchestration design, not the canonical runtime. |
| `claude/consolidate-signal-system-Z5Xhb` | SUPERSEDED-PENDING-SALVAGE | Consolidation analysis preceded the canonical merge; check for unported docs. |
| `claude/runtime-reality-reconciliation` | OBSOLETE | Reconciliation is now done in main + this session's reports. |
| `claude/runtime-stabilization-layer-Tneyd` | SUPERSEDED-PENDING-SALVAGE | Possible doc salvage. |
| `claude/runtime-boundary-enforcement-XcoKi` | SUPERSEDED-PENDING-SALVAGE | Overlaps with Sidecar #3 (`emitter-ownership-visibility`). Prefer Sidecar #3 lineage. |
| `claude/verify-runtime-state-D8JQV` | SUPERSEDED-PENDING-SALVAGE | May contain verifier scripts worth porting. |
| `claude/operational-signal-framework-UGMDn` | SUPERSEDED-PENDING-SALVAGE | Predates canonical runtime. |
| `claude/mvhb-queue-runtime-UG9pN` | OBSOLETE | Queue path is now `signal_queue` + `sig_*` RPCs in main. |
| `claude/extract-orchestration-intelligence-BhxXb` | UNREVIEWED | Out of scope for runtime; review separately. |
| `claude/orchestration-layer-design-fkUMQ` | UNREVIEWED | Speculative; see global FORBIDDEN list. |
| `claude/orchestration-maturity-analysis-qdJ5W` | HISTORICAL | Analysis doc; keep. |
| `integration/wave1a-runtime-governance` | OBSOLETE | Wave 1A is now in main. |
| `integration/reconcile`, `integration/reconcile-v2` | OBSOLETE | Already merged into main per `git branch -r --merged`. Safe to delete. |

## Sidecars in active reconciliation

| Branch | Status | Disposition |
|---|---|---|
| `claude/harden-signal-dedupe-CsO6N` | ACTIVE-RECONCILE | Re-author against canonical runtime. |
| `claude/harden-runtime-escalation-eYOqF` | ACTIVE-RECONCILE | Re-author as handler decorator. |
| `claude/emitter-ownership-visibility-QfOTG` | ACTIVE-RECONCILE | Cherry-pick after small target patches. |

## Reconciliation / merge planning

| Branch | Status | Notes |
|---|---|---|
| `claude/master-reconciliation-deployment-snnrz` | OBSOLETE | Merged via PRs #18/#19/#20. |
| `claude/merge-readiness-audit-arDW5` | HISTORICAL | Audit doc. |
| `claude/merge-wave-preparation-FuKpj` | HISTORICAL | Wave 1A planning. |
| `claude/session-35-merge-report` | HISTORICAL | Session 35 deliverable. |
| `claude/accentos-master-handoff-Xd0fY` | HISTORICAL | Handoff doc. |

## Other historical / out-of-scope (no action)

- All `forge-*`, `cohort*`, `ux-*`, `vendor-command-center-*`,
  `executive-surface-*`, `ecommerce-intel-*`, `klaviyo-*`,
  `audit-discovery-*`, `operational-queue-ux-*`,
  `operator-validation-suite-*`, `ox-signal-audit-*`,
  `phase1-execution-playbooks-*`, `accentos-*-planning-*` branches:
  out of scope for runtime reconciliation. Catalog separately when next
  reviewed.

## Recommended cleanup policy

1. Branches marked **OBSOLETE** with a tip commit older than 30 days and
   no open PR may be deleted.
2. Branches marked **SUPERSEDED-PENDING-SALVAGE** require a quick scan
   pass; once salvaged, transition to OBSOLETE.
3. Branches marked **ACTIVE-RECONCILE** must transition within 2
   sessions or escalate.
4. Never delete `main`, `accent-work`, or any branch with an open PR.
5. All deletions require either Michael's explicit ack OR a 2-session
   quiet period from this registry's publication.
