# FAR_TRACK_STATE

> **Living state register.** Far-track architecture readings, kept current as the train ships
> corridors. The mission of this doc is to ensure architecture maturity stays *ahead of* execution
> velocity — not to plan execution itself.
>
> **Role this doc serves:** far-track builder output. Phase-classed, not packet-classed.
> **Role this doc does NOT serve:** corridor specs, packet sizing, train scheduling.
> **Update protocol:** §15. Each section is independently updatable.
>
> Pack: 14th doc under `docs/runtime/`.

---

## 0. STATE STAMP

| Field | Value |
|---|---|
| Snapshot date | 2026-05-10 |
| Last update | 2026-05-10 (initial author) |
| Last train session referenced | Session 10 (P1 → P9 corridor) |
| Integration branch HEAD at last reading | not directly observed from this lane (analysis branch separation) |
| `index.html` size at last reading | ~2,009 LOC (per Session 10 report) |
| `register()` substrate status | not yet shipped (planned to land inside Stage 2 / a Phase A packet) |
| Cartography pack staleness debt | 12 of 13 prior docs reference pre-decomposition shell sizing; queued correction (per `TRAIN_TRACK_OPERATING_MODEL §12.2`) |

This doc is updated only when one of the trigger conditions in §15 fires. Routine "I'd like to refresh thoughts" is not a trigger.

---

## 1. CORE DOCTRINE — RESTATED FROM PACK

The doc operates against the established phase model:

| Phase | Shape | Begins when | Ends when |
|---|---|---|---|
| **Phase A** | Un-binding the shell (drain `index.html`, ship `register()` substrate, isolate `internal_meetings.js`) | (already started by Session 10) | Completion conditions §2 |
| **Phase B** | Registry coverage rollout + strictness elevation + sidebar/auth consumption of registry | Phase A completion conditions met **and** §3 prerequisites hold | When coverage ≥80 % + 7 observation days + Phase B → C transition criteria met |
| **Phase C** | Phase 4 connector work + orchestration tier | Phase B stable + E0 + S0 + G0 ratified | Out of current far-track horizon |

Far-track work concerns the *transitions between* phases. It does not author the corridors that ship inside a phase — those are near-track work.

---

## 2. PHASE A COMPLETION CONDITIONS

The conditions under which Phase A is *complete and stable* — not merely shipped.

### 2.1 Hard conditions
A1. `index.html` drained of all content classified `EXTRACT-FIRST` in `DECOMPOSITION_STRATEGY_V1`:
   - Inline `<style>` blocks → `css/aos.css` ✓ likely covered by Session 10 (TBD verify)
   - Shell utility helpers (`toast`, `openModal`, `$`, `qsa`, `esc`, `csvDownload`, `csvStringify`, `v`) → `js/shell_utils.js` (status: unverified from this lane)
   - Quote-print template → `js/quote_print.js` (status: unverified)
   - Vendor view templates → `js/vendors.js` (status: unverified)
   - Quick-Actions FAB → reconciled with `js/quick_actions.js` (status: unverified)

A2. `internal_meetings.js` sub-split into per-feature files (`im_prep`, `im_agenda`, `im_notes`, `im_todos`, `im_followups`, `im_transcripts`, `im_state` or equivalent set). Status: unverified.

A3. `register()` function present in `js/shell_utils.js` (or equivalent). Status: not yet observed. **Likely the highest-leverage gap.**

A4. At least three modules have adopted `register()` and produced no warnings against each other across one full hydrate + first-mount cycle. Status: not yet observed.

A5. Phase A Stages 6 (sidebar generator) and 7 (auth extract) are *either* complete *or* explicitly deferred to a follow-on phase with documented rationale. Status: unknown for either stage.

A6. Cartography-pack numbers are current — the staleness debt acknowledged in §0 has been paid (one dedicated correction commit per `TRAIN_TRACK_OPERATING_MODEL §12.2`).

### 2.2 Stability conditions
A7. One full session has passed without any module commit requiring an `index.html` touch beyond a `?v=` bump.

A8. No `BUILD_INTELLIGENCE.md` entry has been added for a Phase-A-introduced regression for one full session.

A9. `MASTER.md §3 / §4` reflects the post-Phase-A shape (governance commit landed, did not need correction within the same session).

