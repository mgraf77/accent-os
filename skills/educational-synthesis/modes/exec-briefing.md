# mode: exec-briefing

> 1-page decisions-grade summary. Use when Michael needs to act in the next 24h, not learn for 6 months.

## Audience default
executive (operating at decision speed, not learning speed)

## Files generated
- `executive-summary.md` (the only primary)
- `risks-limitations.md` (one paragraph max)
- `faq.md` (3–5 questions only — what would a CFO/board member ask)

That's it. No deep-dive, no analogies file, no NotebookLM prompt, no glossary, no discussion questions.

## Structure of `executive-summary.md`

```markdown
# [Topic] — Executive Briefing

**Date:** YYYY-MM-DD
**Audience:** Owner / decision-maker
**Read time:** 3 minutes

## TL;DR
- [3 bullet lines, each one sentence, each ending with the strategic verdict]

## What it is
[1 paragraph, ≤80 words. The core mechanism in plain language.]

## Why it matters now
[1 paragraph, ≤80 words. The trigger condition. What just changed in the world / in AccentOS / in Michael's data.]

## Strategic implications
1. [decision-level implication]
2. [decision-level implication]
3. [decision-level implication]

## Risk
[1 sentence on the most material downside if Michael acts on this.]

## Next step
[1 sentence on the single concrete action this briefing recommends.]
```

## Word cap
~400 words across the file. Anything more and Michael won't read it.

## Tone calibration
Confident, direct, decision-oriented. NOT casual, NOT exploratory, NOT speculative. If a claim isn't load-bearing for the next-step recommendation, cut it.

## When to upgrade to deep-dive
If Michael's response to the briefing is "I need to understand this better before deciding," re-run in `deep-dive` mode on the same topic — the briefing becomes the new `executive-summary.md` of the upgraded artifact set.

## Anti-patterns specific to exec-briefing
- Never include "background context" that doesn't drive the next-step recommendation.
- Never hedge. Executives need a position, not a survey of opinions.
- Never use buzzwords ("synergistic," "leverage," "actionable insights"). Plain English is faster.
- Never recommend "monitor and revisit" — that's not a next step.
- Never produce more than one risk. Triaged to the single most material one.
