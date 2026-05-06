---
name: aos-ingest
description: >
  Ingest a raw source into the AccentOS Wiki. Reads a path (or URL fetched into wiki/raw/),
  writes a wiki/sources/<slug>.md summary, creates or revises the relevant concept and
  entity pages it touches, updates wiki/index.md, and appends a structured entry to
  wiki/log.md. Karpathy LLM Wiki pattern — see skills/accent-rag/SKILL.md and wiki/CLAUDE.md.
trigger: "/aos-ingest"
---

# /aos-ingest <path>

## When to run
A new external source has landed and needs to compound into the wiki:
- A vendor playbook PDF dropped into `wiki/raw/articles/`
- A new memo from Eugene at Lights America (markdown copy in `wiki/raw/articles/`)
- A research transcript in `wiki/raw/transcripts/`
- A Phase2B-style spec doc
- An external article worth retaining
- A Layer-1 file inside the repo that hasn't been wiki-summarized yet (`MASTER.md`, `BUILD_INTELLIGENCE.md`, etc.)

## Steps

1. **Read the source verbatim.** No skimming. Use `Read` (Markdown / text / PDF) or `WebFetch` (URLs already fetched into `wiki/raw/`).

2. **Extract 3–5 key claims.** What does this source actually claim? What's new vs. what the wiki already has? What's contradictory? Be specific — a "claim" is a falsifiable statement, not a topic.

3. **Pick a slug.** kebab-case, no punctuation. Look at neighbors in `wiki/sources/` to avoid collision. Check uniqueness with `ls wiki/sources/`.

4. **Write `wiki/sources/<slug>.md`.** Use the `type: source` frontmatter from `wiki/CLAUDE.md`. Body: ≤200-word Summary · bulleted Key Claims with `[[concept-slug]]` references · Cross-refs section listing every concept/entity the source touches.

5. **For each touched concept:** Open `wiki/concepts/<concept-slug>.md` (or create it if missing). Add the new claim to the appropriate body section. Append `[[<source-slug>]]` to the page's `sources:` frontmatter list. If the new claim contradicts an existing claim, add a `> ⚠️ Contradicts [[other-source-slug]]: <one-line reason>` note inline AND append `<source-slug>` to the page's `contradictions:` frontmatter list.

6. **For each touched entity:** Same shape, in `wiki/entities/{vendors|customers|employees|reps}/<slug>.md`. If the source updates a vendor's terms (discount %, freight, etc.), update the entity page's "Terms" section AND bump `data_snapshot_date:` in frontmatter.

7. **Update `wiki/index.md`.** Add the new source under "Sources" with a one-line summary. Update the one-line summary on every concept/entity page that materially changed.

8. **Append to `wiki/log.md`.** Format:
   ```
   ## [YYYY-MM-DD] ingest | <source title>
   **Source:** <path>
   **Pages created:** wiki/sources/<slug>.md, wiki/concepts/<slug>.md (if new)
   **Pages updated:** wiki/concepts/<slug>.md, wiki/entities/.../<slug>.md
   **Contradictions flagged:** wiki/concepts/<slug>.md (vs. <prior-source>)
   **Notes:** <one-line>
   ```

9. **Confirm.** Output a single scan-block listing pages created and updated, contradiction count, and link to the new `[[sources/<slug>]]`.

## Anti-patterns

- Never modify the raw source itself.
- Never skip the log entry — `/aos-trace` depends on it.
- Never invent `[[wikilinks]]` to pages that don't exist; create them in the same pass or use plain text.
- Never silently dedupe a "key claim" that conflicts with an existing claim. Flag it.
- A single ingest typically touches **5–15 wiki pages**. If you only touched the source page, you missed the point — go back and update the concept and entity pages this claim affects.
