# HANDOFF FOR GOVERNANCE RESTRUCTURING

**Date:** 2026-05-08  
**Prepared by:** Claude (session `claude/build-ddv-evaluator-nj468`)  
**Purpose:** Map the current AccentOS codebase for the incoming governance/architecture restructuring. Not prescriptive — descriptive of what's here and where the seams are.

---

## Systems touched this session

| System | What changed | Risk to restructure |
|---|---|---|
| `skills/meta/ddv-evaluator/` | Created — new meta-skill framework | Low — documentation only, no app coupling |
| `skills/_index.md` | Added one entry | Low |
| `meta-evaluations/ddv-log.md` | Created — new top-level directory | Low — documentation only |

No app code, SQL, or infrastructure was changed in this session.

---

## Full system map (for restructuring decisions)

### Layer 1: Application (AccentOS web app)

**Root:** `index.html` (~4000+ lines), `js/*.js` (35 module files)  
**Hosting:** Cloudflare Pages (auto-deploy from `main`)  
**Backend:** Supabase (PostgreSQL + Auth + RLS)  
**AI proxy:** Cloudflare Worker (`worker/anthropic-proxy.js`)  

**Coupling:** All 35 JS modules are loaded via `<script src>` in `index.html`. They share global arrays (`CUSTOMERS`, `INVENTORY`, etc.) and a global nav function `goTo()`. This is the tightest coupling zone in the codebase.

**Restructure note:** Splitting the app into separate repos or packages requires resolving the global-sharing pattern first. Recommended approach: introduce a `MODULE_REGISTRY` array (noted in BUILD_INTELLIGENCE.md) before splitting.

---

### Layer 2: Infrastructure

