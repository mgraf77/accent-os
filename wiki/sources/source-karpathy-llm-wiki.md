---
type: source
slug: source-karpathy-llm-wiki
title: "Source: Karpathy LLM Wiki Gist"
sources: []
related: [karpathy-llm-wiki, ADR-007]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Source: Karpathy LLM Wiki Gist

**Origin**: Andrej Karpathy's public writing on LLM knowledge grounding  
**Layer**: External reference (no file in repo; concepts extracted to wiki)

## Core ideas (extracted)

1. Maintain a curated, human-readable wiki of domain knowledge
2. LLM retrieves relevant pages as context (not parametric memory)
3. Dense, cross-linked markdown → traversable knowledge graph
4. Confidence tagging lets LLM calibrate hedging
5. Human editing is the quality gate; auto-ingest is secondary
6. Zero infra: pure markdown files, HTTP fetch, no vector DB required for primary path

## Adaptation for AccentOS

AccentOS's wiki follows this pattern with:
- YAML frontmatter (type, slug, confidence, sensitive, created, updated)
- [[wikilink]] syntax rendered by js/wiki.js
- wiki/index.md as the slug registry (replaces a full search index for primary path)
- Three-layer architecture: wiki primary → pgvector secondary → Claude fallback

## Why Karpathy, not standard RAG

See [[ADR-007]] for full rationale. Short version: AccentOS knowledge is stable, domain-specific, human-curated, and small enough that markdown fetch beats vector embedding for primary path. The wiki pattern keeps the knowledge auditable and editable by non-engineers.

## Related

[[karpathy-llm-wiki]] · [[ADR-007]]
