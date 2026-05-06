# SKILL.md Template
# Used by skill-forge Step 6. Copy this shape, fill from gap-analysis output.
# All bracketed placeholders must be replaced. No template comments in the final file.

---

```markdown
---
name: [kebab-case-name]
description: >
  [One-paragraph what-it-does, naming AccentOS or Accent Lighting explicitly.]
  Use this skill when Michael says: "[trigger phrase 1]", "[trigger phrase 2]",
  "[trigger phrase 3]", or any phrasing that [describes the trigger surface].
  Do not use this skill for [explicit anti-trigger]. Always [shipped behavior,
  not a recommendation] — never [common failure mode].
---

# [skill-name]

**Purpose:** [One sentence. Specific. AccentOS-flavored.]

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "[phrase 1]"
- "[phrase 2]"
- "[phrase 3]"
- "[phrase 4]"

---

## Step 1 — [verb-phrase]

[Concrete instruction. Names a specific output.]

---

## Step 2 — [verb-phrase]

[...]

---

## Step N — [verb-phrase]

[...]

---

## Output format

[Paste-ready block / table / file shape. Show the literal structure.]

---

## AccentOS context

- Stack: [relevant subset — Supabase / BigCommerce / Cloudflare / Anthropic API]
- Project: [AccentOS or Accent Lighting]
- Paths: /home/user/accent-os/ (Codespace: /workspaces/accent-os/)
- BC store: store-cwqiwcjxes (when relevant)
- Supabase: hsyjcrrazrzqngwkqsqa (when relevant)

---

## Anti-patterns

- Never [common failure mode 1]
- Never [common failure mode 2]
- Never [generic-output failure mode]

## Outcome Signal

At the end of every run, emit one of:

**PASS:**
```
SKILL OUTCOME: PASS — [skill-name] → [one-line summary of what was delivered]
```

**PARTIAL** (output produced but goal not fully met):
```
SKILL OUTCOME: PARTIAL — [skill-name]
  Delivered: [what was produced]
  Gap:       [what was missing or wrong]
  Options:   "optimize [skill-name]" → fix the skill
             re-run with [adjusted input hint]
  → Logged to skills/skill-feedback.md
```

**FAIL** (skill could not complete):
```
SKILL OUTCOME: FAIL — [skill-name]
  Reason:  [missing prereq | ambiguous input | out of scope | other]
  Options: "optimize [skill-name]" → fix the skill
           "forge a skill for [goal]" → build a better one
  → Logged to skills/skill-feedback.md
```

**Logging rule:** PARTIAL and FAIL are automatically appended to `/home/user/accent-os/skills/skill-feedback.md`. PASS is not logged — no noise in the queue.
```

---

## Frontmatter rules

- `name`: kebab-case, ≤25 chars, no spaces
- `description`: ≥250 chars, multi-line via `>`, must include the word "AccentOS" OR "Accent Lighting" at least once
- Description ends with shipped-behavior commitment ("always X, never Y") — this prevents the skill from degrading to advice mode

## Content rules

- Imperative voice — "Do X", not "Consider doing X"
- Steps numbered, each step has one outcome
- Tables when scanning is the use case
- Anti-patterns section is mandatory — at least 3 entries
- No "Future enhancements", "TODO", or "Roadmap" sections
- No emoji unless Michael's prior conversation used emoji on this topic
- Keep total file under ~5000 tokens; split overflow to references/
