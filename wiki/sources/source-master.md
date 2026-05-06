---
type: source
slug: source-master
title: "Source: MASTER.md"
sources: []
related: [overview, ADR-001, ADR-002, ADR-003, vendor-scoring]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Source: MASTER.md

**File**: `MASTER.md` in repo root  
**Size**: ~700KB (15 sections, complete aggregate of all AccentOS knowledge)  
**Layer**: Layer 1 (never modified by /aos-ingest)

## What it contains

15 sections:
1. Quick Start
2. Project Overview
3. Current State (version, live table)
4. Business Context (Accent Lighting company details)
5. User / Role Model
6. Architecture
7. Tech Stack
8. Data Model
9. Module Inventory
10. Build Progress
11. Michael's Tasks (M-tasks, SQL migrations)
12. Locked Decisions (source for ADR-001 through ADR-006)
13. Open Loops
14. AccentOS Vision
15. Session Log

## Key facts extracted to wiki

- Company: Accent Lighting Inc., Wichita KS, commercial lighting distributor
- Version at last extract: v6.10.2 (will update in wiki after each session)
- Team: Michael Graf (Owner), Paul Graf (Admin), Patrick Graf (Admin)
- 3 seeded users in Supabase: Michael=Owner, Paul=Admin, Patrick=Admin
- All locked decisions from §12 → [[ADR-001]] through [[ADR-006]]
- 14-category vendor scoring rubric → [[vendor-scoring]]
- Tech stack: vanilla JS, Supabase, Cloudflare Pages, Anthropic API

## How to keep this page fresh

After each major AccentOS session, check if:
- Version number changed → update [[overview]]
- New locked decisions added to §12 → create ADR page
- New modules shipped → update [[overview]] live table
- Session log updated → no wiki action needed (§15 is Layer 1)

## Related

[[overview]] · [[ADR-001]] through [[ADR-007]]
