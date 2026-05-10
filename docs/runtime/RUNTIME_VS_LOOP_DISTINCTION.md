# RUNTIME VS LOOP — THE DISTINCTION THAT MATTERS

> Status: research only. No implementation.
> Companion to `DURABLE_RUNTIME_SUBSTRATE.md`.
> Purpose: name the difference between a *runtime* and an *orchestration loop*, expose
> the illusion zones where the two are easily confused, and enumerate the hidden
> assumptions that make a loop feel like a runtime when it is not.

---

## 1. THE CORE DISTINCTION

A **runtime** is a system whose continued operation does not depend on any single
session, terminal, chat window, or human attention.

A **loop** is a control structure that *currently* keeps doing things until it stops
(or the thing hosting it stops). A loop becomes durable only when the substrate
underneath it satisfies the floor in `DURABLE_RUNTIME_SUBSTRATE.md`.

A useful test: **point at the process.**

- If the answer is "this Claude Code session" or "this terminal" or "this hook firing
  on every Stop event" — it is a loop.
- If the answer is a process supervised by something that will restart it after a crash
  without human action, with state that survives that restart — it is (or could be) a
  runtime.

Loops can be useful. Loops are not durable. Treating one as the other is the failure
mode this document exists to prevent.

---

## 2. WHY ORCHESTRATION LOOPS ARE NOT RUNTIMES

Five structural reasons:

### 2.1 The loop's lifecycle is owned by its host
A Claude Code session ends when the user closes the tab, the network drops, the
context window fills, or the model finishes its turn. None of these are recoverable
from inside the loop, because the loop **is** what dies.

### 2.2 The loop's working memory is non-durable
Plans, intentions, partial results, and decisions live in the model's context window.
The window is volatile, bounded, and not addressable from outside. When it resets, the
plan it contained is gone — including the knowledge that work was in flight.

### 2.3 The loop has no second observer
Nothing watches the loop to decide whether it is alive, stuck, or making progress. The
loop reports on itself. A self-reporting loop that has died reports nothing, which is
indistinguishable from a healthy loop that has nothing to say.

### 2.4 The loop's "queue" is read-and-execute, not lease-and-checkpoint
Most loop-style orchestration reads a list, picks the next item, does it, and crosses
it off. There is no lease, no visibility timeout, no attempt counter, no dead-letter.
Crash mid-item produces a half-done item with no record of what was done.

### 2.5 The loop's external side effects are not idempotent
A loop that retries by re-running from the top will re-send emails, re-write rows,
re-deploy artifacts. Without idempotency keys at the side-effect boundary, "just retry"
is a damage multiplier.

A loop can be lifted into a runtime, but only by adding all five of these properties
externally. Adding none of them and calling the loop "durable orchestration" is the
illusion this document is about.

---

## 3. ILLUSION ZONES

These are patterns that *feel* like a runtime to an operator and are not. Each one is
common, each one is dangerous when scaled.

### 3.1 The "Stop hook keeps it alive" illusion
A hook that fires on every Stop event and re-launches "the next task" feels continuous
because something happens at the end of every turn. It is still a loop: the hook fires
only when *this* session stops, has no visibility into a different host, and cannot
recover if the hook itself fails or the platform restarts. There is no supervisor — the
hook is a *trigger*, not a lifecycle owner.

### 3.2 The "markdown queue" illusion
A file like `PROMPT_QUEUE.md` with checkboxes feels like a queue. It is a *log of
intent*. It has no lease (anyone reading it can act on the same item simultaneously),
no visibility timeout, no attempt counter, no atomic transition, and no audit of who
took what when. It is human-readable, which is valuable; it is not durable substrate.

### 3.3 The "session-handoff document" illusion
A handoff doc summarizing "where we are" feels like continuity. It is a *human aid*.
It is not machine-readable, not unit-keyed, not transactionally written, and depends on
the dying session correctly summarizing its own state — which is exactly the thing a
crashed session cannot do.

### 3.4 The "context window holds the plan" illusion
A long-running session that "remembers" the plan via its own context feels stateful.
The state lives in a place no other process can read. When the window resets or the
session dies, the plan is unrecoverable. State that only one process can read is, by
definition, not durable substrate.

### 3.5 The "git commits as audit log" illusion
A commit log feels like an audit trail. It is an audit of *files*, not of *work
units*. It cannot answer "which orchestration unit was in flight when the crash
happened, and was it side-effected before it died?" because work units have no
identity in the commit graph.

### 3.6 The "agent will pick up where it left off" illusion
A new session starting and reading prior docs to "continue" feels like resumption. It
is *re-derivation* — the new session re-reads and re-decides, which means it can
re-execute completed work, skip in-flight work, or pursue a different plan than the
prior session intended. Resumption requires the prior plan and its progress to be
authoritative, not advisory.

### 3.7 The "multiple skills feel like a system" illusion
A directory of skills feels like an architecture. It is a *capability catalog*.
Capabilities do not become a runtime by being numerous. The runtime question is
"who decides which to invoke, when, with what budget, and what survives if that
decider dies?" — a question the catalog itself does not answer.

---

## 4. HIDDEN ASSUMPTIONS

Loops-presented-as-runtimes carry assumptions that are usually unstated. Each of these
is a place the system fails silently when violated.

1. **The session will keep running.** Violated by every form of session termination.
2. **The operator is watching.** Violated overnight, during travel, or whenever a human
   reasonably stops watching.
