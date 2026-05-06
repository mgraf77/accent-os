---
name: table-eda
description: >
  Produce a one-page exploratory data analysis on any AccentOS Supabase
  hsyjcrrazrzqngwkqsqa table or query result: row count, null %,
  distinct counts, top-10 values per column, range/distribution, and
  outlier flags. Catches data-quality issues (suddenly-empty columns,
  enum drift, near-duplicates, suspicious zero/null spikes) before
  they break a module or surprise a vendor-cascade run. Use this
  skill when Michael says: "EDA on [table]", "data quality check on
  [table]", "what's in [table]", "audit [table]", "table profile",
  "is this data sane", "feed quality check", or any phrasing that
  asks for a profile of a table or query result. Do not use for
  vendor scoring (that's vendor-cascade) or for ad-hoc filtered
  queries (that's supabase-sql-magic). Always produces a per-column
  table plus an outlier-flag list — never returns prose-only.
---

# table-eda

**Purpose:** New Supabase M-schema tables ship without an "is the data sane" check. GMC feed audits, vendor data imports, and inventory snapshots all benefit from a one-shot profile that surfaces obvious data-quality issues.

Stolen from: Hex auto-EDA / statistical summaries pattern. Rebuilt as paste-ready SQL for `hsyjcrrazrzqngwkqsqa` plus a structured output table.

---

## Trigger Recognition

Run when Michael says:
- "EDA on [table]"
- "data quality check on [table]"
- "what's in [table]"
- "audit [table]"
- "table profile"
- "is this data sane"
- "feed quality check"
- "check [table] data"
- "profile [table] columns"
- "sanity check [table]"
- "null check [table]"
- "how clean is [table]"
- "column breakdown on [table]"

---

## Step 0 — Column-count guardrail

If the target table has more than 30 columns, do not profile every column. Output the column list and ask Michael for a subset (e.g. "which columns matter for this profile?"). Then proceed with only those.

If Michael says "all columns" explicitly, proceed with all but warn that the output will be wide.

---

## Step 1 — Identify the target

The target is one of:

- A Supabase table name in `hsyjcrrazrzqngwkqsqa` (e.g. `vendors`, `vendor_scores`, `deals`, `inventory.feed_status`)
- A query result from a prior supabase-sql-magic run
- A specific column on a specific table (e.g. `vendors.gross_margin_pct`)

**Do in parallel:** Confirm the target exists by reading `/home/user/accent-os/sql/M*.sql` AND check if Michael named the table with a schema prefix (e.g. `inventory.feed_status` → schema=`inventory`, table=`feed_status`). Both checks are independent.

Edge cases:
- If the table is not found in `/home/user/accent-os/sql/`, output: `Target not found in /home/user/accent-os/sql/ — confirm table name in hsyjcrrazrzqngwkqsqa` and stop.
- If the table exists in schema files but has 0 rows at query time, the zero-row path fires in Step 4 (EMPTY flag). Do not abort — the schema profile is still valid.
- If Michael references a BigCommerce `store-cwqiwcjxes` export table (e.g. a synced orders or catalog table), treat as a normal Supabase table — same profiling applies.

---

## Step 2 — Generate profile SQL

**Do in parallel:** Generate the per-column probe UNION block AND the top-10 frequency queries for text/enum columns. Both are independent SQL generation tasks.

For the target table, generate a profile query. Build it column-by-column from the schema:

**Per-column probes:**

```sql
-- For every column in the target table:
SELECT
  '[column]' AS column_name,
  '[type]' AS data_type,
  COUNT(*) AS total_rows,
  COUNT([column]) AS non_null_rows,
  ROUND(100.0 * (COUNT(*) - COUNT([column])) / COUNT(*), 2) AS null_pct,
  COUNT(DISTINCT [column]) AS distinct_count,
  MIN([column])::text AS min_val,
  MAX([column])::text AS max_val
FROM [table]

UNION ALL  -- one row per column

...
```

For numeric columns with at least one non-NULL value, generate a range histogram. Skip histograms for columns where the per-column probe in the prior block reported `non_null_rows = 0` (all-NULL columns) — `WIDTH_BUCKET` cannot bound on NULL min/max. WIDTH_BUCKET needs explicit min/max bounds — pull them via subquery:

```sql
-- 10-bucket distribution
WITH bounds AS (
  SELECT MIN([column])::numeric AS lo, MAX([column])::numeric AS hi FROM [table]
)
SELECT WIDTH_BUCKET([column]::numeric, bounds.lo, bounds.hi + 0.001, 10) AS bucket,
       COUNT(*) AS bucket_count
FROM [table], bounds
WHERE [column] IS NOT NULL
GROUP BY bucket
ORDER BY bucket;
```
The `+ 0.001` on the upper bound ensures the max value lands in bucket 10 instead of overflowing.

For text/enum columns, also generate a top-10:
```sql
SELECT [column], COUNT(*) AS occurrences
FROM [table]
WHERE [column] IS NOT NULL
GROUP BY [column]
ORDER BY occurrences DESC
LIMIT 10;
```

If the target is a query result (not a table), generate the same probes against a CTE wrapping the query.

---

## Step 3 — Build the profile table

After Michael runs the SQL (or if results are inline-able from a prior run), format:

| Column | Type | Null % | Distinct | Min | Max | Top value | Top % |
|---|---|---|---|---|---|---|---|
| id | uuid | 0% | 1247 | (uuid) | (uuid) | (uuid) | 100% |
| name | text | 0% | 1242 | "ACE Lighting" | "Zenith Bulbs" | "Acme Lighting" | 0.4% |
| score | numeric | 2.4% | 87 | 12.1 | 98.7 | 67.0 | 8.2% |
| status | enum | 0% | 4 | "active" | "pending" | "active" | 71% |

---

## Step 4 — Outlier flags

**First check the table-level EMPTY flag.** If `total_rows = 0`, output only the EMPTY flag and stop — per-column outlier checks are meaningless on a zero-row table.

If `total_rows > 0`, proceed with per-column checks. For each column, run these checks and surface any that fire:

| Flag | Trigger |
|---|---|
| **HIGH_NULL** | null_pct > 50% |
| **SINGLE_VALUE** | distinct_count = 1 (column carries no information) |
| **NEAR_BINARY** | distinct_count = 2 (might be intentional; flag for review) |
| **HEAVY_SKEW** | top value occupies > 80% of non-null rows |
| **TOO_DISTINCT** | distinct_count = total_rows AND total_rows > 100 (suspicious for an enum-shaped column) |
| **EMPTY** | total_rows = 0 |
| **NULL_DROP** | null_pct > 10% on a column that should rarely be null (id, name, status) |

Output:

```
OUTLIER FLAGS

[column.flag] — [one-line interpretation]
  Example:
    score.HIGH_NULL — 67% of rows have NULL score; check vendor-cascade pipeline
    status.SINGLE_VALUE — every row is "active"; status column carries no signal
```

If no flags fire, output: "No outlier flags. Data shape looks clean."

---

## Step 5 — Output

```
═══ BLOCK 1: PROFILE TABLE ═══
[full Step 3 table]

═══ BLOCK 2: OUTLIER FLAGS ═══
[Step 4 list]

═══ BLOCK 3: PROFILE SQL ═══
-- Paste into Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new
[the SQL from Step 2]

═══ BLOCK 4: NEXT-STEP HINTS ═══
For each fired flag, suggest a follow-up:
  - HIGH_NULL on [col] → check the writer module at js/[module].js
  - HEAVY_SKEW on [col] → consider whether this should be split into multiple columns
  - NULL_DROP on [col] → vendor-cascade or vendor-clarity-test would surface affected rows
```

---

## Anti-patterns

- **Never** use `SELECT *` on the target table for the profile — generate per-column probes.
- **Never** profile a table without first verifying it exists in `/home/user/accent-os/sql/M*.sql`.
- **Never** report Top values for columns where every row is unique (UUIDs, timestamps) — meaningless and noisy.
- **Never** silently skip a column. If profiling fails on a specific column (e.g. JSON type with awkward shape), flag it explicitly in BLOCK 2 as `[column].SKIP — [reason]` and continue with the others.
- **Never** run the profile SQL automatically — output it as paste-ready blocks. Michael runs the queries against `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`.
- **Never** run `WIDTH_BUCKET` without explicit min/max bounds from a subquery — NULL min/max causes a runtime error; always use the `WITH bounds AS (...)` pattern from Step 2.
- **Never** surface the EMPTY flag and then continue with per-column outlier checks. Zero rows = stop at the EMPTY flag; per-column stats are meaningless on empty tables.
