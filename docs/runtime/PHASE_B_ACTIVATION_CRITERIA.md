# PHASE_B_ACTIVATION_CRITERIA

> The conditions under which Phase B is **activated** — distinct from prerequisites being met.
> Architecture-level rails for the train's next phase boundary.
> Analysis only — no implementation, no code, no runtime language.
> 15th doc in the cartography pack under `docs/runtime/`.
> Snapshot date: 2026-05-10.

---

## 0. THE DISTINCTION THIS DOC EXISTS TO DRAW

Three concepts are easily conflated and must not be:

1. **Phase B prerequisites** (`FAR_TRACK_STATE §3`) — conditions that must hold *before* Phase B can begin. Substrate exists; first cohort registers cleanly; transition criteria recorded.
2. **Phase B activation** — the *event* by which the system declares it is no longer in Phase A. This doc.
3. **Phase B stability** — the system having operated in Phase B for long enough that its behavior is trusted. Discussed elsewhere in the pack.

Activation is a discrete moment. The cartography pack thus far has treated phases as *processes*; this doc treats the *boundary between phases* as a thing in itself, with its own criteria and failure modes.

The reason: the train has already demonstrated it can outrun planned track. Without explicit activation criteria, "we are in Phase B" becomes whatever the most recent train session implicitly assumed — which is the canonical fast-but-unowned phase transition that creates ghost phases (§9).

---

## 1. WHAT "PHASE B ACTIVATION" MEANS

**Phase B activation is the recorded event by which the system asserts:**
- Phase A is complete and stable.
- Substrate (`register()`) is present and observable.
- The set of governance transitions that gate Phase B has been ratified.
- The next session boots into a system whose default doctrine is Phase B's, not Phase A's.

It is *not*:
- The session that ships the final Phase A packet.
- The session that ships `register()`.
- The session that registers the first module.
- A pace-of-work increase.
- A vibe shift.

Each of those is a *necessary precursor* to activation, not the activation itself.

### 1.1 Why it must be an explicit event
Phases govern band assignments (`TRAIN_SPEED_LIMITS §8`), forbidden-track membership (`TRACK_LAYER_MAP §5`), and the speed at which substrate evolution stages (G0–G5, S1–S5, T0–T4) are eligible to advance. If "we are in Phase B" is implicit, then *every band assignment is implicit too*. A session that thinks it's in Phase B will treat as GO what a session that thinks it's in Phase A would treat as CAUTION. Two sessions disagree about the system's state → the slower-band session is overruled by execution → the faster-band assumption wins by default. **The activation event prevents this drift by making "which phase are we in?" answerable from a commit, not from inference.**

---

## 2. THE FIVE ACTIVATION CRITERIA

Phase B is activated when **all five** of the following hold *simultaneously* and *demonstrably*. Demonstrability matters: each criterion has a check that is independent of the operator's belief.

### 2.1 Criterion C1 — Substrate present
**Statement:** the registration substrate (`register()`) exists and is reachable from any module file at script-load time.

**Demonstrable by:** the substrate's existence and shape can be confirmed by reading the file it lives in. Not by anyone asserting it works.

**Why:** without C1, every other criterion is moot. There is nothing to register *to*.

### 2.2 Criterion C2 — First cohort registered cleanly
**Statement:** at least three modules have called `register()` with declared `provides` and `consumes`, across one full hydrate + first-mount cycle, without producing collision or missing-consume warnings against each other.

**Demonstrable by:** the registry's state at boot — the set of registered modules and the set of warnings — is observable from a single source.

**Why:** C2 is the moment "module isolation begins existing in this codebase." Before C2, isolation is a claim. After C2, it is a fact for at least one cohort.

### 2.3 Criterion C3 — Phase A drain complete on EXTRACT-FIRST surfaces
**Statement:** every surface classified `EXTRACT-FIRST` in `DECOMPOSITION_STRATEGY_V1 §10` is either (a) extracted, or (b) explicitly deferred with documented rationale to a follow-on phase.

**Demonstrable by:** a checklist against the EXTRACT-FIRST list with explicit per-row status.

**Why:** Phase B does *not* finish Phase A's mass-drain. Phase B is the substrate phase. Carrying mass-drain work into Phase B forces the train to mix decomposition packets with registration packets — exactly the role-mixing failure `TRAIN_TRACK_OPERATING_MODEL §1.4` warns against.

### 2.4 Criterion C4 — `MASTER.md §3 / §4` reflects post-Phase-A reality
**Statement:** the architecture description (and code-pattern description) in `MASTER.md` matches what a fresh reader would observe by inspecting the codebase.

**Demonstrable by:** any fresh session can read `MASTER.md §3 / §4` and the codebase, and not produce a list of contradictions.

