#!/usr/bin/env node
/**
 * scan_sql_migrations.js
 * Scans AccentOS SQL migrations for RLS, policies, indexes, guards, and safety patterns.
 * Outputs JSON to stdout. Run from repo root.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.argv[2] || process.cwd();
const SQL_DIR = path.join(REPO_ROOT, 'sql');

function readFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function walkDir(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

const sqlFiles = walkDir(SQL_DIR, ['.sql']).sort();

const migrations = [];

for (const f of sqlFiles) {
  const content = readFile(f);
  if (!content) continue;
  const relFile = path.relative(REPO_ROOT, f);
  const upper = content.toUpperCase();

  // Tables created/altered
  const createTableMatches = [...content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi)];
  const alterTableMatches = [...content.matchAll(/ALTER\s+TABLE\s+(\w+)/gi)];

  // Filter out SQL reserved words that appear after CREATE TABLE in comments or conditional blocks
  const SQL_RESERVED = ['enable', 'add', 'drop', 'column', 'row', 'security', 'constraint',
    'if', 'not', 'exists', 'for', 'on', 'set', 'select', 'insert', 'update', 'delete', 'all'];
  const tablesCreated = createTableMatches
    .map(m => m[1].toLowerCase())
    .filter(t => !SQL_RESERVED.includes(t));
  const tablesAltered = alterTableMatches.map(m => m[1].toLowerCase()).filter(
    t => !SQL_RESERVED.includes(t)
  );

  // Safety patterns
  const hasIfNotExists = /IF\s+NOT\s+EXISTS/i.test(content);
  const hasIfExists = /IF\s+EXISTS/i.test(content);
  const hasRlsEnable = /ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(content);
  const hasPolicies = /CREATE\s+POLICY/i.test(content);
  const hasDropPolicyIfExists = /DROP\s+POLICY\s+IF\s+EXISTS/i.test(content);
  const hasIndexes = /CREATE\s+INDEX/i.test(content);
  const hasIndexIfNotExists = /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i.test(content);
  const hasForeignKeys = /FOREIGN\s+KEY|REFERENCES\s+\w/i.test(content);
  const hasCommentBlock = /--\s*[─=\-]{3,}/.test(content) || content.includes('-- ');

  // Dangerous patterns
  const anonWritePolicies = [...content.matchAll(/CREATE\s+POLICY[^;]+TO\s+anon[^;]+(INSERT|UPDATE|DELETE|ALL)[^;]*;/gi)];
  const usingTrue = [...content.matchAll(/USING\s*\(\s*true\s*\)/gi)];
  const withCheckTrue = [...content.matchAll(/WITH\s+CHECK\s*\(\s*true\s*\)/gi)];

  // For each write policy using true, check if it's restricted to authenticated
  const dangerousUsingTrue = usingTrue.filter(m => {
    const context = content.substring(Math.max(0, m.index - 200), m.index + 50);
    return context.toLowerCase().includes('all') || context.toLowerCase().includes('insert')
      || context.toLowerCase().includes('update') || context.toLowerCase().includes('delete');
  });

  const issues = [];
  if (tablesCreated.length > 0 && !hasIfNotExists) issues.push('MISSING_IF_NOT_EXISTS');
  if (tablesCreated.length > 0 && !hasRlsEnable) issues.push('MISSING_RLS_ENABLE');
  if (hasRlsEnable && !hasPolicies) issues.push('RLS_ENABLED_NO_POLICIES');
  if (hasPolicies && !hasDropPolicyIfExists) issues.push('POLICIES_NOT_IDEMPOTENT');
  if (!hasCommentBlock) issues.push('NO_COMMENT_BLOCK');
  if (anonWritePolicies.length > 0) issues.push('ANON_WRITE_POLICY');
  if (dangerousUsingTrue.length > 0) issues.push('USING_TRUE_ON_WRITE');
  if (tablesCreated.length > 0 && !hasIndexes) issues.push('NO_INDEXES_DEFINED');

  const risk = issues.some(i => ['MISSING_RLS_ENABLE', 'ANON_WRITE_POLICY', 'USING_TRUE_ON_WRITE'].includes(i))
    ? 'HIGH'
    : issues.length > 0 ? 'MEDIUM' : 'OK';

  migrations.push({
    file: relFile,
    tables_created: tablesCreated,
    tables_altered: tablesAltered,
    has_if_not_exists: hasIfNotExists,
    has_if_exists: hasIfExists,
    has_rls_enable: hasRlsEnable,
    has_policies: hasPolicies,
    has_drop_policy_if_exists: hasDropPolicyIfExists,
    has_indexes: hasIndexes,
    has_index_if_not_exists: hasIndexIfNotExists,
    has_foreign_keys: hasForeignKeys,
    has_comment_block: hasCommentBlock,
    anon_write_policy_count: anonWritePolicies.length,
    dangerous_using_true_count: dangerousUsingTrue.length,
    issues,
    risk,
  });
}

const criticalFiles = migrations.filter(m => ['MISSING_RLS_ENABLE', 'ANON_WRITE_POLICY', 'USING_TRUE_ON_WRITE'].some(i => m.issues.includes(i)));
const tablesWithoutRls = migrations.filter(m => m.tables_created.length > 0 && m.issues.includes('MISSING_RLS_ENABLE'));
const nonIdempotent = migrations.filter(m => m.issues.includes('MISSING_IF_NOT_EXISTS') || m.issues.includes('POLICIES_NOT_IDEMPOTENT'));
const noComments = migrations.filter(m => m.issues.includes('NO_COMMENT_BLOCK'));

// Summary stats
const totalIssues = migrations.reduce((n, m) => n + m.issues.length, 0);
const score = Math.max(0, 100 - (criticalFiles.length * 20) - (nonIdempotent.length * 5) - (noComments.length * 2));

const result = {
  generated_at: new Date().toISOString(),
  repo_root: REPO_ROOT,

  summary: {
    migration_count: migrations.length,
    total_issues: totalIssues,
    risk_files: { critical: criticalFiles.length, medium: migrations.filter(m => m.risk === 'MEDIUM').length },
    score,
  },

  tables_without_rls: tablesWithoutRls.map(m => ({ file: m.file, tables: m.tables_created })),
  non_idempotent_migrations: nonIdempotent.map(m => ({ file: m.file, issues: m.issues })),
  anon_write_policies: migrations.filter(m => m.anon_write_policy_count > 0).map(m => ({ file: m.file, count: m.anon_write_policy_count })),
  dangerous_using_true: migrations.filter(m => m.dangerous_using_true_count > 0).map(m => ({ file: m.file, count: m.dangerous_using_true_count })),
  migrations_without_comments: noComments.map(m => m.file),
  migrations_without_indexes: migrations.filter(m => m.issues.includes('NO_INDEXES_DEFINED')).map(m => ({ file: m.file, tables: m.tables_created })),

  all_migrations: migrations,
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
