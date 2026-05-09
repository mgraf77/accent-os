# AccentOS Governance Linter Specification
> **Doc type:** Enforcement specification. The lint-rule catalog the future `governance-lint` skill / hook implements.
> **Frame:** every check is detect-only; lint never edits governance content. The linter is a noise-reduction tool for humans, not an authority.
> **Authority:** advisory until adopted; once adopted, runs as pre-commit / pre-push / scheduled job.

---

## 1. Linter responsibilities (compact)

The linter:

- **Parses** governance docs and `module_modes.json`.
- **Cross-references** statements that should agree (authority order, freeze triggers, mode glossary).
- **Flags** divergences as Errors (block on commit) or Warnings (advisory).
- **Does not edit** governance content, ever. Auto-fix is forbidden for governance lints.

It is a 200-line shell script (Bootstrap tier) or a small Python module (Standard tier). It is **not** a framework.

---

## 2. Lint rule catalog (LINT-NN)

Each rule has: severity (Error / Warn / Info), trigger, source, expected fix.

### LINT-01 · `module_modes.json` parses
- **Severity:** Error.
- **Trigger:** `jq . module_modes.json` exits non-zero.
- **Source:** R-AUTO-02.
- **Fix:** human-readable parse error + line number.

### LINT-02 · `module_modes.json` mode is in the allowed enum
- **Severity:** Error.
- **Trigger:** any module's `mode` field is not one of the nine modes in `MODULE_MODES.md`.
- **Source:** Constitution Article X (no agent-initiated mode invention).
- **Fix:** name the offending key + offending value.

### LINT-03 · Frozen-doc fingerprint
- **Severity:** Error.
- **Trigger:** any file in the freeze list (per `ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md`) has changed without `--allow-frozen-edit` flag.
- **Source:** R-AUTO-01.
- **Fix:** revert or escalate to Captain.

### LINT-04 · Bare "Phase N" in commit subject
- **Severity:** Warn.
- **Trigger:** commit subject regex `\bPhase [0-9]+\b` without preceding scope token.
- **Source:** R-AUTO-05, R-AUTO-14.
- **Fix:** rewrite commit subject with `canonical Phase N` or `rollout Phase N`.

### LINT-05 · Forbidden vocabulary
- **Severity:** Warn.
- **Trigger:** governance doc contains a forbidden term per `ACCENTOS_GOVERNANCE_TERMINOLOGY.md` §2 ("kill switch", "suppress" in governance text, bare "Owner" meaning Captain, "stage" as phase-synonym, "approve" as Captain-go-synonym, "reset" used for `git reset --hard`, "hotfix", "force-push", "sync" for v1↔v2).
- **Source:** Terminology lint rule.
- **Fix:** replace with the canonical term.

### LINT-06 · Authority-order consistency
- **Severity:** Warn.
- **Trigger:** the authority precedence list in `ACCENTOS_GOVERNANCE_INDEX.md` §4, `ACCENTOS_GOVERNANCE_RECONCILIATION.md` §1, `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` §5, and `ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md` "hierarchy" disagree on the top-5 entries.
- **Source:** structural integrity check.
- **Fix:** align all four to the same top-5; canonical (`MASTER.md` §12 → STABILIZATION_PROTOCOL.md → GOVERNANCE_RISKS.md → MODULE_OWNERSHIP_MAP.md → SYSTEM_STATE.md) wins.

