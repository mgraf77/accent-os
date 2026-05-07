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

Loaded at session start via `.claude/CLAUDE.md` AUTO-EXECUTE step 1j. Session-start cost: ~12K tokens (SKILL.md + 5 reference files read once, cached for session). Step 7 (model-update check) fires deferred — never at session start, never mid-tool-loop. Steps 2–5 run as a silent pipeline before every non-pass-through response (~50 token overhead per turn for classification + scoring; nudge only surfaces when gap crosses threshold).

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

1. `skills/ai-task-router/references/tool-registry.md` — base scores per tool per task type
2. `skills/ai-task-router/references/scoring-matrix.md` — dimension weights + threshold rules
3. `skills/ai-task-router/references/task-taxonomy.md` — classification signals
4. `skills/ai-task-router/references/tier-config.md` — Michael's account tiers + TC score overrides
5. `skills/ai-task-router/references/model-versions.md` — current model versions + staleness check

**Apply tier overrides (immediately after reading tier-config.md):**
For each tool, replace the registry's `TC` base score with `tc_score_override` from tier-config.md.
Apply any `score_adjustment` notes (e.g. Canva Free: design-visual -1.5, image-gen -2.0).
Flag tools with `action_needed` as "(tier unconfirmed)" in routing output.

**Staleness check (immediately after reading model-versions.md):**
Compare `last_checked` date against today. If `last_checked` < today → schedule Step 7 to run silently after the first user task completes. No notification at session start. Only notify if Step 7 finds actual changes.

Then probe tool availability (run once, cache for session):

| Tool | Availability check |
|---|---|
| Claude Code | always available (this session) |
| ChatGPT / OpenAI | `printenv OPENAI_API_KEY` — non-empty = available (API); Plus subscription = always assume browser available |
| Gemini | `printenv GEMINI_API_KEY` or `GOOGLE_API_KEY` — non-empty = available (API); free tier = always assume browser available |
| Codex CLI | `which codex` — found = available |
| Claude.ai | always assume browser available |
| Canva AI | assume available if MCP server `31dc75b2` is active |
| Dispatch | assume available if referenced in MASTER.md or BUILD_PLAN_CLAUDE.md |
| Routines | same as Dispatch |

Mark unavailable tools in working memory. They still appear in `/route` tables but are grayed as "(not configured)".

**AccentOS context bonus flag:** Set `ctx_bonus = true` if the working directory is `/home/user/accent-os` AND at least one of these is referenced in the session so far: AccentOS files, Supabase, BigCommerce, vendor_scores, vendor scoring, BUILD_PLAN, M-task IDs. When set, Step 3 applies: Claude Code `ability += 1.5`, `context += 2.0` before computing composite.

---

## Step 2 — Task classification

Before every response, classify the incoming request into one primary task type and optionally one secondary:

| Code | Task type | Primary signals |
|---|---|---|
| `code-build` | Writing/editing code, git ops, file management | "build", "add", "implement", "write code", file paths mentioned; "fix" WITHOUT an error trace |
| `code-review` | Auditing/reviewing existing code | "review", "audit", "check this code", "is this right" |
| `debug` | Diagnosing and fixing runtime/logic bugs | "broken", "error", "not working", "why is X failing"; "fix" WITH an error trace or stack dump |
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

**Pass-through (never classify for routing):** vibe-speak commands, `/route` commands, meta-questions about this skill, CLAUDE.md management, session wrap rituals, responses to a routing nudge ("continue", "yes", "no", "keep going", "ignore that", "just do it here").

---

## Step 3 — Score computation

For each available tool, compute:

```
composite = Σ(dimension_score[d] × weight[task_type][d]) / Σ(weights[task_type])
```

Dimensions: `ability`, `speed`, `accuracy`, `token_cost`, `action`, `context`, `freshness`, `creativity`

**Use effective scores throughout** — not raw base scores. Effective score = base score from tool-registry.md with TC replaced by `tc_score_override` from tier-config.md, plus any `score_adjustment` deltas (e.g. Canva design-visual -1.5).

Weights live in `references/scoring-matrix.md`.

Apply in this exact order:

1. **AccentOS context bonus** (if `ctx_bonus = true`): adjust Claude Code's dimension scores FIRST — `ability += 1.5`, `context += 2.0` (cap at 10). Do this before computing any composite.
2. **Compute composite** for all tools using `Σ(score[d] × weight[d]) / Σ(weights)`.
3. **Switching cost multipliers** (from scoring-matrix.md): add +0.3/+0.2/+0.1 to Claude Code's already-computed composite when applicable. These adjust the composite directly, not dimensions.
4. **Tool availability**: unavailable tools are scored normally but flagged "(not configured)" in output — Michael may still choose to set them up.

