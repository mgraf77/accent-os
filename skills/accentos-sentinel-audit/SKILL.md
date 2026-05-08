# AccentOS Sentinel Audit — SKILL.md

## Identity

**Name:** `accentos-sentinel-audit`
**Version:** 1.0.0
**Owner:** AccentOS / mgraf77
**Purpose:** Periodic AI-governed code audit for AccentOS — architecture drift, security, Supabase/RLS, Cloudflare Worker risks, AI patching integrity, documentation divergence, and product logic regression.

---

## Activation

### Manual invocation examples

```text
Use the accentos-sentinel-audit skill to run a full AccentOS audit.

Use the accentos-sentinel-audit skill to run a pre-deployment security audit.

Use the accentos-sentinel-audit skill to audit only the Vendor Intelligence module.

Use the accentos-sentinel-audit skill to audit Lights America data52 integration readiness.
```

### Slash command (when registered)

```text
/sentinel-audit [scope]
```

Scopes: `full` | `security` | `vendor` | `integration` | `docs` | `architecture`

---

## Operating Sequence

```text
Step 1  — Load AccentOS governance rules (rules/*.md)
Step 2  — Detect current repo state (git branch, commit, modified files)
Step 3  — Run deterministic scanner scripts (scripts/*.js)
Step 4  — Claude architecture/product audit using prompts/claude-architecture-audit.md
Step 5  — Generate Codex delegation prompts using prompts/codex-static-review.md
Step 6  — Cross-check Claude findings against scanner output
Step 7  — Score each finding: Severity / Confidence / Blast Radius / Business Impact / Fix Complexity
Step 8  — Produce remediation plan ordered by Priority Score
Step 9  — Update audit history (history/YYYY-MM-DD-audit.md)
Step 10 — Compare delta against prior audit if available
Step 11 — Recommend next audit frequency and scope
Step 12 — Append self-improvement section
```

---

## Hard Safety Rules

- NEVER auto-merge to main
- NEVER modify production secrets or environment variables
- NEVER make production database changes
- NEVER remove existing functionality during audit
- NEVER perform broad refactors — findings are recommendations only unless explicitly approved
- ALWAYS include a changelog entry for any code changes made during remediation

---

## Audit Categories

| ID | Category | Lead Reviewer | Weight |
|---|---|---|---:|
| A | Architecture Drift | Claude | 20% |
| B | Supabase / Data Integrity | Claude + SQL scanner | 20% |
| C | Cloudflare Worker / API Security | Codex + static scanner | 20% |
| D | AI Patch Integrity | Claude | 15% |
| E | Product Logic (Vendor Intelligence) | Claude | 15% |
| F | Documentation / Employee Enablement | Claude | 10% |

---

## Health Score Model

**Score: 0–100**

| Range | Meaning |
|---:|---|
| 90–100 | Excellent — safe to accelerate |
| 80–89 | Good — minor issues |
| 70–79 | Usable — accumulating risk |
| 60–69 | Needs remediation before major feature work |
| <60 | Stop feature work and stabilize |

---

## Severity Model

Each finding must include:

```text
Severity:         Critical | High | Medium | Low
Confidence:       High | Medium | Low
Blast Radius:     System | Module | File | Local
Business Impact:  High | Medium | Low
Fix Complexity:   High | Medium | Low
Owner:            Claude | Codex | Human | Static Tool
```

Priority = Severity × Confidence × Business Impact (plain English, not opaque math).

---

## Outputs

1. `history/YYYY-MM-DD-[scope]-audit.md` — Full audit report
2. Codex delegation prompts (copy-paste ready)
3. GitHub issue drafts (optional)
4. Changelog entry
5. Skill improvement recommendations

---

## Audit Cadence

| Type | Cadence |
|---|---|
| Lightweight repo health | Every major Claude/Codex patch |
| Security / API | Weekly + pre-deploy |
| Supabase / RLS | Every migration |
| Architecture drift | Weekly while actively building |
| Vendor logic | Before any vendor module change ships |
| Integration | Every data52 / price book feed change |
| Documentation drift | Weekly |
| Full Sentinel audit | Monthly |

---

## Self-Improvement Loop

After every audit, append to the report:

1. What did scanners miss that Claude caught?
2. What should be promoted from Claude-catch to deterministic check?
3. Which findings were false positives?
4. Which rules should be hardened?
5. Which prompts need tightening?
6. Did this audit reduce risk or create noise?

---

## Files in This Skill

```text
SKILL.md                           — This file
README.md                          — Quick-start guide
rules/
  accentos-governance.md           — Master governance rules
  architecture-rules.md            — Module/file boundary rules
  supabase-rules.md                — Write gateway + RLS rules
  cloudflare-worker-rules.md       — Worker/API security rules
  ai-patching-rules.md             — Patch boundary + AI safety rules
  vendor-intelligence-rules.md     — Vendor module product logic rules
  integration-rules.md             — data52 / price book integration rules
prompts/
  claude-architecture-audit.md     — Full architecture audit prompt
  codex-static-review.md           — Codex code review prompt template
  codex-fix-plan.md                — Codex patch plan prompt template
  security-review.md               — Security-focused audit prompt
  supabase-rls-review.md           — RLS + write gateway review prompt
  worker-proxy-review.md           — Worker proxy security review prompt
  documentation-drift-review.md    — Docs drift audit prompt
  product-logic-review.md          — Vendor Intelligence product logic prompt
templates/
  audit-report-template.md         — Full report structure
  finding-template.md              — Per-finding block structure
  github-issue-template.md         — GitHub issue body template
  pr-plan-template.md              — Patch branch PR plan template
  changelog-entry-template.md      — Changelog entry format
scripts/
  collect_repo_metrics.js          — File sizes, LOC, patterns count
  scan_accentos_patterns.js        — Module contracts, global state, markers
  scan_sql_migrations.js           — RLS, policies, indexes, guards
  scan_worker_security.js          — Origin validation, rate limiting, secrets
  scan_ai_patch_boundaries.js      — START/END markers, unmarked sections
  generate_audit_report.js         — Combine scanner JSON → Markdown report
history/
  .gitkeep                         — Audit report storage (auto-populated)
examples/
  sample-audit-report.md           — Example full audit output
  sample-codex-delegation.md       — Example Codex handoff prompts
```
