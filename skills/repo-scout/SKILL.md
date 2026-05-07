---
name: repo-scout
description: >
  Autonomous GitHub/MCP/skill repository intelligence for AccentOS. Use this skill any time
  Michael asks to find, evaluate, or vet new repos, skills, MCPs, CLIs, or tools — whether 
  he says "find new skills", "what's worth installing", "scout repos", "anything new worth
  grabbing", "what tools should I add", or any variation. Also triggers when Michael mentions
  a specific tool he's heard about and wants a verdict on ("is [X] worth it"). In one pass:
  discovers candidates, filters against AccentOS stack + prior runs, checks overlap with
  existing skills, sweeps community patterns, produces verdicts (INSTALL/EVALUATE/FORGE/WATCH/SKIP),
  and generates customized install snippets with relevance scores. Never returns a raw list
  — always delivers verdict + customization + community patterns. Writes a dated run file so
  prior-run memory accumulates across sessions.
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

**Single-tool mode:** When Michael names exactly ONE specific tool ("is Ahrefs MCP worth it", "what about [X]?"), skip Steps 2–3 (broad search + filter). Go directly to Steps 3.5 → 3.8 → 4 → 5 → 6 for that tool only. Output takes < 1 min instead of a full scout run.

---

## Step 1 — Load Context

Before searching, load two sources in parallel:

**1. Active stack** from `references/project-profiles.md`:
- Stack: BigCommerce, Supabase, Cloudflare Pages, vanilla JS, Anthropic API
- AccentOS repo: mgraf77/accent-os (index.html + 4 module files)
- Already connected MCPs: Notion, Supabase, GitHub, Gmail, Google Calendar, Make, Canva, Vercel, Google Drive, Indeed
- Filter rule: Does this reduce Michael's attention drain on AccentOS or Accent Lighting ecommerce? If not, skip.
- Complexity budget: Setup > 2 min = HIGH FRICTION — flag but still report.

**2. Prior run memory** — load ALL `/home/user/accent-os/skills/repo-scout/repo-scout-run-*.md` files from the last 30 days (multiple topic-specific runs can coexist). Extract the union of all candidates evaluated (any verdict) across those files. Any candidate appearing in any run ≤30 days old is **pre-filtered** in Step 3. Skip silently — do not re-evaluate unless explicitly asked or the run is expired.

---

## Step 2 — Search

Generate search strings from Michael's request, then run parallel web_search calls.

**Ecosystem baseline (always run, regardless of topic):**
- rohitg00/awesome-claude-code-toolkit
- ComposioHQ/awesome-claude-skills
- punkpeye/awesome-mcp-servers
- `mcpbundles.com [current year]`

