# template: reinforcement-system

> Step 10 output schemas. Reinforcement is what separates a learning ecosystem from a one-time read.

## Files this template covers

- `faq.md`
- `misconceptions.md`
- `discussion-questions.md`
- `risks-limitations.md` (when applicable)

---

## faq.md schema

```markdown
# FAQ — [topic name]

> Layered: foundational → intermediate → advanced → strategic. Re-engage the topic by skimming the section that matches your current depth.

## Foundational (read these first)

### Q: [common entry-level question]
**Direct answer:** [1 sentence]

[2–3 sentences of context — why this question comes up, what's behind it]

### Q: [next foundational question]
[same structure]

## Intermediate (mechanics)

### Q: [mechanism question]
**Direct answer:** [1 sentence]

[mechanism explanation — how does the underlying process produce the answer]

## Advanced (edge cases)

### Q: [edge-case question]
**Direct answer:** [1 sentence]

[edge case + what makes it edge-case rather than typical]

## Strategic (decision-grade)

### Q: [decision question — "should I X or Y"]
**Direct answer:** [1 sentence — usually a clear position]

[reasoning + counter-arguments + the conditions that flip the answer]
```

Total: 10–20 entries. Distribution roughly 30/30/25/15 across the four tiers.

---

## misconceptions.md schema

```markdown
# Misconceptions — [topic name]

> The wrong mental models a learner walks in with. Naming them BEFORE teaching the correct model is the load-bearing pedagogical move (see `modes/teach-me.md`).

## Misconception 1: [the wrong model in plain English]

**Why it's tempting:** [1–2 sentences — what about the topic invites this wrong model. Often: an adjacent domain has a similar-looking pattern, or the surface vocabulary suggests the wrong shape.]

**The correct mental model:** [1 paragraph — the right model + why the wrong model fails specifically.]

**How to verify which model you hold:** [1 question or test — a thought experiment whose answer differs by which model the reader has.]

## Misconception 2: ...
```

5–10 entries. Order from most-common-misconception to least.

---

## discussion-questions.md schema

```markdown
# Discussion questions — [topic name]

> Mix of reflection / challenge / scenario. Use solo (journaling) or group (whiteboard / podcast follow-up).

## Reflection prompts (you, alone, thinking)

1. [open-ended question that surfaces personal application]
2. [question that connects topic to existing AccentOS practice when relevant]

## Challenge prompts (push back on the synthesis)

3. [question that argues against the strategic conclusion — what would have to be true for the synthesis to be wrong]
4. [question identifying the strongest counter-position to the topic's main claim]

## Scenario prompts (apply to AccentOS or a specific case)

5. [concrete scenario — "A vendor X just did Y. Apply the framework. What's the right move?"]
6. [scenario forcing the reader to use 3+ Core concepts together]

## Synthesis prompts (combine with adjacent topics)

7. [how does this combine with [adjacent AccentOS concept] / [related framework]]
8. [what would change about [related decision] if we accepted this synthesis fully]
```

5–8 prompts. Ordered: reflection → challenge → scenario → synthesis.

---

## risks-limitations.md schema (when applicable)

Generate this file only when the topic is a system, framework, or strategy with known failure modes. Skip for purely descriptive topics (history, philosophy concepts).

```markdown
# Risks & Limitations — [topic name]

## What this topic does NOT cover

- [explicit out-of-scope item 1]
- [explicit out-of-scope item 2]
- [...]

## Known failure modes

### Failure 1: [name the failure]
**Triggered by:** [the specific condition that breaks the topic]
**Symptom:** [what the user observes when this fails]
**Mitigation:** [how to detect early or prevent]

### Failure 2: ...

## Conditions that would invalidate the synthesis

- [empirical condition that, if observed, would make the strategic conclusion wrong]
- [structural condition that, if changed, would change the mechanism]

## When this topic stops applying

[1 paragraph — the boundary of applicability. Past what scale, what era, what context does this stop being useful?]
```

This file is the intellectual honesty mark. Without it, the synthesis reads as overconfident.
