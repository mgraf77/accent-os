# educational-synthesis — output modes

> Pick a mode based on the consumer of the artifact. Each mode tunes Step 7 (format selection) and Step 8 (depth calibration) of `SKILL.md`. Default mode: **deep-dive**.

---

## Mode catalog

| key | one-line | best when | files generated (default set) |
|-----|----------|-----------|-------------------------------|
| `deep-dive` | Layered teaching (foundational → strategic) | Default. Michael wants to deeply understand a topic. | exec + deep-dive + notebooklm + glossary + analogies + faq + misconceptions + discussion + relationships |
| `exec-briefing` | 1-page decisions-grade summary | Need to act on this in the next 24h, no time for layered teaching. | exec only + 1-paragraph FAQ + risks-limitations |
| `podcast` | NotebookLM-grade audio production | Want to consume on a walk / drive / gym. | exec + notebooklm-prompt + analogies (audio source material) |
| `visual-thinking` | Slide deck + infographic + mind map | Sharing with a non-reader audience or building a teach-out asset. | exec + slide-deck + infographic + mind-map + relationships |
| `teach-me` | Beginner → expert progression for a learner who is new to the domain | Michael (or someone he's teaching) is new to the field. | foundational layer expanded; advanced/strategic compressed; aggressive analogies; misconceptions front-loaded |
| `concept-map` | System map / dependency graph / feedback loops | Diagnosing why a system behaves the way it does. | relationships + glossary + faq (mechanism-focused) + risks-limitations |

---

## How to switch

- Implicitly: Michael's phrasing chooses the mode. "Podcast this" → `podcast`. "Brief me" → `exec-briefing`. "Give me a deck" → `visual-thinking`. "Map the dependencies" → `concept-map`. "Teach me from scratch" → `teach-me`.
- Explicitly: prefix the request with the mode name. Example: "exec-briefing mode: vendor probability model."
- When ambiguous, default to `deep-dive`. The deep-dive output is the superset; sub-modes are pruned versions.

---

## Mode-specific tuning rules

**`deep-dive`** — Layers 1–4 each get full word budget. Reinforcement files generated. Visualizations generated when Step 5 surfaces visual-shaped concepts.

**`exec-briefing`** — Single file. Structure: TL;DR (3 lines) → What it is (1 paragraph) → Why it matters now (1 paragraph) → 3 strategic implications → 1 risk → 1 next step. No layered teaching. Tone: confident-and-direct.

**`podcast`** — NotebookLM Audio Overview prompt is the primary deliverable. Deep-dive content lives inside the prompt's "source material" section, not as a separate file. Discussion questions repurposed as "host follow-up questions."

**`visual-thinking`** — Slide deck + infographic + mind map are primary. Deep-dive becomes "speaker notes." Analogies expanded into visual metaphors with diagram callouts.

**`teach-me`** — Layer 1 (foundational) doubles in length. Misconceptions file moves to the front of the reading order. Layer 4 (strategic) halves in length. Tone calibration: warmer, with explicit "you should now be able to" markers between every concept (not just per-layer).

**`concept-map`** — Mermaid relationship graph is the primary deliverable. Glossary cross-references every node. FAQ is mechanism-focused ("why does X cause Y") not application-focused. Discussion questions skipped.

---

## Combining modes

Modes generally do not stack. If Michael asks for both `deep-dive` and `podcast`, generate the full deep-dive artifact set AND the podcast prompt — but treat the deep-dive as primary and the podcast as derived.

`exec-briefing` and `concept-map` can be paired ("brief me with a system map") — produces the exec file plus a relationship diagram, nothing else.

---

## Per-mode files

See `modes/[mode].md` for per-mode generation rules, audience defaults, and word-budget caps.
