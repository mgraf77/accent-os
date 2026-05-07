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
- "profile [table]"
- "show me column stats on [table]"
- "is this data sane"
- "feed quality check"
- "check the shape of [table]"

---

## Step 0 — Column-count guardrail

If the target table has more than 30 columns, skip full profiling. Output the column list and ask Michael for a subset (e.g. "which columns matter for this profile?"). Proceed with only those.

If Michael says "all columns" explicitly, proceed with all but warn that the output will be wide.

Output artifact: a guardrail notice (if triggered) or a silent pass-through to Step 1.

---

## Step 1 — Identify the target

The target is one of:

- A Supabase table name (e.g. `vendors`, `vendor_scores`, `deals`, `inventory.feed_status`)
- A query result from a prior supabase-sql-magic run
- A specific column on a specific table (e.g. `vendors.gross_margin_pct`)

Confirm the target exists by reading `/home/user/accent-os/sql/M*.sql`. If not found, output "Target not found in /home/user/accent-os/sql/" and stop.

Output artifact: a confirmed target identifier (e.g. `vendors` → `hsyjcrrazrzqngwkqsqa.public.vendors, 12 columns`) used in Step 2 to build the profile SQL.

---

## Step 2 — Generate profile SQL

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

Output artifact: a set of paste-ready SQL blocks (per-column probes + optional histograms + optional top-10s) delivered in BLOCK 3 of Step 5.

---

## Step 3 — Build the profile table

**Precondition:** Step 3 runs only when query results are available in the current session context (Michael pasted the output, or results came from a prior supabase-sql-magic run). If no results are present, output Step 2's SQL blocks (BLOCK 3) and pause — Step 3 runs when Michael re-invokes with the results.

Format the query output into this table. This is the primary output artifact for BLOCK 1:

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

Output artifact: an OUTLIER FLAGS block delivered in BLOCK 2 of Step 5:

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

Output artifact: four blocks printed in-session — PROFILE TABLE, OUTLIER FLAGS, PROFILE SQL (paste-ready for `hsyjcrrazrzqngwkqsqa`), and NEXT-STEP HINTS.

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
  - HEAVY_SKEW on [col] → split the column into multiple or promote it to a derived flag in vendor-cascade
  - NULL_DROP on [col] → vendor-cascade or vendor-clarity-test would surface affected rows
```

---

## Anti-patterns

- **Never** use `SELECT *` on the target table for the profile — generate per-column probes.
- **Never** profile a table without first verifying it exists in `/home/user/accent-os/sql/M*.sql` — if not found, output "Target not found in /home/user/accent-os/sql/" and stop; do not generate SQL for phantom tables.
- **Never** report Top values for columns where every row is unique (UUIDs, timestamps) — meaningless and noisy.
- **Never** silently skip a column when profiling fails — if a column's type (e.g. `jsonb`, `tsvector`, `bytea`) cannot be handled by the generic per-column probe, output `[column]: SKIPPED — type [type] requires manual probe` and continue with the remaining columns.
- **Never** run the profile SQL automatically — output it as paste-ready blocks. Michael runs the queries.
- **Never** invoke WIDTH_BUCKET on a column before confirming it has at least one non-NULL value — use the per-column probe results to gate histogram generation.
- **Never** use this skill for vendor scoring questions (that's vendor-cascade) or for filtered ad-hoc data retrieval (that's supabase-sql-magic) — redirect when the trigger is ambiguous.
