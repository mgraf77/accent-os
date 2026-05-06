---
name: repo-scout
description: >
  Autonomous GitHub/MCP/skill repository intelligence for AccentOS. Use this skill any time
  Michael asks to find, evaluate, or vet new repos, skills, MCPs, CLIs, or tools — whether 
  he says "find new skills", "what's worth installing", "scout repos", "anything new worth
  grabbing", "what tools should I add", or any variation. Also triggers when Michael mentions
  a specific tool he's heard about and wants a verdict on. Skill does three things in one pass:
  (1) discovers and filters candidates against AccentOS + Accent Lighting projects, (2) produces
  a scan-optimized verdict table, and (3) generates a customized install snippet or SKILL.md
  adaptation for everything rated INSTALL. Never just returns a list — always delivers a verdict
  + customization.
---

# repo-scout

**Purpose:** Find what's actually relevant, kill the noise, and deliver install-ready adaptations — all in one pass. Michael does not read. He scans and acts.

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
- "any good CLIs for [task]"
- "check if there's a better MCP for [use case]"
- "scan for new AccentOS-relevant tools"

---

## Step 1 — Load Context

Before searching, internalize the active stack from references/project-profiles.md.

Key constraints as filters:
- Stack: BigCommerce, Supabase, Cloudflare Pages, vanilla JS, Anthropic API
- AccentOS repo: mgraf77/accent-os (index.html + 4 module files)
- Already connected MCPs: Notion, Supabase, GitHub, Gmail, Google Calendar, Make, Canva, Vercel, Google Drive, Indeed
- Filter rule: Does this reduce Michael's attention drain on AccentOS or Accent Lighting ecommerce? If not, skip.
- Complexity budget: Setup > 2 min = HIGH FRICTION — flag but still report.

---

## Step 2 — Search

Run parallel web_search calls:

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

---

## Step 3 — Filter

For each candidate, run in order. First FAIL stops evaluation.

| Filter | Condition | Action |
|---|---|---|
| Already installed | In current MCP/skill list | SKIP silently |
| Overlap | Solves problem already solved | SKIP |
| Project fit | Applies to AccentOS or Accent Lighting ecommerce | KEEP |
| Attention test | Reduces Michael's decision/review load | KEEP |
| Attention fail | Adds overhead without ROI | FLAG LOW PRIORITY |
| Complexity | >2 min setup = HIGH FRICTION | KEEP but label |

**Zero-results edge case:** if all candidates are filtered out, output: "All candidates matched existing stack or failed project-fit check. Try narrowing the search domain: `scout repos for [specific gap]`." Do not return empty output silently.

**Stale MCP list:** if the already-installed list was last read >24h ago (check git log on any MCP config file), flag it: "WARNING: MCP list may be stale — verify current connections at /home/user/accent-os/references/project-profiles.md before trusting SKIP decisions."

---

## Step 4 — Verdict

INSTALL — Real gap, fits stack, clear ROI. Include customized install snippet.
EVALUATE — Promising but needs credential/cost check.
WATCH — Not useful now but directionally relevant.
SKIP — Redundant or irrelevant. One-line reason only.

---

## Step 5 — Output Format

### REPO SCOUT — [Date]

Searched: [sources]
Candidates: X | Filtered to: Y | INSTALL: Z | EVALUATE: W

#### INSTALL
```
[Name] | Gap: [which AccentOS/Accent Lighting gap this closes]
Friction: LOW/MEDIUM/HIGH FRICTION
Why now: [one sentence ROI]
Install:
  [paste-ready block — no README handoffs]
AccentOS path: /home/user/accent-os/skills/[name]/ OR mcp config path
```

#### EVALUATE
[Name] — what it does, what is blocking

#### WATCH
Brief list only.

#### SKIP
Brief list — name + one-line reason.

---

## Step 6 — Customizations

For every INSTALL item:
- Replace generic paths with Codespace paths: /workspaces/accent-os/
- Reference AccentOS by name (not "your project")
- Replace generic examples with AccentOS/Accent Lighting use cases
- Install snippets = single paste-ready block, no "read the README" handoffs
- BigCommerce store hash: store-cwqiwcjxes
- Supabase project: hsyjcrrazrzqngwkqsqa

---

## Anti-patterns

- **Never** return a raw list without verdicts — every candidate gets INSTALL / EVALUATE / WATCH / SKIP.
- **Never** suggest installing something that overlaps the current MCP stack — check the already-installed list first.
- **Never** rate INSTALL without a paste-ready customized snippet referencing AccentOS paths or Accent Lighting IDs (store-cwqiwcjxes / hsyjcrrazrzqngwkqsqa).
- **Never** surface a tool requiring >5 min of Michael's attention without pre-chewing it to a single decision: install or skip.
- **Never** skip filtering because a repo has high stars — star count is not a fit signal for AccentOS.
- **Never** ask Michael to read the README — extract the relevant parts and present them inline.
- **Never** return empty output silently when all candidates are filtered — always explain why and suggest a narrower query.
