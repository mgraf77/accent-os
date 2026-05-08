#!/usr/bin/env node
/**
 * brainstorm-build-handoff — validator
 *
 * Usage: node scripts/validate.js <slug>
 *
 * Exit: 0 = pass, 1 = at least one failure, 2 = invocation error.
 *
 * No external dependencies. Implements only the subset of JSON Schema needed
 * for our artifacts: required, type, enum, minItems, maxItems, minLength,
 * maxLength, additionalProperties:false, pattern, const, properties, items,
 * $ref to local #/definitions, definitions.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const SCHEMA_DIR = path.join(SKILL_ROOT, 'schemas');
const ARTIFACTS_ROOT = path.join(SKILL_ROOT, 'artifacts');

const AMBIGUITY_TOKENS = [
  'TBD', '???', 'FIXME',
  'various', 'some of the', 'etc.', 'and so on',
  'as needed', 'where appropriate', 'in general',
  'kind of', 'maybe', 'probably', 'should be',
  "we'll figure out", 'later',
];

const PHASE_FILES = [
  { file: '01-concept.json',       schema: '01-concept.schema.json' },
  { file: '02-systems.json',       schema: '02-systems.schema.json' },
  { file: '03-failures.json',      schema: '03-failures.schema.json' },
  { file: '04-ralph-pass-1.json',  schema: '04-ralph-pass.schema.json', extra: { pass: 1, focus: 'simplify' } },
  { file: '04-ralph-pass-2.json',  schema: '04-ralph-pass.schema.json', extra: { pass: 2, focus: 'de-risk' } },
  { file: '04-ralph-pass-3.json',  schema: '04-ralph-pass.schema.json', extra: { pass: 3, focus: 'unify' } },
  { file: '05-mvp.json',           schema: '05-mvp.schema.json' },
  { file: '06-build-plan.json',    schema: '06-build-plan.schema.json' },
];

const HANDOFF_SECTIONS = [
  'Objective', 'Scope Boundary', 'Architecture',
  'Implementation Phases', 'Validation Gates', 'Operating Rules',
  'Out of Scope', 'Next Phases', 'Source Artifacts',
];

function loadJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function resolveRef(schema, ref) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported $ref: ${ref}`);
  const parts = ref.slice(2).split('/');
  let node = schema;
  for (const part of parts) node = node[part];
  return node;
}

function validateNode(value, schema, root, pathStr, errors) {
  if (schema.$ref) return validateNode(value, resolveRef(root, schema.$ref), root, pathStr, errors);

  if (schema.const !== undefined) {
    if (JSON.stringify(value) !== JSON.stringify(schema.const)) {
      errors.push(`${pathStr}: const mismatch — expected ${JSON.stringify(schema.const)}`);
    }
  }

  if (schema.type === 'object' || schema.properties) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${pathStr}: expected object`);
      return;
    }
    if (Array.isArray(schema.required)) {
      for (const k of schema.required) {
        if (!(k in value)) errors.push(`${pathStr}.${k}: required key missing`);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties) && k !== '_unresolved' && !k.startsWith('_unresolved_')) {
          errors.push(`${pathStr}.${k}: additional property not allowed`);
        }
      }
    }
    if (schema.properties) {
      for (const [k, sub] of Object.entries(schema.properties)) {
        if (k in value) validateNode(value[k], sub, root, `${pathStr}.${k}`, errors);
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) { errors.push(`${pathStr}: expected array`); return; }
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${pathStr}: minItems ${schema.minItems}, got ${value.length}`);
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      errors.push(`${pathStr}: maxItems ${schema.maxItems}, got ${value.length}`);
    }
    if (schema.items) {
      value.forEach((v, i) => validateNode(v, schema.items, root, `${pathStr}[${i}]`, errors));
    }
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') {
      // Allow string OR object with _unresolved marker — but only for simple values.
      errors.push(`${pathStr}: expected string`);
      return;
    }
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${pathStr}: minLength ${schema.minLength}, got ${value.length}`);
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      errors.push(`${pathStr}: maxLength ${schema.maxLength}, got ${value.length}`);
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      errors.push(`${pathStr}: enum mismatch — got "${value}"`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${pathStr}: pattern ${schema.pattern} not matched`);
    }
  } else if (schema.type === 'integer') {
    if (!Number.isInteger(value)) errors.push(`${pathStr}: expected integer`);
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      errors.push(`${pathStr}: enum mismatch — got ${value}`);
    }
  }
}

function scanAmbiguity(value, pathStr, warnings, errors) {
  const visit = (v, p) => {
    if (typeof v === 'string') {
      const lower = v.toLowerCase();
      if (lower.startsWith('_unresolved')) {
        warnings.push(`${p}: unresolved marker — "${v}"`);
        return;
      }
      for (const tok of AMBIGUITY_TOKENS) {
        const re = new RegExp(`(^|\\W)${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\W)`, 'i');
        if (re.test(v)) {
          errors.push(`${p}: ambiguous token "${tok}" in value`);
          break;
        }
      }
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => visit(item, `${p}[${i}]`));
    } else if (v && typeof v === 'object') {
      for (const [k, sub] of Object.entries(v)) {
        if (k.startsWith('_unresolved')) {
          warnings.push(`${p}.${k}: unresolved marker — "${sub}"`);
        } else {
          visit(sub, `${p}.${k}`);
        }
      }
    }
  };
  visit(value, pathStr);
}

function checkSentenceCount(s, max = 2) {
  // Count sentence-ending punctuation. Allow trailing one.
  const matches = (s.match(/[.!?](\s|$)/g) || []).length;
  return matches <= max;
}

function detectCycle(phases) {
  const adj = new Map();
  for (const p of phases) adj.set(p.id, p.depends_on || []);
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const id of adj.keys()) color.set(id, WHITE);
  const dfs = (id) => {
    color.set(id, GRAY);
    for (const dep of adj.get(id) || []) {
      if (!adj.has(dep)) return `unknown dependency: ${id} → ${dep}`;
      if (color.get(dep) === GRAY) return `cycle through ${id} → ${dep}`;
      if (color.get(dep) === WHITE) {
        const r = dfs(dep);
        if (r) return r;
      }
    }
    color.set(id, BLACK);
    return null;
  };
  for (const id of adj.keys()) {
    if (color.get(id) === WHITE) {
      const r = dfs(id);
      if (r) return r;
    }
  }
  return null;
}

function validatePhase01(data, errors) {
  if (typeof data.true_objective === 'string' && !checkSentenceCount(data.true_objective, 2)) {
    errors.push('01-concept.true_objective: must be a single sentence');
  }
}

function validatePhase02(data, errors) {
  for (const [i, e] of (data.entities || []).entries()) {
    if (e && typeof e.owns === 'string' && /\b(shared|everyone|all|various)\b/i.test(e.owns)) {
      errors.push(`02-systems.entities[${i}].owns: must name a single owner`);
    }
  }
}

function validatePhase04(data, errors, expected) {
  if (data.pass !== expected.pass) {
    errors.push(`04-ralph-pass-${expected.pass}.pass: expected ${expected.pass}, got ${data.pass}`);
  }
  if (data.focus !== expected.focus) {
    errors.push(`04-ralph-pass-${expected.pass}.focus: expected "${expected.focus}", got "${data.focus}"`);
  }
  const total = (data.removals||[]).length + (data.merges||[]).length + (data.renames||[]).length + (data.additions||[]).length;
  if (total > 10) {
    errors.push(`04-ralph-pass-${expected.pass}: ${total} changes; cap is 10`);
  }
}

function validatePhase05(data, errors) {
  if (typeof data.scope_boundary === 'string' && !checkSentenceCount(data.scope_boundary, 1)) {
    errors.push('05-mvp.scope_boundary: must be a single sentence');
  }
}

function validatePhase06(data, errors) {
  if (Array.isArray(data.implementation_phases)) {
    const cycle = detectCycle(data.implementation_phases);
    if (cycle) errors.push(`06-build-plan.implementation_phases: ${cycle}`);
    for (const p of data.implementation_phases) {
      if (!p.validation || p.validation.trim().length < 5) {
        errors.push(`06-build-plan.implementation_phases.${p.id}.validation: missing or empty`);
      }
    }
  }
}

function validateHandoff(slugDir, errors) {
  const file = path.join(slugDir, '07-HANDOFF.md');
  if (!fs.existsSync(file)) {
    errors.push('07-HANDOFF.md: not assembled — run scripts/assemble-handoff.js');
    return;
  }
  const md = fs.readFileSync(file, 'utf8');
  if (md.includes('{{') && md.includes('}}')) {
    errors.push('07-HANDOFF.md: unresolved template placeholders remain');
  }
  let lastIdx = -1;
  for (const section of HANDOFF_SECTIONS) {
    const idx = md.indexOf(`\n## ${section}`);
    if (idx === -1) {
      errors.push(`07-HANDOFF.md: missing required section "## ${section}"`);
    } else if (idx < lastIdx) {
      errors.push(`07-HANDOFF.md: section "## ${section}" out of order`);
    } else {
      lastIdx = idx;
    }
  }
  for (const tok of AMBIGUITY_TOKENS) {
    const re = new RegExp(`(^|\\W)${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\W)`, 'i');
    if (re.test(md)) errors.push(`07-HANDOFF.md: ambiguous token "${tok}"`);
  }
}

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/validate.js <slug>');
    process.exit(2);
  }
  const slugDir = path.join(ARTIFACTS_ROOT, slug);
  if (!fs.existsSync(slugDir)) {
    console.error(`Artifacts dir not found: ${slugDir}`);
    process.exit(2);
  }

  const errors = [];
  const warnings = [];

  for (const { file, schema, extra } of PHASE_FILES) {
    const artifactPath = path.join(slugDir, file);
    if (!fs.existsSync(artifactPath)) {
      errors.push(`${file}: missing`);
      continue;
    }
    let data;
    try { data = loadJSON(artifactPath); }
    catch (e) { errors.push(`${file}: invalid JSON — ${e.message}`); continue; }

    const sch = loadJSON(path.join(SCHEMA_DIR, schema));
    validateNode(data, sch, sch, file, errors);
    scanAmbiguity(data, file, warnings, errors);

    if (file === '01-concept.json') validatePhase01(data, errors);
    if (file === '02-systems.json') validatePhase02(data, errors);
    if (file.startsWith('04-ralph-pass-')) validatePhase04(data, errors, extra);
    if (file === '05-mvp.json') validatePhase05(data, errors);
    if (file === '06-build-plan.json') validatePhase06(data, errors);
  }

  validateHandoff(slugDir, errors);

  if (warnings.length) {
    console.error(`\n[warnings — ${warnings.length}]`);
    for (const w of warnings) console.error(`  ${w}`);
  }

  if (errors.length) {
    console.log(`\n[FAIL — ${errors.length} error(s)]`);
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }

  console.log(`[OK] ${slug} — all artifacts valid (${warnings.length} warnings)`);
  process.exit(0);
}

main();
