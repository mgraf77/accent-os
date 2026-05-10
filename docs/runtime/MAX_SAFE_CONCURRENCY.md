# MAX SAFE CONCURRENCY — ACTUAL

> **Audit role.** Reality auditor + execution economist.
> **Question.** What is the safe concurrent-session count *right now*, with real infrastructure and real operator?
> **Frame.** Numbers, not theory. The prior corpus's "N=2–3 ceiling" was a *projection* against assumed risks; this document audits the *real* current ceiling.

---

## 1. Current actual safe train count

**N = 1.**

This is not a soft recommendation. It is the observed and infrastructurally-supported count.

---

## 2. Why N = 1

Direct reasons, in order:

1. **No second session is currently running.** The observed count today is 1. Anything higher is hypothetical.
2. **No infrastructure exists to coordinate N>1.**
   - Single shared `WORK_IN_PROGRESS.md` (per-session WIP is conceptual).
   - No daemon, orchestrator, or coordinator (per `EXECUTION_TRUTH_TABLE.md`).
   - No automated branch-entropy estimator, no automated freeze validation.
   - No paired-down migrations (so any schema mistake at N>1 has expensive recovery).
3. **No observed evidence that N>1 is safe.** Every N>1 claim in the prior corpus is theoretical. There is no record of two sessions running concurrently and producing clean ship.
4. **Captain is one human.** No second Captain. Per `OPERATOR_BANDWIDTH_LIMITS.md` §1.2 — the 1-wide queue is real, but in current operation it isn't a queue, it's just Captain doing all decisions sequentially.
5. **No work in the current queue requires N>1.** Both pending actions (Worker redeploy, branch merge) are sequential Captain actions. The next track-buildable work (when an M-task clears) is a single feature build well-suited to one session.

---

## 3. Exact bottleneck preventing higher count

Not what the corpus predicted. The corpus argued the bottleneck would be:

- **Operator supervision tax** (Captain saturation at parallel review).
- **Branch entropy** (multiple branches collide on `index.html`).
- **Frozen-file tax** (concurrent edits to monolithic file).

Those are projected bottlenecks at hypothetical scale.

The *actual* bottleneck preventing safely raising N from 1 to 2 today is much simpler:

> **There is no validated single-session baseline against which a second session's overhead could be measured.**

In other words: we don't know what one session at peak performance produces (in tokens, in shipped commits per hour, in Captain time consumed), so we cannot tell whether adding a second session is +cost or +value. The corpus *modeled* this; it did not *measure* it.

Subordinate to this primary bottleneck, the secondary real bottlenecks are:

- **No per-session WIP convention.** Two sessions today would clobber `WORK_IN_PROGRESS.md`.
- **`index.html` is still monolithic at ~651KB.** Two sessions both touching it would produce real frozen-file tax — but the *cost* would only emerge if both actually attempted concurrent edits, not because they hypothetically could.
- **No deploy verification.** A bad ship from either session would not be caught by automation; Captain catches everything by manual check.

---

## 4. What would safely raise N from 1 to 2

The corpus's answer was: "Phase 1 (decomposition + isolation + loader boundaries) plus per-session WIP plus paired-down migrations."

That is the right answer for *sustained* N=2, but it's an expensive answer. The cheaper answer to actually unlock N=2 *as an evaluated capability* is:

### The single operational improvement: **one supervised N=2 test window.**

Specifically:

- One Captain-supervised, time-boxed window (~2 hours).
- Two simultaneous sessions, each on a **disjoint `js/<feature>.js` module file**, no `index.html` edits, no migrations.
- A pre-declared WIP convention for the duration of the window (e.g., session A writes `WIP-A.md`, session B writes `WIP-B.md` — single-window-only).
- A simple ship metric: did both sessions land clean commits? Did Captain experience review-quality degradation?

Cost of the test: ~2 hours Captain attention, one window.
Information gained: a real measurement that either:
- Confirms N=2 is safely operable for module-isolated work today (small architectural unblock).
- Or surfaces real friction (which is information; the cheap discovery beats the expensive theorizing).

This is the *cheapest* path to a validated +1 in concurrency. It does not require Phase 1; it requires deliberate testing of a narrow case.

---

## 5. Comparison: cheap +1 vs. expensive +1

| Path | Cost | Outcome |
|---|---|---|
| **Cheap +1** (supervised test window) | ~2 Captain-hours, one window | Validates whether N=2 module-isolated work is safe *today*. Result is binary information, recoverable from either way. |
| **Expensive +1** (Phase 1: decomposition + isolation + per-session WIP + paired downs) | Multi-week effort + Captain attention | Makes N=2 (and eventually N=3) safely sustainable across all work classes, including `index.html`-touching work. Lasting capability. |

These are not alternatives — the cheap path can run *before* the expensive path and inform whether the expensive path is urgent. If the cheap test shows N=2 module-isolated is already fine, the expensive Phase 1 work can be timed around feature pressure rather than rushed.

---

## 6. The honest answer to the user's question

> "What SINGLE operational improvement would increase safe concurrency by +1?"

**Run one supervised N=2 test window on disjoint module files.**

That is the single improvement. Not Phase 1 (too expensive for a +1 measurement). Not per-session WIP infrastructure (premature; the window can use ad-hoc per-window WIP). Not new tooling.

The improvement is **a measurement**, not a build. The current ceiling is N=1 because nothing has tested N=2 in real conditions. Testing it is the cheapest way to learn whether the ceiling is real or merely unverified.

---

## 7. Should the operator actually pursue +1?

A separate question, worth naming:

**N=1 may be the right ceiling for the foreseeable future.** Reasons:

- All 10 unfinished BUILD_PLAN tracks are blocked. The pace-limiting factor is Captain M-task delivery and Phase 1 architecture, not Claude throughput.
- The work that has shipped recently (Internal Meetings v1.0, Quote Generator v2, Marketing Hub, Demand Forecast, etc.) shipped fine at N=1.
- Captain's attention is the binding constraint, and Captain operates one supervision channel at a time.
- The cost of *needing* N=2 (more Captain time per parallel ship) may exceed the benefit.

The cheap +1 test exists to *answer the question*, not to assume the answer. The honest answer might be: N=1 is and remains correct; the test confirms it; energy goes to Phase 1 and M-tasks instead.

---

## 8. DONE / KNOWN / NEXT

**DONE**
- Stated the current actual safe train count: **N = 1.**
- Identified the real bottleneck preventing +1: the absence of a validated single-session baseline against which a second session's overhead could be measured. Subordinate bottlenecks: no per-session WIP, monolithic `index.html`, no deploy verification.
- Identified the single cheapest operational improvement to unlock +1: **one supervised N=2 test window on disjoint module files** (~2 Captain-hours, one window).
- Distinguished the cheap +1 (measurement) from the expensive +1 (Phase 1 architecture).
- Surfaced the meta-question: whether the operator should pursue +1 at all, given that N=1 has been shipping fine.

**KNOWN**
- N=1 has not been formally measured either. The shipping evidence is the only baseline.
- A test window's results would inform but not commit. Captain can decide afterward.

**NEXT**
- `ACTION_LEDGER.md` does not currently propose the N=2 test as an immediate action — it's a strategic question, not a 24h move. The immediate action queue is Worker redeploy + branch merge + WIP cleanup.
