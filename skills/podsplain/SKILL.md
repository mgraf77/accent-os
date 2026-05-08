---
name: podsplain
description: >
  Generate a podcast-style audio learning session (WAV file) on any topic. Two AI hosts
  break down concepts in a natural, engaging conversation — like NotebookLM Audio Overview
  meets targeted scenario framing. Hosts have distinct personalities: one explains, one
  questions/challenges. Output: WAV file + script markdown in podsplains/<slug>/.
  8 scenarios: learn (default), boardroom, ralph-loop, interview, customer-onboarding,
  debate, pitch, postmortem. Use when Michael says: "podsplain [topic]", "make a podcast
  on [X]", "audio explainer for [X]", "podsplain [topic] as [scenario]", "walk me through
  [X] like a podcast", "I want to listen to something on [X]", "pitch mode on [X]",
  "postmortem on [X]". Needs OPENAI_API_KEY or ELEVENLABS_API_KEY for TTS audio generation.
---

# podsplain

**Purpose:** Generate a downloadable WAV podcast episode that teaches Michael a concept,
walks through a scenario, or simulates a high-stakes conversation — all in plain spoken
English he can listen to while driving, cooking, or away from the keyboard.

Inspired by NotebookLM's Audio Overview (two hosts, natural banter, concrete examples)
and structured to hit specific scenario beats. The key mechanic: one host explains, the
other asks exactly what the listener would ask. Output is a real audio file, not a transcript.

---

## Trigger Recognition

- "podsplain [topic]"
- "make a podcast on [X]"
- "audio explainer for [X]"
- "podsplain [topic] as [scenario]"
- "walk me through [X] like a podcast"
- "I want to listen to something on [X]"
- "generate a learning episode on [X]"

**Scenario keywords:**
| If Michael says... | Use scenario |
|--------------------|--------------|
| "boardroom", "board review", "exec review" | `boardroom` |
| "ralph loop", "ralph review", "optimization loop" | `ralph-loop` |
| "interview prep", "interview me on" | `interview` |
| "customer", "sales call", "pitch it to me" | `customer-onboarding` |
| "debate", "both sides", "pros and cons" | `debate` |
| "pitch", "investor", "demo day" | `pitch` |
| "postmortem", "incident review", "what went wrong" | `postmortem` |
| anything else | `learn` |

**Length keywords:** "quick"/"short" → `short` (~5 min). Default → `medium` (~10 min).
"deep dive"/"long" → `long` (~20 min).

---

## Scenarios

| Scenario | HOST_1 | HOST_2 | Best for |
|----------|--------|--------|----------|
| `learn` | Alex — expert explainer, vivid analogies | Jordan — curious beginner | Learning a new concept |
| `boardroom` | Executive presenting with conviction | Skeptical board member | Practicing strategic defense |
| `ralph-loop` | Ralph — systematic optimizer | Team member being reviewed | Understanding optimization cycles |
| `interview` | Interviewer | Candidate | Interview prep on any topic |
| `customer-onboarding` | CS rep | Skeptical new customer | Learning to pitch/explain X |
| `debate` | Pro position | Con position | Understanding deep tradeoffs |
| `pitch` | Founder/PM pitching a solution | Skeptical investor | Practicing pitch clarity |
| `postmortem` | Incident commander (blameless) | Closest team member | Understanding failure modes |

---

## Step 1 — Parse the request

Extract:
- **topic** — what to explain/discuss (required)
- **scenario** — from trigger table above (default: `learn`)
- **length** — from length keywords (default: `medium`)

If topic is ambiguous, pick the most likely interpretation from context and state it.
Do not ask Michael to clarify.

---

## Step 2 — Generate the podcast script

Write the script directly using all rules below.

### Hard rules — all must be followed:

**Voice:**
- Contractions always (it's, you're, we're, can't, that's, I've — never the formal form)
- Natural fillers: "basically", "right", "okay so", "I mean", "you know", "kind of"
- Real reactions: "That's wild", "Wait, seriously?", "Oh I had no idea", "No way", "Huh"

**Cold open (critical):** The first HOST_1 line MUST be a hook or tease — never an intro or welcome.

> ❌ BAD: "Welcome to PodSplain! Today Alex and I are talking about..."
> ✅ GOOD: "Okay so here's the thing that breaks everyone's mental model of how this works."
> ✅ GOOD: "Imagine you're standing in a library with no catalog and you have thirty seconds."

