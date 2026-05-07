---
name: repo-scout
description: >
  Autonomous GitHub/MCP/skill repository intelligence for AccentOS at
  /home/user/accent-os/. Use this skill any time Michael asks to find,
  evaluate, or vet new repos, skills, MCPs, CLIs, or tools — whether he says
  "find new skills", "what's worth installing", "scout repos", "anything new
  worth grabbing", "what tools should I add", "is [tool X] worth it", "update
  my stack", or any variation. Also triggers when Michael mentions a specific
  tool he's heard about and wants a verdict on. Filters every candidate
  against the live AccentOS stack (BigCommerce store-cwqiwcjxes, Supabase
  hsyjcrrazrzqngwkqsqa, Cloudflare Pages, vanilla JS, Anthropic API) and
  Accent Lighting ecommerce priorities. Skill does three things in one pass:
  (1) discovers and filters candidates against AccentOS + Accent Lighting
  projects, (2) produces a scan-optimized INSTALL/EVALUATE/WATCH/SKIP verdict
  table, and (3) generates a customized install snippet or SKILL.md adaptation
  for everything rated INSTALL. Always delivers a verdict + AccentOS-specific
  customization — never returns a raw list without action items.
---

# repo-scout

**Purpose:** Search GitHub, MCP registries, and skill repositories, filter every candidate against the live AccentOS stack (BigCommerce store-cwqiwcjxes, Supabase hsyjcrrazrzqngwkqsqa), and return a verdict table with paste-ready install snippets — no raw lists, no README hand-offs.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "find new skills / repos / MCPs"
- "scout what's out there"
- "what should I install"
- "is [tool X] worth it"
- "anything new on GitHub for [topic]"
- "update my stack"
- "what am I missing"
- "find me tools for [project]"

---

## Step 1 — Load AccentOS context

Before searching, internalize the active stack from `/home/user/accent-os/skills/repo-scout/references/project-profiles.md`.

Key constraints as filters:
- Stack: BigCommerce, Supabase, Cloudflare Pages, vanilla JS, Anthropic API
- AccentOS repo: mgraf77/accent-os (index.html + 4 module files)
- Already connected MCPs: Notion, Supabase, GitHub, Gmail, Google Calendar, Make, Canva, Vercel, Google Drive, Indeed
- Filter rule: Does this reduce Michael's attention drain on AccentOS or Accent Lighting ecommerce? If not, skip.
- Complexity budget: Setup > 2 min = HIGH FRICTION — flag but still report.

---

## Step 2 — Search for candidates

Run parallel web_search calls. The queries below are the baseline set; extend with gap-specific terms pulled from the named gaps in the `project-profiles.md` loaded in Step 1:

Skill/repo discovery:
- awesome-claude-skills github 2026
- rohitg00 awesome-claude-code-toolkit
- ComposioHQ awesome-claude-skills
- VoltAgent awesome-agent-skills

Accent Lighting specific:
- BigCommerce MCP server claude
- ecommerce product description claude skill
- google merchant center automation MCP
- klaviyo MCP server

AccentOS specific:
- supabase claude skill auth
- vanilla JS claude code skill
- SEO MCP ahrefs google search console 2026

MCP discovery:
- mcpbundles.com best mcp servers 2026
- punkpeye awesome-mcp-servers

Use web_fetch on high-signal pages when snippets are insufficient.

Output of Step 2: a raw candidate list — name, source URL, one-line description — before filtering. Example:
```
Raw candidates ([N] found):
- [Tool name] ([URL]) — [one-line description]
- ...
```

---

## Step 3 — Filter candidates

For each candidate, run filters in order. First FAIL stops evaluation.

| Filter | Condition | Action |
|---|---|---|
| Already installed | In current MCP/skill list | SKIP silently |
| Overlap | Solves problem already solved | SKIP |
| Project fit | Applies to AccentOS or Accent Lighting ecommerce | KEEP |
| Attention test | Reduces Michael's decision/review load | KEEP |
| Attention fail | Adds overhead without ROI | FLAG LOW PRIORITY |
| Complexity | >2 min setup = HIGH FRICTION | KEEP but label |

