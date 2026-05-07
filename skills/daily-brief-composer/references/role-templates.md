# Role templates — daily-brief-composer

> Single source of truth for which sections each AccentOS role gets, in what order, with what caps. SKILL.md Step 1 reads this; do not invent new section types in the skill itself — Edit this file first.

---

## Section catalog (the only types allowed)

| Section ID | Header | Source | Default cap |
|------------|--------|--------|-------------|
| `top3` | Top 3 today | `next-action-recommender` (fallback: per-role SQL in `fallback-queries.md`) | exactly 3 |
| `deals_at_risk` | Deals at risk | `pipeline_deals` (no contact >30d OR stage stalled >14d) | 5 rows |
| `vendors_attention` | Vendors needing attention | `vendor_scores` deltas + `coop_tracker` deadlines + broken-link-rescue flags | 5 rows |
| `kpi_dev` | KPI deviations | `kpi_snapshots` WoW deltas above threshold (Step 0) | 4 rows |
| `new_24h` | New since last brief | 24h diff from watermark across `pipeline_deals`, `customer_interactions`, `alerts` | 6 rows |
| `coop_deadlines` | Co-op deadlines this week | `coop_tracker` WHERE `deadline <= NOW() + 14d` | 4 rows |
| `feed_health` | GMC feed health | `gmc-feed-audit` summary + disapproval count | 3 rows |
| `funnel_pulse` | Funnel pulse | `kpi_snapshots` Group M-FN (sessions, conv rate, AOV) | 3 rows |
| `email_pulse` | Email/SMS pulse | Klaviyo via M09 (open / click / unsub deltas) | 3 rows |
| `warehouse_health` | Warehouse / delivery health | `kpi_snapshots` Group O-WH + O-DL | 4 rows |
| `inventory_breach` | Safety-stock breaches | `inventory.safety_stock` flagged via I-IV5 | 5 rows |
| `today_orders` | Orders to ship today | `orders` WHERE `ship_date = CURRENT_DATE` | 5 rows |

---

## Owner (default)

Walks in wanting: what's at stake today, what could break, where the money is leaking.

| Order | Section ID | Cap | Notes |
|-------|------------|-----|-------|
| 1 | `top3` | 3 | always present, never cap-trimmed |
| 2 | `deals_at_risk` | 5 | dollar-weighted ordering |
| 3 | `vendors_attention` | 5 | combine score-delta + co-op + broken-link sources |
| 4 | `kpi_dev` | 4 | Group F + Group $ first, then Group V |
| 5 | `new_24h` | 6 | 24h diff |

**Trim cascade if over-cap:** vendors_attention → 3, deals_at_risk → 3, new_24h → 4. Never trim top3.

---

## Sales

Walks in wanting: who to call, who's gone cold, what's the state of pipeline.

| Order | Section ID | Cap | Notes |
|-------|------------|-----|-------|
| 1 | `top3` | 3 | scoped to sales-rep ownership |
| 2 | `deals_at_risk` | 7 | bigger cap — this is sales' core surface |
| 3 | `funnel_pulse` | 3 | sessions / conv / AOV WoW |
| 4 | `new_24h` | 5 | new leads / interactions |
| — | `kpi_dev` | — | drop unless |Δ| ≥ 25% (sales reps don't need finance noise) |
| — | `vendors_attention` | — | drop entirely |

**Trim cascade:** new_24h → 3, deals_at_risk → 5.

---

## Marketing

Walks in wanting: what's the funnel doing, did email land, is GMC clean.

| Order | Section ID | Cap | Notes |
|-------|------------|-----|-------|
| 1 | `top3` | 3 | scoped to marketing tasks |
| 2 | `funnel_pulse` | 3 | always present |
| 3 | `email_pulse` | 3 | Klaviyo via M09; if M09 not yet shipped, render `_blocked on M09 — Klaviyo wiring_` |
| 4 | `feed_health` | 3 | GMC disapprovals + image coverage |
| 5 | `kpi_dev` | 4 | filter to Group M-* only |
| 6 | `new_24h` | 4 | new content / campaigns |
| — | `deals_at_risk` | — | drop entirely |
| — | `vendors_attention` | — | drop entirely |

**Trim cascade:** new_24h → 2, kpi_dev → 2.

---

## Ops

Walks in wanting: warehouse pulse, today's ship list, inventory breaches, vendor PO status.

| Order | Section ID | Cap | Notes |
|-------|------------|-----|-------|
| 1 | `top3` | 3 | scoped to ops tasks |
| 2 | `today_orders` | 7 | bigger cap — primary ops surface |
| 3 | `inventory_breach` | 5 | I-IV5 safety-stock breaches |
| 4 | `warehouse_health` | 4 | O-WH + O-DL |
| 5 | `vendors_attention` | 4 | filter to vendors with open POs only |
| 6 | `coop_deadlines` | 3 | only if any in 14d window |
| — | `deals_at_risk` | — | drop entirely |
| — | `funnel_pulse` | — | drop entirely |

**Trim cascade:** vendors_attention → 2, warehouse_health → 2.

---

## Cross-role rules

1. **Header narration** — every section header gets a short vibe-speak voiceover beneath it, max 6 words. e.g. under "Deals at risk (3)": `the ones going cold`. Strip if voice mode is `caveman` or `raw`.
2. **Empty section policy** — render `_nothing flagged_` (italicized). Never silently omit.
3. **Total cap** — ≤1 screen, ~50 lines, ~2500 chars. Step 4 trim cascade enforces this.
4. **Role inheritance** — if Michael invokes a role not in this file (e.g. `installer`, `purchasing`), default to Owner shape and surface a one-line trailer: `_role [X] not yet templated — used Owner. Add it via Edit role-templates.md._`
5. **Voice consistency** — every action verb obeys the active vibe-speak mode (`vibe`, `caveman`, etc.) per Step 0.

---

## Adding a new role

1. Add a new H2 section to this file with the table shape above.
2. Pick from the section catalog only. If a needed section type does not exist, add it to the catalog table first with a documented data source.
3. Specify trim cascade explicitly.
4. No code change required in `SKILL.md` — the skill reads this file at runtime.
