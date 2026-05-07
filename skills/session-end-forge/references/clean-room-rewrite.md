# Clean-room rewrite — rules for the portable variant

> Used by `session-end-forge` Step 8a when Michael says yes to portability. Produces `skills/[skill-name]/portable/SKILL.md` and `portable/README.md`. **Concept-level rewrite, NOT sed substitution** — subtle leakage is the failure mode this guards against.

---

## Why concept-level

A naive sed-replace of `hsyjcrrazrzqngwkqsqa → ${DB_PROJECT_ID}` leaks AccentOS context in:
- Anti-pattern phrasings ("Never run vendor_scores writes without explicit confirmation" — the table name leaks even after the ID is replaced)
- Concrete examples ("Klaviyo flow ID 12345 was the trigger" — the brand context leaks)
- Step descriptions that name domain-specific outputs ("AccentOS rep_group_id assignment")
- Description block tone ("AccentOS-shaped" wording)

Rewrite each step from concepts. Read the AccentOS SKILL.md, understand what the step does, then describe that step in stack-agnostic terms using the placeholders below.

---

## Substitution map

| AccentOS-specific (in SKILL.md) | Portable placeholder | Notes |
|---|---|---|
| `/home/user/accent-os/` | `${PROJECT_ROOT}` | Repo root. Document in README. |
| `/workspaces/accent-os/` | `${PROJECT_ROOT_CODESPACE}` | Codespace alt. Optional in README. |
| `hsyjcrrazrzqngwkqsqa` | `${DB_PROJECT_ID}` | Supabase project id. Generic-DB framing. |
| `store-cwqiwcjxes` | `${STORE_ID}` | BigCommerce store id. Generic-store framing. |
| `vendor_scores`, `vendor_overrides` | `${PRIMARY_TABLE}`, `${OVERRIDE_TABLE}` | Domain-bound tables. Add README note: "the primary scoring table for your domain". |
| `AccentOS` / `Accent Lighting` | `${PROJECT_NAME}` | Project name. Both placeholders → same env var. |
| `Klaviyo` | `${EMAIL_PLATFORM}` or "your email/CRM platform" | Generic CRM framing. |
| `GMC` / `Google Merchant Center` | `${PRODUCT_FEED_PLATFORM}` or "your product feed platform" | Generic feed framing. |
| `Feedenomics` | `${FEED_OPTIMIZATION_TOOL}` | Generic feed-optimizer framing. |
| `BigCommerce` | `${ECOMMERCE_PLATFORM}` | Generic e-commerce framing. |
| `Cloudflare Pages` | `${HOSTING_PLATFORM}` | Generic host framing. |
| `Anthropic API` / `ANTHROPIC_API_KEY` | Keep as-is. Anthropic isn't AccentOS-specific. | No change. |
| `vendor scoring`, `rep_group_id`, `vendor_overrides` (as concepts) | "your domain's primary scoring concept", "your group/segment identifier", "your override table" | Frame as domain-agnostic concepts. |

**Anthropic / Claude / API references stay as-is.** The skill is portable across repos, not across LLM providers. If the AccentOS SKILL.md hardcodes a model id (e.g. `claude-sonnet-4-6`), keep it but add a README note recommending the latest available.

---

## What to rewrite

### Frontmatter description
- Strip "AccentOS" / "Accent Lighting" entirely
- Reframe as "your project" / "the host project"
- Keep the shipped-behavior commitment ("always X, never Y")
- Keep ≥250 chars

### Workflow steps
- Same numbered structure (4–7 steps)
- Same imperative voice
- Same concrete output per step
- Concrete examples → genericized: replace "vendor scoring sanity check" with "domain-specific data integrity check"
- File paths: every absolute path → `${PROJECT_ROOT}/...`

### Anti-patterns
- Keep all of them — failure modes are universal
- Strip AccentOS specifics from the wording: "Never push to `main` without explicit permission" → unchanged (universal); "Never write to `vendor_overrides` without an audit row" → "Never write to `${OVERRIDE_TABLE}` without an audit row"
- ≥3 anti-patterns mandatory (same as AccentOS variant)

---

## What to add

### `## Required env vars` block (top of portable/SKILL.md, after the description)

```markdown
## Required env vars

| Var | What it is | Example |
|---|---|---|
| `PROJECT_ROOT` | Absolute path to your repo root | `/home/me/myrepo` |
| `PROJECT_NAME` | Human-readable project name | `MyProject` |
| `DB_PROJECT_ID` | Supabase project id (or equivalent) | `abc123xyz789` |
| `STORE_ID` | E-commerce store identifier (if applicable) | `store-12345` |
| `PRIMARY_TABLE` | Your domain's primary scoring/data table | `customers` |
| ... | ... | ... |
```

Only include rows for placeholders the portable SKILL.md actually uses. Don't pad with unused vars.

### `## Portability notes` section (bottom of portable/SKILL.md, before anti-patterns)

