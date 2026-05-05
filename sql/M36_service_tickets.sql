-- M36 — service_tickets table (customer service / support lifecycle)
-- Unblocks 5 KPIs: X1 (FCR), X2 (FRT), X3 (AHT), X11 (complaint rate),
--                  X12 (escalation rate)
-- Pairs with M37 (survey_responses) for X4 CSAT and X5 NPS.

BEGIN;

CREATE TABLE IF NOT EXISTS service_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid REFERENCES customers(id),
  deal_id         uuid REFERENCES pipeline_deals(id),
  channel         text CHECK (channel IN ('phone','email','chat','walk-in','portal'))
                    NOT NULL,
  subject         text NOT NULL,
  category        text,                          -- product-issue, install, billing, etc.

  -- Lifecycle
  created_at      timestamptz DEFAULT now(),
  first_response_at timestamptz,
  resolved_at     timestamptz,
  closed_at       timestamptz,

  -- Resolution
  status          text CHECK (status IN ('open','in_progress','waiting','resolved','closed','escalated'))
                    DEFAULT 'open',
  first_contact_resolved boolean DEFAULT false,    -- FCR flag
  escalated       boolean DEFAULT false,
  escalated_to    uuid REFERENCES employees(id),
  resolution_notes text,

  -- Ownership
  assigned_to     uuid REFERENCES employees(id),

  metadata        jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_st_customer_id ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_st_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_st_created_at ON service_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_st_assigned_to ON service_tickets(assigned_to);

COMMIT;

-- Verify:
--   SELECT status, COUNT(*) FROM service_tickets GROUP BY status;
--   SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/60)
--     AS avg_first_response_minutes FROM service_tickets WHERE first_response_at IS NOT NULL;
