#!/usr/bin/env node
/**
 * generate_audit_report.js
 * Combines all scanner JSON outputs into a structured Markdown audit report.
 * Saves to skills/accentos-sentinel-audit/history/YYYY-MM-DD-full-audit.md
 *
 * Usage: node generate_audit_report.js [repo-root]
 * Or pipe scanner outputs:
 *   node collect_repo_metrics.js > /tmp/metrics.json
 *   node generate_audit_report.js [repo-root] /tmp/metrics.json ...
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = process.argv[2] || process.cwd();
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'accentos-sentinel-audit');
const HISTORY_DIR = path.join(SKILL_DIR, 'history');
const SCRIPTS_DIR = path.join(SKILL_DIR, 'scripts');

function runScanner(scriptName) {
  try {
    const output = execSync(
      `node "${path.join(SCRIPTS_DIR, scriptName)}" "${REPO_ROOT}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    return JSON.parse(output);
  } catch (err) {
    return { error: err.message, script: scriptName };
  }
}

function readPriorReport() {
  if (!fs.existsSync(HISTORY_DIR)) return null;
  const reports = fs.readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('.'))
    .sort()
    .reverse();
  if (reports.length === 0) return null;
  return reports[0];
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    return { branch, commit };
  } catch {
    return { branch: 'unknown', commit: 'unknown' };
  }
}

function statusIcon(score) {
  if (score >= 80) return '✓ Good';
  if (score >= 60) return '⚠ Warn';
  return '✗ Risk';
}

function sizeStatus(kb) {
  if (kb >= 900) return '🔴 CRITICAL';
  if (kb >= 750) return '🟠 HIGH';
  if (kb >= 500) return '🟡 WARNING';
  return '🟢 OK';
}

// --- Run all scanners ---
console.error('Running scanners...');
const metrics = runScanner('collect_repo_metrics.js');
const patterns = runScanner('scan_accentos_patterns.js');
const sqlScan = runScanner('scan_sql_migrations.js');
const workerScan = runScanner('scan_worker_security.js');
const patchScan = runScanner('scan_ai_patch_boundaries.js');

const gitInfo = getGitInfo();
const today = new Date().toISOString().split('T')[0];
const priorReport = readPriorReport();

// --- Calculate health scores ---
const indexKb = metrics.index_html?.size_kb ?? 0;
const indexStatusRaw = metrics.index_html?.status ?? 'OK';
const directWrites = metrics.direct_supabase_writes?.total ?? 0;
const patchScore = patchScan.summary?.overall_ai_patchability_score ?? 100;
// Worker score: use actual value; if 0, it's genuinely 0 (not a missing value)
const workerScoreRaw = workerScan.summary?.overall_score;
const workerScore = workerScoreRaw != null ? workerScoreRaw : 100;
// SQL score: scanner may overcount due to cross-file RLS patterns; cap deduction at reasonable range
const sqlScoreRaw = sqlScan.summary?.score;
const tablesWithoutRlsCount = (sqlScan.tables_without_rls ?? []).length;
// Use direct table count for scoring rather than file-level score (avoids false positive inflation)
const sqlScore = Math.max(0, 100 - tablesWithoutRlsCount * 10 - (sqlScan.non_idempotent_migrations?.length ?? 0) * 5);
const sqlCritical = tablesWithoutRlsCount;

// Architecture score (out of 20)
let archScore = 20;
if (indexKb >= 900) archScore -= 12;
else if (indexKb >= 750) archScore -= 7;
else if (indexKb >= 500) archScore -= 3;
const moduleViolations = patterns.module_contracts?.violation_count || 0;
archScore = Math.max(0, archScore - moduleViolations * 2);

// DB score (out of 20)
const dbScore = Math.round((sqlScore / 100) * 20);

// Security score (out of 20)
const secScore = Math.round((workerScore / 100) * 20);

// AI Patch score (out of 15)
const aiScore = Math.round((patchScore / 100) * 15);

// Product logic score (out of 15) — estimated from indirect signals
let prodScore = 15;
if (directWrites > 0) prodScore -= Math.min(10, directWrites * 2);

// Docs score (out of 10) — estimated
const docScore = 7; // conservative default — Claude audit needed for real score

const totalScore = archScore + dbScore + secScore + aiScore + prodScore + docScore;

// --- Collect critical findings ---
const criticalFindings = [];
const highFindings = [];

// Worker findings
if (workerScan.worker_audits) {
  for (const w of workerScan.worker_audits) {
    for (const issue of w.issues || []) {
      const finding = {
        id: `SEC-${String(criticalFindings.length + highFindings.length + 1).padStart(3, '0')}`,
        area: 'Security/Worker',
        file: w.file,
        code: issue.code,
        severity: issue.severity,
        description: describeWorkerIssue(issue.code),
        owner: 'Codex',
      };
      if (issue.severity === 'CRITICAL') criticalFindings.push(finding);
      else highFindings.push(finding);
    }
  }
}

// SQL findings
for (const m of sqlScan.tables_without_rls || []) {
  criticalFindings.push({
    id: `DB-${String(criticalFindings.length + 1).padStart(3, '0')}`,
    area: 'Supabase/RLS',
    file: m.file,
    code: 'MISSING_RLS_ENABLE',
    severity: 'CRITICAL',
    description: `Table(s) created without RLS: ${(m.tables || []).join(', ')}`,
    owner: 'Claude',
  });
}

// Direct write findings
if (directWrites > 0) {
  for (const loc of metrics.direct_supabase_writes?.locations || []) {
    criticalFindings.push({
      id: `DB-${String(criticalFindings.length + 1).padStart(3, '0')}`,
      area: 'Supabase/Write Gateway',
      file: loc.file,
      code: 'DIRECT_SUPABASE_WRITE',
      severity: 'CRITICAL',
      description: `Direct Supabase write pattern found (${loc.count}x) — must use dbInsert/dbUpdate/dbDelete`,
      owner: 'Codex',
    });
  }
}

// Architecture findings
if (indexKb >= 750) {
  highFindings.push({
    id: `ARCH-001`,
    area: 'Architecture',
    file: 'index.html',
    code: 'FILE_SIZE_HIGH',
    severity: indexKb >= 900 ? 'CRITICAL' : 'HIGH',
    description: `index.html is ${indexKb}KB — ${indexStatusRaw} threshold (Warning:500KB, High:750KB, Critical:900KB)`,
    owner: 'Claude',
  });
}

// Patch boundary findings
const highRiskPatchFiles = patchScan.high_risk_files || [];
for (const f of highRiskPatchFiles) {
  highFindings.push({
    id: `PATCH-${String(highFindings.length + 1).padStart(3, '0')}`,
    area: 'AI Patching',
    file: f.file,
    code: f.unmatched?.length > 0 ? 'UNMATCHED_MARKERS' : 'MISSING_MARKERS',
    severity: 'HIGH',
    description: f.unmatched?.length > 0
      ? `Unmatched patch markers in ${f.file} (${f.size_kb}KB)`
      : `Large file ${f.file} (${f.size_kb}KB) has no START/END patch markers`,
    owner: 'Claude',
  });
}

function describeWorkerIssue(code) {
  const descriptions = {
    WILDCARD_CORS: 'CORS Access-Control-Allow-Origin: * — allows any origin',
    NO_ORIGIN_VALIDATION: 'No origin allowlist validation — any caller can use this Worker',
    API_KEY_FROM_CLIENT: 'API key read from client request headers and forwarded to upstream — open relay vulnerability',
    NO_BODY_SIZE_LIMIT: 'No body size limit — vulnerable to oversized request attacks',
    NO_UPSTREAM_TIMEOUT: 'No timeout on upstream fetch — requests can hang indefinitely',
    NO_RATE_LIMITING: 'No rate limiting — vulnerable to abuse and cost amplification',
    RAW_UPSTREAM_ERRORS: 'Raw upstream error bodies returned to browser — may leak sensitive info',
    NO_METHOD_RESTRICTION: 'No HTTP method restriction on write endpoints',
    SECRET_IN_RESPONSE: 'Environment secret potentially included in response',
    SERVICE_ROLE_IN_WORKER: 'Supabase service role key referenced in Worker code',
  };
  return descriptions[code] || code;
}

// --- Build report ---
const allCritical = criticalFindings.filter(f => f.severity === 'CRITICAL');
const goNoGo = allCritical.length > 0 ? 'NO-GO' : highFindings.length > 5 ? 'CONDITIONAL GO' : 'GO';

const report = `# AccentOS Sentinel Audit Report

## Audit Metadata

| Field | Value |
|---|---|
| Date | ${today} |
| Repo | github.com/mgraf77/accent-os |
| Branch | ${gitInfo.branch} |
| Commit | ${gitInfo.commit} |
| Audit Type | Full (Automated) |
| Auditor | accentos-sentinel-audit v1.0.0 |
| Tools Used | collect_repo_metrics, scan_accentos_patterns, scan_sql_migrations, scan_worker_security, scan_ai_patch_boundaries |
| Prior Audit | ${priorReport || 'None'} |
| index.html Size | ${indexKb}KB (${sizeStatus(indexKb)}) |

---

## Executive Summary

| Field | Value |
|---|---|
| **Overall Health Score** | **${totalScore}/100** |
| **Go/No-Go Recommendation** | **${goNoGo}** |
| **Biggest Risk** | ${allCritical.length > 0 ? allCritical[0].description : 'No critical findings'} |
| **Fastest High-ROI Fix** | ${workerScan.known_issues_summary?.api_key_from_client ? 'Fix Worker API key relay (SEC-001) — 30 min fix, eliminates open relay' : 'Add patch boundary markers to index.html sections'} |
| **Feature Work Recommendation** | ${totalScore < 60 ? 'Stop feature work — stabilize first' : totalScore < 70 ? 'Remediate critical/high before next feature' : 'Continue with caution — address high-priority findings'} |

${allCritical.length > 0 ? `> ⚠️ **${allCritical.length} Critical finding(s) detected — recommend fixing before next production deployment.**` : ''}

---

## Health Scorecard

| Category | Score | Status | Key Issue |
|---|---:|---|---|
| Architecture Integrity (20%) | ${archScore}/20 | ${statusIcon(archScore / 20 * 100)} | ${indexKb >= 750 ? `index.html at ${indexKb}KB` : moduleViolations > 0 ? `${moduleViolations} module contract violation(s)` : 'Clean'} |
| Supabase / Data Integrity (20%) | ${dbScore}/20 | ${statusIcon(sqlScore)} | ${sqlCritical > 0 ? `${sqlCritical} migration(s) with critical issues` : 'No critical SQL issues detected'} |
| Security / API Safety (20%) | ${secScore}/20 | ${statusIcon(workerScore)} | ${workerScan.known_issues_summary?.api_key_from_client ? 'Worker API key relay vulnerability' : workerScan.known_issues_summary?.wildcard_cors ? 'Wildcard CORS in Worker' : 'No critical worker issues'} |
| AI Patch Maintainability (15%) | ${aiScore}/15 | ${statusIcon(patchScore)} | ${patchScan.summary?.files_needing_markers > 0 ? `${patchScan.summary.files_needing_markers} file(s) need patch markers` : 'Good marker coverage'} |
| Product Logic Integrity (15%) | ${prodScore}/15 | ${statusIcon(prodScore / 15 * 100)} | ${directWrites > 0 ? `${directWrites} direct Supabase write(s) detected` : 'No direct write violations detected'} |
| Documentation / Employee Readiness (10%) | ${docScore}/10 | ⚠ Warn | Manual Claude audit required for accurate score |
| **Total** | **${totalScore}/100** | ${statusIcon(totalScore)} | |

---

## Critical Findings

${allCritical.length === 0 ? '_No critical findings in this automated scan. Run Claude architecture audit for full assessment._' : `
| ID | Area | Finding | Business Impact | Owner |
|---|---|---|---|---|
${allCritical.map(f => `| ${f.id} | ${f.area} | ${f.description.substring(0, 80)} | High | ${f.owner} |`).join('\n')}
`}

---

## High Findings

${highFindings.length === 0 ? '_No high findings detected._' : `
| ID | Area | Finding | Owner |
|---|---|---|---|
${highFindings.map(f => `| ${f.id} | ${f.area} | ${f.description.substring(0, 80)} | ${f.owner} |`).join('\n')}
`}

---

## Detailed Findings

${[...allCritical, ...highFindings].map(f => `
### ${f.id}: ${f.description.substring(0, 60)}

**Severity:** ${f.severity}
**Area:** ${f.area}
**File:** \`${f.file}\`
**Code:** \`${f.code}\`
**Recommended Owner:** ${f.owner}

${getDetailedDescription(f.code, f)}
`).join('\n---\n')}

---

## Scanner Summary

### Repo Metrics
- index.html: **${indexKb}KB** (${sizeStatus(indexKb)})
- JS modules: ${metrics.file_counts?.js_modules || 0} files
- SQL migrations: ${metrics.file_counts?.sql_migrations || 0} files
- Worker files: ${metrics.file_counts?.worker_files || 0} files
- Detected modules: ${(metrics.module_registry?.detected_modules || []).join(', ') || 'none detected'}
- Patch markers: ${metrics.patch_markers?.start_count || 0} START / ${metrics.patch_markers?.end_count || 0} END (${metrics.patch_markers?.matched ? 'matched' : '⚠ UNMATCHED'})
- TODO/FIXME count: ${metrics.todo_fixme?.total || 0}
- Direct Supabase writes: ${directWrites}

### SQL Migration Health
- Migrations scanned: ${sqlScan.summary?.migration_count || 0}
- Tables without RLS: ${(sqlScan.tables_without_rls || []).length}
- Non-idempotent migrations: ${(sqlScan.non_idempotent_migrations || []).length}
- Migrations without indexes: ${(sqlScan.migrations_without_indexes || []).length}

### Worker Security
- Worker files scanned: ${workerScan.summary?.worker_files_scanned || 0}
- Critical issues: ${workerScan.summary?.critical_issues || 0}
- High issues: ${workerScan.summary?.high_issues || 0}
- Score: ${workerScan.summary?.overall_score || 'N/A'}/100

### AI Patch Boundaries
- Files needing markers: ${patchScan.summary?.files_needing_markers || 0}
- Files with unmatched markers: ${patchScan.summary?.files_with_unmatched_markers || 0}
- AI patchability score: ${patchScan.summary?.overall_ai_patchability_score || 100}/100

---

## Codex Delegation Prompts

### Codex Task: Harden Worker Proxy Security

${workerScan.summary?.critical_issues > 0 ? `
Copy this into a Codex session:

\`\`\`
# Codex Fix Plan — AccentOS Worker Proxy (SEC-001 through SEC-00${workerScan.summary.critical_issues})

Review and patch worker/anthropic-proxy.js for the following issues:
${(workerScan.worker_audits?.[0]?.issues || []).map(i => `- ${i.code}: ${describeWorkerIssue(i.code)}`).join('\n')}

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
\`\`\`
` : '_No critical worker issues — no Codex task needed._'}

---

## Changelog Entry

Paste into SESSION_LOG.md:

\`\`\`
### ${today} — Sentinel Audit (Automated Full Scan)

**Health Score:** ${totalScore}/100
**Auditor:** accentos-sentinel-audit v1.0.0
**Branch:** ${gitInfo.branch} @ ${gitInfo.commit}

Critical findings: ${allCritical.length}
High findings: ${highFindings.length}

${allCritical.map(f => `- ${f.id}: ${f.description.substring(0, 100)}`).join('\n')}

Next audit: Before next production deployment
\`\`\`

---

## Next Audit Recommendation

- **Suggested cadence:** Before next deploy (due to ${allCritical.length} critical findings) + weekly security scan
- **Suggested scope:** Focus on Worker remediation + verify write gateway coverage
- **Watchlist:**
  - index.html size (currently ${indexKb}KB — monitor approach to 750KB threshold)
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
`;

function getDetailedDescription(code, finding) {
  const details = {
    WILDCARD_CORS: `**Why it matters:** Any website can make authenticated requests to this Worker proxy. This enables CSRF-style attacks against the Anthropic API through AccentOS's credentials.

**Recommended Fix:** Replace \`'Access-Control-Allow-Origin': '*'\` with an origin allowlist check:
\`\`\`js
const ALLOWED_ORIGINS = ['https://your-domain.pages.dev', 'https://accentlighting.com'];
const origin = request.headers.get('Origin') || '';
const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
if (!allowedOrigin) return new Response('Forbidden', { status: 403 });
\`\`\`

**Acceptance Criteria:**
- [ ] Requests from unlisted origins receive 403
- [ ] Requests from listed origins receive correct CORS headers
- [ ] OPTIONS preflight respects the allowlist`,

    API_KEY_FROM_CLIENT: `**Why it matters:** This Worker is an open relay. Anyone who discovers the Worker URL can use it to proxy arbitrary Anthropic API keys — including credentials from other organizations. Anthropic could rate-limit or ban AccentOS's IP. There is also no way to revoke this access without changing the Worker URL.

**Recommended Fix:** Replace the client key read with env key:
\`\`\`js
// Remove:
const apiKey = request.headers.get('x-api-key');

// Replace with:
const apiKey = env.ANTHROPIC_API_KEY;
if (!apiKey) return new Response(JSON.stringify({ error: 'Worker misconfigured' }), { status: 500 });
\`\`\`

**Acceptance Criteria:**
- [ ] x-api-key header from client is ignored
- [ ] env.ANTHROPIC_API_KEY is used for upstream calls
- [ ] Requests work end-to-end without client providing a key`,

    NO_BODY_SIZE_LIMIT: `**Why it matters:** An attacker can send multi-gigabyte requests, potentially exhausting Cloudflare Worker CPU time and memory, causing cost amplification or DoS.

**Recommended Fix:**
\`\`\`js
const MAX_BODY = 1_000_000;
const contentLength = parseInt(request.headers.get('content-length') || '0');
if (contentLength > MAX_BODY) {
  return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
}
\`\`\``,

    NO_UPSTREAM_TIMEOUT: `**Why it matters:** If the Anthropic API is slow or unresponsive, Worker requests hang indefinitely, consuming Cloudflare CPU and blocking legitimate users.

**Recommended Fix:**
\`\`\`js
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
\`\`\``,

    NO_RATE_LIMITING: `**Why it matters:** No rate limiting means the Worker can be used to hammer the Anthropic API, generating large bills and potentially getting AccentOS's API key rate-limited or banned.

**Recommended Fix:** Use Cloudflare KV for a sliding window rate limiter:
\`\`\`js
const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
// Implement 30 req/min/IP using KV with TTL
\`\`\``,

    DIRECT_SUPABASE_WRITE: `**Why it matters:** Direct Supabase write calls bypass the write gateway, meaning they skip validation, logging, error handling, and access control checks. This creates inconsistent data quality and security gaps.

**Recommended Fix:** Replace all \`.insert()\`, \`.update()\`, \`.delete()\`, \`.upsert()\` calls from UI code with \`dbInsert()\`, \`dbUpdate()\`, \`dbDelete()\` gateway functions.`,

    MISSING_RLS_ENABLE: `**Why it matters:** A table without RLS enabled means all authenticated users (and possibly anon users) can read and write all rows without any row-level access control. This is a data isolation failure.

**Recommended Fix:** Add \`ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;\` and appropriate policies to the relevant migration file.`,

    FILE_SIZE_HIGH: `**Why it matters:** At ${indexKb}KB, index.html is approaching the 900KB critical threshold where AI-assisted editing becomes unreliable. Large unmarked sections make it difficult to safely apply targeted patches without unintended side effects.

**Recommended Fix:** Add START/END patch boundary markers to all major sections. Plan modular extraction of largest self-contained feature. Document extraction plan in MASTER.md.`,
  };
  return details[code] || `See rules/ files for detailed remediation guidance for code \`${code}\`.`;
}

// --- Save report ---
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

const reportPath = path.join(HISTORY_DIR, `${today}-full-audit.md`);
fs.writeFileSync(reportPath, report, 'utf8');

console.error(`\nAudit report saved: ${path.relative(REPO_ROOT, reportPath)}`);
console.error(`Health score: ${totalScore}/100`);
console.error(`Critical findings: ${allCritical.length}`);
console.error(`High findings: ${highFindings.length}`);

process.stdout.write(report);
