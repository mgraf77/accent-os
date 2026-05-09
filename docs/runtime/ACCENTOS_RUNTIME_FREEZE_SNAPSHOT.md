# AccentOS — Runtime Freeze Snapshot

**Mode:** Authoritative handoff packet for implementation phases.
**Status:** Architecture-spec phase frozen at commit `607942c1b9035265160890bb0d6486f7a1be7393` (plus this convergence layer).
**Reading time:** ~10 minutes. Sufficient to understand the runtime stance without touching the 28 underlying docs.

---

## 1. Runtime philosophy

AccentOS is an **operational orchestration runtime** disguised as a CRM-shaped application. Its purpose is to keep operational truth aligned across a small business that runs on time-sensitive, hand-off-heavy workflows (sales → design → build → vendor → install → service).

Three opinions drive the entire spine:

1. **Operational determinism over flexibility.** Routing, priority, authority, and escalation are *computed*, not declared. Same inputs → same outcome.
2. **Accountability through typed events.** Every operational change is a typed, immutable, attributable event. There is no silent state.
3. **Honesty over apparent smoothness.** Under uncertainty, the runtime surfaces uncertainty (stale markers, blocks, rejections, degraded indicators) rather than guessing.

These three commitments dictate every concrete decision below.

---

## 2. Survivability philosophy

- **The event store is the only catastrophic SPOF.** Everything else is rebuildable. Backup discipline at the event store is the load-bearing requirement; everything else degrades.
- **Component-by-component degradation, not whole-system outage.** Notification engine down ≠ system down. Adapter down ≠ writes down. Receiver-resolution down = handoffs visibly blocked.
- **No fabricated state.** Stale projections render dimmed; missing data renders unavailable; degraded engines say so. The operator is never lied to.
- **No silent recovery.** Every degradation and every recovery emits typed events. CC always shows component status.
- **Read-only mode under sustained DR is preferable to fabricated state.**

---

## 3. Anti-entropy philosophy

20 invariants (`ACCENTOS_ANTI_ENTROPY_RULES.md` R1–R20) are non-negotiable. They reduce to ten simultaneous "is the system alive?" tests:

1. Every operational change is an event. (R11)
2. Every handoff is named, acked, and resolves. (R1, R2, R10)
3. Every override is typed, bounded, and visible. (R9, R15)
4. One priority spine. One CC. One event log. (R3, R4, R5)
5. AI is reversible, audited, and on the timeline. (R7, R13)
6. Sticky states stay sticky; bypasses are loud; bounces are interrupted. (R8, R12, R16)
7. Mobile is verbs; desktop is composition. (R19)
8. Roles are bounded; admin god-mode does not exist. (R20)
9. Time is honest; emitters are named. (R17, R18)
10. No subject is unowned. (R6)

If a future implementation can answer "yes" to all ten daily, the orchestration is alive. The day any one slips, entropy starts. Each invariant maps to at least one runtime monitor emitting typed violation events.

---

## 4. Replay philosophy

- **Replay is deterministic.** Same events + same registry versions → identical projections.
- **Replay never re-fires alarms.** Side-effect subscribers (notifications, outbound senders, AI auto-applies) honor a typed replay marker and suppress.
- **Projections are pure.** Side effects live in dedicated subscribers; rebuilding a projection silently does not page anyone.
- **Replay validates determinism on cadence.** Differential checks every 6 hr per major projection; full replay validation weekly on a non-production replica.
- **Recovery uses replay.** Lost projections rebuild from the event store. Lost event store is catastrophic — backup discipline is the only defense.

---

## 5. Command/event philosophy

- **Commands are intent. Events are fact.** Shell submits commands; runtime emits events.
- **Every command produces ≥1 event** — success chain or typed rejection. Never silent.
- **Authority is central.** Decided by `(command_name, role, ownership)` per command-authority registry. Never per-surface.
- **Idempotency is mandatory.** Every command carries a stable `command_id`; resubmission is a duplicate.
- **AI never submits commands as itself.** Pattern: AI suggests → human (or auto-policy gate) accepts → runtime synthesizes the underlying business command on behalf of the subject's human owner with `correlation_id`. AI work is on the subject timeline.
- **Two-key commands exist** for high-blast actions (suppress-red, AI policy resume, customer-visible flag changes). Mobile-forbidden by default.
- **Customer-visible auto-apply is categorically prohibited.** Structurally rejected at registry registration.

---

## 6. Registry philosophy

Ten registries hold all runtime governance. **No side channels.** No constants in code that influence behavior.

| Registry | Two-key trigger |
|---|---|
| Event-type | breaking changes (forbidden — new types only) |
| Role | escalation chain; authority changes |
| Priority | band thresholds |
| SLA / clock | drift tolerance |
| AI-policy | loosening |
| Reversibility | any change |
| Coverage | none (single-key, typed) |
| Quiet-hours | severity-bypass |
| Escalation | tier ownership |
| Command-authority | loosening; customer-visible flag |

- **Edits are typed events.** History is preserved.
- **Registry version stamped on consuming events** for replay determinism.
- **Freeze semantics** — typed event suspends mutations during incidents/audits/migrations.
- **Schema is the spine; never edit the spine.** Add → deprecate → end-of-life → archive.

---

## 7. Shell/runtime boundary philosophy

Eight layers, each with **must-do / must-never** lists. Cross-cutting invariants:

- Only the runtime emits events.
- Only the runtime mutates operational truth.
- Only the priority engine produces priority.
- Only the receiver-resolution service names a receiver.
- Only the AI suggestion engine routes AI work into commands.
- Only the notification engine sends notifications.
- Only registries hold runtime governance.
- Only the event store is canonical.

