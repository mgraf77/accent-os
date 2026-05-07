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

## Three-column concept theft assessment

### STEAL — Rebuild this concept in AccentOS-native form

| Concept | Type (STANDALONE / SUB-FEATURE) | How it adapts for AccentOS |
|---------|--------------------------------|---------------------------|
| [concept] | STANDALONE | [what changes for AccentOS] |

Rules:
- STEAL is the **default** outcome for any concept with reusable structure
- Overlap with existing skills is NOT disqualifying — a tighter AccentOS-native version is the point
- Community patterns found in Step 1.8 can be STEAL candidates even if the primary target doesn't use them
- WATCH abort requires STEAL = 0 after re-frame — that is rare for non-trivial targets

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

Total STEAL entries: __
Total ADD entries: __
Total DROP entries: __

If STEAL ≥ 1 → proceed to Step 5 (proposals). Most non-trivial targets produce 3–8 STEAL candidates.
If STEAL = 0 after Step 1.5 re-frame → output WATCH and stop. Log the abort to gotcha-log.md.
