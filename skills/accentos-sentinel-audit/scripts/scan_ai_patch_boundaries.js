#!/usr/bin/env node
/**
 * scan_ai_patch_boundaries.js
 * Scans for START/END patch markers, unmatched markers, and large unmarked sections.
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

const TARGET_EXTENSIONS = ['.html', '.js', '.ts'];
const indexHtml = path.join(REPO_ROOT, 'index.html');
const jsDir = path.join(REPO_ROOT, 'js');
const workerDir = path.join(REPO_ROOT, 'worker');

const jsFiles = walkDir(jsDir, TARGET_EXTENSIONS);
const workerFiles = walkDir(workerDir, TARGET_EXTENSIONS);
const allFiles = [indexHtml, ...jsFiles, ...workerFiles].filter(f => fs.existsSync(f));

const SIZE_THRESHOLDS = {
  NEEDS_MARKERS_KB: 50,
  HIGH_RISK_KB: 100,
  CRITICAL_RISK_KB: 200,
};

const fileResults = [];

for (const f of allFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);
  const sizeBytes = Buffer.byteLength(content, 'utf8');
  const sizeKb = Math.round(sizeBytes / 1024);

  // Find all START markers
  const startMarkers = [];
  const startRe = /(?:\/\/|<!--)\s*START:\s*AccentOS\s+([^\n>-]+?)(?:\s*-->|\s*$)/gm;
  let m;
  while ((m = startRe.exec(content)) !== null) {
    const lineNum = content.substring(0, m.index).split('\n').length;
    startMarkers.push({ name: m[1].trim(), line: lineNum });
  }

  // Find all END markers
  const endMarkers = [];
  const endRe = /(?:\/\/|<!--)\s*END:\s*AccentOS\s+([^\n>-]+?)(?:\s*-->|\s*$)/gm;
  while ((m = endRe.exec(content)) !== null) {
    const lineNum = content.substring(0, m.index).split('\n').length;
    endMarkers.push({ name: m[1].trim(), line: lineNum });
  }

  // Find unmatched markers
  const startNames = startMarkers.map(s => s.name);
  const endNames = endMarkers.map(e => e.name);
  const missingEnds = startMarkers.filter(s => !endNames.includes(s.name))
    .map(s => ({ type: 'MISSING_END', name: s.name, line: s.line }));
  const missingStarts = endMarkers.filter(e => !startNames.includes(e.name))
    .map(e => ({ type: 'MISSING_START', name: e.name, line: e.line }));
  const unmatchedMarkers = [...missingEnds, ...missingStarts];

  // Estimate sections without markers
  const markedSections = startMarkers.filter(s => endNames.includes(s.name));

  // Check for large sections without markers
  let riskLevel = 'OK';
  let needsMarkers = false;

  if (sizeKb >= SIZE_THRESHOLDS.NEEDS_MARKERS_KB && startMarkers.length === 0) {
    needsMarkers = true;
    if (sizeKb >= SIZE_THRESHOLDS.CRITICAL_RISK_KB) riskLevel = 'HIGH';
    else if (sizeKb >= SIZE_THRESHOLDS.HIGH_RISK_KB) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
  }

  if (unmatchedMarkers.length > 0) riskLevel = 'HIGH';

  // AI maintainability score for this file
  let fileScore = 100;
  if (needsMarkers && sizeKb >= SIZE_THRESHOLDS.CRITICAL_RISK_KB) fileScore -= 20;
  else if (needsMarkers && sizeKb >= SIZE_THRESHOLDS.HIGH_RISK_KB) fileScore -= 10;
  fileScore -= unmatchedMarkers.length * 10;

  fileResults.push({
    file: relFile,
    size_kb: sizeKb,
    start_markers: startMarkers,
    end_markers: endMarkers,
    marked_sections: markedSections.map(s => s.name),
    unmatched_markers: unmatchedMarkers,
    needs_markers: needsMarkers,
    risk_level: riskLevel,
    file_score: Math.max(0, fileScore),
  });
}

// Overall score
const highRiskFiles = fileResults.filter(f => f.risk_level === 'HIGH');
const mediumRiskFiles = fileResults.filter(f => f.risk_level === 'MEDIUM');
const filesNeedingMarkers = fileResults.filter(f => f.needs_markers);
const filesWithUnmatched = fileResults.filter(f => f.unmatched_markers.length > 0);

// index.html specific
const indexResult = fileResults.find(f => f.file === 'index.html');

const overallScore = Math.max(0,
  100
  - (highRiskFiles.length * 8)
  - (mediumRiskFiles.length * 4)
  - (filesWithUnmatched.reduce((n, f) => n + f.unmatched_markers.length, 0) * 5)
);

const result = {
  generated_at: new Date().toISOString(),
  repo_root: REPO_ROOT,

  summary: {
    files_scanned: fileResults.length,
    overall_ai_patchability_score: overallScore,
    files_with_markers: fileResults.filter(f => f.start_markers.length > 0).length,
    files_needing_markers: filesNeedingMarkers.length,
    files_with_unmatched_markers: filesWithUnmatched.length,
    high_risk_files: highRiskFiles.length,
    medium_risk_files: mediumRiskFiles.length,
  },

  index_html: indexResult || null,

  high_risk_files: highRiskFiles.map(f => ({
    file: f.file,
    size_kb: f.size_kb,
    risk: f.risk_level,
    unmatched: f.unmatched_markers,
    needs_markers: f.needs_markers,
  })),

  medium_risk_files: mediumRiskFiles.map(f => ({
    file: f.file,
    size_kb: f.size_kb,
    needs_markers: f.needs_markers,
  })),

  all_files: fileResults.filter(f => f.size_kb > 5),
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
