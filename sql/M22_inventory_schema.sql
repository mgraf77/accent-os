-- ────────────────────────────────────────────────────────────
-- M22 — Inventory Module Schema (Track 5.3 phase 1)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Adds `inventory_items` table for CSV-import phase of the inventory
-- module. When Windward S5WebAPI access lands (M03 + M10 + Track 6.11),
-- the same table accepts live syncs by setting import_source = 'windward'.
-- Idempotent. Same RLS pattern as M02 (authed read + write).

CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       TEXT,                                       -- Foreign-style link to VD vendor.id (text — not a true FK)
  vendor_name     TEXT,                                       -- Denormalized for display when vendor_id is unmapped
  sku             TEXT NOT NULL,
  upc             TEXT,
  description     TEXT,
  category        TEXT,
  qty_on_hand     NUMERIC(12,2) DEFAULT 0,
  qty_committed   NUMERIC(12,2) DEFAULT 0,
  qty_on_order    NUMERIC(12,2) DEFAULT 0,
  qty_available   NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(qty_on_hand,0) - COALESCE(qty_committed,0)) STORED,
  location        TEXT,                                       -- Warehouse / showroom / etc.
  bin             TEXT,
  unit_cost       NUMERIC(12,2),
  list_price      NUMERIC(12,2),
  reorder_point   NUMERIC(12,2),
  last_imported_at TIMESTAMPTZ DEFAULT NOW(),
  import_source   TEXT NOT NULL DEFAULT 'manual' CHECK (import_source IN ('manual','csv','windward','bigcommerce','other')),
  raw_extra       JSONB,                                       -- Vendor-specific columns we don't model
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_vendor_sku ON inventory_items(COALESCE(vendor_id,''), sku);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_low ON inventory_items(qty_available) WHERE qty_available < COALESCE(reorder_point,0);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authed read"   ON inventory_items;
DROP POLICY IF EXISTS "authed writes" ON inventory_items;
CREATE POLICY "authed read"   ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed writes" ON inventory_items FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─── Verify ─────────────────────────────────────────────────
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class WHERE relname = 'inventory_items';
