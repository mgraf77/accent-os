-- ────────────────────────────────────────────────────────────
-- M28 — Competitive Pricing Schema (Track 5.14)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Tracks competitor prices for our SKUs over time. Each row = one observation
-- (a snapshot of one competitor's price for one SKU on one date). Multiple
-- snapshots per SKU build a time series that can be charted later.
-- Idempotent. Same RLS pattern as M02.

CREATE TABLE IF NOT EXISTS competitor_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             TEXT NOT NULL,
  vendor_id       TEXT,
  vendor_name     TEXT,
  description     TEXT,                                          -- denormalized snapshot of product desc at time of observation
  competitor_name TEXT NOT NULL,
  competitor_url  TEXT,
  price           NUMERIC(12,2) NOT NULL,
  our_price       NUMERIC(12,2),                                 -- what we listed when this snapshot was taken
  in_stock        BOOLEAN,
  shipping_note   TEXT,                                          -- "free over $99", "$9 flat", etc.
  observed_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  observed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_sku        ON competitor_prices(sku, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_competitor ON competitor_prices(competitor_name);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_recent     ON competitor_prices(observed_at DESC);

ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authed read"   ON competitor_prices;
DROP POLICY IF EXISTS "authed writes" ON competitor_prices;
CREATE POLICY "authed read"   ON competitor_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed writes" ON competitor_prices FOR ALL    TO authenticated USING (true) WITH CHECK (true);

SELECT relname, relrowsecurity AS rls_enabled FROM pg_class WHERE relname = 'competitor_prices';
