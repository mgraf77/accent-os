# AccentOS — Runtime Implementation Bootstrap Plan

**Mode:** Pre-implementation operational plan for Phase 1.
**Constraint:** lightweight-first; minimal subscriptions; scale only after ROI proof.
**Status:** plan, not code.

---

## 1. Bootstrap philosophy

1. **Lightweight-first.** The smallest infra that satisfies acceptance criteria. Containers on a small VM beat managed services until ROI demands otherwise.
2. **Scale only after ROI proof.** Each scale-up is gated by a typed ROI signal — not anticipation.
3. **Dynamic AI cost throttling.** AI capabilities ship in `calibrating: true` (advisory only); auto-apply enables only after baseline + budget proof.
4. **Subscription minimization.** Zero-subscription stack is the default; subscriptions added only when an explicit gap forces them.
5. **Survivability over scale.** A reliable single-VM is worth more than an unreliable cluster.
6. **Anti-entropy from day one.** Even on the smallest deployment, every monitor is live.

---

## 2. Lightweight-first infrastructure approach

### 2.1 Initial footprint

- **One small VM** (or two for separation of event store and engines if budget permits).
- **One container per logical role:** event store, dispatcher + engines, projection store, optional adapters, IDP (lightweight OSS per IDP options), telemetry sink.
- **Local backups** to a separate failure domain (cloud bucket; cross-region within the same provider acceptable for v1).
- **No managed message bus.** Internal communication via in-process channels or file-system event log; subscribers tail the log.
- **No analytics warehouse.** Telemetry events are projections in the same store.

### 2.2 What's explicitly NOT bootstrapped

- Multi-region deployment.
- Auto-scaling groups.
- Managed orchestration platforms.
- Long-horizon analytics warehouse.
- Mobile native packaging (web mobile is sufficient for v1).

### 2.3 Resource escalation thresholds

The runtime moves to the next tier of infrastructure when **any** trigger fires:

| Trigger | Action |
|---|---|
| Active operators > 25 | Split event store and engines onto separate VMs |
| Daily event volume > 50k | Add managed message bus or persistent queue |
| Replay latency > policy default | Move to managed event store |
| Backup restore tests fail twice | Re-evaluate event-store technology |
| AI inference cost > revenue × 1% | Restrict auto-apply scope; tighten thresholds |
| Adapter quota-exhausted events > 1/wk | Move outbound adapter to dedicated provider |

Each escalation is a typed ops decision.

---

## 3. Dynamic AI cost throttling philosophy

- **Every AI capability ships disabled-for-auto** (`calibrating: true`).
- **Auto-apply enables capability-by-capability** after:
  1. Calibration baseline window completes (per `POLICY_DEFAULTS_V0.md` § 13).
  2. Acceptance rate above threshold during the window.
  3. Per-capability cost budget declared and tracked.
- **Per-capability daily/weekly cost budget**, surfaced on CC's AI hotspots tile.
- **Auto-suspend on budget breach** — same mechanism as induced-red ceiling.
- **Tiered escalation for AI usage:**
  - Tier 0: capability inactive in production.
  - Tier 1: human-required only; calibrating.
  - Tier 2: auto-apply enabled within budget; cap = 25% of daily budget.
  - Tier 3: full auto-apply within budget; routine.
  - Cap escalation requires ai-policy-owner + ops two-key.

This throttling is purely a **registry policy** — no architecture changes.

---

## 4. Implementation dependency graph

```
Tier 0 — prerequisites (closed by prior phases or parallel decision docs)
  ├── IDP decision + integration
  ├── Tamper-evidence mechanism decision
  ├── Two-key process decision
  └── Adoption checklist § A and § B passed

Tier 1 — foundation (no business engines)
  ├── Event store (append-only, hash-chain)
  ├── Dispatcher (command + adapter ingress)
  ├── Registry-as-projection (seed from v0 docs)
  ├── Schema-registry self-check
  └── Audit-immutability self-check

Tier 2 — authority (depends on Tier 1 + IDP)
  ├── Identity-service integration
  ├── Command-authority service
  ├── Two-key distinctness + pending state
  └── Read-only enforcement

Tier 3 — orchestration (depends on Tier 1–2)
  ├── Receiver-resolution service
  ├── Handoff lifecycle engine
  ├── Priority engine (with hysteresis)
  ├── Escalation engine (with bounce protection)
  └── Operational-state evaluator

Tier 4 — derivation (depends on Tier 1–3)
  ├── Notification engine (replay-marker-aware)
  ├── AI suggestion engine (with reversibility/policy gates)
  └── CC projection layer

Tier 5 — boundary (depends on Tier 1–4)
  ├── First inbound adapter
  ├── First outbound adapter
  └── Shell-v2 command submission

Tier 6 — anti-entropy + telemetry (parallel with Tier 5)
  ├── Anti-entropy monitor coverage
  └── Telemetry projections

Tier 7 — validation gates (acceptance)
  └── All 12 validation gates from adoption checklist § E
```

