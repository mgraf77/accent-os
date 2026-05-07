#!/usr/bin/env python3
"""rag_build_index.py — Build BM25 index over wiki/ pages.

Usage:
    python3 rag_build_index.py [--source wiki/] [--output skills/accent-rag/index/rag_index.json]
                               [--wiki-boost 1.3] [--include-sources]

Output:
    JSON file with BM25 inverted index + document store + build stats.
    Also writes rag_index_compact.json (no text_store, for browser-side scoring).

Chunking strategy: section-aware (split at ## headings). Each markdown section
stays atomic; sections > MAX_SECTION_WORDS fall back to word-count splitting.
This prevents rubric tables from splitting mid-row.

Type boosts replace flat wiki_boost: concept 1.5×, decision 1.4×, entity 1.2×,
module 1.1×, source 0.75×, synthesis 0.75× (source/synthesis are meta-content).

Graph re-ranking data: related: frontmatter field parsed and stored in doc_store
so rag_search.py can boost hub pages when their sub-pages score.
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
CHUNK_SIZE = 200       # words per word-count fallback chunk
CHUNK_OVERLAP = 40     # word overlap in fallback chunks
MAX_SECTION_WORDS = 300  # section size before fallback to word-count chunking
MIN_CHUNK_WORDS = 25   # sections shorter than this merge with the next section


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
    """Tokenizer with light suffix stemming. Emits both original and stem."""
    lower = text.lower()
    raw = re.findall(r'\b[a-z][a-z0-9\-]{1,}\b', lower)
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
    """Word-count fallback chunker used for oversized sections."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
        if i + chunk_size > len(words) and i < len(words):
            chunk = " ".join(words[i:])
            if chunk:
                chunks.append(chunk)
            break
    return chunks


def chunk_by_sections(text):
    """Section-aware chunking: split at markdown ## headings.

    Each ## section stays atomic unless it exceeds MAX_SECTION_WORDS, in which
    case it falls back to word-count splitting. Sections shorter than
    MIN_CHUNK_WORDS are merged into the following section.

    This prevents rubric/scoring tables from being sliced mid-row by a
    hard word-count boundary.
    """
    # Split at H1 or H2 headings (keep heading with its content)
    parts = re.split(r'(?=^#{1,2} )', text, flags=re.MULTILINE)
    parts = [p.strip() for p in parts if p.strip()]
    if not parts:
        return [text] if text.strip() else []

    chunks = []
    buffer = ""

    for part in parts:
        wc = len(part.split())
        if not buffer:
            buffer = part
        elif wc < MIN_CHUNK_WORDS:
            # Tiny section: absorb into buffer
            buffer += "\n\n" + part
        elif len(buffer.split()) + wc <= MAX_SECTION_WORDS:
            # Small section: merge with buffer to avoid micro-chunks
            buffer += "\n\n" + part
        else:
            # Emit buffer, start new
            buf_wc = len(buffer.split())
            if buf_wc >= MIN_CHUNK_WORDS:
                if buf_wc > MAX_SECTION_WORDS:
                    chunks.extend(chunk_text(buffer))
                else:
                    chunks.append(buffer)
            buffer = part

    # Flush remainder
    if buffer:
        buf_wc = len(buffer.split())
        if buf_wc >= MIN_CHUNK_WORDS:
            if buf_wc > MAX_SECTION_WORDS:
                chunks.extend(chunk_text(buffer))
            else:
                chunks.append(buffer)

    return chunks or ([text] if text.strip() else [])


def strip_frontmatter(content):
    if not content.startswith("---"):
        return content
    end = content.find("\n---", 3)
    if end == -1:
        return content
    return content[end + 4:].strip()


