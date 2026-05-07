---
name: gap-optimizer
description: >
  AccentOS goal-seeking optimizer that closes the gap between the documented
  long-term vision (MASTER.md, BUILD_PLAN, Capability Ladder, KPI catalog) and
  the current skill ecosystem. Scans HAVE vs. NEED, merges with emergent demand
  from efficiency-monitor's PROMOTE queue, scores every gap on impact ×
  frequency × buildability ÷ cost, and writes a ranked candidate-queue.md that
  feeds skill-forge. Use this skill when Michael says: "run gap analysis", "what
  should we build next", "close the gap", "optimize skills", "gap optimizer",
  "what's missing from the vision", "/gap", or any phrasing that asks "what
  skill should we forge next." Pairs with skill-forge (consumes the queue) and
  efficiency-monitor (provides emergent-demand input). Always produces a
  ranked queue plus an approval gate — never picks what to build, only ranks
  and proposes. After every skill-forge cycle, re-runs to log what closed.
---

# gap-optimizer

**Purpose:** Make AccentOS skill creation goal-seeking instead of reactive. Every run answers exactly one question: *given the gap between where AccentOS is and where it's going, which skills should we forge next?*

This is the closed-loop counterpart to `skill-forge` (which builds) and `efficiency-monitor` (which observes). Forge says "yes I'll build that." Monitor says "I noticed this pattern repeating." Optimizer says "here are the 3 skills that close the most vision-gap per hour of build time."

Five phases in order: **scan-vision → scan-current → compute-gap → score-and-rank → propose-and-log**. The output is always a ranked queue + an approval gate. Nothing else.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "run gap analysis"
- "what should we build next"
- "close the gap"
- "optimize skills"
- "gap optimizer" / "/gap"
- "what's missing from the vision"
- "rerun the optimizer"
- "what skill should we forge"
- "score the gaps"

Also run this skill **automatically**:
- After every `skill-forge` commit lands (Step 9 of forge → triggers a gap-optimizer rescan)
- At session boot if `candidate-queue.md` is older than 14 days
- When `efficiency-monitor` promotes a new candidate (status PROMOTE) — merges into the queue

---

## Scope

**In scope:**
- Gaps between vision artifacts and `skills/_index.md`
- Gaps between Capability Ladder targets (L3–L6) and current capability coverage
- Gaps in BUILD_PLAN Track 6 (Phase 4 integrations)
- Emergent gaps surfaced by `efficiency-monitor` PROMOTE entries
- Skill-ecosystem self-maintenance gaps (regression watch, deprecation, merge)

**Out of scope — fail fast with a one-line redirect:**
- Building the actual skill → "Use `skill-forge` after the approval gate."
- Evaluating an existing skill's quality → "Use `skill-eval-suite`."
- Reviewing a third-party tool → "Use `repo-scout` or `community-skill-vet`."
- Fixing broken references in existing skills → "Use `skill-health-monitor`."

---

## Step 0 — Preflight

In parallel:

