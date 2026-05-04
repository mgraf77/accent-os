-- ────────────────────────────────────────────────────────────
-- M21 — Phase 3 Schema (Calendar / Knowledge Hub / Job Tracker)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Adds tables for Tracks 5.1 (Knowledge Hub), 5.2 (Job Tracker),
-- and 5.16 (Company Calendar). Idempotent. Same RLS pattern as M02:
-- all-authed read, all-authed write (UI gates by role).

-- ════════════════════════════════════════════════════════════
-- TRACK 5.16 — calendar_events
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS calendar_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT CHECK (category IN ('trade_show','training','deadline','holiday','meeting','launch','other')),
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  all_day       BOOLEAN DEFAULT false,
  location      TEXT,
  url           TEXT,
  visible_to_roles TEXT[] DEFAULT ARRAY['Owner','Admin','Manager','Sales','Warehouse'],
  owner_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_starts ON calendar_events(starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_category ON calendar_events(category);

-- ════════════════════════════════════════════════════════════
-- TRACK 5.1 — articles (Knowledge Hub)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE,
  title         TEXT NOT NULL,
  category      TEXT CHECK (category IN ('vendor_playbook','rep_protocol','process','training','policy','reference','other')),
  body          TEXT,                                     -- markdown
  tags          TEXT[],
  related_vendor_id TEXT,
  visible_to_roles TEXT[] DEFAULT ARRAY['Owner','Admin','Manager','Sales','Warehouse'],
  pinned        BOOLEAN DEFAULT false,
  author_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_updated  ON articles(updated_at DESC);

-- ════════════════════════════════════════════════════════════
-- TRACK 5.2 — jobs (Job Tracker)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number    TEXT UNIQUE,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  project_name  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','complete','cancelled')),
  priority      TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
  assigned_to   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date      DATE,
  estimated_hours NUMERIC(6,2),
  actual_hours  NUMERIC(6,2),
  notes         TEXT,
  related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  related_deal_id UUID REFERENCES pipeline_deals(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_due      ON jobs(due_date) WHERE status NOT IN ('complete','cancelled');

-- ════════════════════════════════════════════════════════════
-- RLS — same pattern as M02: authenticated read, authenticated write
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['calendar_events','articles','jobs'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed read" ON %I', t);
    EXECUTE format('CREATE POLICY "authed read" ON %I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed writes" ON %I', t);
    EXECUTE format('CREATE POLICY "authed writes" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ─── Verify ─────────────────────────────────────────────────
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('calendar_events','articles','jobs')
ORDER BY relname;
