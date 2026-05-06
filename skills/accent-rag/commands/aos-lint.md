---
name: aos-lint
description: >
  Wiki health check. Reports broken wikilinks, orphan pages, contradictions, stale claims,
  index drift, log drift. Resolve in one focused pass.
trigger: "/aos-lint"
---

# /aos-lint

## Steps

1. Run the offline linter:
   ```bash
   python3 /home/user/accent-os/skills/accent-rag/scripts/wiki_lint.py
   ```

2. Linter outputs categorized JSON to stdout. Categories:
   - `broken_links` — `[[<slug>]]` whose target file doesn't exist
   - `orphans` — page on disk with zero inbound links AND not in `wiki/index.md`
   - `index_drift` — page on disk that's missing from `wiki/index.md` (or vice versa)
   - `log_drift` — `wiki/log.md` mentions a page that doesn't exist
   - `contradictions` — frontmatter `contradictions:` non-empty list
   - `stale_low_confidence` — `confidence: low` AND `updated:` >90 days ago
   - `missing_frontmatter` — page without `type:` field
   - `bad_slug` — file name doesn't match `slug:` field in frontmatter

3. **Resolve in priority order:**
   1. `broken_links` — either create the target page (`/aos-ingest` if a source exists) or replace `[[link]]` with plain text + `<!-- TODO: ingest -->`.
   2. `index_drift` — add or remove from `wiki/index.md` to match disk.
   3. `log_drift` — add a back-fill log entry, or strike the bad reference with `~~strikethrough~~ (page renamed/removed YYYY-MM-DD)`.
   4. `contradictions` — re-read both sources, decide the truth, update the cited claim, leave a synthesis page if the resolution is non-trivial.
   5. `stale_low_confidence` — re-evaluate against current data; bump confidence or update the claim.
   6. `orphans` — link to them from somewhere logical, OR delete via git mv with a redirect stub for one cycle.
   7. `missing_frontmatter` / `bad_slug` — fix in place.

4. **Append to `wiki/log.md`:**
   ```
   ## [YYYY-MM-DD] lint | summary
   **Issues found:** <total>
   **Resolved this session:** <total>
   **Deferred:** <total — list categories>
   ```

## Anti-patterns

- Don't auto-resolve contradictions — they need a human read of both sources.
- Don't delete orphans on first pass — they often turn out to be valid pages that just need linking from somewhere.
