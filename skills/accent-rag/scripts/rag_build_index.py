#!/usr/bin/env python3
"""
BUILD-RAG indexer — walks the AccentOS repo, chunks files by structural boundary,
generates a contextual prefix per chunk, and writes a BM25-ready JSON index.

Usage:
  python3 rag_build_index.py                    # index full repo
  python3 rag_build_index.py --root /path/...   # custom root
  python3 rag_build_index.py --quiet            # suppress per-file output

No external dependencies. Pure stdlib so this runs in any Codespace / Claude Code
environment without pip install.
"""
import argparse
import hashlib
import json
import math
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

# ── Defaults ─────────────────────────────────────────────────────────────────
DEFAULT_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # repo root
DEFAULT_INDEX_PATH = (
    Path(__file__).resolve().parent.parent / ".rag" / "build-index.json"
)

# Files to index. Globs evaluated relative to repo root.
INCLUDE_GLOBS = [
    "MASTER.md",
    "BUILD_PLAN_CLAUDE.md",
    "BUILD_PLAN_MICHAEL.md",
    "BUILD_INTELLIGENCE.md",
    "SESSION_LOG.md",
    "PROMPT_LOG.md",
    "WORK_IN_PROGRESS.md",
    "KPI_CATALOG.md",
    "MODULE_MODES.md",
    "module_modes.json",
    "README.md",
    "PROMPT_QUEUE.md",
    "index.html",
    "js/*.js",
    "sql/*.sql",
    "skills/*/SKILL.md",
    "skills/*/references/*.md",
    "skills/*/MODES.md",
    "skills/vibe-speak/modes/*.md",
    "skills/vibe-speak/profiles/*.md",
]

# Files to skip even if matched (e.g. credential-bearing or noisy).
EXCLUDE_PATTERNS = [
    r"^\.rag/",
    r"^\.claude/settings\.local\.json$",
    r"_active\.md$",
    r"\.env",
    r"node_modules/",
    r"\.git/",
]

CHUNK_TARGET_TOKENS = 500
CHUNK_MAX_TOKENS = 700
CHUNK_OVERLAP_TOKENS = 60

