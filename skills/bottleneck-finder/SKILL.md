---
name: bottleneck-finder
description: >
  Read AccentOS planning state (BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md,
  WORK_IN_PROGRESS.md, PROMPT_QUEUE.md) and identify the single track or
  M-task whose completion would unblock the most downstream work.
  Applies Theory of Constraints: identify the constraint, surface 2 ways
  to exploit before investing in elevation, and rank candidates by
  unblock-count × leverage. Use this skill when Michael says: "what's
  the bottleneck", "what should I work on next", "what unblocks the
  most", "TOC analysis", "find the constraint", "where's the build
  stuck", or any phrasing that asks for build-prioritization advice
  on the autonomous AccentOS work. Do not use for vendor scoring
  prioritization (that's vendor-cascade) or for code-level performance
  bottlenecks (different concern). Always produces a named bottleneck +
  exploit options + rank table — never returns prose-only.
  Always names the constraint before proposing exploits — never
  returns "wait for Michael" as the only option.
---

# bottleneck-finder

**Purpose:** AccentOS has 22 pending M-tasks and 10 open tracks. "Build the lowest [ ]" is not a strategy. This skill applies Theory of Constraints to identify which single thing, if unblocked, opens the most downstream work — and proposes how to exploit the constraint before investing in elevation.

Origin: Factory-Floor TOC (identify, exploit, subordinate, elevate, repeat).

---

## Trigger Recognition

Run when Michael says:
- "what's the bottleneck" / "find the constraint"
- "what should I work on next"
- "what unblocks the most"
- "TOC analysis"
- "where's the build stuck"

---

## Step 1 — Load the build state

Read in parallel:
- `/home/user/accent-os/BUILD_PLAN_CLAUDE.md` — open tracks (`- [ ]`)
- `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — open M-tasks (`- [ ] **M[NN]**`)
- `/home/user/accent-os/WORK_IN_PROGRESS.md` — current step + next-if-interrupted
- `/home/user/accent-os/PROMPT_QUEUE.md` — queued items
- `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` — capability gaps

Output a one-line state summary: open tracks count, open M-tasks count, WIP status.

---

## Step 2 — Build the dependency graph

For each open track and M-task, identify dependencies. Sources of dependency info:
- Explicit "depends on M[NN]" mentions in BUILD_PLAN_CLAUDE
- Track numbers (e.g. 6.3 BC REST integration depends on M04 BC credentials)
- "(blocked on ...)" annotations
- API credential dependencies (M04, M05, M06, M09, M10) typically block downstream tracks
- Schema dependencies (M24–M29) block tracks that need those tables

Output an adjacency list — `[blocker] → [unblocked task1, task2, ...]`.

If a task has no detectable blockers AND nothing depends on it, mark as **leaf** (low leverage).

---

## Step 3 — Compute unblock-count per blocker

For each task that blocks ≥1 downstream task:

```
unblock_count = N        # direct count of tasks blocked
leverage     = N + sum(downstream_unblock_count for each unblocked task)
```

Leverage measures the cascading unblock effect — unblocking M04 doesn't just close M04, it opens 6.3 BC REST, which may open further work.

**Cycle detection.** Compute leverage via DFS with a `visited` set. If a node is encountered twice in the same path, log a `cycle_warning: [task-A] ↔ [task-B]` and stop recursion at that node — its leverage is computed from the partial graph only. Output cycle warnings in BLOCK 1.

---

## Step 4 — Rank candidates

Sort by leverage descending. Top 5 candidates form the constraint set.

| Rank | Task | Direct unblocks | Cascading leverage | Type |
|---|---|---|---|---|
| 1 | M04 (BC API credentials) | 6.3 + bc-product-sync-audit | 5 (incl. KPI-related) | external |
| 2 | M05 (GMC service account) | 6.1 + gmc-feed-audit live mode | 4 | external |
| 3 | M11 (Supabase MCP perms) | 0.3 auth + audit_log | 3 | external |
| ... | ... | ... | ... | ... |

Type values:
- **external** — blocked on Michael getting a credential / approval / vendor info
- **internal** — Claude can build it autonomously
- **mixed** — partial Claude work + Michael action required

---

## Step 5 — Identify the constraint and propose exploits

The **constraint** is the highest-leverage task in the rank — usually external, since those can't be auto-resolved.

**Theory of Constraints "exploit before elevate" rule:** before investing in unblocking the constraint, ask: can existing slack in the system substitute for what the constraint would unblock?

For each top-3 constraint, propose 2 exploits. **If no exploit genuinely exists** (e.g. the constraint is purely external — "Vendor X must send the file"), output `elevation_only: true` and acknowledge: "No internal exploit found; this requires direct elevation (the named external action)." Don't fabricate weak exploits to look like options.

```
CONSTRAINT: M04 (BigCommerce API credentials)
  Direct unblocks: 6.3 BC REST integration
  Cascading: bc-product-sync-audit, bc-business-review (full mode), Klaviyo segment refresh
  
  Exploit option A — partial-mode skills:
    Run bc-business-review against Supabase deals only (skips BC product enrichment).
    Run bc-product-sync-audit deferred until M04 lands.
    This delivers ~60% of the value without M04.
  
  Exploit option B — manual BC export:
    Eugene exports BC products to CSV weekly; Claude reads CSV instead of API.
    Slower iteration but keeps the work moving.
  
  Elevate option: Get M04 credentials this week. Cost: ~30 min Michael time.
```

---

## Step 6 — Output

```
═══ BLOCK 1: BUILD STATE ═══
Open tracks: [N]   Open M-tasks: [N]   WIP: [from WORK_IN_PROGRESS]

═══ BLOCK 2: TOP 5 CONSTRAINTS BY LEVERAGE ═══
[Step 4 table]

═══ BLOCK 3: PRIMARY CONSTRAINT — EXPLOIT BEFORE ELEVATE ═══
[Step 5 block for the rank-1 constraint]

═══ BLOCK 4: NEXT-SESSION RECOMMENDATION ═══
- If M-tasks (external) dominate the top 5: Michael focus, Claude pick
  highest-leverage internal task in parallel
- If internal tasks dominate: Claude work autonomously on rank-1
- If WIP shows mid-task interruption: finish that first; re-run
  bottleneck-finder after
```

---

## Anti-patterns

- **Never** suggest "elevate" before exhausting "exploit." TOC core principle.
- **Never** treat low-leverage tasks (leaves) as valid build targets when high-leverage ones exist.
- **Never** propose a constraint without naming exploit options. "Wait for Michael" is not an exploit.
- **Never** rank by [ ] count alone — leverage matters more than raw blocker count.
- **Never** ignore PROMPT_QUEUE.md — Michael-queued items are signal about what he thinks is the constraint.
