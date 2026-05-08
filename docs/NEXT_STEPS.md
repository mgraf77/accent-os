# Next Steps — Post-Governance Restructuring

> These are the recommended actions once the governance restructuring is complete and this branch/workstream resumes. Do not begin these during stabilization.

---

## Immediate (First Session Back)

1. **Resolve Worker 400 bug.** Michael runs `wrangler deploy` from `C:\Users\Michael\Desktop\accent-os` after `git pull origin main`. Then test Parse Notes in Quote Generator. If still 400, follow diagnostic steps in WORK_IN_PROGRESS.md step 2.

2. **Run M01 SQL.** Michael pastes `sql/M01_rls_tightening.sql` into Supabase SQL editor. Verifies anon policies are dropped and auth policies are live.

3. **Run M02 SQL.** Michael pastes `sql/M02_core_schema.sql` into Supabase SQL editor. This unblocks all Track 1–4 features that reference the 18-table schema.

4. **Verify model ID.** Confirm `claude-sonnet-4-20250514` is still a valid model ID. Update `aiParseNotes` if needed.

---

## After Governance Restructure Is Defined

5. **Reconcile branch with main.** Determine whether `claude/chatgpt-limits-guide-ADDqi` and any other Claude-built branches need merging or rebasing before restructuring begins.

6. **Evaluate skills/ directory.** The `skills/` folder has 20+ skills mixed with AccentOS-specific logic. Governance restructuring should define which skills are AccentOS-local, which belong in a shared Skills repo, and which should move to AgentOS.

7. **Evaluate js/ module coupling.** The 37 files in `js/` share globals via `window`. Any repo split must account for this coupling before extraction.

8. **Continue BUILD_PLAN_CLAUDE.md Track 2–4 items** once M02 is live and the Worker bug is resolved.

---

## Documentation Backlog

- Update MASTER.md to reflect current module status after M01/M02 run.
- Update SESSION_LOG.md with any post-restructure sessions.
- Retire or archive stale skill entries in `skills/_index.md` once governance defines canonical skill home.
