# AccentOS — Module Extraction Log
_Last updated: 2026-05-13_
_Classification: CANONICAL — append entries as modules are extracted_

---

## Purpose

Records what was extracted from index.html, why it was safe, and what coupling risks remain.
Use before any new extraction to understand the pattern and avoid known hot zones.

---

## Extracted Modules

### Batch 1 — v6.10.76 (2026-05-13)

| Module | File | Lines | Size |
|---|---|---|---|
| Co-op / Rebate Tracker | `js/coop_tracker.js` | ~242 | ~8 KB |
| Settings | `js/settings.js` | ~145 | ~6 KB |
| Daily Brief + sRow | `js/daily_brief.js` | ~335 | ~11 KB |

**Total extracted:** ~722 lines, ~37 KB. index.html: 778 KB → 743 KB.

### Batch 2 — v6.10.77 (2026-05-13)

| Module | File | Lines | Size |
|---|---|---|---|
| Dashboard Pins | `js/dashboard_pins.js` | ~50 | ~2 KB |
| Track Hardware Calculator | `js/track_calculator.js` | ~95 | ~4 KB |

**Total extracted:** ~145 lines, ~6 KB. index.html: 743 KB → 719 KB.

#### Why dashboard_pins.js was safe
- Fully isolated feature: reads/writes only `localStorage` (`aos_dash_pins_${uid}`) and `MODULE_REGISTRY` (read-only)
- Zero callers from outside the dashboard section (only `renderPinnedCard()` called inline from `dashboard()`, `openPinModal()` called from a button)
- `applyDashPins()` calls `dashboard($('pg-content'))` — resolved at runtime from window scope
- All deps (`CU`, `MODULE_REGISTRY`, `openModal`, `closeModal`, `esc`, `goTo`, `dashboard`) are window-scope globals

#### Why track_calculator.js was safe
- Pure utility: `calcTrackHardware` is a pure function (no DOM, no globals written except `_pendingTrackLines`)
- `QKB` is a top-level `const` in the inline script block — accessible as a global name from all subsequent scripts (browser global lexical environment)
- Only called from a quote toolbar button (`openTrackCalc()`) and its own modal buttons — all resolved at call time
- `LI`, `renderLI`, `updatePreview` are quote module globals, all window-scoped
- `_pendingTrackLines` moved to module file; only read/written within the module's own functions

#### Why coop_tracker.js was safe
- Fully self-contained section with `let COOP_FUNDS = []` global owned entirely by this module
- Only 5 external dependencies: `sbFetch`, `sbConfigured`, `sbAuditLog`, `toast`, `openModal`, `closeModal`, `esc`, `$`, `CU`, `VD`, `renderVendors`
- All callers use `COOP_FUNDS` directly (window-scoped global) — no import needed
- All callers reference `renderCoopTracker`, `openCoopEdit`, `saveCoopFund`, `deleteCoopFund` by name — resolved at call time from window scope

#### Why settings.js was safe
- Zero external callers of its internal functions (`renderUsersPanel`, `saveUserRole`, `changeMyPassword`)
- Only called by `goTo('settings')` via MODULE_REGISTRY — resolved at runtime
- All dependencies (`CU`, `ROLES`, `sbFetch`, etc.) are window-scope globals defined before module loads

#### Why daily_brief.js was safe
- `computeDailyBrief()` is pure compute: reads globals, returns array, zero DOM writes
- All global reads use `typeof X !== 'undefined'` guards — already defensive
- `sRow()` is a pure string renderer — no state
- `computeDailyBrief` called only from `dashboard()` in index.html (line ~6333)
- `sRow` called from dashboard section in index.html — all resolved at runtime from window scope

---

## Load Order Requirement

New modules must load AFTER the main inline script block. Current order matters:

```
[inline script — defines all globals, sbFetch, CU, VD, etc.]
...existing js/*.js modules...
js/coop_tracker.js      ← defines COOP_FUNDS global (read by daily_brief.js)
js/settings.js
js/daily_brief.js       ← reads COOP_FUNDS, must load after coop_tracker.js
```

---

## Remaining High-Risk Coupling Zones (DO NOT EXTRACT)

| Zone | Lines (approx) | Why dangerous |
|---|---|---|
| Auth + session core | 494–665 | `CU`, `jwtKey`, `tryRestoreSession` — all downstream deps |
| `sbFetch` + Supabase layer | 1182–1242 | Every module depends on this |
| `hydrateFromSupabase()` | 666–706 | Boot sequence — tight coupling to `activateApp`, globals |
| Worker probe IIFE | 807–860 | `window.__AOS_RUNTIME__` init — must run at parse time |
| `goTo()` + navigation | 979–1000 | All modules call this; runtime registry wired in |
| MODULE_REGISTRY | 924–967 | Navigation source of truth |
| `toast`, `openModal`, `esc`, `$` | 860–910 | Universal helpers — moving breaks everything |
| Vendor scoring + CAT_DEFS | 2015–2564 | `CAT_DEFS` constant + scoring functions tightly interleaved; can't split without moving the constant |

---

## Load Order Requirement (updated)

```
[inline script — defines all globals, sbFetch, CU, VD, QKB, etc.]
...existing js/*.js modules...
js/coop_tracker.js      ← defines COOP_FUNDS global (read by daily_brief.js)
js/settings.js
js/daily_brief.js       ← reads COOP_FUNDS, must load after coop_tracker.js
js/dashboard_pins.js    ← reads MODULE_REGISTRY, CU (no ordering constraint with other extracted modules)
js/track_calculator.js  ← reads QKB (inline const), LI, renderLI, updatePreview
```

## Next Safe Extraction Candidates

| Candidate | Est. Lines | Blocker |
|---|---|---|
| `js/roadmap.js` — `roadmap()` function | ~20 | Very small; low leverage |
| `js/mgmt_kpis.js` — KPI + Goals/OKR functions | ~280 | Medium; `KPI_DEFS` constant must move with it |
| `js/pipeline_core.js` — deal scoring + pipeline helpers | ~180 | `computeDealProbability`, `STAGES` constant must stay accessible |

**Recommendation:** Do not extract until index.html approaches 850 KB. Current size is 719 KB — 131 KB of headroom.

---

## Rollback

Each extraction is independently reversible:
1. Copy the function body back into index.html in the original location
2. Remove the stub comment
3. Remove the `<script src="...">` tag
4. Delete the js/ file

No schema changes required. No behavior changes.
