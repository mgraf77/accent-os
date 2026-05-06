# /aos-ralph — Run Ralph improvement loops on the wiki system

**Trigger**: `/aos-ralph [optional N iterations]`

## What it does

Runs the Ralph loop protocol on the wiki system. Each iteration: dry-run 2 Michael phrasings through every workflow → flag gaps → apply fixes → re-lint → repeat until 2 clean iterations or 4 total.

## Steps (per iteration)

**a. Mental dry-run**
- Pick 2 plausible Michael phrasings (e.g., "what rebate does WAC offer?", "how do I onboard a new vendor?")
- Walk every workflow step from user input → wiki lookup → response
- Flag: missing pages, broken wikilinks, silent failures, ambiguous steps

**b. Edge cases**
- 3 most likely failure modes:
  1. No matching wiki page (query returns nothing)
  2. Malformed frontmatter (missing required field)
  3. Stale page (confidence: low, updated >90 days)
  4. Ambiguous slug (two pages could match the query)

**c. Apply fixes**
- Edit wiki/CLAUDE.md and/or skills/accent-rag/SKILL.md as needed
- Create missing stub pages in wiki/inbox/ for gaps
- Run `/aos-lint` after each fix

**d. Iterate**
- Stop when 2 consecutive iterations find 0 new issues OR after 4 iterations total

## Log format

Each loop appended to wiki/log.md:
```markdown
## YYYY-MM-DD ralph-loop-N
- fix: [file] — [what changed]
- note: [failure mode surfaced]
```

Summary appended to BUILD_INTELLIGENCE.md after final loop.
