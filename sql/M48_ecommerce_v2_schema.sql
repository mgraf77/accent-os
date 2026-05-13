-- M46 — Ecommerce Intelligence V2 Schema Extensions
-- Extends M45 bc_products_cache with SEO + GMC fields.
-- Adds platform_sync_status table for multi-platform health tracking.
-- Safe to run multiple times (idempotent via IF NOT EXISTS / IF EXISTS guards).
--
-- Run AFTER M45 has been applied.
-- Then tell Claude: "M46 done — ecommerce V2 schema applied."

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND bc_products_cache — SEO + GMC fields
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bc_products_cache
  ADD COLUMN IF NOT EXISTS page_title           text,
  ADD COLUMN IF NOT EXISTS meta_description     text,
  ADD COLUMN IF NOT EXISTS meta_keywords        text,
  ADD COLUMN IF NOT EXISTS condition            text,       -- 'New','Used','Refurbished'
  ADD COLUMN IF NOT EXISTS has_related_products boolean     DEFAULT false;

-- Index for SEO gap queries
CREATE INDEX IF NOT EXISTS idx_bc_products_meta_desc
  ON bc_products_cache((meta_description IS NULL));

CREATE INDEX IF NOT EXISTS idx_bc_products_page_title
  ON bc_products_cache((page_title IS NULL));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PLATFORM SYNC STATUS
-- One row per platform per store. Tracks connection state, last successful
-- sync, and any last error. Used by the Integrations tab in the UI.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_sync_status (
  id              uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  platform        text         NOT NULL,       -- 'bigcommerce','ga4','gsc','klaviyo','gmc'
  store_hash      text         NOT NULL DEFAULT 'store-cwqiwcjxes',
  is_configured   boolean      NOT NULL DEFAULT false,
  last_ping_ok    boolean,
  last_ping_at    timestamptz,
  last_sync_at    timestamptz,
  last_error      text,
  metadata        jsonb        DEFAULT '{}',   -- e.g. {latency_ms, product_count}
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (platform, store_hash)
);

CREATE INDEX IF NOT EXISTS idx_platform_sync_status_platform
  ON platform_sync_status(platform);

-- RLS
ALTER TABLE platform_sync_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_sync_status_read"   ON platform_sync_status;
DROP POLICY IF EXISTS "platform_sync_status_write"  ON platform_sync_status;

CREATE POLICY "platform_sync_status_read" ON platform_sync_status
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "platform_sync_status_write" ON platform_sync_status
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  );

-- Seed the 5 platform rows (upsert-safe)
INSERT INTO platform_sync_status (platform, store_hash, is_configured, metadata)
VALUES
  ('bigcommerce', 'store-cwqiwcjxes', false, '{"unlocks":"M04","label":"BigCommerce"}'),
  ('gmc',         'store-cwqiwcjxes', false, '{"unlocks":"M05","label":"Google Merchant Center","merchant_id":"687520574"}'),
  ('ga4',         'store-cwqiwcjxes', false, '{"unlocks":"M06","label":"Google Analytics 4"}'),
  ('gsc',         'store-cwqiwcjxes', false, '{"unlocks":"M06","label":"Search Console","default_site":"https://accentlightinginc.com/"}'),
  ('klaviyo',     'store-cwqiwcjxes', false, '{"unlocks":"M09","label":"Klaviyo"}')
ON CONFLICT (platform, store_hash) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USEFUL VIEWS (no RLS needed — underlying tables have RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Products missing SEO meta description (high-value fix list)
CREATE OR REPLACE VIEW bc_products_missing_meta AS
  SELECT bc_product_id, sku, name, price, total_sold, view_count, synced_at
  FROM   bc_products_cache
  WHERE  (meta_description IS NULL OR length(meta_description) < 70)
    AND  is_visible = true
  ORDER  BY (view_count + total_sold * 5) DESC;

-- Products missing images
CREATE OR REPLACE VIEW bc_products_missing_images AS
  SELECT bc_product_id, sku, name, price, brand_id, total_sold, synced_at
  FROM   bc_products_cache
  WHERE  image_count = 0
    AND  is_visible = true
  ORDER  BY total_sold DESC;

-- High-traffic / no-sales products (conversion blockers)
CREATE OR REPLACE VIEW bc_products_conversion_blockers AS
  SELECT bc_product_id, sku, name, price, view_count, total_sold,
         CASE WHEN view_count > 0 THEN ROUND(total_sold::numeric / view_count * 100, 2) ELSE 0 END AS conv_pct
  FROM   bc_products_cache
  WHERE  view_count > 50
    AND  is_visible = true
  ORDER  BY view_count DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- After running, tell Claude: "M46 done — ecommerce V2 schema applied."
-- ─────────────────────────────────────────────────────────────────────────────
