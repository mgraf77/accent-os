#!/usr/bin/env python3
"""wiki_lint.py — Lint all AccentOS wiki pages.

Usage:
    python3 wiki_lint.py [--source wiki/] [--json] [--strict]

Checks:
  errors: broken_wikilinks, missing_frontmatter, bad_slugs, index_drift
  warnings: orphan_pages, stale_low_confidence, oversized_pages

Exit code: 0 = clean (warnings OK), 1 = errors found, 2 = runtime error
"""

import os
import re
import sys
import json
import argparse
from datetime import datetime, date

REQUIRED_FIELDS = {"type", "slug", "title", "sources", "related", "confidence", "sensitive", "created", "updated"}
VALID_TYPES = {"concept", "decision", "entity", "module", "source", "synthesis"}
VALID_CONFIDENCE = {"high", "medium", "low"}
PAGE_WORD_LIMIT = 800
PAGE_WORD_WARNING = 700
# Operational pages that are always valid wikilink targets but not indexed as regular pages
OPERATIONAL_SLUGS = {"overview", "log", "hot"}


def find_wiki_pages(source_dir):
    pages = []
    for root, dirs, files in os.walk(source_dir):
        # Skip operational files in wiki root
        skip_files = {"index.md", "log.md", "hot.md", "overview.md", "CLAUDE.md"}
        for f in files:
            if f.endswith(".md") and f not in skip_files:
                pages.append(os.path.join(root, f))
    return pages


def parse_frontmatter(filepath):
    """Parse YAML frontmatter from a markdown file. Returns (meta_dict, body_str)."""
    with open(filepath, encoding="utf-8") as fh:
        content = fh.read()

    if not content.startswith("---"):
        return {}, content

    end = content.find("\n---", 3)
    if end == -1:
        return {}, content

    fm_text = content[3:end].strip()
    body = content[end + 4:].strip()

    meta = {}
    for line in fm_text.splitlines():
        line = line.strip()
        if ":" in line:
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            # Parse list values like [a, b, c]
            if val.startswith("[") and val.endswith("]"):
                inner = val[1:-1].strip()
                val = [v.strip() for v in inner.split(",") if v.strip()] if inner else []
            meta[key] = val

    return meta, body


def extract_wikilinks(text):
    # Strip code blocks and inline code before extracting wikilinks
    # to avoid false positives on [[slug]] in code examples
    no_code = re.sub(r'```[\s\S]*?```', '', text)
    no_code = re.sub(r'`[^`]+`', '', no_code)
    return set(re.findall(r'\[\[([^\]]+)\]\]', no_code))


def load_index(source_dir):
    """Load wiki/index.md and extract all slugs."""
    index_path = os.path.join(source_dir, "index.md")
    if not os.path.exists(index_path):
        return set()

    with open(index_path, encoding="utf-8") as fh:
        content = fh.read()

    slugs = set()
    # Extract slugs from table rows: | slug | title | ...
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("|") and not line.startswith("| slug") and not line.startswith("| ---"):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 2:
                slug = parts[1].strip()
                if slug and slug != "slug" and not slug.startswith("---"):
                    slugs.add(slug)

    return slugs


def count_words(text):
    return len(re.findall(r'\w+', text))


