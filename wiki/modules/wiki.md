---
type: module
slug: wiki
title: Wiki Module
sources: [source-build-intelligence, source-karpathy-llm-wiki]
related: [ADR-002, ADR-004, ADR-006, ADR-007, karpathy-llm-wiki, rag-eval-matrix-v1]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Wiki Module

**File**: `js/wiki.js` (v6.11.2)
**Pattern**: read-only browser of `wiki/*.md` + production BM25 grounding engine for [[karpathy-llm-wiki]]
**Sidebar route**: `wiki` (CORE) — no schema, no DB writes

## Purpose

Two-pane wiki browser (left index, right page) plus the BM25 search engine that grounds Ask the Engine per [[ADR-006]]. Mirrors `skills/accent-rag/scripts/rag_search.py` exactly: same stemmer, same stop words, same graph re-rank, same slug dedup. Per [[ADR-007]] this is the primary grounding layer; pgvector is a fallback (M42/M43, not built).

## Functions

| function | role |
|----------|------|
| `parseWikiIndex(md)` | parses pipe-table rows from `wiki/index.md` into `{slug,title,type,confidence,updated}` records, tracks current type via `## <type> pages` headings |
| `loadWikiIndex()` | fetches + caches `wikiIndex`; returns `[]` on failure (offline-safe) |
| `_loadRagIndex()` | fetches + caches `_ragIndex` from `skills/accent-rag/index/rag_index_compact.json`; returns `null` if missing |
| `renderWikiMd(raw)` | markdown subset → HTML: strips frontmatter, resolves `[[wikilinks]]` to `openWikiPage()` calls, headings, bold/italic, inline code, fenced code, tables, bullets, hr |
| `fetchWikiPage(slug)` | resolves slug → file path via `typeDir` map; entity type tries `employees/`, `vendors/`, `customers/` in order; falls back to scanning all dirs + root `wiki/<slug>.md` |
| `searchWikiIndex(query, entries)` | left-pane filter: lowercase token-overlap on `slug + title + type`, hits-desc sort |
| `_stem(w)` | 13 suffix rules (`ations→`, `ing→`, `ies→y`, `ed→`, `s→`); minimum stem length 4 |
| `_bm25Tokenize(text)` | matches `[a-z][a-z0-9-]+` plus digit-anchored tech terms (`0-10v`, `2700k`); emits both raw and stem forms |
| `_bm25Search(query, ragIndex, topK, chatMode)` | three-stage: BM25 score sum across stop-filtered terms → graph re-rank with `GRAPH_BOOST=0.2` over `related` field, max-boost-per-chunk to prevent hub runaway → unique-slug dedup |
| `wikiGroundQuery(query, chatMode)` | called by `sendChat` before pgvector fallback. Returns `{context, sources}` or `null`. BM25 path when compact index loaded, title+body fallback otherwise |
| `openWikiPage(slug)` | renders fetched page into `wiki-content-pane`, highlights matching `.wiki-idx-row` |
| `wiki(el, act)` | sidebar route handler. Renders search input + grouped index (left) + content pane (right). Topbar action: Overview |

## Globals

`wikiIndex` (cached parsed index), `_ragIndex` (cached compact index), `wikiPage`, `wikiQuery`, `wikiCurrentSlug`, `_GROUND_STOP` (39-word set), `_STEM_RULES` (13 entries).

## Filtering rules

- `chatMode === 'customer'` excludes `entity` type results (PII / vendor-internal)
- `synthesis` type always excluded from grounding (meta pages)
- Fallback path also excludes `confidence: low` for customer mode

## Output shape (grounding)

```
{
  context: "[Wiki: <title>]\n<body[:500]>\n\n---\n\n…",
  sources: [{slug, title}, …]   // top 3
}
```

## Shell touchpoints

- Sidebar: `index.html` CORE → `wiki` slot
- `PAGE_META.wiki = {t:'AccentOS Wiki', s:'…'}`
- Dispatcher: `pages.wiki = wiki`
- `sendChat()` calls `wikiGroundQuery` before pgvector
- URL-hash auto-open: `wikiCurrentSlug` set externally → `setTimeout(openWikiPage, 0)`

## Performance

Compact index (`rag_index_compact.json`) loaded once and cached. BM25 search runs in-browser; per query roughly equal to disk-fetch cost of the compact JSON, then constant-time after. Slug-dedup keeps result set small (top-3) so context payload to the LLM stays bounded.

## Related

[[ADR-002]] · [[ADR-004]] · [[ADR-006]] · [[ADR-007]] · [[karpathy-llm-wiki]] · [[rag-eval-matrix-v1]]
