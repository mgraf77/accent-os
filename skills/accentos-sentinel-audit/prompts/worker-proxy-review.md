# Worker Proxy Review Prompt

Focused audit of Cloudflare Worker security. Run when Worker code changes or weekly.

---

## Prompt

```
ACCENTOS WORKER PROXY SECURITY REVIEW

You are auditing the AccentOS Cloudflare Worker proxy for security vulnerabilities
and operational risks.

FILE TO REVIEW: worker/anthropic-proxy.js
WRANGLER CONFIG: wrangler.toml

SCANNER DATA:
[INSERT scan_worker_security.js OUTPUT]

KNOWN ISSUES FROM PRIOR AUDITS:
[INSERT RECURRING FINDINGS FROM history/ IF AVAILABLE]

REQUIRED SECURITY CONTROLS (audit each one):

1. ORIGIN VALIDATION
   - Is Access-Control-Allow-Origin set to * ? → CRITICAL if yes
   - Is there an explicit origin allowlist? → HIGH if absent
   - Does the OPTIONS preflight echo a validated origin? → MEDIUM if not

2. API KEY HANDLING
   - Is the API key read from request.headers? → CRITICAL if yes
   - Does the Worker read the key from env.ANTHROPIC_API_KEY? → Required
   - Could a caller use this proxy with an arbitrary API key? → CRITICAL if yes

3. BODY SIZE
   - Is there a content-length check? → HIGH if absent
   - Is there a max body size of ≤1MB? → HIGH if absent

4. TIMEOUT
   - Is there an AbortController or equivalent timeout? → HIGH if absent
   - Is timeout ≤30s for the upstream fetch? → HIGH if longer

5. RATE LIMITING
   - Does rate limiting logic exist? → HIGH if absent
   - Does it use CF-Connecting-IP? → MEDIUM if not
   - Is the baseline ≥30 req/min/IP? → flag if weaker

6. ERROR HANDLING
   - Are raw upstream error bodies returned? → HIGH if yes
   - Are internal errors sanitized? → HIGH if stack traces can leak
   - Does the Worker return structured { error: "..." } only? → Required

7. METHOD RESTRICTION
   - Is non-POST rejected with 405? → Present (confirm not regressed)

8. WRANGLER CONFIG
   - Are any secrets in wrangler.toml [vars]? → CRITICAL if yes
   - Is compatibility_date set? → MEDIUM if absent
   - Are routes appropriate? → review for over-broad exposure

AUDIT OUTPUT FORMAT:
## Worker Security Score: [X]/100
## Critical Vulnerabilities
## High Vulnerabilities  
## Medium Risks
## Recommended Minimal Patch
## Wrangler Config Issues
## Post-Deploy Smoke Test
## Residual Risks
```

---

## Worker Smoke Test Checklist

After patching the Worker, verify:

- [ ] `curl -X POST [worker-url]` with no Origin header → returns 403 or blocked
- [ ] `curl -X GET [worker-url]` → returns 405
- [ ] `curl -X POST [worker-url] -d [10MB payload]` → returns 413
- [ ] Valid origin + valid request → returns proxied Anthropic response
- [ ] No x-api-key or Anthropic key visible in any response headers or body
- [ ] 35+ rapid requests from same IP → rate limited
- [ ] Upstream timeout simulation → returns 504, not raw timeout error
