# /aos-ingest — Ingest content into wiki

**Trigger**: `/aos-ingest [content or file path or URL]`

## What it does

Takes raw content (paste, file reference, or URL) and converts it to a wiki page with proper frontmatter + cross-links. Updates wiki/index.md and wiki/log.md. Runs lint before committing.

## Steps

1. Parse the input: what type of content? (vendor info, lighting spec, SOP, decision, entity)
2. Choose page type: concept | decision | entity | source | synthesis
3. Generate slug: kebab-case, unique, ≤40 chars
4. Extract signal: distill to ≤600 words, strip boilerplate
5. Identify cross-links: which existing wiki slugs does this relate to? Add [[wikilinks]]
6. Write page: `wiki/<type>/<slug>.md` with complete frontmatter
7. Update `wiki/index.md`: add row to correct section
8. Append to `wiki/log.md`: `- ingest: slug — description`
9. Run `python3 skills/accent-rag/scripts/wiki_lint.py` — fix any errors
10. Commit: `wiki: ingest [slug]`

## Rules

- Never modify Layer 1 files (MASTER.md, BUILD_PLAN_*, js/, sql/, index.html)
- Sensitive content (customer data, internal pricing strategy) → `sensitive: true` in frontmatter
- If unsure of type: default to concept
- If content already has a wiki page: update the existing page, bump `updated:` date
- Max 600 words per page

## Example

```
/aos-ingest "WAC Lighting offers 3% rebate, Net 30 terms, free freight at $1500, 
strong display program (50% discount, quarterly promos, annual buyback)"
```

→ Creates or updates `wiki/entities/vendors/wac-lighting.md`
→ Cross-links to [[vendor-scoring]], [[rubric-rebates]], [[rubric-display]]
