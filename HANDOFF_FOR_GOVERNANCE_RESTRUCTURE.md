# HANDOFF — for upcoming AccentOS governance / architecture restructure

> What the next-session restructurer needs to know. Written 2026-05-08 at the
> close of a session that grew the skill ecosystem 28 → 51 (82%) across 5
> closed-loop cycles.

---

## What this session touched

### Files created (NEW)

| Path | Purpose | Migration consideration |
|------|---------|--------------------------|
| `GAP_ANALYSIS.md` | Exec gap analysis + closed-loop architecture diagram | AccentOS doc, root-level |
| `SESSION_SUMMARY.md` | This session's work record | AccentOS doc, root-level |
| `CURRENT_STATE.md` | Operational snapshot | AccentOS doc, root-level |
| `NEXT_STEPS.md` | Post-restructure work plan | AccentOS doc, root-level |
| `KNOWN_ISSUES.md` | Open deferrals + risks | AccentOS doc, root-level |
| `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md` | This file | AccentOS doc, root-level |
| `skills/gap-optimizer/` | Closed-loop optimizer (skill + 4 references + 2 ledgers) | **Skills repo** |
| `skills/skill-health-monitor/` | Ecosystem auditor (skill + 3 ledgers + 1 audit report) | **Skills repo** |
| `skills/[15 gap-run-002 skills]/` | Customer/agentic + integration + meta-infra | **Skills repo** |
| `skills/[3 gap-run-004 skills]/` | mtask-tracker + registry-validator + phrase-miner | **Skills repo** |
| `skills/[3 gap-run-005 skills]/` | ralph-loop-runner + skill-eval-runner + skill-deprecator | **Skills repo** |

### Files modified (existing)

| Path | What changed | Migration consideration |
|------|--------------|--------------------------|
| `skills/_index.md` | 23 new entries inserted at alphabetical positions | **Skills repo**; auto-regenerable but currently hand-tuned |
| `skills/skill-forge/SKILL.md` | Step 0 + Step 9 lightly amended for gap-optimizer integration | **Skills repo** |
| `skills/efficiency-monitor/SKILL.md` | Step 0 surfaces gap-optimizer top-3; description fix (added "AccentOS") | **Skills repo** |
| `skills/email-drafter/SKILL.md` | Auto-fixed "future skill" annotations | **Skills repo** |
| `skills/windward-bridge/SKILL.md` | Fixed broken `.sh` ref → `.md` reference + future-artifact note | **Skills repo** |
| `.claude/CLAUDE.md` | Boot step 1.k added (gap-optimizer queue consultation) | **AgentOS** (claude-code config) |
| `MASTER.md` | Capability Ladder + new "Closed-loop skill ecosystem" subsection | AccentOS doc |
| `BUILD_PLAN_MICHAEL.md` | Added M42–M45 | AccentOS doc |
| `BUILD_PLAN_CLAUDE.md` | Added Track 7 (downstream of M42-M45) | AccentOS doc |
| `PROMPT_LOG.md` / `SESSION_LOG.md` / `WORK_IN_PROGRESS.md` | Full session narrative | AccentOS docs |

---

## Repo separation thinking

The user mentioned 4 potential repos: **AccentOS**, **AgentOS**, **Skills repo**, **Command Center**. Here's how this session's work likely maps:

### Skills repo (most of this session's output)

**Should move:**
- The entire `skills/` directory (51 skills + their references + ledgers)
- `skills/_index.md` (the registry vibe-speak Step 23 reads)
- `skills/skill-forge/references/skill-template.md` (the canonical template)
- `skills/gap-optimizer/references/forge-briefing.md` + `optimizer-briefing.md` (the agent briefings)
- `skills/skill-health-monitor/health-report-*.md` (audit history)
- `skills/skill-health-monitor/{applied-fixes,deprecated-log,ignored}.md` (append-only ledgers)

**Schema-proposal docs that may need to migrate alongside:**
- Each `skills/[name]/references/proposed-schema.md` (these document expected Supabase tables; could either go to Skills repo as documentation or AccentOS repo where the actual SQL lives)

**Recommended:** keep Skills as a self-contained repo with its own `_index.md`, briefings, and ledgers. Treat it as a versioned dependency of AccentOS + Command Center.

### AgentOS (claude-code config)

**Should move:**
- `.claude/CLAUDE.md` — the AUTO-EXECUTE boot sequence
- `.claude/settings.json` — hooks (efficiency-aggregate, stop-hook-git-check)
- `.claude/scripts/` if any

**Why:** these are agent-runtime configurations that don't depend on AccentOS-specific data; they orchestrate Claude Code's behavior.

**Coupling concern:** the boot sequence in CLAUDE.md hard-codes paths like `skills/efficiency-monitor/session-end-summary.md`. If Skills moves, those paths need to be parameterized via env vars or convention.

### AccentOS (the operating system + its data)

