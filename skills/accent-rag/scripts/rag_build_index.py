#!/usr/bin/env python3
"""rag_build_index.py — Build BM25 index over wiki/ pages.

Usage:
    python3 rag_build_index.py [--source wiki/] [--output skills/accent-rag/index/rag_index.json]
                               [--wiki-boost 1.3] [--include-sources]

Output:
    JSON file with BM25 inverted index + document store + build stats.

Wiki chunks get wiki_boost multiplier on BM25 scores (default 1.3x per ADR-007).
"""

import os
import re
import sys
import json
import math
import argparse
from datetime import date
from collections import defaultdict

TODAY = date.today().isoformat()
CHUNK_SIZE = 200  # words per chunk
CHUNK_OVERLAP = 40  # word overlap between chunks


_STEM_RULES = [
    ("ations", ""), ("ation", ""), ("ings", ""), ("ing", ""),
    ("ments", ""), ("ment", ""), ("ances", ""), ("ance", ""),
    ("ences", ""), ("ence", ""), ("ities", ""), ("ity", ""),
    ("ness", ""), ("ers", ""), ("er", ""), ("ies", "y"),
    ("ed", ""), ("es", ""), ("s", ""),
]


def _stem(word):
    for suffix, replacement in _STEM_RULES:
        if word.endswith(suffix) and len(word) - len(suffix) + len(replacement) >= 4:
            return word[: len(word) - len(suffix)] + replacement
    return word


def tokenize(text):
    """Tokenizer with light suffix stemming. Emits both original and stem.

    Two-pass extraction:
    1. Standard: tokens starting with [a-z] (e.g. "dali", "footcandle")
    2. Tech-term: digit-anchored tokens like "0-10v", "2700k", "10v" that
       appear in lighting/product specs and must not be dropped.
    """
    lower = text.lower()
    raw = re.findall(r'\b[a-z][a-z0-9\-]{1,}\b', lower)
    # Capture tech terms: digit + mixed alnum, ends with a letter (e.g. 10v, 0-10v, 2700k)
    raw += re.findall(r'\b[0-9][a-z0-9\-]+[a-z]\b', lower)
    expanded = []
    seen = set()
    for tok in raw:
        if tok not in seen:
            seen.add(tok)
            expanded.append(tok)
        s = _stem(tok)
        if s != tok and s not in seen:
            seen.add(s)
            expanded.append(s)
    return expanded


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping word chunks."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
        if i + chunk_size > len(words) and i < len(words):
            # Final partial chunk
            chunk = " ".join(words[i:])
            if chunk:
                chunks.append(chunk)
            break
    return chunks


def strip_frontmatter(content):
    """Remove YAML frontmatter from markdown content."""
    if not content.startswith("---"):
        return content
    end = content.find("\n---", 3)
    if end == -1:
        return content
    return content[end + 4:].strip()


