# AI Workflow Operating Rules

> A concise operational checklist for heavy AI users running ChatGPT, Claude, and other models across multi-session, multi-project workflows.

---

## Core Principle

**Chat is a workbench, not the system of record.**

Use chat to do thinking. Store results in external artifacts. Never treat a chat thread as a database — it will degrade, and recovery is painful.

---

## Thread Management Rules

- One thread per active project.
- One thread per major build phase within a project.
- One thread per research report or vendor evaluation.
- One thread per document generation task.
- Separate debugging threads from architecture threads — they create context pollution when mixed.
- Do not reuse old threads for new phases. The stale context creates invisible errors.
- When a thread exceeds ~30 exchanges or has been running for more than 60 minutes on a complex task, assess whether it needs a fresh start.

---

## Model Selection Rules

| Task type | Use this |
|---|---|
| Multi-step reasoning, high-stakes decisions | Reasoning model (o1, o3, etc.) |
| Code generation, drafting, research, long docs | Standard flagship model (GPT-4o, Claude Sonnet) |
| Formatting, summarizing, simple transforms | Lighter model (GPT-4o mini, Haiku) |
| Rapid iteration where quality variance is acceptable | Lighter model |
| Anything where an error has significant downstream cost | Flagship or reasoning model |

- Always confirm which model is active in the model picker before starting a session-critical task.
- Reserve reasoning models deliberately — they consume more quota per message.
- If you are near a flagship model cap and the task is low-stakes, switch to a lighter model rather than waiting.

---

## Context Hygiene Rules

- Paste a compressed brief at the start of each new session — do not rely on model memory to reconstruct prior context.
- Every 20–30 exchanges in a long session, ask yourself whether the conversation is getting harder to work with. If yes, stop and compress.
- If the model re-asks a question you already answered, that is context loss — start fresh.
- If the model ignores a constraint you set earlier, that is context degradation — start fresh.
- If outputs are getting shorter or shallower without a limit warning, that is context pressure — start fresh.
- Do not try to fix context degradation inside the conversation. It does not work.

---

## External Memory Rules

Store externally whenever:

- A decision must survive past the current conversation.
- You will resume this task in a future session.
- You are handing off to another AI system.
- The information would take significant time to reconstruct.
- You have spent more than 30 minutes establishing context in the current chat.

Approved storage locations:

- GitHub repo docs, decision logs, changelogs
- Notion pages and databases
- Markdown handoff files
- Build logs and prompt libraries
- Project briefs and compressed context documents

Do not use ChatGPT Memory as a primary persistence layer. It is helpful for preferences, not structured state.

---

## Build Handoff Rules

At the end of any session involving a complex task:

1. Ask the model for a compressed state summary: decisions made, current state, next actions, open questions.
2. Save it to your external doc or handoff file before closing.
3. Commit any code changes to the repo.
4. Write a one-line status to your work-in-progress log.

At the start of the next session:

1. Open a fresh conversation.
2. Paste the compressed brief.
3. Confirm the model before proceeding.

Do not start from "where we left off in chat." Start from the external artifact.

---

## Failure Recovery Rules

| Symptom | Most likely cause | Action |
|---|---|---|
| "You've reached your limit for [model]" | Rolling-window quota | Wait 30–60 min; try a lighter model now |
| Tool button disappeared | Tool-level quota or maintenance | Wait 30–60 min; check Help Center |
| Model auto-switched without warning | Fallback due to cap | Confirm in model picker; decide if acceptable |
| Same mistake repeats | Context degradation | Start fresh with compressed brief |
| Upload fails | File size or file count cap | Try smaller file; wait for reset |
| Slow responses | Large context or platform load | Start fresh; check status.openai.com |
| Response quality dropped | Context degradation or fallback model | Check model picker; start fresh |
| Extended thinking unavailable | Reasoning model cap | Switch to standard model; try again later |

- Always check status.openai.com before spending time debugging a widespread-seeming issue.
- Always check the model picker before assuming a quality or behavior problem is the model's failure.

---

## Weekly Maintenance Checklist

- [ ] Archive completed project threads — do not leave them as "active."
- [ ] Review compressed briefs and handoff files — delete outdated ones; update stale ones.
- [ ] Check OpenAI Help Center for limit changes that affect your workflow.
- [ ] Review prompt library — retire prompts that are no longer relevant.
- [ ] Consolidate any decisions or outputs still living only in chat threads into external docs.
- [ ] Review API usage dashboard if running any programmatic workflows — check for cost spikes or rate-limit patterns.
- [ ] Verify ChatGPT Memory contents are still accurate — clear outdated entries.
