-- M34 — invoices + payments tables (Supabase-native)
-- Unblocks 4 KPIs: F8 (DSO), F12 (AR aging), C-EL3 (Net 30/60 compliance), V9
--
-- DECISION POINT before running:
--   Source-of-truth for AR data is one of:
--     A. Windward ERP (S5WebAPI read-only). Blocked on M03 + M10 + M11.
--        If Windward is the source, this file becomes a Supabase MIRROR
--        populated by a sync edge function — not source-of-truth.
--     B. Supabase-native. Run this file as-is; AccentOS becomes the
--        billing system of record.
--
-- Recommendation: Path A (Windward as source). Run this file after M03
-- approval to set up the mirror tables; sync is then unidirectional.

BEGIN;

CREATE TABLE IF NOT EXISTS invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid REFERENCES customers(id),
  deal_id         uuid REFERENCES pipeline_deals(id),
  windward_id     text UNIQUE,                 -- Windward primary key when synced
  invoice_number  text NOT NULL,
  issued_at       timestamptz DEFAULT now(),
  due_at          timestamptz,
  amount          numeric(12,2) NOT NULL,
  paid_amount     numeric(12,2) DEFAULT 0,
  status          text CHECK (status IN ('draft','issued','partial','paid','overdue','void'))
                    DEFAULT 'draft',
  terms           text,                        -- Net 30, Net 60, COD, etc.
  metadata        jsonb DEFAULT '{}'::jsonb,
  last_synced_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deal_id ON invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_at ON invoices(due_at);

CREATE TABLE IF NOT EXISTS payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid REFERENCES invoices(id),
  windward_id     text UNIQUE,
  paid_at         timestamptz DEFAULT now(),
  amount          numeric(12,2) NOT NULL,
  method          text,                         -- check, ACH, card, wire
  reference       text,
  metadata        jsonb DEFAULT '{}'::jsonb,
  last_synced_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

COMMIT;

-- Verify:
--   SELECT status, COUNT(*) FROM invoices GROUP BY status;
--   SELECT SUM(amount) FROM invoices WHERE status='overdue';
