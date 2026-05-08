# ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md — Safe Shell Integration Plan
> Strategy for progressively integrating the AccentOS shell prototype into the production `index.html` monolith.

| Field | Value |
|---|---|
| Status | Draft — Phase 1 planning artifact |
| Owner | Claude |
| Last Updated | 2026-05-08 |
| Authority | **Planning only.** This document is NOT authorization to integrate. It describes the safest plan to execute *if and when* Michael authorizes Phase 2 per `STABILIZATION_PROTOCOL.md`. |
| Supersedes | None |
| Related | `ACCENTOS_UI_SYSTEM.md`, `ACCENTOS_LAYOUT_ARCHITECTURE.md`, `ACCENTOS_TOKENS.md`, `STABILIZATION_PROTOCOL.md`, `GOVERNANCE_RISKS.md` |

---

## 1. PURPOSE & SCOPE

### What this document is
- A sequenced, six-phase rollout plan for moving production from the legacy `index.html` chrome to the new AccentOS shell.
- A safety analysis: what can break, where, and how to roll back at each step.
- A decision-log capturing open questions that must be resolved before integration begins.

### What this document is NOT
- Not approval to modify `index.html`. R-01 (monolith size) and the STABILIZATION_PROTOCOL Phase Gate make any shell integration a Phase 2 activity, currently gated.
- Not a redesign. The shell, tokens, and layout are already specified; this only governs the *integration path*.
- Not a security plan. Real role enforcement is Phase 4 (RLS + JWT claims) and is independent of this rollout.
- Not a build-step proposal. AccentOS remains a no-framework, no-bundler product through Phase E.

