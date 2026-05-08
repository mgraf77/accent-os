# AccentOS — Orchestration Runtime Contracts

**Mode:** Workflow systems design (no implementation)
**Anchors:** all prior workflow docs
**Purpose:** The orchestration runtime constitution. Invariants the runtime *must* obey. No code, no APIs, no storage choices — only contracts and the survivability rules behind them.

---

## 0. Document conventions

For each contract:

- **Invariant** — what must always hold.
- **Allowed transitions** — legal moves.
- **Forbidden transitions** — illegal moves.
- **Survivability concerns** — what breaks if the invariant fails.
- **Observability requirements** — how the runtime proves it's holding.
- **Rollback behavior** — what happens when something goes wrong.

---

## 1. Event Propagation Contract

- **Invariant:** Every state change is an event. No state mutates without an event being emitted, durably stored, and routed to subscribers before the change is considered committed.
- **Allowed:**
  - Emit → durably store → route to subscribers → mark committed.
  - Idempotent re-delivery to subscribers.
- **Forbidden:**
  - Silent in-place state mutation.
  - Mutating an emitted event after the fact (events are immutable; corrections are *new* events).
  - Subscribers querying state instead of consuming events for time-sensitive views.
- **Survivability:** If state can mutate without events, audit dies and projections drift. The CC stops mirroring reality.
- **Observability:**
  - Per-subject event log is the single source of truth.
  - Per-subscriber lag metric (see telemetry doc).
  - Event-emission failures are themselves events (`runtime.emission_failed`).
- **Rollback:** A bad event is **never deleted**. It is followed by a `corrected_by` event referencing the bad one with a typed reason. Audit remains linear.

---

## 2. Handoff Lifecycle Contract

- **Invariant:** Every `handoff.opened` reaches one of: `acknowledged`, `breached → resolved`, or `reopened → closed`. No handoff dangles. Receiver is named **before** opening.
- **Allowed transitions:**
  - `opened → acknowledged → completed`
  - `opened → breached → acknowledged → completed`
  - `opened → reopened → opened (new) → ... → completed`
- **Forbidden:**
  - Open with `null` receiver.
  - Silent re-open without delta.
  - Acknowledge by anyone but the named receiver (or an explicit takeover).
  - Marking complete without an ack first.
- **Survivability:** Without this, "the team will pick it up" returns. Operational determinism collapses.
- **Observability:**
  - Open-handoff count per receiver.
  - Time-in-state per handoff phase.
  - Breach rate per handoff type.
  - Reopen rate per handoff type (signals upstream defects).
- **Rollback:** Reopen is the rollback mechanism. Carries a delta and a reason. Original handoff is closed with `reopened_for` reference.

---

## 3. Escalation Contract

- **Invariant:** Every escalation is a typed object with named tier owner, ack clock, and a terminal `resolved` event. Escalations cannot vanish; they must resolve, jump tier, or be explicitly merged.
- **Allowed transitions:**
  - `opened → acknowledged → resolved`
  - `opened → tier_skipped → opened (next tier) → ...`
  - `opened → merged_into(other) → resolved (via parent)`
- **Forbidden:**
  - Self-clear by the originating owner.
  - Silent tier skip (must emit `tier_skipped` with reason).
  - Resolve without typed reason code.
  - Re-escalation to the same tier owner that just bounced it (must jump tier and surface as pattern).
- **Survivability:** Without this, escalations become Slack pings. Accountability dies.
- **Observability:**
  - Open escalations per tier.
  - Mean ack time per tier.
  - Tier-skip rate (high skip rate means tier ownership is broken).
  - Recurrence rate (same subject re-escalating within a window).
- **Rollback:** Resolution can be reopened; reopen carries reference and a reason. Bounce protection (§ Anti-Entropy) prevents loops.

---

## 4. Notification Contract

- **Invariant:** Notifications are derived, not authored. Every notification ties to a typed event, an audience rule, and a quiet/loud policy. No code path "just sends a notification".
- **Allowed transitions:**
  - `event → audience resolution → quiet rule check → channel selection → delivery → ack/no-ack`
