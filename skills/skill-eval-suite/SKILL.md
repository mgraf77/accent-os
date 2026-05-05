---
name: skill-eval-suite
description: >
  For any AccentOS skill in /home/user/accent-os/skills/, generate a
  Promptfoo-compatible eval YAML containing 5–8 test cases (canonical
  happy path + edge cases drawn from the skill-forge gotcha-log) with
  assertions on output shape, required field presence, AccentOS
  stack-substitution count, and trigger-phrase coverage. Turns
  skill-forge Step 8 Ralph loop from mental → automated regression
  testing. Runnable locally and in CI. Use this skill when Michael
  says: "eval suite for [skill]", "test [skill name]", "promptfoo
  for [skill]", "regression tests for [skill]", "automate the Ralph
  loop", "lock in [skill] behavior", or any phrasing that asks for
  automated tests against an existing skill. Do not use for code
  tests (use the AccentOS test runner) or for stress-testing skill-
  forge itself (that's still Ralph-loop manual). Always produces a
  promptfooconfig.yaml + run command — never returns prose-only.
---

# skill-eval-suite

**Purpose:** Ralph-loop fixes are durable only if they're regression-tested. This skill generates Promptfoo eval YAMLs that lock in the Ralph fixes plus canonical behavior, runnable on every skill change.

Stolen from: Promptfoo (https://github.com/promptfoo/promptfoo) — Anthropic-acquired Mar 2026, ships an official Agent Skill via `/promptfoo-evals`. AccentOS-customized for skill-validation context.

---

## Trigger Recognition

Run when Michael says:
- "eval suite for [skill name]"
- "test [skill]" / "promptfoo for [skill]"
- "regression tests for [skill]"
- "automate the Ralph loop"
- "lock in [skill] behavior"

---

## Step 1 — Locate the target skill

Input: skill name (e.g. `vendor-cascade`) or path (e.g. `/home/user/accent-os/skills/vendor-cascade/`).

Read:
- `SKILL.md` — for description, trigger phrases, workflow steps, output format
- `references/*.md` — for any templated outputs
- Recent `gotcha-log.md` entries that mention this skill — for known edge cases

If the skill doesn't exist in `/home/user/accent-os/skills/`, output "Skill not found" and stop.

---

## Step 2 — Identify the test surface

For each skill, define what's testable:

| Test class | What it asserts |
|---|---|
| **Trigger coverage** | At least one phrase from the trigger list, when used as input, fires the skill |
| **Output shape** | The output contains the named blocks (e.g. "BLOCK 1", "BLOCK 2", or whatever Step 5/6/7 of the skill defines) |
| **Required fields** | Specific fields present in the output (e.g. vendor_id, sku, severity) |
| **AccentOS substitutions** | Output mentions AccentOS-specific substitutions (Supabase ID, BC store ID, etc.) when relevant |
| **Edge case from gotcha-log** | The skill handles a known edge case correctly (e.g. empty input, missing prereq) |
| **Anti-pattern compliance** | The skill doesn't do what its anti-patterns prohibit (e.g. doesn't auto-apply mutations) |

---

## Step 3 — Compose the test cases

Generate 5–8 test cases. Mandatory structure:

1. **Canonical happy path** — most common Michael phrasing → expected full output
2. **Alternate trigger phrase** — second most common phrasing → same output shape
3. **Empty / minimal input** — what does the skill do when the prereq data is missing?
4. **Edge case from gotcha-log** — pull the most recent gotcha entry mentioning this skill
5. **Anti-pattern violation attempt** — input that would tempt the skill to break a rule (e.g. asking it to auto-apply)
6. **Stack-substitution check** — does the output reference Supabase/BC/AccentOS appropriately?
7. **Output-shape regression** — exact-match assertion on the BLOCK headers
8. **SKILL.md frontmatter parses** — meta-test that asserts the target's own YAML frontmatter is valid (description ≥ 250 chars, name kebab-case, no unfilled `[bracketed]` placeholders outside fenced blocks). Implement as a Promptfoo `javascript:` assertion that reads the SKILL.md file and runs the validation regex set OR as a `python:` script using `python-frontmatter` for the YAML parse step. Catches regressions in the SKILL.md itself.

For each test case, define `vars` (input), `assert` array (one or more assertions), and optional `description`.

---

## Step 4 — Generate promptfooconfig.yaml

Output a YAML file path: `/home/user/accent-os/skills/[skill-name]/promptfooconfig.yaml`.

```yaml
description: "Eval suite for [skill-name]"

prompts:
  - file:///home/user/accent-os/skills/[skill-name]/SKILL.md

providers:
  - id: anthropic:messages:claude-sonnet-4-6
    config:
      max_tokens: 4096

defaultTest:
  options:
    provider: anthropic:messages:claude-sonnet-4-6

tests:
  - description: "Canonical happy path"
    vars:
      input: "[most common Michael phrasing]"
    assert:
      - type: contains
        value: "BLOCK 1"
      - type: contains
        value: "BLOCK 2"
      - type: contains-any
        value: ["AccentOS", "Accent Lighting", "hsyjcrrazrzqngwkqsqa"]

  - description: "Alternate trigger — [second phrasing]"
    vars:
      input: "[second phrase]"
    assert:
      - type: contains
        value: "BLOCK 1"

  - description: "Edge — empty prereq data → graceful redirect"
    vars:
      input: "[input where prereq is missing]"
    assert:
      - type: contains-any
        value: ["Run [prereq-skill] first", "No data", "redirect"]
      - type: not-contains
        value: "ERROR"

  # ... 4 more test cases following Step 3 structure
```

---

## Step 5 — Output the run instructions

```
═══ BLOCK 1: ARTIFACT ═══
Wrote: /home/user/accent-os/skills/[skill-name]/promptfooconfig.yaml

═══ BLOCK 2: RUN COMMAND ═══
cd /home/user/accent-os/skills/[skill-name]/ && \
  npx promptfoo@latest eval

# Or via the official Promptfoo Agent Skill:
# /promptfoo-evals @[skill-name]/SKILL.md

═══ BLOCK 3: CI INTEGRATION (optional) ═══
Add to .github/workflows/skill-eval.yml:
  - name: Run [skill-name] evals
    run: cd skills/[skill-name] && npx promptfoo@latest eval --output results.json

═══ BLOCK 4: WHAT'S TESTED ═══
- [N] test cases generated
- Coverage: trigger phrases, output shape, edge cases, anti-pattern compliance
- gotcha-log edge cases incorporated: [list IDs]
```

---

## Anti-patterns

- **Never** generate evals that test implementation details that could legitimately change. Test behaviors, not specific phrasings of internal text.
- **Never** assert on exact LLM output strings — use `contains` / `regex` / `contains-any` instead. LLM outputs vary; tests should pass on equivalent outputs.
- **Never** skip the gotcha-log edge case test. That's the regression-protection point.
- **Never** generate fewer than 5 test cases — coverage matters.
- **Never** auto-run the eval suite. Output the command; Michael runs it (cost + token budget control).