### LINT-07 · Freeze trigger duplication
- **Severity:** Warn.
- **Trigger:** the freeze trigger list in `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §12 contains anything beyond the reference paragraph (i.e., duplicates the list).
- **Source:** B5 alignment edit; deduplication is the rule.
- **Fix:** remove duplication; keep the reference paragraph only.

### LINT-08 · Risk-register duplication
- **Severity:** Warn.
- **Trigger:** any spoke doc enumerates R-01–R-12 (canonical risk register identifiers) outside `ACCENTOS_CANONICAL_DELTA.md`.
- **Source:** B4 alignment edit.
- **Fix:** cite by reference, do not enumerate.

### LINT-09 · One-flip-per-commit
- **Severity:** Error.
- **Trigger:** commit changes 2+ entries in `module_modes.json`.
- **Source:** R-AUTO-13.
- **Fix:** split into multiple commits.

### LINT-10 · Inverse-flip text in commit body
- **Severity:** Warn.
- **Trigger:** commit modifies `module_modes.json` and commit body lacks `revert:` or `inverse:` text.
- **Source:** R-AUTO-15.
- **Fix:** add inverse-flip block to commit body.

### LINT-11 · Branch role vs. file scope
- **Severity:** Error on Spoke; Warn elsewhere.
- **Trigger:** commit on `claude/<topic>-<suffix>` modifies any path outside `docs/design/` plus SESSION_LOG/WIP appends.
- **Source:** R-AUTO-07, Constitution Article VI.
- **Fix:** move work to a Hub feat branch.

### LINT-12 · Captain-go presence
- **Severity:** Error on `→ live` flip; Warn on `→ deprecated`.
- **Trigger:** flip-toward-`live` commit and SESSION_LOG.md doesn't contain a Captain go entry within 24h referencing the module key.
- **Source:** R-AUTO-10, R-AUTO-12.
- **Fix:** stop; obtain Captain go; record; retry.

### LINT-13 · `index.html` size warning
- **Severity:** Warn at ≥800KB; Error at ≥860KB.
- **Trigger:** `wc -c index.html` exceeds threshold.
- **Source:** Rollout Strategy §13 + Freeze Protocol §1.
- **Fix:** extract a subsystem (per `ACCENTOS_GOVERNANCE_RECONCILIATION.md` §10 E1–E7).

### LINT-14 · Modules-in-`building` count
- **Severity:** Warn at 8; Error at 9.
- **Trigger:** `jq '.modules | map_values(select(.mode == "building")) | length'` exceeds threshold.
- **Source:** Freeze Protocol §1 soft trigger.
- **Fix:** triage; advance or close.

### LINT-15 · Stale planning artifact
- **Severity:** Info.
- **Trigger:** any doc in `docs/design/` not modified in 90 days while the freeze is active.
- **Source:** stale-content advisory.
- **Fix:** flag for Captain review; possibly archive.

### LINT-16 · Cross-reference resolves
- **Severity:** Warn.
- **Trigger:** governance doc cites another by path + section (e.g., `§16.6`) and the section does not exist.
- **Source:** referential integrity.
- **Fix:** correct the reference.

### LINT-17 · Mode glossary consistency
- **Severity:** Warn.
- **Trigger:** any spoke doc enumerates `module_modes.json` modes with definitions that differ from `MODULE_MODES.md`.
- **Source:** Terminology §4 (canonical-source rule).
- **Fix:** replace with reference to `MODULE_MODES.md`.

### LINT-18 · Bake-period vs. Re-score-window mix
- **Severity:** Warn.
- **Trigger:** governance text uses "bake" and "re-score" interchangeably.
- **Source:** Terminology C9 disambiguation.
- **Fix:** distinguish per Terminology §1.

### LINT-19 · Snapshot-disambiguation
- **Severity:** Warn.
- **Trigger:** governance text uses bare "snapshot" without one of the three qualifiers (curl / system-state / handoff packet).
- **Source:** Terminology Snapshot definition.
- **Fix:** qualify.

### LINT-20 · Hard-rule violation phrase
- **Severity:** Error.
- **Trigger:** commit contains string `git reset --hard` against `main` or `git push --force` to `main`/canonical.
- **Source:** MASTER §12 hard rules + R-AUTO-08.
- **Fix:** refuse the operation; suggest `git revert`.

---

## 3. Linter run modes

| Mode | Trigger | Severity to act on |
|---|---|---|
| **pre-commit** | every commit | Error → block; Warn → print; Info → silent |
| **pre-push** | every push | Error → block (server-side ideally); Warn → print |
| **session-start** | `.claude/CLAUDE.md` AUTO-EXECUTE | Error/Warn → print summary line |
| **session-end** | Stop hook (per `efficiency-monitor`) | aggregate counts → append to `_aggregator.log` |
| **on-demand** | `bash scripts/governance-lint.sh` | full report |
| **scheduled** | weekly cron / GitHub Action | full report → flag stale items, sprawl, drift |

---

## 4. Output format

The linter prints one line per finding:

```
LINT-NN  SEVERITY  PATH:LINE  short message  →  fix hint
```

Example:

```
LINT-04  WARN    .git/COMMIT_EDITMSG:1  bare "Phase 1" in subject  →  use "rollout Phase 1" or "canonical Phase 1"
LINT-09  ERROR   module_modes.json     2 mode flips in one commit  →  split into separate commits
```

Machine-readable mode (`--json`) emits one finding per line as JSON for downstream tooling.

---

## 5. False-positive policy

When a finding is a false-positive (rare, but possible):

1. The author may add a single-line justification to the commit body: `governance-lint-override: LINT-NN — <reason>`.
2. The override is logged to `.governance-flags`.
3. Repeated overrides on the same rule (>3 in a session) suggest the rule is too tight; tracked for Captain review.

The override is the explicit escape hatch. It is logged, never silent.

---

## 6. Anti-pattern: auto-fix

The linter **does not auto-fix** governance content. Autofix is forbidden because:

- Governance content carries authority; mutation requires Captain.
- A "fix" can hide the underlying confusion that produced the lint.
- Auto-fix loops compound across sessions and become un-auditable.

Auto-fix is allowed *only* for trivially safe, non-governance scope (e.g., trailing whitespace in `docs/design/test/*.md` is OK to strip). Governance lint is read-only for the linter.

---

## 7. Implementation cost

| Tier | Implementation | Effort |
|---|---|---|
| **Bootstrap** | LINT-01, 02, 03, 04, 09, 11, 13, 14, 17, 20 in ~150 lines of bash + jq | 1 session for the script; no deps |
| **Standard** | Add LINT-05, 06, 07, 08, 10, 12, 16, 18, 19 (regex over markdown + git log queries) | +1 session |
| **Enterprise** | Add LINT-15 (90-day staleness), session-end aggregation, JSON output, GitHub Action | +1 session; only if multi-Captain or compliance |

Bootstrap covers structural integrity. Standard adds language hygiene. Enterprise adds long-horizon drift detection.

---

## 8. Linter as feedback loop

When a lint fires, **the rule itself is data**. The linter's findings feed into:

- Captain-decision queue (frequent fires of the same rule → tighten or relax).
- Multi-session discoveries doc (recurring patterns → automate further).
- Failure scenarios doc (lint fires for new failure modes → add F-N entry).

The linter is not a frozen artifact; it evolves with the system. But evolution happens via Captain-authorized canonical edits to **this spec**, never via silent rule additions in the code.

---

## 9. Linter-out-of-scope

The linter does not check:

- Visual parity (mobile / desktop) — human only.
- Functional correctness (does the code work) — testing's job.
- Performance — observability's job.
- Security — separate review.
- Subjective readiness (S/M/W/G/R sub-scores) — human judgment per Readiness System §11.

These are out-of-scope by design. The linter's job is structural governance integrity, not full QA.

---

*End of ACCENTOS_GOVERNANCE_LINTER_SPEC.md — lint-rule catalog.*