**Cloudflare Worker:** `worker/anthropic-proxy.js` + `wrangler.toml`  
**Function:** Proxies Anthropic API calls to avoid browser CORS restrictions.  
**Dependencies:** Cloudflare account (Michael's), `ANTHROPIC_API_KEY` secret set in Cloudflare dashboard.  
**Coupling:** `index.html` hardcodes the worker URL. If the worker moves, update ~4 fetch calls in `index.html`.

**Restructure note:** The worker is a thin proxy. It belongs in AccentOS or a shared infrastructure layer — not a skill repo.

---

### Layer 3: Skills (`skills/`)

32 skills across multiple domains. No skill has a runtime dependency on any other skill — they are all instruction documents (SKILL.md + references), not executable code.

**Natural groupings for future separation:**

| Proposed group | Skills |
|---|---|
| Data / Supabase | `supabase-sql-magic`, `table-eda`, `schema-contract-tests`, `analysis-snapshot` |
| Vendor intelligence | `vendor-cascade`, `vendor-clarity-test`, `vendor-risk-register`, `vendor-onboard-checklist`, `rep-group-matchmaker` |
| Business ops | `bc-business-review`, `gmc-feed-audit`, `bulk-meta-description`, `broken-link-rescue`, `kpi-data-audit` |
| Build orchestration | `skill-forge`, `skill-eval-suite`, `codex-review`, `repo-scout`, `community-skill-vet` |
| Session / meta | `efficiency-monitor`, `vibe-speak`, `autonomous-mode`, `prompt-queue`, `build-plan-status`, `doc-drift`, `decision-log`, `bottleneck-finder`, `priority-articulation` |
| **Evaluation (new)** | `ddv-evaluator` (this session) |

**Restructure note:** Skills are pure documentation — they can be moved to a separate repo with no code changes. The only coupling is `skills/_index.md` (referenced in `CLAUDE.md`) and companion-skill cross-references within individual SKILL.md files.

---

### Layer 4: Meta-evaluation (`meta-evaluations/`)

**Created this session.** Contains `ddv-log.md` — append-only evaluation history.

**Coupling:** Referenced by `skills/meta/ddv-evaluator/` only. No app coupling. No SQL coupling.

**Restructure note:** If skills move to a separate repo, `meta-evaluations/` should move with them (it's the evaluation memory layer for the skills system). If AccentOS becomes a monorepo with packages, it's a top-level package.

---

### Layer 5: Planning and documentation

`BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `SESSION_LOG.md`, `MASTER.md`, `WORK_IN_PROGRESS.md`, `BUILD_INTELLIGENCE.md`, `PROMPT_LOG.md`, `PROMPT_QUEUE.md`, `KPI_CATALOG.md`, `MODULE_MODES.md`

**Coupling:** Referenced by `CLAUDE.md` auto-execute instructions. Claude reads these at session start.

**Restructure note:** These are AccentOS-specific. They should stay with AccentOS or the Command Center, depending on how governance decides to map "project memory."

---

## Areas of high coupling

| Zone | Coupling description | Risk |
|---|---|---|
| `index.html` ↔ `js/*.js` | Global variable sharing (`CUSTOMERS`, `INVENTORY`, etc.) + `goTo()` nav function | HIGH — splitting requires global refactor |
| `index.html` ↔ Worker URL | Hardcoded `accentos-anthropic-proxy.mgraf77.workers.dev` in ~4 places | LOW — string replace |
| `CLAUDE.md` ↔ file paths | Auto-execute reads specific file paths (`WORK_IN_PROGRESS.md`, `skills/_index.md`, etc.) | MEDIUM — path changes break boot |
| Skills ↔ `_index.md` | Each skill has a companion entry in `_index.md` | LOW — both move together |
| `efficiency-monitor` ↔ Stop hook | `.claude/settings.json` triggers `efficiency-aggregate.sh` at session end | MEDIUM — hook must survive repo moves |

---

## Risky architectural zones

### 1. Global variable pattern in `js/`

35 module files assume globals exist (set by other modules loaded before them). Load order in `index.html` matters. Adding a 36th module requires knowing the dependency order. This is the primary technical debt risk.

**Does NOT block governance restructuring, but does block any future code splitting.**

### 2. `CLAUDE.md` auto-execute chain

`CLAUDE.md` reads 8–10 specific files on every session start. If any file moves or is renamed, the boot chain silently fails (no error — just skips). This is a hidden fragility.

**Governance restructuring should update `CLAUDE.md` paths last, after repo decisions are finalized.**

### 3. Worker proxy auth model

The Anthropic API key lives as a Cloudflare secret. If the worker moves to a different Cloudflare account or project, the secret must be re-set. No code change needed, but a coordination step.

---

## Incomplete abstractions (v1 tech debt)

| Item | Description | Resolution path |
|---|---|---|
| `MODULE_REGISTRY` | Proposed in BUILD_INTELLIGENCE.md but not yet implemented. 4 manual edits per new module. | Implement when next module is added or before splitting app |
| `goTo()` callback | `setTimeout(80)` pattern used 3 places for post-nav renders. Fragile. | Refactor `goTo()` to accept callback — medium-effort, high-payoff |
| Quote `notes` dual-use | `quotes.notes` stores JSON-stringified extras (contact/type/sqft/budget). | Extend schema with first-class columns OR add `quote_attributes` table |
| DDV effort weights | Intuition-calibrated. Need 10 real evaluations to validate. | Auto-resolves with usage |

---

## Duplicate systems

None currently. The DDV Evaluator is the first meta-evaluation system — it does not duplicate `skill-eval-suite` (which generates test YAMLs) or `efficiency-monitor` (which tracks session inefficiency). They are complementary.

One potential future overlap: if `skill-eval-suite` is extended to score optimization passes, it may partially overlap with DDV's prompt/optimization-pass evaluation. Watch for this.

---

## Recommended cleanup opportunities (post-restructure)

1. **`MODULE_REGISTRY` implementation** — 30 LOC change that removes 4 manual edits per new module. High ROI, zero user impact.
2. **`goTo()` callback refactor** — 20 LOC change that removes the fragile `setTimeout(80)` pattern used 3 places.
3. **DDV → skill-forge Ralph loop wiring** — 10-line change to `skills/skill-forge/SKILL.md`. High strategic value.
4. **`quote_attributes` table** — eliminates the dual-use of `quotes.notes`. Requires one M-task SQL and minor JS changes.

---

## What likely belongs where (preliminary)

| System | Likely home |
|---|---|
| `index.html` + `js/` + SQL + `worker/` | AccentOS (product app) |
| `skills/` + `meta-evaluations/` + `skills/_index.md` | Skills repo OR AccentOS (depends on governance scope) |
| `BUILD_PLAN_*.md`, `SESSION_LOG.md`, `MASTER.md` | AccentOS OR Command Center (project memory layer) |
| `CLAUDE.md`, `.claude/settings.json` | AccentOS (Claude-specific config) — follows wherever the primary repo lives |
| `scripts/` | AccentOS (session automation hooks) |
| `KPI_CATALOG.md` | AccentOS OR Command Center (business intelligence layer) |
| DDV Evaluator | Skills repo (meta-evaluation of skills) OR AgentOS (if evaluation is a cross-system concern) |

**Governance decision needed:** Is the skills system AccentOS-specific or ecosystem-wide? If ecosystem-wide, `skills/` should move to a shared repo and `skills/_index.md` becomes a cross-product registry. If AccentOS-specific, skills stay in AccentOS and `CLAUDE.md` paths don't change.

---

## Clean resumability confirmation

- All work is committed and pushed
- Working tree is clean
- No half-finished code exists anywhere in the repo
- The pre-existing Worker 400 bug is documented in `KNOWN_ISSUES.md` with exact fix steps
- `WORK_IN_PROGRESS.md` reflects accurate state
- The DDV branch is safe to defer, merge, or re-base without risk to `main`
