# Global skills registry

> All skills in `~/.claude/skills/`. Loaded at session start by vibe-speak Step 23 (skill router) to detect when a task could be handled by an existing skill instead of brute-forcing.
>
> Project-level registries at `[project-root]/skills/_index.md` are merged on top — project skills take precedence over global skills of the same name.
>
> ~3k tokens. Read once per session, cached.

## Schema

Each entry: name, 1-line summary, trigger phrases, when-to-use, when-NOT, companion skills.

---

## Skills

### analysis-snapshot
- summary: Capture any significant analysis (query, investigation, audit result) as a named, re-runnable artifact in `[project-root]/analyses/` — preserving parameters, query pattern, Claude reasoning template, and expected output format.
- triggers: "save this analysis", "snapshot this", "make this re-runnable", "I want to re-run this later", "name this query", "preserve this"
- when_to_use: after any meaningful data query or analysis run that produced a result you'll want to repeat
- when_NOT: one-time throwaway questions, code (use git), documentation
- companion: table-eda, decision-log

### autonomous-mode
- summary: Switch Claude into long-running autonomous-work mode when you step away — parses scope, time bound, and exit criteria, then builds until the condition triggers.
- triggers: "going to lunch", "going to bed", "stepping away", "go autonomous", "work while I'm gone", "until I'm back", "until [time]", "drain the prompt queue"
- when_to_use: long unattended build sessions with a clear scope
- when_NOT: discussion/design work, tasks needing approval mid-flow, external-API calls with billing implications
- companion: prompt-queue, bottleneck-finder

### bottleneck-finder
- summary: Read project planning state and identify the single task whose completion would unblock the most downstream work. Applies Theory of Constraints.
- triggers: "what's the bottleneck", "find the constraint", "what unblocks the most", "critical path", "where are we stuck", "what should I work on next"
- when_to_use: planning sessions, when stuck choosing what to build next
- when_NOT: when the next item is obvious; code-level performance bottlenecks (different concern)
- companion: prompt-queue, doc-drift

### codex-review
- summary: Have OpenAI Codex audit recent work — auto-apply LOW-risk fixes (typos, formatting, anti-patterns), surface HIGH-risk ones (behavioral changes, structural rewrites) for your approval.
- triggers: "codex review", "peer review", "second opinion", "cross-review", "have codex check this", "review the last commit"
- when_to_use: after a commit or skill change, when you want a cross-agent blind-spot check
- when_NOT: long-lived module review (use ultrareview), single-line typo fixes
- companion: skill-eval-suite, skill-forge

### community-skill-vet
- summary: Audit a candidate community Claude skill before installing — checks permissions, security risks, author reputation, and skill quality. Returns INSTALL / HOLD / REJECT with rationale.
- triggers: "vet this skill", "audit [skill url]", "is this skill safe", "should I install [skill]", "review before install"
- when_to_use: before installing any skill from outside your own projects
- when_NOT: skills you wrote yourself (trusted by definition)
- companion: codex-review, skill-forge

### decision-log
- summary: Capture go/no-go decisions as named, dated artifacts in `[project-root]/decisions/` — preserving the question, options, choice made, reasoning, reversal cost, and future trigger.
- triggers: "log this decision", "decision: [topic]", "save this go/no-go", "document this choice", "record this call", "decided"
- when_to_use: after any non-trivial architectural, product, or process choice
- when_NOT: code changes (use git), ad-hoc analyses (use analysis-snapshot)
- companion: analysis-snapshot, bottleneck-finder

### doc-drift
- summary: Cross-check that project planning and state documents agree on priorities, active work, and queue items. Surfaces disagreements as a delta table with paste-ready fixes.
- triggers: "check for doc drift", "are my docs consistent", "verify priorities are aligned", "drift check", "consistency check on plans"
- when_to_use: end of session, after a flurry of changes, when plans feel out of sync
- when_NOT: code consistency (use lint/typecheck), single-document review
- companion: bottleneck-finder, build-plan-status

### prompt-queue
- summary: Manage queued prompts in `[project-root]/PROMPT_QUEUE.md` — capture without interrupting current work, defer with conditions, reorder, and drain under autonomous-mode.
- triggers: "queue this prompt", "queue: [text]", "defer until [X]: [text]", "show the queue", "drain the queue", "what's waiting"
- when_to_use: when you have prompts you don't want to lose but can't execute now
- when_NOT: prompts meant to interrupt the current session immediately
- companion: autonomous-mode, bottleneck-finder