### 2.3 Current completion estimate
**Estimated Phase A progress: 50–75 %** (uncertain from this lane).

The size-axis evidence (~7,169 → ~2,009 LOC, ~72 % drop) suggests A1 may be largely complete. The substrate axis (A3, A4) is the open question. Without `register()` shipped and at least three modules registered, Phase A is *not* complete *regardless* of how small the shell becomes — the substrate is the load-bearing condition, not the size.

**Note:** the pre-decomposition pack projected ~3,000–4,000 LOC at end of Phase A. Reality is below that target on the size dimension. This means either (a) Phase A is past its size target, or (b) the train shipped some L2 or L3 work without first landing the substrate. Both possibilities motivate near-track investigation in the next session, not far-track restructuring.

### 2.4 Trigger for next update
This section should be re-read at the next near-track session that produces a corridor-11 doc. If A3/A4 status becomes known, update §2.3.

---

## 3. PHASE B PREREQUISITES

What must hold *before* Phase B begins. (Phase B = registry coverage rollout + strictness elevation.)

### 3.1 Substrate prerequisites
B1. `register()` exists and is callable from any module.
B2. The registry is observable (e.g. via `window.AOS_REGISTRY` or a similar single read surface).
B3. Registration is non-blocking (warns, does not throw) by default.
B4. The shell exposes a strict-mode toggle that is *not* enabled by default (e.g. URL param or env-var equivalent).

### 3.2 Adoption prerequisites
B5. At least three modules are registered without producing collision or missing-consume warnings against each other.
B6. The first-cohort modules are documented as the seed set so that future cohorts have clear precedent.

### 3.3 Stability prerequisites
B7. Phase A completion conditions §2.1 are met.
B8. One full session of post-Phase-A operation without regression (§2.2).
B9. `MASTER.md` describes the new architecture and references the cartography pack (per §11 G0 substrate seed).

### 3.4 Governance prerequisites
B10. The Phase A → Phase B transition is *itself* a recorded commit. Per `TRAIN_TRACK_OPERATING_MODEL §13`, "the system is still in the prior phase until the transition is recorded."

### 3.5 Current readiness estimate
**Phase B is NOT yet ready.** Substrate prerequisites (B1–B4) are unverified at minimum; without them, registration cannot begin.

The bottleneck is *not* shell size. It is the substrate. The train can keep draining shell, but until `register()` is shipped, Phase A is incomplete and Phase B is unreachable. **This is the most important reading in the entire doc as of this snapshot:** the train's velocity has carried it past size targets while leaving the substrate unbuilt. Decomposition is producing line-count progress without producing isolation progress.

### 3.6 Trigger for next update
- When `register()` is observed in `js/shell_utils.js`, update B1–B4.
- When the first three modules are registered, update B5–B6.
- When the transition commit lands, update B10.

---

## 4. LOADER BOUNDARY EVOLUTION

The loader boundary is not a single event. It evolves through gradients.

### 4.1 The five gradients (in evolution order)
| Gradient | Description | When it becomes available |
|---|---|---|
| **G0 — Substrate exists** | `register()` is a callable function | Phase A end |
| **G1 — First registration** | At least one module declares provides/consumes | Phase A end |
| **G2 — Cohort coverage** | Coverage at ≥3 modules with no warnings | Phase B start |
| **G3 — Strict-on-collision** | Throws on duplicate `provides` | Coverage ≥60 %, 14 days zero collision warnings |
| **G4 — Strict-on-missing-consume** | Throws on unsatisfied `consumes` | Coverage ≥80 %, 7 days zero missing-consume warnings |
| **G5 — Strict-on-undeclared-leak** | Mutation-containment diff throws on undeclared `window.*` writes | Coverage = 100 %, opt-in per environment only |

### 4.2 Evolution properties
- Each gradient is *opt-in*. The default remains observation-only.
- A gradient can be enabled in CI / staging / a debug URL flag without affecting production.
- A gradient can be *un*-enabled if it produces unexpected breakage; the rollback is changing a flag, not reverting code.
- G5 may never be flipped. Observation is sufficient.

