# How the AccentOS RAG System Works

> Written for Michael. Assumes no prior knowledge of RAG, search engines, or AI tooling.

---

## What problem does this solve?

Without RAG, when you ask Ask the Engine something like *"what does a 3% rebate score?"* — Claude is guessing from its training data. It's never seen your vendor rubrics. It might hallucinate a number, or give you a generic answer about rebates that has nothing to do with Accent's scoring system.

With RAG, Ask the Engine first searches your internal wiki, finds the actual `rubric-rebates` page, reads it, and then answers. The answer is grounded in your real data.

**RAG = find the right pages → feed them to Claude → Claude answers from your content.**

---

## The two things the system is made of

### 1. The Wiki (`wiki/`)

107 markdown files, each covering one piece of Accent Lighting's internal knowledge:

- Vendor scoring rubrics (14 pages — one per category)
- The hub page tying them all together (`vendor-scoring`)
- Lighting specs (CRI, footcandles, dimming, emergency compliance)
- SOPs (vendor onboarding, rep outreach, quote creation)
- Architecture decisions (ADR-001 through ADR-007)
- Team profiles (Michael, Paul, Patrick)
- 30 vendor profiles
- 35 AccentOS module pages

These are just text files. No database. No server. They live in `wiki/` in the repo.

### 2. The Search Index (`skills/accent-rag/index/rag_index_compact.json`)

A 450KB JSON file that the browser loads to search the wiki without fetching every page. It contains pre-computed relevance scores telling the search engine "for the word 'footcandle', here are the chunks most likely to contain useful content, ranked by relevance."

Think of it like the index at the back of a textbook — instead of reading every page to find "footcandles," you look up the term in the index and go directly to the right page.

---

## What happens when you ask Ask the Engine a question

```
You type: "What CRI do we need for retail lighting?"
                ↓
Step 1: js/wiki.js runs a search against the index
        • Strips noise words ("what", "do", "we", "need", "for")
        • Searches: [cri, retail, lighting]
        • Scores all 133 wiki chunks against those terms
                ↓
Step 2: Graph re-ranking boosts related pages
        • cri-tm30-tlci ranks #1
        • cri-tm30-tlci has "related: [lighting-reference]" in its header
        • lighting-reference gets a bonus score and moves up
                ↓
Step 3: Top 3 unique pages are selected
        1. cri-tm30-tlci
        2. lumen-output-commercial
        3. lighting-reference
                ↓
Step 4: Those 3 pages are fetched and added to Claude's context
                ↓
Step 5: Claude reads them and answers
        "For retail, you need CRI ≥ 90. Commercial minimum is CRI ≥ 80..."
                ↓
You see the answer + a "Grounded · 3 wiki" pill in the UI
```

The whole search happens in under 200ms. By the time you finish reading your own question, the wiki pages are already in Claude's context.

---

## The search algorithm (BM25)

The search engine uses an algorithm called **BM25** (Okapi BM25). It's the same algorithm used by Elasticsearch and most enterprise search tools.

BM25 answers the question: *"Given this query, which chunks of text are most likely to be relevant?"*

It does this by looking at three things for each word in your query:

**1. How rare is this word in the wiki overall?**

"lighting" appears in almost every page — it's not very discriminating. "footcandle" appears in a handful of pages — when you search for it, you really want those pages. BM25 rewards rare words more than common words. This is called **IDF** (Inverse Document Frequency).

**2. How often does this word appear in this specific chunk?**

A chunk that mentions "rebate" seven times is more likely to be about rebates than one that mentions it once. But BM25 doesn't count linearly — the 7th mention of "rebate" helps less than the 1st. It **saturates**, so one densely-mentioned topic doesn't completely dominate.

**3. How long is the chunk?**

A long chunk that mentions "rebate" once is less focused than a short chunk that mentions it once. BM25 **normalizes for length** so that long, sprawling pages don't automatically beat focused, specific pages.

The final score for each chunk = IDF × term frequency (normalized) × a type boost.

### Type boosts

Not all wiki pages are equal. Before search scores are computed, every page gets multiplied by:

