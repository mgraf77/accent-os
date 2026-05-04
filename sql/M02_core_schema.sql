-- ────────────────────────────────────────────────────────────
-- M02 — Core Database Schema (Track 0.4)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Creates every table needed by Tracks 1–4. Idempotent (CREATE TABLE
-- IF NOT EXISTS). All tables: RLS enabled, authenticated reads,
-- role-gated writes.
--
-- Tables created:
--   1.1  vendor_scores             (numeric score values per vendor+category, with history)
--   2.2  vendor_overrides          (editable vendor metadata — notes, tier override, etc.)
--   2.3  coop_tracker              (rebate/co-op fund tracking)
--   1.4  customers                 (customer master)
--   1.4  customer_interactions     (timeline events per customer)
--   1.2  quotes                    (quote header)
--   1.2  quote_lines               (quote line items)
--   1.5  pipeline_deals            (deal/opportunity records)
--   1.5  pipeline_events           (deal stage transitions, comm events)
--   3.1  employees                 (employee directory)
--   3.1  employee_scores           (employee performance scoring)
--   4.3  goals                     (5-level OKR hierarchy)
--   4.2  kpi_definitions           (KPI catalog)
--   4.2  kpi_snapshots             (daily KPI value snapshots)
--   3+   alerts                    (proactive alerts queue)
--   --   telemetry_events          (user behavior telemetry)
--   --   build_events              (release/version log)
--   1.5  probability_model_log     (pipeline probability recalibration history)

-- ════════════════════════════════════════════════════════════
-- TRACK 1.1 — vendor_scores
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vendor_scores (
  vendor_id     TEXT NOT NULL,
  category_key  TEXT NOT NULL,
  score         NUMERIC(4,1) CHECK (score IS NULL OR (score >= 0 AND score <= 10)),
  justification TEXT,
  components    JSONB,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_by    TEXT,
  PRIMARY KEY (vendor_id, category_key)
);
CREATE INDEX IF NOT EXISTS idx_vendor_scores_vendor ON vendor_scores(vendor_id);

-- ════════════════════════════════════════════════════════════
-- TRACK 2.2 — vendor_overrides
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vendor_overrides (
  vendor_id      TEXT PRIMARY KEY,
  notes          TEXT,
  custom_rep     TEXT,
  tier_override  TEXT CHECK (tier_override IS NULL OR tier_override IN ('A','B','C')),
  inactive       BOOLEAN DEFAULT false,
  inactive_reason TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_by     TEXT
);

-- ════════════════════════════════════════════════════════════
-- TRACK 2.3 — coop_tracker
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS coop_tracker (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    TEXT NOT NULL,
  fund_type    TEXT NOT NULL CHECK (fund_type IN ('rebate','co-op','mdf','spiff','other')),
  amount       NUMERIC(12,2),
  currency     TEXT DEFAULT 'USD',
  earned_period TEXT,
  deadline     DATE,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','claimed','expired','rejected')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   TEXT
);
CREATE INDEX IF NOT EXISTS idx_coop_tracker_vendor   ON coop_tracker(vendor_id);
CREATE INDEX IF NOT EXISTS idx_coop_tracker_deadline ON coop_tracker(deadline) WHERE status = 'open';

-- ════════════════════════════════════════════════════════════
-- TRACK 1.4 — customers + customer_interactions
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT,                                    -- Windward customer ID when imported
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('residential','trade','designer','contractor','commercial','other')),
  email           TEXT,
  phone           TEXT,
  address         JSONB,                                   -- {line1, line2, city, state, zip}
  notes           TEXT,
  rfm_recency     INT,                                     -- days since last purchase
  rfm_frequency   INT,                                     -- # purchases in window
  rfm_monetary    NUMERIC(12,2),
  segment         TEXT,                                    -- VIP, Active, Lapsed, Lost, Prospect
  lifecycle_stage TEXT,
  first_seen      TIMESTAMPTZ,
  last_seen       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      TEXT
);
CREATE INDEX IF NOT EXISTS idx_customers_email   ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);

CREATE TABLE IF NOT EXISTS customer_interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('quote','order','call','email','visit','note','support','other')),
  ref_id      TEXT,                                        -- ID into the source system (quote ID, ticket #, etc.)
  subject     TEXT,
  body        TEXT,
  amount      NUMERIC(12,2),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id, occurred_at DESC);

