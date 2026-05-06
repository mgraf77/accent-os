---
id: emp-owner
title: Employee Entity — Owner Role
type: entity
status: published
weight: 6
tags: [owner, role, admin, AccentOS, access, permissions, management, KPI, goals, users, module-modes]
related: [emp-sales, emp-warehouse, sop-001-vendor-onboarding, adr-002-supabase-backend]
created: 2026-05-06
updated: 2026-05-06
---

# Employee Entity — Owner Role

## Role summary

Full system access. Responsible for business strategy, vendor relationships, financial oversight, and system configuration. The Owner role in AccentOS is the only role with access to all modules, all data, and all administrative functions.

## AccentOS access level

`role = 'Owner'`

All modules visible. No restrictions.

## Exclusive capabilities (Owner-only)

| capability | module | notes |
|---|---|---|
| Add/edit/delete users | Settings → Users | Assign roles, change passwords |
| Module Modes management | Mgmt → Modes | Set rollout state for each module; per-user overrides |
| KPI snapshot | Mgmt → KPIs | "Snapshot today" writes kpi_snapshots row |
| Goal / OKR management | Mgmt → Goals | Full tree; delete cascades |
| Vendor data admin | Vendor Ranking → Vendor Data | Only Owner + Admin can edit vendor records |
| Audit log | Settings → Audit Log | Full system audit trail |
| Reports export | Reports | Export all 19+ dataset CSVs |

## Key workflows

1. **Vendor strategy**: Score vendors, run Deal Optimizer (Vendor Ranking → Deal Optimizer), execute RENEGOTIATE / UPGRADE / CUT recommendations.
2. **Revenue oversight**: Mgmt → Overview shows YTD Won, pipeline forecast, co-op $ open, avg vendor score.
3. **KPI tracking**: Snapshot KPIs weekly. Review trends in Mgmt → KPIs.
4. **Team management**: Review employee scorecards (Mgmt → Employees), set goals.
5. **System health**: Module Modes tab gates feature rollout; System sub-tab shows DB + API status.

## Decision authority

- Vendor tier override (Auto → A/B/C manually)
- Deal loss acceptance
- Co-op fund commitment
- PO approval (Purchase Orders are Owner/Admin/Manager-gated)
- Module rollout state changes

## Typical daily flow

1. Open Dashboard → review Daily Brief (unverified scores, stale deals, co-op deadlines, reorder alerts).
2. Check Intelligent Alerts bell — action urgent items.
3. Review pipeline forecast — any deals needing owner attention?
4. Spot-check employee scorecard or vendor score if relevant.
