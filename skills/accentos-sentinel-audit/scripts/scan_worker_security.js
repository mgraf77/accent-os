#!/usr/bin/env node
/**
 * scan_worker_security.js
 * Scans Cloudflare Worker code for security gaps.
 * Outputs JSON to stdout. Run from repo root.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.argv[2] || process.cwd();
const WORKER_DIR = path.join(REPO_ROOT, 'worker');
const WRANGLER_TOML = path.join(REPO_ROOT, 'wrangler.toml');

function readFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function walkDir(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function findLines(content, pattern) {
  const lines = content.split('\n');
  const result = [];
  lines.forEach((line, i) => {
    const re = new RegExp(pattern.source, pattern.flags);
    if (re.test(line)) {
      result.push({ line: i + 1, text: line.trim().substring(0, 150) });
    }
  });
  return result;
}

const workerFiles = walkDir(WORKER_DIR, ['.js', '.ts']);
const wranglerContent = readFile(WRANGLER_TOML) || '';

const workerAudits = [];

for (const f of workerFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);

  // CORS / Origin validation
  const wildcardCors = findLines(content, /Access-Control-Allow-Origin['":\s]+['"]\*['"]/);
  const hasOriginAllowlist = /ALLOWED_ORIGINS|allowedOrigins|ALLOWED_ORIGIN|originAllowlist/i.test(content);
  const hasOriginValidation = /request\.headers\.get\(['"]Origin['"]\)/i.test(content)
    && (hasOriginAllowlist || /includes\(origin\)|===.*origin/i.test(content));

  // API key handling
  const apiKeyFromRequest = findLines(content, /headers\.get\(['"](x-api-key|authorization|api[_-]?key)['"]\)/i);
  const apiKeyFromEnv = /env\.[A-Z_]*(?:API[_-]?KEY|SECRET|TOKEN)/i.test(content);
  const forwardsClientKey = apiKeyFromRequest.length > 0 && !apiKeyFromEnv;

  // Body size limit
  const hasBodySizeCheck = /content-length|MAX_BODY|maxBody|body.*length|limit.*byte/i.test(content);

  // Timeout
  const hasTimeout = /AbortController|setTimeout.*abort|setTimeout.*controller|RequestTimeout/i.test(content);

  // Rate limiting
  const hasRateLimit = /rate.?limit|rateLimit|throttle|KV\.get.*rate|Durable.*rate/i.test(content);
  const usesConnectingIp = /CF-Connecting-IP|cfConnectingIp|connecting.ip/i.test(content);

  // Error handling
  const rawUpstreamErrors = findLines(content, /return.*upstream\.text\(\)|responseText.*upstream|return.*response.*text/i);
  const hasStructuredErrors = /JSON\.stringify.*error|error.*JSON\.stringify/i.test(content);

  // Method restriction
  const hasMethodCheck = /request\.method\s*!==?\s*['"]POST['"]|method.*405/i.test(content);

  // Secret exposure
  const secretInResponse = findLines(content, /response.*env\.|headers.*env\.|body.*env\./i);
  const serviceRoleInCode = findLines(content, /service[_-]?role|SERVICE[_-]?ROLE|SUPABASE_SERVICE/i);
  const apiKeyInResponse = findLines(content, /headers.*apiKey|response.*apiKey|body.*apiKey/i);

  const issues = [];
  if (wildcardCors.length > 0) issues.push({ severity: 'CRITICAL', code: 'WILDCARD_CORS', evidence: wildcardCors });
  if (!hasOriginValidation) issues.push({ severity: 'CRITICAL', code: 'NO_ORIGIN_VALIDATION', evidence: [] });
  if (forwardsClientKey) issues.push({ severity: 'CRITICAL', code: 'API_KEY_FROM_CLIENT', evidence: apiKeyFromRequest });
  if (!hasBodySizeCheck) issues.push({ severity: 'HIGH', code: 'NO_BODY_SIZE_LIMIT', evidence: [] });
  if (!hasTimeout) issues.push({ severity: 'HIGH', code: 'NO_UPSTREAM_TIMEOUT', evidence: [] });
  if (!hasRateLimit) issues.push({ severity: 'HIGH', code: 'NO_RATE_LIMITING', evidence: [] });
  if (rawUpstreamErrors.length > 0) issues.push({ severity: 'HIGH', code: 'RAW_UPSTREAM_ERRORS', evidence: rawUpstreamErrors });
  if (!hasMethodCheck) issues.push({ severity: 'HIGH', code: 'NO_METHOD_RESTRICTION', evidence: [] });
  if (secretInResponse.length > 0) issues.push({ severity: 'CRITICAL', code: 'SECRET_IN_RESPONSE', evidence: secretInResponse });
  if (serviceRoleInCode.length > 0) issues.push({ severity: 'CRITICAL', code: 'SERVICE_ROLE_IN_WORKER', evidence: serviceRoleInCode });

  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = issues.filter(i => i.severity === 'HIGH').length;
  const score = Math.max(0, 100 - (criticalCount * 25) - (highCount * 10));

  workerAudits.push({
    file: relFile,
    score,
    checks: {
      wildcard_cors: wildcardCors.length > 0,
      has_origin_validation: hasOriginValidation,
      api_key_from_client_request: forwardsClientKey,
      api_key_from_env: apiKeyFromEnv,
      has_body_size_check: hasBodySizeCheck,
      has_timeout: hasTimeout,
      has_rate_limiting: hasRateLimit,
      uses_cf_connecting_ip: usesConnectingIp,
      raw_upstream_errors: rawUpstreamErrors.length > 0,
      has_structured_errors: hasStructuredErrors,
      has_method_restriction: hasMethodCheck,
    },
    issues,
  });
}

// Wrangler config audit
const wranglerIssues = [];
if (wranglerContent) {
  if (/\[vars\][\s\S]*?(KEY|SECRET|TOKEN|PASSWORD|PASS)\s*=/i.test(wranglerContent)) {
    wranglerIssues.push({ severity: 'CRITICAL', code: 'SECRET_IN_WRANGLER_VARS', evidence: 'Secret found in [vars] section' });
  }
  if (!/compatibility_date/i.test(wranglerContent)) {
    wranglerIssues.push({ severity: 'MEDIUM', code: 'NO_COMPATIBILITY_DATE', evidence: 'compatibility_date not set' });
  }
}

const allIssues = workerAudits.flatMap(w => w.issues);
const overallScore = workerAudits.length > 0
  ? Math.round(workerAudits.reduce((s, w) => s + w.score, 0) / workerAudits.length)
  : 100;

const result = {
  generated_at: new Date().toISOString(),
  repo_root: REPO_ROOT,

  summary: {
    worker_files_scanned: workerAudits.length,
    overall_score: overallScore,
    critical_issues: allIssues.filter(i => i.severity === 'CRITICAL').length,
    high_issues: allIssues.filter(i => i.severity === 'HIGH').length,
    status: overallScore >= 80 ? 'GOOD' : overallScore >= 60 ? 'AT_RISK' : 'CRITICAL',
  },

  worker_audits: workerAudits,

  wrangler_config: {
    found: fs.existsSync(WRANGLER_TOML),
    issues: wranglerIssues,
  },

  known_issues_summary: {
    wildcard_cors: workerAudits.some(w => w.checks.wildcard_cors),
    api_key_from_client: workerAudits.some(w => w.checks.api_key_from_client_request),
    no_body_limit: workerAudits.some(w => !w.checks.has_body_size_check),
    no_timeout: workerAudits.some(w => !w.checks.has_timeout),
    no_rate_limit: workerAudits.some(w => !w.checks.has_rate_limiting),
  },
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
