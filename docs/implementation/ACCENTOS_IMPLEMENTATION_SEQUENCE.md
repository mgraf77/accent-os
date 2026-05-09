# ACCENTOS_IMPLEMENTATION_SEQUENCE.md — Master Critical Path

| Field         | Value |
|---|---|
| Status        | **PLANNING — not executable.** No phase may begin without Phase 0 Decision Lock complete. |
| Authority     | Planning only. Does not authorize any integration work. |
| Owner         | Claude (document) + Michael (authorizes each phase gate) |
| Last Updated  | 2026-05-09 |
| Prerequisites | GOVERNANCE_RISKS.md read. STABILIZATION_PROTOCOL.md read. Boot smoke passing. |
| Related       | `ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `ACCENTOS_PARALLEL_WORK_RULES.md` |

---

## 1. CRITICAL PATH OVERVIEW

```
NOW
 │
 ▼
[Phase 0] Decision Lock ──────────────────── BLOCKS EVERYTHING
 │  Michael answers 5 open questions
 │
 ▼
[Phase 1] BUG-01 Fix Verification ────────── BLOCKS Phase 4+
 │  Worker redeploy + smoke test (R-02 resolved)
 │
 ▼
[Phase 2] SQL Migrations M01–M40 ─────────── BLOCKS Phase 7+
 │  Michael-executed. Claude verifies only.
 │
 ├─────────────────────────────────────────── CAN PARALLEL with Phase 2
 ▼
[Phase 3] Branch Topology Setup ──────────── BLOCKS Phase 4+
 │  Create/retire branches per registry
 │
 ▼
[Phase 4] Shell Phase A — Side-load ──────── FIRST index.html TOUCH
 │  tokens.css + shell.css + shell.js behind feature flag
 │  Michael writes "Phase 2 authorized" in BUILD_PLAN_MICHAEL.md
 │
 ▼
[Phase 5] Shell Phase B — Outer Chrome ───── FIRST VISIBLE CHANGE
 │  Mount shell as frame; monolith body inside aos-content
 │  Requires GATE-05 approval (>50 lines index.html)
 │
 ▼
[Phase 6] Shell Phase C — System Health ──── FIRST MODULE MIGRATION
 │  Read-only. Lowest blast radius.
 │
 ▼
[Phase 7] Shell Phase D — Vendors ────────── FIRST READ-WRITE MIGRATION
 │  Requires R-03 (RLS) status acknowledged
 │
 ▼
[Phase 8] Shell Phase E — Remaining Modules  PARALLEL per module
 │  11 modules, oldest-stable-first order
 │  Each module is a sub-phase with its own gate
 │
 ▼
[Phase 9] Shell Phase F — Decommission ───── LARGE DELETE
 │  Requires Phase E complete + 14-day burn-in
 │  Requires explicit Michael authorization
 │
 ▼
[Phase 10] RLS Enforcement ───────────────── REAL SECURITY GATE
 │  Supabase RLS + JWT role claims
 │  M01–M40 must be fully live
 │
 ▼
