---
name: ai-task-router
description: >
  Always-on AI command center for AccentOS sessions — evaluates every incoming Michael task
  against a multidimensional scoring matrix (ability, speed, accuracy, token efficiency,
  action capability, context depth, data freshness, creativity) across all available tools:
  Claude Code, ChatGPT, Gemini, Claude.ai, OpenAI Codex, Canva AI, Dispatch, Routines,
  and more. Passively surfaces a one-line nudge when another tool would score
  ≥25% higher on a given task — silent otherwise. Active query mode (/route [task]) produces
  a full ranked comparison table with per-dimension breakdown and a one-line rationale.
  Token-budget aware: never recommends a pricier tool unless the score gap clears the cost
  hurdle. Hooks into AccentOS vibe-speak Step 23 + CLAUDE.md AUTO-EXECUTE step 1j. Tracks
  routing outcomes across sessions to surface workflow patterns. Applies an AccentOS context
  bonus to Claude Code on tasks where open files, Supabase hsyjcrrazrzqngwkqsqa, BigCommerce
  store-cwqiwcjxes, or vendor scoring data are relevant — making it harder to route away when
  project context is the decisive edge. Use when Michael asks "where should I do X", "best
  tool for", "which AI", "route this", or any question about which AI/tool to use.
---

# ai-task-router

**Purpose:** Pilot + control system for Michael's AI toolkit. Every task has an optimal tool. This skill finds it — silently when Claude Code wins, with a nudge when something else does better, and with a full breakdown on demand.

Not a replacement for Michael's judgment. Advisory only. Michael overrides at will.

---

## Always-on contract

Loaded at session start via `.claude/CLAUDE.md` AUTO-EXECUTE step 1j. Hot-path load: Steps 1–4 + `references/task-taxonomy.md` (~4K tokens). The passive gate (Step 3) runs before every response.

**What "always-on" means in practice:**
- Every incoming request gets a silent task classification (Step 2)
- If Claude Code is the highest-scoring tool → nothing surfaces, session continues
- If another tool wins by ≥25% → one-line nudge appears before Claude Code responds
- If another tool wins by ≥50% → stronger nudge with score summary
- Active query mode always produces a full table, no threshold

**Passive gate is the default.** Active mode requires `/route` or an explicit routing question.

---

## Trigger Recognition

**Passive (every request — fires silently unless threshold met):**
Always active. No explicit trigger needed.

**Active (produces full routing table):**
- "where should I do X" / "where should I ask X"
- "best tool for [task]" / "which AI for [task]"
- "should I use ChatGPT" / "should I use Gemini" / "use Codex?"
- "route this" / "route [task]"
- `/route [task]`
- "which is better here" / "wrong tool?"
- "is Claude Code the right place for this"

**Disable passive gate:**
- `/route off` — disables nudges for the session
- `/route on` — re-enables

---

## Step 1 — Session load

On session start (via AUTO-EXECUTE 1j), read in this order:

1. `skills/ai-task-router/references/tool-registry.md` — tool profiles + base scores per task type
2. `skills/ai-task-router/references/scoring-matrix.md` — dimension weights + threshold rules
3. `skills/ai-task-router/references/task-taxonomy.md` — classification signals

Then probe tool availability (run once, cache for session):

| Tool | Availability check |
|---|---|
| Claude Code | always available (this session) |
| ChatGPT / OpenAI | `printenv OPENAI_API_KEY` — non-empty = available |
| Gemini | `printenv GEMINI_API_KEY` or `GOOGLE_API_KEY` — non-empty = available |
| Codex CLI | `which codex` — found = available |
| Claude.ai | assume available (browser access) |
| Canva AI | assume available if MCP server `31dc75b2` is active |
| Dispatch | assume available if referenced in MASTER.md or BUILD_PLAN_CLAUDE.md |
| Routines | same as Dispatch |

Mark unavailable tools in working memory. They still appear in `/route` tables but are grayed as "(not configured)".

**AccentOS context bonus flag:** Set `ctx_bonus = true` if the working directory is `/home/user/accent-os` AND at least one of these is referenced in the session so far: AccentOS files, Supabase, BigCommerce, vendor_scores, vendor scoring, BUILD_PLAN, M-task IDs. This flag adds +1.5 to Claude Code's composite score in Step 3.

---

## Step 2 — Task classification

Before every response, classify the incoming request into one primary task type and optionally one secondary:

