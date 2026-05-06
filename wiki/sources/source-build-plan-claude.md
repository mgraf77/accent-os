---
type: source
slug: source-build-plan-claude
title: "Source: BUILD_PLAN_CLAUDE.md"
sources: []
related: [source-master, overview, ADR-007]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Source: BUILD_PLAN_CLAUDE.md

**File**: `BUILD_PLAN_CLAUDE.md` in repo root  
**Layer**: Layer 1 (never modified by /aos-ingest)

## What it contains

Complete AccentOS build roadmap by track. Each item: `[ ]` (pending) or `[x]` (shipped). BLOCKS ON MICHAEL annotations for items requiring SQL migrations.

## Track summary

| Track | Topic |
|-------|-------|
| 0 | Foundation (auth, schema, base) |
| 1 | Core modules (daily brief, pipeline, CRM, quotes) |
| 2 | Vendor scoring + co-op |
| 3 | Management + employees |
| 4 | Advanced analytics |
| 5 | Operations modules (16 items — all shipped) |
| 6 | Intelligence + integrations |

## Track 6 key items

- 6.9: Demand Forecast (shipped v6.10.25)
- 6.10: Customer Mode in Ask the Engine (shipped v6.10.23)
- 6.11: Windward ERP live integration (pending M03/M10)
- 6.12: pgvector RAG (M42/M43 — optional)
- **6.13: AccentOS Wiki module** (this build — v6.11.1) ← currently building

## Wiki relevance

This page is not ingested directly. Its structure informs [[overview]]'s live table and ADR context. When items ship, update [[overview]] version and live table. New locked decisions → new ADR page.

## Related

[[source-master]] · [[overview]] · [[ADR-007]]
