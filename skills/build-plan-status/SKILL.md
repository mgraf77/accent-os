---
name: build-plan-status
description: >
  Auto-sync BUILD_PLAN_CLAUDE.md and BUILD_PLAN_MICHAEL.md [x]/[ ]
  markers from recent git commit messages and SESSION_LOG.md entries.
  Catches the recurring drift between "what shipped to AccentOS" and
  "what's marked shipped in the plan." Outputs paste-ready Edit
  commands; never auto-applies. Use this skill when Michael says:
  "sync the build plan", "update the plan markers", "what's actually
  shipped", "build plan status", "update [x]/[ ] from git", "audit
  the build plan", or any phrasing that asks to reconcile planning
  doc state against shipped reality. Do not use for cross-doc drift
  (use doc-drift) or for vendor scoring drift (use vendor-clarity-
  test). Always produces a paste-ready Edit command list — never
  returns prose-only.
---

# build-plan-status

**Purpose:** During autonomous AccentOS builds, modules ship and commits land but BUILD_PLAN_CLAUDE markers don't always update — especially when Michael completes things outside the Claude session (M-tasks). This skill closes the gap between git history and plan state.

Stolen from: AccentOS-internal recurring drift pattern (not from external concept theft). Pairs with doc-drift but scoped specifically to plan markers.

---

## Trigger Recognition

Run when Michael says:
- "sync the build plan" / "update the plan markers"
- "what's actually shipped"
- "build plan status" / "audit the build plan"
- "update [x]/[ ] from git"
- "how far are we"
- "what's done vs what's left"
- "mark [module] done in the plan"
- "plan markers are stale"
- "reconcile the build plan"
- "catch up the plan markers"

---

## Step 1 — Pull recent shipped signals (read all three sources in parallel)

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
| 5.5 | `[ ]` | shipped v6.10.13 | ✗ DRIFT — should be [x] |
| 6.9 | `[ ]` | shipped v6.10.25 | ✗ DRIFT — should be [x] |
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

**Edge cases:**
- If `git log` returns no commits since the last BUILD_PLAN edit (plan was just updated), output: "No new commits since last BUILD_PLAN_CLAUDE.md edit ([date]). No drift to process."
- If the track/M-task identifier in a commit subject doesn't match any line in BUILD_PLAN_CLAUDE.md, note it as `UNMATCHED_IDENTIFIER` in BLOCK 4 — don't silently discard. Michael may need to add a new BUILD_PLAN entry.
- If BUILD_PLAN_MICHAEL.md doesn't exist at `/home/user/accent-os/BUILD_PLAN_MICHAEL.md`, skip that file and note: "BUILD_PLAN_MICHAEL.md not found — checking CLAUDE plan only."

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

- **Never** auto-apply the Edits. Output only — Michael runs them.
- **Never** mark a track [x] based on LOW-confidence evidence. Surface ambiguous rows for manual review.
- **Never** invent ship dates or commit SHAs. Cite exact source.
- **Never** modify BUILD_PLAN_MICHAEL items based on Claude commits — Michael's plan reflects Michael's work, not Claude's.
- **Never** skip the WORK_IN_PROGRESS.md source — it's often the most recent signal.
- **Never** produce an Edit command that replaces only the `[ ]` marker without including the trailing text — the Edit tool requires a unique old string; replacing just `[ ]` on its own will match multiple lines and corrupt the plan.
- **Never** assume a `[?]` marker means "done" — treat it identically to `[ ]` (pending) until explicit shipped evidence is found.
