---
name: aos-close
description: >
  Session-close ritual. Appends a structured block to wiki/log.md and overwrites
  wiki/hot.md with a fresh ~500-word session-end snapshot.
trigger: "/aos-close"
---

# /aos-close

## Steps

1. **Compute the session summary.** Look at:
   - Files touched this session (`git diff --name-only HEAD`)
   - Commits made this session (`git log --oneline ...`)
   - Wiki pages created/updated (any `wiki/*.md` in the diff)
   - User-facing changes shipped (cross-ref the SESSION_LOG.md entry being written this session)
   - Open loops left (from WORK_IN_PROGRESS.md)

2. **Append to `wiki/log.md`** (newest at bottom):
   ```
   ## [YYYY-MM-DD] session-close | v<version>
   **Wiki pages created:** <list>
   **Wiki pages updated:** <list>
   **Code shipped:** <one-line summary, version-tagged>
   **Open loops:** <bullet list>
   **Next-session entry:** <one paragraph>
   ```

3. **Overwrite `wiki/hot.md`** (NOT append — this is a single-state snapshot). Format strictly:
   ```
   # AccentOS Wiki — Hot Cache

   > Session context · ~500 words · overwritten at the end of every /aos-close.
   > Last overwritten: YYYY-MM-DD (session-close v<version>).

   ---

   ## Current task
   <1 sentence>

   ## What just shipped (v<version>)
   - bullet
   - ...

   ## Open loops
   - bullet
   - ...

   ## Next-session entry point
   <1 paragraph — written so a fresh Claude Code instance with no context can pick up cleanly>
   ```

4. **Confirm.** Output the wiki-page diff: lines added to `wiki/log.md`, character delta on `wiki/hot.md`.

## Anti-patterns

- Never append to `wiki/hot.md`. Always overwrite. The hot cache is single-state by design.
- Never let `wiki/hot.md` exceed ~600 words — it gets read silently every session start; bigger = more context cost for no gain.
- Never skip the `Next-session entry point` paragraph — it's the load-bearing field of the whole pattern.
