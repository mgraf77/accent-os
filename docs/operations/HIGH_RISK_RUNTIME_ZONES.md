# High-Risk Runtime Zones - AccentOS

This document identifies regions of the application that are fragile or prone to bugs during maintenance.

## 1. Monolithic Logic Gravity (Vendor Ranking)
The Vendor Ranking module in `index.html` (2,000+ lines) acts as a "gravity well." Its internal functions are frequently cross-referenced by other modules, making its extraction the highest-risk move.
- **Risk:** Circular dependencies and missing function errors during modularization.

## 2. Sequential Hydration Bottleneck
The ~27 sequential `await` calls in `hydrateFromSupabase` create a critical path where a single slow request can delay the entire application.
- **Risk:** Dashboard looks empty or "stuck" for several seconds on slow networks.

## 3. Direct Global State Mutation
Modules frequently modify global arrays like `CUSTOMERS` or `INVENTORY` without using an intermediary API.
- **Risk:** Inconsistent state if two modules attempt to modify the same record simultaneously (e.g., CSV import vs. manual edit).

## 4. Navigation Dispatch Fragility
The `pages` map in `goTo` is maintained manually.
- **Risk:** Adding a module file but missing the dispatcher entry leads to "Silent Failures" where clicking a sidebar item does nothing.

## 5. Modal State Persistence
Some modals do not explicitly reset their backing variables (like `CQ` or `LI`) on close.
- **Risk:** "Ghost" data appearing in a new record if the previous session wasn't properly cleared.
