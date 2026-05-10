# REPO_TOPOLOGY_MAP

> Bounded structural map of the AccentOS repository.
> Analysis only — no implementation, no mutation, no runtime change.
> Snapshot date: 2026-05-10. Branch: `claude/repo-cartography-analysis-3McqU`.

---

## 0. ONE-PAGE OVERVIEW

AccentOS is a **single-shell + N-module vanilla JS app** deployed on Cloudflare Pages with Supabase as the backing store and a single Cloudflare Worker proxying Anthropic. There is **no build step**, **no module loader**, and **no namespacing convention** — every module is a `<script src>` tag attached to the global `window` object.

Five regions exist:

| Region | Role | Mutation cadence | Risk class |
|---|---|---|---|
| **Shell** (`index.html`) | App skeleton, routing, auth, sbFetch, design system, sidebar, vendor pages, modal/toast/CSV helpers | High — touched almost every session | FROZEN by user directive (re: this task) / production-critical |
| **Modules** (`js/*.js`, 38 files) | One file per feature page; loaded as global scripts | Very high — primary build surface | Mixed (small=safe, large=supervised) |
| **Schema** (`sql/M01..M40`) | Sequential ordinal migrations, applied manually via Supabase SQL Editor | Append-only — never re-edit | FROZEN once applied |
| **Worker** (`worker/anthropic-proxy.js`) | 48-line Cloudflare Worker that proxies Anthropic API | Cold — touched ~once | FROZEN by user directive (re: this task) |
| **Governance + skills** (root MD docs + `skills/`) | Doc-driven autonomous build protocol; vibe-speak/efficiency-monitor/repo-scout/skill-forge | High but doc-only | SAFE |

---

## 1. MAJOR SYSTEM REGIONS

### 1.1 Shell — `index.html`
- **7,169 lines · ~735 KB** (76% of 900 KB declared hard split-trigger).
- Holds: design system `<style>` blocks (3 of them), login HTML (currently disabled), main app HTML, sidebar nav, vendor pages (lines ~3663–4700), quick-action FAB, modal frame, feedback panel, **all** shared JavaScript helpers, **all** auth flow, and the manifest of 38 module `<script>` tags at lines 7131–7167.
- Inline JS exposes the canonical helpers every module silently depends on:
  - `sbFetch` — single REST surface (used by 22/38 modules).
  - `CU` — current user object (`{user_id, email, full_name, role, initials, jwt}`).
  - `applyRoleVisibility(role)` — reads `data-roles` attributes on sidebar items.
  - `$`, `qsa`, `esc`, `v`, `csvStringify`, `csvDownload`, `toast`, `openModal`, `sbAuthFetch`, `sbAuditLog`, `tryRestoreSession`, `doLogin`, `doLogout`, `hydrateFromSupabase`, `activateApp`, `toggleSB`, `toggleQA`, `qaGo`.
- Module load order is the **implicit dependency graph** — there is no explicit declaration anywhere else.
- Cache-busting: every script tag carries a hand-bumped `?v=6.10.<n>` query string.

### 1.2 Modules — `js/*.js`
- **38 files · ~13,871 LOC.**
- Each file targets a single sidebar page (`customers`, `pipeline`, `inventory`, etc.) plus 2–4 small cross-cutting helpers (`bulk_select.js`, `saved_filters.js`, `digest.js`, `quick_actions.js`).
- Every module attaches state to the global `window` namespace using underscored prefixes — `window._afDeb`, `window._custDeb`, `window._invDeb`, `window._mtLoaded`, `window._sfCtx`, etc. (≈40 unique `window.*` names observed).
- 28/38 modules write to `window`; 22/38 call `sbFetch`; 1/38 (`module_modes.js` itself) calls `canSeeModule`.
- Largest five modules (these are the maintenance attractors):

| File | Lines | Bytes | Class |
|---|---|---|---|
| `internal_meetings.js` | 2,436 | 120 KB | super-module — already approaching shell-class size |
| `customers.js` | 768 | 43 KB | large |
| `jobs.js` | 621 | 35 KB | large |
| `marketing.js` | 556 | 35 KB | large |
| `trade_partners.js` | 525 | 30 KB | large |

