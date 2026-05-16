-- M49 — Minimal SQL-Backed Signal Runtime
-- Additive only. No changes to existing tables.
-- Implements:
--   * signal_queue           — durable queue
--   * signal_effect_log      — idempotency barrier
--   * signal_dead_letter     — terminal failures + unknown signal types
--   * RPCs claim/finalize/retry/dead_letter using FOR UPDATE SKIP LOCKED
--   * lightweight updated_at trigger
--
-- Run once. Idempotent (IF NOT EXISTS / OR REPLACE).
-- After applying: tell Claude "M49 done — signal runtime schema applied."

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SIGNAL_QUEUE — durable inbox
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signal_queue (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_type       text          NOT NULL,
  payload           jsonb         NOT NULL DEFAULT '{}',
  idempotency_key   text          NOT NULL,
  status            text          NOT NULL DEFAULT 'pending',
                    -- pending | leased | succeeded | failed | dead
  attempts          int           NOT NULL DEFAULT 0,
  max_attempts      int           NOT NULL DEFAULT 5,
  next_visible_at   timestamptz   NOT NULL DEFAULT now(),
  leased_until      timestamptz,
  leased_by         text,
  last_error        text,
  enqueued_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  finalized_at      timestamptz
);

-- One signal per (type, idempotency_key) — enqueue is naturally dedup-safe
CREATE UNIQUE INDEX IF NOT EXISTS uq_signal_queue_idem
  ON signal_queue (signal_type, idempotency_key);

-- Worker hot-path: pending rows ready to lease, oldest first
CREATE INDEX IF NOT EXISTS idx_signal_queue_ready
  ON signal_queue (status, next_visible_at)
  WHERE status IN ('pending','leased');

CREATE INDEX IF NOT EXISTS idx_signal_queue_type
  ON signal_queue (signal_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SIGNAL_EFFECT_LOG — effect idempotency barrier
-- A handler MUST insert here BEFORE applying side effects.
-- UNIQUE (idempotency_key, effect_type) makes replays inert.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signal_effect_log (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id         uuid          REFERENCES signal_queue(id) ON DELETE SET NULL,
  idempotency_key   text          NOT NULL,
  effect_type       text          NOT NULL,
  outcome           text          NOT NULL DEFAULT 'started',
                    -- started | success | failure
  detail            jsonb         DEFAULT '{}',
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, effect_type)
);

CREATE INDEX IF NOT EXISTS idx_signal_effect_log_signal
  ON signal_effect_log (signal_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SIGNAL_DEAD_LETTER — terminal failures
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signal_dead_letter (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id         uuid,
  signal_type       text          NOT NULL,
  payload           jsonb         NOT NULL DEFAULT '{}',
  idempotency_key   text,
  attempts          int           NOT NULL DEFAULT 0,
  reason            text          NOT NULL,
  last_error        text,
  dead_lettered_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_dead_letter_type
  ON signal_dead_letter (signal_type, dead_lettered_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. updated_at TRIGGER (lightweight)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sig_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signal_queue_updated_at ON signal_queue;
CREATE TRIGGER trg_signal_queue_updated_at
  BEFORE UPDATE ON signal_queue
  FOR EACH ROW EXECUTE FUNCTION sig_touch_updated_at();

DROP TRIGGER IF EXISTS trg_signal_effect_log_updated_at ON signal_effect_log;
CREATE TRIGGER trg_signal_effect_log_updated_at
  BEFORE UPDATE ON signal_effect_log
  FOR EACH ROW EXECUTE FUNCTION sig_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS — runtime tables are owner/admin-only from the browser.
-- The worker loop runs in authenticated sessions; tighten to your needs.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE signal_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_effect_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_dead_letter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signal_queue_rw"       ON signal_queue;
DROP POLICY IF EXISTS "signal_effect_log_rw"  ON signal_effect_log;
DROP POLICY IF EXISTS "signal_dead_letter_rw" ON signal_dead_letter;

-- NOTE (Session 46 / M51): policies below use `user_profiles.user_id`
-- (PK column on user_profiles). The original M49 used unqualified `id`,
-- which Postgres bound to the outer table's `id` column (no `id` exists
-- on user_profiles) and produced a tautology-false WITH CHECK → 403 on
-- every direct INSERT/UPDATE from a user JWT. See sql/M51_signal_rls_fix.sql.
CREATE POLICY "signal_queue_rw" ON signal_queue
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  );

CREATE POLICY "signal_effect_log_rw" ON signal_effect_log
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  );

CREATE POLICY "signal_dead_letter_rw" ON signal_dead_letter
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPCs — atomic queue ops
-- All run as SECURITY DEFINER so the worker can use a single short-lived
-- transaction with FOR UPDATE SKIP LOCKED, which is impossible to express
-- safely from the REST layer.
-- ─────────────────────────────────────────────────────────────────────────────