- **Forbidden:**
  - Notification without a triggering event.
  - Bypassing quiet hours (except severity-1).
  - Notifications that don't link back to a subject.
  - Per-feature ad-hoc paging.
- **Survivability:** Notification spam is the fastest way to lose user trust. Without a contract, every feature invents its own paging logic and operators stop reading.
- **Observability:**
  - Notifications per role per day.
  - Read rate, ack rate, ignore rate.
  - Quiet-hour-bypass count (should be near-zero except sev-1).
  - Notification-storm detector (multiple notifications same subject same minute).
- **Rollback:** Notifications are not undoable; the contract prevents bad ones from sending in the first place. Mistaken sends emit `notification.retracted` (event-only; receiver may have already seen it).

---

## 5. AI Suggestion Contract

- **Invariant:** Every AI action exists as a suggestion object with the lifecycle defined in the AI suggestion model. Auto-apply is gated by reversibility class + policy class. No AI action is silent.
- **Allowed transitions:** as defined in `ACCENTOS_AI_SUGGESTION_MODEL.md` § 1.
- **Forbidden:**
  - AI mutating subject state without emitting `ai.suggestion.*` and (where applicable) `ai.action.executed`.
  - Auto-applying customer-visible actions outside explicit policy class.
  - Re-presenting a rejected suggestion without a delta.
  - AI selecting its own owner or its own priority.
  - Hidden AI work (no AI-only side log; AI is on the subject timeline).
- **Survivability:** A single rogue customer-visible auto-action destroys trust permanently.
- **Observability:**
  - Per-type accept/reject/revert/verify rates.
  - Calibration drift per type.
  - Auto-apply count + revert rate.
  - Time-from-presentation-to-action.
- **Rollback:**
  - `applied → reverted` for any reversible class.
  - For irreversible actions, the contract prohibits auto-apply. If a human accepted an irreversible suggestion that turned out wrong, the rollback is human-mediated and logged with a typed `compensating_action`.

---

## 6. Priority Propagation Contract

- **Invariant:** `priority_score` is computed by one function over typed inputs and frozen on the emitting event. Band crossings emit `priority.recomputed`; within-band changes do not. No view derives its own urgency.
- **Allowed transitions:**
  - input change → recompute → if band crossed → `priority.recomputed` → notify watchers.
- **Forbidden:**
  - Per-screen urgency math.
  - Setting `priority_score` directly from outside the priority function.
  - Silent override (overrides emit typed events).
  - Band-flicker (no hysteresis/cooldown).
- **Survivability:** Without one score, the CC stops mirroring the system and operators distrust both.
- **Observability:**
  - Recompute rate per subject.
  - Band-flip rate (high = hysteresis broken).
  - Override count and decay-completion rate.
- **Rollback:** A bad weight change is reverted at the policy layer; existing scores recompute on next input change. No back-fix of stored events.

---

## 7. Operational-State Transition Contract

- **Invariant:** Each session resolves to one primary operational state with explicit composition rules. Transitions are observable events. Sticky states cannot self-dismiss while triggering condition is live.
- **Allowed transitions:** per `ACCENTOS_OPERATIONAL_STATE_MODEL.md` § 3 (precedence) and § 4 (transitions).
- **Forbidden:**
  - Self-dismiss of `Urgent` while a red is owned.
  - Self-dismiss of `Escalated` while tier-ack is open.
  - `Focus` blocking escalation surfacing.
  - `Read-Only` views emitting non-annotation events.
  - Surface-specific state ("compact mode" toggles unrelated to the spine).
- **Survivability:** Without a state spine, every screen reinvents notification/AI/quick-action behavior and they drift incompatibly.
- **Observability:**
  - Time-in-state per role per day.
  - State-transition events.
  - `Blocked` time (a key operational health signal).
  - Forced state overrides (should be near zero).
- **Rollback:** State transitions are reversible by reverse trigger; state events are append-only.

