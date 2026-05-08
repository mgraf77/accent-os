# MODULE_OWNERSHIP_MAP.md — Where Each Module Belongs

> Maps every top-level path in `mgraf77/accent-os` to its eventual home. Source of truth for any future repo split.
>
> Categories:
> - **STAY (accentos)** — Accent Lighting business app. Permanent home is this repo.
> - **→ agentos-core** — The agent operating system itself: communication framework, observability, session-handoff, modes, profiles.
> - **→ agentos-command-center** — Build orchestration: plans, prompts, build intelligence, decision logs, doc drift, autonomous mode.
> - **→ agentos-skills** — General-purpose, business-agnostic skills (skill-forge, codex-review, repo-scout, etc.) reusable across any agent project.
> - **HOLD** — Couples both worlds; do not move yet without de-coupling step.
>
> **Rule:** Every entry below must include a `decoupling-required` flag. If `yes`, the listed dependencies must be cut before the path can move.

**Last updated:** 2026-05-08

---

## Top-Level Files

| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `index.html` | **STAY** | n/a | The AccentOS app monolith. 735 KB / 7,169 lines. Permanent in accentos. |
| `patch_quote.js` | **STAY** | n/a | Quote Generator artifact; AL-specific. |
| `wrangler.toml` | **STAY** | n/a | Cloudflare Worker config for Anthropic proxy. Stays with accentos until proxy is generalized. |
| `module_modes.json` | **STAY** | n/a | AccentOS module enable/disable config. |
| `MODULE_MODES.md` | **STAY** | n/a | AccentOS feature-flag spec. |
| `KPI_CATALOG.md` | **STAY** | n/a | 30 KB of AL-specific KPIs. The *catalog format* could later become an agentos-command-center template, but the instance stays. |
| `MASTER.md` | **STAY** | yes (light) | Mixed: AL business sections (1, 6, 8, 9, 10) stay; agent methodology sections (2 operating model, 12 hard rules) could lift to agentos-command-center as templates later. |
| `BUILD_PLAN_MICHAEL.md` | **STAY** | n/a | AL roadmap from operator side. |
| `BUILD_PLAN_CLAUDE.md` | **STAY (instance)** + **→ agentos-command-center (pattern)** | yes | The 1,000-line autonomous queue with M-task content stays. The format / Rules-of-Engagement preamble is portable. |
| `BUILD_INTELLIGENCE.md` | **STAY (instance)** + **→ agentos-command-center (pattern)** | yes | 49 KB of AL-specific lessons stays. The lesson-capture format is portable. |
| `SESSION_LOG.md` | **STAY** | n/a | 68 KB AL-shipping log. Append-only history. |
| `PROMPT_LOG.md` | **STAY (instance)** + **→ agentos-command-center (pattern)** | yes | Append-only prompt history. Format is portable; instance stays. |
| `PROMPT_QUEUE.md` | **STAY (instance)** | n/a | Backed by `prompt-queue` skill in agentos-command-center. |
| `WORK_IN_PROGRESS.md` | **STAY (instance)** + **→ agentos-command-center (pattern)** | yes | Resume contract format is generic; current contents are AL. |
| `README.md` | **STAY** | n/a | Repo-specific. |
| `.gitignore` | **STAY** | n/a | |

---

## `.claude/` (Claude Code config)

| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `.claude/CLAUDE.md` | **STAY** | n/a | Project-specific auto-instructions referencing AL files (BUILD_PLAN_CLAUDE.md, KPI_CATALOG.md, etc.). The *step pattern* (vibe-speak boot, efficiency-monitor activation, status.sh run) is portable to a template. |
| `.claude/settings.json` | **STAY** | n/a | Project-specific (Stop hook path is hardcoded to `/home/user/accent-os/scripts/efficiency-aggregate.sh`). |
| `.claude/output-styles/` | **STAY** | n/a | Output style tweaks; stays project-local for now. |

---

## `worker/` (Cloudflare Worker proxy)

| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `worker/anthropic-proxy.js` | **STAY** | n/a | AL-deployed; one-of-one. Could later generalize to a shared agentos-core utility, but the deployed instance stays. |

---

## `sql/` (Database migrations)

| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `sql/M01_rls_tightening.sql` through `sql/M40_*.sql` | **STAY** (all 25) | n/a | Every migration is AL-domain (vendor scores, customers, pipeline, etc.). |

---

## `js/` (Extracted client modules)

| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `js/*.js` (37 files) | **STAY** (all) | n/a | All are AL business modules: vendor ops, deals, deliveries, customers, etc. |

---

## `scripts/`

| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `scripts/status.sh` | **→ agentos-command-center** (template) + **STAY** (instance) | yes | Status script that prints branch / WIP / next BUILD_PLAN item. Format is portable; current paths are AL. |
| `scripts/efficiency-aggregate.sh` | **→ agentos-core** (with `efficiency-monitor`) | yes | Aggregates efficiency-monitor flags. Hard-coded paths to `/home/user/accent-os/...`. Decouple: parameterize repo root. |
| `scripts/auto-categorize.js` | needs inspection (not read in this snapshot) | TBD | Defer classification to next pass. |

---

## `skills/` — Per-Skill Routing

> All 28 skills currently couple to AccentOS infra to some degree. **Zero are clean lifts.** See EXTRACTION_CANDIDATES.md for the de-coupling spec per skill.

