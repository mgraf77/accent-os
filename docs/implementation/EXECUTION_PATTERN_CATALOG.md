# Execution Pattern Catalog — V2
**Type:** Observational only — no skill framework, no automation
**Updated:** 2026-05-10 (V2 — refined classification taxonomy + deep specs)

---

## Part 1 — Classification Taxonomy

### Five Classification Dimensions

Every pattern is scored across five dimensions. The combination determines archetype.

| Dimension | What it measures | Low | High |
|-----------|-----------------|-----|------|
| **Decision density** | Judgment calls per step | 0 → deterministic | Every step requires context-dependent choice |
| **Context surface** | Prior state required to execute correctly | Local (just the files) | Domain (architecture + risk tolerance + phase state) |
| **Output determinism** | Does same input → same output? | Yes — fully deterministic | No — varies with domain judgment |
| **Verification type** | How correctness is confirmed | Automated (grep/smoke/count) | Semantic (human must interpret) |
| **Blast radius** | Worst-case damage if wrong | Local, single file, instant revert | Persistent, multi-system, hard to undo |

---

### Five Archetypes

#### Type M — Mechanical
- Decision density: **zero to low** (boundary inputs provided externally)
- Context surface: **local** — acts on named files with deterministic rules
- Output: **deterministic** — same input → same output, every time
- Verification: **automated** — pass/fail from shell command
- Blast radius: **local/reversible** — single file or git revert clears it

> The machine can run this. Human provides inputs at boundary. Human verifies at exit.
> Suitable for Codex delegation with supervised inputs.

Examples: PAT-01 execution, PAT-02, PAT-07 HTML pass

---

#### Type O — Orchestration
- Decision density: **low to medium** (coordinates multiple systems, but steps are structured)
- Context surface: **session** — requires understanding current state across multiple files
- Output: **structured** — format is fixed, content varies by context
- Verification: **structural** — output matches expected schema, human spot-checks content
- Blast radius: **session-scoped** — affects multiple files but still fully reversible

> The pattern knows what to do. It must discover the specific content by reading state.
> Suitable for supervised Codex with Claude providing the "what to look for" inputs.

Examples: PAT-03, PAT-05, PAT-06 grep sub-step

---

#### Type J — Judgment-heavy
- Decision density: **high** — every classification step requires domain knowledge
- Context surface: **domain** — requires understanding architecture, risk, phase gate state
- Output: **open** — cannot be predicted from inputs alone
- Verification: **semantic** — only a domain expert can confirm correctness
- Blast radius: **variable** — wrong classification can propagate through downstream decisions

> Cannot be templated. The "right answer" changes with context in non-deterministic ways.
> Claude-only. Extracting the steps gives you a shell with no intelligence.

Examples: severity classification, phase assignment, fix-vs-document decisions

---

#### Type V — Verification-heavy
- Decision density: **low** (the check itself is deterministic)
- Context surface: **local + expected-state** (must know what correct looks like)
- Output: **pass/fail with evidence** — structured finding set
- Verification: **automated check + semantic interpretation** (grep finds it, human reads it)
- Blast radius: **low** — read-dominant, no mutations

> The grep is mechanical. Interpreting the grep is judgment.
> Separable: mechanical sub-step (Codex-suitable) + interpretation (Claude-only).

Examples: CSS scope leak detection, z-index collision detection, namespace collision check

---

#### Type H — Hybrid
Two or more primary types combined. The weakest type governs extraction readiness.

> A hybrid is only as extractable as its least-extractable component.
> Decompose into sub-steps before assessing Codex suitability.

| Pattern | Primary | Secondary | Governs |
|---------|---------|-----------|---------|
| PAT-03 Auth Diff Preview | O | V | Orchestration — requires session context |
| PAT-04 Integration Risk Audit | O | J | Judgment — severity classification |
| PAT-06 Stabilization Pass | O | J | Judgment — risk/phase classification |

---

### Archetype Decision Tree (abbreviated)

```
Does execution require understanding domain risk?
  YES → Type J (or H if also orchestrating)
  NO  → Does it read multiple files to discover content?
          YES → Type O (or H if classification follows)
          NO  → Does output vary with same input?
                  YES → Type J
                  NO  → Is verification automated?
                          YES → Type M
                          NO  → Type V
```

---

