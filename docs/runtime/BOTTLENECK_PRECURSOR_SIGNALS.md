# Bottleneck Precursor Signals — AccentOS

> **Predictive systems analysis. Catalogs early warning signals for predicted constraints. Not a monitor, not a watcher.**
> Branch: `claude/orchestration-maturity-analysis-qdJ5W`
> Date: 2026-05-10
> Companions: `CONSTRAINT_RADAR.md` (current readings), `CONSTRAINT_SEQUENCE_MAP.md` (ordered phases), `ORCHESTRATION_BOTTLENECK_MAP.md` (B1..B7), `PHASE_TRANSITION_FAILURES.md` (failure signatures during phase change). Read in that order.

---

## 0. Frame

A *precursor signal* is an observation that arrives *before* a constraint becomes binding. It is the difference between "we are in trouble" (the constraint binds) and "we are heading toward trouble" (the precursor fires). The radar (`CONSTRAINT_RADAR.md` §5) catalogs current signals; this document catalogs *future* signals that have not yet had cause to appear, organized by which predicted constraint they presage.

**What a precursor signal must be.**
- **Observable** without instrumentation that does not exist. If detecting the precursor requires a substrate that has not landed, the signal is theoretical and should be marked as such.
- **Specific** enough that a human reading the doc can recognize it without ambiguity.
- **Earlier than the binding event** by at least one packet's worth of work. A signal that fires the same time as the constraint binds is a symptom, not a precursor.
- **Falsifiable.** A precursor that always fires, or never fires, is not a signal.

**What this document is not.** Not an alerting system. Not a watcher. Not a monitor. There is no continuous process scanning for these signals. Humans (or Claude under explicit packet authority) read this catalog when they read the radar. Between reads, nothing in the system attends to it.

---

## 1. Precursor classes

Each signal in this document is tagged with one of four classes:

- **Theoretical** — predicted but not currently observable; requires substrate that has not landed.
- **Latent** — observable today; no cause to fire yet.
- **Watching** — observable today; close to firing.
- **Active** — fires in the current radar reading.

The radar's §5 covers Active and Watching signals for current constraints. This document focuses on Theoretical and Latent signals for *predicted future* constraints from `CONSTRAINT_SEQUENCE_MAP.md`.

---

## 2. Precursors for the constraint after Phase 1 (substrate seed → register-contract honesty)

### 2.1 — Diverging shape interpretation
- **Class.** Theoretical (substrate seed not yet landed).
- **Signal.** Two consumers of the seed parse the same field's value as different status enums or different semantics. Concretely: one reader treats a freshly-written record as "pending"; another treats it as "in-flight."
- **Why it precedes.** A seed without a contract leaves shape inference to each consumer. The first divergence is small; the second escalates because each subsequent consumer adds a third interpretation, not a tiebreaker.
- **Where to look.** Code or doc that mentions parsing the seed; differences in how the parsing is described.

### 2.2 — "What does this field mean?" question recurrence
- **Class.** Theoretical → Watching after Phase 1.
- **Signal.** A specific field in the seed produces the same clarification question in two separate sessions or two separate doc edits.
- **Why it precedes.** Recurrence of clarification is the cheapest possible measurement of shape ambiguity. If the answer were obvious, it would not be asked twice.
- **Where to look.** SESSION_LOG.md, PROMPT_LOG.md, or commit messages mentioning the same field with phrasing like "I think this means" or "assuming this is."

### 2.3 — Contract-shaped doc appearing without authority
- **Class.** Theoretical.
- **Signal.** A contributor writes a "schema" or "spec" doc for the seed in an attempt to lock down its meaning. The doc exists; the seed's writers do not necessarily agree to it.
- **Why it precedes.** Doc-as-contract is the symptom of needing register() but lacking the mechanism. The doc is the workaround; the workaround is the warning.
- **Where to look.** `docs/runtime/` or sibling directories; new file names containing "schema," "spec," "format" relating to the seed.

---

## 3. Precursors for the constraint after Phase 2 (real substrate → governance OR supervisor readiness)

### 3.1 — Registration record growth without commit growth
- **Class.** Theoretical (Phase 2 not landed).
- **Signal.** The registration record fills with entries claiming completion that do not correspond to landed commits.
- **Why it precedes.** With register() but no enforcement and no observer, lifecycle becomes performative. Sessions register completion because the contract requires it; nothing tests whether the work happened.
- **Where to look.** Comparison of registration record entries against `git log` once both exist; any divergence is the signal.

### 3.2 — Audit-log framing creep
- **Class.** Theoretical.
- **Signal.** The registration record begins being described in docs or commit messages as "an audit log" rather than "lifecycle state."
- **Why it precedes.** Audit-log framing is the language of post-hoc records. If lifecycle state is being treated as audit, the system has already given up on enforcement during the run.
- **Where to look.** Vocabulary in PRs and docs.

