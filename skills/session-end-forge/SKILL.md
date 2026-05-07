---
name: session-end-forge
description: >
  At AccentOS session end, ask Michael one yes/no question — "Do you want to
  make this process of the session into a reusable skill? reply yes or no" —
  and if yes, distill the session's recurring process (PROMPT_LOG, git diff,
  commits, efficiency-monitor scratch) into a draft SKILL.md, then run two
  agentic ralph-loop optimization passes from five named perspectives
  (Reliability Auditor, Trigger Hunter, Stack Native, Maintenance Skeptic,
  Anti-pattern Cop) scoring 0–100 against `references/scoring-rubric.md`,
  iterating until score ≥85 or 4 passes cap. Pass 1 is Claude walking each
  perspective in-context; Pass 2 spawns an independent Agent subagent for
  outside-eyes multi-perspective review and applies its findings. Distinct
  from skill-forge (external-source ingestion) and efficiency-monitor
  (signal collection only). Use this skill when Michael says: "wrap up",
  "we're done", "end session", "/session-end-forge", "forge this session",
  "make this a skill", or when the session-end commit is being prepared.
  Do not use for mid-session ad-hoc skill creation (use skill-forge with an
  external target) or when no recurring process emerged this session.
  Always asks the question, always scores against the rubric, always either
  ships a skill ≥85/100 or aborts to WATCH with a one-line reason — never
  ships an unscored skill, never proceeds past "no" without stopping.
---

# session-end-forge

**Purpose:** Capture the session's actual recurring work as a reusable AccentOS skill at the moment it's freshest, with multi-perspective stress-testing baked in so the output is shippable, not a draft.

Six phases in order: **trigger → ask → distill → forge-draft → ralph-pass-1 → ralph-pass-2 → score-gate → commit**. The yes/no gate (Step 2) and the two ralph passes (Steps 5 + 6) are non-negotiable. Pairs with `efficiency-monitor` (which feeds candidate signals) and `skill-forge` (which handles external-source forging). Reuses `skill-forge`'s Step 7.5 pre-commit validation verbatim — same gates, same gotcha-log discipline.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "wrap up" / "we're done" / "end session"
- "/session-end-forge" / "forge this session" / "make this a skill"
- "turn this into a skill"
- "save this as a skill"
- Or auto-invoked from CLAUDE.md AUTO-EXECUTE step 8 after `efficiency-monitor`'s Step 2 wrap-up completes.

**Disambiguation vs. skill-forge:** session-end-forge sources from this session's actual work (PROMPT_LOG, git diff, scratch). skill-forge sources from an external tool/repo Michael named. If Michael names an external target, route to skill-forge, not here.

---

## Scope

**In scope:**
- The current session's recurring multi-step process, distilled into one named skill
- Patterns surfaced by `efficiency-monitor` at PROMOTE status this session
- Single-skill output per invocation (multi-skill batches → run skill-forge)

**Out of scope — fail fast with a one-line redirect:**
- No recurring process this session → "Nothing to forge — session was one-off work. Skipping."
- Session pattern matches an existing skill in `skills/_index.md` → "This is `[matched-skill]`. Run that next time instead of forging a duplicate."
- Externally-sourced concept named → "Use skill-forge with target=[name] — that's the external-research path."

---

## Step 0 — Preflight

Run in parallel before asking the question:

1. **Read `skills/skill-forge/gotcha-log.md`** — apply every prevention rule. session-end-forge inherits the same gotcha discipline.
2. **Capture branch state** — `git -C /home/user/accent-os branch --show-current`. If on `main`, Step 8 will auto-create `claude/session-forge-[skill-name]-[8-char-rand]` before committing.
3. **Read `skills/efficiency-monitor/session-end-summary.md`** — pull any PROMOTE-status candidate. If present, that's the strongest forge target.
4. **Read `skills/efficiency-monitor/_session-scratch.md`** if it exists — recurring-sequence flags from this session.
5. **Read tail of `PROMPT_LOG.md`** (last ~30 entries) — capture Michael's actual phrasing for trigger candidates.
6. **Read `git log --oneline -20`** on the current branch — what shipped this session.
7. **Read `skills/_index.md`** — for the dedupe check in Step 3.

Output of Step 0: a one-line preflight note: `branch | candidate-source (efficiency-monitor PROMOTE / scratch / git-only) | gotcha rules applied`. Nothing else surfaced yet.

---

## Step 1 — Compile session signature

Build a compact internal summary of the session's recurring process. Sources, in priority order:

| Priority | Source | What to extract |
|----------|--------|-----------------|
| 1 | `efficiency-monitor` PROMOTE candidate | The pattern Claude already flagged as ready |
| 2 | `_session-scratch.md` recurring-sequence entries | Step sequences seen ≥2× this session |
| 3 | git diff + last 5 commits | Actual file-touch pattern, what changed |
| 4 | PROMPT_LOG.md tail | Michael's repeated request shapes |
| 5 | WORK_IN_PROGRESS.md | Active task framing |

