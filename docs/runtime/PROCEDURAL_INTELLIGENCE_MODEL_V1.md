# PROCEDURAL_INTELLIGENCE_MODEL_V1
> Conceptual model only. No runtime mutation. No governance change.
> Source: synthesized from BUILD_INTELLIGENCE.md (entries 0.2.B → v6.10.59+),
> MODULE_MODES.md, MASTER.md, vibe-speak v6→v9 evolution, and observed
> orchestration behavior of the AccentOS Claude Code session loop.

---

## 0. Why this document exists

AccentOS is an unusual codebase: a single-operator, multi-session, AI-built
SaaS-replacement that has crossed the "compounding pattern reuse" threshold.
A v6.10.x compact-CRUD module now ships in 3–8 minutes; a pure-compute layer
in ~3 minutes. That speed is not a property of the code — it's a property of
the **procedural intelligence** that has accumulated in:

- `BUILD_INTELLIGENCE.md` (every shipped item → lesson → reusable pattern)
- `MASTER.md` (architecture invariants + locked decisions)
- `MODULE_MODES.md` (rollout state machine)
- `vibe-speak/` (communication + self-calibration loop)
- `WORK_IN_PROGRESS.md` + `PROMPT_LOG.md` (session-state continuity)

This file names the cognitive primitives behind that compounding so they can
be reused, defended, and (carefully) extended.

It does **not** propose new orchestration. It is a map of what already exists.

---

## 1. The six cognition layers

A useful taxonomy of the cognitive work happening per session. Most existing
work lives in layers 1–3. Layers 4–5 are bounded. Layer 6 is Michael-only.

| Layer | Name | Example | Cost shape | Who today |
|---|---|---|---|---|
| 1 | **Mechanical** | str_replace, awk extract, RFC-4180 quoting, ICS folding | flat, low | Claude |
| 2 | **Orchestration** | "after delete-then-insert, run grep audit"; "doc-only commits batched at session end" | medium, amortized | Claude |
| 3 | **Judgment** | "extract on 4th use, not 3rd"; "ship with documented heuristics, recalibrate later" | medium, hard to compress | Claude w/ priors |
| 4 | **Stabilization** | "WIP checkpoint after every step"; "downgrade missing-table log to INFO until SQL runs" | low marginal, high leverage | Claude |
| 5 | **Routing cognition** | "is this a pure-compute layer? a CRUD module? a cross-module spawn?" → pick the right pattern | low, but only after corpus exists | Claude |
| 6 | **Governance** | what ships, what's blocked, what's locked, when to spend money | irreducible | Michael |

Two anti-layers worth naming:

- **Anti-layer A — Premature abstraction.** Building MODULE_REGISTRY before
  the 4th compact-CRUD module is governance work disguised as orchestration.
- **Anti-layer B — Hidden side effects.** First-Owner-load auto-seed of
  `kpi_definitions` (entry 4.2) is a stabilization shortcut; it works exactly
  once and must not be pattern-matched into any other place.

---

## 2. How procedural intelligence compounds

The compounding curve has three measurable inflection points in the AccentOS
corpus:

### 2.1 First-use → pattern (the 1→2 transition)

Cost: highest. The pattern doesn't exist yet. The first vendor_score_states
table took the full session; the first quote line-item editor was the most
complex modal pattern in the codebase.

### 2.2 Pattern → reuse (the 2→3 transition)

Cost: medium. Copy-paste-rename works but the boundary of the pattern isn't
clear yet. Lesson 1.1 vendor_scores: "extending an established Supabase
pattern is fast; defining a new pattern is the expensive part."

### 2.3 Reuse → registry (the 4+ transition)

Cost: collapses. CSV import hit 4 implementations (Inventory → Customer →
Trade Partner → Job) before `csvImportFlow(config)` was extracted (v6.10.45).
Showroom Displays + Warranty then shipped on the helper at ~70 LOC of config
each — down from ~150 LOC of per-module boilerplate. **The 4th use identifies
the API; the 5th proves it.**

This is the canonical AccentOS abstraction rule and it should be respected
across all future helper extractions. Premature abstraction (anti-layer A)
is the most common failure mode at the 2→3 transition.

---

## 3. Pattern reuse primitives (the existing library)

Each entry below is a reusable cognitive unit, not a library function. Most
have a 1-line invocation form Claude internalizes after one or two uses.

### 3.1 Schema → UI primitives

