# AccentOS — Event Storm Risk Analysis
_Last updated: 2026-05-13_

---

## Purpose

Documents scenarios where a burst of user actions, data mutations, or timer events could create performance degradation or data inconsistency in AccentOS. Event storms are a class of runtime risk not covered by individual component failure analysis.

---

## Event Storm Definition

An **event storm** occurs when multiple operations compete for the same resource (CPU thread, Supabase connection, DOM element, localStorage) within a short time window, producing degraded performance or inconsistent state.

AccentOS is particularly susceptible because:
- Single-threaded JavaScript (no Web Workers in current build)
- All renders happen on the main thread
- Supabase operates on a shared connection pool (no per-user connection management)
- localStorage is synchronous and shared across all module operations

---

## Identified Storm Scenarios

### ES-01 — Rapid Navigation (goTo spam)

**Trigger:** User clicks multiple sidebar items in rapid succession, or a script calls `goTo()` multiple times without awaiting async module renders.

**What happens:**
1. Each `goTo()` call hides all pages, shows target page, calls render function
2. Render function may trigger async loads (e.g., `activity()` awaits two sbFetch calls)
3. Rapid navigation abandons in-flight async loads; they complete and update the DOM of whatever page is now showing

**Risk level:** LOW  
**Current mitigation:** Each module renders into its own `#pg-content` container; stale renders don't crash but may flash incorrect content.  
**Residual risk:** Activity feed's `afLoadedAt` timestamp set before data completes; rapid navigation away+back may show stale "Loading..." before data arrives.

---

### ES-02 — Quote AI Parse + Manual Edit Race

**Trigger:** User clicks "Parse with AI" then immediately starts typing in a line item cell.

**What happens:**
1. `aiParseNotes()` starts async fetch to worker
2. User edits LI[n] in the table
3. AI parse completes, replaces entire LI array → user's edit is overwritten

**Risk level:** LOW  
**Current mitigation:** None — user edit is lost silently.  
**Residual risk:** Documented in QUOTE_EDGE_CASE_MATRIX.md. Accepted pending "are you sure?" UX guard.

---

### ES-03 — Bulk Vendor Score Import (500+ rows)

**Trigger:** User imports a CSV with 500+ vendor score updates.

**What happens:**
1. `js/vendor_score_import.js` processes each row
2. Each row may trigger a Supabase `upsert` on `vendor_scores`
3. 500 sequential upserts = ~500 network round-trips

**Risk level:** MEDIUM  
**Current mitigation:** CSV import is batched? (need to verify) — if not, 500 individual upserts could take 30–60s.  
**Residual risk:** If upsert batch is not used, may trigger Supabase rate limits or timeout the session.  
**Recommended fix:** Use `INSERT ... ON CONFLICT DO UPDATE` with array batching (Supabase supports batch inserts in single request).

---

### ES-04 — generateAlertsFromData on Large Dataset

**Trigger:** 1000+ deals, quotes, and PO lines accumulated; boot triggers `generateAlertsFromData()`.

**What happens:**
1. Alert generator loops over: DEALS (all stages), COOP_FUNDS, QUOTES, INVENTORY, POS, WARRANTY_CLAIMS, JOBS
2. Each loop scans entire array, checks each item against dedup set
3. Total iterations: O(N) per data type, but across 7 data types simultaneously

**Risk level:** LOW (at current volume), MEDIUM (at 10K+ total records)  
**Current mitigation:** `activeKeys` Set for O(1) dedup; no nested loops; each alert check is O(1) per record.  
**Residual risk:** At large scale (10K+ records), the 7 linear scans could add 100–500ms to boot.

---

### ES-05 — KPI Auto-Snapshot Timer (if implemented as repeating)

**Trigger:** `maybeAutoSnapshotKPIs()` is called on a 30-minute timer while the user is actively editing.

**What happens:**
1. Snapshot writes to Supabase (`kpi_snapshots` table)
2. `KPI_SNAPSHOTS` global updated
3. If user is viewing the KPI tracker at that moment, the snapshot may refresh the display unexpectedly

**Risk level:** LOW  
**Current mitigation:** Double-dedup (localStorage + in-memory) prevents duplicate snapshots. Timer not yet implemented (post-hydration only currently).  
**Residual risk:** When timer is added, it should use `requestIdleCallback` or check `document.hidden` before firing.

---

### ES-06 — Session Restore + Probe Race

**Trigger:** App loads; worker probe fires (async IIFE) at same time as `tryRestoreSession()`.

**What happens:**
1. Probe fires at ~t=0 (inline script)
2. Session restore fires at ~t=DOMContentLoaded (~200ms)
3. Both are async; probe takes 150–600ms; session takes 100–300ms
4. If session restore completes before probe, dashboard renders with "probing..." in system status card

**Risk level:** NONE (expected behavior)  
**Current mitigation:** Health check card shows "probing..." state until `__AOS_WORKER_PROBE_MS__` is set.  
**Design:** Probe is intentionally non-blocking. Race is acceptable.

---

### ES-07 — Two Tabs, Same Quote

**Trigger:** Operator opens the same quote in two browser tabs, edits both, saves both.

**What happens:**
1. Tab A: saves quote → Supabase upsert (last-write-wins)
2. Tab B: saves same quote → Supabase upsert (Tab B wins)
3. Tab A's changes are permanently overwritten without warning

**Risk level:** MEDIUM  
**Current mitigation:** Supabase upsert guarantees no corruption (no partial writes), but Tab A's data is silently lost.  
**Residual risk:** Documented in QUOTE_EDGE_CASE_MATRIX.md. No locking mechanism exists.  
**Recommended fix:** Optimistic locking via `updated_at` timestamp check before save.

---

### ES-08 — Alert Insert Storm (generateAlertsFromData proposes many new alerts)

**Trigger:** First run after significant data accumulation; `generateAlertsFromData()` proposes 50+ new alerts.

**What happens:**
1. Each proposed alert not in `activeKeys` → `sbFetch` INSERT to alerts table
2. 50 alerts = 50 sequential Supabase inserts
3. Each takes ~100–200ms → ~5–10 seconds total

**Risk level:** MEDIUM (on first run with many alerts)  
**Current mitigation:** Dedup via `activeKeys` Set prevents re-inserting known alerts.  
**Residual risk:** No batch insert — 50 alerts would trigger 50 individual API calls.  
**Recommended fix:** Batch alert inserts into a single `INSERT ... VALUES (...), (...)` call.

---

## Storm Priority Matrix

| Scenario | Probability | Impact | Priority |
|---|---|---|---|
| ES-03 (Bulk score import storm) | Low (manual import) | High (timeout/rate limit) | MEDIUM |
| ES-07 (Two-tab quote conflict) | Low | Medium (data loss) | MEDIUM |
| ES-08 (Alert insert storm) | Low (first-run only) | Medium (10s boot delay) | LOW |
| ES-02 (AI parse + manual edit) | Medium | Low (edit overwritten) | LOW |
| ES-04 (Alert generator at scale) | Future only | Low-Medium | LOW |
| ES-01 (goTo spam) | Low | Low (visual flash) | LOW |
| ES-06 (probe + session race) | Always | None | NONE |
| ES-05 (KPI timer conflict) | Not yet implemented | Low | NONE |

---

_Review this analysis when new data ingestion paths are added or when any scenario's "probability" changes._
