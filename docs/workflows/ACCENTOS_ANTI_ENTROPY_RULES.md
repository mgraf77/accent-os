# AccentOS — Anti-Entropy Rules

**Mode:** Workflow systems design (no implementation)
**Anchors:** all prior workflow docs
**Purpose:** The operational invariants future implementation must obey. These are the rules that prevent AccentOS from rotting into yet-another-CRM-with-tabs.

Each rule states **what must never happen**, **why** (the entropy mode it prevents), **how the system enforces it**, and **how a violation is detected**.

---

## R1. No silent handoffs

- **Never:** ownership transfers without a typed `handoff.opened` and `handoff.acknowledged`.
- **Why:** silent handoffs become "the team will pick it up" — the failure mode of every operations tool that loses determinism.
- **Enforce:** receiver-resolution contract blocks open-with-null-receiver; no API path exists to mutate ownership without emitting handoff events.
- **Detect:** subjects with ownership changes but no surrounding handoff events; lag in `handoff.acknowledged` counts.

---

## R2. No orphaned escalations

- **Never:** an `escalation.opened` that does not eventually `acknowledged` + `resolved`, or `merged_into` a parent escalation.
- **Why:** escalations that vanish destroy accountability faster than not having escalations at all.
- **Enforce:** sticky `Escalated` state; ack clocks per tier; tier-skip-with-reason rather than silent drop.
- **Detect:** open-escalation count trend; "oldest open escalation" age; mismatch between `opened` and `(resolved | merged)` counts.

---

## R3. No hidden priority systems

- **Never:** a view, dashboard, or feature computes its own urgency.
- **Why:** parallel urgency systems diverge; the team stops trusting any of them.
- **Enforce:** priority spine is the only source; views filter populations, never recompute scores; no "manual priority" picklists.
- **Detect:** code paths that read inputs and emit urgency without going through the spine; tile sort definitions referencing fields other than `priority_score` (and a deterministic tiebreak).

---

## R4. No duplicate operational truths

- **Never:** the same operational fact stored or surfaced from two sources that can disagree.
- **Why:** duplication breeds reconciliation work and mistrust. The most common mode is a sidebar status that lags the timeline.
- **Enforce:** event log is single source; views are projections; no manually-maintained "current status" parallel to event-derived state.
- **Detect:** any read path that does not derive from the event log. Audit checks that projected state matches event-log replay.

---

## R5. No parallel orchestration surfaces

- **Never:** a separate "exec dashboard" that is not the command center; a separate "ops view" that has its own priority logic; a separate "AI page" with its own actions.
- **Why:** parallel surfaces fork the priority spine and the action vocabulary. The org ends up arguing about which screen is right.
- **Enforce:** CC and `Executive Review` state are the same surface; ops/lead variants are scope filters of the same tiles; AI is integrated into subject timelines and tiles, not a destination.
- **Detect:** new pages that introduce tile types not in the catalog, or sort logic not from the spine.

---

## R6. No unowned subjects

- **Never:** a subject (lead, quote, job, PO, ticket, escalation, suggestion) without a named owner — except explicit pool states (`sales-pool`, `design-pool`) which are themselves owned by leads.
- **Why:** unowned subjects rot. Pools without lead ownership become graveyards.
- **Enforce:** state machine forbids non-pool states without owner; receiver resolution ladder always lands somewhere; out-of-office requires named delegate.
- **Detect:** subject queries returning rows with null owner outside named pool states; pool size + age trends.

---

## R7. No AI without reversibility

- **Never:** AI takes an action whose reversibility class is undeclared, or auto-applies an action outside its reversibility-and-policy gate.
- **Why:** one rogue customer-visible auto-action ends the AI program permanently.
- **Enforce:** every AI action class declares reversibility up front; auto-apply is gated; customer-visible irreversible actions cannot auto-apply by policy.
- **Detect:** AI actions logged without reversibility metadata; auto-apply rate by class with anomalies surfacing on CC.

---

## R8. No self-clearing urgent states

- **Never:** an operator self-dismissing `Urgent` or `Escalated` while the triggering condition is live.
- **Why:** humans avoid red. If the system lets them dismiss it, they will, and the system stops mirroring reality.
- **Enforce:** sticky-state contracts; only resolution of the underlying condition (red cleared, escalation resolved) lifts the state; snooze is bounded and surfaces as a typed reason.
- **Detect:** state-transition events with no preceding triggering-condition resolution; snooze-with-reason rates above threshold.

---

## R9. No invisible overrides

- **Never:** a pin, snooze, suppression, takeover, reassignment, readiness-bypass, or AI-policy override that is not a typed event with attributable owner, reason, time bound, and surface-visibility.
- **Why:** silent overrides become folklore. The org runs on rumor about who can do what.
- **Enforce:** every override action emits a typed event; suppression count is on CC; bypass count is in telemetry; pins decay.
- **Detect:** override events with missing reason or actor; mismatch between subject deltas and override events.

---

## R10. No null receivers, ever

