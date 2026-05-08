"""
dependency_engine.py — Dependency resolution and cycle detection for AgentOS tasks.
"""

from __future__ import annotations

from typing import Any


def _task_index(all_tasks: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Build a quick lookup dict: task_id -> task dict."""
    index: dict[str, dict[str, Any]] = {}
    for task in all_tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id")
        if task_id:
            index[task_id] = task
    return index


def check_dependencies(
    task: dict[str, Any],
    all_tasks: list[dict[str, Any]],
) -> tuple[bool, list[str]]:
    """
    Check whether all dependencies of a task are satisfied.

    A dependency is satisfied if the dependency task has status == 'complete'.

    Args:
        task:       The task dict (with 'meta' key) to check.
        all_tasks:  Full list of task dicts in the system.

    Returns:
        (all_satisfied, blocking_task_ids)
        - all_satisfied: True if every dependency is complete.
        - blocking_task_ids: List of task IDs that are NOT yet complete.
    """
    meta = task.get("meta", {})
    depends_on: list[str] = meta.get("depends_on", []) or []

    if not depends_on:
        return True, []

    index = _task_index(all_tasks)
    blocking: list[str] = []

    for dep_id in depends_on:
        dep_task = index.get(dep_id)
        if dep_task is None:
            # Missing dependency is treated as blocking (not satisfied)
            blocking.append(dep_id)
            continue
        dep_status = dep_task.get("meta", {}).get("status", "")
        if dep_status != "complete":
            blocking.append(dep_id)

    return len(blocking) == 0, blocking


def get_dependency_graph(tasks: list[dict[str, Any]]) -> dict[str, list[str]]:
    """
    Build an adjacency dict representing the dependency graph.

    Returns:
        Dict mapping task_id -> list of task_ids it depends on.
        Example: {"TASK-000003": ["TASK-000001", "TASK-000002"]}
    """
    graph: dict[str, list[str]] = {}
    for task in tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id")
        if not task_id:
            continue
        depends_on: list[str] = meta.get("depends_on", []) or []
        graph[task_id] = list(depends_on)
    return graph


def detect_cycles(tasks: list[dict[str, Any]]) -> list[list[str]]:
    """
    Detect cycles in the dependency graph using DFS.

    Returns:
        List of cycles found.  Each cycle is a list of task IDs forming the cycle
        (the first and last element are the same node for clarity).
        Returns empty list if no cycles exist.
    """
    graph = get_dependency_graph(tasks)
    visited: set[str] = set()
    rec_stack: set[str] = set()
    cycles: list[list[str]] = []

    def dfs(node: str, path: list[str]) -> None:
        visited.add(node)
        rec_stack.add(node)
        path.append(node)

        for neighbour in graph.get(node, []):
            if neighbour not in visited:
                dfs(neighbour, path)
            elif neighbour in rec_stack:
                # Found a cycle — extract it
                cycle_start = path.index(neighbour)
                cycle = path[cycle_start:] + [neighbour]
                # Avoid duplicate cycles
                if cycle not in cycles:
                    cycles.append(cycle)

        path.pop()
        rec_stack.discard(node)

    for task_id in graph:
        if task_id not in visited:
            dfs(task_id, [])

    return cycles


if __name__ == "__main__":
    import sys
    import json
    from pathlib import Path

    # Allow running from project root
    sys.path.insert(0, str(Path(__file__).parent))
    from parse_tasks import parse_all_tasks

    tasks_dir = sys.argv[1] if len(sys.argv) > 1 else "tasks"
    tasks = parse_all_tasks(tasks_dir)

    graph = get_dependency_graph(tasks)
    print("Dependency graph:")
    for task_id, deps in graph.items():
        print(f"  {task_id} -> {deps}")

    cycles = detect_cycles(tasks)
    if cycles:
        print(f"\nCycles detected ({len(cycles)}):")
        for cycle in cycles:
            print(f"  {' -> '.join(cycle)}")
    else:
        print("\nNo cycles detected.")
