---
name: schema-contract-tests
description: >
  For any AccentOS Supabase hsyjcrrazrzqngwkqsqa table defined in
  /home/user/accent-os/sql/M*.sql, generate dbt-style contract test
  SQL: NOT NULL on PKs, UNIQUE on natural keys, foreign-key existence
  checks (referential integrity), enum-bounded value checks on status/
  type columns, and singular cross-model tests for cross-table
  invariants. Outputs paste-ready SQL that runs as a nightly check
  job and as a fail-fast pre-deploy gate. Use this skill when Michael
  says: "contract tests for [table]", "schema tests", "data quality
  tests", "dbt-style tests", "test the [table] schema", "lock in the
  [table] contract", or any phrasing that asks for formal data
  contracts on AccentOS tables. Do not use for ad-hoc data quality
  probes (use table-eda) or for vendor scoring math (use vendor-
  cascade). Always produces SQL artifacts in
  /home/user/accent-os/sql/tests/ — never returns prose-only.
---

# schema-contract-tests

**Purpose:** AccentOS has multiple schema files (M01–M29) but no contract tests against the live data. table-eda surfaces ad-hoc issues; this skill makes contracts explicit and re-runnable so a bad insert can't quietly ship.

Stolen from: dbt (generic tests: `not_null`, `unique`, `accepted_values`, `relationships`; singular tests for cross-model validation).

---

## Trigger Recognition

Run when Michael says:
- "contract tests for [table]" / "schema tests"
- "data quality tests" / "dbt-style tests"
- "test the [table] schema"
- "lock in the [table] contract"
- "generate test suite for [table]"
- "nightly test for [table]"
- "what invariants does [table] have"

---

## Step 1 — Identify the target table

Input: table name (e.g. `vendor_scores`) or file (e.g. `M02_core_schema.sql` → all tables in that file) or "all" (every table in `/home/user/accent-os/sql/M*.sql`).

Read the relevant `M*.sql` file(s) and extract:
- Table name and primary key
- All columns with types
- Explicit FK constraints (REFERENCES clauses)
- Check constraints
- Enum types (CREATE TYPE) and which columns use them

Output artifact: a structured table manifest listing `(table, pk, fk_list, enum_columns, not_null_columns)` — consumed by Steps 2 and 3 to drive test generation.

---

## Step 2 — Generate generic tests

For each table, generate four test classes:

**A. NOT NULL on PK + critical columns:**
```sql
SELECT 'not_null:vendors.id' AS test_name, COUNT(*) AS failures
FROM vendors WHERE id IS NULL;
-- Expected: 0
```

Identify critical columns from the schema: PK + any column annotated NOT NULL.

**B. UNIQUE on natural keys:**
```sql
SELECT 'unique:vendors.name' AS test_name, COUNT(*) AS failures
FROM (SELECT name, COUNT(*) AS c FROM vendors GROUP BY name HAVING COUNT(*) > 1) dup;
```

Generate for each natural key — typically `name` for vendors, `(vendor_id, computed_at)` for vendor_scores in Supabase `hsyjcrrazrzqngwkqsqa`.

**C. Relationships (FK existence — referential integrity):**
```sql
SELECT 'relationships:vendor_scores.vendor_id_in_vendors' AS test_name, COUNT(*) AS failures
FROM vendor_scores vs
LEFT JOIN vendors v ON v.id = vs.vendor_id
WHERE v.id IS NULL;
```

Generate for every FK declared in the schema.

**D. Accepted values on enum columns:**
```sql
SELECT 'accepted_values:vendors.status' AS test_name, COUNT(*) AS failures
FROM vendors
WHERE status NOT IN ('active', 'inactive', 'pending', 'archived');
```

Pull enum values from `CREATE TYPE` statements in the schema files.

Output artifact: a set of SQL SELECT statements (one per test class A–D) that each return `test_name, failures` — assembled into the CTE in Step 4.

---

## Step 3 — Generate singular cross-model tests

These are AccentOS-specific invariants that require multi-table joins against `hsyjcrrazrzqngwkqsqa`. Generate based on observed business rules:

```sql
-- vendor_scores per priority must sum weights to 1.0 (within 0.001)
SELECT 'singular:vendor_scores_weights_sum_to_1' AS test_name,
       COUNT(*) AS failures
FROM (
  SELECT vendor_id, priority_id, ABS(SUM(weight) - 1.0) AS drift
  FROM vendor_scores
  GROUP BY vendor_id, priority_id
  HAVING ABS(SUM(weight) - 1.0) > 0.001
) drift;
```

