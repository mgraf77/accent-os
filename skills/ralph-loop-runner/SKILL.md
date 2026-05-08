---
name: ralph-loop-runner
description: >
  AccentOS skill that runs the canonical 3-pass Ralph loop on any target SKILL.md
  to harden it post-forge or post-edit. Pass 1 is trigger-phrase + Michael-voice
  match (mines `/home/user/accent-os/PROMPT_LOG.md` via the phrase-miner skill).
  Pass 2 is failure-mode hardening (3 plausible scenarios + partial-output sub-block
  + anti-pattern adds). Pass 3 is pre-commit validation + ambiguity scrub against
  the skill-forge contract. Codifies the discipline that previously lived inline
  in `skills/gap-optimizer/references/optimizer-briefing.md` so it is callable
  on its own — not only after a forge. Use this skill when Michael says: "ralph
  this skill", "run ralph on [name]", "/ralph [name]", "ralph-loop [skill]",
  "polish [skill]", "stress-test [skill]", "do more ralph passes on [X]", "harden
  [skill]", or any phrasing that asks for a stress-test refinement of an existing
  skill in `/home/user/accent-os/skills/`. Stopping rule is hard: 3 passes done
  OR 2 consecutive passes find nothing new — never iterate to pass 4. Companion
  to skill-forge (post-forge consumer), phrase-miner (Pass 1 input), skill-eval-suite
  (Pass 3 cross-check), skill-health-monitor (composes — health audits structure /
  ralph audits content quality). Always edits the target SKILL.md in place and
  returns a per-pass diff summary — never deletes sections, never adds new
  sections beyond what the original forged.
---

# ralph-loop-runner

**Purpose:** Take any forged or edited SKILL.md and run the 3-pass Ralph stress-test in one named call, instead of re-improvising the discipline every time. Three passes, then stop.

**Hard rule:** stopping rule is `3 passes done OR 2 consecutive passes find nothing new`. Never iterate to pass 4 — Ralph is for finding actual issues, not gold-plating.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "ralph this skill"
- "run ralph on [name]" / "/ralph [name]"
- "ralph-loop [name]"
- "polish [skill]"
- "stress-test [skill]"
- "do more ralph passes on [name]" (his actual phrasing — see `PROMPT_LOG.md` 2026-05-04 entry)
- "harden [skill]"
- "tighten [skill]"

Default invocation (no name given): target = the most recently committed SKILL.md under `/home/user/accent-os/skills/`. Auto-detect via `git -C /home/user/accent-os log --diff-filter=A --name-only -1 -- 'skills/*/SKILL.md'` or, if that returns nothing, the most recent `M`-status SKILL.md.

---

## Step 0 — Preflight

Do these in parallel:

1. **Resolve the target SKILL.md.** If Michael named a skill, use `/home/user/accent-os/skills/[name]/SKILL.md`. If not, run the auto-detect command above. If the file does not exist, abort with `target SKILL.md not found at [path] — name a skill or commit one first`.
2. **Read the target.** Capture current sections, line count, and current `## Trigger Recognition` phrases verbatim. This is the Pass-0 baseline used to compute per-pass diff summaries.
3. **Companion-link audit.** Grep the target for "Pairs with", "Companion", "see `skills/", "consumer of", "consumes". For each cited skill, check the directory exists in `/home/user/accent-os/skills/`. Note any broken refs — Pass 3 will fix them.
4. **Mine PROMPT_LOG via phrase-miner (preferred).** If `/home/user/accent-os/skills/phrase-miner/SKILL.md` exists, invoke phrase-miner in `mine` mode with the target skill's name. If phrase-miner is unavailable, fall back to direct grep of `/home/user/accent-os/PROMPT_LOG.md` (last 50 entries) + `/home/user/accent-os/SESSION_LOG.md` (last 30 entries) for phrasings related to the skill's domain. Cache the candidate-phrase list for Pass 1.
5. **Read `/home/user/accent-os/skills/vibe-speak/profiles/michael.md`** — the register-mirror block. Pass 1 measures every existing trigger phrase against this register.
6. **Read the contract** — `/home/user/accent-os/skills/skill-forge/references/skill-template.md` + `skill-forge/SKILL.md` Step 7.5. Pass 3 validates against this exact checklist.
7. **Capture the gotcha-log baseline** — `/home/user/accent-os/skills/skill-forge/gotcha-log.md` (if present). Any prevention rules already logged for the target's class get applied in Pass 2.

