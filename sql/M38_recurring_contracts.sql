-- M38 — recurring_contracts table (national accounts ARR/MRR + renewal lifecycle)
-- Unblocks 6 KPIs: S-NA1 (NRR), S-NA2 (GRR), S-NA3 (expansion attach),
--                  C-NA1, C-NA2 (account health), C-NA3 (multi-location coverage)

BEGIN;

CREATE TABLE IF NOT EXISTS recurring_contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id),

  -- Contract identity
  contract_number text UNIQUE,
  parent_contract_id uuid REFERENCES recurring_contracts(id),  -- for renewals/expansions

  -- Financial
  arr_value       numeric(12,2) NOT NULL,                     -- annualized recurring value
  contract_value  numeric(12,2) NOT NULL,                     -- total committed
  expansion_arr   numeric(12,2) DEFAULT 0,                    -- upsell post-signature
  contraction_arr numeric(12,2) DEFAULT 0,                    -- downsell

  -- Dates
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  renewal_window_start date,                                  -- when to start renewal motion
  signed_at       timestamptz DEFAULT now(),

  -- Status
  status          text CHECK (status IN
                    ('prospect','active','renewing','renewed',
                     'expansion-pending','churned','cancelled'))
                    DEFAULT 'active',
  churn_reason    text,
  churned_at      timestamptz,

  -- Health
  account_health_score numeric(4,1),                          -- 0-100; computed
  health_components jsonb DEFAULT '{}'::jsonb,                -- {usage:80, payment:100, engagement:65}

  -- Multi-location
  contracted_locations int,                                   -- # locations contractually
  active_locations int,                                       -- # currently transacting

  -- Owner
  account_manager_id uuid REFERENCES employees(id),

  metadata        jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_rc_customer_id ON recurring_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_rc_status ON recurring_contracts(status);
CREATE INDEX IF NOT EXISTS idx_rc_renewal_window ON recurring_contracts(renewal_window_start)
  WHERE status IN ('active','renewing');
CREATE INDEX IF NOT EXISTS idx_rc_account_manager ON recurring_contracts(account_manager_id);

-- Quarterly NRR view (materialized for dashboard speed)
CREATE OR REPLACE VIEW v_quarterly_nrr AS
SELECT
  date_trunc('quarter', start_date) AS quarter_start,
  SUM(arr_value) AS starting_arr,
  SUM(expansion_arr) AS expansion,
  SUM(contraction_arr) AS contraction,
  SUM(CASE WHEN status='churned' THEN arr_value ELSE 0 END) AS churn,
  ROUND(
    100.0 * (SUM(arr_value) + SUM(expansion_arr) - SUM(contraction_arr)
             - SUM(CASE WHEN status='churned' THEN arr_value ELSE 0 END))
    / NULLIF(SUM(arr_value), 0),
    2
  ) AS nrr_pct
FROM recurring_contracts
GROUP BY date_trunc('quarter', start_date);

COMMIT;

-- Verify:
--   SELECT * FROM v_quarterly_nrr;
--   SELECT COUNT(*) FROM recurring_contracts WHERE status='active';