### → agentos-core (framework — when ready)
| Skill | Decoupling required | Coupling notes |
|---|---|---|
| `vibe-speak` | yes (heavy) | SKILL.md hardcodes AccentOS proper nouns (BUILD_PLAN, M-task, track 5.7, v6.10.41). Profiles, modes, observation log, kpi-log, feedback-log are all generic. Needs: profile/mode/observation infra → agentos-core; the AL-specific calibration data stays. |
| `efficiency-monitor` | yes (path-only) | Hard paths to `/home/user/accent-os/...`. Aggregator script + observation logic is generic. |

### → agentos-command-center (build orchestration — when ready)
| Skill | Decoupling required | Coupling notes |
|---|---|---|
| `autonomous-mode` | yes (light) | Pattern is generic (long-running unattended build). References BUILD_PLAN paths. |
| `prompt-queue` | yes (light) | Pattern is generic. References PROMPT_QUEUE.md path. |
| `build-plan-status` | yes (medium) | References BUILD_PLAN_CLAUDE.md format; pattern of "sync plan from commits" is generic. |
| `doc-drift` | yes (medium) | Hardcodes AL doc list (SESSION_LOG, MASTER, BUILD_PLAN). Pattern is generic. |
| `decision-log` | yes (light) | Pattern is generic. |
| `bottleneck-finder` | yes (medium) | References BUILD_PLAN markers + M-task vocabulary. |
| `priority-articulation` | yes (medium) | References AL priorities; pattern is generic. |

### → agentos-skills (general-purpose marketplace — when ready)
| Skill | Decoupling required | Coupling notes |
|---|---|---|
| `skill-forge` | yes (light) | Builds custom skills from external research. AL examples in description; pattern is generic. |
| `repo-scout` | yes (light) | GitHub/MCP/skill repo intelligence. Generic. |
| `codex-review` | yes (light) | OpenAI Codex audit of recent work. Generic. |
| `community-skill-vet` | no | Pre-install audit of external skills. Already generic. |
| `skill-eval-suite` | no | Promptfoo-compatible eval YAML. Already generic. |
| `analysis-snapshot` | yes (light) | Pattern is generic; companions reference AL skills. |
| `schema-contract-tests` | yes (light) | dbt-style for Supabase. Generic with example schemas. |
| `supabase-sql-magic` | yes (medium) | Hardcodes AccentOS Supabase schema knowledge. Pattern generic; instance AL. |
| `table-eda` | yes (light) | Generic EDA on any Supabase table. References AL examples. |

### STAY (Accent-Lighting domain — never lift)
| Skill | Reason |
|---|---|
| `bc-business-review` | Weekly Accent Lighting business review (revenue, AOV, vendors). |
| `broken-link-rescue` | Accent Lighting product URL crawl. |
| `bulk-meta-description` | AL BC product SEO meta. |
| `gmc-feed-audit` | AL Google Merchant Center feed. |
| `kpi-data-audit` | KPI_CATALOG.md (AL-specific). |
| `rep-group-matchmaker` | M19 Accent Lighting rep_group fix. |
| `vendor-cascade` | AL vendor scoring traceability. |
| `vendor-clarity-test` | AL vendor scoring sanity check. |
| `vendor-onboard-checklist` | AL new-vendor verification. |
| `vendor-risk-register` | AL vendor risk classification. |

### Skills registry & shared infra
| Path | Owner / Future Home | Decoupling required | Notes |
|---|---|---|---|
| `skills/_index.md` | **STAY (registry)** + **→ agentos-skills (template)** | yes | The 230-line registry will fork: agentos-skills carries general entries, accentos keeps AL entries. Format is portable. |
| `skills/vibe-speak/profiles/` | **→ agentos-core** | yes | `michael.md` calibration is per-user, follows him; `_default.md`, `_active.md`, `_index.md` are framework. |
| `skills/vibe-speak/modes/` | **→ agentos-core** | no | All 9 mode files are generic. |
| `skills/vibe-speak/MODES.md`, `quickstart.md`, `scoring-matrix.md`, `skill-router.md` | **→ agentos-core** | no | Framework documentation. |
| `skills/vibe-speak/observation-log.md`, `feedback-log.md`, `kpi-log.md`, `session-handoff.md` | **STAY (instance)** + **→ agentos-core (schema)** | yes | Logs follow user; format is generic. |
| `skills/vibe-speak/sessions/` | **STAY (instance)** | n/a | Per-session journals tied to AL builds. |
| `skills/vibe-speak/benchmarks/`, `corpus/` | needs inspection | TBD | Defer classification. |
| `skills/efficiency-monitor/efficiency-log.md`, `session-end-summary.md`, `_aggregator.log` | **STAY (instance)** + **→ agentos-core (schema)** | yes | Same pattern as vibe-speak logs. |

---

## Quick-Reference Lift Tier

| Tier | Lift complexity | Examples |
|---|---|---|
| Tier 1 — STAY permanently | n/a | index.html, sql/, js/, KPI_CATALOG, vendor-* skills, gmc-feed-audit, BC skills |
| Tier 2 — Light de-couple, then lift | path parameterization, drop AL examples | community-skill-vet, skill-eval-suite, codex-review, repo-scout, autonomous-mode, prompt-queue, decision-log |
| Tier 3 — Medium de-couple | refactor doc paths, extract framework from instance | vibe-speak, efficiency-monitor, doc-drift, build-plan-status, bottleneck-finder, priority-articulation, supabase-sql-magic, table-eda, skill-forge |
| Tier 4 — Heavy de-couple OR keep as fork | rebuild as template + leave instance behind | MASTER.md, BUILD_PLAN_CLAUDE.md, BUILD_INTELLIGENCE.md (split methodology vs. AL content) |
| Tier 5 — Cannot move | n/a | wrangler.toml, .claude/settings.json (path-bound to repo root), worker/anthropic-proxy.js |
