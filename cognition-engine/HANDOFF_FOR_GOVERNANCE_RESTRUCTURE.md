# Handoff for Governance Restructuring
> Author: Claude Code | Date: 2026-05-08
> Purpose: Clean handoff document for the upcoming AccentOS ecosystem governance restructure

---

## 1. SYSTEMS TOUCHED THIS SESSION

Only `cognition-engine/` documents were created. No application code was modified.

**Files created:**
```
cognition-engine/ARCHITECTURE.md
cognition-engine/GAP_MATRIX.md
cognition-engine/ONTOLOGY.md
cognition-engine/MEMORY_SYSTEM.md
cognition-engine/AGENT_HIERARCHY.md
cognition-engine/BUILD_PLAN.md
cognition-engine/ENTROPY_PREVENTION.md
cognition-engine/RECOMMENDATIONS.md
cognition-engine/SESSION_SUMMARY.md
cognition-engine/CURRENT_STATE.md
cognition-engine/NEXT_STEPS.md
cognition-engine/KNOWN_ISSUES.md
cognition-engine/HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md  ← this file
```

**Files modified:**
```
PROMPT_LOG.md  — session entry added
WORK_IN_PROGRESS.md  — updated to reflect session completion
```

**No JS modules modified. No SQL added. No index.html touched.**

---

## 2. DEPENDENCIES INTRODUCED

None. The `cognition-engine/` directory contains only Markdown specification documents. Zero runtime dependencies. Zero imports. Zero coupling to existing code.

The documents reference:
- Existing Supabase tables (by name, not import)
- Existing JS modules (by filename convention)
- Planned future tables (by SQL design, not yet created)

These are forward references in documentation, not actual code dependencies.

---

## 3. ARCHITECTURAL ASSUMPTIONS MADE

The architecture documents make the following assumptions that governance restructuring should validate or override:

| Assumption | Location | Confidence | Governance Question |
|---|---|---|---|
| AccentOS stays as a single monolithic SPA | ARCHITECTURE.md §12 | High — locked per MASTER.md | Does governance split it? |
| `cognition.js` lives in `js/` alongside module files | AGENT_HIERARCHY.md §2 | Medium | Or does it become a separate service/repo? |
| pgvector via Supabase (not separate vector DB) | MEMORY_SYSTEM.md §2.3 | High | Any reason to use Pinecone/Weaviate? |
| Cloudflare Workers for action execution layer | ARCHITECTURE.md §8 | Medium | Or a dedicated Node service? |
| $0 added cost law holds | ARCHITECTURE.md §12 | High — per MASTER.md | Does governance change the budget model? |
| Vanilla JS (no framework) remains | ARCHITECTURE.md §12 | High — locked per MASTER.md | Does governance introduce React/Next? |
| `system_events` table is the event bus (not Kafka/Redis) | ARCHITECTURE.md §5.3 | High | Overkill at this scale; confirm |
| Four-role pattern (not agent framework) | AGENT_HIERARCHY.md §1 | High | Confirmed; do not introduce LangChain |

---

## 4. WHERE THINGS BELONG — POST RESTRUCTURE

### AccentOS (current repo — `mgraf77/accent-os`)
- All 30+ operational modules (vendors, customers, pipeline, inventory, etc.)
- SQL migrations (M01–M40+)
- Module-level JavaScript files (`js/`)
- Supabase integration + Cloudflare Worker proxy
- `skills/` directory (Claude Code meta-skills for this repo)
- `cognition-engine/` documents (if they stay here) OR extracted to AgentOS

### AgentOS (proposed — new repo or subfolder)
If the governance restructuring creates an AgentOS layer, it would own:
- `js/cognition.js` — the four-role orchestration module
- `procedures` table and seed data
- `pending_actions` table and UI
- `system_events` instrumentation utilities
- `EVENT_TYPES` registry
- `PROMPT_REGISTRY`

**Recommendation:** Don't create a separate repo yet. Start by adding `js/cognition.js` to AccentOS. Extract to AgentOS only when the orchestration layer is stable enough to define a clean API boundary.

### Skills Repo (proposed — or stay in `skills/`)
The `skills/` directory currently lives in `accent-os`. If AccentOS is the only consumer, it stays. If skills are shared across repos (AccentOS + AgentOS + future systems), extract to a dedicated `claude-skills` repo.

**Current skills:** vibe-speak, efficiency-monitor, skill-forge, vendor-risk-register, vendor-cascade, table-eda, supabase-sql-magic, doc-drift, decision-log, build-plan-status, repo-scout, analysis-snapshot, and ~15 others.

**Recommendation:** Keep in AccentOS until a second repo needs them. Then extract.

### Command Center (proposed)
If the governance restructure includes a Command Center (owner-facing strategic layer distinct from operational AccentOS), it would own:
- Goals + OKRs (currently in Mgmt Dashboard)
- KPI registry + snapshots
- Strategic memory layer
- Pending actions review UI
- System observability dashboard

**Recommendation:** These modules are embedded in AccentOS today. Don't extract until the Command Center's API boundary is clear. Premature extraction creates sync problems.

---

## 5. AREAS OF HIGH COUPLING

