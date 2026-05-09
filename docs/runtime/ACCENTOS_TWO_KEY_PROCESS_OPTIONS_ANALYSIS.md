# AccentOS — Two-Key Process Options Analysis

**Mode:** Decision support for Captain. **Not a choice.**
**Constraint:** satisfy `ACCENTOS_AUTH_IDENTITY_BOUNDARY.md` § 3 (distinctness, MFA, role-class).
**Optimization:** lightweight; bootstrap-friendly; mobile-forbidden by default; auditable.

---

## 1. What's required

- **Two distinct authenticated actors** participate.
- **Both have fresh MFA.**
- **Both satisfy the command's actor-class requirement** (e.g. ops + exec).
- **Distinct devices** — not same actor on two devices.
- **Audit trail** — both keys recorded on the resulting event.
- **Bounded coordination window** — second key cannot lag indefinitely.

---

## 2. Options surveyed

### Option A — Sequential approval, 15-minute window

- Actor 1 submits the two-key command; runtime emits `command.pending_two_key` event.
- Actor 2 has 15 minutes to approve via `command.approve_two_key` referencing the pending command.
- On approve: dispatcher synthesizes execution; event emitted with both actor_ids.
- On timeout / abort: typed `command.two_key_aborted` event.
- **Implementation complexity:** Low–medium. Pending state + timer.
- **UX burden:** Low. One actor initiates; the other reviews + approves.
- **Mobile:** Initiator desktop-only by default; approver may be desktop or mobile (per command's mobile-allowed flag — typically desktop-only for two-key).
- **Survivability:** High. Pending state is durable; abort path explicit.
- **Edge cases:** Initiator's session expires → pending command remains; approver still acts; resulting event records initiator's authorization at submission time.

### Option B — Simultaneous co-presence, real-time

- Both actors must be online at the same moment.
- One initiates; the other receives a real-time prompt; both approve in seconds.
- **Implementation complexity:** Higher. Real-time signaling + synchronization.
- **UX burden:** Higher; coordination friction.
- **Survivability:** Lower; failure if either actor's connection blips.
- **Bootstrap fit:** Poor.

### Option C — Pre-authorized batch (e.g. weekly two-key window)

- Exec pre-authorizes a batch of two-key commands during a weekly window.
- **Implementation complexity:** Medium.
- **UX burden:** Lower for high-volume cases; higher for ad-hoc.
- **Survivability:** Lower — pre-auth is a category of latent override.
- **Anti-entropy fit:** Poor — looks like a hidden override.

### Option D — Out-of-band confirmation (email/SMS link)

- Initiator submits; second actor receives an email/SMS link to confirm.
- **Implementation complexity:** Medium. Outbound adapter + token verification.
- **UX burden:** Medium. Channel reliability matters.
- **Survivability:** Medium. Lost link / spoofed link risk.
- **Bootstrap fit:** Acceptable but introduces side-channel auth.

---

## 3. Comparison

| Axis | A sequential 15min | B simultaneous | C batch pre-auth | D out-of-band |
|---|---|---|---|---|
| Setup hrs (est) | 6–10 | 14–20 | 8–12 | 12–18 |
| UX burden | Low | High | Low (after pre-auth) | Medium |
| Mobile-friendly approver | ✓ optional | ~ | ✓ | ✓ |
| Real-time required | No | Yes | No | No |
| Audit clarity | High | High | Lower | Medium |
| Anti-entropy alignment | ✓ | ✓ | ✗ (latent override) | ~ |
| Bootstrap fit | ✓ | ✗ | ~ | ~ |

---

## 4. Recommended (decision support — Captain decides)

- **Recommended:** **Option A (sequential approval, 15-minute window)**.
  - Lightweight; durable pending state; explicit abort.
  - No real-time coordination overhead.
  - Maps cleanly to existing command/event flow.
  - 15-minute window absorbs normal context-switch latency without enabling latent override.
- **Lowest-cost / fastest:** A.
- **Zero-new-subscription:** all four are subscription-free.
- **Highest survivability:** A — durable pending state survives session blips.

---

## 5. Why alternatives were rejected

- **B simultaneous:** coordination overhead; failure if either actor's connection blips.
- **C batch pre-auth:** structurally a hidden override; conflicts with R9 + R12 spirit.
- **D out-of-band:** introduces side-channel auth that runtime would have to validate against the IDP; complexity without commensurate benefit at small scale.

---

## 6. Process flow (Option A — sequential approval, 15-minute window)

```
Actor 1 submits two-key command
  → dispatcher validates initiator's authority (one half satisfied)
  → emit command.pending_two_key (durable)
  → notify actor-class candidates for the second key
Actor 2 (distinct, role-class match, fresh MFA) approves
  → dispatcher verifies distinctness via IDP
  → dispatcher executes underlying command
  → emit success-event chain with both actor_ids recorded
```

**Abort paths:**

- Actor 1 cancels before second key → `command.two_key_aborted` (reason: initiator_cancelled).
- 15-minute window elapses → `command.two_key_aborted` (reason: timeout).
- Actor 2 rejects → `command.two_key_aborted` (reason: rejected, with reason_code).
- Same-actor approval attempted → `command.two_key_aborted` (reason: not_distinct).
- Actor 2's MFA stale → `command.two_key_aborted` (reason: stale_mfa).

All abort paths emit typed events with reason; nothing silent.

---

## 7. Edge cases

- **Initiator session expires after submitting:** pending command remains; actor 2 can still approve; success-event records initiator authorization at submission time.
- **Multiple actors race to approve:** first valid distinct approver wins; subsequent approvals receive `command.duplicate_ignored`.
- **Approver attempts from initiator's device:** distinctness check fails (same `actor_id`); abort.
- **Actor 1 simultaneously holds both required roles (e.g. ops + exec):** they cannot two-key with themselves; another distinct actor must pair.
- **Multi-tenant future:** per-tenant pending queues; out of v0.

---

## 8. Mobile posture

- **Initiation of two-key commands is desktop-only** (per command-authority registry; consistent with policy defaults).
- **Approval may be mobile** if the second actor's command-authority entry permits — typical default: desktop-only for both.
- **Push notification to candidate approvers** when a two-key command is pending; quiet-hour rules apply unless severity-1.

---

## 9. Auditability

- `command.pending_two_key` event durable; visible on subject timeline + governance log.
- `command.two_key_aborted` carries reason code (enum from `ENUMS_V0.md` to be added: `two_key_abort_reason`).
- Success event records both `submitted_by` (initiator) and `approved_by` (second key) actor_ids.
- Replay of a two-key sequence produces identical outcomes (pending + approve are both events).

---

## 10. Bootstrap path

1. Add command states `pending_two_key` and the supporting events.
2. Implement pending-command store as projection of `command.pending_two_key` and approval/abort events.
3. Wire 15-minute timer via the dispatcher's scheduled-check facility (already needed for SLA timers).
4. Add the abort reason enum to `ENUMS_V0.md`.

**Time-to-bootstrap:** 6–10 hours.
**Ongoing burden:** trivial.