- **Compact-CRUD module shape**: state lets + persistence trio (sbLoadX /
  sbSaveX / sbDeleteX) + render + edit modal + 4 inline-shell touchpoints
  (sidebar, PAGE_META, dispatcher, hydrate). 5–8 min once internalized.
- **Pure-compute layer shape**: derived view over already-loaded tables.
  No schema, no persistence, no migration. ~3 min. Lowest cost-to-value
  ratio in the entire codebase (5.6, 5.7, 5.15, 6.9).
- **Single-table-per-domain with type discriminator**: prefer one table
  with `type` over two tables when fields overlap ≥80% (5.12 marketing).
- **Append-only observation pattern**: snapshot-per-write for any
  metric/observation table (kpi_snapshots, employee_scores, competitor_prices).
  Free time series, same Postgres cost.

### 3.2 Cross-module primitives

- **Preset pattern (1→1)**: `openYEdit(id, preset)` accepts seed object;
  source-module helper lives in destination module so data shape matches.
  (v6.10.42 Deal→Job, v6.10.58 Quote→PO.)
- **Picker modal (1→N)**: when one source spawns multiple destinations,
  let user trigger each spawn intentionally. Don't auto-create N records.
- **Cross-module nav with setTimeout(80)**: `goTo('X');setTimeout(()=>openY(id),80)`.
  Fragile but reliable at current page sizes. Long-term: callback-on-mount.

### 3.3 Persistence primitives

- **on_conflict on real-world unique key**: idempotent saves, no edit-vs-insert
  client-side state. Use whenever a meaningful UNIQUE exists (not the UUID PK).
- **Optimistic UI + targeted DOM patch + revert-on-fail**: for inline edits
  in long lists. Full re-renders are correct but lose user state.
- **Generalized inline-edit cell renderer**: `_xRow(r)` + `cell(val, field, opts)`
  closure + `commitXCell(input)` reads `data-field` and routes through
  allow-listed PATCH. Adding the Nth editable field becomes 1 line.
- **Wide→long expansion in bulkSave**: keep helper's per-row processing
  intact; do 1:N fan-out inside bulkSave. Preview = CSV rows, not DB rows.

### 3.4 Continuity primitives (load-bearing)

- **WIP checkpoint after every discrete step** with "Next step if interrupted"
  field. Cost ~1 min per session, value = full crash recovery.
- **PROMPT_LOG verbatim before any build work**. Replay exact intent without
  guessing from partial diffs.
- **Doc-only batching at session end**. One final commit; never interleave
  with code commits.
- **Resume rule**: status.sh first; if dirty tree, `git diff` before
  deciding next action. Orphan-WIP signature: function-name referenced 1×
  but defined 0×.

### 3.5 Communication / self-calibration primitives

- **Lazy-load contract for skills**: hot/warm/cold paths with prompt-cache
  markers between. Required when total skill footprint > ~10K tokens.
- **Honest matrix-gap analysis**: every N versions, look for dimensions you
  skipped because they'd reveal weakness. If a version scores >95% on its
  own matrix without honest dimension-additions, the matrix is too narrow.
- **History-as-self-improvement**: ingest prompt corpus alongside in-session
  signals. History reveals patterns; live signals validate them.

---

## 4. Execution acceleration loops

Three loops are observable in the AccentOS corpus. Each is bounded —
none of them autonomously expand scope.

### Loop A — Pattern internalization

```
ship pattern v1 (slow)
  → BUILD_INTELLIGENCE entry written same session
    → next time pattern recognized → copy-paste-rename
      → 4th use → registry/helper extracted
        → Nth use → ~70 LOC config
```

Properties:
- Each cycle reduces marginal cost roughly 2–3×.
- Failure mode: extract too early (anti-layer A) → wrong API frozen.
- Defense: the "4th use rule" is explicit and respected.

### Loop B — Heuristic ship → recalibrate

```
ship with documented constants (Deal Optimizer, Demand Forecast)
  → label proxy in UI ("velocity derived from PO lines")
    → real data lands → swap input function, leave UI unchanged
```

Properties:
- Lets the dependency-blocked feature ship today instead of waiting.
- Failure mode: forgetting the proxy is a proxy → user trusts it.
- Defense: name the proxy in the UI. Costs 1 sentence; saves trust.

### Loop C — Self-calibrating skill (vibe-speak)

