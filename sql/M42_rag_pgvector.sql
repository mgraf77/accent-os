-- ════════════════════════════════════════════════════════════════════════════
-- M42 — RAG: pgvector + tsvector hybrid search for AccentOS OS-RAG
-- ════════════════════════════════════════════════════════════════════════════
-- Project: hsyjcrrazrzqngwkqsqa
-- Spec:    skills/accent-rag/SKILL.md
-- Pattern: Anthropic Contextual Retrieval + Supabase Hybrid Search (RRF)
-- Embedding model: @cf/baai/bge-base-en-v1.5  (768-dim, free Cloudflare Workers AI)
--
-- Run order: M01 (RLS) and M02 (core schema) must be applied first.
-- This migration is idempotent — safe to re-run.
-- ────────────────────────────────────────────────────────────────────────────

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Source-type enum-like constraint via CHECK (kept as text for forward-compat) ──
-- Allowed values: article, vendor_playbook, scoring_rubric, lighting_ref, sop,
-- master_doc, session_log, build_intel, customer_note, vendor_note, arbitrary

-- ── Table: rag_chunks ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_chunks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     text        NOT NULL,
  source_id       text,                                    -- natural key back to origin row (e.g. article slug)
  source_url      text,                                    -- optional click-through
  title           text,
  body            text        NOT NULL,
  context         text,                                    -- Anthropic contextual prefix
  searchable      text        GENERATED ALWAYS AS (coalesce(context,'') || ' ' || body) STORED,
  tsv             tsvector    GENERATED ALWAYS AS (to_tsvector('english', coalesce(context,'') || ' ' || body)) STORED,
  embedding       vector(768),
  metadata        jsonb       DEFAULT '{}'::jsonb,
  visible_to_roles text[]     DEFAULT ARRAY['Owner','Admin','Manager','Sales','Warehouse']::text[],
  pinned          boolean     DEFAULT false,
  chunk_index     integer     DEFAULT 0,
  total_chunks    integer     DEFAULT 1,
  body_hash       text,                                    -- sha256(body) for dedup
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Add a CHECK after the table exists so re-runs don't fight ALTER TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rag_chunks_source_type_check'
  ) THEN
    ALTER TABLE rag_chunks ADD CONSTRAINT rag_chunks_source_type_check
      CHECK (source_type IN (
        'article','vendor_playbook','scoring_rubric','lighting_ref','sop',
        'master_doc','session_log','build_intel','customer_note','vendor_note',
        'arbitrary'
      ));
  END IF;
END$$;

-- ── Indexes ─────────────────────────────────────────────────────────────────
-- HNSW for cosine; uses pgvector's HNSW (faster build than IVFFLAT, no training).
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw
  ON rag_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS rag_chunks_tsv_gin
  ON rag_chunks USING gin (tsv);

CREATE INDEX IF NOT EXISTS rag_chunks_source_type_idx
  ON rag_chunks (source_type);

CREATE INDEX IF NOT EXISTS rag_chunks_pinned_idx
  ON rag_chunks (pinned) WHERE pinned;

CREATE INDEX IF NOT EXISTS rag_chunks_source_id_idx
  ON rag_chunks (source_type, source_id);

CREATE INDEX IF NOT EXISTS rag_chunks_body_hash_idx
  ON rag_chunks (body_hash);

CREATE INDEX IF NOT EXISTS rag_chunks_metadata_gin
  ON rag_chunks USING gin (metadata);

-- ── Trigger: keep updated_at fresh ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION rag_chunks_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS rag_chunks_touch ON rag_chunks;
CREATE TRIGGER rag_chunks_touch
  BEFORE UPDATE ON rag_chunks
  FOR EACH ROW EXECUTE FUNCTION rag_chunks_touch_updated_at();

-- ── Hybrid search RPC (Reciprocal Rank Fusion) ──────────────────────────────
-- Takes both a query string (for tsvector) and a query embedding (for vector).
-- Returns top match_count chunks ranked by RRF over the two retrieval lists.
-- Reference: Supabase docs · "Hybrid search" · 2026.
DROP FUNCTION IF EXISTS rag_hybrid_search(text, vector(768), int, float, float, int, text[], text[]);
CREATE OR REPLACE FUNCTION rag_hybrid_search(
  query_text         text,
  query_embedding    vector(768),
  match_count        int     DEFAULT 20,
  full_text_weight   float   DEFAULT 1.0,
  semantic_weight    float   DEFAULT 1.0,
  rrf_k              int     DEFAULT 50,
  source_types       text[]  DEFAULT NULL,            -- optional filter
  required_roles     text[]  DEFAULT NULL             -- if set, chunk's visible_to_roles must overlap
)
RETURNS TABLE (
  id              uuid,
  source_type     text,
  source_id       text,
  source_url      text,
  title           text,
  body            text,
  context         text,
  metadata        jsonb,
  pinned          boolean,
  full_text_rank  int,
  semantic_rank   int,
  rrf_score       float
)
LANGUAGE sql STABLE
AS $$
WITH
  ft AS (
    SELECT
      c.id,
      row_number() OVER (
        ORDER BY ts_rank_cd(c.tsv, websearch_to_tsquery('english', query_text)) DESC
      ) AS rank
    FROM rag_chunks c
    WHERE
      websearch_to_tsquery('english', query_text) @@ c.tsv
      AND (source_types IS NULL OR c.source_type = ANY(source_types))
      AND (required_roles IS NULL OR c.visible_to_roles && required_roles)
    LIMIT greatest(match_count * 2, 40)
  ),
  vec AS (
    SELECT
      c.id,
      row_number() OVER (
        ORDER BY c.embedding <=> query_embedding
      ) AS rank
    FROM rag_chunks c
    WHERE
      c.embedding IS NOT NULL
      AND (source_types IS NULL OR c.source_type = ANY(source_types))
      AND (required_roles IS NULL OR c.visible_to_roles && required_roles)
    ORDER BY c.embedding <=> query_embedding
    LIMIT greatest(match_count * 2, 40)
  )
