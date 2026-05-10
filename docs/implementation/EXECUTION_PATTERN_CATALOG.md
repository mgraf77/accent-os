# Execution Pattern Catalog
**Type:** Observational only — no skill framework, no automation
**Purpose:** Identify recurring workflows meeting the bar for future procedural extraction
**Updated:** 2026-05-10

Criteria for inclusion:
- Observed ≥2 times in session history
- High reuse potential (recurs across phase boundaries)
- Identifiable trigger + deterministic steps + verifiable exit
- Measurable operational leverage (time saved, error prevented, or cognitive load removed)

---

## PAT-01 — Verified Commit

**Trigger:** Any code or doc change ready to commit
**Observed frequency:** 9× this session, estimated 30–50×/project lifetime
**Variance:** Very low — same sequence every time, only commit message content varies

**Steps (invariant):**
1. `git add <specific files>` (never -A)
2. `git commit -m "$(cat <<'EOF' ... EOF)"` with heredoc
3. `bash scripts/boot-smoke.sh` — verify 27/27
4. `git push -u origin <branch>`
5. If smoke fails: fix, re-add, re-commit (new commit, not amend)

**Classification:** Mechanical
**Judgment component:** Commit message content, which files to stage
**Verification:** Boot smoke pass required — not optional
**Leverage:** Each manual execution takes ~4 min. At 40 executions → 2.7 hrs recoverable.
Also prevents: unstaged file errors, skipped smoke checks, force-push temptations

**Extraction readiness:** HIGH — clear trigger, fixed sequence, measurable output
**Blocker for extraction:** None. Could be built now.
**Notes:** Smoke check is the critical invariant. Any skill must treat it as non-optional.

---

## PAT-02 — Queue Item Close

**Trigger:** A task transitions to complete status
**Observed frequency:** 6× this session, ~20×/project lifetime
**Variance:** Low — same file edits, only content varies

**Steps (invariant):**
1. Edit `runtime/queue/<id>.md`: `status: ready` → `status: complete`
2. Edit same file: add `completed: <timestamp>`
3. Edit `runtime/queue/_index.md`: move item from READY/BLOCKED to COMPLETE section
4. Update totals line in `_index.md`
5. Commit (triggers PAT-01)

**Classification:** Mechanical
**Judgment component:** Zero — all fields deterministic
**Verification:** Visual check that _index.md totals are consistent
**Leverage:** Each manual execution takes ~6 min including context-switching. At 20 executions → 2 hrs recoverable.

**Extraction readiness:** HIGH — pure mechanical, fully templatable
**Blocker for extraction:** None.
**Notes:** Often batched with PAT-01. A combined `queue-close-and-commit` pattern appears.

---

## PAT-03 — Authorization Diff Preview

**Trigger:** A phase gate requires frozen-file mutations — Michael must authorize before execution
**Observed frequency:** 1× (Phase A), expected 5× more (Phase B–F)
**Variance:** Low structure, content varies per phase

**Steps (invariant):**
1. Read frozen target file(s) — identify exact insertion points (line numbers)
2. Read rollout doc — extract approved scope for current phase
3. Produce unified diff format showing: exact line context, exact additions, exact deletions
4. Annotate with: files touched, lines added, rollback procedure
5. Emit as single copy block — await authorization before any file mutation

**Classification:** Orchestration-heavy (requires multi-file read + synthesis) + Verification-heavy (diff must be exact)
**Judgment component:** Medium — identifying correct insertion points, ordering changes
**Leverage:** ~20 min/phase, prevents unauthorized mutations, creates audit trail
**Error prevention:** Without preview, frozen-file mutations could occur before authorization

**Extraction readiness:** MEDIUM — structure is clear but content synthesis requires judgment
**Blocker for extraction:** Judgment component in insertion point identification
**Notes:** The output format is fully templatable. The read phase is the variable part.

---

## PAT-04 — Integration Risk Audit

**Trigger:** Phase gate transition approaching — need to surface hidden collision vectors
**Observed frequency:** 2× this session (Phase A pre-mount + stabilization pass)
**Variance:** Low structure, content varies per audit scope

**Steps (invariant):**
1. Define audit scope: which files are interaction surfaces
2. Grep collision vectors by category:
   - CSS selector leakage (unscoped selectors, class name overlap)
   - JS event handler collisions (same event, same element, both phases)
   - DOM attribute collisions (shared attribute names, shared element ids)
   - CSS variable namespace (shadowing, override)
   - Z-index stacking (values in competing ranges)
   - Initialization ordering (DOMContentLoaded race, async hydration race)
   - localStorage key namespace (shared keys)
3. Classify each finding: severity, blocking phase, resolution path
4. Write queue items for actionable findings
5. Write catalog document with recommended execution order

**Classification:** Orchestration-heavy (multi-file, multi-category) + Judgment-heavy (severity classification)
**Judgment component:** High — severity assignment, "safe vs latent vs blocking" distinction
**Leverage:** ~40 min/audit. Prevents Phase B defects. Most time-valuable pattern in catalog.
**Error prevention:** OBS-04 (data-mode unscoped) would have shipped to Phase B without this pass

**Extraction readiness:** MEDIUM — grep commands are templatable; classification requires judgment
**Blocker for extraction:** Severity/safety classification is judgment-heavy. A mechanical audit
  that produces raw findings without classification is 60% of the value and fully extractable.
**Notes:** The grep pass (mechanical) is separable from the synthesis pass (judgment).
  Could extract `integration-grep-pass` as mechanical sub-skill feeding human synthesis.