## Part 2 — Pattern Registry (revised with archetype scores)

### PAT-01 — Verified Commit
**Archetype:** M (with J boundary at inputs)
**Frequency:** 9× this session · ~40× project lifetime
**Variance:** Very low — execution steps invariant, only inputs vary

**Required inputs (provided by Claude/human):**
- `[file-list]` — explicit named files to stage (judgment: which files changed, which are sensitive)
- `[commit-message]` — heredoc string (judgment: accurate, imperative mood, links session)

**Required outputs:**
- Working tree clean (`git status`)
- Branch pushed to remote
- Boot smoke: 27/27 exit 0

**Invariants (must never be violated):**
- Never `git add -A` or `git add .`
- Never `--no-verify`, `--no-gpg-sign`, `--amend` (unless explicitly instructed)
- Never `git push --force`
- Smoke check runs AFTER commit, BEFORE push — not skippable
- If smoke fails: fix → new commit → smoke again (not amend)

**Rollback expectation:** `git revert HEAD` — creates new revert commit, preserves history

**Verification steps:**
1. `git status` → working tree clean
2. `bash scripts/boot-smoke.sh` → exit 0, 27/27
3. `git log --oneline -1` → commit present with correct message

**Entropy risks:**
- Wrong branch at push time (check `git branch` — caught by convention)
- Sensitive file staged (`.env`, credentials — caught by pre-commit if configured)
- Smoke skipped under time pressure (most common failure mode in practice)
- Amend instead of new commit after smoke failure (corrupts prior commit)

**Failure modes:**
- Smoke fails → do not push → fix root cause → new commit → re-smoke
- Push rejected → investigate remote state → never force-push to resolve

**Codex suitability:** YES for mechanical execution
**Claude ownership:** File selection judgment + commit message quality
**Composable:** YES — terminal node. Almost every other pattern pipes into PAT-01.

---

### PAT-02 — Queue Item Close
**Archetype:** M (zero judgment in execution — judgment is in the WHEN decision)
**Frequency:** 6× this session · ~20× project lifetime
**Variance:** Very low — same edits every time

**Required inputs:**
- `[item-id]` — e.g., `qa-07-data-roles-collision`
- `[timestamp]` — ISO 8601, e.g., `2026-05-10T01:15:00Z`

**Required outputs:**
- `runtime/queue/<id>.md`: `status: complete`, `completed: <timestamp>` present
- `runtime/queue/_index.md`: item moved to COMPLETE section, totals updated
- Totals line consistent: (ready + blocked + in-flight + complete) = total items

**Invariants:**
- Status transitions are one-way: `ready` or `blocked` → `complete` only
- `completed:` field must be added (not just status change)
- `_index.md` totals must be updated in same edit session as item file
- Totals must be mathematically consistent

**Rollback expectation:** Edit files back directly — no git revert needed for docs

**Verification steps:**
1. Grep `_index.md` for `complete` count — matches completed items list length
2. Totals line arithmetic check: sum of sections = stated total
3. Item file contains both `status: complete` AND `completed:` field

**Entropy risks:**
- Totals drift — most common (forgot to decrement READY count when item closed)
- Wrong item closed (ID typo) — caught by reading item title before editing
- Stale timestamp (copy-paste from prior close) — minor, non-blocking

**Failure modes:**
- Totals inconsistent → manually reconcile by counting sections in _index.md
- Wrong item closed → edit status back, close correct item

**Codex suitability:** YES — fully mechanical execution
**Claude ownership:** WHEN to close (requires session context: "is this actually done?")
**Composable:** YES — always followed by PAT-01. Pair is effectively atomic.

---

### PAT-05 — Gate Status Check
**Archetype:** O (read + format) with light synthesis
**Frequency:** 4× this session · ~15× project lifetime
**Variance:** Very low structure, content varies with state

**Required inputs:** None — reads current state from filesystem

**Required outputs:**
- READY list with estimated session cost
- BLOCKED list grouped by blocker type (Michael action, phase gate, dependency)
- Michael actions needed with specific ask per item
- Net assessment: what proceeds now, what waits

**Invariants:**
- Must read both `_index.md` AND spot-check individual queue files (index can drift)
- Must read `DECISION_LOCK_V1.md` answer fields for Michael-blocked items
- Output must flag any totals drift detected between index and actual files

