---
name: next-action-recommender
description: >
  Recommend the top-3 highest-leverage next actions for Michael at Accent
  Lighting by scanning AccentOS's live state — Supabase hsyjcrrazrzqngwkqsqa
  (`vendor_scores` deltas, `deals` pipeline stalls, `kpi_catalog` deviations,
  `alerts` queue, `action_queue` PROPOSED items) and `BUILD_PLAN_MICHAEL.md`
  unresolved M-tasks — then ranks each candidate via the leverage rubric
  (impact × time-sensitivity ÷ effort, with a blocked-by penalty) defined in
  `references/leverage-rubric.md`. Closes the MASTER §14 promise that
  AccentOS turns its data into a daily action list. Use this skill when
  Michael says: "what should I do next", "what are my top 3", "give me
  three things to act on", "next action", "what's the highest-leverage
  move", "what's worth my time today", "what would move the needle",
  "/next". Do not use for build-plan prioritization (that's bottleneck-finder)
  or for vague-priority articulation (that's priority-articulation). Always
  cites a Supabase row or named gap for every recommendation and includes a
  <5-minute first concrete step — never returns generic advice like "review
  your email" or "look at your KPIs." Top trigger phrases (matched against
  this description by the harness): "whats next", "top 3", "what should i
  do next", "/next", "highest leverage", "move the needle", "knock out
  whatever", "what should i knock out", "whats worth my time".
---

# next-action-recommender

**Purpose:** AccentOS captures vendor scores, deal stalls, KPI deviations, alerts, and proposed actions every day — but Michael still has to scan five places to know where to spend the next hour. This skill is the recommender that fuses those streams into a ranked top-3 he can act on immediately.

This is the L3→L4 closer in the Capability Ladder: proactive surfacing (L3) of recommended drafts (L4). The output is the input for `daily-brief-composer` (which dresses it up for the morning brief) and `action-queue` (which receives the approved subset).

---

## Trigger Recognition

Run this skill when Michael says anything like (lowercase, often no apostrophes — match his terse register):
- "whats next" / "what next"
- "what should i do next" / "what should i work on"
- "top 3" / "my top 3" / "three things to act on" / "give me three"
- "highest leverage" / "highest-leverage move" / "biggest leverage"
- "what would move the needle" / "what moves the needle"
- "whats worth my time" / "whats worth my time today"
- "next action" / "/next" / "next move"
- "rank my actions" / "give me a recommendation" / "whats the play"
- "what should i knock out" / "knock out whatever" / "what can i knock out" (Michael uses "knock out" as autonomy verb — confirmed in PROMPT_LOG)
- "what should i ship next"
- "give me three things" / "three things i should do"
- "what's unblocked" / "whats unblocked" (when Michael wants the autonomous-build-friendly subset)

Also auto-invokable by `daily-brief-composer` Step 2 (it consumes BLOCK 1 from this skill — orchestration triangle apex).

Disambiguation: if Michael says "morning brief" / "daily brief" / "todays rundown" / "whats on my plate" → defer to `daily-brief-composer` (this skill is the upstream feeder, not the renderer). If he says "whats blocking" / "whats blocked on me" → defer to `bottleneck-finder` for the build-plan view. If he says "alert" / "what fired" → defer to `alert-router`. If he says "/gap" → defer to `gap-optimizer` (vision-driven candidates, complementary to live-state candidates this skill produces).

---

## Step 0 — Preflight

Run these reads in parallel; abort with a stub only on the explicit blockers below.

1. `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — every `- [ ] **M[NN]**` row + its "Unlocks:" line (used by Step 1 candidate generator and Step 2 leverage scorer).
2. `/home/user/accent-os/MASTER.md` §13 (Open Loops) and §14 (Vision) — narrative anchors for what "leverage" means today.
3. `/home/user/accent-os/skills/_index.md` — companion-skill registry (used to delegate concrete first steps).
4. Supabase `hsyjcrrazrzqngwkqsqa` — five queries via `supabase-sql-magic` or direct MCP `execute_sql`:
   - `vendor_scores` deltas: vendors whose composite score changed ≥0.10 in last 7d
   - `deals` stalls: deals at the same stage ≥14d with `value_usd >= 1000`
   - `kpi_catalog` deviations: KPIs where `latest_value` is outside `target_band` (if `kpi_catalog` table exists; otherwise use KPI_CATALOG.md)
   - `alerts` queue: rows where `status = 'OPEN'` and `severity in ('HIGH','CRITICAL')`
   - `action_queue` PROPOSED: rows where `status = 'PROPOSED'` and `created_at >= now() - interval '7d'`. Two uses: (a) each row is a candidate this skill ranks alongside the others; (b) the row count is read as **PROPOSED-depth back-pressure** — a high depth (>20) signals "many alerts already pending in queue" and slightly demotes redundant overlapping candidates from this skill (avoids stacking duplicate proposals). Skip if `action_queue` table doesn't exist yet — see soft-block below.

**Soft-block (graceful degrade, not full stub):**
- If `kpi_catalog` table is missing, fall back to reading `/home/user/accent-os/KPI_CATALOG.md` and flag deviations heuristically. Note the degrade in output BLOCK 0.
- If `action_queue` table is missing (action-queue skill not yet built), skip that source and note it. Recommendations still ship from the other four sources. Also: `action_queue` PROPOSED depth is the back-pressure signal that lets this skill know which alert-router-routed actions are already pending — when missing, treat depth as 0 (no back-pressure adjustment to candidate scoring).
- If `references/leverage-rubric.md` is missing or unreadable, fall back to the inline composite formula in Step 2 with default dimension weights (each 1–5 integer). Note `rubric-default` in BLOCK 0. Do NOT abort — a coarse ranking beats no ranking.
- If `BUILD_PLAN_MICHAEL.md` is missing or empty, skip the M-task source. The other four still produce candidates. Do not synthesize fake M-tasks.
- If Supabase MCP is unreachable, return: `⚠ next-action-recommender: Supabase unreachable. Re-run after MCP restore.` and exit. Do not fabricate candidates from stale memory.

This skill is NOT M-task blocked — its blockers are degrade-gracefully, not stop-the-world.

---

## Step 1 — Generate the candidate pool

Build a flat candidate list from all five sources. Each candidate is one row with these fields:

| Field | Type | Source |
|---|---|---|
| `id` | string | source-prefixed (e.g. `vs:vendor_id=147`, `deal:deal_id=8821`, `kpi:GMC_disapproval_rate`, `alert:id=33`, `aq:id=12`, `mtask:M06`) |
| `source` | enum | `vendor_score` / `deal_stall` / `kpi_deviation` / `alert` / `action_queue` / `m_task` |
| `summary` | text | one-sentence what-it-is, citing the row/key |
| `expected_impact` | text | $ revenue at risk, hours saved, or risk class — never blank |
| `time_sensitive_until` | date or "ongoing" | when it stops mattering |
| `effort_estimate` | enum | `15min` / `1h` / `half-day` / `multi-day` |
| `unblocks` | list | for M-tasks: from "Unlocks:" annotation; else `[]` |

**Important:** sometimes the highest-leverage action is unblocking an M-task. Pull every unresolved M-task from BUILD_PLAN_MICHAEL.md as a candidate, summarized as "M[NN]: [first line of description]." Use the "Unlocks:" annotation as the impact statement.

If the candidate pool is empty (rare but possible on a quiet day), return:

```
✓ next-action-recommender — no live candidates. AccentOS state is clean.
  Suggestion: run `/gap` to surface vision-driven candidates,
  or `/skill-health` to spend the slack on ecosystem maintenance.
```

---

## Step 2 — Score every candidate via the leverage rubric

Apply `references/leverage-rubric.md` to each candidate. The composite formula:

```
leverage = (Impact × Time-sensitivity) ÷ (Effort × Blocked-by-penalty)
```

Each dimension is a 1–5 integer; blocked-by-penalty is 1 (clean) or 2 (waiting on someone else). See `references/leverage-rubric.md` for the per-dimension rubric tables and worked examples.

Score every candidate. Sort descending by leverage.

**Tie-breaker:** when two candidates share the same leverage score:
1. Higher Impact wins
2. Then earlier `time_sensitive_until`
3. Then lower Effort
4. Then alphabetical by `id` (deterministic)

---

## Step 3 — Pick the top-3 and draft the first concrete step

For ranks 1, 2, 3, write a `first_step` field — a single concrete action Michael can take in **<5 minutes**, citing the exact tool/file/skill to use. Examples:

- For a deal stall: "Open `deals/8821` in BC, reply to last message thread with the templated 'still alive?' subject."
- For a vendor-score delta: "Run `/skill vendor-cascade trace vendor_id=147` to see why score dropped, then review the surfaced metric."
- For an M-task: "Open `sql/M06_*.sql`, copy contents into Supabase SQL editor, paste, run."
- For an alert: "Click the alert in the Daily Command Center; if confirmed, queue the suggested action via `/skill action-queue`."

If the natural first step is "delegate to a companion skill," name the skill explicitly. Never write generic first steps like "log into BigCommerce" without the URL / specific entity.

---

## Step 4 — Output the recommendation block

```
═══ BLOCK 0: STATE ═══
Candidates scanned: [N]   Sources: [list, with any soft-block notes]
Scoring rubric: references/leverage-rubric.md
Generated: [YYYY-MM-DD HH:MM]

═══ BLOCK 1: TOP-3 RECOMMENDED ACTIONS ═══

#1 — [summary]   (leverage: [score])
  source:        [source enum] · [id]
  why now:       [one sentence — must reference the row/key]
  expected:      [$ / hours / risk]
  effort:        [15min | 1h | half-day]
  first step:    [concrete <5min action — names skill/file/URL]

#2 — [summary]   (leverage: [score])
  ...

#3 — [summary]   (leverage: [score])
  ...

═══ BLOCK 2: RUNNERS-UP (rank 4–6, for context) ═══
| Rank | Source | Summary | Leverage |
| 4 | ... | ... | ... |

═══ BLOCK 3: NEXT-STEP HOOKS ═══
- Approve any of the above? Reply `queue 1`, `queue 1,2`, or `queue all`
  → routes through `action-queue` (creates PROPOSED rows)
- Want this in tomorrow's morning brief?
  → already wired; `daily-brief-composer` consumes this skill's output
- Want a different lens? `/skill bottleneck-finder` for build-plan view,
  `/skill priority-articulation` to articulate a vague priority first
```

---

## Step 5 — Log the run

Append a one-line log entry to `skills/next-action-recommender/run-log.md`:

```
## [YYYY-MM-DD HH:MM]
candidates: [N]   top-3 ids: [id1, id2, id3]   approved-by-michael: [pending|none|csv-of-ids]
```

The "approved" field is filled in retroactively when Michael's `queue [N]` reply lands. This becomes the feedback signal that tunes the rubric over time (high-approval-rate sources get weight bumps; low-approval sources get demoted).

If `run-log.md` doesn't exist yet, create it with a 2-line header. Bundle the write into the next session-end commit (per CLAUDE.md batch-doc-update rule).

---

## Output format

See Step 4. The literal block structure is the contract — `daily-brief-composer` parses BLOCK 1 by the `#1 —`, `#2 —`, `#3 —` markers and the field labels. Do not rename these markers without coordinating with that skill.

---

## AccentOS context

- **Stack:** Supabase `hsyjcrrazrzqngwkqsqa` (primary data source), Anthropic API via `ANTHROPIC_API_KEY` (for first-step generation when needed), BigCommerce `store-cwqiwcjxes` (deal/quote URLs).
- **Project:** AccentOS for Accent Lighting.
- **Paths:** `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`).
- **Tables read (read-only):** `vendor_scores`, `deals`, `kpi_catalog`, `alerts`, `action_queue` (when present).
- **Files read (read-only):** `BUILD_PLAN_MICHAEL.md`, `MASTER.md` §13/§14, `KPI_CATALOG.md` (fallback).
- **Files written:** `skills/next-action-recommender/run-log.md` (append).
- **Companion skills (orchestration triangle: this skill is the upstream feeder for the brief; both this and `alert-router` write into the same downstream `action_queue`):**
  - `daily-brief-composer` — consumer of BLOCK 1 (downstream renderer; see triangle apex)
  - `alert-router` — sibling feeder; routes alerts into `action_queue` PROPOSED rows whose depth this skill reads as a back-pressure signal in Step 0
  - `action-queue` — receives `queue [N]` approvals from BLOCK 3 and is also the PROPOSED-depth source read in Step 0
  - `priority-articulation` — input source for what "impact" means today (upstream)
  - `bottleneck-finder` — TOC build-plan view; provides M-task candidates
  - `supabase-sql-magic` — used by Step 0 for the five preflight queries
  - `vendor-cascade` — used in concrete first steps for vendor-score candidates
  - `kpi-data-audit` — used for `kpi_deviation` candidates when the deviation looks like a data problem rather than a business problem
  - `gap-optimizer` — complementary candidate source: this skill produces live-state candidates, gap-optimizer produces vision-driven candidates. When BLOCK 1 is empty (no live candidates), suggest `/gap`.

