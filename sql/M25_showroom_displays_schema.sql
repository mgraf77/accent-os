-- ────────────────────────────────────────────────────────────
-- M25 — Showroom Display Management Schema (Track 5.8)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Tracks vendor display programs in the showroom: which vendor's product
-- is on display where, when it was installed, when the program ends, what
-- the participation cost was, what we get back (co-op, free product, etc.).
-- Idempotent. Same RLS pattern as M02 (authed read + write).

CREATE TABLE IF NOT EXISTS showroom_displays (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       TEXT,
  vendor_name     TEXT,
  display_name    TEXT NOT NULL,                                 -- "Hinkley Modern Lighting Wall", "Quoizel Chandelier Bay", etc.
  location        TEXT,                                          -- showroom area or zone
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned','installed','active','expiring','expired','removed')),
  install_date    DATE,
  expires_date    DATE,                                          -- when the display program agreement ends
  removed_date    DATE,
  participation_cost  NUMERIC(12,2),                             -- what we paid (or had taken from co-op) to host the display
  coop_value      NUMERIC(12,2),                                 -- vendor-funded portion
  retail_value    NUMERIC(12,2),                                 -- list price of the products on display
  sku_list        TEXT[],                                        -- SKUs on display
  contract_terms  TEXT,                                          -- summary of obligations / minimums
  notes           TEXT,
  photos          JSONB,                                         -- array of {url, caption} for future use
  related_coop_id UUID REFERENCES coop_tracker(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_showroom_displays_vendor   ON showroom_displays(vendor_id);
CREATE INDEX IF NOT EXISTS idx_showroom_displays_status   ON showroom_displays(status);
CREATE INDEX IF NOT EXISTS idx_showroom_displays_expires  ON showroom_displays(expires_date) WHERE status NOT IN ('expired','removed');

ALTER TABLE showroom_displays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authed read"   ON showroom_displays;
DROP POLICY IF EXISTS "authed writes" ON showroom_displays;
CREATE POLICY "authed read"   ON showroom_displays FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed writes" ON showroom_displays FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─── Verify ─────────────────────────────────────────────────
SELECT relname, relrowsecurity AS rls_enabled FROM pg_class WHERE relname = 'showroom_displays';
