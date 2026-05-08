# Codex Static Review Prompt Template

Use this template to generate Codex review tasks from Claude's audit findings.
Fill in the bracketed sections from the audit report.

---

## Template

```
# Codex Static Review Task — AccentOS [AREA]

## Repo Context

AccentOS is an internal operating system for Accent Lighting.
- Deployed on Cloudflare Pages
- Backend: Supabase Postgres
- Frontend: index.html (monolith, currently [SIZE_KB]KB) + /js/ modules
- Module registry: window.AccentOS.modules
- Worker/API: worker/anthropic-proxy.js

## Files to Review

[LIST FILES WITH PATHS AND BRIEF REASON]

Example:
- worker/anthropic-proxy.js — Worker proxy, suspected security gaps
- js/vendor_score_import.js — Vendor import logic, potential direct Supabase writes
- index.html lines [START–END] — [Module Name] section

## Review Objective

[SPECIFIC GOAL — e.g., "Find concrete security and runtime risks in the Worker proxy."]
[Be specific. Not "review everything" but "verify origin validation, rate limiting, and
body size enforcement."]

Do NOT:
- Refactor broadly
- Change unrelated files
- Remove existing functionality
- Introduce new dependencies

## Hard Rules for This Review

1. Do not change files not listed above
2. Do not remove existing functionality
3. Do not expose service role keys or any secrets
4. Prefer minimal, targeted patches
5. Flag anything you're uncertain about rather than guessing

## Specific Patterns to Check

[INSERT PATTERNS FROM SCANNER OUTPUT OR CLAUDE FINDINGS]

Example:
- Check if `Access-Control-Allow-Origin: *` is used → flag as Critical
- Check if API key is read from client request headers → flag as Critical  
- Check for body size enforcement → flag if absent
- Check for rate limiting → flag if absent
- Check for .insert()/.update()/.delete() outside write gateway → flag as High

## Output Required

1. **Findings table**: | File | Line | Severity | Pattern | Description |
2. **Suggested patch plan**: For each Critical/High finding, exact suggested change
3. **Tests/smoke checks**: What to verify after patching
4. **Residual risks**: Risks that remain after recommended patches
5. **What NOT to change**: Explicit list of code that should be preserved as-is
```

---

## Pre-Filled Example for Worker Security Review

```
# Codex Static Review Task — AccentOS Worker Proxy Security

## Repo Context
AccentOS is deployed on Cloudflare Pages. The Anthropic proxy Worker
(worker/anthropic-proxy.js) mediates all Claude API calls from the UI.
It must not expose secrets and must validate origin, method, body size, timeout, and rate limits.

## Files to Review
- worker/anthropic-proxy.js — sole Worker proxy file

## Review Objective
Find concrete security and runtime risks in the Worker proxy. Specifically:
1. Is the API key being read from client request headers? (Should come from env.ANTHROPIC_API_KEY)
2. Is CORS wildcard (*) used? (Should be allowlisted origins)
3. Is there a body size limit?
4. Is there a timeout on the upstream fetch?
5. Is there rate limiting?
6. Are raw upstream errors returned to the browser?

## Hard Rules
1. Do not change any files except worker/anthropic-proxy.js
2. Do not remove the existing method check (POST-only)
3. Do not expose env.ANTHROPIC_API_KEY in any response
4. Prefer minimal patches — fix the gaps, don't rewrite

## Output Required
1. Findings table
2. Suggested patch for each Critical/High finding
3. Smoke test checklist
4. Residual risks after patching
```
