---
name: rep-group-matchmaker
description: >
  For each Accent Lighting vendor with no rep_group_id assigned (M19:
  257 unassigned vendors), suggest the most likely rep group based on
  brand category match, geographic region overlap, existing vendor ↔
  rep_group mappings, and price-tier correlation. Outputs a CSV with
  vendor_id, suggested_rep_group_id, confidence_score (0–1), and the
  top 3 evidence reasons. Use this skill when Michael says: "match
  unassigned vendors", "M19 batch", "rep group matchmaker", "assign
  rep groups", "find rep group for [vendor]", "257 vendors", or any
  phrasing that asks to populate the rep_group_id field on vendors.
  Do not use to override existing assignments — this skill only
  proposes for vendors where rep_group_id IS NULL. Always produces a
  CSV with confidence scoring + evidence per row — never returns
  prose-only.
---

# rep-group-matchmaker

**Purpose:** Close M19 (257 vendors with no rep group assigned) by surfacing the most-likely rep_group for each unassigned vendor based on patterns in already-mapped data — no API blockers, runnable today.

Stolen from: clustering / similarity-matching primitives common across SegmentStream, Klaviyo segments, and Crossbeam account mapping.

---

## Trigger Recognition

Run when Michael says:
- "match unassigned vendors" / "M19 batch"
- "rep group matchmaker" / "assign rep groups"
- "find rep group for [vendor name]"
- "257 vendors" (or current unassigned count)

---

## Step 1 — Pull the unassigned set

```sql
SELECT id, name, brand_category, region, price_tier,
       hq_city, hq_state, primary_contact_email
FROM vendors
WHERE rep_group_id IS NULL
ORDER BY revenue_tier DESC NULLS LAST, name;
```

If the schema differs in `/home/user/accent-os/sql/M02_core_schema.sql`, adapt to actual column names and flag any missing fields.

Confirm count vs. M19's stated 257 — if the count drifted, note it.

---

## Step 2 — Pull the assigned ground-truth

```sql
SELECT v.id, v.name, v.brand_category, v.region, v.price_tier,
       v.hq_city, v.hq_state,
       rg.id AS rep_group_id, rg.name AS rep_group_name, rg.regions
FROM vendors v
JOIN rep_groups rg ON rg.id = v.rep_group_id;
```

This is the labeled ground-truth set. Use these patterns to suggest assignments for unassigned vendors.

---

## Step 3 — Build the rep_group profile

For each rep_group, compute its "fingerprint" from assigned vendors:

| Dimension | Computation |
|---|---|
| **dominant_categories** | Top 3 `brand_category` values among assigned vendors (with %) |
| **regions_covered** | Distinct `region` values + the rep_group's stated `regions` field |
| **price_tier_distribution** | Count per tier (entry / mid / premium / luxury) |
| **hq_state_cluster** | Modal state(s) of assigned vendors' HQ |

This is the fingerprint each unassigned vendor will be matched against.

---

## Step 4 — Score each unassigned vendor against each rep_group

**Filter unscoreable vendors first.** Any unassigned vendor missing BOTH `brand_category` AND `region` cannot be scored meaningfully — flag these as `INSUFFICIENT_DATA` and exclude from scoring (they appear separately in BLOCK 4 of the output with a "fix the source data first" note).

Per (unassigned_vendor, rep_group) pair, compute a confidence score:

```
score = (category_match × 0.40)
      + (region_match × 0.30)
      + (price_tier_match × 0.20)
      + (state_proximity × 0.10)
```

Where:
- **category_match** — 1.0 if exact match to top-1, 0.5 if matches top-3, 0 otherwise
- **region_match** — 1.0 if vendor's region is in rep_group's stated regions, 0.5 if adjacent, 0 otherwise
- **price_tier_match** — 1.0 if exact, 0.5 if adjacent tier, 0 otherwise
- **state_proximity** — 1.0 if same state as cluster, 0.5 if neighboring, 0 otherwise

Return top 3 candidates per vendor (sorted by score descending).

---

## Step 5 — Threshold + classification

Per top-1 match per vendor:

| Confidence | Classification | Recommended action |
|---|---|---|
| ≥ 0.75 | **HIGH** | Auto-suggest; Michael spot-checks |
| 0.50–0.74 | **MEDIUM** | Manual review |
| < 0.50 | **LOW** | Flag — likely needs new rep_group OR manual investigation |

---

## Step 6 — Output

```
═══ BLOCK 1: SUMMARY ═══
Unassigned vendors: [N]
HIGH confidence: [count]   MEDIUM: [count]   LOW: [count]

Estimated M19 reduction if all HIGH applied: [count] / 257

═══ BLOCK 2: ASSIGNMENT QUEUE (CSV) ═══
vendor_id,vendor_name,suggested_rep_group_id,suggested_rep_group_name,confidence,classification,evidence
V123,Acme Lighting,RG045,Northeast Lighting Reps,0.87,HIGH,"category match (Pendants); region match (Northeast); state cluster (NY)"
V456,Bright Co,RG012,Southwest Distribution,0.62,MEDIUM,"region match (SW); price tier match (mid); category partial (Outdoor)"
V789,Lumen Inc,(none),(none),0.32,LOW,"No rep_group has matching category profile; consider creating new group"
...

═══ BLOCK 3: HIGH-CONFIDENCE BULK UPDATE SQL ═══
-- Apply only after Michael spot-checks the HIGH rows above
UPDATE vendors SET rep_group_id = 'RG045' WHERE id = 'V123' AND rep_group_id IS NULL;
UPDATE vendors SET rep_group_id = 'RG012' WHERE id = 'V456' AND rep_group_id IS NULL;
...

═══ BLOCK 4: NEXT-STEP HINTS ═══
- HIGH (auto-suggest) rows: spot-check 5 random; if accurate, run BLOCK 3 SQL
- MEDIUM rows: manual review — pair with vendor-onboard-checklist before deciding
- LOW rows: scored but below 0.50 — likely need new rep_group OR data refinement

═══ BLOCK 5: INSUFFICIENT_DATA ROWS (excluded from scoring) ═══
For each vendor missing both brand_category AND region:
  - vendor_id, name — fix this in vendors table first, then re-run
```

---

## Anti-patterns

- **Never** propose for vendors where `rep_group_id` is already set — read-only on populated rows.
- **Never** auto-execute the bulk-update SQL. Always require Michael's spot-check.
- **Never** suggest a rep_group with confidence < 0.50 — flag as LOW for manual review.
- **Never** ignore the state_proximity dimension — geography matters in B2B distribution.
- **Never** invent rep_groups. If LOW confidence, suggest "consider creating new group" rather than picking a wrong one.
