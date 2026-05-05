# Gap Analysis Template
# Used by skill-forge Step 4. Fill all three columns. Do not skip DROP — naming
# what NOT to copy is half the value.

---

## Concept inventory (from Step 3)

| # | Concept | Best source | Mentions | Relevance |
|---|---------|-------------|----------|-----------|
| 1 | [name] | [url] | [count] | HIGH/MED/LOW/NONE |
| 2 | ... | ... | ... | ... |

Sort by Relevance descending. Drop NONE rows before moving on.

---

## Three-column gap analysis

### KEEP — Target does it, AccentOS needs it

| Concept | AccentOS gap it closes (cite project-profiles.md) | How it adapts |
|---------|---------------------------------------------------|---------------|
| [concept] | [specific gap, e.g. "vendor score persistence"] | [what changes for AccentOS] |

Rules:
- Must cite a named gap from /home/user/accent-os/skills/repo-scout/references/project-profiles.md
- Vague gaps ("better organization") are not allowed — be specific
- If you can't find ≥3 KEEP entries, the target is not worth forging — abort to WATCH

### DROP — Target does it, AccentOS doesn't need it

| Concept | Why drop |
|---------|----------|
| [concept] | [wrong project type / redundant with X / out of scope] |

Common drop reasons:
- Wrong project type (board reporting on a solo build)
- Redundant with existing skill (Notion sync — already have Notion MCP)
- Wrong stack (PostgreSQL helpers when we use Supabase abstractions)
- Enterprise-only feature with no AccentOS analog

### ADD — AccentOS needs it, target doesn't do it

| Concept | Why AccentOS needs it | Where it comes from |
|---------|----------------------|---------------------|
| [concept] | [specific use case] | [improvised / from another skill / Michael's workflow] |

Common ADD candidates for AccentOS:
- BigCommerce store-cwqiwcjxes specificity
- Supabase hsyjcrrazrzqngwkqsqa specificity
- Vendor scoring / vendor-overrides table awareness
- Klaviyo + GMC ecommerce ops context
- Codespace path conventions (/home/user/accent-os or /workspaces/accent-os)
- Reference to Anthropic API key via env var

---

## Forge decision

Total KEEP entries: __
Total ADD entries: __
Total DROP entries: __

If KEEP + ADD ≥ 5 and KEEP ≥ 3 → proceed to Step 5 (forge).
Otherwise → output "Insufficient signal. Recommendation: WATCH [target] for now."
