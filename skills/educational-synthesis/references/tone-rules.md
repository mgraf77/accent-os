# reference: tone rules

> Loaded in Step 0. Non-negotiable. Tone is what separates "premium educational artifact" from "AI summary."

## Required tone

- **Analytical** — claims are grounded in mechanism or evidence, not authority
- **Calm** — declarative sentences; no exclamation marks; no rhetorical questions for emphasis
- **Educational** — explain to teach, not to impress
- **Intellectually honest** — name the limits of every claim; acknowledge counter-positions
- **Grounded** — every strategic claim ties back to a Core concept
- **Strategically realistic** — implications are conditional ("if X then Y") not absolute

## Forbidden tone

- **Sensationalism** — "revolutionary," "game-changing," "fascinating," "incredible," "mind-blowing"
- **Excessive optimism** — "the future is bright," "the possibilities are endless," "no limits to"
- **Corporate buzzwords** — "synergy," "leverage," "unlock value," "deliver outcomes," "actionable insights," "best-in-class," "thought leadership," "value-add," "low-hanging fruit"
- **Shallow futurism** — "in the coming years," "as AI continues to evolve," "the future of [X] is [Y]"
- **Hedging that erodes claims** — "it could be argued that," "many experts believe," "in some sense"
- **Performative humility** — "I'm just an AI but," "this is a complex topic of course"

## Forbidden phrases (auto-catch on output)

Run a final pass before writing files. If any of these appear, rewrite:

- "It's worth noting"
- "Going forward"
- "At the end of the day"
- "In today's world"
- "Push the envelope"
- "Move the needle"
- "Drive value"
- "Holistic approach"
- "Robust framework"
- "Cutting-edge"
- "Disruptive"
- "Game-changer"
- "Paradigm shift"
- "Synergy"
- "Leverage" (as a verb)

## Sentence-shape rules

1. **Declarative > rhetorical.** "X causes Y." not "But isn't it true that X causes Y?"
2. **Specific > generic.** "RFM segments customers into 5 buckets by recency × frequency × monetary." not "RFM provides a way to categorize customers."
3. **Concrete > abstract.** "Vendor scores update when monthly sales cross the tier threshold." not "Scores are dynamically managed in response to vendor performance."
4. **Active > passive.** "The probability model weights stage at 20%." not "Stage is weighted at 20% in the probability model."
5. **Length variance.** Mix short and long sentences. Never produce three consecutive 30-word sentences. Never produce three consecutive 5-word sentences either.
6. **Definitive close.** End sections with a position, not a list of "considerations."

## Calibration to mode

- **deep-dive / teach-me** — warmer, more analogies, second person OK ("you")
- **exec-briefing** — colder, more declarative, second person rare, third person preferred
- **podcast** — most conversational, contractions OK, sentence fragments OK
- **visual-thinking** — sparsest; bullets ≤8 words; speaker notes get the prose
- **concept-map** — most technical; mechanism vocabulary OK; jargon defined inline

## When intellectually honest tone makes a claim weaker

Don't soften the claim — name the specific condition.

Bad: "This might work in some cases but probably not all."
Better: "This works when [specific condition]. It breaks when [specific opposite condition]."

The honesty IS the credibility. Vague hedging reads as wishy-washy; specific conditions read as expert.

## Anti-patterns specific to tone

- Never use exclamation marks. Excitement on the page reads as desperation.
- Never use rhetorical questions for emphasis. ("But what does this really mean?") They sound like a TED talk transition.
- Never start a section with "Imagine if..." Imagine-if openings invite the reader to fantasy, not analysis.
- Never use "we" to refer to the reader and the writer collectively. ("Now we'll see...") "We" is sloppy.
- Never apologize for difficulty. Don't say "this is complex but bear with me." Just teach it.
- Never claim something is "intuitive" — if it were intuitive, the synthesis wouldn't be needed.
