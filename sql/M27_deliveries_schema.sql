-- ────────────────────────────────────────────────────────────
-- M27 — Delivery Scheduling Schema (Track 5.10)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Tracks customer / job-site deliveries: scheduled date + time window, driver,
-- vehicle, items summary, status workflow. Optionally linked to a job or quote.
-- Idempotent. Same RLS pattern as M02 (authed read + write).

CREATE TABLE IF NOT EXISTS deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT UNIQUE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  address         JSONB,
  scheduled_date  DATE,
  time_window     TEXT,                                          -- "9-12", "AM", "1-3pm", etc.
  driver          TEXT,
  vehicle         TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','out_for_delivery','delivered','failed','rescheduled','cancelled')),
  items_summary   TEXT,
  weight_lbs      NUMERIC(8,2),
  signature_required BOOLEAN DEFAULT false,
  signature_name  TEXT,
  delivered_at    TIMESTAMPTZ,
  failure_reason  TEXT,
  notes           TEXT,
  related_job_id  UUID REFERENCES jobs(id) ON DELETE SET NULL,
  related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  related_po_id   UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deliveries_status   ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_date     ON deliveries(scheduled_date) WHERE status NOT IN ('delivered','cancelled');
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authed read"   ON deliveries;
DROP POLICY IF EXISTS "authed writes" ON deliveries;
CREATE POLICY "authed read"   ON deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed writes" ON deliveries FOR ALL    TO authenticated USING (true) WITH CHECK (true);

SELECT relname, relrowsecurity AS rls_enabled FROM pg_class WHERE relname = 'deliveries';
