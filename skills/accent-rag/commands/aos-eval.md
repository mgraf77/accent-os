# /aos-eval — Run the RAG evaluation matrix

**Trigger**: `/aos-eval [optional --wiki-only] [optional --baseline]`

## What it does

Runs the 30+ golden Q&A evaluation against the RAG system. Scores on 6 dimensions. Produces a scoreboard comparing wiki path vs pgvector path.

## Steps

```bash
python3 skills/accent-rag/scripts/rag_eval.py \
  [--wiki-only] \
  [--baseline pgvector] \
  --output wiki/syntheses/rag-eval-matrix-v1.md
```

## Evaluation dimensions

| Dimension | Description |
|-----------|-------------|
| Recall | Did the right wiki page surface in top-K? |
| Precision | % of top-K results that were genuinely relevant |
| Coverage | Was the answer findable at all in the wiki? |
| Latency | ms end-to-end (fetch + inject + response) |
| Cost | $ estimate (prompt-cache hit rate assumed) |
| Maintenance | lint passes? human edit burden? |

## Output

- Per-query scores: query → {wiki_score, pgvector_score, diff}
- Summary scoreboard: 6-dim matrix (wiki vs pgvector)
- Saved to `wiki/syntheses/rag-eval-matrix-v1.md`

## Golden Q&A clusters

- Vendor scoring: "What score would a vendor with 3% rebate get?" (10 queries)
- Lighting reference: "What CRI is needed for retail?" (8 queries)
- SOPs: "What questions do I ask a new rep?" (6 queries)
- Module patterns: "How does the csv import flow work?" (4 queries)
- Gotcha lookup: "What's the AccentOS file size trigger for splitting?" (4 queries)
