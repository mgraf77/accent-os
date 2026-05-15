# SIGNAL_IMPLEMENTATION_SEQUENCE_V1
**Status:** authoritative phase order · **Pairs with:** CANONICAL_SIGNAL_RUNTIME_V1.md
**Principle:** ship anti-noise before ship-new-signal. Operator trust is the binding constraint.

---

## Phase ordering (do not parallelize across phases)

### Phase 0 — Freeze (this session, complete on doc-merge)
- Adopt the 5 canonical docs.
- Reconcile any prose in `BUILD_PLAN_*`, `MASTER.md`, `KPI_CATALOG.md` that uses forbidden synonyms.
- **Exit criteria:** the 5 canonical docs are committed; no forbidden synonyms appear in new prose.

### Phase 1 — Dedupe hardening (HIGHEST LEVERAGE)
- Audit `js/alerts.js` so every generator emits with `payload.source_id`.
- Add a generator-side check that queries unresolved Signals with `(type, source_id)` before insert.
- Add a SQL partial unique index aligned with the dedupe rule (governance review required, see §risks).
- **Dependency:** Phase 0.
- **Exit criteria:** zero duplicate unresolved Signals across a 7-day window.

### Phase 2 — Lifecycle transition hygiene
- Centralize all status mutations through one `transitionSignal()` primitive (see PRIMITIVES doc).
- Forbid direct UPDATEs to `alerts.status` outside this primitive.
- Add a guard: terminal-state Signals reject further transitions.
- **Dependency:** Phase 1 (without dedupe, transition correctness doesn't matter).

### Phase 3 — Confidence + suppression visibility
- Begin emitting `payload.confidence` from the highest-noise generators (`quote_cold`, `score_dropped`).
- UI: dim Signals with confidence < 0.5 in the bell; persist normally.
- **Dependency:** Phase 2.

### Phase 4 — Escalation surfacing (passive only)
- Add a view/dashboard for "urgent + unread + age > 24h" → feeds KPI X12.
- Still no external paging. V1 escalation remains passive.
- **Dependency:** Phase 2 (need correct status to compute age-of-unread).

### Phase 5 — Operator-class signal aggregator
- `efficiency-monitor` Stop-hook aggregator already exists; formalize its schema match to the governance doc.
- Cross-reference Operator Signals with Operational Signals only in reports, never in the same sink.
- **Dependency:** Phases 1–2.

### Phase 6 — New generator types (gated)
- Only after Phases 1–4 are green may new types be added to the §4.1 registry.
- Each new type requires a one-paragraph case in `SIGNAL_ENTROPY_RISKS.md` for review.
- **Dependency:** all prior phases green.

---

## Anti-noise rollout rationale

Generators that ship before dedupe is hardened destroy operator trust faster than they create operational value. The sequence is therefore: **fix the leak, then add water.** Phases 1–2 are the leak; Phase 6 is the water.

## Governance checkpoints

- **After Phase 1:** verify no duplicate-unresolved Signals in production.
- **After Phase 2:** grep the codebase for `alerts.status` UPDATEs — must all route through `transitionSignal()`.
- **After Phase 4:** confirm X12 is computable from the dashboard view.
- **Before Phase 6:** re-read `SIGNAL_ENTROPY_RISKS.md` and resolve any open items.

## Leverage ranking (one-shot, anchored to bottleneck-finder method)

| Phase | Unblocks | Effort | Leverage |
|---|---|---|---|
| 1 (dedupe)    | 2, 3, 4, 6   | S | **highest** |
| 2 (lifecycle) | 3, 4, 6      | S | high |
| 4 (X12 view)  | KPI surface  | XS | high |
| 3 (confidence)| 6            | M | medium |
| 5 (op-signal) | reporting    | S | medium |
| 6 (new types) | new value    | varies | gated |

**Start at Phase 1.**
