# Pattern Routing Intelligence
**Type:** Observational / theoretical — no runtime, no automation
**Purpose:** Formalize the classification model that will inform future agent routing
**Updated:** 2026-05-10
**Companion to:** EXECUTION_PATTERN_CATALOG.md

---

## Section 1 — The Foundational Distinction: Discovery vs Execution

The V2 catalog's 5-dimension model mixed two orthogonally different costs under
"decision density" and "context surface." This conflation produced misleading
readiness scores. The correction:

**Input Discovery Difficulty (IDD)** — how hard is it to determine WHAT to do?
**Execution Difficulty (EXD)** — how hard is it to DO what was determined?

These are independent axes. A workflow's routing needs are determined by
the combination, not by either alone.

### The IDD × EXD Matrix

```
                │  EXD = Low          │  EXD = High
────────────────┼─────────────────────┼──────────────────────
IDD = Low       │  Zone 1: Full M     │  Zone 3: Exec-J
                │  Delegate to Codex  │  Claude executes
                │                     │  (rare in this domain)
────────────────┼─────────────────────┼──────────────────────
IDD = High      │  Zone 2: Discovery-O│  Zone 4: Full-J
                │  Claude discovers,  │  Claude owns entirely
                │  Codex executes     │
```

**Zone 1 (IDD=Low, EXD=Low):** Pure mechanical. Codex-suitable end-to-end.
Inputs are provided by prior context, execution is deterministic, verification
is automated. This is the only zone where unsupervised Codex delegation is safe.

> AccentOS examples: PAT-02 Queue Close, PAT-07 HTML sed pass

**Zone 2 (IDD=High, EXD=Low):** The most common misclassified zone. These look
orchestration-heavy but the execution is trivial once discovery is complete.
Claude does discovery and provides structured inputs. Codex executes.
The handoff point (discovery → execution) is where supervision is required.

> AccentOS examples: PAT-03 Auth Diff Preview (discovery = finding insertion points),
> PAT-06 Stabilization grep pass (discovery = knowing which grep patterns to run)

**Zone 3 (IDD=Low, EXD=High):** Rare. Inputs are known, but execution itself
contains judgment. In practice, this usually means execution CONTAINS discovery
(you learn what to do by doing it). Poorly-specified trigger condition.
Decompose into discovery sub-step before categorizing.

> AccentOS examples: Commit message writing (inputs: "what changed"; execution: judgment
> about what matters, what the "why" is, what future-reader needs)

**Zone 4 (IDD=High, EXD=High):** Full Claude ownership. Neither phase is delegatable.
Discovery requires domain knowledge, execution requires classification judgment.

> AccentOS examples: PAT-04 Integration Risk synthesis, phase architecture decisions

---

## Section 2 — IDD as the 6th Dimension

The existing 5 dimensions (Decision density, Context surface, Output determinism,
Verification type, Blast radius) describe the execution phase. None adequately
captures discovery cost. Adding IDD as a standalone 6th dimension:

| Dimension | What it measures | Governs |
|-----------|-----------------|---------|
| Input Discovery Difficulty | How hard is it to determine WHAT to do? | Supervision at handoff point |
| Decision density | Judgment calls per execution step | Claude vs Codex ownership |
| Context surface | Prior state required to execute | Orchestration overhead |
| Output determinism | Same input → same output? | Automation reliability |
| Verification type | Automated vs semantic correctness check | Supervision at exit |
| Blast radius | Worst-case damage if wrong | Authorization requirement |

### IDD Scale (0–3)

| Level | Description | AccentOS examples |
|-------|-------------|-------------------|
| 0 | Inputs externally provided before pattern starts | PAT-02 (item-id given by session) |
| 1 | Inputs derivable from a single file read | PAT-07 (scope = ui/, source/target given) |
| 2 | Inputs require reading and comparing multiple files | PAT-05 (must cross-check index + queue files) |
| 3 | Inputs require domain synthesis across sessions | PAT-04 severity (need architecture + risk history) |

IDD=0 or 1 → Codex-suitable setup phase
IDD=2 → Supervised Codex with Claude-provided structured inputs
IDD=3 → Claude-only discovery, Codex may execute

---

## Section 3 — Four Workflow Categories That Reveal Hidden Routing Complexity

### Category A: Execution trivial, discovery orchestration-heavy

These are the most dangerous for premature Codex delegation. The workflow looks
short (few execution steps) but the setup phase is expensive and failure-prone.

**PAT-03 Authorization Diff Preview:**
- Discovery: read 7,000-line index.html, understand script load ordering,
  identify 4 non-adjacent insertion points, verify no conflicts with existing
  structure, cross-reference rollout doc for authorized scope
