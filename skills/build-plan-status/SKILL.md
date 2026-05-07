---
name: build-plan-status
description: >
  Auto-sync /home/user/accent-os/BUILD_PLAN_CLAUDE.md and
  BUILD_PLAN_MICHAEL.md [x]/[ ] markers from recent git commit messages
  and SESSION_LOG.md entries for the AccentOS project. Catches the
  recurring drift between "what shipped to AccentOS" and "what's marked
  shipped in the plan." Outputs paste-ready Edit commands targeting exact
  file lines; never auto-applies. Use this skill when Michael says:
  "sync the build plan", "update the plan markers", "what's actually
  shipped", "build plan status", "update [x]/[ ] from git", "audit
  the build plan", or any phrasing that asks to reconcile planning
  doc state against shipped reality. Do not use for cross-doc drift
  (use doc-drift) or for vendor scoring drift (use vendor-clarity-test).
  Always produces a paste-ready Edit command list with exact commit SHAs
  and source file lines — never returns prose-only, never invents
  evidence, never marks [x] from LOW-confidence signals.
---

# build-plan-status

**Purpose:** During autonomous AccentOS builds, modules ship and commits land but BUILD_PLAN_CLAUDE markers don't always update — especially when Michael completes M-tasks outside the Claude session. This skill closes the gap between git history and plan state, producing paste-ready Edit commands so every stale `[ ]` marker gets corrected to `[x]` in one pass.

---

## Trigger Recognition

Run when Michael says:
- "sync the build plan" / "update the plan markers"
- "what's actually shipped"
- "build plan status" / "audit the build plan"
- "update [x]/[ ] from git"
- "reconcile the plan" / "plan drift"

---

## Step 1 — Pull recent shipped signals

Read three sources:

1. **Recent git commits** (since the last BUILD_PLAN_CLAUDE update):
   ```bash
   git log --since="$(stat -c %y BUILD_PLAN_CLAUDE.md | cut -d' ' -f1)" --pretty='%h %s%n%b%n---END---' main
   ```
   The `%n%b` includes the commit body (multi-line). Parse both subject AND body for "feat:", "ship:", "vNN.NN.NN" version markers, "Track N.N", "M[NN]" mentions. Bodies often contain the most explicit "shipped X" / "ran clean" language.

2. **SESSION_LOG.md tail** (last ~200 lines):
   Search for "shipped", "v6.10.NN", "M[NN] confirmed", track numbers, "ran clean".

3. **WORK_IN_PROGRESS.md current+next:**
   The "Step:" line often names the most-recently-shipped module + next-target.

---

## Step 2 — Build the shipped-evidence inventory

For each track or M-task identifier surfaced in Step 1, build a row:

| Identifier | Type | Evidence source | Evidence line | Confidence |
|---|---|---|---|---|
| 5.5 Trade Partners | track | commit cd8cf3f | "5.5 Trade Partners shipped v6.10.13" | HIGH |
| M21 | M-task | SESSION_LOG | "M21/M22/M23 ran clean in Supabase" | HIGH |
| 6.9 Demand Forecast | track | WIP | "v6.10.25 (6.9 Demand Forecasting)" | HIGH |

Confidence:
- **HIGH** — explicit "shipped X" or "ran clean" plus version marker
- **MEDIUM** — track number mentioned in a commit subject without explicit ship language
- **LOW** — track mentioned in passing in body text only

---

## Step 3 — Compare to current plan state

Read BUILD_PLAN_CLAUDE.md and BUILD_PLAN_MICHAEL.md. Cross-reference each evidenced identifier against its marker:

| Identifier | Plan marker | Evidence | Drift? |
|---|---|---|---|
| 5.5 | `[ ]` | shipped v6.10.13 | ✗ DRIFT — mark [x] |
| 6.9 | `[ ]` | shipped v6.10.25 | ✗ DRIFT — mark [x] |
| M21 | `[x]` | confirmed | ✓ in sync |
| M22 | `[ ]` | "ran clean" in SESSION_LOG | ✗ DRIFT |

