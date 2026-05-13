-- ─────────────────────────────────────────────────────────────────
-- M45 — Transactional Quote Save RPC
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ─────────────────────────────────────────────────────────────────
--
-- Problem this solves:
--   The previous REST save path was three sequential calls:
--     1. POST /quotes (upsert header)
--     2. DELETE /quote_lines (wipe existing lines)
--     3. POST /quote_lines (insert new lines)
--
--   If step 3 failed after step 2 succeeded, the DB entered a
--   corrupted state: quote header exists, all lines deleted,
--   nothing inserted. No rollback was possible from the client.
--
-- Solution:
--   A single Postgres function that wraps all three operations
--   inside one implicit transaction. Any failure rolls back all
--   three operations atomically. Client makes one network call.
--
-- Calling convention (via sbFetch):
--   POST /rest/v1/rpc/upsert_quote_with_lines
--   Body: { "p_header": {...}, "p_lines": [...] }
--
-- Returns: { "quote_id": "<uuid>", "line_count": N }
-- Throws:  Postgres exception on any constraint or write failure
--          (PostgREST converts this to a non-2xx HTTP response)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION upsert_quote_with_lines(
  p_header JSONB,
  p_lines  JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER   -- runs as the calling user; RLS policies still apply
AS $$
DECLARE
  v_uuid       UUID;
  v_customer   UUID;
  v_line_count INT;
BEGIN
  -- Resolve customer_id: cast to UUID only when non-empty
  v_customer := NULLIF(p_header->>'customer_id', '')::UUID;

  -- ── Step 1: Upsert quote header ──────────────────────────────
  -- ON CONFLICT on the `number` unique column. Returns the UUID
  -- whether it was a fresh insert or an update.
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
  RETURNING id INTO v_uuid;

  -- Guard: should never be null after upsert, but surface it clearly
  IF v_uuid IS NULL THEN
    RAISE EXCEPTION 'upsert_quote_with_lines: no UUID returned for number=%', p_header->>'number';
  END IF;

  -- ── Step 2: Delete existing lines ───────────────────────────
  -- Runs inside the same transaction; rolled back if step 3 fails.
  DELETE FROM quote_lines WHERE quote_id = v_uuid;

  -- ── Step 3: Insert new lines ─────────────────────────────────
  -- jsonb_array_elements returns zero rows for '[]', so an empty
  -- line set cleanly leaves the quote with zero lines (valid state
  -- for a header-only draft — not an error).
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
    'quote_id',   v_uuid,
    'line_count', v_line_count
  );
END;
$$;

-- Grant execute to authenticated users (anon excluded: they cannot write quotes)
GRANT EXECUTE ON FUNCTION upsert_quote_with_lines(JSONB, JSONB) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Verification query (run after applying migration):
--
--   SELECT routine_name, security_type
--   FROM information_schema.routines
--   WHERE routine_name = 'upsert_quote_with_lines';
--
-- Expected: security_type = 'INVOKER'
-- ─────────────────────────────────────────────────────────────────