- Execution: 4 targeted file edits, 6 lines total
- Ratio: discovery cost ~20× execution cost
- Failure mode: wrong insertion point → silent semantic error that passes
  structural verification (the file is valid HTML, smoke passes, but load order
  is wrong or shell div is in wrong position)
- Routing implication: DO NOT delegate discovery. DO delegate execution once
  Claude provides explicit insertion-point coordinates (file, line, exact context string)

**PAT-06 Stabilization grep pass:**
- Discovery: know which grep commands to run across which files in which order
- Execution: run grep, format output
- The grep commands themselves encode domain knowledge about what collision
  vectors exist (CSS selectors, z-index, event listeners, localStorage keys)
- Routing implication: the grep command set IS the intelligence. Codex running
  arbitrary greps produces noise. Claude specifying exact commands → Codex executes → valid.

**PAT-05 Gate Status Check (drift detection):**
- Discovery: _index.md may be stale. True state requires reading individual queue files.
- Execution: format the report
- Hidden orchestration: "is this item actually READY or has its blocker been resolved?"
  requires reading the item's `depends_on` field and checking whether those items are
  complete — which requires reading MORE queue files recursively.
- Routing implication: a Codex-generated gate report that only reads _index.md will
  miss drift. Claude must specify "verify against individual files, not just index."

---

### Category B: Execution contains hidden judgment

These appear mechanical (low decision density at the step level) but the steps
themselves require judgment that is invisible until a mistake is made.

**Commit message writing:**
- The "inputs" (what changed) seem fully known at trigger time
- But execution requires: selecting which changes to surface, determining the "why"
  vs the "what," writing imperative mood correctly, including session URL
- The output is non-deterministic even with identical inputs
- Classification error: calling this "mechanical" because git add and git commit
  are commands. The judgment is inside the string argument.
- Routing implication: Claude owns message content unconditionally. Any system
  that generates commit messages must be reviewed — automated messages accumulate
  entropy in the git history (loss of "why" information over time).

**Queue item "WHEN" decision:**
- The execution of PAT-02 is mechanical (IDD=0, EXD=0)
- But deciding WHEN to trigger PAT-02 requires session context:
  "Is the work actually complete? Did the verification pass? Was there a scope
  exception that should be noted before closing?"
- The trigger condition IS the judgment. The execution is trivial.
- Routing implication: Codex cannot own the close trigger. It can be told
  "close item X with timestamp Y" and execute perfectly. It cannot determine
  that X should be closed.

**Data-attribute JS accessor update (PAT-07):**
- Rule seems mechanical: `data-foo-bar` → `dataset.fooBar`
- But: `data-aos-roles` → `dataset.aosRoles` requires knowing that `aos` is one
  token (a prefix) not two tokens (`a` + `os`). The camelCase rule is:
  split on `-`, drop first token (`data`), capitalize subsequent tokens.
  `data-aos-roles` → `['data','aos','roles']` → drop 'data' → `'aos' + 'Roles'` → `aosRoles`
- The rule is deterministic IF you apply it correctly. But the split boundary
  requires understanding that `aos` is a prefix compound, not verifiable by
  mechanical inspection of the attribute name alone.
- Routing implication: verify JS accessor output before committing. Not just
  "old pattern gone" but "new pattern is `aosRoles` not `aOsRoles`."

---

### Category C: Appear mechanical but contain semantic verification traps

These pass automated verification but automated verification does not confirm
semantic correctness. The trap: you believe you've verified something you haven't.

**The Structural Pass / Semantic Fail pattern:**

```
Automated check:     grep finds zero old-pattern occurrences → PASS
What it confirmed:   old pattern is gone
What it did NOT confirm: new pattern is correct
Failure mode:        new pattern is `dataset.aosroles` (wrong case) — JS silently gets undefined
Detection:           runtime error, NOT detectable by grep verification
```

**The Local Consistency / Global Inconsistency pattern:**

```
Automated check:     _index.md totals add up correctly → PASS
What it confirmed:   internal arithmetic of _index.md is consistent
What it did NOT confirm: _index.md reflects truth of individual queue files
Failure mode:        item shows READY in index but queue file still says `blocked`
Detection:           cross-check required (read individual files), NOT automated
```

**The Coverage Gap pattern:**

```
Automated check:     boot-smoke.sh passes 27/27 → PASS
What it confirmed:   27 specified checks pass (file existence, git state, etc.)
What it did NOT confirm: correctness of CSS changes, JS behavior, DOM structure
Failure mode:        unscoped CSS selector added, smoke passes, Phase B regression
Detection:           only detected in actual browser rendering or integration test
```