### 3.3 — "Should we do governance or supervisor first?" debate emerging
- **Class.** Theoretical → Watching after Phase 2.
- **Signal.** The actual question from `CONSTRAINT_SEQUENCE_MAP.md` §4 begins being asked.
- **Why it precedes.** The debate appearing means the substrate is real enough to consume; the governance/supervisor pressure is now visible. Resolution is required; ambiguity for >1 packet is itself a signal that one of the answers is needed urgently.
- **Where to look.** Conversations, doc proposals, branches.

---

## 4. Precursors for the constraint after Phase 3 (governance → write-scope ambiguity)

### 4.1 — Governance rule arrives that nothing structurally enforces
- **Class.** Watching today.
- **Signal.** A new MUST-NOT in `.claude/CLAUDE.md` or a skill SKILL.md without a corresponding harness mechanism that enforces it.
- **Why it precedes.** If governance is documentary at the moment a transition is supposed to be making it structural, the transition is incomplete. The precursor is the rule that arrives in prose first and is "supposed to" land in config "soon" — soon does not arrive without a forcing function.
- **Where to look.** Diff between any update to `.claude/CLAUDE.md` standing rules and the same update reflected in `.claude/settings.json` permissions/hooks.
- **Today's reading.** The standing halt list (`autonomous-mode/SKILL.md:80–90`) is the canonical example. Governance transition not landed; precursor is in steady state.

### 4.2 — Two skills' SKILL.md describe overlapping write scopes
- **Class.** Latent.
- **Signal.** Two skill specs claim write authority over the same file or directory without a deconfliction note.
- **Why it precedes.** Once governance has transitioned, ambiguity in write scope becomes a real conflict (the harness needs to decide). Pre-transition, the ambiguity is absorbed by Michael's review.
- **Where to look.** Cross-grep `skills/*/SKILL.md` for shared paths in MAY/edit/write language.

### 4.3 — A skill grows to do "and also" work
- **Class.** Latent.
- **Signal.** A SKILL.md update extends the skill's scope to include a concern owned by another skill ("X, and also handles Y").
- **Why it precedes.** Skills accreting cross-cutting concerns is the single-runtime version of the god-module pattern. Governance + isolation are the response; the precursor is the accretion.
- **Where to look.** Diff history of skill SKILL.md files for scope-expansion language.

---

## 5. Precursors for the constraint after Phase 4 (module isolation → cross-module signaling)

### 5.1 — A "coordination" file appears
- **Class.** Theoretical.
- **Signal.** A new file (any name; a frequent shape: `_coordination.md`, `_state.md`, `cross-skill-state.md`) appears with the explanation "I made this because the modules needed to agree on something."
- **Why it precedes.** Once isolation is real, modules can no longer reach into each other's scopes; signaling becomes explicit. The first coordination file is the signal that signaling has begun without a contract.
- **Where to look.** New top-level docs in `skills/` or `docs/runtime/`; any file that *does not* belong to a single skill.

### 5.2 — Adapter-shaped commits
- **Class.** Theoretical.
- **Signal.** Commits whose effect is "make module A's output readable to module B" without changing the work either module is doing.
- **Why it precedes.** Adapters are the connective tissue of cross-module signaling. The first one is plausibly necessary; the third indicates a missing protocol.
- **Where to look.** Commit messages that describe translation, conversion, format-bridging across module boundaries.

### 5.3 — Discussion of a "shared registry" or "common namespace"
- **Class.** Theoretical.
- **Signal.** Conversation or doc proposing a shared place for cross-module facts. Innocent on its first appearance; a smell when it recurs.
- **Why it precedes.** Shared registries solve real problems; they also leak isolation. The proposal predicts the constraint that follows.
- **Where to look.** Doc proposals; PR descriptions.

---

## 6. Precursors for the constraint after Phase 2 (cost-series binding, restated)

### 6.1 — Self-reported budget compliance with growing variance
- **Class.** Theoretical.
- **Signal.** Sessions report "within budget" in their freeze artifacts, but the commit volume per packet for similar scopes shows month-over-month variance growing.
- **Why it precedes.** Self-reports without external measurement track perception, not reality. Variance growth is the symptom of perception drifting from reality.
- **Where to look.** Compare freeze-artifact summaries (in chat history or SESSION_LOG.md) against commit counts on the same packets.

### 6.2 — "Token cap" disappearing from packet templates
- **Class.** Latent.
- **Signal.** Newer packets stop including a token cap, citing "we don't measure it precisely anyway." The omission is honest about the measurement gap; the omission is also the precursor.
- **Why it precedes.** Once the budget claim is acknowledged as fictional, packets either re-anchor on a real measurement (presupposing B3 substrate) or drop the constraint altogether. The drop is the warning.
- **Where to look.** Packet authoring patterns over time.

### 6.3 — Heterogeneous cost claims in commit messages
- **Class.** Theoretical.
- **Signal.** Commit messages or freeze artifacts reporting cost in different units across sessions ("~30k tokens," "about an hour," "2 commits worth"). Heterogeneity = no canonical measurement.
- **Why it precedes.** When a real cost series lands, it imposes a unit. Pre-substrate, the unit drift is the smoke.
- **Where to look.** Commit messages, freeze artifacts.

