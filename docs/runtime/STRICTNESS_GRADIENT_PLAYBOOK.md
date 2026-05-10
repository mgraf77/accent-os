# STRICTNESS_GRADIENT_PLAYBOOK

> Per-level playbook for the strictness ladder of the registration substrate.
> For each level: prerequisites, forbidden jumps, reversibility, blast radius, migration path.
> Analysis only — no implementation, no code, no runtime language.
> 17th doc in the cartography pack under `docs/runtime/`.
> Snapshot date: 2026-05-10.

---

## 0. WHAT THIS PLAYBOOK GOVERNS

The registration substrate (`register()`) ships in observation-only form. Over time, its strictness can be elevated — from warning-on-issue to throwing-on-issue, per gradient. Each elevation is a *trust statement*: "we trust the substrate enough to let it block on this class of problem."

Strictness is **not a milestone**. It is a **trust gradient**. Its purpose is to harden a substrate that has already earned trust, not to demonstrate progress. **Climbing the strictness ladder before the substrate has earned the next rung's trust is the canonical false-strictness failure** (§7).

The playbook is operational: given a current strictness level, what does it take to ascend? What does it take to descend? What is the blast radius if elevated wrong? Each level is treated as a self-contained unit with its own contract.

The five levels:

| Level | Name | Behavior |
|---|---|---|
| **L0** | Observation-only | Records state; no warnings, no throws |
| **L1** | Duplicate detection | Warns on duplicate `provides` |
| **L2** | Missing-consume detection | Warns on unsatisfied `consumes` |
| **L3** | Undeclared-leak detection | Warns on undeclared `window.*` writes (mutation containment) |
| **L4** | Optional enforcement | Throws on any of the above, per environment opt-in |

L0–L3 are *observation* gradients (output is `console.warn`). L4 is *enforcement* (output is throw). The level boundary that matters most is L3 → L4: behavior shifts from informative to blocking.

---

## 1. THE LADDER STRUCTURE

### 1.1 Why a ladder, not a switch
A binary on/off would force every strictness decision into one moment. A ladder lets each diagnostic class earn trust independently. Duplicate-`provides` is a different problem from missing-`consume` is a different problem from undeclared-leak. Earning trust on one does not earn trust on the others.

### 1.2 Why observation comes before enforcement
Enforcement at L4 throws. Throws block. Blocks during a session at the wrong moment cost a lot more than warnings. The ladder structure is: observe → learn → decide → enforce. Skipping observation lands enforcement against undiscovered substrate quirks.

### 1.3 Default disposition
Default operating level is **L2** *post-Phase-B-stable*. (See §10.) At L2, the substrate observes meaningful classes of issue but does not block. L3 is the highest default that is universally safe to leave on; L4 is opt-in only.

---

## 2. LEVEL L0 — OBSERVATION-ONLY

### 2.1 Definition
The substrate records `name`, `provides`, `consumes`, lifecycle hooks at registration. It updates `window.AOS_REGISTRY` (or equivalent observable surface). It produces **no** warnings, no throws.

### 2.2 Prerequisites
- Substrate exists (`PHASE_B_ACTIVATION_CRITERIA C1`).
- Nothing else.

### 2.3 Forbidden jumps from L0
- L0 → L2 directly (skipping L1). Forbidden because L1's duplicate-detection is the simplest diagnostic class and the easiest to validate. Jumping skips evidence.
- L0 → L4 ever. L4 is enforcement; an enforcement-from-silence transition is the maximum-risk move.

### 2.4 Reversibility
L0 is the floor. There is nothing below L0 except substrate-absent. Reversibility from L0 to L0 is trivial; reversibility *to* L0 from any higher level is always permitted.

### 2.5 Blast radius
Zero. L0 produces no behavior change. Worst case: the substrate is broken in a way that produces wrong `AOS_REGISTRY` state, and no warning surfaces it. The cost is the substrate is not yet earning its keep — not that anything breaks.

### 2.6 Migration path FROM L0
- The substrate must be in use (≥1 module registered).
- Boot sequence must complete cleanly with the registry populated.
- Ascend to L1 by enabling duplicate detection — typically a one-line config change (conceptually).

