# /aos-index — Regenerate wiki/index.md

**Trigger**: `/aos-index`

## What it does

Scans all wiki/ markdown files, reads their frontmatter, and regenerates wiki/index.md from the ground truth on disk. Fixes index drift.

## Steps

```bash
python3 skills/accent-rag/scripts/wiki_seed.py --reindex \
  --source wiki/ \
  --output wiki/index.md
```

Or manually: scan all wiki/**/*.md, extract slug + title + confidence + updated from frontmatter, group by type, write wiki/index.md table format.

## When to use

- After batch-ingesting multiple pages (index.md may be out of sync)
- After renaming or deleting a wiki page
- When wiki_lint.py reports index_drift errors

## Output

Rewrites wiki/index.md completely from disk state. Format matches existing wiki/index.md table structure.

## Notes

- Safer to run `/aos-lint` after to verify zero index_drift errors
- Does not modify any page content — only wiki/index.md
- Commit with: `wiki: regenerate index.md`