### 1.3 Schema — `sql/M01..M40`
- **25 migration files · ~1,848 LOC**, ordinal-named `M01..M40` (with intentional gaps).
- M01 = RLS tightening; M02 = core schema; M21–M30 = phase-3 modules (inventory, POs, trade partners, warranty, displays, labels, deliveries, competitor prices, marketing); M30–M40 = customer segmentation, internal meetings, products cost, deals stage history, deals lost reason, invoices/payments, employee quota dates, service tickets, surveys, recurring contracts, vendor verify, user module overrides.
- Apply rule (per `MASTER.md` §12.7): **Supabase MCP returns permission errors → all migrations pasted manually by Michael in the SQL Editor.** Files in `sql/` are the write-once source artifacts; once applied, the file is treated as immutable.

### 1.4 Worker — `worker/anthropic-proxy.js`
- **48 LOC**, single file. Pure pass-through: forwards `POST` body to `https://api.anthropic.com/v1/messages` with the caller's `x-api-key` header. CORS-permissive. No state, no env coupling beyond the `ANTHROPIC_API_KEY` secret.
- Configured by `wrangler.toml` (6 lines).
- Decoupled from the rest of the repo — neither the shell nor any module reads it directly; the live app calls the proxy URL by HTTPS.

### 1.5 Governance and skills
- **Root governance docs** (read on every session start by `.claude/CLAUDE.md` auto-execute):
  - `MASTER.md` (876 lines) — architectural source of truth.
  - `BUILD_PLAN_CLAUDE.md` / `BUILD_PLAN_MICHAEL.md` — active parallel checklists.
  - `BUILD_INTELLIGENCE.md` — append-only lessons-from-each-shipped-item log (~49 KB and growing).
  - `KPI_CATALOG.md`, `MODULE_MODES.md`, `PROMPT_LOG.md`, `PROMPT_QUEUE.md`, `SESSION_LOG.md`, `WORK_IN_PROGRESS.md`, `README.md`.
- **`skills/`** — 30 sub-directories. Always-on observers: `vibe-speak` (default communication mode), `efficiency-monitor` (signal tracking), with workflow skills (`repo-scout`, `skill-forge`, `analysis-snapshot`, `codex-review`, `decision-log`, `doc-drift`, `kpi-data-audit`, `priority-articulation`, `prompt-queue`, etc.). Has its own `_index.md` registry (read by Step 23 skill router).
- **`scripts/`** — 3 files: `status.sh` (run on every session start), `efficiency-aggregate.sh` (Stop hook), `auto-categorize.js`.
- **`patch_quote.js`** at repo root — Node executable carrying a base64-encoded surgical replacement for the Quote Generator section. **Not runtime-loaded.** Disposable patching artifact left at root.

---

## 2. COUPLING SURFACES

### 2.1 Module → Shell coupling (the silent contract)
| Surface | Provider | Consumers | Coupling style |
|---|---|---|---|
| `sbFetch(path, opts)` | Shell inline JS (`index.html`) | 22 of 38 modules | Implicit global; no import/export |
| `CU` (current user) | Shell | Most modules that need role/audit context | Implicit global; mutated by `tryRestoreSession`/`doLogin` |
| Design tokens (CSS vars `--accent`, `--bg`, etc.) | Shell `<style>` | All modules render into shell DOM | Implicit |
| `toast()`, `openModal()` | Shell | Most modules | Implicit global |
| `csvDownload`, `csvStringify`, `esc`, `$`, `qsa`, `v` | Shell | Many modules | Implicit global |
| `data-roles` HTML attribute on sidebar | Shell HTML | Read by `applyRoleVisibility` only | Hand-coded; drift-prone |
| Script load order at `index.html:7131-7167` | Shell HTML manifest | All modules | Position-sensitive — modules registering helpers earlier shadow later definers |

### 2.2 Module → Module coupling
- **No direct imports.** Cross-module reach happens by reading other modules' `window._<prefix>...` globals or by clicking a `goTo(page)` shell handler that activates the target page's `init()`.
- `goTo` and `_goToModeWrapped` are wrapped by `module_modes.js` to enforce mode-based gating (only place that intercepts navigation).
- `quick_actions.js` reads `window._qaItemsCached` — populated by other modules.
- Net effect: **cross-module coupling is invisible at edit time** — there is no static analysis that can spot when one module's removal breaks another.