### 2.7 Notes
L0 is the natural state for the first session(s) after substrate ships. It buys *observation infrastructure* without yet asking the operator to interpret signal. Sit at L0 long enough to accumulate baseline familiarity with the registry's shape; ascend when L1's diagnostic class becomes useful.

---

## 3. LEVEL L1 — DUPLICATE DETECTION

### 3.1 Definition
The substrate warns when two modules `provides` the same name. Behavior at the runtime is unchanged (the second registration wins or the first wins, depending on substrate design — but the *warning* is what L1 contributes).

### 3.2 Prerequisites
- L0 has held for at least one session.
- The registry has been observed populating across at least one full hydrate + first-mount cycle.
- The cohort has at least three modules registered.
- Coverage is at the cohort level (T1 in `MODULE_ISOLATION_EVOLUTION`).

### 3.3 Forbidden jumps from L1
- L1 → L3 (skipping L2). L3 detects undeclared writes; L2 detects undeclared *reads*. Reads are the more common pattern; skipping read-detection in favor of write-detection skips the more frequently-violated diagnostic class.
- L1 → L4 ever from L1. Enforcement from any observation-level is too large a step.

### 3.4 Reversibility
L1 → L0 is trivial. Disable duplicate detection; substrate returns to observation-only.

### 3.5 Blast radius
- The blast radius is *console-noise blast*. A duplicate-`provides` warning fires at every boot. Operators get used to seeing it; the warning may become noise rather than signal.
- The remediation cost is per-duplicate: rename one of the colliding `provides` (or fix the underlying coupling).
- *Worst case*: if the warning produces a long string of false positives at boot (e.g., a misconfigured registration that double-fires), session-boot context is consumed by the noise.
- L1 itself does not block any operation; it does not throw.

### 3.6 Migration path FROM L1
- Coverage at ≥60 % (T2 + 10 % overshoot).
- 14 calendar days at the new coverage level with **zero unresolved** duplicate warnings.
- (Resolved warnings — i.e., warnings that fired and were fixed within a session — are fine. Unresolved means still firing across the observation window.)
- Ascend to L2 when the missing-consume diagnostic becomes useful, typically when the registry has enough `provides` populated that `consumes` mismatches become signal-rich.

### 3.7 Notes
L1 is the first *informative* level. Operators reading the boot console will see duplicate warnings if any exist. The fact that warnings are visible is itself a low-grade incentive to keep `provides` lists clean.

The most common false-positive pattern at L1 is the §7.2.2 false-isolation pattern from `MODULE_ISOLATION_EVOLUTION` — aliased provides where two modules expose related-but-distinct names. The substrate sees `provides: ['toast']` and `provides: ['showToast']` as no collision; the operator may notice the relationship and decide to consolidate. L1 does *not* surface aliased duplicates; that requires manual review.

---

## 4. LEVEL L2 — MISSING-CONSUME DETECTION

### 4.1 Definition
The substrate warns when a module's `consumes` declaration names a global that no prior registration has provided (and which is not a shell-built-in). At runtime the consumer would proceed (likely to fail later); the *warning* is what L2 contributes.

### 4.2 Prerequisites
- L1 has held for at least 14 days at ≥60 % coverage with zero unresolved duplicate warnings.
- Coverage at ≥80 % (T3 in `MODULE_ISOLATION_EVOLUTION`).
- Most-coverage observation window of 7 days has elapsed.

### 4.3 Forbidden jumps from L2
- L2 → L4 (skipping L3). L3's undeclared-leak detection is the *write* counterpart to L2's *read* detection. Skipping the write side and going directly to enforcement turns observation into blocking against patterns the substrate hasn't audited.
- L2 → L1 is technically allowed (descent is always permitted) but is unusual; descending past a level you've earned is a regression signal worth investigating before acting.

### 4.4 Reversibility
L2 → L1: trivial config change. Disable missing-consume detection; substrate continues at L1.

