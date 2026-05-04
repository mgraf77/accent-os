-- ────────────────────────────────────────────────────────────
-- M23 — Purchase Orders Schema (Track 5.4)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Adds purchase_orders + po_lines tables. Idempotent. Same RLS pattern
-- as M02 (authed read + write). PO lines optionally link to inventory
-- SKU rows; receipt flow may increment inventory_items.qty_on_hand.

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number       TEXT UNIQUE,
  vendor_id       TEXT,
  vendor_name     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','confirmed','partial','received','cancelled')),
  order_date      DATE DEFAULT CURRENT_DATE,
  expected_date   DATE,
  received_date   DATE,
  subtotal        NUMERIC(12,2) DEFAULT 0,
  tax             NUMERIC(12,2) DEFAULT 0,
  freight         NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  notes           TEXT,
  related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  related_job_id   UUID REFERENCES jobs(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status   ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor   ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected ON purchase_orders(expected_date) WHERE status NOT IN ('received','cancelled');

CREATE TABLE IF NOT EXISTS po_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id         UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_no       INT NOT NULL,
  sku           TEXT,
  description   TEXT,
  qty           NUMERIC(12,2) NOT NULL DEFAULT 1,
  qty_received  NUMERIC(12,2) DEFAULT 0,
  unit_cost     NUMERIC(12,2),
  ext_cost      NUMERIC(12,2),
  notes         TEXT,
  UNIQUE (po_id, line_no)
);
CREATE INDEX IF NOT EXISTS idx_po_lines_po  ON po_lines(po_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_sku ON po_lines(sku);

-- RLS
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['purchase_orders','po_lines'];
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
FROM pg_class WHERE relname IN ('purchase_orders','po_lines') ORDER BY relname;
