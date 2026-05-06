# /aos-close — Close wiki session

**Trigger**: `/aos-close`

## What it does

Runs the end-of-session wiki close-out: refreshes wiki/hot.md, appends session block to wiki/log.md, runs lint, commits.

## Steps

1. Run `/aos-lint` — verify zero errors
2. Update `wiki/hot.md`:
   - Set `Updated: YYYY-MM-DD HH:MM`
   - Update "What shipped (last session)" with this session's changes
   - Update "Open loops" with any unresolved items
   - Update "Next-session entry point" with exact first action
3. Append session-close block to `wiki/log.md`:
   ```markdown
   ## YYYY-MM-DD session-close
   - shipped: [list of pages created/updated]
   - open: [unresolved items]
   ```
4. Run `/aos-lint` again — zero errors
5. Commit: `wiki: session close [date]`

## Notes

- /aos-close is required at every session end that touched wiki/
- hot.md is the handoff document — the next session reads it first
- If interrupted before /aos-close: next session should run /aos-lint and then manually update hot.md before any new work
- .claude/CLAUDE.md AUTO-EXECUTE reads hot.md at start; it must be fresh
