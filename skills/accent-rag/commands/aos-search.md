# /aos-search — Search the wiki

**Trigger**: `/aos-search [query]`

## What it does

Searches wiki pages for content matching the query. Returns top-3 results with excerpts and links.

## Steps

1. Extract key terms from query
2. If BUILD-RAG available: run `python3 skills/accent-rag/scripts/rag_search.py --wiki-only "[query]"`
3. Else: scan wiki/index.md for title + slug matches → score by term overlap
4. Fetch top-3 matching pages
5. Return: page title, slug, confidence, first 150 chars of body, [[wikilinks]] in that page

## Output format

```
Found 3 wiki results for "rebate programs":

1. **Rubric: Rebates** (rubric-rebates) — confidence: high
   "Highest-weight financial category. Rebates are year-end backend payments..."
   Related: [[vendor-scoring]], [[rubric-discounts]]

2. **Vendor Scoring System Hub** (vendor-scoring) — confidence: high
   "Accent Lighting scores every vendor on a 14-category, 0–10 rubric..."
   
3. **SOP: Vendor Onboarding** (sop-vendor-onboarding) — confidence: high
   "Vendor Onboarding Step 2: Request wholesale price list, net terms, rebate program..."
```

## Example

```
/aos-search "what's the freight threshold for top vendors"
/aos-search "CRI requirements retail"
/aos-search "emergency lighting battery duration"
```
