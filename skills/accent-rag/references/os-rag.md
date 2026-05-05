# OS-RAG · implementation notes

## End-to-end flow

```
User asks question in Ask the Engine (Internal mode)
        │
        ▼
ragSearch(query, {topK:6})
        │
        ├─► ragEmbed([query]) ──► Cloudflare Worker /embed (free Workers AI bge-base-en-v1.5)
        │                          returns 1×768 vector
        │
        ├─► sbFetch('/rpc/rag_hybrid_search', {query_text, query_embedding, …})
        │   PostgreSQL runs:
        │     · ts_rank_cd(tsv, websearch_to_tsquery('english', q))   → BM25-ish
        │     · embedding <=> query_embedding                          → cosine
        │     · row_number() over each → reciprocal rank fusion (k=50)
        │   returns top 20 chunks ranked by RRF score
        │
        └─► ragRerank(query, hits) ──► Claude Haiku 4.5
                                         returns JSON array of {i, s 0-10}
                                         picks top 6
        │
        ▼
sendChat() prepends <retrieved>…</retrieved> block to system prompt
        │
        ▼
Claude Sonnet 4 generates answer using retrieved context
        │
        ▼
"Grounded · 6 sources" pill rendered above answer
User clicks pill → expanded source list with click-through
```

## Schema

See `sql/M42_rag_pgvector.sql` for the full DDL. Key columns on `rag_chunks`:

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid PK | natural row id |
| `source_type` | text | 'article', 'vendor_playbook', 'scoring_rubric', 'lighting_ref', 'sop', 'master_doc', 'session_log', 'build_intel', 'customer_note', 'vendor_note', 'arbitrary' |
| `source_id` | text | natural key back to origin (article slug, vendor_id, etc.) |
| `body` | text | the chunk |
| `context` | text | Anthropic contextual prefix |
| `searchable` (generated) | text | `coalesce(context,'') \|\| ' ' \|\| body` |
| `tsv` (generated) | tsvector | indexed for BM25-ish ranking |
| `embedding` | vector(768) | bge-base-en-v1.5 |
| `metadata` | jsonb | tags, vendor_id, category, etc. |
| `visible_to_roles` | text[] | RLS-driven visibility |
| `pinned` | bool | always-surface chunks |
| `body_hash` | text | sha256 of body, for dedup |

## Hybrid search RPC

```sql
SELECT * FROM rag_hybrid_search(
  query_text       => 'Visual Comfort IMAP enforcement',
  query_embedding  => '[0.012, ...]'::vector(768),
  match_count      => 20,
  full_text_weight => 1.0,
  semantic_weight  => 1.0,
  rrf_k            => 50,
  source_types     => ARRAY['vendor_playbook','scoring_rubric'],
  required_roles   => ARRAY['Sales']
);
```

Returns: id, source_type, source_id, source_url, title, body, context, metadata, pinned, full_text_rank, semantic_rank, rrf_score.

## Ingest flow

`ragIngestText(item)` does five things per source:

1. **Chunk** body into 200-400 token chunks with 50-token overlap.
2. **Contextualize** each chunk with one Claude Haiku call. Prompt:
   ```
   <document title="...">{full doc}</document>
   <chunk>{chunk}</chunk>
   Write the context prefix:
   ```
   Output is a single sentence: "From <doc>, in <section>: <topic>."
3. **Embed** `context + ' ' + body` via the Worker.
4. **Delete** prior rows for `(source_type, source_id)` so re-ingest is safe.
5. **Bulk insert** all chunks in one POST to `/rag_chunks`.

`ragIngestArticle(article)` is a wrapper that maps Internal Doc article fields onto `ragIngestText` input shape. Auto-wired into `sbSaveArticle` so saving an article auto-ingests it (background, non-blocking).

## Reranker prompt

```
System: You score chunks for retrieval relevance to a user query.
        Return ONLY a JSON array of {i, s} where i is the index and
        s is 0-10 (higher = more relevant). No prose.
User:   Query: <query>
        Chunks:
        [0] <title>::<id>
        <chunk body>

        [1] ...
```

This consistently returns parseable JSON in our tests with Haiku 4.5. Sonnet works too but adds 5× cost for marginal gain.

## Privacy

- **Customer mode** in Ask the Engine never calls `ragSearch`. Internal data leakage = unacceptable.
- The `visible_to_roles` column on each chunk is RLS-enforced. A Sales user querying for vendor margins gets filtered to chunks where `visible_to_roles && ARRAY['Sales']`.
- Manager+ roles can ingest. Anonymous (no JWT) is blocked by RLS — Settings UI requires Auth.

## Failure modes + behaviour

| Mode | Behaviour |
|---|---|
| Worker URL not set | `ragConfigured()` returns false; `sendChat` skips RAG silently |
| Worker reachable but returns 401 | Settings UI shows the error in Health Check |
| Supabase key missing | `sbFetch` throws; `sendChat` falls back to model-only (warns in console) |
| `rag_chunks` table missing (M41 not run) | Health check flags it; Seed button shows the error |
| Rerank LLM call fails | Retain RRF order; never block the answer |
| Generation LLM call fails | Existing Ask the Engine error path ("Connection error") |

## Performance targets

- End-to-end answer latency: < 3s p50, < 6s p95 on a corpus of 5K chunks.
- Index size: ~50 MB for 5K chunks (768-dim float vectors dominate).
- Free-tier headroom: Workers AI free tier = ~250K embeddings/day. AccentOS scale is well below.
