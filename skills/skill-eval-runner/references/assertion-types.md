# Assertion type reference

> Exact semantics for each `assert[*].type` value in skill-eval-suite-authored eval-cases.yaml. The runner uses ONLY these types; if skill-eval-suite introduces a new type, this reference must be updated first or the case is marked `skipped: yaml-schema-unsupported`.

## Supported types

| Type | `value` shape | Pass condition | Example use |
|---|---|---|---|
| `contains` | string | `value in response` (case-sensitive substring) | Output-shape assertions like `BLOCK 1` headers |
| `icontains` | string | `value.lower() in response.lower()` | Case-insensitive header matches |
| `contains-any` | array of strings | at least one element appears in response | OR-shaped output coverage |
| `not-contains` | string | `value not in response` | Anti-pattern compliance (e.g. no `auto-apply`) |
| `not-contains-any` | array of strings | NO element from the array appears in response | Stronger anti-pattern fence |
| `regex` | string (regex pattern) | `re.search(value, response)` matches | Format checks (e.g. ISO timestamp shape) |

## Aggregation rule

A case **passes** iff **every** entry in its `assert[]` array passes. There is no partial pass; assertions are AND-joined per case.

## Why no `equals` / `is-json` / `cost`

- `equals` / `exact-match` — too brittle. LLM outputs vary; equivalent-but-non-identical responses would false-fail.
- `is-json` / `is-valid-json` — skill outputs in AccentOS are mostly Markdown blocks, not JSON. Add only if a skill begins shipping JSON outputs and skill-eval-suite authors a case that needs it.
- `cost` / `latency` thresholds — performance signals belong in `skill-performance-tracker`, not in pass/fail evaluation.

If skill-eval-suite begins authoring assertion types not in this table, the runner marks the case `skipped: yaml-schema-unsupported` and surfaces a footer note. The fix is in this file plus the runner's Step 3 logic — NEVER skip silently.

## Case-sensitivity defaults

- `contains` / `not-contains` / `contains-any` / `not-contains-any` — case-sensitive by default. Use `icontains` if case-insensitive matching is needed.
- `regex` — runner uses Python `re.search` with no flags. To request case-insensitive, the YAML's `value` must use the inline flag `(?i)`.

## Examples

```yaml
# Output-shape — block headers must appear
- type: contains
  value: "BLOCK 1: LEADERBOARD"

# OR-coverage — any of these strings is acceptable
- type: contains-any
  value: ["AccentOS", "Accent Lighting", "hsyjcrrazrzqngwkqsqa"]

# Anti-pattern fence — output must not auto-apply
- type: not-contains
  value: "auto-applied"

# Multi-fence — none of these phrases allowed
- type: not-contains-any
  value: ["auto-deprecate", "silently picked", "deleted skill"]

# Format check — ISO timestamp shape somewhere in output
- type: regex
  value: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}"
```

## Future-proofing

When `skill-eval-suite` proposes a new assertion type, the change MUST land in two places before the runner accepts it:

1. New row in this table with the pass condition.
2. New branch in `skill-eval-runner` Step 3's assertion logic.

Adding the type to skill-eval-suite without updating this file produces silently-skipped cases — a regression dressed as green.