**Topic-specific strings (generate from Michael's request):**
1. Extract the core domain (e.g., "SEO", "ecommerce", "CRM", "data sync", "cost optimization")
2. Generate these search strings: `[domain] MCP server claude`, `[domain] claude skill github`, `awesome-[domain] claude`
3. If Michael named a specific tool: add `site:github.com [tool-name]` and `[tool-name] claude integration`
4. If AccentOS-specific domain: add `supabase [domain] claude`, `bigcommerce [domain] MCP`

Use web_fetch on high-signal pages when search snippets are insufficient. Skip pages already fetched in the loaded prior run.

**Parallelism guide:** Steps 1+2 run in parallel. Steps 3.5 and 3.8 run in parallel after Step 3. Steps 4→5→6→7 are sequential. Batch all web_search calls in Step 2 into one parallel block — do not fetch one at a time.

---

## Step 3 — Filter

For each candidate, run in order. First FAIL stops evaluation.

| Filter | Condition | Action |
|--------|-----------|--------|
| Already in prior run | In loaded prior-run candidate list (run ≤30 days old) | SKIP silently |
| Already installed | In current MCP/skill list from Step 1 | SKIP silently |
| Overlap | Solves a problem already fully solved | SKIP |
| Project fit | Applies to AccentOS or Accent Lighting ecommerce | KEEP |
| Attention test | Reduces Michael's decision/review load | KEEP |
| Attention fail | Adds overhead without ROI | FLAG LOW PRIORITY |
| Complexity | >2 min setup | KEEP but label HIGH FRICTION |

---

## Step 3.5 — Existing skills overlap check

For each candidate that survived Step 3 filtering, check if any skill in `/home/user/accent-os/skills/` already addresses the same domain. Read `skills/_index.md` triggers/summaries for fast matching.

| Overlap level | Action |
|---|---|
| Full (existing skill covers ≥80% of candidate's value) | Downgrade verdict by 1 tier. Add note: "Consider upgrading [existing-skill] instead." |
| Partial (<80% overlap) | Keep verdict. Add note: "Complements [existing-skill]." |
| None | No change. |

---

## Step 3.8 — GitHub community patterns sweep

For the top 2–3 INSTALL and EVALUATE candidates, run a parallel GitHub sweep to find how the Claude Code community has implemented the same concept. This is the **"look into skill"** feature for repo-scout — steal workflow patterns before customizing.

**Per candidate (run in parallel):**
- `site:github.com "SKILL.md" [candidate domain keyword]`
- `awesome-claude-skills [candidate domain]`

For each community skill found (cap: 2 per candidate):
- Extract: workflow steps, trigger phrases, unique patterns, anti-patterns
- Add to Step 6 customization notes tagged `[community pattern]`

**Output per candidate (appears in Step 5 EVALUATE block, not the install snippet):**
`Community patterns: [N found] — [pattern name 1], [pattern name 2]`

Cap this sweep at 3 minutes total. If no community patterns found, note "Community: 0 found" and move on.

---

## Step 4 — Verdict

INSTALL [HIGH] — Verified working, clear ROI, <2min setup, fits AccentOS stack. Include customized snippet.
INSTALL [MEDIUM] — Promising, unverified in AccentOS context, needs validation before use.
EVALUATE — Promising but blocked by credential, cost, or dependency. State the specific blocker.
FORGE — Better served by a custom AccentOS skill than by installing this tool as-is. Include: what the custom skill does differently. Invoke via: `look into [target] for AccentOS`.
WATCH — Not useful now but directionally relevant. State the revisit trigger.
SKIP — Redundant or irrelevant. One-line reason only.

---

## Step 5 — Output Format

### REPO SCOUT — [Date]

Searched: [sources] | Prior run loaded: [date or "none"]
Candidates: X | Filtered to: Y | INSTALL: Z | EVALUATE: W | FORGE: F | WATCH: V | SKIP: S

#### INSTALL
**[Name] [HIGH/MEDIUM]** — [one sentence what it does + which AccentOS gap it closes] | Friction: LOW/HIGH
Relevance: [1-10] — [one sentence]
Community patterns: [N found — pattern names] (or "0 found")
```
# [Name] — AccentOS install
[install command]
# settings.json (MCP only):
"[key]": { ... }
# Verify:
[verification command]
# AccentOS use case: [one concrete invocation Michael would run]
```

#### EVALUATE
[Name] — what it does, specific blocker, community patterns found (if any)

#### FORGE
[Name] — [one sentence: what a custom AccentOS skill does better than generic install]
Invoke: `look into [name] for AccentOS`

_After listing FORGE items, ask Michael: "Want me to run skill-forge on any of these now?"_

#### WATCH
Brief list — name + revisit trigger.

#### SKIP
Brief list — name + one-line reason.

---

## Step 6 — Customizations

For every INSTALL item, apply substitutions and meet the quality bar:

**Substitutions:**
- Paths → `/workspaces/accent-os/` (Codespace) or `/home/user/accent-os/` (local)
- "your project" → AccentOS or Accent Lighting (specific)
- Generic store → BigCommerce store-cwqiwcjxes
- Generic DB → Supabase hsyjcrrazrzqngwkqsqa

**Quality bar — snippet is incomplete until ALL of these are present:**
- Single paste-ready block (no "read the README" handoffs)
- At least one AccentOS-specific use case example showing exactly what Michael would invoke
- A verify step (`# Verify:` line) — confirms the install worked
- For MCP installs: full `settings.json` block included, not just the install command
- Community patterns from Step 3.8 incorporated into customization notes (tagged `[stolen from community]`)

**Relevance score (add to every INSTALL and EVALUATE block):**
`Relevance: [1-10] — [one sentence against AccentOS/Accent Lighting specific needs]`
- 9-10: Directly closes a named gap in project-profiles.md
- 7-8: Clear indirect value for AccentOS or Accent Lighting ops
- 5-6: Useful but non-critical
- <5: Consider downgrading to WATCH

---

## Step 7 — Write run file

After outputting results, write a dated run file to persist the prior-run memory that Step 1 reads. Without this step, prior-run deduplication never accumulates.

File: `/home/user/accent-os/skills/repo-scout/repo-scout-run-[YYYY-MM-DD].md`

Include:
- Header: `# REPO SCOUT — [Date] | [topic/trigger phrase]`
- `Searched:` line (sources used)
- Complete candidate list — every candidate evaluated, any verdict, one line each: `[Name] — [verdict] — [one-sentence reason]`

If a run file for today already exists (multiple scouts in one day), append to it with a `---` separator rather than overwriting.

---

## Anti-patterns

- Never return a raw list without verdicts
- Never suggest installing something that overlaps the current MCP stack without noting the overlap
- Never rate INSTALL without a customized snippet that includes a verify step and AccentOS example
- Never surface a tool requiring more than 5 min of Michael's attention — pre-chew it
- Never skip filtering because a repo has high stars
- Never ask Michael to read the README
- Never skip Step 3.8 for INSTALL candidates — community patterns improve every install snippet
- Never rate a candidate FORGE without stating what the custom skill does differently in one sentence
