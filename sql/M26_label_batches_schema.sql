-- ────────────────────────────────────────────────────────────
-- M26 — Label Batches Schema (Track 5.9 QR/Barcode Labeling)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Stores reusable label-print batches. Optional — Track 5.9 works in-memory
-- without persistence; this table just lets users save and recall named
-- batches across sessions. Idempotent. Same RLS pattern as M02.

CREATE TABLE IF NOT EXISTS label_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  mode          TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual','inventory')),
  items         JSONB NOT NULL,                                  -- array of {value, caption}
  size          TEXT DEFAULT 'medium' CHECK (size IN ('small','medium','large')),
  cols          INT DEFAULT 4,
  show_text     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_label_batches_created ON label_batches(created_at DESC);

ALTER TABLE label_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authed read"   ON label_batches;
DROP POLICY IF EXISTS "authed writes" ON label_batches;
CREATE POLICY "authed read"   ON label_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed writes" ON label_batches FOR ALL    TO authenticated USING (true) WITH CHECK (true);

SELECT relname, relrowsecurity AS rls_enabled FROM pg_class WHERE relname = 'label_batches';
