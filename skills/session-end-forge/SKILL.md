---
name: session-end-forge
description: >
  At AccentOS session end, ask Michael one yes/no question — "Do you want to
  make this process of the session into a reusable skill? reply yes or no" —
  and if yes, distill the session's recurring process (PROMPT_LOG, git diff,
  commits, efficiency-monitor scratch) into a draft SKILL.md, then run agentic
  ralph-loop optimization passes from five named perspectives (Reliability
  Auditor, Trigger Hunter, Stack Native, Maintenance Skeptic, Anti-pattern
  Cop) scoring 0–100 against `references/scoring-rubric.md`. Pass 1 is
  Claude walking each perspective in-context; Pass 2 spawns an independent
  Agent subagent for outside-eyes review. After each round once score ≥85,
  ask "another round of optimization? yes/no" — yes runs another pass
  (cap 4 passes total, alternating Claude / Agent), no proceeds to ship.
  Before commit, ask whether the skill should ship a cross-repo clean-room
  variant; if yes, write a portable SKILL.md at `skills/[name]/portable/`
  per `references/clean-room-rewrite.md` (concept-level rewrite, zero
  AccentOS leakage). Then surface a session optimization review of every
  skill invoked or bypassed this session and recommend edits. Distinct
  from skill-forge (external-source ingestion) and efficiency-monitor
  (signal collection only). Use this skill when Michael says: "wrap up",
  "we're done", "end session", "/session-end-forge", "forge this session",
  "make this a skill", or when the session-end commit is being prepared.
  Do not use for mid-session ad-hoc skill creation (use skill-forge with an
  external target) or when no recurring process emerged this session.
  Always asks the forge-yes/no, the another-round, and the portability
  questions; always scores against the rubric; always either ships a skill
  ≥85/100 (with optional portable variant) or aborts to WATCH with a
  one-line reason — never ships an unscored skill, never proceeds past
  "no" without stopping, never skips the optimization review.
---

# session-end-forge

**Purpose:** Capture the session's actual recurring work as a reusable AccentOS skill at the moment it's freshest, with multi-perspective stress-testing baked in so the output is shippable, with optional cross-repo portability and a session optimization review surfacing everywhere else the workflow could improve.

Phases in order: **trigger → ask-forge → distill → forge-draft → pass-1 → pass-2 → score-gate-with-another-round-loop → portability-gate → optimization-review → validate → commit**. The forge yes/no gate (Step 2), the two ralph passes (Steps 5 + 6), the another-round gate at ≥85 (Step 7), the portability gate (Step 8), and the optimization review (Step 9) are all non-negotiable. Pairs with `efficiency-monitor` (which feeds candidate signals) and `skill-forge` (which handles external-source forging). Reuses `skill-forge`'s Step 7.5 pre-commit validation verbatim — same gates, same gotcha-log discipline.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "wrap up" / "we're done" / "end session"
- "/session-end-forge" / "forge this session" / "make this a skill"
- "turn this into a skill"
- "save this as a skill"
- Or auto-invoked from CLAUDE.md AUTO-EXECUTE step 9 after `efficiency-monitor`'s Step 2 wrap-up completes.

**Disambiguation vs. skill-forge:** session-end-forge sources from this session's actual work (PROMPT_LOG, git diff, scratch). skill-forge sources from an external tool/repo Michael named. If Michael names an external target, route to skill-forge, not here.

---

## Scope

**In scope:**
- The current session's recurring multi-step process, distilled into one named skill
- Patterns surfaced by `efficiency-monitor` at PROMOTE status this session
- Single-skill output per invocation (multi-skill batches → run skill-forge)
- Optional clean-room portable variant for cross-repo use
- Mandatory optimization review of every skill invoked or bypassed this session

**Out of scope — fail fast with a one-line redirect:**
- No recurring process this session → "Nothing to forge — session was one-off work. Skipping."
- Session pattern matches an existing skill in `skills/_index.md` → "This is `[matched-skill]`. Run that next time instead of forging a duplicate."
- Externally-sourced concept named → "Use skill-forge with target=[name] — that's the external-research path."

---

## Step 0 — Preflight

Run in parallel before asking the question:

1. **Read `skills/skill-forge/gotcha-log.md`** — apply every prevention rule. session-end-forge inherits the same gotcha discipline. If the file does not exist yet, treat as empty.
2. **Capture branch state** — `git -C /home/user/accent-os branch --show-current`. If on `main`, Step 11 will auto-create `claude/session-forge-[skill-name]-[8-char-rand]` before committing.
3. **Read `skills/efficiency-monitor/session-end-summary.md`** — pull any PROMOTE-status candidate. If present, that's the strongest forge target. If missing, skip silently.
4. **Read `skills/efficiency-monitor/_session-scratch.md`** if it exists — recurring-sequence flags, retry-loops, redundant-reads, skill-bypass entries from this session. Used by Step 1 (signature) and Step 9 (optimization review).
5. **Read tail of `PROMPT_LOG.md`** (last ~30 entries) — capture Michael's actual phrasing for trigger candidates.
6. **Read `git log --oneline -20`** on the current branch — what shipped this session.
7. **Read `skills/_index.md`** — for the dedupe check in Step 3 and the skill-invocation cross-reference in Step 9.

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
  cross-repo-applicability: [stack-bound | mostly-generic | fully-generic]
```

`cross-repo-applicability` is a first-pass guess used by Step 8 — final decision still asks Michael. Heuristic: if the recurring-process touches Supabase tables, BigCommerce, GMC, or vendor scoring, mark `stack-bound`. If it's mostly file/git operations or generic doc patterns, mark `mostly-generic` or `fully-generic`.

If `closest-existing-skill` is not `none` and trigger overlap is high, abort to "this matches `[skill]`" redirect (Step 0 out-of-scope rule). Otherwise proceed to Step 2.

If signature occurrences < 2, abort: "Single-occurrence work — not a skill candidate. Skipping forge."

---

## Step 2 — Ask the forge question (the first gate)

Use the `AskUserQuestion` tool with this exact configuration:

- **question:** `Do you want to make this process of the session into a reusable skill? reply yes or no`
- **header:** `Forge skill?`
- **options:**
  1. label: `Yes, forge it` — description: `Draft skill, run multi-perspective ralph passes, ask another-round + portability gates, ship if score ≥85/100`
  2. label: `No, wrap up` — description: `Skip forging. Session ends as planned.`
- **multiSelect:** false

**Halt the run.** Do not write any skill files until the answer comes back.

Branch on the answer:
- **No** → Output one line: `Skipping forge. Session ending.` Append a `forge-log.md` entry with `outcome: declined`. Stop. (Step 9 optimization review still runs — it's mandatory regardless of forge outcome.)
- **Yes** → Proceed to Step 3.

If the answer is anything other than yes/no (free-text via "Other"), parse intent. If ambiguous, ask one targeted clarifying question — do not guess.

---

## Step 3 — Name + dedupe + draft scaffold

For "yes":

1. **Propose skill name** — kebab-case, action-oriented, ≤3 words, ≤25 chars. Derive from Step 1 signature's recurring-process phrasing. Verify uniqueness: `ls /home/user/accent-os/skills/` must not contain a directory of the same name. If collision, suffix `-v2` is forbidden — pick a different angle on the verb.
2. **Final dedupe check** — re-scan `skills/_index.md` triggers. If any existing skill's triggers cover ≥2 of the proposed skill's Michael-phrasings, abort with "Duplicates `[skill]` — extending that one is the right move. Skipping new forge."
3. **Surface the proposed name** to Michael in one line: `Forging: [name] — [one-sentence purpose]. Two ralph passes start now.` No approval gate here — Michael already said yes in Step 2. The score gate (Step 7) is the second gate, the another-round gate (Step 7) is the third, the portability gate (Step 8) is the fourth.

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

Frontmatter requirements (validated in Step 10):
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

Proceed to Step 6 regardless of Pass 1 score. Pass 2 always runs — that's the "two ralph passes" promise.

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

## Step 7 — Score gate + "another round?" loop

After Pass 2 fixes are applied, **re-score** the now-fixed SKILL.md across the 5 perspectives. This re-score does not run a fresh ralph pass — just rescore against the rubric.

Branch on the score (and pass-count `K` so far, where K=2 right after Pass 2):

| Score | K | Action |
|-------|---|--------|
| ≥ 85 | < 4 | **Ask Michael via `AskUserQuestion`**: `Score is NN/100. Do you want another round of optimization? reply yes or no`. Yes → run another pass (Step 7a, alternates Claude/Agent), then return to top of Step 7. No → proceed to Step 8 (portability). |
| ≥ 85 | = 4 | Hard cap reached. Proceed to Step 8. Surface `Score NN/100 at 4-pass cap — shipping.` |
| 70–84 | < 4 | **Auto-run** another pass (no question — threshold enforces). Return to top of Step 7. |
| 70–84 | = 4 | Hard cap. If ≥ 80, ship with warning `Score NN/100 below ≥85 target after 4 passes — shipping below ideal.` If < 80, abort to WATCH. |
| < 70 | < 4 | Auto-run another pass. |
| < 70 | = 4 | Abort to WATCH. Append `forge-log.md` entry with `outcome: aborted_low_score`. Do not commit. Surface: `Score plateaued at NN/100 after 4 passes. Skill not ready — see forge-log for findings. Skipping commit.` |

### Step 7a — Run another pass

Each additional pass alternates between Claude in-context (same shape as Step 5) and Agent subagent (same shape as Step 6):
- Pass 3 = Claude in-context (5 perspectives, walk + fix)
- Pass 4 = Agent subagent (general-purpose, independent review)

Cap is **4 passes total**. Log every pass in `forge-log.md` with the same per-pass schema.

The "another round?" question is asked AFTER each pass that lands at ≥85, until either Michael says no or the 4-pass cap hits. This gives Michael control over polish-vs-ship trade-off above the threshold while the system still enforces the threshold below it.

Track `rounds-requested` (count of times Michael said yes to "another round?") for the final forge-log entry.

---

## Step 8 — Cross-repo portability gate + clean-room rewrite

Once Step 7 exits (Michael said no to another round, or cap reached, or auto-shipped at ≥85):

1. **Compute portability signal** — pull the latest pass's Stack Native score:
   - ≤ 14/20 → `mostly-generic` or `fully-generic` (portability is plausible — recommend yes)
   - 15–18/20 → `partly-bound` (could go either way)
   - 19–20/20 → `stack-bound` (recommend no — clean-room would gut it)

2. **Ask Michael via `AskUserQuestion`**:
   - **question:** `Should this skill ship a cross-repo clean-room variant (portable across multiple repos)? reply yes or no`
   - **header:** `Portable variant?`
   - **options:** (Recommended option listed first based on portability signal.)
     - **If `mostly-generic` or `fully-generic`:**
       1. label: `Yes, generate portable (Recommended)` — desc: `Concept-level rewrite to skills/[name]/portable/SKILL.md, zero AccentOS leakage`
       2. label: `No, AccentOS-only` — desc: `Skip portable variant`
     - **If `stack-bound`:**
       1. label: `No, AccentOS-only (Recommended)` — desc: `Skip portable variant — too stack-bound to genericize cleanly`
       2. label: `Yes, generate portable anyway` — desc: `Force clean-room rewrite — may strip too much AccentOS context`
     - **If `partly-bound`:** show neither as recommended; let Michael decide.

3. **Branch:**
   - **No** → record `portable-variant: no` in forge-log. Skip to Step 9.
   - **Yes** → run Step 8a (clean-room rewrite). Record `portable-variant: yes` and the path.

### Step 8a — Clean-room rewrite

Read `references/clean-room-rewrite.md`. Generate two files:

- `skills/[skill-name]/portable/SKILL.md`
- `skills/[skill-name]/portable/README.md` (env vars + portability notes)

**Rules (full detail in `references/clean-room-rewrite.md`):**
- **Concept-level rewrite, NOT sed substitution.** Read the AccentOS SKILL.md, understand each step, rewrite the step using portable placeholders.
- Replace identifiers per the substitution map (`hsyjcrrazrzqngwkqsqa` → `${DB_PROJECT_ID}`, `store-cwqiwcjxes` → `${STORE_ID}`, paths → `${PROJECT_ROOT}`, etc.).
- Replace concrete examples with stack-agnostic equivalents (vendor scoring → "your domain's primary scoring table").
- Keep workflow steps identical in shape and order — only the bound identifiers change.
- Keep all 3+ anti-patterns; rewrite to remove AccentOS specifics but preserve the failure modes.
- Add a `## Required env vars` block at the top listing every placeholder the portable skill expects.
- Add a `## Portability notes` section explaining what was parameterized and why.

