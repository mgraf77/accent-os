/**
 * AIRLOCK — AirlockGate
 *
 * Runtime interception layer for quarantined AccentOS skills.
 * Loaded by operator.js and the AIRLOCK SKILL.md hooks.
 *
 * Exported API:
 *   preflight(skill)           → { ok, error }
 *   interceptRead(skill, path) → { allowed, entry }
 *   interceptWrite(skill, path)→ { allowed, shadowPath, entry }
 *   routerHook(caller, callee) → { allowed, entry }
 *   networkBlock(skill, url)   → { allowed, entry }
 *   flushLedger(skill, outcome)→ void  (call once per run-end)
 *   loadPolicy(skill)          → policy object (cached)
 *
 * No external dependencies. Node stdlib only.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const REPO_ROOT      = path.resolve(__dirname, '..', '..');
const AIRLOCK_ROOT   = path.join(REPO_ROOT, 'airlock');
const SCHEMA_FILE    = path.join(__dirname, 'policy.schema.json');
const SCHEMA_VERSION = '1';

// SDK version string — integration tests assert this is current.
const SDK_VERSION = '1.0.0';

// --- In-process caches (reset per Node process = reset per Claude Code session) ---
const _policyCache = new Map();        // skill → policy object
const _ledgerBuffer = new Map();       // skill → entry[]
const _runIds = new Map();             // skill → run_id for current run
const _violations = new Map();         // skill → boolean (any violation this run)
const _streakCache = new Map();        // skill → current clean_streak from last ledger read

// ---------------------------------------------------------------------------
// Policy loading + YAML parsing
// ---------------------------------------------------------------------------

function policyDir(skill) {
  return path.join(AIRLOCK_ROOT, skill);
}

function policyPath(skill) {
  return path.join(policyDir(skill), 'policy.yaml');
}

/**
 * Tiny parser for the fixed-shape policy.yaml format.
 * Supports:
 *   key: value
 *   list_key:
 *     - item
 */
