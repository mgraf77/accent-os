---
name: bottleneck-finder
description: >
  Read AccentOS planning state at /home/user/accent-os/ (BUILD_PLAN_CLAUDE.md,
  BUILD_PLAN_MICHAEL.md, WORK_IN_PROGRESS.md, PROMPT_QUEUE.md) and identify
  the single track or M-task whose completion would unblock the most
  downstream work. Applies Theory of Constraints: identify the constraint,
  surface 2 ways to exploit before investing in elevation, and rank
  candidates by unblock-count × cascading leverage. Use this skill when
  Michael says: "what's the bottleneck", "what should I work on next",
  "what unblocks the most", "TOC analysis", "find the constraint", "where's
  the build stuck", "leverage analysis", or any phrasing that asks for
  build-prioritization advice on the AccentOS autonomous build. Do not use
  for vendor scoring prioritization (that's vendor-cascade) or code-level
  performance bottlenecks (different concern). Always produces a named
  constraint + leverage rank table + exploit options — never returns
  prose-only, never returns "wait for Michael" as the sole output.
---

# bottleneck-finder

**Purpose:** Applies Theory of Constraints to AccentOS's open BUILD_PLAN_CLAUDE.md tracks and BUILD_PLAN_MICHAEL.md M-tasks — computing which single item's completion cascades the most downstream unblocks, ranking by leverage score, and proposing exploit options before elevation. "Build the lowest [ ]" is not a strategy; leverage-ranked constraint analysis is. Always names the constraint with a leverage score before proposing exploits — never returns "wait for Michael" as the sole output.

---

## Trigger Recognition

Run when Michael says:
- "what's the bottleneck" / "find the constraint"
- "what should I work on next"
- "what unblocks the most downstream work"
- "TOC analysis"
- "where's the build stuck" / "why isn't the build moving"
- "leverage analysis"
- "which M-task is blocking everything"

---

## Step 1 — Load the build state

Read in parallel:
- `/home/user/accent-os/BUILD_PLAN_CLAUDE.md` — open tracks (`- [ ]`)
- `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — open M-tasks (`- [ ] **M[NN]**`)
- `/home/user/accent-os/WORK_IN_PROGRESS.md` — current step + next-if-interrupted
- `/home/user/accent-os/PROMPT_QUEUE.md` — queued items (if missing, treat as empty queue; continue)
- `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` — capability gaps (if missing, skip; log "project-profiles.md not found — capability gap data unavailable")

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
Open tracks: 12   Open M-tasks: 8   WIP: "building Track 5.7 — vendor cascade"
Cycle warnings: none  (or: "cycle_warning: M04 ↔ 6.3 — leverage computed from partial graph")

═══ BLOCK 2: TOP 5 CONSTRAINTS BY LEVERAGE ═══
| Rank | Task | Direct unblocks | Cascading leverage | Type |
|---|---|---|---|---|
| 1 | M04 (BC API credentials) | 6.3 + bc-product-sync-audit | 5 | external |
| 2 | M05 (GMC service account) | 6.1 + gmc-feed-audit live | 4 | external |
| 3 | M11 (Supabase MCP perms) | 0.3 auth + audit_log | 3 | external |

═══ BLOCK 3: PRIMARY CONSTRAINT — EXPLOIT BEFORE ELEVATE ═══
(Step 5 full exploit-before-elevate block for the rank-1 item — see Step 5 for exact format)

═══ BLOCK 4: NEXT-SESSION RECOMMENDATION ═══
- If M-tasks (external) dominate the top 5: Michael focus, Claude pick
  highest-leverage internal task in parallel
- If internal tasks dominate: Claude work autonomously on rank-1
- If WIP shows mid-task interruption: finish that first; re-run
  bottleneck-finder after
```

---

## Anti-patterns

- **Never** suggest "elevate" before exhausting "exploit." TOC core principle — exploit the constraint with existing resources first. Recommending "get the BC API credentials" (elevation) before checking if bc-business-review can run against Supabase deals only (exploit) skips the exploit step.
- **Never** treat low-leverage leaf tasks as valid build targets when high-leverage constrained tasks exist. Building a doc-drift fix while M04 blocks 5 downstream tracks wastes the session on a leaf when leverage score of M04 = 5× higher.
- **Never** propose a constraint without naming at least one exploit option. When no genuine exploit exists, output `elevation_only: true` and name the required external action explicitly.
- **Never** rank by [ ] count alone — leverage (cascading unblock depth) matters more than raw blocker count. A task with 1 direct unblock that cascades to 4 more outranks a task with 3 direct unblocks and no cascades.
- **Never** ignore /home/user/accent-os/PROMPT_QUEUE.md — Michael-queued items are direct signal about what he considers the constraint.
- **Never** fabricate exploit options to fill the format. A weak exploit ("ask the vendor for their CSV again") stated as a real option poisons the analysis.
- **Never** run leverage computation without cycle detection. Log cycle_warning entries before truncating DFS — hidden cycles produce infinite leverage scores.