| Page type | Boost | Why |
|-----------|-------|-----|
| concept | 1.5× | Your core domain knowledge — this is what you want to find |
| decision | 1.4× | Architecture decisions are high-value when they're relevant |
| entity | 1.2× | People and vendors |
| module | 1.1× | AccentOS JS module docs |
| source | 0.75× | Provenance summaries — don't crowd out real content |
| synthesis | 0.75× | Meta-analysis pages — same reason |

So if a concept page and a source page both match your query equally well on text alone, the concept page wins by a 2× margin (1.5 vs 0.75).

---

## Why there are 133 chunks instead of 107 pages

Wiki pages are split into **sections** before indexing. Each `##` heading in a markdown file creates a new section. Sections shorter than 25 words merge with the next one. Sections longer than 300 words split further.

This matters because BM25 scores chunks, not pages. A 600-word page about CRI standards has two chunks — one intro + table, one practical guidance. A query about "CRI retail" might score very high against the first chunk and low against the second. The system returns the page, but it picks the most relevant chunk to generate a preview snippet.

The split-at-headings approach is specifically designed to keep your scoring tables intact. A hard word-count split could cut a rubric table in half (row 1-5 in chunk A, rows 6-11 in chunk B), destroying the context. Section-aware chunking prevents that.

---

## The graph re-ranking: how hub pages surface

Here's a problem this system had to solve:

`rubric-rebates` is specific and dense — it scores very high for rebate queries. But `vendor-scoring` is the hub page that ties all 14 rubrics together. When you ask "what does a 3% rebate score?", you want `rubric-rebates` AND ideally `vendor-scoring` to surface so Claude has full context.

But `vendor-scoring` is generic — it mentions rebates once in a table row, not 15 times in detail. BM25 ranks it low.

The fix: **graph re-ranking using the `related:` field.**

Every wiki page has a frontmatter header like this:

```yaml
---
related: [vendor-scoring, rubric-discounts, rubric-credit-terms]
---
```

After BM25 scoring, the system looks at the top 10 results and reads their `related:` lists. Any page mentioned in those lists gets a **bonus score** — it's "related to something that's already relevant."

Since `rubric-rebates` has `related: [vendor-scoring]`, when `rubric-rebates` ranks #1, it boosts `vendor-scoring`. This surfaces the hub page even though it doesn't score high on raw text.

**The cap:** If 14 rubric pages all link to `vendor-scoring`, the boost is capped at the single highest boost — not 14 boosts added together. Otherwise `vendor-scoring` would dominate every single query, which is wrong.

---

## The stemmer: matching word variants

If your wiki says "Rebates" (capital, plural) but your query says "rebate" (lowercase, singular), do they match?

Yes — because the system uses a **stemmer** that strips common word endings before comparing. 19 rules are tried in order:

- `"scores"` → strip "s" → `"score"`
- `"scoring"` → strip "ing" → `"scor"`
- `"required"` → strip "ed" → `"requir"`

Both the original form AND the stem are indexed. So `"rebates"` in a wiki page indexes as both `"rebates"` AND `"rebat"` (stripping "es"). A query for `"rebate"` (no stem change — singular, no suffix) looks up `"rebate"` in the index.

**A real gotcha we found:** `"rebates"` → strips "es" → `"rebat"`. But `"rebate"` (singular, the query word) → no rule applies → stays as `"rebate"`. These are **different strings**. So pages that only use the plural form ("Rebates | 10 | ≥6%...") don't match a query using the singular form. We found this was preventing `vendor-scoring` from surfacing for "3% rebate" queries — its table only uses the plural. The fix requires using the singular form somewhere in the body text.

**Rule of thumb when writing wiki content:** if you want a page to surface for a query that uses a specific word, use that exact word form in the page body — not just a plural or capitalized variant.

---

## The three Python scripts

These run on your machine (not on any server). You run them from the repo root.

### `rag_build_index.py` — Build the search index

```bash
python skills/accent-rag/scripts/rag_build_index.py
```

Reads every wiki page, splits them into chunks, computes BM25 scores for every word-chunk pair, and writes two files:

- `rag_index.json` (942KB) — full index including page text, for the Python scripts
- `rag_index_compact.json` (450KB) — same but without page text, for the browser