3. **Work units are short.** Violated as soon as a unit takes longer than the host's
   timeout or context.
4. **Failures are rare.** Violated by network instability, rate limits, schema drift,
   external API outages.
5. **Side effects are reversible.** Violated by emails, payments, deploys, deletions,
   and most external integrations.
6. **The operator can reconstruct state from logs.** Violated when logs are
   human-prose rather than unit-keyed transition records.
7. **"Try again" is safe.** Violated whenever side effects are not idempotent.
8. **The plan is small enough to fit.** Violated as soon as orchestration spans more
   than a single session's context window.

When the design rests on assumptions 1–8 holding, the system is brittle in proportion
to how many of them must hold simultaneously. A durable substrate is one that does not
require any of them to hold.

---

## 5. DURABILITY REQUIREMENTS (RESTATED FROM THE LOOP'S POV)

For an orchestration loop to be lifted into a runtime, the following must move *out of
the loop's process* into substrate that survives the loop's death:

| Concern               | Currently lives in         | Must move to                                        |
|-----------------------|----------------------------|-----------------------------------------------------|
| Plan / intent graph   | Model context window       | Durable store, typed, versioned, externally readable|
| In-flight work claim  | "What I'm doing right now" | Lease record with TTL in durable store              |
| Progress within a unit| Conversation history       | Checkpoint record keyed by unit ID                  |
| Side-effect dedup     | "I just did that"          | Idempotency key bound to unit + step                |
| Lifecycle             | Session being open         | Supervisor process, externally owned                |
| Health signal         | Implicit (session running) | Explicit heartbeat readable by supervisor           |
| Failure classification| Inferred per-incident      | Declared per error type, with policy                |
| Audit                 | Prose logs                 | Unit-keyed transition log                           |

If any column-1 entry is still in the loop's process at the end of migration, the
substrate is incomplete and the loop is still a loop.

---

## 6. EXTERNALIZED STATE — THE PRACTICAL TEST

A simple, brutal test for whether state is externalized:

> **Stop the loop. Start a different process — different host, different identity, no
> shared memory, no shared filesystem beyond the durable store. Hand it the substrate
> credentials and nothing else. Can it pick up the in-flight plan and continue?**

If yes, state is externalized.
If no, state is in the loop, and the loop is what is keeping the system alive — which
is the definition of "not a runtime."

Most "durable" orchestration systems fail this test in a specific place: the *plan
itself* is not externalized, only the artifacts the plan produced. The replacement
process can see what was done but cannot see what *was meant to be done*.

---

## 7. PROCESS INDEPENDENCE

Process independence means: every component can be killed without killing any other
component, and every component can be replaced without coordinating with the others
beyond what passes through the substrate.

Three independence boundaries that must hold:

1. **Supervisor ↔ worker.** Killing the supervisor does not kill the worker; killing
   the worker is detected by the supervisor.
2. **Worker ↔ work unit.** A failing unit does not kill the worker; a dying worker
   releases its unit's lease.
3. **Operator ↔ runtime.** The operator can stop, drain, or inspect the runtime
   without being inside it. The runtime continues without the operator present.

A loop violates all three: there is no supervisor, the work unit *is* the loop's turn,
and the operator's session *is* the runtime.

---

## 8. RESTART SURVIVABILITY

Restart survivability is a property, not an event. It means:

- A restart, planned or unplanned, produces a correct system state.
- The cost of a restart is bounded — at most one unit of work is replayed per dead
  worker, and that unit's replay is safe by construction.
- A restart leaves a record: who died, when, what was leased, what came back.
- A restart can be triggered intentionally without fear, which means it is *practiced*
  rather than feared.

A system whose operators avoid restarting it because "we don't know what will happen"
does not have restart survivability — it has restart anxiety, which is a leading
indicator of substrate that is not actually durable.

---

## 9. THE MOST MISLEADING "FAKE RUNTIME" SIGNAL CURRENTLY PRESENT

In the AccentOS repo, the strongest illusion-of-runtime signal is the combination of:

- **`PROMPT_QUEUE.md` plus `WORK_IN_PROGRESS.md` plus the Stop hook.**

Together these *feel* like a queue + workspace + scheduler. They are:

- a list, not a queue (no lease, no atomic transition, no attempt counter);
- a single-writer scratchpad, not a checkpointed work record;
- a turn-end trigger, not a supervisor.

The combination is genuinely useful as a human workflow, and that is exactly why it is
the most misleading signal: the operator-facing experience resembles continuous
operation, while the substrate-facing reality is "Claude session is alive, therefore
the system is alive." Any plan to add adaptive routing, unattended queues, or session
resumption on top of these artifacts will inherit the illusion and fail in the first
unattended hour.

(Note: this is a property of the *current shape*, not the documents themselves —
those documents are the right artifacts for the current human-in-the-loop stage.)

---

## 10. SUMMARY

The runtime/loop distinction is not pedantic. It determines whether a crash means
"restart and resume" or "lose the plan and reconstruct from prose." Every illusion
zone in §3 produces the second outcome while feeling like the first. The remedy is
not to add more loops, hooks, or skills, but to externalize the eight items in §5 into
a substrate that satisfies the floor in `DURABLE_RUNTIME_SUBSTRATE.md`. Until then,
"runtime" is a word the project has not yet earned, and that is fine — provided the
plans built on top of it do not assume otherwise.
