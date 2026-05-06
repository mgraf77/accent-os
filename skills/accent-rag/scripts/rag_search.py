#!/usr/bin/env python3
"""rag_search.py — Query the BM25 RAG index.

Usage:
    python3 rag_search.py "what rebate does a 3% program score"
    python3 rag_search.py --wiki-only "CRI for retail"
    python3 rag_search.py --top-k 5 --json "emergency lighting battery"

Requires: skills/accent-rag/index/rag_index.json (built by rag_build_index.py)
"""

import os
import re
import sys
import json
import math
import argparse
from collections import defaultdict

DEFAULT_INDEX = "skills/accent-rag/index/rag_index.json"
DEFAULT_TOP_K = 3
SNIPPET_LEN = 150  # chars


def tokenize(text):
    return re.findall(r'\b[a-z][a-z0-9\-]{1,}\b', text.lower())


def load_index(index_path):
    with open(index_path, encoding="utf-8") as fh:
        return json.load(fh)


def search(query, index, top_k=DEFAULT_TOP_K, wiki_only=False):
    terms = tokenize(query)
    if not terms:
        return []

    inverted = index["inverted"]
    doc_store = index["doc_store"]
    text_store = index["text_store"]

    # Accumulate BM25 scores per document
    scores = defaultdict(float)
    for term in terms:
        postings = inverted.get(term, [])
        for posting in postings:
            doc_id = posting["id"]
            doc = doc_store[doc_id]
            if wiki_only and not doc["is_wiki"]:
                continue
            scores[doc_id] += posting["score"]

    if not scores:
        return []

    # Sort by score descending
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

    results = []
    for doc_id, score in ranked:
        doc = doc_store[doc_id]
        text = text_store[doc_id]
        # Snippet: find best sentence containing query terms
        snippet = make_snippet(text, terms, SNIPPET_LEN)
        results.append({
            "slug": doc["slug"],
            "title": doc["title"],
            "type": doc["type"],
            "path": doc["path"],
            "is_wiki": doc["is_wiki"],
            "chunk_idx": doc["chunk_idx"],
            "score": round(score, 3),
            "snippet": snippet,
        })

    return results


def make_snippet(text, terms, max_len):
    """Extract a snippet from text that contains the most query terms."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    best = ""
    best_hits = -1
    for sent in sentences:
        hits = sum(1 for t in terms if t in sent.lower())
        if hits > best_hits:
            best_hits = hits
            best = sent
    # Truncate
    if len(best) > max_len:
        best = best[:max_len].rsplit(" ", 1)[0] + "…"
    return best


def format_results(results, query):
    if not results:
        return f"No results found for: {query}"

    lines = [f"Search: \"{query}\"  ({len(results)} results)\n"]
    for i, r in enumerate(results, 1):
        wiki_tag = "wiki" if r["is_wiki"] else "source"
        lines.append(f"{i}. **{r['title']}** ({r['slug']}) [{wiki_tag}] score={r['score']}")
        lines.append(f"   {r['snippet']}")
        lines.append(f"   Path: {r['path']}")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Query AccentOS RAG index")
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--index", default=DEFAULT_INDEX, help="Index file path")
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K, help="Number of results")
    parser.add_argument("--wiki-only", action="store_true", help="Restrict to wiki/ pages only")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    if not args.query:
        # Interactive mode
        print("AccentOS RAG search. Enter query (Ctrl+C to exit):")
        try:
            while True:
                query = input("> ").strip()
                if not query:
                    continue
                if not os.path.exists(args.index):
                    print(f"Index not found: {args.index}. Run rag_build_index.py first.")
                    continue
                index = load_index(args.index)
                results = search(query, index, args.top_k, args.wiki_only)
                print(format_results(results, query))
        except (KeyboardInterrupt, EOFError):
            print("\nBye.")
        return

    if not os.path.exists(args.index):
        print(f"Index not found: {args.index}. Run rag_build_index.py first.", file=sys.stderr)
        sys.exit(1)

    index = load_index(args.index)
    results = search(args.query, index, args.top_k, args.wiki_only)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(format_results(results, args.query))


if __name__ == "__main__":
    main()
