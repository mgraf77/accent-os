#!/usr/bin/env python3
"""
BUILD-RAG searcher — BM25 retrieval over the JSON index produced by rag_build_index.py.

Usage:
  python3 rag_search.py "vendor score persistence pattern" --k 6
  python3 rag_search.py "RLS policy" --path-prefix sql/
  python3 rag_search.py --dump --path-prefix BUILD_INTELLIGENCE.md
  python3 rag_search.py "csv import" --k 4 --format md   # markdown output for human reading

Stdout: JSON array (default) or markdown blocks. Stderr: human-readable progress.
"""
import argparse
import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path

DEFAULT_INDEX_PATH = (
    Path(__file__).resolve().parent.parent / ".rag" / "build-index.json"
)

# Reuse stopwords + tokenizer from the indexer to keep query-time identical.
STOPWORDS = set(
    """
a an and are as at be but by for from has have if in into is it its of on or s
that the their them then there these they this to was were will with you your
do does did done been being having were had n t i ll re ve d m so just we us
not no all any can may might should could would shall must about above below
after before again here when where which while who whom whose why how than
""".split()
)


def tokenize(text):
    text = text.lower()
    raw = re.findall(r"[a-z0-9]+", text)
    return [t for t in raw if len(t) >= 2 and t not in STOPWORDS]


def bm25_search(idx, query, k=6, path_prefix=None, source_filter=None):
    """BM25 ranking. k1=1.5, b=0.75. Optional path-prefix filter."""
    k1 = 1.5
    b = 0.75
    n_docs = idx.get("n_docs") or len(idx["chunks"])
    avg_dl = idx.get("avg_dl") or 1.0
    df = idx.get("df", {})
    doc_lens = idx.get("doc_lens", {})
    postings = idx.get("postings", {})
    chunks_by_id = {c["id"]: c for c in idx["chunks"]}

    q_tokens = tokenize(query)
    if not q_tokens:
        return []

    scores = defaultdict(float)
    for q in q_tokens:
        n_q = df.get(q)
        if not n_q:
            continue
        idf = math.log(1 + (n_docs - n_q + 0.5) / (n_q + 0.5))
        for cid, tf in postings.get(q, []):
            dl = doc_lens.get(cid, avg_dl)
            denom = tf + k1 * (1 - b + b * dl / avg_dl)
            scores[cid] += idf * (tf * (k1 + 1)) / denom

    items = []
    for cid, sc in scores.items():
        ch = chunks_by_id.get(cid)
        if not ch:
            continue
        if path_prefix and not ch["path"].startswith(path_prefix):
            continue
        items.append((sc, ch))
    items.sort(key=lambda r: -r[0])
    out = []
    for sc, ch in items[:k]:
        out.append(
            {
                "id": ch["id"],
                "path": ch["path"],
                "section": ch["section"],
                "score": round(sc, 4),
                "tokens": ch["tokens"],
                "context": ch["context"],
                "body": ch["body"],
            }
        )
    return out


def dump(idx, path_prefix=None):
    """Dump every chunk (optionally filtered by path prefix) for debugging."""
    out = []
    for ch in idx["chunks"]:
        if path_prefix and not ch["path"].startswith(path_prefix):
            continue
        out.append(
            {
                "id": ch["id"],
                "path": ch["path"],
                "section": ch["section"],
                "tokens": ch["tokens"],
                "context": ch["context"],
                "body": ch["body"][:400] + ("…" if len(ch["body"]) > 400 else ""),
            }
        )
    return out


def render_md(results, query):
    if not results:
        return f"_(no results for `{query}`)_\n"
    lines = [f"# accent-rag · {query}\n"]
    for i, r in enumerate(results, 1):
        lines.append(
            f"## {i}. `{r['path']}` · {r['section']}  · score {r['score']}\n"
        )
        lines.append(f"_{r['context']}_\n")
        body = r["body"]
        if len(body) > 1800:
            body = body[:1800] + "\n…(truncated)"
        lines.append(f"```\n{body}\n```\n")
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("query", nargs="*", help="Search query (omit with --dump)")
    p.add_argument("--k", type=int, default=6, help="Top K results to return")
    p.add_argument("--index", type=Path, default=DEFAULT_INDEX_PATH)
    p.add_argument("--path-prefix", default=None, help="Filter results by path prefix (e.g. 'sql/')")
    p.add_argument("--dump", action="store_true", help="Dump all chunks instead of searching")
    p.add_argument(
        "--format",
        choices=["json", "md"],
        default="json",
        help="Output format (default json)",
    )
    args = p.parse_args()

    if not args.index.exists():
        print(
            f"[rag] index not found at {args.index} — run rag_build_index.py first",
            file=sys.stderr,
        )
        sys.exit(2)
    idx = json.loads(args.index.read_text(encoding="utf-8"))

    if args.dump:
        results = dump(idx, path_prefix=args.path_prefix)
        if args.format == "md":
            print(render_md(results, "(dump)"))
        else:
            print(json.dumps(results, ensure_ascii=False, indent=2))
        return

    query = " ".join(args.query).strip()
    if not query:
        print("[rag] no query provided. Use --dump to inspect.", file=sys.stderr)
        sys.exit(2)

    results = bm25_search(idx, query, k=args.k, path_prefix=args.path_prefix)
    if args.format == "md":
        print(render_md(results, query))
    else:
        print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
