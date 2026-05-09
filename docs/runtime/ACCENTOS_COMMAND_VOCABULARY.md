# AccentOS — Command Vocabulary

**Mode:** Runtime architecture / specification (no implementation)
**Anchors:** all workflow docs + `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md`
**Purpose:** Define how the shell and other authorized clients address the runtime. Commands are *intents*; events are *facts*. The runtime translates valid commands into events. Invalid commands produce typed rejections.

---

## 0. Design rules

1. **Shell submits commands; runtime emits events.** Clients never write events directly.
2. **Commands are imperative, present-tense.** `sales.lead.claim`, `procurement.po.chase`. Past-tense is for events.
3. **One command, one intent.** No "do A and also B" commands; orchestrate via the event chain.
4. **Every command produces ≥1 event.** Either a success event chain or a typed rejection event. **Never silent.**
5. **Authority is checked centrally.** Authority is a property of the command + emitter, not the surface.
6. **Validation is layered:** shape → authority → state-precondition → readiness → business rule.
7. **Idempotency is client-supplied.** Every command carries a `command_id`; resubmission is a duplicate.
8. **Commands cannot bypass receiver-resolution, priority spine, or the AI gate.** Bypass requires a typed override command, itself bounded.
9. **No free-form payloads.** Every command parameter is typed and registered.

---

## 1. Command namespace philosophy

- Format: `<domain>.<entity>.<imperative-verb>`. Examples: `sales.lead.claim`, `design.spec.lock`, `build.blocker.report`, `inventory.count.complete`, `service.ticket.assign`.
- Domains match event domains exactly (sales, design, build, procurement, quote, inventory, customer, service, orchestration, ai).
- Verbs are operational, not CRUD: `claim`, `assign`, `lock`, `chase`, `acknowledge`, `escalate`, `snooze`, `pin`, `suppress`, `revert`, `verify`, `take_over`.
- Reserved verbs: `request_*` for commands that request something the system computes (`request_first_response_draft`).
- Commands that *cannot* exist by design: `*.create_event`, `*.set_priority`, `*.set_owner` (mutations of spine outputs).

---

## 2. Imperative command grammar

Every command record carries:

- `command_id` — client-supplied UUID; idempotency key.
- `command_name` — from the registry.
- `submitted_by` — role + identity of session.
- `subject_ref` — typed (`lead:L-1`, `po:PO-9`) or null for create-class commands.
- `parameters` — typed payload conforming to the registered schema.
- `client_intent` — short structured field with the originating UI surface (CC tile, mobile quick-tile, AI suggestion accept). Not free text; from a small enum. Used in observability.
- `correlation_id` — links command back to the AI suggestion or escalation that triggered it, if any.
- `submitted_at` — wall clock at client.
- `session_state` — declared operational state of the submitting session (used for state-aware validation, e.g. blocking writes from `Read-Only`).

---

## 3. Authority rules

Authority is a function of `(command_name, submitted_by.role, subject_ref ownership)`.

- **Owner authority** — the named owner of a subject can issue subject-mutation commands.
- **Lead authority** — the owner's lead can issue reassignment, takeover, and limited overrides.
- **Tier authority** — ops/exec can issue suppression, two-key overrides, terminal escalation acks.
- **AI-policy authority** — `ai-policy-owner` can issue suspend/resume on AI types, recalibrate; cannot issue subject-mutation commands.
- **Pool authority** — pool-claim commands (e.g. `sales.lead.claim`) require role membership, not subject ownership.
- **Read-only sessions** — cannot issue any mutation command. They can issue annotation commands only (e.g. `subject.annotate`).
- **AI as emitter** — AI may submit commands only via the suggestion lifecycle (an `ai.suggestion.accepted` event triggers a runtime-internal command on behalf of the human owner). AI may not directly submit commands as `submitted_by: ai`.
- **Authority is single-keyed by default.** Two-key commands are explicit (suppress-red, AI-policy-class change, readiness-bypass).

---

## 4. Validation lifecycle

Commands flow through stages; rejection at any stage emits a typed `command.rejected.<reason>` event. Stages:

1. **Shape validation.** Conforms to registered command schema. Reject: `command.rejected.malformed`.
2. **Authority check.** Submitter has authority. Reject: `command.rejected.no_authority`.
3. **State precondition.** Subject is in a state where the command is legal (e.g. cannot `lock` a spec already locked). Reject: `command.rejected.precondition_failed`.
4. **Readiness predicate.** For handoff-opening commands, readiness predicate from the contract. Reject: `command.rejected.readiness_failed` with delta of unmet predicates.
5. **Business rule check.** Domain-specific (margin floor, duplicate-suppression). Reject: `command.rejected.business_rule`.
6. **Idempotency check.** Same `command_id` already executed → ack as duplicate; no second emission. Emit: `command.duplicate_ignored` (informational).
7. **Execute.** Emit the event chain.

Each stage's rejection is typed. No "command failed" without a reason code.

---

## 5. Typed rejection philosophy

