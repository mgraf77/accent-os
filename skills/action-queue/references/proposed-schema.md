# action_queue — proposed Supabase schema
> Paste-once DDL Michael runs in the Supabase SQL Editor at https://hsyjcrrazrzqngwkqsqa.supabase.co/project/_/sql to unblock the `action-queue` skill. No `sql/*.sql` migration file is authored — per AccentOS hard rule, schemas live in skill `references/` until Michael executes them.

This file documents the table, enums, indexes, and RLS posture for the **L6 autonomous-execution backbone** described in MASTER §14 ("Michael approves two, dismisses one, and the approved actions execute automatically"). Once the DDL below runs against `hsyjcrrazrzqngwkqsqa`, the `action-queue` skill's Step 0 BLOCKED gate passes and the skill activates without further code changes.

---

## Design intent

- **Single ledger** for every action AccentOS proposes on Accent Lighting's behalf — drafted emails, co-op claim drafts, BigCommerce price-change pushes, Klaviyo flow triggers, alert routings, churn-prevention nudges.
- **Five-state machine**: `PROPOSED → APPROVED → EXECUTED → ARCHIVED` with `DISMISSED` as the off-ramp from `PROPOSED` or `APPROVED`.
- **Idempotency-first**: a unique `idempotency_key` prevents double-queue when a producer skill retries.
- **Audit-permanent**: dismissal and archival are state transitions, never `DELETE`s.
- **Executor-agnostic**: the queue does not run business logic — it routes APPROVED rows to the executor skill named in `executor-registry.md`.

---

## DDL — paste this entire block into the Supabase SQL Editor once

```sql
-- ────────────────────────────────────────────────────────────────────────────
-- action_queue — AccentOS L6 autonomous-execution ledger
-- Project: hsyjcrrazrzqngwkqsqa  (Accent Lighting)
-- Skill:   /home/user/accent-os/skills/action-queue/SKILL.md
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Enums --------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE action_state AS ENUM (
    'PROPOSED',
    'APPROVED',
    'EXECUTED',
    'DISMISSED',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE action_type_enum AS ENUM (
    'send_email',
    'claim_coop',
    'update_bc_product',
    'send_klaviyo_flow',
    'route_alert',
    'churn_nudge',
    'vendor_outreach',
    'price_change_push'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Table --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.action_queue (
  id                 uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_at        timestamptz      NOT NULL DEFAULT NOW(),
  proposed_by_skill  text             NOT NULL,
  action_type        action_type_enum NOT NULL,
  payload            jsonb            NOT NULL,
  state              action_state     NOT NULL DEFAULT 'PROPOSED',
  approved_at        timestamptz,
  approved_by        uuid,
  executed_at        timestamptz,
  executor_result    jsonb,
  dismissed_reason   text,
  idempotency_key    text             NOT NULL UNIQUE,
  CONSTRAINT action_queue_state_machine CHECK (
    (state = 'PROPOSED'  AND approved_at IS NULL  AND executed_at IS NULL) OR
    (state = 'APPROVED'  AND approved_at IS NOT NULL AND executed_at IS NULL) OR
    (state = 'EXECUTED'  AND approved_at IS NOT NULL AND executed_at IS NOT NULL) OR
    (state = 'DISMISSED' AND dismissed_reason IS NOT NULL) OR
    (state = 'ARCHIVED'  AND executed_at IS NOT NULL)
  )
);

-- 3. Indexes ------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_action_queue_state_proposed_at
  ON public.action_queue (state, proposed_at);

CREATE INDEX IF NOT EXISTS idx_action_queue_action_type
  ON public.action_queue (action_type);

CREATE INDEX IF NOT EXISTS idx_action_queue_proposed_by_skill
  ON public.action_queue (proposed_by_skill);

CREATE INDEX IF NOT EXISTS idx_action_queue_payload_gin
  ON public.action_queue USING gin (payload);

-- 4. Row-Level Security -------------------------------------------------------
-- AccentOS is single-tenant (Accent Lighting). RLS is enabled but service-role
-- key bypasses; downstream views can layer per-user restrictions later.

ALTER TABLE public.action_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS action_queue_service_all ON public.action_queue;
CREATE POLICY action_queue_service_all
  ON public.action_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Sanity check -------------------------------------------------------------

SELECT 'action_queue ready' AS status,
       to_regclass('public.action_queue') AS table_oid;
```

---

