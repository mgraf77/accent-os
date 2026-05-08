# Claude Architecture Audit Prompt

Use this prompt when running a Category A (Architecture Drift) audit.

---

## Prompt

```
ACCENTOS ARCHITECTURE AUDIT

You are performing a code architecture audit of AccentOS, an internal operating system
for Accent Lighting built on Cloudflare Pages with Supabase Postgres.

REPO CONTEXT:
- Primary frontend: index.html (current size: [INDEX_SIZE_KB]KB)
- JS modules: [JS_FILE_COUNT] files in /js/
- SQL migrations: [SQL_FILE_COUNT] files in /sql/
- Worker/API: worker/anthropic-proxy.js
- Module registry: window.AccentOS.modules

ARCHITECTURE RULES TO AUDIT AGAINST:
1. window.AccentOS.modules is the only module registry
2. All modules must expose { init(), destroy() }
3. Module state initializes in init(), is nulled in destroy()
4. No mutable global state outside window.AccentOS.modules
5. File size thresholds: Warning 500KB / High 750KB / Critical 900KB
6. Large sections (>100KB) require START/END patch boundary markers
7. No direct Supabase writes (.insert/.update/.delete/.upsert from UI)
8. Worker must validate origin, restrict methods, limit body size, rate limit, never expose secrets

AUDIT TASKS:
1. Assess overall architecture health
2. Identify module contract violations
3. Identify file size risks
4. Identify global state leaks
5. Identify missing patch boundary markers
6. Identify architecture drift from intended design
7. Rate each finding: Severity / Confidence / Blast Radius / Business Impact / Fix Complexity
8. Produce Architecture Health Score (0-100, 20% of total AccentOS Health Score)
9. Classify each finding as "Do Now / Do Later / Monitor"
10. Generate remediation recommendations ordered by priority

SCANNER DATA TO INCORPORATE:
[INSERT SCANNER JSON OUTPUT HERE]

REQUIRED OUTPUT FORMAT:
## Architecture Health Score: [X]/100
## Summary
## Critical Findings
## High Findings
## Medium Findings
## Low Findings
## Refactor Recommendations
## Do Now / Do Later / Monitor Classification
## Codex Task Delegation (code-level work only)
```

---

## Usage Notes

- Replace `[INDEX_SIZE_KB]`, `[JS_FILE_COUNT]`, `[SQL_FILE_COUNT]` with values from `collect_repo_metrics.js`
- Insert scanner JSON from `scan_accentos_patterns.js` before running
- Run this as a fresh Claude context, not appended to a work session
- Expect 15–30 minutes for a thorough architecture audit