### 4.3 Far-track concern
The risk is *premature strictness*. Enabling G3 before its trigger condition holds means a single noisy collision dark-routes a module. The pack's prior framing was clear on this; the far-track concern at this snapshot is whether the train, having moved fast, is tempted to fast-track the gradients to "make Phase B look done."

**Rule:** strictness is not a milestone. It is a *trust gradient*. Its purpose is to harden a substrate the system already trusts. A substrate that hasn't earned trust through observation cannot be hardened into trust by enabling the throw.

### 4.4 Current state
- G0: not yet present.
- G1–G5: unreachable until G0.

### 4.5 Trigger for next update
When G0 ships, update §4.4. When G1 is observed (first module registered), update again. After G2 is reached, this section's update cadence rises (each cohort).

---

## 5. register() SUBSTRATE EVOLUTION

The substrate itself evolves as it is consumed.

### 5.1 Evolution stages
| Stage | What the substrate provides | What consumes it |
|---|---|---|
| **S1 — Naming-only** | name + provides + consumes | observation/diagnostic only |
| **S2 — Lifecycle hooks** | + onBoot / onMount / onUnmount / onLogout | shell-side dispatcher (calls hooks at right time) |
| **S3 — Sidebar source** | + module mode + role-defaults | sidebar generator (replaces `<a data-roles>` HTML) |
| **S4 — Schema-typed consumes** | + table-name `consumes` for sbFetch surface | schema-aware tooling (post-Phase-B) |
| **S5 — Connector registry parallel** | (separate registry for integrations) | Phase C orchestration tier (E0) |

### 5.2 Evolution properties
- S1 is the minimum viable substrate (~30–50 LOC).
- S2 is the natural follow-on once shell-side hooks exist post-Phase A.
- S3 collapses the three-source-of-truth on module visibility (`REPO_TOPOLOGY_MAP §6.2`).
- S4 addresses the `sbFetch` URL-string abstraction drift (`ARCHITECTURAL_DRIFT_MODEL §6.5`).
- S5 is *not* the same `register()`. It is a sibling concept for connectors, sharing shape but operating on integrations.

### 5.3 Far-track concern
The temptation to *combine* stages — ship S1 + S2 + S3 in one packet because "they're all related." This is the canonical track-decay failure: the substrate hasn't earned trust at S1, but is being asked to deliver S3's value before observation has surfaced the S1 quirks.

**Rule:** stages ship in order. S2 waits until S1 has at least one cohort registered cleanly. S3 waits until coverage is high enough that the sidebar can be sourced from the registry without losing entries.

### 5.4 Current state
None of S1–S5 is observed.

### 5.5 Trigger for next update
When `register()` ships, fix the S1 row's "what consumes it" column based on actual usage. Each subsequent stage's row is updated when its consumer arrives.

---

## 6. MODULE ISOLATION THRESHOLDS

The thresholds at which "Module Isolation" stops being a claim and becomes a structural property.

### 6.1 The five thresholds
| Threshold | Definition | Status |
|---|---|---|
| **T0 — Existence** | At least one module is registered without warnings | not reached |
| **T1 — Cohort** | A 3-module cohort registers cleanly together | not reached |
| **T2 — Half coverage** | ≥50 % of modules registered | not reached |
| **T3 — Most coverage** | ≥80 % of modules registered, 7 days observation-only | not reached |
| **T4 — Full coverage** | 100 % of modules registered | not reached |

### 6.2 What each threshold buys
- T0 — "module isolation begins existing in this codebase." Smallest possible structural property; one isolated module among many unisolated ones.
- T1 — observation surface for cross-module collision detection.
- T2 — point at which strict-on-collision (G3 above) becomes safely enable-able.
- T3 — point at which the registry can be *consumed* by other code (sidebar generator, auth extract).
- T4 — only at this point can `MASTER.md §5` "Module Isolation" be truthfully stated as a *structural* property rather than a discipline.

### 6.3 Far-track concern
The cartography pack already documents that "Module Isolation" is a misleading claim today (`MODULARITY_ILLUSION_ANALYSIS §9`). The question this section opens: at what threshold is the claim *earned*? The honest answer is **T4**, not T2 or T3. Isolation is "no module can silently affect another" — a property that holds for *all* modules or for none.

**Rule:** the `MASTER.md` text on Module Isolation should *not* be updated to remove the discipline framing until T4. Updating it earlier propagates the same false confidence the pack diagnoses.