1. **Read the vision artifacts** (cache for the run):
   - `/home/user/accent-os/MASTER.md` — read the table-of-contents and §14 (vision narrative)
   - `/home/user/accent-os/BUILD_PLAN_CLAUDE.md` — pending [ ] items
   - `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — pending M-tasks
   - `/home/user/accent-os/KPI_CATALOG.md` — what KPIs are defined vs. derivable
   - `/home/user/accent-os/skills/_index.md` — current skill registry
   - `/home/user/accent-os/skills/gap-optimizer/references/vision-map.md` — distilled HAVE/NEED matrix
   - `/home/user/accent-os/skills/gap-optimizer/references/scoring-rubric.md` — scoring weights
2. **Read the emergent-demand feed**:
   - `/home/user/accent-os/skills/efficiency-monitor/skill-candidates.md` — pull every PROMOTE-status entry
3. **Read prior runs**:
   - `/home/user/accent-os/skills/gap-optimizer/gap-log.md` — last 5 entries (what closed, what surfaced)
   - `/home/user/accent-os/skills/gap-optimizer/candidate-queue.md` if it exists — diff against prior queue
4. **Capture branch + commit hash** — `git -C /home/user/accent-os branch --show-current && git rev-parse --short HEAD`. Record in the run header. Auto-create a `claude/optimize-gap-[hash]` branch only when the run produces a queue change AND the user invokes `/gap commit` (otherwise queue updates are scratch).

Output of Step 0: a one-line preflight note: "vision artifacts loaded, N PROMOTE candidates from efficiency-monitor, M prior queue entries, branch X."

---

## Step 1 — Scan vision (NEED set)

Walk every vision source and extract every named capability. Produce one row per capability:

| # | Capability | Source citation | Type | Vision-deadline (if explicit) |
|---|------------|-----------------|------|-------------------------------|

Source citations must be file:line or section anchors — `MASTER.md §14`, `BUILD_PLAN_CLAUDE.md L42`, `_index.md "by 2027"`. Vague capabilities are not allowed; if a vision statement is fuzzy, mark it `Type: requires-clarification` and continue.

Type values:
- **integration** — requires connecting an external API/service (GA4, Klaviyo, BC REST, Windward)
- **agentic** — requires moving up the Capability Ladder (draft action, predict, autonomously execute)
- **meta-infra** — about the skill ecosystem itself (gap-optimizer, skill-health-monitor, performance tracking)
- **domain** — Accent Lighting business operation (vendor, customer, employee, owner)
- **governance** — decision/audit/alignment

Aim for ≥15 rows. The vision document is comprehensive; if you have <10, you missed sources.

---

## Step 2 — Scan current (HAVE set)

For every capability in Step 1, check if a skill in `skills/_index.md` already covers it. Mark each row:

- **COVERED** — existing skill with strong fit (cite skill name)
- **PARTIAL** — existing skill touches it but doesn't deliver the named outcome
- **GAP** — no existing skill addresses it

Be honest: PARTIAL is not COVERED. A skill that gathers GA4-ish data via supabase-sql-magic does not COVER the "GA4 insights pull" capability — it's PARTIAL because it lacks the integration step.

For PARTIAL rows, note the existing skill and the missing piece in one sentence each.

---

## Step 3 — Compute gap delta

The gap set = all rows from Step 1 marked GAP or PARTIAL.

Append the emergent-demand feed:
- For each PROMOTE-status entry in `efficiency-monitor/skill-candidates.md`, add it as a gap row with `Source: efficiency-monitor` and `Type: emergent`.
- If an emergent gap matches an existing GAP/PARTIAL row, **merge** — note both sources on the same row. Don't create duplicates.

Output the merged gap set as a single table.

---

## Step 4 — Score and rank

Apply `references/scoring-rubric.md`. Each gap gets four scores (1–5 integer scale):

| Dimension | Definition | Source signal |
|-----------|------------|---------------|
| **Impact** | If this skill existed, how much vision-gap closes? | Number of vision artifacts citing it × strategic weight (Capability Ladder L4–L6 weighted higher) |
| **Frequency** | How often would Michael invoke this skill, once it exists? | PROMOTE-status counts in efficiency-monitor + Michael's PROMPT_LOG echoes |
| **Buildability** | How forgeable is this — clear scope, available data, no blocking M-task? | Count of unresolved BUILD_PLAN_MICHAEL.md M-tasks blocking it (lower = better) |
| **Cost** | How much skill-forge time + Ralph iterations + ongoing maintenance? | Subjective Claude estimate — lean on similar-skill precedent |

**Composite score:** `(Impact × Frequency × Buildability) ÷ Cost`. Round to 1 decimal.

Sort the gap set by composite score descending. Tie-break on Impact, then Buildability.

---

## Step 5 — Propose and log

Output, in order:

### 5a. Run header

```
═══ GAP-OPTIMIZER RUN — YYYY-MM-DD HH:MM ═══
Branch: [branch] | HEAD: [shortsha]
Vision artifacts: N | Current skills: M | Emergent PROMOTE: K
Total gap rows: G | Scored: G | Top-3 surfaced below
```

### 5b. Top-3 candidate proposals

For the top 3 (or all if <3), output one block each:

```
RANK [1|2|3]: [skill-name-candidate]
  Type: [integration | agentic | meta-infra | domain | governance | emergent]
  Source: [vision citation OR efficiency-monitor PROMOTE OR both]
  What it would do: [one sentence — paste-ready for skill-forge intake]
  Closes which gap(s): [vision citation 1, vision citation 2]
  Score: I=[1-5] F=[1-5] B=[1-5] C=[1-5]  →  composite [N.N]
  Blocked by: [M-task IDs from BUILD_PLAN_MICHAEL.md if any, else "none"]
  Forge effort estimate: LOW (<2h) | MED (2-6h) | HIGH (>6h)
```

### 5c. Full ranked table (all gaps, not just top-3)

Write the full ranked table to `/home/user/accent-os/skills/gap-optimizer/candidate-queue.md`. Format:

```markdown
# AccentOS — Gap Candidate Queue
> Auto-rebuilt by gap-optimizer. Sorted by composite score descending.
> Last run: YYYY-MM-DD HH:MM | branch: [branch] | HEAD: [shortsha]

| Rank | Candidate | Type | I | F | B | C | Score | Sources | Blocked-by |
|------|-----------|------|---|---|---|---|-------|---------|------------|
| 1 | [name] | [type] | 5 | 4 | 5 | 2 | 50.0 | MASTER §14, L4 ladder | none |
| 2 | ... | ... | . | . | . | . | .. | ... | ... |
```

Overwrite the file each run. The queue is canonical state — no append-only history; for that, see `gap-log.md`.

### 5d. Approval gate

```
═══ FORGE APPROVAL GATE ═══
To forge from the queue, reply with one of:
  - "forge top 3"          → invokes skill-forge for ranks 1-3 in sequence
  - "forge top N"          → invokes skill-forge for ranks 1-N
  - "forge [name]"         → invokes skill-forge for a specific candidate
  - "forge none"           → close run, queue stays for next session
  - "rescan"               → discard this run, re-do Steps 1-5

