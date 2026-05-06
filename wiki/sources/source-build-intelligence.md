---
type: source
slug: source-build-intelligence
title: "Source: BUILD_INTELLIGENCE.md"
sources: []
related: [source-master, ADR-002, ADR-004]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Source: BUILD_INTELLIGENCE.md

**File**: `BUILD_INTELLIGENCE.md` in repo root  
**Layer**: Layer 1 (never modified by /aos-ingest)

## What it contains

Append-only log of lessons from each shipped AccentOS item. Format: `[item] | [gotcha] | [better approach]`. ~80 entries as of 2026-05-06.

## Key patterns extracted

**File editing**
- Edit ≤30 lines; awk/sed ≥100 lines (v6.10.12 file split lesson)
- After removing any global const/let: `grep -n "<NAME>" *.html *.js` and fix all references

**Module architecture**
- New module = write js/<name>.js + 4 shell touchpoints (sidebar, PAGE_META, dispatcher, hydrate)
- MODULE_REGISTRY refactor planned (4 touchpoints → 1 declarative entry)
- Compact-CRUD ships in 5–8 min once pattern internalized
- Pure-compute modules (no schema) ship in ~3 min

**Cross-module patterns**
- setTimeout(80ms) for navigate-then-open (goTo → detail render) — fragile, document it
- csvImportFlow() helper extracted at 4th implementation (threshold rule: extract on 4th, not 3rd)
- Inline edits: optimistic update + targeted DOM patch + revert on failure

**Supabase patterns**
- Always lead policy blocks with `DROP POLICY IF EXISTS`
- on_conflict for idempotent saves; delete+insert for line items
- Append-only for observations/metric snapshots (free time series)

**Operating rules**
- Prompt logging: first thing every session
- WIP checkpointing: after every discrete step
- Session resume: read WIP first, complete orphan task before next item
- Doc-only edits: batch into single end-of-session commit

## Wiki relevance

Lessons from BUILD_INTELLIGENCE inform wiki pages and ADRs. When a new pattern solidifies (e.g., csvImportFlow), create or update the relevant concept page. ADR pages cite specific lessons.

## Related

[[ADR-002]] · [[ADR-004]] · [[source-master]]
