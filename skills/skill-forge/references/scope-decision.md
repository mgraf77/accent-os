# Scope Decision Guide

> Used by skill-forge Step 5 (proposals) and skill-optimizer Step 0 (preflight).
> Determines whether a skill should live globally, project-locally, or both.

---

## The 3 scopes

| Scope | Description | Write location |
|---|---|---|
| **GLOBAL** | Works for any project. No project-specific data, paths, or IDs required. The skill's full value is accessible to any user on any codebase. | `~/.claude/skills/[skill-name]/` |
| **PROJECT** | Requires project-specific data (DB tables, store IDs, proprietary logic, specific file paths) and has little or no value outside this project. | `[project-root]/skills/[skill-name]/` |
| **BOTH** | Has a useful generic form AND project-specific tailoring that adds >30% more value. Rare — only when the gap between generic and tailored is substantial. | Both locations — global version first, project version forks and layers on top |

---

## Default: GLOBAL

Ship GLOBAL unless you can answer YES to both of these:
1. "Does this skill meaningfully require project-specific data to do its job?"
2. "Would removing the project-specific content reduce its value by >30%?"

If only #1 is yes → GLOBAL with a note that project context can be added.
If both are yes → PROJECT.
If there's a real generic form that works at ~70% value without project context → BOTH.

---

## The BOTH test

Ask: "Would someone on a completely different project get meaningful value from this skill without any customization?"

- **Yes, full value (~100%)** → GLOBAL only
- **Yes, substantial value (~70%)** → BOTH (generic global + tailored project)
- **Yes, minimal value (<30%)** → PROJECT only (global version isn't worth maintaining)
- **No** → PROJECT only

**BOTH is expensive:** it creates two files to maintain, two validation targets, and the risk of drift between versions. Default to GLOBAL and add a project version later only if the gap becomes obvious from actual use.

---

## Real examples

| Skill | Scope | Why |
|---|---|---|
| vibe-speak | GLOBAL | Communication framework — zero project-specific deps |
| skill-forge | GLOBAL | Meta-skill — works on any project's skills |
| skill-optimizer | GLOBAL | Meta-skill — works on any skill |
| decision-log | GLOBAL | File artifact pattern — any project benefits equally |
| autonomous-mode | GLOBAL | Execution pattern — project context read at runtime |
| vendor-cascade | PROJECT | Vendor scoring logic is 100% AccentOS/Accent Lighting specific |
| bc-business-review | PROJECT | BigCommerce + AccentOS KPIs — zero value outside |
| gmc-feed-audit | PROJECT | GMC + Feedenomics — zero value outside |
| table-eda | GLOBAL | Generic SQL EDA — project context read at runtime |
| analysis-snapshot | GLOBAL | File artifact pattern — any project benefits |
| supabase-sql-magic | BOTH | Generic NL→SQL pattern (global) + AccentOS schema awareness (project) |

---

## BOTH write protocol

When scope is BOTH:

1. **Write global version first** to `~/.claude/skills/[skill-name]/`:
   - No hardcoded paths, IDs, or project names
   - References use `[project-root]/`, `[your-db-project-id]`, etc.
   - Description uses generic language

2. **Fork to project version** at `[project-root]/skills/[skill-name]/`:
   - Copy the global version as base
   - Add project-specific substitutions (AccentOS paths, Supabase ID, BC store ID, etc.)
   - Add a note in the description: "Extends the global [skill-name] with [project]-specific [what]."
   - Add project-specific workflow steps or context sections as needed

3. **At runtime**, the skill router prefers the project version when in a project context — no user action needed.

---

## Scope in existing skills

When skill-optimizer detects a skill in both locations:
- Treat as BOTH scope
- Universal improvements (output quality, trigger coverage, methodology) → apply to both
- Project-specific improvements → apply only to project version
- Report shows both files in the diff

When skill-optimizer detects a skill only globally:
- Scope = GLOBAL — optimize the global version
- If optimization reveals the skill would benefit from project tailoring → surface as a follow-up proposal, do not auto-create the project version

When only in project:
- Scope = PROJECT — optimize only the project version
- If optimization reveals the skill is fully generic → surface a proposal to also write a global version
