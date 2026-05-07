---
name: doc-drift
description: >
  Cross-check that AccentOS planning and state documents agree on stated
  priorities, active tracks, vendor-scoring rules, and queue items. Loads
  SESSION_LOG.md, MASTER.md, BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md,
  PROMPT_LOG.md, WORK_IN_PROGRESS.md, and skills/repo-scout/references/
  project-profiles.md, then surfaces any disagreement as a delta table
  with paste-ready fixes. Use this skill when Michael says: "check for
  doc drift", "are my docs consistent", "verify priorities are aligned",
  "do my plans agree", "audit my docs", "drift check", "consistency
  check on plans", or any phrasing that asks whether AccentOS source-
  of-truth files agree on what's being built and why. Do not use this
  skill for code consistency (use the repo's own type-check / lint) or
  vendor-scoring math (that's vendor-cascade). Always produces a delta
  table plus paste-in suggested edits — never returns prose-only.
  Always recommends a source-of-truth doc for each drift row —
  never flags a disagreement without a resolution path.
---

# doc-drift

**Purpose:** Solo autonomous-Claude builds drift between planning docs as sessions accumulate. This skill catches when MASTER says one thing, BUILD_PLAN says another, and project-profiles says a third — before that drift turns into a wrong-priority build session.

Origin: Cascade strategic-alignment communication gap analysis. Rebuilt for cross-doc alignment in a solo build rather than cross-team alignment.

---

## Trigger Recognition

Run when Michael says:
- "check for doc drift"
- "are my docs consistent"
- "verify priorities are aligned"
- "do my plans agree"
- "audit my docs"
- "drift check" / "consistency check on plans"

---

## Step 1 — Load all source-of-truth docs

Read each file. If any is missing, flag and continue with what exists:

- `/home/user/accent-os/MASTER.md`
- `/home/user/accent-os/BUILD_PLAN_CLAUDE.md`
- `/home/user/accent-os/BUILD_PLAN_MICHAEL.md`
- `/home/user/accent-os/SESSION_LOG.md` (last ~200 lines first; expand to full file if a claim references something not found in the window)
- `/home/user/accent-os/PROMPT_LOG.md` (last ~50 entries first; expand on demand same as SESSION_LOG)
- `/home/user/accent-os/WORK_IN_PROGRESS.md`
- `/home/user/accent-os/PROMPT_QUEUE.md`
- `/home/user/accent-os/skills/repo-scout/references/project-profiles.md`

---

## Step 2 — Extract claims from each doc

For each doc, extract these claim classes:

| Claim class | What to look for |
|---|---|
| **Active priority** | Lines mentioning "priority", "Q4", "margin", "GMC", "vendor scoring", named tracks |
| **Active track** | "Track [N]", "M[NN]", "[N.N]" feature numbers |
| **Track status** | "[ ]" vs "[x]" markers, "completed", "blocked", "in progress" |
| **Stated capability gap** | "not built", "TODO", "M-task pending", "known capability gaps" headers |
| **Resume point** | Last clean checkpoint, next pending item |

Output a per-doc claim list. Quote source lines.

---

## Step 3 — Build the delta table

For each claim class, build a row showing what each doc says:

| Claim class | MASTER | BUILD_PLAN_CLAUDE | project-profiles | SESSION_LOG | PROMPT_LOG | Verdict |
|---|---|---|---|---|---|---|
| Top priority | "Q4 margin" | "Q4 margin" | (silent) | "Q4 margin" | "Q4 margin" | ✓ agree |
| Track 0.4 status | `[ ]` | `[ ]` | "not built" | "ran clean in Supabase" | "M21/M22/M23 confirmed" | ✗ DRIFT |

Verdict values:
- ✓ agree
- ⚠ silent (one or more docs say nothing — usually fine)
- ✗ DRIFT (docs explicitly disagree)

---

## Step 4 — Score the drift

For each ✗ DRIFT row, classify:

- **Stale-marker drift** — one doc says `[ ]` but another doc shows the work is done (e.g. SQL ran, commit landed). Easiest to fix.
- **Priority drift** — different docs claim different active priorities. Highest risk; can cause wrong-track builds.
- **Status-label drift** — same item, different wording across docs. Cosmetic but accumulates.

---

## Step 5 — Output

```
═══ BLOCK 1: AGREEMENT TABLE ═══
[full Step 3 table]

═══ BLOCK 2: DRIFT LIST ═══
For each ✗ DRIFT, list:
  - Claim class + claim
  - Drift type (stale-marker / priority / status-label)
  - Recommended source-of-truth (which doc to align others to)

═══ BLOCK 3: PASTE-READY FIXES ═══
For each drift, output an Edit-tool command Michael can run:
  Edit BUILD_PLAN_CLAUDE.md: change `- [ ] 0.4 Full DB schema` → `- [x] 0.4 Full DB schema (M21/M22/M23 ran clean 2026-05-04)`
  Edit project-profiles.md: remove "Full DB schema (Track 0.4) — all tables in one SQL execution" from "Known capability gaps"
```

If no drift exists, output: "All docs agree on priorities, active tracks, and statuses as of [timestamp]." This is a valid happy-path result.

---

## Anti-patterns

- **Never** silently auto-apply the suggested edits. Output them as paste-ready Edit commands; Michael runs them.
- **Never** flag drift on docs that are intentionally divergent (e.g. PROMPT_LOG captures asks, MASTER captures shipped state — those won't match by design). Only flag actual contradictions.
- **Never** treat "silent" (one doc doesn't mention something) as drift. Silence is the default, not a contradiction.
- **Never** report drift without a recommended source-of-truth. "These disagree, you figure it out" is not useful.
- **Never** load files that don't exist as if they were empty — flag the missing file explicitly.
- **Never** flag a `[x]` in BUILD_PLAN_MICHAEL.md that doesn't yet appear in BUILD_PLAN_CLAUDE.md as drift. Michael's plan and Claude's plan diverge by design during active Michael work; sync happens at session end.
