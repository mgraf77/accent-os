# mode: podcast

> NotebookLM-grade audio production. Use when Michael wants to consume on a walk / drive / gym.

## Audience default
intelligent non-expert (audio works best at this calibration — too technical and listener tunes out)

## Files generated
- `executive-summary.md` (the source-material outline)
- `notebooklm-prompt.md` (the primary deliverable — drop into NotebookLM Audio Overview)
- `analogies.md` (audio source — hosts will reach for these mid-conversation)

That's it. No slide deck, no glossary, no FAQ. The podcast IS the consumption format.

## Structure of `notebooklm-prompt.md`

The prompt has three sections:

### 1. Production parameters
```
Style: NPR / Acquired / Lex Fridman pacing
Length: 15–30 minutes
Hosts: 2 (one explainer, one curious-smart-listener)
Tone: analytical, calm, intellectually honest, no hype
Avoid: robotic summary, corporate buzzwords, sensationalism, future-tense speculation without grounding
```

### 2. Required moments
```
- Opening hook (≤90 sec): why this matters NOW, with a concrete anchor
- Core mechanism explainer (5–8 min): one host walks the other through how it actually works
- The "wait, why" question (around the 7-min mark): the curious host pushes back on a counterintuitive piece
- Misconception-correction segment (2–3 min): the wrong mental model and why it's tempting
- Strategic implications close (3–5 min): what changes about decisions because of this
- Sign-off (≤30 sec): one sentence on what listeners should now be able to do
```

### 3. Source material
The full `deep-dive.md` content is embedded here — but rewritten as conversation seeds, not prose paragraphs. Format:

```
TOPIC: [name]
CORE CONCEPTS: [list from Step 3]
KEY ANALOGIES (hosts should reach for these naturally):
  - [analogy 1 — domain → concept]
  - [analogy 2]
COMMON MISCONCEPTIONS:
  - WRONG: [misconception]  CORRECT: [model]
STRATEGIC IMPLICATIONS:
  - [implication 1]
  - [implication 2]
DISCUSSION ANGLES (host can pose any of these mid-conversation):
  - [reflection prompt]
  - [scenario prompt]
```

## Tone calibration for the prompt itself
The prompt is written FOR a voice-AI. Be specific about: pacing (don't rush), pauses (allow for thought), disagreement (have hosts push back occasionally), and avoiding the "AI summary voice" (long sentences, qualifying clauses, every fact equally weighted — sounds robotic).

## When to combine with another mode
If Michael wants both audio AND a written artifact, default to `deep-dive` AS the master and treat `podcast` as a derived format. Generate full deep-dive set + add `notebooklm-prompt.md`.

## Anti-patterns specific to podcast
- Never produce a script. NotebookLM (or future voice systems) generates the script. The prompt seeds the conversation.
- Never list every fact. The hosts can't speak a wall of bullets — they need a few load-bearing concepts and the freedom to riff.
- Never specify exact host names or personalities. Voice systems handle that.
- Never set a length above 30 minutes. Audience attention drops sharply past 30. If topic is bigger, split into a 2-part series.
- Never embed marketing language. The prompt's voice influences the output's voice — corporate phrasing produces corporate audio.
