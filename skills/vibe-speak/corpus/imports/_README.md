# corpus / imports — README

> Drop prompt-history exports here. vibe-speak parses them into vocabulary / trends / topics.

## Supported formats

### 1. claude.ai conversation export (preferred)

**How to get it:**
1. Go to https://claude.ai/settings → Privacy
2. Click "Request data export"
3. Wait for the email (typically <24 hours)
4. Download the zip
5. Unzip locally
6. Drop `conversations.json` here, ideally renamed: `claude-export-YYYY-MM-DD.json`
7. Run `/vibe import` (auto-detects the JSON)

**Format:** JSON array. Each conversation has a `name`, `created_at`, `chat_messages` (with `sender` ∈ `{human, assistant}` and `text`).

vibe-speak's parser pulls only the `human` messages — assistant responses aren't part of Michael's communication style.

### 2. AccentOS PROMPT_LOG.md (auto-imported)

This repo's `PROMPT_LOG.md` is auto-imported at session start. No action needed.

Format: markdown with `### [date] — [title]` headings + `**Prompt:** "..."` blocks.

### 3. Other plain-text prompt logs

Any markdown or text file with one prompt per paragraph or per `###` heading. Drop here, run `/vibe import [filename]`.

vibe-speak best-effort parses — if it can't auto-detect structure, it'll surface "couldn't parse — provide an example structure?"

### 4. Anthropic Console API logs (if you use the API)

Anthropic Console doesn't currently export message history in bulk. If you have an API-call log file (e.g. from your own logging), drop here and run `/vibe import`. Parser stub provided; format-specific tweaks may be needed.

---

## What gets stored

After `/vibe import`, the original file stays in this directory (read-only reference).

The parsed entries flow into:
- `corpus/vocabulary.md` (n-grams + frequency + first-seen)
- `corpus/trends.md` (weekly rollups)
- `corpus/topics.md` (cluster detection)
- `corpus/backtest-runs.md` (log of what was processed and when)

## Privacy and PII

vibe-speak's parser scans for these patterns and redacts before adding to vocabulary:

- Email addresses → `[email]`
- Phone numbers → `[phone]`
- Credit card patterns → `[cc]`
- API key patterns (sk-..., bearer tokens) → `[api-key]`
- Long hex strings (likely hashes/IDs) → `[hash]`

Original raw files stay in `imports/` untouched. Only the parsed vocabulary is sanitized.

If a file contains highly sensitive data (customer payment info, employee SSN, etc.), drop it in `imports/.gitignored/` instead — that subdirectory is `.gitignore`-d (won't commit).

---

## Filename conventions

| Pattern | Use |
|---|---|
| `claude-export-YYYY-MM-DD.json` | claude.ai full export |
| `PROMPT_LOG.md.import` | re-import from a project's local PROMPT_LOG |
| `[project]-PROMPT_LOG-YYYY-MM-DD.md` | per-project log with date stamp |
| `console-api-YYYY-MM.json` | Anthropic Console export |
| `manual-corpus-YYYY-MM-DD.md` | hand-curated prompts |

Files starting with `_` are vibe-speak system files (don't import).

## Multi-project workflow

If you have multiple AccentOS-style repos, each with its own `PROMPT_LOG.md`:

1. Copy each repo's `PROMPT_LOG.md` here as `[project-name]-PROMPT_LOG-YYYY-MM-DD.md`
2. Run `/vibe import` for each (or `/vibe import all` to batch)
3. Backtest builds a unified vocabulary across projects
4. Cross-project brute-force patterns become candidates for universal skills (per Step 23)

This is the path to "vibe-speak grows with me across all my projects."