---

## Step 4 — Generate paste-ready Edit commands

For each drift row, output an Edit-tool command Michael runs:

```
Edit /home/user/accent-os/BUILD_PLAN_CLAUDE.md:
  old: "- [ ] **5.5** — Trade Partner Network"
  new: "- [x] **5.5** — Trade Partner Network (shipped v6.10.13, commit cd8cf3f)"

Edit /home/user/accent-os/BUILD_PLAN_MICHAEL.md:
  old: "- [ ] **M22** — Run Inventory schema"
  new: "- [x] **M22** — Run Inventory schema (confirmed 2026-05-04)"
```

Group commands by file so Michael can apply them in one pass.

---

## Step 5 — Output

```
═══ BLOCK 1: SUMMARY ═══
Lookback window: [date of last BUILD_PLAN edit] → today
Evidence rows surfaced: [N]
HIGH confidence: [count]   MEDIUM: [count]   LOW: [count]
Drift detected: [count] markers need updating

═══ BLOCK 2: DRIFT TABLE ═══
[Step 3 table]

═══ BLOCK 3: PASTE-READY EDITS ═══
[Step 4 commands grouped by file]

═══ BLOCK 4: AMBIGUOUS ROWS ═══
For each MEDIUM/LOW confidence row:
  - identifier, evidence excerpt, recommended manual check
  Michael decides whether to mark [x] or leave [ ].
```

If no drift, output: "BUILD_PLAN markers are in sync with git + SESSION_LOG as of [timestamp]."

---

## Step 6 — Ping prompt-queue resolution loop

At the end of every build-plan-status run (regardless of whether drift was detected this run): if `/home/user/accent-os/PROMPT_QUEUE.md` exists AND has a non-empty WAITING section, invoke prompt-queue's RESOLVE operation. RESOLVE reads current BUILD_PLAN file state directly — it doesn't need a "what flipped" hint to be correct, the file IS the truth.

The integration is a single hook, not a complex pipeline:

1. Check `wc -l < /home/user/accent-os/PROMPT_QUEUE.md` for non-empty.
2. If it has a `## WAITING` section with rows, invoke prompt-queue's RESOLVE step. "Invoke" here means: Claude reads `/home/user/accent-os/skills/prompt-queue/SKILL.md`, applies its Step 4.5 logic against the current PROMPT_QUEUE.md and BUILD_PLAN files, and writes back any promotions. No tool call or external trigger needed — it's an in-context skill chain.
3. Surface in this skill's output:

```
═══ BLOCK 5: PROMPT-QUEUE PROMOTION ═══
M-tasks/Tracks flipped this run: M27, M30
Promoted from WAITING → QUEUED:
  - #3 "backfill customers.segment for top 100" (was waiting on M30)
  - #7 "verify deliveries data after M27 lands" (was waiting on M27)
Still WAITING: 4 items (next eligible: prompt:#5 — pending #5 completion)
```

If PROMPT_QUEUE.md doesn't exist or has no WAITING items, skip BLOCK 5 silently.

This closes the loop: the moment a BUILD_PLAN marker flips, any prompt deferred on that marker becomes ready without Michael having to remember to re-check the queue.

---

## Anti-patterns

- **Never** auto-apply the generated Edits. Output commands only — Michael runs them against /home/user/accent-os/ files.
- **Never** mark a track [x] based on LOW-confidence evidence. Surface all ambiguous rows in BLOCK 4 for manual review.
- **Never** invent ship dates or commit SHAs. Every evidence cell must cite its exact git log line or SESSION_LOG excerpt.
- **Never** modify BUILD_PLAN_MICHAEL.md items based on Claude commits — Michael's plan reflects Michael's M-task completions, not Claude's work.
- **Never** skip the WORK_IN_PROGRESS.md source — the "Step:" line is often the most recent shipped-module signal in the repo.
- **Never** skip the prompt-queue RESOLVE hook at the end of a run. Every build-plan-status run must check /home/user/accent-os/PROMPT_QUEUE.md for items newly unblocked by flipped markers.
