# RUNTIME_FRICTION_AUDIT.md

## 1. Sequential Hydration Bottleneck
The `hydrateFromSupabase` function in `index.html` executes ~25 `sbLoad*` calls sequentially. While some are fast, the cumulative latency on a cold start is high (~30s timeout configured).
- **Friction:** UI remains in a "loading" or incomplete state for several seconds.
- **Impact:** High. User experience is degraded during initial load.

## 2. Monolithic `index.html` Script
Despite previous file splits, `index.html` still contains ~6000 lines of JavaScript, including the entire Vendor Ranking and Quote Generator modules.
- **Friction:** IDE performance lag, difficult navigation, and high risk of accidental regressions during "surgical patches".
- **Impact:** Medium-High (Developer Friction).

## 3. Large Global State Arrays
Modules rely on massive global arrays like `VD` (478+ items with nested metadata) and `INVENTORY`.
- **Friction:** Operations like `renderVendors` or `renderInventory` trigger heavy DOM reconstruction. 1000-row caps are currently used as a band-aid.
- **Impact:** Medium. Perceived lag on low-end devices or mobile.

## 4. Mobile Responsiveness Gaps
While the CSS includes `@media` queries, several complex UIs (Vendor Heatmap, Quote Line Item Editor) are challenging to use on mobile.
- **Friction:** Horizontal scrolling in tables, small tap targets for inline edits, and modal overflows.
- **Impact:** High for "on-the-go" roles (Sales, Warehouse).

## 5. Repetitive DOM Injection
Most modules use `.innerHTML = ` strings for rendering.
- **Friction:** Loses cursor position/focus on refresh, prevents partial updates, and makes event listener management brittle (often relying on inline `onclick`).
- **Impact:** Medium.

## 6. Feedback Loop Disconnect
Feedback is collected via a FAB but doesn't show the user the status of their submitted bugs/ideas within the app.
- **Friction:** Users feel their feedback goes into a "black hole".
- **Impact:** Low-Medium.
