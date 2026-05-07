# Proposed schema — `action_queue`
> Schema for the `action_queue` table that this skill writes to. Until Michael runs this in Supabase SQL Editor, the skill operates in dry-run mode (emits SQL paste blocks instead of executing). Companion skill `action-queue` is the primary consumer; `next-action-recommender` and `daily-brief-composer` are secondary readers.

## DDL — paste into Supabase SQL Editor

```sql
-- Project: hsyjcrrazrzqngwkqsqa (AccentOS / Accent Lighting)
-- Adds: action_queue (the L4 "drafted actions" surface from the Capability Ladder)
-- Reads from: alerts, vendor_scores, pipeline_deals, coop_tracker (M02)
-- Writers: alert-router, next-action-recommender, coop-claim-drafter
-- Readers: action-queue (UI), daily-brief-composer

CREATE TABLE IF NOT EXISTS action_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  signal_type     TEXT NOT NULL,                                   -- one of the 9 + 'unknown'
  owner_role      TEXT NOT NULL CHECK (owner_role IN ('Owner','Manager','Sales','Warehouse','Marketing','Ops','Admin')),
  suggested_skill TEXT NOT NULL,                                   -- e.g. 'email-drafter'
  suggested_action TEXT NOT NULL,                                  -- verb-phrase, ≤120 chars
  urgency_tier    SMALLINT NOT NULL CHECK (urgency_tier IN (1,2,3)),
  severity        TEXT NOT NULL DEFAULT 'warn' CHECK (severity IN ('info','warn','urgent')),
  dedup_key       TEXT NOT NULL,                                   -- e.g. 'coop_deadline:coop_id=42'
  status          TEXT NOT NULL DEFAULT 'PROPOSED'
                  CHECK (status IN ('PROPOSED','IN_PROGRESS','DONE','SUPERSEDED','DISMISSED')),
  merged_into     UUID REFERENCES action_queue(id) ON DELETE SET NULL,
  escalation_at   TIMESTAMPTZ,                                     -- when this row goes stale
  escalated_at    TIMESTAMPTZ,                                     -- when re-route fired
  link            TEXT,
  payload         JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_action_queue_dedup
  ON action_queue (dedup_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_queue_owner_status
  ON action_queue (owner_role, status, urgency_tier, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_queue_escalation
  ON action_queue (escalation_at)
  WHERE status IN ('PROPOSED','IN_PROGRESS');

-- 24h dedup window — partial unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS uniq_action_queue_dedup_24h
  ON action_queue (dedup_key)
  WHERE created_at > NOW() - INTERVAL '24 hours'
    AND status IN ('PROPOSED','IN_PROGRESS');

-- RLS
ALTER TABLE action_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY action_queue_read_role ON action_queue FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('Owner','Admin','Manager')
    OR owner_role = (auth.jwt() ->> 'role')
  );

CREATE POLICY action_queue_write_router ON action_queue FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('Owner','Admin','Manager'));

CREATE POLICY action_queue_update_owner ON action_queue FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('Owner','Admin','Manager')
    OR owner_role = (auth.jwt() ->> 'role')
  );
```

## Field notes

- `signal_type` mirrors `alerts.type` so joins are 1:1. Keep them in lock-step when extending to a 10th signal.
- `dedup_key` is the contract — `alert-router` won't write a row without one. Format: `signal_type:key=value`.
- `escalation_at` is computed by the router at insert time; UI can re-render countdowns from it.
- `merged_into` enables the audit trail for duplicate-merging — the survivor row is the canonical one.

## Why partial unique index, not full

Full unique on `dedup_key` would prevent the same alert ever firing again — but a `coop_deadline` alert for the same vendor is a real signal next quarter. The 24h partial window is what dedups noise (the same generator firing every hydrate cycle) without suppressing legitimate re-occurrences.

## When this lands in `sql/`

Once Michael adopts this schema, the canonical home is a new `sql/M41_action_queue.sql` file (M40 is taken — see `sql/M40_user_module_overrides.sql`). Until then, this file is the source of truth and `alert-router` runs in dry-run mode emitting INSERT statements as paste-ready SQL blocks.
