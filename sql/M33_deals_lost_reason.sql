-- M33 — pipeline_deals.lost_reason enum
-- Unblocks 1 KPI: L7 (loss-reason distribution)
-- Pairs with M32 stage history for full pipeline analytics.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_lost_reason') THEN
    CREATE TYPE deal_lost_reason AS ENUM (
      'price',          -- lost on price/budget
      'timing',         -- not the right time
      'feature-gap',    -- product didn't have what they needed
      'competitor',     -- went with a competitor
      'no-response',    -- lead went cold
      'budget',         -- approval/funding fell through
      'wrong-fit',      -- not actually a qualified opportunity
      'project-cancelled', -- buyer cancelled the underlying project
      'spec-changed',   -- spec changed; we no longer fit
      'other'
    );
  END IF;
END$$;

ALTER TABLE pipeline_deals
  ADD COLUMN IF NOT EXISTS lost_reason deal_lost_reason;

CREATE INDEX IF NOT EXISTS idx_pdeals_lost_reason ON pipeline_deals(lost_reason)
  WHERE lost_reason IS NOT NULL;

COMMIT;