### 4.5 Blast radius
- Console-noise blast, larger than L1 because consume-mismatches are more numerous than provides-collisions.
- Remediation cost is per-mismatch: either declare the missing consume in the consumer's `register()` call (most common), provide it in some module's `provides` (rare), or accept that the consumer reads a built-in not tracked by the registry (rare; usually means substrate's notion of built-ins needs an update).
- *Worst case*: a high-volume mismatch buries genuine signal in the warning stream. Mitigation: fix the noisiest first, before attempting to interpret the rest.
- L2 itself does not block. Throws happen at L4.

### 4.6 Migration path FROM L2
- Coverage at 100 % (T4 in `MODULE_ISOLATION_EVOLUTION`).
- Full-coverage observation window of 7 days has elapsed.
- Zero unresolved missing-consume warnings.
- Ascend to L3 when the operator has decided that undeclared *writes* are a class of issue worth observing — which is most operators most of the time, but the decision is non-automatic.

### 4.7 Notes
L2 is the highest level at which most codebases comfortably operate long-term. The warnings are useful, the cost is bounded, and the substrate's value is fully visible. Many systems never ascend past L2 because the marginal value of L3 (catching writes the operator didn't declare) is smaller than the marginal cost of L3 (audit overhead per declared `provides`).

For AccentOS specifically: L2 is plausibly the long-term floor. L3 is plausibly the long-term *operational* level, with L4 being opt-in for CI / staging.

---

## 5. LEVEL L3 — UNDECLARED-LEAK DETECTION

### 5.1 Definition
The substrate snapshots `window`'s key set after registration and diffs after the module's top-level code runs. Any new `window.*` key not in the module's `provides` is flagged as a leak. Leaks produce warnings (no throws at L3).

L3 catches:
- A module that adds `window.tempForDebug = ...` and forgets to remove it.
- A copy-paste from another module that brought a stray global.
- A typo (`window.toats` instead of `window.toast`) that silently creates a shadow.

L3 does **not** catch:
- A module that mutates the *value* of an already-declared global.
- A module that reads from a global it did not declare in `consumes` (that's L2).

### 5.2 Prerequisites
- L2 has held for at least 7 days at 100 % coverage with zero unresolved missing-consume warnings.
- T4 has been reached (`MODULE_ISOLATION_EVOLUTION §2.5`).
- The integrity property (§6 same doc) is held by construction.
- Operator has decided L3 is worth its audit cost.

### 5.3 Forbidden jumps from L3
- L3 → L4 directly without an opt-in environment. L4 throws; L4 must be opt-in per environment, never universally on. The forbidden jump is "L3 → L4 in production with no toggle."

### 5.4 Reversibility
L3 → L2: trivial config change. Disable leak detection; substrate continues at L2.

### 5.5 Blast radius
- Console-noise blast, *initially* high and decaying as cleanup progresses. The first time L3 is enabled, a long backlog of undeclared writes becomes visible. The number of warnings can briefly exceed the cohort's tolerance.
- Remediation cost is per-leak, and includes deciding whether the leak is truly extra (remove it) or was meant to be declared (add to `provides`).
- *Worst case*: the backlog at L3 enable-time overwhelms the operator and L3 is rolled back without remediation, leaving the system at L2 with a known unfixed pile. Mitigation: enable L3 on a schedule that includes time to address the backlog; do not enable L3 in the same session as other work.
- L3 itself does not block.

### 5.6 Migration path FROM L3
- L3 is the highest *non-blocking* level. The next migration is to L4, which requires the per-environment opt-in and changes runtime behavior.
- Sit at L3 indefinitely is a valid resting position.
- Ascend to L4 when CI / staging benefits from a hard signal, *and* the substrate has been at L3 for at least 30 days with the leak backlog cleared.

### 5.7 Notes
L3 is the most operationally instructive level. It surfaces the patterns operators didn't realize were happening — debug-globals left in, copy-paste residue, typo-shadowed names. The first L3 session after enabling produces the longest list of "huh, that's been there?"

For AccentOS specifically: L3's value depends on how much the operator's discipline already prevents undeclared writes. If discipline is strong (per `MASTER.md §12`), L3's backlog is small; if discipline has been reinforced by the substrate's L1/L2 work, the backlog may be small enough to clear in one session. If not, L3 enable should be scheduled accordingly.

---

## 6. LEVEL L4 — OPTIONAL ENFORCEMENT

### 6.1 Definition
The substrate **throws** instead of warning, on any of the lower levels' diagnostic classes. Behavior at runtime changes: the registration call fails, propagating an error. The error is a hard signal — execution does not continue past it within the affected scope.

L4 is **per environment**. Production never runs L4 by default. L4 lives in:
- CI / test runs.
- Staging deployments.
- Local-development with a debug flag set.

### 6.2 Prerequisites
- L3 has held for at least 30 days at 100 % coverage with the leak backlog cleared.
- A per-environment opt-in mechanism exists (a flag the substrate reads at boot to decide whether to throw).
- The operator has decided that for at least one environment, hard signal is more valuable than continued execution.

### 6.3 Forbidden jumps from L4
- L4 → L4-in-production-by-default. Production must remain at the highest *non-blocking* level the substrate trusts (typically L2 or L3), not L4. The forbidden jump is making throws the production default.
- L4 → L4-without-opt-in. If the substrate cannot tell which environment it's in, it cannot honor the per-environment requirement; L4 is forbidden.

### 6.4 Reversibility
L4 → L3: change the per-environment flag. Reversibility is trivial *as a configuration*. Reversibility *as a culture* — operators relying on L4 hard signal in CI — may be harder; L4-in-CI is a load-bearing assumption once enabled.

### 6.5 Blast radius
- L4 *blocks* execution in the affected environment. A throw during boot in CI fails the CI check. A throw during hydrate in staging dark-routes the staging app.
- The intent is for these blocks to surface real issues. The risk is for them to surface false positives — substrate quirks that present as errors but aren't signaled by lower levels (and so weren't observed in time).
- *Worst case*: L4 in production by misconfiguration. The app doesn't load. Mitigation is a deployment-time guard against L4-in-prod; the substrate must read the environment, not flip-the-switch.
- L4 throws **must include** clear messages identifying the affected module, the affected `provides` / `consumes` / leak, and the reason for the throw. A throw with poor diagnostics is worse than a warning at the same level.

