# WAVE1_RUNTIME_BASELINE.md
> Session 31 — captured BEFORE Wave 1 merges land
> Purpose: define what "normal" looks like so post-merge regressions are detectable.

All values below are EXPECTATIONS (contract), not measurements. Measurements are recorded against this baseline in WAVE1_POSTMERGE_BOOT_SEQUENCE.md.

---

## 1. RUNTIME EXPECTATIONS

### Boot
- `DOMContentLoaded` fires → `activateApp()` runs.
- `activateApp()` calls `hydrateFromSupabase()`.
- Post-hydration: `window.__AOS_HYDRATED__ === true` (introduced by B3 — pre-Wave value is undefined; post-Wave must be true).
- No uncaught exceptions in console during boot.
- No `Mixed Content` warnings; all sbFetch calls over HTTPS.

### sbFetch contract (post-B1)
- Every fetch wrapped in `AbortController` with 15000ms timeout.
- On HTTP 401: triggers session-expired UX path (toast + redirect or sign-in prompt).
- On network error: surfaces user-visible error; does not silent-fail.

### Quote save contract (post-B2)
- Single round-trip RPC call: `upsert_quote_with_lines(...)`.
- Returns updated_at; client stores as `_updatedAt`.
- On stale write (server `updated_at` newer than client `_updatedAt`): RPC raises; client re-throws.
- No code path uses the previous 3-call REST pattern. Forbidden patterns:
  - `DELETE /quote_lines?quote_id=eq.X` followed by `POST /quote_lines`
  - separate `PATCH /quotes` + `POST /quote_lines` save sequence

### Module registry (post-C1)
- `MODULE_REGISTRY.ecommerce` defined exactly once.
- 6 new adapter scripts loaded at end of body in order:
  bigcommerce_adapter → ga4 → gsc → klaviyo → gmc → ecommerce_intelligence.

---

## 2. QUEUE EXPECTATIONS

- No new background queues are introduced in Wave 1.
- All adapter init is gated on `__AOS_HYDRATED__` (no pre-hydration polling).
- No `setInterval` < 1000ms anywhere.
- No queue claims durability — all adapter state is in-memory until next hydration.
- patch_quote.js: on-demand only; not auto-invoked.

---

## 3. REPLAY EXPECTATIONS

- Re-running `hydrateFromSupabase()` is idempotent:
  - same Supabase state → same in-memory store
  - existing `_qDirty`/`_qSaving` guards prevent re-entrant quote save
- Stale-detection replay: if server has newer `updated_at`, second save attempt MUST fail-fast (not silently overwrite).
- SQL apply order is replay-safe:
  - M45 → M46 → M47 → M48 may be re-applied (each is idempotent via `CREATE ... IF NOT EXISTS` / `CREATE OR REPLACE`); confirm during F1 prep.

---

## 4. METRICS EXPECTATIONS

Telemetry contracts that MUST hold post-Wave 1:

| Signal namespace | Owner | Emitted at |
|------------------|-------|-----------|
| `__AOS_HYDRATED__` (global flag) | index.html (B3) | after hydration completes |
| `quote.*` | quote subsystem | save / load / stale-conflict |
| `ecommerce.*` | ecommerce_intelligence.js | refresh cycles |
| `bigcommerce.adapter.*` | bigcommerce_adapter.js | adapter-scoped |
| `ga4.*` / `gsc.*` / `klaviyo.*` / `gmc.*` | corresponding adapter | adapter-scoped |

Hydration timing log (B3) MUST appear exactly once per page load.

KPI catalog (KPI_CATALOG.md) entries unchanged in count or definition by Wave 1. Wave 1 is additive only.

---

## 5. GOVERNANCE EXPECTATIONS

- Canon hash bundle present and matches integration HEAD (separate commit post-merge).
- BUILD_PLAN_CLAUDE.md items related to Wave 1 marked `[x]` only AFTER GZ gate passes.
- SESSION_LOG.md has one entry for Wave 1 execution.
- PROMPT_LOG.md updated.
- WORK_IN_PROGRESS.md cleared.
- No skipped permissions, no `--no-verify` commits.
- All SQL migrations land in Supabase staging BEFORE production, in the order M45 → M46 → M47 → M48.

---

## 6. BASELINE CAPTURE FIELDS (fill at start of execution)

```
Baseline date:           _____________
main HEAD SHA:           _____________
index.html sha256:       _____________
index.html byte size:    _____________
sql/ directory listing:  _____________
Supabase snapshot ID:    _____________
KPI count (KPI_CATALOG): _____________
MODULE_REGISTRY keys:    _____________
```

A failed post-merge boot sequence must report values DIFFERING from this baseline only in EXPECTED ways (e.g., new `ecommerce` MODULE_REGISTRY key, new SQL files). Any unexpected delta triggers abort.
