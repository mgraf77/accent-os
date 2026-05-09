# AccentOS — Runtime Terminology

**Mode:** Vocabulary normalization. One term = one meaning across the corpus.
**Authority:** Constitutional vocabulary. Future docs use these definitions verbatim. Deviations are a documentation defect.

---

## 1. Core nouns

### actor

A named identity that can submit a command or be the emitter of an event. **Three actor classes:**

- **Human actor** — authenticated person with stable `actor_id` and one or more role memberships.
- **`system`** — the runtime itself (engines, scheduled checks, system-derived events).
- **`ai`** — a registered AI capability emitting via the suggestion lifecycle. Carries `capability_id` + `model_identity`.

Anonymous actors are forbidden (R18). Customers and vendors are **not** actors — they are subjects (or sources, see *adapter*).

### subject

A typed operational entity carrying its own state machine and timeline: `lead | opportunity | quote | spec | job | po | inventory | service_ticket | escalation | handoff | suggestion | session | adapter | registry | runtime`. Every subject has at most one **owner** at a time.

### event

A past-tense, immutable, attributable, time-stamped fact persisted in the event store. Format: `<domain>.<entity>.<verb>` (e.g. `sales.lead.claimed`). Source of operational truth. Events are never edited; corrections are new typed events referencing predecessors.

### command

