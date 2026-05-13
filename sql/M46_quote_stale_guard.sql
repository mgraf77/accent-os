-- ─────────────────────────────────────────────────────────────────
-- M46 — Quote Save RPC: stale-edit guard + updated_at in response
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- Supersedes M45 (CREATE OR REPLACE — same function name/signature
-- with one additional optional parameter).
-- ─────────────────────────────────────────────────────────────────
--
-- Changes from M45:
--   1. New optional param p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
--      When provided: if the quote row's current updated_at is strictly
--      newer than p_expected_updated_at, the function raises an exception
--      whose message starts with 'CONFLICT:'. The client detects this
--      prefix and offers the operator an overwrite-or-reload choice.
--      When NULL (new quote, or forced overwrite): check is skipped.
--
--   2. updated_at is now returned in the result JSON alongside quote_id
--      and line_count. The client stores this value in q._updatedAt so
--      subsequent saves can pass it as p_expected_updated_at.
--
-- All three operations (upsert header, delete lines, insert lines) still
-- run inside one implicit Postgres transaction — any failure rolls back all.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION upsert_quote_with_lines(
  p_header              JSONB,
  p_lines               JSONB      DEFAULT '[]'::JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER   -- caller's JWT; RLS policies still apply
AS $$
DECLARE
  v_uuid          UUID;
  v_customer      UUID;
  v_db_updated_at TIMESTAMPTZ;
  v_saved_at      TIMESTAMPTZ;
  v_line_count    INT;
BEGIN
  -- ── Stale-edit guard ────────────────────────────────────────
  -- Only checked when caller provides a known baseline timestamp.
  -- A NULL baseline means: first save, or operator chose to force-overwrite.
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at
      INTO v_db_updated_at
      FROM quotes
     WHERE number = p_header->>'number';

    IF v_db_updated_at IS NOT NULL AND v_db_updated_at > p_expected_updated_at THEN
      RAISE EXCEPTION
        'CONFLICT: quote % was last saved at % — newer than your baseline (%). Another session may have overwritten your version.',
        p_header->>'number',
        to_char(v_db_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS UTC'),
        to_char(p_expected_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS UTC');
    END IF;
  END IF;

  -- ── Step 1: Upsert header ────────────────────────────────────
  v_customer := NULLIF(p_header->>'customer_id', '')::UUID;

  INSERT INTO quotes (
    number, customer_id, customer_name, project_name,
    status, subtotal, tax, total, notes, updated_at
  )
  VALUES (
    p_header->>'number',
    v_customer,
    NULLIF(p_header->>'customer_name', ''),
    NULLIF(p_header->>'project_name', ''),
    COALESCE(NULLIF(p_header->>'status', ''), 'draft'),
    COALESCE((p_header->>'subtotal')::NUMERIC, 0),
    COALESCE((p_header->>'tax')::NUMERIC, 0),
    COALESCE((p_header->>'total')::NUMERIC, 0),
    p_header->>'notes',
    NOW()
  )
  ON CONFLICT (number) DO UPDATE SET
    customer_id   = EXCLUDED.customer_id,
    customer_name = EXCLUDED.customer_name,
    project_name  = EXCLUDED.project_name,
    status        = EXCLUDED.status,
    subtotal      = EXCLUDED.subtotal,
    tax           = EXCLUDED.tax,
    total         = EXCLUDED.total,
    notes         = EXCLUDED.notes,
    updated_at    = NOW()
  RETURNING id, updated_at INTO v_uuid, v_saved_at;

  IF v_uuid IS NULL THEN
    RAISE EXCEPTION 'upsert_quote_with_lines: no UUID returned for number=%', p_header->>'number';
  END IF;

  -- ── Step 2: Delete existing lines (same transaction) ────────
  DELETE FROM quote_lines WHERE quote_id = v_uuid;

  -- ── Step 3: Insert new lines (same transaction) ─────────────
  INSERT INTO quote_lines (
    quote_id, line_no, vendor_id, vendor_name,
    description, qty, unit_price, ext_price, notes
  )
  SELECT
    v_uuid,
    (ln->>'line_no')::INT,
    NULLIF(ln->>'vendor_id', ''),
    NULLIF(ln->>'vendor_name', ''),
    NULLIF(ln->>'description', ''),
    COALESCE((ln->>'qty')::NUMERIC, 0),
    COALESCE((ln->>'unit_price')::NUMERIC, 0),
    COALESCE((ln->>'ext_price')::NUMERIC, 0),
    NULLIF(ln->>'notes', '')
  FROM jsonb_array_elements(COALESCE(p_lines, '[]'::JSONB)) AS ln;

  GET DIAGNOSTICS v_line_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'quote_id',    v_uuid,
    'updated_at',  v_saved_at,
    'line_count',  v_line_count
  );
END;
$$;

-- Re-grant (CREATE OR REPLACE resets privileges in some Postgres versions)
GRANT EXECUTE ON FUNCTION upsert_quote_with_lines(JSONB, JSONB, TIMESTAMPTZ) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Verification:
--   SELECT routine_name, security_type
--   FROM information_schema.routines
--   WHERE routine_name = 'upsert_quote_with_lines';
--   -- security_type should be 'INVOKER'
--
-- Smoke test (replace values as needed):
--   SELECT upsert_quote_with_lines(
--     '{"number":"QT-TEST","project_name":"Test","status":"draft","subtotal":0,"tax":0,"total":0}'::jsonb,
--     '[]'::jsonb,
--     NULL
--   );
-- ─────────────────────────────────────────────────────────────────
