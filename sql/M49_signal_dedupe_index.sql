-- ════════════════════════════════════════════════════════════
-- M49 — Signal dedupe partial unique index (Phase 1 hardening)
-- ════════════════════════════════════════════════════════════
-- Source of truth: docs/runtime/CANONICAL_SIGNAL_RUNTIME_V1.md §3
--                  docs/runtime/SIGNAL_RUNTIME_CANONICAL_PRIMITIVES.md §6
--                  docs/runtime/SIGNAL_ENTROPY_RISKS.md R4, R9
--
-- Purpose: durable backstop against duplicate unresolved Signals for the same
--   (type, source_id) dedupe key. The generator-side check in js/signals.js
--   (shouldSuppress + createSignal) is the primary guard; this index is the
--   DB-side guarantee that two concurrent tabs / a stale cache cannot bypass
--   it.
--
-- Safety:
--   * Additive only — no schema changes to the `alerts` table.
--   * Partial: filtered to non-terminal lifecycle states (unread, read).
--     Terminal Signals (dismissed, actioned) do NOT participate in dedupe,
--     matching §5 of the runtime doc ("dismissed alerts can re-emerge").
--   * Pre-existing rows without `payload->>'source_id'` evaluate to NULL,
--     and Postgres treats distinct NULLs as non-equal in unique indexes,
--     so legacy data does not block creation.
--   * IF NOT EXISTS keeps this idempotent for re-runs.
--   * CONCURRENTLY is NOT used so this can run inside the standard migration
--     transaction. The `alerts` table is small in V1; expected creation is
--     sub-second.
--
-- Rollback: DROP INDEX IF EXISTS uq_alerts_signal_dedupe;
-- ════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_signal_dedupe
  ON alerts (type, (payload->>'source_id'))
  WHERE status IN ('unread','read');

-- Companion read index: speeds up shouldSuppress() lookups by the same key.
CREATE INDEX IF NOT EXISTS idx_alerts_dedupe_lookup
  ON alerts (type, (payload->>'source_id'), status);