If the target SKILL.md is empty (`<50 lines`), abort: `target too thin to ralph — needs forge first`. Ralph refines a forged skill; it does not forge from scratch.

Output of Step 0 (1 line): `target=skills/[name]/SKILL.md | lines=N | triggers=K | broken-refs=B | mined-phrases=P`.

---

## Step 1 — Pass 1: trigger-phrase + Michael-voice match

Goal: every trigger phrase reads like something Michael would actually say in `PROMPT_LOG.md`, not a hypothetical user.

1. **For each existing trigger phrase**, ask three questions:
   - Would Michael ACTUALLY say this? (vs. a hypothetical user)
   - Is it unique enough that it doesn't collide with another skill's triggers? (Cross-check `skills/_index.md`.)
   - Does it match Michael's terse, lowercase, often-typo'd register per `vibe-speak/profiles/michael.md`?
2. **For each phrase that fails any check:** edit it in place to match Michael's real phrasing OR replace with a mined phrase from Step 0's candidate list.
3. **Add 1–3 NEW trigger phrases** if the mined candidate list surfaced high-frequency phrasings the skill should catch but currently doesn't. Cap total triggers at 8 — if the list is longer, drop the lowest-frequency entries.
4. **Mirror the top-3 strongest triggers into the frontmatter `description` block.** The harness matches against the description heavily — triggers buried only in `## Trigger Recognition` are weak. Use the literal "Use this skill when Michael says: \"X\", \"Y\", \"Z\"" pattern.
5. **Edit SKILL.md in place.** Do not change non-trigger sections in this pass.

**Failure path:** if PROMPT_LOG.md is empty or absent (cold-start Codespace), skip the mining step but still apply the register audit on existing phrases. Note the cold-start in the Pass 1 diff summary.

**Pass 1 diff summary** (one line for Step 4 report): `pass1: K triggers reviewed, E edited, A added, D dropped, F frontmatter mirrored=yes/no`.

---

## Step 2 — Pass 2: failure-mode hardening

Goal: every plausible failure path either has explicit handling or shows up as an anti-pattern.

1. **Re-read the SKILL.md** after Pass 1's edits.
2. **Imagine 3 plausible scenarios** where the skill is invoked. For each, walk Step 0 → final step. List what could go wrong silently:
   - Missing input data (file does not exist, table empty, env var unset)
   - Malformed input (wrong shape, encoding, schema drift)
   - Companion skill not yet forged (broken ref discovered in Step 0.3)
   - Schema field doesn't exist (Supabase `hsyjcrrazrzqngwkqsqa` migration pending)
   - API rate-limited or 4xx (Anthropic API, BigCommerce store-cwqiwcjxes, Klaviyo, GMC)
   - Conflicting concurrent run (two ralph-loop-runner invocations on the same target)
3. **Pick the 3 MOST likely failure modes** for this skill. For each:
   - Add a sentence in the relevant Step describing the failure path (one imperative line, format `Failure path: if [condition], [explicit fallback]`).
   - Add an entry to the `## Anti-patterns` section if the failure is something the skill should never silently swallow.
4. **Step 0 precondition gate.** If Step 0 does not gate against missing prerequisites, add a single precondition check (file existence, env var, companion skill present). Do not invent net-new checks — only add the ones the failure-mode scan surfaced.
5. **Output format partial-success block.** Check the `## Output format` section. If it does not specify what happens on partial-success (e.g. 2-of-3 passes complete, mining returned empty, validation found 1 fix), add a "Partial output" sub-block with the literal shape returned in that case.
6. **Apply all fixes via Edit.** Do not rewrite full sections — surgical edits only.

