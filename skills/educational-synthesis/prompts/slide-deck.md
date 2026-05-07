# prompt: slide-deck

> Slide-by-slide architecture for any deck tool (Keynote, Google Slides, Figma, Canva). The output is structural — titles, bullets, visuals, speaker notes — not a styled file.

## How to use

1. Run `educational-synthesis` in `visual-thinking` mode.
2. Open `/home/user/accent-os/knowledge/[topic-slug]/slide-deck.md`.
3. Hand the file to a designer, OR build the deck yourself slide-by-slide using the architecture as a blueprint.

## Template structure for `slide-deck.md`

```markdown
# Slide deck — [topic name]

**Length:** [N] slides
**Audience:** [calibration]
**Mode:** visual-thinking
**Read time as deck:** [N] minutes
**Designer notes:** [any color / font / brand directives]

---

## Slide 1: Title + provocation

**Visual:** Single full-bleed image OR text-only on solid background
**Title:** [topic name in plain English]
**Subtitle:** [one-line provocation — the question the deck answers]
**Speaker notes:** [what the presenter says aloud — 2 sentences]

---

## Slide 2: Why this matters now

**Visual:** [chart, anchor image, or pull-quote]
**Bullets:** (max 3)
- [stake 1]
- [stake 2]
- [stake 3]
**Speaker notes:** [the trigger — what just changed]

---

## Slide 3: Roadmap

**Visual:** Numbered sections preview (1. Mechanics → 2. Edge cases → 3. Strategic)
**Bullets:** (max 3 — match the sections you'll cover)
- 1. The mechanism
- 2. Where it breaks
- 3. What changes because of this
**Speaker notes:** "By the end of this deck, you'll be able to ___."

---

## Slide 4: The concept map

**Visual:** Mermaid render of `relationships.mmd` — full-screen, edges labeled
**Title:** "How it all connects"
**No bullets.** The graph IS the slide.
**Speaker notes:** [walk through 2–3 most important edges]

---

## Slides 5–N: One slide per Core concept

Format every concept-slide identically:

```
**Visual:** Diagram or analogy illustration
**Title:** [Concept name]
**Bullets:** (max 3, ≤8 words each)
- Definition
- Analogy or example
- Why it matters
**Speaker notes:** [2–4 sentences expanding the bullets]
```

---

## Slides N+1 to N+3: Mechanics

Either a flowchart slide OR 2–3 sequential slides walking through the workflow.

---

## Slides N+4 to N+6: Edge cases / failure modes

One slide per major failure mode. Format:

```
**Visual:** Before/after diagram or warning callout
**Title:** When [X] breaks: [failure name]
**Bullets:**
- Triggered by: ___
- Symptom: ___
- Mitigation: ___
**Speaker notes:** [why this matters specifically]
```

---

## Slides N+7 to N+9: Strategic implications

One slide per strategic implication. Each slide answers: "Because of this, you should ___."

---

## Slide N+10: Common misconceptions

**Visual:** Two columns — "Wrong model" / "Correct model"
**Title:** What people get wrong
**Bullets:** [3 misconception → correction pairs, each ≤8 words per side]
**Speaker notes:** [why these specific misconceptions are common]

---

## Slide N+11: What you should now be able to do

**Visual:** Checklist illustration
**Title:** Take-aways
**Bullets:** [3–5 explicit competency markers]
**Speaker notes:** [self-check — invite the audience to mentally check each box]

---

## Slide N+12: Q&A

**Visual:** Open question icon or audience visual
**Title:** Questions
**Bullets:** (3 starter prompts to break silence)
- "What surprised you about ___?"
- "Where might this not apply?"
- "How would you adapt this to ___?"
**Speaker notes:** [optional — the 3 questions you most expect]

---

## Slide N+13: Sources & further reading

**Title:** Where this came from
**Bullets:**
- Source 1 (URL or path)
- Source 2
- Companion artifact: `/home/user/accent-os/knowledge/[topic-slug]/`
**Speaker notes:** [none]
```

## Length calibration

| topic complexity | total slides |
|------------------|--------------|
| 1–3 Core concepts | 12–15 |
| 4–6 Core concepts | 15–20 |
| 7+ Core concepts | 20–25 OR split into 2 decks |

Past 25 slides, attention drops. Splitting is better than overloading.

## Color semantics (only when used)

If the deck uses color:
- Red → risk, failure mode, feedback loop
- Blue → mechanism, primary concept
- Green → strategic payoff, take-away
- Gray → supporting concept, dependency

Never use color for decoration. Color = semantic.

## Anti-patterns specific to slide-deck

- Never put more than 3 bullets on a slide.
- Never put more than 8 words on a bullet.
- Never use stock illustration that doesn't teach. Visuals must come from the concept (mechanism diagrams, analogy illustrations, mind-map sub-trees).
- Never put text on the relationship-graph slide beyond node labels and edge types.
- Never produce slides without speaker notes. The deck is the script-anchor; without speaker notes, the deck is decoration.
