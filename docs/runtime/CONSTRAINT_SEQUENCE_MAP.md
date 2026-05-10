# Constraint Sequence Map — AccentOS

> **Predictive systems analysis. Not a plan, not a roadmap, not a build sequence.**
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companions: `CONSTRAINT_RADAR.md` (living readings), `ORCHESTRATION_BOTTLENECK_MAP.md` (B1..B7), `ORCHESTRATION_MATURITY_MODEL.md` (L0..L5), `UNATTENDED_EXECUTION_PREREQUISITES.md` (substrate prerequisites). Read those before this one.

---

## 0. Frame

This document orders the constraints that will become binding *after* the current binding constraint (B1) is relieved. The sequencing engine answers a different question than the radar: not "what binds now," but "given the next move, what binds next, and after that, and after that."

**What this document is.** Predictions, with explicit dependency relationships, expected failure signatures, and earliest observable precursors. Each prediction is honest about confidence.

**What this document is not.** Not implementation guidance. Not a build sequence. Not authorization to perform any of the named transitions. The transitions are *analytical phase markers*, not deliverables. Calling them deliverables outside this analysis would constitute capability-expansion advocacy without substrate justification (forbidden per `CONSTRAINT_RADAR.md` §2).

**Single test.** If a paragraph reads as "we should now build X," the wording is wrong. The form is "if X were to land, Y would become binding." The conditional is load-bearing.

---

## 1. Phase markers (definitions)

The user-supplied phase markers are not defined elsewhere in the repo. They are defined here as *analytical primitives* — names for predicted future states. Definitions are deliberately minimal so the prediction is portable across implementation choices not yet made.

### 1.1 — `register()` lands
A mechanism by which a session, packet, or operation records its intent / claim / lifecycle in a machine-readable record before performing the work. The form factor (function call, file lock, row insert) is unspecified. The definition is the *contract*: "no work begins until something has registered it; no work ends without something updating the registration." Functionally pairs with the canonical resume record from substrate step S2 (`CONSTRAINT_RADAR.md` §6.2).

### 1.2 — First module isolation
A pattern by which different concerns within the runtime own non-overlapping write scopes. AccentOS today has implicit isolation (skill A "should" only edit certain files); module isolation is the move to *explicit* isolation (skill A *cannot* write files outside its scope, by configuration or wrapper, not by convention). This is the precursor to per-runtime isolation in B4 swarm work, but it is a single-runtime concept first.

### 1.3 — Governance transition
The move of an enforcement rule from skill prose into harness configuration. AccentOS today enforces the standing halt list (`autonomous-mode/SKILL.md:80–90`) via Claude reading and honoring prose. A governance transition is when one or more such rules land in `.claude/settings.json`, permission allowlists, file-pattern denylists, or hook gates — somewhere structurally enforced. Maps to substrate step S6.

### 1.4 — First substrate seed
The first piece of any state, signal, or process that lives *outside* a Claude session and is consumed by something other than the same Claude session that produced it. The smallest possible form: a single read+respect contract honored across the runtime/loop boundary. Does not have to be a supervisor, daemon, or queue; only has to be *outside*. Maps to the start of substrate step S1.

### 1.5 — First real orchestration substrate
The state in which `register()` plus a structured authoritative resume record are both consumed by a process outside any single Claude session, end to end, with no LLM in the parsing loop. Maps to S1+S2 paired (`CONSTRAINT_RADAR.md` §6). Pre-supervisor; pre-escalation.

These markers compose. Most are sequenced; one (governance transition) can land before, in parallel with, or after the substrate work depending on scope.

---

## 2. The sequence (chronological)

Predicted ordering, lowest-risk first. Each phase is *conditional* on the prior phase having landed honestly (see `PHASE_TRANSITION_FAILURES.md` for what "honestly" rules out).