**Rollback expectation:** N/A — read-only operation

**Verification steps:**
1. Reported READY count matches `_index.md` stated READY total
2. Each reported READY item has a queue file with `status: ready`
3. Each reported BLOCKED item has a stated blocker that explains why

**Entropy risks:**
- `_index.md` drift — items marked READY in index but still `blocked` in queue file
- Missing queue files referenced in index (surfaced as "unknown state")
- Decision answers filled but not recorded in queue file `depends_on` resolution

**Failure modes:**
- Index/file mismatch → flag drift, report both states, recommend reconciliation
- Queue file missing → report "unknown — file not found"

**Codex suitability:** YES for read + format step; Claude owns synthesis/prioritization
**Claude ownership:** "What does this mean for project velocity?" + "What should Michael do first?"
**Composable:** YES — natural session-start step, can feed into work-selection decision

---

### PAT-07 — Data-Attribute Rename
**Archetype:** M (with one deterministic transformation rule for JS accessors)
**Frequency:** 1× observed · 1–3× expected in Phase B–E
**Variance:** Very low — same grep/sed/verify/commit pattern

**Required inputs:**
- `[source-attr]` — e.g., `data-roles`
- `[target-attr]` — e.g., `data-aos-roles`
- `[scope]` — directory path, e.g., `ui/`

**Required outputs:**
- `grep -rn '<source-attr>' <scope>` → zero matches
- `grep -rn '<target-attr>' <scope>` → all expected matches present
- JS accessors updated: `dataset.<camelCase(source)>` → `dataset.<camelCase(target)>`
- querySelector patterns updated: `[source-attr]` → `[target-attr]`

**Invariants:**
- HTML attribute rename: `data-x-y` → `data-a-b` (sed-safe)
- JS dataset accessor rule: `data-foo-bar` → `dataset.fooBar` (camelCase, drop `data-` prefix)
  - `data-roles` → `dataset.roles`
  - `data-aos-roles` → `dataset.aosRoles`
- querySelector string update: `'[data-x-y]'` → `'[data-a-b]'`
- Scope must include ALL files that could reference the attribute (HTML, JS, CSS)

**Rollback expectation:** `git checkout HEAD -- <files>` before commit (instant, no history needed)

**Verification steps:**
1. `grep -rn '<source-attr>' <scope>` → must return zero results
2. `grep -rn '<target-attr>' <scope>` → returns N expected matches (count pre/post)
3. JS file: grep for old `dataset.<old-camel>` → zero results
4. Run boot smoke to catch any JS runtime errors from missed accessor

**Entropy risks:**
- HTML renamed, JS accessor not updated → runtime error on `dataset.roles` (undefined)
- querySelector string missed — JS tries to find `[data-roles]` → no elements found
- Scope too narrow — missed a JS module that also references the attribute
- camelCase conversion error (e.g., `data-aos-role` → `dataset.aosRole` not `dataset.aos-role`)

**Failure modes:**
- Missed accessor → JS runtime error `Cannot read properties of undefined` → grep JS for old camelCase
- Partial rename → grep finds residuals → sed again, re-verify

**Codex suitability:**
- HTML sed pass: YES — deterministic
- JS accessor update: SUPERVISED — needs camelCase rule applied correctly
- Verification grep: YES — deterministic
**Claude ownership:** Scope identification, JS accessor pattern confirmation
**Composable:** YES — always feeds into PAT-01. Can chain: discover collision → PAT-07 → PAT-01.

---

## Part 3 — Codex Pilot vs Claude-Only Assessment

### Criteria for Codex delegation

A pattern is Codex-suitable when ALL of the following hold:
1. Inputs can be fully specified before execution begins (no mid-run discovery)
2. Execution steps are deterministic given those inputs
3. Verification is automated (not semantic)
4. Blast radius is local and reversible within the same session
5. Failure mode is detectable (grep returns results, smoke fails, git shows diff)

---

### Tier 1 — Codex pilot candidates (bounded, reversible, auto-verifiable)

**PAT-02 Queue Item Close — strongest candidate**
- All inputs known before execution: item-id, timestamp
- Steps deterministic: two file edits, totals update
- Verification automated: arithmetic check on totals
- Blast radius: two doc files, trivial to revert
- Failure mode: visible (totals wrong) and self-correcting
- Risk of Codex error: LOW — no ambiguity in any step
- Required Claude handoff: item-id + timestamp only. Claude decides WHEN, Codex executes HOW.

