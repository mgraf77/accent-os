---
name: analysis-snapshot
description: >
  Capture any AccentOS ad-hoc analysis — vendor query, deal investigation,
  GMC feed audit, supabase-sql-magic result, vendor-cascade trace — as a
  named, re-runnable artifact stored in /home/user/accent-os/analyses/.
  Preserves the originating prompt, all parameters (vendor IDs, date
  ranges, thresholds), the literal SQL or cascade input, the Claude
  reasoning template, and the expected output format so Michael can
  re-run identically next week or next quarter without re-explaining
  context. Fires when Michael says: "save this analysis", "snapshot
  this", "I want to re-run this later", "make this re-runnable", "name
  this query", "preserve this", "snapshot this query", "keep this one",
  or "save it as vendor-rank-drops" (any kebab-case name). Fires automatically (with confirmation) after
  any vendor-cascade or supabase-sql-magic run against
  hsyjcrrazrzqngwkqsqa that produced a re-runnable result shape. Skip
  for one-time throwaway questions, code changes (use git), and docs
  (use AccentOS root docs). Always writes a named file to analyses/ and
  updates INDEX.md — never returns a prose summary in lieu of the
  artifact.
---

# analysis-snapshot

**Purpose:** Stop losing valuable AccentOS analyses in chat scrollback. Every meaningful vendor-cascade trace, supabase-sql-magic query, or GMC feed audit becomes a named artifact — re-runnable with new parameters in any future session.

Stolen from: the notebook-as-artifact pattern in Hex (hex.tech). Rebuilt as a single-purpose AccentOS skill — no notebook UI, no multiplayer, just file-on-disk + INDEX.md, version-controlled in the AccentOS repo.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "save this analysis"
- "snapshot this"
- "I want to re-run this later"
- "make this re-runnable"
- "name this query"
- "preserve this"
- "snapshot this query"
- "keep this one"
- "save it as vendor-rank-drops" (any kebab-case name)

Fire automatically (with confirmation) after any vendor-cascade or supabase-sql-magic run against `hsyjcrrazrzqngwkqsqa` where the result has re-runnable value: a recurring report shape, a diagnostic that will be needed again, or a query Michael spent time refining.

---

## Step 1 — Confirm re-runnable value

Before writing any file, verify the analysis earns a snapshot. Reject with a one-line reason when:
- The analysis was a one-time investigation that will not recur
- The result is already captured by an existing AccentOS module
- It is a code change (use git) or a doc change (use the root docs)

When unclear, default to capturing — a slightly redundant snapshot beats losing a useful one.

Output artifact: a binary PROCEED / SKIP decision with one-line rationale if SKIP.

---

## Step 2 — Extract the analysis components

Pull from the current conversation context:
- **Originating prompt** — the verbatim or paraphrased question Michael asked
- **Parameters** — vendor IDs, date ranges, thresholds, filters specific to this run
- **Query / SQL** — the literal SQL or vendor-cascade input that produced the result
- **Reasoning pattern** — if Claude interpreted the result, capture the steps as bullets
- **Output shape** — the format the result took (table, list, single number, chart spec)

Output artifact: a structured component list used verbatim in Step 4. If any component is missing from context, ask Michael once — never invent a value.

---

## Step 3 — Name the snapshot

Generate the filename: `snapshot-NNN-[kebab-name].md`

- `NNN` = next sequential 3-digit number (read `/home/user/accent-os/analyses/INDEX.md` for current max; start at `001` if the file is missing)
- `[kebab-name]` = short, descriptive, action-oriented kebab-case noun phrase

Concrete filename examples:
```
snapshot-001-vendor-rank-drops-weekly.md
snapshot-002-gmc-missing-images-by-brand.md
snapshot-003-deal-velocity-by-trade-partner.md
snapshot-004-bc-store-cwqiwcjxes-sku-gaps.md
```

If Michael gave a name ("save it as vendor-rank-drops"), kebab-case it and use it verbatim. Otherwise, infer from the originating prompt. Reject generic names like `snapshot-001-vendors.md` — specificity is what makes the file findable in 6 months.

Output artifact: the canonical filename string (e.g. `snapshot-007-gmc-missing-images-by-brand.md`) used in Steps 4, 5, and 6.

---

## Step 4 — Write the snapshot file

Output artifact: `/home/user/accent-os/analyses/snapshot-NNN-[name].md` — a new file written to disk, content matching the template below (every field filled from Step 2's component list).

```markdown
# snapshot-NNN — [name]

**Created:** YYYY-MM-DD
**Originating prompt:** [verbatim or paraphrased question]
**Re-run cadence:** weekly | monthly | quarterly | ad-hoc

## Parameters
- [param 1]: [value used in this run] — [type/range valid for re-runs]
- [param 2]: [value] — [type/range]

## Query
```sql
-- Against Supabase hsyjcrrazrzqngwkqsqa
[the literal SQL — parameterized where applicable]
```

(For vendor-cascade runs, replace Query with:)

## Cascade input
- Priorities: [list]
- Scoring formula source: [/home/user/accent-os/...]

## Reasoning pattern
1. [step Claude took to interpret the result]
2. [step]
3. [step]

## Output shape
table | list | single value | chart spec

## Re-run instructions
> "Re-run snapshot-NNN with [new param values]"
```

---

## Step 5 — Update the index

Append a row to `/home/user/accent-os/analyses/INDEX.md` (create the file if missing). Sort by NNN descending (newest first):

```markdown
| NNN | name | created | cadence | last re-run |
|-----|------|---------|---------|-------------|
| 004 | bc-store-cwqiwcjxes-sku-gaps | 2026-05-07 | ad-hoc | — |
| 003 | deal-velocity-by-trade-partner | 2026-05-06 | monthly | — |
| 002 | gmc-missing-images-by-brand | 2026-05-05 | weekly | — |
| 001 | vendor-rank-drops-weekly | 2026-05-05 | weekly | — |
```

Output artifact: the updated INDEX.md with the new row at position 1 (top of the table, after headers).

---

## Step 6 — Output

Print this exact confirmation block:

```
ANALYSIS SNAPSHOT — saved

File:    /home/user/accent-os/analyses/snapshot-NNN-[name].md
Indexed: yes (/home/user/accent-os/analyses/INDEX.md row NNN added)
Originating skill: [vendor-cascade | supabase-sql-magic | kpi-data-audit | manual]

Re-run any time:
  > "Re-run snapshot-NNN with [param: value, param: value]"

List all snapshots:
  > "Show analyses/INDEX.md"
```

Output artifact: the confirmation block above plus the file path of the written snapshot.

---

## Anti-patterns

- **Never** snapshot something that has no re-runnable value. Throwaway questions don't belong in `/home/user/accent-os/analyses/`.
- **Never** snapshot something that is already a feature in an AccentOS module — those have their own re-run path.
- **Never** invent parameters. If the original run did not specify a date range, capture "no range / all-time" rather than guessing one.
- **Never** modify the originating SQL or cascade input when snapshotting. Capture-as-is against `hsyjcrrazrzqngwkqsqa`; improvements happen on the next re-run.
- **Never** skip the INDEX.md update. An un-indexed snapshot is invisible to future sessions.
- **Never** name a snapshot generically (`snapshot-001-vendors.md`). The kebab-name must describe the question, not just the table.
- **Never** write a snapshot without the Supabase project ID or cascade source reference in the Query or Cascade input section — a query stripped of its target is not re-runnable.
