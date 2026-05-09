# MUTATION POLICY

## Purpose
Defines which files may be changed, by which mode, with what evidence, and through what
process. This is the gate every mutation passes through.

## Mutation Classes

| Class | Examples | Required Mode | Approver | Evidence Required |
| --- | --- | --- | --- | --- |
| **C0 read-only** | audits, registers reads | any | none | none |
| **C1 register/audit append** | append to GOTCHA_REGISTER, AUDIT_LOG | Passive Audit, Gotcha Detection | self | observation entry |
| **C2 state refresh** | overwrite CANONICAL_RUNTIME_STATE | runtime loop, Clean Pause | runtime loop | checkpoint id |
| **C3 safe auto-fix** | typo, unused import, doc lint | Safe Auto-Fix | AUTO_FIX_POLICY | green check |
| **C4 planned patch** | code in `js/`, `worker/`, root JS | Plan-Then-Execute | human | patch plan + tests |
| **C5 governance edit** | files in `/governance` | Plan-Then-Execute | human | patch plan + reasoning |
| **C6 architecture mutation** | new module, deleted module, dir restructure | Plan-Then-Execute | human + ROLLOUT_PLAN gate | patch plan + risk review |
| **C7 hard-stop territory** | see SAFETY_HARD_STOPS.md | none | refuse | n/a |

## File-Class Mapping

| Path | Default class |
| --- | --- |
| `STABILIZATION_LAYER.md` | C5 |
| `runtime-state/*` | C2 (overwritten by runtime loop) |
| `evolution-memory/*` | C1 (append) |
| `governance/*` | C5 |
| `stable-evolution-runtime/*` | C5 |
| `audits/*` | C1 (append) — except specs themselves which are C5 |
| `registers/*` | C1 (append) |
| `loops/*` | C5 |
| `templates/*` | C5 |
| `policies/*` | C5 |
| `BUILD_PLAN_*.md`, `MASTER.md`, `BUILD_INTELLIGENCE.md`, `KPI_CATALOG.md` | C4 |
| `WORK_IN_PROGRESS.md`, `SESSION_LOG.md`, `PROMPT_LOG.md` | existing build rules apply |
| `index.html`, `js/*`, `worker/*`, `patch_quote.js`, `wrangler.toml`, `sql/*` | C4 |
| `.claude/CLAUDE.md` | C5 (ranks above C4 — affects every session) |

## Required Sections of a Patch Plan (for C4–C6)
1. **Intent** — one sentence.
2. **Files touched** — list with class.
3. **Reasoning** — why now, why this scope, what was rejected.
4. **Reversibility** — exact revert command.
5. **Verification** — how green is verified.
6. **Risks** — at least one; "none" is rejected.
7. **Linked DER id** — if originated from a queued idea.

## Approval Routing
- C0–C2: no human approval.
- C3: bounded by `AUTO_FIX_POLICY.md`. Auto-revert on failure.
- C4–C6: human review required before commit. Background agents may *propose* but not commit.
- C7: refuse and log to `audits/AUDIT_LOG.md` with reason.

## Atomicity
- Cross-file changes in a single class must commit atomically.
- A C5 governance edit may not be co-committed with a C4 code edit.

## Rollback
- Every C4–C6 commit must record a one-line revert procedure in
  `runtime-state/RUNTIME_DELTA_REPORT.md`.

## Failure Handling
- A failed mutation always rolls back to the prior commit. No "fix forward" without a new
  patch plan.
- Three consecutive C3 failures in one cycle disable Safe Auto-Fix until next cycle.
