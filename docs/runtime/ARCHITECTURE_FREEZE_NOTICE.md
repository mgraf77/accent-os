# AccentOS — Architecture Freeze Notice

**Status:** Architecture-spec phase **FROZEN**.
**Freeze commit (pre-resolution):** `a9b94c93b95814ec67f38b49b13f7005ef0267fd`
**Freeze tag (proposed):** `architecture-spec-freeze-v0`
**Branch:** `claude/accentos-workflow-design-G0opy`

---

## 1. Frozen document scope

The following document trees are frozen. Edits require governance review per the change-control matrix below.

- `docs/workflows/` — 10 workflow systems modeling docs.
- `docs/runtime/` — runtime architecture, briefs, convergence, and resolution docs.
- `docs/runtime/registries/` — registry v0 artifacts, enums, policy defaults.

---

## 2. Change-control matrix

Each doc carries an authority level (per `ACCENTOS_RUNTIME_INDEX.md`). Edits classified as follows:

### 2.1 Constitutional

Docs: anti-entropy rules, runtime contracts, runtime boundaries, priority system, AI suggestion model, terminology.

- **Edits forbidden** except: typographical fixes, cross-reference repairs, additive clarifications that do not alter meaning.
- **Spine-altering edits** require: ops + exec + runtime team; documented in a `CONSTITUTIONAL_AMENDMENT.md` with rationale; tagged as a new architecture version.

### 2.2 Contractual

Docs: event/handoff schema, command vocabulary, integration adapter contract, registry artifacts, role/receiver model, operational state model.

- **Additive edits permitted** (new event types, new commands, new registries, new fields) via typed registry events + concurrent doc edit.
- **Breaking edits forbidden** — supersede via new typed entries and deprecate old.
- **Reviewers:** runtime team + ops; two-key per registry artifact spec for high-blast changes.

### 2.3 Specification

Docs: command center spec, operational telemetry, runtime architecture brief, runtime survivability audit.

- **Edits permitted** when grounded in a contradiction resolution, registry change, or operational-policy decision.
- **Reviewers:** ops + runtime team.

### 2.4 Brief (boundary)

Docs: auth/identity boundary, infra requirements brief, shell-runtime interaction brief.

- **Edits permitted** when the consumed-interface evolves (IDP chosen; infra acceptance criteria met; shell-v2 contract refined).
- **Reviewers:** runtime team + the consuming team (identity, infra, shell).

### 2.5 Reference

Docs: runtime index, freeze snapshot, contradiction audit, resolution log, adoption checklist.

- **Edits permitted** to reflect spec/contract/brief changes.
- **Reviewers:** runtime team.

---

## 3. Allowed edit classes

- **Typographical / cross-ref repair** — any reviewer.
- **Enum addition (additive)** — registry edit + doc edit; runtime team review.
- **Payload field addition (optional)** — registry edit + doc edit; runtime team review.
- **New event type / new command / new registry entry** — registry edit + doc edit; ops + runtime team.
- **Pattern formalization** — clarification of existing semantics; ops + runtime team.
- **Numerical policy tuning** — registry edit only (single-key or two-key per `POLICY_DEFAULTS_V0.md` § 24); doc reflects post-edit.
- **Cross-doc consistency repair** (e.g. resolving a contradiction) — atomic commit per contradiction; runtime team review.

---

## 4. Forbidden edit classes

- **In-place rename** of any event, command, field, role, registry, or term.
- **Removal** of any committed event type, command, role, capability, or registry entry without going through deprecate → end-of-life → archive.
- **Required-field addition** to existing event or command schemas.
- **New engine, new registry, new architectural layer, new abstraction** — must trigger a constitutional amendment.
- **Per-surface authority overrides** (mobile vs. desktop authority must remain identical).
- **"Admin" catch-all role** introduction.
- **Customer-visible auto-apply** for any AI capability (categorical).
- **Direct shell writes to event store** (must go through commands).
- **Hidden config / side-channel constants** that influence runtime behavior outside registries.
- **Anonymous events** or **null-receiver handoffs**.
- **Mutation of committed events.**

---

## 5. Implementation PR governance rules

Every implementation PR must satisfy:

1. **Trace to a doc.** Any new event, command, registry entry, or contract change cites the doc that authorizes it. PRs introducing un-doc-traced spine elements are rejected.
2. **Doc edit included.** PRs that introduce new spine elements must include the corresponding doc edit in the same PR.
3. **No silent code shifts.** Behavior changes corresponding to registry edits trace to typed registry events.
4. **Anti-entropy monitor honored.** PRs must not disable, weaken, or work-around an anti-entropy monitor.
5. **Boundary respected.** PRs must not violate the must-never lists in `ACCENTOS_RUNTIME_BOUNDARIES.md`.
6. **Idempotency verified.** Subscribers added or modified must be replay-safe; review-time check.
7. **Two-key respected.** Two-key commands cannot be reduced to single-key without a registry edit (loosening) which is itself two-key.
8. **Reversibility declared.** AI capabilities active without reversibility entries are rejected.

---

## 6. Anti-scope-creep rules

- "Could we add..." → first ask "does this require a new spine element?". If yes, propose a constitutional amendment; do not implement preemptively.
- "While we're here, refactor..." → only if the refactor preserves all 20 anti-entropy invariants and emits no new spine elements.
- "Quick hack for now..." → forbidden. Every hack is a hidden assumption.
- "Just for this one customer..." → forbidden. Use the override system, typed and bounded.
- "Make it more flexible..." → flexibility is provided by registries. If the registry doesn't expose the knob, propose adding one to the registry — not to code.

---

## 7. Architecture authority hierarchy

```
Constitutional   →  ops + exec + runtime team (rare amendments)
Contractual      →  runtime team + ops (registry-event flow)
Specification    →  ops + runtime team
Brief            →  runtime team + consuming team
Reference        →  runtime team
Registry edits   →  per registry artifact spec (single/two-key)
Code changes     →  implementation team, gated by doc traceability
Production       →  ops; rollback authority is ops + exec
```

No tier may bypass another. Constitutional amendments are not back-doored through registry edits.

---

## 8. Implementation authority transfer

Architecture authority **transfers** to the implementation team upon:

1. Freeze tag created on `a9b94c93b95814ec67f38b49b13f7005ef0267fd` (or post-resolution commit) as `architecture-spec-freeze-v0`.
2. All open items in `ACCENTOS_IMPLEMENTATION_ADOPTION_CHECKLIST.md` § A.3 closed.
3. All 22 contradictions in `ACCENTOS_RUNTIME_CONTRADICTIONS.md` triaged (resolved or formally deferred with documented owner).
4. Implementation team confirms reading the four governance reads in `ACCENTOS_IMPLEMENTATION_ADOPTION_CHECKLIST.md` § A.1.
5. Implementation team commits an `IMPLEMENTATION_LOG.md` to its branch acknowledging the adoption checklist.

After transfer, the **implementation team owns code**, but **does not own architecture**. Architecture changes still flow back through the governance hierarchy in §7.

---

## 9. Freeze adoption procedure

1. Resolution sprint completes (this phase).
2. Convergence commit produced (freeze head).
3. Lightweight git tag `architecture-spec-freeze-v0` created on the freeze head.
4. Implementation Phase 1 branch forks from the freeze head.
5. Architecture-spec branch becomes a slow-evolution branch under governance §7.

---

## 10. Reverting from freeze

If, after freeze, a fundamental architectural error is discovered:

- Emit a constitutional amendment proposal documenting the error and the proposed correction.
- Pause implementation phase work that depends on the affected area.
- Resolve via the Constitutional review (ops + exec + runtime team).
- Create a new architecture-spec freeze tag (e.g. `architecture-spec-freeze-v1`).

The freeze is an **operational instrument**, not a moral commitment. It exists to keep the spine stable; if the spine is wrong, the freeze is amended, not worshipped.

---

## 11. Reading order for newly-arriving stakeholders

- **Implementer:** this notice → freeze snapshot → terminology → adoption checklist → per-team reads.
- **Reviewer:** this notice → governance hierarchy → change-control matrix.
- **Auditor:** this notice → contradictions → resolution log → freeze snapshot.
- **Exec / non-implementer:** this notice → freeze snapshot.
