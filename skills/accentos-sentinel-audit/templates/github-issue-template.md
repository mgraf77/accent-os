# GitHub Issue Template

Use for each Critical or High finding that warrants a tracked GitHub issue.

---

## Template

```markdown
## Problem

[1–3 sentences. What is broken or at risk? Be specific enough that someone unfamiliar
with the audit can understand the issue.]

## Evidence

[Paste the relevant code snippet, scanner output, or finding detail.
Include file path and line number if known.]

```[language]
// paste evidence here
```

## Risk

**Severity:** [Critical / High / Medium]
**Blast Radius:** [System / Module / File / Local]
**Business Impact:** [What could go wrong in production?]
**Exploitability (if security):** [Easy / Moderate / Hard]

## Recommended Fix

[Specific fix. Not "investigate this" but "change X to Y in file Z."]

Step-by-step if complex:
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Acceptance Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Smoke test or regression check]

## Suggested Owner

[Claude / Codex / Human / combination — explain if not obvious]

## Related Audit

AccentOS Sentinel Audit — [DATE] — Finding [FINDING-ID]
```

---

## Label Reference

Apply the appropriate labels when creating GitHub issues:

| Label | When to Use |
|---|---|
| `sentinel-audit` | Always — marks this as audit-originated |
| `security` | Worker, API, RLS, secret exposure |
| `architecture` | Module contracts, file size, global state |
| `supabase` | RLS, migrations, write gateway, schema |
| `worker` | Cloudflare Worker proxy issues |
| `documentation` | Doc drift, missing help tabs |
| `vendor-intelligence` | Vendor module product logic |
| `ai-patching` | Patch boundaries, AI maintainability |
| `technical-debt` | Accumulating quality issues |
| `integration` | data52, price book, feed issues |

---

## Priority Label Convention

| Label | Meaning |
|---|---|
| `p0-immediate` | Fix before next deploy |
| `p1-sprint` | Fix in current sprint |
| `p2-next-sprint` | Plan for next sprint |
| `p3-backlog` | Add to backlog |