```
Phase 0  — today: L1 baseline; B1 binding; B2 latent.
Phase 1  — first substrate seed lands. Smallest possible out-of-runtime
           read+respect contract. Substrate step S1 begins.
Phase 2  — register() lands inside the substrate. The state record becomes
           authoritative; the loop begins to consume it. S1+S2 paired
           effectively land here.
Phase 3  — governance transition lands. The standing halt list (or some
           subset) moves from skill prose into harness config. S6.
Phase 4  — first module isolation lands. Write scopes become explicit per
           module/skill. Pre-B4 single-runtime isolation.
Phase 5  — supervisor seed lands. Out-of-runtime liveness probe consuming
           the substrate from Phase 2. Approaches L3.
Phase 6  — escalation channel lands. Supervisor signals reach a human via
           a path that survives session death. L3 effectively reached.
Phase 7+ — overnight execution becomes available. L4 / L5 are off the
           horizon at the date of this analysis.
```

The user's five phase questions map to: Phase 2 (`register()`), Phase 4 (module isolation), Phase 3 (governance), Phase 1 (first seed), Phase 2 again (first real substrate). The chronological reordering above resolves their interleavings.

---

## 3. What binds after the first substrate seed (Phase 1 → 2)

```
Predicted next binding constraint: register-contract honesty
Confidence:                        high
Dependency:                        Phase 1 produces a single read+respect
                                   contract; without register(), the
                                   contract has nothing to read about.
```

**Why it binds.** A bare substrate seed is a single fact written outside the runtime. The next demand is "more facts, with discipline" — i.e., a registration contract that defines *what* gets recorded, *when*, and *who is allowed to update it*. Without that contract, every subsequent consumer infers shape from the seed and inferences diverge.

**Failure signature if ignored.** The seed remains in place but readers each parse it differently. Two readers can disagree about whether a session is "still running" because the seed never specified how that field is updated. The substrate becomes ambiguous; the runtime/loop boundary it was supposed to enforce dissolves.

**Earliest observable precursor.** Two artifacts begin to interpret the seed in subtly different ways. Concretely: if the seed is a file, two readers parse the same field's value as different status enums.

**Dangerous "looks fine" state.** One reader works perfectly because there is only one reader. Adding the second reader exposes the gap; until then, the seed appears successful and a register() contract appears unnecessary.

**Reversibility window.** Wide — the seed can be retired and replaced with a register()-bearing contract before any consumer depends on its current shape. Once two consumers depend on it, the window narrows sharply.

---

## 4. What binds after register() lands (Phase 2 → 3)

```
Predicted next binding constraint: enforced halt-list (governance) OR
                                   supervisor-readiness; sequencing is
                                   discretionary
Confidence:                        medium
Dependency:                        register() makes session lifecycle
                                   observable; the next question is
                                   whether observation has authority.
```

**Why it binds.** With register() in place, a process outside the runtime can answer "is this session alive?" The answer is meaningless until it is allowed to *do* something. Two paths are equally defensible:

- **(a) Governance first (S6).** Move the standing halt list into harness config. The runtime is now both registered and structurally constrained; supervisor work gets to assume the constraints are real, not narrative.
- **(b) Supervisor seed first.** Build the smallest possible liveness consumer that reads register() and reports stale heartbeats. Defer governance to after.

Path (a) is the radar's recommendation (`CONSTRAINT_RADAR.md` §6 ordering). Path (b) is reasonable when the human review surface is already saturated and a watchful eye is the bigger relief. Both produce honest forward motion. Choosing both at once is tempting and is the most common shape of pre-supervisor over-reach (see `PHASE_TRANSITION_FAILURES.md` §3.2).

**Failure signature if ignored.** With register() but no enforcement and no observer, the system has visibility without discipline. Sessions register, they update, they run; the records accumulate and inform nothing. The substrate becomes an audit log, which is useful but does not relieve B1.

**Earliest observable precursor.** Operations begin appearing in the registration record that are described as "complete" but produce no committed work. The record is the only source claiming completion; nothing structurally verifies it.

**Dangerous "looks fine" state.** The registration record looks busy. Counts go up. Charts could be drawn. None of this implies the runtime is meaningfully more reliable than at L1.

**Reversibility window.** Wide for path-choice. Narrow once the supervisor consumes register() — at that point governance must move quickly or the supervisor becomes the structural single-point-of-failure (it can stop sessions but not constrain them, which is worse than stopping them).

---

## 5. What binds after governance transitions (Phase 3 → 4)

