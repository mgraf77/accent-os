---
name: aos-today
description: >
  Morning briefing. Synthesizes wiki state + open loops + queued ingest items + low-
  confidence pages + BUILD_PLAN deltas since last session into a single scan-block.
trigger: "/aos-today"
---

# /aos-today

## Steps

1. **Read state files.**
   - `wiki/hot.md` (last session's snapshot)
   - `wiki/log.md` last 10 entries
   - `WORK_IN_PROGRESS.md`
   - `BUILD_PLAN_CLAUDE.md` — find first `[ ]` item without an unresolved `BLOCKS ON MICHAEL`
   - `BUILD_PLAN_MICHAEL.md` — list any `[x]` checkboxes that landed since the last `wiki/log.md` `session-close` entry

2. **Run two BUILD-RAG searches** for "open question" and "open loops" against `wiki/`:
   ```bash
   python3 skills/accent-rag/scripts/rag_search.py "open question open loops" --path-prefix wiki/ --k 5 --format json
   ```
   Surface the top hits as "things to revisit."

3. **Compute the brief.** Format:

```
## /aos-today · YYYY-MM-DD

### Where we left off
<from wiki/hot.md "Current task" + "Next-session entry point">

### What changed since last session
<delta from wiki/log.md last 10 entries vs. WIP file>
<any new BUILD_PLAN_MICHAEL [x]>

### Open loops in wiki
- [[<page-slug>]] — <one-line>
- ...

### Low-confidence claims to revisit
- [[<page-slug>]] · last updated <N> days ago
- ...

### First buildable target
<from BUILD_PLAN_CLAUDE.md>

### Suggested first action
<one sentence — usually: "Read [[<slug>]] then start <X>">
```

4. Output to chat. **Do not** append to `wiki/log.md` — `/aos-today` is read-only.

## Anti-patterns

- Don't make /aos-today write anything. It's a read-only briefing.
- Don't include items that lack actionable next steps. Trim aggressively.
