# vibe-speak — topic clusters

> Recurring noun-phrase clusters detected in Michael's prompt corpus. Identifies project domains, mental categories, and cross-project patterns. Refreshed by `/vibe backtest`.

Last refresh: 2026-05-05 (18-prompt seed corpus).

---

## How clusters form

Heuristic: when 3+ unique noun phrases co-occur in 3+ prompts, group them. Add new noun phrases to existing clusters when 2+ already-clustered nouns also appear in the new prompt.

Example:
- Prompt mentions: "Supabase", "RLS", "schema", "M21"
- Existing cluster `database-work` already contains: "Supabase", "schema", "SQL"
- 2/4 nouns match → add prompt to `database-work` cluster, optionally add "RLS" + "M21" as cluster nouns.

Over time, clusters reveal Michael's mental project organization without him explicitly tagging.

---

## Active clusters (this corpus)

### autonomous-build

- nouns: autonomous, build, resume, continue, BLOCKS ON MICHAEL, knock out, build without stopping, while i'm gone
- prompt count: 9 / 18 (50% of corpus — dominant cluster)
- date range: 2026-05-04 → 2026-05-05
- recurring tasks:
  - Resume building from BUILD_PLAN
  - Continue when unblocked
  - Knock out batches in time windows
- companion skills: `autonomous-mode`, `prompt-queue`, `build-plan-status`
- profile signal: `gsd` mode is the natural fit for this cluster's prompts

### inline-edit-pattern

- nouns: inline edit, cell, optimistic UI, audit_log, qty_on_hand, status select
- prompt count: 5 / 18
- date range: 2026-05-05 (single-day intensity)
- recurring tasks:
  - Add inline edit to a list page
  - Generalize cell renderer
  - Extend to additional fields
- companion skills: (none yet — candidate for new skill via Step 23 if this pattern keeps recurring)
- adoption_velocity: high — 11 inline-edit terms in one day; topic crystallized rapidly

### bulk-csv-import-pattern

- nouns: bulk import, parse, preview, commit, header alias map, csv_import.js, normalizer
- prompt count: 4 / 18
- date range: 2026-05-05
- recurring tasks:
  - Add bulk-CSV import to a module
  - Reuse parseCsv + csvDownload
  - Handle enum normalization + duplicate flagging
- companion skills: (csv-related — could become a `csv-import-shipping-checklist` skill if pattern recurs)
- adoption_velocity: established — 4 modules use this pattern

### file-organization

- nouns: BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md, PROMPT_LOG.md, PROMPT_QUEUE.md, WORK_IN_PROGRESS.md, BUILD_INTELLIGENCE.md, MASTER.md, SESSION_LOG.md
- prompt count: 6 / 18
- date range: 2026-05-04 → 2026-05-05
- recurring tasks:
  - Read planning docs at session start
  - Update BUILD_PLAN markers
  - Log session state
- companion skills: `doc-drift`, `build-plan-status`, `decision-log`

### module-modes (NEW topic — this session)

- nouns: module modes, rollout-state registry, idea_only, brainstorming, planning, building, testing, live, role-based, per-user override, user_module_overrides
- prompt count: 1 / 18 (introduced this session — emerging)
- date range: 2026-05-05
- recurring tasks: (none yet — single prompt)
- companion skills: (none — too new)
- adoption_velocity: new — watch for emergence
- profile signal: domain emerging; track for cluster growth

### supabase-schema

- nouns: Supabase, schema, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, RLS, on_conflict, table, query
- prompt count: 5 / 18
- date range: 2026-05-04
- recurring tasks:
  - Run M-task SQL in Supabase
  - Mark M-tasks complete in BUILD_PLAN_MICHAEL
  - Add new RLS policies
- companion skills: `supabase-sql-magic`, `schema-contract-tests`, `table-eda`

### token-budget-aware

- nouns: usage, tokens, hour, minute, max plan, extra usage, budget, efficiency
- prompt count: 1 / 18 (single prompt, but introduces NEW signal type)
- date range: 2026-05-05
- recurring tasks: (single instance — but pattern is significant)
- companion skills: (none — new domain; vibe-speak itself is a fit since it tracks token cost)
- adoption_velocity: new
- profile signal: NEW — when prompts in this cluster appear, auto-suggest `gsd` mode for max token efficiency

---

## Cross-cluster patterns

### Cluster co-occurrence (when two clusters appear in the same prompt)

| Cluster A | Cluster B | Co-occurrence count |
|---|---|---|
| autonomous-build | inline-edit-pattern | 3 |
| autonomous-build | bulk-csv-import-pattern | 2 |
| autonomous-build | file-organization | 4 |
| inline-edit-pattern | bulk-csv-import-pattern | 2 |
| supabase-schema | autonomous-build | 1 |

**Insight:** autonomous-build is the dominant connector cluster — Michael's "do work autonomously" mental mode pairs with whichever specific build pattern is active. This validates that `gsd` mode is the right fit when autonomous-build cluster fires.

---

## Cluster → mode mapping (proposal)

When the active prompt strongly matches one cluster, vibe-speak could auto-suggest a matching mode:

| Cluster | Suggested mode |
|---|---|
| autonomous-build | gsd (action-only, no narration) |
| inline-edit-pattern | vibe (default — quick code edits) |
| bulk-csv-import-pattern | vibe |
| file-organization | vibe (status reports) |
| module-modes (when it grows) | pair (design discussion) |
| supabase-schema | vibe + auto-disengage on SQL output |
| token-budget-aware | gsd (max efficiency) |

This is a Step 21 (mode auto-suggestion) extension — once clusters are stable, suggestions become more accurate.

---

## Future cluster work

Once corpus expands via claude.ai import:

- **Cross-project clusters** — clusters that appear in multiple Michael projects (likely candidates for universal AccentOS skills)
- **Cluster lifecycle** — when do clusters form, peak, decline? Useful for predicting which topics are stable enough to need their own skill
- **Cluster-to-skill mapping** — when a cluster has 30+ prompts and no existing skill matches, propose forging a new skill (per Step 23)
- **Annual cluster maps** — visual evolution of Michael's mental project organization over time

These get added as `/vibe topics [year]` and `/vibe topics evolution` subcommands once corpus has 100+ prompts spanning months.