**Validation gate (auto-run after write):**
- `grep -iE 'hsyjcrrazrzqngwkqsqa|store-cwqiwcjxes|accent-os|accent lighting|vendor_scores|vendor_overrides|/home/user/accent-os|/workspaces/accent-os' skills/[name]/portable/SKILL.md` must return **0 matches outside fenced code blocks**. Inside fenced blocks, allow them only if framed as "what to replace" examples.
- YAML frontmatter still parses, description ≥ 250 chars (genericized), ≥ 3 anti-patterns.

If validation fails: fix in place via Edit. Do not commit until clean.

---

## Step 9 — Session process & skill-usage optimization review

Mandatory step — runs whether the forge shipped or was declined. The review surfaces opportunities the forge itself didn't consume.

1. **Read** `skills/efficiency-monitor/_session-scratch.md` (if present) and `skills/efficiency-monitor/efficiency-log.md` last entry. Pull all `retry-loop`, `redundant-read`, `recurring-sequence`, `skill-bypass`, `clarification-loop`, `redone-wip` flags.

2. **Cross-reference** with `skills/_index.md`:
   - Skills explicitly invoked this session (mention in PROMPT_LOG, scratch, or commit messages) → list with friction count
   - Skills bypassed: efficiency-monitor's `skill-bypass` flags, plus any task whose triggers match an `_index.md` entry that wasn't invoked

