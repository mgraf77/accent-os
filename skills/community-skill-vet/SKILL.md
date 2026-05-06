---
name: community-skill-vet
description: >
  Audit a candidate community Claude skill before installing it into the
  AccentOS skills/ library. Checks: permissions requested vs. needed,
  code review for obvious risks (shell injection, file write outside
  expected paths, network exfiltration, prompt injection vectors),
  author reputation (publication history, last-update recency, repo
  star/issue ratio), and skill-quality signals (description clarity,
  trigger phrase match, anti-pattern presence). Outputs INSTALL / HOLD
  / REJECT with one-paragraph rationale. Use this skill when Michael
  says: "vet this skill", "audit [skill name/url]", "is this skill
  safe", "should I install [skill]", "review before install", "skill
  audit for [name]", or any phrasing that asks for a pre-install
  community-skill review. Do not use for skills already in
  /home/user/accent-os/skills/ — those are trusted by definition.
  Always produces a verdict + 3 evidence reasons + a paste-ready
  install command (or rejection note) — never returns prose-only.
---

# community-skill-vet

**Purpose:** As the AccentOS skill library grows, the temptation to install community skills increases. Without vetting, one bad skill could exfiltrate Supabase credentials, write to wrong paths, or introduce prompt-injection vectors. This skill is the gate.

Stolen from: skill-audit (aptratcn/skill-audit) — the pre-install community-skill audit pattern.

---

## Trigger Recognition

Run when Michael says:
- "vet this skill" / "audit [skill name or URL]"
- "is this skill safe" / "is it safe to install"
- "should I install [skill]" / "worth installing [skill]"
- "review before install" / "skill audit for [name]"
- "check this skill out" / "look at this before I add it"
- "trust this skill?" / "community skill check"
- "pre-install check on [name]" / "can I use this skill"

---

## Step 1 — Locate the candidate skill

