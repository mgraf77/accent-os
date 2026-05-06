---
id: emp-sales
title: Employee Entity — Sales Role
type: entity
status: published
weight: 6
tags: [sales, role, employee, AccentOS, access, pipeline, quotes, customers, trade-partners, deals]
related: [emp-owner, emp-warehouse, sop-002-quote-to-close, indoor-decorative]
created: 2026-05-06
updated: 2026-05-06
---

# Employee Entity — Sales Role

## Role summary

Customer-facing revenue generation. Manages the full quote-to-close cycle, maintains customer relationships, and coordinates with trade partners (designers, architects, contractors). The Sales role has access to all customer-facing and revenue modules.

## AccentOS access level

`role = 'Sales'`

Full access to: Dashboard (Sales variant), Customers, Sales Pipeline, Quote Generator, Job Tracker, Trade Partners, Calendar, Knowledge Hub, Decision Engine, Competitive Pricing, Company Calendar, Reports.

Restricted from: Vendor Data admin, Employee Scorecards, Mgmt Dashboard (full), Purchase Orders (view-only), Module Modes.

## Key modules

| module | primary use |
|---|---|
| Sales Pipeline | Manage deals from lead → won/lost |
| Quote Generator | Build and track quotes (QT-####) |
| Customers | CRM — interactions, RFM, history |
| Trade Partners | Designer/contractor network |
| Decision Engine | Daily "what to work on" recommendations |
| Competitive Pricing | Monitor competitor prices on key SKUs |
| Knowledge Hub | Product specs, vendor playbooks, protocols |

## Key workflows

1. **New inquiry**: Create customer record → build quote → create pipeline deal.
2. **Daily prioritization**: Open Dashboard → Decision Engine recommendations (CHASE / FOLLOW-UP / AT-RISK / RETAIN / UPSELL).
3. **Follow-up**: Stale quotes surface in Intelligent Alerts after 21 days. Act before they hit the Stale Deals tile.
4. **Close**: Move deal to Won → Create Job → confirm PO with manager if ordering.
5. **Trade partner coordination**: Log partner referrals and preferred terms in Trade Partners module.

## Inline edit permissions

Sales role can inline-edit:
- Job status and priority (Job Tracker)
- Delivery status (Deliveries)
- Quote status (Quote Generator)

Cannot inline-edit:
- Vendor scores or tiers
- Inventory cost/list price (senior+ only)
- Employee scorecards

## Dashboard variant

Sales role sees a focused dashboard:
- My Deals: pipeline deals assigned to or created by the current user
- My Quotes: open quotes with age + status
- Daily Brief: role-filtered (no vendor scoring tiles)