- Rejections are events, durable on the subject's timeline (when subject_ref is non-null) and on the submitter's session log.
- Rejection events carry: failed stage, reason code, structured detail (e.g. unmet predicates), suggestion (if any) for what to do next.
- The shell renders rejections as first-class feedback — not toast popups. The user sees *why* and *what to do*.
- Rejection storms (same command_id repeatedly rejected with same reason) are suppressed at the surface but counted in telemetry.

---

## 6. Idempotency model

- `command_id` is the idempotency key.
- Resubmission with same `command_id`: runtime acks as duplicate, emits `command.duplicate_ignored`, returns the original outcome (success or rejection) to the client.
- Different content under same `command_id`: hard reject as `command.rejected.idempotency_conflict`. Clients must generate new ids for new intents.
- Dedupe horizon for `command_id` is bounded by retention policy (configurable; longer than any reasonable retry window).

---

## 7. Replay behavior

- Commands themselves are not replayed; only events are.
- A "replay" of business state involves replaying events; previously-rejected commands are not re-evaluated.
- Recovery flows that need to reissue commands generate new `command_id`s with `correlation_id` linking to the original.

---

## 8. Command/event separation

- **Commands are intent**, transient, addressed to the runtime.
- **Events are fact**, durable, addressed to the world.
- A command may be valid yet produce zero state change (e.g. "claim a lead already claimed by you" — `command.duplicate_ignored`); always at least one event is emitted to record the intent.
- Multiple commands may produce the same event type with different `correlation_id`s; the event log retains attribution.
- Commands never appear on subject timelines as facts; only the events they produced do. (Rejections are events, so they appear; that's correct.)

---

## 9. Shell quick-action mapping

Every quick-action verb in the workflow + CC docs maps to exactly one command name. Sample mapping (representative, not exhaustive):

| Quick action | Command |
|---|---|
| Claim lead | `sales.lead.claim` |
| Send first response | `sales.lead.send_first_response` |
| Schedule visit | `sales.lead.schedule_visit` |
| Mark not-a-fit | `sales.lead.disqualify` |
| Send follow-up | `sales.opportunity.send_follow_up` |
| Mark won | `sales.opportunity.mark_won` |
| Generate handoff packet | `orchestration.handoff.open` (sales→design) |
| Send selection link | `design.selection.propose` |
| Lock spec | `design.spec.lock` |
| Swap to in-stock | `design.selection.substitute` |
| Request vendor ETA | `procurement.po.chase` |
| Mark site ready | `build.readiness.mark_ready` |
| Report blocker | `build.blocker.report` |
| Add punch item | `build.punch_item.add` |
| Sign-off | `build.job.sign_off` |
| Chase vendor | `procurement.po.chase` |
| Mark received | `procurement.po.receive` |
| Flag damage | `procurement.po.report_damage` |
| Request expedite | `procurement.po.request_expedite` |
| Send quote | `quote.send` |
| Revise quote | `quote.revise` |
| Convert to order | `quote.accept` (customer-side) / `quote.mark_accepted` (rep-side) |
| Mark expired | `quote.expire` |
| Receive PO (warehouse) | `inventory.receive` |
| Cycle-count this bin | `inventory.cycle_count.complete` |
| Reserve for job | `inventory.reserve` |
| Open service ticket | `service.ticket.open` |
| Assign service ticket | `service.ticket.assign` |
| Resolve service ticket | `service.ticket.resolve` |
| Take over (escalation) | `orchestration.escalation.take_over` |
| Acknowledge escalation | `orchestration.escalation.acknowledge` |
| Resolve with note | `orchestration.escalation.resolve` |
| Pin subject | `orchestration.subject.pin` |
| Snooze subject | `orchestration.subject.snooze` |
| Suppress red (ops/exec) | `orchestration.subject.suppress_red` (two-key) |
| Reassign | `orchestration.subject.reassign` |
| Take over | `orchestration.subject.take_over` |
| Accept AI suggestion | `ai.suggestion.accept` |
| Reject AI suggestion | `ai.suggestion.reject` |
| Defer AI suggestion | `ai.suggestion.defer` |
| Verify AI auto-applied | `ai.suggestion.verify` |
| Revert AI auto-applied | `ai.suggestion.revert` |
| Suspend AI type | `ai.policy.suspend_type` (ai-policy-owner) |
| Ack morning brief | `executive.brief.acknowledge` |

The mapping is exhaustive in the registry; commands without a UI verb today still exist (system-internal flows).

---

## 10. Mobile command constraints

- Mobile commands must complete in ≤2 taps (1 tap action + optional 1 confirm) on the verb surface.
- Mobile commands have **stricter authority gates** for irreversible actions — customer-visible messages always go through a preview + confirm even on mobile.
- Mobile commands carry an additional `device_context` field (geofence, photo refs, voice transcript) that the runtime treats as advisory inputs, not authority.
- Offline submission queues commands locally; on reconnect, replays with original `command_id`s; runtime applies dedupe.
- Mobile commands rejected for `precondition_failed` at replay (e.g. job already signed off by someone else) surface as a typed event the operator sees on next sync — never silently dropped.

---

## 11. Escalation-triggering commands

Some commands intentionally trigger escalation:

- `orchestration.subject.escalate` — manual escalation by owner or lead, with required reason code.
- `orchestration.handoff.escalate_breach` — surfaces a breached handoff to next tier when auto-escalation wouldn't yet have fired.
- `service.ticket.mark_severity_1` — promotes severity, which auto-triggers tier-1 escalation per service routing rules.

These commands themselves emit `escalation.opened`; they do not bypass the escalation engine.

---

## 12. AI-generated command restrictions

- AI does not submit commands as itself. The pattern is:
  1. AI emits `ai.suggestion.created`.
  2. Human (or auto-policy gate, where allowed) emits `ai.suggestion.accept` command.
  3. Runtime, on accept, emits the underlying business command on behalf of the subject owner with `correlation_id` referencing the suggestion.
  4. The resulting events carry both the human owner attribution and the AI suggestion correlation.
- For auto-apply-permitted classes (high-confidence + reversible-easy + non-customer-visible), the runtime executes step 3 without a human accept; the suggestion lifecycle records this as `auto-applied`. Event attribution shows owner-of-record as the subject's human owner; `submitted_by_actor` is `ai` with policy class.
- AI cannot self-issue overrides, suppressions, two-key commands, or customer-visible commands.
- AI cannot self-issue authority changes or registry mutations.

---

## 13. Per-command spec template

For every command in the registry:

- **Command name**
- **Emitter shape** (allowed roles + session states; mobile/desktop)
- **Authority requirements** (owner / lead / tier / pool / two-key)
- **Required parameters** (typed)
- **Optional parameters** (typed)
- **Validation requirements** (state preconditions, readiness predicates, business rules)
- **Resulting event chain on success** (in order)
- **Rejection events** (per stage, with reason codes)
- **Idempotency key strategy** (always `command_id`; sometimes additional content-key for replay safety)
- **Rollback behavior** (which subsequent command reverses; or "irreversible — see compensating action")
- **Observability implications** (what it adds to telemetry, e.g. workflow latency)
- **Anti-entropy implications** (which invariants it touches; which monitors must catch misuse)

### 13.1 Worked example: `orchestration.handoff.open`

- **Emitter:** sender role of the handoff type; not in `Read-Only`.
- **Authority:** subject owner.
- **Required parameters:** `handoff_type`, `subject_ref`, `packet_ref` (or inline packet conforming to the type's packet schema).
- **Optional:** `receiver_hint` (lead override; logged).
- **Validation:** readiness predicate of the handoff type; receiver resolves; packet conforms.
- **Success events:** `handoff.opened` (with resolved receiver), possibly `priority.recomputed` if the act elevates the receiver's queue.
- **Rejection events:** `command.rejected.readiness_failed` (with delta), `command.rejected.no_receiver` (resolution blocked), `command.rejected.malformed` (packet shape).
- **Idempotency:** same `command_id` re-runs as duplicate; same content with different id is a separate handoff (not allowed by state precondition if one is open).
- **Rollback:** `orchestration.handoff.reopen` reverses by closing original and opening a new one with delta.
- **Observability:** workflow latency (time from prior milestone to handoff open), receiver-resolution rule winner, packet-completeness on first try.
- **Anti-entropy:** R1 (no silent handoffs), R10 (no null receivers).

### 13.2 Worked example: `orchestration.subject.suppress_red`

- **Emitter:** ops or exec, on a subject in `R` band.
- **Authority:** two-key (one ops + one exec, or two ops with declared reason codes).
- **Required parameters:** `subject_ref`, `reason_code` (enum), `expires_at`, `note`.
- **Validation:** subject currently in `R`; not previously suppressed within cooldown; suppression budget for the day not exceeded.
- **Success events:** `priority.override.applied` (suppression class), `priority.recomputed` if effective band changes, surface event for CC suppression tile.
- **Rejection events:** `command.rejected.no_authority`, `command.rejected.business_rule` (budget exceeded; cooldown), `command.rejected.precondition_failed` (not in R).
- **Rollback:** `orchestration.subject.reinstate_red` lifts suppression early.
- **Observability:** suppression count + reason mix; suppression-followed-by-recurrence flagged.
- **Anti-entropy:** R9 (no invisible overrides), R15 (no unbounded suppressions).

---

## 14. Anti-patterns

- Free-form command payloads.
- Commands that produce zero events on success ("silent success").
- Commands that bypass receiver resolution, priority spine, or AI gate.
- "Bulk" commands that wrap many intents (orchestrate via event chains; one command = one intent).
- AI submitting commands as `ai` directly.
- Mobile-specific authority looser than desktop.
- Toast-only rejections (rejections must be timeline events, not transient UI).
- Commands without idempotency keys.
- Authority decided by surface (CC tile vs. mobile quick action) rather than by command + role.

---

## 15. What this doc deliberately omits

- Command transport / wire format.
- Storage / persistence of in-flight commands.
- Specific authority numbers (budgets, cooldowns) — registry-owned policy.
- UI rendering of rejections.