```markdown
## Portability notes

- Forged from an AccentOS-specific skill via `session-end-forge` Step 8a (clean-room rewrite).
- Stack assumptions parameterized: [list every placeholder used].
- Domain assumptions parameterized: [list domain concepts genericized — e.g. vendor scoring → primary scoring].
- Kept as-is: [list things that did NOT change — e.g. Anthropic API conventions, git workflow, file write patterns].
- To use in another repo: set the env vars above; verify the workflow steps map to your domain; run the AccentOS variant's eval suite (if one exists) against your data.
```

### `portable/README.md` (separate file, env var documentation + usage)

```markdown
# [skill-name] — portable variant

Cross-repo portable version of the AccentOS skill at `../SKILL.md`. Uses placeholder env vars instead of hardcoded AccentOS identifiers.

## Required env vars

[same table as in SKILL.md, with extended notes]

## Usage

1. Set the env vars above (or pass them inline to whatever invokes the skill).
2. Read `portable/SKILL.md` as the workflow source — it has zero AccentOS context.
3. The original AccentOS-bound version is at `../SKILL.md` for reference only.

## What was parameterized

[bullet list of every substitution made, with the AccentOS original → placeholder]

## What was NOT parameterized

[bullet list of things that stayed as-is — e.g. Anthropic API, git workflow]

## Source

Forged via `session-end-forge` Step 8a from the AccentOS variant. See `../forge-log.md` entry `forge-NNN`.
```

---

## What to skip / drop

- **Concrete AccentOS examples** that don't translate — drop them entirely rather than half-translate. If a step said "Run a vendor scoring sanity check, e.g. confirm vendor 12345's #1 driver is Klaviyo open rate," the portable equivalent is "Run a domain sanity check on the primary scoring table." Drop the specific example.
- **The `## AccentOS context` block** — replace with `## Required env vars` + `## Portability notes`.
- **Description's "AccentOS" / "Accent Lighting" mentions** — replace with "your project".
- **Step 7.5's AccentOS-substitution check** — intentionally absent in portable validation. Step 10 of session-end-forge skips this for the portable variant.

---

## Validation gate

Run automatically in Step 8a after writing the portable files:

### 1. Zero AccentOS leakage (grep)

```bash
grep -inE 'hsyjcrrazrzqngwkqsqa|store-cwqiwcjxes|accent-os|accent lighting|vendor_scores|vendor_overrides|/home/user/accent-os|/workspaces/accent-os' \
  skills/[name]/portable/SKILL.md \
  skills/[name]/portable/README.md
```

Expected: 0 matches **outside fenced code blocks**. Inside fenced blocks, allow them ONLY if they appear as "what to replace" examples (e.g. inside the substitution map). If grep returns matches outside code blocks → fix in place, re-run grep.

### 2. Frontmatter parses

- `name` present, kebab-case, ≤25 chars (same name as AccentOS variant — the directory disambiguates via `portable/`)
- `description` present, multi-line `>`, ≥250 chars, no unfilled `[bracketed]` placeholders outside fenced blocks
- Description does NOT contain "AccentOS" or "Accent Lighting"

### 3. Required env vars block

- Present
- Lists every placeholder used in the body
- Each row has columns: Var, What it is, Example

### 4. Portability notes section

- Present
- Lists what was parameterized
- Lists what was NOT parameterized

### 5. Anti-patterns

- ≥3 entries
- Each starts with "Never"
- No AccentOS-specific wording (vendor_scores, accent-os, etc.)

### 6. README.md

- Present at `portable/README.md`
- Has all 4 sections (env vars, usage, what was parameterized, what was NOT parameterized)

Any failure → Edit in place, re-run validation. Do not commit a leaky portable.

---

## Common rewrite gotchas

| AccentOS phrasing | Portable phrasing | Why |
|---|---|---|
| "Run a vendor cascade audit" | "Run a primary-scoring cascade audit" | "vendor cascade" leaks AccentOS terminology |
| "Read `BUILD_PLAN_CLAUDE.md`" | "Read `${BUILD_PLAN_DOC}`" or "Read your project plan doc" | AccentOS-specific filename |
| "Append to `SESSION_LOG.md`" | "Append to your session log" or `${SESSION_LOG_PATH}` | AccentOS-specific filename |
| "Per CLAUDE.md AUTO-EXECUTE step 9" | "Per your project's auto-execute instructions" | AccentOS-specific filename |
| "supabase-sql-magic" companion | "your project's NL-to-SQL skill" | AccentOS skill name |

When in doubt, ask: "would a developer in another repo with no AccentOS context understand this without explanation?" If no → genericize.

---

## When the rewrite is impossible

If the skill's core value is bound to AccentOS-specific data (e.g. `vendor-cascade` whose entire purpose is reading vendor_scores → vendor_overrides), the portable variant becomes an empty shell. Two options:

1. **Decline portability** in Step 8 (Stack Native score 19–20/20 indicates this — recommend "no" to portability gate). The AccentOS variant ships alone.
2. **Genericize the concept** — `vendor-cascade` becomes `score-cascade-audit` for any primary scoring table. Acceptable if the genericized concept still has standalone value.

When in doubt, lean toward declining portability rather than shipping a hollow generic skill.
