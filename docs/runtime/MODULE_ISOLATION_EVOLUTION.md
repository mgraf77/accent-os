# MODULE_ISOLATION_EVOLUTION

> Threshold-by-threshold ladder for module isolation in AccentOS.
> Defines the exact moment "isolation exists," the exact moment "isolation is trustworthy,"
> and the failure modes between them.
> Analysis only — no implementation, no code, no runtime language.
> 16th doc in the cartography pack under `docs/runtime/`.
> Snapshot date: 2026-05-10.

---

## 0. WHY ISOLATION DESERVES ITS OWN LADDER

`MODULARITY_ILLUSION_ANALYSIS` named the gap: AccentOS asserts module isolation as a development philosophy while having no structural mechanism to enforce it. `FUTURE_LOADER_BOUNDARIES` named the smallest mechanism that closes that gap. `FAR_TRACK_STATE §6` listed five thresholds (T0–T4).

This doc is the ladder itself — what *exact* condition must hold for each threshold to be reached, what each threshold *buys*, and what each threshold *does not* buy. The motivation is sharp: claims about isolation get propagated forward (into `MASTER.md`, into onboarding context, into operator confidence). If the threshold language is fuzzy, every claim further down the chain inherits the fuzziness. **The ladder gives the claims a precise referent.**

The most important load-bearing distinction is **isolation existing** vs **isolation being trustworthy**. Existence is the moment one module is structurally isolated — a fact about that one module. Trustworthiness is the moment the property holds reliably across the codebase such that *future code* can assume it. The two thresholds are several steps apart on the ladder, and the gap between them is where false isolation (§7) lives.

---

## 1. WHAT MODULE ISOLATION ACTUALLY IS

Stripped of philosophy:

> **Module isolation is the structural property that no module can silently affect the runtime state of another module.**

Two qualifiers carry the weight:
- **Silently** — *loud* effects (clicking a button on module A that calls a function on module B by design) are not isolation violations. Isolation concerns are about *invisible* coupling: a write to a global, a redefinition of a name, an unintended side-effect.
- **Runtime state** — file-system co-location is not the property; what matters is what happens at hydrate time, at first-mount time, at navigation time, at logout time.

