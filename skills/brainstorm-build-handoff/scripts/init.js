#!/usr/bin/env node
/**
 * brainstorm-build-handoff — init
 *
 * Usage: node scripts/init.js <slug>
 *
 * Creates artifacts/<slug>/ with placeholders for every phase, plus a
 * meta.json. If the directory already exists, refuses unless --force is
 * passed; in that case, suggests appending -v2/-v3 instead.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const ARTIFACTS_ROOT = path.join(SKILL_ROOT, 'artifacts');

const SLUG_RE = /^[a-z][a-z0-9-]{0,23}$/;

const PHASE_PLACEHOLDERS = {
  '00-raw.md': '# Raw input — paste the brainstorm / transcript / dump below.\n\n',
  '01-concept.json': null,
  '02-systems.json': null,
  '03-failures.json': null,
  '04-ralph-pass-1.json': null,
  '04-ralph-pass-2.json': null,
  '04-ralph-pass-3.json': null,
  '05-mvp.json': null,
  '06-build-plan.json': null,
  '07-HANDOFF.md': null,
};

function main() {
  const slug = process.argv[2];
  const force = process.argv.includes('--force');
  if (!slug) {
    console.error('Usage: node scripts/init.js <slug> [--force]');
    process.exit(2);
  }
  if (!SLUG_RE.test(slug)) {
    console.error(`Invalid slug "${slug}". Must be kebab-case, 1-24 chars, start with a letter.`);
    process.exit(2);
  }

  const slugDir = path.join(ARTIFACTS_ROOT, slug);
  if (fs.existsSync(slugDir) && !force) {
    console.error(`Slug already exists: ${slugDir}`);
    console.error('Use --force to overwrite, or pick a new slug (e.g. -v2).');
    process.exit(2);
  }

  fs.mkdirSync(slugDir, { recursive: true });

  for (const [name, content] of Object.entries(PHASE_PLACEHOLDERS)) {
    const fp = path.join(slugDir, name);
    if (fs.existsSync(fp) && !force) continue;
    if (content !== null) {
      fs.writeFileSync(fp, content);
    } else if (name.endsWith('.json')) {
      // Stub file — empty until phase runs. Validator will report "invalid JSON" until written.
      // Touch only if missing, leave empty so validator complains until populated.
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, '');
    } else {
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, '');
    }
  }

  const meta = {
    slug,
    created_at: new Date().toISOString(),
    skill_version: '1.0.0',
    status: 'awaiting-raw-input',
  };
  fs.writeFileSync(path.join(slugDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

  console.log(`[OK] scaffolded ${slugDir}`);
  console.log('Next: paste the raw brainstorm into 00-raw.md, then run Phase 1.');
}

main();
