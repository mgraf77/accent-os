# /aos-lint — Lint all wiki pages

**Trigger**: `/aos-lint`

## What it does

Runs wiki_lint.py to check all wiki pages for structural issues. JSON output to stdout. Zero errors required before any wiki commit.

## Steps

```bash
python3 skills/accent-rag/scripts/wiki_lint.py --source wiki/ --json
```

## Checks performed

| Check | Description |
|-------|-------------|
| broken_wikilinks | [[slug]] that has no matching entry in wiki/index.md |
| orphan_pages | Pages with no inbound wikilinks from other pages |
| missing_frontmatter | Pages missing required YAML fields |
| bad_slugs | Slug in frontmatter doesn't match file path basename |
| index_drift | Slug exists in index.md but not on disk, or vice versa |
| stale_low_confidence | Pages with confidence: low AND updated > 90 days ago |
| oversized_pages | Pages > 800 words (warning, not error) |

## Output format

```json
{
  "errors": {
    "broken_wikilinks": ["rubric-xxx in vendor-scoring.md → slug not found"],
    "missing_frontmatter": ["concepts/new-page.md missing: slug, confidence"],
    "index_drift": ["concepts/orphan.md not in index.md"]
  },
  "warnings": {
    "stale_low_confidence": ["source-build-plan-michael.md: low confidence, 95 days old"],
    "orphan_pages": ["modules/some-module.md: no inbound links"],
    "oversized_pages": ["concepts/lighting-reference.md: 850 words (limit 800)"]
  },
  "stats": {
    "pages_checked": 32,
    "errors": 0,
    "warnings": 2
  }
}
```

## When to run

- Before every wiki commit
- After `/aos-ingest` (step 9)
- After `/aos-ralph` fixes
- Automated by `/aos-close`
