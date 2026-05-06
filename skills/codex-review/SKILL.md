---
name: codex-review
description: >
  Have OpenAI Codex audit recent AccentOS work — the most recent commit,
  a named branch, a specific skill, or a file path — and produce a
  structured list of recommendations. Auto-apply the LOW-RISK ones
  (typos, missing anti-patterns, formatting consistency, AccentOS
  stack-substitution gaps, prose-wall tightening). Surface HIGH-RISK
  ones (behavioral changes, SQL query rewrites, removed/reordered
  workflow steps, trigger phrase changes, new dependencies) to Michael
  for explicit approval. Closes the "single-agent blind spot" gap —
  Claude wrote the work, Codex audits it, then Claude applies the safe
  fixes and surfaces the rest. Use this skill when Michael says: "codex
  review", "have codex check this", "peer review the last commit",
  "review what we just did", "codex audit", "second-opinion on
  [skill/file/branch]", "cross-review", or any phrasing that asks for
  cross-agent review of recent AccentOS work. Do not use this skill for
  long-lived AccentOS module review (use ultrareview) or for one-line
  typo fixes (just fix it). Always produces an auto-applied diff
  summary plus a surfaced-for-review list — never returns prose-only.
---

# codex-review

**Purpose:** Claude's self-review (the Step 8 Ralph loop in skill-forge) catches what Claude knows to look for. Cross-agent review catches blind spots — patterns one agent over-uses, edge cases one agent under-handles, idioms one agent prefers that another would call out. This skill closes that loop with a tight safety gate.

Stolen from: nothing external — this is a cross-agent collaboration pattern AccentOS-specific. Companion to `skill-eval-suite` (Promptfoo automated tests) and `skill-forge` Step 8 (mental Ralph loop).

---

## Trigger Recognition

Run when Michael says:
- "codex review" / "codex audit"
- "have codex check this" / "second-opinion on [target]"
- "peer review the last commit" / "review what we just did"
- "cross-review" / "cross-agent review"
- "fresh eyes on this" / "get another agent to look at this"
- "double-check what we built" / "sanity check the skill"
- "review [skill-name]" / "audit the last changes"

Also fire automatically (with confirmation) at the end of any skill-forge run that produced ≥3 forged skills — the cross-review payoff is highest on multi-skill batches.

---

## Step 1 — Identify the review target

Default: the working-tree diff vs. `main` (everything modified or added on the current branch).

Overrides:
- `codex review [skill-name]` → `/home/user/accent-os/skills/[skill-name]/`
- `codex review [file-path]` → that file
- `codex review last commit` → the most recent commit on current branch
- `codex review [SHA]` → the named commit
- `codex review vs [branch]` → diff against that branch

Output the chosen target up front. Cap at 10 files per invocation — if the target spans more, split into batches and run sequentially (cost + quality drop-off above 10).

**Do in parallel:** Reading the target files (Step 1 I/O) and detecting Codex availability (Step 2 probe) can run concurrently — fire both before combining results.

