# Extraction Sources Checklist
# Used by skill-forge Step 2. Run parallel searches across all five layers.
# Mark the layer complete only when you've harvested concepts OR confirmed nothing relevant.

---

## Layer 1 — GitHub

- [ ] Primary repo README — top-level
- [ ] SKILL.md / SKILL.yaml files — every one in the repo
- [ ] docs/ folder — getting-started, concepts, architecture
- [ ] Top-level folder structure — folder names ARE concept hints
- [ ] Issues (open + closed top-20) — real friction points
- [ ] Discussions tab — feature requests, use-case threads
- [ ] CHANGELOG.md — what the maintainer thinks is shipping value
- [ ] examples/ or demos/ folder — real-world usage shape
- [ ] "awesome-X" lists referencing the repo — context placement

Search patterns:
- `site:github.com [target] SKILL.md`
- `[target] github "use case"`
- `[target] awesome-claude-skills`

---

## Layer 2 — Official site

- [ ] Homepage hero copy — the maintainer's one-line pitch
- [ ] /features or /product page
- [ ] /use-cases or /solutions page
- [ ] /docs landing page — info architecture reveals concept hierarchy
- [ ] /pricing page — paid features = real value signal
- [ ] /customers or /case-studies — who actually uses this and for what
- [ ] /blog or /changelog (often different from GitHub)

Skip: marketing fluff pages (/about, /team) unless they reveal positioning.

---

## Layer 3 — Social

- [ ] X/Twitter — search "[target name]" + author handle, last 90 days
- [ ] Reddit — site:reddit.com [target] — usually has the most honest takes
- [ ] Hacker News — Algolia search [target] — technical critique
- [ ] LinkedIn — case-study posts from B2B users
- [ ] Mastodon / Bluesky — early-adopter chatter

Signal: complaint threads reveal what doesn't work and what's missing — those are ADD candidates in the gap analysis.

---

## Layer 4 — Reviews & blog posts

- [ ] Medium / Substack — independent reviews (skip pure listicles)
- [ ] dev.to / hashnode — technical walkthroughs
- [ ] YouTube — pull transcripts if available, demo videos show real workflows
- [ ] Podcasts — maintainer interviews reveal "why this exists"

Discount paid placements and listicles. Weight independent technical posts heavily.

---

## Layer 5 — Pricing & access (paid tools only)

- [ ] What's free vs paid?
- [ ] What's gated behind enterprise?
- [ ] What integrations ship out-of-box?
- [ ] What's API-accessible vs UI-only?

Gates expose value. If the cascade feature is on the $500/mo tier, that's the killer feature regardless of what the homepage emphasizes.

---

## Saturation rule

Stop adding sources once 3 consecutive new sources produce 0 new concepts.
That's enough. More sources past saturation = wasted tokens.

---

## Anti-sources (skip)

- AI-generated review farms (look for repetitive phrasing across "different" sites)
- Comparison pages on competitor SaaS sites (biased)
- Affiliate-link-heavy listicles
- Old (>18 months) reviews of fast-moving tools
