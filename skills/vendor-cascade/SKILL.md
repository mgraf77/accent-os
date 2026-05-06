---
name: vendor-cascade
description: >
  Trace AccentOS vendor scores from Accent Lighting priorities down to specific
  metric weights and vendor data fields, surface orphan metrics that don't roll
  up to any priority, and validate that metric weights actually sum correctly
  per priority. Use this skill when Michael says: "trace vendor X's score",
  "why is vendor Y ranked there", "find orphan metrics", "cascade the scores",
  "what's driving the vendor ranking", "rebuild the scoring rationale", "sum-
  check the weights", or any phrasing that asks for top-down vendor-score
  explainability. Do not use this skill for raw score recalculation (that lives
  in the AccentOS scoring engine inside /home/user/accent-os/) or for adding
  new vendors (that's vendor intake). Always produces three paste-ready
  outputs: a cascade table, an orphan list, and a vendor_scores SQL stub for
  Supabase hsyjcrrazrzqngwkqsqa — never returns prose-only analysis.
---

# vendor-cascade

**Purpose:** Make AccentOS vendor scores explainable end-to-end. Every score component must trace back to a named Accent Lighting priority. Anything that doesn't is an orphan — flag it.

Forged from: `alirezarezvani/claude-skills` `c-level-advisor/strategic-alignment` (cascade pattern only — board reporting wrapper dropped).

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "trace vendor X's score"
- "why is vendor Y ranked there"
- "cascade the scores"
- "find orphan metrics"
- "what's actually driving the ranking"
- "rebuild the scoring rationale"
- "sum-check the weights"
- "where does this score come from"
- "explain the vendor ranking to me"
- "show me how the score is built"
- "walk me through vendor X's number"
- "vendor score breakdown"
- "metric weights don't add up"
- "which priority is pulling vendor Y down"

Also trigger when Michael questions a specific vendor's rank or asks for score explainability for a partner/board/owner.

---

## Step 1 + 2 — Load priorities and scoring formula (run in parallel)

**Do in parallel:**

### Step 1 — Load the priorities

Read Accent Lighting's active priorities from one of these in order:
1. Michael's stated input in the current prompt (highest precedence)
2. `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` → "Accent Lighting Ecommerce" → "Known capability gaps"
3. `/home/user/accent-os/MASTER.md` → search for "priority" / "Q4" / "margin"

If no priorities are found in any source, output "No priorities located — check project-profiles.md or MASTER.md" and stop. Do not invent priorities.

Output a numbered priority list:

```
P1 — [name]   |   weight: [0.0–1.0]   |   source: [project-profiles.md | MASTER.md | prompt]
P2 — ...
```

Priorities must sum to 1.0 across the full set. If they don't, flag the imbalance and proceed with normalized weights. If only 1 priority is found, assign weight 1.0 and note it.

### Step 2 — Load the scoring formula

Pull the current vendor scoring metrics from AccentOS:
- Primary source: `/home/user/accent-os/sql/` — check for `vendor_scores` table schema in M02 or later M-files (M21–M29)
- Secondary: `/home/user/accent-os/js/decision_engine.js`, `deal_optimizer.js`, `competitive_pricing.js`, `inventory_analytics.js`
- Tertiary: `/home/user/accent-os/index.html` (search for "score", "weight", "vendor")

Edge cases:
- If formula exists in multiple sources and they conflict, prefer the SQL schema as ground truth and note the conflict.
- If no formula is found in any location, output "Scoring formula not located — provide path or paste current weights" and stop. Do not invent weights.

Output a flat metric list:

```
M1 — [metric name]   |   current weight: [0.0–1.0]   |   data field: [BC store-cwqiwcjxes field / Supabase hsyjcrrazrzqngwkqsqa column]   |   source file: [path]
M2 — ...
```

---

## Step 3 — Build the cascade map

Produce a 4-column table mapping every priority to its metrics:

| Priority | Metric | Metric weight | Vendor data field |
|----------|--------|---------------|-------------------|
| P1 — Q4 margin | M3 — gross margin % | 0.40 | BC: `gross_margin` |
| P1 — Q4 margin | M7 — discount frequency | 0.10 | BC: `promo_count_90d` |
| P2 — GMC compliance | M2 — image coverage | 0.25 | BC: `images_per_sku` |

Rules:
- Every metric in the formula must appear in this table at least once (unless it's an orphan — see Step 4)
- Metric weight sums per priority must equal 1.0
- If a metric serves multiple priorities, list it once per priority with the priority-specific weight

---

## Step 4 — Detect orphans

Two orphan classes:

**A. Metrics with no priority** — metric exists in the scoring formula (Step 2) but doesn't appear in the cascade map (Step 3). These are tracked but not driving any business priority.

**B. Priorities with no metrics** — priority listed in Step 1 but no metric in Step 2 measures it. These are stated but unmeasured.

Output:

```
ORPHANS

Class A — Metrics with no priority (delete or assign):
  - [metric name] — currently weighted [w]; not connected to any P
  - ...

Class B — Priorities with no metric (add measurement):
  - [priority name] — stated in P[n] but no metric measures it
  - ...
```

If both classes are empty, output "No orphans detected" and continue.

---

## Step 5 — Weight sum-check

For each priority in the cascade map, sum the metric weights tied to it. Flag any priority whose tied metrics don't sum to 1.0.

```
SUM-CHECK

P1 — Q4 margin               weights sum: 1.00   ✓
P2 — GMC compliance          weights sum: 0.85   ✗ underweighted by 0.15
P3 — Stockout reduction      weights sum: 1.20   ✗ overweighted by 0.20
```

For any drift, propose a redistribution that brings the priority back to 1.0 — but do not apply it. This skill is trace-only.

---

## Step 6 — Output the three paste-ready blocks

Final report structure (single message):

```
VENDOR CASCADE — [date]

Source priorities: [count from Step 1]
Source metrics: [count from Step 2]
Orphans: A=[count]  B=[count]
Sum-check failures: [count]

═══ BLOCK 1: CASCADE TABLE ═══
[full Step 3 table]

═══ BLOCK 2: ORPHAN LIST ═══
[full Step 4 output]

═══ BLOCK 3: vendor_scores SQL STUB ═══
-- Supabase hsyjcrrazrzqngwkqsqa
-- Paste into vendor_scores rationale column for vendor [vendor_id]

INSERT INTO vendor_scores (vendor_id, priority_id, metric_id, weight, computed_value, computed_at)
VALUES
  ('[vendor_id]', 'P1', 'M3', 0.40, [computed], NOW()),
  ('[vendor_id]', 'P1', 'M7', 0.10, [computed], NOW()),
  ('[vendor_id]', 'P2', 'M2', 0.25, [computed], NOW());
-- (one row per cascade-table line for this vendor)

[remediation list — orphans to remove + priorities to instrument + weight redistributions, all proposals not actions]
```

---

## Reverse-cascade variant

When Michael asks "why is vendor Y ranked there" (rank-surprise mode), invert the flow:
1. Pull vendor Y's per-metric values from BC store-cwqiwcjxes / Supabase
2. Multiply each metric value by its weight from the cascade map
3. Group contributions by priority (sum metric × weight per priority)
4. Output: "Vendor Y's score is X. Priority breakdown: P1 contributes [a], P2 contributes [b], ..."
5. Highlight the largest contributor and the largest underperformer for that vendor

This variant uses Steps 1–3 then branches; Steps 4–5 are skipped, Step 6 produces only Block 1 with vendor-Y-specific contribution numbers added as a 5th column.

---

## Anti-patterns

- **Never** invent priorities. They come from project-profiles.md, MASTER.md, or Michael's prompt — never from the LLM's general knowledge of "what an ecommerce business should care about."
- **Never** propose new metrics in this skill. This is a trace-only skill. Metric design lives elsewhere (priority-articulation).
- **Never** modify `/home/user/accent-os/index.html`, `js/*.js`, `/home/user/accent-os/sql/*.sql`, or any scoring code. Output proposals only.
- **Never** skip the sum-check. Drift in weights is the single most common source of vendor-rank surprises in AccentOS.
- **Never** skip the SQL stub. The point of this skill is paste-readiness for `vendor_scores` in Supabase hsyjcrrazrzqngwkqsqa — prose-only output is a failed run.
- **Never** ask Michael to disambiguate a metric — pick the highest-weight match and state which one in the output.
- **Never** run Steps 1 and 2 sequentially when both sources are available — they are independent reads; parallel execution halves latency.
- **Never** normalize weights silently. Always announce the normalization and show the before/after weights in the output.
