# ai-task-router — Tool Registry

> Base scores for each tool across 8 dimensions and 15 task types.
> Loaded at session start (hot path). ~4K tokens.
> Update this file when tools gain/lose capabilities or Michael's toolkit changes.

---

## Dimension key

| Dim | Label | 10 means | 1 means |
|---|---|---|---|
| **AB** | Ability | Best-in-class for this task type | Cannot do this task |
| **SP** | Speed | Sub-second response | Minutes per response |
| **AC** | Accuracy | Near-perfect factual/technical correctness | Frequent errors |
| **TC** | Token cost | Free / minimal cost | High per-call API cost |
| **AX** | Action capability | Full file edit, git, bash, DB access | Read-only or zero |
| **CX** | Context depth | >500K token window + strong retention | <8K or no memory |
| **FR** | Data freshness | Live web / real-time | Training cutoff only |
| **CR** | Creativity | Divergent ideation, novel combinations | Deterministic/literal |

---

## Tool profiles

### Claude Code (this session)
- **Access:** current session — always available
- **Cost class:** token-charged (Anthropic API, Sonnet 4.6 default)
- **Context window:** 200K tokens
- **Action capability:** FULL — file edit, git, bash, MCP servers, Supabase, BigCommerce API
- **Freshness:** training cutoff (web search via WebSearch tool when needed)
- **AccentOS bonus:** +1.5 AB, +2.0 CX when ctx_bonus = true (project files, vendor data, Supabase open)

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 9.5 | 7 | 9 | 6 | 10 | 8 | 4 | 6 |
| code-review | 8.5 | 7 | 9 | 6 | 9 | 8 | 4 | 5 |
| debug | 9 | 7 | 9 | 6 | 10 | 8 | 4 | 5 |
| brainstorm | 7 | 7 | 8 | 6 | 5 | 8 | 4 | 7 |
| cross-check | 7 | 7 | 8 | 6 | 5 | 8 | 4 | 6 |
| research | 6 | 6 | 7 | 6 | 4 | 7 | 4 | 6 |
| quick-lookup | 7 | 7 | 8 | 6 | 3 | 6 | 4 | 5 |
| design-visual | 4 | 6 | 6 | 6 | 3 | 6 | 4 | 6 |
| doc-write | 8 | 7 | 8 | 6 | 6 | 8 | 4 | 7 |
| data-analysis | 9 | 7 | 9 | 6 | 10 | 9 | 4 | 6 |
| automation | 7 | 6 | 8 | 6 | 9 | 8 | 4 | 5 |
| long-context | 8 | 6 | 8 | 6 | 9 | 8 | 4 | 6 |
| real-time-data | 4 | 7 | 5 | 6 | 4 | 6 | 2 | 4 |
| image-gen | 1 | 5 | 3 | 6 | 2 | 4 | 3 | 4 |
| planning | 8 | 7 | 8 | 6 | 8 | 9 | 4 | 7 |

---

### ChatGPT (GPT-4o / o3)
- **Access:** chatgpt.com or via OPENAI_API_KEY env var
- **Cost class:** subscription + token-charged API
- **Context window:** 128K tokens (GPT-4o), 200K (o3)
- **Action capability:** code interpreter (sandboxed), DALL-E image gen, browsing, voice — no file system access
- **Freshness:** live web browsing via search tool
- **Best for:** brainstorm, cross-check, image-gen, doc-write, research, cross-model second opinion

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 7 | 7 | 8 | 4 | 2 | 6 | 6 | 7 |
| code-review | 7.5 | 7 | 8 | 4 | 2 | 6 | 6 | 6 |
| debug | 7 | 7 | 8 | 4 | 2 | 6 | 6 | 6 |
| brainstorm | 9.5 | 8 | 8 | 4 | 2 | 6 | 7 | 9.5 |
| cross-check | 9 | 8 | 8 | 4 | 2 | 6 | 7 | 8 |
| research | 8.5 | 7 | 8 | 4 | 2 | 6 | 8 | 7 |
| quick-lookup | 8 | 8 | 8 | 5 | 1 | 5 | 8 | 6 |
| design-visual | 7 | 7 | 7 | 4 | 2 | 5 | 6 | 8 |
| doc-write | 9 | 8 | 8 | 4 | 2 | 6 | 7 | 8.5 |
| data-analysis | 7 | 7 | 7 | 4 | 3 | 6 | 6 | 6 |
| automation | 4 | 7 | 6 | 4 | 2 | 5 | 6 | 5 |
| long-context | 6 | 6 | 7 | 3 | 2 | 6 | 6 | 6 |
| real-time-data | 8 | 8 | 8 | 4 | 1 | 5 | 9 | 6 |
| image-gen | 9 | 7 | 8 | 4 | 1 | 3 | 7 | 9 |
| planning | 8 | 8 | 8 | 4 | 2 | 6 | 7 | 8 |

