-- M41 — Autonomous Governance Schema
-- Tables: approval_authorities, auto_action_rules, auto_action_log (audit)
-- Dependencies: M02 (users, audit_log)
-- Owner-only RLS. Run this when ready to activate autonomous workflows.

-- approval_authorities: define role-based approval thresholds
-- Example: (Sales, quote_approve, 5000) = Sales reps can approve quotes ≤$5K
-- Composite key: (role, action_type) is unique per threshold
CREATE TABLE IF NOT EXISTS approval_authorities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL, -- one of: Owner, Admin, Manager, Sales, Warehouse
  action_type TEXT NOT NULL, -- quote_approve, po_approve, deal_status_change, etc.
  threshold_usd NUMERIC DEFAULT NULL, -- NULL = no limit; numeric = amount limit in USD
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(role, action_type)
);
COMMENT ON TABLE approval_authorities IS 'Define per-role approval ceilings. E.g., "Sales can approve quotes under $5K without escalation."';

-- auto_action_rules: if-then workflows that execute automatically
-- Example: (status_change, deal.status=won, create_job) = when deal closes, auto-create job
CREATE TABLE IF NOT EXISTS auto_action_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  trigger_type TEXT NOT NULL, -- status_change, threshold_crossed, time_elapsed, etc.
  trigger_entity TEXT NOT NULL, -- deal, quote, po, inventory_item, etc.
  trigger_condition JSONB NOT NULL, -- {field: value, operator: eq/gt/lt, ...}
  action_type TEXT NOT NULL, -- create_job, create_po, escalate, send_alert, etc.
  action_params JSONB NOT NULL, -- {target_module: job, auto_assign_to_role: Manager, ...}
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  -- Owner-only modifications
  CONSTRAINT owner_only AS (
    CASE WHEN (SELECT role FROM user_profiles WHERE id = created_by) = 'Owner'
      THEN TRUE ELSE FALSE END
  ) ENFORCED
);
COMMENT ON TABLE auto_action_rules IS 'Trigger-based workflows. E.g., "when deal status → won, create job."';

-- auto_action_log: audit trail of all autonomous actions
CREATE TABLE IF NOT EXISTS auto_action_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES auto_action_rules(id) ON DELETE SET NULL,
  trigger_entity TEXT NOT NULL, -- deal, quote, po, etc.
  trigger_id UUID NOT NULL, -- id of the entity that triggered
  action_type TEXT NOT NULL, -- what we did
  action_status TEXT DEFAULT 'pending', -- pending, executed, failed
  action_result JSONB, -- {created_id: ..., message: ..., error: ...}
  executed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE auto_action_log IS 'Immutable audit trail of autonomous actions for transparency and debugging.';

-- RLS: Owner-only (same as goals, kpi_definitions, etc.)
ALTER TABLE approval_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_action_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_action_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_authorities_owner_read ON approval_authorities;
DROP POLICY IF EXISTS approval_authorities_owner_write ON approval_authorities;
DROP POLICY IF EXISTS auto_action_rules_owner_read ON auto_action_rules;
DROP POLICY IF EXISTS auto_action_rules_owner_write ON auto_action_rules;
DROP POLICY IF EXISTS auto_action_log_read ON auto_action_log;

CREATE POLICY approval_authorities_owner_read ON approval_authorities
  FOR SELECT USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'Owner'
    OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'Admin')
  );

CREATE POLICY approval_authorities_owner_write ON approval_authorities
  FOR UPDATE USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'Owner');

CREATE POLICY auto_action_rules_owner_read ON auto_action_rules
  FOR SELECT USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'Owner'
    OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'Admin')
  );

CREATE POLICY auto_action_rules_owner_write ON auto_action_rules
  FOR UPDATE USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'Owner');

CREATE POLICY auto_action_log_read ON auto_action_log
  FOR SELECT USING (auth.uid() IS NOT NULL); -- all authed users can audit

-- Seed default approval authorities for a typical distributor
-- Sales: quotes ≤ $5K, POs ≤ $2K
-- Manager: quotes ≤ $20K, POs ≤ $10K
-- Admin: quotes ≤ $50K, POs ≤ $25K
-- Owner: no limit
INSERT INTO approval_authorities (role, action_type, threshold_usd, description, created_by)
SELECT 'Sales', 'quote_approve', 5000, 'Sales reps auto-approve quotes under $5K', NULL
UNION ALL
SELECT 'Sales', 'po_approve', 2000, 'Sales reps auto-approve POs under $2K', NULL
UNION ALL
SELECT 'Manager', 'quote_approve', 20000, 'Managers auto-approve quotes under $20K', NULL
UNION ALL
SELECT 'Manager', 'po_approve', 10000, 'Managers auto-approve POs under $10K', NULL
UNION ALL
SELECT 'Admin', 'quote_approve', 50000, 'Admins auto-approve quotes under $50K', NULL
UNION ALL
SELECT 'Admin', 'po_approve', 25000, 'Admins auto-approve POs under $25K', NULL
UNION ALL
SELECT 'Owner', 'quote_approve', NULL, 'Owner approves all quotes', NULL
UNION ALL
SELECT 'Owner', 'po_approve', NULL, 'Owner approves all POs', NULL
ON CONFLICT DO NOTHING;

-- Seed one example auto-action rule: when deal status → won, auto-create job
-- This is opt-in (Owner enables it via governance UI)
INSERT INTO auto_action_rules (rule_name, trigger_type, trigger_entity, trigger_condition, action_type, action_params, description)
VALUES (
  'Deal→Job Auto-Create',
  'status_change',
  'deal',
  '{"field":"status","operator":"eq","value":"won"}',
  'create_job',
  '{"auto_assign_to_role":"Manager","include_deal_context":true,"set_status":"open"}',
  'When a deal closes (status=won), automatically create a job with deal context.'
)
ON CONFLICT(rule_name) DO NOTHING;

-- Schema is idempotent and safe to re-run.
