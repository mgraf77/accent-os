#!/usr/bin/env node
/**
 * brainstorm-build-handoff — handoff assembler
 *
 * Usage: node scripts/assemble-handoff.js <slug>
 *
 * Reads artifacts/<slug>/01..06 + meta.json, fills templates/handoff.md,
 * writes artifacts/<slug>/07-HANDOFF.md. Deterministic — generates no prose
 * beyond what the artifacts contain.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const TEMPLATES = path.join(SKILL_ROOT, 'templates');
const ARTIFACTS_ROOT = path.join(SKILL_ROOT, 'artifacts');
const SKILL_VERSION = '1.0.0';

function loadJSON(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function bullets(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '_(none)_';
  return arr.map(s => `- ${s}`).join('\n');
}

function table(headers, rows) {
  if (!rows || rows.length === 0) return '_(none)_';
  const head = `| ${headers.join(' | ')} |`;
  const sep  = `|${headers.map(() => '---').join('|')}|`;
  const body = rows.map(r => `| ${headers.map(h => String(r[h] ?? '')).join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}`;
}

function entitiesTable(entities) {
  return table(['name', 'owns', 'lifecycle'], entities);
}

function orchestrationTable(rows) {
  return table(['trigger', 'actor', 'effect', 'traces_to_goal'],
               rows.map(r => ({ ...r, traces_to_goal: r.traces_to_goal || '_unspecified' })));
}

function stateTable(rows) {
  return table(['key', 'shape', 'owner', 'persistence'], rows);
}

function governanceTable(rows) {
  return table(['rule', 'enforced_by', 'failure_mode'], rows);
}

function interopTable(rows) {
  return table(['protocol', 'consumer', 'format'], rows);
}

function phasesBlock(phases) {
  if (!phases || phases.length === 0) return '_(none)_';
  return phases.map(p => {
    const deps = p.depends_on && p.depends_on.length ? p.depends_on.join(', ') : '—';
    const outs = p.outputs.map(o => `\`${o}\``).join(', ');
    return `### ${p.id} — ${p.title}\n\n- **Depends on:** ${deps}\n- **Outputs:** ${outs}\n- **Validation:** ${p.validation}`;
  }).join('\n\n');
}

function dirStructureBlock(rows) {
  if (!rows || rows.length === 0) return '_(none)_';
  return '```\n' + rows.map(r => `${r.path.padEnd(40)}# ${r.purpose}`).join('\n') + '\n```';
}

function schemasTable(rows) {
  return table(['name', 'owner_phase', 'format'], rows);
}

function gatesBlock(gates) {
  if (!gates || gates.length === 0) return '_(none)_';
  return gates.map((g, i) => `${i + 1}. **${g.gate}** — applies to \`${g.applies_to}\` — passes if: ${g.passes_if}`).join('\n');
}

function deferredBlock(rows) {
  if (!rows || rows.length === 0) return '_(none)_';
  return rows.map(r => `- **${r.item}** — until: ${r.until} — _${r.reason}_`).join('\n');
}

function deletedBlock(rows) {
  if (!rows || rows.length === 0) return '_(none)_';
  return rows.map(r => `- **${r.item}** — _${r.reason}_`).join('\n');
}

function nextPhasesBlock(rows) {
  if (!rows || rows.length === 0) return '_(none)_';
  return rows.map(r => `- **Trigger:** ${r.trigger} — **Scope:** ${r.scope}`).join('\n');
}

function ralphNotesBlock(passes) {
  const out = [];
  for (const p of passes) {
    const total = (p.removals||[]).length + (p.merges||[]).length + (p.renames||[]).length + (p.additions||[]).length;
    const converged = total <= 2 && (!p.open_issues || p.open_issues.length === 0);
    out.push(`### Pass ${p.pass} — focus: ${p.focus}${converged ? ' _(converged)_' : ''}\n`);
    if (p.determinism_wins && p.determinism_wins.length) {
      out.push('**Determinism wins:**');
      out.push(p.determinism_wins.map(w => `- \`${w.surface}\`: \`${w.before}\` → \`${w.after}\``).join('\n'));
      out.push('');
    }
    if (p.removals && p.removals.length) {
      out.push('**Removed:** ' + p.removals.map(r => `\`${r.target}\``).join(', '));
    }
    if (p.merges && p.merges.length) {
      out.push('**Merged:** ' + p.merges.map(m => `${m.targets.map(t=>`\`${t}\``).join(' + ')} → \`${m.into}\``).join('; '));
    }
    if (p.renames && p.renames.length) {
      out.push('**Renamed:** ' + p.renames.map(r => `\`${r.from}\` → \`${r.to}\``).join('; '));
    }
    if (p.open_issues && p.open_issues.length) {
      out.push('**Open issues carried forward:**');
      out.push(p.open_issues.map(s => `- ${s}`).join('\n'));
    }
    out.push('');
  }
  return out.join('\n');
}

function sourceArtifactsBlock(slug) {
  const files = [
    '01-concept.json', '02-systems.json', '03-failures.json',
    '04-ralph-pass-1.json', '04-ralph-pass-2.json', '04-ralph-pass-3.json',
    '05-mvp.json', '06-build-plan.json', 'meta.json',
  ];
  return files.map(f => `- \`artifacts/${slug}/${f}\``).join('\n');
}

function deriveTitle(concept) {
  return concept.true_objective.split(/[.!?]/)[0].slice(0, 80);
}

function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Unfilled placeholder: ${k}`);
    return vars[k];
  });
}

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/assemble-handoff.js <slug>');
    process.exit(2);
  }
  const slugDir = path.join(ARTIFACTS_ROOT, slug);
  if (!fs.existsSync(slugDir)) {
    console.error(`Artifacts dir not found: ${slugDir}`);
    process.exit(2);
  }

  const concept   = loadJSON(path.join(slugDir, '01-concept.json'));
  const systems   = loadJSON(path.join(slugDir, '02-systems.json'));
  const _failures = loadJSON(path.join(slugDir, '03-failures.json'));
  const passes    = [1, 2, 3].map(i => loadJSON(path.join(slugDir, `04-ralph-pass-${i}.json`)));
  const mvp       = loadJSON(path.join(slugDir, '05-mvp.json'));
  const plan      = loadJSON(path.join(slugDir, '06-build-plan.json'));

  const template = fs.readFileSync(path.join(TEMPLATES, 'handoff.md'), 'utf8');

  const vars = {
    PROJECT_TITLE:        deriveTitle(concept),
    GENERATED_AT:         new Date().toISOString(),
    SLUG:                 slug,
    SKILL_VERSION:        SKILL_VERSION,
    VALIDATOR_STATUS:     'pending — run scripts/validate.js after assembly',
    TRUE_OBJECTIVE:       concept.true_objective,
    SYSTEM_CATEGORY:      concept.system_category,
    PRIMARY_EXECUTOR:     concept.primary_executor,
    OPERATIONAL_GOALS:    bullets(concept.operational_goals),
    CONSTRAINTS:          bullets(concept.constraints),
    NON_GOALS:            bullets(concept.non_goals),
    SCOPE_BOUNDARY:       mvp.scope_boundary,
    ENTITIES_TABLE:       entitiesTable(systems.entities),
    ORCHESTRATION_TABLE:  orchestrationTable(systems.orchestration),
    STATE_TABLE:          stateTable(systems.state),
    GOVERNANCE_TABLE:     governanceTable(systems.governance),
    INTEROP_TABLE:        interopTable(systems.interop_surface),
    IMPLEMENTATION_PHASES:phasesBlock(plan.implementation_phases),
    DIRECTORY_STRUCTURE:  dirStructureBlock(plan.directory_structure),
    SCHEMAS_TABLE:        schemasTable(plan.schemas),
    VALIDATION_GATES:     gatesBlock(plan.validation_gates),
    OPERATING_RULES:      bullets(plan.operating_rules),
    DEFERRED:             deferredBlock(mvp.defer),
    DELETED:              deletedBlock(mvp.delete),
    NEXT_PHASES:          nextPhasesBlock(plan.next_phases),
    SOURCE_ARTIFACTS:     sourceArtifactsBlock(slug),
    RALPH_NOTES:          ralphNotesBlock(passes),
  };

  const md = fill(template, vars);
  const outPath = path.join(slugDir, '07-HANDOFF.md');
  fs.writeFileSync(outPath, md);
  console.log(`[OK] wrote ${outPath}`);
}

main();