### 6.6 Migration path FROM L4
- There is no level above L4. Strictness ends at enforcement.
- Migration *back down* from L4 is always permitted: change the flag, the environment falls back to L3.
- Migration *of L4 to additional environments* is staged: enable in CI first; let CI run for 30 days without L4-introduced false-positive failures; only then consider staging; do not consider production.

### 6.7 Notes
L4-in-CI is the typical long-term resting position for systems that adopt strictness at all. L4-in-production is rare — most systems prefer "the app loads, log the warning" over "the app fails to load." For AccentOS specifically: production should remain at L2 or L3 indefinitely. CI / staging may benefit from L4 once the substrate has matured at L3 long enough to clear false positives.

---

## 7. FALSE STRICTNESS

States where the substrate is at a higher strictness level than its evidence supports. The companion concept to "false isolation" in `MODULE_ISOLATION_EVOLUTION §7`.

### 7.1 What false strictness is
A configuration in which strictness has been elevated past the threshold the substrate has earned. The substrate produces warnings (or throws) but the warnings are noise — the substrate hasn't observed enough to distinguish signal from noise — or the throws are blocking work that should have been allowed.

### 7.2 The four canonical false-strictness patterns

#### 7.2.1 Premature L1
L1 enabled before the cohort has registered cleanly. Every duplicate warning is fresh, the operator hasn't yet developed a sense of which collisions are real versus harmless. Every warning is investigated; investigation cost > the value of L1 at this stage.

**Detection:** L1 enabled at <3 modules registered, or with duplicate warnings firing on initial enable.

**Recovery:** descend to L0; let the cohort stabilize; re-ascend later.

#### 7.2.2 Premature L2
L2 enabled before coverage hits 80 %. Missing-consume warnings fire because most modules haven't declared `consumes` yet. The signal-to-noise ratio is below 1; the substrate appears broken.

**Detection:** L2 enabled at <80 % coverage, or with a high volume of missing-consume warnings on initial enable.

**Recovery:** descend to L1; reach T3; re-ascend.

