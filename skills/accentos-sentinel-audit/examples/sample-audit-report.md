# AccentOS Sentinel Audit Report

## Audit Metadata

| Field | Value |
|---|---|
| Date | 2026-05-08 |
| Repo | github.com/mgraf77/accent-os |
| Branch | claude/accentos-sentinel-audit-Q9E8o |
| Commit | 969de17 |
| Audit Type | Full (Automated) |
| Auditor | accentos-sentinel-audit v1.0.0 |
| Tools Used | collect_repo_metrics, scan_accentos_patterns, scan_sql_migrations, scan_worker_security, scan_ai_patch_boundaries |
| Prior Audit | 2026-05-08-full-audit.md |
| index.html Size | 718KB (🟡 WARNING) |

---

## Executive Summary

| Field | Value |
|---|---|
| **Overall Health Score** | **57/100** |
| **Go/No-Go Recommendation** | **NO-GO** |
| **Biggest Risk** | CORS Access-Control-Allow-Origin: * — allows any origin |
| **Fastest High-ROI Fix** | Fix Worker API key relay (SEC-001) — 30 min fix, eliminates open relay |
| **Feature Work Recommendation** | Stop feature work — stabilize first |

> ⚠️ **10 Critical finding(s) detected — recommend fixing before next production deployment.**

---

## Health Scorecard

| Category | Score | Status | Key Issue |
|---|---:|---|---|
| Architecture Integrity (20%) | 17/20 | ✓ Good | Clean |
| Supabase / Data Integrity (20%) | 5/20 | ✗ Risk | 7 migration(s) with critical issues |
| Security / API Safety (20%) | 0/20 | ✗ Risk | Worker API key relay vulnerability |
| AI Patch Maintainability (15%) | 13/15 | ✓ Good | 2 file(s) need patch markers |
| Product Logic Integrity (15%) | 15/15 | ✓ Good | No direct write violations detected |
| Documentation / Employee Readiness (10%) | 7/10 | ⚠ Warn | Manual Claude audit required for accurate score |
| **Total** | **57/100** | ✗ Risk | |

---

## Critical Findings


| ID | Area | Finding | Business Impact | Owner |
|---|---|---|---|---|
| SEC-001 | Security/Worker | CORS Access-Control-Allow-Origin: * — allows any origin | High | Codex |
| SEC-002 | Security/Worker | No origin allowlist validation — any caller can use this Worker | High | Codex |
| SEC-003 | Security/Worker | API key read from client request headers and forwarded to upstream — open relay  | High | Codex |
| DB-004 | Supabase/RLS | Table(s) created without RLS: products | High | Claude |
| DB-005 | Supabase/RLS | Table(s) created without RLS: pipeline_deals_stage_history | High | Claude |
| DB-006 | Supabase/RLS | Table(s) created without RLS: invoices, payments | High | Claude |
| DB-007 | Supabase/RLS | Table(s) created without RLS: service_tickets | High | Claude |
| DB-008 | Supabase/RLS | Table(s) created without RLS: survey_responses | High | Claude |
| DB-009 | Supabase/RLS | Table(s) created without RLS: recurring_contracts | High | Claude |
| DB-010 | Supabase/RLS | Table(s) created without RLS: for, if, vendors | High | Claude |


---

## High Findings


| ID | Area | Finding | Owner |
|---|---|---|---|
| SEC-004 | Security/Worker | No body size limit — vulnerable to oversized request attacks | Codex |
| SEC-005 | Security/Worker | No timeout on upstream fetch — requests can hang indefinitely | Codex |
| SEC-006 | Security/Worker | No rate limiting — vulnerable to abuse and cost amplification | Codex |
| SEC-007 | Security/Worker | Raw upstream error bodies returned to browser — may leak sensitive info | Codex |
| PATCH-005 | AI Patching | Large file index.html (718KB) has no START/END patch markers | Claude |


---

## Detailed Findings


### SEC-001: CORS Access-Control-Allow-Origin: * — allows any origin

**Severity:** CRITICAL
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `WILDCARD_CORS`
**Recommended Owner:** Codex

**Why it matters:** Any website can make authenticated requests to this Worker proxy. This enables CSRF-style attacks against the Anthropic API through AccentOS's credentials.

**Recommended Fix:** Replace `'Access-Control-Allow-Origin': '*'` with an origin allowlist check:
```js
const ALLOWED_ORIGINS = ['https://your-domain.pages.dev', 'https://accentlighting.com'];
const origin = request.headers.get('Origin') || '';
const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
if (!allowedOrigin) return new Response('Forbidden', { status: 403 });
```

