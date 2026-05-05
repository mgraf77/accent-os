-- M35 — employees.quota + hire_date + terminated_at
-- Unblocks 7 KPIs: S-OS2 (quota attainment), MGR1 (team quota), MGR2,
--                  H3 (turnover), H6 (tenure), H7 (ramp time), partially S-OS5

BEGIN;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS quota numeric(12,2),         -- annual revenue target ($)
  ADD COLUMN IF NOT EXISTS quota_period text DEFAULT 'annual'
    CHECK (quota_period IN ('annual','quarterly','monthly')),
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS termination_reason text;     -- voluntary, involuntary, retirement

-- Useful index for "active employees on date X" queries
CREATE INDEX IF NOT EXISTS idx_employees_active
  ON employees(hire_date, terminated_at)
  WHERE terminated_at IS NULL;

-- Backfill plan:
--   - hire_date for existing employees: pull from HR records OR set to
--     created_at as approximation (mark with a flag for refinement)
--   - quota: populate per role from latest comp plan
--   - terminated_at: NULL for current staff

COMMIT;

-- Verify:
--   SELECT id, name, hire_date, quota, terminated_at FROM employees;
--   SELECT COUNT(*) FROM employees WHERE terminated_at IS NULL;  -- active count
