# MODEL ROUTING STRATEGY
> AccentOS MVHB — High-level guidance for choosing the right model per task type.
> OPERATIONAL STRATEGY ONLY. No implementation. No automation. No orchestration.

---

## CORE PRINCIPLE
The right model is the cheapest one that can complete the task correctly on the first try.
Wrong model choice = token waste + relay friction + potential rework.

---

## OPUS vs SONNET

**Use Opus when:**
- Designing system architecture (schema, module boundaries, skill design)
- Debugging novel failures with no obvious cause
- Writing strategy docs (like this one)
- Multi-constraint reasoning (build order, dependency resolution)
- Any task where a wrong answer costs more to fix than Opus costs to run

**Use Sonnet when:**
- Implementing a known spec (file creation, code edits, migrations)
- Committing and pushing
- Relay work (reading WIP, writing handoffs, updating logs)
- Running bash, interpreting output, applying fixes
- Any task with a clear right answer and clear input

**Default rule:**
Start with Sonnet. Escalate to Opus only when Sonnet fails or the task is ambiguous.
Never default to Opus for implementation — it's expensive and unnecessary for code execution.

**AccentOS default:** Sonnet (matches current session model — claude-sonnet-4-6)

---

## CODEX USAGE (when available)

Codex-class models (code-optimized, fast, cheap) are suitable for:
- Boilerplate generation from a clear spec
- Diff-level edits to a single file
- Syntax fixes, linting passes
- Repetitive code transforms (e.g., rename across files)

Codex is NOT suitable for:
- Multi-file reasoning
- Architectural decisions
- Anything requiring BUILD_INTELLIGENCE.md context
- Error diagnosis without a clear stack trace

**AccentOS note:** Codex not currently in the active stack. Route to Sonnet for code tasks.

---

## CHEAP vs EXPENSIVE TASKS

**Cheap (Haiku / Sonnet):**
- File reads and writes
- Git operations
- Status checks
- Log writes (PROMPT_LOG, SESSION_LOG, WIP)
- Handoff block generation
- Simple bash execution and output interpretation

**Expensive (Sonnet / Opus):**
- Novel debugging with partial information
- Architecture decisions with 3+ tradeoffs
- Writing new skills or SKILL.md files
- Interpreting ambiguous user intent
- Any task where failure requires a retry (retry = 2x cost)

---

## RUNTIME vs GOVERNANCE WORKLOADS

**Runtime workloads** (building the product):
- Implement features per BUILD_PLAN_CLAUDE.md
- Fix bugs, push commits, deploy
- Run scripts, read logs, patch files
→ **Always Sonnet.** Fast, cheap, sufficient.

**Governance workloads** (managing the system):
- Updating BUILD_PLAN_CLAUDE.md structure
- Designing new skills or vibe-speak modes
- Reviewing BUILD_INTELLIGENCE.md for new lessons
- Writing strategy docs (like this one)
→ **Opus preferred** for initial design, Sonnet for execution.

---

## TOKEN-AWARE DELEGATION

When routing mentally between models, ask:
1. Is the task bounded? (clear input → clear output) → Sonnet
2. Does it require multi-step reasoning with unknown branches? → Opus
3. Is it repetitive or templated? → Sonnet (or Haiku if available)
4. Is failure expensive (deploy, migration, delete)? → Opus for planning, Sonnet for execution

**Relay sessions (iOS / mobile):**
- Always use Sonnet — iOS relay budgets favor fast, compact responses
- Opus's verbosity is counterproductive when relay budget is 10 thumb-typed tokens per hop

---

## SESSION-CAP MANAGEMENT

**Sonnet session cap** (practical):
- Run until task complete or context > 40K tokens
- Restart if loop detected (same error 3x)
- One session per feature branch, not per commit

**Opus session cap** (cost control):
- Use for design sessions only — not full build sessions
- Cap at 3–5 turns: question → options → decision → done
- Hand off decision to Sonnet for implementation

**Cross-session continuity:**
- WIP + handoff block carry state — model doesn't need to
- Switching Opus → Sonnet mid-task is zero-cost with proper handoff
- Never keep Opus running for implementation it didn't design

---

## ANTI-PATTERNS

- Using Opus to write commit messages
- Using Sonnet to make architecture decisions under time pressure
- Staying in one session after a loop (restart is cheaper than 5 retry turns)
- Picking a model based on "feels important" instead of task type
- Running Opus for relay / handoff work