**Should stay:**
- All UI modules (`index.html`, `js/`, `css/`)
- All schema files (`sql/`)
- All vision/build docs (`MASTER.md`, `BUILD_PLAN_*`, `KPI_CATALOG.md`, `MODULE_MODES.md`, `BUILD_INTELLIGENCE.md`)
- Session ledgers (`PROMPT_LOG.md`, `SESSION_LOG.md`, `WORK_IN_PROGRESS.md`) — these are session-of-record for AccentOS work
- This session's stabilization docs (`SESSION_SUMMARY.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md`, `KNOWN_ISSUES.md`, `GAP_ANALYSIS.md`)

### Command Center (UI)

**Currently:** the existing Daily Command Center UI lives inside the AccentOS index.html. None of this session's work touched it.

**Future:** if Command Center splits into its own repo, the consumers of skills (e.g. `daily-brief-composer` outputs paste-ready Markdown for the Daily Command Center UI) become cross-repo contracts. Define these as JSON schemas, not free-text Markdown, when the split happens.

---

## Cross-cutting dependencies

### vibe-speak Step 23 router → `skills/_index.md`
- vibe-speak reads `_index.md` at session boot for skill discovery
- If `_index.md` moves or is regenerated, vibe-speak's Step 23 needs the new path / format
- Currently `_index.md` is hand-edited (this session inserted 23 entries); auto-regeneration via `/vibe regenerate skill index` exists but hasn't been used

### `.claude/CLAUDE.md` boot → multiple skill files
- Boot reads `skills/efficiency-monitor/session-end-summary.md`
- Boot reads `skills/gap-optimizer/candidate-queue.md` and `gap-log.md`
- Boot reads `skills/efficiency-monitor/skill-candidates.md`
- All paths hardcoded — restructure must update or parameterize

### gap-optimizer → vision artifacts
- `gap-optimizer/SKILL.md` Step 0 reads MASTER.md, BUILD_PLAN_*, KPI_CATALOG, _index.md
- Cross-repo if Skills splits from AccentOS
- Either Skills repo gets symlink/clone access OR vision artifacts get copied into Skills repo (likely worse)

### action-queue → executor skills (registry coupling)
- `action-queue/references/executor-registry.md` lists 8 action_types bound to specific executor skills (email-drafter, bc-rest-bridge, klaviyo-flows, coop-claim-drafter, alert-router, churn-predictor, etc.)
- All executors are in the same Skills repo today; would stay co-located in any reasonable split
- Drift catcher (`registry-validator`) lives in same Skills repo
- Low restructure risk if Skills stays a single repo

### skill-eval-runner ↔ skill-eval-suite
- Eval-suite authors `eval-cases.yaml`; eval-runner runs them
- Both in same Skills repo today
- run-history.csv lives at `skills/skill-eval-runner/references/run-history.csv` — preserve this (it's the only persistent state for skill-performance-tracker's quality_signal)

### skill-performance-tracker → efficiency-monitor + skill-eval-runner
- Reads `efficiency-monitor/efficiency-log.md` + `skill-eval-runner/references/run-history.csv`
- All same Skills repo
- skill-deprecator reads skill-performance-tracker output + skill-health-monitor findings — same Skills repo

---

## Architectural assumptions made this session

1. **All skills are markdown contracts.** SKILL.md files describe behavior; references/ provide supporting docs. There is no "compiled" skill or runtime artifact.
2. **Skills are invoked via natural language match (vibe-speak Step 23) or slash commands (`/gap`, `/skill-health`, etc.).** No skill registry beyond `_index.md`.
3. **BLOCKED stub mode is shipped state.** A skill ships with a Step-0 gate that returns helpful unblock-message stubs until its M-task closes. No skill is "incomplete" — it's "waiting".
4. **`candidate-queue.md` is canonical (overwritten); `gap-log.md` is append-only history.** The optimizer's contract.
5. **Two-gate forge discipline.** Gap-level approval (gap-optimizer's gate) + structural approval (skill-forge's gate). Wave-2 parallel forge agents enforced this even under broad "build all" approval.
6. **Subagent token-efficiency batching.** Wave 1 (15 agents × 1 skill), Wave 2 (5 agents × 3 skills × 3 passes), Wave 4 (3 agents × 1 skill + Ralph inline), Wave 5 (5 mixed agents). Pattern: batch when individual tasks are small enough; isolate when they're large.
7. **Cross-skill contracts are documented in references/proposed-schema.md and references/executor-registry.md.** No code-level enforcement; drift is caught by registry-validator.

---

## Areas of high coupling (restructure with care)

1. **`skills/_index.md` ↔ vibe-speak Step 23 ↔ every skill's frontmatter.** Three-way contract; restructure must preserve all three or break skill discovery silently.
2. **`.claude/CLAUDE.md` boot ↔ specific skill files.** Hardcoded paths; AgentOS/Skills split must parameterize.
3. **action-queue executor-registry ↔ 5+ executor skills.** Registry-validator catches drift; restructure must preserve the registry file's path or update validator.
4. **gap-optimizer ↔ MASTER.md / BUILD_PLAN_* / KPI_CATALOG.** Cross-repo read dependency if Skills splits from AccentOS.
5. **skill-eval-suite ↔ skill-eval-runner ↔ skill-performance-tracker ↔ skill-deprecator.** A four-skill chain; all in Skills repo today; preserve the chain's file paths.

