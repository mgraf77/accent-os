# Evaluator: repo-health

## Identity
- **Name:** `repo-health`
- **Purpose:** Holistic, repeatable measure of how healthy the repo is at a moment in time. Used by `audit` mode to produce a comparable score, by `stabilize` mode to confirm it's done its job, and by `deploy-prep` to gate readiness.
- **Used by:** `audit`, `stabilize`, `deploy-prep` (and any other mode that wants a baseline)

## Inputs
- The repo at a specific commit (`git rev-parse HEAD` recorded in output)
- The repo's documented test, lint, type-check commands (from manifest or convention)
- The repo's dependency manifest(s)
- The repo's audit trail (for stale-finding cross-check)

## Checklist

Items are grouped by category. Each item is **binary pass/fail** unless noted. Categories are **weighted** for the final score (see Scoring).

### Category A — Tests (weight: 25)
- A1. Test command exits 0 (full suite) — pass/fail
- A2. No tests are skipped or quarantined without an explanation — pass/fail
- A3. No `.only` / `.skip` left in committed code — pass/fail
- A4. Test coverage (if measured by repo): meets the repo's documented threshold — pass/fail/n-a

### Category B — Lint / Style / Types (weight: 15)
- B1. Lint command exits 0 — pass/fail
- B2. Type check (if applicable) exits 0 — pass/fail
- B3. No suppressed warnings (`@ts-ignore`, `eslint-disable`, etc.) added in last 30 days without comment — pass/fail
- B4. Formatter (if applicable) reports no diffs — pass/fail/n-a

### Category C — Working tree / Git hygiene (weight: 10)
- C1. Working tree clean (or WIP documented in WORK_IN_PROGRESS.md or equivalent) — pass/fail
- C2. No detached HEAD / no orphaned branches with unique work — pass/fail
- C3. Last 5 commits have meaningful messages (not "wip", "fix", "asdf") — pass/fail
- C4. No force-pushed history in last 7 days unless documented in audit trail — pass/fail

### Category D — Dependencies (weight: 15)
- D1. Lockfile in sync with manifest — pass/fail
- D2. No CRITICAL or HIGH severity vulnerabilities (per repo's scanner) — pass/fail
- D3. Dependencies have known maintainers / are not abandoned (heuristic: last commit on dependency repo within 12 months) — pass/fail/n-a
- D4. Direct dependency count is documented; new direct deps added in last 30 days are justified — pass/fail/n-a

### Category E — Documentation (weight: 10)
- E1. README exists and accurately describes the project's current state — pass/fail
- E2. Docs do not reference removed APIs / deleted files — pass/fail
- E3. SETUP / INSTALL instructions actually work on a fresh clone — pass/fail (manual or automated)
- E4. CHANGELOG (if present) reflects last release — pass/fail/n-a

### Category F — CI / Tooling (weight: 10)
- F1. CI is green on the default branch — pass/fail/n-a
- F2. No CI checks are disabled / required-but-skipped — pass/fail/n-a
- F3. Pre-commit hooks (if used) pass on a clean test run — pass/fail/n-a

### Category G — Security / Secrets (weight: 10)
- G1. No secrets in working tree (run secrets scanner) — pass/fail
- G2. No secrets in last 30 days of commits (run history scanner) — pass/fail
- G3. `.env` / `.env.local` / similar are gitignored and not committed — pass/fail
- G4. Sensitive credentials referenced in docs use placeholders, not real values — pass/fail

### Category H — Governance state (weight: 5)
- H1. Manifest exists and is valid — pass/fail
- H2. Audit trail exists and is non-empty for last 30 days of activity — pass/fail
- H3. Any open `freeze` is justified (has freeze declaration with reason) — pass/fail/n-a
- H4. CODEOWNERS (if used) covers all changed paths — pass/fail/n-a

## Scoring

Each category produces a **category score** = (passed items / applicable items) × 100. `n-a` items don't count toward applicable items.

Final repo-health score = weighted sum of category scores / total weight, rounded to integer 0–100.

```
final_score = round(
  sum(category_score[i] × category_weight[i]) / sum(category_weight[i])
)
```

Total weights (when all applicable): 25 + 15 + 10 + 15 + 10 + 10 + 10 + 5 = 100.

## Verdict mapping

| Score | Tier | Meaning |
|---|---|---|
| 90–100 | EXCELLENT | Healthy. Safe to enter HIGH-risk modes (deploy-prep, extraction-prep, governance-transition). |
| 75–89 | GOOD | Healthy with minor issues. Safe to stabilize / pause / handoff. HIGH-risk modes need explicit acknowledgment of issues. |
| 50–74 | FAIR | Issues present. Recommend stabilize before HIGH-risk modes. |
| 25–49 | POOR | Significant issues. Stabilize is the next mode; do not enter HIGH-risk. |
| 0–24 | CRITICAL | Likely broken. Recovery may be needed; do not enter HIGH-risk under any circumstances. |

**Hard veto:** Regardless of score, if any of these is failing, tier drops to at least FAIR with a flag:
- A1 (test command exits 0) → tier ≤ FAIR
- D2 (no CRITICAL/HIGH vulns) → tier ≤ FAIR
- G1 or G2 (secrets in tree or history) → tier ≤ POOR

## Output format

```markdown
## Repo health: [SCORE]/100 — [TIER]

**Commit audited:** [hash] (branch: [branch])
**Date:** [ISO-8601]
**Manifest mode:** [mode]

### Category breakdown
- Tests (25): [score]/100 — [pass count]/[applicable count] items
- Lint / Style / Types (15): [score]/100
- Working tree / Git (10): [score]/100
- Dependencies (15): [score]/100
- Documentation (10): [score]/100
- CI / Tooling (10): [score]/100
- Security / Secrets (10): [score]/100
- Governance state (5): [score]/100

### Failed items
- [category-id] [item-id]: [item description] — [specific failure]
- ...

### Veto flags (if any)
- [flag] → tier capped at [tier]

### What this rubric does NOT check
- Performance characteristics (runtime, memory, bundle size)
- Architectural fit (whether the design is right for the use case)
- User experience / UX correctness
- Business-logic correctness beyond what tests cover
- Long-term maintainability heuristics (code smell, complexity metrics)
```

## Common false-positives / false-negatives

- **False-negative on test coverage:** A repo with 100% coverage and 100% mocked tests can score EXCELLENT but be functionally broken. Coverage is a proxy, not a guarantee.
- **False-positive on D3 (abandoned deps):** "Last commit > 12 months" is a heuristic; some healthy mature deps have low commit cadence.
- **False-positive on E3 (setup works):** Hard to fully automate; sometimes "works on my machine."
- **False-negative on H1 (manifest exists):** A repo without this skill installed scores 0 on H1 but may otherwise be perfectly healthy. H1 is governance-specific, hence the low weight (5).
