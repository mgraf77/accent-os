---
name: kpi-data-audit
description: >
  Cross-reference every KPI in /home/user/accent-os/KPI_CATALOG.md against
  the live AccentOS data sources — Supabase hsyjcrrazrzqngwkqsqa schema in
  /home/user/accent-os/sql/M*.sql, BigCommerce store-cwqiwcjxes integration
  state, external APIs (GA4 via M06, Klaviyo via M09, Windward via M11,
  GMC via M05), and reference docs. For each KPI, enumerate the variables
  (tables, columns, fields) it requires; mark each variable HAVE or
  MISSING; for each MISSING variable, output a one-paragraph acquisition
  guide describing the schema-add, integration, derivation, or manual-
  capture path required, plus the M-task number that unblocks it. Use
  this skill when Michael says: "audit the KPI data", "what variables
  are missing", "data gap audit", "check KPI dependencies", "variable
  inventory", "what's missing for [kpi]", "what can we compute today",
  or any phrasing that asks which catalog KPIs can compute now vs need
  data acquisition first. Do not use for ad-hoc data-quality probes (use
  table-eda) or for actual schema migrations (output only — Michael
  applies via M-tasks). Always produces a paste-ready data-gap matrix
  plus per-missing-variable remediation guide — never returns prose-only.
---

# kpi-data-audit

**Purpose:** The KPI_CATALOG defines what AccentOS *should* track. This skill answers what AccentOS *can* track today, what it can't, and what would unblock each gap. The output is the prioritization input for which schema additions and external integrations matter most.

Stolen from: dbt's `dbt source freshness` + `manifest.json` dependency-graph idea, adapted to a cross-source manual-source environment.

---

## Trigger Recognition

Run when Michael says:
- "audit the KPI data"
- "what variables are missing"
- "data gap audit" / "data gap analysis"
- "check KPI dependencies"
- "variable inventory"
- "what's missing for [KPI ID]"
- "what can we compute today"
- "KPI feasibility audit"

Fire automatically (with confirmation) after any commit that modifies `/home/user/accent-os/KPI_CATALOG.md` or any `/home/user/accent-os/sql/M*.sql` — the audit results may change.

**Recommended cadence:** Run on demand whenever an M-task lands (schema or integration), and at minimum monthly to detect drift between catalog state and live schema. Coverage trend (% computable today) is the headline metric to watch — it should rise as M-tasks complete.

---

## Scope

**In scope:**
- All KPIs defined in `/home/user/accent-os/KPI_CATALOG.md`
- All Supabase tables defined in `/home/user/accent-os/sql/M*.sql`
- Integration availability flags (which M-tasks have landed)

**Out of scope — fail fast:**
- KPI catalog missing → "KPI_CATALOG.md not found at /home/user/accent-os/KPI_CATALOG.md. Commit it first OR pass an alternative path: 'audit data using [path]'"
- Auditing against a SQL file outside `/home/user/accent-os/sql/` → "Schema files must live under /home/user/accent-os/sql/ to be audited"

---

## Step 0 — Parse the invocation

Detect from Michael's prompt:

| Signal | Meaning | Effect on workflow |
|---|---|---|
| KPI ID present (e.g. `F3`, `S-OS2`) | scoped audit | Steps 2–6 run only for that KPI; Step 7 produces a single-KPI report |
| `full` or `--full` keyword | full remediation list | Step 7 BLOCK 4 expands to all gaps, no top-10 cap |
| `snapshot` keyword | implies snapshot intent | Step 8 enabled, with `--full` auto-applied |
| (none of the above) | full-catalog audit, top-10 default | standard run |

Output the parsed mode at the top of the report so the run is reproducible.

## Step 1 — Locate the catalog and schema sources

Read in parallel:

1. `/home/user/accent-os/KPI_CATALOG.md` — the KPI catalog
2. All `/home/user/accent-os/sql/M*.sql` files (current set: M01 through M29; auto-detect any new M-files)
3. `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` — for which integrations / MCPs are connected
4. `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — for M-task status (which credentials/integrations are pending)

If catalog is missing, abort with the scope-fail message above. If a schema file is unreadable, log the file and continue with what's available.

---

## Step 2 — Parse variables required per KPI

For each KPI row in the catalog, extract:

- **kpi_id** (e.g. `F1`, `S-OS2`, `C-NB1`)
- **kpi_name**
- **required_variables** — list of (source_type, descriptor) tuples

Source types and how to detect:
- `supabase_table_column` — formula references a `table.column` pattern (e.g. `deals.unit_price`, `customers.segment`)
- `supabase_table` — formula references a table without specific column (e.g. `vendor_scores`, treat as needing `≥1 column`)
- `external_integration` — formula mentions GA4, Klaviyo, BigCommerce API, Windward, GMC API, Search Console, Ad platform
- `derived` — formula mentions only other KPI IDs (e.g. F11 = `F8 + F10 − F9`)
- `manual_capture` — formula references foot-traffic counter, survey, timekeeping, cycle count, install record, phone integration

**Informal-formula handling.** Catalog formulas may be informal (`SUM(deals × qty) WHERE completed` rather than fully-qualified column references). For each KPI with an informal formula, infer the likely columns from context — a `deals` revenue formula needs `deals.unit_price` (or equivalent), `deals.quantity`, `deals.status`, plus any GROUP BY columns. If the inference is ambiguous (≥2 plausible column sets), flag the KPI as `AMBIGUOUS_FORMULA` in the output and recommend catalog refinement. Never silently guess.

Use the explicit ⚠ markers in the catalog as a strong hint that a variable is missing. Verify independently — never trust the marker blindly.

Output of Step 2: a list of `(kpi_id, source_type, descriptor)` tuples — typically 200–400 across the full catalog — plus a separate list of `AMBIGUOUS_FORMULA` KPIs needing catalog refinement.

---

## Step 3 — Inventory current Supabase schema

Parse every `M*.sql` file. Build a set of `(table, column)` tuples.

Parsing rules:
- Detect `CREATE TABLE [IF NOT EXISTS] [schema.]name (...)` blocks
- Extract column names (skip constraints, defaults — just names)
- Detect `ALTER TABLE ... ADD COLUMN` for incremental additions
- Detect `CREATE TYPE ... AS ENUM (...)` and bind to the columns that reference it
- Skip SQL comments (`--` to end of line, `/* ... */` blocks)

**Parser limitations.** Pure regex/awk parsing handles the common cases but can miss: columns inside multi-line generated/computed expressions, columns added via complex `ALTER`s with conditionals, columns inside `IF NOT EXISTS` blocks that depend on runtime checks. If a KPI's expected table appears in the schema but the specific column isn't found, output a `SCHEMA_PARSE_UNCERTAIN` flag for that variable rather than declaring MISSING — Michael spot-checks these manually.

Output: a flat HAVE-set like `{(vendors, id), (vendors, name), (deals, vendor_id), ...}`.

If a table is referenced but no `CREATE TABLE` is found (e.g. it's expected from another source), mark as `MISSING_TABLE`.

---

## Step 4 — Inventory external integrations

Map each integration to a known/unknown state by reading:

- `BUILD_PLAN_MICHAEL.md` — M-task completion. Treat any of these markers as "done": `[x]`, `[X]`, `[✓]`, `[done]`, or strikethrough (`~~ M-task ~~`). Treat `[ ]` (empty checkbox) and `[?]` as pending.
  - **M04** → BigCommerce REST API
  - **M05** → Google Merchant Center API
  - **M06** → Google Analytics 4 + Search Console
  - **M09** → Klaviyo API
  - **M11** → Supabase MCP permissions (full CRUD)
  - **M03/M10** → Windward ERP
- `skills/repo-scout/references/project-profiles.md` → "Currently Connected MCPs"
- `.claude/settings.local.json` → for env-var-gated integrations (e.g. `OPENAI_API_KEY`)

Output: a flag dictionary like `{bigcommerce_api: false, gmc_api: false, ga4: false, klaviyo: false, windward: false, supabase_basic: true, ...}`.

---

## Step 5 — Cross-reference HAVE vs MISSING

For each `(kpi_id, source_type, descriptor)` tuple from Step 2:

| Source type | HAVE if … | MISSING if … |
|---|---|---|
| `supabase_table_column` | (table, column) ∈ Step 3 set | otherwise |
| `supabase_table` | table has ≥1 column in Step 3 | table not present |
| `external_integration` | flag = true in Step 4 | flag = false |
| `derived` | every upstream KPI's variables are HAVE | any upstream MISSING |
| `manual_capture` | corresponding capture table exists in Step 3 (e.g. `foot_traffic`, `service_tickets`, `survey_responses`, `timekeeping`, `installs`) — promoted to `supabase_table` | otherwise (no capture mechanism in schema yet) |

Per-KPI status:
- **COMPUTABLE_TODAY** — all variables HAVE
- **PARTIALLY_BLOCKED** — some HAVE, some MISSING (the KPI can compute on a subset)
- **BLOCKED** — primary variable(s) MISSING
- **DERIVED_DEPENDENT** — itself derived; status equals worst of its upstream KPIs
- **AMBIGUOUS_FORMULA** — flagged in Step 2; cannot be audited until catalog refines

---

## Step 6 — Generate remediation guide per MISSING variable

**Cross-reference catalog first.** The KPI catalog documents schema gaps in a section whose heading typically contains "Schema gaps" or "schema additions" or "M-task". Locate the section by case-insensitive match on any H2/H3 heading containing those terms; if no such section exists, treat all MISSING variables as NEW_GAPs and recommend Michael add a gap section to the catalog. Read the located section and classify every MISSING variable from Step 5 as one of:

- **CONFIRMED_GAP** — appears in catalog's gap section AND audit confirms it's still missing → reuse catalog's remediation guidance, don't regenerate
- **NEW_GAP** — audit found a missing variable NOT documented in the catalog → generate fresh remediation guide AND recommend Michael update the catalog to add it
- **STALE_GAP** — catalog lists it as a gap but audit found it HAVE (schema add already landed) → recommend Michael remove from catalog's gap section

For NEW_GAPs and CONFIRMED_GAPs that need fuller detail, build a remediation block:

```
MISSING: [variable descriptor]
  KPIs blocked: [count] — [list of kpi_ids]

  Acquisition path: [SCHEMA_ADD | INTEGRATION | DERIVATION | MANUAL_CAPTURE | EXTERNAL_TOOL]

  Specific guidance:
    [SCHEMA_ADD example:]
      ALTER TABLE customers ADD COLUMN segment text
        CHECK (segment IN ('walk-in','electrician','national',
                           'designer','new-home','hospitality',
                           'multifamily','commercial','DIY'));
      CREATE INDEX idx_customers_segment ON customers(segment);
      Suggested M-task: M30 (or next available).

    [INTEGRATION example:]
      Requires GA4 service account access. Blocked on M06.
      Land M06 → expose env vars GA4_PROPERTY_ID + GA4_KEY_FILE
      → js/marketing.js or new edge function pulls metrics nightly.

    [DERIVATION example:]
      Computable from F8, F9, F10. Once those are HAVE, this is HAVE.

    [MANUAL_CAPTURE example:]
      Requires daily foot-traffic counter device. Options:
       - V-Count (device + cloud, $50–100/mo per door)
       - GrowthFactor (computer-vision via existing camera)
       - Manual click-counter (free, low-fidelity)
      Output to a foot_traffic table (date, location_id, count).

    [EXTERNAL_TOOL example:]
      Requires CSAT/NPS survey tool. Options:
       - Delighted, Typeform, Google Forms (free → cheap)
       - Output to survey_responses table or Supabase via webhook.
