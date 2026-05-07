---
name: priority-articulation
description: >
  Translate vague Accent Lighting business priorities ("drive Q4 margin",
  "improve GMC compliance", "reduce stockouts on top SKUs") into measurable
  scoring rules with explicit thresholds, weights, and Supabase
  hsyjcrrazrzqngwkqsqa data field mappings. The output feeds directly into
  vendor-cascade as the "priorities" input and into project-profiles.md as
  a paste-in. Use this skill when Michael says: "articulate this priority",
  "make this measurable", "what would this priority mean numerically", "turn
  this into a rule", "how do I score for this", "translate this priority into
  weights", "operationalize this", or any phrasing that asks to convert a
  qualitative AccentOS or Accent Lighting business priority into a
  quantitative rule. Do not use this skill to design new vendors, modify
  scoring weights of existing rules, or trace existing scores (that's
  vendor-cascade). Always produces a rule table plus a project-profiles.md
  paste-in block — never returns prose-only analysis.
---

# priority-articulation

**Purpose:** Translate vague Accent Lighting business priorities into measurable scoring rules with explicit thresholds, Supabase hsyjcrrazrzqngwkqsqa field mappings, and weights that vendor-cascade can consume directly.

Stolen from: the strategy-articulation concept in `alirezarezvani/claude-skills` `c-level-advisor/strategic-alignment`. Rebuilt as a single-purpose AccentOS skill — no board package wrapper, no team realignment, just priority → rule translation.

---

## Trigger Recognition

Run when Michael says:
- "articulate this priority" / "articulate ..." (any priority name)
- "make ... measurable" (any metric or goal)
- "turn this into a rule"
- "how do I score for ..." (any dimension)
- "what would ... mean numerically" (any priority statement)
- "operationalize ..." (any goal)
- "translate ... into weights" (any priority)

**Do NOT fire** for: "what's the priority right now?" / "what should I work on?" / "what's blocking us?" — those route to bottleneck-finder, which diagnoses current blockers, not scoring rules. This skill requires a stated priority object (a goal, metric, or dimension) to operationalize.

---

## Step 1 — Capture the priority statement

Pull the priority from one of these in order:
1. Michael's stated input in the current prompt
2. `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` → "Accent Lighting Ecommerce" → "Known capability gaps"
3. `/home/user/accent-os/MASTER.md` → search for "priority" / "Q4" / "margin" / "GMC"

If multiple priorities are in scope, run this skill once per priority and combine outputs at the end. Cap at 5 priorities per invocation — if Michael lists more, surface: "That's [N] priorities. Processing the first 5 by document order. Say 'continue' for the next batch."

Write the priority as a one-sentence intent:

```
Priority intent: [verb] + [object] + [target/threshold if stated]
Example: "Drive Q4 margin by lifting average vendor gross-margin% above 38%"
```

If the priority is genuinely vague ("be better at GMC"), ask Michael for the target threshold once, then proceed. Do not invent thresholds.

---

## Step 2 — Map to Supabase data fields

Load the active schema from `/home/user/accent-os/sql/M02_core_schema.sql` and any later M-files (M21 phase3, M22 inventory, M28 competitor_prices, M29 marketing). Identify which tables/columns could measure the priority:

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

If no fields measure the priority, flag "No measurement coverage in current schema" and stop — schema additions are M-task work, not part of this skill's scope.

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

Propose 1–3 rules per priority, ranked by:
1. **Defensibility** — does the field directly appear in the priority's intent statement (e.g. "margin%" maps to `vendors.gross_margin_pct`)? A rule scores 5 if it measures the named concept directly; 3 if it's a proxy; 1 if it requires inferring the priority's meaning.
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
**Data field path:** [Supabase hsyjcrrazrzqngwkqsqa — source M-file: /home/user/accent-os/sql/M__.sql]
**Re-tune cadence:** [weekly/monthly/quarterly]
**Last articulated:** YYYY-MM-DD
```

---

## Anti-patterns

- **Never** invent threshold numbers. They come from Michael's stated input or get asked once. The skill is articulation, not arbitrary cutoff-setting.
- **Never** propose new schema additions in this skill. If no field measures the priority, flag and stop — schema changes are M-task work for Michael.
- **Never** modify vendor_scores or vendor_overrides directly. This skill produces rule specs that vendor-cascade then consumes.
- **Never** skip the Supabase schema read. Rules written against imagined fields (e.g. a `gross_margin_pct` column that doesn't exist in M02) produce a vendor-cascade run that errors silently and returns all zeros for the affected dimension.
- **Never** produce more than 3 rules per priority. Picking 1 primary + 1 backup is the deliverable; offering 7 alternatives shifts the decision burden onto Michael.
- **Never** output a rule that references a field not present in the currently loaded M-file schema — verify each `table.column` exists before writing it into the rule spec.