**Content:**
- "Why does this matter?" addressed within the first 60 seconds
- Concrete examples: name real companies, products, people, situations — not vague abstractions
- Analogies: compare complex concepts to everyday things (traffic, cooking, building, sports)
- At least 2 interruptions: `HOST_2: [interrupts] Oh wait, so you're saying...`
- At least 2 moments where one host builds on the other's half-formed thought
- NO bullet lists, no structured explanations — pure spoken conversation

**Story arc (required in every episode):**
- **Setup:** the problem, question, or situation that creates tension
- **Complication:** why it's hard, surprising, or counterintuitive
- **Resolution:** the insight, answer, or decision — not just a summary

**Outro (always end this way):**
```
[PAUSE_MED]
HOST_2: [2-3 sentence plain-English summary of what they learned]
HOST_1: That's a wrap on [topic]. [One memorable one-liner the listener can take away.]
```

**Format (strict — no deviations):**
```
HOST_1: [dialogue]
HOST_2: [dialogue]
[PAUSE_SHORT]
HOST_1: [dialogue]
```

Only `HOST_1:`, `HOST_2:`, `[PAUSE_SHORT]`, `[PAUSE_MED]` — nothing else.

**Length targets:**
| Length | Words | Est. listen time |
|--------|-------|-----------------|
| short | ~700 | ~5 min |
| medium | ~1,400 | ~10 min |
| long | ~2,800 | ~20 min |

### Scenario frames:

**`learn`**
HOST_1 = Alex (expert, enthusiastic but precise, uses vivid analogies, never condescending).
HOST_2 = Jordan (curious beginner who asks exactly what the listener would ask, has "aha!" moments).
Jordan starts knowing nothing. Alex builds from first principles. At least one "Wait, seriously?" moment.
End: Jordan summarises in their own words, Alex delivers one memorable one-liner.

**`boardroom`**
HOST_1 = executive presenting with conviction and data. Opens with the recommendation first, context second.
HOST_2 = skeptical board member who probes for weaknesses, demands specifics, questions every assumption.
HOST_1 defends and adjusts. Real stakes. HOST_2 challenges at least three times.
End: board approves conditionally, or issues one concrete follow-up ask with a deadline.

**`ralph-loop`**
HOST_1 = Ralph — systematic optimizer obsessed with measurement, iteration, and root cause.
HOST_2 = team member presenting their work for review.
Ralph's loop (in order): (1) What was the goal? (2) How was it measured? (3) What actually happened?
(4) Why? (5) What changes next cycle? Ralph is methodical, not mean.
End: explicit next-iteration hypothesis stated by HOST_2 and confirmed by Ralph.

**`interview`**
HOST_1 = interviewer asking both technical and situational questions about the topic.
HOST_2 = candidate giving strong, specific answers backed by real examples.
At least one tough follow-up that forces HOST_2 to think on their feet.
At least one moment where HOST_2 acknowledges uncertainty but handles it gracefully.
End: HOST_1 signals whether the answer landed (positive signal, mixed signal, or redirect).

**`customer-onboarding`**
HOST_1 = CS rep. Opens with the outcome HOST_2 cares about, not features.
HOST_2 = new customer with practical questions and mild skepticism.
HOST_2 raises at least two realistic objections. HOST_1 focuses on value, not specs.
End: HOST_2 names the one thing they'll do first and when.

**`debate`**
HOST_1 argues the pro/for position. HOST_2 argues the con/against position. Both are informed, not cartoons.
Each side opens with their strongest point. They engage directly — no strawmanning.
At least one concession from each side ("That's fair, but...").
End: each gives their single best closing argument. Listener understands both sides fully.

**`pitch`**
HOST_1 = founder or PM pitching the topic as a solution to a real problem.
HOST_2 = skeptical investor or decision-maker evaluating the pitch.
HOST_1 opens with the problem, not the product. "Why now" and "what's the moat" must be addressed.
Investor probes: market size, defensibility, team/credibility, what's been tried before.
End: investor states the one thing that would make or break their decision to go further.

**`postmortem`**
HOST_1 = incident commander running a blameless postmortem (systems focus, not blame).
HOST_2 = team member closest to the failure.
Cover in order: what happened → when → who was affected → impact.
Then: timeline of discovery and response. Then: contributing factors (multiple, not single root cause).
End: three concrete action items with explicit owners and target dates.

---

## Step 3 — Write script to disk

Write to: `podsplains/<slug>/script.md`

Where `<slug>` = `[topic-slugified]-[scenario]-[YYYYMMDD-HHMMSS]`

File header:
```markdown
# PodSplain: [topic]

**Scenario:** [scenario]  
**Generated:** [ISO datetime]  
**Length target:** [length] (~[N] words)

---

[script body]
```

