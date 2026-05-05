-- M31 — products source-of-truth decision + cost column
-- Unblocks 8+ KPIs: F3 (gross margin %), F4, F5, P4, P5, P10, H2, S-OS12
-- BLOCKED on: M04 (BigCommerce API credentials)
--
-- DECISION REQUIRED before running this file:
--   Path A (simpler): products live ONLY in BigCommerce. Use BC API as
--     source-of-truth. AccentOS computes margins by joining pipeline_deals
--     to BC product data via SKU lookup at query time (or nightly cache).
--     → Run only the optional `products_bc_cache` block below.
--
--   Path B (more flexible): mirror products into Supabase. Allows offline
--     queries, vendor-cascade integration, faster joins.
--     → Run the full `products` table create + sync via Edge Function.
--
-- Recommendation: Path B once M04 lands. Default to A in the interim.

BEGIN;

-- PATH B — products mirror table (uncomment when ready)
-- CREATE TABLE IF NOT EXISTS products (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   bc_sku text UNIQUE NOT NULL,
--   bc_product_id text,
--   name text NOT NULL,
--   brand text,
--   vendor_id uuid REFERENCES vendors(id),
--   category text,
--   subcategory text,
--   cost numeric(10,2),                -- ← this is the critical column for margins
--   list_price numeric(10,2),
--   active boolean DEFAULT true,
--   launched_at timestamptz,
--   last_synced_at timestamptz DEFAULT now(),
--   metadata jsonb DEFAULT '{}'::jsonb
-- );
-- CREATE INDEX IF NOT EXISTS idx_products_bc_sku ON products(bc_sku);
-- CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Sync trigger (BC → Supabase) lands as a Supabase Edge Function
-- after M04 credentials are provisioned. See js/sync_bc_products.js (TBD).

COMMIT;

-- Verify (once Path B is run):
--   SELECT COUNT(*) FROM products;
--   SELECT category, COUNT(*) FROM products GROUP BY category;
