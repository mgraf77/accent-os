#!/usr/bin/env python3
"""rag_search.py — Query the BM25 RAG index.

Usage:
    python3 rag_search.py "what rebate does a 3% program score"
    python3 rag_search.py --wiki-only "CRI for retail"
    python3 rag_search.py --top-k 5 --json "emergency lighting battery"
    python3 rag_search.py --include-synthesis "rag eval recall"

Requires: skills/accent-rag/index/rag_index.json (built by rag_build_index.py)

Search pipeline:
  1. Tokenize query (stop word filter, stemmer)
  2. BM25 scoring over inverted index
  3. Graph re-ranking: boost pages whose slug appears in top-10 results'
     related-field lists (surfaces hub pages like vendor-scoring alongside
     specific sub-pages like rubric-rebates)
  4. Return top-K unique-slug results with snippets
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
SNIPPET_LEN = 150

DEFAULT_EXCLUDE_TYPES = {"synthesis"}

# English question/function words stripped from queries. These have high IDF in
# a 155-chunk corpus (~2.4 for "what") because wiki prose is declarative, not
# interrogative. A page containing Q&A text ("What protocol? ... required...")
# would otherwise score a false positive on any question-word query.
STOP_WORDS = frozenset({
    "what", "how", "why", "when", "where", "who", "which",
    "is", "are", "was", "were", "be", "been",
    "the", "a", "an", "to", "for", "in", "of", "and", "or", "but",
    "do", "does", "did", "will", "would", "should", "could",
    "may", "might", "must", "shall", "can",
    "with", "this", "that", "it", "its", "by", "at", "as", "from", "if",
})

# Graph re-ranking: after BM25 scoring, boost pages mentioned in the top-N
# results' related-field lists. Controlled by:
#   GRAPH_N       how many top results to read related-links from
#   GRAPH_BOOST   fraction of top-score added per related-link (per result)
GRAPH_N = 10
GRAPH_BOOST = 0.2


_STEM_RULES = [
    ("ations", ""), ("ation", ""), ("ings", ""), ("ing", ""),
    ("ments", ""), ("ment", ""), ("ances", ""), ("ance", ""),
    ("ences", ""), ("ence", ""), ("ities", ""), ("ity", ""),
    ("ness", ""), ("ers", ""), ("er", ""), ("ies", "y"),
    ("ed", ""), ("es", ""), ("s", ""),
]


def stem(word):
    for suffix, replacement in _STEM_RULES:
        if word.endswith(suffix) and len(word) - len(suffix) + len(replacement) >= 4:
            return word[: len(word) - len(suffix)] + replacement
    return word


def tokenize(text, do_stem=True):
    lower = text.lower()
    raw = re.findall(r'\b[a-z][a-z0-9\-]{1,}\b', lower)
    raw += re.findall(r'\b[0-9][a-z0-9\-]+[a-z]\b', lower)
    if not do_stem:
        return list(dict.fromkeys(raw))
    expanded = []
    seen = set()
    for tok in raw:
        if tok not in seen:
            seen.add(tok); expanded.append(tok)
        s = stem(tok)
        if s != tok and s not in seen:
            seen.add(s); expanded.append(s)
    return expanded


def load_index(index_path):
    with open(index_path, encoding="utf-8") as fh:
        return json.load(fh)


def _build_slug_map(doc_store):
    """slug → list of chunk doc_ids. Built once per loaded index."""
    slug_map = defaultdict(list)
    for doc in doc_store:
        slug_map[doc["slug"]].append(doc["id"])
    return dict(slug_map)


def search(query, index, top_k=DEFAULT_TOP_K, wiki_only=False,
           exclude_types=None, slug_map=None):
    if exclude_types is None:
        exclude_types = DEFAULT_EXCLUDE_TYPES

    terms = [t for t in tokenize(query) if t not in STOP_WORDS]
    if not terms:
        return []

    inverted = index["inverted"]
    doc_store = index["doc_store"]
    text_store = index["text_store"]

    # ── Stage 1: BM25 scoring ────────────────────────────────────────────────
    scores = defaultdict(float)
    for term in terms:
        for posting in inverted.get(term, []):
            doc_id = posting["id"]
            doc = doc_store[doc_id]
            if wiki_only and not doc["is_wiki"]:
                continue
            if exclude_types and doc.get("type") in exclude_types:
                continue
            scores[doc_id] += posting["score"]

    if not scores:
        return []

    # ── Stage 2: Graph re-ranking ────────────────────────────────────────────
    # Read related-links from top-N BM25 results and boost any indexed page
    # whose slug appears in those lists. This surfaces hub pages (vendor-scoring,
    # lighting-reference) alongside the specific sub-pages that scored highest.
    if slug_map is None:
        slug_map = _build_slug_map(doc_store)

    initial_top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:GRAPH_N]
    if initial_top:
        top_score = initial_top[0][1]
        # Use per-chunk MAX boost (not sum) to prevent hub-page runaway when many
        # sub-pages all link to the same hub (e.g. 14 rubric pages → vendor-scoring).
        graph_boosts = {}
        for doc_id, doc_score in initial_top:
            doc = doc_store[doc_id]
            link_weight = doc_score / top_score  # 1.0 for rank-1, smaller for lower ranks
            for rel_slug in doc.get("related", []):
                boost_amount = link_weight * GRAPH_BOOST * top_score
                for chunk_id in slug_map.get(rel_slug, []):
                    chunk = doc_store[chunk_id]
                    if exclude_types and chunk.get("type") in exclude_types:
                        continue
                    if boost_amount > graph_boosts.get(chunk_id, 0.0):
                        graph_boosts[chunk_id] = boost_amount
        for chunk_id, boost in graph_boosts.items():
            scores[chunk_id] = scores.get(chunk_id, 0.0) + boost

    # ── Stage 3: Rank and return unique-slug results ─────────────────────────
    seen_slugs = set()
    results = []
    for doc_id, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        doc = doc_store[doc_id]
        if doc["slug"] in seen_slugs:
            continue
        seen_slugs.add(doc["slug"])
        text = text_store[doc_id]
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
        if len(results) >= top_k:
            break

    return results


def make_snippet(text, terms, max_len):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    best = ""
    best_hits = -1
    for sent in sentences:
        hits = sum(1 for t in terms if t in sent.lower())
        if hits > best_hits:
            best_hits = hits
            best = sent
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
    parser.add_argument("--wiki-only", action="store_true")
    parser.add_argument("--include-synthesis", action="store_true",
                        help="Include synthesis pages (excluded by default)")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    exclude_types = set() if args.include_synthesis else DEFAULT_EXCLUDE_TYPES

    if not args.query:
        print("AccentOS RAG search. Enter query (Ctrl+C to exit):")
        try:
            index = None
            slug_map = None
            while True:
                query = input("> ").strip()
                if not query:
                    continue
                if not os.path.exists(args.index):
                    print(f"Index not found: {args.index}. Run rag_build_index.py first.")
                    continue
                if index is None:
                    index = load_index(args.index)
                    slug_map = _build_slug_map(index["doc_store"])
                results = search(query, index, args.top_k, args.wiki_only, exclude_types, slug_map)
                print(format_results(results, query))
        except (KeyboardInterrupt, EOFError):
            print("\nBye.")
        return

    if not os.path.exists(args.index):
        print(f"Index not found: {args.index}. Run rag_build_index.py first.", file=sys.stderr)
        sys.exit(1)

    index = load_index(args.index)
    slug_map = _build_slug_map(index["doc_store"])
    results = search(args.query, index, args.top_k, args.wiki_only, exclude_types, slug_map)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(format_results(results, args.query))


if __name__ == "__main__":
    main()
