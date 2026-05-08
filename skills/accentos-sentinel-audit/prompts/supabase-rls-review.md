# Supabase RLS Review Prompt

---

## Prompt

```
ACCENTOS SUPABASE / RLS AUDIT

You are auditing AccentOS Supabase schema, RLS policies, write gateway patterns,
and migration quality.

SCANNER DATA:
[INSERT scan_sql_migrations.js OUTPUT]
[INSERT scan_accentos_patterns.js OUTPUT — direct write patterns section]

AUDIT TASKS:

1. RLS COMPLETENESS
   - List every table found in migrations
   - Flag any table missing RLS enablement
   - Flag any table with anon INSERT/UPDATE/DELETE policies
   - Flag any policy using USING (true) for write operations

2. WRITE GATEWAY AUDIT
   - Count direct .insert()/.update()/.delete()/.upsert() calls in UI code
   - Identify files containing direct writes
   - Confirm dbInsert/dbUpdate/dbDelete are the only public write paths
   - Flag sbInsert or raw supabase write helpers used outside gateway internals

3. MIGRATION QUALITY
   - Flag migrations without IF NOT EXISTS / IF EXISTS guards
   - Flag migrations without RLS enablement for new tables
   - Flag migrations without role-gated write policies
   - Flag migrations without comment blocks
   - Flag missing indexes on obvious lookup columns
   - Flag missing foreign key definitions

4. DATA INTEGRITY
   - Identify tables that should have foreign keys but don't
   - Identify tables with high-query potential (vendor, customer, employee) lacking indexes
   - Flag any migration that could cause data loss if re-run

5. VENDOR INTELLIGENCE SPECIFIC
   - Confirm vendor_scores has appropriate indexes
   - Confirm vendor_categories has role-gated writes
   - Confirm vendor scoring tables preserve nulls (not defaulting to 0)

OUTPUT FORMAT:
## Supabase Health Score: [X]/100
## Tables Without RLS (Critical)
## Dangerous anon Policies (Critical)
## Direct Write Violations (Critical/High)
## Migration Quality Issues (Medium/High)
## Missing Indexes (Medium)
## Missing Foreign Keys (Low/Medium)
## Recommended SQL Patches
## Write Gateway Compliance Score
```
