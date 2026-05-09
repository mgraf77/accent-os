# AccentOS — Shell ↔ Runtime Interaction Brief

**Mode:** Architecture / specification (no UI design, no implementation)
**Anchors:** all runtime + workflow docs
**Purpose:** Define the contract between shell-v2 and the runtime. The shell *is* the operator's view; the runtime *is* operational truth. This brief states what crosses between them.

---

## 0. Core principle

- **Shell submits commands; runtime emits events.**
- Shell never writes events.
- Runtime never renders.
- Projections + operational-state evaluator outputs are the only things shell reads from runtime.
- Commands + acks/rejections are the only things shell sends to runtime.

---

## 1. Command submission contract

### 1.1 Submission shape

Per `ACCENTOS_COMMAND_VOCABULARY.md`, every command carries:

- `command_id` (client-generated UUID; idempotency key).
- `command_name` (from registry).
- `submitted_by` (actor_id from session).
- `subject_ref` (when applicable).
- `parameters` (typed per command registry entry).
- `client_intent` (originating surface: CC tile id, mobile quick-tile id, AI suggestion accept).
- `correlation_id` (when triggered by suggestion or escalation).
- `submitted_at` (client wall clock).
- `session_state` (declared current operational state).

### 1.2 Submission outcome

Every submission resolves to one of:

- **Accepted** — runtime returns the resulting event chain reference; shell renders confirmation.
- **Duplicate** — runtime returns reference to original outcome.
- **Rejected** — runtime returns typed rejection event (per command registry).
- **Stale-view** — runtime rejects; shell prompts refresh.

Shell **never** infers success without an outcome event. Optimistic UI is acceptable for visual snappiness only when paired with explicit reconciliation on outcome.

### 1.3 Offline / mobile queueing

- Mobile shell may queue commands offline.
- Each queued command keeps its original `command_id`.
- On reconnect, shell drains queue in submission order; runtime applies idempotency and precondition checks.
- Stale-precondition rejections on replay surface as first-class feedback (subject timeline + queue review screen).

### 1.4 Authority and surface

- Shell never relaxes authority by surface. Mobile and desktop submit identical command shapes.
- Two-key commands are **desktop-only**; mobile shell does not present the verb.

### 1.5 Forbidden submission paths

- Shell never submits to event-store APIs directly.
- Shell never composes "bulk" commands; it submits N independent commands with distinct `command_id`s.
- Shell never invents fields outside the registered parameters.

---

## 2. Projection consumption contract

### 2.1 Read surfaces

Shell reads from runtime via typed projections:

- CC tiles (per `ACCENTOS_COMMAND_CENTER_SPEC.md`).
- Role-CC variants (scope filters).
- Subject timelines (per-subject projection of all events for a subject).
- Role queues (per-role list projections sorted by `priority_score`).
- AI inboxes (per-owner suggestion list).
- Telemetry rollups (operational + orchestration health).

### 2.2 Read shape

Every projection read returns `(data, freshness, registry_versions)`:

- `data` — the projected content.
- `freshness` — timestamp of last applied event + lag indicator.
- `registry_versions` — versions of registries the projection used to derive scores/authorities (for audit and stale-detection).

### 2.3 Freshness handling

- Shell renders `freshness` as a first-class signal (per policy defaults: dim "stale-warn"; hard "stale" badge; refuse interaction beyond annotations on hard-stale).
- Shell does not silently cache projections beyond the freshness window; cache TTL is bounded.
- Stale projections cannot drive command submission unless the command is annotation-class.

### 2.4 No local computation

- Shell does not compute `priority_score`, urgency, or routing locally.
- Shell does not maintain a parallel state machine for subjects.
- Shell does not derive band labels (G/Y/R) from raw fields — it reads them.

---

## 3. Operational-state rendering

### 3.1 State source

- Shell reads its session's primary operational state from the operational-state evaluator (per `ACCENTOS_OPERATIONAL_STATE_MODEL.md`).
- Shell does not invent state.
- Shell may *propose* state changes (e.g. user toggles Focus) by submitting `session.declare_state`; runtime validates per composition rules.

### 3.2 State-aware rendering

Shell honors per-state rules:

- `Focus` — collapse non-focused queues; keep escalations visible per composition rules.
- `Urgent` / `Escalated` — sticky; user cannot self-dismiss while triggers are live; verbs promote red items.
- `Blocked` — render "what you're waiting on" + "what you can do instead"; suppress the stuck-flow.
- `Read-Only` — hide all mutation verbs; only annotation verbs appear.
- `Mobile Quick Mode` — five-tile cap; verbs in ≤2 taps.
- `Executive Review` — CC layout + ack/assign/escalate/snooze verbs.
- `AI Assist` — surface AI inbox + per-subject AI panel.

### 3.3 State transitions

- Shell renders state transitions as typed events the user sees on the session log.
- No silent state changes in the UI.

---

## 4. AI suggestion rendering

### 4.1 Suggestions as objects

- AI suggestions are first-class objects with timeline placement, accept/reject/defer/verify/revert verbs.
- Shell never renders suggestions as modal popups (R13 boundary).
- Each suggestion shows: headline, factors, confidence, reversibility class, evidence pointers, alternatives.

### 4.2 Lifecycle verbs

Shell maps lifecycle commands directly:

- `ai.suggestion.accept` / `.reject` / `.defer` / `.verify` / `.revert`.
- Reject requires reason from a small enum + optional note.
- Defer requires wake condition.
- Revert requires being within revert window per reversibility class.

### 4.3 Auto-applied awaiting verification

