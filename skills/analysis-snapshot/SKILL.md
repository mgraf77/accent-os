---
name: analysis-snapshot
description: >
  Capture an ad-hoc AccentOS analysis (vendor query, deal investigation,
  GMC feed audit, supabase-sql-magic result, vendor-cascade trace, etc.)
  as a named, re-runnable artifact stored in /home/user/accent-os/analyses/
  — preserving parameters, the SQL or query pattern, the Claude reasoning
  template, and the expected output format so Michael can re-run identically
  next week or next quarter without re-explaining context. Use this skill
  when Michael says: "save this analysis", "snapshot this", "I want to
  re-run this later", "make this re-runnable", "name this query",
  "preserve this", "save it as [name]", or after any meaningful
  vendor-cascade or supabase-sql-magic run that produced a useful result.
  Do not use for one-time throwaway questions, for code (use git), or for
  documentation (use the AccentOS root docs). Always produces a named file
  in analyses/ plus an INDEX.md update — never returns a prose summary
  in lieu of the artifact.
---

# analysis-snapshot

**Purpose:** Stop losing valuable AccentOS analyses in chat scrollback. Every meaningful vendor-cascade trace, supabase-sql-magic query, or GMC feed audit becomes a named artifact that can be re-run with new parameters in a future session.

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
- "save it as [name]"

Fire automatically (with confirmation) after any vendor-cascade or supabase-sql-magic run where the result clearly has re-runnable value (a recurring report shape, a diagnostic that'll be needed again, a query Michael spent time refining).

---

## Step 1 — Confirm re-runnable value

Before writing any file, confirm the analysis has re-run value. Skip this skill (and tell Michael why) when:
- The analysis was a one-time investigation that won't recur
- The result is already captured by an existing AccentOS module
- It's a code change (use git) or a doc change (use the root docs)

If unclear, default to capturing — better to have a slightly redundant snapshot than lose a useful one.

---

## Step 2 — Extract the analysis components

Pull from the current conversation context:
- **Originating prompt** — what Michael actually asked
- **Parameters** — vendor IDs, date ranges, thresholds, filters that were specific to this run
- **Query / SQL** — the literal SQL or vendor-cascade input that produced the result
- **Reasoning pattern** — if Claude did interpretation, capture the steps as bullets
- **Output shape** — what format the result took (table, list, single number)

If any component is missing from context (rare), ask Michael for it once — never invent.

---

## Step 3 — Name the snapshot

Generate the filename: `snapshot-NNN-[kebab-name].md`

- `NNN` is the next sequential 3-digit number (read `analyses/INDEX.md` to find current max)
- `[kebab-name]` is short, descriptive, action-oriented. Examples:
  - `snapshot-001-vendor-rank-drops-weekly.md`
  - `snapshot-002-gmc-missing-images-by-brand.md`
  - `snapshot-003-deal-velocity-by-trade-partner.md`

If Michael said "save it as [name]", use that name (kebab-cased). Otherwise, infer from the originating prompt.

---

## Step 4 — Write the snapshot file

Write to `/home/user/accent-os/analyses/snapshot-NNN-[name].md`:

```markdown
# snapshot-NNN — [name]

**Created:** YYYY-MM-DD
**Originating prompt:** [verbatim or paraphrased]
**Re-run cadence:** [weekly | monthly | quarterly | ad-hoc]

## Parameters
- [param 1]: [value used in this run] — [type/range for re-runs]
- [param 2]: [value] — [type/range]

## Query
```sql
[the literal SQL — parameterized where applicable]
```

(or, for vendor-cascade runs:)

## Cascade input
- Priorities: [list]
- Scoring formula source: [/home/user/accent-os/...]

## Reasoning pattern
1. [step Claude took to interpret the result]
2. [step]
3. [step]

## Output shape
[table | list | single value | chart spec]

## Re-run instructions
"Re-run snapshot-NNN with [new param values]"
```

---

## Step 5 — Update the index

Append to `/home/user/accent-os/analyses/INDEX.md` (create if missing):

```markdown
| NNN | name | created | cadence | last re-run |
|-----|------|---------|---------|-------------|
| 001 | vendor-rank-drops-weekly | 2026-05-05 | weekly | — |
```

Sort by NNN descending (newest first).

---

## Step 6 — Output

Confirmation block to Michael:

```
ANALYSIS SNAPSHOT — saved

File: /home/user/accent-os/analyses/snapshot-NNN-[name].md
Indexed: yes

Re-run any time with:
  > "Re-run snapshot-NNN with [param: value, param: value]"

Or list all snapshots with:
  > "Show analyses/INDEX.md"
```

If the snapshot was created off the back of a vendor-cascade or supabase-sql-magic run, also note: "Originating skill: [name]" so the chain is traceable.

---

## Anti-patterns

- **Never** snapshot something that has no re-runnable value. Throwaway questions don't belong in `analyses/`.
- **Never** snapshot something that's already a feature in an AccentOS module — those have their own UI re-run.
- **Never** invent parameters. If the original run didn't specify a date range, capture "no range / all-time" rather than guessing one.
- **Never** modify the originating SQL or cascade input when snapshotting. Capture-as-is. Improvements happen on the next re-run.
- **Never** skip the INDEX.md update. An un-indexed snapshot is invisible.
- **Never** name a snapshot generically (`snapshot-001-vendors.md`). Specificity is what makes it findable in 6 months.