### 2.3 Module → Database coupling
- Single REST surface: `sbFetch` → Supabase REST (`/rest/v1/`) and Realtime (via `@supabase/supabase-js` UMD CDN bundle loaded at `index.html:519`).
- Each module hard-codes the table names + column projections it needs in the URL string. **No schema layer**, no type contract, no ORM — column rename in SQL ⇒ silent runtime breakage in N modules.
- One module (`module_modes.js`) directly reads `user_module_overrides` table and falls back to localStorage when the table is missing.

### 2.4 Frontend → Worker coupling
- The worker is reached only from the live origin via HTTPS. No code-level coupling.
- Anthropic API key is in worker secrets, never committed, never read by browser code.

### 2.5 Governance fabric coupling
- `module_modes.json` (registry data) ↔ `js/module_modes.js` (resolver UI) ↔ `index.html` sidebar `data-roles` attributes (gating mechanism). Three sources of truth for one concept. **See §6 — architectural illusion zone.**
- `.claude/settings.json` Stop hook calls `scripts/efficiency-aggregate.sh` which writes `skills/efficiency-monitor/efficiency-log.md` and `session-end-summary.md`, which the next session reads at boot. Closed-loop, low blast radius.

---

## 3. DEPENDENCY DENSITY

```
                          ┌────────────────────────────┐
                          │  Cloudflare Pages (static) │
                          └────────────┬───────────────┘
                                       │ /
                                       ▼
   ┌──────────────────────  index.html (FROZEN, 735 KB) ────────────────────┐
   │                                                                          │
   │   <style> design system   <body> shell HTML   <script> auth/sbFetch     │
   │   sidebar (data-roles)    vendor pages         CU, toast, modal,        │
   │                                                csvDownload, ...         │
   │                                                                          │
   │   <script src=js/customers.js?v=…>   …  <script src=js/internal_…>      │
   └────────┬─────────────────────────────────────────────────┬─────────────┘
            │  (38 script tags, position-sensitive)           │
            │                                                 │
            ▼                                                 ▼
   ┌────────────────┐                              ┌────────────────────┐
   │ small modules  │   (read sbFetch, CU,         │ super-module       │
   │ <300 LOC each  │    toast, $, qsa, esc        │ internal_meetings  │
   │ 17 files       │    from window scope)        │ 2436 LOC / 120 KB  │
   └────────┬───────┘                              └────────┬───────────┘
            │                                                │
            └──────────────────┬─────────────────────────────┘
                               │  sbFetch
                               ▼
                  ┌──────────────────────────────┐
                  │  Supabase REST + Realtime    │
                  │  (manual SQL migrations:     │
                  │   sql/M01..M40)              │
                  └──────────────────────────────┘

   ┌────────────────────────────────────┐    HTTPS only
   │  worker/anthropic-proxy.js (48 LOC)│ ◄─────────────── browser fetch
   │  Cloudflare Worker, ANTHROPIC key  │                  (in-app AI calls)
   └────────────────────────────────────┘
```

**Edge-density findings:**
- Shell ↔ modules is **fan-out 1 → 38** of implicit globals. Highest-density coupling in the repo.
- Module ↔ module is **near-zero** at the source level but **N×N latent** through `window` (because any module can be redefined by any later module).
- SQL ↔ modules is **fan-out 25 migrations → 38 modules** through hard-coded REST URL strings.
- Worker is **isolated** — fan-in of 1 (the live UI), fan-out of 1 (Anthropic).

---

## 4. MUTATION HOTSPOTS

Files modified May 10 (current session window) — i.e. the **active mutation front**:

**Shell zone (1):**
- `index.html`

**Module zone (20 of 38):**
- `internal_meetings.js`, `customers.js`, `jobs.js`, `purchase_orders.js`, `inventory.js`, `employees.js`, `marketing.js`, `trade_partners.js`, `showroom_displays.js`, `warranty.js`, `calendar.js`, `deliveries.js`, `csv_import.js`, `module_modes.js`, `saved_filters.js`, `bulk_select.js`, `my_tasks.js`, `vendor_score_import.js`, `knowledge_hub.js`, `deal_optimizer.js?` (recheck — listed at v6.10.12, less recent).

**Schema zone (12 of 25):**
- `M30_customers_segment.sql`, `M30_internal_meetings.sql`, `M30b_meetings_realtime.sql`, `M30c_meetings_realtime_extend.sql`, `M31..M40` (all most-recent block — 12 of the last 12 migrations).