**Stopping rule check:** if Pass 2 made 0 edits, mark `consecutive-no-op=1`. If Pass 1 also made 0 edits, abort the loop early per the hard rule (stopping rule below).

**Pass 2 diff summary**: `pass2: F failure-modes added, P partial-output added=yes/no, A anti-patterns added, S step-0 gate added=yes/no`.

---

## Step 3 — Pass 3: pre-commit validation + ambiguity scrub

Goal: the SKILL.md passes the skill-forge Step 7.5 contract and no two humans would interpret a step differently.

1. **Re-read after Pass 2.**
2. **Run the validation checklist** (mirror of `skill-forge/SKILL.md` Step 7.5):

   | # | Check | Pass condition |
   |---|-------|----------------|
   | 1 | YAML frontmatter parses | `name` + `description` present, description is multi-line `>` block, ≥250 chars, contains "AccentOS" or "Accent Lighting" |
   | 2 | Name uniqueness | directory matches frontmatter name, no collision with another `skills/*/` dir |
   | 3 | Substitution count | ≥3 substantive AccentOS-stack-specific references (allowlist below) |
   | 4 | Anti-pattern section | present, ≥3 entries |
   | 5 | No prose walls | every section is a list, table, or ≤4-sentence block |
   | 6 | No "Future enhancements" / "TODO" / "Roadmap" sections | none present |
   | 7 | Total ≤5000 tokens | rough word count × 1.3 ≤ 5000 |
   | 8 | Companion-link integrity | every "Pairs with" / "Companion" cite resolves to an existing `skills/[name]/` dir |

   Allowlist for check #3: AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, vendor_scores, vendor_overrides, GMC, Google Merchant Center, Feedenomics, Klaviyo, BigCommerce, Supabase, Cloudflare Pages, Anthropic API, /home/user/accent-os, /workspaces/accent-os.

3. **Ambiguity scrub.** For each `## Step` heading, ask "could two different humans interpret this step differently?" If yes, tighten the imperative — replace "consider X" with "do X", replace bare nouns with `[explicit-input-shape]`, replace "etc." with the literal list.
4. **Cross-skill reference fix.** Every broken companion-link surfaced in Step 0.3 gets fixed: either point to an actually-existing skill, replace with `(skill not yet forged — see gap-optimizer queue)`, or remove if no real companion exists.
5. **Apply fixes via Edit.** Re-run check #1–#8 on the post-edit file. If any check still fails, log the failure and mark final state RETRY-NEEDED.

**Cross-check hook:** if `/home/user/accent-os/skills/skill-eval-suite/` has eval cases for this target, surface a one-line note in the Pass 3 summary recommending `bash skills/skill-eval-suite/scripts/run.sh [name]` — do not invoke automatically (Ralph does not run code, only edits).

**Pass 3 diff summary**: `pass3: V validation fixes applied, A ambiguity scrubs, C companion-link fixes, final-state=PASS|RETRY-NEEDED`.

---

## Step 4 — Stopping rule + report

Apply the stopping rule, then report.

**Stopping rule (hard):**
- 3 passes done → stop.
- 2 consecutive passes find nothing new → stop early.
- Never run pass 4. If pass 3 ends in `RETRY-NEEDED`, surface that — do not auto-iterate.

**Report format** (paste-ready, mirror gap-run-002 Wave-2 returns):

```
[skill-name] — Ralph 3 passes complete
  Pass 1 edits: [N] trigger-phrase changes ([brief one-liner])
  Pass 2 edits: [N] failure-mode hardenings ([brief])
  Pass 3 edits: [N] validation fixes ([brief])
  Final state: PASS (validation green) | RETRY-NEEDED (specify)
  Companion cross-check: skill-eval-suite has eval-cases.yaml=yes/no
  Stopping rule fired: 3-passes-done | 2-consecutive-no-ops
```

If final state is RETRY-NEEDED, append:
```
  RETRY needs: [specific check that still fails — e.g. "substitution count = 2, needs 3+"]
  Recommended fix: [one sentence]
```