### 6.4 Current state
T0 not reached. All thresholds pending.

### 6.5 Trigger for next update
At each threshold reach.

---

## 7. GOVERNANCE TRANSITIONS

The governance acts that unlock specific architectural moves. Each is a *commit*, not a slogan.

### 7.1 The transition ledger
| Transition | Commit content | Unlocks |
|---|---|---|
| **GT-A0 — Pack staleness correction** | One commit updating pack-internal numbers across the 12 prior docs | Reliable far-track readings going forward |
| **GT-A1 — `MASTER.md §3 / §4` currency** | Architecture description matches post-Session-10 reality | Near-track work that references the doc |
| **GT-A2 — Pack-as-boot-context** | `.claude/CLAUDE.md` adds `docs/runtime/*` to its boot read chain | Future Claude sessions inherit cartography state |
| **GT-A→B — Phase A→B transition commit** | A doc commit recording: completion criteria met, registry shipped, first cohort clean, transition date | Phase B work begins |
| **GT-B-rule — Module-mode → role-visibility rule** | `MODULE_MODES.md` ratifies that `data-roles` is derived from mode + role-defaults | Sidebar generator (Stage 6) work |
| **GT-B-strictness — Strictness gradient ratification** | A doc enumerating which gradients are enabled per environment | Strictness elevation work |
| **GT-B→C — Phase B→C transition commit** | Records: coverage ≥80 %, observation-only window passed, E0/S0/G0 substrates ratified | Phase C work begins |
| **GT-E0 — Execution substrate seed** | Cloudflare Workers vs Supabase Edge Functions decision + deployment + secrets + retry conventions | First Phase 4 connector |
| **GT-S0 — State substrate seed** | Per-field authority table for cross-system records | Any connector that writes a field |
| **GT-G0 — Pack stewardship** | Cartography-pack stewardship protocol + non-append-only consolidation rule | Pack survives long-term |

### 7.2 Properties of governance transitions
- They are **out-of-scope for the train.** A train session may *reference* a transition commit but cannot author one.
- They are typically authored by far-track or near-track *governance* sessions — separate from execution.
- Each is sequenced: GT-A2 cannot fire before GT-A0; GT-B→C cannot fire before E0/S0/G0 are written.
- They are recorded in `MASTER.md §15` (session log) and / or in this state register's section §7.3.

### 7.3 Transition ledger — current state
| Transition | Status |
|---|---|
| GT-A0 | not landed (queued per `TRAIN_TRACK_OPERATING_MODEL §12.2`) |
| GT-A1 | not landed (queued; cheapest single drift correction in repo per `ARCHITECTURAL_DRIFT_MODEL §11`) |
| GT-A2 | not landed |
| GT-A→B | not landed |
| GT-B-rule | not landed |
| GT-B-strictness | not landed |
| GT-B→C | not landed |
| GT-E0 | not landed |
| GT-S0 | not landed |
| GT-G0 | not landed |

**Reading:** zero of ten governance transitions have landed. The train is shipping decomposition packets *ahead of any governance ratification*. This is consistent with the operating-model finding that execution is outpacing track preparation. The pack's own §1.5 invariant — `MASTER.md` is updated at every phase transition — is currently violated by the absence of GT-A0/A1/A2. The fix is GT-A0/A1, ideally in a single near-track session.

### 7.4 Trigger for next update
Any time a transition lands. Add the commit hash + date to §7.3.

---

## 8. SPEED-BAND EVOLUTION

The bands defined in `TRAIN_SPEED_LIMITS §0` do not stay static. They evolve as substrate matures.

### 8.1 Band-evolution table
| Action class | Band today | Band post-Phase A | Band post-Phase B | Reason |
|---|---|---|---|---|
| Module-internal patch on registered module | CAUTION | GO | GO | Registry catches collision risk |
| Adding new module | HALT (no new modules during Phase A) | CAUTION | GO | Registry registration step is part of the addition |
| Sidebar entry add | FREEZE (Phase A) | HALT (until Stage 6) | GO | Sidebar generator removes the surgical-patch surface |
| Adding new SQL migration | CAUTION | CAUTION | CAUTION | RLS / authority concerns persist regardless of substrate |
| `register()` provides/consumes update | n/a | CAUTION | GO | First wave needs verify; later waves are routine |
| Cross-cutting global rename | HALT | HALT | CRAWL | Possible only after registry coverage is high |
| `index.html` shell touch beyond `?v=` | FREEZE | CAUTION | GO | Shell is small enough; substrate observes consumers |
| Connector scaffolding | HALT (no Phase 4 work) | HALT (E0/S0 unwritten) | CRAWL | First-of-a-kind work |

