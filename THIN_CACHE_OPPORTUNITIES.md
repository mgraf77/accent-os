# THIN_CACHE_OPPORTUNITIES.md

## 1. LocalStorage "Stale-While-Revalidate" for Core Arrays
Cache large datasets like `VD_RAW` (static parts) and `CALENDAR_EVENTS` in LocalStorage.
- **Strategy:** Load from cache immediately on boot for instant UI populating; then refresh from Supabase in the background.
- **Benefit:** Eliminates the "blank screen" or loading spinner during the hydration sequence.

## 2. Global Search Index Caching
The global search currently re-indexes everything on every keystroke.
- **Strategy:** Cache the search index in memory after the initial hydration.
- **Benefit:** Smoother search experience on mobile and for large datasets (Inventory/Customers).

## 3. Module File Pre-fetching
The current lazy-load strategy (loading `js/module.js` only when the tab is clicked) saves initial bandwidth but causes a "jank" on first interaction.
- **Strategy:** Pre-fetch remaining module files 5 seconds after the application becomes idle.
- **Benefit:** Zero-latency navigation between modules.

## 4. User Profile & Settings Cache
Store `CU` (Current User) metadata and `MODULE_MODES` in LocalStorage with a 24-hour expiration.
- **Strategy:** Re-verify session in background but allow app shell to render based on cached roles.
- **Benefit:** Faster initial render and better offline/low-signal performance.

## 5. Quote Draft Auto-save Enhancement
The current `_saveQuoteDraft` only triggers on `beforeunload`.
- **Strategy:** Implement a "thin cache" debounced save (every 30s) to LocalStorage while the quote is dirty.
- **Benefit:** Protects against browser crashes or power loss without the latency of a DB write.