**Governance zone (high — doc churn):**
- `BUILD_INTELLIGENCE.md`, `BUILD_PLAN_MICHAEL.md`, `KPI_CATALOG.md`, `MODULE_MODES.md`, `module_modes.json`, `PROMPT_LOG.md`, `SESSION_LOG.md`, `WORK_IN_PROGRESS.md`.

**Cold zone (untouched May 10):**
- 18 of 38 modules dated May 5 — second-tier modules (`alerts`, `bulk_vendor_ops`, `commission`, `competitive_pricing`, `deal_optimizer`, `decision_engine`, `demand_forecast`, `digest`, `global_search`, `health`, `inventory_analytics`, `labels`, `pipeline_analytics`, `portal_preview`, `price_book`, `quick_actions`, `reports`, `activity_feed`).
- `sql/M01..M29` — older migrations.
- `MASTER.md` — last edit dated 2026-05-04.
- `worker/anthropic-proxy.js` shows May 10 timestamp but represents a stable contract; treat as cold.
- `wrangler.toml` — frozen.

**Pattern:** the active build phase is concentrated in the **internal-meetings + showroom + trade-partners + customers + jobs** corridor and the **M30..M40** schema block. Every one of these touches both the shell (script-tag versioning) and the module file.

---

## 5. FROZEN-FILE CONCENTRATION

Highest concentration of frozen-class files in the repo, ranked:

| Rank | File / Set | Frozen reason | Pressure |
|---|---|---|---|
| 1 | `index.html` | Production shell · per-task user directive · 76 % of 900 KB hard cap · holds auth + sbFetch + design system | EXTREME |
| 2 | `worker/anthropic-proxy.js` + `wrangler.toml` | Per-task user directive · stable Anthropic contract | LOW (rarely changes anyway) |
| 3 | `sql/M01..M40` (already applied) | Append-only migration discipline · Supabase MCP broken so re-runs require manual paste | LOW per migration, COMPOUND across 25 |
| 4 | Design system constants (CSS in `index.html` `<style>`) | `MASTER.md` §4: "LOCKED — never changes" | LOW (rule, not pressure) |
| 5 | Module-mode `live`-state entries | Touching state demotes a live module | MEDIUM (frequency of touch) |
| 6 | `MASTER.md` §12 hard rules (the rules themselves) | Governance constants | LOW |

The pressure concentrates **almost entirely in `index.html`** — see `FROZEN_FILE_PRESSURE_ANALYSIS.md`.

---

## 6. ARCHITECTURAL ILLUSION ZONES — "Looks modular but isn't"

Six places where the surface story diverges from the runtime reality.

### 6.1 Module isolation (asserted but not enforced)
`MASTER.md` §5 lists "Module Isolation — A bug in Customers never affects Vendor Intelligence" as a development philosophy. Mechanism in code: **none.** Every module shares one global namespace, can redefine any other module's helpers, and depends on a load order set by hand-coded `<script>` tag positions. Isolation is a discipline, not an architecture — and the second discipline slips, the next bug crosses module lines silently.

### 6.2 Module-mode registry is three sources of truth
1. `module_modes.json` — registry data, edited by Claude.
2. `js/module_modes.js` — resolver and admin UI; reads (1).
3. `index.html` sidebar `<a data-roles="...">` attributes — actual run-time gate, hand-coded.
The resolver wraps `goTo`, but the sidebar's `applyRoleVisibility` reads `data-roles` directly. So: a module can have `mode: "blocked"` in the JSON but a stale `data-roles="Owner,Admin,Sales"` on its sidebar `<a>`, and the entry will still appear to those roles unless the resolver also touches it. Already tracked as `module_registry_refactor` in `idea_only` state.

### 6.3 The "file split" is partially complete
`MASTER.md` §3 still describes the post-split repo as `index.html + 4 module files (vendor / pipeline / knowledge / marketing)`. Reality is **38 module files**, and the shell has *grown* (7,169 LOC) since the split — vendor view templates and the design system never moved out. Architecture doc is stale relative to reality.

### 6.4 Cache-bust query strings are manual and unenforced
`?v=6.10.<n>` tags are hand-written. Forgetting one ⇒ stale-script user-visible bug that's invisible to git diff. There is no script that bumps versions on commit and no test that verifies a touched module also got a version bump in `index.html`.