function parseYaml(text) {
  const out = {};
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    // Skip blank lines and comments
    if (!trimmed || trimmed.startsWith('#')) { i++; continue; }

    const indent = line.length - trimmed.length;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = trimmed.slice(0, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trim();

    if (rest === '' || rest === '|' || rest === '>') {
      // Possible list or block scalar — check next lines for list items
      const items = [];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        const ntrimmed = next.trimStart();
        if (!ntrimmed || ntrimmed.startsWith('#')) { i++; continue; }
        const nindent = next.length - ntrimmed.length;
        if (nindent <= indent && ntrimmed && !ntrimmed.startsWith('-')) break;
        if (ntrimmed.startsWith('- ')) {
          items.push(ntrimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
        } else if (ntrimmed.startsWith('-') && ntrimmed.length === 1) {
          items.push('');
        }
        i++;
      }
      out[key] = items;
    } else {
      // Scalar value — preserve type based on quoting
      const wasQuoted = rest.startsWith('"') || rest.startsWith("'");
      let val = rest.replace(/^['"]|['"]$/g, '');
      if (!wasQuoted) {
        // Only coerce unquoted scalars
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (/^\d+$/.test(val)) val = parseInt(val, 10);
      }
      out[key] = val;
      i++;
    }
  }
  return out;
}

function loadPolicy(skill, { force = false } = {}) {
  if (!force && _policyCache.has(skill)) return _policyCache.get(skill);
  const p = policyPath(skill);
  if (!fs.existsSync(p)) return null;
  const policy = parseYaml(fs.readFileSync(p, 'utf8'));
  _policyCache.set(skill, policy);
  return policy;
}

// ---------------------------------------------------------------------------
// Glob matching (** and * only — no external dependency)
// ---------------------------------------------------------------------------

function globToRe(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE__/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function matchesAny(target, patterns) {
  if (!patterns || patterns.length === 0) return false;
  const rel = path.relative(REPO_ROOT, path.resolve(REPO_ROOT, target));
  return patterns.some(p => globToRe(p).test(rel) || globToRe(p).test(target));
}

// ---------------------------------------------------------------------------
// Run ID management
// ---------------------------------------------------------------------------

function runId(skill) {
  if (!_runIds.has(skill)) _runIds.set(skill, randomUUID().slice(0, 8));
  return _runIds.get(skill);
}

// ---------------------------------------------------------------------------
// Ledger buffering
// ---------------------------------------------------------------------------

function bufferEntry(skill, entry) {
  if (!_ledgerBuffer.has(skill)) _ledgerBuffer.set(skill, []);
  _ledgerBuffer.get(skill).push(entry);
  if (entry.violation_kind) _violations.set(skill, true);
}

function readCurrentStreak(skill) {
  if (_streakCache.has(skill)) return _streakCache.get(skill);
  const lp = path.join(policyDir(skill), 'ledger.jsonl');
  if (!fs.existsSync(lp)) return 0;
  const lines = fs.readFileSync(lp, 'utf8').trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(lines[i]);
      if (e.action === 'run-end' && typeof e.clean_streak === 'number') {
        _streakCache.set(skill, e.clean_streak);
        return e.clean_streak;
      }
    } catch (_) { /* skip malformed */ }
  }
  return 0;
}

/**
 * Flush the in-memory ledger buffer to disk.
 * Append-only: opens the file in append mode.
 * outcome: 'clean' | 'violated'
 */
function flushLedger(skill, outcome) {
  const entries = _ledgerBuffer.get(skill) || [];
  const hadViolation = _violations.get(skill) || false;
  const effectiveOutcome = hadViolation ? 'violated' : (outcome || 'clean');

  const prevStreak = readCurrentStreak(skill);
  const newStreak = effectiveOutcome === 'clean' ? prevStreak + 1 : 0;

  const runEnd = {
    ts: new Date().toISOString(),
    skill,
    run_id: runId(skill),
    action: 'run-end',
    target: '',
    allowed: effectiveOutcome === 'clean',
    violation_kind: null,
    run_outcome: effectiveOutcome,
    clean_streak: newStreak,
  };
  entries.push(runEnd);

  const lp = path.join(policyDir(skill), 'ledger.jsonl');
  fs.mkdirSync(path.dirname(lp), { recursive: true });
  const lines = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.appendFileSync(lp, lines, 'utf8');

  // Update streak cache
  _streakCache.set(skill, newStreak);

  // Reset run state
  _ledgerBuffer.delete(skill);
  _runIds.delete(skill);
  _violations.delete(skill);

  return { outcome: effectiveOutcome, clean_streak: newStreak };
}

// ---------------------------------------------------------------------------
// P2 — PREFLIGHT
// ---------------------------------------------------------------------------

/**
 * preflight(skill) — call at session start before a quarantined skill runs.
 * Returns { ok: true } if policy exists and is parseable.
 * Returns { ok: false, error } if policy is missing or malformed.
 */
function preflight(skill) {
  const pp = policyPath(skill);
  if (!fs.existsSync(pp)) {
    return {
      ok: false,
      error: `[AIRLOCK] policy-missing: airlock/${skill}/policy.yaml not found. ` +
             `Run: node skills/airlock/operator.js init ${skill}`,
    };
  }
  const policy = loadPolicy(skill, { force: true });
  if (!policy || policy.schema_version !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `[AIRLOCK] policy-malformed: airlock/${skill}/policy.yaml schema_version must be "${SCHEMA_VERSION}".`,
    };
  }
  if (policy.status === 'trusted') {
    // Trusted skills skip interception hooks but still pass preflight.
    return { ok: true, trusted: true };
  }
  return { ok: true, trusted: false, policy };
}

// ---------------------------------------------------------------------------
// P3 — FILESYSTEM INTERCEPTION
// ---------------------------------------------------------------------------

/**
 * interceptRead(skill, filePath)
 * Returns { allowed: bool, entry }
 * If not allowed → caller should abort the read and record violation.
 */
function interceptRead(skill, filePath) {
  const policy = loadPolicy(skill);
  if (!policy) {
    const entry = _makeEntry(skill, 'read', filePath, false, 'missing-policy');
    bufferEntry(skill, entry);
    return { allowed: false, entry };
  }
  if (policy.status === 'trusted') return { allowed: true, entry: null };

  const allowed = matchesAny(filePath, policy.read_paths);
  const entry = _makeEntry(skill, 'read', filePath, allowed, allowed ? null : 'path-not-allowed');
  bufferEntry(skill, entry);
  return { allowed, entry };
}

/**
 * interceptWrite(skill, filePath)
 * Returns { allowed: bool, shadowPath: string|null, entry }
 * If not allowed → caller should redirect the write to shadowPath.
 */