**Why:** if `MASTER.md` is stale (as it is at this snapshot), every Phase B session boots on bad context. Fresh sessions reading `MASTER.md` and acting on it would be making Phase A decisions in a Phase B world. C4 closes this drift.

### 2.5 Criterion C5 — Activation commit exists
**Statement:** a single commit on the integration branch records "Phase A → Phase B transition" with date, conditions met, and the integration HEAD SHA at the time of the transition.

**Demonstrable by:** the commit is findable in `git log`.

**Why:** without C5, all of the above can be true simultaneously and the system *still* be ambiguously in either phase. The commit *is* the transition. C5 makes activation a fact in the source-control graph, not just in the operator's head.

### 2.6 Why all five together
- C1 alone: substrate exists but is unused — pre-activation.
- C2 alone: cohort exists but other Phase A work outstanding — premature.
- C3 alone: shell drained but no substrate — Phase A complete, Phase B not begun.
- C4 alone: docs current but reality not — governance ahead of code.
- C5 alone: declared but not actual — ghost activation (§9).

The criteria are mutually reinforcing. Any subset is incomplete.

---

## 3. THE ACTIVATION COMMIT

C5 deserves expansion because it is the load-bearing event.

### 3.1 What the activation commit is
A single commit on the integration branch with:
- Title: explicit "Phase A → Phase B transition" or equivalent.
- Body: enumerates C1–C4 status with brief evidence per item.
- Diff: updates to one or more docs (`MASTER.md` if C4 wasn't already its own commit; `FAR_TRACK_STATE §7.3` to mark GT-A→B as landed).
- No code change beyond the doc updates.

### 3.2 What the activation commit is NOT
- A multi-purpose commit that also lands a feature.
- A merge of an analysis branch that "happens to include" the transition note.
- A `MASTER.md` edit that buries the transition inside §15 (Session Log) without an explicit transition declaration.

### 3.3 Authorship
The activation commit is written by a far-track or near-track session in *governance* role — not by the train. Train sessions ship code; governance sessions write transitions. Mixing the two muddles the activation event.

### 3.4 Reversibility
The activation commit is reversible. If post-activation observation reveals a criterion was not actually met, the system reverts to Phase A by a counter-commit ("Phase B → Phase A reversion: criterion CX did not hold; reason; conditions to re-attempt"). Reversion is an architectural rail, not a failure — see §6.

---

## 4. THE ACTIVATION WINDOW

The window between "all five criteria are within reach" and "activation commit is written" is its own state with its own risks.

### 4.1 The window state
The system enters the *activation window* when:
- C1 has held for at least one session.
- C2 has been observed at least once.
- C3 is at "approximately complete" (one EXTRACT-FIRST item may remain).
- C4 is queued or in flight.

The system *leaves* the window when:
- All five criteria are met → activation commit lands → in Phase B.
- A criterion regresses → fall back to "approaching window" state.

### 4.2 Maximum safe time in the window
**One full session.**

The activation window is not a place to live. Sessions that operate in the window without resolving it forward (to activation) or backward (to "Phase A still in progress") create the ambiguity §1.1 warns against. If a session enters the window and ends without resolving it, the next session's first action is the resolution.

### 4.3 What happens in the window
The window is *governance* work, not execution. Specifically:
- The activation commit is drafted.
- Each criterion is checked.
- Failed checks become explicit blocking items, not soft warnings.
- The commit is written, reviewed (in single-operator terms: re-read), and landed.

### 4.4 What does NOT happen in the window
- New Phase A decomposition packets.
- New module registrations beyond C2's cohort.
- New SQL migrations.
- Anything Phase-B-flavored ("now that we're almost in B…"). The window is *not* B.

---

## 5. WHAT INVALIDATES AN ACTIVATION

Activation is not permanent on its face. The following events *re-open* the question of phase membership:

### 5.1 C1 invalidation
The substrate is observed broken: `register()` no longer callable, registry no longer reads, calls throw unexpectedly. **Action:** reversion (§6), regardless of how much Phase B work has shipped on top.

### 5.2 C2 invalidation
A previously-clean cohort produces collision or missing-consume warnings on a subsequent boot. The cohort that was "isolated" is no longer cleanly isolated. **Action:** investigate whether the regression is recoverable within Phase B; if it requires shell or substrate change, reversion may be warranted.

### 5.3 C3 invalidation
A new EXTRACT-FIRST surface is identified that was missed in the original C3 check. **Action:** if the surface is small (<1 packet of decomposition), patch in Phase B as a CAUTION-banded item; if large, reversion.

### 5.4 C4 invalidation
`MASTER.md §3 / §4` drifts during Phase B. The doc no longer matches reality. **Action:** corrective governance commit; not full reversion. C4 is the most recoverable invalidation.

### 5.5 C5 invalidation (impossible by construction)
The activation commit cannot be invalidated except by reversion. It exists or it does not.

### 5.6 New criterion discovery
The most insidious invalidation: a criterion that should have been C1–C5 was missed. **Action:** add the criterion to this doc and to `FAR_TRACK_STATE §3` (prerequisites); evaluate whether Phase B should have been activated or not. If it should not have been, reversion. If it should have been but the new criterion is now violated, treat as a §5.1–§5.4 case.

---

## 6. PHASE B → PHASE A REVERSION

Reversion is an architectural rail, not a defeat.

### 6.1 The reversion event
A commit on the integration branch that:
- Title: explicit "Phase B → Phase A reversion."
- Body: enumerates which criterion failed and why; what would need to be true to re-attempt activation.
- Diff: updates to docs (notably `FAR_TRACK_STATE §7.3` marking GT-A→B as un-landed; `MASTER.md` if its description references Phase B).
- No code revert. The substrate stays. The registrations stay. The mass-drain stays. **Reversion changes only doctrine, not artifacts.**

### 6.2 Why no code revert
Phase B's substrate is useful in Phase A too — the registry observes regardless of phase. The reversion is a *band shift*: actions that were GO in Phase B return to CAUTION in Phase A. The substrate continues to mature passively.

### 6.3 Cost of reversion
- One governance commit (cheap).
- Re-validation of the next near-track plan against Phase A bands (medium).
- Updated `WORK_IN_PROGRESS.md` (cheap).

Reversion is *cheaper* than carrying a ghost activation forward. The cost of reverting is one session of doc work; the cost of operating under a wrong phase declaration for several corridors is much higher.

### 6.4 Re-activation
After reversion, re-activation requires the failed criterion to be addressed *and* a fresh check that the others still hold. The original activation commit's evidence is not transferable; new evidence is required.

---

## 7. VERIFICATION PROTOCOL

How a future session knows whether the system is in Phase B.

### 7.1 The check (60 seconds)
```
1. git log --grep "Phase A → Phase B" on integration branch.
   If a transition commit exists and no reversion commit follows: Phase B.
   If a reversion commit follows: Phase A.
   If neither: Phase A.

2. Read the most recent transition commit's body. Note the criteria status.

3. Spot-check one criterion (typically C1 or C2 — substrate / cohort).
   If the spot-check fails: invalidation has occurred; flag for governance.

4. Read FAR_TRACK_STATE §7.3 GT-A→B status. Should match the git answer.
```

### 7.2 What this protects against
Sessions that arrive mid-corridor and need to know which bands and which forbidden-track items apply. Without the protocol, every session re-derives "are we in B yet?" from inference. With it, every session reads one commit message.

### 7.3 If the check is ambiguous
- Multiple transition commits without reversions → newest wins.
- A transition commit and a reversion commit on the same day → newest wins (the reversion).
- No transition commit but the codebase looks like Phase B → **assume Phase A.** Always default to the more conservative phase if the explicit signal is absent.

---

## 8. ACTIVATION OWNERS

Single-operator project: human (Michael) approves; far-track or near-track session authors. The activation is a *joint* act — far-track readiness assessment, near-track or human approval to proceed. The train is not the author.

In practice:
- Far-track session reads `FAR_TRACK_STATE` and concludes prerequisites are met.
- Far-track session drafts the activation commit on an analysis branch.
- Human reviews and merges (or instructs merge).
- Activation lands on the integration branch.

Activation never happens because "the train just sort of crossed into Phase B." It happens because someone wrote the commit.

---

## 9. THE GHOST ACTIVATION FAILURE MODE

The most dangerous failure mode this doc exists to prevent.

### 9.1 What it is
The system *behaves* as if Phase B were active — band assignments are loosened, forbidden-track items are touched, new modules are added — without an activation commit. The transition is implicit, distributed across sessions, and thus unowned.

### 9.2 How it happens
- A train session ships `register()` and registers three modules in the same session.
- The pace feels like "we're in Phase B now."
- The next session reads the codebase, sees `register()`, and assumes Phase B bands.
- A new module is added with a registration call (Phase B GO band).
- A `MASTER.md` paragraph is updated to mention modules being isolated (Phase B post-T4 work).
- Three corridors later, no one has authored an activation commit.
- A regression appears that traces to the missed C3 criterion (an EXTRACT-FIRST item still in the shell).
- Reversion is awkward because three corridors of Phase-B-flavored work have to be re-classed.

### 9.3 How this doc prevents it
- §2 makes the criteria explicit.
- §3 makes the activation commit a single named artifact.
- §7 makes verification a 60-second check.
- §6 makes reversion cheap, removing the "we can't go back now" pressure that produces ghost activations in the first place.

### 9.4 If a ghost activation is detected
The first session to detect it must:
1. Stop train work.
2. Verify each criterion against current state.
3. If all five are met: write the activation commit retroactively, dated to the discovery moment.
4. If any fail: declare the system *Phase A still*, list the Phase-B-flavored actions taken, classify them as either acceptable Phase A work (no-op) or premature Phase B work (rollback if the diff is small; document if the diff is large).

Retroactive activation is *worse* than properly-sequenced activation but better than continuing under a ghost.

---

## 10. ACTIVATION ANTI-PATTERNS

A short list, each accompanied by why it should not happen:

| Anti-pattern | Why it fails |
|---|---|
| Activation commit hidden inside a feature commit | C5 requires the commit be findable; mixing with feature work makes verification noisy |
| Activation declared from a train session ("I'll just write the transition commit while I'm here") | Mixes execution and governance; the criteria are not independently checked |
| Activation declared without C4 (docs current) | Future sessions read stale `MASTER.md` and act on it; ghost-activation generator |
| Activation declared because "everything else is in B already" | Argument from inference; the criteria exist to make the inference unnecessary |
| Activation declared, then within the same session new B work shipped | The window (§4) is for governance only; B work waits until the next session |
| Multiple activation attempts within one corridor | If the first didn't take, the corridor is the wrong unit; redo at corridor boundary |
| Skipping C2 ("we'll register modules during B") | C2 is the existence proof of isolation; without it, B has no substrate trust |
| Skipping C3 with hand-wave deferral ("the rest of decomposition is small") | If small, finish it; if not small, it's not "the rest" |

---

## 11. POST-ACTIVATION STABILITY

What "Phase B" means for the next several sessions after activation lands.

### 11.1 Immediate post-activation
- One session of *no new code work* — verifying activation took.
- Read the activation commit; spot-check one criterion; confirm bands have shifted.
- Update `FAR_TRACK_STATE §7.3` if not already done.
- End session.

### 11.2 Early Phase B
- Cohort 2 module registrations begin (per `TRACK_LAYER_MAP §3.1`).
- The substrate's observation surface starts to populate.
- Strictness gradients (`STRICTNESS_GRADIENT_PLAYBOOK`) are eligible for evaluation but not yet eligible for promotion.

### 11.3 The "early Phase B" trap
The temptation to immediately ship "the things Phase B unlocks." Auth extract, sidebar generator, second/third cohort. Each is unlocked by Phase B activation in principle but not yet *safe* — `MODULE_ISOLATION_EVOLUTION` defines the thresholds (T2, T3) at which those moves become safe, and they are not at activation. **Activation is the start of Phase B, not its midpoint.**

---

## 12. WHEN THIS DOC IS UPDATED

- A criterion is revised (e.g., new criterion discovery per §5.6).
- An activation commit lands (this doc gains a §13 ledger entry).
- A reversion commit lands (same).
- A doctrine refinement from `TRAIN_TRACK_OPERATING_MODEL §14` confirms or contradicts an activation criterion.

This doc is *not* updated for:
- Calendar time.
- Train velocity changes.
- Generic intuition.

---

## 13. ACTIVATION LEDGER

Empty at the time of writing. To be appended *only* on activation or reversion events.

| Event | Date | Commit SHA | Body summary |
|---|---|---|---|
| (none yet) | | | |

---

## 14. SUMMARY

| Question | Answer |
|---|---|
| What is Phase B activation? | The recorded event by which the system transitions from Phase A to Phase B |
| What constitutes activation? | All five criteria C1–C5 holding simultaneously and demonstrably, with C5 being the activation commit itself |
| Who authors the activation commit? | A governance session (far-track or near-track), not the train |
| When can it be reverted? | At any time; reversion is cheap and an architectural rail, not a defeat |
| What's the most dangerous failure mode? | Ghost activation — Phase B behavior without an activation commit |
| How is "are we in Phase B?" verified? | A 60-second check on the integration branch git log + a spot-check of one criterion |
| What does NOT happen during the activation window? | Phase A decomposition packets; Phase B execution work; anything other than the activation commit itself |
| How long can the system safely sit in the window? | One full session |
| What changes immediately post-activation? | Bands shift; forbidden-track items partially unlock; the next session reads the activation commit and proceeds under Phase B doctrine — but does not ship Phase B unlock work yet |

---

*See `MODULE_ISOLATION_EVOLUTION.md` for the threshold-by-threshold ladder of what "isolation" means at each post-activation stage, and `STRICTNESS_GRADIENT_PLAYBOOK.md` for the per-strictness-level prerequisites and reversibility.*