---

### Gemini (2.0 Flash / 1.5 Pro)
- **Access:** gemini.google.com or via GEMINI_API_KEY / GOOGLE_API_KEY
- **Cost class:** free tier available (Flash), token-charged for Pro
- **Context window:** 1M tokens (Pro), 128K (Flash) — industry-best for long docs
- **Action capability:** minimal — code execution sandboxed, no file system
- **Freshness:** Google Search integration, near real-time
- **Best for:** quick-lookup (speed + free), long-context ingestion, real-time-data, research

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 6 | 9 | 7 | 8 | 1 | 9 | 7 | 6 |
| code-review | 6 | 9 | 7 | 8 | 1 | 9 | 7 | 5 |
| debug | 5.5 | 9 | 7 | 8 | 1 | 9 | 7 | 5 |
| brainstorm | 7 | 9 | 7 | 8 | 1 | 8 | 8 | 7.5 |
| cross-check | 7 | 9 | 7 | 8 | 1 | 8 | 8 | 6 |
| research | 8 | 9 | 8 | 8 | 1 | 9 | 9 | 6 |
| quick-lookup | 9 | 10 | 8 | 9 | 1 | 7 | 9 | 5 |
| design-visual | 4 | 8 | 6 | 8 | 1 | 8 | 7 | 6 |
| doc-write | 7 | 9 | 7 | 8 | 1 | 8 | 7 | 7 |
| data-analysis | 6 | 8 | 7 | 8 | 2 | 9 | 7 | 5 |
| automation | 3 | 8 | 5 | 8 | 1 | 8 | 7 | 4 |
| long-context | 9.5 | 7 | 8 | 7 | 1 | 10 | 7 | 6 |
| real-time-data | 9 | 9 | 8 | 9 | 1 | 8 | 10 | 5 |
| image-gen | 5 | 8 | 6 | 7 | 1 | 4 | 7 | 6 |
| planning | 6 | 9 | 7 | 8 | 1 | 9 | 7 | 6 |

---

### OpenAI Codex
- **Access:** `codex` CLI (npm i -g @openai/codex) or OPENAI_API_KEY
- **Cost class:** token-charged (OpenAI API)
- **Context window:** 200K tokens
- **Action capability:** code execution in sandbox, limited file access via CLI
- **Freshness:** training cutoff only
- **Best for:** code-review (cross-model audit), debug (second opinion), code-build (supplemental)

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 8.5 | 7 | 9 | 4 | 5 | 7 | 4 | 5 |
| code-review | 9.5 | 7 | 9.5 | 4 | 5 | 8 | 4 | 5 |
| debug | 9 | 7 | 9 | 4 | 5 | 8 | 4 | 5 |
| brainstorm | 3 | 7 | 6 | 4 | 1 | 6 | 4 | 4 |
| cross-check | 8 | 7 | 9 | 4 | 1 | 7 | 4 | 4 |
| research | 3 | 6 | 6 | 4 | 1 | 6 | 4 | 4 |
| quick-lookup | 5 | 7 | 7 | 4 | 1 | 5 | 4 | 3 |
| design-visual | 2 | 5 | 4 | 4 | 1 | 4 | 3 | 3 |
| doc-write | 4 | 6 | 6 | 4 | 2 | 6 | 4 | 4 |
| data-analysis | 7 | 7 | 8 | 4 | 4 | 7 | 4 | 4 |
| automation | 5 | 6 | 7 | 4 | 4 | 6 | 4 | 4 |
| long-context | 7 | 6 | 8 | 3 | 4 | 7 | 4 | 4 |
| real-time-data | 2 | 6 | 4 | 4 | 1 | 5 | 2 | 3 |
| image-gen | 1 | 4 | 2 | 4 | 1 | 2 | 2 | 2 |
| planning | 5 | 6 | 7 | 4 | 3 | 6 | 4 | 5 |

