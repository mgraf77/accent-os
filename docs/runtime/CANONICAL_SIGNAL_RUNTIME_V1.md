# CANONICAL_SIGNAL_RUNTIME_V1
**Status:** authoritative · **Supersedes:** all prior signal/alert/efficiency-event narratives from Codex, Claude Code, and Jules lanes.
**Owner:** Signal Governor (this session) · **Frozen at:** 2026-05-15

> This document is the single source of truth for the AccentOS operational signal system. Any divergent description elsewhere in the repo is non-canonical and must be reconciled to this file.

---

## 1. What a Signal is (canonical definition)

A **Signal** is a persisted, addressable, lifecycle-bearing record that some operationally meaningful condition was detected. Signals are the only sanctioned way to surface async operational state across AccentOS.

A Signal is NOT:
- a log line (telemetry_events)
- a UI toast (transient)
- a KPI value (KPI_CATALOG.md X1–X12)
- a build event (build_events)

A Signal IS:
- a row in `alerts` (the canonical signal table, name retained for backward compatibility — see §7)
- a row produced by a registered **generator**
- a record with a **type**, **severity**, **lifecycle status**, **payload**, and **dedupe key**

---

## 2. Canonical sources unified into this model

| Source lane | Concept they used | Canonical mapping |
|---|---|---|
| `js/alerts.js` (Claude Code, v6.10.21–v6.10.22) | "Alert", 9 generators, bell dropdown | Signal · §3, §5 |
| `skills/efficiency-monitor/` | "signals" (retry-loops, redundant-reads, etc.) | Operator-class Signals · §4 |
| `KPI_CATALOG.md` X12 | "Issue escalation rate" | Escalation outcome · §6 |
| `skills/bottleneck-finder/` | leverage ranking | Queue priority basis · §5.3 |
| Codex / Jules prior drafts | "events", "incidents", "notifications" | Re-named to **Signal** · §7 |

There is now ONE word for this concept: **Signal**.

---

## 3. Canonical schema (frozen)

The canonical table is `alerts` (existing M02 schema — not renamed; see §7 for rationale).

```
alerts
  id              UUID PK
  recipient_id    UUID NULL          -- NULL = broadcast
  recipient_role  TEXT NULL
  type            TEXT NOT NULL      -- see §4 type registry
  severity        TEXT NOT NULL      -- info | warn | urgent  (see §4.2)
  title           TEXT NOT NULL
  body            TEXT
  link            TEXT               -- in-app deeplink
  payload         JSONB              -- generator-specific evidence
  status          TEXT NOT NULL      -- unread | read | dismissed | actioned
  created_at      TIMESTAMPTZ
  read_at         TIMESTAMPTZ
```

**Dedupe key (canonical):** `(type, source_id)` derived from `payload.source_id`. Re-running a generator MUST NOT emit a new row for an unresolved key.

---

## 4. Canonical type registry

### 4.1 Operational Signals (business/data domain)
Emitted by generators in `js/alerts.js`. Frozen list:

| type | trigger | severity floor |
|---|---|---|
| `deal_stale`         | 14d+ no update, value ≥ $2K     | warn |
| `coop_deadline`      | coop expires ≤ 14d              | warn |
| `quote_cold`         | quote > 21d open, ≥ $500        | info |
| `inventory_low`      | qty < reorder_point             | warn |
| `delivery_overdue`   | scheduled in past, not done     | urgent |
| `warranty_expiring`  | warranty ends ≤ 30d, open       | warn |
| `showroom_expiring`  | display ends ≤ 14d              | info |
| `po_overdue`         | expected_date past, not received| warn |
| `score_dropped`      | ≥ 3pt drop in last 7d           | warn |

### 4.2 Severity taxonomy (frozen — exactly 3 bands)
- `info` — visibility only; no SLA; no escalation.
- `warn` — operator action expected within working day; eligible for digest.
- `urgent` — operator action expected immediately; eligible for escalation (§6).

There are **no other severity values**. "Critical", "high", "low", "notice" are forbidden.

### 4.3 Operator Signals (meta-class)
Emitted by `efficiency-monitor` against Claude's own behavior. Frozen list:
`retry-loops`, `redundant-reads`, `recurring-sequences`, `skill-bypass`, `clarification-loops`, `redone-wip`.

Operator Signals are written to `skills/efficiency-monitor/efficiency-log.md`, **not** to `alerts`. They share vocabulary but live in a separate sink to keep operator-facing queues clean. (See §9 entropy risk.)

---

## 5. Lifecycle model (frozen)

### 5.1 States and transitions
```
        [generator emits]
              │
              ▼
          ┌────────┐
          │ unread │──── read ────►┌──────┐
          └────────┘                │ read │
              │                     └──────┘
              │                       │
              │                       ▼
              │                 ┌──────────┐
              ├──── dismiss ───►│dismissed │  (terminal)
              │                 └──────────┘
              ▼
        ┌──────────┐
        │ actioned │  (terminal — operator did the thing)
        └──────────┘
```

Allowed transitions:
- `unread → read`        (auto on view OR explicit)
- `unread → dismissed`   (operator declines)
- `unread → actioned`    (operator did it without reading first)
- `read    → actioned`
- `read    → dismissed`

Forbidden: any transition from a terminal state. Re-detecting the same condition produces a **new** Signal only if no non-terminal Signal exists for that dedupe key.

### 5.2 Auto-aging
Not implemented in V1. Reserved for V2.

### 5.3 Queue priority (read order)
Canonical sort: `severity DESC (urgent→info), created_at DESC`.
Topbar bell shows top-5 unread under this ordering. No other ordering is canonical.

---

## 6. Escalation model (frozen, minimal)

V1 escalation is **passive**: severity is set at emit time and never auto-promoted.

- `urgent` Signals unread for > 24h count toward KPI **X12 (Issue escalation rate)**.
- No paging, no email, no SMS in V1. Out of scope and forbidden until governance §9 risks are addressed.

`shouldEscalate(signal) := signal.severity = 'urgent' AND signal.status = 'unread' AND age(signal) > 24h`

---

## 7. Naming rationale (why `alerts` table is not renamed)

- The table is shipped (v6.10.21), indexed, RLS-policied, and referenced by `js/alerts.js` and the topbar bell.
- Renaming = a runtime rewrite, which is FORBIDDEN for this session.
- Resolution: **conceptual name is "Signal"; physical table remains `alerts`**. All new code MUST use the word Signal in identifiers; SQL identifiers remain `alerts.*`. This is the only sanctioned divergence.

---

## 8. Boundaries of automation (frozen)

Generators MAY:
- read any table they have RLS access to
- insert into `alerts` with proper dedupe
- write `payload.source_id` for dedupe

Generators MUST NOT:
- mutate domain tables
- send external notifications (email/SMS/webhook)
- transition signal status (only operators or the UI do that)
- emit Signals of types not in §4.1

---

## 9. Forward references
- Governance terms: `SIGNAL_GOVERNANCE_STANDARD_V1.md`
- Primitive function contracts: `SIGNAL_RUNTIME_CANONICAL_PRIMITIVES.md`
- Phase order to build the next capabilities: `SIGNAL_IMPLEMENTATION_SEQUENCE_V1.md`
- Known risks to this model: `SIGNAL_ENTROPY_RISKS.md`