---

## Risky architectural zones

1. **The hand-edits to `skills/_index.md`** vs the auto-regenerator. If the regenerator runs, hand-tuned entries (with "(NEW)" annotations or extended trigger phrases) may be overwritten. Reconcile this before letting the regenerator run.

2. **M-task ID stability.** 15+ skills cite specific M-task IDs (M03, M04, M06, M09, M10, M42, etc.) in their Step-0 BLOCKED gates. If governance restructures the M-task numbering, those gates break. Either preserve numbering OR run `mtask-tracker` first to identify all citations.

3. **Companion-link graph (~150+ inter-skill refs).** Restructure that splits skills across repos must preserve the reachable graph. `/skill-health` first thing post-restructure to detect drift.

4. **Stub-mode contract.** 7 skills ship as BLOCKED stubs. Their unblock conditions (env vars, table existence) are documented in Step 0. If restructure changes how env vars are managed (e.g. moves to AgentOS), those gates need updating.

5. **`.claude/settings.json` hooks.** Stop hook + efficiency-aggregate hook are AgentOS-flavored but live in this repo. Restructure must move them with care to avoid losing the "stop = aggregate efficiency log" trigger that drives skill-promotion candidates.

---

## Incomplete abstractions (do NOT extract during restructure)

These look like they could be generalized but aren't ready:

1. **The "BLOCKED stub" pattern.** Every blocked skill has its own Step-0 gate code. Could be abstracted into a reusable BLOCKED-gate component. **Don't extract yet** — only 7 skills use it; abstraction premature.

2. **The "approval gate" pattern.** gap-optimizer + skill-forge + skill-health-monitor + skill-deprecator all have "═══ APPROVAL GATE ═══" sections with similar shapes. Could be a reusable Markdown template. **Don't extract yet** — each gate has its own reply protocol; collapsing them loses fidelity.

3. **The "append-only ledger" pattern.** gap-log.md, applied-fixes.md, deprecated-log.md, future-builds.md, kpi-log.md, observation-log.md, gotcha-log.md all follow the same shape. Could be unified. **Don't extract yet** — schemas differ; entry types differ; consolidation would create coupling.

4. **The "shared briefing file" pattern.** forge-briefing.md + optimizer-briefing.md proved efficient for parallel agents. Could become a generic "agent briefing" framework. **Don't extract yet** — only used twice; pattern not yet load-tested.

5. **The "executor registry" pattern.** Could generalize beyond action-queue → bc-rest-bridge / klaviyo-flows / etc. Could be the foundation for a typed dispatch system. **Don't extract yet** — single use case; YAGNI applies.

---

## Duplicate systems (note for cleanup, but DON'T cleanup now)

1. **gap-optimizer's queue scoring** vs **next-action-recommender's leverage scoring** vs **mtask-tracker's leverage formula.** Three different "rank by leverage" implementations. Different concerns (gaps / actions / M-tasks) but similar math. Restructure could unify or keep separate — defer.

2. **skill-health-monitor structural audit** vs **registry-validator contract audit** vs **phrase-miner trigger audit.** Three audit-style skills. Each scoped to a different surface. Don't merge.

3. **efficiency-monitor (in-session pattern detection)** vs **skill-performance-tracker (cross-session metrics)** vs **skill-eval-runner (eval pass-rate)** vs **gap-optimizer (gap detection).** Four signal-producers feeding skill-deprecator. Some overlap (e.g. skill-bypass in efficiency-monitor + low-invocation in skill-performance-tracker). Worth aligning the data flow once tracker has produced 2+ weeks of history.

---

## Cleanup opportunities (defer until post-restructure)

1. **Re-Ralph the 3 Wave-5 skills** — see `KNOWN_ISSUES.md` item 1
2. **Generate eval-cases.yaml for the 5 missing meta-infra skills** — see `KNOWN_ISSUES.md` item 2
3. **Run `skill-eval-runner run-all`** for first time — establishes baseline
4. **Consider auto-regenerating `skills/_index.md`** vs hand-tuning — see KNOWN_ISSUES item 12
5. **Add to `ignored.md`** the 9 manually-vetted near-duplicate-scope pairs so audit doesn't re-flag them — see KNOWN_ISSUES item 15

---

## Summary of safe operational state

- **Tree clean** on `claude/accentos-gap-analysis-Dcvcf`. Synced with origin.
- **51 skills** in `skills/`, all structurally validated.
- **18 skills with eval coverage** (159 Promptfoo cases).
- **gap-optimizer queue at GREEN** — top-tier and sub-threshold drained; 2 externally-gated residue items.
- **Skill-health audit GREEN** — 0 ERROR, 0 mismatch findings; 3 intentional WARNs in `ignored.md`.
- **Closed loop verified across 5 cycles in 30h.** Drain-rate ≈ proposal-rate. Pattern is operationally stable.
- **No live system changes** — BC, Supabase, Cloudflare, Anthropic API, UI all unchanged from pre-session state.
- **All session work is committed and pushed.** Branch is recoverable.

The repo is in a clean resumable state. Ready for governance/architecture restructuring.
