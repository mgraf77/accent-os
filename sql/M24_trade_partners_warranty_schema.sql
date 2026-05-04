-- ────────────────────────────────────────────────────────────
-- M24 — Trade Partner Network + Warranty Tracker Schema (Tracks 5.5 + 5.11)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Bundles two small CRUD tables that ship together:
--   trade_partners   — Track 5.5 external designers / contractors / builders
--   warranty_claims  — Track 5.11 claim ticketing across products/customers/vendors
-- Idempotent. Same RLS pattern as M02 (authed read + write).

CREATE TABLE IF NOT EXISTS trade_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('designer','contractor','architect','builder','installer','electrician','other')),
  company         TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  address         JSONB,
  trade_license   TEXT,
  preferred_terms TEXT,                                          -- discount %, payment terms, freight, etc.
  rating          NUMERIC(3,1),                                  -- 0-10 internal score
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','prospect')),
  tags            TEXT[],
  related_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  first_engaged   DATE,
  last_engaged    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_trade_partners_type   ON trade_partners(type);
CREATE INDEX IF NOT EXISTS idx_trade_partners_status ON trade_partners(status);
CREATE INDEX IF NOT EXISTS idx_trade_partners_email  ON trade_partners(LOWER(email));

CREATE TABLE IF NOT EXISTS warranty_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number    TEXT UNIQUE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  vendor_id       TEXT,                                          -- vendor.id from VD
  vendor_name     TEXT,
  sku             TEXT,
  description     TEXT NOT NULL,                                 -- failure description
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','sent_to_vendor','approved','denied','replaced','refunded','closed')),
  severity        TEXT CHECK (severity IN ('cosmetic','functional','safety')),
  reported_date   DATE DEFAULT CURRENT_DATE,
  purchase_date   DATE,
  warranty_expires DATE,
  resolution_date DATE,
  vendor_ticket   TEXT,                                          -- their RMA / ticket #
  cost_to_us      NUMERIC(12,2),                                 -- shipping, labor, replacement cost
  refund_amount   NUMERIC(12,2),
  notes           TEXT,
  related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  related_job_id   UUID REFERENCES jobs(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_warranty_status   ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_vendor   ON warranty_claims(vendor_id);
CREATE INDEX IF NOT EXISTS idx_warranty_customer ON warranty_claims(customer_id);

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['trade_partners','warranty_claims'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed read"   ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed writes" ON %I', t);
    EXECUTE format('CREATE POLICY "authed read"   ON %I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "authed writes" ON %I FOR ALL    TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ─── Verify ─────────────────────────────────────────────────
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class WHERE relname IN ('trade_partners','warranty_claims') ORDER BY relname;
