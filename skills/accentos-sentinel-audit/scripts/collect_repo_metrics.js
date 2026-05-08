#!/usr/bin/env node
/**
 * collect_repo_metrics.js
 * Collects file sizes, line counts, pattern counts for AccentOS audit.
 * Outputs JSON to stdout. Run from repo root.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.argv[2] || process.cwd();

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function getFileStat(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const content = readFile(filePath);
    const lines = content ? content.split('\n').length : 0;
    return { bytes: stat.size, kb: Math.round(stat.size / 1024), lines };
  } catch {
    return { bytes: 0, kb: 0, lines: 0 };
  }
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

function countPatternInFile(content, pattern) {
  if (!content) return 0;
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function countPatternAcrossFiles(files, pattern) {
  let total = 0;
  const locations = [];
  for (const f of files) {
    const content = readFile(f);
    const count = countPatternInFile(content, pattern);
    if (count > 0) {
      total += count;
      locations.push({ file: path.relative(REPO_ROOT, f), count });
    }
  }
  return { total, locations };
}

// --- Collect files ---
const indexHtml = path.join(REPO_ROOT, 'index.html');
const jsDir = path.join(REPO_ROOT, 'js');
const sqlDir = path.join(REPO_ROOT, 'sql');
const workerDir = path.join(REPO_ROOT, 'worker');
const skillsDir = path.join(REPO_ROOT, 'skills');

const jsFiles = walkDir(jsDir, ['.js']);
const sqlFiles = walkDir(sqlDir, ['.sql']);
const workerFiles = walkDir(workerDir, ['.js']);
const allSourceFiles = [
  indexHtml,
  ...jsFiles,
  ...workerFiles,
];

// --- File sizes ---
const indexStat = getFileStat(indexHtml);

const fileSizes = [{ file: 'index.html', ...indexStat }];
for (const f of jsFiles) {
  fileSizes.push({ file: path.relative(REPO_ROOT, f), ...getFileStat(f) });
}

fileSizes.sort((a, b) => b.bytes - a.bytes);

// --- index.html size status ---
let indexStatus = 'OK';
if (indexStat.kb >= 900) indexStatus = 'CRITICAL';
else if (indexStat.kb >= 750) indexStatus = 'HIGH';
else if (indexStat.kb >= 500) indexStatus = 'WARNING';

// --- TODO/FIXME counts ---
const todoPattern = /\bTODO\b|\bFIXME\b|\bHACK\b|\bXXX\b/g;
const todoResults = countPatternAcrossFiles(allSourceFiles, todoPattern);

// --- Direct Supabase write patterns ---
const directWritePattern = /\.from\([^)]+\)\.(insert|update|delete|upsert)\s*\(/g;
const directWriteResults = countPatternAcrossFiles(allSourceFiles, directWritePattern);

// --- Module registry references ---
const moduleRegistryPattern = /window\.AccentOS\.modules/g;
const moduleRegistryResults = countPatternAcrossFiles(allSourceFiles, moduleRegistryPattern);

// --- Patch boundary markers ---
const startMarkerPattern = /\/\/\s*START:\s*AccentOS|<!--\s*START:\s*AccentOS/g;
const endMarkerPattern = /\/\/\s*END:\s*AccentOS|<!--\s*END:\s*AccentOS/g;

let startMarkerCount = 0;
let endMarkerCount = 0;
for (const f of allSourceFiles) {
  const content = readFile(f);
  startMarkerCount += countPatternInFile(content, startMarkerPattern);
  endMarkerCount += countPatternInFile(content, endMarkerPattern);
}

// --- Count modules detected ---
const indexContent = readFile(indexHtml) || '';
const moduleMatches = indexContent.match(/window\.AccentOS\.modules\.(\w+)\s*=/g) || [];
const detectedModules = [...new Set(moduleMatches.map(m => {
  const match = m.match(/window\.AccentOS\.modules\.(\w+)/);
  return match ? match[1] : null;
}))].filter(Boolean);

// --- Build output ---
const result = {
  generated_at: new Date().toISOString(),
  repo_root: REPO_ROOT,

  index_html: {
    path: 'index.html',
    size_bytes: indexStat.bytes,
    size_kb: indexStat.kb,
    line_count: indexStat.lines,
    status: indexStatus,
    threshold_warning_kb: 500,
    threshold_high_kb: 750,
    threshold_critical_kb: 900,
  },

  file_counts: {
    js_modules: jsFiles.length,
    sql_migrations: sqlFiles.length,
    worker_files: workerFiles.length,
  },

  largest_files: fileSizes.slice(0, 10),

  todo_fixme: {
    total: todoResults.total,
    locations: todoResults.locations,
  },

  direct_supabase_writes: {
    total: directWriteResults.total,
    locations: directWriteResults.locations,
    risk: directWriteResults.total === 0 ? 'OK'
      : directWriteResults.total <= 5 ? 'HIGH'
      : 'CRITICAL',
  },

  module_registry: {
    references: moduleRegistryResults.total,
    detected_modules: detectedModules,
    module_count: detectedModules.length,
  },

  patch_markers: {
    start_count: startMarkerCount,
    end_count: endMarkerCount,
    matched: startMarkerCount === endMarkerCount,
    unmatched_count: Math.abs(startMarkerCount - endMarkerCount),
  },

  sql_migrations: {
    count: sqlFiles.length,
    files: sqlFiles.map(f => path.relative(REPO_ROOT, f)),
  },
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