An imperative, present-tense intent submitted by an actor (or system on actor's behalf). Format: `<domain>.<entity>.<imperative-verb>` (e.g. `sales.lead.claim`). **Commands are not facts.** Valid commands produce ≥1 event (success chain or typed rejection). Commands are not persisted as the source of truth; the events they produce are.

### projection

A read model derived from the event stream. Never canonical. Two flavors:

- **Materialized** — pre-computed, queried by readers (CC tiles, role queues, telemetry rollups).
- **Read-time** — computed on read for narrow, lag-sensitive needs.

Projections are **rebuildable** from the event store and **idempotent** under replay. Projections do not cause side effects.

### registry

A typed governance artifact. Configuration with audit. Every edit is a typed event; history is preserved. Ten registries: event-type, role, priority, SLA, AI-policy, reversibility, coverage, quiet-hours, escalation, command-authority. Registries are the **only** source for their concern; no side-channel config.

### adapter

A bounded translator between the runtime and an external system. Five classes: inbound parser, outbound sender, two-way sync, AI inference, sensor/telemetry. Adapters translate, they don't decide. Each emits typed events with stable idempotency keys; degrades visibly via `adapter.degraded` events.

### handoff

A typed event with a five-part contract: readiness predicate → packet → named receiver → ack SLA → escalation/reopen rules. Handoffs are the universal ownership-transfer primitive.

### escalation

A typed object representing tiered ack-with-clock. Owned by the tier owner at each step; terminates at exec or merges into a parent. Escalations cannot vanish; they resolve, jump tier with reason, or merge.

### override

A typed event recording a bounded, attributable departure from default behavior. Six classes: pin, snooze, suppress-red, takeover, reassignment, readiness-bypass, AI-policy override. Always typed, always reasoned, always time-bounded.

### dead-letter

A bounded store of events or commands that failed delivery / processing after exhausted retries. Has surfaced age and typed owner. Replay from dead-letter preserves original `event_id` / `command_id`.

---

## 2. Time and ordering

### `occurred_at`

Wall-clock at the **emitter** when the event happened. Operationally meaningful. Subject to mobile drift tolerance.

### `received_at`

Wall-clock at the **event store** at ingestion. Persisted alongside `occurred_at`. Used for arrival-order tiebreak.

### freshness

A first-class data field returned with every projection read: `(data, freshness, registry_versions)`. `freshness` includes the timestamp of the last applied event and a lag indicator. **Bands:** `fresh < warn-threshold < hard-stale`. Projections never lie about freshness.

### stale

A projection whose freshness exceeds the warn or hard threshold. Stale projections render dimmed (warn) or refuse interaction beyond annotations (hard). Never silently accepted.

### drift

Two distinct meanings, both legitimate but never conflated:

- **Projection drift** — a materialized projection diverges from event-derived truth (detected by replay-vs-live differential).
- **Calibration drift** — an AI capability's confidence calibration degrades over time (detected by calibration-error metrics).

Use the qualifier always. "Drift" alone is ambiguous and should not appear in specs.

### replay

Reprocessing of historical events to rebuild projections or audit state. Replay is **deterministic** — same events + same registry versions → same projections. Carries a typed marker so side-effect subscribers can suppress re-firing.

### replay marker

A typed flag on event delivery indicating "this is a replay, not live". Notification engines and outbound adapters honor it (do not re-fire); projection subscribers ignore it (rebuild silently).

### replay-safe

A subscriber property: re-delivery of an event produces no additional side effect beyond the first. All projection subscribers must be replay-safe; side-effect subscribers must be replay-marker-aware.

### idempotent

A handler property: handling the same event N times produces the same end state as handling once. **Required of every subscriber.** Achieved by:

- Natural idempotency (set-state-to-value).
- `event_id`-keyed dedupe horizon.

### `event_id`

The universal idempotency key for events. Stable across retries. Re-submission with same `event_id` → duplicate-rejected at the event store (no second commit).

### `command_id`

The universal idempotency key for commands. Client-supplied UUID. Re-submission with same `command_id` → `command.duplicate_ignored` referencing the original outcome. Different content under same `command_id` → `command.rejected.idempotency_conflict`.

### `correlation_id`

A reference linking a command (and its resulting events) to the AI suggestion or escalation that triggered it. Causality threading; not an idempotency key.

---

## 3. Health and integrity

### anti-entropy

The discipline of preventing operational rot through 20 invariants (`ACCENTOS_ANTI_ENTROPY_RULES.md` R1–R20). Each invariant maps to at least one runtime monitor that emits typed violation events.

### degradation / degraded

A component operating sub-spec but not down. Always typed (`adapter.degraded`, `runtime.engine.degraded` style). Degraded components stay reachable, surface their state honestly on CC, do not fabricate output.

### reconciliation

The act of resolving an apparent inconsistency between expected and observed state. Two contexts:

- **Adapter reconciliation** — two-way adapters reconciling external vs. runtime state via canonical-side rules.
- **Shell reconciliation** — shell reconciling optimistic UI with the authoritative outcome event.

Reconciliation is always typed; reconciliation-by-guess is forbidden.

### rejection

A typed event emitted when a command fails validation, authority, precondition, readiness, or business-rule check. Rejections are first-class facts on subject timelines. Never toast-only.

### authority

The right to issue a particular command on a particular subject. Computed from `(command_name, submitted_by.role, subject ownership)` per the command-authority registry. Authority is **central**, never per-surface.

---

## 4. AI vocabulary

### suggestion

A typed AI proposal with lifecycle states (proposed → presented → accepted/rejected/deferred/applied/auto-applied/verified/reverted/expired/superseded). Accompanied by confidence, rationale, reversibility class, policy class, evidence pointers. Operates as a first-class object on the subject timeline; never a popup.

### confidence

A 0..1 calibrated likelihood the AI assigns to its own output. Calibrated means: when AI says 0.8, ~80% turn out correct over time. Uncalibrated capabilities mark outputs explicitly.

### reversibility class

Per AI capability: `irreversible | reversible-easy | reversible-with-cost | irreversible-with-customer-visibility`. Combined with policy class to gate auto-apply.

### policy class

Per AI capability: `human-required | human-default-with-auto-fallback | auto-with-post-hoc-review`.

### auto-apply

The runtime executing an AI-suggested action without explicit human accept, allowed only when reversibility class + policy class + non-customer-visible all permit. Auto-applied actions appear on subject timelines and are subject to verify/revert.

### induced-red ceiling

A registered per-capability threshold; auto-apply suspends automatically when AI-induced downstream reds exceed it. Resume requires two-key.

---

## 5. Operational-state vocabulary

### operational state

The named runtime mode of a session: `Normal | Focus | Urgent | Escalated | Blocked | Read-Only | Mobile Quick Mode | Executive Review | AI Assist`. Per-session primary state with composition layers. Computed by the operational-state evaluator.

### sticky state

A state (`Urgent`, `Escalated`) that cannot be self-dismissed by the user while its triggering condition is live. Only resolution of the underlying condition lifts it.

### composition

The way layered states (`Mobile Quick Mode`, `AI Assist`, `Read-Only`) attach to primary states. Not stacking, not overriding — co-active behaviors with declared precedence.

---

## 6. Cross-cutting

### two-key

A command requirement: two distinct authenticated actors of declared classes (e.g. ops + exec) must participate. Verified by IDP distinctness API. Mobile-forbidden by default.

### bypass

A typed override admitting a command that would otherwise fail readiness or contract: `*_with_override` event variant. Always reasoned, always logged, always visible on CC. Distinct from *override*: bypasses are pre-action; overrides cover the broader bounded-departure class.

### ack (acknowledgement)

A typed event by a named receiver explicitly taking ownership of a handoff or escalation. **Not a read receipt.**

### freeze (registry)

A typed window during which a registry refuses mutations. `command.rejected.registry_frozen` is the rejection class. Used during incidents, audits, migrations.

### budget (override)

A bounded count of overrides allowed per role per time window. Surfaced on CC; exceeding is loud, not silent.

### owner

The single named human (or `system` for system-owned subjects) responsible for a subject at a given time. Ownership transitions are typed (reassign / takeover).

### lead

The single named role above an owner in the escalation chain. Defined in the role registry. Always exists; lead OOO requires acting-lead.

### tier

A position in the escalation chain (tier-1 owner-lead → tier-2 branch-lead → tier-3 ops → tier-4 exec). Every chain terminates at exec.

### emitter

The actor (or actor class) that emitted an event. One of: human actor, `system`, `ai`. Always non-null.

### receiver

The named owner of a handoff post-resolution. Resolved deterministically by the receiver-resolution service before `handoff.opened`. Never null.

### packet

The structured context bundle accompanying a handoff. Schema is per handoff type. Generated freshly each time; rebuilt on reopen with delta.

---

## 7. Antonyms / common confusions

| ✗ Wrong | ✓ Right |
|---|---|
| "the system updated the lead" | "`sales.lead.assigned` event was emitted by the dispatcher on receipt of `sales.lead.assign` command" |
| "we sent a notification" | "the notification engine derived a notification from the event" |
| "AI updated the PO ETA" | "the parser adapter emitted `procurement.po.eta_set` with confidence; the AI suggestion engine auto-applied per policy" |
| "the dashboard noticed a red" | "the priority engine emitted `priority.recomputed → R`; the CC projection reflected it" |
| "the operator dismissed the alert" | "the operator emitted `escalation.acknowledged` (or `subject.snoozed`); state followed" |
| "config change" | "registry edit emitted `registry.<name>.*`" |
| "feature flag" | (does not exist in this vocabulary; behavior is registry-driven) |
| "bulk update" | (does not exist; N independent commands with distinct `command_id`s) |
| "DB write" | (does not exist; events committed via dispatcher) |

---

## 8. Naming conventions (recap)

- **Events:** `<domain>.<entity>.<past-verb>`
- **Commands:** `<domain>.<entity>.<imperative-verb>`
- **AI capabilities:** `ai.<class>.<purpose>`
- **Registries:** `registry.<name>.<change>` for mutation events
- **Adapters:** `adapter.<lifecycle-verb>` for adapter-self events; emitted business events use the appropriate domain
- **Runtime self-checks:** `runtime.<concern>.<verb>`

---

## 9. Forbidden phrases in specs

- "the system just" / "magically" / "automatically figures out" — name the engine + event chain.
- "best effort" — name the contract or it doesn't exist.
- "internal log" / "side log" — there is one event log; this is R13.
- "manual override" — say *which* override class.
- "admin can" — say *which* role + which command (R20).
- "for now" — every architecture decision is durable until a typed change supersedes it.