Shell renders projections + state evaluator output. Shell submits typed commands. Shell never computes priority, never authors notifications, never invents state. Mobile is a verb surface; desktop is a composition surface; **CC = `Executive Review` state** (never forked).

---

## 8. Adapter philosophy

- **Adapters translate; they don't decide.** External signal → typed event (or directive → external action). No business logic.
- **Idempotency mandatory.** Inbound: content-hash + source-id. Outbound: directive-supplied id. Two-way: mapping table both directions. AI inference: input-hash. Sensor: source+signature+window.
- **Ambiguity is a typed event, not a guess.** `adapter.parse_ambiguous` routes to AI suggestion engine for human-confirmed disambiguation.
- **One adapter per source per direction.** No forks.
- **Two-way adapters declare canonical side per field.** No silent conflict resolution.
- **Outbound never re-fires on replay.** Stale-suppression rule.
- **Customer-visible outbound prefers fail-loud over retry-into-double-send.**

---

## 9. AI philosophy

- **Suggestions are operational objects**, not popups. Lifecycle: proposed → presented → accepted/rejected/deferred/applied/auto-applied/verified/reverted/expired/superseded.
- **Calibrated confidence is the product.** Tracked, recalibrated, displayed honestly.
- **Reversibility class + policy class together gate auto-apply.**
- **AI never sets priority.** AI changes inputs; the priority engine recomputes.
- **AI never owns subjects.**
- **Customer-visible auto-apply prohibited.**
- **Induced-red ceiling auto-suspends auto-apply** for the affected type. Resume requires two-key.
- **Per-type and per-owner trust** signals feed back into future presentations. Rejected suggestions cannot re-present unchanged.

---

## 10. Operational-state philosophy

Nine states, with composition rules and precedence: `Escalated > Urgent > Blocked > Focus > Executive Review > Normal`, with `Read-Only`, `Mobile Quick Mode`, `AI Assist` layering.

- **`Urgent` and `Escalated` are sticky.** Cannot be self-dismissed while triggers are live.
- **`Blocked` is its own state.** Surfaces what's awaited and offers "switch to next" — actively guides off dead-ends.
- **`Executive Review` and CC share a surface.** Forking would split the priority spine.
- **State transitions are observable events.** Time-in-state per role per day is operational health.
- **The shell asks one question:** "what state is this session in?" — and configures accordingly.

---

## 11. Implementation-readiness state

### Frozen architecture surface (29 docs, 5 phases)

| Layer | Docs | Status |
|---|---|---|
| Workflow systems modeling | 10 | Frozen |
| Runtime architecture | 6 | Frozen |
| Registry v0 | 5 | Frozen (v0 seed) |
| Boundary briefs (auth, infra, shell) | 3 | Frozen (acceptance criteria) |
| Convergence (this layer) | 5 | Frozen |

### Open content/policy items (block implementation; resolvable in days)

1. Enum content gaps — customer-message intent, service severity, PO eta-slip reasons, escalation resolution codes, adapter-degraded reasons, AI rejection reasons, business-rule rejection reasons. (Tracked in contradictions doc C21.)
2. `ai.outbound.*` boundary decision — single capability or composite.
3. `quote.send_with_margin_override` shape decision.
4. Customer-proxy authority schema.
5. RTO + full-system replay duration numerical values.
6. IDP choice + acceptance against 10 criteria in auth boundary brief.
7. Tamper-evidence mechanism for event store.
8. Multi-tenant trigger condition.
9. Two-key release process (in-app dual-approval mechanism).
10. AI calibration baseline window per capability.

### Open contradictions to triage (22 items, all resolvable without invention)

See `ACCENTOS_RUNTIME_CONTRADICTIONS.md`. Triage order: high-blast-radius (C3, C5, C12), audit-affecting (C8, C9, C16), versioning (C4), operational (C7, C13), enum content (C20, C21).

### Validation gates (Phase 1 acceptance)

| Gate | Definition |
|---|---|
| Anti-entropy smoke | every monitor fires on synthetic violation |
| Deterministic replay | rebuild produces identical projections |
| Receiver-resolution determinism | replay sample identical outcomes |
| Two-key distinctness | distinct actor_ids + MFA freshness verified |
| Component degradation | each engine kill → CC reflects + recovery typed |
| Registry mutation flow | every edit emits typed event |
| Schema evolution | additive non-breaking; new types for breaking |
| Adapter ambiguity | low-confidence parses route to suggestion |
| AI auto-apply gating | customer-visible never auto |

### Implementation-team handoff package

A new implementer reaches operational competence by reading, in order:

1. This freeze snapshot. (10 min)
2. Terminology doc. (10 min)
3. Operational workflows. (30 min)
4. Anti-entropy rules. (15 min)
5. Runtime boundaries. (15 min)
6. Their phase-specific reading list (from the runtime index).

Total: ~2 hr to operational competence; ~1 day to deep-read the full corpus.

---

## 12. What this snapshot is NOT

- It is not a substitute for the underlying docs on contested points.
- It is not a license to invent — every implementation decision must trace to a doc; deviations require a doc-edit going through the same review.
- It does not authorize any production change.
- It does not approve any technology choice.

---

## 13. Authoritative commit reference

- **Architecture-spec freeze commit:** `607942c1b9035265160890bb0d6486f7a1be7393`
- **Convergence-layer commit:** updated by this phase.
- **Branch:** `claude/accentos-workflow-design-G0opy`
- **Doc count:** 29 docs across 5 phases.

Implementation Phase 1 may begin once the open content/policy items above are resolved and the contradictions are triaged. No further architecture-spec passes are required.
