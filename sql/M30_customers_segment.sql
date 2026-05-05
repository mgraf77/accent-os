-- M30 — customers.segment enum + index
-- Unblocks 22 KPIs across all customer-segment dashboards
-- (C1, C2, C3, C-W1, C-W3, C-EL1, C-EL2, C-NB*, S-FL5, S-FL8, S-TA2, L8, etc.)
-- Surfaced by kpi-data-audit 2026-05-05 as #1 highest-leverage schema add.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_segment') THEN
    CREATE TYPE customer_segment AS ENUM (
      'walk-in',        -- showroom retail
      'electrician',    -- B2B trade contractor
      'national',       -- multi-location national account
      'designer',       -- interior designer / specifier
      'new-home',       -- new home build (production + custom)
      'hospitality',    -- hotel / commercial-hospitality
      'multifamily',    -- apartment / property mgmt
      'commercial',     -- office / retail-commercial
      'DIY',            -- online consumer
      'other'           -- catch-all; backfill later
    );
  END IF;
END$$;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS segment customer_segment DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);

-- Backfill plan (post-deployment):
--   1. BC customer-group → segment heuristic (run as one-time UPDATE)
--   2. Manual classification for top 100 customers by revenue
--   3. Default 'other' for the long tail; revisit quarterly

COMMIT;

-- Verify:
--   SELECT segment, COUNT(*) FROM customers GROUP BY segment;