def parse_slug(filepath):
    """Extract slug from frontmatter or filename."""
    with open(filepath, encoding="utf-8") as fh:
        content = fh.read()
    m = re.search(r'^slug:\s*(.+)$', content, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return os.path.splitext(os.path.basename(filepath))[0]


def parse_title(content):
    m = re.search(r'^title:\s*(.+)$', content, re.MULTILINE)
    if m:
        val = m.group(1).strip()
        # Remove YAML quotes
        return val.strip('"\'')
    return ""


def parse_type(content):
    m = re.search(r'^type:\s*(.+)$', content, re.MULTILINE)
    return m.group(1).strip() if m else "concept"


def is_wiki_path(filepath, wiki_dir):
    return os.path.abspath(filepath).startswith(os.path.abspath(wiki_dir))


def find_pages(source_dir):
    pages = []
    skip_files = {"index.md", "log.md", "hot.md", "CLAUDE.md"}
    for root, dirs, files in os.walk(source_dir):
        for f in files:
            if f.endswith(".md") and f not in skip_files:
                pages.append(os.path.join(root, f))
    return pages


def build_index(source_dir, wiki_dir, wiki_boost, include_sources=False):
    pages = find_pages(source_dir)

    documents = []  # {id, slug, title, type, path, is_wiki, chunk_idx, text}
    doc_id = 0

    for filepath in pages:
        with open(filepath, encoding="utf-8") as fh:
            raw = fh.read()

        slug = parse_slug(filepath)
        title = parse_title(raw)
        page_type = parse_type(raw)
        body = strip_frontmatter(raw)
        is_wiki = is_wiki_path(filepath, wiki_dir)

        chunks = chunk_text(body)
        for i, chunk in enumerate(chunks):
            documents.append({
                "id": doc_id,
                "slug": slug,
                "title": title,
                "type": page_type,
                "path": os.path.relpath(filepath),
                "is_wiki": is_wiki,
                "chunk_idx": i,
                "text": chunk,
            })
            doc_id += 1

    if not documents:
        print("No documents found. Check source directory.", file=sys.stderr)
        return None

    # Build BM25 components
    # TF-IDF with BM25 parameters
    k1 = 1.5
    b = 0.75
    N = len(documents)

    # Term frequencies per document
    tf = []
    doc_lengths = []
    for doc in documents:
        tokens = tokenize(doc["text"] + " " + doc["title"])
        freq = defaultdict(int)
        for t in tokens:
            freq[t] += 1
        tf.append(dict(freq))
        doc_lengths.append(len(tokens))

    avg_dl = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 1

    # Document frequencies
    df = defaultdict(int)
    for freq in tf:
        for term in freq:
            df[term] += 1

    # Build inverted index: term -> [{doc_id, bm25_score}]
    inverted = defaultdict(list)
    for doc_id_i, (doc, freq, dl) in enumerate(zip(documents, tf, doc_lengths)):
        boost = wiki_boost if doc["is_wiki"] else 1.0
        for term, tf_val in freq.items():
            idf = math.log((N - df[term] + 0.5) / (df[term] + 0.5) + 1)
            tf_norm = (tf_val * (k1 + 1)) / (tf_val + k1 * (1 - b + b * dl / avg_dl))
            score = boost * idf * tf_norm
            inverted[term].append({"id": doc_id_i, "score": round(score, 4)})

    # Sort postings by score descending
    for term in inverted:
        inverted[term].sort(key=lambda x: x["score"], reverse=True)

    # Document store (without full text to keep index compact)
    doc_store = [
        {
            "id": d["id"],
            "slug": d["slug"],
            "title": d["title"],
            "type": d["type"],
            "path": d["path"],
            "is_wiki": d["is_wiki"],
            "chunk_idx": d["chunk_idx"],
        }
        for d in documents
    ]

    # Full text store (needed for snippet generation)
    text_store = [d["text"] for d in documents]

    wiki_count = sum(1 for d in documents if d["is_wiki"])

    index = {
        "meta": {
            "built": TODAY,
            "total_docs": N,
            "wiki_docs": wiki_count,
            "non_wiki_docs": N - wiki_count,
            "wiki_boost": wiki_boost,
            "avg_doc_length": round(avg_dl, 1),
            "vocabulary_size": len(inverted),
        },
        "inverted": dict(inverted),
        "doc_store": doc_store,
        "text_store": text_store,
    }

    return index


def main():
    parser = argparse.ArgumentParser(description="Build BM25 index over wiki pages")
    parser.add_argument("--source", default="wiki/", help="Source directory (wiki/)")
    parser.add_argument("--output", default="skills/accent-rag/index/rag_index.json",
                        help="Output index file path")
    parser.add_argument("--wiki-boost", type=float, default=1.3,
                        help="BM25 score multiplier for wiki/ chunks (default 1.3)")
    parser.add_argument("--include-sources", action="store_true",
                        help="Also index files outside wiki/ (e.g. MASTER.md excerpts)")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        print(f"Error: source directory '{args.source}' not found", file=sys.stderr)
        sys.exit(1)

    print(f"Building RAG index from {args.source}...")
    print(f"  Wiki boost: {args.wiki_boost}x")

    index = build_index(args.source, args.source, args.wiki_boost, args.include_sources)
    if not index:
        sys.exit(1)

    # Ensure output directory exists
    out_dir = os.path.dirname(args.output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(index, fh, indent=2)

    m = index["meta"]
    print(f"\nBuild complete:")
    print(f"  wiki/ pages: {m['wiki_docs']} chunks")
    print(f"  non-wiki chunks: {m['non_wiki_docs']}")
    print(f"  vocabulary: {m['vocabulary_size']} terms")
    print(f"  avg doc length: {m['avg_doc_length']} tokens")
    print(f"  output: {args.output}")
    size_kb = os.path.getsize(args.output) / 1024
    print(f"  index size: {size_kb:.1f}KB")


if __name__ == "__main__":
    main()