### 5.1 Daily Brief ↔ All Modules
`renderDailyBrief()` in `index.html` reads from: VENDORS, CUSTOMERS, DEALS, QUOTES, COOP_FUNDS, INVENTORY, DELIVERIES, WARRANTY_CLAIMS, JOBS, MY_TASKS. It is the most-coupled function in the system.

**Risk for governance:** Any module extraction that changes these global variable names breaks the Daily Brief.
**Mitigation:** MODULE_REGISTRY (from ENTROPY_PREVENTION.md) decouples this before extraction.

### 5.2 Global Search ↔ All Modules
`js/global_search.js` registers 16 datasets by global variable name. Same coupling risk as Daily Brief.

**Mitigation:** Same — MODULE_REGISTRY.

### 5.3 Alert Engine ↔ All Modules
`js/alerts.js` queries: DEALS, COOP_FUNDS, QUOTES, INVENTORY, DELIVERIES, WARRANTY_CLAIMS, SHOWROOM_DISPLAYS, POs, CHANGELOG. Another high-coupling function.

**Mitigation:** When the event stream (`system_events`) is wired, alerts can subscribe to events instead of polling globals — decouples them completely.

### 5.4 `index.html` ↔ Everything
The main shell still contains: routing (`goTo()`), shared utilities (`sbFetch`, `esc`, `$`), auth state, module registration (4 touchpoints per module), and the Daily Brief. It is the highest-entropy file in the repo.

**Risk for governance:** Any restructure that doesn't first extract these utilities will fragment them across repos.
**Mitigation priority:** Extract `sbFetch` + shared utils to `js/core.js` before any repo split.

---

## 6. RISKY ARCHITECTURAL ZONES

| Zone | Risk | Why |
|---|---|---|
| `index.html` shell | 🔴 High | 700KB+ file; contains routing, auth, utilities, and Daily Brief — too much responsibility |
| Cross-module global reads (Daily Brief, Search, Alerts) | 🔴 High | Break if any global is renamed or extraction changes scope |
| `setTimeout(80ms)` navigation pattern | 🟡 Medium | Fragile; will fail when page render slows |
| Cloudflare Worker proxy | 🟡 Medium | Currently broken (400 bug); only AI features depend on it but they're growing |
| `vendor_id` as TEXT not UUID | 🟡 Medium | Inconsistent with all other entity PKs; migration is the right fix but timing matters |

---

## 7. INCOMPLETE ABSTRACTIONS

| Abstraction | Status | What's Missing |
|---|---|---|
| MODULE_REGISTRY | Designed, not built | Implementation deferred — needs a session |
| `cognition.js` four-role pattern | Designed, not built | Full implementation is Phase 3 of BUILD_PLAN |
| `system_events` instrumentation | Table exists, nothing writes | Phase 0.1 of BUILD_PLAN — 1 session |
| Entity Registry (ontology) | Designed in ONTOLOGY.md | No SQL migration written yet |
| `procedures` table | Designed in MEMORY_SYSTEM.md | No SQL migration written yet |
| `pending_actions` table | Designed in ARCHITECTURE.md | No SQL migration written yet |
| `PROMPT_REGISTRY` | Designed in ENTROPY_PREVENTION.md | Not implemented |
| `EVENT_TYPES` registry | Designed in ENTROPY_PREVENTION.md | Not implemented |

---

## 8. DUPLICATE SYSTEMS

| Duplication | Location | Recommendation |
|---|---|---|
| `_toCsv()` logic | `js/inventory.js`, `js/reports.js`, `js/demand_forecast.js` | Extract to `js/core.js` on 4th use |
| AI system prompts | Inline in `index.html` (Knowledge Engine) and `js/quote_gen` | Consolidate into `PROMPT_REGISTRY` in `cognition.js` |
| Alert generation logic | `js/alerts.js` + inline Daily Brief tiles | Alerts.js is authoritative; Daily Brief should subscribe |

---

## 9. RECOMMENDED CLEANUP OPPORTUNITIES (PRE-RESTRUCTURE)

These are low-risk, high-value cleanups that reduce restructure complexity:

1. **Extract `sbFetch` + `esc` + `$` to `js/core.js`** — removes the last reason `index.html` needs to be touched for utilities
2. **Implement MODULE_REGISTRY** — eliminates the 4-touchpoint module coupling before any restructure
3. **Wire `system_events` in `sbFetch`** — the cheapest way to add observability before the restructure locks the architecture
4. **Create `TECH_DEBT.md`** in repo root — makes debt inventory visible before restructure

---

## 10. FINAL OPERATIONAL CONFIRMATION

- ✅ Repo is on a named branch (`claude/cognition-engine-architecture-Czqa7`)
- ✅ Working tree is clean (nothing uncommitted)
- ✅ Branch is pushed to `origin`
- ✅ All 8 architecture documents committed
- ✅ No JS modules modified — app on `main` is unaffected
- ✅ No syntax errors in any JS file
- ✅ No debug artifacts in tracked files
- ✅ WIP document is accurate and resumable
- ✅ Cognition engine documents are pure specifications — zero runtime impact

**Safe to begin governance restructure. This branch can be merged, ignored, or rebased without affecting app operation.**