---

## Output format

### Default success output

```
[skill-name] — Ralph 3 passes complete
  Pass 1 edits: 4 trigger-phrase changes (mirrored top-3 to frontmatter, dropped 1 collision)
  Pass 2 edits: 3 failure-mode hardenings (added partial-output sub-block, +2 anti-patterns)
  Pass 3 edits: 1 validation fix (added 1 substantive AccentOS reference to reach 3)
  Final state: PASS
  Companion cross-check: skill-eval-suite has eval-cases.yaml=no — recommend generating
  Stopping rule fired: 3-passes-done
```

### Partial output (early-stop on consecutive no-ops)

```
[skill-name] — Ralph stopped early at pass [N]
  Pass 1 edits: [N]
  Pass 2 edits: 0
  Pass 3: skipped (2 consecutive no-ops)
  Final state: PASS
  Stopping rule fired: 2-consecutive-no-ops
```

### Failure output (RETRY-NEEDED)

```
[skill-name] — Ralph 3 passes complete — RETRY-NEEDED
  Pass 1 edits: [N]
  Pass 2 edits: [N]
  Pass 3 edits: [N], 1 check still failing
  Final state: RETRY-NEEDED
  RETRY needs: substitution count = 2, contract requires 3+
  Recommended fix: add a Supabase hsyjcrrazrzqngwkqsqa or BigCommerce store-cwqiwcjxes mention in Step 0
```

---

## AccentOS context

- **Stack:** Anthropic API, Supabase `hsyjcrrazrzqngwkqsqa`, BigCommerce `store-cwqiwcjxes`, Cloudflare Pages
- **Project:** AccentOS (internal OS for Accent Lighting)
- **Paths:** `/home/user/accent-os/skills/` (Codespace alt: `/workspaces/accent-os/skills/`)
- **Target convention:** every Ralph target is a SKILL.md under `/home/user/accent-os/skills/[name]/`
- **Contract source:** `/home/user/accent-os/skills/skill-forge/references/skill-template.md` + `skill-forge/SKILL.md` Step 7.5 — Pass 3 validates against this exact contract
- **Companion skills:**
  - `skill-forge` — post-forge consumer (calls ralph-loop-runner as Step 8 instead of inlining the loop)
  - `phrase-miner` — Pass 1 input source for mined Michael phrasings (mode = `mine`)
  - `skill-eval-suite` — Pass 3 surfaces a one-line recommendation if eval-cases.yaml exists for the target
  - `skill-health-monitor` — composes with this skill: skill-health audits ecosystem structure, ralph-loop-runner audits per-skill content quality
  - `gap-optimizer` — its `references/optimizer-briefing.md` is the source spec this skill formalizes
- **Vibe-speak alignment:** voice register checks against `/home/user/accent-os/skills/vibe-speak/profiles/michael.md` register-mirror block

---

## Anti-patterns

- **Never** run a 4th pass. Stopping rule is hard: 3 passes done OR 2 consecutive no-ops. Iterating "for completeness" is gold-plating.
- **Never** add new sections beyond what the original forge produced. Ralph is refinement, not expansion. Only edit existing sections.
- **Never** delete sections. If a section is broken, fix it in place — don't remove and recreate.
- **Never** invent trigger phrases from imagination. Every new phrase must come from Step 0's mined candidate list (PROMPT_LOG.md / SESSION_LOG.md via phrase-miner) or directly mirror an existing phrase in Michael's register.
- **Never** silently swallow a Pass 3 validation failure. If a check still fails after fixes, return `RETRY-NEEDED` with the specific failing check named — do not return `PASS` with a hidden defect.
- **Never** auto-invoke skill-eval-suite or any code-running tool. Ralph edits SKILL.md only — eval execution is a follow-on the human kicks off.
- **Never** ralph a SKILL.md that has not been forged yet (`<50 lines` or no `## Trigger Recognition` section). Abort with a "needs forge first" message — Ralph refines, it does not create.
- **Never** modify `_index.md` or other skills' files. The target is one specific SKILL.md and only that one.
