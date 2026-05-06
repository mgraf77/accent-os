# ai-task-router — Task Taxonomy

> Classification signals for 15 task types + exclusion zones + multi-type rules.
> Loaded at session start (hot path). ~2K tokens.

---

## Classification approach

1. Scan incoming message for trigger signals (keywords, patterns, intent markers)
2. Score each task type: tally matched signals
3. Primary type = highest score; secondary = second-highest if ≥2 signals match
4. Apply exclusion zones — some tasks never route away from Claude Code regardless of scores

**Minimum signal count to classify:** 1 strong signal OR 2 weak signals. Single-word prompts ("resume", "go", "continue") → classify as continuation of prior task type.

---

## Task type signal tables

### `code-build`
Strong signals: "build", "implement", "add feature", "create a", "write the code", "make X work", file path + edit intent, "refactor", "migrate"
Weak signals: "update", "change", "modify", "add to", code block in message
AccentOS boosts: reference to BUILD_PLAN M-task, AccentOS module name, Supabase table edit intent
"fix" disambiguation: "fix [file/feature]" with NO error trace → code-build. "fix" WITH stack trace or error message → debug.

### `code-review`
Strong signals: "review", "audit the code", "check this code", "is this right", "what do you think of this code"
Weak signals: pasting code without clear build intent, "look over", "any issues with"
AccentOS boosts: "review the skill", "review the commit", "review this SKILL.md"

### `debug`
Strong signals: "broken", "not working", "error:", "exception", "it crashed", "why is X failing", "bug in", stack trace pasted in message
Weak signals: "weird behavior", "unexpected", "something off"
Note: stack trace present → always debug, highest priority, overrides all other signals.

### `brainstorm`
Strong signals: "ideas for", "brainstorm", "what if", "how might we", "options for", "explore", "generate ideas", "blue-sky"
Weak signals: "thoughts on", "possibilities", "alternatives to", "what could we do about"
Note: ChatGPT and Claude.ai score highest here — cross-model ideation yields more diverse options

### `cross-check`
Strong signals: "second opinion", "double-check", "am I wrong about", "confirm my thinking", "is this accurate", "validate"
Weak signals: "does this make sense", "any red flags", "sanity check"
Note: strong candidate for ChatGPT or Claude.ai — different model = genuine independent view

### `research`
Strong signals: "research", "look up", "what's the latest on", "how does X work" (general concept, not AccentOS-specific), "competitive", "market"
Weak signals: "I've heard", "apparently", "is it true that", "what do people say about"
Note: Gemini (Google Search integration) is strongest for research with live citations

### `quick-lookup`
Strong signals: short message (≤15 words), single concept/question, factual query, "what is X", "when did", "who is", "define"
Weak signals: no code, no file reference, no build intent
Note: Gemini Flash is fastest + cheapest for pure factual lookups with no AccentOS context

### `design-visual`
Strong signals: "design", "mockup", "wireframe", "diagram", "UI for", "layout", "visual", "poster", "banner", "infographic"
Weak signals: "how it should look", "sketch out", "rough layout"
Note: Canva AI (MCP) wins for branded design; Claude.ai wins for artifact-style UI mockups

### `doc-write`
Strong signals: "write", "draft", "email to", "memo", "README", "document", "report on", "summarize for"
Weak signals: "put together", "format this as", "turn this into a doc"
Note: distinguish from code-build (file write = build; prose write = doc-write)

### `data-analysis`
Strong signals: "SQL for", "query the DB", "data on", "KPI", "metrics for", "explore table", "how many", "revenue", "show me vendors"
Weak signals: "numbers", "stats", "count", "how much"
AccentOS boosts: reference to Supabase hsyjcrrazrzqngwkqsqa, vendor_scores, kpi_snapshots, any AccentOS table name
Note: NEVER route away from Claude Code when AccentOS Supabase is the target — supabase-sql-magic skill covers this

### `automation`
Strong signals: "automate", "schedule", "every day", "run nightly", "trigger when", "set up a routine", "recurring"
Weak signals: "whenever X happens", "make it run automatically"
Note: Dispatch wins for one-shot delegation; Routines wins for recurring/scheduled

### `long-context`
Strong signals: pasting content >10K tokens, "analyze this whole file", "read all of", multiple large files in message
Weak signals: "the entire", "all the pages", "full document"
Note: Gemini Pro (1M token window) wins here unless AccentOS context bonus applies

### `real-time-data`
Strong signals: "current price", "latest news", "right now", "as of today", "live data", "this week's numbers", stock tickers, "has X happened yet"
Weak signals: "recent", "latest", "new" (these are weak — don't classify as real-time without corroborating signals)
"today" disambiguation: "today" in scheduling/planning context ("what should I work on today", "today's tasks") → planning, NOT real-time-data. "today" in news/price/data context ("what's the bitcoin price today") → real-time-data. Disambiguate by what noun follows "today".
Note: Gemini is strongest for real-time data via Google Search integration

### `image-gen`
Strong signals: "generate an image", "create a graphic", "make a logo", "draw", "visualize", "render"
Weak signals: "picture of", "photo of", "illustration"
Note: ChatGPT (DALL-E 3) and Canva AI split this depending on brand vs. creative intent

### `planning`
Strong signals: "plan", "roadmap", "what order should I", "how to approach", "sequence", "next steps", "strategy for"
Weak signals: "where do I start", "how would you structure", "milestones"
AccentOS boosts: BUILD_PLAN reference, M-task sequencing, track planning

---

## Exclusion zones

Tasks that **never route away from Claude Code**, regardless of scores:

| Exclusion | Reason |
|---|---|
| Any response to a routing nudge ("continue", "yes", "no", "keep going", "ignore that") | Not a task — it's a nudge response. Pass-through silently. |
| Any task referencing open AccentOS files by path | Context is already loaded — switching loses it |
| `data-analysis` against Supabase hsyjcrrazrzqngwkqsqa | supabase-sql-magic skill + active Supabase MCP = best possible setup |
| `code-build` on BUILD_PLAN M-tasks | AccentOS project context is irreplaceable |
| Continuation of a task Claude Code started this session | Mid-task switch is always worse than finishing here |
| Any vibe-speak meta-command | Tooling management, not a routable task |
| `/route` commands themselves | Meta — not a task to route |
| `automation` when the target is AccentOS scripts/crons | Requires file access + git |
| Session wrap / doc updates | Always handled by Claude Code per CLAUDE.md rules |

---

## Multi-type disambiguation rules

| Pattern | Classification |
|---|---|
| "brainstorm ideas then implement the best one" | primary=brainstorm, secondary=code-build |
| "research X then write a doc about it" | primary=research, secondary=doc-write |
| "review this code and fix the bugs" | primary=code-review, secondary=debug |
| "build a mockup for X" | primary=design-visual, secondary=code-build |
| "quick question: what is X" | primary=quick-lookup (override everything else) |
| "automate the weekly report" | primary=automation, secondary=doc-write |
| "plan and schedule the next 3 M-tasks" | exclusion zone — AccentOS BUILD_PLAN context, stays with Claude Code |

When "quick question" framing is present → always classify as quick-lookup regardless of content length. The "quick" signal overrides the content signal because Michael is signaling he wants fast, not thorough.

---

## Signal strength calibration

**Strong signals** are words/phrases that appear primarily in one task type. Score = 3 points each.
**Weak signals** are words/phrases that appear across multiple task types. Score = 1 point each.
**AccentOS boosts** add 2 points to the task type AND set ctx_bonus=true.

Classification picks the task type with the highest total signal score. Ties broken by message length (shorter = quick-lookup) then by the most recent similar task type in the session.
