# Audit Report

<!--
Validate against: schemas/audit-report.schema.md
Run evaluator: evaluators/repo-health.md (produces score + tier used here)
-->

**Schema version:** 1
**Audited at:** [ISO-8601]
**Auditor:** [operator identity]
**Repo:** [repo name]
**Commit:** [hash] "[commit message]"
**Branch:** [branch]

---

## Repo-health summary

**Score:** [0–100]/100 — **[EXCELLENT | GOOD | FAIR | POOR | CRITICAL]**

### Category breakdown

- **Tests** (weight 25): [score]/100 — [pass]/[applicable] items pass
- **Lint / Style / Types** (weight 15): [score]/100
- **Working tree / Git** (weight 10): [score]/100
- **Dependencies** (weight 15): [score]/100
- **Documentation** (weight 10): [score]/100
- **CI / Tooling** (weight 10): [score]/100
- **Security / Secrets** (weight 10): [score]/100
- **Governance state** (weight 5): [score]/100

### Veto flags (if any)

- [flag-id]: [explanation; e.g. "D2 (no CRITICAL/HIGH vulns) failed → tier capped at FAIR"]

---

## Findings

<!-- Group by severity. Use F1, F2, ... IDs in numeric order across all severities. -->

### CRITICAL

<!-- Empty section is acceptable; mark "None." -->

**F[N]** [Severity: CRITICAL] [Category: test | lint | dep | sec | doc | git | ci | gov]
- Description: [what is wrong]
- Affected: [file paths or other locators]
- Remediation: [specific suggestion]
- Effort: [trivial | small | medium | large]

### HIGH

[Same structure as CRITICAL]

### MEDIUM

[Same structure]

### LOW

[Same structure]

---

## Drift report

<!-- What has changed since the last audit (or last release if no prior audit). -->

- **Code drift:** [N commits since [date/tag]; list meaningful changes]
- **Doc drift:** [list specific drift findings]
- **Dependency drift:** [N added, N updated, N removed; list significant ones]
- **Schema drift:** [if applicable; otherwise "None this period"]
- **Test drift:** [N added, N removed, N quarantined; list significant ones]

---

## Risk register

<!-- Risks identified during this audit. Reference findings (F#) where relevant. -->

- **R1** [Description] — Likelihood: [low|medium|high]. Impact: [low|medium|high]. Mitigation: [strategy or "see F#"]. Owner: [if assigned].
- **R2** [...]
- **R3** [...]

---

## Recommended next mode

**[mode]**

**Rationale:** [1-3 sentences justifying the recommendation; reference findings F# and risks R# as appropriate]

**Alternatives considered:**
- `[alternative-mode-1]` — [why not preferred]
- `[alternative-mode-2]` — [why not preferred]

**Risk tier of recommended transition:** [LOW | MEDIUM | HIGH]

---

## Recommended remediation actions

<!-- Ordered list of actions to be carried out in the next mode. Cross-reference findings. -->

1. [Action — addresses F#] — [effort]
2. [Action — addresses F#] — [effort]
3. [Action — addresses F#] — [effort]

---

## Limitations of this audit

<!-- Required: at least one limitation. Be honest. -->

- Did not [check / run / verify] [X] because [reason or "out of scope"]
- Did not [...]
- Did not [...]
