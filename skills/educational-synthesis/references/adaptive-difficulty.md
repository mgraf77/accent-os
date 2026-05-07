# reference: adaptive difficulty

> Loaded in Step 0 when audience calibration is non-trivial. The skill adjusts depth, vocabulary, analogy density, and competency markers based on audience.

## Audience tiers

| tier | knows | doesn't know | reading speed | analogy need |
|------|-------|--------------|---------------|--------------|
| beginner | nothing about this domain | everything specific to topic | slow | maximum |
| intelligent non-expert | adjacent domains, general principles | topic-specific vocabulary | moderate | high |
| intermediate | the basic mechanics | edge cases and second-order effects | fast | moderate |
| advanced | the full mechanism | the strategic / decision implications | fast | low |
| executive | how decisions get made | the mechanism details | very fast | low |

## Default audience

When Michael doesn't specify, default to **intelligent non-expert**. Rationale:

- It's the highest-leverage default — covers most Michael use cases
- Most AccentOS topics need more than beginner depth (Michael isn't new) but less than advanced (he's not the implementer of every topic)
- "Intelligent non-expert" produces output usable by Michael AND shareable with employees / vendors / outside readers

## Calibration knobs

For each audience tier, tune these knobs:

### Vocabulary

- **beginner** — every domain term defined inline on first use, then used freely
- **intelligent non-expert** — domain terms used freely; cross-reference to glossary
- **intermediate** — assume vocabulary; only define new-or-narrow terms
- **advanced** — assume all vocabulary; introduce specialized vocabulary as needed
- **executive** — strip jargon; replace with plain English even when less precise

### Analogy density

- **beginner** — every Core concept gets ≥3 analogies; first analogy at the front of the explanation
- **intelligent non-expert** — every Core concept gets 2 analogies; first analogy mid-explanation
- **intermediate** — Core concepts get 1 analogy when one is genuinely useful; otherwise skipped
- **advanced** — analogies only for novel concepts; mostly direct mechanism explanation
- **executive** — 1 analogy total, in the executive-summary opening — the rest is decision-shape

### Layer word budgets

| audience | foundational | intermediate | advanced | strategic |
|----------|--------------|--------------|----------|-----------|
| beginner | 1200 | 1000 | 600 | 250 |
| intelligent non-expert | 500 | 1000 | 1000 | 500 |
| intermediate | 250 | 800 | 1200 | 750 |
| advanced | 100 (anchor) | 500 | 1500 | 900 |
| executive | (skip layers; use exec-briefing mode instead) |

### Competency markers

- **beginner** — markers between every Core concept (not just per layer)
- **intelligent non-expert** — markers between layers (default)
- **intermediate** — markers at the end of Advanced and Strategic only
- **advanced** — markers at the end of Strategic only
- **executive** — markers replaced by "Next step" line (single concrete action)

### Misconception placement

- **beginner** — misconceptions BEFORE mechanism (per teach-me mode)
- **intelligent non-expert** — misconceptions in their own file, after deep-dive
- **intermediate** — misconceptions appear at the boundary between Intermediate and Advanced layers
- **advanced** — misconceptions section optional; only when a non-trivial wrong model exists
- **executive** — skip misconceptions; replace with single-line "what this is NOT" callout in exec-briefing

## Detecting audience from cues

Michael rarely names audience explicitly. Detect from the request:

- "teach me" / "explain like a course" / "I'm new to this" → beginner
- "deep dive" / "synthesize" / "build a learning ecosystem" → intelligent non-expert (default)
- "how does X actually work under the hood" / "trace this through" → intermediate
- "edge cases of X" / "where does X break" → advanced
- "brief me" / "1-pager" / "decision needed by Friday" → executive

When mixed signals, default to intelligent non-expert and note the calibration in Step 0 output.

## Calibration tradeoffs

- **Too low for audience** — reader gets bored, abandons, learns nothing
- **Too high for audience** — reader gets confused, misreads, learns the wrong thing

Of these two failures, "too high" is worse. Bored readers will skim and find what they need; confused readers walk away with misconceptions.

When in doubt, default down one tier. Beginner reading intelligent-non-expert content > intelligent-non-expert reading advanced content.

## Anti-patterns specific to adaptive-difficulty

- Never produce content for "general audience" — that's a non-calibrated audience and produces non-calibrated writing.
- Never produce different word budgets across files in the same artifact set. The deep-dive and the executive-summary are different audiences by design; the FAQ and the deep-dive should match.
- Never strip vocabulary in beginner mode and then reintroduce it without a definition. Every domain term lands once, with a definition, on first use.
- Never default to advanced calibration "to look smart." Defaulting up makes the output shallower for the actual reader because they re-read or abandon.
