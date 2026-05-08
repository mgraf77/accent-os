---
name: demand-forecaster-skill
description: >
  AccentOS predictive skill that forecasts SKU-level demand for Accent Lighting
  and recommends purchase orders, by natural language. The UI shipped under
  Track 6.9 (`js/demand_forecast.js`) does this visually over INVENTORY +
  PO_LINES inside index.html; this skill does the same job invocably from
  Michael's prompt — and produces a re-runnable artifact (paste-ready table
  + draft PO) that the existing UI can render unchanged. Two modes:
  `forecast` (project demand for a SKU/vendor/category over 30/60/90 days)
  and `recommend-po` (per-vendor list of SKUs to reorder now, paste-ready).
  Skill (natural-language) vs UI page (Track 6.9) disambiguation: UI-routing
  phrasings ("open demand forecast", "show the demand forecast tab", "go to
  demand forecast") route to the page; everything else routes here.
  Pulls velocity from PO_LINES (BigCommerce store-cwqiwcjxes path) when
  Windward is not yet connected, and from Windward sales-line history once
  available — the same fallback the Track 6.11 plan describes. Use this
  skill (the natural-language skill — NOT the Track 6.9 UI page) when
  Michael says: "what should i reorder", "demand forecast for X",
  "draft a po for vendor Y", "/forecast", "/po", "what's running out",
  "30/60/90 day forecast", "build a buy list", "reorder list this week",
  "stockout risk", or any phrasing asking for forward-looking inventory
  intelligence via natural language. Do not use this skill for past
  sell-through reporting (use bc-business-review) or for the UI page
  itself (Track 6.9 — served by js/demand_forecast.js; phrasings like
  "open demand forecast page" / "show the demand forecast tab" route to
  the UI, not this skill). The `-skill` suffix in the directory name
  exists specifically to disambiguate skill from UI in _index.md. Always returns a ranked SKU table with reorder kinds plus
  a paste-ready PO draft routed to action-queue — never returns prose-only
  "you should restock soon" advice.
---

# demand-forecaster-skill

**Purpose:** Forecast SKU-level demand for Accent Lighting and emit paste-ready purchase-order drafts on demand, using the same compute contract as the Track 6.9 UI so outputs are interchangeable.

This is a **Capability Ladder L5 (Predictive)** skill. Companion to the existing **Demand Forecast** UI page (`js/demand_forecast.js`): the UI does it visually, this skill does it via natural language and produces a re-runnable artifact. Closes BUILD_PLAN T6.9 and L5 vision gap.

---

## Trigger Recognition

Run this skill (the natural-language **skill** path, NOT the Track 6.9 UI page) when Michael says anything like (all-lowercase / terse, matching Michael's profile):
- "what should i reorder" / "what's running out" / "what to reorder this week"
- "demand forecast for [sku / vendor / category]" / "forecast [vendor]" / "forecast for [vendor]"
- "draft a po for [vendor]" / "build me a po" / "build a buy list" / "draft po"
- "reorder list" / "reorder list this week" / "reorder now list"
- "30 60 90" / "30/60/90 day forecast" / "30/60/90"
- "stockout risk" / "what am i about to stock out of" / "what's about to stock out"
- "/forecast" or "/po" (slash form invokes the **skill**, not the UI)

**Disambiguation from Track 6.9 UI (skill vs page):** the UI lives at the Demand Forecast page in `index.html` (rendered by `js/demand_forecast.js`). UI-routing phrasings (do NOT trigger this skill) include:
- "open the demand forecast page" / "open demand forecast"
- "show me the demand forecast tab" / "show the demand forecast tab"
- "go to demand forecast" / "navigate to demand forecast"
- Any "open / show / go to / navigate" verb + "demand forecast"

This skill activates only on natural-language asks (above) or the `/forecast` / `/po` slash commands. The directory name carries the `-skill` suffix specifically to make the skill-vs-page split explicit in `_index.md` — when in doubt, the slash command always routes to the skill, not the UI page.

Also trigger when `daily-brief-composer` requests the morning reorder-now tile, when `bc-business-review` asks for forecast vs actual, or when `coop-claim-drafter` needs to identify under-spent co-op windows by SKU.

---

## Step 0 — Preflight (mode detection + data-source fallback)

This skill has a **soft dependency** on Windward — it does not BLOCK on Windward. Detect the data source first, then route.

1. **Determine mode** from Michael's phrasing:
   - "forecast" / "what's running out" / "30 60 90" → mode `forecast`
   - "draft a PO" / "buy list" / "reorder list" / "/po" → mode `recommend-po`
   - Ambiguous → default to `forecast` and offer `recommend-po` in the summary.
2. **Determine data source** (Windward-or-BC fallback). Read in order:
   - Check `references/data-source-fallback.md` for the decision logic.
   - Probe Supabase `hsyjcrrazrzqngwkqsqa` for table `windward_sales_lines` (or whatever the windward-bridge skill writes). If present and rows in last 90 days > 0, source = `windward`.
   - Else probe BigCommerce store `store-cwqiwcjxes` orders staging (or in-page `POS` + `PO_LINES`). If present, source = `bc-po-lines` (matches current Track 6.9 UI proxy).
   - Else return stub: "no PO history and no Windward sales history — populate `PO_LINES` (Track 6.9 path) or run `windward-bridge` first."
   - **Inventory-empty precondition:** also probe `INVENTORY` (Supabase `inventory_items`) for non-zero row count. If 0 rows, return stub: "INVENTORY table is empty — populate inventory rows (Track 6.x bulk import) before running a forecast. Velocity without on-hand counts produces no actionable reorder qty." Do not proceed to Step 1 with an empty inventory set.
3. **Load the heuristic constants** from `references/model.md` (must match the UI's `js/demand_forecast.js`):
   - `LEAD_WEEKS = 4`, `SAFETY_WEEKS = 2`, `REORDER_THRESHOLD = 6`, `TARGET_WEEKS = 14`, `OVERSTOCK_WEEKS = 26`, `VELOCITY_WINDOW_DAYS = 90`.
   - If Michael overrides any constant in-prompt ("use 8 weeks lead time"), record the override and pass through to Step 1.
4. Read in parallel: `references/po-template.md`, `references/seasonality.md`.

---

## Step 1 — Compute per-SKU velocity and weeks-of-stock

For every SKU in `INVENTORY` (or the Windward equivalent), compute the same numbers the Track 6.9 UI computes — so the skill's output drops into the UI without translation.

**Velocity (BC fallback path — source = `bc-po-lines`):**

```
velocity_per_week[sku] = sum(qty in PO_LINES where order_date >= now() - 90 days, grouped by sku|vendor) / 12.857
```

**Velocity (Windward path — source = `windward`):**

```
velocity_per_week[sku] = sum(qty_sold from windward_sales_lines where sale_date >= now() - 90 days, grouped by sku) / 12.857
```

Then per SKU:

```
weeks_of_stock = qty_available / velocity_per_week
qty_available  = COALESCE(qty_available, qty_on_hand - qty_committed)
```

Apply the seasonally-adjusted multiplier from `references/seasonality.md` (52-week rolling weekly factor — peak-season weeks get a multiplier > 1, low-season < 1; default to 1.0 if year-over-year history is < 12 months).

Produce a working set per SKU: `(sku, vendor_id, vendor_name, qty_available, qty_on_order, velocity_per_week, weeks_of_stock, seasonality_factor)`.

**Failure paths in Step 1:**
- **NULL `qty` or NULL `order_date` in `PO_LINES`:** treat as "row excluded from velocity sum" — do NOT coalesce to 0 (that would silently lower velocity for the SKU). Log the excluded count and surface it in the summary: `[N] PO_LINES rows excluded for NULL qty or NULL order_date — schema gap.` If excluded rows > 25% of total for any SKU, flag the SKU's `kind = no_data` instead of a velocity-derived kind.
- **`qty_available` resolves NULL after the COALESCE fallback:** the SKU has neither `qty_available` nor a `qty_on_hand - qty_committed` pair. Emit the row with `kind = no_data` and `weeks_of_stock = null`. Never substitute 0; 0 weeks-of-stock would push the SKU to the top of `reorder_now`.
- **Constants drift detected at runtime:** if `references/model.md` constants do not match the values currently in `js/demand_forecast.js` (compare both file timestamps + grep the constants), surface a one-line warning at the top of every output: `⚠ heuristic constants drift detected — sync references/model.md and js/demand_forecast.js before relying on this run.` Do not silently use one set; this is the L5/L6 ladder gate.

---

## Step 2 — Project 30/60/90-day forecast

For each SKU, compute three forecast horizons:

```
forecast_30d = velocity_per_week × seasonality_factor_next_4w × (30/7)
forecast_60d = velocity_per_week × seasonality_factor_next_8w × (60/7)
forecast_90d = velocity_per_week × seasonality_factor_next_12w × (90/7)
```

Use the rolling 4-week / 8-week / 12-week seasonality averages from `references/seasonality.md`. If history is < 52 weeks, all factors collapse to 1.0 (skill is honest about thin history — flag it in summary).

Compute `recommended_reorder_qty` only for SKUs where `weeks_of_stock < REORDER_THRESHOLD × 1.5` (i.e. `reorder_now` or `reorder_soon`):

```
recommended_reorder_qty = max(1, round(velocity_per_week × TARGET_WEEKS - qty_available - qty_on_order))
```

Match Track 6.9 UI's classification kinds exactly: `reorder_now`, `reorder_soon`, `overstock`, `normal`, `no_data`.

---

## Step 3 — Branch on mode (forecast vs recommend-po)

### Mode A: `forecast`

Filter the working set by Michael's scope (SKU pattern / vendor / category / "all"). Sort: `reorder_now` first by `weeks_of_stock` asc, then `reorder_soon`, `overstock`, `normal`, `no_data`. Default `top_n = 25` (configurable).

Emit the **Forecast table** (see Output format below).

### Mode B: `recommend-po`

Filter to a single vendor (Michael names it, or the skill picks the vendor with the highest summed `recommended_reorder_qty × unit_cost`). Pull the PO template from `references/po-template.md`. Emit:

1. A vendor-scoped **PO draft** (paste-ready, vendor name, contact line, line items with sku/description/qty/unit cost/extended cost, totals).
2. A `proposed_action` row for `action-queue` (PROPOSED state — Michael approves before send, per AccentOS spend rules).
3. A short rationale block per line item ("reorder_now: 1.2 weeks of stock, 14-week target = 28 units").

---

## Step 4 — Snapshot and route

Write three artifacts every run:

1. **In-message output** — table or PO draft per mode (Output format).
2. **Snapshot** via `analysis-snapshot`. Name pattern:
   - forecast mode: `demand-forecaster-skill-YYYY-MM-DD-forecast-{scope}.md`
   - recommend-po mode: `demand-forecaster-skill-YYYY-MM-DD-po-{vendor}.md`
   Snapshot includes: source (windward / bc-po-lines), constants used, full table or PO draft, rationale per line.
3. **Action queue** (recommend-po mode only): one PROPOSED row per PO draft, with `vendor_id`, `total_extended_cost`, `line_count`, `expires_at = now() + 7 days`.

If `--dry-run` or "preview only", skip snapshot + action-queue writes — keep only in-message output.

---

## Step 5 — Cross-skill notifications

After the run completes:

- **`bc-business-review`** — if a weekly review run is in progress, pass forecast-vs-actual deltas (compare last week's `forecast_30d` against actual sell-through).
- **`vendor-cascade`** — if multiple vendors compete for the same SKU, surface the cascade routing decision before locking the PO vendor.
- **`coop-claim-drafter`** — flag any SKU where `forecast_60d × unit_cost > co-op_window_remaining` so under-spent co-op funds get claimed before expiry.
- **`daily-brief-composer`** — overwrite `skills/daily-brief-composer/inbox/reorder-now.md` with top-3 reorder_now SKUs (matches Track 6.9 senior-only Daily Brief tile).

---

## Output format

### Mode A — `forecast`

```
DEMAND-FORECASTER — [YYYY-MM-DD HH:MM]  •  Accent Lighting  •  source: [windward | bc-po-lines]

Scope: [vendor / SKU pattern / "all"]   •   [N SKUs in inventory] → [M with velocity > 0]
Constants: lead=4w  safety=2w  target=14w  overstock=26w  velocity_window=90d
Seasonality: [52-week active | thin-history fallback (factor=1.0)]

═══ DEMAND FORECAST ═══

SKU         | Vendor              | On-hand | On-order | 30d  | 60d  | 90d  | Reorder qty | Kind         | Weeks of stock
------------+---------------------+---------+----------+------+------+------+-------------+--------------+----------------
[sku]       | [vendor_name]       |    [n]  |    [n]   | [n]  | [n]  | [n]  |     [n]     | reorder_now  | 1.2
[sku]       | [vendor_name]       |    [n]  |    [n]   | [n]  | [n]  | [n]  |     [n]     | reorder_soon | 7.4
...

═══ SUMMARY ═══
reorder_now:  [n]   suggested PO $: $[total]
reorder_soon: [n]   suggested PO $: $[total]
overstock:    [n]
normal:       [n]
no_data:      [n]   (no PO/sales history in window)

[1-paragraph plain-language summary: top 3 stockout risks, top vendor by reorder $, any seasonal anomalies]

Snapshot:    skills/analysis-snapshot/runs/demand-forecaster-skill-YYYY-MM-DD-forecast-[scope].md
Next step:   say "draft a PO for [top vendor]" to switch to recommend-po mode.
```

### Mode B — `recommend-po`

```
DEMAND-FORECASTER — PO DRAFT — [YYYY-MM-DD]  •  vendor: [vendor_name]  •  source: [windward | bc-po-lines]

──────────────────────────────────────────────────────
PURCHASE ORDER — DRAFT — Accent Lighting
Vendor:   [vendor_name]
Contact:  [vendor_contact_email if known, else "—"]
Date:     [YYYY-MM-DD]
PO #:     DRAFT-[YYYY-MM-DD]-[vendor_slug]

Line items:
SKU         | Description                | Qty | Unit cost | Extended  | Why
------------+----------------------------+-----+-----------+-----------+-------------------------------------------
[sku]       | [description]              | [n] | $[xx.xx]  | $[xx.xx]  | reorder_now • 1.2 wk of stock → 14w target
[sku]       | [description]              | [n] | $[xx.xx]  | $[xx.xx]  | reorder_soon • 7.4 wk of stock → top up
...

Subtotal:                                              $[xx,xxx.xx]
Estimated freight (per vendor terms):                  $[xx.xx]
TOTAL:                                                 $[xx,xxx.xx]
──────────────────────────────────────────────────────

Action queue: 1 PROPOSED row queued (id=[uuid]). Approve via /approve [uuid] or "send the [vendor] PO".
Snapshot:     skills/analysis-snapshot/runs/demand-forecaster-skill-YYYY-MM-DD-po-[vendor].md
```

### Partial output (when data is incomplete)

If a run completes but the underlying data has gaps (NULL-heavy `PO_LINES`, missing `qty_available`, constants drift, partial Windward sync), emit the table or PO draft as normal AND prepend a `═══ DATA QUALITY ═══` block listing every gap. Do not silently produce a clean-looking forecast over dirty data:

```
═══ DATA QUALITY (partial-data run) ═══
Source:                 [windward | bc-po-lines]
Excluded PO_LINES rows: [N] (NULL qty or NULL order_date)
SKUs with no qty_available: [N] (forced to kind=no_data)
Constants drift:        [none | references/model.md vs js/demand_forecast.js — see warning above]

Re-run after [populate-step] to clean the working set.
```


---

## AccentOS context

- **Stack:** Supabase `hsyjcrrazrzqngwkqsqa` (forecast working set + snapshots), BigCommerce `store-cwqiwcjxes` (PO_LINES origin via Track 6.9 path), Anthropic API via `ANTHROPIC_API_KEY` for plain-language summary generation in forecast mode, Cloudflare Pages (UI host).
- **Project:** AccentOS — internal operating system for Accent Lighting.
- **Paths:** `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`).
- **UI counterpart:** `js/demand_forecast.js` (Track 6.9). Compute constants in `references/model.md` are kept in lockstep with that file — change one, change both.
- **Schema source of truth:** MASTER.md §6 (INVENTORY, PO_LINES). When Windward connects (Track 6.11), source switches transparently — no UI or skill changes.
- **Capability ladder level:** L5 — Predictive.
- **Companion skills:**
  - `vendor-cascade` — vendor preferences influence reorder routing when multiple vendors carry the same SKU
  - `bc-business-review` — consumer of forecast data; weekly review surfaces forecast vs actual
  - `analysis-snapshot` — captures each forecast / PO run as a re-runnable artifact
  - `action-queue` — receives PROPOSED PO drafts for Michael's approval
  - `coop-claim-drafter` — forecast identifies under-spent co-op windows by SKU
  - `windward-bridge` — preferred data source when connected (richer history, real sales not PO proxy)
  - `daily-brief-composer` — surfaces top-3 reorder_now SKUs each morning
  - `supabase-sql-magic` — for ad-hoc SKU velocity queries Michael writes by hand

---

## Anti-patterns

- **Never** drift from the Track 6.9 UI's heuristic constants. If `LEAD_WEEKS`, `SAFETY_WEEKS`, `TARGET_WEEKS`, `OVERSTOCK_WEEKS`, or `VELOCITY_WINDOW_DAYS` change, change them in one place (`references/model.md`) and propagate to `js/demand_forecast.js` in the same commit. Two sources of truth = guaranteed mismatch.
- **Never** auto-send a PO. Recommend-po mode emits a DRAFT and a PROPOSED row in `action-queue`. Sending requires Michael's approval per AccentOS spend rules. This is the L5 → L6 ladder gate.
- **Never** force Windward as a hard dependency. The skill must work in BC-only mode (PO_LINES proxy) — that's the current Track 6.9 contract. If Windward is missing, fall back; document the source in every output.
- **Never** invent seasonality factors. If history is < 52 weeks, set factor = 1.0 and surface "thin-history fallback" in the summary. Honest > clever.
- **Never** apply seasonality to SKUs with `kind = no_data`. No velocity = no forecast — emit the row with empty forecasts and `kind = no_data` so Michael sees the gap.
- **Never** output prose-only advice ("you should reorder some pendants from Hinkley"). Output the table + reorder qty + vendor — that's the contract.
- **Never** skip the snapshot. Every forecast run is re-runnable via `analysis-snapshot`. Prose-only is a failed run.
- **Never** silently merge SKUs across vendors. The compute key is `sku|vendor_id` (matches `js/demand_forecast.js`). If one SKU is sourced from two vendors, emit two rows.
- **Never** coalesce NULL `qty` or NULL `order_date` in `PO_LINES` to 0 when computing velocity. NULL means "data missing" — a 0 silently lowers velocity and dampens the reorder signal. Exclude the row, count the exclusions, surface in the summary.
- **Never** substitute 0 for a NULL `qty_available`. A SKU without an on-hand count would land at the top of `reorder_now` (0 weeks of stock), drowning real signals. Emit `kind = no_data` instead.
- **Never** proceed past Step 0 with an empty INVENTORY table. The forecast contract requires on-hand counts to compute weeks-of-stock; without inventory rows the output is structurally meaningless.