Distill into a **session signature block** (Claude's working memory, not surfaced to Michael yet):

```
SIGNATURE
  recurring-process: [one sentence — what was done repeatedly]
  step-sequence: [step1 → step2 → step3 → ...]
  inputs: [what Michael provided each time]
  outputs: [what was produced each time]
  occurrences: [N times this session]
  michael-phrasings: [3 actual phrases from PROMPT_LOG]
  closest-existing-skill: [skill-name | none]
```

If `closest-existing-skill` is not `none` and trigger overlap is high, abort to "this matches `[skill]`" redirect (Step 0 out-of-scope rule). Otherwise proceed to Step 2.

If signature occurrences < 2, abort: "Single-occurrence work — not a skill candidate. Skipping forge."

---

## Step 2 — Ask the question (the gate)

Use the `AskUserQuestion` tool with this exact configuration:

- **question:** `Do you want to make this process of the session into a reusable skill? reply yes or no`
- **header:** `Forge skill?`
- **options:**
  1. label: `Yes, forge it` — description: `Draft skill, run 2 multi-perspective ralph passes, ship if score ≥85/100`
  2. label: `No, wrap up` — description: `Skip forging. Session ends as planned.`
- **multiSelect:** false

**Halt the run.** Do not write any skill files until the answer comes back.

Branch on the answer:
- **No** → Output one line: `Skipping forge. Session ending.` Append a `forge-log.md` entry with `verdict: declined`. Stop.
- **Yes** → Proceed to Step 3.

If the answer is anything other than yes/no (free-text via "Other"), parse intent. If ambiguous, ask one targeted clarifying question — do not guess.

---

## Step 3 — Name + dedupe + draft scaffold

For "yes":

1. **Propose skill name** — kebab-case, action-oriented, ≤3 words, ≤25 chars. Derive from Step 1 signature's recurring-process phrasing. Verify uniqueness: `ls /home/user/accent-os/skills/` must not contain a directory of the same name. If collision, suffix `-v2` is forbidden — pick a different angle on the verb.
2. **Final dedupe check** — re-scan `skills/_index.md` triggers. If any existing skill's triggers cover ≥2 of the proposed skill's Michael-phrasings, abort with "Duplicates `[skill]` — extending that one is the right move. Skipping new forge."
3. **Surface the proposed name** to Michael in one line: `Forging: [name] — [one-sentence purpose]. Two ralph passes start now.` No approval gate here — Michael already said yes in Step 2. The score gate (Step 7) is the second gate.

---

## Step 4 — Forge the draft

Write to `/home/user/accent-os/skills/[skill-name]/`:
- `SKILL.md` — frontmatter + workflow, following `skill-forge/references/skill-template.md`
- `references/*.md` — only if overflow > 5000 tokens (most session-forged skills will not need references)

**AccentOS-mandatory substitutions** (same as skill-forge Step 7):
- Paths → `/home/user/accent-os/` (Codespace alt `/workspaces/accent-os/` only when relevant)
- "your project" → AccentOS or Accent Lighting (specific)
- Generic store → BigCommerce store-cwqiwcjxes
- Generic DB → Supabase hsyjcrrazrzqngwkqsqa
- At least one concrete example referencing vendor scoring, vendor ranking, GMC feed, or Klaviyo
- Anthropic API key via `ANTHROPIC_API_KEY` env var

Frontmatter requirements (validated in Step 7):
- `name`: kebab-case, ≤25 chars
- `description`: ≥250 chars, multi-line `>` block, includes "AccentOS" or "Accent Lighting" by name, ends with shipped-behavior commitment ("always X, never Y")
- Trigger phrases mined from Step 1's `michael-phrasings`, not invented
- Workflow: 4–7 numbered steps, each with concrete output
- Anti-patterns: ≥3 entries

Use the Write tool. Never use bash heredocs for skill files.

After write, output one line: `Draft written: skills/[name]/SKILL.md ([N] tokens).` Then proceed to Step 5.

---

## Step 5 — Ralph Pass 1 — Claude walks five perspectives

Read `references/perspectives.md` and `references/scoring-rubric.md`. For each of the five perspectives below, embody the persona in turn, score the draft 0–20, and capture findings. Do not surface findings to Michael during the pass — collect everything, fix everything, then surface the totals.

Perspectives (rubric in `references/scoring-rubric.md`):

1. **Reliability Auditor** (0–20) — edge cases, failure modes, missing-prereq redirects
2. **Trigger Hunter** (0–20) — does trigger phrasing actually match Michael's PROMPT_LOG voice?
3. **Stack Native** (0–20) — AccentOS-specific substitutions count + quality
4. **Maintenance Skeptic** (0–20) — will it rot? Brittle path/ID assumptions?
5. **Anti-pattern Cop** (0–20) — anti-patterns specific, ≥3, name actual failure modes

Per-perspective workflow:
- Read the draft top to bottom in that persona's voice
- Generate ≥3 concrete findings (or "no issues found" if genuinely clean — rare on first pass)
- Score 0–20 per the rubric
- Apply fixes in-place via Edit on the draft SKILL.md

After all five perspectives run, sum the score. Record Pass 1 totals in `forge-log.md`:

```
### forge-NNN — YYYY-MM-DD HH:MM — [skill-name] — Pass 1
- reliability: NN/20 — [one-line note]
- trigger: NN/20 — [one-line note]
- stack: NN/20 — [one-line note]
- maintenance: NN/20 — [one-line note]
- anti-pattern: NN/20 — [one-line note]
- total: NN/100
- fixes-applied: [count]
```

Proceed to Step 6 regardless of Pass 1 score (Pass 2 always runs — that's the "two passes" the trigger spec promises).

---

## Step 6 — Ralph Pass 2 — Agentic outside-eyes review

Spawn an `Agent` (subagent_type: `general-purpose`) with this prompt template:

```
You are reviewing a freshly-forged AccentOS skill for shippability. The skill is at:
  /home/user/accent-os/skills/[skill-name]/SKILL.md

You have not seen this conversation. Read the SKILL.md, then read these context files:
  - /home/user/accent-os/skills/session-end-forge/references/perspectives.md
  - /home/user/accent-os/skills/session-end-forge/references/scoring-rubric.md
  - /home/user/accent-os/skills/_index.md (for dedupe check)

For each of the 5 perspectives in perspectives.md, score 0–20 per the rubric.
Surface ≥3 concrete findings per perspective. Then output:

PASS-2-FINDINGS
  reliability: NN/20 | findings: [one-line per finding]
  trigger: NN/20 | findings: ...
  stack: NN/20 | findings: ...
  maintenance: NN/20 | findings: ...
  anti-pattern: NN/20 | findings: ...
  total: NN/100
  top-3-fixes: [3 specific Edit-grade fixes — exact string changes]

Be harsh. The skill must score ≥85/100 to ship. Under 800 words.
```

When the agent returns, parse `PASS-2-FINDINGS`. Apply the `top-3-fixes` (and any other findings worth applying) via Edit on the draft SKILL.md.

Append Pass 2 results to `forge-log.md` using the same schema as Pass 1.

---

## Step 7 — Score gate + extra-pass loop

After Pass 2 fixes are applied, **re-score** the now-fixed SKILL.md across the 5 perspectives one final time (this is the post-fix score, not a third ralph pass — no new fixes applied here, just rescoring).

Threshold: **≥85/100 = ready to ship**.

| Final score | Action |
|-------------|--------|
| ≥ 85 | Proceed to Step 8 (commit) |
| 70–84 | Run Pass 3 (same shape as Pass 1 — Claude walks the 5 perspectives again, applies fixes). Cap total passes at 4. Re-score. |
| < 70 after 4 passes | Abort to WATCH. Append `forge-log.md` entry with `outcome: aborted_low_score`. Do not commit. Surface: "Score plateaued at NN/100 after 4 passes. Skill not ready — see forge-log for findings. Skipping commit." |

If Pass 3 or Pass 4 needed, log each pass in `forge-log.md` with the same schema as Pass 1.

---

## Step 7.5 — Pre-commit validation

Run skill-forge's exact Step 7.5 checklist (no divergence — keep the gates identical):

1. **YAML frontmatter parses** — name + description present, multi-line `>`, ≥250 chars, contains "AccentOS" or "Accent Lighting", no unfilled `[bracketed]` placeholders **outside fenced code blocks**.
2. **Name uniqueness** — directory does not collide with an existing skill.
3. **Substitution count** — ≥3 substantive AccentOS-stack references from the allowlist (AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, vendor_scores, vendor_overrides, GMC, Google Merchant Center, Feedenomics, Klaviyo, BigCommerce, Supabase, Cloudflare Pages, Anthropic API, /home/user/accent-os, /workspaces/accent-os).
4. **Anti-pattern section** — present, ≥3 entries.
5. **No prose walls** — every section is a list, table, or ≤4-sentence block.

Any failure → fix in place via Edit, do not commit. Log the failure as a gotcha entry in `skill-forge/gotcha-log.md` (session-end-forge shares that log to keep gotcha discipline unified).

---

## Step 8 — Register, commit, report

After the score is ≥85 and Step 7.5 passes:

1. **Register in `skills/_index.md`** — append a new entry following the existing schema (name, summary, triggers, when_to_use, when_NOT, companion).
2. **Confirm branch** — if on `main`, create `claude/session-forge-[skill-name]-[8-char-rand]`. Otherwise commit on the current branch.
3. **Stage** — `git add skills/[skill-name]/ skills/_index.md skills/session-end-forge/forge-log.md`.
4. **Commit** — message: `feat: forge [skill-name] from session signature — score NN/100 in K passes`.
5. **Push** — `git push -u origin [branch-name]` (retry up to 4× with exponential backoff on network failure per Operating Rules).
6. **Output** the report block:

```
═══ SKILL FORGED FROM SESSION ═══

Name: [skill-name]
Source: this session ([N] occurrences of recurring process)
Score: NN/100 (threshold 85)
Passes: K (Pass 1 = NN, Pass 2 = NN[, Pass 3 = NN[, Pass 4 = NN]])
Fixes applied: [count across all passes]

Files written:
  skills/[skill-name]/SKILL.md
  skills/_index.md (registered)

Trigger phrases (mined from PROMPT_LOG):
  - "[phrase 1]"
  - "[phrase 2]"
  - "[phrase 3]"

Branch: [branch] | Commit: [SHA short] | Pushed: yes

Next-session boot will surface this skill via vibe-speak Step 23.
═══════════════════════════════════
```

---

## Step 9 — Update forge-log

Append a final entry to `skills/session-end-forge/forge-log.md`:

```
### forge-NNN — YYYY-MM-DD HH:MM — [skill-name] — FINAL
- session-signature: [one line]
- occurrences-this-session: N
- pass-1-score: NN/100
- pass-2-score: NN/100
- final-score: NN/100
- passes-run: K
- outcome: shipped | aborted_low_score | declined
- skill-path: skills/[skill-name]/
- commit: [SHA short]
```

NNN sequential. This log is read at the next session's boot to track forge effectiveness over time.

If the run aborted (low score or signature-too-thin), still log the entry with the abort outcome — that data is what tunes the threshold.

---

## Output format (full successful run, condensed)

```
[Step 0] Preflight: branch=claude/... | source=efficiency-monitor PROMOTE | rules applied
[Step 1] Signature: recurring-process="..." | occurrences=4 | closest-existing-skill=none
[Step 2] AskUserQuestion → Yes
[Step 3] Forging: [name] — [purpose]. Two ralph passes start now.
[Step 4] Draft written: skills/[name]/SKILL.md (3,210 tokens).
[Step 5] Pass 1: 16+15+14+17+18 = 80/100. Fixes applied: 7.
[Step 6] Pass 2 (agent): 18+19+18+19+19 = 93/100. Fixes applied: 3.
[Step 7] Final score: 93/100. ≥85 → ship.
[Step 7.5] Validation: pass.
[Step 8] Registered, committed, pushed. SHA: a1b2c3d.
[Step 9] forge-log appended.
```

---

## AccentOS context

- Stack: Supabase hsyjcrrazrzqngwkqsqa + BigCommerce store-cwqiwcjxes + Cloudflare Pages + Anthropic API (Opus/Sonnet/Haiku 4.x)
- Project: AccentOS for Accent Lighting
- Paths: `/home/user/accent-os/` (Codespace: `/workspaces/accent-os/`)
- Pairs with: `efficiency-monitor` (signal source), `skill-forge` (external-source sibling), `skill-eval-suite` (post-forge regression tests)
- Auto-active per CLAUDE.md AUTO-EXECUTE step 8 (after efficiency-monitor wrap-up)

---

## Anti-patterns

- **Never** skip the Step 2 yes/no gate. The whole skill exists to honor that single user choice.
- **Never** ship a skill with score < 85. The threshold is the contract — bump score, not the threshold.
- **Never** run only one ralph pass. The "two ralph passes" promise is the spec — Pass 2 (agentic) always runs even when Pass 1 already scored ≥85.
- **Never** invent trigger phrases. Mine them from PROMPT_LOG.md — Step 1's `michael-phrasings`.
- **Never** let Pass 2's agent skip the rubric. The agent prompt must include the perspectives + rubric files by absolute path.
- **Never** forge a duplicate. If `skills/_index.md` triggers cover ≥2 of the proposed phrasings, redirect to extending the existing skill.
- **Never** commit a draft that fails Step 7.5. Fix in place, do not paper over.
- **Never** push to `main` without explicit permission — auto-create a `claude/session-forge-...` branch.
- **Never** narrate Pass 1 perspective-by-perspective to Michael mid-pass. Surface only the final per-pass totals at Step 5/6 boundaries.
- **Never** silently overwrite an existing skill directory. Name collision → pick a different verb.
