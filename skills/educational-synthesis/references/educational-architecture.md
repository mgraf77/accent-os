# reference: educational architecture

> The 10-tier knowledge organization model. Used internally during Steps 2–10 to produce coherent multi-file artifacts.

## 10 tiers of knowledge

Every educational synthesis organizes the topic into these 10 tiers. Tiers map to specific files in the output set.

| tier | what it is | primary file | secondary files |
|------|-----------|--------------|-----------------|
| 1. Core concepts | the 3–7 ideas that, if removed, collapse the topic | `deep-dive.md` (Intermediate layer) | `concept-glossary.md` |
| 2. Supporting concepts | ideas that sharpen the core but aren't load-bearing | `deep-dive.md` (Intermediate layer) | `concept-glossary.md` |
| 3. Dependencies | pre-requisites the reader must hold | `deep-dive.md` (Foundational layer) | `concept-glossary.md` |
| 4. Mental models | the cognitive frame for thinking about the topic | `deep-dive.md` (across all layers) | `analogies.md` |
| 5. Analogies | translations to familiar domains | `analogies.md` | `deep-dive.md` (inline) |
| 6. Strategic implications | what changes about decisions | `deep-dive.md` (Strategic layer) | `executive-summary.md` |
| 7. Practical applications | concrete uses (AccentOS-specific when relevant) | `practical-applications.md` | `deep-dive.md` (Strategic layer) |
| 8. Risks and limitations | failure modes, scope boundaries | `risks-limitations.md` | `deep-dive.md` (Advanced layer) |
| 9. Future implications | how the topic might evolve | (subsection of `risks-limitations.md`) | (none) |
| 10. Reinforcement mechanisms | retention scaffolding | `faq.md`, `misconceptions.md`, `discussion-questions.md` | `deep-dive.md` (competency markers) |

## Why 10 tiers (not fewer)

Generic AI summaries collapse multiple tiers into one ("Here's what RFM segmentation is and why it matters"). Educational synthesis separates them deliberately because:

- **Tier 1 vs tier 2**: a reader can re-engage the topic by re-reading only Core concepts; supporting concepts are reachable but not foundational
- **Tier 3 vs tier 1**: dependencies belong in Foundational layer; Core concepts belong in Intermediate
- **Tier 4 vs tier 5**: mental models are how the reader thinks about the topic; analogies are bridges from familiar domains. They're related but distinct.
- **Tier 6 vs tier 7**: strategic implications are decision-grade ("you should do X"); practical applications are operational ("here's how to do X")
- **Tier 8 vs tier 9**: risks are present-tense ("this fails when..."); future implications are conditional ("this might change if...")
- **Tier 10 separately**: reinforcement is scaffolding, not content. Confusing it with content (e.g., turning the FAQ into a hidden second deep-dive) bloats the artifact and reduces use.

## Tier ordering for the deep-dive

The `deep-dive.md` file weaves through tiers in this order, NOT in tier-number order:

1. Tier 3 (dependencies) — Foundational layer
2. Tier 4 (mental models) — Foundational layer (frame the topic)
3. Tier 1 (core concepts) — Intermediate layer (the load-bearing teaching)
4. Tier 2 (supporting concepts) — Intermediate layer (sharpen the core)
5. Tier 5 (analogies) — woven inline throughout layers
6. Tier 8 (risks/limitations) — Advanced layer
7. Tier 9 (future implications) — Advanced layer
8. Tier 6 (strategic implications) — Strategic layer
9. Tier 7 (practical applications) — separate file, referenced from Strategic layer
10. Tier 10 (reinforcement) — separate files

The progressive structure of `modes/deep-dive.md` (Foundational → Intermediate → Advanced → Strategic) IS this ordering.

## Per-tier counts (ranges)

For a non-trivial topic:

| tier | typical count |
|------|---------------|
| 1. Core concepts | 3–7 |
| 2. Supporting concepts | 5–15 |
| 3. Dependencies | 2–6 |
| 4. Mental models | 1–3 |
| 5. Analogies | 2 per Core concept (so 6–14 total) |
| 6. Strategic implications | 3–5 |
| 7. Practical applications | 2–6 (when topic is actionable) |
| 8. Risks/limitations | 3–7 |
| 9. Future implications | 1–3 (often optional) |
| 10. Reinforcement | 10–20 FAQ + 5–10 misconceptions + 5–8 discussion |

If your inventory has fewer Core concepts than 3, the topic might be too narrow for full educational-synthesis — consider `analysis-snapshot` or `decision-log` instead.

If you have more than 7 Core concepts, the topic is too broad — split into sub-topics, each with its own synthesis.

## Cross-references between tiers

The artifact set is a graph, not a list. Cross-references make the graph navigable:

- Every Core concept in `concept-glossary.md` links to its analogies in `analogies.md`
- Every misconception in `misconceptions.md` links to the Core concept it relates to
- Every discussion question in `discussion-questions.md` is tagged with the Core concepts it forces
- The relationship graph in `relationships.mmd` includes every tier-1 and tier-2 concept

## Anti-patterns specific to educational-architecture

- Never write a deep-dive that doesn't traverse all 4 layers. Skipping a layer = skipping a tier.
- Never put strategic implications in the Foundational layer. They have no anchor yet.
- Never separate analogies from the deep-dive entirely. Analogies belong inline AND in their own file. The inline appearance is what makes them teach in context.
- Never put reinforcement content (FAQ, misconceptions) inside the deep-dive. Reinforcement files are re-entry points; embedding them inflates the deep-dive and dilutes their use.
- Never produce a 10-Core-concept synthesis. That's not a topic, it's a domain. Split.