Output of Step 3: a numbered filtered candidate list:
```
Filtered candidates ([N] kept of [M] found):
1. [Tool name] — [reason kept] [FRICTION: HIGH if applicable]
2. ...
Skipped (silent): [N] already-installed or overlapping
```

---

## Step 4 — Assign verdicts

Produce a verdict for every surviving candidate. Output a verdict table:

| Candidate | Verdict | One-line reason |
|---|---|---|
| [name] | INSTALL | [gap closed + friction level] |
| [name] | EVALUATE | [what's blocking] |
| [name] | WATCH | [future relevance signal] |
| [name] | SKIP | [redundancy or irrelevance reason] |

Verdict definitions:
- **INSTALL** — real gap, fits AccentOS stack, clear ROI, customized snippet ready.
- **EVALUATE** — promising but blocked by credential check, cost question, or missing compatibility data.
- **WATCH** — not useful now but directionally relevant for AccentOS or Accent Lighting.
- **SKIP** — redundant with existing stack or irrelevant to AccentOS/Accent Lighting. One-line reason only; do not expand.

---

## Step 5 — Format output

Output the full scout report as a scan-optimized block. Concrete output shape:

```
REPO SCOUT — [YYYY-MM-DD]

Searched: [N sources — list names]
Candidates: X | Filtered to: Y | INSTALL: Z | EVALUATE: W | WATCH: V | SKIP: U

══ INSTALL ══
[Tool name] ([URL])
  Gap closed: [specific AccentOS gap]
  Friction: LOW | MEDIUM | HIGH
  Install:
    [paste-ready bash block referencing /home/user/accent-os/ and store-cwqiwcjxes / hsyjcrrazrzqngwkqsqa]

══ EVALUATE ══
[Tool name] — [what it does]
  Blocking: [credential check | cost | compatibility issue]
  Next step: [single action to unblock]

══ WATCH ══
- [Tool name]: [one-line future-relevance note]

══ SKIP ══
- [Tool name]: [one-line reason]
```

---

## Step 6 — Customize for AccentOS

For every INSTALL item:
- Replace generic paths with AccentOS paths: /home/user/accent-os/
- Reference AccentOS by name (not "your project")
- Replace generic examples with AccentOS/Accent Lighting use cases
- Install snippets = single paste-ready block, no "read the README" handoffs
- BigCommerce store hash: store-cwqiwcjxes
- Supabase project: hsyjcrrazrzqngwkqsqa

---

## Anti-patterns

- **Never** return a raw candidate list without INSTALL/EVALUATE/WATCH/SKIP verdicts — Michael scans and acts, he does not read.
- **Never** suggest installing something that overlaps the current MCP stack (Notion, Supabase, GitHub, Gmail, Google Calendar, Make, Canva, Vercel, Google Drive, Indeed are already connected).
- **Never** rate INSTALL without a customized snippet — generic install instructions that reference "your project" instead of AccentOS or store-cwqiwcjxes are not accepted.
- **Never** surface a tool requiring more than 5 minutes of Michael's attention without pre-chewing it — summarize, extract the relevant config, and paste it ready.
- **Never** skip the filter pass because a repo has high stars — a 10k-star generic Supabase tool that doesn't understand `store-cwqiwcjxes` product catalog context is not worth more attention than a 40-star BigCommerce-native MCP that does.
- **Never** ask Michael to read the README — extract what he needs and present it in the verdict block.
- **Never** run Step 2 searches without first loading the AccentOS context from `/home/user/accent-os/skills/repo-scout/references/project-profiles.md` — without it, searches will surface Shopify, WooCommerce, and AWS-native tools instead of the BigCommerce + Cloudflare + vanilla-JS stack AccentOS actually runs on.
- **Never** omit the candidate count summary line ("Candidates: X | Filtered to: Y | INSTALL: Z") — it lets Michael verify the filter pass ran correctly.
