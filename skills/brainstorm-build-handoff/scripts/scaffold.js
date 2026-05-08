#!/usr/bin/env node
/**
 * scaffold.js — Generate a new brainstorm-build-handoff workspace
 *
 * Usage: node scaffold.js <project-name>
 *
 * Creates: skills/brainstorm-build-handoff/artifacts/<project-name>/
 *   raw-idea.md          ← paste your brainstorm here
 *   concept-extraction.json
 *   systems-analysis.json
 *   failure-analysis.json
 *   optimization-pass-1.json
 *   optimization-pass-2.json
 *   optimization-pass-3.json
 *   mvp-reduction.json
 *   build-handoff.md     ← final output (fill via templates/build-handoff.md)
 *
 * No external dependencies.
 */

const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(SKILL_ROOT, 'artifacts');
const SCHEMAS_DIR = path.join(SKILL_ROOT, 'schemas');
const TEMPLATES_DIR = path.join(SKILL_ROOT, 'templates');

function usage() {
  console.error('Usage: node scaffold.js <project-name>');
  console.error('  project-name: lowercase, hyphenated (e.g. "airlock", "my-feature")');
  process.exit(1);
}

function validateName(name) {
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    console.error(`Invalid project name: "${name}"`);
    console.error('Must be lowercase letters, numbers, and hyphens only.');
    usage();
  }
}

function readTemplate(filename) {
  const p = path.join(TEMPLATES_DIR, filename);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function readSchema(filename) {
  const p = path.join(SCHEMAS_DIR, filename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function emptyFromSchema(schema) {
  if (!schema || !schema.properties) return {};
  const obj = {};
  for (const [key, def] of Object.entries(schema.properties)) {
    if (def.type === 'array') obj[key] = [];
    else if (def.type === 'object') obj[key] = {};
    else if (def.type === 'integer') obj[key] = 0;
    else obj[key] = '';
  }
  return obj;
}

function scaffoldOptimizationPass(n) {
  const schema = readSchema('optimization-pass.json');
  const base = emptyFromSchema(schema);
  base.pass_number = n;
  base.focus_axis = ['workflow-correctness', 'entropy-reduction', 'mvp-boundary'][n - 1] || 'determinism';
  return base;
}

function main() {
  const projectName = process.argv[2];
  if (!projectName) usage();
  validateName(projectName);

  const projectDir = path.join(ARTIFACTS_DIR, projectName);

  if (fs.existsSync(projectDir)) {
    console.error(`Project already exists: ${projectDir}`);
    console.error('Delete it first or use a different name.');
    process.exit(1);
  }

  fs.mkdirSync(projectDir, { recursive: true });

  const today = new Date().toISOString().split('T')[0];

  // raw-idea.md
  fs.writeFileSync(
    path.join(projectDir, 'raw-idea.md'),
    `# ${projectName} — Raw Idea\nDate: ${today}\n\n---\n\n<!-- Paste your brainstorm here -->\n`
  );

  // Phase JSON stubs from schemas
  const phaseFiles = [
    ['concept-extraction.json', 'concept-extraction.json'],
    ['systems-analysis.json', 'systems-analysis.json'],
    ['failure-analysis.json', 'failure-analysis.json'],
    ['mvp-reduction.json', 'mvp-reduction.json'],
  ];

  for (const [outputFile, schemaFile] of phaseFiles) {
    const schema = readSchema(schemaFile);
    const stub = emptyFromSchema(schema);
    fs.writeFileSync(
      path.join(projectDir, outputFile),
      JSON.stringify(stub, null, 2) + '\n'
    );
  }

  // optimization passes 1-3
  for (let i = 1; i <= 3; i++) {
    const pass = scaffoldOptimizationPass(i);
    fs.writeFileSync(
      path.join(projectDir, `optimization-pass-${i}.json`),
      JSON.stringify(pass, null, 2) + '\n'
    );
  }

  // build-handoff.md from template
  let handoff = readTemplate('build-handoff.md') || '# BUILD HANDOFF — {{SKILL_NAME}}\n';
  handoff = handoff
    .replace(/{{SKILL_NAME}}/g, projectName)
    .replace(/{{VERSION}}/g, '1.0')
    .replace(/{{STATUS}}/g, 'DRAFT')
    .replace(/{{TARGET_EXECUTOR}}/g, 'Claude Code')
    .replace(/{{DATE}}/g, today);
  fs.writeFileSync(path.join(projectDir, 'build-handoff.md'), handoff);

  console.log(`\nScaffolded: ${projectDir}\n`);
  console.log('Files created:');
  fs.readdirSync(projectDir).forEach(f => console.log(`  ${f}`));
  console.log('\nNext steps:');
  console.log('  1. Paste your brainstorm into raw-idea.md');
  console.log('  2. Run brainstorm-build-handoff skill against raw-idea.md');
  console.log('  3. Fill phase JSON files as each phase completes');
  console.log('  4. Build handoff.md is your final deliverable');
}

main();