---

### Claude.ai (web — cowork / canvas)
- **Access:** claude.ai in browser — no CLI
- **Cost class:** subscription (Pro plan)
- **Context window:** 200K tokens
- **Action capability:** NONE — no file system, no git, no DB; artifacts (HTML/React previews)
- **Freshness:** web search tool available
- **Best for:** brainstorm (fresh Claude instance), cross-check, document drafting, design artifacts

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 4 | 7 | 8 | 7 | 1 | 7 | 5 | 7 |
| code-review | 6 | 7 | 8 | 7 | 1 | 7 | 5 | 5 |
| debug | 5 | 7 | 7 | 7 | 1 | 7 | 5 | 5 |
| brainstorm | 9.5 | 8 | 9 | 7 | 1 | 8 | 6 | 9.5 |
| cross-check | 9 | 8 | 9 | 7 | 1 | 8 | 6 | 8 |
| research | 7 | 7 | 8 | 7 | 1 | 7 | 6 | 7 |
| quick-lookup | 8 | 8 | 9 | 7 | 1 | 6 | 6 | 6 |
| design-visual | 8 | 7 | 8 | 7 | 2 | 7 | 5 | 8.5 |
| doc-write | 9.5 | 8 | 9 | 7 | 1 | 8 | 6 | 9 |
| data-analysis | 4 | 7 | 7 | 7 | 1 | 7 | 5 | 5 |
| automation | 2 | 6 | 5 | 7 | 1 | 6 | 5 | 4 |
| long-context | 8 | 6 | 8 | 6 | 1 | 8 | 5 | 7 |
| real-time-data | 4 | 7 | 6 | 7 | 1 | 6 | 6 | 5 |
| image-gen | 3 | 6 | 5 | 7 | 1 | 4 | 5 | 7 |
| planning | 8.5 | 8 | 9 | 7 | 1 | 8 | 6 | 8.5 |

---

### Canva AI (via MCP `31dc75b2`)
- **Access:** Canva MCP server (active in this session)
- **Cost class:** subscription
- **Context window:** N/A — design-focused, not conversational
- **Action capability:** generate, edit, export designs — no code
- **Freshness:** N/A
- **Best for:** design-visual, image-gen, branded content, presentations

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 1 | 5 | 2 | 6 | 1 | 1 | 3 | 2 |
| code-review | 1 | 5 | 1 | 6 | 1 | 1 | 3 | 2 |
| debug | 1 | 5 | 1 | 6 | 1 | 1 | 3 | 2 |
| brainstorm | 4 | 6 | 4 | 6 | 1 | 3 | 4 | 7 |
| cross-check | 2 | 5 | 3 | 6 | 1 | 2 | 3 | 4 |
| research | 2 | 5 | 3 | 6 | 1 | 2 | 4 | 3 |
| quick-lookup | 2 | 6 | 3 | 6 | 1 | 2 | 4 | 3 |
| design-visual | 10 | 7 | 8 | 6 | 8 | 3 | 6 | 9 |
| doc-write | 6 | 6 | 6 | 6 | 5 | 3 | 4 | 7 |
| data-analysis | 1 | 4 | 2 | 6 | 1 | 1 | 3 | 2 |
| automation | 2 | 5 | 3 | 6 | 2 | 2 | 4 | 3 |
| long-context | 1 | 4 | 2 | 5 | 1 | 1 | 3 | 2 |
| real-time-data | 1 | 5 | 2 | 6 | 1 | 1 | 4 | 2 |
| image-gen | 9 | 7 | 7 | 6 | 7 | 2 | 5 | 9 |
| planning | 3 | 5 | 4 | 6 | 2 | 3 | 4 | 6 |

