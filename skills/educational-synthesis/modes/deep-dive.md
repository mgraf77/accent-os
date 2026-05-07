# mode: deep-dive

> Default mode. Layered teaching for full mastery. Use when Michael wants to deeply understand a topic for >1 month memory.

## Audience default
intelligent non-expert (override only when Michael states otherwise)

## Files generated
- `executive-summary.md`
- `deep-dive.md` (the spine)
- `notebooklm-prompt.md`
- `concept-glossary.md`
- `analogies.md`
- `relationships.mmd`
- `faq.md`
- `misconceptions.md`
- `discussion-questions.md`
- `practical-applications.md` (only if topic is actionable in AccentOS)
- `risks-limitations.md` (only if topic has known failure modes)

## Word budgets per layer of `deep-dive.md`
| layer | cap | role |
|-------|-----|------|
| Foundational | 500 | Reader's mental model bootstrapped from zero |
| Intermediate | 1000 | Mechanics — how it actually works |
| Advanced | 1000 | Edge cases, second-order effects, failure modes |
| Strategic | 500 | What changes about Michael's decisions / AccentOS architecture |

## Per-layer endings
Every layer ends with a bulleted "What you should now be able to do" box. 3–5 explicit competency markers. Not optional — the markers are how the reader self-checks before advancing.

## Tone calibration
Analytical, calm, intellectually honest. Avoid hype, buzzwords, sensationalism. See `references/tone-rules.md`.

## When to deviate
- If the topic has <3 Core concepts (per Step 3 hierarchy), collapse Intermediate and Advanced into a single 1500-word layer. The 4-layer scaffold is calibrated for ≥5 Core concepts.
- If the topic is purely abstract (philosophy, mathematics, theory), drop `practical-applications.md` and expand `discussion-questions.md` to 10+ prompts.
- If the topic is purely operational (workflow, runbook), drop `risks-limitations.md` if no real failure modes exist, and expand `practical-applications.md` into a step-by-step guide.

## Anti-patterns specific to deep-dive
- Never merge layers to "save space." The progressive structure is the teaching.
- Never skip the competency markers. Without them, the reader can't self-check.
- Never write a Foundational layer that assumes domain vocabulary. Foundational means **zero prior knowledge** in the topic.
- Never write a Strategic layer that's just a summary of the Advanced layer. Strategic = decision-level changes, not recap.
