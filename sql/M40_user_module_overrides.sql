-- ────────────────────────────────────────────────────────────
-- M40 — User Module Overrides Schema (Module Modes v2)
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Per-user module access overrides. Lets the Owner grant or revoke
-- specific module access for individual employees / customers when
-- their role template doesn't match their actual responsibilities.
--
-- Resolution order (defined in MODULE_MODES.md):
--   1. Module mode `hidden` → never visible
--   2. user_module_overrides.access = 'deny' → not visible
--   3. user_module_overrides.access = 'allow' or 'read_only' → visible
--   4. Mode-based role gate (testing → Owner+Admin; idea_only/etc → Owner)
--   5. Mode `live` → existing data-roles role gate
--
-- Idempotent. RLS pattern: Owner reads/writes all; each user reads own only.

CREATE TABLE IF NOT EXISTS user_module_overrides (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key  TEXT NOT NULL,
  access      TEXT NOT NULL CHECK (access IN ('allow', 'deny', 'read_only')),
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_umo_user ON user_module_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_umo_module ON user_module_overrides(module_key);

ALTER TABLE user_module_overrides ENABLE ROW LEVEL SECURITY;

-- Each authed user can read their own overrides (so the gating works on their browser).
DROP POLICY IF EXISTS "user reads own overrides" ON user_module_overrides;
CREATE POLICY "user reads own overrides" ON user_module_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Owner reads everyone's overrides (so the Mgmt UI can list them).
DROP POLICY IF EXISTS "owner reads all overrides" ON user_module_overrides;
CREATE POLICY "owner reads all overrides" ON user_module_overrides
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'Owner'
    )
  );

-- Only Owner can insert / update / delete overrides.
DROP POLICY IF EXISTS "owner writes overrides" ON user_module_overrides;
CREATE POLICY "owner writes overrides" ON user_module_overrides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'Owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'Owner'
    )
  );

-- Verification
SELECT 'user_module_overrides' AS table_name,
       relrowsecurity AS rls_enabled,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_module_overrides') AS policy_count
FROM pg_class WHERE relname = 'user_module_overrides';