Input is one of:
- GitHub URL pointing to a SKILL.md or skill directory
- Plugin marketplace identifier (e.g. `c-level-skills@claude-code-skills`)
- Local path (if Michael cloned it but hasn't moved to `/home/user/accent-os/skills/`)

Fetch the SKILL.md and any `references/*.md`, scripts, or assets in the same directory. If the source is a plugin, fetch the plugin manifest.

**Auth-required URLs:** if the candidate is in a private repo or requires GitHub auth, WebFetch will fail. Ask Michael once: "This source requires auth — paste the SKILL.md contents here." Do not attempt to vet a skill blind.

**Zero-content fail-fast:** if the fetched SKILL.md is empty, 404s, or <100 chars, stop immediately and output: "Cannot vet — skill content is empty or inaccessible. Paste the SKILL.md directly or verify the URL/path."

**Do in parallel:** Run Steps 3 (code-pattern scan) and 4 (author reputation) concurrently — they access independent data sources. Merge findings before Step 5.

---

## Step 2 — Permissions audit

For each tool the skill invokes (visible from SKILL.md mentions of Bash/Edit/Write/WebFetch/WebSearch/MCP-tool patterns), classify:

| Permission class | Risk level |
|---|---|
| Read-only filesystem | LOW |
| Write within `/home/user/accent-os/` | LOW |
| Write outside `/home/user/accent-os/` (e.g. `/tmp/`, `~/`) | MEDIUM |
| Bash with arbitrary command | HIGH — must justify |
| Network calls (WebFetch, MCP servers, curl) | MEDIUM — verify destinations |
| Calls to MCP servers handling credentials (Supabase hsyjcrrazrzqngwkqsqa, Gmail, GitHub) | HIGH — verify scope |

For each HIGH-risk permission, the SKILL.md must explicitly justify the use. If unjustified, that's evidence toward REJECT.

---

## Step 3 — Code-pattern risks

Scan the skill content for these patterns. Each match is a risk flag:

| Pattern | Risk |
|---|---|
| Bash with `$()`, backticks, or unquoted user input | command injection |
| `WebFetch` to non-public hosts or hardcoded IPs | exfiltration vector |
| File reads from `~/.ssh/`, `~/.aws/`, `.env`, credentials files | credential theft |
| `eval`, `Function(...)`, `setTimeout(string, ...)` in any embedded JS | code injection |
| Bash that pipes `curl ... | sh` or `wget ... | bash` | unverified-code execution |
| Hardcoded API keys / tokens / passwords | secret leakage |
| Trigger phrases that match very common Michael phrasings ("yes", "ok", "do it") | unwanted auto-trigger |
| No anti-patterns section OR < 3 entries | quality signal weak |

---

## Step 4 — Author reputation

For GitHub-sourced skills:
- Account age
- Other skills published by the same author
- Last commit recency on the skill repo (>6 months old = stale)
- Repo star count vs. issue count (low engagement, many issues = HOLD)
- README clarity (placeholder README = quality signal weak)

For plugin-marketplace skills:
- Marketplace verification status if visible
- Plugin install count if visible

---

## Step 5 — Skill-quality signals

Apply the same Step 7.5 validation that skill-forge runs on its own outputs:

- Description ≥ 250 chars + names AccentOS-relevant context
- ≥ 3 anti-patterns
- Numbered workflow steps with concrete outputs
- No prose walls

Output per-check result as a table:

```
Quality check        | Result  | Note
---------------------|---------|-----
Description ≥250c    | PASS/FAIL | [char count]
Names AccentOS ctx   | PASS/FAIL | [present/absent]
≥3 anti-patterns     | PASS/FAIL | [count found]
Numbered steps+outputs | PASS/FAIL | [step count]
No prose walls       | PASS/FAIL | [any blocks >6 lines solid?]
```

A community skill that fails these is a quality risk, not a safety risk — but worth flagging.

---

## Step 6 — Verdict

Based on Steps 2–5:

| Verdict | Trigger condition |
|---|---|
| **INSTALL** | All checks pass: permissions justified, no code-pattern risks, author reputation OK, quality signals strong |
| **HOLD** | One or two MEDIUM concerns; not blocking but worth pre-install fix or upstream issue filed |
| **REJECT** | Any HIGH-risk pattern unjustified, OR ≥3 MEDIUM concerns combined, OR credential-handling pattern visible |

For REJECT, propose an alternative: "Re-forge this concept yourself via skill-forge — `look into [original target]` — to get a sandboxed AccentOS-native version in /home/user/accent-os/skills/."

**Edge case — borderline HOLD/REJECT:** if the skill has exactly 2 MEDIUM concerns + 1 unjustified HIGH, override to REJECT — the unjustified HIGH is never acceptable regardless of MEDIUM count.

---

## Step 7 — Output

```
═══ BLOCK 1: VERDICT ═══
[INSTALL | HOLD | REJECT] — [skill name]

═══ BLOCK 2: EVIDENCE (top 3) ═══
1. [most important finding]
2. [second]
3. [third]

═══ BLOCK 3: PERMISSIONS REQUESTED ═══
[per-permission classification table from Step 2]

═══ BLOCK 4: ACTION ═══
For INSTALL:
  # Paste in Codespace terminal:
  cp -r [source_path] /home/user/accent-os/skills/[name]/
  # OR for plugin:
  /plugin install [plugin-id]

For HOLD:
  Issues to resolve before install:
  - [issue 1]
  - [issue 2]

For REJECT:
  Reason: [one sentence]
  Alternative: Run skill-forge with target=[original target] to forge a sandboxed AccentOS-native version into /home/user/accent-os/skills/[name]/.
```

---

## Anti-patterns

- **Never** install a skill that fails Step 3 with any HIGH-risk pattern unjustified.
- **Never** verdict INSTALL without checking permissions (Step 2). The skill-quality signals don't substitute for permission audit.
- **Never** trust a SKILL.md description alone — read the actual workflow and any included scripts.
- **Never** auto-install. Output the install command; Michael executes.
- **Never** REJECT without proposing the skill-forge alternative — the concept is usually still worth stealing.
- **Never** vet a skill without reading its full workflow steps — description-only review misses injection vectors embedded in Bash steps.
- **Never** verdict HOLD when any unjustified HIGH-risk pattern is present — HOLD is reserved for MEDIUM-only concerns.
- **Never** skip the quality-signals table (Step 5) on the grounds that the skill "looks fine" — quality and safety are independent checks.
