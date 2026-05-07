---
name: podsplain
description: >
  Generate a podcast-style audio learning session (WAV file) on any topic. Two AI hosts
  break down concepts in a natural, engaging conversation — like NotebookLM Audio Overview
  meets targeted scenario framing. Hosts have distinct personalities: one explains, one
  questions/challenges. Output: WAV file + script markdown in podsplains/<slug>/. Scenarios:
  learn (default), boardroom, ralph-loop, interview, customer-onboarding, debate.
  Use when Michael says: "podsplain [topic]", "make a podcast on [X]", "audio explainer
  for [X]", "podsplain [topic] as [scenario]", "generate a learning episode on [X]",
  "make me a [scenario] episode on [X]", "walk me through [X] like a podcast". Needs
  OPENAI_API_KEY or ELEVENLABS_API_KEY set for TTS audio generation.
---

# podsplain

**Purpose:** Generate a downloadable WAV podcast episode that teaches Michael a concept,
walks through a scenario, or simulates a high-stakes conversation — all in plain spoken
English he can listen to while driving, cooking, or away from the keyboard.

Inspired by NotebookLM's Audio Overview (two hosts, natural banter, "why does this matter")
and ChatGPT voice mode (real speech, not robot). The key mechanic: one host explains, the
other asks exactly what the listener would ask. Output is a real audio file, not a transcript.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "podsplain [topic]"
- "make a podcast on [X]"
- "audio explainer for [X]"
- "podsplain [topic] as [scenario]"
- "create a [scenario] episode on [X]"
- "walk me through [X] like a podcast"
- "generate a learning session on [X]"
- "I want to listen to something on [X]"
- "make me an audio thing on [X]"

**Scenario keywords:** if Michael mentions "boardroom", "board review", "exec review" → use
`boardroom`. "ralph loop", "ralph review", "optimization loop" → use `ralph-loop`. "interview
prep", "interview me on" → use `interview`. "customer", "sales call", "pitch it to me" →
use `customer-onboarding`. "debate", "both sides", "pros and cons" → use `debate`. Default
is `learn`.

**Length keywords:** "quick" / "short" → `short` (~5 min). Default → `medium` (~10 min).
"deep dive" / "long" → `long` (~20 min).

---

## Scenarios

| Scenario | HOST_1 role | HOST_2 role | Best for |
|----------|-------------|-------------|----------|
| `learn` | Alex — expert explainer | Jordan — curious beginner | Learning a new concept |
| `boardroom` | Exec presenting strategy | Skeptical board member | Practicing executive defense |
| `ralph-loop` | Ralph — systematic optimizer | Team member being reviewed | Understanding optimization cycles |
| `interview` | Interviewer | Candidate | Interview prep on a topic |
| `customer-onboarding` | CS rep explaining product | New skeptical customer | Learning how to pitch/explain X |
| `debate` | Pro position | Con position | Understanding tradeoffs |

---

## Step 1 — Parse the request

Extract from Michael's message:
- **topic** — what to explain/discuss (required)
- **scenario** — from trigger keywords above (default: `learn`)
- **length** — from length keywords above (default: `medium`)

If topic is unclear, make a reasonable inference from context. Do not ask Michael to
clarify — pick the most likely interpretation and state it in the output.

---

## Step 2 — Generate the podcast script

Write the podcast script directly. Use the system prompt and scenario frame below.