3. **Identify process improvements:**
   - Recurring sequences not yet skill-promoted (still at OBSERVED status in `skill-candidates.md`)
   - Multiple retry-loops on the same operation → suggest skill or anti-pattern
   - Redundant reads of the same file → suggest caching or reading once at boot
   - Skills whose Step N triggered retries → suggest Edit to that skill

4. **Generate the review block:**

```
═══ SESSION OPTIMIZATION REVIEW ═══

Skills invoked this session ([N] total):
  - [skill-1] — N invocations | friction: [none | retries M×]
  - [skill-2] — ...

Skills bypassed (could have been used):
  - [skill-X] — task: [description] | matched by trigger: "[phrase]"
  - [skill-Y] — ...
  (none if clean)

Process improvements:
  - [pattern] could become a 1-call skill (occurrences: N, est. saving: M min/occ)
  - skills/[skill-Y] Step N has redundant read of [file] — propose Edit
  - retry-loop on [operation] hit 3× — root cause: [cause] | suggest: [fix]

Action recommendations (paste-ready):
  - Run `skill-forge` for: [pattern]
  - Edit skills/[skill-Y]/SKILL.md Step N to [specific change]
  - Promote [pattern] from CANDIDATE to PROMOTE in skill-candidates.md
═══════════════════════════════════
```

5. **Save** the block:
   - Inline in the final report (Step 11)
   - One-line summary in the forge-log entry (`optimization-review-summary` field)

If the review surfaces zero opportunities, output: `Session optimization review: clean — no actions recommended.` Don't pad with filler — empty reviews are valid.

---

## Step 10 — Pre-commit validation

Run skill-forge's exact Step 7.5 checklist on the AccentOS SKILL.md (no divergence — keep the gates identical). If a portable variant was generated in Step 8a, run the modified checklist on `portable/SKILL.md`.

**For the AccentOS SKILL.md:**

1. **YAML frontmatter parses** — name + description present, multi-line `>`, ≥250 chars, contains "AccentOS" or "Accent Lighting", no unfilled `[bracketed]` placeholders **outside fenced code blocks**.
2. **Name uniqueness** — directory does not collide with an existing skill.
3. **Substitution count** — ≥3 substantive AccentOS-stack references from the allowlist (AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, vendor_scores, vendor_overrides, GMC, Google Merchant Center, Feedenomics, Klaviyo, BigCommerce, Supabase, Cloudflare Pages, Anthropic API, /home/user/accent-os, /workspaces/accent-os).
4. **Anti-pattern section** — present, ≥3 entries.
5. **No prose walls** — every section is a list, table, or ≤4-sentence block.

