---
type: concept
slug: karpathy-llm-wiki
title: Karpathy LLM Wiki Pattern
sources: [source-karpathy-llm-wiki]
related: [ADR-007, overview]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Karpathy LLM Wiki Pattern

The Karpathy LLM Wiki pattern is the basis for AccentOS's wiki-first RAG architecture, chosen over pgvector in [[ADR-007]]. Andrej Karpathy's proposal: instead of training models on fresh data continuously, maintain a curated "LLM Wiki" — a set of human-readable, dense, cross-linked markdown documents that serve as the grounding layer for an LLM. The LLM retrieves relevant pages and uses them as context rather than relying on parametric memory.

## Core principles

1. **Human-readable first**: pages are useful to humans, not just machines. No embedding-only content.
2. **Density over coverage**: 500 words of signal beats 5000 words of fluff. Edit ruthlessly.
3. **Cross-links as knowledge graph**: double-bracket slug wikilinks between pages build a traversable graph the LLM can follow.
4. **Confidence-tagged**: every page has a confidence score so the LLM knows when to hedge.
5. **Zero extra infra**: pure markdown files, fetched over HTTP. No vector DB required for the primary path.

## Why it works for AccentOS

AccentOS knowledge is:
- Stable (vendor scores don't change daily)
- Domain-specific (no public LLM training data covers Accent's vendor relationships)
- Cross-linked (rubric categories reference each other, SOPs reference entities)
- Human-curated (Michael's judgment is the signal; automated extraction is secondary)

## Three-layer architecture

```
Layer 1: Raw sources (MASTER.md, js/, sql/, index.html)
          ↓ summarize
Layer 2: wiki/ markdown pages  ← LLM Wiki (primary grounding)
          ↓ index
Layer 3: BM25 + dense index    ← optional dev tool
```

## How Ask the Engine uses it

1. User sends a message
2. Extract key terms
3. Scan wiki/index.md for slug matches
4. Fetch top-3 pages
5. Inject as grounding context into system prompt
6. Render "Grounded · N wiki sources" pill with click-through links

## Comparison to pure RAG

| Dimension | Wiki pattern | pgvector RAG |
|-----------|-------------|-------------|
| Infra cost | $0 | Supabase M42/M43 |
| Latency | ~50ms (fetch) | ~200ms (embed + query) |
| Freshness | Manual update | Auto-ingest |
| Accuracy | High (human-curated) | Variable (chunk quality) |
| Explainability | Full (you can read the page) | Opaque chunks |
| Fallback | Always works | Requires live DB |

## Related

[[ADR-007]]
