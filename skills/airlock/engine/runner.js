#!/usr/bin/env node
'use strict';

const path = require('path');

const { getActualBranch } = require('../adapters/git');
const { getWipState } = require('../adapters/wip');
const { getHandoffState } = require('../adapters/session-handoff');
const { normalize } = require('./normalize');
const { runChecks } = require('./checks');
const { aggregate } = require('./gate');
const { appendLog } = require('../log');

const rules = require('../airlock-rules.json');
const patterns = require('../injection-patterns.json');

const TIMEOUT_MS = 5000;

function printDecision(decision, payload) {
  const icons = { PASS: '✓', WARN: '⚠', BLOCK: '✗' };
  const icon = icons[decision.decision] || '?';

  console.log(`\nAIRLOCK ${icon} ${decision.decision} (${decision.elapsed_ms}ms)`);

  if (decision.warnings.length) {
    decision.warnings.forEach(w => console.log(`  ${w}`));
  }
  if (decision.reasons.length) {
    decision.reasons.forEach(r => console.log(`  ${r}`));
  }

  if (decision.decision === 'BLOCK') {
    console.log('\n--- AIRLOCK BLOCK ---');
    console.log('Session halted. Review the above before proceeding.');
    console.log('To override: acknowledge the block reason and confirm intent.');
    console.log('---------------------\n');
  }
}

async function main() {
  const startTime = Date.now();

  const actualBranch = getActualBranch();
  const wipState = getWipState();
  const handoffState = getHandoffState();

  const payload = normalize({ actualBranch, wipState, handoffState });

  let results;
  try {
    results = await Promise.race([
      runChecks(rules, payload, patterns),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
      )
    ]);
  } catch (err) {
    const msg = err.message === 'TIMEOUT'
      ? `Validation timed out after ${TIMEOUT_MS}ms — running in degraded mode`
      : `Runner error: ${err.message}`;
    results = [{ id: 'runner', severity: 'warn', pass: true, warning: msg }];
  }

  const elapsed = Date.now() - startTime;
  const decision = aggregate(results, elapsed);

  printDecision(decision, payload);

  // Set exit code before event loop drains so audit log write (setImmediate) completes
  process.exitCode = decision.decision === 'BLOCK' ? 1 : 0;
  setImmediate(() => appendLog(payload, decision).catch(() => {}));
}

main().catch(err => {
  console.error(`AIRLOCK fatal error: ${err.message}`);
  // Don't block session on AIRLOCK internal failure — exit 0
});
