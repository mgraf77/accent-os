# SAFE_MUTATION_ZONES

> Per-zone classification of where, and how, the AccentOS repository may safely be mutated.
> Analysis only — no implementation, no mutation, no governance change.
> Companion to `REPO_TOPOLOGY_MAP.md` and `FROZEN_FILE_PRESSURE_ANALYSIS.md`.
> Snapshot date: 2026-05-10.

---

## 0. CLASSIFICATION KEY

Each zone is classified along one of six tiers, ordered loosest → tightest:

| Tier | Meaning | Default action posture |
|---|---|---|
| **SAFE** | Doc / observation / append-only zone with no runtime behavior | Edit freely; no special procedure |
| **BOUNDED** | Real code or data, but small, well-contained, low blast radius | Edit with normal session protocol |
| **SUPERVISED** | Real code with non-trivial coupling — needs targeted attention | Edit only with awareness of consumers |
| **FROZEN** | Subject to current user directive or operational rule prohibiting change | Do not edit in this session class |
| **GOVERNANCE-ONLY** | Architecture / protocol documents — change the *rules*, not the *code* | Edit only as a deliberate protocol change |
| **PRODUCTION-CRITICAL** | High-blast surfaces (auth, REST surface, schema migrations) | Touch only with explicit owner approval |

A file may carry **two** classifications: a base tier plus an overlay (e.g., a SUPERVISED module may be PRODUCTION-CRITICAL during the auth window).

---

## 1. ZONE-BY-ZONE TABLE

### 1.1 SAFE (no runtime behavior; no production risk)