**Acceptance Criteria:**
- [ ] Requests from unlisted origins receive 403
- [ ] Requests from listed origins receive correct CORS headers
- [ ] OPTIONS preflight respects the allowlist

---

### SEC-002: No origin allowlist validation — any caller can use this Wor

**Severity:** CRITICAL
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `NO_ORIGIN_VALIDATION`
**Recommended Owner:** Codex

See rules/ files for detailed remediation guidance for code `NO_ORIGIN_VALIDATION`.

---

### SEC-003: API key read from client request headers and forwarded to up

**Severity:** CRITICAL
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `API_KEY_FROM_CLIENT`
**Recommended Owner:** Codex

**Why it matters:** This Worker is an open relay. Anyone who discovers the Worker URL can use it to proxy arbitrary Anthropic API keys — including credentials from other organizations. Anthropic could rate-limit or ban AccentOS's IP. There is also no way to revoke this access without changing the Worker URL.

**Recommended Fix:** Replace the client key read with env key:
```js
// Remove:
const apiKey = request.headers.get('x-api-key');

// Replace with:
const apiKey = env.ANTHROPIC_API_KEY;
if (!apiKey) return new Response(JSON.stringify({ error: 'Worker misconfigured' }), { status: 500 });
```

**Acceptance Criteria:**
- [ ] x-api-key header from client is ignored
- [ ] env.ANTHROPIC_API_KEY is used for upstream calls
- [ ] Requests work end-to-end without client providing a key

---

### DB-004: Table(s) created without RLS: products

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M31_products_cost.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### DB-005: Table(s) created without RLS: pipeline_deals_stage_history

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M32_deals_stage_history.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### DB-006: Table(s) created without RLS: invoices, payments

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M34_invoices_payments.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### DB-007: Table(s) created without RLS: service_tickets

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M36_service_tickets.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### DB-008: Table(s) created without RLS: survey_responses

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M37_survey_responses.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### DB-009: Table(s) created without RLS: recurring_contracts

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M38_recurring_contracts.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### DB-010: Table(s) created without RLS: for, if, vendors

**Severity:** CRITICAL
**Area:** Supabase/RLS
**File:** `sql/M39_vendors_verify.sql`
**Code:** `MISSING_RLS_ENABLE`
**Recommended Owner:** Claude

**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and appropriate policies to the relevant migration file.

---

### SEC-004: No body size limit — vulnerable to oversized request attacks

**Severity:** HIGH
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `NO_BODY_SIZE_LIMIT`
**Recommended Owner:** Codex

**Why it matters:** An attacker can send multi-gigabyte requests, potentially exhausting Cloudflare Worker CPU time and memory, causing cost amplification or DoS.

**Recommended Fix:**
```js
const MAX_BODY = 1_000_000;
const contentLength = parseInt(request.headers.get('content-length') || '0');
if (contentLength > MAX_BODY) {
  return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
}
```

---

### SEC-005: No timeout on upstream fetch — requests can hang indefinitel

**Severity:** HIGH
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `NO_UPSTREAM_TIMEOUT`
**Recommended Owner:** Codex

**Why it matters:** If the Anthropic API is slow or unresponsive, Worker requests hang indefinitely, consuming Cloudflare CPU and blocking legitimate users.

**Recommended Fix:**
```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
try {
  const upstream = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(timeout);
} catch (err) {
  clearTimeout(timeout);
  if (err.name === 'AbortError') return new Response(JSON.stringify({ error: 'Upstream timeout' }), { status: 504 });
  throw err;
}
```

---

### SEC-006: No rate limiting — vulnerable to abuse and cost amplificatio

**Severity:** HIGH
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `NO_RATE_LIMITING`
**Recommended Owner:** Codex

**Why it matters:** No rate limiting means the Worker can be used to hammer the Anthropic API, generating large bills and potentially getting AccentOS's API key rate-limited or banned.

**Recommended Fix:** Use Cloudflare KV for a sliding window rate limiter:
```js
const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
// Implement 30 req/min/IP using KV with TTL
```

---

### SEC-007: Raw upstream error bodies returned to browser — may leak sen

**Severity:** HIGH
**Area:** Security/Worker
**File:** `worker/anthropic-proxy.js`
**Code:** `RAW_UPSTREAM_ERRORS`
**Recommended Owner:** Codex

See rules/ files for detailed remediation guidance for code `RAW_UPSTREAM_ERRORS`.

---

### PATCH-005: Large file index.html (718KB) has no START/END patch markers

**Severity:** HIGH
**Area:** AI Patching
**File:** `index.html`
**Code:** `MISSING_MARKERS`
**Recommended Owner:** Claude

