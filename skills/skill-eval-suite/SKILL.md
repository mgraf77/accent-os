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
- "write evals for [skill]"
- "make sure [skill] doesn't regress"
- "coverage for [skill]"
- "add tests to [skill]"

---

## Step 1 — Locate the target skill

Input: skill name (e.g. `vendor-cascade`) or path (e.g. `/home/user/accent-os/skills/vendor-cascade/`).

Do in parallel:
- Read `SKILL.md` — for description, trigger phrases, workflow steps, output format
- Read `references/*.md` — for any templated outputs
- Read `/home/user/accent-os/skills/skill-forge/gotcha-log.md` — for known edge cases mentioning this skill

**Edge cases:**
- Skill not found in `/home/user/accent-os/skills/` → check `~/.claude/skills/` before failing. If absent in both, output "Skill not found at either path" and stop.
- `gotcha-log.md` absent → skip silently; note in Step 5 Block 4 that no gotcha entries were incorporated.
- Skill exists but has no `references/` folder → proceed; only assert on SKILL.md-level outputs.

Output of Step 1: confirmed file paths read, gotcha entry IDs relevant to this skill (or "none").

---

## Step 2 — Identify the test surface

For each skill, define what's testable. Output a test-surface table before writing cases:

| Test class | What it asserts | Assertion type |
|---|---|---|
| **Trigger coverage** | At least one phrase from the trigger list, when used as input, fires the skill | `contains` block header |
| **Output shape** | The output contains the named blocks (e.g. "BLOCK 1", "BLOCK 2", or whatever Step 5/6/7 of the skill defines) | `contains` / `regex` |
| **Required fields** | Specific fields present in the output (e.g. vendor_id, sku, severity) | `contains` |
| **AccentOS substitutions** | Output mentions AccentOS-specific substitutions (Supabase `hsyjcrrazrzqngwkqsqa`, BC `store-cwqiwcjxes`, etc.) when relevant | `contains-any` |
| **Edge case from gotcha-log** | The skill handles a known edge case correctly (e.g. empty input, missing prereq) | `not-contains` ERROR + `contains` redirect |
| **Anti-pattern compliance** | The skill doesn't do what its anti-patterns prohibit (e.g. doesn't auto-apply mutations) | `not-contains` |
| **SKILL.md frontmatter** | description ≥ 250 chars, name kebab-case, no unfilled `[bracketed]` placeholders outside fenced blocks | `javascript:` assertion |

**If the target skill has no named output blocks** (no BLOCK headers), derive shape assertions from: the first fenced code block in the last workflow step, or the scan-block pattern at the end of the workflow.

---

## Step 3 — Compose the test cases

Generate 5–8 test cases. Mandatory structure:

1. **Canonical happy path** — most common Michael phrasing → expected full output shape
2. **Alternate trigger phrase** — second most common phrasing → same output shape asserted
3. **Empty / minimal input** — what does the skill do when the prereq data is missing? Assert graceful redirect, not raw error.
4. **Edge case from gotcha-log** — pull the most recent gotcha entry mentioning this skill; if none, use the skill's own "Out of scope" or fail-fast clause as the input.
5. **Anti-pattern violation attempt** — input that would tempt the skill to break a rule (e.g. asking it to auto-apply)
6. **Stack-substitution check** — does the output reference `hsyjcrrazrzqngwkqsqa` / `store-cwqiwcjxes` / AccentOS appropriately when the skill is PROJECT or BOTH scope?
7. **Output-shape regression** — `contains` assertion on every named BLOCK header in the skill's output section
8. **SKILL.md frontmatter parses** — meta-test asserting valid frontmatter: description ≥ 250 chars, name kebab-case, no unfilled `[bracketed]` placeholders outside fenced blocks. Implement as a Promptfoo `javascript:` assertion reading the SKILL.md file and running the validation regex set OR as a `python:` script using `python-frontmatter`. Catches regressions in the SKILL.md itself.

For each test case, output a structured block:
```
TEST-N: [test class name]
  vars.input: "[exact input string]"
  assert:
    - type: [contains | not-contains | contains-any | regex | javascript:]
      value: "[expected value or script path]"
  description: "[one sentence — what this case protects against]"
```

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
- **Never** skip the gotcha-log edge case test. That's the regression-protection point. If no gotcha exists, derive an edge case from the skill's own out-of-scope clause.
- **Never** generate fewer than 5 test cases — coverage matters.
- **Never** auto-run the eval suite. Output the command; Michael runs it (cost + token budget control).
- **Never** write assertions without a `description` field — undocumented assertions become unmaintainable.
- **Never** assume a skill lives only in `/home/user/accent-os/skills/` — check `~/.claude/skills/` for GLOBAL-scope skills before failing Step 1.
