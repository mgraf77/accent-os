# mode: teach-me

> Beginner → expert progression for a learner who is new to the domain. Use when Michael (or someone he's teaching) is new to the field.

## Audience default
beginner (zero domain prior)

## Files generated
- `executive-summary.md` (a *map* of what's coming, not a TL;DR)
- `deep-dive.md` (radically rebalanced — see below)
- `analogies.md` (front-loaded; aggressive)
- `misconceptions.md` (front-loaded; reader sees these BEFORE the mechanics)
- `concept-glossary.md` (every term defined; cross-references generous)
- `faq.md` (10+ "stupid questions" the beginner is afraid to ask)
- `discussion-questions.md` (reflection-heavy, no scenarios yet)

## Word budget rebalance (vs default deep-dive)

| layer | default cap | teach-me cap |
|-------|-------------|--------------|
| Foundational | 500 | **1200** (doubled+) |
| Intermediate | 1000 | 1000 |
| Advanced | 1000 | 600 (compressed) |
| Strategic | 500 | 250 (halved) |

Rationale: a beginner needs the foundational layer to land hard. Strategic implications they can't act on yet.

## Per-concept structure (mandatory in this mode)

Every Core concept in `deep-dive.md` follows this structure (NOT optional):

```markdown
### [Concept name]

**The wrong mental model first:** [the misconception a beginner walks in with]

**Why that's tempting:** [1 sentence — what about the topic invites the wrong model]

**The correct mental model:** [the right model, in plain language]

**Analogy:** [from a domain the beginner already knows]

**Concrete example:** [a worked instance — for AccentOS topics, use AccentOS data]

**You should now be able to:** [explicit competency marker]
```

Front-loading the misconception is the load-bearing pedagogical move. Beginners don't have empty mental models — they have wrong ones. Address the wrong model BEFORE the correct one or the correct one collides with the wrong one and bounces off.

## Tone calibration
Warmer than default. Permission to use "you" liberally. Permission to say "this is genuinely hard" or "most people miss this part." Permission to slow down with explicit "before we move on, make sure you have ___" markers.

Still NOT permission for: hype, buzzwords, fake encouragement ("you got this!"), or oversimplification. Beginner ≠ stupid; talk *up* to a beginner who's smart and new.

## When to deviate
- If the beginner has *some* prior knowledge in the domain (e.g., Michael learning a new vendor strategy after years in distribution), collapse to `deep-dive` mode and just expand Foundational by ~30%. Full teach-me mode is for true zero-prior.
- If the topic is mostly visual (architecture diagrams, geometry, system maps), promote to `visual-thinking + teach-me` combo.

## Anti-patterns specific to teach-me
- Never present the correct model first. Misconception-first or the correct model collides with the wrong model.
- Never use Strategic-layer framing for a beginner. They can't act yet; talking strategy is noise.
- Never use jargon without inline definition in Foundational. Glossary cross-reference is not enough — the term must land in context.
- Never stack 3+ analogies on the same concept. Two is the max — beyond that, the analogies compete and confuse.
- Never grade the beginner's progress in the file ("you're doing great!"). Competency markers are descriptive ("you can now ___"), not evaluative.