```
in-session observations accumulate
  → 14d threshold, 3+ signals → vocabulary update proposal
    → applied: yes/no logged
      → backtest historical PROMPT_LOG → faster surfacing of long-tail terms
```

Properties:
- Loop C is the highest-bandwidth self-improvement currently running.
- It is **bounded**: writes only into vibe-speak/* logs and proposed
  vocabulary deltas. It does not modify code, schema, or governance.
- Defense: human-in-loop "applied: yes/no" gate; corpus-as-data not as actor.

---

## 5. Distinguishing mechanical / orchestration / judgment / stabilization / governance / routing

This is the load-bearing distinction in this document. Misclassifying work
is the most common source of unnecessary tokens and future tech debt.

| If the task is… | …it belongs to | Tell by |
|---|---|---|
| "doing this exact step" | **mechanical** | reversible, no priors needed |
| "in what order to do these steps, and which to skip" | **orchestration** | depends on session state |
| "should we do this at all, given tradeoffs" | **judgment** | requires priors from BUILD_INTELLIGENCE or MASTER |
| "what protects us if step N fails" | **stabilization** | concerns recovery, not progress |
| "is this allowed / does this cost money / does this change strategy" | **governance** | only Michael decides |
| "given this task shape, which pattern fits" | **routing** | the answer is "use pattern X" not "build new" |

**Operational rule**: a task should pass through **routing first** (do we
have a pattern?) → **judgment** (is the pattern still right here?) →
**orchestration** (in what order) → **mechanical** (do it) → **stabilization**
(checkpoint). **Governance** sits outside this chain and can interrupt at
any layer with a single line ("don't ship this", "spend up to $X").

When orchestration tries to absorb judgment ("just always extract on use 3"),
the result is premature abstraction. When judgment tries to absorb governance
("seems fine, ship it"), the result is unauthorized scope expansion. Both
failures are visible in the corpus and explicitly defended against.

---

## 6. Safe bounded self-improvement concepts

Self-improvement is allowed iff it satisfies all five constraints:

1. **Append-only** to its own log — never overwrites prior entries.
2. **Human-applied gate** — proposes, doesn't apply, or applies with
   `applied: pending` until reviewed.
3. **Scoped writes** — only into its own dedicated files
   (`vibe-speak/*`, `BUILD_INTELLIGENCE.md`). Never into governance files
   (`module_modes.json`, `MASTER.md` Section 12, schema, RLS).
4. **Reversible** — every change is git-history-recoverable in <30s.
5. **No autonomous expansion** — the loop cannot enlarge its own scope
   without a human governance edit.

Loop C (vibe-speak) currently meets all five. Any future loop that does
not meet all five must be classified as **governance** and routed to
Michael, not absorbed into orchestration.

The "self-improvement" word is dangerous because it implies the system can
make itself better autonomously. In this codebase it strictly means:
**propose better defaults, log proposals, wait for application gate.**

---

## 7. Open conceptual gaps (not action items)

These are recognized blind spots in the procedural model. Recording them
makes the model honest; resolving them is future work, not current work.

- **No telemetry signal catalog yet.** What signals would distinguish
  "session is healthy" from "session is degrading" in a measurable way?
  Currently inferred from retry-loops, redundant-reads, clarification-loops.
- **No bottleneck visibility spec yet.** The bottleneck is named as
  "data model design + UX scoping" but not instrumented.
- **No relay handoff template formalized.** Each Michael→Claude handoff
  reinvents context. WIP + PROMPT_LOG handle the common case; the rare
  cases (multi-session deep refactor, schema bundling, mobile handoff)
  do not.
- **No execution pattern catalog as a separate file.** This document
  references patterns; the patterns themselves live distributed in
  BUILD_INTELLIGENCE entries.

These gaps are explicitly **out of scope for this artifact**. Naming them
prevents premature implementation.

---

## 8. The procedural intelligence invariants

Five claims that must remain true for the system to keep compounding.
If any one breaks, compounding stalls.

1. **BUILD_INTELLIGENCE.md is append-only and read at session start.**
2. **Patterns are extracted on the 4th use, not the 3rd.**
3. **WIP checkpointing is over-frequent, not under-frequent.**
4. **Doc updates are batched at session end, never interleaved with code.**
5. **Governance edits are Michael-only and routed explicitly.**

If a future change proposes to soften any of these, the change is
governance, not orchestration, and routes to Michael.

---

*End of PROCEDURAL_INTELLIGENCE_MODEL_V1.md — conceptual model, no runtime effect.*