See rules/ files for detailed remediation guidance for code `MISSING_MARKERS`.


---

## Scanner Summary

### Repo Metrics
- index.html: **718KB** (🟡 WARNING)
- JS modules: 37 files
- SQL migrations: 25 files
- Worker files: 1 files
- Detected modules: none detected
- Patch markers: 0 START / 0 END (matched)
- TODO/FIXME count: 1
- Direct Supabase writes: 0

### SQL Migration Health
- Migrations scanned: 25
- Tables without RLS: 7
- Non-idempotent migrations: 1
- Migrations without indexes: 1

### Worker Security
- Worker files scanned: 1
- Critical issues: 3
- High issues: 4
- Score: N/A/100

### AI Patch Boundaries
- Files needing markers: 2
- Files with unmatched markers: 0
- AI patchability score: 88/100

---

## Codex Delegation Prompts

### Codex Task: Harden Worker Proxy Security


Copy this into a Codex session:

```
# Codex Fix Plan — AccentOS Worker Proxy (SEC-001 through SEC-003)

Review and patch worker/anthropic-proxy.js for the following issues:
- WILDCARD_CORS: CORS Access-Control-Allow-Origin: * — allows any origin
- NO_ORIGIN_VALIDATION: No origin allowlist validation — any caller can use this Worker
- API_KEY_FROM_CLIENT: API key read from client request headers and forwarded to upstream — open relay vulnerability
- NO_BODY_SIZE_LIMIT: No body size limit — vulnerable to oversized request attacks
- NO_UPSTREAM_TIMEOUT: No timeout on upstream fetch — requests can hang indefinitely
- NO_RATE_LIMITING: No rate limiting — vulnerable to abuse and cost amplification
- RAW_UPSTREAM_ERRORS: Raw upstream error bodies returned to browser — may leak sensitive info

Requirements:
1. API key must come from env.ANTHROPIC_API_KEY, NOT from request headers
2. CORS must use an origin allowlist, NOT Access-Control-Allow-Origin: *
3. Add body size limit (max 1MB)
4. Add AbortController timeout (30s max)
5. Add rate limiting (30 req/min/IP using CF-Connecting-IP)
6. Sanitize all error responses — no raw upstream bodies

Hard constraints:
- Only change worker/anthropic-proxy.js
- Preserve POST-only method restriction
- Preserve arrayBuffer body passthrough
- Do not expose any secrets in responses

Return: complete patched file + list of every changed line + smoke test checklist
```


---

## Changelog Entry

Paste into SESSION_LOG.md:

```
### 2026-05-08 — Sentinel Audit (Automated Full Scan)

**Health Score:** 57/100
**Auditor:** accentos-sentinel-audit v1.0.0
**Branch:** claude/accentos-sentinel-audit-Q9E8o @ 969de17

Critical findings: 10
High findings: 5

- SEC-001: CORS Access-Control-Allow-Origin: * — allows any origin
- SEC-002: No origin allowlist validation — any caller can use this Worker
- SEC-003: API key read from client request headers and forwarded to upstream — open relay vulnerability
- DB-004: Table(s) created without RLS: products
- DB-005: Table(s) created without RLS: pipeline_deals_stage_history
- DB-006: Table(s) created without RLS: invoices, payments
- DB-007: Table(s) created without RLS: service_tickets
- DB-008: Table(s) created without RLS: survey_responses
- DB-009: Table(s) created without RLS: recurring_contracts
- DB-010: Table(s) created without RLS: for, if, vendors

Next audit: Before next production deployment
```

---

## Next Audit Recommendation

- **Suggested cadence:** Before next deploy (due to 10 critical findings) + weekly security scan
- **Suggested scope:** Focus on Worker remediation + verify write gateway coverage
- **Watchlist:**
  - index.html size (currently 718KB — monitor approach to 750KB threshold)
  - Worker API key handling (confirmed relay vulnerability)
  - Supabase direct write patterns
  - Patch marker coverage for index.html sections

---

## Skill Improvement Recommendations

| Improvement | Reason | Priority | Path |
|---|---|---|---|
| Add Claude architecture audit step | Automated scanners miss logical architecture drift | High | Add to SKILL.md Step 4 invocation |
| Add vendor scoring category count check | Currently no scan counts scoring categories vs expected 14 | High | Add to scan_accentos_patterns.js |
| Add git log scan for secret exposure | Service role key may have been committed and removed | High | Add to scan_worker_security.js |
| Track health score trend over time | Need delta vs prior to surface regression | Medium | Add score history to generate_audit_report.js |
| Add smoke test automation | Manual smoke tests are easy to skip | Medium | Add smoke_test_runner.js script |
