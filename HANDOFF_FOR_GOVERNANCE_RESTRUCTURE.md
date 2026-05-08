# Handoff for Governance Restructure
> Created: 2026-05-08 | AEOS Phase 1 completion

This document is for Michael and any incoming Claude session that begins the governance restructure. It covers everything that could cause confusion, conflict, or wasted work if not understood first.

---

## Systems Touched This Session

| System | What Changed | File(s) |
|--------|-------------|---------|
| AccentOS app | 3 new pages (AEOS Command Center, AI Router, Handoff Generator) | `js/aeos_command.js`, `index.html` |
| AccentOS app | Model ID fixed, error handling added | `index.html` |
| Organizational memory | 7 new seed files created | `memory/**` |
| Build infrastructure | No changes | — |
| Supabase schema | No changes | — |
| Cloudflare Worker | No changes | — |

---

## Dependencies and Assumptions

### `js/aeos_command.js` assumes:
- `goTo(page)` function exists in global scope (it does, in `index.html`)
- `toast(msg, type)` function exists in global scope (it does)
- `$('id')` helper exists (it does — `document.getElementById` shorthand)
- `supabase` client is available globally (it is)
- `window.CURRENT_USER` is set on login (it is)
- localStorage is available (always true in browser)

### Memory system assumes:
- Human editors will maintain files manually until RAG indexing is built
- `DECISIONS_LOG.md` is append-only — never edit existing entries
- Memory files are consulted at session start, not mid-session (no hot-reload)

---

## What Belongs Where (Boundary Questions)

These are unresolved as of this session. Michael needs to decide before Phase 2.

### AccentOS (this repo)
**Belongs here:** Everything that IS the line-of-business app — quotes, vendors, POs, deliveries, warranties, jobs, employees, inventory. Also AEOS pages that are part of the app UI.

**Question:** Does AEOS Command Center belong in AccentOS or in a separate "Command Center" app? Current placement (in AccentOS) makes sense for Phase 1 since the KPIs come from AccentOS Supabase tables. If AEOS eventually spans multiple data sources, a separate app would be cleaner.

### AgentOS (concept, not yet built)
**Would belong here:** Autonomous agent orchestration, multi-agent pipelines, agent memory, tool registries, execution logs. Currently the AEOS handoff spec references this as a future concept. Nothing in AccentOS implements it.

**Question:** Is AgentOS a separate codebase? A Supabase schema? A Cloudflare Worker? A separate Vercel/Next.js app? Needs architecture decision before Phase 2 agent features are built.

### Skills Repo (concept — `skills/` directory exists in AccentOS)
**Current state:** `skills/` directory lives inside AccentOS and contains Claude Code session skills (vibe-speak, efficiency-monitor, etc.). These are developer tools, not end-user features.

**Question:** Should `skills/` stay in AccentOS or move to a separate repo? It has no coupling to AccentOS business logic. Moving it out would clean up the repo boundary but requires updating CLAUDE.md paths.

### Command Center (concept)
**Would belong here:** Cross-system dashboard that aggregates data from AccentOS, ecommerce, marketing, etc. Currently the AEOS Command Center is just an AccentOS page. If/when it expands beyond AccentOS data, it should be its own app.

---

## Coupling Zones (Things That Will Break If You Refactor Wrong)

### 1. `index.html` ↔ every JS module
The app is a single HTML shell. Every module depends on globals set in `index.html`: `goTo()`, `toast()`, `$()`, `supabase`, `window.CURRENT_USER`, `window.CURRENT_ROLE`. If you split modules into separate files or move to a framework, all of these need explicit imports.

### 2. `goTo(page)` dispatcher
The dispatcher in `index.html` is the only routing mechanism. Every `onclick="goTo('pageName')"` in every module is coupled to this dispatcher. Adding a new page requires editing `index.html` in 3 places (PAGE_META, sidebar, goTo cases). This is intentional but creates merge conflicts when multiple modules are built in parallel.

### 3. Supabase client initialization
`supabase` is initialized once in `index.html` and used as a global in all module files. No dependency injection. Swapping Supabase client version or configuration requires updating `index.html` only, but all modules will break if the client global is renamed.

### 4. Role-based rendering
`window.CURRENT_ROLE` is set on login and used in `data-roles` attributes on sidebar items. All role checks are done inline in HTML or via JS conditionals reading `window.CURRENT_ROLE`. There's no centralized RBAC layer — it's scattered. Adding a new role requires auditing every `data-roles` attribute.