- Shell surfaces auto-applied items in a dedicated tile + per-subject affordance.
- User can verify or revert; verify closes the loop, revert triggers compensating events.

### 4.4 Trust UX

- Shell shows confidence honestly; low confidence is visible.
- Rejected suggestions do not re-appear unchanged (handled at runtime; shell honors).
- "Stop suggesting this for me" is one-tap (mapped to per-owner trust signal feedback).

---

## 5. Rejection-event handling

### 5.1 Rejection as feedback

- Rejection events are first-class on subject timelines.
- Shell renders rejections inline at the submission point (not as transient toasts).
- Each rejection includes: failed stage, reason code, structured detail, optional "what to do".

### 5.2 Per-rejection-class behaviors

- `command.rejected.no_authority` — shell explains role gap; offers escalation path.
- `command.rejected.precondition_failed` — shell shows current state and the violated predicate.
- `command.rejected.readiness_failed` — shell shows the unmet predicates as a checklist; user resolves and resubmits with a new `command_id`.
- `command.rejected.no_receiver` — shell shows attempted rules; offers lead notification.
- `command.rejected.stale_view` — shell prompts refresh and retry.
- `command.rejected.idempotency_conflict` — shell warns and asks user to confirm new intent (regenerate `command_id`).
- `command.rejected.business_rule` — shell shows the rule; offers override path if registered.
- `command.duplicate_ignored` — shell shows confirmation referencing the original outcome.

### 5.3 Rejection storms

- Repeated identical rejections suppress the visual feedback (single banner instead of N popups).
- Rejection rate per session is observable; abnormal rates trigger telemetry signals.

---

## 6. Stale-projection behavior

- Shell honors freshness markers (per policy defaults).
- On `stale-warn`: render dimmed; allow interaction with explicit confirmation that data may be stale.
- On hard-stale: refuse mutation submission; allow only annotation + view.
- On projection unavailability: render "projection unavailable, please retry"; do not fabricate.

---

## 7. Read-only behavior

- Read-only sessions render no mutation verbs.
- Read-only sessions can submit `subject.annotated` and view.
- Read-only is enforced both client-side (UX) and server-side (command rejection); the runtime is the authoritative gate.

---

## 8. Degraded-mode behavior

Shell renders runtime degradation honestly:

- **Notification engine degraded:** banner "notifications delayed"; in-app activity streams continue.
- **AI engine degraded:** AI inbox shows "AI assist unavailable"; suggestion-related tiles dim.
- **Receiver-resolution degraded:** handoff verbs disabled; user sees "handoffs paused".
- **Projection store degraded:** affected tiles show "data unavailable"; subject timelines may still be reachable via per-subject log.
- **Event store degraded (catastrophic):** shell enters read-only display mode; submission disabled; banner explains.

Shell never silently retries against a degraded runtime indefinitely — it reflects degradation to the user.

---

## 9. Mobile implications

- Mobile shell honors Mobile Quick Mode by default (five-tile cap).
- Mobile shell composes with `Urgent`, `Focus`, `Blocked`, `AI Assist` per composition rules.
- Mobile commands carry `device_context` (geofence, photo refs, voice transcript) as advisory inputs only.
- Customer-visible commands always require explicit confirm step on mobile, even if 2-tap headline.
- Two-key commands are **not** rendered on mobile.
- Offline queue is mobile-only; desktop fails fast on disconnect.

---

## 10. Command Center implications

- CC is rendered by shell as a special projection consumer.
- CC tile catalog is fixed; shell renders the tiles, runtime computes contents.
- Sort discipline is enforced by runtime (`priority_score` desc + secondary keys); shell honors.
- CC and `Executive Review` operational state are unified; shell does not fork.
- Role-CC variants are scope filters of the same projection set; shell selects the filter, runtime returns the projected data.
- Morning brief / EOD digest are projection events; shell renders, exec acks via command.

---

## 11. Session lifecycle

- **Login:** identity service authenticates; shell establishes session; runtime emits `session.state.changed → Normal`.
- **State changes:** shell submits `session.declare_state`; runtime validates and emits.
- **Refresh:** shell can request projection refresh; advisory only.
- **Logout:** shell terminates session; identity service handles credentials.

---

## 12. Anti-patterns

- Shell maintaining its own subject state machine.
- Shell computing priority or urgency.
- Shell rendering "exec dashboard" parallel to CC.
- Shell suppressing rejections as toasts.
- Shell silently refreshing on stale without user awareness.
- Shell relaxing authority for mobile quick actions.
- Shell rendering AI suggestions as popups.
- Shell calling event-store APIs directly.
- Shell composing bulk commands.
- Shell caching projections past freshness threshold.
- Shell allowing mutation from Read-Only sessions.

---

## 13. Acceptance checklist (shell-readiness)

Implementation may proceed when shell guarantees:

1. ☐ Submits typed commands per registry; never raw event writes.
2. ☐ Honors freshness markers (warn, hard, unavailable).
3. ☐ Renders rejections as first-class feedback.
4. ☐ Reads operational state from evaluator; doesn't invent state.
5. ☐ Renders AI suggestions as objects in timelines + inboxes; never as modals.
6. ☐ Mobile Quick Mode honored (five-tile cap; ≤2-tap verbs).
7. ☐ Two-key commands desktop-only.
8. ☐ Customer-visible mobile commands require confirm.
9. ☐ Offline queue with idempotent replay.
10. ☐ Reflects runtime degradation honestly.
11. ☐ No local priority/urgency computation.
12. ☐ Exec view = CC; no fork.

When all 12 hold, the shell-runtime boundary is implementation-acceptable.
