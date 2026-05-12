# Hydration Flow Map - AccentOS

This document maps the sequential hydration process that occurs after a successful user login or session restoration.

## 1. Trigger
The hydration sequence is managed by `async function hydrateFromSupabase()` in `index.html`. It is called by the `DOMContentLoaded` listener after `tryRestoreSession()` confirms a valid user.

## 2. Sequential Execution (Awaited)
The following functions are called in order using `await`. If one fails, it is caught by a local `try/catch` block, logged to the console, and the sequence continues.

| Order | Function | Primary Global Modified | Notes |
|---|---|---|---|
| 1 | `sbLoadCategories` | `vendorProductCats` | |
| 2 | `sbLoadChangelog` | `CHANGELOG` | |
| 3 | `sbLoadParents` | `PARENT_COMPANIES`, `VENDOR_PARENTS` | |
| 4 | `sbLoadScoreStates` | `VD` (`_meta` property) | Depends on `VD` initialization. |
| 5 | `sbLoadVendorScores`| `VD` (`scores` property) | Depends on `VD` initialization. |
| 6 | `sbLoadVendorOverrides`| `VD` (metadata) | Depends on `VD` initialization. |
| 7 | `sbLoadQuotes` | `QUOTES` | |
| 8 | `sbLoadCoopFunds` | `COOP_FUNDS` | |
| 9 | `sbLoadCustomers` | `CUSTOMERS` | |
| 10 | `sbLoadEmployees` | `EMPLOYEES` | |
| 11 | `sbLoadCalendarEvents` | `CALENDAR_EVENTS` | |
| 12 | `sbLoadArticles` | `ARTICLES` | Knowledge Hub |
| 13 | `sbLoadJobs` | `JOBS` | |
| 14 | `sbLoadInventory` | `INVENTORY` | |
| 15 | `sbLoadPurchaseOrders`| `POS` | |
| 16 | `sbLoadTradePartners`| `TRADE_PARTNERS` | |
| 17 | `sbLoadWarrantyClaims`| `WARRANTY_CLAIMS` | |
| 18 | `sbLoadShowroomDisplays`| `SHOWROOM_DISPLAYS`| |
| 19 | `sbLoadLabelBatches`| `LABEL_BATCHES` | |
| 20 | `sbLoadDeliveries` | `DELIVERIES` | |
| 21 | `sbLoadCompetitorPrices`| `COMPETITOR_PRICES`| |
| 22 | `sbLoadMarketingCampaigns`| `MARKETING_CAMPAIGNS`| |
| 23 | `sbLoadMarketingAssets`| `MARKETING_ASSETS` | |
| 24 | `sbLoadAlerts` | `ALERTS` | |
| 25 | `sbLoadPipeline` | `DEALS` | |
| 26 | `sbLoadKPIs` | `KPI_DEFINITIONS` | |
| 27 | `sbLoadGoals` | `GOALS` | |

## 3. Post-Hydration Heuristics
Once all raw data is loaded, the application runs a secondary processing step:

- **`generateAlertsFromData()`**: Analyzes the hydrated state of all modules to generate system-wide alerts (e.g., stale quotes, low stock).

## 4. Fallback Logic
If `sbLoadCategories` returns no rows (e.g., first run or network error), the system calls `applyPrefillVendorCats()` to populate categories from a static local map.

## 5. Critical Risks
- **Blocking I/O:** The current use of `await` for ~27 sequential fetches creates a potential bottleneck. If one request hangs, the entire dashboard load is delayed.
- **Race Condition:** `sbLoadScoreStates` and `sbLoadVendorScores` assume that `VD` (the vendor master array) has already been mapped from `VD_RAW`. This is currently safe because they are called sequentially within the same `async` block.
