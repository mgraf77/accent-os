---
name: aos-process-inbox
description: >
  Sweep wiki/inbox/, classify each note, integrate into the right concept/entity/synthesis
  page, then archive the original inbox file under wiki/raw/inbox-archive/<date>/.
trigger: "/aos-process-inbox"
---

# /aos-process-inbox

## Steps

1. **List `wiki/inbox/`.** Each file is a fleeting note dropped by Michael (or by Claude during a session). Filenames aren't load-bearing — the note's content classifies it.

2. **For each file:**
   1. Read it.
   2. Classify: `concept` (reusable idea), `entity-update` (about a specific vendor/customer/employee/rep), `decision` (architectural intent), `source` (someone forwarded a doc), `chatter` (drop without integrating).
   3. Pick the destination page; create it if it doesn't exist (treating the inbox file itself as the source).
   4. Integrate the content — never paste the inbox file verbatim; rewrite into the destination page's voice and section structure.
   5. Move the original to `wiki/raw/inbox-archive/<YYYY-MM-DD>/<original-filename>` so the provenance is preserved.

3. **Append to `wiki/log.md`** as a single block:
   ```
   ## [YYYY-MM-DD] inbox-process | <count> notes
   **Notes processed:** <count>
   **Pages created:** <list>
   **Pages updated:** <list>
   **Archived:** wiki/raw/inbox-archive/<YYYY-MM-DD>/
   ```

## Anti-patterns

- Never just rename inbox files into wiki/ — that bypasses the integration step. The point is to **merge** notes into existing pages.
- Don't archive a note before its content is integrated. Save-then-move pattern: write the destination page first, then `git mv` the inbox file.