---

### Dispatch
- **Access:** Dispatch app (see MASTER.md for configuration)
- **Cost class:** subscription
- **Context window:** task-level only
- **Action capability:** task delegation, workflow triggers, external service routing
- **Freshness:** live (event-driven)
- **Best for:** automation (one-shot delegation), routing tasks to humans or services

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 3 | 7 | 4 | 6 | 4 | 2 | 6 | 3 |
| code-review | 2 | 7 | 3 | 6 | 3 | 2 | 5 | 2 |
| debug | 2 | 7 | 3 | 6 | 3 | 2 | 5 | 2 |
| brainstorm | 3 | 7 | 4 | 6 | 2 | 2 | 5 | 4 |
| cross-check | 3 | 7 | 4 | 6 | 2 | 2 | 6 | 3 |
| research | 3 | 7 | 4 | 6 | 3 | 2 | 6 | 3 |
| quick-lookup | 3 | 8 | 4 | 7 | 2 | 2 | 6 | 3 |
| design-visual | 2 | 6 | 3 | 6 | 2 | 2 | 5 | 3 |
| doc-write | 3 | 7 | 4 | 6 | 3 | 2 | 5 | 4 |
| data-analysis | 4 | 7 | 5 | 6 | 4 | 3 | 6 | 3 |
| automation | 9 | 8 | 8 | 7 | 8 | 3 | 8 | 5 |
| long-context | 2 | 6 | 3 | 5 | 2 | 2 | 5 | 2 |
| real-time-data | 5 | 8 | 6 | 7 | 5 | 2 | 8 | 3 |
| image-gen | 2 | 6 | 3 | 6 | 2 | 1 | 5 | 3 |
| planning | 5 | 7 | 6 | 6 | 4 | 3 | 6 | 5 |

---

### Routines
- **Access:** Routines app (see MASTER.md for configuration)
- **Cost class:** subscription
- **Context window:** task-level only
- **Action capability:** scheduled automation, recurring triggers, multi-step sequences
- **Freshness:** live (schedule-driven)
- **Best for:** automation (recurring), scheduled tasks, time-based workflows

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 2 | 6 | 3 | 6 | 3 | 2 | 5 | 2 |
| code-review | 2 | 6 | 3 | 6 | 2 | 2 | 5 | 2 |
| debug | 2 | 6 | 3 | 6 | 2 | 2 | 5 | 2 |
| brainstorm | 2 | 6 | 3 | 6 | 1 | 2 | 5 | 3 |
| cross-check | 2 | 6 | 3 | 6 | 1 | 2 | 5 | 2 |
| research | 2 | 6 | 3 | 6 | 2 | 2 | 6 | 2 |
| quick-lookup | 2 | 7 | 3 | 7 | 1 | 2 | 6 | 2 |
| design-visual | 2 | 5 | 2 | 6 | 2 | 2 | 5 | 3 |
| doc-write | 2 | 6 | 3 | 6 | 2 | 2 | 5 | 3 |
| data-analysis | 3 | 7 | 5 | 6 | 3 | 3 | 6 | 2 |
| automation | 9.5 | 8 | 8 | 7 | 9 | 3 | 8 | 4 |
| long-context | 2 | 5 | 3 | 5 | 2 | 2 | 5 | 2 |
| real-time-data | 4 | 8 | 5 | 7 | 4 | 2 | 8 | 2 |
| image-gen | 2 | 5 | 2 | 6 | 2 | 1 | 5 | 2 |
| planning | 4 | 6 | 5 | 6 | 4 | 3 | 6 | 4 |

---

## How to update this registry

When a tool gains new capabilities (e.g. Gemini gets file system access, Claude Code gets image generation), update the relevant score cells and add a changelog note below.

### Changelog
- 2026-05-06: initial registry — 9 tools × 15 task types × 8 dimensions