**Routing implication for all three:**
Automated verification passing is necessary but not sufficient. The routing system
must know WHICH automated checks cover WHICH semantic properties. Checks without
semantic coverage require a human review step that cannot be skipped.

**Coverage map for AccentOS verification tools:**

| Tool | Covers | Does NOT cover |
|------|--------|----------------|
| boot-smoke.sh | File existence, git state | CSS correctness, JS behavior, DOM structure |
| grep zero-match | Pattern absence | Replacement correctness |
| Totals arithmetic | Internal consistency | Truth (requires cross-check with source files) |
| git diff review | What changed | Whether change is correct |
| Browser rendering (manual) | Visual correctness | JS behavior, async errors |

---

### Category D: Rollback complexity exceeds execution complexity

These look safe (execution is fast, targeted) but recovery from failure is
disproportionately expensive.

**_index.md drift correction:**
- Execution: edit two integers
- Rollback: NO WRONG STATE TO REVERT TO. The "correct" totals require
  re-deriving truth by reading N individual queue files and counting states.
  `git revert` restores the old wrong totals.
- Rollback complexity: O(N queue files) even though execution was O(1)
- Pattern: any hand-maintained summary document has this property. The summary
  can drift from truth and git history only recovers previous wrong states.
- Routing implication: hand-maintained summaries should be regenerated from source
  rather than edited directly. Any edit to _index.md totals should be preceded
  by a fresh count from individual files.

**Authorization diff preview (wrong insertion point):**
- Execution: 4 targeted edits to index.html, 30 seconds
- Rollback: `git revert HEAD` — trivial
- BUT: if wrong insertion point causes a subtle behavior error (shell JS before
  module_modes.js, breaking Cmd+K ownership), rollback requires:
  1. Detecting the error (may take days of observation)
  2. Identifying which of the 4 edits caused it
  3. Determining whether revert is safe or whether other commits depend on it
- Rollback complexity compounds with time after deployment
- Pattern: time-dependent blast radius. Rollback cost increases non-linearly
  with time elapsed since the error was introduced.
- Routing implication: time-sensitive rollback windows require authorization at
  execution, not at discovery. "We can revert this" becomes less true over time.

**Queue item "wrong item closed":**
- Execution: 2 file edits
- Rollback: 2 reverse edits — trivial
- BUT: if the wrong item is closed AND subsequent work is authorized based on
  that item's closure (e.g., "item X complete → Phase B authorized"), the
  semantic rollback requires unwinding the authorization decision too.
- The file rollback is O(1). The authorization rollback is O(decision chain).
- Pattern: semantic rollback is more expensive than file rollback when the
  output is used as input to a downstream decision.

---

## Section 4 — Dimension Predictiveness Matrix

Which dimensions are most predictive of each routing outcome?

```
                        IDD  Dec  Ctx  Out  Ver  Blast
                             Dens Surf Det  Type Rad
                        ──── ──── ──── ──── ──── ─────
Codex suitability       ●●●  ●●   ○    ●●●  ●●   ●●●
Claude suitability      ○    ●●●  ●●   ●    ●●●  ○
Orchestration overhead  ●●   ○    ●●●  ○    ○    ○
Supervision requirement ●●   ●●   ○    ●    ●●●  ●●
Rollback risk           ○    ○    ●    ○    ●    ●●●
Entropy generation      ●    ●●●  ○    ●●●  ●●   ○
Verification cost       ○    ○    ○    ●    ●●●  ○

Legend: ●●● = strongly predictive  ●● = moderately  ● = weakly  ○ = not predictive
```

**Key findings from the matrix:**

**IDD is strongly predictive of Codex suitability AND orchestration overhead.**
This is the new insight. The 5-dimension V2 model did not include IDD and therefore
could not correctly predict orchestration overhead (it attributed overhead to
Context Surface, which is related but distinct — you can have high context surface
with IDD=0 if inputs are pre-computed).

**Blast Radius is strongly predictive of Codex suitability AND rollback risk.**
These two outcomes share the same primary predictor. This makes Blast Radius
the single highest-leverage dimension for deciding whether to require authorization.

**Verification Type is the primary predictor of Verification Cost AND Claude suitability.**
Semantic verification requirements → Claude must review → Claude-only ownership.
If verification is automated, Codex can self-check. If semantic, human is required
regardless of how mechanical the execution was.

**Decision Density is the primary predictor of Entropy Generation.**
Each judgment call is a potential source of inconsistency that compounds over time.
Workflows with high decision density must be reviewed at every output, not just
spot-checked. Low decision density + automated verification → entropy-minimal path.