---

## PAT-05 — Gate Status Check

**Trigger:** Need to understand what is ready, blocked, and gating what
**Observed frequency:** 4× this session, ~15×/project lifetime
**Variance:** Very low — same reads, same format

**Steps (invariant):**
1. Read `runtime/queue/_index.md` — get current totals and READY items
2. Read blocker items for each BLOCKED cluster — identify what Michael action clears them
3. Read `docs/implementation/DECISION_LOCK_V1.md` — check answer fields
4. Synthesize: what can proceed now, what waits on Michael, what waits on phase gate

**Classification:** Mechanical + light synthesis
**Judgment component:** Low — most outputs are deterministic from the file reads
**Leverage:** ~10 min/check. Frequently needed at session start and transition points.

**Extraction readiness:** HIGH — reads are mechanical, output format is consistent
**Blocker for extraction:** None meaningful.
**Notes:** Session start already reads WIP + BUILD_PLAN. Gate status could be folded
  into session-start sequence or triggered by `?gate` query in conversational mode.

---

## PAT-06 — Phase Stabilization Pass

**Trigger:** Phase mount completes — 7-day observation window begins
**Observed frequency:** 1× (Phase A), expected 5× more (Phase B–F)
**Variance:** Medium — same category checklist, different specific findings per phase

**Steps (invariant):**
1. Read all active interaction surfaces: shell JS, legacy JS at collision points, CSS files
2. Grep by category: keyboard handlers, z-index values, CSS selectors, localStorage keys,
   DOM attribute names, initialization timing, API surface overlap
3. For each finding: assess with-flag-OFF and with-flag-ON separately
4. Classify: current risk vs Phase B risk vs latent risk
5. Identify any immediate fix (pre-Phase-B, non-frozen files only)
6. Write `PHASE_X_STABILIZATION_OBSERVATIONS.md`
7. Identify skill candidate patterns (this meta-step)

**Classification:** Orchestration-heavy + Judgment-heavy
**Judgment component:** High — risk classification, phase assignment, fix-vs-document decision
**Leverage:** ~60 min/pass. Prevents defects in subsequent phase. High leverage.

**Extraction readiness:** LOW for full pattern. HIGH for the grep/read sub-steps.
**Blocker for extraction:** Judgment component is too high for full extraction.
  The checklist of grep commands is extractable; the risk synthesis is not.
**Notes:** Separable into: `stabilization-grep-pass` (mechanical) + synthesis (human/judgment).

---

## PAT-07 — Data-Attribute Rename

**Trigger:** Attribute collision discovered — must rename in all shell files
**Observed frequency:** 1× (data-roles → data-aos-roles), likely 1–3× more in Phase B–E
**Variance:** Very low — same grep/sed/verify/commit pattern

**Steps (invariant):**
1. `grep -rn 'old-attribute' ui/` — find all occurrences + line numbers
2. `grep -rn 'old-attribute' ui/ --include="*.js"` — find JS querySelector/getAttribute uses
3. `sed -i 's/old-attribute/new-attribute/g' <file>` — bulk rename HTML attributes
4. Manual edit for JS: `querySelector('[old]')` → `querySelector('[new]')`, `dataset.old` → `dataset.new`
5. `grep -rn 'old-attribute' ui/` — verify zero remaining
6. Commit (triggers PAT-01)

**Classification:** Mechanical
**Judgment component:** Low — only the naming decision (already made before pattern triggers)
**Leverage:** ~8 min/rename. Prevents collision defects.

**Extraction readiness:** HIGH — fully templatable once source/target names are known
**Blocker for extraction:** None. The `dataset.camelCase` transform from `data-kebab-case`
  requires knowing the JS access pattern, but this is deterministic.

---

## Ranking by Extraction Priority

| Rank | Pattern | Readiness | Type | Leverage |
|------|---------|-----------|------|---------|
| 1 | PAT-01 Verified Commit | HIGH | Mechanical | Medium — time saved |
| 2 | PAT-02 Queue Item Close | HIGH | Mechanical | Medium — time saved |
| 3 | PAT-05 Gate Status Check | HIGH | Mechanical+light | Medium — decision clarity |
| 4 | PAT-07 Data-Attribute Rename | HIGH | Mechanical | Low-medium |
| 5 | PAT-04 Integration Risk Audit (grep sub-step) | MEDIUM | Mechanical sub-step | HIGH — defect prevention |
| 6 | PAT-03 Authorization Diff Preview | MEDIUM | Orchestration | HIGH — authorization safety |
| 7 | PAT-06 Stabilization Pass (grep sub-step) | LOW full / HIGH sub-step | Orchestration | HIGH |

**First extraction recommendation (when authorized):** PAT-01 + PAT-02 combined as
`verified-commit-and-close` — highest frequency, zero judgment, immediate time savings,
and forms the foundation other patterns depend on.

**Highest-leverage extraction (when authorized):** PAT-04 grep sub-step — surfaces
defects before they reach frozen-file phases. Once templated, runs in <5 min vs ~40 min.

---

## Patterns Explicitly NOT Cataloged

The following appeared during sessions but have too much variance or judgment to extract:

- **Correction workflows** (DEC-01-B/C misinterpretation fix) — variance too high
- **Architecture documentation** (MVHB_ROADMAP, EXECUTION_TOPOLOGY) — one-time, judgment-heavy
- **Decision recording** — one-time per decision, format varies with content
- **Risk severity classification** — pure judgment, no mechanical structure

---
*Do not build skill framework until authorized. This document is observation-only.*