**Run this every time you add, edit, or delete a wiki page.** The index doesn't update automatically. If you edit `rubric-rebates.md` and don't rebuild, Ask the Engine is searching the old version.

What you see when it runs:

```
Building RAG index from wiki/...
  Chunking: section-aware (## headings, max 300w)
  Type boosts: concept 1.5×  decision 1.4×  entity 1.2×  module 1.1×  source 0.75×

Build complete:
  chunks: 133 wiki  0 non-wiki
  vocabulary: 3,187 terms
  avg chunk length: 82.8 tokens
  full index: 942.6KB
  compact index: 449.8KB
```

### `rag_search.py` — Search from the command line

```bash
python skills/accent-rag/scripts/rag_search.py "your question here"
```

Runs the full search pipeline and shows you the results. You'd use this to:

- Test that a new wiki page actually surfaces for the queries you expect
- Debug why Ask the Engine gave a bad answer (search for the same query manually and see what it found)
- Check whether your recent edits to a page improved or hurt its ranking

Example:

```bash
python skills/accent-rag/scripts/rag_search.py "what score does a 3% rebate get"
```

Output:
```
Search: "what score does a 3% rebate get"  (3 results)

1. **Rubric: Rebates** (rubric-rebates) [wiki] score=8.085
   ≥6% earns a score of 10; 3% earns 7; 0% earns 0.
   Path: wiki/concepts/rubric-rebates.md

2. **Rubric: Lighting One Membership** (rubric-l1-member) [wiki] score=7.967
   L1 membership unlocks negotiated rebate tiers...
   Path: wiki/concepts/rubric-l1-member.md

3. **SOP: Vendor Onboarding** (sop-vendor-onboarding) [wiki] score=7.163
   Key questions to ask vendor rep: rebate tier thresholds...
   Path: wiki/concepts/sop-vendor-onboarding.md
```

The score is relative — higher is more relevant. What matters is the rank order, not the exact number.

**Flags you might use:**

```bash
# Get 5 results instead of 3
python rag_search.py --top-k 5 "CRI for retail"

# Interactive mode — type queries one at a time
python rag_search.py

# Output raw JSON (useful for debugging)
python rag_search.py --json "emergency lighting"
```

### `rag_eval.py` — Measure how well the system works

```bash
python skills/accent-rag/scripts/rag_eval.py
```

This runs **40 pre-written test questions** where the "right answer" (which wiki page should surface) is already known. It reports:

- **Recall:** For every question, does the right page appear somewhere in the top 3? (Current: 100%)
- **Precision:** Of all the result slots returned, what fraction are actually useful? (Current: 50.8%)
- **Rank Quality (MRR):** Is the right page #1, or buried at #3? (Current: 93.3%)
- **Coverage:** Is the answer even in the wiki? Can it theoretically be found? (100%)
- **Diversity:** Are the 3 results different pages, not 3 chunks from the same page? (100%)

Current overall score: **90.7% composite.**

You'd run this after making significant changes to the wiki or to the search scripts — it tells you whether things got better or worse.

---

## How to add new knowledge to the wiki

The full workflow is covered in `wiki/CLAUDE.md`. Short version:

1. **Write the page** as a markdown file in the right subfolder (`wiki/concepts/`, `wiki/decisions/`, etc.)
2. **Add the frontmatter** at the top — type, slug, title, related pages, confidence, sensitivity flag, dates
3. **Add the slug to `wiki/index.md`** in the right section
4. **Run lint** to check for errors: `python skills/accent-rag/scripts/wiki_lint.py`
5. **Rebuild the index:** `python skills/accent-rag/scripts/rag_build_index.py`
6. **Test it:** `python skills/accent-rag/scripts/rag_search.py "your test query"`
7. **Run eval** to confirm nothing regressed: `python skills/accent-rag/scripts/rag_eval.py`
8. **Commit everything** — the `.md` file, `index.md`, both index JSON files

---

## How to make a page surface better for a specific query

If you notice Ask the Engine isn't finding the right page for a question, here's how to fix it — in order from lowest to highest risk:

### Fix 1: Add the exact query terms to the page body

If your page says "footcandles" but the query uses "footcandle" (singular), the stemmer might produce different stems and they won't match. Just add the singular form somewhere in the page body.

