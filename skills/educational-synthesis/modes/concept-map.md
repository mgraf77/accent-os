# mode: concept-map

> System map / dependency graph / feedback loops. Use when diagnosing why a system behaves the way it does.

## Audience default
intermediate (you already know the parts; you're trying to see the whole)

## Files generated
- `relationships.mmd` (the primary deliverable — Mermaid graph)
- `concept-glossary.md` (every node in the graph defined)
- `faq.md` (mechanism-focused — "why does X cause Y")
- `risks-limitations.md` (when does the system break)

That's it. No deep-dive, no analogies file, no podcast prompt, no slide deck.

## Structure of `relationships.mmd`

```mermaid
graph TD
  %% Core concepts as primary nodes
  A[Concept A]:::core
  B[Concept B]:::core
  C[Concept C]:::core

  %% Supporting concepts
  D[Concept D]:::support
  E[Concept E]:::support

  %% Causal edges with type labels
  A -->|drives| B
  B -->|amplifies| C
  C -.->|feeds back to| A   %% feedback loop, dotted edge
  D -->|gates| B
  E -->|moderates| C

  %% Antagonist relationships
  A -.->|competes with| F[Alternative path]:::antagonist

  classDef core fill:#1f5fff,color:#fff,stroke:#000,stroke-width:2px
  classDef support fill:#888,color:#fff
  classDef antagonist fill:#c33,color:#fff
```

Conventions:
- Solid edges = direct causation
- Dotted edges = feedback loops or antagonist relationships
- Bold node = Core concept (Step 3 tier 1)
- Edge labels are verbs (drives, amplifies, gates, moderates, competes with). Never just arrows without labels.

## Feedback loops

Concept-map mode treats feedback loops as the load-bearing insight. Every loop in the graph gets:

1. **Highlighted** in the Mermaid output (dotted edges + a separate "Feedback loops" subsection)
2. **Explained** in a `faq.md` entry: what initiates the loop, what amplifies it, what dampens it, when it stabilizes vs. spirals
3. **Flagged** in `risks-limitations.md`: the runaway condition (when feedback becomes positive runaway)

If the topic has zero feedback loops, the concept-map mode is overkill — downgrade to `deep-dive` or `visual-thinking`.

## Glossary requirements

Every node in the graph appears in `concept-glossary.md` with:
- Name + 1-sentence definition
- "Inputs" (upstream concepts feeding it)
- "Outputs" (downstream concepts it feeds)
- "Often confused with" (cross-reference for misconceptions)

The glossary doubles as the navigational index for the graph.

## FAQ structure

Mechanism-focused. Format every entry:
```markdown
### Why does [X] cause [Y]?

[1-paragraph mechanism explanation, traced through the relationship graph]

**Edge case:** [when this causation breaks down]
```

10–15 entries. Skip "what is X" questions — those are in the glossary.

## When to combine with another mode
`concept-map + deep-dive` is the natural pairing when the topic is system-shaped AND Michael wants depth. Generates both artifact sets.

`concept-map + exec-briefing` produces a 1-pager + system diagram — useful when an executive needs to see the whole system fast without the layered teaching.

## Anti-patterns specific to concept-map
- Never produce a graph without edge labels. Unlabeled arrows are decoration, not analysis.
- Never include nodes that have only one connection. Either they're not Core, or you're missing their other relationships.
- Never bury feedback loops inside ordinary edges. Visual treatment must distinguish them — they're the highest-leverage insight.
- Never produce a graph with >25 nodes. Past that, split by sub-system. A 30-node graph reads as a wall.
- Never write prose explanations of the graph in the .mmd file. Prose lives in `faq.md`. The graph is the structural artifact.