---

## 7. Cross-cutting precursor patterns

Patterns that recur across multiple predicted constraints. Spotting one of these instances in a new place is itself a meta-precursor.

### 7.1 — The doc-as-contract pattern
A doc appears that *describes* a contract the system does not enforce. Common shapes: schema doc, spec doc, format doc, "shared understanding" doc. The doc exists because enforcement is missing; its existence forecasts the substrate that will replace it.

Examples in this catalog: §2.3, §4.1, §5.3.

### 7.2 — The "soon, separately" pattern
A change lands with a comment / commit message of the form "X is documented here; structural enforcement to follow separately." The "to follow separately" never has a date. The longer the gap, the more decisions accumulate that depend on X being enforced, while X is not.

### 7.3 — The "we don't measure it anyway" pattern
A constraint relaxes because the underlying measurement is absent. The pattern reads as honest (it is) and as progress (it isn't); the constraint should be retained or replaced with a measurable one, not dropped.

### 7.4 — The "and also" pattern
A scope expands inside an existing module/skill/packet/file because adjacent work is convenient. Each expansion is locally rational; cumulative expansion is the precursor to the constraint that follows.

### 7.5 — The "convention says" pattern
An expectation is honored "by convention." The phrase is a load-bearing tell. Convention is the placeholder where governance has not landed; the placeholder erodes.

---

## 8. Anti-precursors (signals that look like precursors but aren't)

Signals that often arrive in the same period as real precursors and are easy to mis-attribute. Calling these out so they do not produce false-alarm fatigue.

### 8.1 — A skill grows in length
Length growth is not a precursor. Skills can grow because they cover more cases; size alone is neutral. The precursor is *scope* growth (§4.3 / §7.4), which is recognizable in the language used, not in line count.

### 8.2 — A new skill is added
Net additions to the skill registry are normal at L1. The precursor is an addition that *crosses* an existing skill's scope, not the addition itself.

### 8.3 — A new doc lands in `docs/runtime/`
This corpus is a doctrine deposit; growth here is the design of the system being thought through. The precursor is a doc that contradicts existing doctrine without explicitly resolving it (which is its own §10 case below), not a doc that adds.

### 8.4 — A long packet runs for hours and exits clean
Long packets are within `SELF_CONTAINED_EXECUTION_WINDOWS.md` doctrine. The precursor is the *emergence* of multi-hour packets without freeze artifacts (a Phase 5/6 illusion claim), not the duration alone.

### 8.5 — Michael takes longer to review
Variation in review latency is normal. The precursor (§9.1 below — Phase 7 review-bottleneck) is *systematic* lag accompanied by accumulating PAUSED items, not a single slow week.

---

## 9. Long-horizon precursors (Phase 5+ era)

Lower-confidence signals for far-future constraints. Listed for completeness; not intended to influence Phase 0–4 decisions.

### 9.1 — Review-bottleneck (B7) approach
- **Signal.** Cumulative open HIGH-risk codex-review items + PAUSED prompt-queue items + un-merged feature branches age past their working-memory horizon (>14 days each, multiple in parallel).
- **Class.** Theoretical until supervisor (Phase 5) lands and produces enough HIGH signals to saturate review.

### 9.2 — Self-healing rule premature emergence (L5 leakage)
- **Signal.** A packet or skill begins describing retries as "recovery" or claims to "handle" a failure class without a documented catalog backing the claim.
- **Class.** Latent today; the doctrine in `SAFE_CONTINUATION_BOUNDARIES.md` §10 already names this. Emergence is the precursor to the L5-skipped-prerequisites trap.

### 9.3 — Swarm-shaped framing of single-runtime work
- **Signal.** A packet, skill, or doc adopts language ("workers," "fan-out," "swarm," "scale") for what is structurally single-runtime work.
- **Class.** Latent. Today's parallel-drain spec uses careful language; precursor is when that care erodes.

---

## 10. Doctrine-contradiction precursor (corpus-level)

The most consequential precursor in this catalog, kept separate because it is meta:

- **Signal.** A new doc lands in `docs/runtime/` that contradicts an existing doc *without explicitly resolving the contradiction*. Contradiction-with-resolution is fine (and how doctrine evolves); contradiction-without-resolution is the most reliable predictor that the system's stated invariants are about to drift from its actual invariants.
- **Why it matters.** The corpus is the only place AccentOS's doctrine lives. If it loses internal consistency, every packet authored against it inherits the inconsistency. The radar can no longer produce honest readings because its foundations have split.
- **Where to look.** Cross-references between docs; any doc that names another doc and proposes an exception, override, or revision without updating the named doc.
- **Class.** Latent. No instances at this date.

---

## 11. The single sentence

A precursor is what one notices before the constraint binds; the catalog earns its place only if the noticing produces a sequencing decision the radar would not otherwise have made.