### 8.2 Two principles in the table
1. **Bands loosen as substrate matures.** Work that requires CAUTION today is GO once the substrate observes its consumers. Speed comes from naming, not from accumulated risk tolerance.
2. **Some bands never loosen.** SQL migrations remain CAUTION because the load-bearing concern is RLS / authority — not module isolation. Phases do not change them.

### 8.3 Far-track concern
The temptation under speed pressure is to *retroactively* loosen bands ("we shipped this CAUTION work as GO and nothing broke, so it's GO from now on"). This is reasoning from absence-of-failure, the same shape `MODULARITY_ILLUSION` warns against. Bands should loosen *because the substrate now observes the risk*, not because the train didn't happen to surface it yet.

**Rule:** band evolutions are governance commits. Loosening a band requires a documented substrate change that justifies it.

### 8.4 Trigger for next update
When a substrate stage lands (G0–G5 in §4.1; S1–S5 in §5.1), update the affected rows.

---

## 9. TRAIN/TRACK DOCTRINE REFINEMENT

The operating model is a hypothesis. It needs evidence.

### 9.1 Doctrine claims under test
| Claim | Source | Evidence needed |
|---|---|---|
| Roles are exclusive per session | `TRAIN_TRACK_OPERATING_MODEL §1.4` | At least one near-track / train / far-track sequence run cleanly |
| Decay is commit-counted (≥3 stale, ≥13 discard) | §4 same doc | One stale-track caught and refreshed using the rule |
| Speed bands cap chain depth | §6 same doc | One CAUTION corridor with 3 packets verified before chaining further |
| Plan one corridor live + one sketched | §10 same doc | A near-track session that produces both and the train consumes only the live one |
| Phase-classed beats packet-classed | §7 same doc | A re-validation that finds packet-numbered planning ages worse than phase-classed |
| Branch hygiene: train on integration, analysis on side branches | §8.4 same doc | One train→analysis→train cycle without merge surprise |

### 9.2 Refinement protocol
- Each train + near-track + far-track cycle is a chance to confirm or contradict a claim.
- Contradictions are written into `BUILD_INTELLIGENCE.md`-equivalent for doctrine: a "doctrine-evidence" section in this doc (§14 below).
- Confirmed claims after two independent observations are upgraded to *invariants* and listed in `MASTER.md` §12.
- Contradicted claims are revised in `TRAIN_TRACK_OPERATING_MODEL` and the revision is itself a governance transition.

### 9.3 Far-track concern
The doctrine could decay the same way packet plans do. The phrase "operating model" implies stability; reality is that a doctrine written before evidence is itself *planned track*. **The doctrine is advisory until proven by one full cycle.** §14 below tracks proof state.

### 9.4 Trigger for next update
Any session that completes a cycle. Doctrine evidence updates §14.

---

## 10. WHAT BECOMES POSSIBLE AFTER PHASE A

A list of architectural moves that are currently unsafe or impossible and will become safe once Phase A is *complete* (substrate present, transitions ratified).