- **Never:** a handoff opened with no resolvable named owner — fallback ladder must terminate at a real person/role.
- **Why:** null receivers turn into "I thought you had it".
- **Enforce:** receiver-resolution contract; fallback ladder ends at exec; system blocks the sender (with a surfaced event) before allowing null.
- **Detect:** `handoff.blocked_no_receiver` event count; resolution-rule "winner" telemetry.

---

## R11. No silent state mutation

- **Never:** subject state changes without an emitted, durable, attributable event.
- **Why:** silent mutation kills audit, breaks projections, and lets bugs hide.
- **Enforce:** event-propagation contract; commit-after-emit-and-route discipline.
- **Detect:** projection vs. event-log replay drift; orphaned-event counts.

---

## R12. No bypassed contracts without typed override

- **Never:** a runtime path that skips a contract (handoff readiness, AI policy, priority spine, notification rules) without emitting a typed `_with_override` event carrying actor + reason + visibility.
- **Why:** every contract is one bypass away from being decorative.
- **Enforce:** bypasses are themselves events; bypass counts are on telemetry surfaces and CC.
- **Detect:** bypass count trends; subjects with deltas that do not correspond to either contract-following events or bypass events.

---

## R13. No hidden AI work

- **Never:** AI actions on a side log separate from the subject timeline.
- **Why:** if AI work isn't on the timeline, humans can't audit, and trust never accrues.
- **Enforce:** AI events are first-class subject-timeline events; no AI-only journal.
- **Detect:** any storage of AI actions disjoint from event log.

---

## R14. No notification authoring

- **Never:** code paths that "send a notification" without a triggering typed event, audience rule, and quiet/loud policy.
- **Why:** ad-hoc notifications spam users; spam destroys signal.
- **Enforce:** notification contract; notifications are derived, not authored.
- **Detect:** notification logs without backing event references; storm-detector triggers.

---

## R15. No unbounded pins or suppressions

- **Never:** an override (pin, snooze, suppression) with no expiry or no decay.
- **Why:** unbounded overrides become permanent fictions. The system stops reflecting reality.
- **Enforce:** every override carries TTL or wake condition; reaffirmation requires a fresh typed event.
- **Detect:** override-active-age distributions; reaffirmation rates.

---

## R16. No infinite escalation bounce

- **Never:** an escalation that loops between tiers without resolution or pattern surfacing.
- **Why:** bounce loops hide unresolved issues forever.
- **Enforce:** bounce protection — re-red within window after reassignment jumps tier and surfaces a "pattern" flag instead of re-escalating to the same owner.
- **Detect:** bounce counter per subject; pattern-flag rate.

---

## R17. No back-dated events

- **Never:** event records with `occurred_at` set to a time that conflicts with system observation (within reason).
- **Why:** time travel breaks audit and projection ordering.
- **Enforce:** `occurred_at` is wall clock at emission; out-of-order arrival uses a recorded `received_at` for ordering tiebreak; both are visible.
- **Detect:** `occurred_at > received_at` or impossible drifts.

---

## R18. No anonymous events

- **Never:** events without an emitter. `system` and `ai` are valid named emitters; "anonymous" is not.
- **Why:** anonymous events kill attribution.
- **Enforce:** schema requires emitter; AI events carry the policy class and model identity.
- **Detect:** schema validation; null-emitter counts.

---

## R19. No mobile-as-shrunk-desktop

- **Never:** mobile views that are desktop layouts with smaller fonts.
- **Why:** mobile is a verb surface; if it composes records it will not be used; if it is not used, the field signal dies.
- **Enforce:** mobile spec is verb-tile-first, max five tiles, every tile has a verb in ≤2 taps.
- **Detect:** mobile screens that exceed the tile limit or compose multi-field forms by default.

---

## R20. No "admin" catch-all role

- **Never:** a role that grants unbounded write authority.
- **Why:** admin god-mode replaces the override system with folklore. Accountability dies.
- **Enforce:** every elevated action is a typed override under R9; ops/exec authorities are bounded and logged.
- **Detect:** role definitions with unscoped write authority; override events without role-scoped context.

---

## Operational invariants summary

The system is healthy when, simultaneously:

1. **Every operational change is an event.** (R11)
2. **Every handoff is named, acked, and resolves.** (R1, R2, R10)
3. **Every override is typed, bounded, and visible.** (R9, R15)
4. **One priority spine. One CC. One event log.** (R3, R4, R5)
5. **AI is reversible, audited, and on the timeline.** (R7, R13)
6. **Sticky states stay sticky; bypasses are loud; bounces are interrupted.** (R8, R12, R16)
7. **Mobile is verbs; desktop is composition.** (R19)
8. **Roles are bounded; admin god-mode does not exist.** (R20)
9. **Time is honest; emitters are named.** (R17, R18)
10. **No subject is unowned.** (R6)

If a future implementation can answer "yes" to all ten on a given day, the orchestration is alive. The day any one slips, entropy starts.

---

## What this doc deliberately omits

- Specific enforcement implementations.
- Static analysis or runtime check choices.
- Threshold numbers.
- Audit log retention specifics.
- Identity/auth model.