---

## 8. Receiver-Resolution Contract

- **Invariant:** Receiver resolution is a pure function of typed inputs. Every handoff resolves to one named owner before opening. The named-owner-or-block rule cannot be bypassed without typed override.
- **Allowed:** rules per `ACCENTOS_ROLE_AND_RECEIVER_MODEL.md` § 10 (and § 10.10 fallback ladder).
- **Forbidden:**
  - Null receiver.
  - Resolution dependent on undeclared inputs (time-of-day, randomness, hidden config).
  - Pool-only assignment for handoffs (queues exist; *handoff opening* requires a named owner).
  - Silent re-resolution after open (use reassignment events).
- **Survivability:** Determinism is the property that lets the runtime be tested and reasoned about. Lose it and behavior becomes folklore.
- **Observability:**
  - Resolution outcome per handoff type (rule that won).
  - Block-on-no-receiver count (high = role gaps).
  - Reassignment rate per handoff type.
- **Rollback:** Reassignment events; takeover events. Both typed.

---

## 9. Rollback / Reopen Contract

- **Invariant:** Every operational object has a defined rollback or reopen path. No work disappears; it transitions.
- **Allowed:**
  - Subject reopen (`*.reopened`) with delta + reason.
  - AI action revert (per reversibility class).
  - Handoff reopen with delta packet.
  - Escalation reopen with prior-context reference.
  - Suppression reinstate.
- **Forbidden:**
  - Hard delete of operational events.
  - Silent rollback (no event).
  - Rollback by a non-owner without takeover.
  - Compensating actions hidden from the subject timeline.
- **Survivability:** Without a clean rollback semantics, recovery actions accumulate as ghost state.
- **Observability:**
  - Reopen rate per subject type (signal of upstream defects).
  - Revert rate per AI type.
  - Compensation events per period.
- **Rollback:** Reopens themselves are reversible (close with reason).

---

## 10. Auditability Contract

- **Invariant:** Every operational event is durable, attributed, time-stamped, and immutable. Subject timelines unify human, system, and AI events.
- **Allowed:**
  - Append-only logs.
  - Corrections via new typed events that reference predecessors.
  - Read-time projection of the timeline per role.
- **Forbidden:**
  - Edits to past events.
  - Hidden side logs ("AI log", "admin log", "system journal" parallel to subject timeline).
  - Anonymous events (every event has an emitter; `system` and `ai` are valid named emitters).
  - Time-travel (back-dating events). Recorded `occurred_at` is wall clock at emission; out-of-order arrival is allowed but ordering on the timeline uses recorded time + arrival tiebreak, both visible.
- **Survivability:** Audit is the property that lets disputes resolve without folklore. Without it, accountability dies first, then trust.
- **Observability:**
  - Event-immutability self-checks (periodic).
  - Orphaned-event detection (events with no resolvable subject).
- **Rollback:** Not applicable — audit doesn't roll back. Operational state rolls back via typed compensating events that are themselves audited.

---

## 11. Cross-cutting runtime invariants

1. **Single source of truth per subject:** the event log. All views are projections.
2. **No silent state.** If the runtime knows something operationally relevant, it has been declared via an event.
3. **No null receivers.** Ever.
4. **No self-clearing reds.** Sticky-state contracts forbid it.
5. **No hidden AI.** Every AI mutation is on the subject timeline.
6. **No parallel orchestration surfaces.** The CC and exec view are the same. Ops/lead variants are scope filters of the same spine.
7. **No bypassed contracts.** Bypass requires a typed `_with_override` event with reason and visibility.
8. **No infinite loops.** Bounce protection on escalation; cooldown on band crossings; cap on auto-revert cycles.

---

## 12. What this doc deliberately omits

- Storage engine, transport, message bus.
- Concurrency model.
- Specific thresholds (cooldowns, SLAs, caps).
- Auth/identity.
- Schema versioning mechanics (additive-only payloads is a design rule; mechanics are runtime).
