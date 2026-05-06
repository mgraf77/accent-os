---
type: synthesis
slug: overview
title: AccentOS Wiki — System Overview
sources: [source-master, source-build-plan-claude]
related: [karpathy-llm-wiki, ADR-007]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# AccentOS Wiki — System Overview

AccentOS is the internal operating system for Accent Lighting Inc., a commercial lighting distributor in Wichita, KS. It runs as a single-page app (vanilla JS, Cloudflare Pages, Supabase backend) serving 5 roles: Owner, Admin, Manager, Sales, Warehouse.

## Core modules (live)

| Module | Key | Description |
|--------|-----|-------------|
| Dashboard | dashboard | Daily Brief + role-specific KPIs |
| Sales Pipeline | pipeline | Kanban deals + probability model |
| Customers | customers | CRM, RFM, lifecycle tracking |
| Quote Generator | quotes | Line-item quoting with AI summary |
| Job Tracker | jobs | Project work tracking |
| Purchase Orders | purchaseorders | Vendor POs + receipt flow |
| Trade Partners | tradepartners | Designers, contractors, architects |
| Warranty Tracker | warranty | Defective claims + vendor RMAs |
| Showroom Displays | showrooms | Display program tracking |
| Labels | labels | QR + barcode printing |
| Deliveries | deliveries | Schedule + routing |
| Decision Engine | decisionengine | Pure-compute recommendations |
| Competitive Pricing | competitive | Competitor price tracking |
| Demand Forecast | demandforecast | Velocity + reorder suggestions |
| Alerts | alerts | Auto-generated from data |
| My Tasks | mytasks | Personal to-do (localStorage) |
| Knowledge Engine | knowledge | AI Ask the Engine + Knowledge Hub |
| Vendor Ranking | vendors | 14-category scoring system |
| Change Log | changelog | Vendor change audit |
| Calendar | calendar | Company calendar + ICS export |
| Marketing Hub | marketing | Campaigns + assets |
| Activity Feed | activity | Audit log + pipeline events |
| Reports | reports | 19 CSV export types |
| Portal Preview | portalpreview | Trade + rep portal preview |
| Health Check | health | Schema + hydration diagnostics |
| Build Roadmap | roadmap | AccentOS build plan |
| Mgmt Dashboard | mgmt | Owner/Admin/Manager view |
| Rep Outreach | repoutreach | Rep communication log |
| Settings | settings | Supabase URL/key, API key |
| **Wiki** | **wiki** | **This module — Karpathy LLM Wiki** |

## Tech stack

- Frontend: vanilla JS, no framework, no build step
- Hosting: Cloudflare Pages
- Database: Supabase (PostgreSQL + RLS)
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- File structure: index.html (shell + inline JS) + js/*.js (module files)
- Auth: Supabase email/password, 5 roles, JWT

## Version history (recent)

| Version | Key change |
|---------|-----------|
| v6.10.65 | Customer→Deal preset + Module Modes bulk retag |
| v6.10.55 | vibe-speak v9 corpus learning |
| v6.11.1 | Wiki module (this build) |

## Related

- [[karpathy-llm-wiki]] — the pattern this wiki follows
- [[ADR-007]] — decision to adopt wiki-first RAG
- [[vendor-scoring]] — most-used wiki cluster
