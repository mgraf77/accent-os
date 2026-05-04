-- ────────────────────────────────────────────────────────────
-- M29 — Marketing Hub Schema (Track 5.12)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Two tables:
--   marketing_campaigns — campaigns, promotions, events all share one table
--                         distinguished by `type` field
--   marketing_assets    — content library: images, docs, videos, links
-- Idempotent. Same RLS pattern as M02 (authed read + write).

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('email','print','digital','social','event','promo','co_op','other')),
  status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','complete','cancelled','paused')),
  start_date      DATE,
  end_date        DATE,
  budget          NUMERIC(12,2),
  spent           NUMERIC(12,2),
  channels        TEXT[],
  audience        TEXT,
  related_vendor_id TEXT,
  related_vendor_name TEXT,
  -- promotions specifics:
  discount_pct    NUMERIC(5,2),
  discount_amount NUMERIC(12,2),
  promo_skus      TEXT[],
  -- attribution metrics:
  leads_generated INT,
  deals_won       INT,
  revenue_attributed NUMERIC(12,2),
  -- meta:
  notes           TEXT,
  owner_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type   ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates  ON marketing_campaigns(start_date, end_date);

CREATE TABLE IF NOT EXISTS marketing_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('image','document','video','link','template','other')),
  url             TEXT,
  description     TEXT,
  tags            TEXT[],
  related_vendor_id TEXT,
  related_vendor_name TEXT,
  related_campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  file_size_kb    INT,
  thumbnail_url   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_type     ON marketing_assets(type);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_vendor   ON marketing_assets(related_vendor_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_updated  ON marketing_assets(updated_at DESC);

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['marketing_campaigns','marketing_assets'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed read"   ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed writes" ON %I', t);
    EXECUTE format('CREATE POLICY "authed read"   ON %I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "authed writes" ON %I FOR ALL    TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

SELECT relname, relrowsecurity AS rls_enabled FROM pg_class WHERE relname IN ('marketing_campaigns','marketing_assets') ORDER BY relname;