#### 7.2.3 Premature L3
L3 enabled before T4 with the integrity property held by construction. Undeclared-leak warnings fire from unregistered modules' state additions, which were never going to be in any `provides` because those modules never registered. The substrate *correctly* warns; the warnings are simply noise relative to the goal.

**Detection:** L3 enabled at <100 % coverage. (T4 is the gate for a reason.)

**Recovery:** descend to L2; reach T4; re-ascend.

#### 7.2.4 Premature L4-in-production
L4 enabled in the production environment. A throw at boot dark-routes the app. Operators discover the issue when users do. The cost of recovery is whatever a production outage costs.

**Detection:** the production environment's substrate flag is set to enforce. Even one observation of this is one too many.

**Recovery:** disable L4 in production immediately; root-cause why the flag was set; add a deployment-time guard.

### 7.3 The unifying property
Each false-strictness pattern has the same shape: **strictness was elevated for the wrong reason** — operator excitement, milestone confusion, milestone-as-progress-signal, or misconfiguration. Strictness elevation is a *trust statement*, not a milestone. Elevating without the trust earned is misrepresenting the substrate's state to itself.

### 7.4 The single most damaging false-strictness pattern
**§7.2.4 — L4 in production.** The other three patterns produce noise; this one produces outage. The cost asymmetry is large enough that L4-in-production must be considered architecturally forbidden until and unless an explicit governance commit ratifies it as opt-in for some specific production case (and even then, the case should be vanishingly rare).

---

## 8. THE STRICTNESS DECISION ALGORITHM

For an operator considering an elevation:

```
1. What level am I currently at?
2. What level am I considering elevating to?
3. What are the prerequisites for that level (this doc, §3.2 / §4.2 / §5.2 / §6.2)?
4. Have all of them held continuously for the required observation window?
5. Is there a backlog from the lower level that I should clear first?
6. What is the blast radius if the elevation produces unexpected output?
7. What is the rollback path?
8. Is the elevation the right environment? (L4 specifically)
9. Is this elevation opt-in or default?
10. Will the next session benefit from this elevation, or am I doing it for myself?
```

If steps 4–6 produce unsatisfactory answers, *do not elevate*. Strictness retreats are cheap; misjudged advances are expensive.

---

## 9. THE FULL CROSS-REFERENCE TABLE

| Level | Coverage threshold | Observation window | Isolation threshold link | Blast radius | Default disposition |
|---|---|---|---|---|---|
| L0 | any | n/a | T0 | none | initial |
| L1 | ≥cohort | 1 hydrate cycle | T1 | console noise, low | post-T1 |
| L2 | ≥60 % | 14 days | T2 + 10 % | console noise, medium | post-T2 |
| L3 | 100 % | 7 days at full coverage | T4 | console noise, initially high | optional resting |
| L4 | 100 % | 30 days at L3 | T4 + integrity confirmed | execution block in environment | opt-in only, never production-default |

**Reading rule:** the column "Isolation threshold link" identifies which T-threshold gates each strictness level. Strictness cannot be elevated if its T-threshold has not been reached. The reverse is also true: reaching a T-threshold makes a strictness level *eligible*, not *required*. Eligibility ≠ obligation.

---

## 10. THE LONG-TERM RESTING POSITION

A question worth answering up front: where should AccentOS settle?

### 10.1 Production environment
**L2.** Missing-consume warnings are the most informative diagnostic class for the long-term operator. L1 is too narrow (collision-only), L3 is too noisy (write-detection has high baseline false-positive rate). L4 in production is forbidden.

### 10.2 Staging environment
**L3.** Once T4 is reached and the integrity property holds, staging benefits from undeclared-leak detection because staging is where bug reports incubate. L4 in staging is plausible after L3 has stabilized but is not the long-term default.

### 10.3 CI environment
**L4.** CI is the natural home for hard signal: a throw fails the build; the build's purpose is to produce a hard signal anyway. L4 in CI is the reason for the existence of L4.

### 10.4 Local development
**L1 or L2 by default; L4 opt-in via debug flag.** Local-dev sessions can opt into L4 to surface issues fast; they should not run L4 by default lest the operator's session boot fail mysteriously.

