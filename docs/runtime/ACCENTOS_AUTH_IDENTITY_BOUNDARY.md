# AccentOS — Auth / Identity Boundary

**Mode:** Architecture / specification (no implementation, no IDP choice)
**Anchors:** all runtime docs
**Purpose:** Define what the runtime requires from an identity/auth provider — as an interface, not a vendor decision.

---

## 0. Scope

- The runtime does **not** implement identity. It consumes an identity service via a typed interface.
- The runtime does **not** choose an IDP. (Out of scope.)
- The runtime **does** define what it needs from identity in order for its contracts to hold.

---

## 1. Actor identification requirements

Every typed event carries `emitter` and every command carries `submitted_by`. Both reference an **actor** the runtime can identify.

The identity service must provide, per actor:

- **Stable actor_id** (does not change with name, email, or role rotation).
- **Display name** (operational, not authoritative).
- **One or more role memberships** (resolved at decision time).
- **Active/inactive status.**
- **MFA-state** (used by the runtime only for two-key distinctness checks).

The runtime never invents an `actor_id`. Anonymous actors are forbidden by R18; `system` and `ai` are valid named non-human actors with stable ids of their own.

---

## 2. Role membership lookup

- **Read-at-decision-time.** The runtime queries role membership at command authority check, not at session start. Mid-session role changes take effect on the next command.
- **One-to-many actor↔role.** An individual may hold multiple roles (e.g. sales-rep + ops); the command authority check resolves to "any role with required authority".
- **Effective-role resolution is deterministic.** Same actor + same registry version + same command → same authority outcome.
- **Role grants are themselves typed events** in the role registry; identity service is the source of *who-is-who* but role-membership-changes flow through the registry, not the IDP.

---

## 3. Two-key distinctness

For two-key commands (`orchestration.subject.suppress_red`, `ai.policy.resume_type`, etc.) the runtime must verify:

- **Two distinct actor_ids** participate in the action.
- **Both are MFA-authenticated** within a recent window.
- **Their role memberships satisfy the command's two-key actor-class requirement** (e.g. ops + exec).
- **The two keys are independent** — not the same actor with two devices.

Identity service must expose distinctness verification: given two presented credentials, confirm distinct actor_ids and current MFA freshness.

---

## 4. Command authority dependency

- Every command authority check reads `(submitted_by.actor_id, current role memberships, command-authority registry entry)`.
- Identity service must respond fast (commands are interactive); a slow IDP is a runtime degradation.
- On identity-service degradation, command authority **fails closed**: commands reject as `command.rejected.no_authority` rather than silently passing. Surface is loud.

---

## 5. Adapter inbound source authentication

- **Inbound parsers** (vendor email, webhook ingester, telephony) must authenticate the source before treating content as fact.
- Identity service (or a domain-bounded delegate, e.g. SPF/DKIM verification for email) provides authenticity evidence.
- Unauthenticated inbound emits `adapter.source_unauthenticated`; content routes to ambiguity, never to facts.
- For non-actor sources (vendors, customers via email), the runtime treats the *source channel* as authenticated, not the human behind it. The actor on the resulting events is a `system` or `adapter` emitter, with provenance pointing to the verified source.

---

## 6. Session state requirements

- The runtime expects identity to provide **session establishment** (login + MFA) and **session refresh** with bounded lifetime.
- Each session carries:
  - `actor_id`
  - `device_class` (mobile/desktop)
  - `mfa_freshness` (timestamp of last MFA event)
  - `geo_context_optional` (informational, not authoritative)
- Session state changes (login, logout, force-refresh) emit typed `session.*` events that the runtime consumes for telemetry and the operational-state evaluator.

---

## 7. Read-only enforcement expectations

- `Read-Only` operational state is enforced at command submission: any non-annotation command from a Read-Only session is rejected.
- Identity service supplies the inputs that determine read-only scope: actor_id + role + (optionally) explicit read-only-grant for cross-branch access.
- Runtime does not query identity to render projections; it queries to authorize commands. Read access is governed by role registry's read scopes, evaluated by the projection layer using identity-provided role memberships.

---

## 8. Audit identity requirements

- Every emitted event carries the **stable actor_id**, not a display name. Renames don't rewrite history.
- The audit timeline can render display names from a snapshot at event time, but the canonical attribution is the actor_id.
- Identity service must support **post-hoc actor lookup** for replays — given an actor_id, return enough context (current display name, current roles) to render audit views.

---

## 9. Customer / vendor proxy identity

- Commands like `quote.mark_accepted` (proxied for the customer) carry the customer's identity in payload (signature_ref, contact ref) but are `submitted_by` the rep or system that captured it.
- The runtime treats the customer as a **subject reference**, not an actor. Customer identity is a property of the subject, supplied by sales/finance flows; not authenticated by the IDP.
- Where the customer signs digitally (e-signature platform), the adapter that ingests the signed doc treats the platform's authentication as evidence on the event payload (`signature_ref` with provenance), not as a runtime actor.

---

## 10. AI as an actor

- The runtime treats `ai` as a named non-human actor class.
- Each AI capability has a stable identity (capability_id) registered in the AI capability registry.
- Events emitted by AI carry `emitter: ai` plus `capability_id` and `model_identity` (a runtime concern for calibration; the IDP is not involved).
- AI cannot login, cannot satisfy MFA, cannot participate in two-key. AI's "authority" comes from the AI policy class registry, not from the identity service.

---

## 11. Secrets / credentials

- The runtime does **not** store credentials.
- Credentials for outbound adapters (email send, calendar sync, payment) are managed by infra; the adapter contract (§13 outbound side-effect discipline) treats credential availability as a precondition.
- Adapter degradation on credential loss emits `adapter.degraded` with reason `credential_unavailable`; CC shows component status.

---

## 12. Out of scope

- IDP choice (Okta, Cognito, Auth0, in-house, etc.).
- Federation / SSO mechanics.
- Password / MFA UX.
- Customer auth (separate concern; customers are subjects, not actors).
- Encryption-at-rest / in-transit (infra).
- Detailed permission grants below the operational-role granularity (the role registry is the boundary).

---

## 13. Anti-patterns

- Identity service treated as the source of truth for role memberships (the role registry is).
- Allowing commands to pass authority check when identity service is slow (must fail closed).
- Hard-coded actor_ids in adapter or projection logic.
- Reusing display names as identity (renames break audit).
- AI assigned a human identity.
- Customers modeled as actors instead of subjects.
- Two-key commands accepting two factors from the same actor.

---

## 14. Acceptance criteria for an integrated IDP

An IDP integration is acceptable to runtime when:

1. ☐ Stable actor_id for every authenticated actor.
2. ☐ Role-membership-changes flow through the role registry, not the IDP directly.
3. ☐ MFA-freshness exposed for two-key checks.
4. ☐ Distinctness verification API exposed.
5. ☐ Session refresh with bounded lifetime.
6. ☐ Inbound source authentication evidence (where applicable) exposed to adapters.
7. ☐ Post-hoc actor lookup for replay/audit.
8. ☐ Identity-service degradation fails closed for command authority.
9. ☐ No credential storage in runtime.
10. ☐ Customer / vendor identity not leaked into actor model.

When all ten hold, the IDP is implementation-acceptable. Specific IDP choice is a separate phase.