| Code | Task type | Primary signals |
|---|---|---|
| `code-build` | Writing/editing code, git ops, file management | "build", "add", "implement", "fix", "write code", file paths mentioned |
| `code-review` | Auditing/reviewing existing code | "review", "audit", "check this code", "is this right" |
| `debug` | Diagnosing and fixing runtime/logic bugs | "broken", "error", "not working", "why is X failing" |
| `brainstorm` | Ideation, creative exploration, divergent thinking | "ideas", "what if", "brainstorm", "options for", "how might we" |
| `cross-check` | Second opinion, fact-check, alternative view | "double-check", "second opinion", "am I wrong", "confirm", "validate my thinking" |
| `research` | Web synthesis, competitive intel, new tech | "research", "look up", "what's the latest on", "how does X work" |
| `quick-lookup` | Single factual answer, speed-critical | short question, single noun/concept, no code |
| `design-visual` | Mockups, diagrams, UI layouts, graphics | "design", "mockup", "diagram", "wireframe", "visual" |
| `doc-write` | Docs, emails, reports, READMEs | "write", "draft", "email", "memo", "document" |
| `data-analysis` | SQL, data exploration, KPI work | "query", "SQL", "data on", "explore table", "KPI", "numbers" |
| `automation` | Recurring/scheduled tasks, workflows | "automate", "schedule", "every day", "routine", "workflow" |
| `long-context` | Tasks requiring >100K token context | pasting large docs, "analyze this whole file", many files |
| `real-time-data` | Current prices, news, live market | "today", "current", "latest", "right now", stock/market/news |
| `image-gen` | Generate images or graphics | "generate an image", "create a graphic", "logo", "banner" |
| `planning` | Project planning, roadmap, sequencing | "plan", "roadmap", "what order", "how to approach" |

**Multi-type tasks:** pick the primary (highest-signal) type for weighting. Note secondary in output.

**AccentOS specifics boost `code-build` / `data-analysis` / `planning`** when the task references AccentOS modules, Supabase tables, vendor data, or BigCommerce feed — these are Claude Code's strongest domain.

**Pass-through (never classify for routing):** vibe-speak commands, `/route` commands, meta-questions about this skill, CLAUDE.md management, session wrap rituals.

---

## Step 3 — Score computation

For each available tool, compute:

```
composite = Σ(dimension_score[d] × weight[task_type][d]) / Σ(weights[task_type])
```

Dimensions: `ability`, `speed`, `accuracy`, `token_cost`, `action`, `context`, `freshness`, `creativity`

Weights and base scores live in `references/scoring-matrix.md` and `references/tool-registry.md` respectively.

Apply bonuses:
- **AccentOS context bonus** (`ctx_bonus = true`): Claude Code `ability += 1.5`, `context += 2.0`
- **Tool availability penalty**: unavailable tool scores are shown as-is but flagged — Michael may still choose to set it up

Then rank all tools by composite score. Identify:
- `winner`: highest composite
- `claude_score`: Claude Code's composite
- `gap`: `(winner_score - claude_score) / claude_score`

**Routing decision:**

| `gap` | Action |
|---|---|
| ≤0 (Claude Code wins) | Silent. Proceed with task. |
| 0–0.25 | Silent. Gap too small to justify switching costs. |
| 0.25–0.50 | Surface low-priority nudge (one line). Continue responding. |
| ≥0.50 | Surface stronger nudge with 3-row score summary. Continue responding. |
| Active mode (`/route`) | Always surface full table, regardless of gap. |

**Token cost hurdle:** before surfacing any nudge, check token-cost delta. If the winner's `token_cost` score is ≤3 points lower than Claude Code's AND the gap is <0.40 → suppress nudge (not worth the cost). Log suppression to routing-log.

---

## Step 4 — Surfacing format

### Passive nudge (low-priority, gap 0.25–0.50):
```
→ router: [task_type] — [Winner] scores ~[X%] higher here. Open it or keep going?
```

### Passive nudge (strong, gap ≥0.50):
```
═══ ROUTER NUDGE ═══
Task: [task_type]
[Winner] ([score]) vs Claude Code ([score]) — [gap]% gap

  [Winner]: [one-sentence why it wins]
  Trade-off: [one-sentence cost/access note]

Keep here: just reply "continue"  |  Switch: [how to access winner]
════════════════════
```

### Active query (`/route [task]`):
```
═══ TASK ROUTER ═══
Task: [task_type]  (secondary: [type if any])
AccentOS context bonus: [applied / not applied — why]
Available tools: [N of M configured]

Tool            Score   Ability  Speed   Cost  Action  Context  Fresh  Create
─────────────────────────────────────────────────────────────────────────────
Claude Code      [X.X]    [n]     [n]    [n]    [n]     [n]     [n]    [n]    ← current
[Winner]         [X.X]    [n]     [n]    [n]    [n]     [n]     [n]    [n]    ← best
[#3 tool]        [X.X]    [n]     [n]    [n]    [n]     [n]     [n]    [n]
[#4 tool]        [X.X]    ...
(unavailable tools listed at bottom, grayed)

Recommendation: [Winner] — [one sentence rationale]
Access: [how to open/use winner]
Token note: [cost implication if relevant]
═══════════════════
```

