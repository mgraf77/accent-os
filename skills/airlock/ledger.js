/**
 * AIRLOCK — Ledger reader utilities
 *
 * Separate from gate.js write path (which uses buffered append).
 * This module provides read-only analysis of existing ledger.jsonl files.
 *
 * Exported API:
 *   readEntries(skill)           → entry[]
 *   lastN(skill, n)              → entry[] (most recent N entries)
 *   runSummary(skill)            → { total_runs, clean_runs, violated_runs, clean_streak, last_run_at }
 *   validateAppendOnly(skill)    → { ok, error? }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const REPO_ROOT    = path.resolve(__dirname, '..', '..');
const AIRLOCK_ROOT = path.join(REPO_ROOT, 'airlock');

function ledgerPath(skill) {
  return path.join(AIRLOCK_ROOT, skill, 'ledger.jsonl');
}

function readEntries(skill) {
  const lp = ledgerPath(skill);
  if (!fs.existsSync(lp)) return [];
  return fs
    .readFileSync(lp, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      try { return JSON.parse(line); }
      catch (e) { return { _parse_error: e.message, _line: i + 1 }; }
    });
}

function lastN(skill, n = 50) {
  const all = readEntries(skill);
  return all.slice(-n);
}

function runSummary(skill) {
  const entries = readEntries(skill);
  let total_runs = 0;
  let clean_runs = 0;
  let violated_runs = 0;
  let clean_streak = 0;
  let last_run_at = null;

  for (const e of entries) {
    if (e.action === 'run-end') {
      total_runs++;
      last_run_at = e.ts;
      if (e.run_outcome === 'clean') {
        clean_runs++;
        clean_streak = e.clean_streak || clean_streak + 1;
      } else {
        violated_runs++;
        clean_streak = 0;
      }
    }
  }
  return { total_runs, clean_runs, violated_runs, clean_streak, last_run_at };
}

/**
 * Verify that the ledger file has never been rewritten mid-file.
 * Strategy: timestamps must be monotonically non-decreasing across run-end entries.
 * A decrease indicates a rebase or insertion.
 */
function validateAppendOnly(skill) {
  const entries = readEntries(skill);
  let lastTs = null;
  for (const e of entries) {
    if (e._parse_error) return { ok: false, error: `parse error on line ${e._line}: ${e._parse_error}` };
    if (e.action === 'run-end') {
      if (lastTs && e.ts < lastTs) {
        return { ok: false, error: `timestamp regression at run_id=${e.run_id}: ${e.ts} < ${lastTs}` };
      }
      lastTs = e.ts;
    }
  }
  return { ok: true };
}

module.exports = { readEntries, lastN, runSummary, validateAppendOnly };
