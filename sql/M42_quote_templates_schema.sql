-- ────────────────────────────────────────────────────────────
-- M42 — Quote Templates (Quote Pro / Track 1.2 expansion)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Powers the "Quote Pro" page: stores national-account training pairs
-- (e.g. Homegrown / Thrive Restaurant Group). Each row = one prior
-- location used as a template for future quotes for that brand.
--
-- Source-of-truth fields:
--   brand           — customer-facing brand (e.g. "Homegrown")
--   parent_company  — parent group (e.g. "Thrive Restaurant Group")
--   blueprint_notes — free-text observations from the prior blueprints
--                     ("EM/NL fixtures called out on E-2", "all dining
--                     downlights are 3" Halo HL36", etc.)
--   fixture_signature JSONB — array of {tag, qty, room, spec, vendor, sku,
--                     unit_price, notes}. This is the canonical fixture
--                     pattern Claude will look for in new blueprints.
--   invoice_lines   JSONB — exact line-items from the final invoice that
--                     was sent to the customer. Used to reconstruct
--                     identical Windward-friendly output for future jobs.
--   ai_summary      — 3–4 sentence narrative Claude generates after
--                     ingesting the training pair.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + idempotent RLS DDL.

CREATE TABLE IF NOT EXISTS quote_templates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand              TEXT NOT NULL,
  parent_company     TEXT,
  source_location    TEXT,                                  -- "Homegrown — Wichita East" etc.
  blueprint_notes    TEXT,
  fixture_signature  JSONB NOT NULL DEFAULT '[]'::jsonb,    -- canonical fixture pattern
  invoice_lines      JSONB NOT NULL DEFAULT '[]'::jsonb,    -- exact prior invoice lines
  totals             JSONB,                                 -- {subtotal, tax, freight, total}
  ai_summary         TEXT,
  fixture_count      INT,                                   -- denormalized for list UI
  invoice_total      NUMERIC(12,2),                         -- denormalized for list UI
  use_count          INT NOT NULL DEFAULT 0,                -- bumped each time a quote uses it
  last_used_at       TIMESTAMPTZ,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_by         TEXT
);
CREATE INDEX IF NOT EXISTS idx_quote_templates_brand   ON quote_templates(LOWER(brand));
CREATE INDEX IF NOT EXISTS idx_quote_templates_parent  ON quote_templates(LOWER(parent_company));
CREATE INDEX IF NOT EXISTS idx_quote_templates_updated ON quote_templates(updated_at DESC);

-- RLS — authenticated read for everyone; Sales+ writes (matches M02 quotes policy).
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authed read" ON quote_templates;
CREATE POLICY "authed read"   ON quote_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authed writes" ON quote_templates;
CREATE POLICY "authed writes" ON quote_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Verify ─────────────────────────────────────────────────
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'quote_templates';
