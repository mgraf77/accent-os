# Next Steps — AgentOS Runtime
**Context:** Post-stabilization. Governance restructuring incoming.
**Do not begin these until governance restructuring is complete.**

---

## Immediate (v1.1 — after governance pause)

### 1. Task Status Writeback
The runtime reads task status but never writes it back to `.md` files.
Build `runtime/task_writer.py` — a safe module that:
- Updates YAML frontmatter status in-place
- Logs a `task_updated` event before and after every write
- Never mutates task body/content

### 2. Approval Gate for High-Risk Tasks
Currently `high` risk tasks are safety-blocked with no path forward.
Build `runtime/approval_engine.py`:
- Writes pending-approval tasks to `state/pending_approvals.json`
- Provides a simple CLI to approve/reject: `python runtime/approval_engine.py --approve TASK-XXXXXX`
- Approval logs a `safety_approved` event

### 3. Tick Scheduler (optional)
Wrap `run_tick.py` in a simple scheduler (cron or `apscheduler`) for hands-free operation.
Only add if needed — cron is sufficient for most use cases.

---

## Medium-Term (v2 — post-governance)

### 4. Multi-Agent Actor Support
Add `actor` registry to schemas. Validate that actors in events are registered.
Support: `claude-code`, `chatgpt`, `codex`, `human`, `system`

### 5. Task Status Writeback → Git Commit
When task completes, automatically create a `commit_created` event and optionally a git commit updating the task file status. Requires careful safety gating.

### 6. MCP Integration Hooks
Add optional `mcp_tool` field to task frontmatter:
```yaml
mcp_tool: supabase.execute_sql
mcp_params:
  query: "SELECT count(*) FROM tasks"
```
The runtime calls the MCP tool as part of task execution. NOT for v1 — requires full execution engine.

### 7. Web Dashboard
Simple read-only HTML dashboard that renders:
- `state/queue.json`
- `reports/runtime-summary.md`
- `reports/task-graph.md`
No writes from the UI — observability only.

---

## Architectural Concerns to Resolve in Governance Phase

- **Where does this live?** `agent-os-runtime/` is currently inside `accent-os` repo. May need to be extracted to its own repo (`agent-os-runtime` or `agentOS-core`) during restructuring.
- **Shared schema ownership.** `schemas/task.schema.json` should have a canonical home — not duplicated across repos.
- **Skills integration.** How do AccentOS skills (e.g. `vibe-speak`, `efficiency-monitor`) trigger tasks in this runtime? Define the interface.
