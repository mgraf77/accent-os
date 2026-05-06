# /aos-build — Build the RAG index

**Trigger**: `/aos-build`

## What it does

Runs the BUILD-RAG toolchain: builds a BM25 + optional dense index over all wiki pages and source files. Produces an index artifact usable by rag_search.py.

## Steps

```bash
python3 skills/accent-rag/scripts/wiki_lint.py
# Fix any errors first

python3 skills/accent-rag/scripts/rag_build_index.py \
  --source wiki/ \
  --output skills/accent-rag/index/rag_index.json \
  --wiki-boost 1.3
```

## Output

- `skills/accent-rag/index/rag_index.json`: BM25 inverted index with term frequencies
- `skills/accent-rag/index/build_report.json`: stats (pages indexed, chunk count, build time)

## Notes

- Wiki chunks get 1.3× BM25 score multiplier (per ADR-007)
- Does not require Supabase — pure local Python
- Re-run after every wiki ingest batch
- `--wiki-only` flag on rag_search.py restricts queries to wiki/ chunks

## Example output

```
Built RAG index:
  wiki/ pages: 32
  total chunks: 187
  wiki chunks: 152 (81%)
  index size: 1.2MB
  build time: 0.8s
```