```

For each remediation block, also output the M-task line that should land in `BUILD_PLAN_MICHAEL.md` (without auto-applying):

```
- [ ] **MNN** — Add [schema] (unblocks: F3, F4, F5, P4, P5, P10, H2, S-OS12)
```

---

## Step 7 — Output

```
═══ BLOCK 1: AUDIT SUMMARY ═══
Catalog source: /home/user/accent-os/KPI_CATALOG.md (last modified [date])
Schema files: M01–M29 ([count] tables, [count] columns)
External integrations connected: [list with ✓/✗]

KPIs evaluated: [N] (target: 152)
  COMPUTABLE_TODAY: [count] ([%])
  PARTIALLY_BLOCKED: [count] ([%])
  BLOCKED: [count] ([%])
  DERIVED_DEPENDENT: [count] ([%])  — depends on upstream KPIs being HAVE
  AMBIGUOUS_FORMULA: [count] ([%])  — catalog formula needs refinement
  SCHEMA_PARSE_UNCERTAIN: [count]   — manual spot-check needed

Unique missing variables: [N]
  Schema additions needed: [count]
  Integrations needed: [count]
  Manual-capture / external tools needed: [count]
  Confirmed gaps (already in catalog): [count]
  New gaps (audit found, not in catalog): [count]
  Stale gaps (catalog says missing, audit says HAVE): [count]

