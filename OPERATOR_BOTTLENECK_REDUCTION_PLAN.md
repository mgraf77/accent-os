# OPERATOR BOTTLENECK REDUCTION PLAN
> **Status:** Draft — Session 4 orchestration design
> **Subject:** Michael Graf, sole human operator
> **Goal:** Identify every place Michael is currently in the loop, classify by removability, and propose the safest path to remove or batch the high-frequency ones.

---

## 1. CURRENT OPERATOR LOAD — INVENTORY

Observed touchpoints where Michael is in the loop today:

| # | Touchpoint | Frequency | Removability |
|---|---|---|---|
| 1 | Reading agent output, copy/pasting to next agent | Per task | **HIGH** (relay packets) |
| 2 | Approving every commit | Per commit | **MEDIUM** (corridor-based auto-merge) |
| 3 | Manually merging branches to main | Per branch | **MEDIUM** (Tier 1 auto-merge) |
| 4 | Resolving spec ambiguity | Per ambiguous task | **LOW** (irreducible — judgment) |
| 5 | Switching between agent UIs | Continuous | **HIGH** (control plane dashboard) |
| 6 | Tracking which agent is doing what | Continuous | **HIGH** (lane table) |
| 7 | Remembering what was decided last session | Per session start | **HIGH** (ADRs + CANON.md) |
| 8 | Deciding when work is "done enough" to ship | Per feature | **LOW** (irreducible — taste/risk) |
| 9 | Resolving merge conflicts | Per conflict | **MEDIUM** (additive-first reduces frequency) |
| 10 | Running deploys | Per deploy | **MEDIUM** (gated automation) |
| 11 | Reading CI/test output | Per failure | **HIGH** (auto-summarize, only surface root cause) |
| 12 | Authorizing dangerous ops (SQL drops, secret changes) | Rare | **NONE** (must stay manual) |
| 13 | Course-correcting drift | Per session | **MEDIUM** (drift detector + CANON.md) |
| 14 | Choosing which task to work on next | Per session | **MEDIUM** (priority queue in BUILD_PLAN) |

---

## 2. AUTOMATION OPPORTUNITIES — RANKED BY LEVERAGE

### Tier S (do first, highest leverage)

1. **Relay Packet Protocol (V1)** — eliminates touchpoint #1 entirely for routine handoffs. Estimated reduction: 60% of relay-time.
2. **Lane Table + Control Plane** — eliminates #5, #6, #14 via single-pane visibility.
3. **CANON.md + ADRs** — eliminates #7. Session start becomes deterministic.

### Tier A (do next)

4. **Corridor-based auto-merge (Tier 1)** — removes #2, #3 for low-risk corridors (`docs-only`, `js-additive`, `sql-additive`). Keeps the dangerous corridors manual.
5. **Drift detector** — removes #13. Surfaces drift instead of relying on Michael to spot it.
6. **CI summary bot** — for #11, agents do not show raw logs to Michael; they show: "test X fails because Y, suggested fix Z." Already partly true; formalize.

### Tier B (do later, after V1 proves out)

7. **Autonomous review loops** — Agent A's work is reviewed by Agent B (different vendor) before reaching Michael. Touchpoint #8 reduces to spot-check only.
8. **Gated deploy automation** — `docs-only` and `js-additive` deploys auto-promote to staging; Michael only approves staging → prod. Touchpoint #10 batches.

### Tier C (irreducible, design around them)

9. **Ambiguity resolution (#4)**, **taste/risk calls (#8)**, **dangerous ops (#12)** — these stay manual. Goal is to **batch and surface them cleanly**, not eliminate.

---

## 3. APPROVAL BATCHING

Today: each approval is a context switch. Goal: turn N small approvals into 1 batched review.

### 3.1 Daily approval window
A scheduled summary lands once or twice a day:
- All lanes completed since last window
- Auto-mergeable items (corridor + CI green)
- Items awaiting Michael
- Drift flags

Michael acts in one focused pass. No more midday interruptions for `docs-only` merges.

### 3.2 Approval grouping
Approvals batch by:
- Same corridor
- Same agent
- Same time window (e.g. last 4 hours)

Michael approves the batch with one decision unless he wants to drill in.

### 3.3 Veto, not approve
For low-risk corridors, flip the default: items auto-merge after a quiet window (e.g. 2 hours) unless Michael vetoes. Removes the "I have to remember to approve" load.

---

## 4. MERGE BATCHING

- Auto-mergeable lanes accumulate in a queue.
- The queue drains on a schedule (e.g. every 2 hours) or when its size hits a threshold.
- Each drain is one merge commit per lane (preserves revertibility) but one push event for Michael to glance at.
- Conflict-free lanes drain unattended; conflicting ones surface to Michael with the diff that conflicts.

---

## 5. EXECUTION DELEGATION

Today Michael drives the work selection. Move toward agent-pulled work:

1. `BUILD_PLAN_CLAUDE.md` already exists. Add machine-readable priority + dependency metadata to each `[ ]` item.
2. Idle agents query the plan, claim the next unblocked item that fits their corridor competence, write a relay packet, and start.
3. Michael's role shifts from "assign work" to "set priorities and constraints in the plan."

**Safety rails:**
- An agent can only claim items where `corridor ∈ agent_competence` AND `dependencies = met`.
- Items tagged `human_required: true` are never auto-claimed.
- Claims expire if no commit within N minutes.

---

## 6. AUTONOMOUS REVIEW LOOPS

Two-stage validation removes Michael from routine review:

```
Agent A: implements → commits → opens relay packet (intent: review)
Agent B (different vendor): reads diff + canon + relay → posts review_result
   If green AND corridor auto-mergeable → merge
   If red OR ambiguous → surfaces to Michael
```

Why different-vendor reviewer: reduces shared blind spots. A Codex review of Claude's code catches things Claude wouldn't have caught reviewing itself.

Initial scope: review packets only for `docs-only` and `js-additive`. Expand on trust.

---

## 7. THE MICHAEL-ONLY LIST (NEVER AUTOMATE)

These stay manual forever:
- Secrets, credentials, env var changes
- `wrangler.toml` / worker deploys to prod
- Destructive SQL on prod
- Anything touching billing, auth, customer PII
- Architectural pivots (require ADR + signoff)
- Cross-repo or cross-org changes
- Anything an agent flags as "unsure" via escalation packet

Automation around these is allowed (e.g. a control plane that shows them clearly). Execution is not.

---

## 8. ROLLOUT SEQUENCE

1. Land V1 protocol docs (this session). ✅
2. Build minimum lane table + relay packet writer (small scripts).
3. Run V1 manually for 2 weeks — measure relay-time reduction.
4. Add corridor-based auto-merge for `docs-only` only.
5. Add drift detector and CI summary.
6. Expand auto-merge to `js-additive`, `sql-additive` if trust holds.
7. Add autonomous review loops.
8. Build the Control Plane dashboard.

Each step is reversible. No big-bang. Trust accumulates.

---

## 9. SUCCESS METRICS

- **Relay-time per task** (target: −70%)
- **Approvals per day** (target: −60%, batched into 1–2 windows)
- **Context-switches per day** (proxy: dashboard view count vs ad-hoc agent UI visits)
- **Drift incidents per month** (target: down)
- **Time-to-resume after a session ends** (target: <2 min with CANON.md + WIP.md)
- **Escalation rate** (watch — too high means rules too tight, too low might mean unsafe autonomy)
