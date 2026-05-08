# Finding Template

Use this block for each finding in a Sentinel Audit report.

---

```markdown
### [FINDING-ID]: [Finding Title]

**Severity:** [Critical / High / Medium / Low]
**Confidence:** [High / Medium / Low]
**Blast Radius:** [System / Module / File / Local]
**Business Impact:** [High / Medium / Low]
**Fix Complexity:** [High / Medium / Low]
**Recommended Owner:** [Claude / Codex / Human / Static Tool]
**Status:** [New / Recurring (first seen: YYYY-MM-DD) / Resolved]
**Category:** [Architecture / Security / Supabase / AI-Patching / Product-Logic / Docs]

**Affected Files:**
- `[file path]:[line range]` — [why relevant]

**Evidence:**
```[code or scanner output snippet]```

**Why It Matters:**
[2–3 sentences. Concrete risk. What could go wrong? What data or system is at risk?]

**Recommended Fix:**
[Specific. What to change, how, where. Not "improve X" but "replace line N with Y".]

**Acceptance Criteria:**
- [ ] [Criterion 1 — testable, specific]
- [ ] [Criterion 2 — testable, specific]

**Effort Estimate:** [Hours: <1 / 1–4 / 4–8 / 1–2 days / >2 days]
```

---

## Finding ID Convention

Format: `[CATEGORY]-[NNN]`

| Category | Prefix |
|---|---|
| Architecture | ARCH |
| Security/Worker | SEC |
| Supabase/RLS | DB |
| AI Patch | PATCH |
| Product Logic | PROD |
| Documentation | DOC |
| Integration | INT |

Examples:
- `SEC-001` — First security finding
- `DB-003` — Third database/Supabase finding
- `ARCH-002` — Second architecture finding

---

## Blast Radius Definitions

| Level | Meaning |
|---|---|
| **System** | Affects all users, all modules, or production data at scale |
| **Module** | Affects one feature module and its users |
| **File** | Affects behavior in a single file |
| **Local** | Affects a narrow code path or edge case |

---

## Priority Formula (plain English)

| Priority | Meaning |
|---|---|
| **P0 — Immediate** | Critical severity + High business impact + High confidence |
| **P1 — This sprint** | High severity OR Critical + medium confidence |
| **P2 — Next sprint** | Medium severity + High/Medium business impact |
| **P3 — Backlog** | Low severity or Low confidence |
| **Monitor** | Low severity + Low business impact + low confidence |
