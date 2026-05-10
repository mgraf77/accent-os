# BOUNDED_AUTONOMY_LAYERS
> Conceptual model only. No runtime mutation. No implementation.
> Defines the autonomy layers a single-operator AI-built system can
> safely operate at, why AccentOS today operates at Layers 0–2 with
> bounded use of Layer 3, and why Layers 4–5 are explicitly forbidden
> under current conditions.

---

## 0. Definitions

**Autonomy layer** = the size of the decision the system makes on its
own between two human governance touchpoints (start of session,
mid-session approvals, end-of-session review).

**Governance touchpoint** = any moment Michael (a) approves a path,
(b) rejects a path, (c) edits a locked file, or (d) authorizes a spend.

**Blast radius** = the scope of effect if the layer's decision is wrong.
Layers are not ranked by "intelligence" — they are ranked by blast radius.

---

## 1. The five layers

| Layer | Name | Decision unit | Blast radius | Reversibility | Today |
|---|---|---|---|---|---|
| **L0** | Manual | Single keystroke / single command | Trivial | Instant | Always available |
| **L1** | Assisted | Single edit / single commit | Small | Git-history fast | **Default** |
| **L2** | Bounded unattended | A coherent task block (1 module, 1 SQL bundle) | Medium | Git-history + maybe SQL re-run | **Allowed within rules** |
| **L3** | Supervised delegation | Multi-task plan over a session | Large | Hours to recover | **Bounded use only** |
| **L4** | Adaptive orchestration | Cross-session strategy + self-modifying loops | Very large | Days, possibly unrecoverable | **Forbidden** |
| **L5** | Open autonomy | Strategy + spend + governance | Whole-business | Possibly catastrophic | **Reserved for Michael** |

L5 is named for completeness; it is not a layer the AI operates at
under any condition in this codebase.

---

## 2. Layer 0 — Manual

**Description.** Every action originates from an explicit human keystroke.
The AI is a tool, not an agent.