**Context Surface predicts Orchestration Overhead but NOT Codex suitability.**
Counterintuitive: Codex CAN read files for context. The question is whether it
interprets the context correctly (that's IDD, not Context Surface). A workflow
with high Context Surface (reads many files) but IDD=1 (knows exactly what to
look for) is still Codex-suitable with pre-specified read targets.

---

## Section 5 — Derived Routing Rules

These are not implemented — they describe what a future routing system would apply.

**Rule R-01: IDD Gate**
```
If IDD ≥ 2: Claude performs discovery phase, provides structured inputs.
If IDD ≤ 1: inputs can be handed to Codex at task start.
```
IDD is checked FIRST, before any other dimension. A Zone-2 workflow (high IDD,
low EXD) that skips the IDD gate will fail at the execution phase because Codex
will discover the wrong inputs or fail to discover them at all.

**Rule R-02: Blast Radius Authorization Gate**
```
If Blast Radius = local/reversible: execute without authorization.
If Blast Radius = session-scoped: flag before executing, proceed unless objection.
If Blast Radius = persistent/irreversible: require explicit authorization.
```
Blast radius is checked SECOND. Even a Zone-1 (fully mechanical) workflow can
require authorization if it touches production state or frozen files.

**Rule R-03: Verification Coverage Check**
```
Before marking a task complete, identify: which semantic properties does
the available verification tool actually confirm?
If semantic properties are unverified: require human review step.
Automated pass ≠ correctness. Automated pass = structural conformance only.
```

**Rule R-04: Semantic Trap Detection**
```
Any workflow where verification is grep-based and the replacement
transformation is non-trivial (camelCase, ordering, insertion point)
must add a semantic spot-check that cannot be satisfied by grep alone.
```

**Rule R-05: Rollback Window Awareness**
```
For any workflow where rollback cost is time-dependent:
- Establish the rollback window at execution time ("this is revertible for 48hr")
- After window closes, treat as effectively irreversible
- Require authorization commensurate with irreversibility, not execution complexity
```

---

## Section 6 — Revised Codex Suitability Assessment

Using IDD + Blast Radius as primary predictors (confirmed by Section 4 matrix):

**Unsupervised Codex: safe zone**
- IDD = 0 or 1 (inputs pre-specified by Claude)
- Blast radius = local/reversible
- Verification = automated
- Decision density = zero

> PAT-02 Queue Close, PAT-07 HTML sed pass + grep verify

**Supervised Codex: requires Claude review at output**
- IDD = 0 or 1 (inputs pre-specified)
- Blast radius = local/reversible
- Verification = structural or semantic (human spot-checks)
- Decision density = low

> PAT-01 mechanical execution (Claude reviews commit message quality)
> PAT-07 JS accessor update (Claude verifies camelCase correctness)

**Claude-discovers, Codex-executes: handoff pattern**
- IDD = 2 or 3 (Claude performs discovery, outputs structured inputs)
- Claude hands off: {file, line-context, exact-replacement, verification-command}
- Codex executes deterministically on structured input
- Claude reviews output

> PAT-03 Auth Diff Preview (Claude identifies insertion points, Codex edits)
> PAT-06 grep pass (Claude specifies grep commands, Codex runs and formats)

**Claude-only: no delegation**
- IDD = 3, or
- Decision density = high, or
- Verification type = semantic without coverage mapping, or
- Blast radius = persistent AND authorization not obtained

> All J-type patterns, all phase authorization decisions, all severity classifications

---

## Section 7 — Open Questions for Future Observation

These questions cannot be answered from current data but should be tracked:

1. **Does IDD correlate with session length?** High-IDD tasks may require more
   context window. If so, IDD is also a predictor of session boundary placement.

2. **Does Blast Radius increase monotonically through phases?** Phase A edits have
   lower blast radius than Phase B (more users affected). Routing rules may need
   to be phase-aware, not static.

3. **Do semantic verification traps cluster by file type?** CSS changes, JS accessor
   renames, and hand-maintained docs all showed semantic traps. HTML edits (insertion
   points) did not. If this pattern holds, file type is a cheap proxy for trap risk.

4. **What is the actual entropy rate of hand-maintained summaries?**
   _index.md drifted in this session (manually identified). If drift is predictable
   (e.g., every N queue operations), auto-regeneration threshold can be set.

5. **Is the "discovery handoff" a formalization point?**
   The Zone 2 pattern (Claude discovers, Codex executes) requires a structured
   handoff format. What is the minimal sufficient spec for that handoff?
   Current candidate: {file-path, line-context, old-string, new-string, verify-cmd}

---

*Do not build routing runtime. Observational layer only.*
*Next refinement trigger: first Zone 2 handoff attempt or first Codex pilot run.*
