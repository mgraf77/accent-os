# ACCENTOS DEVELOPMENT CONTROL PLANE
> **Status:** Conceptual design — Session 4 orchestration
> **Goal:** A single dashboard that turns AccentOS development itself into an observable, controllable system. Lanes, branches, agents, dependencies, queues — one pane.

---

## 1. WHY

Without a control plane:
- Michael context-switches between agent UIs to know who's doing what.
- Lane collisions are invisible until commit time.
- Drift accumulates silently.
- Approval load is felt as constant interruption.

With a control plane: the system becomes operable the way AccentOS itself is operable — dashboards, KPIs, queues, alerts.

This is a **read-mostly, action-secondary** dashboard. Most work happens in the repo. The dashboard surfaces state and routes attention.

---

## 2. PRIMARY VIEWS

### 2.1 Active Lanes view (default landing)

A live table built from `.orchestration/lanes.json`:

| Lane | Agent | Branch | Corridor | Files | Started | Status | Awaiting |
|---|---|---|---|---|---|---|---|
| LANE-orch-design | claude-code | claude/orch...fkUMQ | docs-only | 5 | 14:00Z | in_progress | — |
| LANE-cart-fix | codex | codex/cart-fix-aB1 | js-modify | 2 | 13:40Z | review | michael |
| LANE-ads-export | jules | jules/ads-export-9f | sql-additive | 1 | 12:00Z | completed | auto-merge in 38m |

Color coding:
- Green: in_progress, healthy
- Yellow: awaiting human, idle, or near expiry
- Red: escalated, conflict, expired
- Blue: completed, queued for merge

Click a lane → see its relay packet, commits, dependency chain, escalation history.

### 2.2 Dependency graph view

Render `.orchestration/lanes.json` + `depends_on` edges as a DAG.
Highlights:
- Critical path (longest dependency chain)
- Blocked lanes (waiting on a dependency)
- Cycle attempts (rejected, but logged)
- Lanes ready to start (no unmet deps)

### 2.3 Branch / runtime awareness

Two columns side by side:
- **Branch state** (from git): main, all `<agent>/**` branches, last commit, last push, divergence from main
- **Runtime state** (from production probes): worker version, frontend hash, Supabase migration head, KPI scheduler last-run

Mismatches highlight (e.g. `main` is ahead of deployed frontend → "deploy needed" pill).

### 2.4 Approval queue

Items waiting on Michael, grouped by:
- Auto-mergeable (just confirm)
- Corridor change requested
- Escalation (needs decision)
- Dangerous op (full review required)

One-click batch approve for the safe group. Drill-in for the others.

### 2.5 Telemetry

KPIs for the dev system (mirrors how AccentOS tracks business KPIs):
- Lanes completed per day
- Mean lane duration by corridor
- Escalation rate (with target band)
- Auto-merge success rate
- Operator context-switches (proxy: dashboard interactions)
- Time-to-clean-pause after session end
- Drift detector flags open vs resolved

Trendlines, not snapshots. Same pattern as `kpi-log.md`.

### 2.6 Decision log view

Browsable index of `.orchestration/decisions/ADR-*.md`. Filter by status (Proposed / Accepted / Superseded). Search by tag.

### 2.7 Drift / health view

Output of `scripts/drift-check.sh`:
- CANON.md hash mismatches
- Stale WIP files
- Orphaned branches
- Forbidden-edit violations attempted
- Module registry drift (`module_modes.json` vs `MODULE_MODES.md`)

---

## 3. DATA SOURCES

The control plane is **derived state**. It owns no truth.

| Source | Provides |
|---|---|
| `.orchestration/lanes.json` | active lanes |
| `.orchestration/relays/*.json` | packets + lifecycle log |
| `.orchestration/escalations/*` | open escalations |
| `.orchestration/decisions/*` | ADRs |
| `.orchestration/checkpoints/*` | crash recovery state |
| `git` | branch + commit state |
| Cloudflare Worker `/v1/version` | runtime worker state |
| Frontend probe | deployed hash |
| Supabase | migration head, scheduler state |
| `efficiency-log.md`, `kpi-log.md` | telemetry |
| `BUILD_PLAN_CLAUDE.md` | open work + priority |

If the dashboard is wrong, the repo is right. The dashboard is rebuildable from the repo at any time.

---

## 4. ACTIONS THE DASHBOARD CAN TAKE

Minimal, deliberate:
- Approve a queued auto-merge (writes a signed marker; merge bot acts)
- Veto a queued auto-merge (cancels the timer)
- Open an escalation with a decision (closes packet, writes ADR if needed)
- Re-run drift check
- Deregister a stale lane (with confirmation)
- Trigger a re-deploy for a corridor (gated by Michael-only list)

Notably absent: starting work, editing files, force-pushing, deleting branches. Those happen in the repo, by agents, under protocol.

---

## 5. IMPLEMENTATION SHAPE (NOT YET BUILT)

Smallest viable form: a static page that reads JSON from the repo + a small worker that proxies git/Cloudflare/Supabase queries.

```
[Browser] → [accentos-controlplane.workers.dev]
                ↓
         reads: github raw .orchestration/*
         reads: git branch list (via GitHub API)
         reads: anthropic-proxy /v1/version
         reads: Supabase health endpoint
                ↓
         renders: static SPA (single index.html, no framework)
```

Same architectural pattern as AccentOS itself — single `index.html`, worker proxy, additive modules. Eats its own dog food.

V0: read-only dashboard.
V1: approval actions wired in.
V2: dependency graph rendering.
V3: telemetry trendlines.

---

## 6. ALERTS / NOTIFICATIONS

Push to Michael only when:
- An escalation opens
- A lane has been awaiting Michael > 4 hours
- Drift detector finds a new flag
- A merge to main fails CI
- A lane expires unresolved
- A forbidden-edit attempt is logged

Everything else is pull (Michael opens the dashboard when he wants).

---

## 7. INTEGRATION WITH EXISTING SYSTEMS

- `efficiency-monitor` skill already aggregates session-end signals → feed its output to telemetry view.
- `vibe-speak` modes are independent; dashboard does not modify them.
- `BUILD_PLAN_CLAUDE.md` becomes the work-claim source for execution delegation (§5 of Bottleneck Reduction Plan).
- `SESSION_LOG.md`, `PROMPT_LOG.md` remain canonical; dashboard surfaces them, doesn't replace them.

---

## 8. WHAT THIS IS NOT

- Not a project management tool (no Kanban, no estimates, no burn-down).
- Not an IDE.
- Not a chat client for agents.
- Not the source of truth for anything — every byte it shows lives in the repo.
- Not optional once built — it should become the daily entry point for orchestration, replacing per-agent UI grazing.
