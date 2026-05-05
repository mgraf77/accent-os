---
name: accent-rag
description: >
  Dual-mode Retrieval-Augmented Generation system custom-built for AccentOS at Accent Lighting Inc.
  Two retrieval surfaces under one skill: (a) BUILD-RAG runs locally over the AccentOS repo
  (MASTER.md, BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md, BUILD_INTELLIGENCE.md, SESSION_LOG.md,
  PROMPT_LOG.md, every js/* module, every sql/M*.sql migration, every skills/*/SKILL.md) so any
  Claude Code session can retrieve prior decisions, gotchas, code patterns, and shipped versions
  in milliseconds — file-based, zero infra, zero added cost; (b) OS-RAG runs inside the live app
  at accent-os.pages.dev backed by Supabase pgvector + tsvector hybrid search with reciprocal
  rank fusion, Anthropic-style contextual chunking at ingest, free 768-dim embeddings via
  Cloudflare Workers AI (bge-base-en-v1.5), and Claude Haiku reranking — wired into the existing
  Ask the Engine chat in module-knowledge so vendor data, customer SOPs, lighting rubrics,
  Internal Docs articles, and AccentOS reference data become first-class retrieval targets.
  Trigger phrases: "search the repo for", "did we ship", "find the gotcha for", "ground the
  answer in", "rag this", "what does the engine know about", "ingest into rag", "reindex rag",
  "rag-search", "build-rag", "os-rag". Use this skill any time Claude Code or AccentOS needs to
  ground a generation in retrieved AccentOS context rather than its own training data.
  Never use this skill for: short factual lookups already in CLAUDE.md, single-file edits where
  grep beats RAG, or generating fresh content the corpus has no business answering.
---

# accent-rag — Dual-Mode RAG for AccentOS

**Purpose.** Ground every AI generation (Claude Code session, Ask-the-Engine chat, Daily Brief commentary, future Quote AI Summary) in retrieved AccentOS context. Two surfaces, one skill, one mental model.

| Surface | Audience | Storage | Embeddings | Reranker | Generator |
|---|---|---|---|---|---|
| **BUILD-RAG** | Claude Code / Michael during build | Local JSON in `skills/accent-rag/.rag/` | Lexical BM25-lite (no embeddings needed) | None | Claude Code (the agent reading the chunks) |
| **OS-RAG** | AccentOS users · Ask the Engine · embedded chat | Supabase `rag_chunks` (pgvector + tsvector) | Cloudflare Workers AI `@cf/baai/bge-base-en-v1.5` (768-dim, free tier) | Claude Haiku (cheap, fast) | Claude Sonnet 4 |

Two surfaces share one skill because the *patterns* are identical (chunk → index → retrieve → rerank → assemble → ground) — only the storage and runtime differ.

---

## When to invoke

Run BUILD-RAG when:
- "search the repo for [topic]" / "did we already ship [feature]"
- "find the gotcha for [pattern]" / "have we hit this bug before"
- "what's the right [pattern] for AccentOS" / "rag this question"
- Resuming a session and needing prior context fast (cheaper than re-reading 10 files)
- Before implementing a new module — pull the closest 3 sibling modules' patterns

Run OS-RAG when:
- The user is in Ask the Engine with the **Internal** mode toggle
- A future module needs a "what do we know about X" lookup over operational data
- Ingesting a new corpus item (vendor playbook, scoring rubric, SOP) — uses the OS-RAG ingest path

Do **not** invoke for:
- A known file path (use `Read` directly)
- A grep target (use `grep` via Bash)
- Generating wholly new content the corpus shouldn't constrain (creative writing, fresh design)
- Customer-mode chat (privacy: customer mode never sees internal vendor/margin/score data — leave RAG off in customer mode)

---

## BUILD-RAG — local repo retrieval

