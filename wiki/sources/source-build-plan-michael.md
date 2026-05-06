---
type: source
slug: source-build-plan-michael
title: "Source: BUILD_PLAN_MICHAEL.md"
sources: []
related: [source-master, source-build-plan-claude, ADR-001]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Source: BUILD_PLAN_MICHAEL.md

**File**: `BUILD_PLAN_MICHAEL.md` in repo root  
**Layer**: Layer 1 (never modified by /aos-ingest)

## What it contains

All SQL migration tasks (M## items) that require Michael to run SQL in Supabase dashboard. Each item has a status and the SQL file path.

## Key M-tasks (reference)

| M-task | Table(s) | Status |
|--------|---------|--------|
| M01 | core schema | done |
| M02 | alerts | done |
| M21 | articles, job_items, calendar_events | done |
| M22 | inventory_items | done |
| M24 | trade_partners | done |
| M25 | warranties | done |
| M26 | showroom_displays | done |
| M27 | delivery_runs | done |
| M03/M10 | Windward integration | pending |
| M42 | pgvector extension | optional |
| M43 | embeddings table | optional |

## Confidence note

`confidence: medium` — this page summarizes at time of last extract. M-task statuses change as Michael runs SQL. Do not rely on specific task status without re-checking BUILD_PLAN_MICHAEL.md directly.

## Related

[[source-master]] · [[ADR-001]] · [[source-build-plan-claude]]