The property is binary at the per-module level (this module is or is not silently isolated) and ordinal at the codebase level (some modules are isolated; others aren't). Codebase-level isolation is *the fraction of modules for which the per-module property holds*, plus an integrity property (§9) — that no isolated module is silently affected by an unisolated one.

### 1.1 What isolation is NOT
- File separation. `js/customers.js` is one file; that says nothing about isolation.
- Naming convention. `_<modulePrefix>` names are not enforced.
- Documentation. `MASTER.md` claiming isolation does not produce isolation.
- Module-mode. `module_modes.json` controls visibility, not coupling.
- Code review. A reviewer cannot detect what a future module will do.

### 1.2 What isolation buys
- Refactor confidence. Removing or renaming an isolated module's globals does not require a 38-file grep.
- Onboarding speed. A new operator can learn the module without learning every other module first.
- Parallel work safety. Two sessions touching disjoint modules cannot collide on shared state.
- Bounded blast radius. A bug in one isolated module cannot dark another.

These benefits are *unavailable* until isolation has been earned. They cannot be ratified on the basis of "we believe modules are isolated."

---

## 2. THE FIVE THRESHOLDS

Re-numbered from `FAR_TRACK_STATE §6` and given exact entry criteria.

### 2.1 T0 — Substrate present, but unused
**Definition:** the registration substrate (`register()`) exists, but no module has called it yet.

**Entry criteria:**
- The substrate is present (Phase B C1).
- Zero modules have registered.

**What this buys:**
- The *possibility* of isolation. Nothing more.

**What this does NOT buy:**
- Any isolated module.
- Any structural property.
- Any change to claims about isolation.

**Architectural status of "Module Isolation" claim at T0:** unchanged from pre-substrate. Still a discipline.

### 2.2 T1 — Isolation begins to exist
**Definition:** the *first cohort* of modules has registered without producing collision or missing-consume warnings against each other.

**Entry criteria:**
- C1 (substrate present).
- ≥3 modules have registered.
- Each declared `provides` is unique among the registered set.
- Each declared `consumes` is satisfied by either the shell or another already-registered module.
- The set has been observed across at least one full hydrate + first-mount cycle.

**What this buys:**
- *For the registered cohort*: each module's `provides` is named, its `consumes` is named, and a collision between any two of them would be observable.
- The codebase contains at least one module pair that is structurally non-coupled.
- The first instance of isolation as a fact, not a discipline.

**What this does NOT buy:**
- Anything for unregistered modules.
- Trustworthiness across the codebase (still 35 unisolated modules at this stage).
- Permission to claim "AccentOS modules are isolated."

**Architectural status of "Module Isolation" claim at T1:** still misleading. The phrase implies a codebase property; the property holds only for the cohort.

### 2.3 T2 — Half coverage
**Definition:** ≥50 % of modules registered without unresolved warnings against each other.

**Entry criteria:**
- T1 reached.
- Coverage ≥50 % of modules registered.
- Zero unresolved collision warnings across the registered set.
- Zero unresolved missing-consume warnings.

**What this buys:**
- Critical mass for observation. Half the modules' `consumes` lists name half the codebase's coupling surfaces. Refactor of any of those surfaces is now query-able rather than grep-able.
- The substrate is now a meaningful diagnostic — a missing-consume warning is informative, not noise-against-mostly-empty.

**What this does NOT buy:**
- Strict-on-collision (G3 in `STRICTNESS_GRADIENT_PLAYBOOK`). Strictness needs ≥60 % coverage and 14 days observation.
- The integrity property (§9). Half the modules are still unisolated; an unisolated module can silently affect an isolated one.

**Architectural status of "Module Isolation" claim at T2:** improved, still misleading. "Half-isolated" is a stronger statement than "discipline" but does not match the unqualified phrase.

### 2.4 T3 — Isolation is trustworthy
**Definition:** ≥80 % of modules registered, observation-only window of ≥7 days completed without unresolved warnings.

**Entry criteria:**
- T2 reached.
- Coverage ≥80 %.
- 7 calendar days have passed at this coverage.
- Zero unresolved collision warnings during the window.
- Zero unresolved missing-consume warnings during the window.
- The unregistered minority is documented (which modules and why not yet registered).

**What this buys:**
- The substrate has earned trust. *Future code can assume it.* Specifically: auth extraction, sidebar generation, and any architecture move that depends on knowing the consumer set of a global.
- Strict-on-collision becomes safely enable-able (G3).
- The integrity property (§9) approaches truth — only ~20 % of modules can silently affect others.

**What this does NOT buy:**
- Codebase-level isolation. 20 % of modules unregistered is enough to produce silent coupling against the registered 80 %.
- Permission to update `MASTER.md` to claim isolation as structural.
- Strictness above G3.

**Architectural status of "Module Isolation" claim at T3:** *the language can begin to qualify*. "Most modules are structurally isolated" is now defensible. The unqualified philosophy claim still must not be made.

### 2.5 T4 — Full coverage
**Definition:** 100 % of modules registered, observation-only window completed at full coverage.

**Entry criteria:**
- T3 reached.
- Coverage = 100 %.
- An additional 7-day window at full coverage without unresolved warnings.
- Mutation-containment diff (G5) has been at least *evaluated* in non-production environment (whether or not it is enabled).

**What this buys:**
- *The codebase property*: no module can silently affect another. Isolation is structural.
- Permission to update `MASTER.md` Module Isolation language from philosophy to structure.
- Eligibility for strict-on-missing-consume (G4) and optional strict-on-undeclared-leak (G5).

**What this does NOT buy:**
- Permanence. T4 can regress (§8).
- A guarantee that future modules will register. Each new module must register at addition time; if not, the codebase falls back to T3.
- Resolution of any *integration-level* coupling (Phase 4 / Phase C). Isolation is module-level, not connector-level.

**Architectural status of "Module Isolation" claim at T4:** *the philosophy claim becomes a structural claim.* `MASTER.md §5` can be updated. This is the only threshold at which that update is honest.

---

## 3. THE EXACT THRESHOLD FOR "ISOLATION EXISTS"

**Isolation exists at T1.**

Not at T0 — substrate alone is not isolation.
Not at T2 — half coverage is more than existence; existence is reached at the first cohort.

The exact moment of T1 is observable: the boot sequence in which the third (or later) module's `register()` call returns without producing a collision or missing-consume warning, *and* this state survives one full hydrate + first-mount cycle.

### 3.1 Why T1 specifically
- T1's three modules are evidence that the substrate works in non-trivial conditions. Two modules can pass by accident (single namespace pair); three is the smallest cohort where pairwise non-collision becomes a cohort property.
- A full hydrate + first-mount cycle exercises the lifecycle hooks — declaration is meaningful only if it survives the boot sequence the modules will live through.
- Anything weaker than T1 is the substrate reporting itself working without meaningful workload.

### 3.2 What changes at T1
- The doctrine in `MASTER.md §5` is now literally false in fewer cases than before. (The cohort is exempt from the falsity.)
- The pack's prior claim — "Module Isolation is a discipline, not an architecture" — softens to: "Module Isolation is a discipline for most modules and a structure for the cohort."
- The activation commit's C2 is now satisfied (`PHASE_B_ACTIVATION_CRITERIA §2.2`).

### 3.3 What does NOT change at T1
- Operator habits. Three isolated modules do not retrain the muscle memory of the other 35.
- Forbidden-track items. T1 does not unlock anything in `TRACK_LAYER_MAP §5`.
- Speed bands. CAUTION-band on existing-module patches stays CAUTION until coverage rises.

T1 is structurally significant and operationally minor. The mistake to avoid is treating T1 as if it were T3.

---

## 4. THE EXACT THRESHOLD FOR "ISOLATION IS TRUSTWORTHY"

**Isolation is trustworthy at T3.**

Not at T2 — half coverage is meaningful but a 50 % unisolated minority can silently affect the isolated half.
Not at T4 — T4 is *complete* trustworthiness; T3 is the threshold at which *future code can assume isolation* as a working property.

The distinction between "trustworthy" and "complete" is operational. Trustworthy means: a refactor that depends on isolation holding, that touches modules in the registered 80 %, can proceed without grep-driven consumer audit. Complete means: any refactor depending on isolation can proceed.

### 4.1 Why T3 specifically
- 80 % is the empirical inflection where missing-consume warnings cluster around the unregistered 20 %, not against the registered set. Below 80 %, warnings are noise; above 80 %, warnings are signal.
- 7 days is the observation window during which production use surfaces edge cases that single-session testing misses. Calendar days, not commit count, because the variability is *which* user paths are exercised, and that is wall-clock-paced.
- Both must hold. 80 % coverage that just landed yesterday is not yet trustworthy.

### 4.2 What changes at T3
- Auth extract (`DECOMPOSITION_STRATEGY_V1 §3` Stage 7) becomes a safe move.
- Sidebar generator's terminal form (consuming registry directly, per `STRICTNESS_GRADIENT_PLAYBOOK` interactions) becomes feasible.
- Strict-on-collision (G3) becomes eligible for promotion.
- `MASTER.md §5`'s Module Isolation language can begin to qualify ("most modules") but not yet drop the qualification.

### 4.3 What does NOT change at T3
- Phase C work remains forbidden until B→C transition criteria.
- The unregistered 20 % is still capable of silent effect on the registered 80 % — the integrity property is not yet held.
- Strictness above G3 is still ineligible.

### 4.4 The gap between T3 and T4
The remaining 20 % of modules at T3 represents the *maintenance frontier* — modules that did not get to registration during the first three cohorts because they were small, idle, deprecated-leaning, or otherwise low-priority. The gap-closing work is unglamorous: registering modules that nobody is actively touching. The temptation is to declare T4 when T3 + "we'll register the rest as they're touched" is in place. This is false T4 (§7.4) and must be avoided.

---

## 5. THE EXACT THRESHOLD FOR "STRICTNESS ESCALATION ALLOWED"

(Cross-references the next doc.)

| Strictness gradient | Coverage threshold | Observation requirement | Eligibility threshold |
|---|---|---|---|
| Observation-only (G0–G2) | any | n/a | T0 |
| Strict-on-collision (G3) | ≥60 % | 14 days zero collision warnings | T2 + 10 % overshoot |
| Strict-on-missing-consume (G4) | ≥80 % | 7 days zero missing-consume warnings | T3 |
| Strict-on-undeclared-leak (G5) | 100 % | optional; opt-in per environment | T4 |

Strictness *promotion* requires the eligibility threshold to hold *at the time of promotion*. Strictness *demotion* (rolling back) is always permitted, regardless of threshold state.

The exact moment a strictness escalation is *allowed* is the moment its eligibility threshold transitions from "below" to "at or above." Allowance is not the same as obligation; the operator may choose to remain at a lower strictness even when a higher one is allowed (e.g., to extend the observation window before flipping a flag).

The full per-gradient prerequisites, forbidden jumps, reversibility, blast radius, and migration path are in `STRICTNESS_GRADIENT_PLAYBOOK`.

---

## 6. THE INTEGRITY PROPERTY

A property of *the codebase as a whole*, distinct from any single module's isolation.

> **Integrity:** no isolated module is silently affected by an unisolated module.

At T1, integrity is trivially false — 35 of 38 modules are unisolated, and any of them can silently affect the cohort.

At T3, integrity is mostly held — 20 % of modules can silently affect the 80 %, but the *probability* of such affect is dampened by the registered modules' explicit `consumes` lists (which act as a check on what shell-globals they actually read).

At T4, integrity is held by construction — 100 % of modules declare both `provides` and `consumes`, so any silent effect would surface as a registry-level diagnostic.

### 6.1 Why integrity matters
A common misreading: "if 80 % of modules are isolated, the codebase is mostly isolated." Wrong. *The unisolated 20 % is the failure surface for the isolated 80 %.* Integrity is the property that prevents partial-coverage isolation from being undermined by the unregistered minority.

### 6.2 Integrity at thresholds
- T0 — false.
- T1 — false (overwhelmingly).
- T2 — false (still half).
- T3 — *mostly* held; the gap is the operating risk of Phase B.
- T4 — held by construction.

T3-and-trustworthy depends on the operator *knowing* the integrity property is not fully held — which is why the language at T3 is "trustworthy" not "complete." The trust is contingent on the operator not making moves that depend on the unregistered minority being innocent.

---

## 7. FALSE MODULE ISOLATION

States where the registry exists but isolation is fictional. The most important warning in this doc.

### 7.1 What false isolation is
A configuration in which the *artifact* of isolation (the registry, registrations, warnings, even strictness flags) is present, but the *property* of isolation (no silent inter-module effect) is not.

False isolation is more dangerous than no isolation, because it *looks like progress*. Operators who would be cautious in a no-isolation system relax in a false-isolation system. Onboarding context inherits the false claim. `MASTER.md` updates propagate the false claim. The gap between the artifact and the property compounds.

### 7.2 The five canonical false-isolation patterns

#### 7.2.1 The under-declared `consumes` pattern
A module calls `register()` with `provides` populated but `consumes` empty (or near-empty). The registry observes nothing about what the module reads. Future refactors of shell globals do not produce missing-consume warnings against this module — because it never declared what it consumes. The module looks isolated; it isn't.

**Detection:** spot-check `consumes` lists against the module's actual reads. Any module whose `consumes` is shorter than the typical shell-global usage (sbFetch / CU / toast / openModal / $ / qsa / esc) is a candidate.

#### 7.2.2 The aliased-`provides` pattern
A module exposes a global under a wrapper name that forwards to another module's global. Two modules `provides: ['toast']` and `provides: ['showToast']` where `showToast` calls `toast`. The registry sees no collision; the runtime sees one cross-module dependency.

**Detection:** read `provides` lists for similar names; check whether one wraps another.

#### 7.2.3 The silenced-warning pattern
The registry warns; the operator silences the warnings (filter, ignore, comment-out the warn call). The substrate now appears clean while doing no observation.

**Detection:** any change that suppresses registry output is a false-isolation generator. The audit is at the substrate's source, not at any module.

#### 7.2.4 The frozen-declaration pattern
A module's `provides` and `consumes` were correct at registration time but the module has since changed. New globals were added, old globals were removed, the module file was patched without updating the registration call. The declaration drifts from reality.

**Detection:** every patch to a registered module must include a check on whether the registration call needs an update. Without that check, declaration freezes while code moves.

#### 7.2.5 The cohort-only pattern
T1 has been reached. The cohort is small (3 modules). The cohort's modules don't read or write the same globals as the unregistered 35. The cohort is structurally isolated *but trivially so* — there were no shared globals to collide on.

**Detection:** check the cohort's `consumes` lists against the unregistered modules' implicit reads. If the cohort and the unregistered set don't overlap, the cohort's clean registration is not evidence the substrate works against contention; it is evidence the cohort happened to be contention-free.

### 7.3 Why these are dangerous
Each pattern produces a registry that *looks correct* — no warnings, no errors, declarations present. The substrate self-reports working. The operator concludes isolation exists. But the property doesn't hold:
- 7.2.1 → silent reads aren't caught.
- 7.2.2 → silent dependencies aren't caught.
- 7.2.3 → all problems pass.
- 7.2.4 → registration ages out of sync with code.
- 7.2.5 → cohort is non-load-bearing evidence.

### 7.4 Detecting false isolation
The general check: **"if the registry suddenly went strict-on-everything, would the codebase break?"**

If the answer is "no" — true isolation is present. The substrate is observing what it claims to observe.

If the answer is "yes, it would break" — false isolation. The artifact is present; the property is not.

The check is hypothetical; nobody actually flips strictness as a test. But the operator can answer the hypothetical by examining the patterns above.

### 7.5 Recovering from false isolation
The recovery is *not* "ship more registrations." It is:
1. Audit the existing registrations against §7.2 patterns.
2. For each pattern detected: remediate before any further coverage growth.
3. Document the remediation in `MASTER.md` or this doc.
4. Re-evaluate the threshold (T1 / T2 / T3) — false isolation often means the threshold was prematurely declared and must be re-counted.

The temptation to "fix it forward" by registering more modules makes the problem worse, because the new registrations inherit the same patterns.

---

## 8. ISOLATION REGRESSION

A reached threshold can fall back. The thresholds are not monotonic.

### 8.1 Regression triggers
- A registered module's declaration is observed to drift from reality (§7.2.4).
- A new module is added without registration (cohort coverage drops below threshold).
- A registry-level change introduces noise that obscures previously-clear warnings.
- A shell-side global is added without updating any module's `consumes`.
- Strictness is reverted (e.g., G3 was on, was rolled back; the substrate's diagnostic surface narrowed).

### 8.2 Regression effects
- The threshold's claim is no longer honest.
- `MASTER.md` language qualifying isolation must be re-qualified or rolled back.
- Speed bands return to the prior threshold's level.
- Strictness gradients above the new threshold become re-ineligible.

### 8.3 Regression handling
1. Detect the regression (preferably at observation; at worst, at incident).
2. Annotate `FAR_TRACK_STATE §6` with the regression event and the new threshold.
3. Treat the regression as a corridor-class repair task on the next near-track session.
4. Re-attempt the threshold once the conditions hold again. Fresh evidence required.

Regression is not a failure of the system; it is a feature of an honest model. Threshold regression discovered late and silenced is the failure.

---

## 9. THE LANGUAGE-UPDATE CONTRACT

When `MASTER.md` (and other governance docs) can update their language about isolation.

| Doc claim | Allowed at threshold |
|---|---|
| "Module isolation is a development philosophy" (current text, T0–pre-T3) | always allowed |
| "Module isolation is a discipline" | always allowed |
| "Most modules are structurally isolated" | T3 |
| "Modules are structurally isolated" (unqualified) | T4 |
| "A bug in module A cannot silently affect module B" | T4 + integrity (§6) confirmed |
| "AccentOS modules are isolated" (the Phase 4 onboarding pitch) | T4 + sustained for ≥1 phase transition |

### 9.1 The forbidden language updates
- Updating to T4 language at T3.
- Updating to T3 language at T1.
- Removing the "discipline" qualifier without a threshold shift behind it.
- Adding language about isolation at T1 that suggests it is a codebase property.

### 9.2 Why this matters
`MASTER.md` is read by every session at boot. A claim about isolation propagates to every future session's operating context. Wrong claims create the false-confidence pattern (`ARCHITECTURAL_DRIFT_MODEL §4`).

The single most damaging language update available right now would be `MASTER.md §5` updating Module Isolation from "philosophy" to "structure" at T1 or T2. **The update belongs at T4 and at no earlier threshold.**

---

## 10. THE ISOLATION LADDER ANTI-PATTERN INVENTORY

Final summary of what *not* to do.

| Anti-pattern | Why it fails |
|---|---|
| Declaring T1 reached because `register()` ran without errors once | T1 requires the cohort property, not the substrate's success on a single call |
| Declaring T2 reached at 50 % coverage on the same day registrations completed | T2 requires "no unresolved warnings" — needs at least one full hydrate cycle |
| Declaring T3 reached at 80 % coverage immediately | T3 requires 7-day observation; coverage alone is insufficient |
| Treating T3 as if it were T4 ("we'll register the last 20 % later") | The unregistered 20 % invalidates the integrity property |
| Updating `MASTER.md` Module Isolation language at T1/T2 | Propagates false confidence |
| Skipping cohort evaluation (jumping from T0 to "many modules registered") | Cohort property is the load-bearing evidence at T1 |
| Counting registered modules without auditing for false isolation patterns (§7.2) | Coverage is artifact; property is what counts |
| Silencing warnings to reduce noise during rollout | Silenced warnings create §7.2.3 false isolation |
| Declaring T4 because "the registry shows clean" | T4 requires sustained 7-day observation at full coverage |
| Promoting strictness gradients in advance of their threshold | Promotion is allowed *at* threshold, not *before* |

---

## 11. WHEN THIS DOC IS UPDATED

- A threshold is reached or regressed.
- A false-isolation pattern is detected (add to §7.2).
- A `MASTER.md` language update is contemplated (cross-check §9).
- A strictness gradient is promoted (cross-reference §5 update).

This doc is *not* updated for:
- Coverage progress that does not cross a threshold.
- Registration of additional modules within a cohort.
- General intuition about isolation.

---

## 12. SUMMARY

| Question | Answer |
|---|---|
| What is module isolation? | The structural property that no module can silently affect another module's runtime state |
| Five thresholds | T0 (substrate), T1 (existence), T2 (half coverage), T3 (trustworthy), T4 (full + integrity) |
| Exact threshold for "isolation exists" | T1 — the first cohort registers cleanly and survives one hydrate + first-mount cycle |
| Exact threshold for "isolation is trustworthy" | T3 — ≥80 % coverage, 7 days observation, zero unresolved warnings |
| Exact threshold for "strictness escalation allowed" | Per-gradient: G3 at T2+10 %, G4 at T3, G5 at T4 |
| Where is false isolation? | Five canonical patterns in §7.2; the unifying property is artifact-without-property |
| What changes at T4? | The codebase property holds by construction; `MASTER.md` Module Isolation language can become structural |
| What does NOT change at any threshold? | Phase C is independent. Integration coupling is independent. Long-range invariants do not bend on isolation progress. |

---

*See `PHASE_B_ACTIVATION_CRITERIA.md` for the activation event (which depends on T1 being reached), and `STRICTNESS_GRADIENT_PLAYBOOK.md` for the per-gradient migration paths and forbidden jumps.*
