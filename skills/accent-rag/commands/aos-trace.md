---
name: aos-trace
description: >
  Concept archaeology. Shows how a wiki page evolved across log entries — which sources
  contributed each claim, when contradictions were resolved, what the page looked like
  N days ago. Powered by git history + wiki/log.md grep.
trigger: "/aos-trace"
---

# /aos-trace <concept-or-entity-slug>

## Steps

1. **Locate the page.** Look in `wiki/concepts/<slug>.md`, `wiki/entities/.../<slug>.md`, `wiki/syntheses/<slug>.md`. Error if not found.

2. **Grep `wiki/log.md` for the slug.** List every `## [date] <op>` block that references this page in its `Pages created:` / `Pages updated:` lines.

3. **Walk git history** for the page file:
   ```bash
   git log --follow --oneline -- wiki/<path>/<slug>.md
   ```
   For each commit, capture: short-SHA, date, commit subject.

4. **Compose the trace.** Output:

```
## /aos-trace · [[<slug>]]

### Page summary
- Type: <type>
- First created: YYYY-MM-DD (commit <sha>)
- Last updated: YYYY-MM-DD (commit <sha>)
- Total revisions: <n>
- Confidence: <current confidence>

### Evolution
| Date       | Op       | Source(s)                | What changed |
|------------|----------|--------------------------|--------------|
| 2026-04-01 | ingest   | [[sources/foo-memo]]      | Initial draft from source |
| 2026-04-12 | recall   | (filed from query)        | Added section on X |
| 2026-04-19 | ingest   | [[sources/bar-playbook]]  | Resolved contradiction; bumped confidence high→medium |
| 2026-05-02 | lint     | -                         | Fixed 1 broken link |

### Outstanding contradictions
<from current frontmatter contradictions:>

### Sources currently cited
<from current frontmatter sources:>
```

## Anti-patterns

- Never rewrite the page during a trace — `/aos-trace` is read-only.
- If the slug doesn't exist, suggest the closest match via BUILD-RAG `--path-prefix wiki/ --dump`.
