---
name: supabase-sql-magic
description: >
  Convert natural-language data questions about AccentOS into ready-to-run
  SQL queries against Supabase hsyjcrrazrzqngwkqsqa, with full awareness
  of the live schema (vendors, vendor_scores, vendor_overrides, deals,
  quotes, inventory, purchase_orders, trade_partners, alerts, marketing,
  competitor_prices, etc. as defined in /home/user/accent-os/sql/M*.sql).
  Use this skill when Michael says: "get me", "show me vendors who",
  "query for", "how many", "find rows where", "supabase query for [X]",
  "ad-hoc query", "give me the SQL for [X]", or any phrasing that asks
  for ad-hoc data lookup against AccentOS Supabase. Do not use for vendor
  scoring questions (that's vendor-cascade) or for defining new
  measurement rules (that's priority-articulation). Always produces a
  paste-ready SQL block plus a cost note about row count and join depth
  — never returns the result data inline.
---

# supabase-sql-magic

**Purpose:** Translate natural-language AccentOS data questions into SQL that runs against Supabase `hsyjcrrazrzqngwkqsqa` on the first try, using actual table and column names from the M-schema files.

Stolen from: the Magic AI / NL→SQL pattern in Hex (hex.tech). Rebuilt with hard-coded knowledge of the AccentOS schema, no notebook UI, no Python interleaving — pure SQL output, paste-ready for the Supabase SQL editor.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "get me [X]"
- "show me vendors / deals / inventory who/where [X]"
- "query for [X]"
- "how many [X]"
- "find rows where [X]"
- "supabase query for [X]"
- "pull the data for [X]"
- "give me the SQL for [X]"

Do **not** trigger for: vendor score traces ("why is vendor X ranked there" → vendor-cascade) or rule design ("how do I score for X" → priority-articulation).

---

## Step 1 — Load the live schema

Read every `M*_*.sql` file in `/home/user/accent-os/sql/` (currently M01, M02, M21, M22, M23, M24, M25, M26, M27, M28, M29). Build a working table inventory:

```
TABLE → primary key, foreign keys, columns relevant to the question
```

Cache table names in working memory for this run. Every column referenced in the output SQL must exist in one of the loaded files — never rely on guesses.

Output artifact: a schema snapshot in the form `TABLE → pk: [col], fk: [col→table], relevant columns: [col_list]` — one line per table that will appear in the query. Used in Step 3 to validate every column reference before emitting SQL.

If a referenced table or column does not exist, output "Schema gap: table/column [X] not found in /home/user/accent-os/sql/" and stop. Do not invent fields.

---

## Step 2 — Parse the question

Decompose the natural-language question into:

```
INTENT:    [select | aggregate | rank | join | window]
ENTITIES:  [vendors | deals | inventory | ...] (which tables)
FILTERS:   [list of where-clause conditions]
GROUPING:  [columns to group by, if any]
ORDERING:  [column + direction]
LIMIT:     [explicit or default 100]
```

When the question is ambiguous on any dimension, pick the most defensible default and note it in the output under "Defaults applied". Never ask Michael to clarify — he wrote the question fast; clarifying defeats the point.

Output artifact: a structured decomposition block (INTENT / ENTITIES / FILTERS / GROUPING / ORDERING / LIMIT) for internal use in Step 3.

---

## Step 3 — Build the SQL

Compose the query in this order, always:
1. SELECT list (only columns Michael needs, never `SELECT *` for large tables)
2. FROM + JOINs (use schema FK relationships from Step 1)
3. WHERE clauses (from filters)
4. GROUP BY / HAVING
5. ORDER BY
6. LIMIT (always include — default 100; omit only when the query is a true aggregation returning a single summary row or a fixed small count)

Format as paste-ready SQL with one clause per line for scan-readability. Output artifact: the final SQL block delivered in BLOCK 1 of Step 5:

```sql
SELECT
  v.id,
  v.name,
  vs.score,
  vs.computed_at
FROM vendors v
JOIN vendor_scores vs ON vs.vendor_id = v.id
WHERE vs.score < 60
  AND vs.computed_at > NOW() - INTERVAL '30 days'
ORDER BY vs.score ASC
LIMIT 100;
```

---

## Step 4 — Cost note

Estimate query cost based on:
- Number of tables joined
- Whether filters use indexed columns (PKs, FKs)
- Whether `LIMIT` short-circuits the scan
- Approximate row count of largest table touched

Output artifact: a 4-line COST NOTE block (delivered in BLOCK 2 of Step 5):

```
COST NOTE
- Tables joined: [n]
- Indexed filters: yes/no/partial
- Estimated rows scanned: [low|medium|high]
- Run cost: [cheap|moderate|run-during-quiet]
```

If the cost is "run-during-quiet" or higher, append an indexed alternative or a CTE-based reformulation immediately below the COST NOTE block.

---

## Step 5 — Output

Output artifact: three blocks printed in-session — SQL, COST NOTE, and PASTE TARGET URL for `hsyjcrrazrzqngwkqsqa`.

```
═══ BLOCK 1: SQL ═══
[the query from Step 3]

═══ BLOCK 2: COST NOTE ═══
[from Step 4]

═══ BLOCK 3: PASTE TARGET ═══
Supabase SQL Editor:
https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new
```

If the question was ambiguous and the skill picked defaults, list them under BLOCK 1:

```
Defaults applied:
- Time window: last 30 days (no explicit range given)
- Limit: 100 (no count requested)
- Ordering: vs.score ASC (you asked for "low scores")
```

---

## Anti-patterns

- **Never** use `SELECT *` against vendors, deals, inventory, or any table likely to be wide.
- **Never** invent column names. Every column must trace to an `M*.sql` file.
- **Never** skip the LIMIT clause unless the question is explicitly an aggregation.
- **Never** return query results inline — Michael runs the SQL himself; the skill's job ends at the query.
- **Never** modify data (no INSERT, UPDATE, DELETE). This skill is read-only. Mutations route through priority-articulation, vendor-cascade, or AccentOS modules.
- **Never** ask Michael to clarify ambiguity. Pick a default, run with it, list the default chosen.
- **Never** reference tables from BigCommerce store-cwqiwcjxes REST API as if they were Supabase tables — the BC integration feeds into Supabase tables via M04; query the Supabase side only.