SELECT
  c.id,
  c.source_type,
  c.source_id,
  c.source_url,
  c.title,
  c.body,
  c.context,
  c.metadata,
  c.pinned,
  ft.rank::int                                                    AS full_text_rank,
  vec.rank::int                                                   AS semantic_rank,
  (
    coalesce(1.0 / (rrf_k + ft.rank),  0.0) * full_text_weight  +
    coalesce(1.0 / (rrf_k + vec.rank), 0.0) * semantic_weight   +
    CASE WHEN c.pinned THEN 0.05 ELSE 0.0 END
  ) AS rrf_score
FROM rag_chunks c
LEFT JOIN ft  ON ft.id  = c.id
LEFT JOIN vec ON vec.id = c.id
WHERE ft.id IS NOT NULL OR vec.id IS NOT NULL
ORDER BY rrf_score DESC
LIMIT match_count;
$$;

-- Convenience: pure vector search (used when query_text is sparse / SKU-only)
DROP FUNCTION IF EXISTS rag_vector_search(vector(768), int, text[]);
CREATE OR REPLACE FUNCTION rag_vector_search(
  query_embedding vector(768),
  match_count     int    DEFAULT 6,
  source_types    text[] DEFAULT NULL
)
RETURNS TABLE (
  id            uuid,
  source_type   text,
  source_id     text,
  title         text,
  body          text,
  context       text,
  metadata      jsonb,
  similarity    float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id, c.source_type, c.source_id, c.title, c.body, c.context, c.metadata,
    1.0 - (c.embedding <=> query_embedding) AS similarity
  FROM rag_chunks c
  WHERE c.embedding IS NOT NULL
    AND (source_types IS NULL OR c.source_type = ANY(source_types))
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── RLS: every authenticated user can read; only Owner/Admin/Manager can write ──
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_chunks_read_authed ON rag_chunks;
CREATE POLICY rag_chunks_read_authed
  ON rag_chunks FOR SELECT
  TO authenticated
  USING (
    visible_to_roles IS NULL
    OR visible_to_roles = '{}'::text[]
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = ANY(rag_chunks.visible_to_roles)
    )
  );

DROP POLICY IF EXISTS rag_chunks_write_managers ON rag_chunks;
CREATE POLICY rag_chunks_write_managers
  ON rag_chunks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('Owner','Admin','Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('Owner','Admin','Manager')
    )
  );

-- ── Permissions for anon (pre-auth) so the seeder can run before login ──────
-- Re-tightened by M01 once Auth is enforced. Comment out if running M01 strictly.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON rag_chunks TO anon;
GRANT EXECUTE ON FUNCTION rag_hybrid_search(text, vector(768), int, float, float, int, text[], text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rag_vector_search(vector(768), int, text[]) TO anon, authenticated;

-- ── Seed: a single canary chunk so the table is non-empty after migration ───
INSERT INTO rag_chunks (source_type, source_id, title, body, context, body_hash, metadata)
SELECT
  'sop',
  'rag-canary',
  'RAG Canary',
  'AccentOS RAG migration completed. This is a canary chunk inserted by M42 to verify hybrid search returns rows.',
  'From M42 migration: canary chunk used to verify hybrid search wiring after install.',
  encode(digest('canary','sha256'),'hex'),
  jsonb_build_object('canary', true, 'created_by', 'M42')
WHERE NOT EXISTS (SELECT 1 FROM rag_chunks WHERE source_id = 'rag-canary')
;

-- ── Done ────────────────────────────────────────────────────────────────────
-- After this runs:
--   1. Deploy the Cloudflare Worker at skills/accent-rag/worker/embed-worker.js
--   2. Set the worker URL + secret in AccentOS Settings (RAG section)
--   3. Open Knowledge Engine → Config → "Seed RAG corpus"
--   4. Test in Ask the Engine (Internal mode) — answers should show "Grounded · N sources" pill