**For the portable SKILL.md (if generated):**

1. YAML frontmatter parses, description ≥ 250 chars, no unfilled `[bracketed]` placeholders outside fenced blocks.
2. Anti-pattern section present, ≥3 entries.
3. No prose walls.
4. **Zero AccentOS leakage** — grep check from Step 8a passes.
5. `Required env vars` block present and lists every placeholder used.

Any failure → fix in place via Edit, do not commit. Log the failure as a gotcha entry in `skill-forge/gotcha-log.md` (session-end-forge shares that log to keep gotcha discipline unified).

---

## Step 11 — Register, commit, report

After validation passes:

1. **Register in `skills/_index.md`** — append a new entry following the existing schema (name, summary, triggers, when_to_use, when_NOT, companion). If a portable variant exists, mention it in `summary` and add `portable-variant` line.
2. **Confirm branch** — if on `main`, create `claude/session-forge-[skill-name]-[8-char-rand]`. Otherwise commit on the current branch.
3. **Stage:**
   - `git add skills/[skill-name]/` (includes `portable/` subdirectory if generated)
   - `git add skills/_index.md skills/session-end-forge/forge-log.md`
4. **Commit** — message: `feat: forge [skill-name] from session signature — score NN/100 in K passes[ + portable variant]`. The `+ portable variant` suffix appears only if Step 8a ran.
5. **Push** — `git push -u origin [branch-name]` (retry up to 4× with exponential backoff on network failure per Operating Rules).
6. **Output** the report block:

```
═══ SKILL FORGED FROM SESSION ═══

Name: [skill-name]
Source: this session ([N] occurrences of recurring process)
Score: NN/100 (threshold 85)
Passes: K (Pass 1 = NN, Pass 2 = NN[, Pass 3 = NN[, Pass 4 = NN]])
Rounds requested: N (Michael said yes to another-round N times)
Fixes applied: [count across all passes]

Files written:
  skills/[skill-name]/SKILL.md
  skills/[skill-name]/portable/SKILL.md   (if portable variant)
  skills/[skill-name]/portable/README.md  (if portable variant)
  skills/_index.md (registered)

Trigger phrases (mined from PROMPT_LOG):
  - "[phrase 1]"
  - "[phrase 2]"
  - "[phrase 3]"

Portable variant: [yes — skills/[name]/portable/ | no]

Branch: [branch] | Commit: [SHA short] | Pushed: yes

[Step 9 review block inlined here]

Next-session boot will surface this skill via vibe-speak Step 23.
═══════════════════════════════════
```

---

## Step 12 — Update forge-log

Append a final entry to `skills/session-end-forge/forge-log.md`:

```
### forge-NNN — YYYY-MM-DD HH:MM — [skill-name] — FINAL
- session-signature: [one line]
- occurrences-this-session: N
- pass-1-score: NN/100
- pass-2-score: NN/100
- pass-3-score: NN/100   (only if Pass 3 ran)
- pass-4-score: NN/100   (only if Pass 4 ran)
- final-score: NN/100
- passes-run: K
- rounds-requested: N
- portable-variant: yes | no | n/a
- portable-path: skills/[skill-name]/portable/SKILL.md   (only if yes)
- optimization-review-summary: [one-line, full block in report]
- outcome: shipped | shipped_with_warning | aborted_low_score | declined
- skill-path: skills/[skill-name]/
- commit: [SHA short]   (only if shipped)
```

NNN sequential. This log is read at the next session's boot to track forge effectiveness over time.

If the run aborted (low score, signature-too-thin, or declined), still log the entry with the abort outcome — that data is what tunes the threshold. Even a `declined` run logs the optimization review summary, since Step 9 always runs.

---

## Output format (full successful run, condensed)