**Where it lives in AccentOS today.** Michael running SQL in the Supabase
SQL Editor is L0. Michael clicking deploy buttons in BigCommerce admin
(via Chrome MCP visual click) is L0. Any change to `module_modes.json`
that flips a module to `live` is L0 in spirit (Michael's call) even if
Claude writes the file.

**Why it persists.** L0 is the last-resort recovery layer. When higher
layers fail, L0 always works. It is also the only layer that handles
**governance** (§5 of PROCEDURAL_INTELLIGENCE_MODEL_V1).

---

## 3. Layer 1 — Assisted

**Description.** AI proposes; human applies (or AI applies one small
change at a time with implicit consent). Each step is a single edit
or a single commit.

**Where it lives in AccentOS today.** This is the **default operating
mode** for most human-Claude interactions. Examples:

- str_replace patches against freshly-fetched HTML
- Single Edit tool calls
- One commit per logical change
- "Here is the SQL — paste it" (Claude generates, Michael executes)

**Why this is the default.** The blast radius is bounded by the size of
one edit. Reversal is one git revert. The tradeoff is high overhead per
unit of progress, which is acceptable when the cost of error is low.

---

## 4. Layer 2 — Bounded unattended

**Description.** AI executes a coherent task block to completion without
intermediate approval, within explicit scope rules. The block has a
**well-defined start and end** and a **bounded set of files it can touch**.

**Where it lives in AccentOS today.**

- Compact-CRUD module ship (state lets + persistence trio + render +
  modal + 4 inline-shell touchpoints) → 5–8 min, single commit.
- Pure-compute layer (Deal Optimizer, Decision Engine) → ~3 min,
  single commit.
- Multi-module SQL bundle (M21, M24): bundling unrelated tables that
  ship together to save a Michael handoff.
- CSV import flow extraction once `csvImportFlow(config)` exists →
  ~70 LOC of config per new entity.
- WIP/PROMPT_LOG/SESSION_LOG continuity protocol (governed by
  OPERATING RULES in CLAUDE.md).

**The bounding rules** (from CLAUDE.md, MASTER.md §12, BUILD_INTELLIGENCE):

1. Surgical str_replace patches only — never rewrite from scratch.
2. Module isolation — edits to one module never touch another.
3. Auto-commit after every session, never push to non-designated branch.
4. Schema changes route to Michael (Supabase MCP returns auth errors;
   Claude provides SQL, Michael pastes).
5. No Rep Score visibility on Rep View tab.
6. Zero added cost without Michael approval.

These rules are what make L2 safe. They are not optional optimizations —
they are the bounding box.

**Failure mode.** L2 becomes unsafe when the task block silently expands
("while I'm here, I'll also fix…"). The mitigation is the
"Don't add features beyond what the task requires" rule from system
prompt + the BUILD_INTELLIGENCE entry pattern (each lesson is one
lesson, not a refactor pass).

---

## 5. Layer 3 — Supervised delegation

**Description.** AI executes a multi-task plan over a session, with a
single human checkpoint at the start (intent) and end (review).
Mid-session, the AI makes routing decisions ("which item next?") within
an explicitly authorized plan.

**Where it lives in AccentOS today.**

- A session that ships 6 compact-CRUD modules in one go (entry 35:
  "6 modules in one session"). Michael approved the session shape;
  Claude sequenced the modules.
- Track 5 ship-out (16 items shipped under a single plan).
- The "do not wait for Michael input — start building" provision
  in CLAUDE.md AUTO-EXECUTE step 7.

**Why bounded.** L3 works in AccentOS only because:

- BUILD_PLAN_CLAUDE.md is the explicit plan. The AI does not invent
  the plan; it executes it.
- BUILD_INTELLIGENCE.md is the prior. The AI does not relearn each
  session; it inherits.
- WIP + PROMPT_LOG + SESSION_LOG provide rollback and continuity.
- Module isolation contains the blast radius even when many items
  ship in one session.
- Supabase MCP is broken (auth errors), which **incidentally enforces**
  human approval on every schema change. This is a stabilizing
  constraint, not a bug.

**The delegation envelope.** L3 is allowed to:

- Sequence within BUILD_PLAN_CLAUDE.md
- Choose patterns from the existing library
- Bundle multi-module migrations into one M-task
- Decide whether a feature ships with documented heuristics or waits
  for real data
- Auto-disengage to vibe mode when needed (per CLAUDE.md auto-disengage
  rules)

L3 is **not** allowed to:

- Add items to BUILD_PLAN_CLAUDE.md without Michael's explicit ask
- Modify governance files (`module_modes.json` mode transitions to/from
  `live`, MASTER.md §12 hard rules, RLS policies)
- Spawn subagents without authorization (per
  SESSION_RESOURCE_PRESSURE_MODEL §5)
- Push to a branch other than the designated one
- Run irreversible destructive commands (force-push, reset --hard,
  drop table) without Michael's explicit ask

---

## 6. Layer 4 — Adaptive orchestration (FORBIDDEN)

**Description.** AI maintains state across sessions, modifies its own
operating loops, schedules its own work, and routes between
sub-orchestrators (other AI agents) without per-session human approval
of the plan itself.

**Why this is forbidden today.**

### 6.1 The blast-radius asymmetry

A wrong L2 decision costs minutes (revert one commit). A wrong L3
decision costs a session (revert several commits, fix WIP). A wrong L4
decision costs **everything downstream of when it started** because the
self-modification means the system that made the decision is no longer
the system that exists. Recovery requires reasoning backwards through a
moving target.

### 6.2 The self-modification problem

L4 systems modify their own routing/decision logic. In this codebase,
that logic lives in:

- BUILD_INTELLIGENCE.md (lessons that change future behavior)
- vibe-speak/* (mode + voice rules)
- module_modes.json (rollout state)
- CLAUDE.md (auto-execute steps)

Allowing the AI to write any of these autonomously creates a feedback
loop where bad lessons propagate as priors. The current architecture
deliberately prevents this: vibe-speak proposes vocabulary updates with
`applied: pending`, and BUILD_INTELLIGENCE entries are written in the
session that learned them, **not retrospectively across sessions**.

### 6.3 The governance-absorption problem

L4 implies the AI decides "what to build next" at a strategy level.
That is governance (§5 of PROCEDURAL_INTELLIGENCE_MODEL_V1). Governance
in AccentOS is reserved for Michael by design — not because Claude
can't reason about strategy, but because business decisions affect
agency relationships, vendor relationships, customer trust, and cost.
None of those are recoverable from a wrong AI call.

### 6.4 The single-operator amplification problem

In a multi-engineer team, a wrong L4 call by an AI is one of N
parallel signals; humans cross-check. In a single-operator system, a
wrong L4 call has **no cross-check** until Michael notices, which may
be hours or days later. The current explicit human-in-loop touchpoints
(PROMPT_LOG, WIP, SESSION_LOG, BUILD_PLAN check-offs) are the
cross-check.

### 6.5 What L4 would look like if it were ever permitted

Recorded here only to make the boundary explicit, not as a roadmap:

- A session-launching scheduler that decides when to start sessions
- An orchestration agent that picks BUILD_PLAN items based on
  dependency graph + business value (currently Michael's call)
- A self-tuning skill that modifies its own SKILL.md based on usage
  metrics
- A cross-session memory that survives independent of git
- A multi-agent swarm that splits work across parallel Claude instances

**These are explicitly the dangerous future temptation zones** named in
this artifact. Each is recorded so future contributors recognize the
shape and route the decision to Michael.

---

## 7. Layer 5 — Open autonomy (NEVER)

**Description.** Strategy + spend + governance, autonomously.

**Why this is reserved for Michael, not bounded but never.**

- Strategy affects vendor relationships (475+ vendors), customer trust,
  and the website-presence-to-business-presence relationship.
- Spend affects business runway and integrations the team relies on.
- Governance affects what the AI is allowed to do — i.e. it can
  rewrite the rules under which it operates.

A system that can modify the rules under which it operates is not
bounded by those rules. There is no engineering mitigation for this
beyond "don't allow it." L5 is named in this taxonomy only so it is
not silently approached by incremental L4 expansions.

---

## 8. Why AccentOS sits at "L1 default, L2 normal, L3 bounded"

This is the optimal layer for the current shape:

- **Single operator** — Michael is the only governance node. L3+ would
  exceed the cross-check capacity.
- **Compounding pattern library** — BUILD_INTELLIGENCE accumulation
  makes L2 cheap and L3 safe within an existing plan.
- **High git granularity** — every commit is a recovery point.
  Reversibility is fast.
- **Zero-spend constraint** — most decisions don't cross the
  governance line because no money moves.
- **Module isolation** — failures are contained even when L3 ships
  many items per session.
- **Append-only logs** — history is recoverable; nothing rewrites
  the priors.

The system is **not under-utilized** at L1–L3. The compounding loop
(PROCEDURAL_INTELLIGENCE_MODEL_V1 §2) already produces 2–3× efficiency
gains per pattern cycle. Pushing to L4 would risk that compounding by
introducing self-modification.

---

## 9. Prerequisites before adaptive orchestration is safe

If — and only if — these prerequisites are all met, a future bounded
L4 step might be considered. None are met today.

1. **Telemetry signal catalog.** A measurable definition of "session
   healthy" / "session degrading" / "loop stuck." Currently inferred,
   not measured.
2. **Bottleneck visibility spec.** Instrumented identification of where
   time/tokens are actually going. Currently anecdotal in
   BUILD_INTELLIGENCE entries.
3. **Multi-operator governance.** At least one cross-check beyond
   Michael for L4 decisions. Currently single-operator.
4. **Reversible self-modification.** Any AI-proposed change to
   BUILD_INTELLIGENCE / vibe-speak / CLAUDE.md must be a PR that
   another agent reviews before merge. Currently direct edit.
5. **Explicit budget per autonomy layer.** A token / time / decision
   budget that the AI cannot exceed without escalation. Currently
   implicit.
6. **Audit trail beyond git.** A reasoning log for why each L3+
   decision was made. Currently only the diff, no rationale.
7. **Sandbox for new loops.** New self-improvement loops run in
   shadow mode (proposes, never applies) for N sessions before
   any application gate is granted. Currently vibe-speak meets this;
   no other loop does.

The order matters: 1 and 2 are necessary for any of 3–7 to be
checkable. 3 is the highest-cost prerequisite and the most likely to
remain unmet for the foreseeable future.

---

## 10. The autonomy invariants

Four claims that must remain true.

1. **Higher autonomy layers are forbidden by default and unlocked
   per-session, never permanently.** Each session begins at L1 default
   even if the prior session operated at L3 within plan.
2. **Governance never moves down a layer.** Schema changes, mode
   transitions to `live`, spend, and strategy are L0/L5 (Michael) and
   never get absorbed into L2/L3 even if convenient.
3. **Self-modification requires human application gate.** No loop
   modifies its own rules or its parent system's rules without
   `applied: pending` review.
4. **The bounding rules are the safety property, not the AI's
   judgment.** If a bounding rule and Claude's judgment disagree, the
   bounding rule wins. Always.

---

*End of BOUNDED_AUTONOMY_LAYERS.md — conceptual model, no runtime effect.*
