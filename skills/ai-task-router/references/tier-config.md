# ai-task-router — Account Tier Config

> Michael's confirmed subscription tiers and what they unlock/restrict.
> Loaded at session start. Router applies TC score overrides and feature flags from here.
> Update when plans change — a tier change can meaningfully shift routing recommendations.

---

## How this file is used

At Step 1 session load, for each tool:
1. Read `tier` field → apply `tc_score_override` to replace the registry TC base score
2. Read `locked_features` → if a recommended task depends on a locked feature, note it in the nudge
3. Read `rate_limit_note` → append to nudge when usage is intensive (e.g. batches, long sessions)

---

## ChatGPT
```
tier: Plus  ($20/mo)
tc_score_override: 7   (subscription — zero marginal cost per message up to rate limit)

unlocked:
  - GPT-4o (flagship, 40 messages per 3 hours)
  - o1 (reasoning model, 50 messages per week)
  - o3-mini (fast reasoning, generous limit)
  - DALL-E 3 image generation (limited per day)
  - Web browsing via Bing
  - Code interpreter (sandboxed Python)
  - File uploads + document analysis
  - Custom GPTs + GPT Store
  - Voice mode
  - Memory (persistent across conversations)

locked (Pro at $200/mo only):
  - o3 full (highest reasoning — not available on Plus)
  - o1 Pro
  - 5× rate limits vs Plus
  - Extended thinking / deeper reasoning runs

rate_limit_note: GPT-4o hits 40-message wall per 3hr on heavy sessions — switch to o3-mini for quick tasks when near limit
image_gen_note: DALL-E 3 included but daily cap applies; Canva handles volume image work better
```

---

## Gemini
```
tier: Free
tc_score_override: 10   (free — zero cost, no subscription)

unlocked:
  - Gemini 2.0 Flash (fast, high free quota)
  - Gemini 1.5 Flash (fast, generous free limits)
  - Gemini 1.5 Pro (15 RPM / 1,500 req per day / 1M token context — free)
  - Basic image understanding
  - Google Search grounding (live web, free)
  - Code execution (sandboxed)
  - File uploads (images, PDFs, audio, video)

locked (Advanced / $20/mo):
  - Gemini Advanced (2.0 Pro, higher capability)
  - Priority rate limits
  - Google Workspace deep integration
  - NotebookLM Plus integration
  - 2TB Google One storage

rate_limit_note: 1.5 Pro is 15 RPM on free — for long sessions or batches, use 2.0 Flash instead (faster and higher free quota)
key_advantage: 1M token context window available FREE — best long-context option at zero cost
```

---

## Claude.ai
```
tier: unknown — assumed Pro based on active Claude Code API subscription
tc_score_override: 7   (Pro subscription assumed)

unlocked (Pro assumed):
  - Claude Sonnet 4.6 + Opus 4.7
  - 200K context window
  - 5× usage vs Free
  - Projects (persistent context across conversations)
  - Artifacts (HTML/React previews, SVG, code)
  - Extended thinking (on Opus)
  - File uploads

locked (Team/Enterprise only):
  - Admin controls
  - SSO / SAML
  - Audit logs

action_needed: confirm at claude.ai/settings → Billing
note: if Free tier, brainstorm/cross-check scores drop significantly due to message limits — upgrade to Pro is worth it for the cross-model second-opinion use case
```

---

## Canva
```
tier: Free
tc_score_override: 8   (free, but AI credits are capped monthly)

unlocked:
  - 250,000+ templates
  - Magic Write (limited AI writing credits/month)
  - Magic Design (limited AI design generation credits/month)
  - Text to Image / Magic Media (limited credits)
  - Basic drag-and-drop editor
  - Standard export (PNG, JPG, PDF)
  - Canva AI assistant (chat, limited)

locked (Pro at ~$15/mo):
  - Brand Kit (saved logos, colors, fonts — major gap for Accent Lighting branding)
  - Background Remover
  - Magic Resize (adapt one design to all formats)
  - Unlimited AI generations
  - Premium stock photos + elements
  - Transparent background export
  - Custom templates

impact_note: locked Brand Kit is the biggest gap — Accent Lighting branded assets can't be auto-applied; manual brand work required on Free tier
rate_limit_note: AI credits reset monthly; heavy image-gen batches will exhaust credits — track usage mid-month
design_visual_score_adjustment: -1.5 on design-visual ability due to missing Brand Kit and limited AI credits
image_gen_score_adjustment: -2.0 on image-gen ability due to monthly credit cap
```

---

## Dispatch
```
tier: unknown — not confirmed
tc_score_override: 5   (placeholder — update when plan confirmed)
action_needed: check Dispatch account → Settings → Plan
note: routing decisions involving Dispatch are tentative until tier confirmed
```

---

## Routines
```
tier: unknown — not confirmed
tc_score_override: 5   (placeholder — update when plan confirmed)
action_needed: check Routines account → Settings → Plan
note: routing decisions involving Routines are tentative until tier confirmed
```

---

## OpenAI Codex CLI
```
tier: API-dependent (same OpenAI account as ChatGPT Plus, but API is billed separately)
tc_score_override: 3   (API token charges — separate from Plus subscription)
note: Plus subscription does NOT include free API credits; Codex CLI calls to OpenAI API are billed per token
action_needed: run `printenv OPENAI_API_KEY` to confirm key is configured
if_not_configured: Codex is marked unavailable; code-review cross-check falls back to Claude.ai
```

---

## Claude Code (this session)
```
tier: API (Anthropic API — claude-sonnet-4-6)
tc_score_override: 5   (API token-charged — every session burns tokens)
note: no separate subscription cost on top of API; billed per-token through Anthropic account
```

---

## Tier update procedure

When a plan changes:
1. Update the relevant `tier:` and `tc_score_override:` fields above
2. Update `unlocked:` and `locked:` lists to match new plan
3. Check if any `score_adjustment` notes in tool-registry.md are now outdated
4. Commit: `chore: update tier-config — [tool] upgraded to [tier]`
5. The router will pick up changes at next session start
