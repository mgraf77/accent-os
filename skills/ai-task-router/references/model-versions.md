# ai-task-router — Model Version Tracker

> Tracks current flagship models per tool. Read at session start.
> If `last_checked` is before today's date, Step 7 (daily model check) fires automatically.
> Updated by the router when new releases are detected. Append-only per tool section.

---

## Check metadata
```
last_checked: 2026-05-06
checked_by: initial setup
check_duration_avg: ~45s, ~3K tokens
```

---

## OpenAI / ChatGPT

```
flagship:        GPT-4o  (released 2024-11-20, "gpt-4o-2024-11-20")
fast:            GPT-4o mini  (2024-07-18)
reasoning_tier1: o1  (2024-12-17)
reasoning_tier2: o3-mini  (2025-01-31)
reasoning_tier3: o3  (2025-04-16 — Pro only, NOT available on Plus)
image_gen:       DALL-E 3
check_url:       https://platform.openai.com/docs/models
release_feed:    https://openai.com/news/
plus_tier_flag:  o3 NOT available — route reasoning-heavy tasks to o1 or o3-mini

score_impact_if_new_flagship: re-score ability (+0.5 if > GPT-4o), speed, accuracy rows in tool-registry.md
```

### Changelog
- 2026-05-06: initial entry — GPT-4o flagship, o3 gated to Pro

---

## Google / Gemini

```
flagship_fast:   Gemini 2.0 Flash  (released 2025-02)
flagship_pro:    Gemini 1.5 Pro  (2024-09, 1M context)
experimental:    Gemini 2.5 Pro  (experimental as of 2025-03 — not yet stable free tier)
check_url:       https://ai.google.dev/gemini-api/docs/models
release_feed:    https://blog.google/technology/google-deepmind/
free_tier_flag:  2.5 Pro experimental — available on free but usage may be throttled

score_impact_if_new_flagship: re-score ability across all task types, update context window if changed
```

### Changelog
- 2026-05-06: initial entry — 2.0 Flash as free flagship, 1.5 Pro as long-context workhorse

---

## Anthropic / Claude

```
current_session: claude-sonnet-4-6  (this AccentOS Claude Code session)
latest_opus:     claude-opus-4-7
latest_sonnet:   claude-sonnet-4-6
latest_haiku:    claude-haiku-4-5-20251001
check_url:       https://www.anthropic.com/news
release_feed:    https://www.anthropic.com/news
claude_ai_note:  claude.ai web uses Sonnet/Opus depending on plan; Opus gated to Pro+

score_impact_if_new_flagship: update current_session, re-score Claude Code ability rows
```

### Changelog
- 2026-05-06: initial entry — Claude 4.x family, Sonnet 4.6 active in this session

---

## Canva AI

```
image_gen:       Magic Media (powered by Stable Diffusion + proprietary, updated 2025-Q1)
text_gen:        Magic Write (proprietary, no public versioning)
design_gen:      Magic Design (proprietary)
check_url:       https://www.canva.com/newsroom/
release_feed:    https://www.canva.com/newsroom/
note:            Canva AI features update continuously without versioned releases — check newsroom for major capability announcements

score_impact_if_new_flagship: Canva updates are usually incremental; re-score design-visual and image-gen if a major new model is announced
```

### Changelog
- 2026-05-06: initial entry — Magic Media as image gen backbone

---

## OpenAI Codex CLI

```
cli_version:     0.1.x  (open source, npm @openai/codex)
underlying_model: uses OpenAI API (gpt-4o or o3 depending on task)
check_url:       https://github.com/openai/codex/releases
release_feed:    https://github.com/openai/codex/releases.atom

score_impact_if_new_version: check if underlying model changed; re-score code-review and debug rows
```

### Changelog
- 2026-05-06: initial entry — 0.1.x open-source CLI

---

## How Step 7 uses this file

Step 7 runs WebSearch on each `release_feed` URL above, parses headlines for model release signals, then:

1. Compares found model names/versions against the `flagship` / `current` fields above
2. If match → update the version field + date, log to changelog
3. If new capability detected (new context window, new multimodal feature) → flag the affected dimension(s) in tool-registry.md with a `REVIEW` comment
4. If nothing changed → update `last_checked` date only
5. Commit: `chore: model-versions check [YYYY-MM-DD] — [changed | no changes]`

**What triggers a score re-evaluation (not auto-applied — flagged for review):**
- Flagship model version bump → re-score `ability`, `accuracy`, `speed` rows
- Context window change → re-score `context` row
- New feature unlocked at current tier (e.g. Plus gets o3) → re-score affected task types
- Model deprecated → flag all rows that reference it, prompt tier-config update