| Capability | Currently | Post-Phase-A |
|---|---|---|
| Add a new module without 4 shell touchpoints | impossible — every add costs script tag + sidebar `<a>` + `module_modes.json` + `?v=` | possible — registration is the addition; sidebar derives from registry |
| Refactor a global without grep-driven consumer audit | impossible — no consumer list exists | possible — registry's `consumersOf(name)` gives the list |
| Detect a silent collision before user clicks | impossible | possible — `register()` warns at registration |
| Onboard a new operator (or fresh Claude session) without weeks of pack reading | impossible — discipline-laden | partially possible — the registry and updated `MASTER.md` carry more of the substrate; pack is the deep dive |
| Run two Claude sessions safely on disjoint modules | impossible (`index.html` collision) | possible (modules don't share files; sidebar/auth are extracted) |
| Adopt strict-on-collision testing in CI | impossible (no registry) | possible (G3 at coverage ≥60 %) |
| Rename `sbFetch` or `CU` | impossible (22 modules silently consume) | conceivable post-T3 (registry tracks consumers) |
| Begin Phase 4 connector scaffolding | impossible (E0/S0 unwritten) | conceivable post-Phase-B if E0/S0 ratified |

### 10.1 What does NOT become possible
- Build step adoption — long-range invariant says no, regardless of phase.
- ESM migration — possible in principle, but not unlocked by Phase A; needs Phase B observation depth.
- Multi-tenant generalization — out of horizon.
- Test harness — not unlocked by Phase A; needs Phase B substrate to know what to test.

### 10.2 Trigger for next update
When Phase A completes, re-read this section against the actual capabilities and adjust.

---

## 11. WHAT REMAINS FORBIDDEN

Items on `TRACK_LAYER_MAP §5` (forbidden track) and conditions under which they remain off-rail through Phase A and Phase B.

| Item | Forbidden through Phase A | Forbidden through Phase B | Notes |
|---|---|---|---|
| Premature multi-Claude swarms on `index.html` | yes | conditional | Once shell is post-Stage-7, parallel sessions on disjoint modules are safer |
| Fake runtime / loader-shaped non-loaders | yes | yes | Always forbidden; a fake substrate is worse than no substrate |
| Phase B overreach into Phase C | n/a | yes | Connector code before E0/S0/G0 is the canonical compress-Phase-B failure |
| Phase C compression | n/a | yes | Phase B's value is *time at coverage* |
| ESM mid-Phase | yes | yes | Wait for explicit need + post-Phase-B substrate trust |
| Build-step adoption | yes | yes | Long-range invariant; permanently forbidden in current architectural path |
| Second `window.AOS_*` namespace | yes | yes | Until first registry is at 100 % coverage and proven |
| Multi-tenant abstractions | yes | yes | Single-tenant stability comes first |
| Pre-Phase-B test harness | yes | yes | Tests written under pre-isolation topology become migration debt |
| RLS tightening outside connector unlock | yes | conditional | OK only when a specific Phase 4 connector requires it |
| Skill-runtime experiments | yes | yes | Skills are boot-context, not runtime; layering confusion |
| New `data-roles` attributes during Phase A | yes | n/a | Cements the three-source-of-truth |
| New `<script>` tags during Phase A | yes | n/a | Compounds shell pressure being drained |
| New disciplines added to `MASTER.md §12` | yes | conditional | Pause discipline-adding during Phase A; revisit at end |

### 11.1 Items that move from forbidden to merely-careful at Phase A end
- Adding new modules (becomes CAUTION-band, requiring registration).
- Editing `index.html` (becomes CAUTION-band; no longer FREEZE).
- Bulk renames (still HALT until coverage; no longer permanent).

### 11.2 Trigger for next update
At each phase transition, re-classify rows.

---

## 12. NEW BOTTLENECKS EMERGING AFTER DECOMPOSITION STABILIZES

The bottlenecks that exist *today* (shell pressure, four-touchpoint module-add, three-source-of-truth) are addressed by Phase A. New bottlenecks will appear in their place. Naming them now is the only way to keep architecture maturity ahead of execution.

### 12.1 The Phase-B-era bottleneck stack

#### 12.1.1 Coverage-rollout discipline
**Where:** the registry is shipped but most modules are not yet registered.
**Cost:** every patched module is a candidate for "register while you're here." Done sloppily, registrations land with under-declared `consumes` lists, which then *don't* fire warnings when they should — silent partial-coverage. The substrate observes less than it was supposed to.
**Mitigation (far-track):** define a registration *quality bar* — minimum required `consumes` fields per module size class — before the second cohort lands.

#### 12.1.2 Pack-staleness compounding
**Where:** the pack itself ages relative to the codebase.
**Cost:** every train session that doesn't trigger a pack-correction commit pays a future "where are we, really?" tax.
**Mitigation (far-track):** define G0 (pack stewardship) clearly. Currently a placeholder concept; needs a written stewardship protocol so that pack updates have a known cadence.

#### 12.1.3 Branch-coordination tax
**Where:** train (`main` or integration branch) and analysis (`claude/repo-cartography-analysis-3McqU` or analogous) are on different branches. Pack updates on the analysis branch require a merge to land. Train work on the integration branch can drift from the pack between merges.
**Cost:** the operating model assumes branch hygiene; that hygiene has cross-branch coordination cost the pack hasn't sized.
**Mitigation (far-track):** define a *branch-merge cadence* for the pack — likely "merge analysis branch on each governance transition." Currently informal.

#### 12.1.4 Strictness-readiness drift
**Where:** strictness gradients (G3, G4) become enable-able at coverage thresholds, but the *observation* required to trust the gradient is calendar-time-dependent.
**Cost:** the train's pace can outrun the observation window. If coverage hits 80 % in a week but the 7-day observation window starts the day coverage hits 80 %, the gradient cannot be safely flipped for another week — a contradiction with shipping pressure.
**Mitigation (far-track):** observation windows are clock-time, not commit-count. Document this.

#### 12.1.5 Module-mode resolver vs registry tension
**Where:** Phase A Stage 6 says sidebar derives from `module_modes.json`. Phase B substrate evolution stage S3 says sidebar derives from the registry. These are not compatible.
**Cost:** if both are shipped, two sources of truth replace the existing three — net cost zero. If only one ships, the other becomes a half-built migration debt.
**Mitigation (far-track):** decide whether Stage 6 is a *transitional* sidebar generator (consumes JSON now, registry later) or a *terminal* one (consumes JSON forever). Currently undecided. **This is the highest-priority far-track decision after the staleness corrections land.**

#### 12.1.6 BUILD_INTELLIGENCE token tax
**Where:** ~49 KB and growing append-only file read at every session boot.
**Cost:** session-boot context budget eaten by lessons that were once novel and are now folklore.
**Mitigation (far-track):** consolidation pass — collapse old, no-longer-surprising lessons. Tracked in `POST_DECOMPOSITION_ROADMAP §11` as parking-lot; should escalate to L2 work post-Phase-A.

### 12.2 The Phase-C-era bottleneck stack (looking further)

#### 12.2.1 Reconciler proliferation
Discussed in `INTEGRATION_TOPOLOGY_FORECAST §9.1`. The risk: each connector ships its own retry/backoff/error-handling regime. Mitigation requires E0 to ratify a *shared reconciler contract*.

#### 12.2.2 Edge-function tier lock-in
Once the choice (CF Workers vs Supabase Edge Functions) is made and one connector ships, the second connector's path is fixed. **The first connector to ship after E0 is the architecture for every subsequent connector**, regardless of how the choice was framed.

#### 12.2.3 Per-field authority drift
S0 is a *document*; documents drift. Without a process that re-checks authority entries when new fields are added to either side, the table itself becomes stale governance coupling (`COUPLING_REDUCTION_PATTERNS §7`).

### 12.3 The far-far-track bottleneck preview
Post-Phase-C, after several connectors are stable, the next bottleneck class is **identity reconciliation** (Windward customer × BigCommerce customer × walk-in). It is named in the cartography pack but has no architecture yet. Out of horizon for this snapshot.

### 12.4 Trigger for next update
When any of §12.1.1–12.1.6 manifests as observable cost, or when the §12.1.5 decision is forced by Stage 6 timing.

---

## 13. THE FAR-TRACK MISSION RESTATED

Architecture maturity must stay ahead of execution velocity. Empirically:

- Session 10's velocity outpaced Session 16's planning.
- The cartography pack is now itself stale on size axes.
- Zero of ten governance transitions have landed.
- The substrate (`register()`) is unbuilt.

These four facts together describe a system in which **execution is faster than its architectural support layer**. The far-track mission is not to slow execution. It is to ensure the architectural support layer is *always one phase ahead of the train* — so that when the train arrives at a phase boundary, the next phase's prerequisites are already established and the transition is a commit, not an investigation.

### 13.1 Far-track output rate
Empirical heuristic from this snapshot:

- One far-track session per 2–3 train corridors is sufficient *if* the far-track session is focused on a single phase-transition concern.
- Producing pack-class artifacts (like this doc) costs ~1 session each.
- Updating an existing far-track doc to reflect new state costs ~0.25 session.

Thus: a sustainable cadence is **one far-track session every 2–3 train corridors**, mostly focused on updating existing far-track state docs rather than producing new ones. New pack docs appear at phase transitions, not within phases.

### 13.2 Far-track failure mode
The doctrine's failure mode is **far-track absence under shipping pressure**. When the train is shipping fast and decomposition is "almost done," the temptation is to skip the far-track session and "just finish Phase A first." This is where the next phase's prerequisites silently age. The cure is making far-track work *cheap* — which is what this doc's update-protocol structure is designed to support.

---

## 14. DOCTRINE-EVIDENCE LEDGER

A short ledger of doctrine claims and the evidence accumulated for/against them. Updated as cycles run.

| Claim | First-evidence window | Status |
|---|---|---|
| Roles are exclusive per session | First near-track→train→far-track cycle post-2026-05-10 | Pending |
| Decay is commit-counted ≥3 stale | First track-refresh under the rule | Pending |
| Speed bands cap chain depth meaningfully | First mixed-band corridor execution | Pending |
| Plan one corridor live + one sketched | First near-track output that includes both | Pending |
| Phase-classed beats packet-classed | First time a phase-classed plan absorbs a velocity surprise | Session 10 → Session 16 (against, unfavorable for packet-classed); strong evidence in favor of phase-classed |
| Branch hygiene works | First train→analysis→train cycle through merge | Pending |

### 14.1 First confirmed entry
**Phase-classed beats packet-classed** has its first confirming evidence: Session 10 outran Session 16's packet-numbered (P7–P12) plan. The failure mode predicted by the operating model materialized in real conditions. This is *one* observation; doctrine claims should not be elevated to invariants from a single observation, but the evidence is strong enough to reduce uncertainty.

---

## 15. UPDATE PROTOCOL

This doc is *maintained*, not rewritten.

### 15.1 Triggers that warrant an update
1. The train completes a corridor.
2. A governance transition lands (§7.1).
3. A substrate stage lands (§4.1, §5.1).
4. A doctrine claim accumulates evidence (§14).
5. A new bottleneck materializes that wasn't in §12.
6. Pack-staleness corrections land (GT-A0).

### 15.2 Triggers that do *not* warrant an update
- A train session that ships a packet without crossing a transition.
- Calendar time alone.
- "I had a thought" — far-track ideation belongs in conversation, not in this doc.

### 15.3 Update structure
Each update increments §0's "Last update" date and references which sections changed. Sections updated in place; deletions explicit (do not silently remove).

### 15.4 Consolidation rule
Per the G0 substrate seed concept (`TRACK_LAYER_MAP §4`), this doc is *not* append-only. Every Nth update (probably every phase transition), an explicit consolidation pass collapses redundant entries and removes outdated readings. **The pack must not become the next BUILD_INTELLIGENCE.**

### 15.5 Branch / commit discipline
- Updates land on the analysis branch.
- Each update is one commit with a clear message naming which sections changed.
- Updates are merged into the integration branch on governance transitions, not per-update. (This is the cross-branch coordination tax noted in §12.1.3.)

---

## 16. CURRENT FAR-TRACK READING — ONE PARAGRAPH

The train is moving fast; the substrate is unbuilt; ten governance transitions are pending; the pack itself carries a known staleness debt. Phase A is past its size target on the LOC axis but is *not* complete on the substrate axis — and the substrate axis is the load-bearing one. The single most useful far-track action right now is **for the next near-track session to verify whether `register()` and the first three module registrations are present**, because Phase A's true completion state depends on that fact, not on shell size. The second most useful far-track action is **landing GT-A0 (pack staleness correction) and GT-A1 (`MASTER.md §3/§4` currency) in one dedicated session**, so that future readings of the pack are reliable. The third is to **decide §12.1.5** (sidebar generator: transitional or terminal) before Stage 6 becomes timing-critical. None of these is execution. All of them are far-track — naming and writing-things-down — which is the entire architectural lever the cartography pack diagnoses and which this doc is the maintenance artifact for.

---

*Maintained as the train ships. See `TRAIN_TRACK_OPERATING_MODEL` for role doctrine, `TRACK_LAYER_MAP` for layered work-classification, and the rest of the cartography pack for foundational analysis. Pack now totals 14 documents.*
