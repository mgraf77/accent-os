# AccentOS — Tamper Evidence Options Analysis

**Mode:** Decision support for Captain. **Not a choice.**
**Constraint:** satisfy `ACCENTOS_INFRA_REQUIREMENTS_BRIEF.md` § 7.3 — periodic verification that any out-of-band edit is detectable.
**Optimization:** zero new subscriptions; minimal compute; bootstrap-friendly.

---

## 1. What's actually required

- **Detection of out-of-band mutation** of committed events. Not prevention (storage is append-only at the data-layer); detection.
- **Self-check cadence** per `POLICY_DEFAULTS_V0.md` § 5 (currently every 1 hr for audit-immutability).
- **No external service dependency.**
- **Acceptable additional CPU/storage:** small.

---

## 2. Options surveyed

### Option A — Hash chain (Merkle-style) per subject log

- Each event carries `prev_event_hash`; periodic verification recomputes chain.
- **Subscription cost:** $0.
- **Implementation complexity:** Low–medium. ~20 lines of hashing logic; storage adds 32 bytes per event.
- **Operational burden:** Trivial (self-check is cheap CPU).
- **Survivability:** High — any in-place edit breaks the chain at that event and every subsequent.
- **Detection guarantee:** Strong — single-event mutation visible immediately at next self-check.
- **Failure mode if chain breaks:** typed `runtime.audit.immutability_check` violation; ops investigates.
- **Key management:** none (cryptographic hash, no secret).
- **Rollback complexity:** None — historical events keep their hashes.

### Option B — HMAC over event content with rotated key

- Each event carries an HMAC signed with a runtime-held key; rotation via key registry.
- **Subscription cost:** $0.
- **Implementation complexity:** Medium. Key rotation flow + secret management.
- **Operational burden:** Higher — secret rotation; secret loss = unverifiable history.
- **Survivability:** Strong if keys are protected; brittle if not.
- **Failure mode:** lost key → can't verify; spoofed key → compromise.
- **Key management:** required.
- **Rollback complexity:** Higher — keys must persist for verification.

### Option C — External notarization service (e.g. blockchain anchor)

- **Subscription cost:** Variable; usually paid.
- **Implementation complexity:** High; rate-limited.
- **Operational burden:** Higher.
- **Survivability:** Strong but introduces an external dependency.
- **Detection guarantee:** Strong; broader audit posture.
- **Bootstrap fit:** Poor — overshoot for AccentOS scale.

### Option D — Append-only WAL with periodic checksum manifest

- Storage layer write-ahead log; periodic checksum of WAL manifest.
- **Subscription cost:** $0.
- **Implementation complexity:** Low if storage exposes WAL; medium otherwise.
- **Operational burden:** Low.
- **Survivability:** Strong against in-place mutation; lower against full-WAL replacement (mitigated by composing with A).
- **Bootstrap fit:** Good if storage technology choice supports it.

### Option E — Combine A + D

- Hash chain at application layer + WAL checksum at storage layer.
- **Cost:** $0.
- **Implementation complexity:** A is mandatory anyway; D is "free" if storage supports.
- **Defense in depth.**

---

## 3. Comparison

| Axis | A hash chain | B HMAC | C notary | D WAL ckpt | E A+D |
|---|---|---|---|---|---|
| Subscription | $0 | $0 | $$ | $0 | $0 |
| Detect single edit | ✓ | ✓ | ✓ | ✓ | ✓ |
| Detect chain replacement | weaker (need anchor) | weaker | ✓ | ✓ | ✓ |
| Key management | none | yes | partial | none | none |
| Setup hrs (est) | 4–6 | 8–12 | 16+ | depends | 6–10 |
| Ongoing burden | trivial | rotation | external service | trivial | trivial |
| Storage overhead | 32 B/event | 32 B/event | minimal | none–low | 32 B/event |
| Bootstrap fit | excellent | medium | poor | good | excellent |

---

## 4. Recommended (decision support — Captain decides)

- **Recommended:** **Option E (Hash chain + WAL checksum manifest where storage supports it; just A otherwise)**.
  - Zero subscription.
  - Detection is strong for the most common attack (single in-place edit) and acceptable for chain-replacement when paired with WAL checksum.
  - No key management.
  - Self-check is cheap CPU.
  - Bootstrap-ready immediately.
- **Lowest-cost:** A, D, E (all $0).
- **Zero-new-subscription:** A, B, D, E.
- **Fastest-to-implement:** A alone (4–6 hrs).
- **Highest survivability:** E or C; E without subscription.

---

## 5. Why alternatives were rejected for the recommendation

- **B HMAC:** key management cost without commensurate detection improvement at AccentOS scale.
- **C notary:** subscription + external dependency; overshoot.
- **D alone:** depends on storage choice; weaker against application-layer mutation.

---

## 6. Detection guarantee (Option E)

- **Single committed-event mutation:** detected at next 1-hr immutability self-check (chain breaks).
- **Bulk chain replacement:** detected by WAL checksum manifest (if available) or by absence of chain-anchor consistency at restore time.
- **Restore from backup:** WAL checksum manifest matches; chain re-verifies clean.
- **Compromised runtime node writing forged events:** detected when self-check runs on the canonical event store.

---

## 7. Self-check cadence

- **Continuous, sampled:** verify every Nth event's hash on insert (cheap).
- **Periodic, full:** full-chain rehash per subject every 1 hr (per `POLICY_DEFAULTS_V0.md` § 5).
- **On-demand:** ops-triggered full verification before audits or restores.

Each emits typed `runtime.audit.immutability_check` events.

---

## 8. Bootstrap path

1. Add `prev_event_hash` to event schema (additive payload).
2. Compute chain at commit; store with event.
3. Schedule per-subject hash-chain verification at the configured cadence.
4. If storage supports WAL checksum, surface it as part of the orchestration-health view; otherwise defer D.

**Time-to-bootstrap:** 4–10 hours.
**Ongoing burden:** trivial.

---

## 9. Anti-patterns explicitly avoided

- Storing hashes in a separate table that itself can be tampered with. (Hashes are inline on events.)
- Using a hash function with known weaknesses; default to SHA-256.
- Treating hash failure as a soft warning. R11 says it's a P0-class violation event.
