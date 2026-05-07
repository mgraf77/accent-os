# prompt: notebooklm-podcast

> Drop-in prompt for NotebookLM Audio Overview (or any future AI voice system). Generates a 15–30 minute conversational explainer that sounds like a premium business/tech podcast — not a robotic AI summary.

## How to use

1. Run `educational-synthesis` in `podcast` mode (or `deep-dive` mode with podcast as a derived format).
2. Open `/home/user/accent-os/knowledge/[topic-slug]/notebooklm-prompt.md`.
3. Paste the entire prompt (sections 1–3 below) into NotebookLM's "Customize Audio Overview" prompt field.
4. Generate.

## Template (paste this into the topic's notebooklm-prompt.md)

````markdown
# NotebookLM Audio Overview prompt — [topic name]

You are producing a podcast episode about **[TOPIC NAME]** for an audience of intelligent non-experts. The two hosts are NOT introducing themselves and NOT performing a recap of the source material. They are having a genuine conversation that teaches the topic.

## Production parameters

- **Style reference:** NPR, Acquired, Lex Fridman pacing — analytical, calm, intellectually honest
- **Length:** 15 to 30 minutes
- **Hosts:** 2
  - Host A is the "explainer" — has read the source material and walks through it
  - Host B is the "smart curious listener" — interrupts with the questions an intelligent non-expert would ask, and occasionally pushes back when something doesn't add up
- **Tone:** confident but not hyped; specific not vague; analytical not sensational
- **Pacing:** allow pauses for thought; no rushing; vary sentence length
- **Forbidden:** "fascinating," "revolutionary," "game-changing," "in today's world," "going forward," "leverage," "synergy," "actionable insights," any version of "ladies and gentlemen, what an episode"

## Required moments (in order)

1. **Opening hook (≤90 seconds)** — start with a concrete anchor. Why does this matter NOW. What just changed in the world / in [Michael's domain] that made this worth a conversation today.

2. **Core mechanism explainer (5–8 minutes)** — Host A walks Host B through the actual mechanics. Use the analogies in the source material when they fit naturally. Don't dump every concept; focus on the load-bearing ones.

3. **The "wait, why" pushback (around the 6-8 minute mark)** — Host B pushes back on the most counterintuitive piece. Host A doesn't dismiss the pushback — they engage with it and either refine the answer or acknowledge a real limit.

4. **Misconception correction (2–3 minutes)** — Host A names the wrong mental model most people walk in with, explains why it's tempting, and walks through the correct model. This is a discrete segment, not a one-liner.

5. **Strategic implications close (3–5 minutes)** — what changes about decisions because of this topic. Concrete and specific. If the topic is AccentOS-related, name the modules / vendors / KPIs affected.

6. **Sign-off (≤30 seconds)** — one sentence on what listeners should now be able to do. No "thanks for listening, smash the like button" — just close the loop.

## Source material

[paste the full deep-dive.md contents below — the AI uses this as the substantive base, but rewrites in conversational form]

---
[INSERT deep-dive.md HERE]
---

## Concept inventory (hosts can reach for any of these)

[paste the table from concept-inventory.md]

## Key analogies (hosts should use these naturally — not announce them)

[paste analogies.md]

## Common misconceptions to address

[paste misconceptions.md]

## Strategic implications (the close)

[paste the Strategic layer of deep-dive.md]

## Discussion angles (hosts can pose any of these mid-conversation)

[paste discussion-questions.md]
````

## Calibration rules

**Length to topic complexity:**
- 1–3 Core concepts → 15-minute episode
- 4–6 Core concepts → 20-minute episode
- 7+ Core concepts → 25–30 minutes, OR split into a 2-part series

**For AccentOS topics specifically**, instruct the hosts to:
- Reference real AccentOS modules / vendors / KPIs by name when relevant
- Avoid pretending the audience is general — they're learning about a specific business
- Use Michael's voice indirectly when he's the protagonist of the topic ("the operator decided to..." rather than "you might decide to...")

## Anti-patterns specific to this prompt

- Never instruct the AI to produce a script. The AI generates the script; the prompt seeds the conversation.
- Never include exact host names or personalities. Voice systems handle that.
- Never specify exact segment durations beyond ≤90 sec hook and ≤30 sec sign-off. Strict timestamps produce robotic pacing.
- Never list every fact as "must mention." That produces a wall-of-bullets episode. Prioritize the load-bearing concepts and let the hosts riff.
- Never include marketing language in the prompt. The prompt's voice influences the output's voice — corporate phrasing produces corporate audio.
