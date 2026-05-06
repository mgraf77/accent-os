#!/usr/bin/env python3
"""
wiki_lint.py — Validate all AccentOS wiki pages against wiki/CLAUDE.md schema.

Usage:
  python scripts/wiki_lint.py           # validate all pages
  python scripts/wiki_lint.py --verbose # print OK pages too

Exit code 0 = all clean, 1 = errors found.
"""

import os
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install pyyaml")
    sys.exit(2)

WIKI_ROOT = Path(__file__).parent.parent / "wiki"
TYPED_DIRS = ["clusters", "sops", "adrs", "entities", "sources"]
META_FILES = {"CLAUDE.md", "hot.md", "log.md", "_index.md"}

ALLOWED_TYPES = {"cluster", "sop", "adr", "entity", "source_summary", "concept", "runbook"}
ALLOWED_STATUSES = {"draft", "review", "published"}

FRONTMATTER_RE = re.compile(r"^---\r?\n(.*?)\r?\n---", re.DOTALL)

verbose = "--verbose" in sys.argv or "-v" in sys.argv

errors: list[str] = []
warnings: list[str] = []
all_ids: dict[str, Path] = {}
all_pages: list[dict] = []


def err(path: Path, msg: str):
    errors.append(f"{path.relative_to(WIKI_ROOT.parent)}: {msg}")


def warn(path: Path, msg: str):
    warnings.append(f"{path.relative_to(WIKI_ROOT.parent)}: {msg}")


def lint_file(path: Path):
    text = path.read_text(encoding="utf-8")
    m = FRONTMATTER_RE.match(text)

    if not m:
        err(path, "missing frontmatter (expected --- block at top of file)")
        return

    try:
        fm = yaml.safe_load(m.group(1))
    except yaml.YAMLError as e:
        err(path, f"invalid YAML frontmatter — {e}")
        return

    if not isinstance(fm, dict):
        err(path, "frontmatter parsed as non-dict — check YAML syntax")
        return

    # Required fields
    required = ["id", "title", "type", "status", "weight", "tags", "created", "updated"]
    for field in required:
        if field not in fm:
            err(path, f"missing required field '{field}'")

    # id — unique
    page_id = fm.get("id")
    if page_id:
        if not isinstance(page_id, str):
            err(path, f"'id' must be a string, got {type(page_id).__name__}")
        elif page_id in all_ids:
            err(path, f"duplicate id '{page_id}' — first seen in {all_ids[page_id].relative_to(WIKI_ROOT.parent)}")
        else:
            all_ids[page_id] = path

    # type
    page_type = fm.get("type")
    if page_type is not None and page_type not in ALLOWED_TYPES:
        err(path, f"invalid type '{page_type}' — allowed: {sorted(ALLOWED_TYPES)}")

    # status
    status = fm.get("status")
    if status is not None and status not in ALLOWED_STATUSES:
        err(path, f"invalid status '{status}' — allowed: {sorted(ALLOWED_STATUSES)}")

    # weight
    weight = fm.get("weight")
    if weight is not None:
        if not isinstance(weight, int):
            err(path, f"'weight' must be an integer, got {type(weight).__name__}: {weight!r}")
        elif not (1 <= weight <= 10):
            err(path, f"'weight' out of range: {weight} (must be 1–10)")

    # warn if draft with weight > 8
    if status == "draft" and isinstance(weight, int) and weight > 8:
        warn(path, f"draft page has weight {weight} > 8 — consider lowering until published")

    # tags
    tags = fm.get("tags")
    if tags is not None and not isinstance(tags, list):
        err(path, f"'tags' must be a list, got {type(tags).__name__}")
    elif isinstance(tags, list) and len(tags) == 0:
        warn(path, "empty tags list — add at least one tag to improve RAG recall")

    # date ordering
    created = fm.get("created")
    updated = fm.get("updated")
    if created and updated:
        try:
            if str(updated) < str(created):
                err(path, f"'updated' ({updated}) is before 'created' ({created})")
        except Exception:
            pass

    # stash for related-id resolution pass
    all_pages.append({"path": path, "fm": fm})

    if verbose:
        print(f"  OK  {path.relative_to(WIKI_ROOT.parent)}")


def resolve_related():
    """Second pass: verify all related ids point to real pages."""
    for page in all_pages:
        related = page["fm"].get("related") or []
        if not isinstance(related, list):
            err(page["path"], "'related' must be a list")
            continue
        for rel_id in related:
            if rel_id not in all_ids:
                err(page["path"], f"related id '{rel_id}' not found in any wiki page")


def main():
    if not WIKI_ROOT.exists():
        print(f"ERROR: wiki directory not found at {WIKI_ROOT}")
        sys.exit(2)

    print(f"WIKI LINT — scanning {WIKI_ROOT.relative_to(WIKI_ROOT.parent)}/")

    for dir_name in TYPED_DIRS:
        dir_path = WIKI_ROOT / dir_name
        if not dir_path.exists():
            warn(WIKI_ROOT, f"typed subdirectory '{dir_name}/' does not exist")
            continue
        md_files = sorted(dir_path.glob("*.md"))
        if not md_files:
            warn(dir_path, f"no .md files in {dir_name}/")
        for md_file in md_files:
            lint_file(md_file)

    resolve_related()

    total_pages = len(all_pages)

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠  {w}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  ✗  {e}")
        print(f"\nLINT FAILED — {len(errors)} error(s), {len(warnings)} warning(s) across {total_pages} page(s)")
        sys.exit(1)
    else:
        print(f"\nLINT OK — {total_pages} page(s) valid, {len(warnings)} warning(s)")
        sys.exit(0)


if __name__ == "__main__":
    main()