**Empty-target fail-fast.** If the resolved target produces zero files (e.g. `git diff main` is empty because nothing has changed, or the named skill directory doesn't exist), stop immediately and output: "No files in review target. Either nothing has changed since main, or the target was misspelled. Specify a different target with: `codex review [skill-name | path | SHA | vs branch]`." Do not invoke Codex on an empty input — wastes tokens and produces noise.

---

## Step 2 — Detect Codex availability

Probe in this order:

1. **`codex` CLI** — `which codex` (the OpenAI Codex open-source CLI). If found, prefer.
2. **OpenAI API** — `printenv OPENAI_API_KEY`. If non-empty, fall back to `curl` against `https://api.openai.com/v1/chat/completions`.
3. **Neither** — output the setup hint and stop:

```
codex-review: no Codex backend found.
Install one of:
  • Codex CLI: npm i -g @openai/codex   (https://github.com/openai/codex)
  • API key:   export OPENAI_API_KEY=sk-...   (https://platform.openai.com/api-keys)
```

Record which backend will be used; include in the output report.

---

## Step 3 — Construct the review prompt

Build a prompt that gives Codex the context it needs. Save to `/tmp/codex-review-prompt.md`:

```
You are reviewing AccentOS skill files written by Claude. AccentOS is
Michael's solo-built vendor intelligence platform at
github.com/mgraf77/accent-os. Stack: vanilla JS frontend, Supabase
backend (project hsyjcrrazrzqngwkqsqa), Cloudflare Pages hosting,
Anthropic API for AI features. The Accent Lighting ecommerce business
runs on BigCommerce store-cwqiwcjxes with Feedenomics → GMC merchant
ID 687520574.

Skill files follow this convention: YAML frontmatter (name,
description ≥250 chars including "AccentOS" or "Accent Lighting"),
numbered workflow steps with concrete outputs, ≥3 anti-patterns,
no prose walls.

Files under review:
[full file contents — embedded, not summarized]

Produce 5–15 recommendations as a JSON array. Each item:
{
  "file": "path/relative/to/repo",
  "type": "typo | anti-pattern | formatting | substitution | prose-tighten | behavior | query | trigger | step | dependency",
  "risk": "LOW" or "HIGH",
  "old_string": "<<exact text to replace>>",
  "new_string": "<<exact replacement>>",
  "rationale": "one sentence"
}

Risk classification:
  LOW (Claude will auto-apply):
    - typo, anti-pattern (adding a new "Never X"), formatting,
      substitution (adding AccentOS-stack term), prose-tighten
  HIGH (surface for Michael's approval):
    - behavior, query (SQL semantic change), trigger phrase,
      step (add/remove/reorder), dependency (new file/env var/MCP)

Output ONLY the JSON array. No prose, no markdown fence.
```

**Assembling file contents** depends on the Step 1 target:
- **Diff-style target** (working tree, branch comparison, last commit): include only the *changed* portions (`git diff --unified=20 ...`) — full files are wasteful when most lines are unchanged.
- **Full-file target** (named skill, file path): embed the entire file contents.
- **Multi-file target**: order files alphabetically; mark file boundaries with `=== FILE: [path] ===` headers so Codex can cite them in `file` field.

If files exceed 50KB combined, chunk into multiple calls of ≤10 files each. Recommendations from each chunk merge into one report.

**JSON-array constraint:** OpenAI's `response_format: {type: "json_object"}` returns an object, not a bare array. Wrap the prompt's request as: "Return `{\"recommendations\": [...]}` — a JSON object with a single key `recommendations` whose value is the array." Step 5 unwraps the array.

---

## Step 4 — Invoke Codex

Model name defaults to `gpt-5-codex` for both CLI and API. Override via `CODEX_MODEL` env var if needed.

Via CLI (preferred):
```bash
codex --model "${CODEX_MODEL:-gpt-5-codex}" --prompt-file /tmp/codex-review-prompt.md \
  > /tmp/codex-review-response.json 2>/tmp/codex-review.log
```

Via API (fallback):
```bash
MODEL="${CODEX_MODEL:-gpt-5-codex}"
jq -Rs --arg model "$MODEL" '{
  model: $model,
  messages: [{role: "user", content: .}],
  response_format: {type: "json_object"}
}' /tmp/codex-review-prompt.md \
  | curl -sS https://api.openai.com/v1/chat/completions \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -H "Content-Type: application/json" \
      -d @- \
  | jq -r '.choices[0].message.content' \
  > /tmp/codex-review-response.json
```

After the call, parse: `jq -r '.recommendations' /tmp/codex-review-response.json` — the array unwrap.

If the call fails (network error, 4xx, 5xx), retry once after 5s. If it fails again, stop and surface the error — do not proceed with stale or empty recommendations.

---

## Step 5 — Parse and validate

Read `/tmp/codex-review-response.json`. For each item:

| Validation | Reject if |
|---|---|
| Schema | Missing any of: file, type, risk, old_string, new_string, rationale |
| Risk enum | Not exactly "LOW" or "HIGH" |
| Type enum | Not in the 10 allowed values |
| File scope | `file` is outside the review target from Step 1 |
| Concrete change | `old_string` and `new_string` are identical or `old_string` is empty |
| Frontmatter touch | `old_string` or `new_string` overlaps the YAML frontmatter (lines 1–N until second `---`) — this is too risky to auto-apply |

Rejected items are logged in the output but not applied or surfaced.

---

## Step 6 — Auto-apply LOW-risk

For each surviving LOW item:

1. Read the target file.
2. Verify `old_string` appears exactly once in the file (anchor uniqueness).
3. If unique → apply via Edit tool.
4. If not unique OR not found → demote to PROPOSE (HIGH-surfaced) with reason "ambiguous anchor — needs manual review."
5. Track every successful apply in the output report.

After all LOW items applied, re-run skill-forge Step 7.5 validation on each modified file. The check is performed inline by Claude reading the file and verifying the 6 validation points (description ≥250 chars, AccentOS named, ≥3 stack substitutions, ≥3 anti-patterns, no prose walls, no unfilled `[bracketed]` outside fenced blocks).

If validation now FAILs (e.g. an applied edit dropped AccentOS substitution count below 3), revert *that file's most recent applied edit* using a counter-Edit (swap `old_string` and `new_string`), demote the corresponding recommendation to PROPOSE, and explicitly log the revert in BLOCK 2 of the output: "REVERTED: [recommendation N] — post-edit Step 7.5 failed on [validation point]."

---

## Step 7 — Surface HIGH-risk

For each HIGH item (plus any LOW items demoted in Step 5/6), output a per-recommendation block:

```
HIGH-RISK RECOMMENDATION #N
  File: skills/[name]/SKILL.md
  Type: [type]
  Rationale (Codex): [one sentence]

  Old:
  ---
  [old_string verbatim]
  ---

  New:
  ---
  [new_string verbatim]
  ---
```

Number each recommendation sequentially across the whole run so Michael can refer to them by number.

**Wait-vs-exit semantics.** This skill is *exit-and-report*, not *halt-and-wait*. It outputs the surfaced recommendations and ends the run. Michael reviews them at his pace.

**Apply-mode is manual follow-up in v1.** To act on a surfaced recommendation in a later turn, Michael says one of:

- `"apply codex-review N1 N3"` → Claude reads `/tmp/codex-review-response.json`, locates recommendations N1 and N3, and Edits them via the standard Edit tool (subject to the same Step 5 + Step 6 validations).
- `"apply codex-review all"` → applies every surfaced HIGH from the most recent run.
- `"skip codex-review N2"` → no-op (just logged in `/tmp/codex-review-skipped.log` for future pattern analysis).
- `"edit codex-review N4 — [revised text]"` → applies a Michael-modified version of N4's `new_string`.

The codex-review skill itself does not include automated apply-mode logic in v1 — apply requests are handled by Claude directly using the persisted `/tmp/codex-review-response.json` from the most recent run. If Michael's reply comes after another codex-review run, the prior recommendations are lost — surface this risk in BLOCK 5.

---

## Step 8 — Output

```
═══ BLOCK 1: REVIEW SUMMARY ═══
Target: [Step 1 target]
Backend: [codex CLI | OpenAI API]
Files reviewed: [N]
Recommendations from Codex: [N]
  Schema-rejected: [count]
  Auto-applied (LOW): [count]
  Demoted to surface (anchor failed): [count]
  Surfaced (HIGH): [count]

═══ BLOCK 2: AUTO-APPLIED DIFF SUMMARY ═══
For each applied recommendation:
  - file:line — [type] — [one-line summary of the fix]

═══ BLOCK 3: SURFACED FOR REVIEW ═══
[Step 7 blocks, numbered]

═══ BLOCK 4: REPLAY ═══
Prompt sent to Codex saved at: /tmp/codex-review-prompt.md
Codex response saved at: /tmp/codex-review-response.json
Re-run with same context: codex review --replay [target]

═══ BLOCK 5: NEXT-STEP HINTS ═══
- Spot-check 2 of the auto-applied diffs in BLOCK 2 (git diff)
- Approve / skip / edit each HIGH recommendation in BLOCK 3
- After all approvals applied, run skill-eval-suite if any skill was modified
- If 3+ HIGH recommendations land on the same file, consider re-forging
  that skill — Codex is signaling the original Claude design has structural issues
```

If everything was clean (Codex returned 0 recommendations OR all were schema-rejected), output: "Codex produced no actionable recommendations on [target]. Either the work is in good shape or the prompt didn't give Codex enough context — try `codex review --replay` with extra context."

---

## Anti-patterns

- **Never** auto-apply HIGH-risk recommendations. The whole point of the skill is the safety gate.
- **Never** auto-apply a LOW recommendation whose `old_string` isn't unique in the target file. Demote, don't guess.
- **Never** apply a recommendation that touches YAML frontmatter (lines 1 through the second `---`). Frontmatter contains trigger phrases — too important to auto-edit.
- **Never** invoke Codex on >10 files in one call. Split into batches of ≤10.
- **Never** include Codex's verbatim text in commit messages — paraphrase. Avoids ToS questions on derivative content.
- **Never** trust Codex's recommendation when its `old_string` and `new_string` are semantically identical (e.g. just whitespace differences) — reject as no-op in Step 5.
- **Never** modify files outside the Step 1 review scope, even if Codex suggests it. Scope is scope.
- **Never** auto-revert a Step 6 edit silently — if Step 7.5 validation fails post-edit, log the revert in BLOCK 2 explicitly so Michael sees what happened.
- **Never** run codex-review on AccentOS skill files from a dirty working tree without noting unstaged changes — unstaged edits won't appear in `git diff` and will produce an incomplete review.
- **Never** allow the review to continue if the combined file content exceeds 50KB without chunking — Codex context limits produce silent truncation errors above this threshold.
