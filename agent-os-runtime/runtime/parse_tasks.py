"""
parse_tasks.py — Scans tasks/ directory and parses YAML frontmatter from .md files.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml


class ParseError(Exception):
    """Raised when a task file cannot be parsed."""
    pass


def parse_task_file(filepath: str) -> dict[str, Any]:
    """
    Parse a single task markdown file.

    Args:
        filepath: Absolute or relative path to the .md file.

    Returns:
        Dict with keys:
            - 'meta': dict of frontmatter fields
            - 'body': str of markdown body (after frontmatter)
            - 'filepath': str path to source file

    Raises:
        ParseError: If file cannot be read or frontmatter is malformed.
    """
    path = Path(filepath)

    if not path.exists():
        raise ParseError(f"File not found: {filepath}")

    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise ParseError(f"Cannot read file {filepath}: {exc}") from exc

    # Extract YAML frontmatter between --- delimiters
    frontmatter_pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)", re.DOTALL)
    match = frontmatter_pattern.match(raw)

    if not match:
        # Check if file starts with --- but has no closing ---
        if raw.strip().startswith("---"):
            raise ParseError(
                f"Malformed frontmatter in {filepath}: found opening '---' but no closing '---'"
            )
        # No frontmatter at all
        raise ParseError(
            f"No YAML frontmatter found in {filepath}: file must begin with '---'"
        )

    yaml_block = match.group(1)
    body = match.group(2).strip()

    try:
        meta = yaml.safe_load(yaml_block)
    except yaml.YAMLError as exc:
        raise ParseError(f"Invalid YAML frontmatter in {filepath}: {exc}") from exc

    if meta is None:
        meta = {}

    if not isinstance(meta, dict):
        raise ParseError(
            f"Frontmatter in {filepath} must be a YAML mapping, got {type(meta).__name__}"
        )

    return {
        "meta": meta,
        "body": body,
        "filepath": str(path.resolve()),
    }


def parse_all_tasks(tasks_dir: str) -> list[dict[str, Any]]:
    """
    Scan a directory for .md files and parse each one.

    Args:
        tasks_dir: Path to the directory containing task .md files.

    Returns:
        List of parsed task dicts (see parse_task_file).
        Files that fail to parse are included with a '_parse_error' key.
    """
    directory = Path(tasks_dir)

    if not directory.exists():
        raise ParseError(f"Tasks directory not found: {tasks_dir}")

    if not directory.is_dir():
        raise ParseError(f"Path is not a directory: {tasks_dir}")

    results: list[dict[str, Any]] = []

    md_files = sorted(directory.glob("*.md"))

    for md_file in md_files:
        try:
            task = parse_task_file(str(md_file))
        except ParseError as exc:
            # Include errored files with error details so callers can report them
            task = {
                "meta": {},
                "body": "",
                "filepath": str(md_file.resolve()),
                "_parse_error": str(exc),
            }
        results.append(task)

    return results


if __name__ == "__main__":
    import sys
    import json

    tasks_dir = sys.argv[1] if len(sys.argv) > 1 else "tasks"
    tasks = parse_all_tasks(tasks_dir)
    for t in tasks:
        if "_parse_error" in t:
            print(f"[ERROR] {t['filepath']}: {t['_parse_error']}", file=sys.stderr)
        else:
            print(json.dumps(t["meta"], indent=2, default=str))