Then rank all tools by composite score. Identify:
- `winner`: highest composite
- `claude_score`: Claude Code's composite (after step 1+3 adjustments)
- `gap`: `(winner_score - claude_score) / max(claude_score, 0.1)` ← floor prevents div-by-zero

**Routing decision:**

| `gap` | Action |
|---|---|
| ≤0 (Claude Code wins) | Silent. Proceed with task. |
| 0–0.25 | Silent. Gap too small to justify switching costs. |
| 0.25–0.50 | Surface low-priority nudge (one line). Continue responding. |
| ≥0.50 | Surface stronger nudge with 3-row score summary. Continue responding. |
| Active mode (`/route`) | Always surface full table, regardless of gap. |

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

Tool            Score   Ability  Speed    TC   Action  Context  Fresh  Create
─────────────────────────────────────────────────────────────────────────────
Claude Code      [X.X]    [n]     [n]    [n]    [n]     [n]     [n]    [n]    ← current
[Winner]         [X.X]    [n]     [n]    [n]    [n]     [n]     [n]    [n]    ← best
[#3 tool]        [X.X]    [n]     [n]    [n]    [n]     [n]     [n]    [n]
[#4 tool]        [X.X]    ...
(unavailable tools listed at bottom, grayed)

Recommendation: [Winner] — [one sentence rationale]
Access: [how to open/use winner]
Token note: [only show if winner's effective TC score differs from Claude Code TC by ≥2 pts; skip otherwise]
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

Use **effective TC scores** (post-tier-override from tier-config.md), not raw registry base scores. With current tiers: Gemini=10, Canva=8, ChatGPT=7, Claude.ai=7, Dispatch/Routines=5, Claude Code=5, Codex=3.

The guard prevents recommending a token-charged API call (Codex) for a task Claude Code handles adequately — marginal quality gain doesn't justify the extra API cost.

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

NNN is sequential. Outcome tracking:
- Starts as `pending`
- → `ignored`: Michael's next message is a pass-through response ("continue", "keep going", "no") OR Michael sends any new task without mentioning the suggested tool
- → `accepted`: Michael explicitly names the suggested tool ("opening ChatGPT", "switching to Gemini")
- → `unknown`: session ends without any response to the nudge — leave outcome as `pending`; do not assume accepted
- → `overridden-to:[tool]`: Michael names a third tool other than Claude Code or the winner
Update outcome in routing-log.md at the moment the signal is detected — don't batch.

**Pattern detection:** when ≥3 log entries share the same `task_type` + `suggested_tool` with `outcome: accepted` → surface:
```
→ router: you've routed [task_type] to [tool] 3× — make it your default for this task type? (/route default [task_type] [tool])
```

**`/route default [task_type] [tool]`** appends a line to `skills/ai-task-router/routing-defaults.md` (create if absent):
```
[task_type]: [tool]  # set YYYY-MM-DD
```
Future routing for that task type reads this file first — default tool appears at top of any ranking, with a `← default` marker.

---

## Step 7 — Daily model-update check

Fires when `model-versions.md` `last_checked` < today. Runs after the first task of the session completes — never blocks the session.

### Check sequence (run in ~45 seconds, ~3K tokens)

For each tool in model-versions.md, run one WebSearch targeting its `release_feed`:

```
search queries (run in parallel, substitute current year for YYYY):
  - "OpenAI new model release YYYY" site:openai.com/news
  - "Google Gemini new model release YYYY" site:blog.google
  - "Anthropic Claude new model YYYY" site:anthropic.com/news
  - "Canva AI new features YYYY" site:canva.com
  - "openai/codex release" site:github.com
```

### Parse rules

For each result, look for:
- New model name not in model-versions.md (e.g. "GPT-5", "Gemini 3.0 Flash", "Claude Sonnet 5")
- Capability change at Michael's current tier (e.g. "o3 now available on Plus")
- Model deprecation notice
- Context window expansion
- Major new feature (image gen, file handling, tool use, etc.)

### Update actions

| Finding | Action |
|---|---|
| New model name detected | Update version field in model-versions.md + append changelog entry |
| Same model, no change | Update `last_checked` date only |
| Tier unlock detected (e.g. Plus gets o3) | Update tier-config.md `unlocked:` + flag affected tool-registry.md rows with `# REVIEW [date]` comment |
| Model deprecated | Add deprecation note + flag affected registry rows |
| Capability change (context, speed, accuracy) | Flag affected dimension rows in tool-registry.md with `# REVIEW [date] — [what changed]` |

**`REVIEW` flags are not auto-applied to scores.** They surface as a one-line note at end of session:
```
→ router: [N] score rows flagged for review in tool-registry.md — run `/route review scores` to inspect
```

`/route review scores` shows each flagged row with the change that triggered the flag and a suggested new score. Michael approves each change.

### Commit after check

Only commit when changes were detected:
```
chore: router model-check [YYYY-MM-DD] — N updates: tool1 model-x, tool2 feature-y
```

If no changes: update `last_checked` in model-versions.md only — batch this edit into the session-end doc commit (per CLAUDE.md "batch doc updates into one commit per session end"). Do not create a standalone no-change commit.

### Manual trigger

`/route check models` — runs Step 7 immediately regardless of staleness. Use after a known major release.

### Failure handling

If WebSearch returns no results or network error for a tool → skip that tool, log `check_failed: [tool] [reason]` in model-versions.md, still update `last_checked`. Don't fail the whole check because one source was unreachable.

---

## Override commands

| Command | Action |
|---|---|
| `/route [task description]` | Active mode — full table for the described task |
| `/route off` | Disable passive gate for session |
| `/route on` | Re-enable passive gate |
| `/route log` | Show last 10 entries from routing-log.md |
| `/route scores` | Show full score breakdown for the last-classified task type, all tools |
| `/route scores [tool]` | Show all dimension scores for one tool across all task types |
| `/route tune [dim] [weight] for [task-type]` | Adjust a dimension weight for a task type (session-only) |
| `/route default [task-type] [tool]` | Set preferred tool for a task type |
| `/route status` | Show current passive gate state: on/off, ctx_bonus, tools configured |
| `/route reset` | Clear session-only tuning, restore registry defaults |
| `/route why` | Explain the most recent routing decision (re-surface scores that led to last nudge) |
| `/route check models` | Run Step 7 model-update check immediately |
| `/route review scores` | Show all `# REVIEW`-flagged rows in tool-registry.md with suggested score changes |
| `/route tiers` | Print tier summary (format below) |

### `/route tiers` output format

```
─── router: tool tiers ───
Tool            Tier              TC    Status
Claude Code     API (Sonnet 4.6)   5    ✓ active
ChatGPT         Plus              7    ✓ confirmed
Gemini          Free              10    ✓ confirmed
Claude.ai       unknown/Pro?       7    ⚠ confirm at claude.ai/settings
Canva AI        Free               8    ✓ confirmed (Brand Kit locked)
Dispatch        unknown            5    ⚠ confirm in Dispatch settings
Routines        unknown            5    ⚠ confirm in Routines settings
Codex CLI       API (billed)       3    ? run: printenv OPENAI_API_KEY

⚠ 3 tools need tier confirmation — run /route tiers after updating tier-config.md
```

---

## Anti-patterns

- **Never** auto-switch tools — routing is advisory. Michael decides. The skill only nudges.
- **Never** surface a nudge for vibe-speak commands, `/route` queries, meta-skill management, or session wrap steps — those are AccentOS tooling, not user tasks.
- **Never** surface a nudge when the score gap is <0.25 — always silent regardless of cost. The marginal gain never justifies switching friction at this threshold.
- **Never** surface the passive nudge mid-tool-loop. If Claude Code is already mid-task (multiple tool calls in flight), complete the task. Route on the *next* request, not mid-execution.
- **Never** recommend a tool that failed its availability check without flagging it as "(not configured)" — sending Michael somewhere that won't work wastes more time than any routing gain.
- **Never** apply the AccentOS context bonus to non-AccentOS tasks. If Michael asks "what's the best coffee in Portland," context bonus does not apply.
- **Never** suppress the nudge without logging the suppression. The token-cost guard should be traceable in routing-log.md.
- **Never** re-surface a routing nudge for the same task in the same session if Michael already chose "continue" — one nudge per task per session.
- **Never** include tool pricing specifics (API costs, subscription prices) in the output — these change. Use relative descriptors: "free tier", "token-charged", "subscription-required".
- **Never** route data-analysis tasks away from Claude Code when Supabase hsyjcrrazrzqngwkqsqa is the target — Claude Code + supabase-sql-magic skill already covers this.
- **Never** classify a response to a routing nudge as a new task — "continue", "yes", "no", "keep going", "ignore that" are nudge responses, not routable tasks.
- **Never** fire Step 7 during an active tool-loop — WebSearch calls during a build task will interrupt execution and may corrupt mid-flight state.
- **Never** apply switching cost multipliers to the winner's score — they adjust Claude Code's effective score only, raising the bar to route away.
