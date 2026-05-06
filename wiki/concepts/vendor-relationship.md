---
id: vendor-relationship
title: "Vendor Relationship Model"
type: concept
status: published
weight: 7
tags:
  - vendor
  - rep-group
  - co-op
  - relationship
  - onboarding
  - negotiate
  - partnership
  - sourcing
  - discount
  - terms
related:
  - sop-001-vendor-onboarding
  - adr-002-supabase-backend
  - supabase-source
created: 2026-05-06
updated: 2026-05-06
---

# Vendor Relationship Model

A vendor relationship in AccentOS captures the full commercial and operational connection between Accent Lighting and a manufacturer or distributor.

## Core dimensions

**Commercial terms** — discount tiers, payment terms (net-30, net-60), co-op marketing funds, MAP pricing agreements, and return/RMA policies. Stored in `vendors` and `vendor_overrides` tables.

**Rep group** — most vendors are sold through an independent manufacturer's rep. The `rep_group_id` field links a vendor to its `rep_groups` row. Reps facilitate ordering, resolve shipping disputes, and negotiate special pricing. Vendors without a rep group are managed direct.

**Scoring** — AccentOS scores each vendor across up to 10 dimensions (fill rate, defect rate, co-op value, price competitiveness, speed, etc.). The composite score drives Vendor Ranking order and Decision Engine recommendations.

**Lifecycle stages** — `prospect → active → at-risk → inactive`. Stage transitions log to `vendor_changelog` and trigger alerts.

## How it connects to other modules

| Module | Connection |
|---|---|
| Vendor Ranking | Primary view of all scored vendors |
| Decision Engine | Uses scores to weight brand recommendations |
| Co-op Funds | Tracks marketing fund balance and spend per vendor |
| Vendor Rep Portal | External portal for VendorRep users |
| Purchase Orders | POs link to vendor via `vendor_id` |
| Alerts | Flags at-risk vendors, co-op expiry, low fill rates |

## Negotiation flow

A typical vendor negotiation cycle:
1. Review current score and identify weak dimensions
2. Request improvement plan from rep (log in `vendor_changelog`)
3. Re-score after 60 days using updated metrics
4. Escalate to at-risk or extend to preferred tier based on outcome

## Common mistakes

- Assigning no rep group — use `rep-group-matchmaker` skill to find candidates
- Duplicate vendor rows (different SKU prefix) — merge before scoring
- Co-op funds untracked — always create a `coop_funds` row at onboarding with `balance_usd: 0`