# Approximate: 1 token ≈ 4 chars for English.
def approx_tokens(text):
    return max(1, len(text) // 4)


# ── Tokenizer + stopwords ────────────────────────────────────────────────────
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
    # Keep alphanumerics (letters, digits, underscore retained as separator)
    raw = re.findall(r"[a-z0-9]+", text)
    out = []
    for t in raw:
        if len(t) < 2:
            continue
        if t in STOPWORDS:
            continue
        out.append(t)
    return out


# ── Chunkers ─────────────────────────────────────────────────────────────────
def chunk_markdown(text, path):
    """Split on ## headings. Keep heading + body together. Cap chunks."""
    lines = text.split("\n")
    chunks = []
    cur_section = "(intro)"
    cur_buf = []

    def flush():
        if not cur_buf:
            return
        body = "\n".join(cur_buf).strip()
        if not body:
            return
        # Sub-split if too long
        if approx_tokens(body) > CHUNK_MAX_TOKENS:
            for sub in _slide_chunks(body, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
                chunks.append({"section": cur_section, "body": sub})
        else:
            chunks.append({"section": cur_section, "body": body})

    for ln in lines:
        m = re.match(r"^(#{1,3})\s+(.*)$", ln)
        if m:
            flush()
            cur_buf = [ln]
            cur_section = m.group(2).strip()[:120]
        else:
            cur_buf.append(ln)
    flush()
    return chunks


def chunk_js(text, path):
    """Split on top-level (async )?function declarations."""
    chunks = []
    # Capture leading non-function block (imports, lets, consts)
    func_re = re.compile(r"^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(", re.MULTILINE)
    matches = list(func_re.finditer(text))
    if not matches:
        # Whole file as one or more sliding chunks
        for sub in _slide_chunks(text, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
            chunks.append({"section": "(module-body)", "body": sub})
        return chunks
    # Header before first function
    if matches[0].start() > 0:
        head = text[: matches[0].start()].strip()
        if head:
            for sub in _slide_chunks(head, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
                chunks.append({"section": "(top-of-module)", "body": sub})
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        section = f"function {m.group(1)}"
        if approx_tokens(body) > CHUNK_MAX_TOKENS:
            for sub in _slide_chunks(body, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
                chunks.append({"section": section, "body": sub})
        else:
            chunks.append({"section": section, "body": body})
    return chunks


def chunk_sql(text, path):
    """Split on `-- ──` separator if present, else by `;`-terminated statements."""
    chunks = []
    if "-- ──" in text or "-- ════" in text:
        parts = re.split(r"^-- (?:──|════).*$", text, flags=re.MULTILINE)
        for i, part in enumerate(parts):
            body = part.strip()
            if not body:
                continue
            section = f"block {i+1}"
            # First line often comments the section
            first = body.split("\n", 1)[0][:120]
            if first.startswith("--"):
                section = first.lstrip("- ").strip()[:120]
            if approx_tokens(body) > CHUNK_MAX_TOKENS:
                for sub in _slide_chunks(body, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
                    chunks.append({"section": section, "body": sub})
            else:
                chunks.append({"section": section, "body": body})
        return chunks
    # Fall back to slide
    for sub in _slide_chunks(text, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
        chunks.append({"section": "(sql)", "body": sub})
    return chunks


def chunk_html(text, path):
    """Split on the `// ── SECTION ──` markers used throughout index.html."""
    # Find all section markers
    sections = re.split(r"(// ── [^\n]+\n// ══[^\n]+)", text)
    chunks = []
    cur_section = "(top)"
    cur_buf = []

    def flush():
        if not cur_buf:
            return
        body = "".join(cur_buf).strip()
        if not body:
            return
        if approx_tokens(body) > CHUNK_MAX_TOKENS:
            for sub in _slide_chunks(body, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
                chunks.append({"section": cur_section, "body": sub})
        else:
            chunks.append({"section": cur_section, "body": body})

    for piece in sections:
        if not piece:
            continue
        if piece.startswith("// ── "):
            flush()
            cur_buf = [piece]
            m = re.search(r"// ── (.+?) ──", piece)
            cur_section = (m.group(1) if m else "(section)").strip()[:120]
        else:
            cur_buf.append(piece)
    flush()
    return chunks


def chunk_default(text, path):
    chunks = []
    for sub in _slide_chunks(text, CHUNK_TARGET_TOKENS, CHUNK_OVERLAP_TOKENS):
        chunks.append({"section": "(file)", "body": sub})
    return chunks


def _slide_chunks(text, target_tokens, overlap_tokens):
    """Sliding-window split by approximate tokens (4 chars/token)."""
    target_chars = target_tokens * 4
    overlap_chars = overlap_tokens * 4
    if len(text) <= target_chars:
        return [text]
    chunks = []
    i = 0
    n = len(text)
    while i < n:
        end = min(n, i + target_chars)
        # Snap to next newline if close
        if end < n:
            snap = text.rfind("\n", i, end)
            if snap > i + (target_chars // 2):
                end = snap
        chunks.append(text[i:end].strip())
        if end == n:
            break
        i = max(i + 1, end - overlap_chars)
    return [c for c in chunks if c]


# ── Context prefix (no LLM in BUILD-RAG — derived from path + section heuristic) ─
def build_context(path, section, body):
    """Local-only context derivation for BUILD-RAG. No LLM call.

    OS-RAG re-uses an LLM-generated context. BUILD-RAG keeps it free + offline by
    deriving from path + section + first sentence — that's enough signal for BM25
    to find the right chunk on a topical query.
    """
    rel = path
    first_sentence = body.strip().split("\n", 1)[0][:160]
    # Strip markdown decoration from first line
    first_sentence = re.sub(r"^[#*\->`\s]+", "", first_sentence)
    return f"From {rel}, in [{section}]: {first_sentence}"


# ── Index walk ───────────────────────────────────────────────────────────────
def collect_files(root, include_globs, exclude_patterns):
    out = []
    seen = set()
    for pat in include_globs:
        for p in root.glob(pat):
            if not p.is_file():
                continue
            rel = p.relative_to(root).as_posix()
            if rel in seen:
                continue
            if any(re.search(r, rel) for r in exclude_patterns):
                continue
            seen.add(rel)
            out.append(p)
    return sorted(out)


def chunk_file(path, rel_path):
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return []
    if not text.strip():
        return []
    if rel_path.endswith(".md"):
        return chunk_markdown(text, rel_path)
    if rel_path.endswith(".js"):
        return chunk_js(text, rel_path)
    if rel_path.endswith(".sql"):
        return chunk_sql(text, rel_path)
    if rel_path.endswith(".html"):
        return chunk_html(text, rel_path)
    if rel_path.endswith(".json"):
        return chunk_default(text, rel_path)
    return chunk_default(text, rel_path)


def chunk_id(rel_path, idx, body):
    h = hashlib.sha256(f"{rel_path}|{idx}|{body}".encode("utf-8")).hexdigest()[:12]
    return h


def build_index(root, quiet=False):
    files = collect_files(root, INCLUDE_GLOBS, EXCLUDE_PATTERNS)
    chunks = []
    for f in files:
        rel = f.relative_to(root).as_posix()
        raw_chunks = chunk_file(f, rel)
        for i, ch in enumerate(raw_chunks):
            body = ch["body"]
            section = ch["section"]
            ctx = build_context(rel, section, body)
            chunks.append(
                {
                    "id": chunk_id(rel, i, body),
                    "path": rel,
                    "section": section,
                    "context": ctx,
                    "body": body,
                    "tokens": approx_tokens(body),
                    "indexed_at": int(time.time()),
                }
            )
        if not quiet:
            print(f"  · {rel} → {len(raw_chunks)} chunks", file=sys.stderr)

    # Build BM25 stats over (context + body) — same field that's searched.
    df = defaultdict(int)
    postings = defaultdict(list)  # token -> [(chunk_id, tf), ...]
    doc_lens = {}
    for ch in chunks:
        toks = tokenize(ch["context"] + " " + ch["body"])
        doc_lens[ch["id"]] = len(toks)
        seen_tf = defaultdict(int)
        for t in toks:
            seen_tf[t] += 1
        for t, tf in seen_tf.items():
            df[t] += 1
            postings[t].append([ch["id"], tf])

    n_docs = max(1, len(chunks))
    avg_dl = sum(doc_lens.values()) / n_docs if n_docs else 0

    # Compact index: sort postings by descending tf so search short-circuit is faster
    for t in postings:
        postings[t].sort(key=lambda r: -r[1])

    return {
        "version": "1",
        "indexed_at": int(time.time()),
        "n_docs": n_docs,
        "avg_dl": avg_dl,
        "df": dict(df),
        "doc_lens": doc_lens,
        "postings": dict(postings),
        "chunks": chunks,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    p.add_argument("--out", type=Path, default=DEFAULT_INDEX_PATH)
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    root = args.root.resolve()
    out = args.out.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    if not args.quiet:
        print(f"[rag] root = {root}", file=sys.stderr)

    t0 = time.time()
    idx = build_index(root, quiet=args.quiet)
    out.write_text(json.dumps(idx, ensure_ascii=False), encoding="utf-8")
    dt = time.time() - t0

    print(
        f"[rag] indexed {len(idx['chunks'])} chunks across "
        f"{len(set(c['path'] for c in idx['chunks']))} files in {dt:.1f}s → {out}",
        file=sys.stderr,
    )
    # Stdout: machine-readable summary for callers
    print(
        json.dumps(
            {
                "ok": True,
                "n_chunks": len(idx["chunks"]),
                "n_files": len(set(c["path"] for c in idx["chunks"])),
                "n_tokens": sum(c["tokens"] for c in idx["chunks"]),
                "out": str(out),
                "elapsed_s": dt,
            }
        )
    )


if __name__ == "__main__":
    main()