PHASE F COMPLETE
```

---

## 2. IMPLEMENTATION PHASES

---

### Phase 0 — Decision Lock

**Trigger:** Immediate. Must complete before any implementation phase begins.

**Scope:** Michael answers 5 open questions from `ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md`. Answers get committed to `BUILD_PLAN_MICHAEL.md`.

**5 required decisions:**
1. Feature flag architecture — URL param + localStorage (recommended) or something else?
2. Phase A trigger word — what exact text does Michael write in `BUILD_PLAN_MICHAEL.md` to authorize Phase 2?
3. Per-role rollout order for shell flag default (owner first is recommended — confirm)?
4. Phase F trigger — 14-day burn-in is the stated threshold; is that acceptable?
5. Build step decision — defer to Phase F (recommended) or introduce earlier?

**Critical files touched:** `BUILD_PLAN_MICHAEL.md` (Michael writes), `WORK_IN_PROGRESS.md` (Claude logs receipt)

**Exit criteria:** All 5 answers committed. No ambiguity in Phase A trigger condition.

**Blocking conditions:** None — this is the root gate.

**Estimated sessions:** Michael async; Claude reads and confirms within 1 session.

**Rollback path:** N/A (doc-only).

---

### Phase 1 — BUG-01 Fix Verification

**Trigger:** Phase 0 complete.

**Scope:** Verify R-02 is resolved. Worker proxy commit `2dca2a6` must be redeployed by Michael via `wrangler deploy` from local terminal. Claude then runs smoke test to confirm Quote Generator AI parse is functional.

**Critical files touched:** None by Claude. `worker/anthropic-proxy.js` is FROZEN — Michael deploys only.

**Exit criteria:**
- Michael confirms `wrangler deploy` completed successfully
- Boot smoke passes
- Quote Generator AI parse produces a valid response in production

**Blocking conditions:** Michael must have local Cloudflare credentials and `wrangler` installed. Cannot be done from Codespace or cloud environment.

**Estimated sessions:** 0 Claude sessions (Michael action). 0.5 sessions for Claude verification.

**Rollback path:** Revert to prior worker version. Michael-only action.

---

### Phase 2 — SQL Migrations M01–M40

**Trigger:** Phase 0 complete. (Parallel with Phase 1 and Phase 3.)

**Scope:** Michael runs pending SQL migrations via Supabase SQL editor. Claude does not execute SQL directly. Claude verifies each migration landed by querying table structure.

**Key migration blocks:**
- M01: RLS tightening (anon policies dropped) — blocks any new sensitive-data tables
- M02: Core schema (18 tables) — blocks Phase 7 (Vendor read-write migration)
- M21–M29: Module-specific schemas — blocks corresponding module migrations in Phase 8

**Critical files touched:** `supabase/migrations/` — FROZEN to Claude writes. Michael-executed only.

**Exit criteria:**
- Each Mx migration: Michael confirms run, Claude queries `information_schema.tables` to verify
- M01 live before any new write path is exposed in UI
- M02 live before Phase 7 begins

**Blocking conditions:** Michael must have Supabase project access and SQL editor privileges.

**Estimated sessions:** 0 Claude sessions per migration. Verification: ~0.25 sessions per batch.

**Rollback path:** Supabase migration rollback SQL (must be written before each migration run).

---

### Phase 3 — Branch Topology Setup

**Trigger:** Phase 0 complete. (Parallel with Phase 1 and Phase 2.)

**Scope:** Create planned authority branches; retire or archive stale branches.

**Branches to create:**
- `claude/accentos-workflow-design-G0opy` — Runtime authority (UI + shell integration work)
- `claude/accentos-rollout-planning-UTElf` — Governance authority (planning docs, read-only)
- `claude/research-mobile-pwa-Q6vYN` — Mobile authority (PWA research)

**Active branches to preserve:**
- `main` — always deployable
- `claude/implement-claude-design-ui-eFn9b` — ui-proto work (Phases 2A/2B/2C complete)

**Critical files touched:** Git operations only. No source file edits.

**Exit criteria:** All three authority branches created off current `main`. Branch registry documented in `ACCENTOS_PARALLEL_WORK_RULES.md`.

**Blocking conditions:** None (git only).

**Estimated sessions:** 0.25 sessions.

**Rollback path:** Delete branches. No source impact.

---

### Phase 4 — Shell Phase A (Side-load)

**Trigger:** Phase 0 Decision Lock complete AND Michael writes the Phase 2 authorization phrase in `BUILD_PLAN_MICHAEL.md` AND Phase 3 complete AND boot smoke passing.

**Scope:** Inject three asset tags into `index.html` behind feature flag. No visible change with flag OFF.

**What gets injected (≤ 10 lines total):**
```html
<link rel="stylesheet" href="ui/tokens.css">
<link rel="stylesheet" href="ui/accentos-shell.css">
<script src="ui/accentos-shell.js" defer></script>
```
Plus feature flag resolution code (see Section 6 of rollout doc).

**Critical files touched:** `index.html` (≤ 10 lines). Branch: `claude/accentos-workflow-design-G0opy`.

**Pre-flight checks before touching `index.html`:**
- Grep for `window.AccentOS` in monolith — confirm no collision with shell namespace
- Grep for `aos-` class prefix in monolith — confirm no collision
- Boot smoke must pass before and after

**Exit criteria:**
- Boot smoke passes with flag ON and flag OFF
- Zero visual regression with flag OFF (pixel comparison or visual review)
- No console errors with flag ON
- `window.AccentOS.shell` API accessible from console when flag ON

**Blocking conditions:** Phase 0 not complete. Michael authorization phrase absent. R-02 still active (defer if Quote Generator mid-incident).

**Estimated sessions:** 1 session.

**Rollback path:** Delete the three injected tags and the flag code. Commit. Zero residual state.

---

### Phase 5 — Shell Phase B (Outer Chrome)

**Trigger:** Phase A stable ≥ 7 days. Zero defect tickets referencing UI/CSS in that window.

**Scope:** When feature flag is ON, wrap legacy body content inside shell skeleton DOM. Shell renders header, sidebar, rail. Monolith content renders inside `<main class="aos-content">`. Sidebar nav items dispatch `aos:navigate`; legacy adapter listens and calls existing module-switch function.

**Critical files touched:** `index.html` (~30–50 lines — GATE-05 approval required). Branch: `claude/accentos-workflow-design-G0opy`.

**GATE-05 requirement:** Edits > 50 lines require explicit Michael approval before session begins.

**Pre-flight checks:**
- Z-index audit: verify shell z-index values don't collide with legacy modal stack
- Keyboard audit: verify Cmd+K and Esc bindings don't double-fire
- Flag ON path only affects rendering; flag OFF must remain byte-for-byte identical to Phase A behavior

**Exit criteria:**
- All 14 modules navigable through new sidebar via `aos:navigate` adapter
- Legacy nav still functional concurrently
- Boot smoke passes
- Flag OFF produces zero visual change from Phase A state

**Blocking conditions:** Phase A < 7 days stable. GATE-05 approval absent.

**Estimated sessions:** 1–2 sessions.

**Rollback path:** Toggle flag OFF. Remove wrapper commit. `git revert HEAD` if needed.

---

### Phase 6 — Shell Phase C (First Module — System Health)

**Trigger:** Phase B stable ≥ 7 days.

**Scope:** Re-implement System Health as shell-native module. `js/system-health.js` exports `mount(container)`. Called when `aos:navigate` fires with `module === 'system-health'`. Legacy code path remains under flag.

**Why System Health first:** Read-only. No Supabase writes. No AI dependency. Easy data parity check. Zero blast radius.

**Critical files touched:** `js/system-health.js` (new), `index.html` (route hook, ≤ 20 lines). Branch: `claude/accentos-workflow-design-G0opy`.

**Exit criteria:**
- New System Health output matches legacy for 7 days
- Per-module flag (`aos-shell-module-system-health`) flips between old and new cleanly
- No incidents referencing System Health in the 7-day window

**Blocking conditions:** Phase B < 7 days stable.

**Estimated sessions:** 1 session.

**Rollback path:** Per-module flag OFF. Legacy System Health resumes. No data at risk (read-only).

---

### Phase 7 — Shell Phase D (First Read-Write Module — Vendors)

**Trigger:** Phase C stable ≥ 7 days. M02 migration live (Vendor data layer confirmed).

**Scope:** Port Vendor Intelligence to shell-native rendering. `js/vendors-shell.js`. Vendor card → right-rail inspector pattern. Right-rail opened via `window.AccentOS.shell.openRail()`.

**Critical files touched:** `js/vendors-shell.js` (new), `index.html` (route hook). Branch: `claude/accentos-workflow-design-G0opy`.

**R-03 acknowledgment:** RLS not tightened at this phase. Vendor writes still go through existing anon policies. Do not present new UI as having tightened security. This must be documented in the commit message.

**Exit criteria:**
- Edit parity with legacy Vendor view verified
- No data drift between new and legacy renderers over 7-day parallel run
- Per-module flag flips cleanly
- R-03 status acknowledged in commit

**Blocking conditions:** Phase C < 7 days stable. M02 not live.

**Estimated sessions:** 2 sessions.

**Rollback path:** Per-module flag OFF. Legacy Vendors resumes. Data state unaffected (same Supabase tables).

---

### Phase 8 — Shell Phase E (Remaining Modules)

**Trigger:** Per-module readiness. Phase D stable ≥ 7 days before first Phase E module.

**Scope:** Port 11 remaining modules, one at a time, oldest-stable-first.

**Order (do not reorder without documented reason):**
1. Product Lookup
2. Fixture Finder
3. Reports
4. Pricing Tools
5. Rep Management
6. Customer Workflows
7. Builder/Designer Workflows
8. Integrations
9. Governance / Admin
10. AI Tools — requires R-02 resolved
11. Quote Generator — most complex, AI-dependent, last

**Per-module pattern:**
- New `js/<module>.js` with `mount(container)` export
- Per-module feature flag `aos-shell-module-<key>`
- 7-day parallel burn-in alongside legacy renderer
- Data parity verification before legacy renderer retired

**Critical files touched:** `js/<module>.js` (one new file per module), `index.html` (route hook per module, ≤ 20 lines each). Branch: `claude/accentos-workflow-design-G0opy` or authorized sub-branches.

**Exit criteria (per module):** Module renders + operates in shell. Per-module flag flips cleanly. 7-day no-incident burn-in. Legacy renderer behind dead flag, not deleted yet.

**Blocking conditions (per module):** Prior module < 7 days stable. Required SQL migration not live.

**Estimated sessions:** 1–2 sessions per module. 11–22 sessions total for Phase E.

**Rollback path:** Per-module flag OFF. Each module is independently rollbackable.

---

### Phase 9 — Shell Phase F (Decommission)

**Trigger:** Phase E complete (all 11 modules ported). All per-module flags ON in production for ≥ 14 days. Zero rollbacks in that 14-day window. Explicit Michael authorization.

**Scope:**
- Delete legacy chrome from `index.html`
- Delete dead per-module legacy renderers
- Split remaining `index.html` into multi-file: one ES module per business module under `js/modules/`
- Build step decision revisited (default: stay no-bundler, `<script type="module">`)

**Critical files touched:** `index.html` (large delete — GATE-05 + Michael approval required), new `js/modules/*.js` files.

**Exit criteria:**
- Bundle size measured before and after; reduction documented
- Boot smoke script updated for new file pattern
- Boot smoke passes on new pattern
- Zero functionality regression over 7-day post-decommission window

**Blocking conditions:** Any per-module flag has been toggled OFF in the 14-day window. Phase E < complete. Michael authorization absent.

**Estimated sessions:** 2–3 sessions.

**Rollback path:** `git revert` the decommission commit. Full recovery.

---

### Phase 10 — RLS Enforcement

**Trigger:** Phase F complete. M01–M40 fully live. Michael authorizes security enforcement phase.

**Scope:** Real security boundary enforcement. Supabase RLS + JWT role claims. Remove UX-only `data-roles` gating from R-04 status. Auth token lifecycle owned by shell (not monolith). This is independent of the shell rollout phases — it is a security project that runs alongside or after.

**Critical files touched:** `supabase/migrations/` (new RLS migration, Michael-executed). Potentially `js/` auth helpers. This phase has its own planning document (not covered here).

**Exit criteria:** R-03 and R-04 both move to RESOLVED in `GOVERNANCE_RISKS.md`. Role-gated write paths verified server-side via Supabase policies.

**Blocking conditions:** M01 not live. JWT claims infrastructure absent.

**Estimated sessions:** Separate planning cycle. Not estimated here.

**Rollback path:** Per-migration rollback SQL.

---

## 3. SEQUENCING RULES

### Must be serial (cannot overlap):
- Phase 0 must complete before any other phase starts
- Phase 4 cannot start until Phase 3 is complete
- Phase 5 cannot start until Phase 4 has been stable ≥ 7 days
- Phase 6 cannot start until Phase 5 has been stable ≥ 7 days
- Phase 7 cannot start until Phase 6 has been stable ≥ 7 days
- Phase 9 cannot start until Phase 8 is fully complete + 14-day burn-in
- Within Phase 8: no module may begin until the prior module is ≥ 7 days stable

### Can be parallel:
- Phase 1 (BUG-01), Phase 2 (SQL), Phase 3 (branches) — all can run concurrently after Phase 0
- Phase 8 module work may be parallelized across sub-branches (see ACCENTOS_PARALLEL_WORK_RULES.md), but only after Phase 7 clears
- Phase 10 (RLS) planning can begin during Phase E

### Never parallel:
- Two phases that both touch `index.html`
- Any phase that touches the same `js/` file as another active branch

---

## 4. GATE DEFINITIONS

What constitutes "done" is defined here, not in the phase descriptions. These are the test criteria — not aspirational.

| Gate | Phase | Test |
|---|---|---|
| G0 | Phase 0 exit | `BUILD_PLAN_MICHAEL.md` has all 5 answers. Claude reads and logs confirmation. |
| G1 | Phase 1 exit | Quote Generator produces a non-error AI parse response in production. Boot smoke passes. |
| G2 | Phase 2 partial | `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` returns expected tables for each Mx batch. |
| G3 | Phase 3 exit | `git branch -a` shows all three authority branches. |
| G4 | Phase 4 exit | Boot smoke passes. `window.AccentOS.shell` is defined in production console with flag ON. No console errors. Visual diff is empty with flag OFF. |
| G5 | Phase 5 exit | All 14 module nav items route correctly via shell. Boot smoke passes. 7-day calendar clock starts. |
| G6 | Phase 6 exit | System Health output matches legacy for 7 days. Per-module flag toggle tested both directions. |
| G7 | Phase 7 exit | Vendor edit saved through shell, verified in Supabase. 7-day parallel run clean. |
| G8 (per module) | Phase 8 per-module | Module functional in shell. Per-module flag clean. 7-day clean. |
| G9 | Phase 9 exit | Boot smoke updated + passing. Bundle delta documented. 7-day post-decommission clean. |
| G10 | Phase 10 exit | R-03 and R-04 RESOLVED in GOVERNANCE_RISKS.md. |

---

## 5. ROLLBACK MATRIX

| Phase | Failure Symptom | Immediate Action | Recovery |
|---|---|---|---|
| 0 | Answers ambiguous or contradictory | Do not proceed. Surface to Michael. | Re-ask specific questions; update doc. |
| 1 | Worker deploy fails | Michael retries or rolls back to prior worker. | Fix underlying code; re-deploy. |
| 2 | Migration run errors | Michael runs rollback SQL. | Fix migration script; retry. |
| 3 | Branch creation conflict | Delete and recreate. | N/A — no source impact. |
| 4 | Boot smoke fails after tag injection | Remove three injected tags; commit. | Diagnose token/CSS conflict in branch. |
| 4 | Console errors with flag ON | Remove `<script>` tag; commit. | Patch shell init guard; re-inject. |
| 5 | Visual regression with flag ON | Set `localStorage.aos-shell-enabled=0` for affected user; broadcast `?shell=0` URL. | Diff DOM; identify CSS collision; surgical fix. |
| 5 | Visual regression with flag OFF | This is a coexistence bug. Revert wrapper commit. | Investigate; fix CSS scoping. |
| 5 | Keyboard handler conflict | Set master flag off. | Add capture-phase guard; rescope listener. |
| 6 | System Health diverges from legacy | Per-module flag off; legacy resumes. | Reconcile data query; re-port. |
| 7 | Vendor edit fails or diverges | Per-module flag off; legacy Vendors resumes. | Fix data path; re-verify parity. |
| 8 | Any module crashes | Per-module flag off immediately. | Fix in branch; re-merge; restart burn-in. |
| 9 | Post-decommission breakage | `git revert` the decommission commit. | Re-stage as smaller steps. |
| 10 | RLS policy locks out valid users | Disable new RLS policy; restore prior. | Fix policy specifics; test in staging. |

All rollbacks: surface incident to Michael per `STABILIZATION_PROTOCOL.md` § ROLLBACK PROTOCOL. Document in `SESSION_LOG.md`.

---

## 6. MICHAEL-BLOCKING ITEMS — CONSOLIDATED

Everything in this list requires Michael to act before the relevant phase can proceed.

| Item | Blocks | Action Required |
|---|---|---|
| BUG-01 / R-02 — Worker redeploy | Phase 1 exit | Run `wrangler deploy` from local terminal with Cloudflare credentials |
| M01 — RLS tightening | Phase 7 acknowledged | Run `sql/M01_rls_tightening.sql` via Supabase SQL editor |
| M02 — Core schema | Phase 7 start | Run `sql/M02_core_schema.sql` via Supabase SQL editor |
| M21–M29 — Module schemas | Phase 8 per-module | Run each Mx migration before corresponding module migration starts |
| Decision 1 — Feature flag architecture | Phase 0 exit | Confirm or modify flag resolution strategy |
| Decision 2 — Phase A trigger phrase | Phase 0 exit | Write the trigger phrase in `BUILD_PLAN_MICHAEL.md` |
| Decision 3 — Per-role rollout order | Phase 0 exit | Confirm owner-first or specify alternate order |
| Decision 4 — Phase F burn-in threshold | Phase 0 exit | Confirm 14-day threshold or specify alternate |
| Decision 5 — Build step timing | Phase 0 exit | Confirm "defer to Phase F" or specify alternate |
| Phase 2 authorization | Phase 4 start | Write authorization phrase in `BUILD_PLAN_MICHAEL.md` |
| Phase 5 approval | Phase 5 start | GATE-05: approve > 50 lines edit to `index.html` |
| Phase F authorization | Phase 9 start | Explicit written authorization for decommission commit |

---

## 7. DEPENDENCY MAP

```
Phase   │ Depends On          │ Blocks
────────┼─────────────────────┼──────────────────────────────────
P0      │ (root)              │ P1, P2, P3, P4, P5, P6, P7, P8, P9, P10
P1      │ P0                  │ Phase 4+ (if R-02 mid-incident)
P2      │ P0                  │ P7 (M02), P8 per-module (M21–M29)
P3      │ P0                  │ P4
P4      │ P0, P3, Michael auth│ P5
P5      │ P4 + 7d stable      │ P6
P6      │ P5 + 7d stable      │ P7
P7      │ P6 + 7d stable, M02 │ P8
P8      │ P7 + 7d stable      │ P9
P8-mod  │ prior module + 7d   │ next module in sequence
P9      │ P8 + 14d burn-in    │ P10
P10     │ P9, M01–M40 live    │ (terminal)
```