### 6.5 `internal_meetings.js` is itself a shell-class file
At 2,436 LOC / 120 KB it is *4× the median module size* and covers six sub-features (Platform Review, Agenda Builder, Notes, To-Dos, Follow-Ups, AI Notes/Transcripts). It looks like a module from outside but internally has the topology of `index.html`-mini — multiple subsystems sharing a single set of state variables prefixed `IM_`.

### 6.6 `patch_quote.js` at the repo root
A Node executable carrying a base64-encoded replacement string. Not loaded by the app, not under `scripts/`, not under any structured location. It implies a side-channel patching workflow that does not pass through the normal commit/push path — and it has been sitting at the root long enough to be normalized.

---

## 7. BLAST-RADIUS ZONES

| Zone | If broken | Blast radius |
|---|---|---|
| `index.html` shell auth block (lines ≈528–720) | No login → app dark for all users | **Catastrophic** |
| `sbFetch` (in shell) | Every Supabase-touching module fails | **Catastrophic** |
| Script-tag manifest order (`index.html:7131-7167`) | Modules silently overwrite each other; load failures | **Catastrophic** |
| Design system CSS in shell `<style>` | Every visual element drifts | **High** (no functional break) |
| Sidebar `data-roles` attributes | Wrong roles see wrong modules; data leak risk | **High** (security-shaped) |
| `module_modes.json` shape | Resolver crashes on hydrate; sidebar gating disabled | **High** |
| Any individual module file | Only that page broken | **Low — Medium** |
| `internal_meetings.js` | 6 sub-features dark; biggest single point of module-level failure | **Medium** |
| Worker proxy | In-app AI features fail; rest of app runs | **Medium** |
| Already-applied SQL migration (re-edit) | Schema drift between repo and live DB | **High** |
| Skills / governance docs | No runtime impact; only protocol drift | **Negligible** |

---

## 8. DANGER CORRIDORS

Sequences of files that, when touched together, compound risk.

1. **The "add-a-module" corridor** (high frequency).
   `module_modes.json` → `js/<new>.js` → `index.html` (script-tag insertion + sidebar `<a data-roles>` + `?v=` bump). Four touchpoints, two of them inside the frozen shell. **Most-trafficked danger corridor in the repo.**

2. **The "schema change" corridor** (medium frequency).
   `sql/M<n>.sql` (write) → manual paste in Supabase SQL Editor (out-of-repo) → `js/<module>.js` (URL/projection update) → no compile-time check. A column rename here will only be caught by clicking the page in production.

3. **The "auth/session" corridor** (low frequency, high blast).
   `index.html` shell (`tryRestoreSession`, `applyRoleVisibility`, `CU`) ↔ `js/module_modes.js` (`canSeeModule`) ↔ `M40_user_module_overrides.sql`. Auth is split across three locations; a partial change easily creates ghost-permission states.

4. **The "version-bump corridor"** (every module change).
   Bumping `?v=6.10.X` in `index.html` is required after every module change. Not enforced anywhere. Forgetting it deploys a fix that no client sees.

5. **The "shell-edit corridor"** (forbidden by current task, but always present).
   Any edit to `index.html` ripples through 38 modules because they all read its globals. Surgical-only patches are mandated by `MASTER.md` §12 — but the document size makes finding a unique `old_string` increasingly hard, which is the underlying split-pressure driver (see `FROZEN_FILE_PRESSURE_ANALYSIS.md`).

---

## 9. LIKELY FUTURE SPLIT BOUNDARIES

Ranked by safety × yield. (These are *boundaries*, not actions — this document does not propose mutation.)

1. **Inline `<style>` blocks → `css/aos.css`** (3 `<style>` blocks in shell).
   Yield: largest single line-count drop available with effectively zero functional risk.

2. **`internal_meetings.js` → 4–6 sub-files** (per IM\_ sub-feature: prep, agenda, notes, todos, follow-ups, transcripts).
   Yield: removes the second shell-class file in the repo; isolates highest-velocity module from the current session.

3. **Auth block (`index.html` ≈528–720) → `js/auth.js`.**
   Self-contained: login, JWT handling, session restore, role visibility, audit log. Cleanly excisable. High caution — this is the most production-critical block.

4. **Shell utilities (`toast`, `openModal`, `esc`, `csvDownload`, `csvStringify`, `$`, `qsa`, `v`) → `js/shell_utils.js`.**
   Yield: medium line drop, high readability win, zero call-site change because these are all global-scoped already.

