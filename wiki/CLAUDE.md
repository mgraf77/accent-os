# AccentOS Wiki — Schema & Workflows (Layer 3)
> Read by Claude Code at session start. Governs all wiki/ operations.

---

## What is the wiki?

The wiki is Accent Lighting's internal knowledge base, structured after Andrej Karpathy's "LLM Wiki" pattern: curated, dense, cross-linked markdown pages that serve as the primary grounding layer for Ask the Engine (sendChat) and the AccentOS Wiki sidebar module.

**Primary path**: fetch wiki/*.md files directly (zero infra, zero cost).
**Secondary path**: pgvector live-RAG (optional, M42/M43).
**Dev tooling**: skills/accent-rag/scripts/ (Python, local only).

---

## Directory structure

```
wiki/
├── CLAUDE.md          ← this file (schema + workflows)
├── index.md           ← master slug registry + one-line descriptions
├── log.md             ← append-only session change log
├── hot.md             ← current handoff state (always-fresh)
├── overview.md        ← system overview (human onboarding doc)
├── concepts/          ← vendor scoring, lighting reference, SOPs, patterns
├── decisions/         ← ADRs (Architecture Decision Records)
├── entities/
│   ├── employees/     ← team profiles
│   ├── vendors/       ← vendor detail pages (auto-gen + manual)
│   └── customers/     ← customer profiles (sensitive: true)
├── modules/           ← AccentOS module patterns (auto-gen from js/)
├── sources/           ← summaries of Layer 1 source files
├── syntheses/         ← cross-page analysis, eval matrices
├── inbox/             ← unprocessed raw notes (staging)
└── raw/               ← verbatim extracts pre-summarization
```

---

## Page types

| type | slug convention | description |
|------|----------------|-------------|
| concept | kebab-lower | Domain knowledge: vendor scoring, lighting spec, SOP |
| decision | ADR-NNN | Architecture/business decision records |
| entity | type-name | Vendor, employee, or customer profiles |
| module | module-name | AccentOS JS module pattern documentation |
| source | source-name | Summary of a Layer 1 source file |
| synthesis | analysis-name | Cross-page analysis, eval results, comparisons |

---

## Required frontmatter

Every wiki page MUST begin with:

```yaml
---
type: concept|decision|entity|module|source|synthesis
slug: kebab-case-unique-id
title: Human Readable Title
sources: [list-of-source-slugs]
related: [list-of-related-wiki-slugs]
confidence: high|medium|low
sensitive: false
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**sensitive: true** → never served to customer mode in Ask the Engine.
**confidence: low** → flagged by wiki_lint.py as needing verification.
**updated** → must be bumped any time body content changes.

---

## Wikilinks

`[[slug]]` syntax is supported in all wiki pages.
Rendered by js/wiki.js as `<a href="#wiki/slug">slug</a>`.
Every `[[slug]]` must resolve to a real entry in wiki/index.md.
wiki_lint.py checks for broken wikilinks.

---

## Ingest workflow

1. Receive raw content
2. Extract signal, discard boilerplate
3. Classify type + determine if new page or append
4. Write page with correct frontmatter
5. Update wiki/index.md (add slug + description)
6. Append to wiki/log.md
7. Run wiki_lint.py — zero errors before commit
8. Commit: `wiki: ingest [slug]`

Never modify Layer 1 files (MASTER.md, BUILD_PLAN_*, js/, sql/, index.html) during ingest.

---

## log.md format

```markdown
## YYYY-MM-DD [action]
- [verb]: [slug] — [one-line description]
- [verb]: [slug] — ...
```

Actions: `ingest`, `update`, `delete`, `ralph-loop-N`, `session-close`.

---

## hot.md format

```markdown
# Wiki Hot State
> Updated: YYYY-MM-DD HH:MM

## Current task
[what's being built right now]

## What shipped (last session)
[bulleted list of completed items]

## Open loops
[unresolved items, blockers, open questions]

## Next-session entry point
[exact first action for next Claude session]
```

---

## index.md format

```markdown
## [type] pages
| slug | title | confidence | updated |
|------|-------|-----------|---------|
| slug | Title | high | YYYY-MM-DD |
```

---

## Density principle (Karpathy)

- Max ~600 words per page
- Every sentence carries signal
- Cross-link aggressively via [[wikilinks]]
- No preamble ("This page covers..."), no filler
- Write as if the reader knows AccentOS and needs the fact, not the explanation

---

## Session start auto-read

At every session start, Claude reads:
1. wiki/hot.md (current handoff state)
2. Last 10 entries of wiki/log.md

This is enforced in .claude/CLAUDE.md AUTO-EXECUTE step.
