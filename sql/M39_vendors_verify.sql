-- M39 — vendors table verification + safe creation
-- Unblocks 14+ KPIs (transitively, via vendor-cascade and vendor-risk-register).
--
-- Audit found vendors table is referenced by vendor_scores/vendor_overrides
-- (M02) but no CREATE TABLE for vendors exists in M*.sql. Two possibilities:
--   1. vendors exists from pre-M01 schema (RLS tightening implies it existed)
--   2. vendors was missed in the M-task series
--
-- This file is IDEMPOTENT — safe to run regardless. CREATE TABLE IF NOT
-- EXISTS will be a no-op if the table already exists. ALTER TABLE
-- ADD COLUMN IF NOT EXISTS extends without disturbing existing data.

BEGIN;

CREATE TABLE IF NOT EXISTS vendors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  brand           text,
  brand_category  text,             -- lighting / hardware / blinds / fans / outdoor / smart-home / etc.
  region          text CHECK (region IN ('NE','SE','MW','SW','W','National')),
  hq_city         text,
  hq_state        text,
  primary_contact_email text,
  rep_group_id    uuid,             -- FK added below if rep_groups exists

  -- Commercial terms
  payment_terms   text CHECK (payment_terms IN ('Net30','Net60','Net90','COD','Wire','Other')),
  lead_time_days  int,
  moq_dollars     numeric(10,2),
  return_policy_days int,
  w9_on_file      boolean DEFAULT false,

  -- Classification
  revenue_tier    text CHECK (revenue_tier IN ('top','mid','long-tail')),
  diversity_flag  text,             -- e.g. 'MBE','WBE','VBE','none'

  -- Lifecycle
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  metadata        jsonb DEFAULT '{}'::jsonb
);

-- Add columns if vendors table existed but is missing fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS brand_category text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lead_time_days int;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS moq_dollars numeric(10,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS return_policy_days int;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS w9_on_file boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS revenue_tier text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS diversity_flag text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rep_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_vendors_brand_category ON vendors(brand_category);
CREATE INDEX IF NOT EXISTS idx_vendors_rep_group_id ON vendors(rep_group_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(active);
CREATE INDEX IF NOT EXISTS idx_vendors_diversity_flag ON vendors(diversity_flag)
  WHERE diversity_flag IS NOT NULL AND diversity_flag != 'none';

-- Optional FK to rep_groups (if that table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rep_groups')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_name = 'fk_vendors_rep_group_id'
     )
  THEN
    ALTER TABLE vendors
      ADD CONSTRAINT fk_vendors_rep_group_id
      FOREIGN KEY (rep_group_id) REFERENCES rep_groups(id);
  END IF;
END$$;

COMMIT;

-- Verify:
--   SELECT COUNT(*) FROM vendors;
--   SELECT brand_category, COUNT(*) FROM vendors GROUP BY brand_category;
--   SELECT diversity_flag, COUNT(*) FROM vendors GROUP BY diversity_flag;
