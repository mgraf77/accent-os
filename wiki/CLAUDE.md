# AccentOS Wiki — Schema & Rules

> Source-of-truth for the wiki file-based RAG corpus. Read by `skills/accent-rag` at query time and by `scripts/wiki_lint.py` / `scripts/wiki_seed.py`.

## Purpose

Flat-file knowledge base for AccentOS. Every page is a `.md` file in a typed subdirectory. The `accent-rag` skill indexes these pages and returns relevant snippets in response to Claude queries — no embedding API, no vector DB, no pipeline.

## Frontmatter schema

Every wiki page (except CLAUDE.md / hot.md / log.md / _index.md / _index.json) MUST include:

```yaml
---
id: unique-kebab-slug
title: Human Readable Title
type: cluster|sop|adr|entity|source_summary|concept|runbook
status: draft|review|published
weight: 1-10
tags: [tag1, tag2]
related: [other-id, other-id]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Page types

| type | use_for |
|---|---|
| cluster | product/category knowledge — lighting families, fixture types |
| sop | Standard Operating Procedure — numbered workflow steps |
| adr | Architecture Decision Record — why something was built a specific way |
| entity | person, role, or named system (employee profiles, vendor contacts) |
| source_summary | external data source — what it is, fields, gotchas |
| concept | business/domain concept — defines a term used across AccentOS |
| runbook | repeating operational task — step-by-step, system-level |

## Weight guidelines

Weight multiplies keyword score at retrieval time.

| type | default | rationale |
|---|---|---|
| sop | 8 | Actionable; almost always the right answer for workflow questions |
| runbook | 8 | Same as SOP but system-level |
| adr | 7 | Architectural; surfaces when "why does X work this way" is asked |
| cluster | 7 | Product knowledge; surfaces for quoting / product Q&A |
| entity | 6 | Context; surfaces when a person or role is mentioned |
| source_summary | 5 | Background; surfaces for integration planning |
| concept | 5 | Background; surfaces for definitional questions |

Reserve weight 9–10 for pages that should ALWAYS appear when their subject is mentioned (e.g. the vendor-onboarding SOP should always appear when "add vendor" is queried).

## File layout

```
wiki/
  CLAUDE.md          ← this file (schema rules)
  hot.md             ← last-session live context (overwritten each session)
  log.md             ← append-only cross-session log
  _index.md          ← generated page index (run scripts/wiki_seed.py to rebuild)
  _index.json        ← generated JSON index (for AccentOS browser UI)
  clusters/          ← lighting product/category clusters
  sops/              ← standard operating procedures
  adrs/              ← architecture decision records
  entities/          ← employee / vendor / role entities
  sources/           ← external data source summaries
```

## Linting rules (`scripts/wiki_lint.py`)

1. Every `.md` in a typed subdirectory must have valid YAML frontmatter
2. `id` unique across all pages
3. `type` in allowed set
4. `status` in `[draft, review, published]`
5. `weight` integer 1–10
6. `tags` is a list (empty OK)
7. `updated` ≥ `created`
8. All `related` ids must resolve to existing pages

## Writing conventions

- **Lead with the fact.** No preamble sentences.
- SOPs: numbered steps, one action per step, sub-bullets for options/notes.
- ADRs: H2 sections — Status / Context / Decision / Consequences.
- Entities: profile card — role, responsibilities, AccentOS access level, key workflows.
- Source summaries: what it is → fields we use → gotchas → update cadence.
- Cross-link via `related:` frontmatter — not inline markdown links (breaks the index).
- Use exact nouns in titles and tags — these drive keyword recall.

## RAG retrieval contract

`accent-rag` implements a two-pass search:

1. **Keyword pass** — tokenize query, score each page by overlap against title + tags + body.
2. **Weight boost** — multiply raw score by `weight / 10` before ranking.
3. **Top-K** — return K=5 pages (configurable) with 200-token context windows.

Implications for authors:
- Specific nouns in titles/tags drive recall — "vendor onboarding SOP" beats "how to add a vendor".
- Keep pages focused on one concept; split long pages.
- Don't bury key terms deep in body — put them in the first 50 words.
- `related:` does NOT affect retrieval; it expands rendered output for context.
