---
name: vendor-clarity-test
description: >
  Sample 5 random AccentOS vendors (or specified vendor IDs) and verify
  each one's #1 score driver is consistent across the Supabase
  hsyjcrrazrzqngwkqsqa tables `vendor_scores`, `vendor_overrides`, and
  the priority list in skills/repo-scout/references/project-profiles.md.
  Surfaces scoring inconsistencies that are otherwise invisible until a
  vendor rank surprise. Use this skill when Michael says: "5-vendor
  clarity check", "verify vendor scoring consistency", "test the
  cascade", "do my vendors agree", "scoring sanity check", "are
  scores explainable", or any phrasing that asks for a cross-table
  scoring audit. Do not use for full vendor-rank explanation (that's
  vendor-cascade) or for redesigning rules (that's priority-articulation).
  Always produces a 5-row consistency table plus a pass/fail summary
  — never returns prose-only analysis, never auto-fixes detected drift.
---

# vendor-clarity-test

**Purpose:** A vendor's score should make sense from three angles — the math (`vendor_scores`), the human notes (`vendor_overrides`), and the stated business priority (`project-profiles.md`). When those three disagree on what's actually driving a vendor's rank, scoring drifts. This is the diagnostic.

Stolen from: Cascade `strategic-alignment` "5-people-from-5-teams test." Rebuilt: instead of asking 5 people what the priority is, ask 5 vendors what their score is built on.

---

## Trigger Recognition

Run when Michael says:
- "5-vendor clarity check"
- "verify vendor scoring consistency"
- "test the cascade"
- "do my vendors agree"
- "scoring sanity check"
- "are scores explainable"

Fire also as a sanity gate after any priority-articulation or vendor-cascade run that adjusted weights.

---

## Step 1 — Pick the 5 vendors

Default: 5 random vendors from the `vendors` table, selected via:

```sql
SELECT id, name FROM vendors
ORDER BY RANDOM()
LIMIT 5;
```

Override: if Michael specified vendor IDs in the prompt, use those instead. If Michael said "the top 5" or "the bottom 5," sort by `vendor_scores.score` DESC or ASC respectively.

---

## Step 2 — Pull each vendor's three angles

For each of the 5 vendors, build three views:

**View A — math (from vendor_scores):**
```sql
SELECT vendor_id, priority_id, metric_id, weight, computed_value
FROM vendor_scores
WHERE vendor_id = $1
ORDER BY weight * computed_value DESC
LIMIT 1;
```
Take the top contributing row → call this the **mathematical #1 driver**.

**View B — human notes (from vendor_overrides):**
```sql
SELECT vendor_id, override_reason, set_by, set_at
FROM vendor_overrides
WHERE vendor_id = $1
ORDER BY set_at DESC
LIMIT 1;
```
Parse `override_reason` to extract the cited reason → call this the **noted driver**.

**View C — stated priority (from project-profiles.md):**
- Read `/home/user/accent-os/skills/repo-scout/references/project-profiles.md`
- Find the "Accent Lighting" section's "Known capability gaps" + any priority articulations from priority-articulation outputs
- Map the vendor's mathematical #1 metric back to which stated priority it serves → call this the **priority driver**.

If any view is empty (no overrides exist, no priority maps), record `(empty)` and continue — do not abort.

**Pre-check (View A):** if `vendor_scores` is empty for all 5 sampled vendors — i.e. no scoring has run yet — abort and output: "No vendor scores computed yet. Run vendor-cascade or the AccentOS scoring engine first, then re-run vendor-clarity-test." Redirect, not failure.

**Pre-check (View C):** if View C (priority mapping) is empty for **all 5 vendors** — i.e. project-profiles.md has no articulated priorities at all — abort and output: "No priorities articulated yet. Run priority-articulation first, then re-run vendor-clarity-test." Redirect, not failure.

**Schema check:** if `vendor_overrides.override_reason` (or any field referenced in View B) is missing from `/home/user/accent-os/sql/M*.sql`, record View B as `(schema-gap)` and continue. Note the missing column in the output Block 4.

---

## Step 3 — Compare and verdict

For each vendor, build the row:

| Vendor | Math #1 | Notes #1 | Priority #1 | Verdict |
|---|---|---|---|---|
| V123 — Acme Lighting | M3 — gross margin (w=0.40) | "low margin trend" | P1 — Q4 margin | ✓ agree |
| V456 — Bright Co | M7 — promo freq (w=0.10) | (empty) | P1 — Q4 margin | ⚠ math says promo, priority says margin — drift |
| V789 — Lumen | M2 — image coverage (w=0.25) | "GMC fixes pending" | P2 — GMC compliance | ✓ agree |

Verdicts:
- **✓ agree** — all three views point to the same driver class
- **⚠ partial** — math + priority agree but notes differ (or empty)
- **✗ drift** — math vs. priority disagree (the bad case)

---

## Step 4 — Output

```
═══ BLOCK 1: 5-VENDOR CLARITY TABLE ═══
[full Step 3 table]

═══ BLOCK 2: SUMMARY ═══
PASS: [count of ✓ rows] / 5
PARTIAL: [count of ⚠] / 5
DRIFT: [count of ✗] / 5

Overall verdict:
  - 5/5 ✓ → CLEAN
  - 4/5 ✓ → ACCEPTABLE (1 partial is normal — empty notes are common)
  - ≤3/5 ✓ OR any ✗ → INVESTIGATE — likely scoring weights need re-articulation

═══ BLOCK 3: NEXT-STEP RECOMMENDATIONS ═══
For each ⚠ or ✗ row:
  - Suggested next skill to run (priority-articulation if math/priority drift,
    vendor-cascade for full trace, or write-an-override for missing notes)
```

---

## Anti-patterns

- **Never** test fewer than 5 vendors when sampling randomly — small samples don't surface patterns.
- **Never** treat "(empty) notes" as drift. Empty notes are normal, not a failure.
- **Never** auto-fix scoring weights from this skill. The job is detection, not remediation.
- **Never** sample the same 5 vendors twice in a row when running periodically — random-seed each invocation so coverage rotates.
- **Never** conflate priority drift with override-staleness. They're different problems with different fixes.