### 5. `memory/` ↔ Claude session startup
CLAUDE.md instructs Claude to read memory files at session start. If memory files are moved or renamed, CLAUDE.md must be updated. If memory files are split across repos, the session startup chain breaks.

---

## Incomplete Abstractions

### AEOS Command Center KPIs
The KPI strip in `aeoscommand()` renders hardcoded placeholder values. The intended design is to query Supabase for real data (open quotes count, revenue MTD, etc.). The Supabase query structure is NOT implemented — it was deferred to Phase 2 to avoid blocking the Phase 1 ship. The function has comment markers where queries should go.

### AEOS "What Needs Attention" Tiles
Currently renders 3 static placeholder tiles. The intended design is a live alert engine that checks for: stale quotes (>7d, >$500), upcoming co-op deadlines, pending PO receipts, warranty claims in flight. None of this query logic exists yet.

### AI Router Routing Logic
The routing engine in `_computeRoute()` uses simple keyword matching (if description includes "quote", "vendor", "delivery" etc.). It is NOT using AI inference. The intent for Phase 2 is to send the task description to Claude and get a structured routing recommendation back. The current implementation is a useful Phase 1 heuristic that works without API calls.

### Memory System RAG
`/memory/` files are human-readable markdown. They are NOT indexed, embedded, or queryable by AI. The intent is to build a RAG retrieval layer (Supabase pgvector + embeddings) in Phase 2. Currently, Claude reads them manually at session start.

---

## Duplicate Systems

### Portal Preview vs. Portals
- `js/portal_preview.js` implements Trade Partner + Vendor Rep portal **previews** (phase 1 of BUILD_PLAN 6.5/6.6)
- BUILD_PLAN 6.5/6.6 calls for full external-facing portals
- These are NOT duplicates — preview is the internal preview, the portal is the external-facing product
- Do NOT rebuild or replace `portal_preview.js` when building 6.5/6.6 — extend it or replace it intentionally

### AEOS Handoff Generator vs. Manual Handoffs
- The Handoff Generator creates structured build packets (markdown-formatted)
- These overlap in purpose with `WORK_IN_PROGRESS.md` and manual handoff docs
- They serve different audiences: Handoff Generator outputs are for AI agents; WORK_IN_PROGRESS.md is for Claude session continuity
- Not a conflict — both should coexist

---

## Cleanup Opportunities (Not Urgent)

1. **Stabilization docs** (SESSION_SUMMARY.md, CURRENT_STATE.md, NEXT_STEPS.md, KNOWN_ISSUES.md, HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md) — these are one-time governance artifacts, not permanent fixtures. After the restructure decision is made, most of these can be deleted or archived.

2. **ACCENTOS_AEOS_COMMAND_CENTER_MASTER_HANDOFF.md** — the original master handoff spec. After AEOS Phase 1 is fully merged and Phase 2 is planned, this file can be archived. It shouldn't live in the root forever.

3. **`memory/` seed files** — the vendor and operations files were seeded with general knowledge. They need domain review from Michael to confirm accuracy before being used as authoritative sources.

4. **BUILD_PLAN_CLAUDE.md checkbox sync** — `[x]` items need to be checked against what's actually on `main`. Items built on feature branches don't count as shipped until merged.

---

## Governance Questions for Michael

Before any Phase 2 work begins, these need answers:

1. **Merge strategy:** Does `claude/accentos-master-handoff-Xd0fY` merge to `main` as-is, or does it need review first?

2. **AEOS placement:** Does AEOS Command Center stay in AccentOS, or does it eventually become its own app?

3. **AgentOS timing:** Is AgentOS a Phase 3 concept, or is it being built in parallel now?

4. **Skills repo boundary:** Does `skills/` stay in AccentOS, or does it move to a standalone repo?

5. **Memory file ownership:** Who is responsible for keeping memory files updated? Claude? Michael? Both?

6. **AEOS Phase 2 sequencing:** Do AEOS Phase 2 modules (Fixture Finder, Quote Intelligence) take priority over BUILD_PLAN 6.5/6.6 (Trade Portal, Vendor Rep Portal)?

7. **Supabase MCP:** Is fixing MCP auth a priority, or is "Michael runs SQL manually" the permanent SOP?
