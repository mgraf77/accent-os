-- M45 — BigCommerce Integration Schema
-- Creates read-only catalog cache tables + sync log + opportunity flags.
-- Safe to run multiple times (idempotent).
-- Requires: M01 (RLS), M02 (core schema) already applied.
--
-- Tables created:
--   bc_products_cache     — snapshot of BC product catalog
--   bc_categories_cache   — BC category tree flat rows
--   bc_brands_cache       — BC brand index
--   bc_sync_log           — integration event log (health pings, syncs, errors)
--
-- Run via Supabase SQL Editor.
-- Then paste to Claude: "M45 done — BC schema created."

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS CACHE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bc_products_cache (
  id                      uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  bc_product_id           bigint        NOT NULL UNIQUE,
  sku                     text,
  name                    text          NOT NULL DEFAULT '',
  description_html        text,
  price                   numeric(12,2),
  cost_price              numeric(12,2),
  retail_price            numeric(12,2),
  sale_price              numeric(12,2),
  inventory_level         integer,
  inventory_warning_level integer,
  inventory_tracking      text          DEFAULT 'none',  -- 'none','product','variant'
  categories              integer[]     DEFAULT '{}',
  brand_id                bigint,
  is_visible              boolean       DEFAULT true,
  is_featured             boolean       DEFAULT false,
  availability            text,         -- 'available','disabled','preorder'
  total_sold              integer       DEFAULT 0,
  view_count              integer       DEFAULT 0,
  search_keywords         text,
  image_count             integer       DEFAULT 0,
  thumbnail_url           text,
  custom_fields           jsonb         DEFAULT '[]',
  bc_date_modified        timestamptz,
  synced_at               timestamptz   NOT NULL DEFAULT now(),
  created_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bc_products_cache_sku       ON bc_products_cache(sku);
CREATE INDEX IF NOT EXISTS idx_bc_products_cache_brand     ON bc_products_cache(brand_id);
CREATE INDEX IF NOT EXISTS idx_bc_products_cache_synced_at ON bc_products_cache(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_bc_products_cache_visible   ON bc_products_cache(is_visible);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CATEGORIES CACHE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bc_categories_cache (
  id               uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  bc_category_id   integer      NOT NULL UNIQUE,
  parent_id        integer,
  name             text         NOT NULL DEFAULT '',
  description      text,
  is_visible       boolean      DEFAULT true,
  sort_order       integer      DEFAULT 0,
  synced_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bc_categories_parent ON bc_categories_cache(parent_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BRANDS CACHE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bc_brands_cache (
  id              uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  bc_brand_id     integer      NOT NULL UNIQUE,
  name            text         NOT NULL DEFAULT '',
  image_url       text,
  search_keywords text,
  synced_at       timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SYNC LOG
-- Append-only event log. Rows are written by bigcommerce_adapter.js on every
-- health ping, sync run, or API error. Used for freshness + observability UI.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bc_sync_log (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  event        text         NOT NULL,   -- 'sync_products','health_ping','auth_error', etc.
  store_hash   text         NOT NULL DEFAULT 'store-cwqiwcjxes',
  payload      jsonb        DEFAULT '{}',
  occurred_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bc_sync_log_occurred_at ON bc_sync_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_bc_sync_log_event       ON bc_sync_log(event);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES
-- Read: all authenticated users.
-- Write: Owner + Admin only (for cache refreshes).
-- bc_sync_log: read all authenticated; insert all authenticated (adapter writes from browser).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bc_products_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bc_categories_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE bc_brands_cache    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bc_sync_log        ENABLE ROW LEVEL SECURITY;

-- Products cache
DROP POLICY IF EXISTS "bc_products_cache_read"   ON bc_products_cache;
DROP POLICY IF EXISTS "bc_products_cache_write"  ON bc_products_cache;

CREATE POLICY "bc_products_cache_read" ON bc_products_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bc_products_cache_write" ON bc_products_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  );

-- Categories cache
DROP POLICY IF EXISTS "bc_categories_cache_read"  ON bc_categories_cache;
DROP POLICY IF EXISTS "bc_categories_cache_write" ON bc_categories_cache;

CREATE POLICY "bc_categories_cache_read" ON bc_categories_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bc_categories_cache_write" ON bc_categories_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  );

-- Brands cache
DROP POLICY IF EXISTS "bc_brands_cache_read"  ON bc_brands_cache;
DROP POLICY IF EXISTS "bc_brands_cache_write" ON bc_brands_cache;

CREATE POLICY "bc_brands_cache_read" ON bc_brands_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bc_brands_cache_write" ON bc_brands_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
  );

-- Sync log: all authenticated can read + insert (adapter writes from browser session)
DROP POLICY IF EXISTS "bc_sync_log_read"   ON bc_sync_log;
DROP POLICY IF EXISTS "bc_sync_log_insert" ON bc_sync_log;

CREATE POLICY "bc_sync_log_read" ON bc_sync_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bc_sync_log_insert" ON bc_sync_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- After running, tell Claude: "M45 done — BC schema created."
-- ─────────────────────────────────────────────────────────────────────────────