Similarly, if the query uses a phrase like "questions to ask a vendor rep" — and that phrase doesn't appear on `sop-vendor-onboarding` — add it. Not as filler, but as part of the actual guidance: *"Key questions to ask vendor rep: IMAP enforcement, return/RGA process..."*

### Fix 2: Put the key terms in the lead sentence

The first paragraph of each wiki section gets indexed in the same chunk as the heading. Terms in the lead sentence have better term-frequency ratios (shorter chunk = more concentrated). If a page's key terms are buried in the 4th paragraph, add a one-sentence summary at the top.

### Fix 3: Use the `related:` field to pull up hub pages

If you want `vendor-scoring` to surface alongside `rubric-rebates` for rebate queries, make sure `rubric-rebates` has `vendor-scoring` in its frontmatter `related:` list. When `rubric-rebates` ranks high, it automatically boosts `vendor-scoring`.

### Fix 4: Remove spurious links that cause wrong pages to rank

Sometimes a page surfaces when it shouldn't because another high-ranking page links to it. For example: `lighting-reference` had `dimming-protocols` in its `related:` list. For CRI queries, `lighting-reference` ranked in the top 10, which boosted `dimming-protocols` above `lighting-reference` itself. Removing `dimming-protocols` from `lighting-reference`'s related field fixed this.

### What NOT to do

Don't add specific rubric thresholds to hub pages (like adding "3% rebate earns a score of 7" to `vendor-scoring`). Hub pages already match most queries because they're general. Adding specific content makes them compete directly with the specific rubric pages — and the rubric pages lose. We tested this and it dropped recall from 100% to 97.5%.

---

## Common questions

**Q: Do I need to do anything to make Ask the Engine use the wiki?**

No. It's always on. Every message you send to Ask the Engine automatically triggers a wiki search first. If the search finds relevant pages, they're injected into Claude's context. If nothing relevant is found, Claude answers from its training data alone.

**Q: How do I know if a response was grounded in the wiki?**

You'll see a "Grounded · N wiki" pill in the Ask the Engine UI showing how many pages were injected.

**Q: What if I add a wiki page but Ask the Engine still doesn't use it?**

Make sure you rebuilt the index after adding the page. Then test the query directly with `rag_search.py` to see where your page ranks. If it's not in the top 3, use the fixes above.

**Q: How is this different from just pasting content into the chat?**

Scale and precision. You have 107 pages (growing). Pasting them all into every message would cost a lot and overwhelm Claude with noise. The RAG system finds the 3 most relevant pages automatically — so Claude gets focused, high-signal context rather than a wall of text.

**Q: Does this use any external services?**

No. The search index is a local JSON file. The search runs in the browser. The wiki pages are served from Cloudflare Pages (where the app is hosted). No third-party search API, no embedding API, no database. Zero per-query cost for the RAG layer itself. The only cost is Claude's API usage, which was already there.

**Q: When should I rebuild the index?**

Any time you change a wiki file. The rule is: if `git diff` shows a changed `wiki/*.md` file, rebuild. It takes about 5 seconds.

---

## File map

```
wiki/                               ← 107 pages of internal knowledge
├── concepts/                       ← rubrics, lighting specs, SOPs, patterns
├── decisions/                      ← ADR-001 through ADR-007
├── entities/employees/             ← michael-graf, paul-graf, patrick-graf
├── entities/vendors/               ← top 30 vendors
├── modules/                        ← AccentOS module docs (35 pages)
├── sources/                        ← source summaries (excluded from search)
├── syntheses/                      ← eval reports (excluded from search)
├── index.md                        ← master page registry (not indexed)
├── log.md                          ← session change log (not indexed)
└── hot.md                          ← current handoff state (not indexed)

skills/accent-rag/
├── index/
│   ├── rag_index.json              ← full index (Python scripts use this)
│   └── rag_index_compact.json      ← compact index (browser uses this)
└── scripts/
    ├── rag_build_index.py          ← rebuild the index
    ├── rag_search.py               ← search from command line
    ├── rag_eval.py                 ← run the 40-query benchmark
    └── wiki_lint.py                ← validate wiki for errors

js/wiki.js                          ← browser search engine + wiki sidebar
```
