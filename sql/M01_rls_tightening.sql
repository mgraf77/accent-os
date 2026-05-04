-- ────────────────────────────────────────────────────────────
-- M01 — RLS tightening on existing vendor_* tables
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- Track 0.2 Chunk C
-- ────────────────────────────────────────────────────────────
--
-- Drops anon read/write policies and replaces with authenticated-role
-- policies. Reads stay open to all signed-in users; writes are gated
-- by role (Owner/Admin/Manager only — Sales/Warehouse become read-only
-- on vendor data).
--
-- Idempotent: safe to re-run. Each policy is dropped IF EXISTS first.

-- Helper: who-am-I shortcut used in every policy
-- (keeps the predicate readable; Postgres inlines this fine).
-- We don't actually create a function — just use the EXISTS pattern.

-- ─── vendor_categories ──────────────────────────────────────
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"     ON vendor_categories;
DROP POLICY IF EXISTS "anon insert"   ON vendor_categories;
DROP POLICY IF EXISTS "anon update"   ON vendor_categories;
DROP POLICY IF EXISTS "anon delete"   ON vendor_categories;
DROP POLICY IF EXISTS "authed read"   ON vendor_categories;
DROP POLICY IF EXISTS "authed write"  ON vendor_categories;

CREATE POLICY "authed read" ON vendor_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authed write" ON vendor_categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_id = auth.uid()
                 AND role IN ('Owner','Admin','Manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_id = auth.uid()
                      AND role IN ('Owner','Admin','Manager')));

-- ─── vendor_score_states ────────────────────────────────────
ALTER TABLE vendor_score_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"     ON vendor_score_states;
DROP POLICY IF EXISTS "anon insert"   ON vendor_score_states;
DROP POLICY IF EXISTS "anon update"   ON vendor_score_states;
DROP POLICY IF EXISTS "anon delete"   ON vendor_score_states;
DROP POLICY IF EXISTS "authed read"   ON vendor_score_states;
DROP POLICY IF EXISTS "authed write"  ON vendor_score_states;

CREATE POLICY "authed read" ON vendor_score_states
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authed write" ON vendor_score_states
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_id = auth.uid()
                 AND role IN ('Owner','Admin','Manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_id = auth.uid()
                      AND role IN ('Owner','Admin','Manager')));

-- ─── vendor_changelog ───────────────────────────────────────
ALTER TABLE vendor_changelog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"     ON vendor_changelog;
DROP POLICY IF EXISTS "anon insert"   ON vendor_changelog;
DROP POLICY IF EXISTS "anon update"   ON vendor_changelog;
DROP POLICY IF EXISTS "anon delete"   ON vendor_changelog;
DROP POLICY IF EXISTS "authed read"   ON vendor_changelog;
DROP POLICY IF EXISTS "authed insert" ON vendor_changelog;

CREATE POLICY "authed read" ON vendor_changelog
  FOR SELECT TO authenticated USING (true);

-- Changelog is append-only; any signed-in user can write their own row.
CREATE POLICY "authed insert" ON vendor_changelog
  FOR INSERT TO authenticated WITH CHECK (true);

-- ─── parent_companies ───────────────────────────────────────
ALTER TABLE parent_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"      ON parent_companies;
DROP POLICY IF EXISTS "anon insert"    ON parent_companies;
DROP POLICY IF EXISTS "anon update"    ON parent_companies;
DROP POLICY IF EXISTS "anon delete"    ON parent_companies;
DROP POLICY IF EXISTS "authed read"    ON parent_companies;
DROP POLICY IF EXISTS "authed write"   ON parent_companies;

CREATE POLICY "authed read" ON parent_companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authed write" ON parent_companies
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_id = auth.uid()
                 AND role IN ('Owner','Admin','Manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_id = auth.uid()
                      AND role IN ('Owner','Admin','Manager')));

-- ─── vendor_parent_assignments ──────────────────────────────
ALTER TABLE vendor_parent_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"      ON vendor_parent_assignments;
DROP POLICY IF EXISTS "anon insert"    ON vendor_parent_assignments;
DROP POLICY IF EXISTS "anon update"    ON vendor_parent_assignments;
DROP POLICY IF EXISTS "anon delete"    ON vendor_parent_assignments;
DROP POLICY IF EXISTS "authed read"    ON vendor_parent_assignments;
DROP POLICY IF EXISTS "authed write"   ON vendor_parent_assignments;

CREATE POLICY "authed read" ON vendor_parent_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authed write" ON vendor_parent_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_id = auth.uid()
                 AND role IN ('Owner','Admin','Manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_id = auth.uid()
                      AND role IN ('Owner','Admin','Manager')));

-- ─── feedback (was anon-write per old setup; lock to authenticated) ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='feedback') THEN
    EXECUTE 'ALTER TABLE feedback ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "anon insert" ON feedback';
    EXECUTE 'DROP POLICY IF EXISTS "authed insert" ON feedback';
    EXECUTE 'DROP POLICY IF EXISTS "owner reads" ON feedback';
    EXECUTE 'CREATE POLICY "authed insert" ON feedback FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "owner reads" ON feedback FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ''Owner''))';
  END IF;
END $$;

-- ─── Verify ─────────────────────────────────────────────────
-- Should show 'true' for each table:
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('vendor_categories','vendor_score_states','vendor_changelog',
                  'parent_companies','vendor_parent_assignments','user_profiles','audit_log')
ORDER BY relname;