### Hard constraints inherited from governance
- `worker/anthropic-proxy.js` and `wrangler.toml` are untouchable in this rollout (GATE-01).
- No SQL migrations triggered by shell adoption (GATE-02; M01–M40 are Michael's gate).
- No production-breaking change at `accent-os.pages.dev` (GATE-03).
- Any session edit to `index.html` > 50 lines requires explicit Michael approval (GATE-05, R-01).
- UI role visibility is never represented as security (R-04).

---

## 2. CURRENT STATE INVENTORY

### File inventory

| Path | Role | Touchable in this rollout? |
|---|---|---|
| `index.html` (7,169 lines) | Production monolith — chrome + all module logic | Surgical only, < 50 lines/session |
| `js/*.js` | Extracted module logic (ongoing) | Yes |
| `worker/anthropic-proxy.js` | Cloudflare Worker AI proxy | **No** (GATE-01) |
| `wrangler.toml` | Worker deploy config | **No** (GATE-01) |
| `supabase/migrations/M01–M40` | Pending RLS + schema migrations | **No** (Michael's gate) |
| `ui/tokens.css` | Design tokens, `:root` custom properties | Yes — load-only side-effect |
| `ui/accentos-shell.css` | Shell layout/components, `.aos-*` + `.accentos-shell` scoped | Yes |
| `ui/accentos-shell.js` | Shell behavior, `window.AccentOS.shell.*` API | Yes |
| `ui/accentos-shell-prototype.html` | Isolated demo page | Reference only |

### Shell public API surface (from `ui/accentos-shell.js`)

`window.AccentOS.shell` exposes:

| Method | Purpose |
|---|---|
| `openCommandLauncher()` | Open Cmd/Ctrl+K command palette overlay |
| `closeCommandLauncher()` | Close command palette |
| `openRail(title, htmlContent)` | Open right-rail inspector with title + HTML body |
| `closeRail()` | Close right-rail inspector |
| `activateNavItem(moduleKey)` | Mark a sidebar/bottom-nav item active |
| `toggleSidebar()` | Collapse/expand sidebar; persists `aos-sidebar-collapsed` |
| `setMode(mode)` | Switch shell mode: `normal` / `focus` / `urgent` / `exec` / `readonly`; persists `aos-mode` |
| `openNotifPanel()` / `closeNotifPanel()` | Notification panel |
| `updateNavBadge(module, count, type)` | Mutate sidebar nav item badge |
| `showToast(msg, type)` | Bottom-centered ephemeral toast (`success`/`warning`/`error`/`info`) |

DOM events:
- `aos:navigate` (CustomEvent, `detail.module`) — fired when a nav item is clicked. **This is the integration seam.** Legacy code subscribes here to switch module views.

### Production modules (in `index.html`) vs prototype simulation

| Module | Production state (`index.html`) | Prototype state (`ui/`) |
|---|---|---|
| Dashboard / Daily Briefing | Live, rendered as root surface | Card-grid stub |
| Vendor Intelligence | Live, full data layer | Static demo card |
| Quote Generator | Live, AI-dependent (R-02 blocks AI parse) | Static demo card |
| Product Lookup | Live | Static demo card |
| Fixture Finder | Live | Static demo card |
| Pricing Tools | Live | Not represented |
| Rep Management | Live | Not represented |
| Customer Workflows | Live | Not represented |
| Builder/Designer Workflows | Live | Not represented |
| Reports | Live | Static demo card |
| AI Tools | Live | Not represented |
| Integrations | Live | Not represented |
| Governance / Admin | Live | Not represented |
| **System Health** | Live, read-only DB/worker pings | Card stub — *recommended Phase C target* |

Modules absent from the prototype are an asset, not a liability — they remain untouched legacy until their migration phase.

---

## 3. COEXISTENCE MODEL

### Why a big-bang replacement is unacceptable

- **R-01 monolith size.** Replacing 7,169 lines of chrome+content in one commit is impossible to review and impossible to roll back surgically.
- **GATE-05** caps any single-session `index.html` edit at 50 lines without explicit approval.
- **GATE-03** forbids any change that could break production. A whole-shell swap introduces dozens of correlated risks.
- **R-02 worker redeploy is still pending** — production AI is partially broken right now. Adding shell churn on top of that compounds the diagnostic surface.

### The "shell-as-frame, monolith-as-content" pattern

```
┌─ NEW SHELL CHROME (ui/) ─────────────────────────────────┐
│ aos-header │ aos-ticker                                    │
├──────────┬──────────────────────────────────┬─────────────┤
│ aos-     │  ┌────────────────────────────┐  │ aos-rail    │
│ sidebar  │  │  LEGACY MONOLITH BODY       │  │ (new)       │
│ (new)    │  │  (existing index.html       │  │             │
│          │  │   module DOM, untouched)    │  │             │
│          │  └────────────────────────────┘  │             │
└──────────┴──────────────────────────────────┴─────────────┘
                              ▲
                              │ legacy content lives here
                              │ unchanged for Phases A–B
```

The shell renders the **frame**. The monolith continues to render its **content** inside that frame. Module migration happens one card at a time (Phases C–E), not all at once.

### CSS coexistence — why tokens + shell.css can sit alongside legacy CSS

1. **Custom property namespace is global by design.** `:root { --layer-canvas: ...; }` is a definition; legacy CSS that doesn't reference these tokens is unaffected. Token additions are purely additive.
2. **Shell CSS is class-scoped.** `accentos-shell.css` rules are written under `.accentos-shell`, `.aos-header`, `.aos-card`, etc. They do not select bare element types globally. Legacy `<button>`, `<table>`, and ID-selector rules in `index.html` win where they currently win.
3. **`aos-` prefix on every shell class.** No collision risk with legacy class names unless legacy already uses `aos-` (verifiable with one grep before Phase A).
4. **Specificity is intentional.** Shell components rely on class selectors (specificity 0,1,0). Legacy rules using IDs (0,1,0,0) automatically override inside the legacy body subtree.
5. **Token override is opt-in.** If a legacy CSS variable name collides with a shell token, scope the legacy block under a wrapper class to isolate it; do not redefine the token at `:root`.

### JS coexistence

- The shell exposes a single global: `window.AccentOS.shell`. Verify before Phase A that `window.AccentOS` is unused in the monolith. If used, the shell namespaces under `window.AccentOS.shell` only — legacy can keep `window.AccentOS.<other>`.
- Shell event listeners are attached to `document` (Cmd/K, Esc) and to specific `.aos-*` elements. They do not blanket-bind to legacy DOM.
- The `aos:navigate` CustomEvent is the only required integration seam.

---

## 4. PROGRESSIVE ROLLOUT — SIX PHASES

| Phase | Trigger | Scope | Files Touched | Rollback | Exit Criteria |
|---|---|---|---|---|---|
| **A** Side-load | Michael authorizes Phase 2 | Add shell assets behind feature flag, no visible change | `index.html` (≤ 10 lines: link/script tags + flag check) | Remove the tags | Boot smoke passes with flag on AND off; no visual regression with flag off |
| **B** Outer chrome | Phase A stable for ≥ 1 week, no incidents | Mount shell as outer frame, monolith body inside `aos-content` slot | `index.html` (~30–50 lines: wrapper insertion + flag-gated render) | Toggle flag off; remove wrapper | Shell renders header/sidebar/rail; legacy modules still functional inside |
| **C** First module — System Health | Phase B stable for ≥ 1 week | Migrate System Health (read-only) to shell-native rendering | `js/system-health.js` (new), `index.html` (small hook) | Restore legacy System Health code path under flag | New System Health renders in shell; legacy path removable |
| **D** Read-write module — Vendors | Phase C stable for ≥ 1 week | Migrate Vendor Intelligence (has cleanest data layer) | `js/vendors-shell.js` (new), `index.html` (route) | Re-enable legacy Vendors under flag | Vendors render + edit through shell; data parity verified |
| **E** Remaining modules | Per-module readiness | Port each remaining module, oldest-stable-first | `js/<module>.js` per module | Per-module flag toggles fall back to legacy | All modules ported; legacy renderers behind dead flags |
| **F** Decommission | Phase E complete + 2 weeks burn-in | Remove legacy chrome + dead code from `index.html` | `index.html` (large delete; bundle to multi-file at this point) | Revert commit | Bundle size reduction measured; boot smoke updated |

### Phase A — Side-load
- **Trigger:** Michael writes "Phase 2 authorized" in `BUILD_PLAN_MICHAEL.md` and the WIP log is clean.
- **Scope:** Inject `<link rel="stylesheet" href="ui/tokens.css">` and `<link rel="stylesheet" href="ui/accentos-shell.css">` into `<head>`, and `<script src="ui/accentos-shell.js" defer>` before `</body>`. Gate visible shell rendering on a feature flag (Section 6). With flag OFF, only the CSS variables and JS API are present — no DOM is added by the shell.
- **Files touched:** `index.html` (≤ 10 lines).
- **Rollback:** Delete the three tags. Zero residual state.
- **Exit criteria:** `bash scripts/boot-smoke.sh` passes, visual diff against pre-Phase-A is empty for default users.
- **Blocking risks:** R-02 worker redeploy unresolved → defer if Quote Generator is mid-incident.

### Phase B — Outer chrome
- **Trigger:** Phase A stable ≥ 7 days, no defect tickets referencing UI/CSS.
- **Scope:** When the flag is on, wrap the legacy body in the shell skeleton:
  ```
  <div class="accentos-shell">
    <header class="aos-header">…</header>
    <div class="aos-ticker">…</div>
    <div class="aos-shell-grid">
      <aside class="aos-sidebar">…</aside>
      <main class="aos-content">
        <!-- legacy monolith body mounted here, untouched -->
      </main>
      <aside class="aos-rail">…</aside>
    </div>
  </div>
  ```
  Sidebar nav items dispatch `aos:navigate`; an adapter listens and calls the existing legacy module-switch function.
- **Files touched:** `index.html` (~30–50 lines, will require GATE-05 approval).
- **Rollback:** Flag off; remove wrapper.
- **Exit criteria:** All 14 modules navigable through the new sidebar via the adapter; legacy nav still works concurrently.
- **Blocking risks:** Z-index collisions (Section 10), keyboard collisions (Section 10).

### Phase C — Migrate System Health (read-only)
- **Trigger:** Phase B stable ≥ 7 days.
- **Scope:** Re-implement System Health as a shell-native module: `js/system-health.js` exports `mount(container)`, called when `aos:navigate` fires with `module === 'system-health'`. Legacy code path remains, gated by the same feature flag.
- **Why System Health first:** Read-only, low blast radius, no writes to Supabase, no AI dependency, easy data parity check.
- **Files touched:** `js/system-health.js` (new), `index.html` (route hook, ≤ 20 lines).
- **Rollback:** Disable the new route; legacy path resumes.
- **Exit criteria:** New System Health matches legacy output for 7 days. No incidents.
- **Blocking risks:** None expected; this is the lowest-risk module.

### Phase D — Migrate Vendor Intelligence (read-write)
- **Trigger:** Phase C stable ≥ 7 days.
- **Scope:** Port Vendor Intelligence. It has the cleanest data layer per `MODULE_OWNERSHIP_MAP.md` and supports the right-rail inspector pattern naturally (vendor card → inspector).
- **Files touched:** `js/vendors-shell.js` (new), `index.html` (route hook).
- **Rollback:** Per-module flag toggles back to legacy Vendor renderer.
- **Exit criteria:** Edit parity with legacy verified; no data drift.
- **Blocking risks:** R-03 RLS still pending → vendor writes still go through anon policies; do not present new UI as having tightened security.

### Phase E — Remaining modules
- **Trigger:** Per-module readiness; oldest-stable-first ordering (modules that haven't changed in months port first; AI-adjacent modules port last).
- **Suggested order:**
  1. Product Lookup
  2. Fixture Finder
  3. Reports
  4. Pricing Tools
  5. Rep Management
  6. Customer Workflows
  7. Builder/Designer Workflows
  8. Integrations
  9. Governance / Admin
  10. AI Tools (last — R-02 dependency)
  11. Quote Generator (last — most complex + AI-dependent)
- **Per-module pattern:** new `js/<module>.js`; per-module feature flag; data parity verification; one-week burn-in.
- **Rollback:** Per-module flag flip to legacy.

### Phase F — Decommission
- **Trigger:** Phase E complete + all per-module flags ON in production for ≥ 14 days with zero rollbacks.
- **Scope:**
  - Delete legacy chrome from `index.html`.
  - Delete dead per-module legacy renderers.
  - Split the remaining `index.html` into multi-file: one ES module per business module under `js/modules/`.
  - Optionally introduce a build step (defer decision until this phase — see Section 9).
- **Files touched:** `index.html` (large delete, requires GATE-05 + Michael approval), new `js/modules/*.js` files.
- **Rollback:** `git revert` of the decommission commit.
- **Exit criteria:** Bundle size measured before/after; boot smoke updated to verify the *new* pattern only.

---

## 5. LOW-RISK INJECTION POINTS IN `index.html`

Described by anchor, not line number, since line numbers will rot. Verify with grep at integration time.

### Candidate 1 — After legacy top-nav, before main content container (RECOMMENDED for Phase B)
- **Anchor:** Immediately after the closing tag of the existing top navigation/header, before the existing main content `<div>`/`<main>`.
- **Tradeoffs:** Cleanest separation; legacy header survives below for direct comparison; rollback = remove wrapper. Allows running both chromes side-by-side during burn-in if desired.
- **Risk:** Slightly larger initial DOM footprint.

### Candidate 2 — Wrap entire `<body>` interior
- **Anchor:** First child of `<body>` and last child of `<body>`.
- **Tradeoffs:** Maximum isolation of legacy DOM; shell owns the viewport. Most architecturally correct end-state. **Largest single-edit footprint** — likely > 50 lines, will trip GATE-05.
- **Risk:** Higher review burden in one shot. Better deferred to Phase F.

### Candidate 3 — Replace existing top header element only
- **Anchor:** Replace the existing `<header>` / top-nav element with `<header class="aos-header">`.
- **Tradeoffs:** Smallest visual delta; lowest line count.
- **Risk:** Doesn't get sidebar/rail benefits. Useful as a sub-step within Phase B if the full wrap is too large for one session.

### Candidate 4 — Mount as separate route at `/shell.html`
- **Anchor:** Not in `index.html` at all — keep `ui/accentos-shell-prototype.html` as a separate route, stage Phase B–E behavior there before merging.
- **Tradeoffs:** Zero risk to production. **Does not deliver progressive integration** — just defers it.
- **Risk:** Dual-maintenance burden grows. Useful as a *staging* area, not a destination.

**Recommendation:** Use Candidate 4 for pre-flight rehearsal, Candidate 1 for Phase B production landing, Candidate 2 only at Phase F.

---

## 6. FEATURE FLAG STRATEGY

### Layered flag resolution (highest priority first)

1. **URL query param override** — `?shell=1` forces on, `?shell=0` forces off, for the current page load only. Used by Michael and Claude for testing.
2. **localStorage `aos-shell-enabled`** — persistent per-browser opt-in. Set via `?shell=1` on first visit, or programmatically.
3. **Per-role default** — read from the current `users.role` value. Suggested rollout order: `owner` → `admin` → `manager` → `staff` → `viewer`. Each role flips on after the previous role has been stable for ≥ 7 days.
4. **Global default** — `false` until Phase F.

### Resolution pseudocode (no implementation in this rollout)

```
function isShellEnabled() {
  const q = new URLSearchParams(location.search);
  if (q.get('shell') === '1') return true;
  if (q.get('shell') === '0') return false;
  const ls = localStorage.getItem('aos-shell-enabled');
  if (ls === '1') return true;
  if (ls === '0') return false;
  if (currentUserRoleHasShellDefault()) return true;
  return false;  // kill-switch default
}
```

### Kill-switch behavior

- Missing flag, malformed flag, or any thrown exception in flag resolution → **return false** → legacy chrome renders.
- The shell never renders by default during Phases A–E. Phase F flips the global default to true.

### Per-module flags (Phases C–E)

- Format: `aos-shell-module-<key>` (e.g., `aos-shell-module-vendors`).
- Resolution: same precedence as the master flag.
- Allows per-user opt-in to a single migrated module while keeping the rest legacy.

---

## 7. ROLLBACK PROTOCOL PER PHASE

All rollbacks follow `STABILIZATION_PROTOCOL.md` § ROLLBACK PROTOCOL: prefer `git checkout HEAD -- <file>` then `git revert HEAD`; never `git reset --hard` without Michael.

| Phase | Symptom | Immediate Action | Recovery Action |
|---|---|---|---|
| A | Boot smoke fails after asset side-load | Delete the three injected tags; commit | Diagnose token/CSS conflict in branch; re-attempt |
| A | Console error from `accentos-shell.js` on legacy pages | Add `defer` if missing; otherwise remove `<script>` tag | Patch shell init guard; re-attempt |
| B | Visual regression with flag ON | Set `localStorage.aos-shell-enabled=0` for affected user; broadcast `?shell=0` URL | Diff DOM; identify collision; surgical CSS fix |
| B | Visual regression with flag OFF | This is a coexistence bug — revert wrapper commit | Investigate why a flag-OFF render path was affected |
| B | Keyboard handler conflict (Cmd+K, Esc) | Set master flag off; users unaffected | Add capture-phase guard or scope listener to `.accentos-shell` only |
| C–E | New module diverges from legacy | Per-module flag off; legacy resumes | Reconcile data parity; re-port |
| C–E | New module crashes | Same — per-module flag off | Fix; redeploy under flag |
| F | Post-decommission breakage | `git revert` the decommission commit | Re-stage as smaller decommission steps |

For any phase: surface the incident immediately to Michael per STABILIZATION_PROTOCOL § ROLLBACK PROTOCOL step 5 (what broke, what was reverted, what still needs fixing).

---

## 8. MIGRATION BOUNDARIES — WHAT MUST NOT CROSS

These boundaries are absolute. Crossing any one of them turns this rollout into a different (gated) project.

### Auth state
- Auth is deferred to Phase 4 of governance.
- The shell may **read** a current user role from a global already populated by the monolith. It must not establish, refresh, or persist auth tokens.
- Role-based UI hiding is `display:none` only and is documented as UX filtering, not security (R-04).

### RLS enforcement
- The shell must not present itself, in copy or in code comments, as enforcing role permissions.
- All write paths continue to go through whatever the monolith already uses. R-03 (RLS not yet tightened) is unchanged by this rollout.
- When R-03 resolves, the shell is unaffected — it never owned that boundary.

### Worker proxy interface
- No shell-side code calls `worker/anthropic-proxy.js` directly until Phase E *at the earliest*, and only as a wrapped call to existing monolith helpers.
- `wrangler.toml` is untouchable (GATE-01).
- R-02 (worker redeploy pending) is independent; this rollout does not depend on it being resolved.

### SQL schema
- No shell phase triggers a SQL migration. M01–M40 remain Michael's gate.
- The shell must not read columns that don't yet exist; if a planned column is part of a pending migration, the shell renders a placeholder until the migration lands.

### Bundle structure
- Phases A–E preserve the single-file monolith. Multi-file extraction is a Phase F decision, taken explicitly.

---

## 9. FUTURE ROUTE STRATEGY

### Client-side routing (history API)
- **Today:** monolith uses URL hashes (`#vendors`, `#quotes`).
- **Phase A–E:** keep hash routing. The shell respects hashes and dispatches `aos:navigate` to legacy adapters.
- **Phase F:** revisit. History API only justifies its complexity if deep-linking, back-button, or share-URL semantics become a real requirement. Default: **stay on hashes**.

### Multi-file extraction
- **Phase A–E:** keep `index.html` as the entry, side-loaded `ui/*` and `js/*` extracted modules.
- **Phase F:** extract one ES module per business module under `js/modules/`. One module per file is the target. Loaded via `<script type="module">` — still no bundler.

### Build step
- **Recommendation: do not introduce a bundler until Phase F, and only if minification/tree-shaking measurably improves boot time.**
- AccentOS is internal; first-paint is dominated by network and DB calls, not JS parse. A bundler adds CI complexity and a redeploy surface that is currently absent.
- If introduced: prefer esbuild or vite, output a single bundle, keep `ui/` source-of-truth tree intact for diffing.

### Phase F target structure

```
index.html          ← shell skeleton + ES module entrypoint
ui/
  tokens.css
  accentos-shell.css
  accentos-shell.js
js/
  modules/
    vendors.js
    quotes.js
    products.js
    fixtures.js
    pricing.js
    reps.js
    customers.js
    builders.js
    reports.js
    ai-tools.js
    integrations.js
    admin.js
    system-health.js
  shared/
    supabase-client.js
    worker-client.js
```

One module = one ES module file. No new top-level globals beyond `window.AccentOS`.

---

## 10. COEXISTENCE RISKS & MITIGATIONS

### R-S01 — Z-index collisions
- **Risk:** Shell uses documented z-indices `--z-header` (200), `--z-rail` (300), `--z-fab` (400), `--z-command` (800). Legacy `index.html` likely uses ad-hoc z-indices (commonly 9999, 99999) for modals.
- **Mitigation:** Pre-Phase-A audit — grep `index.html` for `z-index` and catalog every value. If legacy values exceed 800, raise `--z-command` to a token still under 9000 to keep order predictable, OR scope the legacy modal stack under a stacking context that resets above the shell.

### R-S02 — Event handler doubling
- **Risk:** Shell binds `keydown` on `document` for **Cmd/Ctrl+K** and **Escape**. Legacy may already bind these.
- **Mitigation:** Pre-Phase-A audit — grep `index.html` for `keydown`, `addEventListener('keydown'`, and the strings `'k'`, `'Escape'`. Strategies, in order of preference:
  1. If no collision found: ship as-is.
  2. If collision exists: shell handler checks `e.defaultPrevented` and bails; legacy handler that should win calls `preventDefault()`.
  3. Last resort: scope shell `keydown` to the `.accentos-shell` subtree only.
- **Likely conflict keys:** Cmd/Ctrl+K (search), Escape (modals), Cmd/Ctrl+S (save), Cmd/Ctrl+F (find — browser native).

### R-S03 — localStorage key collisions
- **Risk:** Shell writes `aos-sidebar-collapsed`, `aos-mode`, `aos-shell-enabled`, `aos-shell-module-*`. Legacy may use unprefixed keys.
- **Mitigation:** Contract — **all shell-owned keys use the `aos-` prefix**. Document this in `MODULE_OWNERSHIP_MAP.md` so the monolith never claims an `aos-*` key. Pre-Phase-A audit greps `index.html` for `localStorage.setItem('aos-` to confirm zero existing usage.

### R-S04 — CSS custom property leakage
- **Risk:** `tokens.css` defines variables on `:root`. If legacy already defines a same-named variable, last-declared wins.
- **Mitigation:** Pre-Phase-A audit — grep `index.html` for `--gold-`, `--gray-`, `--status-`, `--layer-`, `--z-`, `--space-`, `--type-`. If any collide, namespace the new tokens under `.accentos-shell` and update the shell CSS to consume them from there. Acceptable because shell CSS is already shell-scoped.

### R-S05 — Mobile viewport meta conflicts
- **Risk:** Shell expects `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` to support `safe-area-inset-*`. Legacy meta may differ.
- **Mitigation:** Verify the existing viewport meta during Phase A audit. If `viewport-fit=cover` is missing, add it (a 1-line edit). This is a no-op for desktop and improves iPhone safe-area support.

### R-S06 — `body` style mutation
- **Risk:** Shell's `.accentos-shell` sets `min-height: 100dvh` and `display: flex` on its own root. If legacy CSS sets `body { overflow: hidden }` or similar, shell-side scrolling can break.
- **Mitigation:** Don't apply shell styles to `<body>`. Keep shell scoped to `.accentos-shell` div as already designed.

### R-S07 — Form/input default style overrides
- **Risk:** Shell CSS has a base reset scoped to `.accentos-shell *`. Legacy forms inside the shell-wrapped body inherit the reset.
- **Mitigation:** Phase B mounts the legacy body inside `<main class="aos-content">`, NOT inside `.accentos-shell *` reset zone. Verify the reset selector chain at integration time. If overflow occurs, narrow the reset to direct shell children only.

### R-S08 — `defer` script ordering
- **Risk:** `accentos-shell.js` initializes on `DOMContentLoaded`. If a legacy inline script before the shell DOM uses `window.AccentOS.shell.*`, it will throw.
- **Mitigation:** Document that `window.AccentOS.shell` is only safe to call after `DOMContentLoaded`. Add a console warning if `init` runs without the expected DOM scaffolding present (graceful no-op already exists in current shell.js).

---

## 11. DECISION LOG — OPEN QUESTIONS FOR MICHAEL

Each must be resolved before the relevant phase begins.

| ID | Question | Blocks | Default if no answer |
|---|---|---|---|
| Q-01 | Should the shell's role switcher map to a real `users.role` column, or remain UX-only forever? | Any role-gated rollout (Section 6) | UX-only; per-role default flag is per-browser only, not per-user |
| Q-02 | Phase B mount-point preference — Candidate 1 (after top-nav) or Candidate 3 (replace top-nav)? | Phase B | Candidate 1 (lowest risk) |
| Q-03 | Feature-flag granularity — global, per-role, per-user, per-module, or all four layers? | Phase A | All four layers as specified in Section 6 |
| Q-04 | Acceptable downtime window for Phase F decommission? | Phase F | Off-hours, < 5 min, with a `git revert` rollback rehearsed |
| Q-05 | Does AccentOS want to introduce a build step in Phase F, or stay no-bundler permanently? | Phase F | Stay no-bundler; revisit only if measured boot time regresses |
| Q-06 | Should the shell handle the Cmd/Ctrl+K shortcut, or yield to legacy? | Phase A audit | Shell handles it; legacy is audited and de-conflicted |
| Q-07 | Phase C target — confirm System Health (recommended) vs another read-only module? | Phase C | System Health |
| Q-08 | Is per-module flag granularity worth the maintenance overhead, or is master-flag enough? | Phase C | Per-module — required for safe rollback during E |

---

## 12. DEFINITION OF DONE — PHASE 4 READINESS CRITERIA

This rollout's "done" is the prerequisite state for entering governance Phase 4 (real auth + RLS). It does not deliver Phase 4.

- [ ] All 14 modules render through shell-native code paths (Phase E complete).
- [ ] All per-module legacy renderers removed (Phase F complete).
- [ ] Legacy chrome (header, nav, modals) removed from `index.html`.
- [ ] `index.html` line count ≤ 1,000 (down from 7,169) — measured and recorded.
- [ ] Bundle size measured before Phase A and after Phase F; delta recorded in `SESSION_LOG.md`.
- [ ] `scripts/boot-smoke.sh` updated to verify the new shell pattern only (no legacy fallback assertions).
- [ ] During the transition, boot-smoke covers BOTH paths: flag-on AND flag-off must pass on the same commit.
- [ ] R-04 (UI-as-security) status reaffirmed — never resolved by this rollout.
- [ ] R-01 (monolith size) marked RESOLVED with date in `GOVERNANCE_RISKS.md`.
- [ ] R-S01–R-S08 from this document recorded in `GOVERNANCE_RISKS.md` if any materialized in production.
- [ ] Phase 4 (RLS + JWT claims) is a separate project, not blocked by this doc, and not delivered by it.

---

## APPENDIX A — PRE-PHASE-A AUDIT CHECKLIST

Run before any line of `index.html` is touched. All greps are against the working tree at that moment.

- [ ] `grep -c 'window.AccentOS' index.html` → confirm 0 (or document existing usage)
- [ ] `grep -nE 'class="aos-|aos-' index.html` → confirm 0
- [ ] `grep -nE 'localStorage\.(setItem|getItem)\(.aos-' index.html` → confirm 0
- [ ] `grep -nE 'z-index\s*:' index.html` → catalog every value
- [ ] `grep -nE "addEventListener\(['\"]keydown" index.html` → catalog every binding
- [ ] `grep -nE '(metaKey|ctrlKey).*[\"\\']k[\"\\']' index.html` → confirm Cmd+K handling
- [ ] `grep -nE -- '--gold-|--gray-|--status-|--layer-|--z-|--space-|--type-' index.html` → confirm token name collisions
- [ ] `grep -n 'name="viewport"' index.html` → verify `viewport-fit=cover` is present
- [ ] `bash scripts/boot-smoke.sh` → must pass before any change

If any audit step finds a conflict, resolve in a separate commit before Phase A begins.

---

## APPENDIX B — DOCUMENT CHANGE LOG

| Date | Author | Change |
|---|---|---|
| 2026-05-08 | Claude | Initial draft, planning artifact only — not authorization |