### What it indexes
Walked once per ingest, hashed by content so re-indexing only re-chunks changed files:
- `MASTER.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `BUILD_INTELLIGENCE.md`
- `SESSION_LOG.md`, `PROMPT_LOG.md`, `WORK_IN_PROGRESS.md`, `KPI_CATALOG.md`, `MODULE_MODES.md`, `module_modes.json`
- All `js/*.js` modules
- All `sql/M*.sql` migrations
- `index.html` (chunked by `// ── SECTION ──` boundaries to keep modules together)
- All `skills/*/SKILL.md` and `skills/*/references/*.md`
- README.md

### Chunking rules
- **Markdown files**: split on `^## ` headings; keep heading + body together; cap at 600 tokens; overlap last 50 tokens of prev chunk.
- **JS files**: split on `^(async )?function ` boundaries; one function per chunk; keep imports/lets at the top of the first chunk.
- **SQL files**: split on `-- ──` separator if present, else by statement; one logical migration block per chunk.
- **index.html**: split on `// ── SECTION ──` markers (or `// ══` lines); modules treated as one chunk each.

Each chunk gets a `context` prefix (Anthropic Contextual Retrieval pattern) generated at ingest time:
> "From `[filepath]`, in the `[section/function name]` block: this chunk discusses `[1-sentence summary]`."
That prefix is **prepended to the searchable body** so a query like "vendor score persistence pattern" finds the right `sbSaveVendorScore` chunk even if the function body never says the word "persistence".

### Index format
`skills/accent-rag/.rag/build-index.json` — single JSON file:
```
{
  "version": "1",
  "indexed_at": "2026-05-05T...",
  "chunks": [
    {
      "id": "sha8",
      "path": "BUILD_INTELLIGENCE.md",
      "section": "1.4 CRM",
      "context": "From BUILD_INTELLIGENCE.md, in the 1.4 CRM section: discusses fallback to case-insensitive name match when UUID FK isn't wired.",
      "body": "<full chunk text>",
      "tokens": 380,
      "vendor_id": null,
      "tags": ["persistence", "customers", "tech-debt"]
    },
    ...
  ],
  "lex": {
    "<token>": [["chunk_id", tf], ...],
    ...
  },
  "df": { "<token>": doc_freq, ... },
  "n_docs": 1234,
  "avg_dl": 312.4
}
```
Lexical scoring is **BM25** with `k1=1.5, b=0.75`. Tokenization: lowercase, split on non-alphanumeric, drop stopwords from `references/build-rag-stopwords.txt`, keep length ≥ 2.

### CLI usage
```
# Build (or refresh) the index — chunks changed files only
python3 skills/accent-rag/scripts/rag_build_index.py

# Search the index — top-K chunks
python3 skills/accent-rag/scripts/rag_search.py "vendor score persistence pattern" --k 6

# Search with file-path filter
python3 skills/accent-rag/scripts/rag_search.py "RLS policy pattern" --path-prefix sql/

# Dump every chunk for debugging
python3 skills/accent-rag/scripts/rag_search.py --dump --path-prefix BUILD_INTELLIGENCE.md
```
Output: JSON array on stdout, ranked by BM25 score, each with `path`, `section`, `score`, `body`. Claude Code reads this output and uses it as grounding context.

### Wired into the AccentOS auto-execute
`.claude/CLAUDE.md` AUTO-EXECUTE step 4.5 (added in this session): after reading BUILD_INTELLIGENCE.md, when starting a non-trivial new build, run `python3 skills/accent-rag/scripts/rag_search.py "<task description>" --k 5` and apply the retrieved chunks as additional context.

---

## OS-RAG — Supabase-backed live retrieval

### Storage shape (see `sql/M42_rag_pgvector.sql`)
- Postgres extensions: `vector` (pgvector), `pg_trgm`
- Table: `rag_chunks`
  - `id uuid PK`
  - `source_type text` — 'article', 'vendor_playbook', 'scoring_rubric', 'lighting_ref', 'sop', 'master_doc', 'session_log', 'arbitrary'
  - `source_id text` — natural key back to the origin row (e.g. article slug, vendor_id)
  - `title text`, `body text`, `context text` (Anthropic contextual prefix)
  - `searchable text` — `context || ' ' || body` — the column tsvector + embedding cover
  - `tsv tsvector` — generated column over `searchable`
  - `embedding vector(768)` — bge-base-en-v1.5
  - `metadata jsonb` — visible_to_roles, vendor_id, tags, etc.
  - `pinned bool` — pinned chunks always surface in top-K
  - `chunk_index int`, `total_chunks int` — for re-assembling the source if needed
- Indexes: `GIN(tsv)`, `HNSW(embedding vector_cosine_ops)`, `btree(source_type)`, `btree(pinned)`
- RPC: `rag_hybrid_search(query_text text, query_embedding vector(768), match_count int, full_text_weight float, semantic_weight float, rrf_k int)` — returns top match_count chunks ranked by reciprocal rank fusion of BM25-style ts_rank + cosine distance.

### Ingest pipeline (Anthropic contextual pattern)
For each new corpus item:
1. **Chunk** body at 200–400 tokens, 50-token overlap (browser-side `js/rag.js` `_chunkText` helper).
2. **Contextualize** each chunk with one Claude Haiku call:
   ```
   System: You generate a short, neutral, factual context prefix for a chunk so it can be retrieved standalone.
   User: <whole document> ... <THE CHUNK>
   Assistant: One sentence: "From [doc title], in [section]: this chunk covers [topic]."
   ```
   Use prompt caching on the whole-document portion (cache TTL = ingest run) — slashes cost on multi-chunk docs.
3. **Embed** `context + ' ' + body` via Cloudflare Worker `/embed` (free Workers AI bge-base-en-v1.5).
4. **Insert** into `rag_chunks` via Supabase REST (`sbFetch`).

### Query pipeline (hybrid → rerank → answer)
1. **Embed query** via the same Cloudflare Worker.
2. **Retrieve** top 20 via `rag_hybrid_search` RPC (RRF combines tsv ranking + cosine).
3. **Rerank** top 20 with **one Claude Haiku call**: "Score each chunk 0–10 for relevance to: <query>. Return JSON array of {id, score}."
4. **Assemble** top 6 reranked chunks into the system prompt under a `<retrieved>` block.
5. **Generate** answer with Claude Sonnet 4 using the retrieved context.
6. **Cite** sources inline by `source_type:source_id` so the user can click through to the origin (article → Internal Docs viewer; vendor_playbook → vendor detail modal).

### Cloudflare Worker (`worker/embed-worker.js`)
- Endpoint: `POST /embed` body `{texts: ["...","..."]}` → `{vectors: [[...768], [...768]]}`
- Uses Cloudflare Workers AI binding `AI` and `@cf/baai/bge-base-en-v1.5`.
- CORS allow-list: `https://accent-os.pages.dev` + `https://accent-os-staging.pages.dev` + `http://localhost:*` (for Codespace preview).
- Hard cap 100 texts per request; 8KB per text.
- Auth: shared secret in `Authorization: Bearer <RAG_WORKER_SECRET>` header — saved in AccentOS Settings under `aos-rag-secret`.

### Browser client (`/home/user/accent-os/js/rag.js`)
- `ragConfigured()` — true when worker URL + secret + Supabase configured
- `ragEmbed(texts: string[])` — POST to worker `/embed`, returns `number[][]`
- `ragSearch(query, opts={k:6, sourceTypes:[]})` — embed + RPC + rerank, returns ranked chunks
- `ragAnswer(question, opts)` — full pipeline; returns `{answer, sources, usage}`
- `ragIngestText(item)` — chunk + contextualize + embed + insert
- `ragIngestArticle(article)` — convenience wrapper for Internal Docs articles
- `ragReindex(sourceType?)` — wipe + re-ingest a source type

### Wired into Ask the Engine
- In **Internal mode** with RAG configured: `sendChat()` calls `ragSearch()` first, prepends a `<context>...</context>` block of top-6 chunks to the system prompt, then makes the existing Anthropic call. Adds a "Grounded · 6 sources" pill above the answer; click expands the source list.
- In **Customer mode**: RAG is intentionally off (no internal data leakage).
- If RAG isn't configured (no worker URL set), Ask the Engine falls back to its current behaviour (pure model knowledge) — no break.

---

## Workflow — how to run this skill

### Phase 1 · BUILD-RAG (already wired into auto-execute)
1. **First-time install** (this session): index built once.
   ```
   python3 /home/user/accent-os/skills/accent-rag/scripts/rag_build_index.py
   ```
2. **Per-session refresh** (auto): added to `.claude/CLAUDE.md` AUTO-EXECUTE — runs after status.sh.
3. **Per-task search**: before implementing a new module, run:
   ```
   python3 skills/accent-rag/scripts/rag_search.py "<task description>" --k 5
   ```
   Read the top chunks. They contain prior pattern decisions, gotchas, and shipped sibling modules.

### Phase 2 · OS-RAG bring-up
1. **Run the SQL migration** (Michael, in Supabase SQL Editor): `sql/M42_rag_pgvector.sql`. Becomes Michael task **M42**.
2. **Deploy the Cloudflare Worker**: `cd skills/accent-rag/worker && wrangler deploy`. Worker URL goes into AccentOS Settings → "RAG Worker URL".
3. **Generate a worker secret**: `openssl rand -hex 32`. Set in worker (`wrangler secret put RAG_WORKER_SECRET`) and paste the same value into AccentOS Settings → "RAG Worker Secret".
4. **Seed the corpus**: open Knowledge Engine → Config tab → click "Seed RAG corpus". Calls `ragIngestText` for each entry in `skills/accent-rag/ingest-corpus/seed.json` (lighting reference, scoring rubrics, vendor playbooks, AccentOS SOPs).
5. **Test**: open Ask the Engine in Internal mode, ask "What's our vendor scoring rubric for IMAP enforcement?" — answer should include retrieved-source pill + cite the rubric chunk.

### Phase 3 · Ongoing
- New Internal Doc article saved → auto-ingested via `js/knowledge_hub.js` `sbSaveArticle` post-hook.
- New vendor playbook attached to vendor detail → auto-ingested.
- Quarterly `ragReindex('master_doc')` re-ingests MASTER.md so retrieval reflects the latest project state.

---

## Anti-patterns

- **Never** call OS-RAG from Customer mode — privacy violation (vendor / margin / score data leak risk).
- **Never** embed without contextualizing first — half the recall improvement comes from the context prefix.
- **Never** use cosine similarity alone — hybrid (BM25 + vector) recovers proper-noun / SKU-number queries that vector-only misses.
- **Never** rerank with Claude Sonnet — Haiku is 10× cheaper and almost as good for relevance scoring.
- **Never** skip the dedup step on ingest — a chunk's body hash must be checked before re-embedding (saves Worker AI quota).
- **Never** include retrieved chunks longer than 600 tokens each — assembly explodes the prompt and Claude starts ignoring the prompt instructions.
- **Never** ship without a "Grounded · N sources" UI marker — users need to know when an answer is grounded vs. model-only.
- **Never** ingest credential-bearing files (`.env`, anything from `_active.md`, sessionStorage dumps) — corpus is queryable from any role.
- **Never** rely on the Supabase MCP for ingest — it's still broken on `hsyjcrrazrzqngwkqsqa`. All ingest goes through `sbFetch` from the browser, or via the Worker proxy.

---

## Files in this skill

```
skills/accent-rag/
├── SKILL.md                                # this file
├── references/
│   ├── architecture.md                     # full architecture diagram + decision log
│   ├── build-rag.md                        # BUILD-RAG implementation notes
│   ├── os-rag.md                           # OS-RAG implementation notes
│   ├── contextual-prompt.md                # the Claude Haiku prompt for context generation
│   ├── build-rag-stopwords.txt             # stopword list for BM25 tokenization
│   └── ingest-prompt.md                    # ingest pipeline prompt templates
├── scripts/
│   ├── rag_build_index.py                  # walks repo → chunks → BM25 index → JSON
│   ├── rag_search.py                       # CLI search over the JSON index
│   └── rag_os_seed.py                      # one-shot OS-RAG seeder (calls Worker + Supabase)
├── worker/
│   ├── embed-worker.js                     # Cloudflare Worker: /embed + /rerank
│   ├── wrangler.toml.example
│   └── README.md
├── sql/
│   └── rag_pgvector.sql                    # mirrors sql/M42_rag_pgvector.sql in repo root
├── ingest-corpus/
│   └── seed.json                           # initial corpus entries (rubrics, SOPs, refs)
└── .rag/                                   # generated, gitignored
    └── build-index.json
```