```
[Step 0] Preflight: branch=claude/... | source=efficiency-monitor PROMOTE | rules applied
[Step 1] Signature: recurring-process="..." | occurrences=4 | closest-existing-skill=none | cross-repo=mostly-generic
[Step 2] AskUserQuestion → Yes
[Step 3] Forging: [name] — [purpose]. Two ralph passes start now.
[Step 4] Draft written: skills/[name]/SKILL.md (3,210 tokens).
[Step 5] Pass 1: 16+15+14+17+18 = 80/100. Fixes applied: 7.
[Step 6] Pass 2 (agent): 18+19+18+19+19 = 93/100. Fixes applied: 3.
[Step 7] Score 93/100 ≥ 85 → AskUserQuestion "another round?" → No.
[Step 8] Portability signal: mostly-generic. AskUserQuestion → Yes. Step 8a clean-room rewrite → skills/[name]/portable/SKILL.md (zero AccentOS leakage, validation pass).
[Step 9] Optimization review: 2 skills invoked, 1 bypass flagged, 1 process improvement. Block surfaced.
[Step 10] Validation: AccentOS pass, portable pass.
[Step 11] Registered, committed, pushed. SHA: a1b2c3d.
[Step 12] forge-log appended.
```

Output for a "no" forge run (declined):

```
[Step 0] Preflight: ...
[Step 1] Signature: ...
[Step 2] AskUserQuestion → No.
[Step 9] Optimization review: [block] (still runs — mandatory).
[Step 12] forge-log appended (outcome: declined).
Skipping forge. Session ending.
```

---

## AccentOS context

- Stack: Supabase hsyjcrrazrzqngwkqsqa + BigCommerce store-cwqiwcjxes + Cloudflare Pages + Anthropic API (Opus/Sonnet/Haiku 4.x)
- Project: AccentOS for Accent Lighting
- Paths: `/home/user/accent-os/` (Codespace: `/workspaces/accent-os/`)
- Pairs with: `efficiency-monitor` (signal source for Step 1 + Step 9), `skill-forge` (external-source sibling, shares gotcha-log), `skill-eval-suite` (post-forge regression tests)
- Reference files: `references/perspectives.md`, `references/scoring-rubric.md`, `references/clean-room-rewrite.md`
- Auto-active per CLAUDE.md AUTO-EXECUTE step 9 (after efficiency-monitor wrap-up)

---

## Anti-patterns

- **Never** skip the Step 2 yes/no gate. The whole skill exists to honor that single user choice.
- **Never** ship a skill with score < 70. The threshold is the contract — bump score, not the threshold. (Below ≥85 ships only when 4-pass cap hits AND score is 80+.)
- **Never** run only one ralph pass. The "two ralph passes" promise is the spec — Pass 2 (agentic) always runs even when Pass 1 already scored ≥85.
- **Never** invent trigger phrases. Mine them from PROMPT_LOG.md — Step 1's `michael-phrasings`.
- **Never** let Pass 2's agent skip the rubric. The agent prompt must include the perspectives + rubric files by absolute path.
- **Never** forge a duplicate. If `skills/_index.md` triggers cover ≥2 of the proposed phrasings, redirect to extending the existing skill.
- **Never** commit a draft that fails Step 10. Fix in place, do not paper over.
- **Never** push to `main` without explicit permission — auto-create a `claude/session-forge-...` branch.
- **Never** narrate Pass 1 perspective-by-perspective to Michael mid-pass. Surface only the final per-pass totals at Step 5/6 boundaries.
- **Never** silently overwrite an existing skill directory. Name collision → pick a different verb.
- **Never** skip the Step 7 another-round gate when score ≥ 85 and passes < 4. Above-threshold polish is Michael's call, not the system's.
- **Never** auto-loop the another-round gate without re-asking after each pass. Each "yes" is one-shot — re-ask after each new pass lands.
- **Never** sed-substitute the AccentOS SKILL.md to make the portable variant. Concept-level rewrite is the contract; sed leaks subtle context (vendor_scores in code blocks, AccentOS in anti-pattern phrasing). Read and rewrite.
- **Never** ship a portable variant that fails the zero-AccentOS-leakage grep. The variant exists specifically to be portable — leakage defeats the purpose.
- **Never** skip the Step 9 optimization review — it runs even on declined forges. Skipping it loses the highest-value cross-skill signal of the session.
- **Never** auto-apply the optimization review's recommendations. Surface them; let Michael act in next session.
