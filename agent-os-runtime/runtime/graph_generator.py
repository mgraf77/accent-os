"""
graph_generator.py — Mermaid diagram generation for AgentOS task dependency graphs.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any


# Status -> Mermaid style class
_STATUS_STYLES: dict[str, str] = {
    "pending":   "style {node} fill:#f9f9f9,stroke:#999,color:#333",
    "queued":    "style {node} fill:#ffe066,stroke:#cc9900,color:#333",
    "running":   "style {node} fill:#4da6ff,stroke:#0066cc,color:#fff",
    "blocked":   "style {node} fill:#ff6666,stroke:#cc0000,color:#fff",
    "failed":    "style {node} fill:#ff3333,stroke:#990000,color:#fff",
    "complete":  "style {node} fill:#66cc66,stroke:#336600,color:#fff",
    "cancelled": "style {node} fill:#cccccc,stroke:#666666,color:#333",
}


def _sanitize_node_id(task_id: str) -> str:
    """Convert TASK-000001 to a Mermaid-safe node ID (no hyphens)."""
    return task_id.replace("-", "_")


def generate_mermaid_graph(tasks: list[dict[str, Any]]) -> str:
    """
    Generate a Mermaid flowchart diagram for the task dependency graph.

    Node labels: TASK-XXXXXX [status]
    Edges represent dependencies (A depends on B → B --> A).
    Nodes are styled by their current status.

    Args:
        tasks: List of parsed task dicts with 'meta' key.

    Returns:
        A string containing the full Mermaid diagram.
    """
    lines: list[str] = ["```mermaid", "flowchart TD"]

    # Build node declarations
    node_ids_seen: set[str] = set()
    style_lines: list[str] = []

    for task in tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id")
        if not task_id:
            continue

        status = meta.get("status", "pending")
        title = meta.get("title", task_id)
        node_id = _sanitize_node_id(task_id)

        if task_id not in node_ids_seen:
            node_ids_seen.add(task_id)
            # Node declaration with label
            label = f"{task_id} [{status}]"
            lines.append(f'    {node_id}["{label}"]')

            # Style line for this node
            style_template = _STATUS_STYLES.get(status, _STATUS_STYLES["pending"])
            style_line = style_template.format(node=node_id)
            style_lines.append(f"    {style_line}")

    # Build edges (dependency → task)
    for task in tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id")
        if not task_id:
            continue
        depends_on: list[str] = meta.get("depends_on", []) or []
        node_id = _sanitize_node_id(task_id)

        for dep_id in depends_on:
            dep_node_id = _sanitize_node_id(dep_id)
            lines.append(f"    {dep_node_id} --> {node_id}")

    # Append style declarations after all nodes and edges
    lines.extend(style_lines)
    lines.append("```")

    return "\n".join(lines)


def write_graph_report(tasks: list[dict[str, Any]], output_path: str) -> None:
    """
    Write a Mermaid graph report as a Markdown file.

    Args:
        tasks:       List of parsed task dicts.
        output_path: Absolute path where the .md report should be written.
    """
    diagram = generate_mermaid_graph(tasks)

    # Build a summary table
    table_lines = [
        "| Task ID | Title | Status | Risk | Dependencies |",
        "|---------|-------|--------|------|--------------|",
    ]
    for task in sorted(tasks, key=lambda t: t.get("meta", {}).get("id", "")):
        meta = task.get("meta", {})
        task_id = meta.get("id", "?")
        title = meta.get("title", "?")
        status = meta.get("status", "?")
        risk = meta.get("risk_level", "?")
        deps = ", ".join(meta.get("depends_on", []) or []) or "—"
        table_lines.append(f"| {task_id} | {title} | {status} | {risk} | {deps} |")

    content_parts = [
        "# AgentOS Task Dependency Graph",
        "",
        diagram,
        "",
        "## Task Summary",
        "",
        "\n".join(table_lines),
        "",
    ]
    content = "\n".join(content_parts)

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent))
    from parse_tasks import parse_all_tasks

    base = Path(__file__).resolve().parent.parent
    tasks_dir = str(base / "tasks")
    output_path = str(base / "reports" / "task-graph.md")

    tasks = parse_all_tasks(tasks_dir)
    write_graph_report(tasks, output_path)
    print(f"Graph report written to {output_path}")
