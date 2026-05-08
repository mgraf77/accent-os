# Changelog Entry Template

---

## Audit Report Entry

Paste into `SESSION_LOG.md` after each audit:

```markdown
### [YYYY-MM-DD] — Sentinel Audit ([SCOPE])

**Health Score:** [X]/100 ([DELTA: +N or -N pts vs [PRIOR_DATE]])
**Auditor:** accentos-sentinel-audit v[VERSION]
**Branch:** [BRANCH]
**Commit:** [SHORT_SHA]

#### Findings Summary

| Severity | Count | vs Prior |
|---|---:|---|
| Critical | [N] | [+N / -N / same] |
| High | [N] | [+N / -N / same] |
| Medium | [N] | [+N / -N / same] |
| Low | [N] | [+N / -N / same] |

#### Critical Findings
- **[FINDING-ID]**: [One-line description] — Owner: [Owner]

#### Resolved Since Last Audit
- **[FINDING-ID]**: [One-line description] — resolved [DATE]

#### Top Recommendation
[One-sentence most important action item]

#### Next Audit
[DATE or TRIGGER — e.g., "Before next deploy" or "Weekly — due [DATE]"]
```

---

## Remediation Commit Entry

When a finding is fixed, include in the commit message:

```
fix(sentinel): remediate [FINDING-ID] — [brief description]

Addresses finding from Sentinel Audit [DATE].
[FINDING-ID]: [What was wrong and what was changed]

Acceptance criteria verified:
- [criterion 1]
- [criterion 2]
```

---

## Skill Update Entry

When improving the skill itself:

```markdown
### [YYYY-MM-DD] — Sentinel Skill Update v[VERSION]

#### Improvements from audit self-review
- [Improvement 1]: [What changed in the skill]
- [Improvement 2]: [What changed in the skill]

#### New rules added
- [Rule description] in [rules/file.md]

#### Scanners updated
- [scan_*.js]: [What was added/fixed]

#### Prompts updated
- [prompt-file.md]: [What was tightened]
```