### 10.5 The asymmetry
The four environments rest at *different* levels because they have different purposes. Production is for users; CI is for developers; staging is for verification; local is for iteration. Strictness aligns to purpose, not to a single global setting.

---

## 11. STRICTNESS REGRESSION

A reached level can regress, and regression is sometimes *correct*.

### 11.1 Regression triggers
- A backlog of warnings at the current level is not being cleared session-over-session.
- A false-strictness pattern (§7.2) is detected post-elevation.
- An environment shift (e.g., a new staging environment is added at a level that doesn't fit).
- The substrate itself is updated and the level's diagnostic class is now broader than it was.

### 11.2 Regression posture
- Regression is **default-allowed**. The operator does not need approval to descend.
- Regression is **noted**. The descent is recorded in `FAR_TRACK_STATE` (§4.5 of that doc) so the next session knows the substrate is at a different level.
- Regression triggers a **review**. After descent, the operator examines what triggered the regression and whether re-ascending requires changes to the substrate, the registrations, or the environment.

### 11.3 What is NOT regression
- Disabling L4 in a single environment because a deploy broke. This is *containment*, not strictness regression — L4 in other environments may continue.
- Elevating then immediately descending in the same session because of a misconfiguration. This is a *failed elevation*, not regression. The fix is the misconfiguration; the level state did not actually change.

---

## 12. ANTI-PATTERN INVENTORY

| Anti-pattern | Why it fails |
|---|---|
| Elevating strictness as a session deliverable | Strictness is a trust statement, not a deliverable |
| Skipping levels (L0 → L2, L1 → L3) | Each level's diagnostic class earns trust independently |
| L4 in production by default | Maximum-cost failure mode (§7.4) |
| Silencing warnings to reach the next level's "zero unresolved" gate | Silenced warnings = §7.2.3 false isolation; defeats the purpose |
| Tracking elevation as "% complete" | Levels are discrete; percentage is meaningless |
| Elevating on calendar pressure ("we should be at L3 by Q3") | Strictness is gated by substrate evidence, not by schedule |
| Choosing strictness independently per session | Levels persist; the choice is global, not session-local |
| Treating regression as defeat | Regression is an architectural rail; *not* using it when triggered is the failure |
| L1 + L3 enabled, L2 disabled | The levels are ordered; partial-skip configurations are forbidden by the ladder structure |
| Configuring L4 throws without diagnostic detail | §6.5 — L4 throws must include actionable messages |

---

## 13. WHEN THIS PLAYBOOK IS UPDATED

- A level's prerequisites change.
- A new false-strictness pattern is observed (add to §7.2).
- A new level is contemplated (e.g., a hypothetical L5; not currently in scope).
- An environment-specific resting position changes (§10).

This doc is *not* updated for:
- A specific elevation event (that goes in `FAR_TRACK_STATE`'s ledger).
- A regression event (same).
- General strictness intuition.

---

## 14. SUMMARY

| Question | Answer |
|---|---|
| What does the strictness ladder govern? | When the substrate's diagnostic surface can be elevated from observation to enforcement |
| Five levels | L0 observation-only · L1 duplicate detection · L2 missing-consume · L3 undeclared-leak · L4 optional enforcement |
| Where does AccentOS rest long-term? | Production L2 · staging L3 · CI L4 · local L1–L2 default with L4 opt-in |
| Forbidden jumps | L0→L2 · L0→L4 · L1→L3 · L2→L4 · L3→L4-in-prod-default · L4 without opt-in mechanism |
| Reversibility | Always permitted; regression is an architectural rail |
| Most damaging false strictness | L4 in production (§7.2.4) |
| Default disposition | Begin at L0; ascend as substrate earns trust; settle per environment |
| Trust statement, not milestone | Each elevation asserts substrate trust; without earned trust, the assertion is false |

---

*See `MODULE_ISOLATION_EVOLUTION.md` for the T-threshold ladder that gates strictness levels, and `PHASE_B_ACTIVATION_CRITERIA.md` for the activation event that opens strictness eligibility at all.*