═══ BLOCK 2: COMPUTABLE-TODAY KPIs ═══
[list of kpi_ids that work right now — these are the dashboards Michael
 can ship immediately]

═══ BLOCK 3: BLOCKED KPIs (with primary blocker) ═══
| kpi_id | name | blocker (primary) |
|--------|------|-------------------|
| F3 | Gross margin % | products.cost (schema) |
| F8 | DSO | invoices table (schema) |
| ...

═══ BLOCK 4: REMEDIATION GUIDE — top 10 by leverage ═══
[Step 6 blocks, sorted by # KPIs unblocked descending. Default: top 10
 only. Append: "...and [N] more — re-run with 'audit data --full' for
 the complete list."]

If Michael invokes "audit data --full" or asks for the complete list,
expand to ALL remediation blocks.

═══ BLOCK 4b: STALE GAPS (catalog says missing, audit says HAVE) ═══
For each STALE_GAP from Step 6:
  - variable, KPI(s) it affects
  - paste-ready Edit command to remove from KPI_CATALOG.md's gap section

═══ BLOCK 4c: NEW GAPS (audit found, catalog doesn't list) ═══
For each NEW_GAP from Step 6:
  - variable, KPI(s) it affects, recommended remediation
  - paste-ready Edit command to ADD to KPI_CATALOG.md's gap section

═══ BLOCK 5: SUGGESTED M-TASK ADDITIONS ═══
[paste-ready list for BUILD_PLAN_MICHAEL.md, formatted as
 - [ ] **MNN** — [schema/integration] (unblocks: [count] KPIs)
Only include CONFIRMED_GAPs and NEW_GAPs; skip STALE_GAPs since they're
already done.]

═══ BLOCK 6: HIGHEST-LEVERAGE NEXT MOVES ═══
The 5 missing variables that unblock the most KPIs. If only one schema
sprint is possible, this is the order:
  1. [variable] — unblocks [N] KPIs
  2. ...
```

If everything is HAVE (catalog fully covered), output: "All 152 KPIs are computable against the current schema and integrations. No remediation needed."

---

## Step 8 — Optional: log a run snapshot

When Michael runs this skill periodically, the audit results form a trend: "% of catalog computable today" should rise over time as M-tasks land.

If `/home/user/accent-os/analyses/` exists, suggest in BLOCK 6: "Run `analysis-snapshot` on this audit to track coverage trend over time. **Use `audit data --full` first** so the snapshot captures the complete remediation list, not just the top-10 — top-10 is for human-scan, full is for trend tracking."

Never auto-snapshot — Michael decides which audits are worth preserving.

---

## Anti-patterns

- **Never** auto-add schema columns. Output recommendations as paste-ready DDL; Michael runs them via M-tasks.
- **Never** assume a variable exists without verifying in `M*.sql` files. The ⚠ marker in the catalog is a hint, not authoritative.
- **Never** report a variable as MISSING without providing an acquisition path. "Missing, figure it out" is not useful.
- **Never** invent variables that aren't actually referenced by any catalog KPI. Stick to what's needed.
- **Never** modify the catalog file from this skill — audit-only.
- **Never** count derived KPIs (e.g. F11 = F8 + F10 − F9) as MISSING just because their upstream KPIs are MISSING. Mark them as DERIVED-DEPENDENT and compute their status transitively.
- **Never** output the full audit on every run if Michael asked about a single KPI. Step 0 parses the invocation; honor the scoped mode for the entire run.
- **Never** treat the `--full` keyword as the default. Default is top-10 by leverage to keep output scannable; `--full` is opt-in.
