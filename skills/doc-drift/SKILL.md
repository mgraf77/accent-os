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
---

# doc-drift

**Purpose:** Solo autonomous-Claude builds drift between planning docs as sessions accumulate. This skill catches when MASTER says one thing, BUILD_PLAN says another, and project-profiles says a third — before that drift turns into a wrong-priority build session.

Stolen from: Cascade `strategic-alignment` "communication gap analysis." Rebuilt: instead of cross-team alignment, this is cross-doc alignment for a solo build.

---

## Trigger Recognition

Run when Michael says:
- "check for doc drift"
- "are my docs consistent"
- "verify priorities are aligned"
- "do my plans agree"
- "audit my docs"
- "drift check" / "consistency check on plans"
- "sync my planning docs"
- "are my plans out of sync"
- "find contradictions in my docs"
- "what disagreed between plans"
- "reconcile my docs"

---

## Step 1 — Load all source-of-truth docs

Do in parallel: read all files simultaneously — they are independent sources.

- `/home/user/accent-os/MASTER.md`
- `/home/user/accent-os/BUILD_PLAN_CLAUDE.md`
- `/home/user/accent-os/BUILD_PLAN_MICHAEL.md`
- `/home/user/accent-os/SESSION_LOG.md` (last ~200 lines first; expand to full file if a claim references something not found in the window)
- `/home/user/accent-os/PROMPT_LOG.md` (last ~50 entries first; expand on demand same as SESSION_LOG)
- `/home/user/accent-os/WORK_IN_PROGRESS.md`
- `/home/user/accent-os/PROMPT_QUEUE.md`
- `/home/user/accent-os/skills/repo-scout/references/project-profiles.md`

For each missing file, output: `⚠ MISSING: [path] — skipping; claims from this source will be absent from delta table.`

**Minimum viable run:** if fewer than 2 of {MASTER.md, BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md} are present, abort with: "doc-drift needs at least 2 of the 3 primary planning docs (MASTER, BUILD_PLAN_CLAUDE, BUILD_PLAN_MICHAEL). Found: [list]. Cannot produce a meaningful comparison."

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
| Claim class | MASTER | BUILD_PLAN_CLAUDE | BUILD_PLAN_MICHAEL | project-profiles | SESSION_LOG | PROMPT_LOG | Verdict |
|---|---|---|---|---|---|---|---|
[one row per claim class; quote source lines; use ✓ agree / ⚠ silent / ✗ DRIFT]

═══ BLOCK 2: DRIFT LIST ═══
[For each ✗ DRIFT row:]
  DRIFT #N: [claim class]
    Claim in [doc-A]: "[verbatim quote]"
    Claim in [doc-B]: "[verbatim quote]"
    Drift type: stale-marker | priority | status-label
    Source-of-truth: [which doc wins and why — e.g. "SESSION_LOG: most recent, references commit SHA"]
    Risk level: HIGH (priority drift, can cause wrong-track build) | MEDIUM (stale marker) | LOW (cosmetic label)

═══ BLOCK 3: PASTE-READY FIXES ═══
[For each drift, one Edit command per fix, using exact file path and exact old/new strings:]
  File: /home/user/accent-os/[filename]
  Change: `[old text]` → `[new text]`

═══ BLOCK 4: SUMMARY ═══
  Total claims evaluated: [N]
  Agreements: [N] (✓)
  Silent (not contradictory): [N] (⚠)
  Drifts: [N] (✗)  HIGH=[N] MEDIUM=[N] LOW=[N]
  Recommended action: [one-line — e.g. "Apply 2 HIGH fixes before next build session."]
```

If no drift exists, output: "All docs agree on priorities, active tracks, and statuses as of [ISO timestamp]. No fixes required." This is a valid happy-path result.

---

## Anti-patterns

- **Never** silently auto-apply the suggested edits. Output them as paste-ready Edit commands; Michael runs them.
- **Never** flag drift on docs that are intentionally divergent (e.g. PROMPT_LOG captures asks, MASTER captures shipped state — those won't match by design). Only flag actual contradictions.
- **Never** treat "silent" (one doc doesn't mention something) as drift. Silence is the default, not a contradiction.
- **Never** report drift without a recommended source-of-truth. "These disagree, you figure it out" is not useful.
- **Never** load files that don't exist as if they were empty — flag the missing file explicitly.
- **Never** flag a `[x]` in BUILD_PLAN_MICHAEL.md that doesn't yet appear in BUILD_PLAN_CLAUDE.md as drift. Michael's plan and Claude's plan diverge by design during active Michael work; sync happens at session end.
- **Never** produce prose-only drift output. Every run must include all 4 output blocks (BLOCK 1–4), even if DRIFT LIST is empty.
- **Never** read the docs sequentially — Step 1 specifies parallel reads. Sequential reads on large planning docs are a token-waste anti-pattern.
- **Never** abort if fewer than all 8 docs are present. The minimum viable threshold is 2 of the 3 primary planning docs — less than that, abort with the stated message; otherwise continue.
