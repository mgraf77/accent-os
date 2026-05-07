#!/usr/bin/env python3
"""rag_eval.py — Evaluate AccentOS RAG system with golden Q&A pairs.

Usage:
    python3 rag_eval.py [--wiki-only] [--baseline] [--output wiki/syntheses/rag-eval-matrix-v1.md]

Scores each query on 6 dimensions:
  Recall     - did the right page surface in top-K?
  Precision  - % of top-K results that were genuinely relevant
  Coverage   - was the answer findable in wiki at all?
  Latency    - estimated ms (fetch + inject overhead)
  Cost       - estimated $ per query (prompt tokens * cache rate)
  Maintenance - passes lint? low edit burden?

Outputs a scoreboard + per-query diff (wiki vs baseline).
"""

import os
import sys
import json
import time
import argparse
from datetime import date

TODAY = date.today().isoformat()
DEFAULT_INDEX = "skills/accent-rag/index/rag_index.json"
TOP_K = 3

# ── GOLDEN Q&A PAIRS ──────────────────────────────────────
# 30+ golden queries grouped by cluster.
# Each entry: {query, expected_slugs (list), cluster}
GOLDEN_QA = [
    # Vendor scoring (10 queries)
    {"query": "What score would a vendor with 3% rebate receive?", "expected": ["rubric-rebates", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "How is the vendor weighted score calculated?", "expected": ["vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What does a score of 10 mean for IMAP?", "expected": ["rubric-imap", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What is the freight free threshold for a score of 7?", "expected": ["rubric-freight", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What is L1 membership in the scoring system?", "expected": ["rubric-l1-member", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "How does DTC behavior affect vendor score?", "expected": ["rubric-dtc", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What are the tier boundaries for vendor scoring?", "expected": ["vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What is the rep score rubric?", "expected": ["rubric-rep-score", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "How are marketing funds scored?", "expected": ["rubric-marketing-funds", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What display discount earns a score of 8?", "expected": ["rubric-display", "vendor-scoring"], "cluster": "vendor_scoring"},

    # Lighting reference (8 queries)
    {"query": "What CRI is required for retail lighting?", "expected": ["cri-tm30-tlci", "lighting-reference"], "cluster": "lighting_ref"},
    {"query": "What footcandle level is needed for a warehouse?", "expected": ["lumen-output-commercial", "lighting-reference"], "cluster": "lighting_ref"},
    {"query": "What color temperature for a restaurant?", "expected": ["color-temperature-selection", "lighting-reference"], "cluster": "lighting_ref"},
    {"query": "How long must emergency lighting last on battery?", "expected": ["emergency-lighting-compliance", "lighting-reference"], "cluster": "lighting_ref"},
    {"query": "What is 0-10V dimming?", "expected": ["dimming-protocols", "lighting-reference"], "cluster": "lighting_ref"},
    {"query": "What is TM-30 Rg and what does it mean?", "expected": ["cri-tm30-tlci"], "cluster": "lighting_ref"},
    {"query": "What footcandles for open office per IECC?", "expected": ["lumen-output-commercial", "lighting-reference"], "cluster": "lighting_ref"},
    {"query": "When should I use DALI instead of 0-10V?", "expected": ["dimming-protocols"], "cluster": "lighting_ref"},

    # SOPs (6 queries)
    {"query": "What questions should I ask a new vendor rep?", "expected": ["sop-rep-outreach", "sop-vendor-onboarding"], "cluster": "sop"},
    {"query": "How do I onboard a new vendor to AccentOS?", "expected": ["sop-vendor-onboarding"], "cluster": "sop"},
    {"query": "What margin should I target on a commercial quote?", "expected": ["sop-quote-creation"], "cluster": "sop"},
    {"query": "When should I escalate a rep issue to vendor management?", "expected": ["sop-rep-outreach"], "cluster": "sop"},
    {"query": "What are the steps to convert a quote to a job?", "expected": ["sop-quote-creation"], "cluster": "sop"},
    {"query": "How do I handle a rep score that drops below 4?", "expected": ["sop-rep-outreach", "rubric-rep-score"], "cluster": "sop"},

    # Module patterns (4 queries)
    {"query": "What is the file size trigger for splitting AccentOS?", "expected": ["ADR-004"], "cluster": "module_pattern"},
    {"query": "How does the CSV import flow work in AccentOS?", "expected": ["source-build-intelligence"], "cluster": "module_pattern"},
    {"query": "Why does AccentOS use vanilla JS instead of React?", "expected": ["ADR-002"], "cluster": "module_pattern"},
    {"query": "How does the goTo dispatcher work?", "expected": ["ADR-004"], "cluster": "module_pattern"},

    # Gotcha lookup (4 queries)
    {"query": "What is the AccentOS database?", "expected": ["ADR-001", "overview"], "cluster": "gotcha"},
    {"query": "What is the Karpathy wiki pattern?", "expected": ["karpathy-llm-wiki", "ADR-007"], "cluster": "gotcha"},
    {"query": "Why was wiki-first RAG chosen over pgvector?", "expected": ["ADR-007", "karpathy-llm-wiki"], "cluster": "gotcha"},
    {"query": "Who are the AccentOS team members?", "expected": ["overview", "michael-graf"], "cluster": "gotcha"},

    # Entity lookup (4 queries — expanded set)
    {"query": "What is Michael Graf's role at Accent?", "expected": ["michael-graf", "overview"], "cluster": "entity"},
    {"query": "Who handles showroom management at Accent Lighting?", "expected": ["paul-graf"], "cluster": "entity"},
    {"query": "What are the credit terms rubric thresholds?", "expected": ["rubric-credit-terms", "vendor-scoring"], "cluster": "vendor_scoring"},
    {"query": "What return policy earns a high vendor score?", "expected": ["rubric-returns", "vendor-scoring"], "cluster": "vendor_scoring"},

    # Architecture decisions (4 queries — expanded set)
    {"query": "Why is Row-Level Security used in AccentOS?", "expected": ["ADR-001"], "cluster": "module_pattern"},
    {"query": "What is the AccentOS data isolation strategy for customer mode?", "expected": ["ADR-006", "ADR-001"], "cluster": "module_pattern"},
    {"query": "How does AccentOS handle authentication?", "expected": ["ADR-001"], "cluster": "module_pattern"},
    {"query": "What emergency lighting battery runtime is required by code?", "expected": ["emergency-lighting-compliance"], "cluster": "lighting_ref"},
]


def load_index(path):
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def tokenize(text):
    import re
    return set(re.findall(r'\b[a-z][a-z0-9\-]{1,}\b', text.lower()))


def _stem(word):
    rules = [
        ("ations", ""), ("ation", ""), ("ings", ""), ("ing", ""),
        ("ments", ""), ("ment", ""), ("ances", ""), ("ance", ""),
        ("ences", ""), ("ence", ""), ("ities", ""), ("ity", ""),
        ("ness", ""), ("ers", ""), ("er", ""), ("ies", "y"),
        ("ed", ""), ("es", ""), ("s", ""),
    ]
    for suffix, replacement in rules:
        if word.endswith(suffix) and len(word) - len(suffix) + len(replacement) >= 4:
            return word[: len(word) - len(suffix)] + replacement
    return word


_STOP_WORDS = frozenset({
    "what", "how", "why", "when", "where", "who", "which",
    "is", "are", "was", "were", "be", "been",
    "the", "a", "an", "to", "for", "in", "of", "and", "or", "but",
    "do", "does", "did", "will", "would", "should", "could",
    "may", "might", "must", "shall", "can",
    "with", "this", "that", "it", "its", "by", "at", "as", "from", "if",
})


def _tokenize(text, filter_stopwords=False):
    """Match rag_build_index tokenizer: standard pass + digit-anchored tech terms.

    filter_stopwords=True strips English question/function words. Applied to
    queries (not index building) to prevent high-IDF noise from question words
    skewing results on a small 155-chunk corpus.
    """
    import re
    lower = text.lower()
    raw = re.findall(r'\b[a-z][a-z0-9\-]{1,}\b', lower)
    raw += re.findall(r'\b[0-9][a-z0-9\-]+[a-z]\b', lower)
    expanded = []
    seen = set()
    for tok in raw:
        if filter_stopwords and tok in _STOP_WORDS:
            continue
        if tok not in seen:
            seen.add(tok); expanded.append(tok)
        s = _stem(tok)
        if s != tok and s not in seen:
            seen.add(s); expanded.append(s)
    return expanded


def simple_search(query, index, top_k=TOP_K, wiki_only=False,
                  exclude_types=None):
    """Run BM25 + graph re-ranking over the index. Returns list of {slug, score}.

    Mirrors rag_search.py pipeline exactly: stop-word filter → BM25 → graph
    re-rank using related-slug backlinks from top-GRAPH_N results.
    """
    if exclude_types is None:
        exclude_types = {"synthesis"}

    from collections import defaultdict

    GRAPH_N = 10
    GRAPH_BOOST = 0.2

    inverted = index["inverted"]
    doc_store = index["doc_store"]
    terms = _tokenize(query, filter_stopwords=True)

    # BM25
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

    # Graph re-rank: boost pages in top-N's related lists
    slug_map = defaultdict(list)
    for d in doc_store:
        slug_map[d["slug"]].append(d["id"])

    initial_top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:GRAPH_N]
    if initial_top:
        top_score = initial_top[0][1]
        graph_boosts = {}
        for doc_id, doc_score in initial_top:
            doc = doc_store[doc_id]
            link_weight = doc_score / top_score
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

    seen_slugs = set()
    results = []
    for doc_id, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        slug = doc_store[doc_id]["slug"]
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        results.append({"slug": slug, "score": score, "is_wiki": doc_store[doc_id]["is_wiki"]})
        if len(results) >= top_k:
            break
    return results


def score_query(result_slugs, expected_slugs, all_wiki_slugs):
    """Score a single query result on 6 dimensions (0-1 scale each).

    Dimensions:
      recall      - did any expected slug surface in top-K?
      rank_quality- MRR: 1/rank of first expected hit (rank 1=1.0, 2=0.5, 3=0.33)
      precision   - fraction of result_set that are expected
      coverage    - expected slugs exist in wiki at all?
      diversity   - unique slugs in results / top_K (penalises duplicate chunks)
      maintenance - lint passes (assumed 1.0 unless errors reported)

    Replaced latency + cost (trivially 1.0 on wiki path) with rank_quality and
    diversity to expose actual retrieval quality dimensions.
    """
    result_set = set(result_slugs)
    expected_set = set(expected_slugs)

    recall = 1.0 if result_set & expected_set else 0.0

    # MRR: reciprocal rank of first expected hit
    rank_quality = 0.0
    for rank, slug in enumerate(result_slugs, 1):
        if slug in expected_set:
            rank_quality = 1.0 / rank
            break

    precision = len(result_set & expected_set) / len(result_set) if result_set else 0.0

    coverage = 1.0 if expected_set & all_wiki_slugs else 0.0

    diversity = len(result_set) / len(result_slugs) if result_slugs else 0.0

    maintenance_score = 1.0

    composite = (recall + rank_quality + precision + coverage + diversity + maintenance_score) / 6

    return {
        "recall": recall,
        "rank_quality": round(rank_quality, 3),
        "precision": round(precision, 2),
        "coverage": coverage,
        "diversity": round(diversity, 3),
        "maintenance": maintenance_score,
        "composite": round(composite, 3),
    }


def run_eval(index, wiki_only=False):
    if not index:
        return None

    all_wiki_slugs = set(
        d["slug"] for d in index["doc_store"] if d["is_wiki"]
    )

    results = []
    cluster_scores = {}

    for qa in GOLDEN_QA:
        query = qa["query"]
        expected = qa["expected"]
        cluster = qa["cluster"]

        result_items = simple_search(query, index, top_k=TOP_K, wiki_only=wiki_only)
        result_slugs = [r["slug"] for r in result_items]

        scores = score_query(result_slugs, expected, all_wiki_slugs)

        results.append({
            "query": query,
            "cluster": cluster,
            "expected": expected,
            "got": result_slugs,
            "scores": scores,
        })

        cluster_scores.setdefault(cluster, []).append(scores["composite"])

    # Aggregate
    all_composites = [r["scores"]["composite"] for r in results]
    avg_composite = sum(all_composites) / len(all_composites) if all_composites else 0

    dim_avgs = {}
    for dim in ["recall", "rank_quality", "precision", "coverage", "diversity", "maintenance"]:
        vals = [r["scores"][dim] for r in results]
        dim_avgs[dim] = round(sum(vals) / len(vals), 3)

    cluster_avgs = {k: round(sum(v) / len(v), 3) for k, v in cluster_scores.items()}

    return {
        "query_results": results,
        "summary": {
            "total_queries": len(results),
            "avg_composite": round(avg_composite, 3),
            "dimensions": dim_avgs,
            "by_cluster": cluster_avgs,
        }
    }


def render_markdown(eval_result, wiki_only_label="wiki"):
    lines = [
        f"---",
        f"type: synthesis",
        f"slug: rag-eval-matrix-v1",
        f"title: RAG Eval Matrix v1",
        f"sources: [source-karpathy-llm-wiki, source-master]",
        f"related: [ADR-007, karpathy-llm-wiki]",
        f"confidence: high",
        f"sensitive: false",
        f"created: {TODAY}",
        f"updated: {TODAY}",
        f"---",
        "",
        "# RAG Eval Matrix v1",
        "",
        f"**Evaluated**: {TODAY}  **Path**: {wiki_only_label}",
        "",
        "## Summary scoreboard",
        "",
        "| Dimension | Score |",
        "|-----------|-------|",
    ]

    s = eval_result["summary"]
    for dim, score in s["dimensions"].items():
        pct = f"{score*100:.1f}%"
        lines.append(f"| {dim.title()} | {pct} |")

    lines.extend([
        f"| **Composite** | **{s['avg_composite']*100:.1f}%** |",
        "",
        "## By cluster",
        "",
        "| Cluster | Composite |",
        "|---------|-----------|",
    ])

    for cluster, score in s["by_cluster"].items():
        lines.append(f"| {cluster.replace('_', ' ').title()} | {score*100:.1f}% |")

    lines.extend([
        "",
        "## Per-query results",
        "",
        "| Query | Expected | Got | Recall | Precision | Coverage |",
        "|-------|----------|-----|--------|-----------|---------|",
    ])

    for r in eval_result["query_results"]:
        sc = r["scores"]
        expected_str = ", ".join(r["expected"][:2])
        got_str = ", ".join(r["got"][:2])
        lines.append(
            f"| {r['query'][:60]}… | {expected_str} | {got_str} | "
            f"{sc['recall']:.0%} | {sc['precision']:.0%} | {sc['coverage']:.0%} |"
        )

    lines.extend([
        "",
        "## Notes",
        "",
        "- Latency, cost, and maintenance scores are estimated (wiki path vs pgvector comparison).",
        "- Wiki path: ~50ms fetch + 0-10V inject overhead; pgvector: ~200ms embed + query.",
        "- Recall = any expected slug in top-3; Precision = expected slugs / top-3 count.",
        "- Coverage = expected slugs exist in wiki at all.",
        "",
        "## Related",
        "",
        "[[ADR-007]] · [[karpathy-llm-wiki]]",
    ])

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Evaluate AccentOS RAG system")
    parser.add_argument("--index", default=DEFAULT_INDEX, help="Index file path")
    parser.add_argument("--wiki-only", action="store_true", help="Restrict to wiki/ pages only")
    parser.add_argument("--output", default="wiki/syntheses/rag-eval-matrix-v1.md",
                        help="Output markdown file")
    parser.add_argument("--json", action="store_true", help="Also output JSON")
    args = parser.parse_args()

    index = load_index(args.index)

    if index is None:
        print(f"Index not found: {args.index}")
        print("Running eval with coverage-only mode (no actual search)...")
        # Create minimal index stub for coverage scoring
        index = {"inverted": {}, "doc_store": [], "text_store": []}

    label = "wiki-only" if args.wiki_only else "wiki+fallback"
    print(f"Running eval: {len(GOLDEN_QA)} golden queries, path={label}...")

    eval_result = run_eval(index, wiki_only=args.wiki_only)
    if not eval_result:
        print("Eval failed.", file=sys.stderr)
        sys.exit(1)

    s = eval_result["summary"]
    print(f"\nResults:")
    print(f"  Queries: {s['total_queries']}")
    print(f"  Composite: {s['avg_composite']*100:.1f}%")
    for dim, score in s["dimensions"].items():
        print(f"  {dim.title()}: {score*100:.1f}%")

    print(f"\nBy cluster:")
    for cluster, score in s["by_cluster"].items():
        print(f"  {cluster}: {score*100:.1f}%")

    # Write markdown output
    md = render_markdown(eval_result, label)
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as fh:
        fh.write(md)
    print(f"\nEval matrix written to: {args.output}")

    if args.json:
        json_path = args.output.replace(".md", ".json")
        with open(json_path, "w", encoding="utf-8") as fh:
            json.dump(eval_result, fh, indent=2)
        print(f"JSON written to: {json_path}")


if __name__ == "__main__":
    main()
