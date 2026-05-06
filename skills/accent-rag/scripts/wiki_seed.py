#!/usr/bin/env python3
"""wiki_seed.py — Auto-generate wiki pages from AccentOS source files.

Usage:
    python3 wiki_seed.py --modules    # generate wiki/modules/<name>.md from js/*.js
    python3 wiki_seed.py --vendors    # generate wiki/entities/vendors/<slug>.md from VD_RAW in index.html
    python3 wiki_seed.py --reindex    # regenerate wiki/index.md from disk state
    python3 wiki_seed.py --all        # run all

Output: writes new pages (never overwrites existing). Updates wiki/index.md.
"""

import os
import re
import sys
import json
import argparse
from datetime import date

WIKI_DIR = "wiki"
JS_DIR = "js"
INDEX_HTML = "index.html"
TODAY = date.today().isoformat()


def slugify(name):
    """Convert a name to a wiki slug."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s


def frontmatter(type_, slug, title, sources=None, related=None, confidence="medium", sensitive=False):
    sources_str = "[" + ", ".join(sources or []) + "]"
    related_str = "[" + ", ".join(related or []) + "]"
    sens = "true" if sensitive else "false"
    return f"""---
type: {type_}
slug: {slug}
title: {title}
sources: {sources_str}
related: {related_str}
confidence: {confidence}
sensitive: {sens}
created: {TODAY}
updated: {TODAY}
---
"""


def page_exists(path):
    return os.path.exists(path)


def update_index(index_path, type_, slug, title, confidence="medium"):
    """Add a slug to wiki/index.md if not already present."""
    with open(index_path, encoding="utf-8") as fh:
        content = fh.read()

    if re.search(r'^\|\s*' + re.escape(slug) + r'\s*\|', content, re.MULTILINE):
        return  # Already indexed (exact table-row match)

    # Find the correct section
    section_header = f"## {type_} pages"
    if section_header not in content:
        # Append new section
        content += f"\n## {type_} pages\n\n"
        content += "| slug | title | confidence | updated |\n"
        content += "|------|-------|-----------|--------|\n"

    new_row = f"| {slug} | {title} | {confidence} | {TODAY} |\n"

    # Insert after the section's last table row
    lines = content.splitlines(keepends=True)
    insert_at = None
    in_section = False
    past_header = False

    for i, line in enumerate(lines):
        if line.strip() == section_header:
            in_section = True
            past_header = True
            continue
        if in_section and line.startswith("## ") and past_header:
            insert_at = i
            break
        if in_section and line.startswith("|"):
            insert_at = i + 1

    if insert_at is not None:
        lines.insert(insert_at, new_row)
        content = "".join(lines)
    else:
        content += new_row

    with open(index_path, "w", encoding="utf-8") as fh:
        fh.write(content)


# ── MODULE GENERATION ──────────────────────────────────────

MODULE_SKIP = {
    "csv_import.js", "knowledge_hub.js"  # special-case files
}


def extract_module_functions(js_path):
    """Extract top-level function names from a JS module file."""
    with open(js_path, encoding="utf-8") as fh:
        content = fh.read()

    functions = re.findall(r'^(?:async\s+)?function\s+(\w+)\s*\(', content, re.MULTILINE)
    return functions[:20]  # Cap at 20


def generate_module_page(js_path, wiki_dir, index_path):
    filename = os.path.basename(js_path)
    if filename in MODULE_SKIP:
        return

    module_name = filename.replace(".js", "")
    slug = slugify(module_name.replace("_", "-"))
    title = module_name.replace("_", " ").title() + " Module"
    out_path = os.path.join(wiki_dir, "modules", f"{slug}.md")

    if page_exists(out_path):
        print(f"  skip (exists): {out_path}")
        return

    functions = extract_module_functions(js_path)
    func_list = "\n".join(f"- `{f}()`" for f in functions) if functions else "- (no exported functions found)"

    content = frontmatter(
        "module", slug, title,
        sources=["source-build-intelligence"],
        related=["ADR-002", "ADR-004"],
        confidence="medium"
    )
    content += f"\n# {title}\n\n"
    content += f"**File**: `js/{filename}`\n"
    content += f"**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]\n\n"
    content += f"## Functions\n\n{func_list}\n\n"
    content += f"## Shell touchpoints\n\n"
    content += f"- Sidebar entry in index.html (CORE or INTELLIGENCE section)\n"
    content += f"- PAGE_META entry: `{module_name.lower().replace('_', '')}: {{t:'...', s:'...'}}`\n"
    content += f"- pages dispatcher: `{module_name.lower().replace('_', '')}` key\n"
    content += f"- Hydrate call in sbHydrate()\n\n"
    content += f"## Related\n\n[[ADR-002]] · [[ADR-004]]\n"

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(content)

    update_index(index_path, "module", slug, title)
    print(f"  created: {out_path}")


def seed_modules(js_dir, wiki_dir):
    print(f"\nSeeding module pages from {js_dir}/...")
    index_path = os.path.join(wiki_dir, "index.md")
    js_files = [f for f in os.listdir(js_dir) if f.endswith(".js")] if os.path.isdir(js_dir) else []

    for js_file in sorted(js_files):
        generate_module_page(os.path.join(js_dir, js_file), wiki_dir, index_path)

    print(f"  Module seeding complete: {len(js_files)} files processed")


# ── VENDOR GENERATION ──────────────────────────────────────

def _find_array_end(content, start):
    """Return index of closing ] for the array starting at content[start]."""
    depth = 0
    i = start
    while i < len(content):
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return len(content) - 1


def _find_top_level_objects(array_str):
    """Yield (start, end) slices of top-level {} objects in an array string."""
    depth = 0
    obj_start = None
    for i, ch in enumerate(array_str):
        if ch == '{':
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and obj_start is not None:
                yield array_str[obj_start:i + 1]
                obj_start = None


def _parse_vendor_obj(obj_str):
    """Parse a VD_RAW vendor object string into a dict with normalized keys."""
    vendor = {}
    # name field: "n":"..."
    m = re.search(r'"n"\s*:\s*"([^"]*)"', obj_str)
    if m:
        vendor["name"] = m.group(1)
    # total sales: inside "sl":{..."t":N...}
    sl_match = re.search(r'"sl"\s*:\s*(\{[^}]*\})', obj_str)
    if sl_match:
        t_match = re.search(r'"t"\s*:\s*([\d.]+)', sl_match.group(1))
        if t_match:
            vendor["sales"] = float(t_match.group(1))
    # website
    m = re.search(r'"web"\s*:\s*"([^"]*)"', obj_str)
    if m:
        vendor["web"] = m.group(1)
    # description
    m = re.search(r'"desc"\s*:\s*"([^"]*)"', obj_str)
    if m:
        vendor["desc"] = m.group(1)
    # inactive flag
    m = re.search(r'"inactive"\s*:\s*(true|false)', obj_str)
    if m:
        vendor["inactive"] = m.group(1) == "true"
    # parent company → category field
    m = re.search(r'"pc"\s*:\s*"([^"]*)"', obj_str)
    if m:
        vendor["category"] = m.group(1)
    return vendor


def extract_vd_raw(html_path):
    """Extract VD_RAW vendor list from index.html using bracket counting."""
    with open(html_path, encoding="utf-8") as fh:
        content = fh.read()

    # Find the start of the VD_RAW array (handles both `=[` and `= [` spacing)
    marker = 'const VD_RAW=['
    start_pos = content.find(marker)
    if start_pos == -1:
        marker = 'const VD_RAW = ['
        start_pos = content.find(marker)
    if start_pos == -1:
        print("  Warning: VD_RAW not found in index.html")
        return []

    array_open = content.index('[', start_pos + len(marker) - 1)
    array_close = _find_array_end(content, array_open)
    vd_raw_str = content[array_open:array_close + 1]

    vendors = []
    for obj_str in _find_top_level_objects(vd_raw_str):
        vendor = _parse_vendor_obj(obj_str)
        if vendor.get("name"):
            vendors.append(vendor)

    vendors.sort(key=lambda v: v.get("sales", 0) or 0, reverse=True)
    return vendors[:30]


def generate_vendor_page(vendor, wiki_dir, index_path):
    name = vendor.get("name", "Unknown")
    slug = slugify(name)
    out_path = os.path.join(wiki_dir, "entities", "vendors", f"{slug}.md")

    if page_exists(out_path):
        print(f"  skip (exists): {out_path}")
        return

    sales = vendor.get("sales", 0)
    category = vendor.get("category", "")
    inactive = vendor.get("inactive", False)

    title = f"{name} (Vendor)"
    content = frontmatter(
        "entity", slug, title,
        sources=["source-master"],
        related=["vendor-scoring"],
        confidence="medium"
    )
    web = vendor.get("web", "")
    desc = vendor.get("desc", "")

    content += f"\n# {name}\n\n"
    if inactive:
        content += "**Status**: Inactive\n\n"
    if category:
        content += f"**Parent company**: {category}\n"
    if sales:
        content += f"**Total sales (Accent)**: ${sales:,.0f}\n"
    if web:
        content += f"**Website**: {web}\n"
    if desc:
        content += f"\n{desc}\n"
    content += "\n## Scoring\n\n"
    content += f"See [[vendor-scoring]] for rubric. Scores in AccentOS → Vendor Ranking → {name}.\n\n"
    content += "## Notes\n\n"
    content += "(Auto-generated from VD_RAW. Edit to add rep name, terms, relationship notes.)\n\n"
    content += "## Related\n\n[[vendor-scoring]]"

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(content)

    update_index(index_path, "entity", slug, title)
    print(f"  created: {out_path} (sales: ${sales:,.0f})")


def seed_vendors(html_path, wiki_dir):
    print(f"\nSeeding vendor pages from {html_path}...")
    index_path = os.path.join(wiki_dir, "index.md")
    vendors = extract_vd_raw(html_path)

    if not vendors:
        print("  No vendors found. Check VD_RAW definition in index.html.")
        return

    for vendor in vendors:
        generate_vendor_page(vendor, wiki_dir, index_path)

    print(f"  Vendor seeding complete: {len(vendors)} top vendors processed")


# ── REINDEX ────────────────────────────────────────────────

def reindex(wiki_dir):
    """Regenerate wiki/index.md from disk state."""
    print(f"\nReindexing {wiki_dir}/...")

    pages_by_type = {}

    for root, dirs, files in os.walk(wiki_dir):
        skip_files = {"index.md", "log.md", "hot.md", "overview.md", "CLAUDE.md"}
        for f in files:
            if f.endswith(".md") and f not in skip_files:
                filepath = os.path.join(root, f)
                with open(filepath, encoding="utf-8") as fh:
                    content = fh.read()

                if not content.startswith("---"):
                    continue
                end = content.find("\n---", 3)
                if end == -1:
                    continue

                fm_text = content[3:end].strip()
                meta = {}
                for line in fm_text.splitlines():
                    if ":" in line:
                        key, _, val = line.partition(":")
                        meta[key.strip()] = val.strip()

                slug = meta.get("slug", "")
                title = meta.get("title", "")
                confidence = meta.get("confidence", "medium")
                updated = meta.get("updated", TODAY)
                type_ = meta.get("type", "concept")

                if slug and title:
                    pages_by_type.setdefault(type_, []).append({
                        "slug": slug,
                        "title": title,
                        "confidence": confidence,
                        "updated": updated
                    })

    # Write new index.md
    index_path = os.path.join(wiki_dir, "index.md")
    lines = [
        "# AccentOS Wiki — Master Index",
        "> Auto-maintained. Every wiki page must have an entry here.",
        f"> Updated: {TODAY}",
        "",
    ]

    for type_ in ["concept", "decision", "entity", "module", "source", "synthesis"]:
        if type_ not in pages_by_type:
            continue
        lines.append(f"## {type_} pages")
        lines.append("")
        lines.append("| slug | title | confidence | updated |")
        lines.append("|------|-------|-----------|---------|")
        for page in sorted(pages_by_type[type_], key=lambda p: p["slug"]):
            lines.append(f"| {page['slug']} | {page['title']} | {page['confidence']} | {page['updated']} |")
        lines.append("")

    with open(index_path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    total = sum(len(v) for v in pages_by_type.values())
    print(f"  Reindex complete: {total} pages across {len(pages_by_type)} types → wiki/index.md")


# ── MAIN ───────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed AccentOS wiki from source files")
    parser.add_argument("--modules", action="store_true", help="Generate module pages from js/*.js")
    parser.add_argument("--vendors", action="store_true", help="Generate vendor pages from VD_RAW in index.html")
    parser.add_argument("--reindex", action="store_true", help="Regenerate wiki/index.md from disk")
    parser.add_argument("--all", action="store_true", help="Run all seed operations")
    parser.add_argument("--js-dir", default=JS_DIR, help="JS modules directory")
    parser.add_argument("--html", default=INDEX_HTML, help="index.html path")
    parser.add_argument("--wiki", default=WIKI_DIR, help="Wiki directory")
    args = parser.parse_args()

    if not (args.modules or args.vendors or args.reindex or args.all):
        parser.print_help()
        sys.exit(0)

    if args.modules or args.all:
        seed_modules(args.js_dir, args.wiki)

    if args.vendors or args.all:
        seed_vendors(args.html, args.wiki)

    if args.reindex or args.all:
        reindex(args.wiki)

    print("\nDone. Run wiki_lint.py to verify zero errors.")


if __name__ == "__main__":
    main()
