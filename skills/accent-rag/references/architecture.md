# accent-rag · architecture

## Surfaces

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AccentOS RAG · two surfaces                    │
└─────────────────────────────────────────────────────────────────────────┘

  BUILD-RAG (dev-side)                 OS-RAG (live app)
  ─────────────────────────            ──────────────────────────────────
  Audience: Claude Code                Audience: AccentOS users
  Storage:  .rag/build-index.json      Storage:  Supabase rag_chunks
  Index:    BM25 over repo files       Index:    pgvector + tsvector
  Query:    `rag_search.py "..."`      Query:    rag_hybrid_search RPC
  Rerank:   none (BM25 is enough)      Rerank:   Claude Haiku
  Answer:   Claude Code reads chunks   Answer:   Claude Sonnet via Ask Engine
  Cost:     $0 (no LLM in path)        Cost:     ~$0 (free Workers AI + cheap rerank)
  Refresh:  `rag_build_index.py`       Refresh:  ragSeed() / ragIngest*()
```

## Decision log

| Decision | Choice | Why |
|---|---|---|
| Embedding model | bge-base-en-v1.5 (768-dim) on Cloudflare Workers AI | Free tier covers AccentOS scale; bge-base hits the sweet spot of recall vs. dim cost |
| Vector store | Supabase pgvector + HNSW | Already in stack; HNSW = no training step; cheap |
| Lexical | Postgres tsvector + GIN | Native, no extension besides pg_trgm |
| Fusion | Reciprocal Rank Fusion (k=50) | Anthropic + Supabase docs both endorse; ~91% recall@10 |
| Reranker | Claude Haiku 4.5 | 10× cheaper than Sonnet, ~95% as good for relevance scoring |
| Generator | Claude Sonnet 4 | Already wired in Ask the Engine |
| Contextualization | Anthropic contextual retrieval pattern | 49% reduction in retrieval failure (combined w/ rerank: 67%) |
| BUILD-RAG storage | Single JSON file | Zero infra; loads in <100ms; easily git-tracked |
| BUILD-RAG ranking | BM25 only | Embeddings would require API calls; BM25 over hashed chunks is plenty for "where did we ship X" queries |
| Worker auth | Shared bearer secret | Simpler than mTLS; rotated quarterly via `wrangler secret put` |
| RLS posture | All authenticated read; managers+ write | Matches existing AccentOS RLS pattern from M01 |
| Customer mode | RAG OFF | Customer chat must never see internal data — privacy by design |

## Non-decisions (deliberately deferred)

- **GraphRAG / LightRAG knowledge graph layer.** Adds operational complexity and extra LLM calls during ingest. Useful when entity-relationship queries dominate (e.g. "which vendors share a parent and have Tier B"). Not the bottleneck today — revisit when retrieval quality plateaus on relational queries.
- **Multi-vector / ColBERT.** Would improve recall on long passages but is 4×–8× the storage. bge-base + RRF is enough for AccentOS-scale corpus.
- **Sub-document re-assembly.** When retrieved chunks all come from the same article, we could re-stitch them into one block for the LLM. Currently each chunk is fed independently — fine until users start asking long-context narrative questions.
- **Eval harness (Ragas / Phoenix / Langfuse).** Add when there's enough query volume to measure. For now, manual spot-checks via Ask the Engine + SESSION_LOG entries.

## Cost envelope (AccentOS scale)

| Operation | Volume | Per-op cost | Daily cost |
|---|---|---|---|
| Ingest contextualization (Haiku) | ~500 chunks/initial seed | ~$0.0002 | $0.10 one-time |
| Embedding (Workers AI) | 500 chunks · 1× | $0 (free tier) | $0 |
| Query embedding | 100 queries/day | $0 | $0 |
| Hybrid search RPC | 100/day | Supabase free tier | $0 |
| Rerank (Haiku) | 100/day · 6 chunks | ~$0.0005 | $0.05 |
| Generation (Sonnet) | 100/day · 800 tokens | ~$0.012 | $1.20 |
| **Total** | | | **~$1.25/day, $37/mo** |

This is the answer-generation cost the Knowledge Engine already incurs. RAG adds <$2/month on top of that.