def run_lint(source_dir, strict=False):
    pages = find_wiki_pages(source_dir)
    index_slugs = load_index(source_dir)

    errors = {
        "broken_wikilinks": [],
        "missing_frontmatter": [],
        "bad_slugs": [],
        "index_drift": [],
    }
    warnings = {
        "orphan_pages": [],
        "stale_low_confidence": [],
        "oversized_pages": [],
    }

    all_page_slugs = set()
    page_meta = {}
    inbound_links = {}  # slug -> count of inbound [[wikilinks]]

    today = date.today()

    # Pass 1: parse all pages
    for filepath in pages:
        meta, body = parse_frontmatter(filepath)
        basename = os.path.splitext(os.path.basename(filepath))[0]

        # Missing frontmatter fields
        if not meta:
            errors["missing_frontmatter"].append(f"{filepath}: no frontmatter found")
            continue

        missing = REQUIRED_FIELDS - set(meta.keys())
        if missing:
            errors["missing_frontmatter"].append(f"{filepath}: missing fields: {', '.join(sorted(missing))}")

        slug = meta.get("slug", "")

        # Bad slug (frontmatter slug != filename)
        if slug and slug != basename:
            errors["bad_slugs"].append(f"{filepath}: slug '{slug}' != filename '{basename}'")

        if slug:
            all_page_slugs.add(slug)
            page_meta[slug] = {"filepath": filepath, "meta": meta, "body": body}
            inbound_links.setdefault(slug, 0)

        # Validate type and confidence
        page_type = meta.get("type", "")
        if page_type and page_type not in VALID_TYPES:
            errors["missing_frontmatter"].append(f"{filepath}: invalid type '{page_type}'")

        confidence = meta.get("confidence", "")
        if confidence and confidence not in VALID_CONFIDENCE:
            errors["missing_frontmatter"].append(f"{filepath}: invalid confidence '{confidence}'")

        # Word count
        word_count = count_words(body)
        if word_count > PAGE_WORD_LIMIT:
            warnings["oversized_pages"].append(f"{filepath}: {word_count} words (limit {PAGE_WORD_LIMIT})")

    # Pass 2: check wikilinks
    for slug, data in page_meta.items():
        body = data["body"]
        meta = data["meta"]
        filepath = data["filepath"]

        # Check wikilinks in body
        wikilinks = extract_wikilinks(body)
        for link in wikilinks:
            valid = all_page_slugs | index_slugs | OPERATIONAL_SLUGS
            if link not in valid:
                errors["broken_wikilinks"].append(f"{filepath}: [[{link}]] not found in wiki")
            else:
                inbound_links[link] = inbound_links.get(link, 0) + 1

        # Check wikilinks in related field
        related = meta.get("related", [])
        if isinstance(related, list):
            for link in related:
                if link and link not in all_page_slugs and link not in index_slugs and link not in OPERATIONAL_SLUGS:
                    errors["broken_wikilinks"].append(f"{filepath}: related [[{link}]] not found in wiki")
                elif link:
                    inbound_links[link] = inbound_links.get(link, 0) + 1

        # Stale low-confidence
        if meta.get("confidence") == "low":
            updated_str = meta.get("updated", "")
            if updated_str:
                try:
                    updated_dt = datetime.strptime(updated_str, "%Y-%m-%d").date()
                    days_old = (today - updated_dt).days
                    if days_old > 90:
                        warnings["stale_low_confidence"].append(
                            f"{filepath}: confidence=low, {days_old} days since update"
                        )
                except ValueError:
                    pass

    # Pass 3: orphan pages (skip auto-gen reference pages; check concept/decision/synthesis only)
    skip_orphan_types = {"source", "synthesis", "module", "entity"}
    for slug, data in page_meta.items():
        page_type = data["meta"].get("type", "")
        if page_type not in skip_orphan_types and inbound_links.get(slug, 0) == 0:
            warnings["orphan_pages"].append(f"{data['filepath']}: no inbound [[wikilinks]]")

    # Pass 4: index drift
    # Slugs in pages but not in index
    for slug in all_page_slugs:
        if slug not in index_slugs:
            errors["index_drift"].append(f"slug '{slug}' found on disk but not in wiki/index.md")

    # Slugs in index but not on disk
    for slug in index_slugs:
        if slug not in all_page_slugs:
            # Only error if it looks like a real page slug (not overview/log/hot)
            skip = {"overview", "log", "hot"}
            if slug not in skip:
                errors["index_drift"].append(f"slug '{slug}' in wiki/index.md but not found on disk")

    # Build stats
    total_errors = sum(len(v) for v in errors.values())
    total_warnings = sum(len(v) for v in warnings.values())

    # Filter empty lists
    errors_out = {k: v for k, v in errors.items() if v}
    warnings_out = {k: v for k, v in warnings.items() if v}

    result = {
        "errors": errors_out,
        "warnings": warnings_out,
        "stats": {
            "pages_checked": len(pages),
            "errors": total_errors,
            "warnings": total_warnings,
        }
    }

    return result, total_errors > 0


def main():
    parser = argparse.ArgumentParser(description="Lint AccentOS wiki pages")
    parser.add_argument("--source", default="wiki/", help="Wiki source directory")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        print(f"Error: source directory '{args.source}' not found", file=sys.stderr)
        sys.exit(2)

    result, has_errors = run_lint(args.source, strict=args.strict)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        stats = result["stats"]
        print(f"\nwiki_lint.py — {stats['pages_checked']} pages checked")
        print(f"Errors: {stats['errors']}  Warnings: {stats['warnings']}\n")

        for category, items in result["errors"].items():
            print(f"ERROR [{category}]:")
            for item in items:
                print(f"  ✗ {item}")

        for category, items in result["warnings"].items():
            print(f"WARNING [{category}]:")
            for item in items:
                print(f"  ⚠ {item}")

        if stats["errors"] == 0 and stats["warnings"] == 0:
            print("✓ All checks passed")

    if has_errors or (args.strict and result["stats"]["warnings"] > 0):
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
