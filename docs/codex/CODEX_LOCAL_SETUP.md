# Codex CLI — Local Setup & Governance

> AccentOS bounded-execution integration.
> Claude retains full governance, orchestration, verification, and rollback authority.
> Codex performs mechanical execution only — always under Claude supervision.

---

## Environment Requirements

| Requirement | Status |
|---|---|
| Node.js ≥ 16 | ✅ v22.22.2 confirmed |
| npm | ✅ v10.9.7 confirmed |
| OpenAI API key | Required (see Auth) |
| Claude Code CLI | ✅ active host |

---

## Install

```bash
npm i -g @openai/codex
```

Verify:
```bash
codex --version
```

Expected: `0.130.0` or higher.

---

## Auth

Codex CLI authenticates via the `OPENAI_API_KEY` environment variable. No interactive login flow.

```bash
export OPENAI_API_KEY="sk-..."
```

For persistent sessions, add to your shell profile or set in `.claude/settings.json` under `env`:

```json
{
  "env": {
    "OPENAI_API_KEY": "sk-..."
  }
}
```

Verify auth:
```bash
codex "echo hello world"
```

Should produce output without authentication errors.

---

## Approval Mode — REQUIRED SETTING

**Always invoke Codex with `--approval-mode suggest` or `--approval-mode auto-edit`.**
Never use `--full-auto` in this project.

| Mode | Behavior | AccentOS Policy |
|---|---|---|
| `suggest` | Proposes changes, no execution | ✅ Always safe |
| `auto-edit` | Edits files, requires approval for shell commands | ✅ Safe for file transforms |
| `full-auto` | Executes without approval | ❌ FORBIDDEN |

Standard invocation pattern:
```bash
codex --approval-mode suggest "<task description>"
```

---

## Safe Usage Rules

1. **Claude dispatches all Codex tasks** — never invoke Codex independently to make architectural decisions.
2. **One task at a time** — no queued autonomous chains.
3. **Scope each task to a single directory or file type** — no repo-wide mutations without explicit per-step review.
4. **Claude reviews all Codex output** before any commit.
5. **Codex never commits** — Claude stages, reviews, and commits all changes.
6. **Codex never pushes** — all git push operations stay with Claude.
7. **Codex never reads or writes** `.env`, `wrangler.toml`, worker configs, SQL files, or any production credential files.
8. **Codex never modifies** `BUILD_PLAN_CLAUDE.md`, `CLAUDE.md`, `WORK_IN_PROGRESS.md`, `skills/`, or any governance doc.

---

## Approved Task Classes

These task types are safe for Codex bounded execution:

| Class | Examples |
|---|---|
| Read-only audits | Count `console.log` calls, find TODO comments, list unused imports |
| Deterministic text transforms | Rename a variable across non-production JS files, reformat JSON |
| Grep/search operations | Find all occurrences of a pattern, generate a symbol inventory |
| Boilerplate generation | Scaffold a new config file from a template, generate type stubs |
| Comment/doc generation | Add JSDoc to a single isolated function |
| Test file stubs | Generate empty test file skeletons from a function list |
| Non-production file edits | Edit files in `docs/`, `scripts/` that don't affect runtime |

---

## Forbidden Task Classes

Codex must **never** be used for:

| Class | Reason |
|---|---|
| Any SQL / database operations | Production data risk |
| Cloudflare Worker edits | Runtime-state mutations |
| `wrangler.toml` / env file edits | Credential / deployment risk |
| Branch creation or git push | Branch ownership stays with Claude |
| Governance doc writes | `BUILD_PLAN_CLAUDE.md`, `CLAUDE.md`, `skills/`, `WORK_IN_PROGRESS.md` |
| Production deploys | Zero autonomous deploys |
| Phase B features (multi-tenant, billing, auth) | Too high judgment requirement |
| Worker proxy logic | Too high risk of silent breakage |
| API key or secret management | Security boundary |
| Autonomous chaining (one Codex output fed to another) | Removes Claude oversight |

---

## Rollback / Uninstall

If Codex produces unintended changes:

```bash
# Discard all unstaged changes
git checkout -- .

# Discard staged but uncommitted changes
git reset HEAD && git checkout -- .

# If changes were committed, revert
git revert HEAD --no-edit
```

To uninstall Codex:
```bash
npm uninstall -g @openai/codex
```

---

## Troubleshooting

**`codex: command not found`**
```bash
npm i -g @openai/codex
# Ensure npm global bin is in PATH:
export PATH="$(npm bin -g):$PATH"
```

**`AuthenticationError` or 401**
- Confirm `OPENAI_API_KEY` is set and valid.
- Confirm key has access to `gpt-4o` or `o4-mini` (Codex default models).

**Codex hangs / no output**
- Add `--timeout 30` flag.
- Confirm network connectivity.
- Use `--model gpt-4o-mini` for lighter tasks.

**Codex tries to run shell commands without approval**
- Ensure you are using `--approval-mode suggest` or `--approval-mode auto-edit`.
- Never omit the `--approval-mode` flag.

---

## First Pilot Task Recommendation

See `CODEX_PILOT_PLAN_V1.md` for full plan.

**TL;DR — Recommended first task:**
> Read-only audit: scan all `.js` files in `/js/` for `console.log` / `console.error` calls and output a Markdown report listing file, line number, and log message preview.

- Zero production mutation
- Completely reversible (output is a new doc file only)
- High signal value (codebase hygiene)
- Claude reviews output before any commit