-- ════════════════════════════════════════════════════════════
-- TRACK 1.2 — quotes + quote_lines
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          TEXT UNIQUE,                             -- human-readable Q-2026-0001 etc.
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,                                    -- denormalized for guest/walk-in
  project_name    TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired','converted')),
  subtotal        NUMERIC(12,2) DEFAULT 0,
  tax             NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  margin_pct      NUMERIC(5,2),
  notes           TEXT,
  pdf_url         TEXT,
  expires_at      DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status   ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created  ON quotes(created_at DESC);

CREATE TABLE IF NOT EXISTS quote_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  line_no      INT NOT NULL,
  vendor_id    TEXT,
  vendor_name  TEXT,
  sku          TEXT,
  description  TEXT,
  qty          NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_cost    NUMERIC(12,2),
  unit_price   NUMERIC(12,2),
  ext_price    NUMERIC(12,2),
  margin_pct   NUMERIC(5,2),
  notes        TEXT,
  UNIQUE (quote_id, line_no)
);

-- ════════════════════════════════════════════════════════════
-- TRACK 1.5 — pipeline_deals + pipeline_events + probability_model_log
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pipeline_deals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name      TEXT,
  quote_id           UUID REFERENCES quotes(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  source             TEXT,                                 -- referral, web, walk-in, repeat, designer, etc.
  segment            TEXT,                                 -- residential, trade, etc.
  project_type       TEXT,                                 -- new build, remodel, replacement, etc.
  value              NUMERIC(12,2),
  stage              TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','qualified','quoted','negotiating','won','lost','abandoned')),
  probability        NUMERIC(5,2),                         -- 0–100, computed by 8-factor model
  probability_factors JSONB,                               -- raw inputs: lead_source, customer_history, ...
  expected_close     DATE,
  owner_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loss_reason        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_deals_stage ON pipeline_deals(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_deals_owner ON pipeline_deals(owner_id);

CREATE TABLE IF NOT EXISTS pipeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES pipeline_deals(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('stage_change','comm_logged','quote_sent','note','followup_due','custom')),
  from_stage  TEXT,
  to_stage    TEXT,
  payload     JSONB,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_deal ON pipeline_events(deal_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS probability_model_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version           INT NOT NULL,
  recalibrated_at   TIMESTAMPTZ DEFAULT NOW(),
  factor_weights    JSONB NOT NULL,                        -- {lead_source: 0.18, customer_history: 0.22, ...}
  training_n        INT,
  notes             TEXT
);

-- ════════════════════════════════════════════════════════════
-- TRACK 3.1 — employees + employee_scores
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  role            TEXT,
  department      TEXT,
  hire_date       DATE,
  active          BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,                           -- 2026-Q1, 2026-04, etc.
  metric_key      TEXT NOT NULL,
  metric_value    NUMERIC,
  score           NUMERIC(4,1),
  notes           TEXT,
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  recorded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (employee_id, period, metric_key)
);

-- ════════════════════════════════════════════════════════════
-- TRACK 4.3 — goals (5-level OKR hierarchy)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES goals(id) ON DELETE CASCADE,
  level         TEXT NOT NULL CHECK (level IN ('company','department','team','individual','daily')),
  title         TEXT NOT NULL,
  description   TEXT,
  owner_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_key    TEXT,                                       -- ties to kpi_definitions.key
  target_value  NUMERIC,
  current_value NUMERIC,
  start_date    DATE,
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete','at_risk','abandoned')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_owner  ON goals(owner_id);

-- ════════════════════════════════════════════════════════════
-- TRACK 4.2 — kpi_definitions + kpi_snapshots
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS kpi_definitions (
  key            TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT CHECK (category IN ('financial','sales','ecommerce','customer','operations','marketing','employee')),
  visible_to_roles TEXT[] NOT NULL DEFAULT '{Owner}',
  unit           TEXT,                                      -- '$', '%', 'count', 'days', etc.
  direction      TEXT CHECK (direction IN ('higher_better','lower_better')),
  target         NUMERIC,
  description    TEXT,
  source         TEXT,                                      -- 'manual', 'computed_from:vendor_scores', etc.
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_key       TEXT NOT NULL REFERENCES kpi_definitions(key) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value         NUMERIC,
  metadata      JSONB,
  recorded_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (kpi_key, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_key_date ON kpi_snapshots(kpi_key, snapshot_date DESC);

-- ════════════════════════════════════════════════════════════
-- alerts + telemetry_events + build_events
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role TEXT,                                      -- broadcast to role if recipient_id null
  type          TEXT NOT NULL,                              -- coop_deadline, deal_stale, score_unverified, etc.
  severity      TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','urgent')),
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,                                       -- in-app deeplink
  payload       JSONB,
  status        TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','dismissed','actioned')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_alerts_recipient ON alerts(recipient_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS telemetry_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  module      TEXT,
  element     TEXT,
  metadata    JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetry_user_time ON telemetry_events(user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS build_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version       TEXT NOT NULL,
  session_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  built         TEXT,
  changed       TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- RLS — all tables: authenticated read; role-gated write
-- Sales/Warehouse can read everything but only write their own quotes /
-- pipeline events / interactions.
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  read_all_tables TEXT[] := ARRAY[
    'vendor_scores','vendor_overrides','coop_tracker','customers','customer_interactions',
    'quotes','quote_lines','pipeline_deals','pipeline_events','probability_model_log',
    'employees','employee_scores','goals','kpi_definitions','kpi_snapshots',
    'alerts','telemetry_events','build_events'
  ];
BEGIN
  FOREACH t IN ARRAY read_all_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed read" ON %I', t);
    EXECUTE format('CREATE POLICY "authed read" ON %I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- Vendor data writes — Owner/Admin/Manager only
DO $$
DECLARE
  t TEXT;
  vendor_write_tables TEXT[] := ARRAY['vendor_scores','vendor_overrides','coop_tracker'];
BEGIN
  FOREACH t IN ARRAY vendor_write_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "manager+ writes" ON %I', t);
    EXECUTE format($f$CREATE POLICY "manager+ writes" ON %I FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('Owner','Admin','Manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('Owner','Admin','Manager')))$f$, t);
  END LOOP;
END $$;

-- Sales-touchable tables — anyone signed in can write (RLS allows it; UI should still gate)
DO $$
DECLARE
  t TEXT;
  sales_write_tables TEXT[] := ARRAY['customers','customer_interactions','quotes','quote_lines','pipeline_deals','pipeline_events'];
BEGIN
  FOREACH t IN ARRAY sales_write_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authed writes" ON %I', t);
    EXECUTE format('CREATE POLICY "authed writes" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Owner-only writes (KPIs, goals at company level, employee data, model log)
DO $$
DECLARE
  t TEXT;
  owner_write_tables TEXT[] := ARRAY['kpi_definitions','probability_model_log','employees','employee_scores','build_events'];
BEGIN
  FOREACH t IN ARRAY owner_write_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner writes" ON %I', t);
    EXECUTE format($f$CREATE POLICY "owner writes" ON %I FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Owner'))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Owner'))$f$, t);
  END LOOP;
END $$;

-- Goals: any authed user writes their own
DROP POLICY IF EXISTS "authed writes goals" ON goals;
CREATE POLICY "authed writes goals" ON goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- KPI snapshots: authed insert (computed by jobs); read open
DROP POLICY IF EXISTS "authed inserts kpi_snapshots" ON kpi_snapshots;
CREATE POLICY "authed inserts kpi_snapshots" ON kpi_snapshots FOR INSERT TO authenticated WITH CHECK (true);

-- Alerts: insert by anyone (system jobs); read = own only; update = own only
DROP POLICY IF EXISTS "authed inserts alerts" ON alerts;
CREATE POLICY "authed inserts alerts" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "own reads alerts" ON alerts;
CREATE POLICY "own reads alerts" ON alerts FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR recipient_id IS NULL);
DROP POLICY IF EXISTS "own updates alerts" ON alerts;
CREATE POLICY "own updates alerts" ON alerts FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- Telemetry: insert only (write own row); read Owner only
DROP POLICY IF EXISTS "own inserts telemetry" ON telemetry_events;
CREATE POLICY "own inserts telemetry" ON telemetry_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner reads telemetry" ON telemetry_events;
CREATE POLICY "owner reads telemetry" ON telemetry_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Owner'));

-- ─── Verify ─────────────────────────────────────────────────
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('vendor_scores','vendor_overrides','coop_tracker','customers','customer_interactions',
                  'quotes','quote_lines','pipeline_deals','pipeline_events','probability_model_log',
                  'employees','employee_scores','goals','kpi_definitions','kpi_snapshots',
                  'alerts','telemetry_events','build_events')
ORDER BY relname;
