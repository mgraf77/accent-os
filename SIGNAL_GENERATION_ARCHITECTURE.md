# SIGNAL_GENERATION_ARCHITECTURE.md
> Ingestion → normalization → events → signals → routing — v1
> Architecture, not implementation. Bias: SMB realism, durability, low ops cost.

## Hard constraints (re-stated)

- No Kafka, no Pulsar, no event-sourcing rewrite, no microservice sprawl.
- AccentOS already runs on Cloudflare Workers + KV/D1 + Supabase. New infra must justify itself in operational pain prevented, not pattern matching.
- Authoritative systems remain authoritative: Windward (ERP), BigCommerce (storefront), Data52/Lights America (catalog). AccentOS is a **thin cache + intelligence layer**, never a system-of-record replacement.
- The signal layer must be **durable across deploys**, **auditable**, **replayable**, and **operable by one engineer**.

## The five-stage pipeline

```
┌──────────┐   ┌──────────────┐   ┌────────┐   ┌─────────┐   ┌───────────┐
│ Ingestion├──▶│ Normalization├──▶│ Events ├──▶│ Signals ├──▶│ Routing & │
│          │   │              │   │        │   │         │   │ Surfacing │
└──────────┘   └──────────────┘   └────────┘   └─────────┘   └───────────┘
   pull/push      schema map       facts        decisions      dashboards
   export-first   typed records    immutable    typed, owned   notifications
```

Each stage has a sharp contract. **Skipping a stage is forbidden** — it is what turns event platforms into spaghetti.

## Stage 1 — Ingestion

**Job**: get bytes from source systems into AccentOS, on a schedule or on push, with idempotency.

- **Export-first.** Where a system can write CSV/JSON to S3/R2 on a schedule (Windward), prefer that over polling the live API.
- **Polling with cursors** where exports aren't available. Cursors persist; never poll from scratch.
- **Webhooks** for BigCommerce/Klaviyo where reliable. Webhook receivers are *idempotent* and write to the same staging tables as polling.
- **Raw payloads are persisted unchanged** in `ingest_raw.<source>` with `(source, payload_hash, received_at)` for replay.
- **No transformation at this stage.** Get the bytes safe, then decide what they mean.

**Failure semantics**: ingestion failure is a `sys.integration_down` signal candidate. Ingestion retries with exponential backoff (max 3) then surfaces.

**Cadences (defaults)**:
- Windward: hourly export + 15-min delta cache
- BigCommerce: webhooks + 1h reconciliation pull
- Data52: daily
- Klaviyo: 1h
- Stripe / payments (when present): webhook + daily reconciliation

## Stage 2 — Normalization

**Job**: turn raw payloads into **typed, internally consistent records** that the rest of AccentOS can reason about.

- **Canonical entities**: `product`, `sku`, `customer`, `vendor`, `purchase_order`, `sales_order`, `quote`, `shipment`, `inventory_snapshot`, `price_point`, `campaign`, `session`.
- **Stable internal IDs**, with source-of-truth foreign keys preserved.
- **Schema versioning**: every normalizer outputs records tagged with a `schema_version`. Breaking changes bump version; old consumers continue working until migrated.
- **Idempotent upserts** keyed on `(source, source_id)`.
- **No business logic here.** Normalization is shape-only.

This is the *thin cache* in the architecture doctrine. It is **not** a warehouse. We hold what we need to reason about signals — current state plus enough history for delta detection (see OPERATIONAL_DELTA_MODEL.md). Long-tail history stays in source systems.

## Stage 3 — Events

**Job**: emit **immutable facts** when something changed in the normalized layer.

- An event says: "PO 12345 transitioned from `open` to `received` at T".
- Events are **append-only**, never updated.
- Events carry: `event_id`, `event_type`, `entity_type`, `entity_id`, `occurred_at`, `payload_snapshot`, `source`, `schema_version`.
- **Events ≠ signals.** Events are factual; signals are interpreted.
- Events power **replay**: re-running signal generation against the event log must produce the same signals.

**Storage**: a single `events` table (Postgres) is sufficient for SMB scale. Partition by month, archive after 18 months to cold storage. No Kafka. If we ever exceed ~10M events/month, revisit — until then, the table is the queue.

**Generation**: events are produced by:
- normalizer transitions (state change detection)
- webhook receivers (already factual)
- scheduled diffing (compare today's snapshot to yesterday's — common for inventory, vendor metrics)

## Stage 4 — Signal generation

**Job**: read events + normalized state, evaluate signal rules, emit typed signals.

### Rule shape

Each signal in the taxonomy is implemented as a **rule** with:

```
rule_id            stable identifier matching signal_name
predicate          SQL or function returning candidate entities
severity_fn        determines severity (often delta-driven)
owner_fn           determines owner_role
recommended_action templated by signal context
volume_gate        from delta model
cadence            event-driven or scheduled
```

### Rule execution

- **Event-driven rules** run when relevant events arrive (e.g. `po.received` → check `po.receiving_variance`).
- **Scheduled rules** run on cron (hourly, daily, weekly) — most delta and trend rules live here.
- Rules read only from normalized tables + baselines table + recent events. Rules **do not** call source systems.
- Rules are **pure functions** of (state, baselines). This is what makes them replayable.

### Signal record

When a rule fires, AccentOS writes one row to `signals`:

```
signal_id         UUID
signal_name       FK to taxonomy
severity          enum
entity_type, entity_id
owner_role
trigger_snapshot  JSON: the values that fired the rule
recommended_action
created_at
rule_version
resolved_at       NULL until self-resolved or acknowledged
```

Signals are **immutable except for `resolved_at` and `acknowledged_at`**.

### Deduplication

Before write: check for an *open* signal with same `(signal_name, entity_id)` within cooldown. If present, update only the trigger_snapshot's `last_observed_at` — do not emit a new signal, do not re-notify.

This is how we keep the signals table from becoming a log file.

## Stage 5 — Routing & surfacing

**Job**: get signals to the right humans at the right urgency. Covered fully in COMMAND_SURFACE_PRIORITIZATION.md.

Brief summary:
- Routing decision happens *once*, at signal write.
- Decision references the severity model (notification, suppression, cooldown).
- Surfacing is read-side: dashboards, feeds, digests all query the `signals` table with role-specific filters.

## Persistence philosophy

- **Postgres (Supabase) is the durable store** for normalized records, events, signals, baselines, audit.
- **KV / R2** is the staging area for raw ingest payloads and exports.
- **No separate analytics store in Phase 1.** Postgres + materialized views is enough for SMB scale. We earn warehousing only if measurably needed.
- **Retention defaults**:
  - raw payloads: 90 days
  - events: 18 months hot, archive after
  - signals: 365 days hot, archive after
  - baselines: 24 months rolling
  - audit: 365 days minimum

## Auditability

For every signal, AccentOS can reconstruct:
1. Which events contributed (event_ids in trigger_snapshot)
2. Which rule version produced it
3. What baseline was used
4. What routing decisions were taken
5. Acknowledgement & resolution timeline

Audit is a read-only view over the existing tables — not a separate service.

## Replayability

A core architectural property:

> Given the same events and baselines, signal generation must produce the same signals.

This implies:
- Rules must be pure
- Baselines must be timestamped and queryable as-of a date
- Source-system calls are forbidden inside rules

Replay enables:
- Backtesting new signals against history
- Investigating "why didn't this fire?" post-incident
- Migrating rule versions without losing history

## Orchestration (the lightweight kind)

- A single **scheduler** (Cloudflare Cron Triggers or pg_cron) runs scheduled rules.
- Event-driven rules are triggered by the normalizer pipeline writing to events and a small dispatcher reading the event tail.
- **No DAG engine.** If we need one, we've lost the plot.
- Concurrency limits per rule (default 1 — rules are cheap and idempotent).

## What we are explicitly NOT building

- No Kafka / event bus
- No Airflow / Dagster / Prefect
- No dedicated stream processor
- No microservices for signal categories
- No ML inference service in Phase 1
- No real-time websocket fanout to clients (HTTP polling at 30s is fine for dashboards)
- No write-through ERP coupling

The boring stack is the durable stack.

## Failure modes & their handling

| Failure | Detection | Response |
|---|---|---|
| Source export missed | `sys.export_missed` signal | retry + alert sysops |
| Normalizer schema break | exception + dead-letter row | pause normalizer, alert |
| Rule throws | exception logged, rule disabled after 3 consecutive fails | sysops signal |
| Signal write fails | retry, then dead-letter | sysops signal |
| Baseline missing | rules degrade to info-only | nightly baseline rebuild |
| Storm (see severity model) | auto-suppress, meta-signal | sysops investigates source |

## Phase 1 architecture scope

Phase 1 ships only:
- Stage 1: ingestion for Windward + BigCommerce (already exist; harden idempotency + raw retention)
- Stage 2: normalize the 12–15 entities needed for Phase 1 signals
- Stage 3: events for the ~6 transitions Phase 1 signals care about
- Stage 4: 12–15 rules, half level-based, five delta-based
- Stage 5: one role dashboard, daily digest, push for CRIT/EMRG only

Everything else is later. The architecture exists to allow later — not to ship it on day one.
