# REPO SCOUT — 2026-05-04 | First run (skill build session)

Searched: rohitg00/awesome-claude-code-toolkit, ComposioHQ/awesome-claude-skills,
VoltAgent/awesome-agent-skills, BehiSecc/awesome-claude-skills, mcpbundles.com,
segmentstream.com MCP guide, mcpbundles.com ecommerce

Candidates reviewed: ~60 | Filtered to: 14 | INSTALL: 6 | EVALUATE: 4 | WATCH: 4

---

## INSTALL

**1. Firecrawl MCP** — Web scraping via MCP. Closes web crawl gap for Accent Lighting competitor research and product feed enrichment. LOW FRICTION.
Install: npm install -g firecrawl-mcp
Settings.json: "firecrawl": { "command": "firecrawl-mcp", "env": { "FIRECRAWL_API_KEY": "YOUR_KEY" } }

**2. claude-token-lens** — Real-time token attribution per tool/agent/MCP. Closes quota burn blind spot. LOW FRICTION.
Install: npm install -g claude-token-lens
Run: claude-token-lens during any Claude Code session

**3. BigCommerce MCP** — Claude manages products/orders/inventory directly. Closes AccentOS ecommerce gap. MEDIUM FRICTION (needs BC API key).
Verify package at: https://developer.bigcommerce.com/docs/integrations/mcp
Settings.json: "bigcommerce": { "command": "npx", "args": ["-y", "@bigcommerce/mcp-server"], "env": { "BC_STORE_HASH": "store-cwqiwcjxes", "BC_ACCESS_TOKEN": "YOUR_TOKEN" } }

**4. skill-audit** — Pre-install security audit for community skills. Install before anything else. LOW FRICTION.
Install: git clone https://github.com/aptratcn/skill-audit.git /workspaces/accent-os/skills/skill-audit/

**5. Universal SEO Skill** — 19 sub-skills, Google APIs, technical SEO. Seeds /seo-audit for Accent Lighting GMC work. MEDIUM (needs Firecrawl first).
Search "universal SEO skill claude code" to confirm repo then: npx skills add [author]/seo-skill

**6. Factory-Floor** — Theory of Constraints coaching skill. Operationalizes bottleneck-first thinking for AccentOS build prioritization. LOW FRICTION.
Search "Factory-Floor claude skill startup" to confirm repo then cp to skills/

---

## EVALUATE

- Ahrefs MCP — 112 SEO tools via Claude. Blocker: requires Ahrefs Business plan. If Michael has access = INSTALL immediately.
- n8n MCP — Manage n8n workflows from Claude. Blocker: n8n not yet deployed. Install after n8n is live.
- claude-cost-optimizer — 30-60% token reduction. Blocker: test against current model routing to avoid conflicts.
- helium-mcp — News + market intelligence MCP. Blocker: confirm relevance to Accent Lighting use case.

---

## WATCH

- glebis/doctorg — health research skill, low priority
- glebis/thinking-patterns — quarterly audit tool, ~$3.50/run
- SegmentStream MCP — needs multi-channel campaigns first
- lean-ctx — context compression, useful when codebase grows

---

## SKIP

- humanizer-skill, ui-ux-suite, VibeSec, notebooklm, ClickUp CLI, unity, dna-analysis, email-html-mjml — irrelevant to stack or overlap existing skills