| Zone | Files | Notes |
|---|---|---|
| Skills observation logs | `skills/vibe-speak/observation-log.md`, `feedback-log.md`, `kpi-log.md`, `session-handoff.md`; `skills/efficiency-monitor/efficiency-log.md`, `session-end-summary.md`, `_aggregator.log` | Append-only by Stop hook + manual entries. Self-correcting if malformed (next session's reader will tolerate). |
| Skills protocol docs | All `skills/*/SKILL.md`, `skills/*/MODES.md`, `skills/_index.md`, `skills/*/references/*.md` | Doc-only. Behavior change only on next session boot. |
| Build/session running buffers | `PROMPT_LOG.md`, `PROMPT_QUEUE.md`, `WORK_IN_PROGRESS.md`, `SESSION_LOG.md` | Session-scoped scratch. Non-canonical. |
| Lessons / KPI append-only logs | `BUILD_INTELLIGENCE.md`, `KPI_CATALOG.md` | Append-only. Treat existing entries as immutable; only new entries are added. |
| Output styles | `.claude/output-styles/*` | Cosmetic. |
| Documentation directory | `docs/runtime/*` (this pack) | Analysis pack. |
| Cartography / scout reference material | `skills/repo-scout/references/*` | Static reference. |

**Posture**: write at will, do not over-engineer. Keep additions concise per `MASTER.md` "Blank beats guessed" rule.

---

### 1.2 BOUNDED (real code; small surface; low blast)

| Zone | Files | Boundary |
|---|---|---|
| Small modules (<300 LOC) | 17 of 38 modules: `bulk_select`, `digest`, `health`, `quick_actions`, `saved_filters`, `vendor_score_import`, `commission`, `decision_engine`, `inventory_analytics`, `pipeline_analytics`, `price_book`, `my_tasks`, `reports`, `demand_forecast`, `bulk_select`, `csv_import`, `activity_feed` | Each owns one feature page; minimal cross-module surface |
| Worker config | `wrangler.toml` | 6 LOC config; only mutated when proxy contract changes |
| Module mode registry data (additive) | `module_modes.json` (new entries / `notes` field updates) | Adding a new module entry or moving an `idea_only` → `planning` is bounded |
| Status/efficiency scripts | `scripts/status.sh`, `scripts/efficiency-aggregate.sh`, `scripts/auto-categorize.js` | Self-contained; failure mode is silent boot/end-hook |
| Patches dir convention | `patch_quote.js` (if relocated) | Currently orphaned; treat as bounded-disposable |

**Posture**: Normal session protocol applies. Bump `?v=` if a small module's behavior changes. Test the single page that the module owns.

---

### 1.3 SUPERVISED (real code; non-trivial coupling)

| Zone | Files | Why supervised |
|---|---|---|
| Large modules (300–800 LOC) | `customers` (768), `jobs` (621), `marketing` (556), `trade_partners` (525), `alerts` (504), `purchase_orders` (493), `module_modes` (486), `warranty` (483), `inventory` (470), `showroom_displays` (428), `deliveries` (402), `employees` (406), `global_search` (408), `calendar` (399) | Heavy state inside one file; `window.*` debounce timers; multiple sbFetch surfaces; cross-references to other modules via global lookups |
| Super-module | `internal_meetings.js` (2,436) | Six sub-features sharing `IM_` state; two Realtime channels; six tables. **See FROZEN_FILE_PRESSURE_ANALYSIS §9.** |
| New SQL migrations | `sql/M41+` (next migration) | New migrations are bounded individually but have a hard ordering invariant relative to prior migrations — apply discipline matters |
| Module-mode resolver | `js/module_modes.js` | Resolver logic that gates UI for every role × every module |

**Posture**:
1. Read the file end-to-end (or grep for affected globals) before editing.
2. List every consumer of any global `window.*` you touch.
3. Bump the script-tag `?v=` in `index.html` (this *is* a shell touch — surface it).
4. After edits, mentally walk the page that owns the file, plus any page whose module reads a global the touched file declares.

---

### 1.4 FROZEN (do not edit in this session class — by user directive or operational rule)

| Zone | Files | Why frozen here |
|---|---|---|
| Application shell | `index.html` | Explicit user directive (current task), production criticality, 76→81 % of 900 KB hard cap |
| Cloudflare Worker | `worker/anthropic-proxy.js` | Explicit user directive (current task); also stable contract by design |
| Already-applied SQL migrations | `sql/M01..M40` (all 25) | Append-only discipline; Supabase MCP-broken (manual paste) makes re-edits expensive and risky |
| Design system constants | CSS vars, fonts (currently inside `index.html` `<style>`) | `MASTER.md` §4: "LOCKED — never changes" |
| Patch artifact | `patch_quote.js` | One-time payload at root; do not modify in-place — relocate or run-once |
| Anthropic proxy contract | `wrangler.toml` `name`, `main` keys | Bound to deployed Cloudflare Worker name |

**Posture**: Do not write to these files. If a need to change one arises, **stop and ask** — these are the only files where "ask before acting" is the default.

---

### 1.5 GOVERNANCE-ONLY (changes the rules, not the code)

| Zone | Files | What it controls |
|---|---|---|
| Architectural source of truth | `MASTER.md` | Build rules, code patterns, schema, tech decisions, operating model |
| Active build checklists | `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md` | What's being worked on now; check-off [x] is the source of "what's done" |
| Module-mode protocol | `MODULE_MODES.md` | The *protocol* for `module_modes.json` — separate from the data file itself |
| Auto-execute instructions | `.claude/CLAUDE.md` | Session boot sequence read on every session |
| Harness configuration | `.claude/settings.json` | `dangerouslySkipPermissions`, Stop hook |
| Skill registry | `skills/_index.md` | Which skills are discoverable to Step 23 router |
| Vibe-speak profiles + modes | `skills/vibe-speak/profiles/*.md`, `skills/vibe-speak/modes/*.md` | Default communication mode + per-user calibration |
| README / public face | `README.md` | Public-repo first impression |

**Posture**: A change here is a *protocol change*. It updates how the *next* session behaves, not what the current code does. Write through these only with deliberate intent and ideally one governance-only commit per session (per `MASTER.md` "batched-doc-update" rule).

---

### 1.6 PRODUCTION-CRITICAL (overlay tier — applies on top of base)

These are surfaces where the worst-case failure is catastrophic. Several are inside FROZEN files (so they are doubly protected); some live inside SUPERVISED modules.

| Surface | Located in | Failure mode |
|---|---|---|
| Auth block — `tryRestoreSession`, `doLogin`, `applyRoleVisibility`, `CU` | `index.html` (FROZEN) | App dark for all users |
| `sbFetch` REST surface | `index.html` (FROZEN) | Every Supabase-touching module fails |
| Supabase anon key handling — `aos-sb-key` sessionStorage, `sbConfigured` | `index.html` (FROZEN) | Auth/data fetch broken |
| Sidebar `<a data-roles>` attributes | `index.html` (FROZEN) | Role-leak / role-deny |
| Script-tag manifest | `index.html` (FROZEN) | Module silently shadowed or load order broken |
| `module_modes.json` `live` entries | `module_modes.json` (BOUNDED for additions, PRODUCTION-CRITICAL for live-state changes) | Demoting `live` blanks a module for non-Owner roles |
| `canSeeModule` resolver | `js/module_modes.js` (SUPERVISED) | Visibility gating disabled or over-permissive |
| Anthropic proxy | `worker/anthropic-proxy.js` (FROZEN) | All in-app AI features fail |
| RLS policies | `sql/M01_rls_tightening.sql` (FROZEN-applied) | Data exposure or denial |
| Audit log writes | `sbAuditLog` in shell (FROZEN) + `audit_log` table | Compliance/observability gap |
| Vendor data variable name `VD_RAW` | `index.html` (FROZEN) | Hard-rule: search must use `VD_RAW`, never `VENDORS`/`VENDOR_DATA` (`MASTER.md` §12) |

**Posture**: Whether or not the base zone is otherwise editable, **a touch on a PRODUCTION-CRITICAL surface is treated as if it were FROZEN-by-rule unless explicitly authorized**.

---

## 2. ZONE-PRESSURE OVERLAY

Pressure (mutation cadence × blast radius) plotted against safety classification:

```
  blast →
  ▲
  │ PROD-CRITICAL ───── index.html shell auth      ◀── highest combined risk
  │                     sbFetch
  │                     sidebar data-roles
  │
  │ FROZEN         ───── M01..M40 applied          ◀── frozen but cold (low pressure)
  │                     wrangler.toml
  │                     worker/anthropic-proxy.js
  │
  │ SUPERVISED    ───── internal_meetings.js       ◀── highest pressure non-frozen
  │                     customers, jobs, marketing,
  │                     trade_partners, ...
  │                     module_modes.js
  │
  │ BOUNDED       ───── small modules (<300 LOC)
  │                     module_modes.json (adds)
  │                     scripts/, wrangler config
  │
  │ GOVERNANCE    ───── MASTER.md, BUILD_PLAN_*,   ◀── doc-only; deliberate edits
  │                     MODULE_MODES.md, .claude/
  │
  │ SAFE          ───── PROMPT_LOG, SESSION_LOG,
  │                     observation logs, docs/
  └────────────────────────────────────────────────────────► cadence
```

The interesting observation: **the high-cadence zones (SUPERVISED + BOUNDED + module_modes.json adds) sit beneath, not within, the high-blast zones**. That gap is what makes day-to-day work tractable. The danger surfaces appear when pressure on the SUPERVISED tier (especially `internal_meetings.js`) starts to *push* into the FROZEN tier — i.e. forces a shell touch.

---

## 3. ZONE → DECISION MATRIX

For each common operation, the right zone discipline:

| Operation | Where it lands | Required discipline |
|---|---|---|
| Add a sidebar entry for a new module | `index.html` (PROD-CRITICAL) + `module_modes.json` (BOUNDED) + new module file (BOUNDED/SUPERVISED) | Out-of-scope this task; normally requires shell touch with `?v=` bump |
| Bump a module's behavior (no new feature) | Module file (BOUNDED/SUPERVISED) + `index.html` `?v=` (PROD-CRITICAL line, but tiny edit) | Surgical `?v=` patch only |
| Add a new SQL migration | `sql/M41+.sql` (BOUNDED at write, FROZEN once applied) | Write file; provide SQL for manual paste; never re-edit after applied |
| Edit a `live` module mode → `building` | `module_modes.json` (PROD-CRITICAL overlay) | Stop and confirm — demoting `live` is blast-radius-equivalent to taking a feature offline |
| Move an `idea_only` → `planning` | `module_modes.json` (BOUNDED) | Free |
| Update `BUILD_INTELLIGENCE.md` after a session | append-only (SAFE) | Free |
| Update `MASTER.md` after a session | GOVERNANCE-ONLY | Single batched doc-update commit; do not interleave with build commits |
| Refactor `internal_meetings.js` | SUPERVISED | Out of scope this task; would require sub-file split — see `FROZEN_FILE_PRESSURE_ANALYSIS §9` |
| Change CSS / design tokens | FROZEN (currently inside `index.html`) | Stop and confirm |
| Patch the Cloudflare Worker | FROZEN (this task) | Stop and confirm |
| Create / amend a skill | SAFE | Free |
| Edit `.claude/CLAUDE.md` | GOVERNANCE-ONLY | Deliberate; affects every future session |

---

## 4. HIDDEN ENTROPY GENERATORS

(Why the safe-zone surface keeps shrinking even when no one is changing the rules.)

1. **Every new module = 4 shell touchpoints.** Script tag, sidebar `<a data-roles>`, `module_modes.json` entry, `?v=` bump on neighbors. Three of those four sit in PROD-CRITICAL or FROZEN-overlay surfaces.
2. **Every new SQL migration = an unverifiable manual-paste step.** The file is bounded but the *gap* between "file written" and "DB applied" is invisible to the codebase.
3. **Every new module = N new globals.** No namespacing convention; `window._<prefix>...` is a discipline. Each addition increases collision surface.
4. **Every cache-bust change is hand-authored.** Forgetting one is a silent production bug.
5. **`MASTER.md` ages slowly relative to reality.** The "post-split" structure section already describes a 4-module world; the actual world is 38 modules. Doc-vs-code drift is itself a hidden entropy generator.
6. **`BUILD_INTELLIGENCE.md` grows monotonically.** Each session adds entries; eventually session-boot reads of that file approach context-budget limits — at which point the lesson register that exists *to prevent* errors becomes a *cause* of error (because lessons are skimmed instead of read).
7. **Three sources of truth for module visibility.** `module_modes.json` ↔ resolver ↔ `data-roles` HTML. Drift between any two is a silent visibility bug.

These are the entropy generators that **only** an out-of-band cleanup (decomposition / governance-collapse) can stop.

---

## 5. FUTURE MAINTENANCE TRAPS

Patterns that will become traps if left in place.

| Trap | Where it lives | Eventual cost |
|---|---|---|
| Surgical-patch dependency on shell-uniqueness of `old_string` | `index.html` | Each patch costs more tokens to identify a unique anchor; eventually patches will require Read-the-whole-shell → context blow-up |
| Manual `?v=` cache busts | `index.html` script tag manifest | Forgotten bump → users on stale JS → unreproducible bug reports |
| `MASTER.md` describing a 4-module world | `MASTER.md` §3, §4 | New collaborators (or future Claude sessions) trust the doc and miss the 38-file reality |
| `module_modes.json` `live` count growing without sidebar audit | Three-source-of-truth illusion zone | Live demotion or rename desyncs sidebar |
| `internal_meetings.js` continuing to grow | SUPERVISED → effectively a second shell | Once it crosses ~3,000 LOC it will inherit `index.html`'s pressure profile at module scale |
| Append-only `BUILD_INTELLIGENCE.md` | Root-level | Token-pressure tax on every future session boot |
| `patch_quote.js` at root | Root | Normalized side-channel mutation source |
| Codespace-only build rule (`MASTER.md` §12.1) | Operating rule | Anyone outside Codespace cannot help; single-environment fragility |

---

## 6. ARCHITECTURAL ILLUSION ZONES (RECAP — see REPO_TOPOLOGY_MAP §6 for full)

These are the places where the surface story claims modularity but the runtime says otherwise. They are the priority target for any future cleanup, because they are the source of most of the entropy listed in §4.

1. Module isolation asserted in `MASTER.md` but unenforced by code.
2. Three sources of truth for module visibility (registry data + resolver + `data-roles`).
3. The "file split" shipped in 0.1 is partial — shell never actually shrunk.
4. Cache-bust query strings hand-authored on every module touch.
5. `internal_meetings.js` is shell-shaped inside, module-shaped outside.
6. `patch_quote.js` is a side-channel sitting at the repo root.

Each of these is a *zone-classification illusion*: a place that *looks* like a SAFE/BOUNDED zone but actually behaves as a PROD-CRITICAL one because of hidden coupling.

---

## 7. ZONE QUICK-CARD (TL;DR FOR FUTURE SESSIONS)

```
SAFE                — skills logs, docs/, PROMPT_LOG, SESSION_LOG, BUILD_INTELLIGENCE
BOUNDED             — small modules (<300 LOC), module_modes.json adds, scripts/
SUPERVISED          — large modules, internal_meetings.js, module_modes.js, new SQL
FROZEN              — index.html, worker/, applied sql/M01..M40, wrangler.toml,
                      design tokens (in shell), patch_quote.js
GOVERNANCE-ONLY     — MASTER.md, BUILD_PLAN_*, MODULE_MODES.md, .claude/
PROD-CRITICAL       — auth, sbFetch, RLS, sidebar data-roles, anthropic proxy,
                      live module_modes entries, audit_log
```

When in doubt: classify the file, then classify the *line* — a SUPERVISED file may contain a PRODUCTION-CRITICAL line, and the line wins.

---

*End of zone classification. For why the shell is the binding constraint, see `FROZEN_FILE_PRESSURE_ANALYSIS.md`. For the full repo map, see `REPO_TOPOLOGY_MAP.md`.*