5. **Vendor view HTML (`index.html` ≈3663–4700) → template loaded by `js/vendors.js`.**
   ~1,000 lines of vendor pages that should be in a module given module isolation philosophy.

6. **Sidebar `<a data-roles>` ⇒ data-driven from `module_modes.json`.**
   Already a tracked `idea_only`: `module_registry_refactor` ("collapse 4 shell touchpoints to 1"). Eliminates §6.2 illusion zone.

7. **`patch_quote.js` → either run-once-and-delete or move to `patches/` (out of root).**
   Reduces repo-root cognitive load.

8. **Cache-bust automation → deploy-time hash-injection script** (or accept it and document).
   Removes danger corridor #4.

---

## 10. AT-A-GLANCE FILE-COUNT MAP

```
accent-os/
├── index.html                  7169 LOC · 735 KB  · FROZEN · shell
├── patch_quote.js                29 LOC ·  52 KB  · orphan node executable (b64 patch payload)
├── module_modes.json             63 LOC          · governance registry
├── wrangler.toml                  6 LOC          · worker config
├── README.md                      …             · placeholder
│
├── js/                       13871 LOC · 38 files · primary build surface
│   ├── internal_meetings.js   2436 LOC · 120 KB  · super-module
│   ├── customers.js            768 LOC ·  43 KB  · large
│   ├── jobs.js                 621 LOC ·  35 KB  · large
│   ├── marketing.js            556 LOC ·  35 KB  · large
│   ├── trade_partners.js       525 LOC ·  30 KB  · large
│   └── …33 more (median ≈300 LOC)
│
├── sql/                       1848 LOC · 25 files · ordinal migrations M01..M40
│   ├── M01..M02              core  · RLS + base schema
│   ├── M21..M29              phase-3 module schemas
│   └── M30..M40              current build wave
│
├── worker/anthropic-proxy.js    48 LOC          · isolated Cloudflare Worker
│
├── scripts/
│   ├── status.sh                81 LOC          · session-start status
│   ├── efficiency-aggregate.sh 151 LOC          · Stop-hook aggregator
│   └── auto-categorize.js      332 LOC          · vendor categorization helper
│
├── skills/                              30 sub-dirs (vibe-speak, efficiency-monitor,
│                                         repo-scout, skill-forge, ~26 workflow skills)
│
├── docs/
│   └── runtime/                          this analysis pack
│
├── .claude/
│   ├── CLAUDE.md             auto-instructions read every session start
│   ├── settings.json         dangerouslySkipPermissions + Stop hook
│   └── output-styles/
│
└── governance/  (root MD files — not a folder, listed for grouping)
    MASTER.md (876 LOC)              · architectural source of truth
    BUILD_PLAN_CLAUDE.md             · active checklist (Claude side)
    BUILD_PLAN_MICHAEL.md            · active checklist (human side)
    BUILD_INTELLIGENCE.md (~1100 LOC)· append-only lessons log
    KPI_CATALOG.md, MODULE_MODES.md  · protocol docs
    PROMPT_LOG.md, PROMPT_QUEUE.md   · working buffers
    SESSION_LOG.md, WORK_IN_PROGRESS.md
```

---

## 11. CARTOGRAPHY HIGHLIGHTS

- **One frozen file dominates the topology.** `index.html` is the gravitational center — every module orbits its globals, every navigation passes through its sidebar HTML, every cache-bust touches its script-tag manifest, and it is at 76 % of its declared split-trigger.
- **Module isolation is conceptual, not structural.** No loader, no namespacing, no contract — just a discipline encoded in `MASTER.md`.
- **Module-mode governance has three sources of truth.** Already known and tracked.
- **One module is itself shell-class.** `internal_meetings.js` is the next file to threaten the same pressure pattern as `index.html`.
- **Schema and worker are healthy.** Append-only migrations and an isolated 48-line proxy contribute almost zero topological pressure.
- **The danger corridors are predictable** — they all run through `index.html`. Decomposing the shell drains pressure from every other zone simultaneously.

---

*See also: `FROZEN_FILE_PRESSURE_ANALYSIS.md` (deep-dive on `index.html` pressure) and `SAFE_MUTATION_ZONES.md` (per-zone change-class table).*