```
Predicted next binding constraint: write-scope ambiguity across modules
                                   (precursor to B4 in single-runtime form)
Confidence:                        medium
Dependency:                        Once the halt list is enforced, the
                                   next question is "who is allowed to
                                   write what." Today this is convention;
                                   governance forces it to be config.
```

**Why it binds.** A governance transition tightens what *cannot* be done. The next pressure point is the inverse: clarifying what *each* part of the runtime is *permitted* to do. The standing halt list is a system-wide denylist; module isolation is per-module allowlists. Without them, governance has only made forbiddens explicit; permissions remain implicit.

**Failure signature if ignored.** Two skills, two packets, or one skill running in two contexts edit overlapping files with different intents. The governance gate did not prohibit it (it is not on the halt list) but the result is incoherent. The longer this persists, the more "by convention, X edits Y" lore accumulates and the more brittle the system becomes when conventions fail.

**Earliest observable precursor.** A single file appears in the working tree changes of two consecutive packets that did not coordinate. Today this happens occasionally and is absorbed by Michael's review; post-governance, with packets running longer and Michael reviewing less often, it stops being absorbed.

**Dangerous "looks fine" state.** Each individual packet appears clean. The damage is at the interface between packets and is invisible from inside any one packet.

**Reversibility window.** Moderate. Once a write-scope is explicitly assigned, retracting it is governance work (more transition, see §4). Reassigning before the system has accreted convention is cheaper.

---

## 6. What binds after first module isolation (Phase 4 → 5)

```
Predicted next binding constraint: cross-module signaling fidelity
Confidence:                        medium-low (further out; more
                                   speculative)
Dependency:                        With write scopes explicit, modules
                                   that previously coordinated through
                                   shared writes now need explicit
                                   signaling. The signal medium becomes
                                   the bottleneck.
```

**Why it binds.** Module isolation makes the boundary explicit. The next question is what crosses the boundary. Today modules coordinate through shared markdown — a "shouting through a wall" pattern. With isolation, that becomes either (a) a richer cross-module signal contract (write to a shared registry; read from it) or (b) explicit module-to-module messages. Either way, signaling becomes the visible cost.

**Failure signature if ignored.** Modules are individually well-scoped but are not coordinating. Work that requires cooperation across module lines either stops happening or is forced into one module that absorbs the cross-cutting concern, growing into a god-module that re-introduces the original ambiguity.

**Earliest observable precursor.** A new "coordination" file appears (e.g., `_cross_module_state.md` or a settings field) that reads as "I made this because the modules needed to agree on something." That reads as innocuous; it is the precursor.

**Dangerous "looks fine" state.** The system continues working because most cross-module needs are absorbed by one or two ad-hoc patterns. The rate of new ad-hoc patterns is the leading indicator; absent measurement, the situation looks stable.

**Reversibility window.** Narrow. Once cross-module patterns are in production use, retracting them requires identifying what they communicated and either codifying or removing — both expensive.

---

## 7. What binds after first real orchestration substrate (Phase 2 already; restated)

The user's question lists this as a separate phase from "register() lands." In the chronological sequence above, "first real orchestration substrate" is the *state* in which Phases 1+2 are jointly effective: register() lands, the record is structured, and the runtime/loop boundary actually carries work. Treating it as a third Phase 2-equivalent state:

```
Predicted next binding constraint: budget oracle / cost series (B3)
Confidence:                        medium
Dependency:                        With substrate live and register()
                                   honored, the next bound on safe
                                   expansion is whether spend can be
                                   measured outside the runtime. B3.
```

**Why it binds.** A real substrate makes runtime lifecycle observable. Lifecycle alone is not enough for safe expansion — without cost observability, the substrate cannot enforce budget caps. Today's budget enforcement is self-honored (`SESSION_RESET_RESILIENCE.md` §7); a real substrate exposes the gap between self-honored and substrate-enforced.

**Failure signature if ignored.** Sessions register correctly, the supervisor (when it lands) sees them clearly, and they run past budget anyway because no one external is counting. The supervisor reports compliance based on self-claims. The compliance is fictitious.

