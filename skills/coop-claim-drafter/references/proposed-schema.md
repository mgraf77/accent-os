# Proposed schema additions — vendor_overrides (co-op rules)

> Three columns to add to `vendor_overrides` on Supabase `hsyjcrrazrzqngwkqsqa`. Until applied, `coop-claim-drafter` runs in partial-stub mode (deadline-only scan of `coop_tracker`).

## Why these columns live on `vendor_overrides`, not a new table

`coop_tracker` is the per-claim ledger (one row per claim window). `vendor_overrides` is the per-vendor metadata layer. Co-op *rules* are vendor-level — eligibility %, deadline cadence, and required documentation rarely change per claim. Putting them on `vendor_overrides` keeps the rules close to the existing `notes` column (which already holds claim quirks like "email PDF only") and avoids a new join.

If Michael decides he wants per-program rules (some vendors have multiple co-op programs — e.g., quarterly + annual), the right move is a `vendor_coop_programs` table later. For now, one rule-set per vendor covers ≥95% of Accent Lighting's vendor base.

## SQL — paste into supabase-sql-magic or apply_migration

```sql
-- Add three columns to vendor_overrides for vendor-level co-op rules.
-- Idempotent via IF NOT EXISTS.

ALTER TABLE vendor_overrides
  ADD COLUMN IF NOT EXISTS coop_eligibility_pct numeric(5,2)
    CHECK (coop_eligibility_pct IS NULL OR (coop_eligibility_pct >= 0 AND coop_eligibility_pct <= 100));

ALTER TABLE vendor_overrides
  ADD COLUMN IF NOT EXISTS coop_deadline_pattern text;

ALTER TABLE vendor_overrides
  ADD COLUMN IF NOT EXISTS coop_documentation_required jsonb;

COMMENT ON COLUMN vendor_overrides.coop_eligibility_pct IS
  'Percent of qualifying vendor purchases that accrue as co-op fund. e.g., 2.00 = 2%.';

COMMENT ON COLUMN vendor_overrides.coop_deadline_pattern IS
  'Grammar string for deadline derivation. See coop-claim-drafter/references/deadline-pattern-grammar.md.';

COMMENT ON COLUMN vendor_overrides.coop_documentation_required IS
  'JSON array of required claim documentation items. e.g., ["claim form", "ad placement screenshots", "invoice copies", "proof of publication"].';

-- Optional: index for the active-vendor scan in Step 1.
CREATE INDEX IF NOT EXISTS idx_vendor_overrides_coop_active
  ON vendor_overrides (vendor_id)
  WHERE coop_eligibility_pct IS NOT NULL AND coop_deadline_pattern IS NOT NULL;
```

## Backfill priority order

Apply once, then backfill the top 20 vendors by FY purchase volume — Michael typically knows these by memory or pulls from vendor binders. Suggested batch order:

1. Top-5 vendors by FY 2025 spend — these carry ~60% of co-op potential.
2. Next 15 by FY 2025 spend.
3. Long tail — opportunistic; backfill when claim drafts surface a missed vendor.

## Example values (illustrative — confirm with each vendor before saving)

| vendor | coop_eligibility_pct | coop_deadline_pattern | coop_documentation_required |
|---|---|---|---|
| Kichler | 2.00 | `quarterly:end-of-quarter+30d` | `["claim form", "ad screenshots", "invoices"]` |
| Hubbardton Forge | 3.00 | `annual:dec-31+60d` | `["claim form", "ad screenshots", "invoices", "proof-of-publication"]` |
| Visual Comfort | 2.50 | `semiannual:jun-30+45d,dec-31+45d` | `["claim form", "ad screenshots", "invoices"]` |

## Verification query

After applying:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vendor_overrides'
  AND column_name IN ('coop_eligibility_pct', 'coop_deadline_pattern', 'coop_documentation_required')
ORDER BY column_name;
```

Expect 3 rows. If 3, `coop-claim-drafter` Step 0 will route to active-mode on next invocation.
