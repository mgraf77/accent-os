# SIGNAL_ENTROPY_RISKS
**Status:** open risk register · **Pairs with:** all other CANONICAL_SIGNAL_* docs
**Purpose:** name every place the consolidated model could re-fragment, so future sessions can see the trap before stepping in it.

---

## R1 — Table named `alerts`, concept named `Signal` (NAMING DRIFT)
**Risk:** Future code authors revert to "alert" in identifiers because the SQL table is `alerts`. Within six months, half the codebase uses "alert" and the consolidation unravels.
**Severity:** high · **Likelihood:** high
**Mitigation:** Governance §10 PR checklist; lint rule (future) banning new identifiers containing `alert` outside `js/alerts.js` and `sql/M02_*`.

## R2 — Operator Signals leak into `alerts`
**Risk:** Someone notices efficiency-monitor signals "look like" alerts and writes them to the `alerts` table. The operator queue fills with meta-noise; trust collapses.
**Severity:** high · **Likelihood:** medium
**Mitigation:** Runtime §4.3 + Governance §9. Add a CHECK or trigger forbidding non-§4.1 types in `alerts.type`.

## R3 — Severity inflation
**Risk:** Generators emit at `urgent` to "make sure it's seen." Within weeks, urgent loses signal.
**Severity:** high · **Likelihood:** very high (this is the dominant mode of failure in signal systems)
**Mitigation:** Type registry §4.1 has a **severity floor**, not a default — generators MUST justify emitting above floor in code comments. Periodic audit: % of urgent Signals that get `actioned` vs `dismissed`. If dismissal rate > 30%, the band is leaking.

## R4 — Queue explosion from missing dedupe
**Risk:** A generator forgets `payload.source_id` or uses a non-stable identifier. Each hydrate re-emits. Bell becomes useless.
**Severity:** very high · **Likelihood:** high (this is the leak Phase 1 fixes)
**Mitigation:** Phase 1 of the implementation sequence. Until done, this is the single largest risk to the entire model.

## R5 — Parallel competing primitives
**Risk:** Codex or Jules lanes re-introduce a "publish" or "raise" function alongside `createSignal()`. Two functions write to `alerts`, only one calls `shouldSuppress`.
**Severity:** high · **Likelihood:** medium
**Mitigation:** PRIMITIVES doc §cross-cutting; PR checklist; grep guard: only `createSignal()` may INSERT into `alerts`.

## R6 — Auto-escalation creep
**Risk:** Someone implements pager/email/webhook escalation in V1 "because it's just one line." This crosses §8 of the runtime doc (boundaries of automation).
**Severity:** medium · **Likelihood:** medium
**Mitigation:** Runtime §6 declares V1 escalation passive. Any change requires a V2 governance bump and explicit Michael sign-off.

## R7 — Lifecycle state proliferation
**Risk:** "We just need `snoozed` for this one workflow." The 4-state model becomes 6, then 9. Reasoning collapses.
**Severity:** medium · **Likelihood:** medium
**Mitigation:** Governance §5 lists the banned synonyms explicitly so the request is visible-as-violation when it arrives.

## R8 — Confidence as theater
**Risk:** Generators emit `confidence: 0.83` with no real probabilistic basis, and the UI treats it as meaningful.
**Severity:** medium · **Likelihood:** medium
**Mitigation:** Governance §7 requires `[0,1]` floats; the UI thresholding (Phase 3) treats anything ≥ 0.5 identically. Until a generator has a real model, it should default to `1.0` (i.e., abstain).

## R9 — Dedupe-index design ambiguity
**Risk:** SQL partial unique index on `(type, (payload->>'source_id'))` filtered by `status IN ('unread','read')` is non-trivial; a half-correct implementation either over-suppresses or under-suppresses.
**Severity:** medium · **Likelihood:** high during Phase 1
**Mitigation:** Implementation sequence Phase 1 explicitly flags this; review the index DDL through this risk register before merge.

## R10 — KPI X12 definition drift
**Risk:** "Escalation rate" in `KPI_CATALOG.md` was authored before this governance. If we now define escalation as urgent+unread+>24h, X12's denominator/numerator must be reconciled. Otherwise dashboards lie.
**Severity:** medium · **Likelihood:** confirmed (needs reconciliation pass)
**Mitigation:** Reconciliation task in Phase 0/4. Update KPI_CATALOG X12 with the canonical formula from runtime §6.

## R11 — Operator trust as the binding constraint
**Risk:** None of this matters if the bell dropdown is noisy on day one of any new generator. Trust is destroyed in days and rebuilt in quarters.
**Severity:** existential · **Likelihood:** medium
**Mitigation:** Phase 6 (new types) is gated behind Phases 1–4 for exactly this reason. The implementation sequence is the trust budget.

## R12 — Documentation entropy (this set of docs becoming non-canonical)
**Risk:** Someone writes `SIGNAL_RUNTIME_V2.md` without superseding V1, and now there are two truths.
**Severity:** medium · **Likelihood:** medium
**Mitigation:** Any V2 doc MUST start with an explicit `Supersedes: V1` header and V1 is renamed to `_DEPRECATED_`. No silent forks.
