-- M41 — External Partner Portal
-- Trade Partners and Vendor Reps get their own login via Supabase magic link.
-- Run once. Idempotent. Requires: M24 (trade_partners), M02 (core schema).

-- ── external_user_profiles ────────────────────────────────────────────────────
-- Links a Supabase Auth user to their portal identity.
-- Row is provisioned by staff BEFORE external user first logs in (email match).
-- user_id is filled automatically on first login via the trigger below.

CREATE TABLE IF NOT EXISTS external_user_profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                    text UNIQUE NOT NULL,
  user_id                  uuid REFERENCES auth.users(id),
  portal_type              text NOT NULL CHECK (portal_type IN ('trade_partner', 'vendor_rep')),
  linked_trade_partner_id  uuid REFERENCES trade_partners(id),
  linked_rep_name          text,              -- matches VD.rg for vendor rep views
  is_active                boolean DEFAULT true,
  provisioned_by           uuid REFERENCES auth.users(id),
  provisioned_at           timestamptz DEFAULT now(),
  last_access              timestamptz
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE external_user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_external_profiles" ON external_user_profiles;
CREATE POLICY "staff_manage_external_profiles" ON external_user_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('Owner', 'Admin')
    )
  );

DROP POLICY IF EXISTS "external_read_own_profile" ON external_user_profiles;
CREATE POLICY "external_read_own_profile" ON external_user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── Trigger: link auth.user → profile on first login ─────────────────────────
-- When an external user logs in for the first time, fills in their user_id
-- and stamps last_access. Matches by email.

CREATE OR REPLACE FUNCTION link_external_user_on_login()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE external_user_profiles
  SET
    user_id = NEW.id,
    last_access = now()
  WHERE email = NEW.email
    AND user_id IS NULL
    AND is_active = true;

  -- Also refresh last_access for returning users
  UPDATE external_user_profiles
  SET last_access = now()
  WHERE user_id = NEW.id AND is_active = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_external_user_on_login();

-- ── trade_partners: external read-own ─────────────────────────────────────────
-- Allows a provisioned trade partner to read their own row.

DROP POLICY IF EXISTS "external_trade_partner_read_own" ON trade_partners;
CREATE POLICY "external_trade_partner_read_own" ON trade_partners
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT linked_trade_partner_id
      FROM external_user_profiles
      WHERE user_id = auth.uid() AND portal_type = 'trade_partner'
    )
  );

-- ── jobs/quotes/deliveries: external read by linked partner ──────────────────
-- These use name matching (same as portal_preview.js). A clean UUID FK join
-- would be cleaner but requires migration of existing data.

DROP POLICY IF EXISTS "external_jobs_read" ON jobs;
CREATE POLICY "external_jobs_read" ON jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_user_profiles ep
      JOIN trade_partners tp ON tp.id = ep.linked_trade_partner_id
      WHERE ep.user_id = auth.uid()
        AND ep.portal_type = 'trade_partner'
        AND lower(jobs.customer_name) = lower(tp.company)
    )
  );

DROP POLICY IF EXISTS "external_quotes_read" ON quotes;
CREATE POLICY "external_quotes_read" ON quotes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_user_profiles ep
      JOIN trade_partners tp ON tp.id = ep.linked_trade_partner_id
      WHERE ep.user_id = auth.uid()
        AND ep.portal_type = 'trade_partner'
        AND lower(quotes.customer) = lower(tp.company)
    )
  );

DROP POLICY IF EXISTS "external_deliveries_read" ON deliveries;
CREATE POLICY "external_deliveries_read" ON deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_user_profiles ep
      JOIN trade_partners tp ON tp.id = ep.linked_trade_partner_id
      WHERE ep.user_id = auth.uid()
        AND ep.portal_type = 'trade_partner'
        AND lower(deliveries.customer_name) = lower(tp.company)
    )
  );

-- ── inventory_items: external read all (public catalog) ──────────────────────
DROP POLICY IF EXISTS "external_inventory_read" ON inventory_items;
CREATE POLICY "external_inventory_read" ON inventory_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_user_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON TABLE external_user_profiles IS
  'Links Supabase auth users to their trade partner or vendor rep portal identity.
   Provisioned by staff in AccentOS → Portal Preview → "Provision Access".
   user_id is filled automatically on first login via on_auth_user_login trigger.';