### repo-scout
- summary: Autonomous GitHub/MCP/skill repository intelligence — discovers and filters candidates, produces a verdict table, and generates customized install snippets or SKILL.md adaptations for everything rated INSTALL.
- triggers: "find new skills", "scout repos", "what's worth installing", "anything new worth grabbing", "is [tool X] worth it", "what am I missing"
- when_to_use: when looking for new tools, MCPs, CLIs, or skills to add to your stack
- when_NOT: building a custom skill from scratch (use skill-forge)
- companion: skill-forge, community-skill-vet

### skill-eval-suite
- summary: Generate a Promptfoo-compatible eval YAML (5–8 test cases) for any skill — covering happy path, edge cases, output shape, and anti-pattern compliance. Turns Ralph-loop fixes into automated regression tests.
- triggers: "eval suite for [skill]", "test [skill]", "promptfoo for [skill]", "regression tests for [skill]", "automate the Ralph loop", "lock in [skill] behavior"
- when_to_use: after shipping or updating a skill, to lock in its behavior
- when_NOT: code tests (use your project test runner), stress-testing skill-forge itself
- companion: skill-forge, skill-optimizer, codex-review

### skill-forge
- summary: Deep-research a target tool, repo, or methodology across multiple sources, run a gap analysis against your project needs, and ship a custom project-scoped SKILL.md in one pass.
- triggers: "look into [X]", "forge a skill from [X]", "build me a skill based on [X]", "extract concepts from [X]", "rip the good parts out of [X]", "I want a [X]-style skill"
- when_to_use: when you want to adapt an external tool or methodology into a local skill
- when_NOT: the as-is version is a good fit (use repo-scout + install), internal file edits
- companion: repo-scout, skill-optimizer, skill-eval-suite

### skill-optimizer
- summary: Score any skill against a weighted rubric (output quality, methodology, trigger coverage, accuracy, efficiency, project fit, anti-patterns), brainstorm improvements via Ralph loops (cap 5), gate on approval, execute, and verify with a scored matrix test.
- triggers: "optimize [skill]", "tune [skill]", "make [skill] better", "level up [skill]", "score this skill", "skill optimizer", "upgrade [skill]", "what's wrong with [skill]"
- when_to_use: any existing skill that needs systematic improvement
- when_NOT: building a new skill from scratch (use skill-forge), automated tests (use skill-eval-suite)
- companion: skill-forge, skill-eval-suite, codex-review

### table-eda
- summary: One-page exploratory data analysis on any database table or query result — row count, null %, distinct counts, top-10 values, range/distribution, and outlier flags.
- triggers: "EDA on [table]", "data quality check on [table]", "what's in [table]", "profile this table", "is this data sane"
- when_to_use: first time touching a table, investigating data quality before building on top of it
- when_NOT: known-shape data, vendor scoring analysis (use project-specific skill)
- companion: analysis-snapshot, decision-log

### vibe-speak
- summary: Always-on communication framework — 9 modes (vibe, caveman, gsd, executive, pair, teach, vibesplain, wenyan, raw), adaptive per-user calibration, token-aware compression in native English.
- triggers: auto-active per `~/.claude/CLAUDE.md`; mode switches: "caveman", "gsd", "vibesplain", "pair up", "teach me", "exec mode", "raw mode"
- when_to_use: every Claude Code session (default-on)
- when_NOT: when default Claude behavior is needed (use raw mode)
- companion: skill-forge (proposes new modes / new skills)

---

## How the skill router uses this registry

Per vibe-speak SKILL.md Step 23:

1. At session start, read this file (~2k tokens, cached for session)
2. Merge with project-local `skills/_index.md` if it exists — project skills win on name conflicts
3. For each user request, check description + triggers against the request
4. If match confidence > 0.5, surface the matched skill suggestion before brute-forcing
5. If no match but task feels routine (≥3 brute-force tool calls), surface "use skill-forge to build one?"

## Maintenance

- New global skill: append entry here + write `~/.claude/skills/[skill-name]/SKILL.md`
- New project skill: append to `[project-root]/skills/_index.md` + write the SKILL.md there
- Remove skill: delete the entry here and the skill directory
