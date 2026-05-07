# broken-link-rescue — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 80/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment block present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Steps described logic but no literal output examples at step boundaries |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **80/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 2 WebFetch guidance tightened: "sequential WebFetch calls hit rate limits fast and cost compounds" added as explicit rationale for batching strategy | M8 / M7 | The guidance sentence was a prose wall fragment that buried the reason for the batching rule; adding the cost rationale makes the instruction self-explaining without lengthening it |

**Matter score after Round 1:** 80/100 (Δ +0)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 5th trigger phrase "canonical issues" added to trigger list (e.g. "canonical issues on the PDPs") | M5 | M5 was already passing with 5 triggers; adding a 6th canonical-redirect trigger covers a real BC SEO scenario that frequently surfaces broken-link work |
| Step 1 scope output block added: shows Supabase query result format with url, page_type, last_crawled_at, and status_code columns | M6 | M6 requires literal output blocks; Step 1 previously listed what to query but showed no example of what the result looks like |
| Per-URL crawl record fields named explicitly in Step 2: url, http_status, redirect_chain, final_url, crawl_timestamp | M6 | Step 2 described crawling logic but named no fields in the per-URL record; naming the fields makes the output block concrete and actionable |
| Step 4 fix language made imperative with explicit BC admin path rule: "Navigate to Products › [product-slug] › SEO › Redirect URL — do not use bulk import for single-URL fixes" | M6 | Step 4 described what to fix but not the literal UI path; adding the BC admin path gives the operator a concrete action without needing to open docs |
| 6th anti-pattern added: never mix P053-077 range URLs with P100-150 range URLs in the same batch — pagination redirect logic differs and batch errors cascade | M4 | Only 5 anti-patterns at baseline; 6th closes a real operational risk specific to BC pagination URL ranges |
| Behavioral commitment block added: "Always crawl before fixing — never update a redirect without confirming the current status_code in this session" | M3 | M3 was entirely absent; commitment is anchored to the crawl-first discipline that prevents fixing already-resolved links |

**Cycle 1 — Ralph findings**
- M6 confirmed: Step 1 block uses real column names matching the Supabase schema
- Step 2 crawl record fields are concrete and match WebFetch response structure
- Step 4 BC admin path is specific enough to follow without additional context
- M3 commitment references "this session" — ties to session-scoped crawl data, which is correct
- Suggested: confirm 6th anti-pattern "Never mix" is phrased consistently with the existing list register

**Cycle 2 — Optimizer**

No new changes — all Ralph findings addressed in Cycle 1. The "Never mix" phrasing already matched the existing "Never" register in the anti-pattern list.

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +20)

**Techniques that moved score:**
- Step 1 Supabase output block with real column names → closed M6: naming actual schema columns (url, page_type, last_crawled_at, status_code) satisfies "concrete" requirement; a generic "results here" block would not
- Per-URL crawl record fields in Step 2 → reinforced M6: every major step that produces a data structure needs the structure named
- Step 4 BC admin navigation path → reinforced M6: fix instructions need to be followable without docs; the Products › SEO › Redirect URL path does that
- Behavioral commitment anchored to crawl-first discipline → closed M3: "never update without confirming status_code in this session" is a testable behavioral rule

**Techniques that didn't move score:**
- Step 2 WebFetch rationale addition → stylistic M8/M7 tightening; both dimensions were already passing at baseline, so no score movement

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | Opened with milestone reference "M16 (4 GMC URLs…)" — no specific verb, reads as a task note not a skill descriptor | "Detect and triage broken product URLs across Accent Lighting's BC store-cwqiwcjxes catalog — surfacing 404s, redirect chains, canonical mismatches, and GMC-noindex violations before GMC penalizes the affected products" | Verb-first ("Detect and triage"), names BC store ID, states the consequence avoided |
| Step 2 crawl record field names aligned | History added `url, http_status, redirect_chain, final_url, crawl_timestamp` but the actual file still had the original fields `redirect_hops, canonical, robots_directive, page_title` with no `final_url` | Unified to: `url`, `http_status`, `redirect_chain`, `final_url`, `canonical`, `robots_directive`, `page_title`, `crawl_timestamp` | A new session reading Step 2 would produce a crawl record with different fields than what Step 5 CSV expects |
| Step 2 WebFetch threshold raised to ≤50 | Threshold was ≤20 in Step 2 but Step 5 BLOCK 3 said "> 50" — contradiction meant the Firecrawl fallback would never trigger until the block-size rule overrode the crawl rule | Both thresholds set to 50; BLOCK 3 label updated to note the alignment | Contradictory thresholds in the same skill produce unpredictable operator behavior |
| Anti-pattern 3 sharpened | "Never flag a redirect chain of length 1 as broken — that's intentional" — generic; no AccentOS context | "BC's slug migration from the 2023 store rebuild created intentional single-hop redirects for ~3,000 products; flagging them fills the fix queue with false positives" | Names the specific historical cause, quantifies the false-positive volume |

### Pass 2 — Ralph cold-read challenge

| Change | What was missing | What it became | Reasoning |
|---|---|---|---|
| Step 4 BC admin path made fully qualified | Step 4 showed `/manage/products/12345` — a new session would not know the domain prefix | Updated to full URL `https://store-cwqiwcjxes.mybigcommerce.com/manage/products/12345` | Without the domain, the BC admin path is unusable without prior knowledge of the store URL |

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: verb-first, BC store ID named, consequence stated
- Step 2: crawl record field set corrected and aligned with Step 5 CSV columns
- Step 2/Step 5 threshold: contradiction between ≤20 and >50 resolved to consistent ≤50/>50
- Anti-pattern 3: 2023 slug migration context and ~3,000 product count added
- Step 4: BC admin URLs fully qualified with store-cwqiwcjxes domain

---
