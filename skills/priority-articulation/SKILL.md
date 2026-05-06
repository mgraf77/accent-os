---
name: priority-articulation
description: >
  Translate vague Accent Lighting business priorities ("drive Q4 margin",
  "improve GMC compliance", "reduce stockouts on top SKUs") into measurable
  scoring rules with explicit thresholds, weights, and Supabase
  hsyjcrrazrzqngwkqsqa data field mappings. The output feeds directly into
  vendor-cascade as the "priorities" input and into project-profiles.md as
  a paste-in. Use this skill when Michael says: "articulate this priority",
  "make this measurable", "what would [priority] mean numerically", "turn
  this into a rule", "how do I score for [X]", "translate [priority] into
  weights", "operationalize [X]", or any phrasing that asks to convert a
  qualitative AccentOS or Accent Lighting business priority into a
  quantitative rule. Do not use this skill to design new vendors, modify
  scoring weights of existing rules, or trace existing scores (that's
  vendor-cascade). Always produces a rule table plus a project-profiles.md
  paste-in block — never returns prose-only analysis.
---

# priority-articulation

**Purpose:** Bridge the gap between "what Accent Lighting cares about" and "what AccentOS measures." Vague priorities don't drive vendor scores until they're broken down into measurable rules with thresholds and weights.

Stolen from: the strategy-articulation concept in `alirezarezvani/claude-skills` `c-level-advisor/strategic-alignment`. Rebuilt as a single-purpose AccentOS skill — no board package wrapper, no team realignment, just priority → rule translation.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "articulate [priority]"
- "make [X] measurable"
- "turn this into a rule"
- "how do I score for [X]"
- "what would [priority] mean numerically"
- "operationalize [X]"
- "translate [priority] into weights"
- "define what [X] means as a score"
- "how do we measure [X]"
- "put a number on [X]"
- "what threshold should we use for [X]"
- "connect [priority] to vendor scores"
- "GMC compliance rule" / "margin floor" / "stockout threshold"

---

## Steps 1 + 2 — Capture priority and load schema (run in parallel)

**Do in parallel:** Step 1 (priority capture) and Step 2 (Supabase schema load) — they are independent reads.

### Step 1 — Capture the priority statement

Pull the priority from one of these in order:
1. Michael's stated input in the current prompt (highest precedence)
2. `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` → "Accent Lighting Ecommerce" → "Known capability gaps"
3. `/home/user/accent-os/MASTER.md` → search for "priority" / "Q4" / "margin" / "GMC"

If multiple priorities are in scope, run this skill once per priority and combine outputs at the end.

Write the priority as a one-sentence intent:

```
Priority intent: [verb] + [object] + [target/threshold if stated]
Example: "Drive Q4 margin by lifting average vendor gross-margin% above 38%"
```

If the priority is genuinely vague ("be better at GMC"), ask Michael for the target threshold once, then proceed. Do not invent thresholds.

---

### Step 2 — Map to Supabase data fields

Load the active schema from `/home/user/accent-os/sql/M02_core_schema.sql` and any later M-files (M21 phase3, M22 inventory, M28 competitor_prices, M29 marketing) in Supabase hsyjcrrazrzqngwkqsqa. Identify which tables/columns could measure the priority.

Edge cases:
- If the M-schema files don't exist at `/home/user/accent-os/sql/`, output "Schema files not found at expected path — cannot validate field names. Run schema setup first." and stop.
- If a priority clearly maps to a BigCommerce store-cwqiwcjxes field not yet mirrored in Supabase (e.g. BC order-level data), flag the gap: "Field exists in BC store-cwqiwcjxes but not yet in Supabase hsyjcrrazrzqngwkqsqa schema — requires ETL M-task."

Identify which tables/columns could measure the priority:

- **Vendor-level** → `vendors`, `vendor_scores`, `vendor_overrides`
- **Deal-level** → `deals`, `quotes`, `coop_funds`
- **Inventory-level** → `inventory`, `purchase_orders`
- **Marketing/feed-level** → `marketing.*`, `competitor_prices`

Output the field map:

```
PRIORITY: [intent]

Candidate measurement fields:
- vendors.gross_margin_pct        (M02)   — direct gross margin per vendor
- vendor_scores.score             (M02)   — composite score; includes margin
- deals.unit_cost / deals.list    (M21)   — per-deal margin
- inventory.fill_rate_30d         (M22)   — proxy for stockout pressure
```

If no fields measure the priority, flag "No measurement coverage in current schema" and propose what'd need to be added (a new column or join).

---

## Step 3 — Propose 1–3 measurement rules

For each candidate field, draft a rule of the shape:

```
RULE name        : [short kebab-case identifier]
input field      : [table.column]
operator         : >= | <= | == | between
threshold        : [number or range]
weight in P[n]   : [0.0–1.0]
data freshness   : [how often this updates — daily, on order, manual]
```

Aim for 1–3 rules per priority, ranked by:
1. **Defensibility** — would Michael agree this measures the priority?
2. **Computability** — can it be calculated from existing data without new joins?
3. **Stability** — does the threshold need re-tuning every week?

---

## Step 4 — Score the rules

For each proposed rule, score 1–5 on three dimensions:

| Rule | Defensibility | Computability | Stability | Total |
|------|:---:|:---:|:---:|:---:|
| margin-floor-38 | 5 | 5 | 4 | 14 |
| deal-margin-q4-only | 4 | 3 | 2 | 9 |

Recommend the top-scoring rule as primary, second-place as backup.

---

## Step 5 — Produce the output

Two paste-ready blocks:

```
═══ BLOCK 1: RULE TABLE ═══
[full table from Step 4]

Recommended primary: [name]   |   Recommended backup: [name]

═══ BLOCK 2: project-profiles.md PASTE-IN ═══

## [Priority name] (articulated YYYY-MM-DD)
**Intent:** [one-sentence intent from Step 1]
**Primary rule:** [name] — `[table.column] [operator] [threshold]` weighted [w] in cascade priority P[n]
**Backup rule:** [name] — `[table.column] [operator] [threshold]`
**Data field path:** [Supabase /home/user/accent-os/sql/ source]
**Re-tune cadence:** [weekly/monthly/quarterly]
**Last articulated:** YYYY-MM-DD
```

---

## Anti-patterns

- **Never** invent threshold numbers. They come from Michael's stated input or get asked for once. The skill is articulation, not arbitrary cutoff-setting.
- **Never** propose new schema additions in this skill. If no field measures the priority, flag "No measurement coverage" and stop — schema additions are M-task work, not priority-articulation output.
- **Never** modify `vendor_scores`, `vendor_overrides`, or any Supabase hsyjcrrazrzqngwkqsqa table directly. This skill produces rule specs that vendor-cascade then consumes.
- **Never** skip the Supabase schema read from `/home/user/accent-os/sql/`. Articulating against imagined field names produces rules that break at cascade time.
- **Never** produce more than 3 rules per priority. 1 primary + 1 backup is the deliverable; offering 7 alternatives shifts the decision burden onto Michael.
- **Never** run Step 1 (priority capture) and Step 2 (schema load) sequentially — they are independent reads and can execute in parallel.
- **Never** output BLOCK 1 (rule table) without BLOCK 2 (project-profiles.md paste-in) — the paste-in is what connects this output to vendor-cascade's priority input.