---

## Anti-patterns

- **Never** recommend a generic action ("review your email", "check on vendors", "look at the dashboard"). Every recommendation must cite a Supabase row, an alert id, an M-task id, or a named KPI.
- **Never** return more than 3 ranked recommendations in BLOCK 1. If 4+ tie at the top, the rubric is broken — recompute, don't punt to Michael with "here are 6, you pick."
- **Never** invent expected-impact numbers. If a candidate has no quantifiable impact, score it Impact=2 max and say so in the `expected:` field ("risk class: medium; not directly quantifiable").
- **Never** skip the `first_step` field. A recommendation without a <5-min concrete step is a research note, not a recommendation.
- **Never** recommend a candidate that's blocked by a person who isn't Michael without applying the blocked-by penalty. If the action is "wait for vendor X to send file," that goes in BLOCK 2 at best.
- **Never** modify `vendor_scores`, `deals`, `alerts`, `kpi_catalog`, or `action_queue` rows. This skill is read-only on Supabase. Approvals get queued via `action-queue`, not direct writes.
- **Never** run when Supabase MCP is unreachable. Return the unreachable stub and exit. Recommendations from stale cached memory are worse than no recommendation.
- **Never** abort on a missing `leverage-rubric.md` — fall back to the inline default formula and flag `rubric-default` in BLOCK 0.
- **Never** synthesize `action_queue` PROPOSED depth when the table doesn't exist. Treat back-pressure as 0 and continue. Faking depth corrupts the orchestration triangle's signal.
- **Never** silently swallow an empty candidate pool. If sources A–E produce zero candidates total, emit the explicit "no live candidates" stub and recommend `/gap` or `/skill-health` — do not return a blank BLOCK 1.