**System rules for every script:**
- All dialogue uses contractions always (it's, you're, we're, can't, that's)
- Natural filler: "basically", "right", "okay so", "I mean", "kind of", "you know"
- Interruptions: write as `HOST_2: [interrupts] Oh wait, so you're saying...`
- Real reactions: "That's wild", "Wait, seriously?", "Oh I had no idea", "No way"
- Concrete examples: name real companies, real products, specific situations
- Analogies: compare complex things to everyday experiences
- "Why does this matter?" addressed in first 60 seconds
- No lists, no bullet explanations — pure conversation
- At least 2 moments where one host builds on a half-finished thought
- Optional dramatic pauses: `[PAUSE_SHORT]` (0.5s) or `[PAUSE_MED]` (1s)

**FORMAT — strict, no deviations:**
```
HOST_1: [dialogue text]
HOST_2: [dialogue text]
[PAUSE_SHORT]
HOST_1: [dialogue text]
```

Only `HOST_1:`, `HOST_2:`, `[PAUSE_SHORT]`, `[PAUSE_MED]` — nothing else.

**Length targets:**
- short: ~700 words of dialogue
- medium: ~1,400 words of dialogue
- long: ~2,800 words of dialogue

**Scenario frames:**

`learn`:
HOST_1 = Alex (expert, uses vivid analogies, enthusiastic but clear).
HOST_2 = Jordan (curious learner, asks exactly what a beginner would ask, has "aha!" moments).
Jordan knows nothing about the topic. Alex breaks it down from first principles. End: Jordan
summarizes the key takeaway in their own words.

`boardroom`:
HOST_1 = executive presenting a strategy or recommendation with conviction.
HOST_2 = skeptical board member probing for weaknesses, demanding data, questioning assumptions.
HOST_1 defends and pivots. Real stakes. End: HOST_2 approves or requests a specific follow-up.

`ralph-loop`:
HOST_1 = Ralph, systematic optimizer obsessed with measurement and iteration.
HOST_2 = team member presenting their work for review.
Ralph asks: what was the goal, how was it measured, what worked, what didn't, what's the next
iteration. Very methodical. Surfaces the core optimization loop explicitly.

`interview`:
HOST_1 = interviewer asking both technical and behavioral questions about the topic.
HOST_2 = candidate giving strong, specific answers.
At least one tough follow-up. At least one moment where the candidate thinks on their feet.

`customer-onboarding`:
HOST_1 = customer success rep explaining value and how to get started.
HOST_2 = new customer with practical questions and some skepticism.
Focus on outcomes, not features. End: customer feels ready to take a first step.

`debate`:
HOST_1 = argues the pro/for position with specific evidence.
HOST_2 = argues the con/against position.
Both engage directly with each other's arguments. Listener understands both sides deeply.
Each closes with their strongest argument.

---

## Step 3 — Write script to disk

After generating the script, write it to:
```
podsplains/<slug>/script.md
```

Where `<slug>` is: `[topic-slugified]-[scenario]-[YYYYMMDD-HHMMSS]`

Add a header block to the file:
```markdown
# PodSplain: [topic]

**Scenario:** [scenario]
**Generated:** [ISO datetime]
**Length target:** [length] (~[N] words)

---

[script body]
```

---

## Step 4 — Generate audio

Run the podsplain audio generator:

```bash
python3 /home/user/accent-os/scripts/podsplain.py \
  --script-file podsplains/<slug>/script.md \
  --output-dir podsplains/<slug> \
  --tts auto
```

The script will:
1. Parse `HOST_1:` / `HOST_2:` lines from the script file
2. Call the TTS API (auto-detects `OPENAI_API_KEY` → `ELEVENLABS_API_KEY`)
3. Concatenate all audio segments + inter-speaker silence into a single WAV
4. Save to `podsplains/<slug>/episode.wav`
5. Update `podsplains/INDEX.md` with the new episode

**If no TTS key is set:** the script will exit with a clear error. Tell Michael which key
to set, and offer to deliver the script file only (skip audio) by ending your response at
Step 3 and reporting the script path.

---

## Step 5 — Report output

After successful generation, output this summary block:

```
podsplain complete
  topic:    [topic]
  scenario: [scenario]
  duration: ~[N]m [S]s
  audio:    podsplains/<slug>/episode.wav
  script:   podsplains/<slug>/script.md
```

If audio generation failed (no TTS key), report:
```
podsplain — script only (no TTS key)
  script:   podsplains/<slug>/script.md
  to gen audio: set OPENAI_API_KEY or ELEVENLABS_API_KEY, then run:
  python3 scripts/podsplain.py --script-file podsplains/<slug>/script.md --output-dir podsplains/<slug>
```

---

## Anti-patterns

- **Never** write bullet-point style dialogue. Podcast hosts don't speak in lists.
- **Never** have both hosts agree on everything — tension and clarification are what make it engaging.
- **Never** skip the "why does this matter" moment — it must appear in the first 60 seconds.
- **Never** use HOST_1/HOST_2 as generic labels in the dialogue text — give them personality.
- **Never** generate audio without checking for a TTS key first — fail clearly, not silently.
- **Never** truncate the script mid-thought — always write a complete episode with a proper close.
- **Do not** ask Michael for more info — pick the best interpretation and go.

---

## Files produced

```
podsplains/
  INDEX.md                         — episode registry (auto-updated)
  <slug>/
    episode.wav                    — final audio file (download + listen)
    script.md                      — full script with metadata header
    meta.json                      — run metadata (topic, scenario, tts backend, duration)
```

## Future iterations (not in V1)

- Role-play mode: Michael as one host, Claude as the other (interactive conversation)
- Custom host names and personalities per project
- Background music/intro jingle
- Chapter markers embedded in WAV metadata
- Multi-topic series linking (episode 1 → episode 2)
- Streaming audio (chunk delivery as it generates)
