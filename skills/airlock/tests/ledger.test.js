#!/usr/bin/env node
/**
 * AIRLOCK — ledger.test.js
 *
 * Validates the append-only invariant and core gate/ledger contracts.
 * No test framework required — vanilla Node assertions.
 *
 * Usage: node skills/airlock/tests/ledger.test.js
 * Exit:  0 = all pass, 1 = failures.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const { execSync } = require('child_process');
const SKILL_ROOT = path.resolve(__dirname, '..', '..', '..');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function run(cmd) {
  try {
    return { stdout: execSync(cmd, { encoding: 'utf8', cwd: SKILL_ROOT }), ok: true };
  } catch (e) {
    return { stdout: e.stdout || '', stderr: e.stderr || '', ok: false };
  }
}

// Use a dedicated test skill name so we don't touch real airlock data
const TEST_SKILL = `_test-${Date.now()}`;
const TEST_SKILL_DIR = path.join(SKILL_ROOT, 'airlock', TEST_SKILL);

function cleanup() {
  try { fs.rmSync(TEST_SKILL_DIR, { recursive: true, force: true }); } catch (_) {}
}

// ---------------------------------------------------------------------------
console.log('\n[test] gate.js — policy.schema.json validate (JSON Schema shape check)');
// ---------------------------------------------------------------------------
{
  const schema = JSON.parse(fs.readFileSync(
    path.join(SKILL_ROOT, 'skills', 'airlock', 'policy.schema.json'), 'utf8'));
  assert('schema has required field list', Array.isArray(schema.required) && schema.required.length >= 8);
  assert('schema.properties.status has enum', schema.properties.status.enum.includes('quarantined'));
  assert('schema.properties.status has trusted', schema.properties.status.enum.includes('trusted'));
  assert('schema additionalProperties false', schema.additionalProperties === false);
}

// ---------------------------------------------------------------------------
console.log('\n[test] operator init — scaffold policy.yaml');
// ---------------------------------------------------------------------------
{
  cleanup();
  const r = run(`node skills/airlock/operator.js init ${TEST_SKILL}`);
  assert('init exits ok', r.ok, r.stderr);

  const pp = path.join(TEST_SKILL_DIR, 'policy.yaml');
  assert('policy.yaml created', fs.existsSync(pp));

  const content = fs.readFileSync(pp, 'utf8');
  assert('skill name injected', content.includes(`skill: ${TEST_SKILL}`));
  assert('status: quarantined', content.includes('status: quarantined'));
  assert('threshold_runs present', content.includes('threshold_runs:'));

  // init again — should fail
  const r2 = run(`node skills/airlock/operator.js init ${TEST_SKILL}`);
  assert('re-init rejected', !r2.ok);
}

// ---------------------------------------------------------------------------
console.log('\n[test] operator preflight — policy-missing error');
// ---------------------------------------------------------------------------
{
  const GHOST = `_ghost-${Date.now()}`;
  const gate = require('../gate');
  const result = gate.preflight(GHOST);
  assert('preflight fails without policy', !result.ok);
  assert('preflight emits policy-missing', result.error.includes('policy-missing'));
}

// ---------------------------------------------------------------------------
console.log('\n[test] gate.js — interceptRead / interceptWrite / routerHook / networkBlock');
// ---------------------------------------------------------------------------
{
  // Need policy loaded — reuse TEST_SKILL which was init'd above
  const gate = require('../gate');

  // Read a path matching read_paths (skills/TEST_SKILL/**)
  const allowedPath = `skills/${TEST_SKILL}/SKILL.md`;
  const r1 = gate.interceptRead(TEST_SKILL, allowedPath);
  assert('interceptRead allows listed path', r1.allowed);

  // Read a path NOT matching
  const blockedPath = 'MASTER.md';
  const r2 = gate.interceptRead(TEST_SKILL, blockedPath);
  assert('interceptRead blocks unlisted path', !r2.allowed);
  assert('blocked read entry has violation_kind', r2.entry.violation_kind === 'path-not-allowed');

  // Write allowed
  const r3 = gate.interceptWrite(TEST_SKILL, allowedPath);
  assert('interceptWrite allows listed path', r3.allowed);
  assert('allowed write has no shadow', r3.shadowPath === null);

  // Write blocked → shadowPath
  const r4 = gate.interceptWrite(TEST_SKILL, blockedPath);
  assert('interceptWrite blocks unlisted path', !r4.allowed);
  assert('blocked write has shadowPath', typeof r4.shadowPath === 'string' && r4.shadowPath.includes('shadow'));

  // Router hook — invoke_skills is empty → blocked
  const r5 = gate.routerHook(TEST_SKILL, 'vibe-speak');
  assert('routerHook blocks unlisted skill', !r5.allowed);
  assert('routerHook violation kind', r5.entry.violation_kind === 'invoke-not-allowed');

  // Network always blocked when quarantined
  const r6 = gate.networkBlock(TEST_SKILL, 'https://api.example.com/v1');
  assert('networkBlock blocks outbound', !r6.allowed);
  assert('networkBlock violation kind', r6.entry.violation_kind === 'network-blocked');
}

// ---------------------------------------------------------------------------
console.log('\n[test] gate.js — flushLedger writes append-only JSONL');
// ---------------------------------------------------------------------------
{
  const gate = require('../gate');
  const ledger = require('../ledger');
  const lp = path.join(TEST_SKILL_DIR, 'ledger.jsonl');

  // Flush a violated run (network block was recorded above)
  gate.flushLedger(TEST_SKILL, 'violated');
  assert('ledger.jsonl created', fs.existsSync(lp));

  const entries = ledger.readEntries(TEST_SKILL);
  assert('entries present', entries.length > 0);
  const runEnd = entries.find(e => e.action === 'run-end');
  assert('run-end entry present', !!runEnd);
  assert('run-end outcome violated', runEnd.run_outcome === 'violated');
  assert('clean_streak reset to 0 on violation', runEnd.clean_streak === 0);

  // Second run — clean
  gate.interceptRead(TEST_SKILL, `skills/${TEST_SKILL}/SKILL.md`); // allowed
  gate.flushLedger(TEST_SKILL, 'clean');

  const summary = ledger.runSummary(TEST_SKILL);
  assert('summary has 2 total runs', summary.total_runs === 2);
  assert('summary has 1 clean run', summary.clean_runs === 1);
  assert('clean streak is 1', summary.clean_streak === 1);
}

// ---------------------------------------------------------------------------
console.log('\n[test] ledger.js — validateAppendOnly');
// ---------------------------------------------------------------------------
{
  const ledger = require('../ledger');
  const r = ledger.validateAppendOnly(TEST_SKILL);
  assert('append-only valid for clean ledger', r.ok);
}

// ---------------------------------------------------------------------------
console.log('\n[test] operator promote — requires --reason');
// ---------------------------------------------------------------------------
{
  const r = run(`node skills/airlock/operator.js promote ${TEST_SKILL}`);
  assert('promote without --reason rejected', !r.ok);
}

// ---------------------------------------------------------------------------
console.log('\n[test] operator check-promote — below threshold');
// ---------------------------------------------------------------------------
{
  const r = run(`node skills/airlock/operator.js check-promote ${TEST_SKILL}`);
  assert('check-promote runs ok', r.ok || r.stdout.includes('not eligible'));
  assert('check-promote reports not eligible', r.stdout.includes('not eligible'));
}

// ---------------------------------------------------------------------------
console.log('\n[test] operator promote --force --reason');
// ---------------------------------------------------------------------------
{
  const r = run(`node skills/airlock/operator.js promote ${TEST_SKILL} --reason "integration test" --force`);
  assert('force-promote succeeds', r.ok, r.stderr);

  const pp = path.join(TEST_SKILL_DIR, 'policy.yaml');
  const yaml = fs.readFileSync(pp, 'utf8');
  assert('policy.yaml status flipped to trusted', yaml.includes('status: trusted'));

  const promoLog = path.join(SKILL_ROOT, 'airlock', 'promotion-log.md');
  assert('promotion-log.md updated', fs.existsSync(promoLog));
  const logContent = fs.readFileSync(promoLog, 'utf8');
  assert('log contains skill name', logContent.includes(TEST_SKILL));
  assert('log contains reason', logContent.includes('integration test'));
}

// ---------------------------------------------------------------------------
console.log('\n[test] gate.js — trusted skill bypasses interception');
// ---------------------------------------------------------------------------
{
  const gate = require('../gate');
  gate.loadPolicy(TEST_SKILL, { force: true }); // bust cache after promote

  const r = gate.preflight(TEST_SKILL);
  assert('preflight ok for trusted', r.ok);
  assert('preflight signals trusted', r.trusted === true);

  const r2 = gate.interceptRead(TEST_SKILL, 'MASTER.md');
  assert('trusted skill read not intercepted', r2.allowed && r2.entry === null);

  const r3 = gate.networkBlock(TEST_SKILL, 'https://api.example.com/v1');
  assert('trusted skill network not blocked', r3.allowed && r3.entry === null);
}

// ---------------------------------------------------------------------------
console.log('\n[test] operator demote --reason');
// ---------------------------------------------------------------------------
{
  const r = run(`node skills/airlock/operator.js demote ${TEST_SKILL} --reason "test demotion"`);
  assert('demote ok', r.ok, r.stderr);

  const pp = path.join(TEST_SKILL_DIR, 'policy.yaml');
  const yaml = fs.readFileSync(pp, 'utf8');
  assert('policy.yaml reverted to quarantined', yaml.includes('status: quarantined'));
}

// ---------------------------------------------------------------------------
cleanup();
console.log(`\n[AIRLOCK tests] ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
