# AccentOS AI Routing Rules
> Last updated: 2026-05-08 | Used by AEOS AI Router

## Model Selection Matrix

| Task Type | Primary AI | Rationale |
|---|---|---|
| Architecture / Systems Design | Claude | Deep reasoning, long context, safety-first |
| Implementation / Code (low risk) | Codex | Fast, pattern-driven code gen |
| Bug Fix (low risk) | Codex → Claude | Codex for speed; escalate complex/prod bugs to Claude |
| Business Analysis / Strategy | ChatGPT | Narrative synthesis, business reasoning |
| Content / Copywriting | ChatGPT | Tone, persuasion, marketing fluency |
| Data Analysis | Claude | Structured output, data reasoning |
| Automation / Workflow (n8n/Make) | Codex | Blueprint generation, scripting |
| Database / Schema | Claude | SQL safety, RLS policy design |
| Google Ecosystem (GA4, GMC, GCP) | Gemini | Native Google API knowledge |
| High Operational Risk (any type) | Claude + Human Review | Caution, reversibility |

## Escalation Triggers
- Operational risk = high/critical → always Claude + human approval
- Repo risk = high → always Claude + human approval
- Involves live production data → human approval required
- Involves schema DROP or DELETE → rollback plan mandatory, human approval required
- Complexity = critical → Claude + scope document before starting

## AccentOS-Specific Rules
- Use `claude-sonnet-4-6` for all in-app AI features
- Never hardcode model IDs in multiple places — consolidate to a constant if reused
- Worker proxy at `https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages`
- All AI calls check `!r.ok` before parsing response (return early on API errors)
- System prompts for AI features live inline in the function that calls them

## Handoff Standards
Every AI handoff must include:
1. Objective — what exactly needs to be done
2. Business Context — why it matters to Accent Lighting operations
3. Technical Context — stack, patterns, constraints
4. Repo + Files — where to work
5. Acceptance Criteria — when is it done
6. Quality Gates — what to verify
7. Rollback Plan — how to undo
8. Required Output — what to deliver

## Session Protocol
1. Read WORK_IN_PROGRESS.md FIRST — complete any orphaned task before new work
2. Log incoming prompt to PROMPT_LOG.md
3. Read BUILD_PLAN_CLAUDE.md — work top-to-bottom, skip items with unresolved BLOCKS
4. Apply all BUILD_INTELLIGENCE.md lessons
5. WIP checkpoint after every discrete step
6. Batch doc updates (SESSION_LOG, BUILD_PLAN checkoffs, MASTER.md) into one end-of-session commit
