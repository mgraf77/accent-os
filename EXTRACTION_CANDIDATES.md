# EXTRACTION_CANDIDATES.md — What Moves When

> Per-asset disposition for the (eventual) accentos / agentos-core / agentos-command-center / agentos-skills split. Companion to MODULE_OWNERSHIP_MAP.md — that file maps paths; this file ranks candidates by readiness and lists exact de-coupling steps.

**Last updated:** 2026-05-08

---

## Classification Legend

- **READY** — Can be lifted with a path-rename and a single decoupling commit.
- **NEEDS-DECOUPLE** — Has AL-specific references that must be parameterized or extracted before lifting.
- **FORK** — Both worlds need a copy: one as a template (in agentos-*), one as the AL instance (stays in accentos). Lift = create the template.
- **HOLD** — Do not move now. Coupling is too deep or value of moving is unclear.
- **STAY** — Permanent home is accentos. Never lift.

Each entry: target repo · classification · decouple-steps · risk-if-moved-now · order-rank (1 = lift first).

---

## A. agentos-core (framework — communication, observability, modes)

### A1. `vibe-speak` — Communication framework
- **Target:** agentos-core
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:**
  1. Extract framework files (MODES.md, modes/*.md, scoring-matrix.md, skill-router.md, quickstart.md) — already generic.
  2. SKILL.md description hardcodes AL proper nouns (BUILD_PLAN, M-task, track 5.7, v6.10.41, AccentOS) — replace with placeholder vocabulary or move AL examples to a `accentos-vocabulary-pack.md` companion file in accentos.
  3. profiles/_default.md is generic; profiles/michael.md is per-user calibration that *follows the user*, not the repo.
  4. observation-log.md / feedback-log.md / kpi-log.md / session-handoff.md — schema is generic; instance content stays in accentos.
- **Risk if moved now:** High. Every Claude Code session boots from this skill via .claude/CLAUDE.md. A broken move halts every future session.
- **Order rank:** 4 (move only after agentos-core has a real CI test for boot-from-cold).

### A2. `efficiency-monitor` — Always-on observer
- **Target:** agentos-core
- **Class:** NEEDS-DECOUPLE (light — paths only)
- **Decouple steps:**
  1. `scripts/efficiency-aggregate.sh` hard-codes `/home/user/accent-os/...` — parameterize to `${AGENTOS_ROOT:-$PWD}`.
  2. Stop hook in `.claude/settings.json` references the absolute path — switch to relative or env-var.
  3. efficiency-log.md / session-end-summary.md / _aggregator.log — instance stays, schema is generic.
- **Risk if moved now:** Medium. Stop hook must keep firing during the migration window.
- **Order rank:** 3.

### A3. Profiles infrastructure (`skills/vibe-speak/profiles/`)
- **Target:** agentos-core (framework) + accentos (michael.md instance)
- **Class:** FORK
- **Decouple steps:** Move `_default.md`, `_index.md` to agentos-core. `michael.md` and `_active.md` follow Michael across any repo (he uses agentos-core wherever he works), but the AL-tuned calibration data stays AL-only.
- **Risk if moved now:** Low.
- **Order rank:** 5.

### A4. Modes (`skills/vibe-speak/modes/`)
- **Target:** agentos-core
- **Class:** READY
- **Decouple steps:** None — already generic.
- **Risk if moved now:** Low; only risk is a missing import path in the SKILL.md after split.
- **Order rank:** 1 (lift early as a proof point).

---

## B. agentos-command-center (build orchestration — plans, prompts, intelligence)

### B1. `BUILD_PLAN_CLAUDE.md` Rules-of-Engagement format
- **Target:** agentos-command-center (template only); instance STAYS
- **Class:** FORK
- **Decouple steps:**
  1. Extract the top preamble (Rules of Engagement section) into a template file `agentos-command-center/templates/BUILD_PLAN.template.md`.
  2. Leave the M-task body in accentos.
- **Risk if moved now:** Low.
- **Order rank:** 7.

### B2. `BUILD_INTELLIGENCE.md` lesson-capture format
- **Target:** agentos-command-center (template only); instance STAYS
- **Class:** FORK
- **Decouple steps:**
  1. Extract the per-lesson schema (date, what-broke, lesson, prevention) into `agentos-command-center/templates/BUILD_INTELLIGENCE.template.md`.
  2. AL-specific lessons (49 KB of them) stay in accentos.
- **Risk if moved now:** Low.
- **Order rank:** 8.

### B3. `autonomous-mode` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:**
  1. Replace `BUILD_PLAN_CLAUDE.md` references with `${BUILD_PLAN_PATH}`.
  2. Generalize Michael's example phrases ("I'm going to lunch") — keep as defaults; allow override via profile.
- **Risk if moved now:** Low.
- **Order rank:** 6.

### B4. `prompt-queue` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** Parameterize PROMPT_QUEUE.md path.
- **Risk if moved now:** Low.
- **Order rank:** 6.

### B5. `build-plan-status` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:**
  1. Replace AL doc list (BUILD_PLAN_CLAUDE.md, SESSION_LOG.md) with configurable doc registry.
  2. Generalize commit-pattern matchers (currently assume `[x] M##` markers).
- **Risk if moved now:** Medium — actively used by Michael.
- **Order rank:** 9.

### B6. `doc-drift` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:**
  1. Hardcoded doc list (SESSION_LOG, MASTER, BUILD_PLAN, BUILD_INTELLIGENCE) → configurable.
  2. Drift heuristics are generic; the doc list is not.
- **Risk if moved now:** Medium.
- **Order rank:** 10.

### B7. `decision-log` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** Replace AL examples with neutral examples.
- **Risk if moved now:** Low.
- **Order rank:** 5.

### B8. `bottleneck-finder` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:** M-task vocabulary → generic "task" vocabulary.
- **Risk if moved now:** Low (used infrequently).
- **Order rank:** 11.

### B9. `priority-articulation` skill
- **Target:** agentos-command-center
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:** AL priority examples → neutral examples.
- **Risk if moved now:** Low.
- **Order rank:** 12.

### B10. `scripts/status.sh` (template)
- **Target:** agentos-command-center (template) + STAY (instance)
- **Class:** FORK
- **Decouple steps:** The script's structure is portable; the file paths are AL.
- **Risk if moved now:** Low.
- **Order rank:** 7.

### B11. `PROMPT_LOG.md` schema
- **Target:** agentos-command-center (schema only); instance STAYS
- **Class:** FORK
- **Decouple steps:** Document the append-only prompt-log format as a template; instance stays.
- **Risk if moved now:** Low.
- **Order rank:** 13.

---

## C. agentos-skills (general-purpose marketplace)

### C1. `community-skill-vet`
- **Target:** agentos-skills
- **Class:** READY
- **Decouple steps:** None.
- **Risk if moved now:** Low.
- **Order rank:** 1.

### C2. `skill-eval-suite`
- **Target:** agentos-skills
- **Class:** READY
- **Decouple steps:** None.
- **Risk if moved now:** Low.
- **Order rank:** 1.

### C3. `codex-review`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** AL examples in description → neutral. The audit logic is generic.
- **Risk if moved now:** Low.
- **Order rank:** 2.

### C4. `repo-scout`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** AL examples → neutral.
- **Risk if moved now:** Low.
- **Order rank:** 2.

### C5. `skill-forge`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:**
  1. Output paths assume `skills/<name>/`. Generic.
  2. AL examples and companion-skill references → generic.
  3. Logs to BUILD_INTELLIGENCE — make optional.
- **Risk if moved now:** Medium — central to Michael's tool-building flow.
- **Order rank:** 3.

### C6. `analysis-snapshot`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** AL examples → neutral.
- **Risk if moved now:** Low.
- **Order rank:** 2.

### C7. `schema-contract-tests`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** AL example schemas → generic example schemas. dbt-style logic is portable.
- **Risk if moved now:** Low.
- **Order rank:** 2.

### C8. `supabase-sql-magic`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (medium)
- **Decouple steps:**
  1. Hardcoded AccentOS Supabase schema knowledge → injectable schema-context.
  2. NL→SQL generator is generic; the catalog is AL.
- **Risk if moved now:** Medium.
- **Order rank:** 4.

### C9. `table-eda`
- **Target:** agentos-skills
- **Class:** NEEDS-DECOUPLE (light)
- **Decouple steps:** AL examples → neutral.
- **Risk if moved now:** Low.
- **Order rank:** 2.

---

## D. STAY (Accent Lighting — never lift)

| Asset | Reason |
|---|---|
| `index.html` (735 KB monolith) | App body; AL UI |
| `js/*.js` (37 modules) | All AL business modules |
| `sql/*.sql` (25 migrations) | AL Supabase schema |
| `worker/anthropic-proxy.js` + `wrangler.toml` | Deployed AL infra |
| `KPI_CATALOG.md` | 30 KB AL KPIs |
| `MASTER.md` (sections 1, 3, 4, 6, 7, 8, 9, 10, 13, 14, 15) | AL business architecture |
| `BUILD_PLAN_MICHAEL.md` | AL operator roadmap |
| `MODULE_MODES.md`, `module_modes.json` | AL feature flags |
| `SESSION_LOG.md` | 68 KB AL ship log |
| `WORK_IN_PROGRESS.md` (instance), `PROMPT_QUEUE.md` (instance), `PROMPT_LOG.md` (instance) | AL session state |
| `patch_quote.js` | AL Quote Generator artifact |
| All 10 vendor / BC / GMC skills (`bc-business-review`, `broken-link-rescue`, `bulk-meta-description`, `gmc-feed-audit`, `kpi-data-audit`, `rep-group-matchmaker`, `vendor-cascade`, `vendor-clarity-test`, `vendor-onboard-checklist`, `vendor-risk-register`) | AL business-domain |

---

## E. HOLD (do not classify yet)

| Asset | Reason for hold |
|---|---|
| `scripts/auto-categorize.js` | Not inspected in this snapshot pass. |
| `skills/vibe-speak/benchmarks/` | Not inspected. |
| `skills/vibe-speak/corpus/` | Not inspected. |
| `.claude/output-styles/` | Not inspected. |

These should be inspected and classified in the *next* governance pass before any restructuring step touches `skills/vibe-speak/` or `scripts/`.

---

## Aggregate Lift Order

If/when restructuring is approved, lift in this order to minimize blast radius:

1. **Wave 1 (READY, low risk):** `community-skill-vet`, `skill-eval-suite`, `vibe-speak/modes/`. Prove the pattern.
2. **Wave 2 (light decouple):** `codex-review`, `repo-scout`, `analysis-snapshot`, `schema-contract-tests`, `table-eda`, `decision-log`, `autonomous-mode`, `prompt-queue`.
3. **Wave 3 (medium decouple):** `efficiency-monitor`, `skill-forge`, `vibe-speak` (whole framework), `supabase-sql-magic`, `build-plan-status`, `doc-drift`, `bottleneck-finder`, `priority-articulation`.
4. **Wave 4 (templates):** `BUILD_PLAN_CLAUDE.md`, `BUILD_INTELLIGENCE.md`, `scripts/status.sh`, `PROMPT_LOG.md`, MASTER.md methodology sections.
5. **Wave 5 (post-classification):** Items currently in HOLD (after they're inspected).

Each wave commits per-skill to a dedicated branch on the destination repo, then the source path is deleted from accentos in a *separate* commit on a follow-up branch in this repo. **Never delete from accentos before destination has been verified working.**
