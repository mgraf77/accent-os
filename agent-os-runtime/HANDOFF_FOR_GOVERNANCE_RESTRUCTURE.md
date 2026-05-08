# Handoff for Governance Restructuring
**System:** AgentOS Runtime v1
**Branch:** `claude/agentOS-runtime-v1-XTQrv`
**Prepared:** 2026-05-08

This document exists to support the upcoming governance restructuring of the AccentOS ecosystem. It maps what was built, what it touches, and where it likely belongs after restructuring.

---

## Systems Touched This Session

| System | What Changed |
|---|---|
| `agent-os-runtime/` | Created from scratch — entire new subsystem |
| `.gitignore` (root) | Added Python `__pycache__` / `*.py[cod]` rules |

No existing AccentOS modules were modified. The runtime was built in isolation as a new subdirectory.

---

## Dependency Map

### What AgentOS Runtime depends on
- Nothing from the existing AccentOS codebase
- No imports from `skills/`, `js/`, `worker/`, or any existing AccentOS module
- Pure Python, self-contained

### What depends on AgentOS Runtime
- Nothing yet — no existing AccentOS code imports or calls into `agent-os-runtime/`
- It is a standalone subsystem as of this commit

**Coupling risk: LOW.** Safe to extract, rename, or restructure independently.

---

## Architectural Assumptions Made

1. **Tasks are markdown files** with YAML frontmatter. This is the canonical input format — not a database, not an API.
2. **Events are the source of truth.** The JSONL event log is immutable. Task files are inputs; event files are history.
3. **The runtime does not execute tasks** — it classifies, validates, and queues them. Execution is a v2+ concern.
4. **Single-tenant, local-first.** No auth, no multi-user, no network. Designed for a single operator running locally or in a CI/CD context.
5. **UTC everywhere.** All timestamps are UTC-aware ISO 8601. No timezone conversion logic exists.

---

## Recommended Repo/System Placement After Governance

### Option A — Extract to standalone repo
`agent-os-runtime` → its own git repo (`mgraf77/agent-os-runtime`)

**Pros:** Clean separation, can version independently, can be used by BetIQ + AccentOS + future systems without coupling.
**Cons:** Requires cross-repo dependency management if schemas are shared.

**Recommended if:** AgentOS Runtime becomes a shared infrastructure layer used across multiple products.

### Option B — Keep in accent-os, promote to top-level module
Move `agent-os-runtime/` → `runtime/` at the repo root.

**Pros:** Simpler, no cross-repo deps, stays close to AccentOS skills system.
**Cons:** Blurs the boundary between AccentOS (AI assistant layer) and AgentOS (orchestration layer).

**Recommended if:** AgentOS Runtime remains AccentOS-specific only.

### Option C — Keep as-is in subdirectory
Leave at `accent-os/agent-os-runtime/` for now.

**Pros:** Zero migration cost, safe during governance transition.
**Recommended for:** The governance transition period itself.

---

## What Likely Belongs Where

| Component | Likely Home |
|---|---|
| `runtime/*.py` (core engine) | AgentOS repo or `agent-os-runtime` standalone |
| `schemas/task.schema.json` | Shared schemas repo or AgentOS |
| `tasks/*.md` (example tasks) | AccentOS or product-specific repo |
| `events/*.jsonl` (live event logs) | Product-specific repo (AccentOS) — never shared |
| `state/queue.json` | Product-specific (AccentOS) — runtime artifact |
| `tests/test_runtime.py` | Stays with `runtime/*.py` wherever it lives |
| `NEXT_STEPS.md` / these docs | AgentOS or AccentOS docs, depending on placement |

---

## Areas of High Coupling (Future Risk)

| Area | Risk | Notes |
|---|---|---|
| `schemas/task.schema.json` shared across products | Medium | If BetIQ and AccentOS both use this schema, a breaking change in one product affects the other. Need schema versioning. |
| `events/` JSONL format | Low-Medium | Format is simple, but if changed, `replay_engine.py` breaks. Pin the format or version it. |
| Task `assigned_to` field | Low | Currently a free string (`claude-code`, `chatgpt`). As multi-agent expands, this needs a registry. |

---

## Incomplete Abstractions

1. **No execution layer** — the runtime queues tasks but nothing executes them. The interface between "queue" and "executor" is undefined. This is intentional for v1 but must be designed before v2.
2. **No task result capture** — tasks have `success_criteria` but no mechanism to evaluate or record whether criteria were met.
3. **No approval workflow** — `high` risk tasks are blocked with no path to approval. Stub exists conceptually, not in code.

---

## Duplicate Systems Risk

- The existing `skills/` system in AccentOS (vibe-speak, efficiency-monitor, etc.) represents a parallel form of task/workflow definition. These two systems are currently independent with no overlap. A future governance decision will need to define whether AccentOS skills should emit AgentOS tasks, or remain separate.
- `WORK_IN_PROGRESS.md` and `BUILD_PLAN_CLAUDE.md` in the root AccentOS repo serve a similar state-tracking purpose to `agent-os-runtime/state/queue.json`. These should be rationalized — either AccentOS adopts AgentOS Runtime for its own task tracking, or they remain separate with clear boundaries.

---

## Recommended Cleanup Opportunities (post-governance)

1. Add `schemas/event.schema.json` to formally validate the JSONL event format.
2. Add `schemas/queue.schema.json` to validate `state/queue.json`.
3. Move example tasks to a `examples/` subdirectory to separate them from operational `tasks/`.
4. Add a `conftest.py` to the test suite with shared fixtures to reduce duplication.
5. Pin Python version in a `.python-version` file.

---

## Safe to Resume After Governance Restructuring

- No in-flight operations
- No partial commits
- No temporary/debug artifacts
- All tests passing
- Runtime executes cleanly
- Branch is pushed to remote

**The runtime can be picked up exactly as-is after restructuring completes.**
