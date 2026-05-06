# accent-rag — AccentOS File-Based RAG Skill

---
skill: accent-rag
version: 1.0.0
status: active
default_on: false
trigger_phrases:
  - "check the wiki"
  - "look it up in the wiki"
  - "wiki search"
  - "what does the wiki say"
  - "rag search"
  - "accent-rag"
auto_trigger_domains:
  - vendor onboarding workflow
  - quote creation sales pipeline
  - inventory reorder purchase order
  - lighting cluster product category
  - employee role access permissions
  - supabase backend architecture
  - csv import workflow
  - ADR architecture decision
companion_skills:
  - vibe-speak
  - supabase-sql-magic
  - decision-log
  - skill-forge
---

## Purpose

Search the AccentOS wiki corpus (`wiki/` flat markdown files) and inject relevant context into Claude's response. No embedding API, no vector DB, no pipeline. Instant, free, version-controlled.

## When to invoke

### Explicit (user or Claude-triggered)
```
/wiki [query]
"check the wiki for vendor onboarding"
"accent-rag: how do I add inventory"
```

### Automatic (vibe-speak Step 23 skill router)
The skill router triggers accent-rag when a query matches an `auto_trigger_domain` with confidence > 0.6.

Confidence signals:
- Query contains 2+ keyword tokens that match a domain phrase
- Query is a "how do I" or "what is" question about an AccentOS module
- Query references a named entity from the wiki (e.g. "Windward", "SOP", "ADR")

## Step-by-step retrieval

```
Step 1  Read wiki/_index.md
        → Gets page table: id, title, type, weight, tags, path, excerpt

Step 2  Score pages (fast pass)
        For each page, compute overlap:
        score = count(query_tokens ∩ title_tokens ∪ tag_tokens) × (weight/10)
        Sort descending. Take top 20.

Step 3  Deep-score top 20
        Read full .md file for each.
        Re-score against full body text.
        Final score = keyword_density × (weight/10)

Step 4  Return top K=5 pages
        Extract 200-token context window around first keyword hit.
        Format as accent-rag result block.

Step 5  Synthesize
        Insert retrieved context into response, citing page id.
        If no relevant results (all scores = 0): say so. Don't hallucinate.
```

## Query tokenization

Before scoring:
1. Lowercase query
2. Strip stopwords: the, a, an, is, it, in, of, to, and, or, for, with, on, at, by, from, that, this, be, are, was, how, do, i, we, my, our, can, does, what, when
3. Apply synonym expansion (see Synonym map below)
4. Score remaining tokens

### Synonym map (v1.0.0)

| query term | expands to |
|---|---|
| fixture | fixture luminaire light-fitting pendant chandelier |
| luminaire | luminaire fixture light-fitting |
| light | light fixture luminaire |
| vendor | vendor supplier brand VD |
| add vendor | vendor onboarding sop-001 |
| new quote | quote create sop-002 |
| low stock | inventory reorder sop-003 |
| out of stock | inventory reorder low-stock |
| deal | deal pipeline quote sales |
| employee | employee role emp sales warehouse owner |
| ERP | windward ERP S5WebAPI |

## Response format

```
[accent-rag · {K} results · query: "{query}"]

1. **{title}** (`{id}` · {type} · weight {weight})
   > {excerpt — first 200 tokens around keyword hit}
   📄 {path}

2. …
```

If no results: `[accent-rag · 0 results · query: "{query}" — no wiki pages matched. Consider adding a page or checking tags.]`

## Weight boost logic

| type | base weight | boost condition | boosted weight |
|---|---|---|---|
| sop | 8 | query contains "how", "workflow", "process", "steps" | 9 |
| adr | 7 | query contains "why", "decision", "architecture" | 8 |
| cluster | 7 | query contains "product", "fixture", "quote", "lighting" | 8 |
| entity | 6 | query names a role (owner, sales, warehouse) | 7 |
| source_summary | 5 | query contains "integration", "API", "sync", "data" | 6 |

## Maintenance

### Add a page
1. Create `.md` in `wiki/<type>/`.
2. Fill frontmatter per `wiki/CLAUDE.md` schema.
3. `python scripts/wiki_seed.py` → regenerates `_index.md` + `_index.json`.
4. `python scripts/wiki_lint.py` → verify clean.
5. Commit page + index together.

### Update weights
Edit `weight:` in individual page frontmatter. See `skills/accent-rag/weighting.md` for full table.

### Re-index after bulk edits
```bash
python scripts/wiki_seed.py
python scripts/wiki_lint.py
git add wiki/_index.md wiki/_index.json
git commit -m "wiki: re-index"
```

## Limitations

- Recall is ~7/10 vs pgvector's ~9/10 (synonym/semantic miss rate).
- Mitigated by: synonym expansion map + enriched tags on cluster pages.
- Migration path: if recall gap becomes a problem, pgvector can be added as a second-pass re-ranker. See `wiki/adrs/adr-007-wiki-rag-vs-pgvector.md`.

## Eval results

Full eval matrix: `skills/accent-rag/eval-matrix.md`

v1.0.0 score: **44/50** (wiki-pattern) vs 33/50 (pgvector). Delta: +11.

## Version history

| version | date | changes |
|---|---|---|
| 1.0.0 | 2026-05-06 | Initial build — 19 pages, 3 Ralph loops, 44/50 score |