---

## 5. Safe parallelization opportunities

| Track | Dependencies | Can parallelize with |
|---|---|---|
| Event store + dispatcher | Tier 0 | — (foundation) |
| IDP integration | Tier 0 | event-store work |
| Receiver resolution + handoff | Tier 1 + 2 | priority engine |
| Priority engine | Tier 1 | receiver resolution |
| Operational-state evaluator | Tier 1 | priority + receiver |
| First adapter (inbound parser) | Tier 1 | shell command submission |
| First adapter (outbound) | Tier 1 + AI suggestion | — |
| AI suggestion engine | Tier 1 + Tier 3 partial | notification engine |
| CC projection layer | Tier 3 + Tier 4 partial | adapters |
| Anti-entropy monitors | each Tier as it lands | continuously |
| Telemetry projections | Tier 1 onward | continuously |

Roughly three implementer tracks can run productively in parallel after Tier 2.

---

## 6. First executable milestone (M0)

**Goal:** event submission round-trip demonstrating commit-after-emit-and-route, with at least one synthetic command producing one synthetic event chain visible in a primitive subject-timeline projection.

**Required:**

- Event store with append-only persistence + hash chain.
- Dispatcher with command ingress + minimal validation.
- One typed command + one resulting event registered.
- One projection consuming the event and exposing it for read.

**Excluded from M0:** authority, receiver-resolution, priority, escalation, AI, notifications, CC.

**Estimated effort:** 12–18 hrs.

---

## 7. Minimum viable event-store milestone (M1)

