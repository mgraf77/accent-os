# accent-rag — AccentOS RAG Skill
> Version: 1.0.0 · Karpathy LLM Wiki pattern
> Primary path: wiki/ (markdown files, zero infra)
> Secondary path: live-RAG (pgvector Supabase, optional)
> Dev tool: BUILD-RAG (Python scripts, local index)

---

## Overview

accent-rag is the knowledge retrieval layer for AccentOS. It follows Andrej Karpathy's "LLM Wiki" pattern: curated, human-readable markdown pages in `wiki/` serve as the primary knowledge source. These pages are fetched directly by js/wiki.js for the AccentOS Wiki module and injected as context into Ask the Engine (sendChat).

The pgvector / BM25 live-RAG path is an optional secondary path for when wiki has no hit. BUILD-RAG scripts are dev tools for indexing and evaluation — they never run in production.

---

## Step 0 — Skill activation

This skill activates when:
- Michael types `/aos-ingest`, `/aos-search`, `/aos-wiki`, `/aos-build`, `/aos-eval`, `/aos-lint`, `/aos-index`, `/aos-ralph`, `/aos-close`
- Claude detects "update the wiki", "add to wiki", "wiki search", "what does the wiki say about"
- Any task involving AccentOS knowledge retrieval, vendor scoring lookup, lighting reference, SOP lookup

---

## Step 1 — Three-layer architecture

```
Layer 1: AccentOS source of truth (MASTER.md, BUILD_PLAN_*, js/, sql/, index.html)
          ↓  summarize, never modify
Layer 2: wiki/ — Karpathy LLM Wiki
          wiki/CLAUDE.md     schema + workflows
          wiki/index.md      master page index
          wiki/log.md        session change log
          wiki/hot.md        handoff state
          wiki/overview.md   system overview
          wiki/concepts/     vendor scoring, lighting ref, SOPs, patterns
          wiki/decisions/    ADR-001 through ADR-N
          wiki/entities/     vendors, employees, customers
          wiki/modules/      AccentOS module patterns (auto-gen from js/)
          wiki/sources/      summary pages of Layer 1 sources
          wiki/syntheses/    cross-page analysis, eval matrices
          wiki/inbox/        unprocessed raw notes
          wiki/raw/          verbatim extracts pre-summarization
Layer 3: BUILD-RAG (dev only)
          skills/accent-rag/scripts/rag_build_index.py
          skills/accent-rag/scripts/rag_search.py
          skills/accent-rag/scripts/rag_eval.py
```

---

## Step 2 — Wiki page anatomy

Every page MUST have YAML frontmatter:

```yaml
---
type: concept|decision|entity|module|source|synthesis
slug: kebab-case-unique-id
title: Human Readable Title
sources: [list, of, source, slugs]
related: [list, of, related, wiki, slugs]
confidence: high|medium|low
sensitive: false
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Rules:
- `sensitive: true` → never served to customer mode
- `confidence: low` → surfaced by lint as needing verification
- Every `[[wikilink]]` must resolve to a real slug in wiki/index.md
- Max 600 words per page (Karpathy density principle)

---

## Step 3 — /aos-ingest workflow

1. Receive raw content (paste, file path, URL)
2. Extract key facts — strip boilerplate, retain only signal
3. Classify: which page type? new page or append to existing?
4. Write/append page with correct frontmatter
5. Update wiki/index.md — add slug + one-line description
6. Append entry to wiki/log.md
7. Run wiki_lint.py — fix any lint errors before committing
8. Commit: `wiki: ingest [slug]`

Never modify Layer 1 files during ingest. Summarize INTO wiki/sources/ instead.

---

## Step 4 — /aos-search workflow

1. Parse query → extract key terms
2. If BUILD-RAG available: run rag_search.py --wiki-only
3. Else: scan wiki/index.md for matching slugs → fetch and rank by term overlap
4. Return top-3 pages with excerpts
5. Render in AccentOS Wiki module (js/wiki.js) or inject into sendChat context

---

## Step 5 — Ask the Engine grounding

sendChat() wiki-grounding logic (internal mode only):
1. Extract key terms from user message
2. Scan wiki/index.md for top-3 matching slugs by term overlap
3. Fetch wiki/<type>/<slug>.md via JS fetch()
4. Prepend wiki excerpts to system prompt as grounding context
5. Tag response with "Grounded · N wiki sources" pill
6. Render wiki source citations as click-through links to /wiki/<slug>

Customer mode: never reads wiki/entities/customers/ or sensitive:true pages.

---

## Step 6 — /aos-lint workflow

Run wiki_lint.py → outputs JSON:
```json
{
  "broken_wikilinks": [...],
  "orphan_pages": [...],
  "missing_frontmatter": [...],
  "stale_low_confidence": [...],
  "index_drift": [...],
  "bad_slugs": [...]
}
```
Zero errors required before any commit touching wiki/.

---

## Step 7 — Auto-disengage rules

Revert to plain English (no vibe-speak) for:
- Multi-step wiki ingest sequences with order dependency
- Any lint output with errors (show raw JSON)
- Conflict resolution between two wiki pages

---

## Step 8 — Ralph loop protocol

3-4 iterations per skill review. Each iteration:
a. Mental dry-run: 2 Michael phrasings → walk every workflow → flag gaps
b. Edge cases: top 3 failure modes (no input, ambiguous slug, missing dep)
c. Apply fixes via Edit to wiki/CLAUDE.md and/or this SKILL.md
d. Re-run lint after fixes
e. Repeat until 2 consecutive zero-issue iterations OR 4 total

Log each loop in wiki/log.md as `## [date] ralph-loop-N`.

---

## Step 9 — BUILD-RAG scripts

| Script | Purpose |
|--------|---------|
| rag_build_index.py | Build BM25 + dense index over wiki/ + sources/ |
| rag_search.py | Query the index; --wiki-only flag for wiki/ only |
| rag_eval.py | Run golden Q&A eval matrix; output scoreboard |
| wiki_lint.py | Lint all wiki pages; JSON output |
| wiki_seed.py | Auto-generate module + vendor pages from source files |

BM25 boost: wiki/ pages get 1.3× multiplier vs non-wiki chunks.

---

## Step 10 — Slash commands

| Command | File |
|---------|------|
| /aos-ingest | commands/aos-ingest.md |
| /aos-search | commands/aos-search.md |
| /aos-wiki | commands/aos-wiki.md |
| /aos-build | commands/aos-build.md |
| /aos-eval | commands/aos-eval.md |
| /aos-lint | commands/aos-lint.md |
| /aos-index | commands/aos-index.md |
| /aos-ralph | commands/aos-ralph.md |
| /aos-close | commands/aos-close.md |

---

## Step 11 — Constraints

- Zero added cost: wiki path needs no Cloudflare Worker, no Supabase schema changes
- Vanilla JS, no build step
- Markdown rendering reuses subset from js/knowledge_hub.js
- [[wikilinks]]: `[[slug]]` → `<a href="#wiki/slug">slug</a>`
- M42/M43 (pgvector) stay optional
- Never modify Layer 1 during /aos-ingest

---

## Step 12 — Pre-send accuracy gate

Before surfacing any wiki fact in a chat response:
1. Confirm the page's confidence: is it `high` or `medium`? If `low`, flag to user.
2. Check updated: date. If >90 days old, note "may be stale".
3. Never fabricate wiki content — only surface what's explicitly in the page.