I am stopping here. Nothing is built until you reply.
═══════════════════
```

Do not proceed past Step 5 without Michael's reply. If the reply is "forge none" or "rescan", do that and exit.

### 5e. Append to gap-log.md

Regardless of Michael's reply, append one entry to `/home/user/accent-os/skills/gap-optimizer/gap-log.md`:

```
### gap-run-NNN — YYYY-MM-DD HH:MM
- branch: [branch]
- head: [shortsha]
- gaps_total: [G]
- gaps_top3: [name1, name2, name3]
- prior_queue_diff:
    - closed_since_last: [list of skill names that moved to BUILT in efficiency-monitor or appeared in skills/_index.md]
    - new_gaps: [list of capability rows new since last run — vision additions, new PROMOTE entries]
- approval: [pending | top-3 | top-N | named-list | none | rescan]
- next_action: [what skill-forge will do, OR "queue stays for next session"]
```

NNN is sequential.

---

## Step 6 — Hand off to skill-forge (only if approved)

If Michael's reply selects ≥1 candidate:

1. For each approved candidate, prepare a skill-forge intake block:

```
SKILL-FORGE INTAKE — gap-driven
Target: [candidate-name] (proposed by gap-optimizer run NNN)
What it does: [one-sentence from Step 5b]
Closes gap: [vision citation]
Type: [type]
Pattern source: [either "vision artifact only" OR "external tool: [name]" — gap-optimizer can pre-research and suggest a target tool to forge from]
Forge effort estimate: [LOW/MED/HIGH]
```

2. Invoke `skill-forge` with the intake block as input. Skill-forge runs its full process (preflight → extract → assess → approval → forge → Ralph → log) starting from Step 1 (Identify the target). Skill-forge's own Step 5 approval gate still fires — gap-optimizer's approval is for *which gaps*; skill-forge's approval is for *which proposals to ship*.

3. After skill-forge commits each new skill, automatically re-run gap-optimizer Step 1–5 to refresh the queue and write a new `gap-log.md` entry showing what closed.

---

## Step 7 — Repeatable-loop contract

The closed loop only works if every run is idempotent and re-entrant. Hard rules:

1. **`candidate-queue.md` is overwritten, not appended.** It is canonical current-state. To see history, read `gap-log.md`.
2. **`gap-log.md` is append-only.** Never edit prior entries.
3. **Every commit to `skills/`** (i.e. a new skill landing) triggers a re-scan on next session boot.
4. **No skill is forged from a gap-optimizer recommendation without going through skill-forge's own approval gate.** Gap-optimizer ranks; skill-forge proposes; Michael approves twice — once for the gap, once for the build.
5. **Optimizer never edits an existing skill.** It only proposes new skills. Skill modifications go through `skill-health-monitor` (regression/merge proposals) or direct Edit by Michael.
6. **Capacity awareness.** If `gap-log.md` shows ≥3 unforged top-3 candidates from prior runs, the optimizer surfaces a "queue saturation" warning at the run header — meaning Michael is approving slowly, queue is growing faster than draining. The fix is forge cadence, not optimizer changes.

---

## Output format

See Step 5. The two persistent files this skill writes:

- `skills/gap-optimizer/candidate-queue.md` — current ranked queue (overwritten each run)
- `skills/gap-optimizer/gap-log.md` — append-only run history

Both committed to git on the run's working branch — never to main without Michael's explicit permission.

---

## AccentOS context

- Stack: Supabase `hsyjcrrazrzqngwkqsqa`, BigCommerce `store-cwqiwcjxes`, Cloudflare Pages, Anthropic API
- Project: AccentOS (the skill ecosystem and the operating system it powers)
- Paths: `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`)
- Vision spine: `MASTER.md` (875 lines, §14 narrative + Capability Ladder)
- Build plan: `BUILD_PLAN_CLAUDE.md` (Claude tasks) + `BUILD_PLAN_MICHAEL.md` (M-tasks Michael owns)
- Skill registry: `skills/_index.md` (auto-regenerable via `/vibe regenerate skill index`)
- Companion skills: `skill-forge` (consumer), `efficiency-monitor` (producer of emergent demand), `skill-health-monitor` (post-build audit)

---

## Anti-patterns

- **Never** build skills directly. Optimizer proposes; forge builds.
- **Never** skip the Step 5 approval gate. Even when Michael's prior message reads as broad approval, gap-optimizer always stops at the gate so the *which-gap* decision is explicit.
- **Never** append to `candidate-queue.md`. It is overwritten each run; that's how staleness gets killed.
- **Never** edit a prior `gap-log.md` entry. History is sacred — that's how cadence and closure get measured over time.
- **Never** invent vision capabilities. Every NEED row must cite a source (file:line or section). If you can't cite, mark `requires-clarification` and continue.
- **Never** double-count the same gap from multiple sources. Merge into one row; note both sources.
- **Never** rank a gap as buildable when a blocking M-task is unresolved. Buildability ≤ 2 if any blocker.
- **Never** propose a candidate whose name collides with an existing skill in `skills/_index.md`. Names must be new.
- **Never** auto-forge from the queue without skill-forge's own approval gate firing. Two gates, not one.