**Goal:** event store with all `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 3 acceptance criteria operational.

**Required additionally over M0:**

- `event_id` dedupe.
- `(occurred_at, received_at, event_id)` ordering.
- Per-subject log retrieval.
- Replay support.
- Schema-registry self-check.
- Audit-immutability self-check (hash chain).
- Backup configured (continuous + weekly auto-restore-test).

**Estimated effort:** +14–22 hrs over M0.

---

## 8. Lowest-risk runtime slice (M2 — minimum useful)

**Goal:** one full workflow vertical operational end-to-end.

Recommended slice: **`sales.lead.created` → `sales.lead.claim` → `sales.lead.assigned`** with:

- Event store + dispatcher (M1).
- Identity + command authority.
- Receiver resolution.
- Operational-state evaluator (Normal + Mobile Quick Mode only).
- One projection (sales-pool tile).
- Shell command submission.
- One mobile quick action (`Claim`).

**Excluded from M2:** AI, escalations, full priority spine, full CC, adapters.

**Estimated effort:** +30–50 hrs over M1.

**Why this slice:** lowest count of blocking dependencies; touches authority, receiver resolution, projection lag, and mobile quick action without requiring vendor adapters or AI.

---

## 9. Rollback checkpoints

| Checkpoint | Rollback path |
|---|---|
| After M0 | Throw away; restart with new dispatcher choice |
| After M1 | Event store backup restore; redo if M2 work didn't land |
| After M2 | Per-engine isolation lets individual engines roll back |
| After Tier 5 (shell + adapters) | Disable shell; runtime continues; re-roll shell |
| After Tier 6 (validation) | Production-ready; rollback by re-deploy of prior tag |

Rollback is `git revert` + redeploy until the runtime is in production; production rollback is per `ACCENTOS_RUNTIME_SURVIVABILITY_AUDIT.md` § 12.

---

## 10. Testing cadence

- **Per-PR unit tests** on every component.
- **Per-PR contract tests** for handlers (idempotency; replay-safe).
- **Daily integration smoke** running synthetic event streams through Tier 1+2.
- **Weekly anti-entropy smoke** running synthetic violation streams; every monitor must fire.
- **Weekly deterministic-replay validation** on a non-prod replica.
- **Monthly DR drill** against backup restore.
- **Per-Tier acceptance gate** before moving to next Tier.

---

## 11. Anti-entropy validation cadence

- **Monitors live from Tier 1.** Even before business engines, the immutability + ordering self-checks run.
- **Each Tier adds its monitors** as components land. (E.g. null-receiver detector lands with Tier 3.)
- **CC anti-entropy banner** lights as soon as the CC projection layer (Tier 4) is up.
- **Synthetic violation tests** run weekly from Tier 1 onward; expected-firing monitors must trigger.
- **Cumulative coverage check** at end of every Tier — every R rule has at least one named monitor with passing synthetic test.

---

## 12. Estimated runtime implementation effort

| Tier | Hours | Notes |
|---|---|---|
| Tier 0 (decisions) | 8–14 | IDP + tamper + two-key choices and integration plans |
| Tier 1 (foundation) | 30–45 | Event store, dispatcher, registries-as-projection, self-checks |
| Tier 2 (authority) | 20–30 | IDP integration, command authority, two-key, read-only |
| Tier 3 (orchestration) | 40–60 | Receiver resolution, handoffs, priority, escalation, op-state |
| Tier 4 (derivation) | 30–45 | Notifications, AI suggestion, CC projections |
| Tier 5 (boundary) | 30–45 | First adapter pair, shell command submission |
| Tier 6 (anti-entropy + telemetry) | 20–30 | Distributed across other Tiers |
| Tier 7 (validation) | 15–25 | Gate execution + remediation |
| **Total** | **~190–290 hrs** | one experienced implementer; less in parallel |

With three parallel tracks: **~75–110 calendar hours** of wall-clock if work is steady.

---

## 13. Stop-the-line rules

Implementation **pauses** when:

- An anti-entropy monitor fires unexpectedly during synthetic tests.
- A contract violation is discovered that requires architecture amendment.
- The dependency graph has been violated (e.g. attempting Tier 3 without Tier 2).
- Override budgets are being exercised in the synthetic stream beyond expected.
- Replay determinism check fails.

Pause is loud; resumption is via a typed runtime governance event documented on the implementation log.

---

## 14. Subscription-minimal stack proposal (illustrative)

| Concern | Proposal | Subscription |
|---|---|---|
| VM | Small managed VM | $5–$20/mo |
| Storage / event store | Local with cloud backup | $0–$5/mo backup |
| IDP | Lightweight OSS container | $0 |
| Tamper evidence | Hash chain in event payload | $0 |
| Outbound email | One transactional sender free tier | $0 (low volume) |
| AI inference | Per-call API w/ tight budgets | $0–$25/mo at boot |
| Telemetry | Self-hosted projections | $0 |
| Backup target | Cloud object storage | $0–$3/mo at small scale |

**Approximate bootstrap monthly cost: ~$10–$50** depending on AI usage and email volume. Scales with operator count and event volume — not with feature ambition.

---

## 15. Incremental scaling path

```
Bootstrap (single VM)
   ↓ trigger: > 25 operators OR replay latency degrades
Two-VM split (event store + engines)
   ↓ trigger: daily events > 50k OR multi-region need
Managed event store + queue
   ↓ trigger: regulatory or org-expansion
Multi-tenant + cross-region
```

Each scaling step is a typed ops decision with named trigger; no anticipatory scaling.

---

## 16. Validation acceptance for production go-live

- All 12 gates in `ACCENTOS_IMPLEMENTATION_ADOPTION_CHECKLIST.md` § E pass.
- All 20 anti-entropy monitors live and synthetic-validated.
- Backup restore test passes twice in succession.
- IDP fail-closed verified.
- Two-key distinctness end-to-end verified.
- Component-by-component degradation drill passes.
- One inbound + one outbound adapter operational with documented degradation behavior.
- M2 vertical (sales lead claim) operational on mobile + desktop.

When all hold, production go-live is authorized by Captain + ops.

---

## 17. Cost-vs-ROI gates

Before any cost-incurring action:

- **AI inference cost > $X/wk** without accept-rate justifying → throttle / suspend type (`ai-policy-owner` + ops two-key to resume).
- **Outbound message cost > $Y/wk** without conversion signal → review template effectiveness.
- **VM scaling > tier threshold** → ops decision; not auto-scale.
- **New managed service subscription** → ops + Captain authorization; documented ROI rationale.

ROI is itself a typed signal in telemetry, not a vibe.