**PAT-07 HTML sed pass (sub-step only)**
- Input: source string, target string, file path
- Execution: `sed -i 's/old/new/g' <file>`
- Verification: `grep -rn 'old' <file>` → zero
- Blast radius: single file, pre-commit
- Risk of Codex error: LOW for HTML; MEDIUM for JS accessor (camelCase rule)
- Decomposition: delegate HTML sed to Codex, Claude handles JS accessor update

**PAT-01 mechanical execution (with Claude-provided inputs)**
- If Claude provides: [file-list] + [commit-message], Codex executes: add → commit → smoke → push
- Codex cannot be trusted to determine file list or write commit message
- Codex CAN be trusted to: `git add <explicit-list>`, run smoke, push if smoke passes, abort if smoke fails
- Risk of Codex error: LOW given pre-specified inputs; MEDIUM if allowed to infer file list

---

### Tier 2 — Supervised Codex (Claude provides structured inputs, Codex executes, Claude reviews output)

**PAT-05 Gate Status Check read phase**
- Codex reads `_index.md` + queue files + decision doc
- Codex formats: READY, BLOCKED by type, Michael actions
- Claude reviews: synthesis, prioritization, velocity assessment
- Risk of Codex error: LOW for reads; MEDIUM for drift detection (requires judgment to flag)

**PAT-07 JS accessor update (sub-step)**
- Claude specifies: source camelCase, target camelCase, files to edit
- Codex executes: targeted string replacement
- Claude verifies: grep confirms old accessor gone
- Risk: MEDIUM — camelCase conversion must be exactly right or silent runtime failure

---

### Tier 3 — Claude-only (judgment, authorization scope, or domain knowledge required)

| Pattern | Reason |
|---------|--------|
| PAT-01 file selection + message | Judgment — which files, what the message communicates |
| PAT-03 Auth Diff Preview | Orchestration touching frozen files — authorization safety requires full domain context |
| PAT-04 Integration Risk synthesis | Judgment — severity classification determines what gets fixed vs deferred |
| PAT-06 Stabilization Pass synthesis | Judgment — "current vs latent vs Phase B risk" cannot be automated |
| All severity classifications | Pure judgment, no mechanical structure |
| All phase authorization decisions | Irreversible action authorization — Claude must own this |
| All queue item WHEN decisions | Requires session context: "is the work actually done?" |

---

### Composability Graph

```
[Session start]
    │
    └──▶ PAT-05 Gate Status (O)
              │
              └──▶ work-selection decision (J — Claude)
                        │
              ┌─────────┴──────────────────────┐
              │                                │
     PAT-04 Risk Audit (H)          PAT-07 Rename (M)
         grep pass (V)                    │
              │                      PAT-01 Commit (M) ◀──┐
     synthesis (J — Claude)               │                │
              │                      PAT-02 Close (M) ─────┘
     PAT-02 Queue Items (M)
              │
         PAT-01 Commit (M)
              │
     PAT-03 Diff Preview (H) ──▶ authorization (J — human)
              │
         [phase mount]
              │
     PAT-06 Stabilization (H)
              │
     PAT-05 Gate Status ──▶ cycle repeats
```

**PAT-01 is the universal terminal node.** All mechanical patterns flow into it.
**PAT-05 is the universal entry probe.** Session starts and phase transitions trigger it.
**PAT-02 is the most composable sub-step.** Appears as a suffix to almost every implementation pattern.

---

## Part 4 — Patterns Not Cataloged (with rationale)

| Pattern | Reason excluded |
|---------|----------------|
| Correction workflows (DEC-01-B/C misinterpretation) | Variance too high — each correction is unique to the misread |
| Architecture documentation (MVHB_ROADMAP, EXECUTION_TOPOLOGY) | One-time, judgment-heavy — no repeated structure |
| Decision recording | One-time per decision, format varies with content |
| Risk severity classification | Pure Type J — extracting steps gives shell with no intelligence |
| Session handoff writing | Domain synthesis — each handoff is unique to session state |

---

*Observational layer only. Do not build skill framework until authorized.*
*Next refinement trigger: after 3 additional sessions or first Codex pilot attempt.*
