# /aos-wiki — Open or navigate the AccentOS Wiki

**Trigger**: `/aos-wiki [optional slug]`

## What it does

Opens the AccentOS Wiki sidebar module in the UI (navigates to the `wiki` page in AccentOS). If a slug is provided, opens that specific wiki page directly.

## Usage

```
/aos-wiki                        → opens wiki home (index view)
/aos-wiki vendor-scoring         → opens vendor scoring hub page
/aos-wiki rubric-rebates         → opens rebates rubric page
/aos-wiki lighting-reference     → opens lighting reference hub
```

## In AccentOS UI

The wiki module (js/wiki.js, page key: `wiki`) renders:
- Left pane: searchable index of all wiki pages, grouped by type
- Right pane: rendered markdown content of selected page
- [[wikilinks]] are clickable links within the pane
- "Grounded · N wiki" pill appears in Ask the Engine when wiki pages were used

## For Claude Code sessions

When Michael says "check the wiki", "what does the wiki say about X", "open the wiki page for Y":
1. Run /aos-search first to find the relevant slug
2. Read the wiki page at `wiki/<type>/<slug>.md`
3. Surface the content in the response
4. If page doesn't exist: offer to /aos-ingest it
