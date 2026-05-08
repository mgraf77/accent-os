# AccentOS Sentinel Audit Report

## Audit Metadata

| Field | Value |
|---|---|
| Date | [YYYY-MM-DD] |
| Repo | github.com/mgraf77/accent-os |
| Branch | [BRANCH_NAME] |
| Commit | [SHORT_SHA] |
| Audit Type | [Full / Security / Architecture / Vendor / Integration / Docs] |
| Auditor | Claude (accentos-sentinel-audit v[VERSION]) |
| Tools Used | Scanner scripts + Claude + [Codex if used] |
| Prior Audit | [DATE or "None"] |
| index.html Size | [SIZE_KB]KB ([STATUS: OK/Warning/High/Critical]) |

---

## Executive Summary

| Field | Value |
|---|---|
| **Overall Health Score** | [X]/100 |
| **Go/No-Go Recommendation** | [GO / NO-GO / CONDITIONAL GO] |
| **Biggest Risk** | [One sentence] |
| **Fastest High-ROI Fix** | [One sentence] |
| **Feature Work Recommendation** | [Safe to continue / Remediate first / Stop and stabilize] |

**Summary paragraph:**
[2–4 sentences. What is the current state of AccentOS health? What changed since last audit? What is the most urgent action?]

---

## Health Scorecard

| Category | Score | Status | Key Issue |
|---|---:|---|---|
| Architecture Integrity (20%) | [X]/20 | [✓ Good / ⚠ Warn / ✗ Risk] | [one-liner] |
| Supabase / Data Integrity (20%) | [X]/20 | [✓ Good / ⚠ Warn / ✗ Risk] | [one-liner] |
| Security / API Safety (20%) | [X]/20 | [✓ Good / ⚠ Warn / ✗ Risk] | [one-liner] |
| AI Patch Maintainability (15%) | [X]/15 | [✓ Good / ⚠ Warn / ✗ Risk] | [one-liner] |
| Product Logic Integrity (15%) | [X]/15 | [✓ Good / ⚠ Warn / ✗ Risk] | [one-liner] |
| Documentation / Employee Readiness (10%) | [X]/10 | [✓ Good / ⚠ Warn / ✗ Risk] | [one-liner] |
| **Total** | **[X]/100** | | |

---

## Critical Findings

| ID | Area | Finding | Business Impact | Recommended Owner |
|---|---|---|---|---|
| [ID] | [Area] | [One-line description] | [High/Med/Low] | [Claude/Codex/Human] |

---

## Detailed Findings

### [FINDING-ID]: [Finding Title]

**Severity:** [Critical / High / Medium / Low]
**Confidence:** [High / Medium / Low]
**Blast Radius:** [System / Module / File / Local]
**Business Impact:** [High / Medium / Low]
**Fix Complexity:** [High / Medium / Low]
**Recommended Owner:** [Claude / Codex / Human / Static Tool]
**Status:** [New / Recurring / Resolved since last audit]

**Affected Files:**
- `[file path]` — [why it matters]

**Evidence:**
```
[Paste relevant code or scanner output]
```

**Why It Matters:**
[2–3 sentences explaining the real-world risk]

**Recommended Fix:**
[Specific, actionable. Not "improve this" but "change line X to Y"]

**Acceptance Criteria:**
- [ ] [Verifiable criterion 1]
- [ ] [Verifiable criterion 2]

---

## Recurring Findings (from prior audits)

| Finding ID | First Seen | Times Seen | Status | Notes |
|---|---|---|---|---|
| [ID] | [DATE] | [N] | [Unresolved / In Progress] | [note] |

---

## Codex Delegation Prompts

Copy these directly into a Codex session.

### Codex Task 1: [Task Name]

[PASTE FULL CODEX PROMPT — use codex-static-review.md or codex-fix-plan.md template]

---

## Claude Follow-Up Tasks

These tasks require Claude's judgment, not just code scanning.

### Claude Task 1: [Task Name]

[PASTE FULL CLAUDE PROMPT — use relevant prompt from prompts/ directory]

---

## GitHub Issues to Create

### Issue 1: [Title]

**Labels:** `sentinel-audit`, `[area label]`

**Body:**
[PASTE github-issue-template.md filled in for this finding]

---

## Changelog Entry

Paste this into `SESSION_LOG.md`:

```
### [DATE] — Sentinel Audit [SCOPE]

**Health Score:** [X]/100 ([DELTA from prior] vs prior audit on [DATE])
**Auditor:** accentos-sentinel-audit v[VERSION]

Critical:
- [FINDING-ID]: [One-line summary]

High:
- [FINDING-ID]: [One-line summary]

Resolved since last audit:
- [FINDING-ID]: [One-line summary]

Next audit recommended: [DATE or TRIGGER]
```

---

## Next Audit Recommendation

**Suggested cadence:** [e.g., "Weekly security scan, full audit in 30 days"]
**Suggested scope:** [e.g., "Focus on Worker remediation verification + Supabase write gateway"]
**Watchlist for next audit:**
- [Item 1]
- [Item 2]

---

## Skill Improvement Recommendations

| Improvement | Reason | Priority | Implementation Path |
|---|---|---|---|
| [Improvement] | [Why it matters] | [High/Med/Low] | [What to add/change in the skill] |
