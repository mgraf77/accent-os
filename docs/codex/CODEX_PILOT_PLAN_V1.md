# Codex Pilot Plan V1

> First supervised Codex execution inside AccentOS.
> Claude dispatches, monitors, and verifies. Codex executes only.

---

## Pilot Constraints Checklist

- [x] Read-only OR trivially reversible
- [x] No production mutation
- [x] No governance doc edits
- [x] No Phase B work
- [x] No deploys
- [x] No SQL
- [x] No Worker changes
- [x] Claude reviews all output before any commit

---

## Recommended Pilot Task

### Task: Console.log Audit Report

**What:** Scan all `.js` files under `/js/` for `console.log`, `console.error`, `console.warn`, and `console.debug` calls. Produce a Markdown report at `docs/codex/AUDIT_CONSOLE_LOGS.md`.

**Why this task:**
- Completely read-only — no file mutations
- Output is a single new doc file, trivially deletable if wrong
- Real codebase value (identifies debug noise before production hardening)
- Simple enough to verify Codex output accuracy by spot-check grep
- No judgment required — pure grep + format

**Dispatch command (do not run until authorized):**
```bash
codex --approval-mode suggest "Scan all .js files in the /js/ directory recursively. Find every call to console.log, console.error, console.warn, or console.debug. Output a Markdown table to docs/codex/AUDIT_CONSOLE_LOGS.md with columns: File, Line, Method, Message Preview (first 60 chars). Do not modify any source files."
```

**Claude verification steps after Codex output:**
1. Spot-check 3 entries with `grep -n "console\." js/<file>` to confirm accuracy.
2. Confirm no source `.js` files were modified (`git diff --stat`).
3. Review `AUDIT_CONSOLE_LOGS.md` for completeness.
4. Commit only if output is accurate.

**Rollback:**
```bash
rm docs/codex/AUDIT_CONSOLE_LOGS.md
```

---

## Task Queue (Future Pilots — Not Active)

These are pre-approved task classes for future pilots once V1 confirms the workflow. None are dispatched until explicitly authorized.

| # | Task | Class | Risk |
|---|---|---|---|
| V2 | Scan for `TODO` / `FIXME` comments across `js/` | Read-only audit | None |
| V3 | Generate JSDoc stubs for exported functions in a single isolated module | Boilerplate gen | Low (new doc only) |
| V4 | Rename a CSS class across non-production style files | Deterministic transform | Low |
| V5 | Generate test file skeletons for modules in `js/` that have no test file | Boilerplate gen | Low |
| V6 | Produce a symbol inventory (function names, export list) for `js/` modules | Read-only audit | None |

---

## Governance Boundaries (Enforced Per Task)

| Boundary | Enforcement |
|---|---|
| Claude approves every task before dispatch | Manual sign-off required |
| Codex uses `--approval-mode suggest` | Flag required in every invocation |
| Claude reviews output before commit | No auto-commit from Codex |
| Codex scope limited to declared directory | No repo-wide mutations |
| No Codex writes to governance files | Explicit forbidden path list |
| All Codex sessions logged | Log entry in `docs/codex/` per session |

---

## Session Log Template

When a Codex task runs, log it here:

```
### [DATE] — Pilot V[N]
Task: [description]
Dispatch command: [exact command used]
Output: [file(s) produced or changed]
Verification: [grep checks run, results]
Claude verdict: PASS / FAIL / PARTIAL
Committed: YES / NO
Notes: [any anomalies]
```

---

## Authorization Gate

**Do not dispatch any Codex task until Michael explicitly says:**
> "Run the Codex pilot" or "Dispatch V1" or equivalent explicit authorization.

Claude will not self-authorize Codex dispatch.