Before calling the Python script, do a quick sanity check: count `HOST_1:` and `HOST_2:` lines.
If total is less than 10, the script likely failed to generate correctly — regenerate before proceeding.

---

## Step 4 — Generate audio

From the project root:

```bash
python3 scripts/podsplain.py \
  --script-file podsplains/<slug>/script.md \
  --output-dir podsplains/<slug> \
  --tts auto
```

**Key flags:**
| Flag | Default | Notes |
|------|---------|-------|
| `--tts` | `auto` | auto-detects OPENAI_API_KEY → ELEVENLABS_API_KEY |
| `--model` | `tts-1-hd` | use `tts-1` for ~half the cost, slightly lower quality |
| `--workers` | `8` | concurrent TTS threads — reduce if rate-limited |
| `--silence-ms` | `350` | ms of silence between speaker turns |
| `--keep-segments` | off | keep per-segment WAV files (useful for debugging) |
| `--dry-run` | off | parse + segment summary only, zero API calls |

**Estimated generation time:**
| Episode | Segments | Workers=8 | Workers=1 (sequential) |
|---------|----------|-----------|----------------------|
| short | ~40 | ~15-30s | ~1-2m |
| medium | ~80 | ~30-60s | ~2-4m |
| long | ~150 | ~60-90s | ~5-8m |

**Resume:** if the run fails mid-way, re-run the exact same command — segment checkpointing
means completed segments are reused from `podsplains/<slug>/segments/` without re-calling the TTS API.

**No TTS key:** script exits with a clear error. End your response after Step 3 and report
the script path. Michael sets the key and re-runs Step 4 manually.

**Standalone (no Claude Code):**
```bash
ANTHROPIC_API_KEY=... OPENAI_API_KEY=... python3 scripts/podsplain.py \
  --topic "SQL indexes" --scenario learn --length medium
```

---

## Step 5 — Report output

```
podsplain complete
  topic:    [topic]
  scenario: [scenario]
  duration: ~[N]m [S]s
  cost:     ~$[X.XX] (OpenAI tts-1-hd)
  audio:    podsplains/<slug>/episode.wav
  script:   podsplains/<slug>/script.md
```

If audio generation failed (no TTS key):
```
podsplain — script only (no TTS key)
  script:   podsplains/<slug>/script.md
  to gen audio: export OPENAI_API_KEY=..., then:
  python3 scripts/podsplain.py --script-file podsplains/<slug>/script.md --output-dir podsplains/<slug>
```

---

## Anti-patterns

- **Never** start with "Welcome to PodSplain" or any host introduction — cold open is law.
- **Never** write bullet-point style dialogue. Podcast hosts don't speak in lists.
- **Never** have both hosts agree on everything — tension and clarification are what make it engaging.
- **Never** skip the "why does this matter" moment — it must appear in the first 60 seconds.
- **Never** generate audio without checking for a TTS key first — fail clearly, not silently.
- **Never** truncate the script mid-thought — always write a complete episode with the required outro.
- **Do not** ask Michael for more info — pick the best interpretation and go.

---

## Good dialogue example (first 4 lines):

```
HOST_1: Okay so here's the thing that genuinely surprised me when I first learned it — you can lose all your data without ever making a mistake.
HOST_2: Wait what? Like, you follow all the rules and it still disappears?
HOST_1: Right. Because the rules everyone learns — back it up, use transactions — those only help if the failure happens in the right place.
HOST_2: [interrupts] Oh no. What's the wrong place?
```

**Bad (never write this):**
```
HOST_1: Today we will discuss database replication. There are three main types.
HOST_2: That is interesting. Please elaborate on each one.
```

---

## Files produced

```
podsplains/
  INDEX.md                         — episode registry (# / date / topic / scenario / duration / file)
  <slug>/
    episode.wav                    — final audio file (download + listen)
    script.md                      — full script with metadata header
    meta.json                      — run metadata (topic, scenario, tts backend/model, duration, cost)
    segments/                      — per-segment WAVs (auto-deleted after assembly unless --keep-segments)
      0000-HOST_1.wav
      0001-HOST_2.wav
      ...
```

---

## Future iterations (not in V1)

- Role-play mode: Michael as HOST_2, Claude as HOST_1 (interactive live session)
- Custom host names and personalities per project
- Background music / intro/outro jingle
- Chapter markers embedded in WAV metadata
- Multi-topic series (episode 1 links to episode 2)
- Streaming delivery (chunk audio as segments complete)
- Voice tuning per scenario (boardroom gets a different HOST_1 voice than learn)
