# Security Review Prompt

Comprehensive security-focused audit covering Worker, Supabase, and client-side risks.

---

## Prompt

```
ACCENTOS SECURITY AUDIT

You are performing a security audit of AccentOS. Focus on exploitable risks,
data exposure, and unauthorized access vectors.

SCOPE:
- Cloudflare Worker proxy (worker/anthropic-proxy.js)
- Supabase RLS policies (sql/*.sql)
- Client-side secret exposure (index.html, js/*.js)
- Write gateway enforcement
- API key handling

SCANNER DATA:
[INSERT scan_worker_security.js OUTPUT]
[INSERT scan_sql_migrations.js OUTPUT]
[INSERT scan_accentos_patterns.js OUTPUT]

SECURITY RULES TO AUDIT:

WORKER / API:
- No wildcard CORS (Access-Control-Allow-Origin: *)
- No client-provided API keys forwarded to upstream services
- Origin must be validated against an allowlist
- Body size must be capped (≤1MB)
- Upstream fetch must have a timeout (≤30s)
- Rate limiting must exist (≥30 req/min/IP)
- Errors must be sanitized — no raw upstream bodies
- All secrets via env.* (Wrangler secrets), never request headers

SUPABASE:
- All tables must have RLS enabled
- No anon INSERT/UPDATE/DELETE policies
- Service role key never in client code
- Write gateway (dbInsert/dbUpdate/dbDelete) enforced
- No raw .insert()/.update()/.delete()/.upsert() from UI

CLIENT:
- No secrets (API keys, service role keys) in index.html or js/ files
- No supabase service_role key client-side
- Supabase anon key only (expected in client)

AUDIT TASKS:
1. Identify every Critical security finding
2. Identify every High security finding
3. Estimate exploitability for each (Easy / Moderate / Hard)
4. Assess blast radius (what data/service is exposed if exploited)
5. Rank by combined severity × exploitability
6. Generate Codex patch prompts for each Critical/High
7. Generate smoke-test checklist for post-patch verification

OUTPUT FORMAT:
## Security Health Score: [X]/100
## Critical Vulnerabilities (must fix before next deploy)
## High Vulnerabilities (fix within current sprint)
## Medium Risks (plan fix within 30 days)
## Low Risks (monitor)
## Codex Patch Prompts
## Post-Patch Smoke Test Checklist
## Residual Risks After Recommended Fixes
```
