#!/usr/bin/env node
/**
 * AIRLOCK — Operator command handler
 *
 * Usage (CLI):
 *   node skills/airlock/operator.js <command> [args...]
 *
 * Commands:
 *   init <skill>                           scaffold airlock/<skill>/policy.yaml
 *   status [skill]                         show quarantine + promotion status
 *   promote <skill> --reason "..."         promote skill to trusted
 *   demote <skill> --reason "..."          demote skill back to quarantined
 *   check-promote <skill>                  dry-run promotion eligibility
 *   validate-ledger <skill>                verify append-only invariant
 *
 * Claude/Codex: call these same functions programmatically via the module exports.
 *
 * No external dependencies. Node stdlib only.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const gate   = require('./gate');
const ledger = require('./ledger');

const REPO_ROOT      = path.resolve(__dirname, '..', '..');
const AIRLOCK_ROOT   = path.join(REPO_ROOT, 'airlock');
const PROMO_LOG_PATH = path.join(AIRLOCK_ROOT, 'promotion-log.md');
const TEMPLATE_PATH  = path.join(__dirname, 'templates', 'policy.yaml');

function ensureAirlockRoot() {
  fs.mkdirSync(AIRLOCK_ROOT, { recursive: true });
}

// ---------------------------------------------------------------------------
// init <skill>
// ---------------------------------------------------------------------------

function cmdInit(skill) {
  if (!skill) return fail('Usage: init <skill>');
  const dir = gate.policyDir(skill);
  const pp  = gate.policyPath(skill);

  if (fs.existsSync(pp)) {
    return fail(`policy.yaml already exists: ${pp}\nDelete it manually if you want to reinitialise.`);
  }

  fs.mkdirSync(dir, { recursive: true });
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
    .replace(/SKILL_NAME_PLACEHOLDER/g, skill);
  fs.writeFileSync(pp, template);

  console.log(`[AIRLOCK] init — ${pp}`);
  console.log('Edit policy.yaml to set read_paths, write_paths, and invoke_skills, then commit.');
  return { ok: true, path: pp };
}

// ---------------------------------------------------------------------------
// status [skill]
// ---------------------------------------------------------------------------

function cmdStatus(skill) {
  ensureAirlockRoot();
  const skills = skill
    ? [skill]
    : fs.readdirSync(AIRLOCK_ROOT).filter(n => {
        const pp = path.join(AIRLOCK_ROOT, n, 'policy.yaml');
        return fs.existsSync(pp);
      });

  if (skills.length === 0) {
    console.log('[AIRLOCK] no quarantined skills found.');
    return;
  }

  for (const s of skills) {
    const policy = gate.loadPolicy(s, { force: true });
    if (!policy) { console.log(`\n[AIRLOCK] ${s}: no policy found`); continue; }

    const summary = ledger.runSummary(s);
    const check   = gate.promotionCheck(s);
    const recent  = ledger.lastN(s, 50);

    console.log(`\n[AIRLOCK] ${s}`);
    console.log(`  status:        ${policy.status}`);
    console.log(`  total runs:    ${summary.total_runs}`);
    console.log(`  clean runs:    ${summary.clean_runs}`);
    console.log(`  violated runs: ${summary.violated_runs}`);
    console.log(`  clean streak:  ${summary.clean_streak} / ${policy.threshold_clean_streak}`);
    console.log(`  threshold:     ${summary.clean_runs} / ${policy.threshold_runs} total clean`);
    console.log(`  last run:      ${summary.last_run_at || 'never'}`);
    console.log(`  promotion:     ${check.eligible ? 'ELIGIBLE' : `not eligible — ${check.reason}`}`);

    const violations = recent.filter(e => e.violation_kind);
    if (violations.length) {
      console.log(`  recent violations (last 50 entries):`);
      for (const v of violations.slice(-5)) {
        console.log(`    [${v.ts}] ${v.action} → ${v.target} (${v.violation_kind})`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// promote <skill> --reason "..."
// ---------------------------------------------------------------------------

function cmdPromote(skill, reason, { force = false } = {}) {
  if (!skill) return fail('Usage: promote <skill> --reason "..."');
  if (!reason) return fail('[AIRLOCK] --reason is required for promotion.');

  const policy = gate.loadPolicy(skill, { force: true });
  if (!policy) return fail(`[AIRLOCK] no policy.yaml for skill "${skill}". Run: init ${skill}`);
  if (policy.status === 'trusted') {
    console.log(`[AIRLOCK] ${skill} is already trusted.`);
    return { ok: true };
  }

  const check = gate.promotionCheck(skill);
  if (!check.eligible && !force) {
    return fail(
      `[AIRLOCK] promotion ineligible: ${check.reason}\n` +
      `Use --force to override eligibility check (operator discretion).`
    );
  }

  // Flip status in policy.yaml
  const pp = gate.policyPath(skill);
  let yaml = fs.readFileSync(pp, 'utf8');
  yaml = yaml.replace(/^status:\s*quarantined/m, 'status: trusted');
  const now = new Date().toISOString();
  if (yaml.includes('promoted_at:')) {
    yaml = yaml.replace(/^promoted_at:.*$/m, `promoted_at: "${now}"`);
  } else {
    yaml += `promoted_at: "${now}"\n`;
  }
  fs.writeFileSync(pp, yaml);

  // Append to promotion-log.md
  ensureAirlockRoot();
  if (!fs.existsSync(PROMO_LOG_PATH)) {
    fs.writeFileSync(PROMO_LOG_PATH, '# AIRLOCK Promotion Log\n\n');
  }
  const summary = ledger.runSummary(skill);
  const entry = [
    `## ${now}`,
    `- **Action:** promote`,
    `- **Skill:** ${skill}`,
    `- **Reason:** ${reason}`,
    `- **Clean runs at promotion:** ${summary.clean_runs} / ${policy.threshold_runs}`,
    `- **Clean streak at promotion:** ${summary.clean_streak}`,
    `- **Forced:** ${force ? 'yes' : 'no'}`,
    '',
  ].join('\n');
  fs.appendFileSync(PROMO_LOG_PATH, '\n' + entry);

  console.log(`[AIRLOCK] ${skill} promoted to trusted.`);
  console.log(`  reason: ${reason}`);
  console.log(`  promotion-log.md updated.`);
  gate.loadPolicy(skill, { force: true }); // bust cache
  return { ok: true };
}

// ---------------------------------------------------------------------------
// demote <skill> --reason "..."
// ---------------------------------------------------------------------------

function cmdDemote(skill, reason) {
  if (!skill) return fail('Usage: demote <skill> --reason "..."');
  if (!reason) return fail('[AIRLOCK] --reason is required for demotion.');

  const policy = gate.loadPolicy(skill, { force: true });
  if (!policy) return fail(`[AIRLOCK] no policy.yaml for skill "${skill}".`);
  if (policy.status === 'quarantined') {
    console.log(`[AIRLOCK] ${skill} is already quarantined.`);
    return { ok: true };
  }

  // Flip status
  const pp = gate.policyPath(skill);
  let yaml = fs.readFileSync(pp, 'utf8');
  yaml = yaml.replace(/^status:\s*trusted/m, 'status: quarantined');
  fs.writeFileSync(pp, yaml);

  // Log
  ensureAirlockRoot();
  if (!fs.existsSync(PROMO_LOG_PATH)) {
    fs.writeFileSync(PROMO_LOG_PATH, '# AIRLOCK Promotion Log\n\n');
  }
  const now = new Date().toISOString();
  const entry = [
    `## ${now}`,
    `- **Action:** demote`,
    `- **Skill:** ${skill}`,
    `- **Reason:** ${reason}`,
    '',
  ].join('\n');
  fs.appendFileSync(PROMO_LOG_PATH, '\n' + entry);

  console.log(`[AIRLOCK] ${skill} demoted to quarantined.`);
  console.log(`  reason: ${reason}`);
  gate.loadPolicy(skill, { force: true });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// check-promote <skill>
// ---------------------------------------------------------------------------

function cmdCheckPromote(skill) {
  if (!skill) return fail('Usage: check-promote <skill>');
  const check = gate.promotionCheck(skill);
  console.log(`[AIRLOCK] ${skill}: ${check.eligible ? 'ELIGIBLE for promotion' : `not eligible — ${check.reason}`}`);
  return check;
}

// ---------------------------------------------------------------------------
// validate-ledger <skill>
// ---------------------------------------------------------------------------

function cmdValidateLedger(skill) {
  if (!skill) return fail('Usage: validate-ledger <skill>');
  const result = ledger.validateAppendOnly(skill);
  if (result.ok) {
    console.log(`[AIRLOCK] ledger/${skill}: append-only invariant verified.`);
  } else {
    fail(`[AIRLOCK] ledger/${skill}: invariant VIOLATED — ${result.error}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function fail(msg) {
  console.error(msg);
  if (require.main === module) process.exit(1);
  return { ok: false, error: msg };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd) {
    console.error('Commands: init, status, promote, demote, check-promote, validate-ledger');
    process.exit(2);
  }

  const parseArgs = (args) => {
    const out = { positional: [], flags: {} };
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        out.flags[key] = args[i + 1] || true;
        i++;
      } else {
        out.positional.push(args[i]);
      }
    }
    return out;
  };

  const { positional, flags } = parseArgs(rest);

  switch (cmd) {
    case 'init':            cmdInit(positional[0]); break;
    case 'status':          cmdStatus(positional[0]); break;
    case 'promote':         cmdPromote(positional[0], flags.reason, { force: !!flags.force }); break;
    case 'demote':          cmdDemote(positional[0], flags.reason); break;
    case 'check-promote':   cmdCheckPromote(positional[0]); break;
    case 'validate-ledger': cmdValidateLedger(positional[0]); break;
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exit(2);
  }
}

if (require.main === module) main();

module.exports = { cmdInit, cmdStatus, cmdPromote, cmdDemote, cmdCheckPromote, cmdValidateLedger };
