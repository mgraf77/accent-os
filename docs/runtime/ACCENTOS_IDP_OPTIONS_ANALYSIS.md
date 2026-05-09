# AccentOS — IDP Options Analysis

**Mode:** Decision support for Captain. **Not a choice.**
**Constraint:** verify against the 10 acceptance criteria in `ACCENTOS_AUTH_IDENTITY_BOUNDARY.md` § 14.
**Optimization:** minimal subscriptions, low operational burden, bootstrap-friendly, incremental.

---

## 1. Acceptance criteria recap (10)

1. Stable actor_id per authenticated actor.
2. Role membership flows through role registry, not IDP directly.
3. MFA-freshness exposed for two-key.
4. Distinctness verification API.
5. Session refresh with bounded lifetime.
6. Inbound-source auth evidence (where applicable).
7. Post-hoc actor lookup for replay/audit.
8. Identity-service degradation fails closed for command authority.
9. No credential storage in runtime.
10. Customer/vendor identity not leaked into actor model.

---

## 2. Options surveyed

### Option A — Self-hosted minimal IDP (e.g. SQLite + lib-driven; no external service)

- **Subscription cost:** $0 ongoing.
- **Implementation complexity:** Medium. Stable `actor_id` and roles are easy; MFA + distinctness require library work.
- **Operational burden:** Medium. Patching, session-store maintenance, MFA TOTP secrets.
- **Survivability:** Lower for runaway scale; sufficient for ≤50 operators.
- **Future scaling:** Migrating later is a real cost; identities reissue, audit linkage requires bridge events.
- **Rollback complexity:** Low (it's a single library + tables).
- **Acceptance gaps:** (3) MFA-freshness exposable but bespoke; (4) distinctness API hand-rolled; (6) inbound-source auth (SPF/DKIM) is separate concern regardless.
- **Suitable for:** bootstrap pre-product-ROI.

### Option B — Auth0 / Okta / Cognito (managed IDP)

- **Subscription cost:** $20–$200+/mo at small scale; tiered.
- **Implementation complexity:** Lower. APIs already exist for MFA, sessions, distinctness.
- **Operational burden:** Lower. Vendor handles MFA flows.
- **Survivability:** High; battle-tested.
- **Future scaling:** Low marginal cost.
- **Rollback complexity:** Higher. Vendor-specific tokens propagate into events.
- **Acceptance gaps:** (2) requires discipline — vendor's role model must NOT leak; runtime treats vendor groups as opaque, role registry remains canonical.
- **Suitable for:** post-ROI consolidation.

### Option C — Lightweight OSS (Authentik / Authelia / Keycloak)

- **Subscription cost:** $0 software; hosting cost (small VM).
- **Implementation complexity:** Medium. Standard OIDC flows.
- **Operational burden:** Medium. Self-host; patching.
- **Survivability:** Medium-high; known deployments.
- **Future scaling:** Acceptable; can absorb growth.
- **Rollback complexity:** Medium (containerized; replaceable).
- **Acceptance gaps:** All 10 satisfiable; (4) distinctness requires custom check.
- **Suitable for:** the middle ground — keeps zero subscription, gives standards-based protocols.

### Option D — Defer behind a single-actor bypass for v0 demo

- **Status:** explicitly *not* a real IDP; suitable only for sandbox demos.
- **Risk:** R20 (no admin god-mode) collides immediately on multi-actor work.
- **Not recommended for any real workflow.**

---

## 3. Comparison

| Axis | A self-hosted | B managed | C OSS | D bypass |
|---|---|---|---|---|
| Subscription | $0 | $$ | $0 (hosting) | $0 |
| Setup hrs (est) | 12–20 | 4–8 | 8–12 | 1 |
| MFA out-of-the-box | Bespoke | ✓ | ✓ | ✗ |
| Distinctness API | Bespoke | ✓ | Bespoke layer | ✗ |
| Inbound source auth | Separate concern | ✓ (some) | Separate | ✗ |
| Vendor lock-in | None | High | Low | None |
| Migration cost later | Medium | Low–medium | Low | High |
| Suitable bootstrap | ✓ | ~ | ✓ | demo-only |
| Suitable production | small only | ✓ | ✓ | ✗ |

---

## 4. Recommended (decision support — Captain decides)

- **Recommended:** **Option C (lightweight OSS, e.g. Authentik or Authelia)**.
  - Zero ongoing subscription.
  - Standards-based (OIDC) — future migration cost is bounded.
  - All 10 acceptance criteria satisfiable; only distinctness requires a thin custom layer.
  - Operationally familiar; large community; docker-friendly bootstrap.
- **Lowest-cost:** A or C ($0 subscription). C wins on standards posture.
- **Zero-new-subscription:** A or C.
- **Fastest-to-implement:** B (managed). Trade-off: subscription + vendor lock-in.
- **Highest survivability:** B managed (vendor scale + MFA hardening). Marginal over C for AccentOS-scale workflows.

---

## 5. Why alternatives were rejected for the recommendation

- **A self-hosted minimal:** acceptable but bespoke MFA/distinctness become operational burden at exactly the wrong moment (when the team is busy with runtime + shell).
- **B managed:** subscription cost without ROI proof; vendor-coupling propagates into auth flows that touch every command.
- **D bypass:** violates R20 in any multi-actor workflow.

---

## 6. Acceptance criteria check (Option C — Authentik or Authelia)

| # | Criterion | C posture |
|---|---|---|
| 1 | Stable actor_id | ✓ — OIDC `sub` claim |
| 2 | Role flows through role registry | ✓ — runtime ignores vendor groups |
| 3 | MFA freshness | ✓ — `auth_time` claim |
| 4 | Distinctness API | ~ — thin custom adapter required |
| 5 | Session refresh | ✓ — refresh tokens with bounded lifetime |
| 6 | Inbound-source auth | n/a (SPF/DKIM separate) |
| 7 | Post-hoc actor lookup | ✓ — userinfo endpoint |
| 8 | Fail-closed | ✓ — by runtime convention; not vendor-specific |
| 9 | No runtime credential storage | ✓ — runtime stores tokens, not passwords |
| 10 | Customer/vendor isolation | ✓ — convention; not vendor-enforced |

10/10 satisfiable; 1 requires a thin custom layer; 1 is structurally separate.

---

## 7. Bootstrap path (recommended)

1. Stand up the lightweight IDP behind the runtime (small VM or containerized).
2. Implement OIDC client in the dispatcher's authority service.
3. Implement the distinctness adapter (custom thin layer reading two presented credentials, confirming distinct `sub` claims with fresh `auth_time`).
4. Issue OIDC tokens; runtime treats `sub` as `actor_id`.
5. Role memberships managed only in role registry — vendor groups are opaque.

**Time-to-bootstrap:** 8–12 hours one-time.
**Ongoing burden:** patches; user provisioning (small at AccentOS scale).