-- 6a. Enqueue — dedup on (signal_type, idempotency_key)
CREATE OR REPLACE FUNCTION sig_enqueue(
  p_signal_type     text,
  p_payload         jsonb,
  p_idempotency_key text,
  p_max_attempts    int  DEFAULT 5
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO signal_queue (signal_type, payload, idempotency_key, max_attempts)
  VALUES (p_signal_type, COALESCE(p_payload,'{}'::jsonb), p_idempotency_key, COALESCE(p_max_attempts,5))
  ON CONFLICT (signal_type, idempotency_key) DO UPDATE
    SET updated_at = now()  -- noop touch; preserves original
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 6b. Claim — atomically lease up to N pending signals
CREATE OR REPLACE FUNCTION sig_claim(
  p_worker_id    text,
  p_batch_size   int  DEFAULT 5,
  p_lease_secs   int  DEFAULT 60
) RETURNS SETOF signal_queue
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Reclaim expired leases first (sweep stale 'leased' rows back to 'pending')
  UPDATE signal_queue
     SET status = 'pending',
         leased_until = NULL,
         leased_by = NULL
   WHERE status = 'leased'
     AND leased_until IS NOT NULL
     AND leased_until < now();

  RETURN QUERY
  WITH cte AS (
    SELECT id
      FROM signal_queue
     WHERE status = 'pending'
       AND next_visible_at <= now()
     ORDER BY next_visible_at ASC
     LIMIT GREATEST(1, COALESCE(p_batch_size, 5))
     FOR UPDATE SKIP LOCKED
  )
  UPDATE signal_queue q
     SET status        = 'leased',
         attempts      = q.attempts + 1,
         leased_until  = now() + make_interval(secs => GREATEST(5, COALESCE(p_lease_secs,60))),
         leased_by     = p_worker_id
    FROM cte
   WHERE q.id = cte.id
   RETURNING q.*;
END;
$$;

-- 6c. Finalize — mark success
CREATE OR REPLACE FUNCTION sig_finalize(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE signal_queue
     SET status = 'succeeded',
         finalized_at = now(),
         leased_until = NULL,
         leased_by = NULL,
         last_error = NULL
   WHERE id = p_id;
END;
$$;

-- 6d. Retry — backoff & re-queue
CREATE OR REPLACE FUNCTION sig_retry(
  p_id           uuid,
  p_error        text,
  p_backoff_secs int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE signal_queue
     SET status = 'pending',
         leased_until = NULL,
         leased_by = NULL,
         next_visible_at = now() + make_interval(secs => GREATEST(1, p_backoff_secs)),
         last_error = p_error
   WHERE id = p_id;
END;
$$;

-- 6e. Dead-letter — terminal
CREATE OR REPLACE FUNCTION sig_dead_letter(
  p_id     uuid,
  p_reason text,
  p_error  text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row signal_queue%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM signal_queue WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO signal_dead_letter
    (signal_id, signal_type, payload, idempotency_key, attempts, reason, last_error)
  VALUES
    (v_row.id, v_row.signal_type, v_row.payload, v_row.idempotency_key,
     v_row.attempts, p_reason, COALESCE(p_error, v_row.last_error));

  UPDATE signal_queue
     SET status = 'dead',
         finalized_at = now(),
         leased_until = NULL,
         leased_by = NULL,
         last_error = COALESCE(p_error, last_error)
   WHERE id = p_id;
END;
$$;

-- 6f. Unknown-signal direct dead-letter (bypass queue if dispatcher rejects pre-enqueue)
CREATE OR REPLACE FUNCTION sig_dead_letter_unknown(
  p_signal_type     text,
  p_payload         jsonb,
  p_idempotency_key text,
  p_reason          text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO signal_dead_letter
    (signal_type, payload, idempotency_key, reason)
  VALUES
    (p_signal_type, COALESCE(p_payload,'{}'::jsonb), p_idempotency_key, p_reason)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 6g. Metrics snapshot (single-row JSON for cheap polling)
CREATE OR REPLACE FUNCTION sig_metrics() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'queue_depth_pending',
      (SELECT count(*) FROM signal_queue WHERE status='pending'),
    'queue_depth_leased',
      (SELECT count(*) FROM signal_queue WHERE status='leased'),
    'oldest_pending_age_secs',
      (SELECT COALESCE(EXTRACT(EPOCH FROM (now() - MIN(enqueued_at)))::int, 0)
         FROM signal_queue WHERE status='pending'),
    'effect_success_count',
      (SELECT count(*) FROM signal_effect_log WHERE outcome='success'),
    'effect_failure_count',
      (SELECT count(*) FROM signal_effect_log WHERE outcome='failure'),
    'dead_letter_count',
      (SELECT count(*) FROM signal_dead_letter),
    'snapshot_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
$$;

-- Done.