**Earliest observable precursor.** Two consecutive sessions report "within budget" in their freeze artifacts but produce visibly different commit volumes for similar scopes. The self-report is no longer correlated with reality; nothing external catches the divergence.

**Dangerous "looks fine" state.** Budget reports are present, formatted, and read like data. They are claims, not measurements. The form factor of the report is the camouflage.

**Reversibility window.** Narrow once the supervisor begins making decisions on the bad signal. Until then, wide — the signal can be replaced before any consumer trusts it.

---

## 8. Dependency graph (compact)

```
                     Phase 0 (today, L1, B1 binding)
                              │
                              ▼
                     Phase 1: substrate seed
                              │
                              ▼
            Phase 2: register() lands; first real substrate
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
        Phase 3: governance      [optional reorder:
        transition (S6)          supervisor seed first;
                  │              governance second]
                  ▼                       ▼
        Phase 4: module          (rejoins after
        isolation                governance lands)
                  │
                  ▼
        Phase 5: supervisor seed
                  │
                  ▼
        Phase 6: escalation channel (L3 reached)
                  │
                  ▼
        Phase 7+: overnight available; L4/L5 off horizon
```

Hard ordering invariants:
- Phase 0 → 1 → 2 is non-negotiable.
- Phase 3 and Phase 5 can swap, with caveats in §4.
- Phase 4 cannot precede Phase 3 (write scopes need a denylist before allowlists are useful).
- Phase 6 cannot precede Phase 5 (escalation without an observer is a UI without a brain).
- Phase 7+ cannot precede Phase 6.

Soft ordering:
- The two consequences of Phase 2 (B3 cost-series binding; supervisor-readiness binding) can be sequenced either way; the radar prefers governance-then-supervisor for blast-radius reasons.

---

## 9. Forbidden re-orderings

Sequences that *look* faster but compound pressure. Each is named explicitly so future readers do not rationalize the sequence in.

- **Skip Phase 1; go directly to Phase 2.** Building register() without a substrate seed produces a contract that has nowhere to live. The temptation is to "make the registration record itself the seed" — this collapses two phases that need separate honesty checks.
- **Skip Phase 2; go directly to Phase 5.** Building a supervisor before register() makes the supervisor the de-facto state writer. It now owns *both* observation and lifecycle. The single-process problem moves up a level.
- **Skip Phase 3; go directly to Phase 5.** Supervisor without governance is the path that turns observed misbehavior into a "we'll add a rule later" backlog. Rules deferred until after they are needed are the most likely to be implemented under pressure (see `PHASE_TRANSITION_FAILURES.md` §6.3).
- **Phase 4 before Phase 3.** Module allowlists without a system denylist produce gaps where things are "permitted by allowlist but forbidden by intent." Allowlists assume the denylist's bedrock.
- **Phase 6 before Phase 5.** A channel that escalates messages from no-one-watching is just notifications. They train recipients to ignore them, which corrupts the channel before the supervisor lands.
- **Two phases at once.** All multi-phase combinations dilute the per-phase honesty check. Each phase has a *post-condition* (something that must be true for the phase to be considered landed); two phases at once mean the second phase's post-condition tests against an unstable first phase.

---

## 10. Confidence map

For readers who care which predictions are firm and which are speculative.

| Prediction | Confidence | Why |
|---|---|---|
| Phase 0 → 1 ordering | high | Identical to substrate-seed-first reasoning in `CONSTRAINT_RADAR.md` §6 |
| Phase 1 → 2 ordering | high | register() without seed has nothing to register against |
| Phase 2 → 3 vs. 2 → 5 | medium | Defensible either way; radar prefers 3 first |
| Phase 3 → 4 ordering | medium | Allowlist-after-denylist invariant |
| Phase 4 → 5 ordering | medium-low | Module isolation does not strictly precede supervisor; ordering reflects safe-progression preference, not a hard invariant |
| Phase 5 → 6 → 7+ ordering | high | Escalation needs observer; overnight needs escalation |
| All "what binds after" predictions | medium | Predictions are forecasts; the radar reading at the time of the actual transition supersedes |

---

## 11. The single sentence

The next binding constraint is always the smallest one that the current move makes visible; the sequencing engine names that one before it binds, and refuses to name later ones as if they were already in scope.