function interceptWrite(skill, filePath) {
  const policy = loadPolicy(skill);
  if (!policy) {
    const entry = _makeEntry(skill, 'write', filePath, false, 'missing-policy');
    bufferEntry(skill, entry);
    return { allowed: false, shadowPath: _shadowPath(skill, filePath), entry };
  }
  if (policy.status === 'trusted') return { allowed: true, shadowPath: null, entry: null };

  const allowed = matchesAny(filePath, policy.write_paths);
  const entry = _makeEntry(skill, 'write', filePath, allowed, allowed ? null : 'path-not-allowed');
  bufferEntry(skill, entry);
  const shadowPath = allowed ? null : _shadowPath(skill, filePath);
  return { allowed, shadowPath, entry };
}

function _shadowPath(skill, filePath) {
  const rel = path.relative(REPO_ROOT, path.resolve(REPO_ROOT, filePath));
  return path.join(policyDir(skill), 'shadow', rel);
}

// ---------------------------------------------------------------------------
// P4 — ROUTER HOOK + NETWORK BLOCK
// ---------------------------------------------------------------------------

/**
 * routerHook(caller, callee)
 * Called when a quarantined skill (caller) invokes another skill (callee).
 * Returns { allowed: bool, entry }
 */
function routerHook(caller, callee) {
  const policy = loadPolicy(caller);
  if (!policy) {
    const entry = _makeEntry(caller, 'invoke-skill', callee, false, 'missing-policy');
    bufferEntry(caller, entry);
    return { allowed: false, entry };
  }
  if (policy.status === 'trusted') return { allowed: true, entry: null };

  const allowed = Array.isArray(policy.invoke_skills) && policy.invoke_skills.includes(callee);
  const entry = _makeEntry(caller, 'invoke-skill', callee, allowed, allowed ? null : 'invoke-not-allowed');
  bufferEntry(caller, entry);
  return { allowed, entry };
}

/**
 * networkBlock(skill, url)
 * Quarantined skills may not make outbound network calls. Always blocked.
 * Returns { allowed: false, entry }
 */
function networkBlock(skill, url) {
  const policy = loadPolicy(skill);
  if (policy && policy.status === 'trusted') return { allowed: true, entry: null };

  const entry = _makeEntry(skill, 'network', url, false, 'network-blocked');
  bufferEntry(skill, entry);
  return { allowed: false, entry };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _makeEntry(skill, action, target, allowed, violation_kind) {
  return {
    ts: new Date().toISOString(),
    skill,
    run_id: runId(skill),
    action,
    target,
    allowed,
    violation_kind: violation_kind || null,
    run_outcome: null,
    clean_streak: null,
  };
}

// ---------------------------------------------------------------------------
// Promotion check (called by operator.js)
// ---------------------------------------------------------------------------

/**
 * Returns { eligible: bool, reason }
 * Eligible if clean_streak >= threshold_clean_streak AND
 * total clean runs >= threshold_runs.
 */
function promotionCheck(skill) {
  const policy = loadPolicy(skill, { force: true });
  if (!policy) return { eligible: false, reason: 'no policy found' };
  if (policy.status === 'trusted') return { eligible: false, reason: 'already trusted' };

  const lp = path.join(policyDir(skill), 'ledger.jsonl');
  if (!fs.existsSync(lp)) return { eligible: false, reason: 'no ledger — skill has not run yet' };

  const lines = fs.readFileSync(lp, 'utf8').trim().split('\n').filter(Boolean);
  let totalClean = 0;
  let currentStreak = 0;
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (e.action === 'run-end') {
        if (e.run_outcome === 'clean') { totalClean++; currentStreak = e.clean_streak || 0; }
        else currentStreak = 0;
      }
    } catch (_) {}
  }

  if (totalClean < policy.threshold_runs) {
    return {
      eligible: false,
      reason: `${totalClean}/${policy.threshold_runs} clean runs completed`,
    };
  }
  if (currentStreak < policy.threshold_clean_streak) {
    return {
      eligible: false,
      reason: `clean streak ${currentStreak}/${policy.threshold_clean_streak}`,
    };
  }
  return { eligible: true, reason: `${totalClean} total clean runs, streak ${currentStreak}` };
}

module.exports = {
  SDK_VERSION,
  preflight,
  interceptRead,
  interceptWrite,
  routerHook,
  networkBlock,
  flushLedger,
  loadPolicy,
  promotionCheck,
  policyDir,
  policyPath,
};