```sql
-- Every vendor with rep_group_id has a valid rep_group
-- (covered by FK test, but enforces against soft deletes)
SELECT 'singular:vendor_rep_group_active' AS test_name, COUNT(*) AS failures
FROM vendors v
JOIN rep_groups rg ON rg.id = v.rep_group_id
WHERE rg.deleted_at IS NOT NULL;
```

```sql
-- Deals reference a known vendor
SELECT 'singular:deals_vendor_exists' AS test_name, COUNT(*) AS failures
FROM deals d
LEFT JOIN vendors v ON v.id = d.vendor_id
WHERE d.vendor_id IS NOT NULL AND v.id IS NULL;
```

Generate 3–5 cross-model tests per table set, focused on AccentOS Accent Lighting business rules — never generic database-level checks that belong in schema constraints instead.

Output artifact: 3–5 named singular test SQL blocks, each following the `SELECT 'singular:[name]' AS test_name, COUNT(*) AS failures FROM (...)` pattern, ready to UNION ALL into Step 4's CTE.

---

## Step 4 — Compose the test runner artifact

Output artifact: `/home/user/accent-os/sql/tests/[table]_contracts.sql` — written to disk, containing the UNION ALL CTE + drill-down section. Create the `tests/` dir if missing.

Structure:

```sql
-- Contract tests for [table]
-- Generated: YYYY-MM-DD
-- Run: paste into Supabase SQL editor or pg-cron nightly

WITH all_tests AS (
  SELECT 'not_null:vendors.id' AS test_name, ... AS failures
  UNION ALL
  SELECT 'unique:vendors.name', ...
  UNION ALL
  SELECT 'relationships:vendor_scores.vendor_id_in_vendors', ...
  UNION ALL
  SELECT 'accepted_values:vendors.status', ...
  UNION ALL
  SELECT 'singular:vendor_scores_weights_sum_to_1', ...
  -- ... all tests
)
SELECT test_name, failures,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM all_tests
ORDER BY status DESC, test_name;
-- Expected: every row PASS
```

**Drill-down for failures.** For each generated test, also output a companion query that returns the offending rows (LIMIT 10). Place these in the same file under a `-- DRILL-DOWN QUERIES` section, commented out by default. When a test FAILs, Michael uncomments the matching drill-down and runs it to see actual data.

```sql
-- DRILL-DOWN QUERIES (uncomment to see offending rows after a FAIL)
-- Each is named `-- DRILL: [matching_test_name]` so you can grep:
--   grep "DRILL: not_null:vendors.id" tests/[name]_contracts.sql

-- DRILL: not_null:vendors.id
-- SELECT id, name FROM vendors WHERE id IS NULL LIMIT 10;

-- DRILL: unique:vendor_scores.(vendor_id,computed_at)
-- SELECT vendor_id, computed_at, COUNT(*) FROM vendor_scores
--   GROUP BY vendor_id, computed_at HAVING COUNT(*) > 1 LIMIT 10;

-- ...
```

---

## Step 5 — Output

```
═══ BLOCK 1: SUMMARY ═══
Target: [table or "all"]
Tests generated: [N]
  not_null: [count]   unique: [count]   relationships: [count]
  accepted_values: [count]   singular: [count]

═══ BLOCK 2: ARTIFACT ═══
Wrote: /home/user/accent-os/sql/tests/[name]_contracts.sql

═══ BLOCK 3: RUN COMMAND ═══
Paste into Supabase SQL Editor:
https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new

Or schedule via pg-cron nightly:
SELECT cron.schedule('contracts-nightly', '0 3 * * *',
  'INSERT INTO test_runs SELECT NOW(), * FROM (...)');

═══ BLOCK 4: SCHEMA-DRIFT NOTES ═══
Columns referenced that don't exist in /home/user/accent-os/sql/M*.sql:
  [list]
These need either: (a) the schema file updated, or (b) the test removed.
```

---

## Anti-patterns

- **Never** invent column names. Every column referenced must trace to an `M*.sql` file.
- **Never** generate a test that mutates data (no INSERT/UPDATE/DELETE in tests).
- **Never** generate a test that depends on data volume (test must work on empty tables — failures = 0 means PASS).
- **Never** assert business rules without surfacing them as singular tests; never bury them in the schema as silent CHECK constraints.
- **Never** auto-run the test SQL. Output the artifact to `/home/user/accent-os/sql/tests/`; Michael executes when ready.
- **Never** write contract tests for a table that does not exist in `/home/user/accent-os/sql/M*.sql` — if the table is expected but missing from the schema files, flag it as a schema gap and stop.
- **Never** reuse enum values from memory. Pull accepted values from the `CREATE TYPE` statements in the M-schema files every run — enum definitions drift.
