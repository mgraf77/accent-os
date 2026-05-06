---
type: synthesis
title: AccentOS — High-level state synthesis
sources: [[sources/master]], [[sources/build-plan-claude]], [[sources/build-intelligence]]
related: [[decisions/ADR-007-karpathy-wiki-pivot]], [[karpathy-llm-wiki]]
filed_from_query: false
date: 2026-05-05
confidence: high
---

# AccentOS — High-level state synthesis

> Living top-of-wiki summary of where AccentOS is, where it's going, and what the wiki's job is in that journey.

## What AccentOS is

The agentic operating system being built for **Accent Lighting Inc.** — a 47-year-old commercial + residential lighting distributor in Wichita, KS (Paul Graf + Patrick Graf, founded 1979, [[entities/employees/michael-graf]] running BI + Operations).

It is **not** a CRM, **not** an ERP, **not** a website. It is the layer that sits above all of those and acts on the business's behalf. Six-level capability ladder ([[concepts/agentic-capability-ladder]]):

1. Passive data store (✅ done)
2. Reactive display (✅ done)
3. Proactive alerts (🔲 in progress — Track 6.8 shipped Alerts module v6.10.21)
4. Draft actions (🔲 next)
5. Predictive (🔲 Phase 3)
6. Autonomous execution (🔲 Phase 4 — EOY 2026)

Currently sits between Levels 2 and 3 — most modules **show** the right thing; only a few (Daily Brief, Alerts) **tell you** what to do about it. Almost none **draft** the action yet.

## Live state (as of v6.11.1, 2026-05-05)

- **Version:** v6.11.1 (~660KB total HTML + 38 external JS modules in `js/`, design system locked at light-only `#f4f4f2 / #ed1c24 / #1a1a1a / Outfit + DM Mono`)
- **Hosting:** Cloudflare Pages auto-deploy from GitHub main, ~15s deploy
- **Database:** Supabase Postgres (project `hsyjcrrazrzqngwkqsqa`) — see [[decisions/ADR-002-supabase-pgvector-mcp-broken]] for why all schema work is manual SQL Editor paste
- **Auth:** Supabase Auth, 5 roles (Owner, Admin, Manager, Sales, Warehouse), 3 users seeded
- **Vendor data:** 478 vendors, 14 scoring categories, 306 categories still flagged "Unverified"
- **Modules live:** 30+ — Vendor Ranking, Pipeline, Customers, Quotes, POs, Inventory, Trade Partners, Warranty, Marketing Hub, Calendar, Job Tracker, Knowledge Engine, Showroom Displays, Labels, Deliveries, Decision Engine, Demand Forecast, Alerts, Reports, Health, Module Modes, Saved Filters, Bulk Select, plus this skill's BUILD-RAG and (pending M42) Live-RAG
- **Phase 3 / Phase 4 work pending Michael unblocks:** M03 (Windward), M04 (BigCommerce), M05 (GMC), M06 (Google APIs), M09 (Klaviyo), M10 (Curtis outreach), M18 (website approval), M42 (RAG schema), M43 (RAG worker deploy), M30-M40 (smaller schemas)

## What the wiki's job is

Until v6.11.0, AccentOS knowledge was scattered across `MASTER.md` (source-of-truth doc), `BUILD_INTELLIGENCE.md` (gotchas log), `SESSION_LOG.md` (session history), `BUILD_PLAN_*.md` (queues), `skills/*/references/` (skill-specific knowledge), and `index.html` inline (vendor reference data, scoring rubrics). Useful, but **fragmented** — answering a question like "what's our IMAP enforcement posture for Visual Comfort" required reading 4–5 files and synthesizing on the fly, every time.

The wiki layer's job, per [[karpathy-llm-wiki]] and [[decisions/ADR-007-karpathy-wiki-pivot]], is to **pre-compile** that synthesis. Every concept gets a page. Every vendor gets a page. Every module gets a page. Every architecture decision gets a page. They cross-link via `[[wikilinks]]`. Claude Code maintains them via the slash commands defined in [[karpathy-llm-wiki]]. By the time a question comes in, the answer is usually already a paragraph on a page with explicit citations to its sources.

## Where the wiki sits in the bigger system

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AccentOS — three knowledge layers                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1 — Raw sources (immutable)                                      │
│    MASTER.md · BUILD_PLAN_*.md · BUILD_INTELLIGENCE.md ·                │
│    SESSION_LOG.md · PROMPT_LOG.md · js/*.js · sql/M*.sql ·              │
│    index.html · skills/*/SKILL.md · wiki/raw/*                          │
│                                                                         │
│  Layer 2 — The Wiki (LLM-maintained markdown)                           │
│    wiki/concepts/ · wiki/entities/ · wiki/modules/ ·                    │
│    wiki/sources/ · wiki/syntheses/ · wiki/decisions/                    │
│        ↑                                                                │
│        └─ Claude Code maintains this via /aos-* slash commands          │
│                                                                         │
│  Layer 3 — Schema (wiki/CLAUDE.md)                                      │
│    Page types · Frontmatter · Workflows · Naming · Safety               │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Search surfaces                                                        │
│    BUILD-RAG (BM25)        — Claude Code session-start retrieval        │
│    Wiki-grep (BUILD-RAG    — answer "what does the wiki say about X"    │
│      filtered to wiki/)                                                 │
│    Live-RAG (pgvector,     — only for fast-moving operational data      │
│      optional, M42+M43)      that the wiki can't compound around fast   │
│                              enough (live customer streams, GMC feeds)  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Long-term direction

When fully built (Phase 4, EOY 2026):
- Every employee opens AccentOS in the morning and gets a wiki-grounded daily brief: what's at risk, what's an opportunity, what's the next action — all citing wiki pages with confidence scores.
- The wiki becomes the **org's institutional memory**: when a new hire joins, they get pointed at `wiki/` and `[[overview]]` instead of being thrown into Notion / Google Drive sprawl.
- The wiki is queryable from the public website (filtered to customer-safe pages) — homeowners ask "what's the right size chandelier for an 8-foot dining ceiling" and get the [[lumen-output-commercial]] + [[fixture-sizing-residential]] synthesis.
- Vendor pages auto-update from VD_RAW + sales + score states. New vendor → 30-second `/aos-vendor` invocation produces a starter page; revisions accrue as terms evolve.
- `wiki/decisions/` becomes the canonical place every architecture question is answered. New ADRs filed automatically when Michael says "decision: we're going with X."
