#!/usr/bin/env node
/**
 * scan_accentos_patterns.js
 * Scans for AccentOS module contracts, global state, and patch markers.
 * Outputs JSON to stdout. Run from repo root.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.argv[2] || process.cwd();

function readFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function walkDir(dir, exts, excludeDirs = ['node_modules', '.git', 'skills']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        results.push(...walkDir(path.join(dir, entry.name), exts, excludeDirs));
      }
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function findLineNumbers(content, pattern) {
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((line, i) => {
    if (pattern.test(line)) {
      pattern.lastIndex = 0;
      matches.push({ line: i + 1, text: line.trim().substring(0, 120) });
    }
  });
  return matches;
}

const indexHtml = path.join(REPO_ROOT, 'index.html');
const jsDir = path.join(REPO_ROOT, 'js');
const workerDir = path.join(REPO_ROOT, 'worker');

const jsFiles = walkDir(jsDir, ['.js']);
const workerFiles = walkDir(workerDir, ['.js']);
const allFiles = [indexHtml, ...jsFiles, ...workerFiles].filter(f => fs.existsSync(f));

// --- Module registry analysis ---
const modules = [];
for (const f of allFiles) {
  const content = readFile(f);
  if (!content) continue;

  const relFile = path.relative(REPO_ROOT, f);
  const moduleDecls = [...content.matchAll(/window\.AccentOS\.modules\.(\w+)\s*=\s*\{/g)];

  for (const decl of moduleDecls) {
    const moduleName = decl[1];
    const hasInit = /\binit\s*\(\s*\)/.test(content);
    const hasDestroy = /\bdestroy\s*\(\s*\)/.test(content);
    const stateNulledInDestroy = /destroy\s*\(\s*\)[^}]*null/.test(content);

    modules.push({
      name: moduleName,
      file: relFile,
      has_init: hasInit,
      has_destroy: hasDestroy,
      state_nulled_in_destroy: stateNulledInDestroy,
      violations: [
        !hasInit ? 'MISSING_INIT' : null,
        !hasDestroy ? 'MISSING_DESTROY' : null,
        (hasDestroy && !stateNulledInDestroy) ? 'STATE_NOT_NULLED' : null,
      ].filter(Boolean),
    });
  }
}

// --- Global mutable state indicators ---
const globalStateViolations = [];
for (const f of allFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);

  // Patterns indicating potentially unsafe global state
  const patterns = [
    { name: 'window_assign_non_registry', pattern: /window\.[A-Za-z_$][A-Za-z0-9_$]*\s*=(?!=)(?!.*AccentOS)/g },
    { name: 'var_at_module_scope', pattern: /^var\s+[A-Za-z_$]/gm },
  ];

  for (const { name, pattern } of patterns) {
    const hits = findLineNumbers(content, new RegExp(pattern.source, pattern.flags));
    if (hits.length > 0) {
      globalStateViolations.push({
        file: relFile,
        pattern: name,
        count: hits.length,
        samples: hits.slice(0, 3),
      });
    }
  }
}

// --- Patch boundary markers ---
const markerAnalysis = [];
for (const f of allFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);
  const sizeKb = Math.round(Buffer.byteLength(content, 'utf8') / 1024);

  const startMarkers = [...content.matchAll(/(?:\/\/|<!--)\s*START:\s*AccentOS\s+([^\n>-]+?)(?:\s*-->|\s*$)/gm)];
  const endMarkers = [...content.matchAll(/(?:\/\/|<!--)\s*END:\s*AccentOS\s+([^\n>-]+?)(?:\s*-->|\s*$)/gm)];

  const startNames = startMarkers.map(m => m[1].trim());
  const endNames = endMarkers.map(m => m[1].trim());

  const unmatched = [
    ...startNames.filter(n => !endNames.includes(n)).map(n => `MISSING_END: ${n}`),
    ...endNames.filter(n => !startNames.includes(n)).map(n => `MISSING_START: ${n}`),
  ];

  const needsMarkers = sizeKb > 50 && startMarkers.length === 0;

  markerAnalysis.push({
    file: relFile,
    size_kb: sizeKb,
    start_markers: startNames,
    end_markers: endNames,
    unmatched,
    needs_markers: needsMarkers,
    risk: needsMarkers && sizeKb >= 100 ? (sizeKb >= 200 ? 'HIGH' : 'MEDIUM') : 'OK',
  });
}

// --- Duplicate helper function names ---
const functionNames = {};
for (const f of allFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);
  const funcMatches = [...content.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)];
  for (const m of funcMatches) {
    const name = m[1];
    if (!functionNames[name]) functionNames[name] = [];
    functionNames[name].push(relFile);
  }
}

const duplicateFunctions = Object.entries(functionNames)
  .filter(([, files]) => files.length > 1)
  .map(([name, files]) => ({ name, files, count: files.length }));

// --- Direct Supabase write patterns ---
const directWrites = [];
for (const f of allFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);

  const writePattern = /\.from\s*\([^)]+\)\s*\.(insert|update|delete|upsert)\s*\(/g;
  const hits = findLineNumbers(content, writePattern);
  if (hits.length > 0) {
    directWrites.push({ file: relFile, count: hits.length, locations: hits.slice(0, 5) });
  }
}

const result = {
  generated_at: new Date().toISOString(),
  repo_root: REPO_ROOT,

  module_contracts: {
    modules_detected: modules,
    violation_count: modules.reduce((n, m) => n + m.violations.length, 0),
    modules_with_violations: modules.filter(m => m.violations.length > 0),
  },

  global_state: {
    potential_violations: globalStateViolations,
    risk: globalStateViolations.length > 0 ? 'MEDIUM' : 'OK',
  },

  patch_markers: {
    file_analysis: markerAnalysis.filter(f => f.size_kb > 10),
    files_needing_markers: markerAnalysis.filter(f => f.needs_markers),
    files_with_unmatched: markerAnalysis.filter(f => f.unmatched.length > 0),
  },

  duplicate_functions: {
    duplicates: duplicateFunctions,
    count: duplicateFunctions.length,
    risk: duplicateFunctions.length > 5 ? 'MEDIUM' : duplicateFunctions.length > 0 ? 'LOW' : 'OK',
  },

  direct_supabase_writes: {
    violations: directWrites,
    total_count: directWrites.reduce((n, f) => n + f.count, 0),
    risk: directWrites.length > 0 ? 'CRITICAL' : 'OK',
  },
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
