# AccentOS — Execution Lane Ownership
_Last updated: 2026-05-13_

---

## Purpose

Documents which parts of the system own which execution lanes — who writes what data, who reads what, and where conflicts could arise. Prevents double-write bugs and makes data flow auditable.

---

## Execution Lanes

### Lane 1: Boot / Session

**Owner:** `index.html` inline script + `tryRestoreSession()` / `activateApp()`

| Operation | Owned by | Writes to |
|---|---|---|
| JWT read/write | `jwtKey()` / `setJwt()` | localStorage `jwt_token` |
| Session validation | `tryRestoreSession()` | `window.CU` |
| Role application | `activateApp()` | DOM sidebar visibility |
| Runtime health flags | Worker probe IIFE + `hydrateFromSupabase()` | `window.__AOS_*` |

**No other code should write to `window.CU` or modify sidebar visibility.**

---

### Lane 2: Hydration / Data Globals

**Owner:** `hydrateFromSupabase()` and each `sbLoad*()` function

| Global | Sole writer | Readers (many) |
|---|---|---|
| `VD` | `sbLoadCategories()` | vendor ranking, price book, decision engine, POs |
| `PIPELINE` | `sbLoadPipeline()` | pipeline, deal optimizer, analytics, dashboard |
| `CUSTOMERS` | `sbLoadCustomers()` | CRM, jobs, deliveries, commission |
| `JOBS` | `sbLoadJobs()` | jobs, deliveries, warranty, digest |
| `INVENTORY` | `sbLoadInventory()` | inventory, POs, demand forecast |
| `ALERTS` | `sbLoadAlerts()` + `generateAlertsFromData()` | dashboard alerts panel |
| `KPI_SNAPSHOTS` | `sbLoadKPIs()` + `maybeAutoSnapshotKPIs()` | dashboard, KPI tracker |

**Rule:** Only the owning `sbLoad*()` function should replace a global. Module UIs must not overwrite these globals (they read only).

**Exception:** Modules may push to globals for local-only state (e.g., `CUSTOMERS.push(newCustomer)` after save) before the next full hydration.

---

### Lane 3: Quote State

**Owner:** Quote Generator (inline in `index.html`)

| State | Owner | Written by | Read by |
|---|---|---|---|
| `LI` | Quote Generator | `aiParseNotes()`, `calcTrackHardware()`, `loadQ()`, manual input | `saveQ()`, `renderLI()`, `updatePreview()` |
| `CQ` | Quote Generator | `loadQ()`, new quote flow | `saveQ()`, quote header render |
| `QUOTE_ID` | Quote Generator | `saveQ()` (increments), `loadQ()` | `saveQ()`, `sbSaveQuote()` |
| `QUOTES` | `sbLoadQuotes()` + `saveQ()` + `deleteQ()` | All three writers | `showSaved()`, `loadQ()`, pipeline linkage |

**Conflict risk:** `QUOTES` has 3 writers. `sbLoadQuotes()` (full replace), `saveQ()` (upsert), `deleteQ()` (filter). All operate on the same array reference. Safe because operations are user-initiated (not concurrent).

---

### Lane 4: AI / Worker Communication

**Owner:** AI features only — never other modules

| Operation | Owner | Touches |
|---|---|---|
| Worker probe | Boot IIFE | `window.__AOS_WORKER_VERSION__`, `__AOS_WORKER_ENV_KEY_READY__`, `__AOS_WORKER_PROBE_MS__` |
| AI chat | `sendChat()` | No globals mutated — response rendered directly |
| AI quote parse | `aiParseNotes()` | `LI` (replacement after parse) |
| AI vendor detail | Vendor detail renderer | No globals — response in modal |
| Env key validation | `_aiWorkerReady()` | Reads flags only — never writes |

**Rule:** `window.__AOS_WORKER_*` flags are written once (by probe IIFE) and read by many. No module should overwrite them except when the probe runs again.

---

### Lane 5: UI State / Navigation

**Owner:** Navigation system and individual module UIs

| State | Owner | Notes |
|---|---|---|
| Active page | `goTo()` | Sets `window.location.hash` + shows/hides .page-section |
| Modal state | `openModal()` / `closeModal()` | Generic system — no global state |
| Sidebar collapse | `toggleSB()` | `sbCol` local var + DOM |
| Toast queue | `toast()` | Dedup by message; clears after 3s |
| Filter state | `js/saved_filters.js` | localStorage per module |
| Selection state | `js/bulk_select.js` | In-memory per module activation |

---

### Lane 6: Async Background

**Owner:** Infrastructure functions, not module UIs

| Operation | Owner | Schedule |
|---|---|---|
| KPI auto-snapshot | `maybeAutoSnapshotKPIs()` | Post-hydration + every 30 min (if implemented) |
| Alert generation | `generateAlertsFromData()` | Post-hydration only |
| Health log | `_logRuntimeHealth()` | 2500ms after activateApp |
| Module modes apply | `applyModuleModesAfterHydrate()` | Post-hydration |

---

## Data Flow Summary

```
Supabase DB
  ↓ (sbLoad* functions — one-way read)
T3 Globals (VD, PIPELINE, CUSTOMERS, ...)
  ↓ (read by module render functions)
DOM (module UI tables, cards, charts)
  ↓ (user edits)
Module write functions (sbSave*, sbDelete*)
  ↓
Supabase DB (async commit)
  + In-memory global update (immediate)
```

No module UI writes directly to Supabase. All writes go through named `sb*` functions. This is the sole enforced architectural invariant.

---

## Write Ownership Violations to Avoid

| Anti-pattern | Risk | Example |
|---|---|---|
| Module UI directly sets `SB.from(...).insert(...)` | Bypasses audit log, error handling | `customers.js` calling SB directly |
| Module modifies another module's global | Race conditions, stale renders | `pipeline.js` pushing to `JOBS` |
| Module writes `window.__AOS_*` flags | Corrupts health state | Any module except boot IIFE |
| Multiple modules sharing same DOM element ID | Collision, flickering | Two modules both writing to `#content` |

---

_Update when new data flows are introduced or ownership boundaries change._