## Column reference

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` | no | PK, server-generated `gen_random_uuid()`. |
| `proposed_at` | `timestamptz` | no | When the producer skill called `propose`. |
| `proposed_by_skill` | `text` | no | Origin skill name (e.g. `email-drafter`, `churn-predictor`). |
| `action_type` | `action_type_enum` | no | Must match a row in `executor-registry.md`. |
| `payload` | `jsonb` | no | Action-specific data. Shape per `action_type` documented in registry. |
| `state` | `action_state` | no | Defaults `PROPOSED`. Transitions enforced by check constraint. |
| `approved_at` | `timestamptz` | yes | Set by Step 3 (approve). |
| `approved_by` | `uuid` | yes | Auth user id (Michael) — `auth.uid()` from the call site. |
| `executed_at` | `timestamptz` | yes | Set by Step 5 (execute) on success only. |
| `executor_result` | `jsonb` | yes | Structured return from the executor skill. Includes `{"error": ...}` on failure. |
| `dismissed_reason` | `text` | yes | Required when state moves to `DISMISSED`. ≥ 5 chars enforced in skill, not DB. |
| `idempotency_key` | `text` | no | UNIQUE. Caller-supplied or derived `sha256(action_type \|\| canonical_payload \|\| proposed_by_skill)`. |

---

## State-machine guarantees enforced at DB level

The `action_queue_state_machine` CHECK constraint blocks impossible combinations:

- `PROPOSED` rows have no `approved_at` and no `executed_at`.
- `APPROVED` rows have `approved_at` but no `executed_at`.
- `EXECUTED` rows have both.
- `DISMISSED` rows have a non-null `dismissed_reason`.
- `ARCHIVED` rows must have been executed first (`executed_at IS NOT NULL`).

Application-level transitions in `SKILL.md` Steps 3–6 also enforce ordering — the DB constraint is the second line of defence.

---

## Sample queries the skill issues

**Step 1 — propose (insert, idempotent):**
```sql
INSERT INTO action_queue
  (action_type, payload, proposed_by_skill, idempotency_key)
VALUES
  ($1, $2::jsonb, $3, $4)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id, state, proposed_at;
```

**Step 2 — list pending:**
```sql
SELECT id, proposed_at, proposed_by_skill, action_type, idempotency_key
FROM action_queue
WHERE state = 'PROPOSED'
ORDER BY proposed_at ASC
LIMIT 50;
```

**Step 2 footer — depth tile (used by `daily-brief-composer`):**
```sql
SELECT state, COUNT(*) AS n
FROM action_queue
WHERE state IN ('PROPOSED', 'APPROVED', 'EXECUTED', 'DISMISSED')
GROUP BY state;
```

**Step 3A — single approve:**
```sql
UPDATE action_queue
SET state = 'APPROVED', approved_at = NOW(), approved_by = $1
WHERE id = $2 AND state = 'PROPOSED'
RETURNING id, action_type, payload;
```

**Step 5 — record execution result:**
```sql
UPDATE action_queue
SET state = 'EXECUTED', executed_at = NOW(), executor_result = $1::jsonb
WHERE id = $2 AND state = 'APPROVED'
RETURNING id, action_type, executed_at;
```

**Step 6 — archive sweep:**
```sql
UPDATE action_queue
SET state = 'ARCHIVED'
WHERE state = 'EXECUTED' AND executed_at < NOW() - INTERVAL '30 days';
```

---

## How the skill detects "schema is provisioned"

`SKILL.md` Step 0 runs:

```sql
SELECT to_regclass('public.action_queue') AS exists;
```

If `exists IS NULL` → emit BLOCKED stub pointing here. If non-null, also verify both enums:

```sql
SELECT
  (SELECT 1 FROM pg_type WHERE typname = 'action_state')     AS state_enum,
  (SELECT 1 FROM pg_type WHERE typname = 'action_type_enum') AS type_enum;
```

Both must return `1`. If either is null → re-emit BLOCKED stub. Otherwise proceed.

---

## Adding a new action_type later

1. Add the new value to the `action_type_enum`:
   ```sql
   ALTER TYPE action_type_enum ADD VALUE IF NOT EXISTS 'new_type_name';
   ```
2. Add the corresponding row to `executor-registry.md`.
3. Forge the executor skill if it doesn't exist (`skill-forge` handles this).

The skill never adds enum values automatically — Michael runs the `ALTER TYPE` once per new action_type. This keeps the production-safety boundary intact.