Scores shown to 1 decimal place. Mark winner with `←` arrow. Mark current tool. Keep table ≤10 tools.

---

## Step 5 — Token budget guard

Before recommending any tool switch, estimate the relative token cost:

| Winner token_cost score | Claude Code token_cost score | Δ | Action |
|---|---|---|---|
| ≥7 (cheap/free) | any | — | Recommend freely |
| 4–6 (moderate) | ≥6 (also moderate) | ≤2 | Recommend, note similarity |
| 4–6 (moderate) | <4 (expensive) | negative | Flag: "Claude Code may cost more here — winner saves tokens" |
| ≤3 (expensive) | any | — | Include explicit cost warning in nudge |
| ≤3 AND gap < 0.40 | — | — | Suppress nudge (cost not worth it) |

Token cost score values from `references/tool-registry.md`: 10 = free tier or minimal tokens, 1 = high per-call API cost.

The guard prevents recommending a paid Anthropic/OpenAI API call for a task Claude Code handles adequately at the same cost tier.

---

## Step 6 — Outcome logging

Append to `skills/ai-task-router/routing-log.md` after any nudge fires (passive or active):

```
### route-NNN — YYYY-MM-DD — [task_type]
- suggested_tool: [Winner]
- claude_score: [X.X]
- winner_score: [X.X]
- gap: [X%]
- ctx_bonus: [yes/no]
- mode: [passive-low | passive-strong | active]
- outcome: [pending | accepted | ignored | overridden-to:[tool]]
- notes: [one line if anything unusual]
```

NNN is sequential. Outcome starts as `pending`; if Michael says "continue" or proceeds without switching → update to `ignored`. If Michael opens the suggested tool → `accepted`. If Michael names a different tool → `overridden-to:[tool]`.

**Pattern detection:** when ≥3 log entries share the same `task_type` + `suggested_tool` with `outcome: accepted` → surface:
```
→ router: you've routed [task_type] to [tool] 3× — make it your default for this task type? (/route default [task_type] [tool])
```

**`/route default [task_type] [tool]`** writes a default override entry to `routing-log.md`. Future routing for that task type shows the default tool first.

---

## Override commands

| Command | Action |
|---|---|
| `/route [task description]` | Active mode — full table for the described task |
| `/route off` | Disable passive gate for session |
| `/route on` | Re-enable passive gate |
| `/route log` | Show last 10 entries from routing-log.md |
| `/route scores` | Show full score breakdown for current task type, all tools |
| `/route scores [tool]` | Show all dimension scores for one tool across all task types |
| `/route tune [dim] [weight] for [task-type]` | Adjust a dimension weight for a task type (session-only) |
| `/route default [task-type] [tool]` | Set preferred tool for a task type |
| `/route status` | Show current passive gate state: on/off, ctx_bonus, tools configured |
| `/route reset` | Clear session-only tuning, restore registry defaults |
| `/route why` | Explain the most recent routing decision (re-surface scores that led to last nudge) |

---

## Anti-patterns

- **Never** auto-switch tools — routing is advisory. Michael decides. The skill only nudges.
- **Never** surface a nudge for vibe-speak commands, `/route` queries, meta-skill management, or session wrap steps — those are AccentOS tooling, not user tasks.
- **Never** recommend a pricier tool when the score gap is <0.25 and token-cost delta is unfavorable. The marginal gain doesn't justify the friction.
- **Never** surface the passive nudge mid-tool-loop. If Claude Code is already mid-task (multiple tool calls in flight), complete the task. Route on the *next* request, not mid-execution.
- **Never** recommend a tool that failed its availability check without flagging it as "(not configured)" — sending Michael somewhere that won't work wastes more time than any routing gain.
- **Never** apply the AccentOS context bonus to non-AccentOS tasks. If Michael asks "what's the best coffee in Portland," context bonus does not apply.
- **Never** suppress the nudge without logging the suppression. The token-cost guard should be traceable in routing-log.md.
- **Never** re-surface a routing nudge for the same task in the same session if Michael already chose "continue" — one nudge per task per session.
- **Never** include tool pricing specifics (API costs, subscription prices) in the output — these change. Use relative descriptors: "free tier", "token-charged", "subscription-required".
- **Never** route data-analysis tasks away from Claude Code when Supabase hsyjcrrazrzqngwkqsqa is the target — Claude Code + supabase-sql-magic skill already covers this.
