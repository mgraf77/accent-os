---
name: decision-log
description: >
  Capture go/no-go decisions about AccentOS architecture, vendor strategy,
  Supabase hsyjcrrazrzqngwkqsqa schema changes, BigCommerce store-cwqiwcjxes
  ops choices, or build sequencing as named, dated artifacts in
  /home/user/accent-os/decisions/. Each entry preserves the question,
  options considered, choice made, reasoning, reversal cost, and any
  future trigger that should reopen the decision. Use this skill when
  Michael says: "log this decision", "decision: auth model", "save this
  go/no-go", "document this choice", "record this call", "decided", or
  after any conversation where a non-trivial architectural / vendor
  / process choice was made. Do not use for code changes (use git) or
  for ad-hoc analyses (use analysis-snapshot). Always produces a file
  in decisions/ plus an INDEX.md update — never returns prose-only.
  Always writes a file to /home/user/accent-os/decisions/ and
  updates INDEX.md in the same operation — never one without the other.
---

# decision-log

**Purpose:** Solo autonomous-Claude builds lose decision provenance fast. PROMPT_LOG captures *what was asked*, SESSION_LOG captures *what happened*, but neither captures *why a non-obvious choice was made*. This skill fills that gap so resume-after-Codespace-stop carries forward the reasoning, not just the state. Always writes a file to /home/user/accent-os/decisions/ and updates INDEX.md in the same operation — never one without the other.

---

## Trigger Recognition

Run when Michael says:
- "log this decision"
- "decision: auth model" / "decision: vendor scoring" (topic form)
- "save this go/no-go"
- "document this choice"
- "record this call"
- "decided" (when followed by a decision statement)
- "capture this tradeoff" / "save the reasoning"

Also fire automatically (with one-line confirmation prompt) after any conversation where Claude observed a non-trivial architectural, vendor, or process choice.

---

## Step 1 — Identify the decision

Parse the originating context for:

- **Question** — what was being decided? Phrased as a question.
- **Options** — list of considered options (≥2; if only 1 was considered, that's not really a decision)
- **Choice** — which option won
- **Reasoning** — why that option, in 2–4 sentences from current conversation context
- **Reversal cost** — LOW (fully reversible by next session) / MEDIUM (reversible with rework) / HIGH (locks in architecture or external commitment)
- **Decision class** — architecture / vendor strategy / schema / ops / build sequencing / other

If any of question / choice / reasoning is missing from context, ask Michael for it once. Do not invent.

**1-option decisions:** if Michael picked X but no alternative was ever considered, this is implicitly a decision to *not* do something else. Ask Michael once: "What was the obvious alternative you rejected?" Capture it as option 2. If he says "none — this was the only path," log the decision with a single option and a `## Reasoning` line stating "no alternative considered." Don't pretend an alternative existed when it didn't.

---

## Step 2 — Estimate reversibility

For the reversal cost classification, use this rubric:

| Class | Examples |
|---|---|
| LOW | Skill design choice, branch naming, message wording, doc reformat |
| MEDIUM | Schema column rename, vendor scoring weight change, build-order swap |
| HIGH | Auth model choice, table-relationship change with FK propagation, BigCommerce API integration choice, breaking change to vendor_scores semantics |

If the class is HIGH, also capture:
- **Reopen trigger** — what condition would justify revisiting (e.g. "if AccentOS goes multi-user")
- **One-line worst case** — what breaks if this turns out wrong

---

## Step 3 — Name and write the decision file

If `/home/user/accent-os/decisions/` does not exist, create it (`mkdir -p`). If `decisions/INDEX.md` does not exist, create it with the standard header before appending.

Filename: `decision-NNN-[kebab-name].md` in `/home/user/accent-os/decisions/`.

- `NNN` = next sequential 3-digit (read `decisions/INDEX.md` to find max)
- `[kebab-name]` = short, action-oriented, ≤40 chars

Write file:

```markdown
# decision-NNN — [name]

**Date:** YYYY-MM-DD
**Class:** architecture | vendor strategy | schema | ops | build-sequencing | other
**Reversal cost:** LOW | MEDIUM | HIGH

## Question
[verbatim question from Step 1]

## Options considered
1. [option 1] — [one-line summary]
2. [option 2] — [one-line summary]
3. [option 3] — [one-line summary, if applicable]

## Choice
**Picked:** [option name]

## Reasoning
[2–4 sentences from conversation context]

## Reversal cost detail (HIGH only)
**Reopen trigger:** [condition]
**Worst case if wrong:** [one line]

## Related
- BUILD_PLAN_CLAUDE.md track [N.N] — if applicable
- skill: [name] — if affects an existing skill
- decision-NNN — if supersedes or is superseded by another decision
```

---

## Step 4 — Update the index

Append to `/home/user/accent-os/decisions/INDEX.md` (create if missing). Sort newest first:

```markdown
| NNN | name | date | class | reversal | reopened? |
|-----|------|------|-------|----------|-----------|
| 003 | vendor-cascade-output-shape | 2026-05-05 | architecture | LOW | — |
| 002 | sql-magic-no-mutations | 2026-05-05 | architecture | MEDIUM | — |
| 001 | skill-forge-approval-gate | 2026-05-05 | architecture | LOW | — |
```

---

## Step 5 — Output

```
DECISION LOGGED — decision-NNN

File: /home/user/accent-os/decisions/decision-NNN-[name].md
Class: [class]   |   Reversal cost: [cost]
Indexed: yes

Cite as: "per decision-NNN" in future PROMPT_LOG entries or commit messages.

[If HIGH reversal cost, also surface:]
⚠ HIGH reversal cost. Reopen if: [trigger]
   Worst case: [one line]
```

---

## Anti-patterns

- **Never** log a "decision" that wasn't actually a decision — if Michael never picked between options, there is nothing to log.
- **Never** invent reasoning. When the conversation context didn't capture why, ask once and wait for Michael's answer before writing the file.
- **Never** skip the /home/user/accent-os/decisions/INDEX.md update. Un-indexed decisions are findable only by accident.
- **Never** classify reversal cost optimistically. When in doubt, bump up — HIGH that turns out to be MEDIUM is fine; MEDIUM that turns out to be HIGH is a problem.
- **Never** edit a prior decision file's question / options / choice / reasoning. The only permitted post-write edit on a prior decision file is appending a `## Superseded by decision-NNN — YYYY-MM-DD` line. Always write that back-link when superseding so the old file points forward.
- **Never** write a decision file without running through the HIGH-reversal-cost check in Step 2. Supabase hsyjcrrazrzqngwkqsqa schema changes and BC store-cwqiwcjxes integration choices always require a reopen trigger and worst-case line.
