# AUTO-FIX POLICY

## Purpose
Defines the narrow class of changes Safe Auto-Fix mode may make without a human-reviewed
patch plan. The default answer is **no auto-fix** — anything not enumerated here is C4+.

## Eligible Fixes (allowlist)
- **A1 typo / dead text** — typo in a doc, dead link, trailing whitespace.
- **A2 lint cosmetic** — unused import, unused variable, formatter run with project config.
- **A3 missing template scaffolding** — adding a required section heading from a template
  to a file that already exists, leaving body placeholder text empty.
- **A4 register append** — appending a structured entry to a register/audit per its template.
- **A5 stale checkbox** — marking BUILD_PLAN_CLAUDE.md `[ ]` → `[x]` only when the linked
  commit and verification evidence are recorded in RUNTIME_DELTA_REPORT.md.

Anything else is **out of scope** — escalate to Plan-Then-Execute.

## Hard Limits per Cycle
- Max 5 auto-fixes per session.
- Max 1 auto-fix per file per session.
- Total LoC change per auto-fix: ≤ 20.
- Combined cycle LoC change via auto-fix: ≤ 80.

## Forbidden in Auto-Fix Mode
- Any change to `js/`, `worker/`, `index.html`, `patch_quote.js`, `wrangler.toml`, `sql/`.
- Any change to `governance/`, `stable-evolution-runtime/`, `policies/`, `loops/`.
- Any change to `runtime-state/CANONICAL_RUNTIME_STATE.md` or `LAST_KNOWN_GOOD_STATE.md`.
- Any rename, move, or delete.
- Any change that touches > 1 directory.
- Any change without an existing register/audit observation linking to it.

## Required Output per Auto-Fix
1. The diff (must be ≤ 20 lines changed).
2. Class declaration: `A1 | A2 | A3 | A4 | A5`.
3. Linked observation id from `audits/GOTCHA_REGISTER.md` or `audits/AUDIT_LOG.md`.
4. Rollback command.

## Verification
- After applying, the runtime loop runs the project's status check (currently
  `bash scripts/status.sh`). Any failure → auto-revert.
- Result recorded in `audits/AUDIT_LOG.md` regardless of outcome.

## Strike Rule
- 3 auto-revert events in a cycle → Safe Auto-Fix mode is disabled for the remainder of
  the cycle and a HIGH risk is opened in `ACTIVE_RISKS.md`.

## Bootstrap Behavior (v0.1)
- At v0.1, Safe Auto-Fix mode is **disabled by default** until P2 rollout. The policy is
  defined here so it can be activated atomically when ready.