def parse_slug(filepath):
    with open(filepath, encoding="utf-8") as fh:
        content = fh.read()
    m = re.search(r'^slug:\s*(.+)$', content, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return os.path.splitext(os.path.basename(filepath))[0]


def parse_title(content):
    m = re.search(r'^title:\s*(.+)$', content, re.MULTILINE)
    if m:
        return m.group(1).strip().strip('"\'')
    return ""


def parse_type(content):
    m = re.search(r'^type:\s*(.+)$', content, re.MULTILINE)
    return m.group(1).strip() if m else "concept"


def parse_related(content):
    """Parse related: [slug1, slug2, ...] from frontmatter."""
    m = re.search(r'^related:\s*\[(.+)\]', content, re.MULTILINE)
    if m:
        return [s.strip() for s in m.group(1).split(',') if s.strip()]
    return []


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

    documents = []
    doc_id = 0

    for filepath in pages:
        with open(filepath, encoding="utf-8") as fh:
            raw = fh.read()

        slug = parse_slug(filepath)
        title = parse_title(raw)
        page_type = parse_type(raw)
        related = parse_related(raw)
        body = strip_frontmatter(raw)
        is_wiki = is_wiki_path(filepath, wiki_dir)

        chunks = chunk_by_sections(body)
        for i, chunk in enumerate(chunks):
            documents.append({
                "id": doc_id,
                "slug": slug,
                "title": title,
                "type": page_type,
                "related": related,       # stored for graph re-ranking in search
                "path": os.path.relpath(filepath),
                "is_wiki": is_wiki,
                "chunk_idx": i,
                "text": chunk,
            })
            doc_id += 1

    if not documents:
        print("No documents found. Check source directory.", file=sys.stderr)
        return None

    k1 = 1.5
    b = 0.75
    N = len(documents)

    tf = []
    doc_lengths = []
    for doc in documents:
        # Title repeated 3× for stronger title-match signal
        tokens = tokenize(doc["text"] + " " + " ".join([doc["title"]] * 3))
        freq = defaultdict(int)
        for t in tokens:
            freq[t] += 1
        tf.append(dict(freq))
        doc_lengths.append(len(tokens))

    avg_dl = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 1

    df = defaultdict(int)
    for freq in tf:
        for term in freq:
            df[term] += 1

    # Per-type boost. Source/synthesis pages are meta-content (provenance records,
    # build summaries) — keeping them low prevents source-master etc. from occupying
    # result slots meant for domain knowledge pages.
    _TYPE_BOOSTS = {
        "concept": 1.5,
        "decision": 1.4,
        "entity": 1.2,
        "module": 1.1,
        "source": 0.75,
        "synthesis": 0.75,
    }

    inverted = defaultdict(list)
    for doc_id_i, (doc, freq, dl) in enumerate(zip(documents, tf, doc_lengths)):
        if doc["is_wiki"]:
            boost = _TYPE_BOOSTS.get(doc["type"], wiki_boost)
        else:
            boost = 1.0
        for term, tf_val in freq.items():
            idf = math.log((N - df[term] + 0.5) / (df[term] + 0.5) + 1)
            tf_norm = (tf_val * (k1 + 1)) / (tf_val + k1 * (1 - b + b * dl / avg_dl))
            score = boost * idf * tf_norm
            inverted[term].append({"id": doc_id_i, "score": round(score, 4)})

    for term in inverted:
        inverted[term].sort(key=lambda x: x["score"], reverse=True)

    # IDF map for browser-side scoring (wikiGroundQuery)
    idf_map = {
        term: round(math.log((N - len(postings) + 0.5) / (len(postings) + 0.5) + 1), 4)
        for term, postings in inverted.items()
    }

    doc_store = [
        {
            "id": d["id"],
            "slug": d["slug"],
            "title": d["title"],
            "type": d["type"],
            "related": d["related"],
            "path": d["path"],
            "is_wiki": d["is_wiki"],
            "chunk_idx": d["chunk_idx"],
        }
        for d in documents
    ]

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
        "idf_map": idf_map,
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
                        help="BM25 score multiplier for wiki/ chunks (default 1.3, overridden by type boosts)")
    parser.add_argument("--include-sources", action="store_true",
                        help="Also index files outside wiki/ (e.g. MASTER.md excerpts)")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        print(f"Error: source directory '{args.source}' not found", file=sys.stderr)
        sys.exit(1)

    print(f"Building RAG index from {args.source}...")
    print(f"  Chunking: section-aware (## headings, max {MAX_SECTION_WORDS}w)")
    print(f"  Type boosts: concept 1.5×  decision 1.4×  entity 1.2×  module 1.1×  source 0.75×")

    index = build_index(args.source, args.source, args.wiki_boost, args.include_sources)
    if not index:
        sys.exit(1)

    out_dir = os.path.dirname(args.output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(index, fh, indent=2)

    # Compact index for browser-side BM25 scoring (no text_store)
    compact = {
        "meta": index["meta"],
        "idf_map": index["idf_map"],
        "inverted": index["inverted"],
        "doc_store": index["doc_store"],
    }
    compact_path = args.output.replace(".json", "_compact.json")
    with open(compact_path, "w", encoding="utf-8") as fh:
        json.dump(compact, fh)

    m = index["meta"]
    size_kb = os.path.getsize(args.output) / 1024
    compact_kb = os.path.getsize(compact_path) / 1024
    print(f"\nBuild complete:")
    print(f"  chunks: {m['wiki_docs']} wiki  {m['non_wiki_docs']} non-wiki")
    print(f"  vocabulary: {m['vocabulary_size']} terms")
    print(f"  avg chunk length: {m['avg_doc_length']} tokens")
    print(f"  full index: {size_kb:.1f}KB  ({args.output})")
    print(f"  compact index: {compact_kb:.1f}KB  ({compact_path})")


if __name__ == "__main__":
    main()
